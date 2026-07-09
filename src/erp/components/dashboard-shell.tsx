"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { LayoutProvider } from "@/platform/providers/layout-context";
import { DashboardSidebar } from "@/erp/components/dashboard-sidebar";
import { DashboardHeader } from "@/erp/components/dashboard-header";
import { useDesignSystem } from "@/design-system";
import { parseToHslChannels } from "@/platform/tenant/tenant";
import { BrandingConfig, getBrandingDefaults } from "@/platform/branding/branding-defaults";
import { getTenantBranding } from "@/web/actions/branding";
import { getUserTenant } from "@/platform/users/users";
import { hasAccess } from "@/lib/role-permissions";
import type { NotificationItem } from "@/erp/actions/kpis";

interface DashboardShellProps {
  /** Rol del usuario — resuelto en el Server Component padre. */
  role: string;
  /** auth_user_id de Supabase — resuelto en el Server Component padre. */
  userId: string;
  children: React.ReactNode;
}

/**
 * Shell del dashboard: layout interactivo (sidebar, header, branding, tema).
 *
 * Recibe `role` y `userId` ya resueltos desde el Server Component layout,
 * eliminando los roundtrips de getUser() + getUserRole() del cliente.
 * El branding y las notificaciones se cargan de forma no bloqueante.
 */
