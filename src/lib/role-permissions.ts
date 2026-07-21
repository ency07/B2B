/**
 * Matriz RBAC consolidada del ERP.
 *
 * Fuente: Constitucion Tecnica - Pilar III (UX basada en Roles).
 * Esta es la unica fuente de verdad para permisos de ruta en el ERP.
 * Cualquier modulo que necesite verificar acceso debe importar de aca.
 *
 * Comportamiento de fallback:
 *  - Si el rol no esta en la matriz, getPermissionsForRole retorna [].
 *  - Si el rol es null, getPermissionsForRole retorna [].
 *  - hasAccess retorna false si no hay permisos.
 * Esto implementa DENY-by-default para roles desconocidos o nulos.
 */

export type RoleName =
  | "SUPER_ADMIN"
  | "ADMIN_EMPRESA"
  | "ADMIN_DEV"
  | "GERENTE_GENERAL"
  | "DIRECTOR_FINANCIERO"
  | "DIRECTOR_COMERCIAL"
  | "EJECUTIVO_COMERCIAL"
  | "INGENIERO_COMERCIAL"
  | "DIRECTOR_OPERACIONES"
  | "JEFE_PROYECTOS"
  | "TECNICO_CAMPO"
  | "JEFE_MANTENIMIENTO"
  | "ALMACENISTA"
  | "JEFE_INVENTARIO"
  | "JEFE_COMPRAS"
  | "AUDITOR"
  | "CLIENTE";

export const ROLE_PERMISSIONS: Record<RoleName, string[]> = {
  // 1. Administrador
  SUPER_ADMIN: ["*"],
  ADMIN_EMPRESA: ["*"],
  // 1.b. Admin Dev (rol de desarrollo, acceso total)
  ADMIN_DEV: ["*"],

  // 2. Director
  GERENTE_GENERAL: ["*"],
  DIRECTOR_FINANCIERO: ["*"],

  // 3. Comercial
  DIRECTOR_COMERCIAL: [
    "/dashboard",
    "/dashboard/clients",
    "/dashboard/leads",
    "/dashboard/requirements",
    "/dashboard/quotes",
    "/dashboard/settings",
  ],
  EJECUTIVO_COMERCIAL: [
    "/dashboard",
    "/dashboard/clients",
    "/dashboard/leads",
    "/dashboard/requirements",
    "/dashboard/quotes",
    "/dashboard/settings",
  ],
  INGENIERO_COMERCIAL: [
    "/dashboard",
    "/dashboard/clients",
    "/dashboard/leads",
    "/dashboard/requirements",
    "/dashboard/quotes",
    "/dashboard/settings",
  ],

  // 4. Director de Operaciones
  DIRECTOR_OPERACIONES: [
    "/dashboard",
    "/dashboard/jobs",
    "/dashboard/inventory",
    "/dashboard/settings",
  ],
  JEFE_PROYECTOS: [
    "/dashboard",
    "/dashboard/jobs",
    "/dashboard/inventory",
    "/dashboard/settings",
  ],

  // 5. Tecnico
  TECNICO_CAMPO: [
    "/dashboard",
    "/dashboard/jobs",
    "/dashboard/inventory",
    "/dashboard/settings",
  ],
  JEFE_MANTENIMIENTO: [
    "/dashboard",
    "/dashboard/jobs",
    "/dashboard/inventory",
    "/dashboard/settings",
  ],

  // 6. Almacenista
  ALMACENISTA: [
    "/dashboard",
    "/dashboard/inventory",
    "/dashboard/purchases",
    "/dashboard/settings",
  ],
  JEFE_INVENTARIO: [
    "/dashboard",
    "/dashboard/inventory",
    "/dashboard/purchases",
    "/dashboard/settings",
  ],
  JEFE_COMPRAS: [
    "/dashboard",
    "/dashboard/purchases",
    "/dashboard/inventory",
    "/dashboard/settings",
  ],

  // 7. Auditor
  AUDITOR: ["/dashboard", "/dashboard/cms", "/dashboard/settings"],

  // 8. Cliente: no tiene rutas en /dashboard. Va a /portal.
  // Lista vacia: cualquier intento de acceder a /dashboard/* sera DENY.
  CLIENTE: [],
};

