import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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
      .select('id, user_roles(roles(role_code))')
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
