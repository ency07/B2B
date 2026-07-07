/**
 * /dashboard — Reconstruido y restaurado según BLUEPRINT_ERP_REDESIGN.md §5.
 *
 * Estructura:
 * 1. SLA Alert bar (requirements con prioridad HIGH activas)
 * 2. Header con saludo personalizado (Buenos días, [User]) + Contexto de fecha/hora en mono.
 * 3. Hero Cash Pulse (outstanding cuentas por cobrar pendientes + sparkline + delta).
 * 4. Operations Health (4 anillos dinámicos SVG para Inventario, Compras, Facturación, CRM).
 * 5. Tu Cola de Hoy (checklist accionable interactiva de tareas pendientes).
 * 6. Pulse Feed (stream en tiempo real a partir de business_events de la base de datos).
 *
 * Visual: Lenguaje editorial de alto contraste, tipografía limpia, sin cards grises repetitivas.
 */

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  ArrowRight,
  Database,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  Briefcase,
  Percent,
} from "lucide-react";
import { Spinner } from "@/platform/ui/spinner";
import { getRequirements, type RequirementRow } from "@/erp/actions/requirements";
import { getDashboardCommandCenter, type DashboardCommandCenterData } from "@/erp/actions/dashboard";
import { getKpisForRole, type RoleDashboardData, type KpiValue, type PendingItem } from "@/erp/actions/kpis";
import { getBrandingDefaults } from "@/platform/branding/branding-defaults";
import { CashPulse } from "@/features/invoices/cash-pulse";
import { cn } from "@/platform/utils/cn";
import { getErpBrowserClient } from "@/platform/auth/clients";

const supabase = getErpBrowserClient();
import { getUserRole } from "@/platform/users/users";;
import { canSeeSection, type RoleName } from "@/lib/role-permissions";

// === Helpers de Formateo ===
const formatCop = (n: number, currency: "COP" | "USD" = "COP") => {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n / 4000);
  }
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
};

