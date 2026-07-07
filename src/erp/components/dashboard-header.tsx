/**
 * DashboardHeader — header del ERP (Ola 5).
 *
 * Redisenado segun BLUEPRINT_ERP_REDISIGN.md §2.1:
 * - Workspace switcher como chip con avatar (no logo gigante)
 * - Command bar trigger (search input con Kbd chip OS-aware)
 * - Notificaciones con badge de unread
 * - Help `?` button
 * - Avatar con dropdown a Mi Cuenta / Cerrar sesion
 * - Sticky + blur via Headroom
 *
 * REMOVIDO:
 * - Chip "DB_CONNECTED" con punto verde pulsante (estilo cyberpunk)
 * - Breadcrumb tipo "TENANT / DASHBOARD" (info ya esta en la pagina)
 */

"use client";

import * as React from "react";
import Headroom from "react-headroom";
import { ChevronDown, Bell, CircleHelp, LogOut, Search, Building2 } from "lucide-react";
import { ThemeCustomizer } from "@/platform/components/theme-customizer";
import { useLayout } from "@/platform/providers/layout-context";
import { Avatar, AvatarImage, AvatarFallback } from "@/platform/ui/avatar";
import { Kbd } from "@/platform/ui/kbd";
import { useRouter, useSearchParams } from "next/navigation";
import { useCommandBarHotkey } from "@/hooks/use-command-bar-hotkey";
import { CommandBar, type CommandBarGroup } from "@/platform/components/shell/command-bar";
import { getErpBrowserClient } from "@/platform/auth/clients";

const supabase = getErpBrowserClient();
import { useBranding } from "@/hooks/use-branding";
import { getUserRole } from "@/platform/users/users";;
import { getPermissionsForRole } from "@/lib/role-permissions";
import { type NotificationItem } from "@/erp/actions/kpis";
import { cn } from "@/platform/utils/cn";

const QUICK_NAV: CommandBarGroup[] = [
  {
    id: "modules",
    label: "Modulos",
    items: [
      { id: "m-dashboard", title: "Dashboard", subtitle: "/dashboard", onSelect: () => {} },
      { id: "m-clients", title: "Clientes", subtitle: "/dashboard/clients", onSelect: () => {} },
      { id: "m-leads", title: "CRM", subtitle: "/dashboard/leads", onSelect: () => {} },
      { id: "m-inventory", title: "Inventario", subtitle: "/dashboard/inventory", onSelect: () => {} },
      { id: "m-purchases", title: "Compras", subtitle: "/dashboard/purchases", onSelect: () => {} },
      { id: "m-invoices", title: "Facturacion", subtitle: "/dashboard/invoices", onSelect: () => {} },
      { id: "m-cms", title: "CMS Admin", subtitle: "/dashboard/cms", onSelect: () => {} },
      { id: "m-settings", title: "Configuracion", subtitle: "/dashboard/settings", onSelect: () => {} },
    ],
  },
];

interface DashboardHeaderProps {
  notificationsCount?: number;
  notificationsList?: NotificationItem[];
  role?: string | null;
}

