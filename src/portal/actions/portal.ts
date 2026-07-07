/**
 * Acciones de portal (P8 - portal).
 *
 * El Portal hoy es una herramienta de soporte: solo SUPER_ADMIN/ADMIN_DEV
 * puede entrar en modo "vista como cliente" para diagnosticar un cliente
 * puntual (ver getCurrentClient en @/lib/portal-auth). Las lecturas usan un
 * cliente autenticado con la sesión real del admin (no service_role) e
 * invocan funciones RPC SECURITY DEFINER (portal_get_client_*) que
 * re-validan el rol y el tenant en la base de datos — así, si el chequeo de
 * rol en TypeScript tuviera un bug, la función SQL igual bloquea el acceso.
 */

"use server";

import { getCurrentClient, getPortalAuthenticatedClient } from "@/lib/portal-auth";

export interface ClientJob {
  id: string;
  code: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  plannedEndDate: string | null;
}

export interface ClientInvoice {
  id: string;
  code: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  status: string;
  issueDate: string;
  dueDate: string | null;
}

export interface ClientPayment {
  id: string;
  invoiceCode: string;
  amount: number;
  paidAt: string;
  method: string;
}

/**
 * OTs del cliente (jobs), filtrado inmutablemente por sesión.
 */
export async function getClientJobs(
  previewClientId?: string | null
): Promise<ClientJob[]> {
  const client = await getCurrentClient(previewClientId);
  if (!client) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }
  const authClient = await getPortalAuthenticatedClient();
  if (!authClient) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }
  const clientId = client.clientId;

  const { data, error } = await authClient.rpc("portal_get_client_jobs", {
    p_client_id: clientId,
  });

  if (error) {
    console.error("getClientJobs error:", error.message);
    return [];
  }

  return (data || []).map((j: any) => ({
    id: j.id,
    code: j.job_code,
    title: j.title,
    description: j.description,
    status: j.status,
    priority: j.priority,
    plannedEndDate: j.planned_end_date
      ? j.planned_end_date.substring(0, 10)
      : null,
  }));
}

/**
 * Facturas del cliente, filtrado inmutablemente por sesión.
 */
export async function getClientInvoices(
  previewClientId?: string | null
): Promise<ClientInvoice[]> {
  const client = await getCurrentClient(previewClientId);
  if (!client) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }
  const authClient = await getPortalAuthenticatedClient();
  if (!authClient) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }
  const clientId = client.clientId;

  const { data, error } = await authClient.rpc("portal_get_client_invoices", {
    p_client_id: clientId,
  });

  if (error) {
    console.error("getClientInvoices error:", error.message);
    return [];
  }

  return (data || []).map((i: any) => ({
    id: i.id,
    code: i.invoice_code,
    totalAmount: Number(i.total_amount || 0),
    paidAmount: Number(i.paid_amount || 0),
    balanceAmount: Number(i.balance_amount || 0),
    status: i.status,
    issueDate: i.invoice_date ? i.invoice_date.substring(0, 10) : "",
    dueDate: i.due_date ? i.due_date.substring(0, 10) : null,
  }));
}

/**
 * Pagos del cliente, filtrado inmutablemente por sesión.
 */
export async function getClientPayments(
  previewClientId?: string | null
): Promise<ClientPayment[]> {
  const client = await getCurrentClient(previewClientId);
  if (!client) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }
  const authClient = await getPortalAuthenticatedClient();
  if (!authClient) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }
  const clientId = client.clientId;

  const { data, error } = await authClient.rpc("portal_get_client_payments", {
    p_client_id: clientId,
  });

  if (error) {
    console.error("getClientPayments error:", error.message);
    return [];
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    invoiceCode: p.invoice_code || "",
    amount: Number(p.amount || 0),
    paidAt: p.payment_date ? p.payment_date.substring(0, 10) : "",
    method: p.payment_method || "",
  }));
}
