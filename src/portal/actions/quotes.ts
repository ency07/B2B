/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getCurrentClient, getPortalAuthenticatedClient } from "@/lib/portal-auth";
import { notifyStaffClientUpdate } from "./notifications";
import { respondToQuoteSchema } from "@/lib/validations/portal";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export interface ClientQuote {
  id: string;
  code: string;
  title: string;
  validUntil: string;
  totalAmount: number;
  status: string;
  clientResponse: "ACEPTADA" | "RECHAZADA" | null;
  clientResponseAt: string | null;
  clientResponseReason: string | null;
  createdAt: string;
}

export interface ClientQuoteItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface ClientQuoteDetail {
  quote: ClientQuote;
  items: ClientQuoteItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
}

/**
 * Cotizaciones "cerradas hacia afuera" del cliente (nunca BORRADOR/EN_REVISION
 * — son trabajo interno). Filtrado inmutablemente por sesión.
 */
export async function getClientQuotes(
  previewClientId?: string | null
): Promise<ClientQuote[]> {
  const client = await getCurrentClient(previewClientId);
  if (!client) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }
  const authClient = await getPortalAuthenticatedClient();
  if (!authClient) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }

  const { data, error } = await authClient.rpc("portal_get_client_quotes", {
    p_client_id: client.clientId,
  });

  if (error) {
    console.error("getClientQuotes error:", error.message);
    return [];
  }

  return (data || []).map((q: any) => ({
    id: q.id,
    code: q.quote_code,
    title: q.title,
    validUntil: q.valid_until,
    totalAmount: Number(q.total_amount || 0),
    status: q.status,
    clientResponse: q.client_response,
    clientResponseAt: q.client_response_at,
    clientResponseReason: q.client_response_reason,
    createdAt: q.created_at,
  }));
}

/**
 * Detalle (cabecera + items) de una cotización específica, bajo demanda.
 */
export async function getClientQuoteDetail(
  previewClientId: string | null | undefined,
  quoteId: string
): Promise<ClientQuoteDetail> {
  const client = await getCurrentClient(previewClientId);
  if (!client) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }
  const authClient = await getPortalAuthenticatedClient();
  if (!authClient) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }

  const { data, error } = await authClient.rpc("portal_get_client_quote_detail", {
    p_quote_id: quoteId,
    p_client_id: client.clientId,
  });

  if (error) {
    throw new Error(`No se pudo cargar el detalle de la cotización: ${error.message}`);
  }

  return {
    quote: {
      id: data.quote.id,
      code: data.quote.code,
      title: data.quote.title,
      validUntil: data.quote.validUntil,
      totalAmount: Number(data.quote.totalAmount || 0),
      status: data.quote.status,
      clientResponse: data.quote.clientResponse,
      clientResponseAt: data.quote.clientResponseAt,
      clientResponseReason: data.quote.clientResponseReason,
      createdAt: data.quote.createdAt,
    },
    items: (data.items || []).map((i: any) => ({
      description: i.description,
      quantity: Number(i.quantity || 0),
      unit: i.unit,
      unitPrice: Number(i.unitPrice || 0),
      lineTotal: Number(i.lineTotal || 0),
    })),
    subtotal: Number(data.subtotal || 0),
    discountAmount: Number(data.discountAmount || 0),
    taxAmount: Number(data.taxAmount || 0),
  };
}

/**
 * Registra la respuesta del cliente (ACEPTADA/RECHAZADA) a una cotización
 * ENVIADA. IMPORTANTE: no modifica quotes.status — ver
 * specs/002-portal-client-quotes/spec.md ("Contexto y decisión de diseño").
 * El motor de aprobación interno (Gerencia/Dirección Comercial) sigue siendo
 * quien formaliza la aprobación real.
 */
export async function respondToQuote(
  previewClientId: string | null | undefined,
  input: { quoteId: string; response: "ACEPTADA" | "RECHAZADA"; reason?: string }
): Promise<ClientQuote> {
  const client = await getCurrentClient(previewClientId);
  if (!client) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }
  const authClient = await getPortalAuthenticatedClient();
  if (!authClient) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }

  const { allowed } = await checkRateLimit(`portal:quote-response:${client.clientId}`, 10, 60_000);
  if (!allowed) {
    throw new Error("Has excedido el límite de respuestas. Intenta de nuevo en un minuto.");
  }

  const parsed = respondToQuoteSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    throw new Error(`Validación fallida: ${firstError.path.join(".")} — ${firstError.message}`);
  }

  const { data, error } = await authClient.rpc("portal_respond_to_quote", {
    p_quote_id: parsed.data.quoteId,
    p_response: parsed.data.response,
    p_reason: parsed.data.reason ?? null,
    p_client_id: client.clientId,
  });

  if (error) {
    throw new Error(`No se pudo registrar tu respuesta: ${error.message}`);
  }

  notifyStaffClientUpdate("quote_response", {
    clientName: client.legalName,
    tenantId: client.tenantId || "",
    quoteCode: data.code,
    quoteResponse: parsed.data.response,
  }).catch((err) => console.error("Error notificando staff por respuesta de cotización:", err));

  return {
    id: data.id,
    code: data.code,
    title: "",
    validUntil: "",
    totalAmount: 0,
    status: data.status,
    clientResponse: data.clientResponse,
    clientResponseAt: data.clientResponseAt,
    clientResponseReason: data.clientResponseReason,
    createdAt: "",
  };
}
