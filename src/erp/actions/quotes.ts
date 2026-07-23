/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import { getTenantId, getCallerTenantId } from "@/erp/actions/core";
import { requireAction, getAuthContext, validateTenantAccess } from "@/platform/auth/server-guards";
import {
  validate,
  createQuoteSchema,
  addQuoteItemSchema,
  updateQuoteStatusSchema,
} from "@/lib/validations/erp";

export interface QuoteRow {
  id: string;
  quote_code: string;
  client_id: string;
  requirement_id: string | null;
  assigned_user_id: string | null;
  valid_until: string;
  subtotal: number;
  total_amount: number;
  status: "BORRADOR" | "EN_REVISION" | "ENVIADA" | "APROBADA" | "RECHAZADA" | "VENCIDA";
  created_at: string;
  client: { legal_name: string } | null;
}

export async function getQuotes(tenantCode?: string | null, clientId?: string): Promise<QuoteRow[]> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");
  const tenantId = await getTenantId(tenantCode ?? null);

  const query = supabaseAdmin
    .from("quotes")
    .select(`
      id, quote_code, client_id, requirement_id, assigned_user_id, valid_until, subtotal, total_amount, status, created_at,
      client:client_id ( legal_name )
    `)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (clientId) query.eq("client_id", clientId);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching quotes:", error);
    throw new Error(error.message);
  }

  return (data || []).map((q: any) => ({
    ...q,
    client: Array.isArray(q.client) ? q.client[0] ?? null : q.client ?? null,
  })) as QuoteRow[];
}

export async function createQuote(
  tenantCode: string | null,
  quoteData: { clientId: string; requirementId?: string; validUntil: string }
) {
  const ctx = await requireAction("quotes.create");
  quoteData = validate(createQuoteSchema, quoteData);
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data, error } = await supabaseAdmin
    .from("quotes")
    .insert({
      tenant_id: tenantId,
      client_id: quoteData.clientId,
      requirement_id: quoteData.requirementId || null,
      assigned_user_id: ctx.userId,
      valid_until: quoteData.validUntil,
      status: "BORRADOR",
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating quote:", error);
    throw new Error(error.message);
  }

  return data;
}

export async function getQuoteItems(quoteId: string) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");
  const tenantId = await getCallerTenantId();

  const { data, error } = await supabaseAdmin
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
    .eq("tenant_id", tenantId)
    .order("item_order", { ascending: true });

  if (error) {
    console.error("Error fetching quote items:", error);
    return [];
  }

  return data;
}

export async function addQuoteItem(
  tenantCode: string | null,
  itemData: {
    quoteId: string;
    description: string;
    itemType: string;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    taxPercent: number;
    itemOrder: number;
  }
) {
  const ctx = await requireAction("quotes.create");
  itemData = validate(addQuoteItemSchema, itemData);
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  // Verify the target quote belongs to this tenant before inserting items.
  const { data: quoteCheck } = await supabaseAdmin
    .from("quotes")
    .select("id")
    .eq("id", itemData.quoteId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!quoteCheck) throw new Error("Cotización no encontrada en este tenant");

  const { data, error } = await supabaseAdmin
    .from("quote_items")
    .insert({
      tenant_id: tenantId,
      quote_id: itemData.quoteId,
      item_order: itemData.itemOrder,
      item_type: itemData.itemType,
      description: itemData.description,
      quantity: itemData.quantity,
      unit: "UNIDAD",
      unit_price: itemData.unitPrice,
      discount_amount: itemData.discountAmount,
      tax_percent: itemData.taxPercent,
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding quote item:", error);
    throw new Error(error.message);
  }

  return data;
}

export async function updateQuoteStatus(quoteId: string, status: string) {
  ({ quoteId, status } = validate(updateQuoteStatusSchema, { quoteId, status }));
  const ctx = status === "APROBADA"
    ? await requireAction("quotes.approve")
    : await requireAction("quotes.create");
  const tenantId = await getCallerTenantId();

  const { data, error } = await supabaseAdmin
    .from("quotes")
    .update({ status, status_changed_by: ctx.userId, status_changed_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) {
    console.error("Error updating quote status:", error);
    throw new Error(error.message);
  }

  return data;
}

export async function convertQuoteToJob(quoteId: string) {
  const ctx = await requireAction("quotes.approve");
  const tenantId = await getCallerTenantId();

  // Obtener cotización + requerimiento asociado
  const { data: quote, error: qErr } = await supabaseAdmin
    .from("quotes")
    .select("id, status, requirement_id, client_id, total_amount")
    .eq("id", quoteId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (qErr || !quote) throw new Error("Cotización no encontrada");
  if (quote.status !== "APROBADA") throw new Error("La cotización debe estar APROBADA para generar una OT");
  if (!quote.requirement_id) throw new Error("La cotización no tiene un requerimiento asociado");

  // Verificar requerimiento
  const { data: req, error: rErr } = await supabaseAdmin
    .from("requirements")
    .select("id, status, description")
    .eq("id", quote.requirement_id)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (rErr || !req) throw new Error("Requerimiento asociado no encontrado");
  if (req.status !== "APROBACION") throw new Error(`El requerimiento debe estar en APROBACION (actual: ${req.status})`);

  // Transicionar a OT_GENERADA — el trigger valida documentos y crea el Job automáticamente
  const { error: updateErr } = await supabaseAdmin
    .from("requirements")
    .update({
      status: "OT_GENERADA",
      updated_at: new Date().toISOString(),
      updated_by: ctx.userId,
    })
    .eq("id", quote.requirement_id)
    .eq("tenant_id", tenantId);

  if (updateErr) {
    console.error("Error converting quote to job:", updateErr);
    throw new Error(updateErr.message);
  }

  // Obtener el Job que el trigger creó
  const { data: job } = await supabaseAdmin
    .from("jobs")
    .select("id, job_code, status, title")
    .eq("requirement_id", quote.requirement_id)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return {
    success: true,
    job: job || null,
    message: job
      ? `OT ${job.job_code} generada desde la cotización`
      : "Requerimiento actualizado a OT_GENERADA (el trigger debe crear el Job)",
  };
}
