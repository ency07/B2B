import { NextResponse, type NextRequest } from 'next/server';
import { verifyAccessToken } from './auth-utils';

export async function authMiddlewareGuard(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const tenantParam = searchParams.get('tenant');

  // Intentamos obtener la sesión de cualquier dominio
  const accessToken = 
    request.cookies.get('sb-erp-access-token')?.value || 
    request.cookies.get('sb-portal-access-token')?.value ||
    request.cookies.get('sb-access-token')?.value;

  let isAuthenticated = false;
  if (accessToken) {
    isAuthenticated = await verifyAccessToken(accessToken);
  }

  if (pathname === '/recovery' && isAuthenticated) {
    const url = new URL('/dashboard', request.url);
    if (tenantParam) url.searchParams.set('tenant', tenantParam);
    return NextResponse.redirect(url);
  }

  if (pathname === '/reset-password' && !isAuthenticated) {
    const url = new URL('/recovery', request.url);
    if (tenantParam) url.searchParams.set('tenant', tenantParam);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
