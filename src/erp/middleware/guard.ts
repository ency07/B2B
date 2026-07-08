import { NextResponse, type NextRequest } from 'next/server';
import { verifyErpToken, buildLoginUrl } from '@/platform/middleware/auth-utils';

export async function erpMiddlewareGuard(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const tenantParam = searchParams.get('tenant');

  // El ERP utiliza exclusivamente su propia cookie de sesión
  const accessToken = request.cookies.get('sb-erp-access-token')?.value;

  // verifyErpToken valida el JWT Y que el usuario tenga un rol ERP activo.
  // Un CLIENTE con token ERP válido es rechazado aquí [C-03].
  const isErpUser = await verifyErpToken(accessToken);

  if (!isErpUser) {
    return NextResponse.redirect(buildLoginUrl(request.url, pathname, tenantParam));
  }

  return NextResponse.next();
}