const timeAgo = (iso: string): string => {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = Math.max(0, now - d.getTime());
    const m = Math.floor(diff / 60000);
    if (m < 1) return "ahora";
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    const days = Math.floor(h / 24);
    return `${days}d`;
  } catch {
    return "—";
  }
};

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [currency, setCurrency] = React.useState<"COP" | "USD">("COP");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // === Dashboard Data State ===
  const [data, setData] = React.useState<DashboardCommandCenterData | null>(null);
  const [roleData, setRoleData] = React.useState<RoleDashboardData | null>(null);
  const [notificationCount, setNotificationCount] = React.useState(0);
  const [requirements, setRequirements] = React.useState<RequirementRow[]>([]);
  const [userName, setUserName] = React.useState("Administrador");
  const [currentDateStr, setCurrentDateStr] = React.useState("");

  // === Checkbox completed state (persistido en localStorage) ===
  const COMPLETED_TASKS_KEY = "dashboard.completedTasks";
  const [completedTasks, setCompletedTasks] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(COMPLETED_TASKS_KEY);
      if (raw) setCompletedTasks(JSON.parse(raw));
    } catch {
      // localStorage no disponible o JSON corrupto: ignorar.
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify(completedTasks));
    } catch {
      // Sin cuota o sin storage: ignorar.
    }
  }, [completedTasks]);

  // === Dynamic local date/time update ===
  React.useEffect(() => {
    const updateDateTime = () => {
      const date = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      // Format as: Lunes 29 de junio · 10:01 AM · Bogotá
      const formatted = date.toLocaleDateString("es-CO", options);
      setCurrentDateStr(
        formatted.replace(" a las ", " · ")
      );
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const [role, setRole] = React.useState<string | null>(null);

  // === Load Active User Session Name & Role ===
  React.useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("users")
            .select("first_name")
            .eq("auth_user_id", user.id)
            .maybeSingle();
          if (profile?.first_name) {
            setUserName(profile.first_name);
          }
          const userRole = await getUserRole(user.id);
          setRole(userRole || "ADMIN_EMPRESA");
        } else {
          setRole("ADMIN_EMPRESA");
        }
      } catch (err) {
        console.error("Error fetching session user:", err);
        setRole("ADMIN_EMPRESA");
      }
    }
    fetchUser();
  }, []);

  // === Load Command Center Data ===
  React.useEffect(() => {
    if (role === null) return; // Wait until role is fetched from auth session
    let cancelled = false;
    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const [dashData, reqsData, rd] = await Promise.all([
          getDashboardCommandCenter(tenantParam),
          getRequirements(tenantParam),
          getKpisForRole(tenantParam),
        ]);
        if (cancelled) return;

        setData(dashData);
        setRequirements(reqsData || []);
        setRoleData(rd);
        setNotificationCount(rd.notificationsCount);
      } catch (err) {
        console.error("Error loading command center:", err);
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error("Error desconocido"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [tenantParam, role]);

  // === SLA active high-priority requirements ===
  const criticalRequirements = React.useMemo(() => {
    return requirements
      .filter(
        (r) =>
          r.priority === "HIGH" &&
          r.status !== "COMPLETADO" &&
          r.status !== "CANCELADO"
      )
      .slice(0, 3);
  }, [requirements]);

  // === Role classification helpers ===
  const isAdminOrGerente = React.useMemo(() => {
    return (
      role === "SUPER_ADMIN" ||
      role === "ADMIN_EMPRESA" ||
      role === "GERENTE_GENERAL" ||
      role === "DIRECTOR_FINANCIERO" ||
      role === null
    );
  }, [role]);

  const isComercial = React.useMemo(() => {
    return (
      role === "DIRECTOR_COMERCIAL" ||
      role === "EJECUTIVO_COMERCIAL" ||
      role === "INGENIERO_COMERCIAL"
    );
  }, [role]);

  const isOperaciones = React.useMemo(() => {
    return (
      role === "DIRECTOR_OPERACIONES" ||
      role === "TECNICO_CAMPO" ||
      role === "JEFE_MANTENIMIENTO"
    );
  }, [role]);

  const isAlmacenista = React.useMemo(() => {
    return (
      role === "ALMACENISTA" ||
      role === "JEFE_INVENTARIO" ||
      role === "JEFE_COMPRAS"
    );
  }, [role]);

  const isAuditor = React.useMemo(() => role === "AUDITOR", [role]);

  // === Filter tasks and events by role ===
  const visibleTasks = React.useMemo(() => {
    if (!data || isAuditor) return [];
    return data.queueTasks.filter((task) => {
      if (task.id.startsWith("task-inv-")) {
        return isAdminOrGerente;
      }
      if (task.id.startsWith("task-req-")) {
        return isAdminOrGerente || isComercial || isOperaciones;
      }
      if (task.id.startsWith("task-job-")) {
        return isAdminOrGerente || isOperaciones;
      }
      if (task.id.startsWith("task-lead-")) {
        return isAdminOrGerente || isComercial;
      }
      return true;
    });
  }, [data, isAdminOrGerente, isComercial, isOperaciones, isAuditor]);

  // P4: Audit Log real desde la tabla audit_log (matriz RBAC: audit.view_tenant)
  // Filtrado por entity_type segun el rol del usuario.
  const visibleEvents = React.useMemo(() => {
    if (!data) return [];
    return data.auditLog.filter((ev) => {
      const et = ev.entityType.toUpperCase();
      const isFin = et.includes("INVOICE") || et.includes("PAYMENT");
      const isCrm =
        et.includes("LEAD") || et.includes("QUOTE") || et.includes("CLIENT");
      const isOps = et.includes("JOB") || et.includes("OT");
      const isInv = et.includes("INVENTORY") || et.includes("ITEM");

      // Administrador y Director (control global / ejecutivo) ven todo.
      if (isAdminOrGerente) return true;
      // Auditor (audit.view_tenant) ve todo lo registrado.
      if (isAuditor) return true;
      // Comercial ve eventos CRM.
      if (isCrm) return isComercial;
      // Operaciones ve eventos operativos (jobs) y de inventario.
      if (isOps || isInv) return isOperaciones;
      // Almacenista ve inventario.
      if (isInv) return isAlmacenista;
      // Financiero (facturas / pagos) sin rol explicito: solo Director/Admin/Auditor.
      if (isFin) return false;
      // Resto: oculto si no es admin/gerente/auditor.
      return false;
    });
  }, [data, isAdminOrGerente, isComercial, isOperaciones, isAlmacenista, isAuditor]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* === PANEL DE ALERTAS CRÍTICAS === */}
      {!loading && roleData && roleData.notifications && roleData.notifications.length > 0 && canSeeSection(role, "sla_bar") && (
        <AlertsPanel notifications={roleData.notifications} tenantParam={tenantParam} />
      )}

      {/* === COMMAND CENTER SALUDO + HEADER === */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-line pb-5">
        <div>
          <p className="text-xs text-ink-muted mb-1">
            Buenos días, {userName}.
          </p>
          <p className="text-[10px] text-ink-soft font-mono uppercase tracking-wider">
            {currentDateStr || "Cargando fecha..."}
          </p>
        </div>
        {canSeeSection(role, "currency_switcher") && (
          <CurrencySwitcher value={currency} onChange={setCurrency} />
        )}
      </div>

      {/* === LOADING / ERROR STATE === */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Spinner className="text-ink-muted w-6 h-6 mb-2" />
          <span className="text-[10px] uppercase font-mono tracking-widest text-ink-muted">
            Cargando Command Center...
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-lg border border-state-danger/30 bg-state-danger/5 text-[12px] text-state-danger">
          Error al cargar Command Center. {error.message}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {/* === HERO CASH PULSE (solo si outstanding > 0 y el rol lo ve) === */}
          {data.outstanding > 0 && canSeeSection(role, "cash_pulse") && (
            <CashPulse
              outstanding={data.outstanding}
              delta={data.delta}
              sparkline={data.sparkline}
              invoiceCount={data.invoiceCount}
              hasOverdue={data.hasOverdue}
              hasDueSoon={data.hasDueSoon}
              onPay={() => router.push(`/dashboard/invoices${tenantParam ? `?tenant=${tenantParam}` : ""}`)}
              onDownload={() => window.print()}
            />
          )}

          {/* === KPIs ROLE-ADAPTIVE (4 cards especificos del rol) === */}
          {roleData && roleData.kpis.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {roleData.kpis.map((kpi) => {
                const variant = kpi.variant || "neutral";
                const variantClasses: Record<string, string> = {
                  success: "border-state-success/30 bg-state-success/5",
                  info: "border-state-info/30 bg-state-info/5",
                  warning: "border-state-warning/30 bg-state-warning/5",
                  danger: "border-state-danger/30 bg-state-danger/5",
                  neutral: "border-line",
                };
                const cardContent = (
                  <div
                    key={kpi.id}
                    className={cn(
                      "p-5 rounded-lg border",
                      kpi.link && "hover:shadow-md cursor-pointer transition-all",
                      variantClasses[variant] || variantClasses.neutral
                    )}
                  >
                    <p className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-widest mb-2 line-clamp-2 break-words">
                      {kpi.label}
                    </p>
                    <p
                      className={cn(
                        "text-[24px] font-bold leading-none tracking-tight font-mono break-words",
                        variant === "success" && "text-state-success",
                        variant === "info" && "text-state-info",
                        variant === "warning" && "text-state-warning",
                        variant === "danger" && "text-state-danger",
                        variant === "neutral" && "text-ink"
                      )}
                    >
                      {kpi.value}
                    </p>
                    {kpi.sub && (
                      <p className="text-[11px] text-ink-muted mt-2 font-mono line-clamp-2 break-words">
                        {kpi.sub}
                      </p>
                    )}
                  </div>
                );
                
                if (kpi.link) {
                  return (
                    <Link key={kpi.id} href={`${kpi.link}${tenantParam ? `?tenant=${tenantParam}` : ""}`}>
                      {cardContent}
                    </Link>
                  );
                }
                
                return cardContent;
              })}
            </div>
          )}

          {/* === 70/30 ASYMMETRIC GRID === */}
          {(canSeeSection(role, "operations_health") ||
            canSeeSection(role, "to_do_queue") ||
            canSeeSection(role, "audit_log")) && (
          <div className="grid gap-6 lg:grid-cols-10">
            {/* === LEFT RAIL: Operations & Tasks (70%) === */}
            <div className="lg:col-span-7 space-y-6">

              {/* OPERATIONS HEALTH */}
              {canSeeSection(role, "operations_health") && (
                <section className="border border-line rounded-lg bg-bg-elevated-1 p-5 space-y-4">
                  <div>
                    <h3 className="text-[12px] font-mono font-bold text-ink uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" strokeWidth={1.5} />
                      Operations Health
                    </h3>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      Estado operativo de los departamentos principales en tiempo real.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                    {(isAdminOrGerente || isOperaciones || isAlmacenista) && (
                      <HealthRing
                        label="Inventario"
                        sub="Salud"
                        score={data.operationsHealth.inventory.score}
                        alerts={data.operationsHealth.inventory.alerts}
                        alertLabel="bajos"
                        onClick={() => router.push(`/dashboard/inventory${tenantParam ? `?tenant=${tenantParam}` : ""}`)}
                      />
                    )}
                    {(isAdminOrGerente || isComercial || isOperaciones || isAlmacenista) && (
                      <HealthRing
                        label="Compras"
                        sub="Flujo"
                        score={data.operationsHealth.purchases.score}
                        alerts={data.operationsHealth.purchases.alerts}
                        alertLabel="pendientes"
                        onClick={() => router.push(`/dashboard/purchases${tenantParam ? `?tenant=${tenantParam}` : ""}`)}
                      />
                    )}
                    {isAdminOrGerente && (
                      <HealthRing
                        label="Facturación"
                        sub="Cobro"
                        score={data.operationsHealth.billing.score}
                        alerts={data.operationsHealth.billing.alerts}
                        alertLabel="vencidas"
                        onClick={() => router.push(`/dashboard/invoices${tenantParam ? `?tenant=${tenantParam}` : ""}`)}
                      />
                    )}
                    {(isAdminOrGerente || isComercial) && (
                      <HealthRing
                        label="CRM"
                        sub="Pipe"
                        score={data.operationsHealth.crm.score}
                        alerts={data.operationsHealth.crm.alerts}
                        alertLabel="nuevos"
                        onClick={() => router.push(`/dashboard/leads${tenantParam ? `?tenant=${tenantParam}` : ""}`)}
                      />
                    )}
                  </div>
                </section>
              )}

              {/* TO-DO QUEUE (HOY EN TU COLA) — items role-adaptive */}
              {canSeeSection(role, "to_do_queue") &&
                roleData &&
                roleData.pending.length > 0 && (
                  <section className="border border-line rounded-lg bg-bg-elevated-1 overflow-hidden">
                    <div className="p-4 border-b border-line flex justify-between items-center bg-bg-elevated-1">
                      <div>
                        <h3 className="text-[12px] font-mono font-bold text-ink uppercase tracking-widest">
                          {roleData.queueTitle}
                        </h3>
                        <p className="text-[11px] text-ink-muted mt-0.5">
                          {roleData.queueSubtitle}
                        </p>
                      </div>
                      <span className="text-[10px] font-mono text-ink-muted uppercase tracking-widest bg-bg-base border border-line px-2 py-0.5 rounded">
                        {roleData.pending.length} pendientes
                      </span>
                    </div>

                    <div className="divide-y divide-line">
                      {roleData.pending.map((task) => {
                        const isDone = completedTasks[task.id];
                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "p-3.5 flex items-center justify-between gap-4 hover:bg-accent/10 transition-colors",
                              isDone && "opacity-50"
                            )}
                          >
                            <div className="flex items-center gap-3 flex-grow min-w-0">
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full shrink-0",
                                  task.isOverdue
                                    ? "bg-state-danger animate-pulse"
                                    : "bg-state-warning"
                                )}
                              />
                              <p
                                className="text-[12px] font-medium text-ink leading-normal truncate"
                              >
                                {task.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 shrink-0 font-mono text-[11px]">
                              {task.value && (
                                <span className="text-ink font-semibold">
                                  {task.value}
                                </span>
                              )}
                              <span
                                className={cn(
                                  "text-ink-muted px-1.5 py-0.5 rounded bg-bg-base border border-line text-[9px] uppercase font-bold tracking-wider",
                                  task.isOverdue &&
                                    "text-state-danger border-state-danger/20 bg-state-danger/5"
                                )}
                              >
                                {task.deadline}
                              </span>
                              <Link
                                href={`${task.link}${tenantParam ? `?tenant=${tenantParam}` : ""}`}
                                className="text-ink-muted hover:text-ink p-1 rounded hover:bg-bg-base transition-colors"
                                aria-label="Abrir"
                              >
                                <ArrowRight
                                  className="w-3.5 h-3.5"
                                  strokeWidth={1.5}
                                />
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
            </div>

            {/* === RIGHT RAIL: Live Activity Audit Feed (30%) === */}
            {canSeeSection(role, "audit_log") && (
            <div className="lg:col-span-3">
              <section className="border border-line rounded-lg bg-bg-elevated-1 p-4 space-y-4 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-[12px] font-mono font-bold text-ink uppercase tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-state-success animate-ping shrink-0" />
                      Pulse Feed
                    </h3>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      Stream inmutable de eventos operacionales del tenant.
                    </p>
                  </div>

                  {visibleEvents.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-[12px] text-ink-muted">Sin actividad reciente.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto scroll-smooth pr-1">
                      {visibleEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3 rounded-md bg-bg-base border border-line space-y-1.5 hover:border-line-strong transition-colors"
                        >
                          <div className="flex justify-between items-center border-b border-line pb-1.5">
                            <span className="font-bold font-sans text-xs text-primary flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {ev.eventCode}
                            </span>
                            <span className="font-mono text-ink-muted text-[9px]">{timeAgo(ev.createdAt)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-ink-soft">
                            <span className="font-mono text-[10px]">
                              {ev.entityType}
                              {ev.action && <span className="text-ink-muted"> · {ev.action}</span>}
                            </span>
                          </div>
                          {ev.userName && (
                            <p className="text-ink-muted text-[10px] truncate font-mono">
                              {ev.userName}
                            </p>
                          )}
                        </div>
                      ))}
                      <div className="pt-2 text-center">
                        <button className="text-xs text-primary hover:underline font-medium cursor-pointer transition-all">
                          Ver todos los eventos &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-line text-center flex items-center justify-center gap-2 text-[9px] text-ink-muted font-mono tracking-wider">
                  <Database className="w-3.5 h-3.5 text-state-success" strokeWidth={1.5} />
                  LOGS DE AUDITORÍA CONECTADOS
                </div>
              </section>
            </div>
            )}
          </div>
          )}
        </>
      )}
    </div>
  );
}

// === PANEL DE ALERTAS CRÍTICAS ===
function AlertsPanel({ notifications, tenantParam }: { notifications: any[]; tenantParam: string | null }) {
  if (!notifications || notifications.length === 0) return null;

  const hasDanger = notifications.some((n) => n.isDanger);

  return (
    <div
      className={cn(
        "border rounded-lg p-4 space-y-3 depth-1 animate-in fade-in duration-300",
        hasDanger
          ? "border-state-danger/25 bg-state-danger/5 text-state-danger"
          : "border-state-warning/25 bg-state-warning/5 text-state-warning"
      )}
    >
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <AlertCircle className={cn("w-4 h-4 shrink-0", hasDanger ? "text-state-danger animate-pulse" : "text-state-warning")} strokeWidth={1.5} />
        <h2 className="text-[11px] font-mono font-bold text-ink uppercase tracking-wider">
          Panel de Alertas y Control Crítico
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {notifications.map((item) => (
          <Link
            key={item.id}
            href={`${item.link}${tenantParam ? `?tenant=${tenantParam}` : ""}`}
            className="flex items-start gap-2.5 p-2.5 rounded border border-line bg-bg-elevated-1 text-ink hover:border-line-strong hover:bg-accent/5 transition-all group"
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full shrink-0 mt-1.5",
                item.isDanger ? "bg-state-danger animate-pulse" : "bg-state-warning"
              )}
            />
            <div className="space-y-1 min-w-0">
              <span className="text-[10px] font-mono font-bold text-ink-muted uppercase tracking-wider block group-hover:text-primary transition-colors">
                {item.title}
              </span>
              <p className="text-[11px] text-ink-soft leading-normal break-words font-mono">
                {item.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// === CURRENCY SWITCHER ===
function CurrencySwitcher({
  value,
  onChange,
}: {
  value: "COP" | "USD";
  onChange: (c: "COP" | "USD") => void;
}) {
  return (
    <div className="inline-flex items-center bg-bg-elevated-1 border border-line rounded-lg p-0.5">
      {(["COP", "USD"] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "px-3 py-1.5 text-[9px] uppercase tracking-widest font-mono font-semibold rounded-md transition-colors cursor-pointer",
            value === c
              ? "bg-primary text-primary-foreground font-bold"
              : "text-ink-muted hover:text-ink"
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

// === OPERATIONS HEALTH RING COMPONENT ===
interface HealthRingProps {
  label: string;
  sub: string;
  score: number;
  alerts: number;
  alertLabel: string;
  onClick?: () => void;
}

function HealthRing({ label, sub, score, alerts, alertLabel, onClick }: HealthRingProps) {
  // SVG Calculations
  const radius = 15.9155;
  const strokeDash = `${score}, 100`;

  return (
    <div
      onClick={onClick}
      className="p-4 rounded-lg border border-line bg-bg-base/50 hover:border-line-strong transition-all flex flex-col items-center text-center cursor-pointer select-none"
    >
      <div className="relative flex items-center justify-center w-16 h-16 mb-3">
        {score === 0 ? (
          <div className="flex flex-col items-center justify-center h-full w-full bg-accent/30 rounded-full border border-dashed border-border">
            <span className="text-[9px] font-mono font-bold text-ink-muted text-center px-2 leading-tight">
              Faltan<br />Datos
            </span>
          </div>
        ) : (
          <>
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 36 36"
              role="img"
              aria-label={`${label}: ${score}%`}
            >
              <title>{`${label}: ${score}%`}</title>
              <circle
                cx="18"
                cy="18"
                r={radius}
                fill="none"
                className="stroke-line"
                strokeWidth="2.5"
              />
              <circle
                cx="18"
                cy="18"
                r={radius}
                fill="none"
                className={cn(
                  "transition-all duration-500 ease-in-out",
                  score >= 90
                    ? "stroke-state-success"
                    : score >= 70
                    ? "stroke-state-info"
                    : score >= 45
                    ? "stroke-state-warning"
                    : "stroke-state-danger"
                )}
                strokeWidth="2.5"
                strokeDasharray={strokeDash}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute font-mono text-[12px] font-bold text-ink">
              {score}%
            </span>
          </>
        )}
      </div>

      <h4 className="text-[12px] font-bold text-ink leading-tight">{label}</h4>
      <span className="text-[10px] text-ink-muted font-mono uppercase mt-0.5 tracking-wider">
        {sub}
      </span>
      <div className="flex items-center gap-1.5 mt-2">
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            alerts > 0
              ? alerts >= 5
                ? "bg-state-danger animate-pulse"
                : "bg-state-warning"
              : "bg-state-success"
          )}
        />
        <span className="text-[9px] font-mono text-ink-muted uppercase">
          {alerts === 0 ? "Sin alertas" : `${alerts} ${alertLabel}`}
        </span>
      </div>
    </div>
  );
}

// === EVENT DESCRIPTION FORMATTER ===
function formatEventDescription(eventCode: string, payload: any): string {
  try {
    switch (eventCode) {
      case "CLIENT_CREATED":
        return `Registrado prospecto: ${payload.legal_name || "Cliente nuevo"}`;
      case "REQUIREMENT_CREATED":
        return `Registrado requerimiento: ${payload.requirement_code || "REQ-..."}`;
      case "QUOTE_CREATED":
        return `Generada cotización: ${payload.quote_code || "COT-..."}`;
      case "JOB_COMPLETED":
        return `Finalizado trabajo: ${payload.job_code || "OT-..."}`;
      case "INVOICE_CREATED":
        return `Creada factura ${payload.invoice_code || "FAC-..."}`;
      case "INVOICE_EMITTED":
        return `Emitida factura ${payload.invoice_code || "FAC-..."}`;
      case "PAYMENT_REGISTERED":
        return `Registrado cobro para factura ${payload.invoice_code || "FAC-..."}`;
      case "INVOICE_PAID":
        return `Factura ${payload.invoice_code || "FAC-..."} pagada completamente`;
      case "JOB_ACTIVITY_CREATED":
        return `Actividad de OT: ${payload.title || "Tarea realizada"}`;
      case "INVENTORY_ITEM_CREATED":
        return `Registrado SKU: ${payload.item_code || "SKU-..."}`;
      case "CONTACT_CREATED":
        return `Creado contacto: ${payload.first_name || "Contacto"}`;
      default:
        return eventCode.replace(/_/g, " ").toLowerCase();
    }
  } catch {
    return eventCode;
  }
}
