import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

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
