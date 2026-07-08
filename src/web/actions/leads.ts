"use server";

import { z } from "zod";
import { getPublicServerClient } from "@/platform/auth/clients";
import { getTenantId } from "@/erp/actions/core";
import { resolveTenantOwnerUserIdAsync } from "@/platform/tenant/tenant-resolver";
import { sanitizeObject } from "@/lib/utils/sanitize";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import { PUBLIC_EMAIL_DOMAINS, KNOWN_DISPOSABLE_DOMAINS } from "@/lib/constants";

const db = getPublicServerClient();

export interface LeadScoreResult {
  score: number;
  riskLevel: "CALIENTE" | "TIBIO" | "FRIO" | "SPAM";
}

const createLeadSchema = z.object({
  clientId: z.string().uuid("Client ID inválido"),
  contactId: z.string().uuid("Contact ID inválido"),
  notes: z.string().optional(),
  role: z.string().min(2, "El rol es requerido"),
  urgency: z.string().min(2, "La urgencia es requerida"),
  email: z.string().email("Email inválido")
});

const contactFormSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  companyName: z.string().min(2, "La empresa debe tener al menos 2 caracteres"),
  phone: z.string().min(7, "El teléfono debe tener al menos 7 caracteres"),
  email: z.string().email("Email inválido"),
  role: z.string().optional().default("Otro"),
  urgency: z.string().min(2, "La urgencia es requerida"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres")
});

/**
 * Calcula el puntaje de prioridad (scoring) y clasifica el lead en español.
 */
export async function calculateLeadScore(
  email: string,
  role: string,
  urgency: string
): Promise<LeadScoreResult> {
  let score = 0;

  // 1. Clasificación por Cargo Profesional
  if (
    ["Director de Planta", "Gerente de Mantenimiento", "Supervisor de HVAC / Operaciones"].includes(
      role
    )
  ) {
    score += 40;
  } else if (["Ingeniero de Proyectos", "Compras / Abastecimiento"].includes(role)) {
    score += 25;
  } else {
    score += 10;
  }

  // 2. Clasificación por Urgencia del Requerimiento
  if (urgency === "alta") {
    score += 40;
  } else if (urgency === "media") {
    score += 20;
  } else {
    score += 5;
  }

  // 3. Penalización por Dominios de Correo Públicos (No Corporativos)
  const emailDomain = email.split("@")[1]?.toLowerCase() || "";
  const isPublicDomain = PUBLIC_EMAIL_DOMAINS.includes(emailDomain);
  
  if (isPublicDomain) {
    score -= 20; // Penalización de 20 puntos por no usar correo corporativo
  }

  // Asegurar límites del score
  score = Math.max(0, Math.min(100, score));

  // 4. Asignación de nivel de riesgo/prioridad en Español (CALIENTE, TIBIO, FRIO, SPAM)
  let riskLevel: "CALIENTE" | "TIBIO" | "FRIO" | "SPAM" = "FRIO";

  // Detección directa de SPAM (correos temporales o sospechosos)
  // Validación de formato email con regex básico (al menos user@domain.tld)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isDisposable = KNOWN_DISPOSABLE_DOMAINS.includes(emailDomain);
  if (isDisposable || !emailRegex.test(email)) {
    riskLevel = "SPAM";
    score = 0;
  } else if (score >= 70) {
    riskLevel = "CALIENTE";
  } else if (score >= 40) {
    riskLevel = "TIBIO";
  } else {
    riskLevel = "FRIO";
  }

  return { score, riskLevel };
}

/**
 * Registra un Lead con su score calculado en el sistema B2B.
 */
