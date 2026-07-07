import { supabaseAdmin } from "@/platform/auth/clients";

/**
 * Resolucion central de tenant_id a partir de tenant_code.
 *
 * Antes esta logica estaba duplicada en `src/app/actions.ts:getTenantId` y
 * los magic numbers (UUIDs hardcoded) aparecian en multiples archivos.
 *
 * Esta es la unica fuente de verdad para el mapeo tenant_code -> tenant_id
 * en runtime. Si en el futuro se agregan mas tenants, solo se actualiza aqui.
 *
 * El default en runtime se puede sobreescribir con la variable de entorno
 * NEXT_PUBLIC_DEFAULT_TENANT_CODE. Si no esta definida, se usa "acme".
 */

const TENANT_CODE_TO_ID: Record<string, string> = {
  acme: "a0000000-0000-0000-0000-000000000000",
  apex: "b0000000-0000-0000-0000-000000000000",
};

// Cachés dinámicas en memoria para evitar consultas redundantes a la base de datos
const DYNAMIC_TENANT_CACHE: Record<string, string> = {};
const DYNAMIC_OWNER_CACHE: Record<string, string> = {};

const DEFAULT_TENANT_CODE =
  process.env.NEXT_PUBLIC_DEFAULT_TENANT_CODE || "acme";

const DEFAULT_TENANT_ID =
  TENANT_CODE_TO_ID[DEFAULT_TENANT_CODE] ?? TENANT_CODE_TO_ID.acme;

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
  }

  // Fallback a default
  if (process.env.NODE_ENV !== "test") {
    console.warn(
      `[tenant-resolver] Unknown tenant_code "${tenantCode}", falling back to default "${DEFAULT_TENANT_CODE}"`
    );
  }
  return DEFAULT_TENANT_ID;
}

/**
 * Resuelve el tenant_id a partir del tenant_code de forma síncrona.
 * Nota: Solo usa el mapa en memoria estático. Útil para UI síncrona.
 */
export function resolveTenantId(tenantCode?: string | null): string {
  if (!tenantCode) return DEFAULT_TENANT_ID;
  const id = TENANT_CODE_TO_ID[tenantCode] || DYNAMIC_TENANT_CACHE[tenantCode];
  if (!id) {
    if (process.env.NODE_ENV !== "test") {
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
 * updated_by). En seed estos son:
 *  - ACME: a9000000-0000-0000-0000-000000000000
 *  - APEX: b9000000-0000-0000-0000-000000000000
 *
 * Solo debe usarse como placeholder en acciones administrativas; en
 * escritura real, usar el auth.uid() del usuario que invoca.
 */
const TENANT_OWNER_USER_ID: Record<string, string> = {
  acme: "a9000000-0000-0000-0000-000000000000",
  apex: "b9000000-0000-0000-0000-000000000000",
};

/**
 * Resuelve el owner del tenant de forma asíncrona consultando la tabla de usuarios
 * si no se encuentra en el mapa estático de pre-seed.
 */
export async function resolveTenantOwnerUserIdAsync(tenantId: string): Promise<string> {
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
  }

  return TENANT_OWNER_USER_ID.acme;
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

