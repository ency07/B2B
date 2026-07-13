import { NextResponse, type NextRequest } from 'next/server';
import {
  verifyErpToken,
  buildLoginUrl,
  hasPermission,
  getRequiredPermissionForPath,
} from '@/platform/middleware/auth-utils';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Resuelve el auth_user_id y tenant_id del token ERP para checks granulares.
 * Fail-closed: retorna null ante cualquier error.
 */
async function resolveUserContext(
  accessToken: string
): Promise<{ authUserId: string; tenantId: string } | null> {
  try {
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { data: { user } } = await anonClient.auth.getUser(accessToken);
    if (!user) return null;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userRow } = await adminClient
      .from('users')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .eq('status', 'Activo')
      .maybeSingle();

    if (!userRow?.tenant_id) return null;

    return { authUserId: user.id, tenantId: userRow.tenant_id };
  } catch {
    return null;
  }
}

export async function erpMiddlewareGuard(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const tenantParam = searchParams.get('tenant');

  const accessToken = request.cookies.get('sb-erp-access-token')?.value;

  // Verificación base: JWT válido + rol ERP activo
  const isErpUser = await verifyErpToken(accessToken);
  if (!isErpUser) {
    return NextResponse.redirect(buildLoginUrl(request.url, pathname, tenantParam));
  }

  // Verificación granular por ruta (RBAC dinámico)
  const requiredPermission = getRequiredPermissionForPath(pathname);
  if (requiredPermission && accessToken) {
    const userCtx = await resolveUserContext(accessToken);

    if (!userCtx) {
      // No se pudo resolver el contexto → denegar
      return NextResponse.redirect(new URL('/dashboard?error=auth_context', request.url));
    }

    const allowed = await hasPermission(userCtx.authUserId, userCtx.tenantId, requiredPermission);
    if (!allowed) {
      // Usuario autenticado pero sin el permiso requerido → 403
      return NextResponse.redirect(
        new URL(`/dashboard?error=forbidden&required=${requiredPermission}`, request.url)
      );
    }
  }

  return NextResponse.next();
}
