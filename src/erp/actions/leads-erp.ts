"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import { getTenantId, getCallerTenantId, emitBusinessEvent } from "@/erp/actions/core";
import { requireAction, getAuthContext } from "@/platform/auth/server-guards";
import { validate, updateLeadStatusSchema } from "@/lib/validations/erp";
import createLogger from "@/lib/utils/logger";
import { startTimer } from "@/lib/utils/timing";

const logger = createLogger("erp:leads");

const TRANSITIONS: Record<string, string[]> = {
  NUEVO: ["EN_SEGUIMIENTO", "RECHAZADO"],
  EN_SEGUIMIENTO: ["CALIFICADO", "RECHAZADO"],
  CALIFICADO: ["CONVERTIDO", "RECHAZADO"],
  CONVERTIDO: [],
  RECHAZADO: [],
};

const VALID_TRANSITION = (from: string, to: string) =>
  (TRANSITIONS[from] || []).includes(to);

export interface LeadRow {
  id: string;
  lead_code: string;
  risk_level: "CALIENTE" | "TIBIO" | "FRIO" | "SPAM";
  score: number;
  status: string;
  lead_source: string | null;
  notes: string | null;
  created_at: string;
  assigned_user_id: string | null;
  client: { legal_name: string; city: string | null } | null;
  contact: { first_name: string; last_name: string; email: string | null; phone: string | null } | null;
  diagnostic: {
    id: string;
    diagnostic_code: string;
    service_type: string;
    calculated_cfm: number | null;
    cfm_category: string;
    estimated_price_min_cop: number;
    estimated_price_max_cop: number;
    materials_recommendation: string | null;
    dimensions: { length: number; width: number; height: number } | null;
    calculated_volume: number | null;
  } | null;
}

/**
 * Obtiene todos los leads del tenant con sus relaciones (client, contact, diagnostic).
 * Debe ejecutarse SOLO desde Server Actions o Server Components (usa supabaseAdmin).
 */
export async function getLeads(tenantCode?: string | null): Promise<LeadRow[]> {
  const tenantId = await getTenantId(tenantCode ?? null);

  const { data, error } = await supabaseAdmin
    .from("leads")
    .select(`
      id, lead_code, risk_level, score, status, lead_source, notes, created_at, assigned_user_id,
      client:client_id ( legal_name, city ),
      contact:contact_id ( first_name, last_name, email, phone ),
      diagnostic:diagnostic_reports ( id, diagnostic_code, service_type, calculated_cfm, cfm_category, estimated_price_min_cop, estimated_price_max_cop, materials_recommendation, dimensions, calculated_volume )
    `)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    logger.error("Error fetching leads", { data: { error } });
    throw new Error(error.message);
  }

  // Normalizar: Supabase devuelve arrays para relaciones 1:many via FK inversa
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => ({
    ...row,
    client: Array.isArray(row.client) ? row.client[0] ?? null : row.client,
    contact: Array.isArray(row.contact) ? row.contact[0] ?? null : row.contact,
    diagnostic: Array.isArray(row.diagnostic) ? row.diagnostic[0] ?? null : row.diagnostic,
  })) as LeadRow[];
}

/**
 * Actualiza el estado de un lead (Ejecutivo Comercial lo califica).
 */
export async function updateLeadStatus(
  leadId: string,
  newStatus: "NUEVO" | "EN_SEGUIMIENTO" | "CALIFICADO" | "RECHAZADO" | "CONVERTIDO"
): Promise<void> {
  ({ leadId, newStatus } = validate(updateLeadStatusSchema, { leadId, newStatus }));
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");
  await requireAction("leads");
  const tenantId = await getCallerTenantId();

  const timer = startTimer("updateLeadStatus");

  // Obtener lead actual para validar transición
  const { data: lead, error: fetchErr } = await supabaseAdmin
    .from("leads")
    .select("id, status, company_name, name, email, phone, city, client_id, assigned_user_id")
    .eq("id", leadId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (fetchErr || !lead) {
    timer.stop({ ok: false });
    throw new Error("Lead no encontrado");
  }

  if (!VALID_TRANSITION(lead.status, newStatus)) {
    timer.stop({ ok: false });
    throw new Error(`Transición inválida: ${lead.status} → ${newStatus}`);
  }

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
    updated_by: ctx.userId,
  };

  // Al calificar, auto-asignar cliente/contacto si existe info
  if (newStatus === "CALIFICADO" && !lead.client_id && lead.company_name) {
    const { data: existingClient } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("legal_name", lead.company_name)
      .maybeSingle();

    if (existingClient) {
      updatePayload.client_id = existingClient.id;
    } else {
      const { data: newClient } = await supabaseAdmin
        .from("clients")
        .insert({
          tenant_id: tenantId,
          legal_name: lead.company_name,
          city: lead.city,
          email: lead.email,
          phone: lead.phone,
          status: "ACTIVO",
          created_by: ctx.userId,
        })
        .select()
        .single();

      if (newClient) {
        updatePayload.client_id = newClient.id;
      }
    }
  }

  const { error: updateErr } = await supabaseAdmin
    .from("leads")
    .update(updatePayload)
    .eq("id", leadId)
    .eq("tenant_id", tenantId);

  if (updateErr) {
    logger.error("Error updating lead status", { data: { error: updateErr } });
    timer.stop({ ok: false });
    throw new Error(updateErr.message);
  }

  timer.stop({ ok: true });
  // Emitir business event
  emitBusinessEvent(
    tenantId,
    "LEAD_STATUS_CHANGED",
    "LEAD",
    leadId,
    { old_status: lead.status, new_status: newStatus },
    ctx.userId
  );
}
