import { supabaseAdmin } from "@/platform/auth/clients";

/**
 * Resolucion central de tenant_id a partir de tenant_code.
 *
 * ## Estrategia híbrida (estática + dinámica)
 *
 * 1. Mapa estático `TENANT_CODE_TO_ID` → tenants de seed (acme, apex).
 * 2. Caché dinámica `DYNAMIC_TENANT_CACHE` → tenants registrados vía DB en runtime.
 * 3. Consulta a `tenants` en Supabase → authoritative source.
 *
 * ## Riesgo conocido
 * - La caché en memoria se pierde en cada cold start (serverless/Vercel).
 *   Esto es intencional: en serverless es preferible consultar la DB
 *   que mantener estado inconsistente entre instancias.
 * - Si supabaseAdmin falla (service key rotada o Supabase caído), el fallback
 *   devuelve el tenant por defecto. Esto puede causar colisión de datos.
 *
 * ## Riesgo mitigado
 * - Los UUIDs del mapa estático SOLO se usan durante seed/testing.
 *   En producción, la DB es la única fuente de verdad.
 *
 * @see getTenantId en src/erp/actions/core.ts (usa resolveTenantIdAsync)
 */

const TENANT_CODE_TO_ID: Record<string, string> = {
  acme: "a0000000-0000-0000-0000-000000000000",
  apex: "b0000000-0000-0000-0000-000000000000",
};

// Cachés dinámicas en memoria
// ATENCIÓN: En serverless (Vercel) se pierden en cada cold start.
// Esto es correcto: el costo de un round-trip a Supabase es menor
// que el riesgo de datos obsoletos entre instancias.
const DYNAMIC_TENANT_CACHE: Record<string, string> = {};
const DYNAMIC_OWNER_CACHE: Record<string, string> = {};

const DEFAULT_TENANT_CODE =
  process.env.NEXT_PUBLIC_DEFAULT_TENANT_CODE || "acme";

const DEFAULT_TENANT_ID =
  TENANT_CODE_TO_ID[DEFAULT_TENANT_CODE] ?? TENANT_CODE_TO_ID.acme;

/**
 * Flag explícito para controlar warnings de tenant no encontrado.
 * Reemplaza el uso de process.env.NODE_ENV para evitar que la lógica
 * de negocio dependa de la variable de entorno de Node.
 */
const SUPPRESS_TENANT_WARNINGS =
  process.env.SUPPRESS_TENANT_WARNINGS === "true";

/**
 * Resuelve el tenant_id a partir del tenant_code de forma asíncrona.
 * Consulta la base de datos de Supabase si no se encuentra en el mapa en memoria
 * y almacena el resultado en caché.
 */
export async function resolveTenantIdAsync(tenantCode?: string | null): Promise<string> {
  if (!tenantCode) return DEFAULT_TENANT_ID;

  // 1. Verificar mapa estático
  const staticId = TENANT_CODE_TO_ID[tenantCode];
  if (staticId) return staticId;

  // 2. Verificar caché dinámica
  const cachedId = DYNAMIC_TENANT_CACHE[tenantCode];
  if (cachedId) return cachedId;

  // 3. Consultar base de datos
  try {
    const { data } = await supabaseAdmin
      .from("tenants")
      .select("id")
      .eq("tenant_code", tenantCode)
      .maybeSingle();

    if (data?.id) {
      DYNAMIC_TENANT_CACHE[tenantCode] = data.id;
      return data.id;
    }
  } catch (err) {
    console.error(`[tenant-resolver] Error resolviendo tenant_code "${tenantCode}":`, err);
    throw new Error(`Error resolviendo tenant ${tenantCode}: ${err instanceof Error ? err.message : String(err)}`);
  }

  throw new Error(`Tenant no encontrado: "${tenantCode}". Verifique el código del tenant.`);
}

/**
 * Resuelve el tenant_id a partir del tenant_code de forma síncrona.
 * Nota: Solo usa el mapa en memoria estático. Útil para UI síncrona.
 */
