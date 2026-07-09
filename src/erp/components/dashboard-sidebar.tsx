/**
 * DashboardSidebar — shell de navegacion del ERP (Ola 5).
 *
 * Redisenado segun BLUEPRINT_ERP_REDISIGN.md §2.1:
 * - Items agrupados por secciones con headers uppercase mono
 * - Keyboard hints visibles a la derecha (⌘1, ⌘2, etc.)
 * - Status dot como indicador de item activo (no barra naranja)
 * - Workspace switcher como header (logo + tenant)
 * - Mobile drawer con animacion de slide
 * - Colapsable a 56px (icon-only) en desktop
 *
 * Preserva el sistema de permisos por rol y la integracion con
 * el layout context existente.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Package,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  ClipboardList,
  TrendingUp,
  FileCheck,
  Layers,
  ShoppingBag,
} from "lucide-react";
import { useLayout } from "@/platform/providers/layout-context";
import { cn } from "@/platform/utils/cn";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/platform/ui/tooltip";
import { Kbd } from "@/platform/ui/kbd";
import { getErpBrowserClient } from "@/platform/auth/clients";

const supabase = getErpBrowserClient();
import { getUserRole } from "@/platform/users/users";;
import { getPermissionsForRole } from "@/lib/role-permissions";
import { useBranding } from "@/hooks/use-branding";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  shortcut?: string;
};

type NavSection = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_SECTIONS: NavSection[] = [
  {
    id: "general",
    label: "General",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, shortcut: "1" },
    ],
  },
  {
    id: "comercial",
    label: "Comercial",
    items: [
      { href: "/dashboard/clients", label: "Clientes", icon: Users, shortcut: "6" },
      { href: "/dashboard/leads", label: "Prospectos", icon: TrendingUp, shortcut: "5" },
      { href: "/dashboard/quotes", label: "Cotizaciones", icon: FileCheck },
      { href: "/dashboard/requirements", label: "Requerimientos", icon: ClipboardList },
    ],
  },
  {
    id: "operacion",
    label: "Operacion",
    items: [
      { href: "/dashboard/inventory", label: "Inventario", icon: Package, shortcut: "2" },
      { href: "/dashboard/purchases", label: "Compras", icon: ShoppingBag, shortcut: "3" },
      { href: "/dashboard/jobs", label: "Órdenes de Trabajo", icon: Briefcase },
      { href: "/dashboard/invoices", label: "Facturacion", icon: FileText, shortcut: "4" },
    ],
  },
  {
    id: "sistema",
    label: "Sistema",
    items: [
      { href: "/dashboard/cms", label: "Contenido", icon: Layers, shortcut: "7" },
      { href: "/dashboard/settings", label: "Configuracion", icon: Settings, shortcut: "8" },
    ],
  },
];

interface DashboardSidebarProps {
  role?: string | null;
}

export function DashboardSidebar({ role: initialRole = null }: DashboardSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useLayout();
  const branding = useBranding(tenantParam);
  const companyName = branding.nombre_comercial;
  const logoUrl = branding.logo_claro_url || branding.logo_oscuro_url;

  const [role, setRole] = React.useState<string | null>(initialRole);

  React.useEffect(() => {
    if (initialRole) return;
    async function loadRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userRole = await getUserRole(user.id);
        setRole(userRole);
      }
    }
    loadRole();
  }, [initialRole]);

  const router = useRouter();

  // === Global Keyboard Shortcuts ===
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        NAV_SECTIONS.forEach((section) => {
          section.items.forEach((item) => {
            if (item.shortcut && e.key === item.shortcut) {
              e.preventDefault();
              router.push(item.href + (tenantParam ? `?tenant=${tenantParam}` : ""));
            }
          });
        });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, tenantParam]);

  const allowedItems = React.useMemo(() => {
    const perms = getPermissionsForRole(role);
    const all = perms.includes("*");
    return NAV_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => all || perms.includes(item.href)
      ),
    })).filter((section) => section.items.length > 0);
  }, [role]);

  const sidebarWidth = isCollapsed ? "w-14" : "w-60";

  return (
    <>
      {/* === Mobile backdrop === */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
            className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-xs lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* === Mobile drawer === */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.18, ease: [0.2, 0, 0, 1] }}
            className="fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-bg-elevated-1 border-r border-line depth-3 lg:hidden"
          >
            <SidebarHeader
              logoUrl={logoUrl}
              companyName={companyName}
              collapsed={false}
              onClose={closeMobile}
            />
            <SidebarNav
              sections={allowedItems}
              pathname={pathname}
              onItemClick={closeMobile}
              showShortcuts={true}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* === Desktop sidebar === */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen sticky top-0",
          "bg-bg-elevated-1 border-r border-line shrink-0",
          "transition-[width] duration-[var(--motion-base)] ease-erp",
          "z-30",
          sidebarWidth
        )}
      >
        <SidebarHeader
          logoUrl={logoUrl}
          companyName={companyName}
          collapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
        />

        {isCollapsed && (
          <div className="flex justify-center py-2 border-b border-line">
            <button
              onClick={toggleCollapse}
              className="inline-flex items-center justify-center h-6 w-6 rounded-md text-ink-muted hover:text-ink hover:bg-accent transition-colors cursor-pointer"
              aria-label="Expandir menu"
            >
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        )}

        <SidebarNav
          sections={allowedItems}
          pathname={pathname}
          showShortcuts={!isCollapsed}
          collapsed={isCollapsed}
        />
      </aside>
    </>
  );
}

