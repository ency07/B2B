/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import { getTenantId } from "@/erp/actions/core";
import { requireAction, getAuthContext } from "@/platform/auth/server-guards";

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

export async function getQuotes(tenantCode?: string | null): Promise<QuoteRow[]> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");
  const tenantId = await getTenantId(tenantCode ?? null);

  const { data, error } = await supabaseAdmin
    .from("quotes")
    .select(`
      id, quote_code, client_id, requirement_id, assigned_user_id, valid_until, subtotal, total_amount, status, created_at,
      client:client_id ( legal_name )
    `)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching quotes:", error);
    return [];
  }

  const rows = (data ?? []).map((row: any) => ({
    ...row,
    client: Array.isArray(row.client) ? row.client[0] ?? null : row.client
  }));

  return rows as QuoteRow[];
}

export async function createQuote(
  tenantCode: string | null,
  quoteData: { clientId: string; requirementId?: string; validUntil: string }
) {
  const ctx = await requireAction("quotes.create");
  const tenantId = await getTenantId(tenantCode);

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

  const { data, error } = await supabaseAdmin
    .from("quote_items")
    .select("*")
    .eq("quote_id", quoteId)
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
  const tenantId = await getTenantId(tenantCode);

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
  // Aprobar una cotización requiere permiso explícito quotes.approve.
  // Cualquier otra transición requiere quotes.create (el creador puede moverla
  // a EN_REVISION o ENVIADA, pero no puede auto-aprobarla).
  const ctx = status === "APROBADA"
    ? await requireAction("quotes.approve")
    : await requireAction("quotes.create");

  const { data, error } = await supabaseAdmin
    .from("quotes")
    .update({ status, status_changed_by: ctx.userId, status_changed_at: new Date().toISOString() })
    .eq("id", quoteId)
    .select()
    .single();

  if (error) {
    console.error("Error updating quote status:", error);
    throw new Error(error.message);
  }

  return data;
}
