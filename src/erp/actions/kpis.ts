"use server";
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * KPIs y "Pending" especificos por rol (P8 - dashboard role-adaptive).
 *
 * Cada rol ve:
 *  - 4 KPIs relevantes a sus funciones (no genericos).
 *  - Items "Pending" = cosas que necesitan su atencion ahora.
 *
 * Esto reemplaza los 4 KPIs hardcoded del dashboard original que
 * eran los mismos para todos los roles. Ahora el dashboard es
 * role-adaptive y muestra informacion relevante por rol.
 *
 * Las queries usan supabaseAdmin directamente para evitar la cantidad
 * de acciones separadas. Esto es seguro: el RLS se bypasa solo del
 * lado del servidor y los datos siguen filtrados por tenant_id.
 */

import { ROUTES } from "@/lib/routes";

import { supabaseAdmin } from "@/platform/auth/clients";
import { getTenantId } from "@/erp/actions/core";
import { getAuthContext, validateTenantAccess } from "@/platform/auth/server-guards";

export interface KpiValue {
  id: string;
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  variant?: "success" | "info" | "warning" | "danger" | "neutral";
  link?: string;
}

export interface PendingItem {
  id: string;
  description: string;
  value?: string | null;
  deadline: string;
  isOverdue: boolean;
  link: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  link: string;
  isDanger: boolean;
}

export interface RoleDashboardData {
  kpis: KpiValue[];
  pending: PendingItem[];
  queueTitle: string;
  queueSubtitle: string;
  /** Texto que se muestra en el bell de notificaciones (top bar). */
  notificationsTitle: string;
  notificationsCount: number;
  notifications?: NotificationItem[];
}

const COPIED = 0;

function formatCop(n: number): string {
  if (COPIED > 0) return ""; // placeholder, never used
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

function daysSince(iso: string): number {
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function startOfMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().substring(0, 10);
}

function startOfWeekIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().substring(0, 10);
}

/**
 * Resuelve el rol a una categoria de dashboard. Los aliases del seed
 * (SUPER_ADMIN, ADMIN_EMPRESA, etc) se mapean a una categoria.
 */
function resolveCategory(role: string | null): string {
  if (!role) return "default";
  const r = role.toUpperCase();
  if (r === "SUPER_ADMIN" || r === "ADMIN_EMPRESA" || r === "ADMIN_DEV") return "admin";
  if (r === "GERENTE_GENERAL" || r === "DIRECTOR_FINANCIERO" || r === "JEFE_FINANZAS" || r === "AUXILIAR_FINANZAS") return "director";
  if (r === "DIRECTOR_COMERCIAL" || r === "EJECUTIVO_COMERCIAL" || r === "INGENIERO_COMERCIAL") return "comercial";
  if (r === "DIRECTOR_OPERACIONES" || r === "JEFE_PROYECTOS") return "operaciones";
  if (r === "TECNICO_CAMPO" || r === "JEFE_MANTENIMIENTO") return "tecnico";
  if (r === "ALMACENISTA" || r === "JEFE_INVENTARIO") return "almacenista";
  if (r === "AUDITOR") return "auditor";
  return "default";
}