/** Constantes para referencia. */
export const CLIENT_ROLE: RoleName = "CLIENTE";
export const PORTAL_PATH = "/portal";

/**
 * Devuelve los permisos de un rol. Retorna [] si el rol es null
 * o no esta en la matriz (DENY-by-default).
 */
export function getPermissionsForRole(role: string | null): string[] {
  if (!role) return [];
  const permissions = ROLE_PERMISSIONS[role as RoleName];
  return permissions ?? [];
}

/**
 * Verifica si un rol tiene acceso a una ruta.
 * - "*" permite todo.
 * - Match exacto: pathname === route.
 * - Match por prefijo: pathname.startsWith(route + "/").
 *   Esto permite que /dashboard autorice /dashboard/clients.
 */
export function hasAccess(role: string | null, pathname: string): boolean {
  const permissions = getPermissionsForRole(role);
  if (permissions.length === 0) return false;
  if (permissions.includes("*")) return true;
  return permissions.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
}

/**
 * Secciones del dashboard Command Center.
 * Cada seccion corresponde a un bloque visual existente en /dashboard.
 * No se inventan secciones nuevas: solo se controla la visibilidad de las
 * que ya estan renderizadas en src/app/(dashboard)/dashboard/page.tsx.
 */
export type DashboardSection =
  | "sla_bar"            // Barra de alertas de SLA tecnico
  | "currency_switcher" // Switcher COP/USD en el header
  | "cash_pulse"         // Hero de outstanding AR
  | "operations_health"  // Operations Health (4 anillos: Inventario/Compras/Facturacion/CRM)
  | "to_do_queue"        // To-Do Queue (tareas operativas pendientes)
  | "audit_log";         // Pulse Feed / Historial de auditoria

/**
 * Visibilidad por seccion del dashboard, derivada de la columna
 * "Visibilidad (UX)" de la matriz RBAC (Constitucion Tecnica - Pilar III).
 *
 * Si un rol no esta en el mapa, retorna [] (DENY-by-default).
 */
export const DASHBOARD_SECTIONS: Record<RoleName, DashboardSection[]> = {
  // 1. Administrador: control global. Ve todo.
  SUPER_ADMIN: [
    "sla_bar",
    "currency_switcher",
    "cash_pulse",
    "operations_health",
    "to_do_queue",
    "audit_log",
  ],
  ADMIN_EMPRESA: [
    "sla_bar",
    "currency_switcher",
    "cash_pulse",
    "operations_health",
    "to_do_queue",
    "audit_log",
  ],

  // 1.b. Admin Dev: acceso total al dashboard.
  ADMIN_DEV: [
    "sla_bar",
    "currency_switcher",
    "cash_pulse",
    "operations_health",
    "to_do_queue",
    "audit_log",
  ],

  // 2. Director: ejecutiva, financiera, analitica, jobs, auditoria.
  // "Visibilidad ejecutiva, financiera y analitica. KPIs analiticos
  //  consolidados. Reportes de Finanzas y Facturacion. ... Creacion y
  //  liquidacion/cierre de Ordenes de Trabajo. Auditoria a nivel de tenant."
  GERENTE_GENERAL: [
    "currency_switcher",
    "cash_pulse",
    "operations_health",
    "audit_log",
  ],
  DIRECTOR_FINANCIERO: [
    "currency_switcher",
    "cash_pulse",
    "operations_health",
    "audit_log",
  ],

  // 3. Comercial: CRM, leads, cotizaciones, consulta de inventario.
  // "Ciclo de captacion y preventa. CRM, leads y prospectos. Requerimientos
  //  tecnicos y solicitudes de cotizacion. Generacion de cotizaciones
  //  tecnicas. Consulta de inventario y stocks de seguridad."
  DIRECTOR_COMERCIAL: [
    "currency_switcher",
    "cash_pulse",
    "operations_health",
    "to_do_queue",
    "audit_log",
  ],
  EJECUTIVO_COMERCIAL: [
    "currency_switcher",
    "cash_pulse",
    "operations_health",
    "to_do_queue",
    "audit_log",
  ],
  INGENIERO_COMERCIAL: [
    "currency_switcher",
    "cash_pulse",
    "operations_health",
    "to_do_queue",
    "audit_log",
  ],

  // 4. Director de Operaciones: control tecnico, OTs, inventarios.
  // "Control tecnico y de ejecucion en el taller/campo. Creacion,
  //  asignacion y seguimiento de Ordenes de Trabajo. ... Gestion de
  //  inventarios, movimientos de stock."
  DIRECTOR_OPERACIONES: [
    "sla_bar",
    "operations_health",
    "to_do_queue",
  ],
  JEFE_PROYECTOS: [
    "sla_bar",
    "operations_health",
    "to_do_queue",
  ],

  // 5. Tecnico: ejecucion de taller, OTs asignadas.
  // "Ejecucion de tareas de taller y mantenimiento. Ordenes de Trabajo
  //  (OTs) asignadas."
  TECNICO_CAMPO: ["sla_bar", "operations_health", "to_do_queue"],
  JEFE_MANTENIMIENTO: ["sla_bar", "operations_health", "to_do_queue"],

  // 6. Almacenista: gestion de suministros e insumos.
  // "Gestion de suministros e insumos. Listados y niveles de stock
  //  de repuestos y materiales. Registro de entradas/salidas de almacen.
  //  Requerimientos de compra de insumos."
  ALMACENISTA: ["operations_health", "to_do_queue"],
  JEFE_INVENTARIO: ["operations_health", "to_do_queue"],
  JEFE_COMPRAS: ["cash_pulse", "to_do_queue"],

  // 7. Auditor: trazabilidad y cumplimiento legal.
  // "Trazabilidad y cumplimiento legal. Acceso a los logs de auditoria
  //  inmutables del tenant. Historial de cotizaciones, facturas y
  //  transacciones en modo lectura."
  AUDITOR: ["currency_switcher", "audit_log"],

  // 8. Cliente: sin acceso a /dashboard. Redirigido a /portal.
  CLIENTE: [],
};

