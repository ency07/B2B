import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/platform/auth/clients";
import { extractSignatureValues, verifyEventChecksum } from "@/lib/wompi";

interface WompiWebhookPayload {
  event: string;
  data: {
    transaction: {
      id: string;
      amount_in_cents: number;
      reference: string;
      currency: string;
      payment_method_type?: string;
      status: "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | "PENDING";
    };
  };
  sent_at: string;
  signature: {
    checksum: string;
    properties: string[];
    timestamp: number;
  };
}

function mapPaymentMethod(wompiType: string | undefined): string {
  switch (wompiType) {
    case "CARD":
      return "Tarjeta";
    case "PSE":
      return "PSE";
    default:
      return "Otro";
  }
}

/**
 * Webhook público de Wompi. Único punto de entrada externo sin sesión de
 * Supabase de todo el proyecto — necesario porque Wompi hace el POST desde
 * sus propios servidores, no desde el navegador del cliente.
 *
 * La firma (checksum) es la ÚNICA fuente de autenticidad — se verifica ANTES
 * de tocar cualquier dato. Ver specs/003-portal-wompi-payments/research.md
 * (Decisión 4).
 */
export async function POST(request: NextRequest) {
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
  if (!eventsSecret) {
    console.error("[wompi-webhook] WOMPI_EVENTS_SECRET no configurado — webhook rechazado.");
    return NextResponse.json({ error: "Gateway no configurado" }, { status: 503 });
  }

  let payload: WompiWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido" }, { status: 400 });
  }

  if (!payload?.signature?.checksum || !payload.signature.properties || !payload.data?.transaction) {
    return NextResponse.json({ error: "Payload incompleto" }, { status: 400 });
  }

  // Los paths de signature.properties (ej. "transaction.id") son relativos a
  // payload.data, no a la raíz del payload — confirmado empíricamente contra
  // el ejemplo oficial de Wompi (ver quickstart.md).
  const propertyValues = extractSignatureValues(payload.data, payload.signature.properties);
  const isValid = verifyEventChecksum(
    propertyValues,
    payload.signature.timestamp,
    payload.signature.checksum,
    eventsSecret
  );

  if (!isValid) {
    console.warn("[wompi-webhook] Checksum inválido — evento rechazado sin tocar datos.");
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const { transaction } = payload.data;

  // Resolver la factura por el token de referencia generado al iniciar el
  // checkout — nunca por un id que venga del payload sin verificar.
  const { data: invoice, error: invoiceErr } = await supabaseAdmin
    .from("invoices")
    .select("id")
    .eq("payment_token", transaction.reference)
    .maybeSingle();

  if (invoiceErr) {
    console.error("[wompi-webhook] Error resolviendo factura:", invoiceErr.message);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  if (!invoice) {
    // Referencia no reconocida (evento viejo, factura ya reconciliada por
    // otro medio, etc.) — no es un error de nuestro lado; 200 para que Wompi
    // no reintente un evento que no podemos aplicar de todas formas.
    console.warn(`[wompi-webhook] Sin factura para reference=${transaction.reference}`);
    return NextResponse.json({ ok: true, applied: false });
  }

  if (transaction.status === "APPROVED") {
    const { error: rpcErr } = await supabaseAdmin.rpc("wompi_confirm_payment", {
      p_invoice_id: invoice.id,
      p_wompi_transaction_id: transaction.id,
      p_amount: transaction.amount_in_cents / 100,
      p_payment_method: mapPaymentMethod(transaction.payment_method_type),
    });

    if (rpcErr) {
      console.error("[wompi-webhook] wompi_confirm_payment falló:", rpcErr.message);
      return NextResponse.json({ error: "No se pudo aplicar el pago" }, { status: 500 });
    }
  } else {
    // DECLINED / VOIDED / ERROR / PENDING: solo se trackea el estado, nunca
    // se crea un payments — columnas sin trigger de permisos, UPDATE simple.
    await supabaseAdmin
      .from("invoices")
      .update({ payment_status: transaction.status })
      .eq("id", invoice.id);
  }

  return NextResponse.json({ ok: true, applied: transaction.status === "APPROVED" });
}