// === Sidebar header (logo + tenant + collapse button) ===
function SidebarHeader({
  logoUrl,
  companyName,
  collapsed,
  onClose,
  onToggleCollapse,
}: {
  logoUrl: string;
  companyName: string;
  collapsed: boolean;
  onClose?: () => void;
  onToggleCollapse?: () => void;
}) {
  return (
    <div className="flex items-center justify-between h-14 px-4 border-b border-line shrink-0">
      {!collapsed ? (
        <div className="flex items-center gap-2 min-w-0">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={companyName}
              width={150}
              height={28}
              className="h-6 w-auto max-w-[150px] object-contain"
            />
          ) : (
            <span className="text-[14px] font-semibold text-ink truncate">
              {companyName}
            </span>
          )}
        </div>
      ) : (
        <span className="font-mono text-[10px] uppercase tracking-widest font-bold text-primary mx-auto">
          {companyName.substring(0, 2).toUpperCase()}
        </span>
      )}

      {!collapsed && (
        <div className="flex items-center gap-1 shrink-0">
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-muted hover:text-ink hover:bg-accent transition-colors cursor-pointer lg:hidden"
              aria-label="Cerrar menu"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-muted hover:text-ink hover:bg-accent transition-colors cursor-pointer"
              aria-label="Colapsar menu"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// === Sidebar nav (sections + items) ===
function SidebarNav({
  sections,
  pathname,
  onItemClick,
  showShortcuts,
  collapsed,
}: {
  sections: NavSection[];
  pathname: string;
  onItemClick?: () => void;
  showShortcuts: boolean;
  collapsed?: boolean;
}) {
  if (collapsed) {
    // Modo colapsado: solo iconos, sin secciones.
    const allItems = sections.flatMap((s) => s.items);
    return (
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {allItems.map((item) => (
          <SidebarItem
            key={item.href}
            item={item}
            active={isActive(pathname, item.href)}
            onClick={onItemClick}
            collapsed
            showShortcut={false}
          />
        ))}
      </nav>
    );
  }

  return (
    <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
      {sections.map((section) => (
        <div key={section.id}>
          <h3 className="px-2 mb-1.5 font-mono text-[10px] uppercase tracking-widest text-ink-muted font-medium">
            {section.label}
          </h3>
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                onClick={onItemClick}
                showShortcut={showShortcuts && !!item.shortcut}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(href + "/");
}

// === Single nav item ===
function SidebarItem({
  item,
  active,
  onClick,
  showShortcut,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  onClick?: () => void;
  showShortcut: boolean;
  collapsed?: boolean;
}) {
  const Icon = item.icon;

  if (collapsed) {
    const tooltipText = item.label + (item.shortcut ? ` (Alt+${item.shortcut})` : "");
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              onClick={onClick}
              title={tooltipText}
              aria-label={tooltipText}
              className={cn(
                "relative flex items-center justify-center",
                "h-9 w-10 mx-auto",
                "rounded-md",
                "transition-colors duration-[var(--motion-fast)] ease-erp",
                active
                  ? "bg-accent text-ink"
                  : "text-ink-soft hover:bg-accent/50 hover:text-ink"
              )}
            >
              {active && (
                <span
                  className="absolute left-0 top-1/4 bottom-1/4 w-[2px] rounded-r-full bg-primary"
                  aria-hidden
                />
              )}
              <Icon className="h-4 w-4" strokeWidth={1.5} aria-hidden />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{tooltipText}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          "group relative flex items-center gap-2.5",
          "h-8 px-2.5 rounded-md",
          "transition-colors duration-[var(--motion-fast)] ease-erp",
          active
            ? "bg-accent text-ink"
            : "text-ink-soft hover:bg-accent/40 hover:text-ink"
        )}
      >
        {active && (
          <span
            className="absolute left-0 top-1/4 bottom-1/4 w-[2px] rounded-r-full bg-primary"
            aria-hidden
          />
        )}
        <Icon
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-primary" : "text-ink-muted group-hover:text-ink-soft"
          )}
          strokeWidth={1.5}
        />
        <span className="text-[12px] font-medium flex-1 truncate">
          {item.label}
        </span>
        {showShortcut && item.shortcut && (
          <Kbd combo={item.shortcut} variant="subtle" size="sm" />
        )}
      </Link>
    </li>
  );
}
