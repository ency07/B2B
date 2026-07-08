import { z } from "zod";

export const ticketSeverityEnum = z.enum(["BAJO", "MEDIO", "ALTO"]);

export const createTicketSchema = z.object({
  subject: z.string().min(1, "El asunto es obligatorio").max(250, "El asunto no puede exceder 250 caracteres"),
  description: z.string().min(1, "La descripción es obligatoria").max(5000, "La descripción no puede exceder 5000 caracteres"),
  severity: ticketSeverityEnum,
  jobId: z.string().nullable().optional(),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1, "El mensaje no puede estar vacío").max(5000, "El mensaje no puede exceder 5000 caracteres"),
});

export type ValidatedCreateTicket = z.infer<typeof createTicketSchema>;
export type ValidatedSendMessage = z.infer<typeof sendMessageSchema>;
