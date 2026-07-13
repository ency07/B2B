import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Rutas que requieren un permiso granular además de autenticación ERP básica.
// Formato: { pathPrefix: permissionCode }
// Comportamiento por defecto: rutas NO listadas aquí pasan con solo
// verifyErpToken (autenticación). Agregar aquí cualquier ruta que requiera
// un permiso específico (no solo estar autenticado).
const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/dashboard/settings/roles': 'roles.view',
  '/dashboard/settings': 'settings.view',
};

// Cache de permisos en memoria por proceso.
// En serverless/Edge Runtime la vida del proceso varía — este cache es
// best-effort: reduce queries en warm starts pero no garantiza consistencia
// entre instancias. TTL de 5 minutos. La clave es `${authUserId}:${tenantId}`.
const PERMISSION_CACHE = new Map<string, { permissions: Set<string>; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

function getCachedPermissions(cacheKey: string): Set<string> | null {
  const entry = PERMISSION_CACHE.get(cacheKey);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    PERMISSION_CACHE.delete(cacheKey);
    return null;
  }
  return entry.permissions;
}

function setCachedPermissions(cacheKey: string, permissions: Set<string>): void {
  // Evitar crecimiento ilimitado: limpiar entradas expiradas si el cache supera 500 entradas
  if (PERMISSION_CACHE.size > 500) {
    const now = Date.now();
    for (const [key, entry] of PERMISSION_CACHE) {
      if (now > entry.expiresAt) PERMISSION_CACHE.delete(key);
    }
  }
  PERMISSION_CACHE.set(cacheKey, { permissions, expiresAt: Date.now() + CACHE_TTL_MS });
}

/** Invalida el cache de permisos de un usuario. Llamar tras cambios de roles. */
export function invalidatePermissionCache(authUserId: string, tenantId: string): void {
  PERMISSION_CACHE.delete(`${authUserId}:${tenantId}`);
}

/**
 * Verifica un token de acceso JWT crudo en el Edge Runtime.
 * Retorna true si el usuario es válido, false en caso contrario.
 */
export async function verifyAccessToken(accessToken: string | undefined): Promise<boolean> {
  if (!accessToken) return false;

  try {
    const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    });

    // getUser() verifica que el JWT es válido y no está revocado
    const { data: { user } } = await supabaseServer.auth.getUser(accessToken);
    return !!user;
  } catch {
    return false;
  }
}

/**
 * Verifica que el token ERP sea válido Y que el usuario tenga un rol de ERP
 * (cualquier rol excepto CLIENTE, que pertenece al Portal).
 *
 * Realiza dos llamadas a Supabase en secuencia:
 *   1. getUser() — valida la firma y expiración del JWT.
 *   2. users + user_roles — verifica rol activo en la base de datos.
 *
 * Fail-closed: cualquier error devuelve false (denegar acceso).
 */
export async function verifyErpToken(accessToken: string | undefined): Promise<boolean> {
  if (!accessToken) return false;

  try {
    // 1. Verificar JWT
    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser(accessToken);
    if (authError || !user) return false;

    // 2. Verificar rol vía service key (bypass RLS) para garantizar consistencia
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userRow, error: userError } = await adminClient
      .from('users')
      .select('id, user_roles!user_roles_user_id_fkey(roles(role_code))')
      .eq('auth_user_id', user.id)
      .eq('status', 'Activo')
      .limit(1)
      .maybeSingle();

    if (userError || !userRow) return false;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userRoles = userRow.user_roles as any[];
    if (!userRoles || userRoles.length === 0) return false;

    const roleCode: string | undefined = userRoles[0]?.roles?.role_code;

    // CLIENTE no tiene acceso al ERP — pertenece al Portal
    if (!roleCode || roleCode === 'CLIENTE') return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica si un usuario (identificado por auth_user_id) tiene un permiso granular
 * en el tenant dado. Usa la función SQL `check_user_permission` con SECURITY DEFINER
 * para evitar recursión de RLS.
 *
 * Fail-closed: retorna false ante cualquier error.
 */
export async function hasPermission(
  authUserId: string,
  tenantId: string,
  permissionCode: string
): Promise<boolean> {
  const cacheKey = `${authUserId}:${tenantId}`;

  // Intentar resolver desde cache
  const cached = getCachedPermissions(cacheKey);
  if (cached) return cached.has(permissionCode);

  try {
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Resolver el users.id desde el auth_user_id
    const { data: userRow, error: userError } = await adminClient
      .from('users')
      .select('id')
      .eq('auth_user_id', authUserId)
      .eq('status', 'Activo')
      .maybeSingle();

    if (userError || !userRow) return false;

    // Cargar TODOS los permisos del usuario de una sola vez para poblar el cache
    const { data: perms, error: permsError } = await adminClient.rpc(
      'get_user_permissions',
      { p_user_id: userRow.id, p_tenant_id: tenantId }
    );

    if (permsError) return false;

    const permSet = new Set<string>(
      (perms ?? []).map((p: { permission_code: string }) => p.permission_code)
    );
    setCachedPermissions(cacheKey, permSet);

    return permSet.has(permissionCode);
  } catch {
    return false;
  }
}

/**
 * Determina qué permiso granular (si alguno) requiere una ruta.
 * Retorna null si la ruta no tiene un permiso adicional requerido.
 */
export function getRequiredPermissionForPath(pathname: string): string | null {
  // Ordenar descendente para que rutas más específicas ganen
  const entries = Object.entries(ROUTE_PERMISSION_MAP).sort(
    ([a], [b]) => b.length - a.length
  );
  for (const [prefix, permission] of entries) {
    if (pathname.startsWith(prefix)) return permission;
  }
  return null;
}

/**
 * Construye una URL de Login conservando el tenant y el origen de redirección.
 */
export function buildLoginUrl(requestUrl: string, fromPath: string, tenantParam: string | null): URL {
  const url = new URL('/login', requestUrl);
  if (tenantParam) url.searchParams.set('tenant', tenantParam);
  if (fromPath && fromPath !== '/login' && fromPath !== '/recovery') {
    url.searchParams.set('redirect', fromPath);
  }
  return url;
}
