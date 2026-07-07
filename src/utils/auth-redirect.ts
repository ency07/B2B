export function isSafeRedirect(path: string): boolean {
  if (!path) return false;
  // Solo permitir urls que comiencen con '/' y NO con '//' o '\\'
  return path.startsWith("/") && !path.startsWith("//") && !path.startsWith("\\\\");
}

/**
 * Helpers para construir URLs de redirect preservando `?tenant=` sin duplicarlo.
 *
 * Caso problema (antes):
 *   redirectTo = "/portal?tenant=acme"
 *   tenantParam = "acme"
 *   Concatenar produce: "/portal?tenant=acme?tenant=acme"  (URL inválida)
 *
 * Con applyTenantToPath, si el path ya tiene `tenant`, se respeta el existente.
 */

export function parsePath(path: string): { pathname: string; query: URLSearchParams } {
  const queryStart = path.indexOf("?");
  if (queryStart === -1) {
    return { pathname: path, query: new URLSearchParams() };
  }
  const pathname = path.slice(0, queryStart);
  const query = new URLSearchParams(path.slice(queryStart + 1));
  return { pathname, query };
}

export function applyTenantToPath(
  path: string,
  tenantParam: string | null | undefined
): string {
  if (!tenantParam) return path;
  const { pathname, query } = parsePath(path);
  if (!query.has("tenant")) {
    query.set("tenant", tenantParam);
  }
  const qs = query.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/**
 * Construye una URL /login?tenant=X&redirect=Y (solo path + search).
 * No duplica `tenant` si el redirect ya lo trae.
 */
export function buildLoginUrl(
  basePath: string,
  options: { tenant?: string | null; redirectTo?: string } = {}
): string {
  const { tenant, redirectTo } = options;
  const params = new URLSearchParams();
  if (tenant) params.set("tenant", tenant);
  if (redirectTo) {
    const withTenant = applyTenantToPath(redirectTo, tenant);
    params.set("redirect", withTenant);
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