/**
 * Verifica si un rol puede ver una seccion del dashboard.
 * Si el rol es null o no esta en el mapa, retorna false (DENY).
 */
export function canSeeSection(
  role: string | null,
  section: DashboardSection
): boolean {
  if (!role) return false;
  const sections = DASHBOARD_SECTIONS[role as RoleName];
  if (!sections) return false;
  return sections.includes(section);
}

/**
 * Acciones del sistema. Cada una corresponde a un permiso explicito
 * en la columna "Visibilidad (UX)" de la matriz RBAC. No se inventan
 * acciones nuevas: solo se incluyen las que el documento define.
 */
export type Action =
  | "users.create"
  | "users.edit"
  | "users.permissions"
  | "quotes.approve"
  | "quotes.create"
  | "jobs.create"
  | "jobs.close"
  | "jobs.manage"
  | "leads"
  | "clients.create"
  | "clients.edit"
  | "requirements"
  | "items.manage"
  | "inventory.view"
  | "inventory.movement"
  | "documents.view"
  | "documents.upload"
  | "purchases"
  | "audit.view_tenant"
  | "payments.view"
  | "payments.confirm"
  | "invoices.manage"
  | "invoices.view"
  | "credit_notes.create"
  | "purchases.create"
  | "purchases.approve"
  | "purchases.view"
  | "branding.manage"
  | "settings.manage"
  | "catalog.manage";

/**
 * Acciones permitidas por rol, derivadas de la columna "Visibilidad (UX)"
 * de la matriz RBAC. Si el rol no esta en el mapa, retorna [] (DENY).
 *
 * "*" indica control global (Administrador).
 */