export async function getKpisForRole(
  tenantCode: string | null
): Promise<RoleDashboardData> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);
  const role = ctx.role;
  const cat = resolveCategory(role);
  const startMonth = startOfMonthIso();
  const startWeek = startOfWeekIso();
  const today = new Date().toISOString().substring(0, 10);

  // Query base: invoices, leads, jobs, stock, audit, quotes.
  // Cada una se filtra por tenant_id (multi-tenancy seguro).
  const [inv, leads, jobs, stock, audit, quotes, requirements] = await Promise.all([
    supabaseAdmin
      .from("invoices")
      .select("id, invoice_code, total_amount, paid_amount, balance_amount, status, invoice_date, due_date, client_id")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabaseAdmin
      .from("leads")
      .select("id, lead_code, status, risk_level, created_at, client_id, company_name")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabaseAdmin
      .from("jobs")
      .select("id, job_code, title, description, status, priority, planned_end_date, assigned_user_id, created_at, client_id")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabaseAdmin
      .from("inventory_stock")
      .select("id, available_quantity, reserved_quantity, item_id, warehouse_id, inventory_items(name, item_code, minimum_stock)")
      .eq("tenant_id", tenantId),
    supabaseAdmin
      .from("audit_log")
      .select("id, event_code, entity_type, action, created_at, user_id")
      .eq("tenant_id", tenantId)
      .gte("created_at", startWeek),
    supabaseAdmin
      .from("quotes")
      .select("id, quote_code, status, total_amount")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
    supabaseAdmin
      .from("requirements")
      .select("id, requirement_code, title, priority, status, client_id")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null),
  ]);

  // Aggregations por categoria.
  const validInv = (inv.data || []).filter(Boolean);
  const validLeads = (leads.data || []).filter(Boolean);
  const validJobs = (jobs.data || []).filter(Boolean);
  const validStock = (stock.data || []).filter(Boolean);
  const validAudit = (audit.data || []).filter(Boolean);
  const validQuotes = (quotes.data || []).filter(Boolean);
  const validReqs = (requirements.data || []).filter(Boolean);

  // KPIs segun categoria.
  let kpis: KpiValue[] = [];
  let pending: PendingItem[] = [];
  let queueTitle = "Hoy en tu Cola";
  let queueSubtitle = "Tareas operativas pendientes ordenadas por urgencia.";
  let notificationsTitle = "Notificaciones";
  let notificationsCount = 0;
  let notifications: NotificationItem[] = [];

  // Compilación dinámica de Alertas/Notificaciones transversales basadas en la DB
  // 1. Facturas vencidas
  const overdueInvsList = validInv.filter(
    (i: any) => i.status === "VENCIDA" || (i.due_date && i.due_date < today && i.status !== "PAGADA")
  );
  const invoiceNotifs: NotificationItem[] = overdueInvsList.map((i: any) => ({
    id: `notif-inv-${i.id}`,
    title: "Factura Vencida",
    description: `Factura ${i.invoice_code} pendiente de cobro (${formatCop(Number(i.balance_amount || 0))}).`,
    link: "/dashboard/invoices",
    isDanger: true,
  }));

  // 2. Alertas de inventario stock bajo (usa minimum_stock por item)
  const lowStockList = validStock.filter((s: any) => {
    const item = Array.isArray(s.inventory_items) ? s.inventory_items[0] : s.inventory_items;
    const minStock = Number(item?.minimum_stock ?? 0);
    return Number(s.available_quantity) <= minStock;
  });
  const stockNotifs: NotificationItem[] = lowStockList.map((s: any) => {
    const item = Array.isArray(s.inventory_items) ? s.inventory_items[0] : s.inventory_items;
    const qty = Number(s.available_quantity);
    return {
      id: `notif-stock-${s.id}`,
      title: "Stock de Insumos Bajo",
      description: `${item?.name || "Componente"} (${item?.item_code || "SKU"}) por debajo del inventario de seguridad (${qty} disp.).`,
      link: "/dashboard/inventory",
      isDanger: qty <= 0,
    };
  });

  // 3. OTs Críticas o Vencidas
  const criticalJobsList = validJobs.filter(
    (j: any) =>
      (j.priority === "HIGH" || j.priority === "ALTA" || (j.planned_end_date && j.planned_end_date < today)) &&
      j.status !== "COMPLETADA" &&
      j.status !== "CANCELADA"
  );
  const jobNotifs: NotificationItem[] = criticalJobsList.map((j: any) => {
    const isOverdue = j.planned_end_date && j.planned_end_date < today;
    return {
      id: `notif-job-${j.id}`,
      title: isOverdue ? "OT Vencida" : "OT Crítica",
      description: `${j.job_code}: ${j.title || "Mantenimiento"} requiere balanceo y pruebas en planta.`,
      link: "/dashboard/jobs",
      isDanger: isOverdue || j.priority === "HIGH",
    };
  });

  // 4. Requerimientos críticos
  const criticalReqsList = validReqs.filter(
    (r: any) => r.priority === "HIGH" && r.status !== "COMPLETADO" && r.status !== "CANCELADO"
  );
  const reqNotifs: NotificationItem[] = criticalReqsList.map((r: any) => ({
    id: `notif-req-${r.id}`,
    title: "Requerimiento Crítico",
    description: `SLA comprometido en ${r.requirement_code}: ${r.title}.`,
    link: "/dashboard/requirements",
    isDanger: true,
  }));

  // 5. Leads calientes
  const hotLeadsList = validLeads.filter((l: any) => l.risk_level === "CALIENTE" && l.status !== "CERRADO_CONVERTIDO" && l.status !== "CONVERTIDO");
  const leadNotifs: NotificationItem[] = hotLeadsList.map((l: any) => ({
    id: `notif-lead-${l.id}`,
    title: "Prospecto Caliente",
    description: `Lead ${l.lead_code || "CRM"}: ${l.company_name || "Cliente"} requiere cotización prioritaria.`,
    link: "/dashboard/leads",
    isDanger: false,
  }));

  if (cat === "admin" || cat === "director") {
    // Vista global ejecutiva: KPIs adaptados a la imagen adjunta
    const totalInvoiced = validInv
      .filter((i: any) => i.status !== "ANULADA")
      .reduce((s: number, i: any) => s + Number(i.total_amount || 0), 0);
    const totalPaid = validInv
      .filter((i: any) => i.status !== "ANULADA")
      .reduce((s: number, i: any) => s + Number(i.paid_amount || 0), 0);
    
    // OTs activas (PENDIENTE o EN_EJECUCION / EN_PROGRESO)
    const activeJobsCount = validJobs.filter(
      (j: any) => j.status === "EN_EJECUCION" || j.status === "EN_PROGRESO" || j.status === "PENDIENTE"
    ).length;

    // Ensamble pendientes: OTs que contienen la palabra ensamble y no están terminadas
    const pendingEnsembleCount = validJobs.filter(
      (j: any) =>
        (j.status === "EN_EJECUCION" || j.status === "EN_PROGRESO" || j.status === "PENDIENTE") &&
        (j.title?.toUpperCase().includes("ENSAMBLE") || j.description?.toUpperCase().includes("ENSAMBLE"))
    ).length;

    // Conversión Leads: leads convertidos vs total leads
    const totalLeadsCount = validLeads.length;
    const convertedLeadsCount = validLeads.filter(
      (l: any) => l.status === "CERRADO_CONVERTIDO" || l.status === "CONVERTIDO"
    ).length;
    const conversionRate = totalLeadsCount > 0 ? (convertedLeadsCount / totalLeadsCount) * 100 : 0;

    // Cotizaciones aprobadas
    const approvedQuotesCount = validQuotes.filter((q: any) => q.status === "APROBADA").length;

    kpis = [
      { id: "fact", label: "Facturación Emitida", value: formatCop(totalInvoiced), trend: "up", link: "/dashboard/invoices" },
      { id: "rec", label: "Recaudo Cartera", value: formatCop(totalPaid), sub: totalInvoiced > 0 ? `${((totalPaid / totalInvoiced) * 100).toFixed(1)}% tasa de cobro` : undefined, link: "/dashboard/invoices" },
      { id: "cap_activa", label: "Capacidad Activa", value: `${activeJobsCount} OTs`, sub: `ENSAMBLE: ${pendingEnsembleCount} PENDIENTES`, variant: pendingEnsembleCount > 0 ? "warning" : "success", link: "/dashboard/jobs" },
      { id: "conv_leads", label: "Conversión Leads", value: `${conversionRate.toFixed(1)}%`, sub: `COTIZACIONES: ${approvedQuotesCount} APROBADAS`, variant: conversionRate >= 90 ? "success" : "info", link: "/dashboard/leads" },
    ];

    pending = [
      ...validInv
        .filter((i: any) => i.status === "VENCIDA")
        .slice(0, 3)
        .map((i: any) => ({
          id: `task-inv-${i.id}`,
          description: `Gestionar cobro de ${i.invoice_code}`,
          value: formatCop(Number(i.total_amount || 0) - Number(i.paid_amount || 0)),
          deadline: "Vencida",
          isOverdue: true,
          link: "/dashboard/invoices",
        })),
    ];

    notificationsTitle = "Alertas Operativas";
    notifications = [...invoiceNotifs, ...stockNotifs, ...jobNotifs, ...reqNotifs];
    notificationsCount = notifications.length;
  } else if (cat === "comercial") {
    // Vista CRM + preventa.
    const activeLeads = validLeads.filter(
      (l: any) => l.status !== "CERRADO_CONVERTIDO" && l.status !== "CONVERTIDO" && l.status !== "RECHAZADO"
    );
    const newLeadsThisMonth = validLeads.filter(
      (l: any) => l.created_at && l.created_at >= startMonth
    );
    const totalLeads = validLeads.length;
    const converted = validLeads.filter((l: any) => l.status === "CERRADO_CONVERTIDO" || l.status === "CONVERTIDO").length;
    const rate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : "0.0";
    const hot = validLeads.filter((l: any) => l.risk_level === "CALIENTE" && l.status !== "CERRADO_CONVERTIDO" && l.status !== "CONVERTIDO").length;
    kpis = [
      { id: "leads", label: "Leads Activos", value: `${activeLeads.length}`, link: "/dashboard/leads" },
      { id: "hot", label: "Leads Calientes", value: `${hot}`, variant: hot > 0 ? "warning" : "neutral", link: "/dashboard/leads" },
      { id: "new", label: "Leads Nuevos (mes)", value: `${newLeadsThisMonth.length}`, link: "/dashboard/leads" },
      { id: "conv", label: "Tasa de Conversion", value: `${rate}%`, sub: `${converted} de ${totalLeads}`, link: "/dashboard/leads" },
    ];
    pending = [
      ...validLeads
        .filter((l: any) => l.risk_level === "CALIENTE" && l.status !== "CERRADO_CONVERTIDO" && l.status !== "CONVERTIDO")
        .slice(0, 4)
        .map((l: any) => ({
          id: `task-lead-${l.id}`,
          description: `Calificar lead ${l.company_name || l.lead_code}`,
          value: null,
          deadline: l.created_at ? `Hace ${daysSince(l.created_at)}d` : "—",
          isOverdue: daysSince(l.created_at) > 7,
          link: "/dashboard/leads",
        })),
    ];
    queueTitle = "Leads por atender";
    queueSubtitle = "Ordenados por temperatura y antiguedad.";
    notificationsTitle = "Leads calientes";
    notifications = [...leadNotifs];
    notificationsCount = notifications.length;
  } else if (cat === "operaciones") {
    // Vista operaciones: OTs.
    const active = validJobs.filter(
      (j: any) => j.status === "EN_EJECUCION" || j.status === "EN_PROGRESO" || j.status === "PENDIENTE"
    );
    const overdue = validJobs.filter(
      (j: any) =>
        j.planned_end_date &&
        j.planned_end_date < today &&
        j.status !== "COMPLETADA" &&
        j.status !== "CANCELADA"
    );
    // Calculo correcto: proximos 7 dias.
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .substring(0, 10);
    const dueNext7 = validJobs.filter(
      (j: any) =>
        j.planned_end_date &&
        j.planned_end_date >= today &&
        j.planned_end_date <= sevenDaysFromNow &&
        j.status !== "COMPLETADA" &&
        j.status !== "CANCELADA"
    );
    const completed = validJobs.filter((j: any) => j.status === "COMPLETADA");
    kpis = [
      { id: "act", label: "OTs Activas", value: `${active.length}`, link: "/dashboard/jobs" },
      { id: "venc", label: "OTs Vencidas", value: `${overdue.length}`, variant: overdue.length > 0 ? "danger" : "success", link: "/dashboard/jobs" },
      { id: "week", label: "Vencen esta semana", value: `${dueNext7.length}`, variant: dueNext7.length > 0 ? "warning" : "neutral", link: "/dashboard/jobs" },
      { id: "comp", label: "OTs Completadas", value: `${completed.length}`, link: "/dashboard/jobs" },
    ];
    pending = [
      ...overdue.slice(0, 4).map((j: any) => ({
        id: `task-job-${j.id}`,
        description: `OT vencida ${j.job_code} (${j.priority})`,
        value: null,
        deadline: j.planned_end_date || "—",
        isOverdue: true,
        link: "/dashboard/jobs",
      })),
    ];
    queueTitle = "OTs por atender";
    queueSubtitle = "Vencidas y proximas a vencer, ordenadas por urgencia.";
    notificationsTitle = "OTs vencidas";
    notifications = [...jobNotifs, ...reqNotifs];
    notificationsCount = notifications.length;
  } else if (cat === "tecnico") {
    // Vista tecnico: OTs asignadas
    const active = validJobs.filter(
      (j: any) => j.status === "EN_EJECUCION" || j.status === "EN_PROGRESO" || j.status === "PENDIENTE"
    );
    const overdue = validJobs.filter(
      (j: any) =>
        j.planned_end_date &&
        j.planned_end_date < today &&
        j.status !== "COMPLETADA" &&
        j.status !== "CANCELADA"
    );
    const todayJobs = validJobs.filter(
      (j: any) => j.planned_end_date && j.planned_end_date === today
    );
    kpis = [
      { id: "act", label: "OTs Activas", value: `${active.length}`, link: "/dashboard/jobs" },
      { id: "venc", label: "OTs Vencidas", value: `${overdue.length}`, variant: overdue.length > 0 ? "danger" : "success", link: "/dashboard/jobs" },
      { id: "today", label: "Vencen Hoy", value: `${todayJobs.length}`, variant: todayJobs.length > 0 ? "warning" : "neutral", link: "/dashboard/jobs" },
      { id: "low", label: "Prioridad Alta", value: `${active.filter((j: any) => j.priority === "HIGH" || j.priority === "ALTA").length}`, link: "/dashboard/jobs" },
    ];
    pending = [
      ...overdue.slice(0, 4).map((j: any) => ({
        id: `task-job-${j.id}`,
        description: `OT ${j.job_code} vencida`,
        value: null,
        deadline: j.planned_end_date || "—",
        isOverdue: true,
        link: "/dashboard/jobs",
      })),
      ...todayJobs.slice(0, 2).map((j: any) => ({
        id: `task-job-today-${j.id}`,
        description: `OT ${j.job_code} vence hoy`,
        value: null,
        deadline: "Hoy",
        isOverdue: false,
        link: "/dashboard/jobs",
      })),
    ];
    queueTitle = "Mis OTs";
    queueSubtitle = "Vencidas y de hoy, ordenadas por prioridad.";
    notificationsTitle = "OTs vencidas";
    notifications = [...jobNotifs];
    notificationsCount = notifications.length;
  } else if (cat === "almacenista") {
    // Vista almacen: stock bajo y movimientos (usa minimum_stock por item).
    const lowStock = validStock.filter((s: any) => {
      const item = Array.isArray(s.inventory_items) ? s.inventory_items[0] : s.inventory_items;
      const minStock = Number(item?.minimum_stock ?? 0);
      return Number(s.available_quantity) <= minStock;
    });
    const reserved = validStock.reduce(
      (sum: number, s: any) => sum + Number(s.reserved_quantity || 0), 0
    );
    kpis = [
      { id: "low", label: "Items Stock Bajo", value: `${lowStock.length}`, variant: lowStock.length > 0 ? "warning" : "success", link: "/dashboard/inventory" },
      { id: "total", label: "Items en Stock", value: `${validStock.length}`, link: "/dashboard/inventory" },
      { id: "res", label: "Unidades Reservadas", value: `${reserved}`, link: "/dashboard/inventory" },
      { id: "ok", label: "Items OK", value: `${validStock.length - lowStock.length}`, link: "/dashboard/inventory" },
    ];
    pending = lowStock.slice(0, 4).map((s: any) => {
      const item = Array.isArray(s.inventory_items)
        ? s.inventory_items[0]
        : s.inventory_items;
      return {
        id: `task-inv-${s.id}`,
        description: `Reordenar ${item?.name || "item"} (${item?.item_code || "?"})`,
        value: `${s.available_quantity} disponibles`,
        deadline: "Stock bajo",
        isOverdue: s.available_quantity <= 0,
        link: "/dashboard/inventory",
      };
    });
    queueTitle = "Reordenes pendientes";
    queueSubtitle = "Items con stock bajo o en cero.";
    notificationsTitle = "Stock bajo";
    notifications = [...stockNotifs];
    notificationsCount = notifications.length;
  } else if (cat === "auditor") {
    // Vista auditor: logs de auditoria.
    const total = validAudit.length;
    const critical = validAudit.filter(
      (a: any) => a.action === "DELETE" || (a.event_code && a.event_code.includes("DELETE"))
    );
    const todayEvents = validAudit.filter(
      (a: any) => a.created_at && a.created_at.startsWith(today)
    );
    const uniqueUsers = new Set(
      validAudit.map((a: any) => a.user_id).filter(Boolean)
    ).size;
    kpis = [
      { id: "total", label: "Eventos (7d)", value: `${total}`, link: "/dashboard" },
      { id: "critical", label: "Eventos Criticos (DELETE)", value: `${critical.length}`, variant: critical.length > 0 ? "danger" : "success", link: "/dashboard" },
      { id: "today", label: "Eventos Hoy", value: `${todayEvents.length}`, link: "/dashboard" },
      { id: "users", label: "Usuarios Unicos", value: `${uniqueUsers}`, link: ROUTES.DASHBOARD_SETTINGS },
    ];
    pending = validAudit.slice(0, 4).map((a: any) => ({
      id: `task-audit-${a.id}`,
      description: `${a.event_code} (${a.entity_type})`,
      value: a.action,
      deadline: a.created_at ? a.created_at.substring(0, 10) : "—",
      isOverdue: false,
      link: "#",
    }));
    queueTitle = "Eventos recientes";
    queueSubtitle = "Actividad inmutable del tenant.";
    notificationsTitle = "Eventos de auditoria";
    notifications = [];
    notificationsCount = total;
  } else {
    // Default (rol desconocido o no mapeado): vista generica.
    kpis = [
      { id: "info", label: "Sin rol asignado", value: "—", sub: "Contacta al administrador" },
      { id: "info2", label: "Rol actual", value: role || "—" },
      { id: "info3", label: "Tenant", value: tenantId.substring(0, 8) },
      { id: "info4", label: "Acceso", value: "limitado" },
    ];
  }

  return {
    kpis,
    pending,
    queueTitle,
    queueSubtitle,
    notificationsTitle,
    notificationsCount,
    notifications,
  };
}