export function DashboardHeader({
  notificationsCount = 0,
  notificationsList = [],
  role: initialRole = null,
}: DashboardHeaderProps = {}) {
  const { toggleMobileOpen } = useLayout();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const branding = useBranding(tenantParam);
  const companyName = branding.nombre_comercial;
  const [userName, setUserName] = React.useState<string>("Administrador");
  const [userRoleLabel, setUserRoleLabel] = React.useState<string>("Admin Tenant");
  const [role, setRole] = React.useState<string | null>(initialRole);
  const [showAccountMenu, setShowAccountMenu] = React.useState(false);
  const [showHelpMenu, setShowHelpMenu] = React.useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = React.useState(false);
  const [commandOpen, setCommandOpen] = useCommandBarHotkey();

  React.useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: userData } = await supabase
            .from("users")
            .select("first_name, last_name")
            .eq("auth_user_id", user.id)
            .maybeSingle();
          if (userData?.first_name) {
            setUserName(`${userData.first_name} ${userData.last_name || ""}`.trim());
          } else {
            setUserName(user.email?.split("@")[0] || "Administrador");
          }

          let userRole = initialRole;
          if (!userRole) {
            userRole = await getUserRole(user.id);
          }
          setRole(userRole);
          if (userRole) {
            const roleLabels: Record<string, string> = {
              SUPER_ADMIN: "Super Admin",
              ADMIN_EMPRESA: "Admin Tenant",
              GERENTE_GENERAL: "Gerente General",
              DIRECTOR_COMERCIAL: "Dir. Comercial",
              EJECUTIVO_COMERCIAL: "Ej. Comercial",
              DIRECTOR_OPERACIONES: "Dir. Operaciones",
              TECNICO_CAMPO: "Tecnico de Campo",
              ALMACENISTA: "Almacenista",
              AUDITOR: "Auditor de Procesos",
            };
            setUserRoleLabel(roleLabels[userRole] || userRole);
          }
        }
      } catch (err) {
        console.error("Error loading user info in header:", err);
      }
    }
    loadUserData();
  }, [initialRole]);

  // Build nav groups with real navigation callbacks, filtered by role permissions.
  const navGroups: CommandBarGroup[] = React.useMemo(() => {
    const perms = getPermissionsForRole(role);
    const all = perms.includes("*");

    const allItems = [
      { id: "m-dashboard", title: "Dashboard", subtitle: "/dashboard", icon: Building2, onSelect: () => { router.push("/dashboard"); setCommandOpen(false); } },
      { id: "m-clients", title: "Clientes", subtitle: "/dashboard/clients", icon: Building2, onSelect: () => { router.push("/dashboard/clients"); setCommandOpen(false); } },
      { id: "m-leads", title: "CRM", subtitle: "/dashboard/leads", icon: Building2, onSelect: () => { router.push("/dashboard/leads"); setCommandOpen(false); } },
      { id: "m-quotes", title: "Cotizaciones", subtitle: "/dashboard/quotes", icon: Building2, onSelect: () => { router.push("/dashboard/quotes"); setCommandOpen(false); } },
      { id: "m-inventory", title: "Inventario", subtitle: "/dashboard/inventory", icon: Building2, onSelect: () => { router.push("/dashboard/inventory"); setCommandOpen(false); } },
      { id: "m-purchases", title: "Compras", subtitle: "/dashboard/purchases", icon: Building2, onSelect: () => { router.push("/dashboard/purchases"); setCommandOpen(false); } },
      { id: "m-jobs", title: "Trabajos OTs", subtitle: "/dashboard/jobs", icon: Building2, onSelect: () => { router.push("/dashboard/jobs"); setCommandOpen(false); } },
      { id: "m-invoices", title: "Facturacion", subtitle: "/dashboard/invoices", icon: Building2, onSelect: () => { router.push("/dashboard/invoices"); setCommandOpen(false); } },
      { id: "m-cms", title: "CMS Admin", subtitle: "/dashboard/cms", icon: Building2, onSelect: () => { router.push("/dashboard/cms"); setCommandOpen(false); } },
      { id: "m-settings", title: "Configuracion", subtitle: "/dashboard/settings", icon: Building2, onSelect: () => { router.push("/dashboard/settings"); setCommandOpen(false); } },
    ];

    const filteredItems = allItems.filter(item => all || perms.includes(item.subtitle));

    return [
      {
        id: "modules",
        label: "Modulos",
        items: filteredItems,
      },
    ];
  }, [router, setCommandOpen, role]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    const loginUrl = `/login${tenantParam ? `?tenant=${tenantParam}` : ""}`;
    router.push(loginUrl);
    router.refresh();
  };

  return (
    <>
      <Headroom className="z-40">
        <header
          className={cn(
            "flex items-center justify-between h-14 px-4 md:px-6",
            "border-b border-line",
            "bg-bg-elevated-1/80 backdrop-blur-md",
            "supports-[backdrop-filter]:bg-bg-elevated-1/70"
          )}
        >
          {/* === Left: mobile menu + workspace switcher === */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={toggleMobileOpen}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-ink-soft hover:text-ink hover:bg-accent transition-colors cursor-pointer lg:hidden"
              aria-label="Abrir menu"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 h-8 pl-1.5 pr-2.5 rounded-md border border-line bg-bg-elevated-1 hover:border-line-strong transition-colors cursor-pointer"
              aria-label="Cambiar workspace"
            >
              <span className="inline-flex items-center justify-center h-5 w-5 rounded bg-primary/15 text-primary text-[10px] font-mono font-semibold">
                {companyName.substring(0, 2).toUpperCase()}
              </span>
              <span className="text-[12px] font-semibold text-ink truncate max-w-[160px]">
                {companyName}
              </span>
              <ChevronDown
                className="h-3 w-3 text-ink-muted shrink-0"
                strokeWidth={1.5}
              />
            </button>
          </div>

          {/* === Center: search trigger (command bar) === */}
          <div className="flex-1 flex items-center justify-end md:justify-center md:max-w-md md:mx-4">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className={cn(
                "w-full md:w-80 h-8 px-3",
                "inline-flex items-center gap-2",
                "rounded-md border border-line bg-bg-elevated-1",
                "text-[12px] text-ink-muted",
                "hover:border-line-strong hover:text-ink-soft",
                "transition-colors duration-[var(--motion-fast)] ease-erp",
                "cursor-pointer"
              )}
            >
              <Search className="h-3.5 w-3.5" strokeWidth={1.5} />
              <span className="flex-1 text-left">Buscar en el sistema…</span>
              <Kbd combo="K" size="sm" />
            </button>
          </div>

          {/* === Right: actions === */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeCustomizer storageKeyPrefix="erp" />

            <button
              type="button"
              onClick={() => setShowHelpMenu((s) => !s)}
              className="inline-flex items-center justify-center h-8 w-8 rounded-md text-ink-soft hover:text-ink hover:bg-accent transition-colors cursor-pointer"
              aria-label="Ayuda"
            >
              <CircleHelp className="h-4 w-4" strokeWidth={1.5} />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationsMenu((s) => !s)}
                className="relative inline-flex items-center justify-center h-8 w-8 rounded-md text-ink-soft hover:text-ink hover:bg-accent transition-colors cursor-pointer"
                aria-label={
                  notificationsCount > 0
                    ? `${notificationsCount} notificaciones pendientes`
                    : "Notificaciones"
                }
              >
                <Bell className="h-4 w-4" strokeWidth={1.5} />
                {notificationsCount > 0 && (
                  <span
                    className={cn(
                      "absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-mono font-bold flex items-center justify-center",
                      notificationsCount > 5
                        ? "bg-state-danger text-state-danger-foreground"
                        : "bg-state-warning text-state-warning-foreground"
                    )}
                    aria-hidden
                  >
                    {notificationsCount > 9 ? "9+" : notificationsCount}
                  </span>
                )}
              </button>

              {showNotificationsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotificationsMenu(false)}
                    aria-hidden
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1 w-80 max-h-96 z-50 rounded-lg border border-line bg-bg-elevated-1 depth-3 overflow-y-auto flex flex-col"
                  >
                    <div className="px-4 py-2.5 border-b border-line flex justify-between items-center bg-bg-elevated-1/90 backdrop-blur sticky top-0">
                      <span className="text-[11px] font-mono font-bold text-ink uppercase tracking-wider">
                        Alertas y Notificaciones
                      </span>
                      <span className="text-[10px] font-mono text-ink-muted bg-bg-base border border-line px-1.5 py-0.5 rounded">
                        {notificationsCount} activas
                      </span>
                    </div>

                    <div className="divide-y divide-line overflow-y-auto flex-1">
                      {notificationsList.length === 0 ? (
                        <div className="p-6 text-center text-ink-muted text-[11px]">
                          Sin notificaciones activas.
                        </div>
                      ) : (
                        notificationsList.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setShowNotificationsMenu(false);
                              router.push(item.link + (tenantParam ? `?tenant=${tenantParam}` : ""));
                            }}
                            className="w-full text-left p-3 hover:bg-accent/10 transition-colors flex items-start gap-2.5 group"
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full shrink-0 mt-1.5",
                                item.isDanger ? "bg-state-danger" : "bg-state-warning"
                              )}
                            />
                            <div className="space-y-1 min-w-0">
                              <p className="text-[11px] font-bold text-ink leading-tight group-hover:text-primary transition-colors">
                                {item.title}
                              </p>
                              <p className="text-[10px] text-ink-soft leading-normal break-words">
                                {item.description}
                              </p>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-5 w-px bg-line mx-1" aria-hidden />

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAccountMenu((s) => !s)}
                className="inline-flex items-center gap-2 pl-1 pr-2 h-8 rounded-md hover:bg-accent transition-colors cursor-pointer"
                aria-label="Mi cuenta"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-[10px]">
                    {userName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start leading-none">
                  <span className="text-[11px] font-semibold text-ink">
                    {userName}
                  </span>
                  <span className="text-[10px] text-ink-muted mt-0.5">
                    {userRoleLabel}
                  </span>
                </div>
                <ChevronDown
                  className="h-3 w-3 text-ink-muted"
                  strokeWidth={1.5}
                />
              </button>

              {showAccountMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowAccountMenu(false)}
                    aria-hidden
                  />
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-1 w-56 z-50 rounded-lg border border-line bg-bg-elevated-1 depth-2 overflow-hidden"
                  >
                    <div className="px-3 py-2 border-b border-line">
                      <p className="text-[12px] font-semibold text-ink truncate">
                        {userName}
                      </p>
                      <p className="text-[11px] text-ink-muted truncate">
                        {userRoleLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAccountMenu(false);
                        router.push("/dashboard/settings");
                      }}
                      className="w-full text-left px-3 py-2 text-[12px] text-ink-soft hover:bg-accent hover:text-ink transition-colors"
                    >
                      Configuracion
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-[12px] text-state-danger hover:bg-state-danger/10 transition-colors inline-flex items-center gap-1.5"
                    >
                      <LogOut className="h-3 w-3" strokeWidth={1.5} />
                      Cerrar sesion
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      </Headroom>

      {/* === Command bar global === */}
      <CommandBar
        open={commandOpen}
        onOpenChange={setCommandOpen}
        groups={navGroups}
        placeholder="Buscar modulo, cliente, factura…"
      />
    </>
  );
}
