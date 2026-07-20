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
  requirementId: uuidSchema.optional(),
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
