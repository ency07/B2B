"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutProvider } from "@/platform/providers/layout-context";
import { DashboardSidebar } from "@/erp/components/dashboard-sidebar";
import { DashboardHeader } from "@/erp/components/dashboard-header";
import { useTheme } from "next-themes";
import { parseToHslChannels } from "@/platform/tenant/tenant";
import { BrandingConfig, getBrandingDefaults } from "@/platform/branding/branding-defaults";
import { getTenantBranding } from "@/web/actions/branding";
import { getErpBrowserClient } from "@/platform/auth/clients";

const supabase = getErpBrowserClient();
import { getUserRole, getUserTenant } from "@/platform/users/users";;
import { getKpisForRole, type NotificationItem } from "@/erp/actions/kpis";
import {
  hasAccess,
  CLIENT_ROLE,
  PORTAL_PATH,
} from "@/lib/role-permissions";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const { resolvedTheme } = useTheme();
  const pathname = usePathname();

  const [role, setRole] = React.useState<string | null>(null);
  const [isRoleLoading, setIsRoleLoading] = React.useState(true);
  const [authChecked, setAuthChecked] = React.useState(false);
  const [notificationsCount, setNotificationsCount] = React.useState(0);
  const [notificationsList, setNotificationsList] = React.useState<any[]>([]);
  const [isTenantMismatch, setIsTenantMismatch] = React.useState(false);
  const [userTenantCode, setUserTenantCode] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    async function loadSession() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const userRole = await getUserRole(user.id);
            setRole(userRole);

            // Validar pertenencia al tenant si el rol no es un administrador global
            const isGlobalAdmin = userRole === "SUPER_ADMIN" || userRole === "ADMIN_DEV";
            if (tenantParam && !isGlobalAdmin) {
              const uTenant = await getUserTenant(user.id);
              if (uTenant) {
                setUserTenantCode(uTenant.code);
                if (uTenant.code !== tenantParam) {
                  setIsTenantMismatch(true);
                }
              }
            }

            // Fetch notifications only if they have a session
            import("@/erp/actions/notifications").then(m => {
              m.getUnreadNotifications(user.id).then(notifs => {
                setNotificationsList(notifs);
                setNotificationsCount(notifs.length);
              });
            }).catch(console.error);

          } catch (err) {
            console.error("Error calling getUserRole Server Action:", err);
            setRole(null);
          }
        } else {
          setRole(null);
          // No hay sesion: redirigir a /login preservando el destino.
          const returnUrl = encodeURIComponent(pathname);
          const tenantQs = tenantParam ? `&tenant=${tenantParam}` : "";
          router.replace(`/login?redirect=${returnUrl}${tenantQs}`);
        }
      } catch (e) {
        console.error("Error loading user session:", e);
        setRole(null);
        const returnUrl = encodeURIComponent(pathname);
        const tenantQs = tenantParam ? `&tenant=${tenantParam}` : "";
        router.replace(`/login?redirect=${returnUrl}${tenantQs}`);
      } finally {
        setAuthChecked(true);
        setIsRoleLoading(false);
      }
    }
    loadSession();
  }, [pathname, tenantParam, router]);



  // State to hold the active branding configuration
  const [activeConfig, setActiveConfig] = React.useState<BrandingConfig | null>(null);

  // 1. Load configuration from localStorage instantly (or fall back to defaults)
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
          // Compatibility with old format
          config = {
            ...defaults,
            nombre_comercial: cachedObj.name || defaults.nombre_comercial,
            color_primario: cachedObj.primaryColor.includes(' ') 
              ? `hsl(${cachedObj.primaryColor.replace(/\s+/g, ', ')})` 
              : cachedObj.primaryColor,
          };
        }
      } catch (e) {}
    }
    
    // User Override for ERP Theme Color
    const userColor = localStorage.getItem("erp_color_preference");
    if (userColor) {
      config.color_primario = userColor;
    }
    
    setActiveConfig(config);
  }, [tenantParam]);

  // 2. Perform background sync from Supabase to update the local configuration
  React.useEffect(() => {
    async function syncSettings() {
      try {
        const branding = await getTenantBranding(tenantParam);
        const cacheKey = `tenant_config_${tenantParam || "default"}`;
        const cachedStr = localStorage.getItem(cacheKey);
        
        // Update state and cache if different
        if (JSON.stringify(branding) !== cachedStr) {
          localStorage.setItem(cacheKey, JSON.stringify(branding));
          
          const config = { ...branding };
          const userColor = localStorage.getItem("erp_color_preference");
          if (userColor) {
            config.color_primario = userColor;
          }
          setActiveConfig(config);
        }
      } catch (err) {
        console.error("Error syncing branding settings from Supabase:", err);
      }
    }
    syncSettings();
  }, [tenantParam]);

  // 3. Apply classes and custom style properties dynamically on DOM
  React.useEffect(() => {
    if (!activeConfig) return;
    const root = document.documentElement;

    // Theme viene de tenant_settings (white-label: no por hardcoded de tenant_code).
    // Si activeConfig.theme === "dark" lo aplicamos; si no, default al sistema.
    if (activeConfig && activeConfig.theme === "dark") {
      root.classList.add("dark");
    } else if (activeConfig && activeConfig.theme === "light") {
      root.classList.remove("dark");
    } else {
      // Sin config: respetar el theme del sistema (next-themes).
      if (resolvedTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [activeConfig, resolvedTheme, tenantParam]);

  // Determinar si tiene acceso a la página actual
  const isAuthorized = React.useMemo(() => {
    if (isRoleLoading) return true; // Permitir que cargue antes de bloquear
    return hasAccess(role, pathname);
  }, [role, isRoleLoading, pathname]);

  // CLIENTE no tiene acceso al /dashboard. Redirigir a /portal.
  React.useEffect(() => {
    if (!isRoleLoading && role === CLIENT_ROLE) {
      router.replace(PORTAL_PATH);
    }
  }, [role, isRoleLoading, router]);

  // Sesión resuelta y sin rol: redirigir a /login (antes se mostraba
  // "Redirigiendo..." indefinidamente — soft-loop).
  React.useEffect(() => {
    if (authChecked && role === null) {
      const returnUrl = encodeURIComponent(pathname);
      const tenantQs = tenantParam ? `&tenant=${tenantParam}` : "";
      router.replace(`/login?redirect=${returnUrl}${tenantQs}`);
    }
  }, [authChecked, role, pathname, tenantParam, router]);

  if (!authChecked || isRoleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

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
            Tu usuario pertenece a la empresa <span className="font-mono text-primary font-bold">{userTenantCode || "SIN_TENANT"}</span>, pero estás intentando ingresar al ERP de la empresa <span className="font-mono text-primary font-bold">{tenantParam}</span>.
          </p>
          <div className="flex gap-3 justify-center w-full">
            <button
              onClick={() => window.location.href = `/dashboard?tenant=${userTenantCode || ""}`}
              className="h-10 px-4 inline-flex items-center justify-center text-xs font-semibold uppercase tracking-widest text-background bg-foreground rounded-md hover:opacity-95 transition-opacity cursor-pointer"
            >
              Ir a mi ERP
            </button>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="h-10 px-4 inline-flex items-center justify-center text-xs font-semibold uppercase tracking-widest text-foreground border border-border rounded-md hover:bg-accent cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (role === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">
            Redirigiendo a inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  if (role === CLIENT_ROLE) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">
            Redirigiendo a Portal Cliente...
          </p>
        </div>
      </div>
    );
  }

  let mainContent = children;
  if (!isAuthorized) {
    mainContent = (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-card border border-border rounded-xl shadow-xs animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">Acceso Restringido</h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
          Su rol actual (<span className="font-mono text-primary font-bold">{role || "SIN_ROL"}</span>) no tiene permisos de visualización ni administración para esta sección.
        </p>
        <button
          onClick={() => window.location.href = `/dashboard${tenantParam ? `?tenant=${tenantParam}` : ""}`}
          className="h-10 px-4 inline-flex items-center justify-center text-xs font-semibold uppercase tracking-widest text-background bg-foreground rounded-md hover:opacity-90 active:scale-98 transition-all cursor-pointer"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <LayoutProvider>
      {/* Google Fonts Dynamic Loading */}
      {activeConfig && activeConfig.tipografia_principal && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${activeConfig.tipografia_principal.replace(/\s+/g, "+")}:wght@300;400;500;600;700&display=swap`}
        />
      )}

      {/* Dynamic CSS override for White Label styling */}
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
                --radius: ${activeConfig.border_radius === "ninguno" ? "0px" : activeConfig.border_radius === "sutil" ? "4px" : activeConfig.border_radius === "redondeado" ? "12px" : activeConfig.border_radius} !important;
                --font-sans: '${activeConfig.tipografia_principal}', var(--font-sans) !important;
              }
            `,
          }}
        />
      )}

      <div className="flex min-h-screen bg-background text-foreground transition-colors duration-200">
        <DashboardSidebar role={role} />
        <div className="flex-grow flex flex-col min-w-0">
          <DashboardHeader role={role} notificationsCount={notificationsCount} notificationsList={notificationsList} />
          <main className="flex-grow p-4 md:p-6 lg:p-8 overflow-y-auto">
            {mainContent}
          </main>
        </div>
      </div>
    </LayoutProvider>
  );
}


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
          Cargando Dashboard...
        </div>
      }
    >
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </React.Suspense>
  );
}
