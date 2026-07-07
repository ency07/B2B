import { z } from "zod";

const servicioEnum = z.enum(["fabricacion", "venta", "mantenimiento", "reparacion", "otro"]);
const urgenciaEnum = z.enum(["baja", "media", "alta"]);
const environmentEnum = z.enum(["heavy_plant", "data_center", "mining", "warehouse", "default"]);

export const wizardSubmissionSchema = z.object({
  servicio: servicioEnum,
  length: z.number().min(1).max(10000),
  width: z.number().min(1).max(10000),
  height: z.number().min(1).max(1000),
  environment: environmentEnum,
  nombre: z.string().min(1).max(200),
  empresa: z.string().min(1).max(300),
  cargo: z.string().min(1).max(200),
  telefono: z.string().min(1).max(50),
  email: z.string().email().max(254),
  ciudad: z.string().min(1).max(200),
  urgencia: urgenciaEnum,
  otroDetalle: z.string().max(2000).optional().default(""),
});

export const contactFormSchema = z.object({
  name: z.string().min(1).max(200),
  companyName: z.string().min(1).max(300),
  phone: z.string().min(1).max(50),
  email: z.string().email().max(254),
  urgency: urgenciaEnum,
  description: z.string().max(5000).optional().default(""),
});

export type ValidatedWizardSubmission = z.infer<typeof wizardSubmissionSchema>;
export type ValidatedContactForm = z.infer<typeof contactFormSchema>;
