"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/platform/auth/clients";
import { getTenantId } from "@/erp/actions/core";
import { sanitizeObject } from "@/lib/utils/sanitize";
import { checkRateLimit } from "@/lib/utils/rate-limiter";
import { calculateRequiredCfm } from "@/utils/engineering";
import { estimatePrice } from "@/utils/pricing";
import { createLeadWithScore } from "./leads";
import createLogger from "@/lib/utils/logger";
import { startTimer } from "@/lib/utils/timing";

const logger = createLogger("web:wizard");

// Admin client: Server Action corre en el servidor, service_role nunca llega al cliente
const db = getSupabaseAdmin();

export interface WizardSubmission {
  servicio: "fabricacion" | "venta" | "mantenimiento" | "reparacion" | "otro";
  length: number;
  width: number;
  height: number;
  environment: "heavy_plant" | "data_center" | "mining" | "warehouse" | "default";
  nombre: string;
  empresa: string;
  taxId?: string;
  cargo: string;
  telefono: string;
  email: string;
  ciudad: string;
  urgencia: "baja" | "media" | "alta";
  otroDetalle?: string;
  website?: string; // honeypot — campo oculto que solo llenan los bots
}

const wizardSubmissionSchema = z.object({
  servicio: z.enum(["fabricacion", "venta", "mantenimiento", "reparacion", "otro"]),
  length: z.number().positive("El largo debe ser mayor que 0"),
  width: z.number().positive("El ancho debe ser mayor que 0"),
  height: z.number().positive("El alto debe ser mayor que 0"),
  environment: z.enum(["heavy_plant", "data_center", "mining", "warehouse", "default"]),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  empresa: z.string().min(2, "La empresa debe tener al menos 2 caracteres"),
  taxId: z.string().optional(),
  cargo: z.string().min(2, "El cargo debe tener al menos 2 caracteres"),
  telefono: z.string().min(7, "El teléfono debe tener al menos 7 caracteres"),
  email: z.string().email("El correo electrónico no es válido"),
  ciudad: z.string().min(2, "La ciudad debe tener al menos 2 caracteres"),
  urgencia: z.enum(["baja", "media", "alta"]),
  otroDetalle: z.string().optional(),
  website: z.string().optional(), // honeypot — debe estar vacío
});

export interface WizardResult {
  diagnosticCode: string;
  requiredCfm: number;
  cfmCategory: "CRITICAL" | "HIGH" | "STANDARD" | "COMPACT";
  calculatedVolumeM3: number;
  estimatedPriceMinCop: number;
  estimatedPriceMaxCop: number;
  estimatedPriceMinUsd: number;
  estimatedPriceMaxUsd: number;
  materialsRecommendation: string;
  leadId: string;
}

/**
 * Procesa la sumisión del Wizard Web:
 * 1. Valida los datos de entrada con Zod y verifica que el tenant esté activo.
 * 2. Calcula CFM y estimación de precios con los Motores funcionales.
 * 3. Registra o Reutiliza al Cliente (en clients) y Contacto (en client_contacts).
 * 4. Crea el Requerimiento (requirements) y el Lead (leads) con score dinámico en español.
 * 5. Guarda el Reporte de Diagnóstico (diagnostic_reports).
 */
