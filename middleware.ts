export { middlewareDispatcher as middleware } from './src/platform/middleware/dispatcher';

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/portal/:path*',
    '/login',
    '/recovery',
    '/reset-password',
  ],
};
