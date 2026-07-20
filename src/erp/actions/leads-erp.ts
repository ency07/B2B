"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import { getTenantId, getCallerTenantId } from "@/erp/actions/core";
import { requireAction } from "@/platform/auth/server-guards";
import { validate, updateLeadStatusSchema } from "@/lib/validations/erp";

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
    console.error("Error fetching leads:", error);
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
  await requireAction("leads");
  const tenantId = await getCallerTenantId();

  const { error } = await supabaseAdmin
    .from("leads")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("Error updating lead status:", error);
    throw new Error(error.message);
  }
}