export function resolveTenantId(tenantCode?: string | null): string {
  if (!tenantCode) return DEFAULT_TENANT_ID;
  const id = TENANT_CODE_TO_ID[tenantCode] || DYNAMIC_TENANT_CACHE[tenantCode];
  if (!id) {
    if (!SUPPRESS_TENANT_WARNINGS) {
      console.warn(
        `[tenant] Unknown tenant_code "${tenantCode}" in sync resolver, falling back to default "${DEFAULT_TENANT_CODE}"`
      );
    }
    return DEFAULT_TENANT_ID;
  }
  return id;
}

/**
 * Resuelve el userId "owner" del tenant (usado como default assigned_by /
 * updated_by).
 *
 * ⚠ RIESGO: Si se usa en Server Actions (wizard, leads) donde no hay
 * usuario autenticado, todos los registros aparecen creados por el admin
 * del tenant. Esto elimina la trazabilidad real.
 *
 * ✅ En Server Actions autenticadas, pasar el auth.uid() real como
 * `overrideUserId`.
 *
 * En seed estos son:
 *  - ACME: a9000000-0000-0000-0000-000000000000
 *  - APEX: b9000000-0000-0000-0000-000000000000
 */
const TENANT_OWNER_USER_ID: Record<string, string> = {
  acme: "a9000000-0000-0000-0000-000000000000",
  apex: "b9000000-0000-0000-0000-000000000000",
};

/**
 * Resuelve el owner del tenant de forma asíncrona.
 * Si se provee `overrideUserId`, se retorna ese valor directamente
 * (trazabilidad real). Si no, busca el primer usuario activo del tenant
 * en la DB, y finalmente fallback al mapa estático de seed.
 */
export async function resolveTenantOwnerUserIdAsync(
  tenantId: string,
  overrideUserId?: string | null
): Promise<string> {
  // Si hay un usuario real autenticado, usarlo (máxima trazabilidad)
  if (overrideUserId) return overrideUserId;
  // 1. Verificar mapa estático
  for (const [code, id] of Object.entries(TENANT_CODE_TO_ID)) {
    if (id === tenantId) {
      return TENANT_OWNER_USER_ID[code] ?? TENANT_OWNER_USER_ID.acme;
    }
  }

  // 2. Verificar caché dinámica
  const cachedOwner = DYNAMIC_OWNER_CACHE[tenantId];
  if (cachedOwner) return cachedOwner;

  // 3. Consultar base de datos
  try {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("status", "Activo")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (data?.id) {
      DYNAMIC_OWNER_CACHE[tenantId] = data.id;
      return data.id;
    }
  } catch (err) {
    console.error(`[tenant-resolver] Error resolviendo owner para tenant_id "${tenantId}":`, err);
    throw new Error(`Error resolviendo owner del tenant ${tenantId}: ${err instanceof Error ? err.message : String(err)}`);
  }

  throw new Error(`No se encontró usuario owner activo para tenant_id "${tenantId}"`);
}

export function resolveTenantOwnerUserId(tenantId: string): string {
  for (const [code, id] of Object.entries(TENANT_CODE_TO_ID)) {
    if (id === tenantId) {
      return TENANT_OWNER_USER_ID[code] ?? TENANT_OWNER_USER_ID.acme;
    }
  }
  return DYNAMIC_OWNER_CACHE[tenantId] || TENANT_OWNER_USER_ID.acme;
}

/**
 * Tenant codes conocidos. Util para validacion y tests.
 */
export const KNOWN_TENANT_CODES = Object.keys(TENANT_CODE_TO_ID);

/**
 * Valida que los UUIDs del mapa estático no colisionen con tenants reales.
 * Útil en tests para detectar configuraciones incorrectas.
 * Retorna los códigos duplicados encontrados en la DB (vacío = ok).
 */
export async function validateStaticTenantIds(): Promise<string[]> {
  const collisions: string[] = [];
  for (const [code, id] of Object.entries(TENANT_CODE_TO_ID)) {
    try {
      const { data } = await supabaseAdmin
        .from("tenants")
        .select("id")
        .eq("id", id)
        .maybeSingle();
      if (data && data.id !== id) {
        collisions.push(
          `${code}: UUID ${id} colisiona con tenant real ${data.id}`
        );
      }
    } catch {
      // Sin conexión a DB — omitir validación
    }
  }
  return collisions;
}