export const ACTION_PERMISSIONS: Record<RoleName, Action[] | ["*"]> = {
  // 1. Administrador: control global. Ve todo.
  SUPER_ADMIN: ["*"],
  ADMIN_EMPRESA: ["*"],

  // 1.b. Admin Dev: rol de desarrollo con acceso total. Solo para
  // cuentas internas del equipo de ingenieria. Mismas capacidades que
  // SUPER_ADMIN.
  ADMIN_DEV: ["*"],

  // 2. Director: Aprobacion de cotizaciones, creacion y cierre de OTs,
  // auditoria a nivel de tenant.
  // "quotes.approve (quotes.approve). Creacion y liquidacion/cierre de
  //  Ordenes de Trabajo (jobs.create, jobs.close). Auditoria a nivel de tenant."
  GERENTE_GENERAL: [
    "quotes.approve",
    "jobs.create",
    "jobs.close",
    "audit.view_tenant",
    "invoices.manage",
    "invoices.view",
    "payments.confirm",
    "credit_notes.create",
    "purchases.create",
    "purchases.approve",
    "purchases.view",
    "branding.manage",
    "settings.manage",
  ],
  DIRECTOR_FINANCIERO: [
    "quotes.approve",
    "jobs.create",
    "jobs.close",
    "audit.view_tenant",
    "invoices.manage",
    "invoices.view",
    "payments.confirm",
    "credit_notes.create",
    "purchases.create",
    "purchases.approve",
    "purchases.view",
    "branding.manage",
    "settings.manage",
  ],
  JEFE_COMPRAS: [
    "purchases.create",
    "purchases.approve",
    "purchases.view",
  ],

  // 3. Comercial: leads, clientes, requerimientos, cotizaciones.
  // "CRM, leads y prospectos (leads / clients.create, clients.edit).
  //  Requerimientos tecnicos y solicitudes de cotizacion (requirements).
  //  Generacion de cotizaciones tecnicas (quotes.create)."
  DIRECTOR_COMERCIAL: [
    "leads",
    "clients.create",
    "clients.edit",
    "requirements",
    "quotes.create",
  ],
  EJECUTIVO_COMERCIAL: [
    "leads",
    "clients.create",
    "clients.edit",
    "requirements",
    "quotes.create",
  ],
  INGENIERO_COMERCIAL: [
    "leads",
    "clients.create",
    "clients.edit",
    "requirements",
    "quotes.create",
  ],

  // 4. Director de Operaciones: creacion de OTs, gestion de OTs,
  // gestion de items, movimientos de inventario.
  // "Creacion, asignacion y seguimiento de Ordenes de Trabajo
  //  (jobs.create, jobs.manage). ... Gestion de inventarios, movimientos
  //  de stock (items.manage, inventory.movement)."
  DIRECTOR_OPERACIONES: [
    "jobs.create",
    "jobs.manage",
    "items.manage",
    "inventory.movement",
  ],
  JEFE_PROYECTOS: [
    "jobs.create",
    "jobs.manage",
    "items.manage",
    "inventory.movement",
  ],

  // 5. Tecnico: gestion de OTs asignadas, documentos tecnicos.
  // "Ordenes de Trabajo (OTs) asignadas (jobs.manage). Planos tecnicos
  //  y hojas de ingenieria (documents.view, documents.upload)."
  TECNICO_CAMPO: [
    "jobs.manage",
    "documents.view",
    "documents.upload",
  ],
  JEFE_MANTENIMIENTO: [
    "jobs.manage",
    "documents.view",
    "documents.upload",
  ],

  // 6. Almacenista: ver inventario, movimientos, compras.
  // "Listados y niveles de stock de repuestos y materiales (inventory.view).
  //  Registro de entradas/salidas de almacen (inventory.movement).
  //  Requerimientos de compra de insumos (purchases)."
  ALMACENISTA: ["inventory.view", "inventory.movement", "purchases"],
  JEFE_INVENTARIO: ["inventory.view", "inventory.movement", "purchases"],

  // 7. Auditor: acceso a logs de auditoria del tenant.
  // "Acceso a los logs de auditoria inmutables del tenant (audit.view_tenant).
  //  Historial de cotizaciones, facturas y transacciones en modo lectura."
  AUDITOR: ["audit.view_tenant", "invoices.view"],

  // 8. Cliente: ver pagos (read-only).
  // "Historial de facturas pendientes y pagadas (payments.view)."
  CLIENTE: ["payments.view", "invoices.view"],
};

/**
 * Verifica si un rol puede ejecutar una accion.
 * Si el rol es null, no esta en el mapa, o no tiene la accion, retorna false.
 */
export function canPerform(role: string | null, action: Action): boolean {
  if (!role) return false;
  const actions = ACTION_PERMISSIONS[role as RoleName];
  if (!actions) return false;
  if (actions[0] === "*") return true;
  return (actions as Action[]).includes(action);
}
