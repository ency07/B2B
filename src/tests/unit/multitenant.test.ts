import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

/**
 * ADVERTENCIA: esto SOLO verifica que ciertas migraciones .sql contengan
 * ciertos strings. NO abre conexión a una base de datos, NO simula usuarios,
 * NO prueba ninguna policy de RLS en ejecución. Que estos tests pasen NO es
 * evidencia de que el aislamiento multi-tenant funcione — solo de que nadie
 * borró el archivo de migración inicial.
 *
 * La prueba real de comportamiento de RLS (autenticación real + verificación
 * de que un usuario no ve datos de otro tenant) vive en
 * scripts/test-multitenant.ts y se ejecuta MANUALMENTE contra un proyecto
 * Supabase real (staging) antes de cada release que toque RLS o tablas
 * nuevas — no corre en este pipeline de CI por costo/complejidad de levantar
 * una base de datos real en cada PR.
 */
describe("Multi-tenancy / RLS migrations present (static check, no DB)", () => {
  const migrationPaths = [
    "supabase/migrations/20260617000000_init_core.sql",
    "supabase/migrations/20260617000011_website_core.sql",
  ];

  let sqlContents: string[] = [];

  beforeAll(() => {
    sqlContents = migrationPaths.map((p) => {
      const fullPath = path.join(__dirname, "..", "..", "..", p);
      expect(fs.existsSync(fullPath)).toBe(true);
      return fs.readFileSync(fullPath, "utf8");
    });
  });

  it("should have RLS enabled in init migration", () => {
    const hasRLS = sqlContents.some((sql) =>
      sql.includes("ENABLE ROW LEVEL SECURITY")
    );
    expect(hasRLS).toBe(true);
  });

  it("should define tenants table", () => {
    const hasTenants = sqlContents.some((sql) =>
      sql.includes("CREATE TABLE tenants")
    );
    expect(hasTenants).toBe(true);
  });

  it("should define users table", () => {
    const hasUsers = sqlContents.some((sql) =>
      sql.includes("CREATE TABLE users")
    );
    expect(hasUsers).toBe(true);
  });

  it("should have audit triggers", () => {
    const hasTriggers = sqlContents.some((sql) =>
      sql.includes("CREATE TRIGGER")
    );
    expect(hasTriggers).toBe(true);
  });

  it("init core migration should exist", () => {
    const fullPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "supabase/migrations/20260617000000_init_core.sql"
    );
    expect(fs.existsSync(fullPath)).toBe(true);
  });
});
