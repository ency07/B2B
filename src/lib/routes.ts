// Rutas estáticas del proyecto. Importar estas constantes en lugar de
// strings literales para que TypeScript detecte typos en tiempo de compilación
// y los refactors de rutas sean un cambio en un único archivo.

export const ROUTES = {
  // ── Web pública ──────────────────────────────────────────────────
  HOME:             "/",
  PRIVACIDAD:       "/privacidad",
  WIZARD:           "/wizard",

  // ── Auth ─────────────────────────────────────────────────────────
  LOGIN:            "/login",
  RECOVERY:         "/recovery",
  RESET_PASSWORD:   "/reset-password",
  REGISTER_PORTAL:  "/auth/register-portal",
  ERROR_PAGE:       "/error-page",

  // ── Portal cliente ───────────────────────────────────────────────
  PORTAL:           "/portal",

  // ── ERP (dashboard) ──────────────────────────────────────────────
  DASHBOARD:              "/dashboard",
  DASHBOARD_CLIENTS:      "/dashboard/clients",
  DASHBOARD_CMS:          "/dashboard/cms",
  DASHBOARD_INVENTORY:    "/dashboard/inventory",
  DASHBOARD_INVOICES:     "/dashboard/invoices",
  DASHBOARD_JOBS:         "/dashboard/jobs",
  DASHBOARD_LEADS:        "/dashboard/leads",
  DASHBOARD_PURCHASES:    "/dashboard/purchases",
  DASHBOARD_QUOTES:       "/dashboard/quotes",
  DASHBOARD_REQUIREMENTS: "/dashboard/requirements",
  DASHBOARD_SETTINGS:     "/dashboard/settings",
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];

// ── Helpers para rutas dinámicas ─────────────────────────────────────

export function loginUrl(opts?: { tenant?: string; redirect?: string }): string {
  const params = new URLSearchParams();
  if (opts?.tenant)   params.set("tenant",   opts.tenant);
  if (opts?.redirect) params.set("redirect", opts.redirect);
  const qs = params.toString();
  return qs ? `${ROUTES.LOGIN}?${qs}` : ROUTES.LOGIN;
}

export function portalUrl(tenant?: string): string {
  return tenant ? `${ROUTES.PORTAL}?tenant=${tenant}` : ROUTES.PORTAL;
}

export function errorPageUrl(code: string): string {
  return `${ROUTES.ERROR_PAGE}?code=${encodeURIComponent(code)}`;
}
