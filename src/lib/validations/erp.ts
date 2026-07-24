/**
 * Esquemas Zod compartidos para las mutaciones del módulo ERP.
 *
 * Objetivo (Fase 1 · auditoría ERP): unificar la validación de datos de todas
 * las Server Actions de escritura del ERP en un único lugar, con reglas
 * estrictas (tipos, rangos, formatos: email/uuid, montos > 0, campos no vacíos)
 * evaluadas en runtime ANTES de tocar la base de datos.
 *
 * Convención: usar `validate(schema, input)` al inicio de cada mutación; lanza
 * un Error legible si la validación falla (consistente con el manejo de errores
 * de las actions existentes que hacen `throw new Error(...)`).
 *
 * Nota de diseño sobre enums: se usan enums estrictos SOLO donde el conjunto de
 * valores está explícito en el código de la action o en el CHECK de la DB. Para
 * campos ambiguos (p.ej. priority de requirements) se deja un string no vacío y
 * se delega la validación final al CHECK de la base de datos, para no romper
 * flujos existentes.
 */

import { z } from "zod";

// ── Helpers ────────────────────────────────────────────────────────────────

export const uuidSchema = z.string().uuid("ID inválido");

const nonEmpty = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} es obligatorio`).max(max, `${label} excede el máximo`);

const dateString = (label: string) =>
  z.string().refine((s) => !Number.isNaN(Date.parse(s)), `${label} inválida`);

/**
 * Valida `input` contra `schema`. Si falla, lanza Error con los mensajes
 * concatenados. Si pasa, retorna el dato parseado (con trims/defaults aplicados).
 */
export function validate<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const msg = result.error.issues.map((i) => i.message).join("; ");
    throw new Error(`Validación fallida: ${msg}`);
  }
  return result.data;
}

// ── Clients ──────────────────────────────────────────────────────────────────

export const createClientSchema = z.object({
  taxId: nonEmpty("NIT", 50),
  name: nonEmpty("Nombre", 200),
  segment: z.string().trim().max(100).default("General"),
  email: z.string().trim().email("Email inválido").max(200),
});

// ── Jobs ─────────────────────────────────────────────────────────────────────

export const createJobSchema = z.object({
  clientId: uuidSchema,
  requirementId: uuidSchema,
  assignedUserId: uuidSchema,
  description: nonEmpty("Descripción", 2000),
  priority: z.enum(["ALTA", "MEDIA", "BAJA"]),
  startDate: dateString("Fecha de inicio"),
  endDate: dateString("Fecha de fin"),
});

// ── Inventory ────────────────────────────────────────────────────────────────

export const createInventoryMovementSchema = z
  .object({
    type: z.enum(["Entrada", "Salida", "Transferencia"]),
    itemCode: nonEmpty("Código de artículo", 100),
    quantity: z.number().positive("La cantidad debe ser mayor a 0"),
    notes: z.string().max(1000).default(""),
    sourceWarehouse: nonEmpty("Bodega origen", 100),
    destWarehouse: z.string().trim().max(100).optional(),
  })
  .refine((d) => d.type !== "Transferencia" || !!d.destWarehouse, {
    message: "La transferencia requiere bodega destino",
    path: ["destWarehouse"],
  });

export const createInventoryItemSchema = z.object({
  itemCode: nonEmpty("Código", 100),
  name: nonEmpty("Nombre", 200),
  description: z.string().max(1000).default(""),
  category: z.string().max(100).default(""),
  itemType: z.enum(["Material", "Herramienta", "Equipo", "Consumible", "Repuesto"]),
  unit: nonEmpty("Unidad", 50),
  minimumStock: z.number().nonnegative("El stock mínimo no puede ser negativo").default(0),
  maximumStock: z.number().nonnegative("El stock máximo no puede ser negativo").default(0),
  reorderPoint: z.number().nonnegative("El punto de reorden no puede ser negativo").default(0),
  initialQuantity: z.number().nonnegative("La cantidad inicial no puede ser negativa").optional(),
  warehouseId: uuidSchema.optional(),
});

// ── Invoices ─────────────────────────────────────────────────────────────────

export const createInvoiceSchema = z.object({
  clientName: nonEmpty("Cliente", 200),
  concept: nonEmpty("Concepto", 500),
  amount: z.number().positive("El monto debe ser mayor a 0"),
});

// ── Payments ─────────────────────────────────────────────────────────────────

export const registerPaymentSchema = z.object({
  invoiceId: uuidSchema,
  clientId: uuidSchema,
  amount: z.number().positive("El monto debe ser mayor a 0"),
  paymentMethod: z.enum(["Transferencia", "Efectivo", "Cheque", "Tarjeta", "PSE", "Otro"]),
  referenceNumber: z.string().trim().max(150).optional(),
  paymentDate: dateString("Fecha de pago"),
  notes: z.string().max(1000).optional(),
});

// ── Credit Notes ─────────────────────────────────────────────────────────────

export const createCreditNoteSchema = z.object({
  invoiceId: uuidSchema,
  clientId: uuidSchema,
  reason: z.enum(["DEVOLUCION", "ERROR", "DESCUENTO", "ANULACION", "GARANTIA"]),
  description: z.string().trim().max(1000).optional(),
  subtotal: z.number().nonnegative("El subtotal no puede ser negativo"),
  taxAmount: z.number().nonnegative("El impuesto no puede ser negativo").default(0),
  totalAmount: z.number().positive("El total debe ser mayor a 0"),
});

// ── Jobs ─────────────────────────────────────────────────────────────────────

export const updateJobStatusSchema = z.object({
  jobId: uuidSchema,
  newStatus: z.enum([
    "PENDIENTE",
    "PROGRAMADO",
    "EN_EJECUCION",
    "SUSPENDIDO",
    "FINALIZADO",
    "ENTREGADO",
    "FACTURADA",
    "CERRADO",
    "CANCELADO",
  ]),
  cancelReason: z.string().trim().min(10, "El motivo de cancelación debe tener al menos 10 caracteres").max(1000).optional(),
  actualHours: z.number().nonnegative("Las horas reales no pueden ser negativas").optional(),
}).refine((d) => {
  if (d.newStatus === "CANCELADO") return !!d.cancelReason;
  return true;
}, {
  message: "El motivo de cancelación es obligatorio",
  path: ["cancelReason"],
});

// ── Tenant settings ──────────────────────────────────────────────────────────

export const updateTenantSettingsSchema = z.object({
  module: nonEmpty("Módulo", 100),
  key: nonEmpty("Clave", 100),
  isEncrypted: z.boolean().default(false),
});

// ── Quotes ───────────────────────────────────────────────────────────────────

export const quoteStatusSchema = z.enum([
  "BORRADOR",
  "EN_REVISION",
  "ENVIADA",
  "APROBADA",
  "RECHAZADA",
  "VENCIDA",
]);

export const createQuoteSchema = z.object({
  clientId: uuidSchema,
  // requirement_id es NOT NULL en la tabla quotes — antes era .optional() y
  // el insert hacía `requirementId || null`, lo que violaba el constraint en
  // cuanto el formulario se enviaba sin requerimiento seleccionado.
  requirementId: uuidSchema,
  validUntil: dateString("Fecha de validez"),
});

export const addQuoteItemSchema = z.object({
  quoteId: uuidSchema,
  description: nonEmpty("Descripción", 500),
  itemType: nonEmpty("Tipo de ítem", 50),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
  unitPrice: z.number().nonnegative("El precio unitario no puede ser negativo"),
  discountAmount: z.number().nonnegative("El descuento no puede ser negativo"),
  taxPercent: z.number().min(0, "El impuesto no puede ser negativo").max(100, "El impuesto no puede superar 100%"),
  itemOrder: z.number().int("El orden debe ser entero").nonnegative(),
});

export const updateQuoteStatusSchema = z.object({
  quoteId: uuidSchema,
  status: quoteStatusSchema,
});

// ── Requirements ─────────────────────────────────────────────────────────────

export const requirementStatusSchema = z.enum([
  "BORRADOR",
  "NUEVO",
  "EN_REVISION",
  "DIAGNOSTICO",
  "COTIZACION",
  "COMPLETADO",
  "CANCELADO",
]);

export const createRequirementSchema = z.object({
  title: nonEmpty("Título", 300),
  clientId: uuidSchema,
  category: nonEmpty("Categoría", 100),
  // priority: el CHECK de la DB es la autoridad final (LOW/MEDIUM/HIGH); se
  // mantiene permisivo aquí para no romper el mapeo del formulario.
  priority: nonEmpty("Prioridad", 20),
});

export const updateRequirementStatusSchema = z.object({
  reqId: uuidSchema,
  newStatus: requirementStatusSchema,
});

// ── Leads ────────────────────────────────────────────────────────────────────

export const leadStatusSchema = z.enum([
  "NUEVO",
  "EN_SEGUIMIENTO",
  "CALIFICADO",
  "RECHAZADO",
  "CONVERTIDO",
]);

export const updateLeadStatusSchema = z.object({
  leadId: uuidSchema,
  newStatus: leadStatusSchema,
});

// ── Purchases (proveedores, solicitudes, cotizaciones, OC, recepciones) ──────

export const createProveedorSchema = z.object({
  razonSocial: nonEmpty("Razón social", 200),
  nit: z.string().trim().max(50).optional(),
  direccion: z.string().trim().max(500).optional(),
  ciudad: z.string().trim().max(100).optional(),
  telefono: z.string().trim().max(50).optional(),
  correo: z.string().trim().email("Email inválido").max(200).optional().or(z.literal("")),
  sitioWeb: z.string().trim().max(300).optional(),
  categoria: z.enum(["MATERIALES", "SERVICIOS", "EQUIPOS", "CONSUMIBLES"]),
  diasCredito: z.number().int().nonnegative().default(30),
  condicionesPago: z.string().trim().max(1000).optional(),
});

export const updateProveedorSchema = createProveedorSchema.partial().extend({
  estado: z.enum(["ACTIVO", "INACTIVO"]).optional(),
});

export const createSolicitudCompraSchema = z.object({
  area: z.string().trim().max(100).optional(),
  proyecto: z.string().trim().max(200).optional(),
  prioridad: z.enum(["URGENTE", "ALTA", "MEDIA", "BAJA"]).default("MEDIA"),
  justificacion: z.string().trim().min(10, "La justificación debe tener al menos 10 caracteres").max(2000),
  fechaNecesidad: dateString("Fecha de necesidad").optional(),
  centroCostos: z.string().trim().max(100).optional(),
  valorEstimado: z.number().nonnegative().optional(),
  items: z.array(z.object({
    descripcion: nonEmpty("Descripción", 500),
    cantidad: z.number().positive("La cantidad debe ser mayor a 0"),
    unidad: z.string().trim().max(20).default("un"),
    proveedorSugeridoId: uuidSchema.optional(),
  })).min(1, "Debe incluir al menos un ítem"),
});

export const solicitudCompraStatusSchema = z.enum([
  "APROBADA",
  "RECHAZADA",
  "COTIZANDO",
  "CONVERTIDA",
  "CANCELADA",
]);

export const updateSolicitudCompraStatusSchema = z.object({
  solicitudId: uuidSchema,
  newStatus: solicitudCompraStatusSchema,
  motivoRechazo: z.string().trim().min(10).max(1000).optional(),
  motivoCancelacion: z.string().trim().min(10).max(1000).optional(),
}).refine((d) => d.newStatus !== "RECHAZADA" || !!d.motivoRechazo, {
  message: "El motivo de rechazo es obligatorio (mínimo 10 caracteres)",
  path: ["motivoRechazo"],
}).refine((d) => d.newStatus !== "CANCELADA" || !!d.motivoCancelacion, {
  message: "El motivo de cancelación es obligatorio (mínimo 10 caracteres)",
  path: ["motivoCancelacion"],
});

export const createCotizacionProveedorSchema = z.object({
  solicitudId: uuidSchema,
  proveedorId: uuidSchema,
  valor: z.number().nonnegative("El valor no puede ser negativo"),
  moneda: z.string().trim().max(10).default("COP"),
  fechaEntrega: dateString("Fecha de entrega").optional(),
  garantia: z.string().trim().max(200).optional(),
  condiciones: z.string().trim().max(1000).optional(),
  items: z.array(z.object({
    descripcion: nonEmpty("Descripción", 500),
    cantidad: z.number().positive(),
    unidad: z.string().trim().max(20).default("un"),
    precioUnitario: z.number().nonnegative(),
  })).default([]),
});

export const cotizacionProveedorEstadoSchema = z.object({
  cotizacionId: uuidSchema,
  estado: z.enum(["ACEPTADA", "RECHAZADA"]),
});

export const createOrdenCompraSchema = z.object({
  solicitudId: uuidSchema.optional(),
  proveedorId: uuidSchema,
  cotizacionId: uuidSchema.optional(),
  proyecto: z.string().trim().max(200).optional(),
  fechaEntrega: dateString("Fecha de entrega").optional(),
  condicionesPago: z.string().trim().max(1000).optional(),
  iva: z.number().nonnegative().default(0),
  retencion: z.number().nonnegative().default(0),
  items: z.array(z.object({
    productoId: uuidSchema.optional(),
    descripcion: nonEmpty("Descripción", 500),
    cantidad: z.number().positive(),
    unidad: z.string().trim().max(20).default("un"),
    precioUnitario: z.number().nonnegative(),
    descuento: z.number().nonnegative().default(0),
  })).min(1, "Debe incluir al menos un ítem"),
});

export const ordenCompraStatusSchema = z.enum([
  "ENVIADA",
  "ACEPTADA",
  "CANCELADA",
]);

export const updateOrdenCompraStatusSchema = z.object({
  ordenId: uuidSchema,
  newStatus: ordenCompraStatusSchema,
  motivoCancelacion: z.string().trim().min(10).max(1000).optional(),
}).refine((d) => d.newStatus !== "CANCELADA" || !!d.motivoCancelacion, {
  message: "El motivo de cancelación es obligatorio (mínimo 10 caracteres)",
  path: ["motivoCancelacion"],
});

export const createRecepcionSchema = z.object({
  ocId: uuidSchema,
  warehouseId: uuidSchema,
  tipo: z.enum(["TOTAL", "PARCIAL", "RECHAZO", "DEVOLUCION"]),
  observaciones: z.string().trim().max(1000).optional(),
  items: z.array(z.object({
    ocItemId: uuidSchema,
    cantidadRecibida: z.number().nonnegative(),
    estado: z.enum(["ACEPTADO", "CONDICIONAL", "RECHAZADO"]).default("ACEPTADO"),
    observaciones: z.string().trim().max(500).optional(),
  })).min(1, "Debe incluir al menos un ítem recibido"),
});

// ── Users ────────────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  email: z.string().trim().email("Email inválido").max(200),
  firstName: nonEmpty("Nombre", 100),
  lastName: nonEmpty("Apellido", 100),
  phone: z.string().trim().max(50).optional(),
  roleId: uuidSchema.nullable(),
});

export const updateUserSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(50).optional(),
});

export const userRoleSchema = z.object({
  userId: uuidSchema,
  roleId: uuidSchema,
});
