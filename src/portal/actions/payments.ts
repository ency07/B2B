"use server";

import { randomBytes } from "crypto";
import { getCurrentClient } from "@/lib/portal-auth";
import { getClientInvoices } from "@/portal/actions/portal";
import { supabaseAdmin } from "@/platform/auth/clients";
import { computeIntegritySignature } from "@/lib/wompi";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

export interface WompiCheckoutConfig {
  publicKey: string;
  amountInCents: number;
  currency: "COP";
  reference: string;
  signature: string;
  redirectUrl: string;
}

export type WompiCheckoutResult = WompiCheckoutConfig | { unavailable: true };

/**
 * Genera la configuración del Widget de Wompi para pagar el saldo pendiente
 * de una factura. Retorna { unavailable: true } si el gateway no está
 * configurado (WOMPI_PUBLIC_KEY / WOMPI_INTEGRITY_SECRET ausentes) — el
 * componente debe mostrar el mensaje honesto actual en ese caso, nunca
 * simular un Widget roto.
 *
 * El monto SIEMPRE se calcula en el servidor a partir del saldo real de la
 * factura (vía el mismo RPC ya usado para listar facturas del portal) — el
 * navegador nunca decide cuánto se cobra.
 */
export async function createWompiCheckout(
  previewClientId: string | null | undefined,
  invoiceId: string
): Promise<WompiCheckoutResult> {
  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!publicKey || !integritySecret) {
    return { unavailable: true };
  }

  const client = await getCurrentClient(previewClientId);
  if (!client) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }

  const { allowed } = await checkRateLimit(`portal:wompi-checkout:${client.clientId}`, 10, 60_000);
  if (!allowed) {
    throw new Error("Has excedido el límite de intentos de pago. Intenta de nuevo en un minuto.");
  }

  const invoices = await getClientInvoices(previewClientId);
  const invoice = invoices.find((i) => i.id === invoiceId);
  if (!invoice) {
    throw new Error("Factura no encontrada.");
  }
  if (invoice.balanceAmount <= 0) {
    throw new Error("Esta factura no tiene saldo pendiente.");
  }

  const reference = `WOMPI-${invoiceId.slice(0, 8)}-${Date.now()}-${randomBytes(4).toString("hex")}`;
  const amountInCents = Math.round(invoice.balanceAmount * 100);
  const currency = "COP" as const;

  const signature = computeIntegritySignature(reference, amountInCents, currency, integritySecret);

  const { error } = await supabaseAdmin
    .from("invoices")
    .update({
      payment_provider: "WOMPI",
      payment_token: reference,
      payment_status: "PENDING",
    })
    .eq("id", invoiceId);

  if (error) {
    console.error("createWompiCheckout: error actualizando invoice", error.message);
    throw new Error("No se pudo iniciar el pago. Intenta de nuevo.");
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const tenantQs = client.tenantCode ? `?tenant=${client.tenantCode}` : "";

  return {
    publicKey,
    amountInCents,
    currency,
    reference,
    signature,
    redirectUrl: `${baseUrl}/portal${tenantQs}`,
  };
}
