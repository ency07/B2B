import { NextResponse, type NextRequest } from 'next/server';
import { erpMiddlewareGuard } from '@/erp/middleware/guard';
import { portalMiddlewareGuard } from '@/portal/middleware/guard';
import { authMiddlewareGuard } from '@/platform/middleware/auth-guard';

/**
 * Dispatcher Middleware
 * Enruta la petición al guardia correspondiente según el Bounded Context (dominio).
 * Garantiza que las reglas de seguridad estén aisladas.
 *
 * ⚠ PUNTO ÚNICO DE FALLO: Si este módulo falla, el 100% de las rutas
 * protegidas quedan inaccesibles o inseguras.
 * - Fail-closed: ante cualquier error no capturado, se deniega el acceso.
 * - El matcher en middleware.ts ya limita las rutas que pasan por aquí.
 */
export async function middlewareDispatcher(request: NextRequest) {
  try {
    const { pathname } = request.nextUrl;

    if (pathname.startsWith('/portal')) {
      return await portalMiddlewareGuard(request);
    }

    if (pathname.startsWith('/dashboard')) {
      return await erpMiddlewareGuard(request);
    }

    if (
      pathname.startsWith('/login') ||
      pathname.startsWith('/recovery') ||
      pathname.startsWith('/reset-password')
    ) {
      return await authMiddlewareGuard(request);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('[dispatcher] Error no capturado en middleware:', error);
    // Fail-closed: denegar acceso por defecto
    return NextResponse.redirect(new URL('/error?code=middleware_failure', request.url));
  }
}