export async function createLeadWithScore(
  tenantCode: string | null,
  rawLeadData: {
    clientId: string;
    contactId: string;
    notes?: string;
    role: string;
    urgency: string;
    email: string;
  }
) {
  // 1. Validar esquema
  const parsed = createLeadSchema.safeParse(rawLeadData);
  if (!parsed.success) {
    throw new Error(
      `Datos de lead inválidos: ${parsed.error.issues.map((e) => e.message).join(", ")}`
    );
  }
  const leadData = sanitizeObject(parsed.data as Record<string, unknown>) as z.infer<typeof createLeadSchema>;

  // Rate limiting
  const { allowed } = await checkRateLimit(`lead:${leadData.email}`);
  if (!allowed) {
    throw new Error("Demasiadas solicitudes. Intente nuevamente en un minuto.");
  }

  const tenantId = await getTenantId(tenantCode);

  // 2. Verificar que el tenant está activo
  const { data: tenantInfo, error: tenantErr } = await db
    .from("tenants")
    .select("status")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenantErr || !tenantInfo || tenantInfo.status !== "Activo") {
    console.error("Tenant validation error:", tenantErr, tenantInfo);
    throw new Error("El servicio no está disponible para este tenant.");
  }

  const { score, riskLevel } = await calculateLeadScore(leadData.email, leadData.role, leadData.urgency);
  const userId = await resolveTenantOwnerUserIdAsync(tenantId);

  // Insertar lead en la tabla leads
  const { data, error } = await db
    .from("leads")
    .insert({
      tenant_id: tenantId,
      client_id: leadData.clientId,
      contact_id: leadData.contactId,
      lead_source: "WEBSITE", // Fuente de cotizador web
      score,
      risk_level: riskLevel, // Estados en español: CALIENTE, TIBIO, FRIO, SPAM
      notes: leadData.notes || `Contacto registrado vía Wizard Web. Rol: ${leadData.role}. Urgencia: ${leadData.urgency}.`,
      status: "NUEVO",
      assigned_user_id: userId,
      created_by: userId
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating lead with score:", error);
    throw new Error("Error al registrar el lead. Intente nuevamente.");
  }

  return data;
}

/**
 * Registra un Lead proveniente del formulario de contacto B2B de la landing page.
 */
export async function submitContactForm(
  tenantCode: string | null,
  rawLeadData: {
    name: string;
    companyName: string;
    phone: string;
    email: string;
    role?: string;
    urgency: string;
    description: string;
  }
) {
  // 1. Validar esquema con Zod
  const parsed = contactFormSchema.safeParse(rawLeadData);
  if (!parsed.success) {
    throw new Error(
      `Datos del formulario de contacto inválidos: ${parsed.error.issues.map((e) => e.message).join(", ")}`
    );
  }
  const leadData = sanitizeObject(parsed.data as Record<string, unknown>) as z.infer<typeof contactFormSchema>;

  // Rate limiting
  const { allowed } = await checkRateLimit(`contact:${leadData.email}`);
  if (!allowed) {
    throw new Error("Demasiadas solicitudes. Intente nuevamente en un minuto.");
  }

  const tenantId = await getTenantId(tenantCode);

  // 2. Verificar que el tenant está activo
  const { data: tenantInfo, error: tenantErr } = await db
    .from("tenants")
    .select("status")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenantErr || !tenantInfo || tenantInfo.status !== "Activo") {
    console.error("Tenant validation error:", tenantErr, tenantInfo);
    throw new Error("El servicio no está disponible para este tenant.");
  }

  const { score, riskLevel } = await calculateLeadScore(leadData.email, leadData.role, leadData.urgency);
  const userId = await resolveTenantOwnerUserIdAsync(tenantId);

  const { data, error } = await db
    .from("leads")
    .insert({
      tenant_id: tenantId,
      name: leadData.name,
      company_name: leadData.companyName,
      phone: leadData.phone,
      email: leadData.email,
      urgency: leadData.urgency,
      score,
      lead_score: score,
      risk_level: riskLevel,
      notes: leadData.description,
      lead_source: "WEBSITE",
      status: "NUEVO",
      assigned_user_id: userId,
      created_by: userId
    })
    .select()
    .single();

  if (error) {
    console.error("Error submitting contact lead:", error);
    throw new Error("Error al enviar el formulario de contacto. Intente nuevamente.");
  }

  return data;
}
