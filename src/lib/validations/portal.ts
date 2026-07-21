import { z } from "zod";

export const ticketSeverityEnum = z.enum(["BAJO", "MEDIO", "ALTO"]);

export const requirementCategoryEnum = z.enum([
  "FABRICACION",
  "VENTA",
  "MANTENIMIENTO",
  "REPARACION",
  "OTRO",
]);

export const requirementPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const createRequirementSchema = z.object({
  title: z
    .string()
    .min(5, "El título debe tener al menos 5 caracteres")
    .max(250, "El título no puede exceder 250 caracteres"),
  description: z
    .string()
    .min(15, "La descripción debe tener al menos 15 caracteres")
    .max(5000, "La descripción no puede exceder 5000 caracteres"),
  category: requirementCategoryEnum,
  priority: requirementPriorityEnum,
});

export type ValidatedCreateRequirement = z.infer<typeof createRequirementSchema>;

export const createTicketSchema = z.object({
  subject: z.string().min(1, "El asunto es obligatorio").max(250, "El asunto no puede exceder 250 caracteres"),
  description: z.string().min(1, "La descripción es obligatoria").max(5000, "La descripción no puede exceder 5000 caracteres"),
  severity: ticketSeverityEnum,
  jobId: z.string().nullable().optional(),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1, "El mensaje no puede estar vacío").max(5000, "El mensaje no puede exceder 5000 caracteres"),
});

export const quoteResponseEnum = z.enum(["ACEPTADA", "RECHAZADA"]);

export const respondToQuoteSchema = z
  .object({
    quoteId: z.string().uuid("quoteId inválido"),
    response: quoteResponseEnum,
    reason: z.string().max(2000, "El motivo no puede exceder 2000 caracteres").optional(),
  })
  .refine(
    (data) => data.response !== "RECHAZADA" || (data.reason && data.reason.trim().length >= 10),
    {
      message: "Para rechazar una cotización se debe ingresar un motivo de al menos 10 caracteres",
      path: ["reason"],
    }
  );

export type ValidatedCreateTicket = z.infer<typeof createTicketSchema>;
export type ValidatedSendMessage = z.infer<typeof sendMessageSchema>;
export type ValidatedRespondToQuote = z.infer<typeof respondToQuoteSchema>;