export function DashboardShell({ role, userId, children }: DashboardShellProps) {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const { theme } = useDesignSystem();
  const pathname = usePathname();

  // ── Notificaciones (lazy, no bloquean el render inicial) ──────────────────
  const [notificationsCount, setNotificationsCount] = React.useState(0);
  const [notificationsList, setNotificationsList] = React.useState<NotificationItem[]>([]);

  React.useEffect(() => {
    import("@/erp/actions/notifications").then((m) => {
      m.getUnreadNotifications(userId).then((notifs) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setNotificationsList(notifs as any);
        setNotificationsCount(notifs.length);
      });
    }).catch(console.error);
  }, [userId]);

  // ── Tenant mismatch (lazy, no bloquea el render inicial) ──────────────────
  const [isTenantMismatch, setIsTenantMismatch] = React.useState(false);
  const [userTenantCode, setUserTenantCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    const isGlobalAdmin = role === "SUPER_ADMIN" || role === "ADMIN_DEV";
    if (!tenantParam || isGlobalAdmin) return;

    getUserTenant(userId).then((uTenant) => {
      if (uTenant && uTenant.code !== tenantParam) {
        setUserTenantCode(uTenant.code);
        setIsTenantMismatch(true);
      }
    }).catch(console.error);
  }, [userId, role, tenantParam]);

  // ── Branding (localStorage inmediato + sync en background) ────────────────
  const [activeConfig, setActiveConfig] = React.useState<BrandingConfig | null>(null);

  React.useEffect(() => {
    const defaults = getBrandingDefaults(tenantParam);
    const cacheKey = `tenant_config_${tenantParam || "default"}`;
    const cached = localStorage.getItem(cacheKey);
    let config = { ...defaults };

    if (cached) {
      try {
        const cachedObj = JSON.parse(cached);
        if (cachedObj.color_primario || cachedObj.nombre_comercial) {
          config = { ...defaults, ...cachedObj };
        } else if (cachedObj.primaryColor) {
          config = {
            ...defaults,
            nombre_comercial: cachedObj.name || defaults.nombre_comercial,
            color_primario: cachedObj.primaryColor.includes(" ")
              ? `hsl(${cachedObj.primaryColor.replace(/\s+/g, ", ")})`
              : cachedObj.primaryColor,
          };
        }
      } catch { /* cache corrupta — ignorar */ }
    }

    const userColor = localStorage.getItem("erp_color_preference");
    if (userColor) config.color_primario = userColor;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveConfig(config);
  }, [tenantParam]);

  React.useEffect(() => {
    async function syncBranding() {
      try {
        const branding = await getTenantBranding(tenantParam);
        const cacheKey = `tenant_config_${tenantParam || "default"}`;
        const cachedStr = localStorage.getItem(cacheKey);
        if (JSON.stringify(branding) !== cachedStr) {
          localStorage.setItem(cacheKey, JSON.stringify(branding));
          const config = { ...branding };
          const userColor = localStorage.getItem("erp_color_preference");
          if (userColor) config.color_primario = userColor;
          setActiveConfig(config);
        }
      } catch (err) {
        console.error("Error syncing branding:", err);
      }
    }
    syncBranding();
  }, [tenantParam]);

  // ── Aplicar CSS vars de white-label ───────────────────────────────────────
  React.useEffect(() => {
    if (!activeConfig) return;
    const root = document.documentElement;
    if (activeConfig.theme === "dark") {
      root.classList.add("dark");
    } else if (activeConfig.theme === "light") {
      root.classList.remove("dark");
    } else {
      if (theme.mode === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [activeConfig, theme.mode]);

  // ── RBAC: autorización para la ruta actual ────────────────────────────────
  const isAuthorized = React.useMemo(() => hasAccess(role, pathname), [role, pathname]);

  // ── Estados especiales ────────────────────────────────────────────────────
  if (isTenantMismatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-card border border-border rounded-xl shadow-lg max-w-md animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">Acceso Cruzado Denegado</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
            Tu usuario pertenece a <span className="font-mono text-primary font-bold">{userTenantCode || "SIN_TENANT"}</span>, pero intentas acceder al ERP de <span className="font-mono text-primary font-bold">{tenantParam}</span>.
          </p>
          <div className="flex gap-3 justify-center w-full">
            <button
              onClick={() => window.location.href = `/dashboard?tenant=${userTenantCode || ""}`}
              className="h-10 px-4 inline-flex items-center justify-center text-xs font-semibold uppercase tracking-widest text-background bg-foreground rounded-md hover:opacity-95 transition-opacity cursor-pointer"
            >
              Ir a mi ERP
            </button>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="h-10 px-4 inline-flex items-center justify-center text-xs font-semibold uppercase tracking-widest text-foreground border border-border rounded-md hover:bg-accent cursor-pointer">
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const mainContent = isAuthorized ? children : (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card border border-border rounded-xl shadow-xs animate-in fade-in duration-300">
      <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-6">
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">Acceso Restringido</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
        Tu rol (<span className="font-mono text-primary font-bold">{role}</span>) no tiene permiso para esta sección.
      </p>
      <button
        onClick={() => window.location.href = `/dashboard${tenantParam ? `?tenant=${tenantParam}` : ""}`}
        className="h-10 px-4 inline-flex items-center justify-center text-xs font-semibold uppercase tracking-widest text-background bg-foreground rounded-md hover:opacity-90 transition-all cursor-pointer"
      >
        Volver al Inicio
      </button>
    </div>
  );

  return (
    <LayoutProvider>
      {/* Google Fonts dinámico (white-label) */}
      {activeConfig?.tipografia_principal && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${activeConfig.tipografia_principal.replace(/\s+/g, "+")}:wght@300;400;500;600;700&display=swap`}
        />
      )}

      {/* CSS vars de white-label */}
      {activeConfig && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary: ${parseToHslChannels(activeConfig.color_primario)} !important;
                --ring: ${parseToHslChannels(activeConfig.color_primario)} !important;
                --secondary: ${parseToHslChannels(activeConfig.color_secundario)} !important;
                --success: ${parseToHslChannels(activeConfig.color_exito)} !important;
                --warning: ${parseToHslChannels(activeConfig.color_warning)} !important;
                --destructive: ${parseToHslChannels(activeConfig.color_danger)} !important;
                --info: ${parseToHslChannels(activeConfig.color_info)} !important;
                --radius: ${
                  activeConfig.border_radius === "ninguno" ? "0px"
                  : activeConfig.border_radius === "sutil" ? "4px"
                  : activeConfig.border_radius === "redondeado" ? "12px"
                  : activeConfig.border_radius
                } !important;
                --font-sans: '${activeConfig.tipografia_principal}', var(--font-sans) !important;
              }
            `,
          }}
        />
      )}

      <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
        <DashboardSidebar role={role} />
        <div className="flex-grow flex flex-col min-w-0">
          <DashboardHeader
            role={role}
            userId={userId}
            notificationsCount={notificationsCount}
            notificationsList={notificationsList}
          />
          <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
            {mainContent}
          </main>
        </div>
      </div>
    </LayoutProvider>
  );
}
