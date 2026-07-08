import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * Guard mecánico para src/erp/actions/core.ts (hallazgo #8 del audit de
 * seguridad): ese archivo mezcla funciones públicas (sin auth, usadas por
 * visitantes anónimos vía src/web/actions/*) con funciones privadas del ERP
 * que manejan datos sensibles. La disciplina de llamar a getAuthContext()/
 * requireAction() al inicio de cada función privada era manual — un olvido
 * ya causó una fuga real corregida en el commit 3476e54.
 *
 * Este test NO cambia el comportamiento de core.ts. Escanea el código fuente
 * y falla el build en CI si alguien agrega una función nueva ahí sin el
 * guard de auth y sin agregarla explícitamente a PUBLIC_FUNCTIONS abajo —
 * así el olvido se detecta en el PR, no en producción.
 */
describe("src/erp/actions/core.ts — guard de autenticación por función", () => {
  const filePath = path.join(__dirname, "..", "..", "erp", "actions", "core.ts");
  let source: string;

  beforeAll(() => {
    expect(fs.existsSync(filePath)).toBe(true);
    source = fs.readFileSync(filePath, "utf8");
  });

  // Funciones intencionalmente públicas (sin sesión) — deben seguir así.
  // Agregar aquí SOLO si de verdad no debe requerir autenticación; si es
  // una función privada nueva, no la agregues — agrégale el guard en su
  // lugar (await getAuthContext() o await requireAction(...) al inicio).
  const PUBLIC_FUNCTIONS = new Set(["getTenantId", "getPublicTenantSettings"]);

  function extractExportedFunctions(src: string): { name: string; body: string }[] {
    const results: { name: string; body: string }[] = [];
    const fnStartRegex = /^export (?:async )?function (\w+)\s*\(/gm;
    const matches = [...src.matchAll(fnStartRegex)];

    for (let i = 0; i < matches.length; i++) {
      const start = matches[i].index ?? 0;
      const end = i + 1 < matches.length ? (matches[i + 1].index ?? src.length) : src.length;
      results.push({ name: matches[i][1], body: src.slice(start, end) });
    }
    return results;
  }

  it("encuentra al menos una función exportada (sanity check del parser)", () => {
    const fns = extractExportedFunctions(source);
    expect(fns.length).toBeGreaterThan(5);
  });

  it("toda función privada llama a getAuthContext() o requireAction()", () => {
    const fns = extractExportedFunctions(source);
    const missing = fns.filter((fn) => {
      if (PUBLIC_FUNCTIONS.has(fn.name)) return false;
      return !/\b(getAuthContext|requireAction)\s*\(/.test(fn.body);
    });

    if (missing.length > 0) {
      const names = missing.map((f) => f.name).join(", ");
      throw new Error(
        `Estas funciones exportadas de core.ts no tienen guard de auth (getAuthContext/requireAction) ` +
        `y no están en PUBLIC_FUNCTIONS: ${names}. Si son privadas, agrega el guard. Si son públicas ` +
        `a propósito, agrégalas explícitamente a PUBLIC_FUNCTIONS en este test — con justificación.`
      );
    }
    expect(missing).toEqual([]);
  });

  it("PUBLIC_FUNCTIONS solo contiene funciones que de verdad existen en core.ts", () => {
    const fns = new Set(extractExportedFunctions(source).map((f) => f.name));
    for (const name of PUBLIC_FUNCTIONS) {
      expect(fns.has(name)).toBe(true);
    }
  });
});