export async function submitWizardData(
  tenantCode: string | null,
  rawData: WizardSubmission
): Promise<WizardResult> {
  const timer = startTimer("submitWizardData");
  // 1. Validar datos de entrada con Zod
  const parsed = wizardSubmissionSchema.safeParse(rawData);
  if (!parsed.success) {
    const fieldErrors = parsed.error.issues
      .map((e) => `${String(e.path?.join(".") ?? "")}: ${e.message}`)
      .join(". ");
    throw new Error(`Datos de entrada inválidos: ${fieldErrors}`);
  }
  // 2. Sanitizar campos de texto contra XSS
  const data = sanitizeObject(parsed.data as Record<string, unknown>) as z.infer<typeof wizardSubmissionSchema>;

  // 3. Honeypot: si el campo oculto website tiene contenido, es un bot
  if (data.website) {
    // No revelamos al bot que fue detectado — respondemos como si todo estuviera bien
    timer.stop({ ok: true, honeypot: true });
    return getDummyResult();
  }

  // 4. Rate limiting por IP real (desde headers de Next.js)
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim()
    || headersList.get("x-real-ip")
    || "unknown";
  const { allowed } = await checkRateLimit(`wizard:${ip}`, 5, 60_000);
  if (!allowed) {
    throw new Error("Demasiadas solicitudes. Intente nuevamente en un minuto.");
  }

  const tenantId = await getTenantId(tenantCode);

  // Verificar que el tenant existe y está Activo
  const { data: tenantInfo, error: tenantErr } = await db
    .from("tenants")
    .select("status")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenantErr || !tenantInfo || tenantInfo.status !== "Activo") {
    logger.error("Tenant validation error", { data: { tenantErr, tenantInfo } });
    timer.stop({ ok: false });
    throw new Error("El servicio no está disponible para este tenant.");
  }


  // 1. Cálculos de Motores Funcionales
  const { cfm, cubicMeters } = calculateRequiredCfm(
    { length: data.length, width: data.width, height: data.height },
    data.environment
  );

  const priceEstimation = estimatePrice(data.servicio, data.urgencia, cubicMeters);

  // Clasificación de Caudal
  let cfmCategory: "CRITICAL" | "HIGH" | "STANDARD" | "COMPACT" = "STANDARD";
  if (cfm >= 15000) {
    cfmCategory = "CRITICAL";
  } else if (cfm >= 8000) {
    cfmCategory = "HIGH";
  } else if (cfm < 2000) {
    cfmCategory = "COMPACT";
  }

  // Recomendación de materiales dinámica
  let materialsRecommendation = "Extractor multiusos o axial de alta capacidad con ductería de acero galvanizado calibre 22.";
  if (data.environment === "heavy_plant" || data.environment === "mining") {
    materialsRecommendation = "Recomendado extractor industrial Blower o tipo Hongo con recubrimiento epóxico anticorrosivo y álabes de aluminio extruido.";
  } else if (data.environment === "data_center") {
    materialsRecommendation = "Recomendado sistema de inyección de aire con filtros de partículas EPA/HEPA y control acústico de baja vibración.";
  }

  // 2. Reutilización B2B Upsert (Clients)
  // Si viene NIT, buscar por tax_id primero: es más confiable que legal_name
  // (evita duplicados por variaciones de escritura de la razón social) y,
  // como tax_id tiene UNIQUE (tenant_id, tax_id) en BD, buscar solo por
  // legal_name cuando SÍ hay NIT arriesgaría un insert que choca contra ese
  // constraint si el mismo NIT ya existe bajo otro nombre.
  let client: { id: string } | null = null;
  if (data.taxId) {
    const { data: byTaxId } = await db
      .from("clients")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("tax_id", data.taxId)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    client = byTaxId;
  }

  if (!client) {
    const { data: byName } = await db
      .from("clients")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("legal_name", data.empresa)
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();
    client = byName;
  }

  if (!client) {
    // Si no existe, crear nuevo cliente (tax_id es nullable)
    const { data: newClient, error: clientErr } = await db
      .from("clients")
      .insert({
        tenant_id: tenantId,
        legal_name: data.empresa,
        tax_id: data.taxId || null,
        client_type: "Empresa",
        country: "Colombia",
        city: data.ciudad,
        phone: data.telefono,
        email: data.email,
        status: "PROSPECTO",
        created_by: null
      })
      .select()
      .single();

    if (clientErr) {
      logger.error("Error creating client in wizard", { data: { error: clientErr } });
      timer.stop({ ok: false });
      throw new Error("Error al registrar el cliente. Intente nuevamente.");
    }
    client = newClient;
  }

  const clientId = client!.id;

  // 3. Reutilización de Contactos (client_contacts)
  let { data: contact } = await db
    .from("client_contacts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .eq("email", data.email)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (!contact) {
    // Crear el contacto
    const { data: newContact, error: contactErr } = await db
      .from("client_contacts")
      .insert({
        tenant_id: tenantId,
        client_id: clientId,
        first_name: data.nombre,
        last_name: "",
        position: data.cargo,
        email: data.email,
        phone: data.telefono,
        created_by: null
      })
      .select()
      .single();

    if (contactErr) {
      logger.error("Error creating contact in wizard", { data: { error: contactErr } });
      timer.stop({ ok: false });
      throw new Error("Error al registrar el contacto. Intente nuevamente.");
    }
    contact = newContact;
  }

  if (!contact) {
    throw new Error("No se pudo obtener o crear el contacto.");
  }

  const contactId = contact.id;

  // 4. Registrar Lead Calificado con Scoring en Español
  const leadNotes = `Servicio: ${data.servicio}${data.servicio === "otro" && data.otroDetalle ? ` (${data.otroDetalle})` : ""}. Cálculo CFM: ${cfm}. Volumen M3: ${cubicMeters}. Urgencia: ${data.urgencia}. Ciudad: ${data.ciudad}.`;
  const lead = await createLeadWithScore(tenantCode, {
    clientId,
    contactId,
    notes: leadNotes,
    role: data.cargo,
    urgency: data.urgencia,
    email: data.email
  });

  // 5. Registrar Reporte de Diagnóstico (diagnostic_reports)
  const { data: diagReport, error: diagErr } = await db
    .from("diagnostic_reports")
    .insert({
      tenant_id: tenantId,
      lead_id: lead.id,
      service_type: data.servicio,
      dimensions: {
        length: data.length,
        width: data.width,
        height: data.height
      },
      symptoms: {
        environment: data.environment,
        city: data.ciudad
      },
      calculated_volume: cubicMeters,
      calculated_cfm: cfm,
      cfm_category: cfmCategory,
      materials_recommendation: materialsRecommendation,
      estimated_price_min_cop: priceEstimation.rangeMinCop,
      estimated_price_max_cop: priceEstimation.rangeMaxCop,
      estimated_price_min_usd: priceEstimation.rangeMinUsd,
      estimated_price_max_usd: priceEstimation.rangeMaxUsd,
      created_by: null
    })
    .select()
    .single();

  if (diagErr) {
    logger.error("Error creating diagnostic report", { data: { error: diagErr } });
    timer.stop({ ok: false });
    throw new Error("Error al generar el reporte de diagnóstico. Intente nuevamente.");
  }

  timer.stop({ ok: true });
  return {
    diagnosticCode: diagReport.diagnostic_code,
    requiredCfm: cfm,
    cfmCategory,
    calculatedVolumeM3: cubicMeters,
    estimatedPriceMinCop: priceEstimation.rangeMinCop,
    estimatedPriceMaxCop: priceEstimation.rangeMaxCop,
    estimatedPriceMinUsd: priceEstimation.rangeMinUsd,
    estimatedPriceMaxUsd: priceEstimation.rangeMaxUsd,
    materialsRecommendation,
    leadId: lead.id
  };
}

/**
 * Respuesta ficticia para bots que superan el honeypot.
 * No persiste nada en BD.
 */
function getDummyResult(): WizardResult {
  return {
    diagnosticCode: "DUMMY",
    requiredCfm: 0,
    cfmCategory: "STANDARD",
    calculatedVolumeM3: 0,
    estimatedPriceMinCop: 0,
    estimatedPriceMaxCop: 0,
    estimatedPriceMinUsd: 0,
    estimatedPriceMaxUsd: 0,
    materialsRecommendation: "",
    leadId: "00000000-0000-0000-0000-000000000000",
  };
}
