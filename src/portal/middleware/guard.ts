import { NextResponse, type NextRequest } from 'next/server';
import { verifyAccessToken, buildLoginUrl } from '@/platform/middleware/auth-utils';

export async function portalMiddlewareGuard(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const tenantParam = searchParams.get('tenant');

  // El Portal utiliza exclusivamente su propia cookie de sesión, con fallback a la antigua durante la migración
  const accessToken = 
    request.cookies.get('sb-portal-access-token')?.value || 
    request.cookies.get('sb-access-token')?.value;

  const isAuthenticated = await verifyAccessToken(accessToken);

  if (!isAuthenticated) {
    return NextResponse.redirect(buildLoginUrl(request.url, pathname, tenantParam));
  }

  return NextResponse.next();
}
