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

export interface ClientSupportTicket {
  id: string;
  code: string;
  subject: string;
  description: string;
  severity: string;
  status: string;
  jobId: string | null;
  createdAt: string;
}

export interface ClientSupportMessage {
  id: string;
  senderType: "CLIENT" | "STAFF";
  senderLabel: string | null;
  body: string;
  createdAt: string;
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

/**
 * Tickets de soporte del cliente — persistidos de verdad (antes vivían
 * solo en el estado de React y se perdían al recargar la página).
 */
export async function getClientTickets(
  previewClientId?: string | null
): Promise<ClientSupportTicket[]> {
  const client = await getCurrentClient(previewClientId);
  if (!client) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }
  const authClient = await getPortalAuthenticatedClient();
  if (!authClient) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }

  const { data, error } = await authClient.rpc("portal_get_client_tickets", {
    p_client_id: client.clientId,
  });

  if (error) {
    console.error("getClientTickets error:", error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((t: any) => ({
    id: t.id,
    code: t.ticket_code,
    subject: t.subject,
    description: t.description,
    severity: t.severity,
    status: t.status,
    jobId: t.job_id,
    createdAt: t.created_at,
  }));
}

export async function createClientTicket(
  previewClientId: string | null | undefined,
  input: { subject: string; description: string; severity: string; jobId?: string | null }
): Promise<ClientSupportTicket> {
  const client = await getCurrentClient(previewClientId);
  if (!client) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }
  const authClient = await getPortalAuthenticatedClient();
  if (!authClient) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }

  const { data, error } = await authClient.rpc("portal_create_client_ticket", {
    p_client_id: client.clientId,
    p_subject: input.subject,
    p_description: input.description,
    p_severity: input.severity,
    p_job_id: input.jobId ?? null,
  });

  if (error) {
    throw new Error(`No se pudo crear el ticket: ${error.message}`);
  }

  return {
    id: data.id,
    code: data.ticket_code,
    subject: data.subject,
    description: data.description,
    severity: data.severity,
    status: data.status,
    jobId: data.job_id,
    createdAt: data.created_at,
  };
}

/**
 * Bitácora de mensajes del cliente. IMPORTANTE: hoy quien usa el Portal es
 * siempre un admin en modo revisión (no existe login real de cliente
 * externo todavía — ver src/lib/portal-auth.ts), así que todo mensaje se
 * registra como STAFF. No se genera ninguna respuesta automática ni se
 * finge que "el cliente" contesta — sería inventar una conversación que no
 * existe.
 */
export async function getClientMessages(
  previewClientId?: string | null
): Promise<ClientSupportMessage[]> {
  const client = await getCurrentClient(previewClientId);
  if (!client) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }
  const authClient = await getPortalAuthenticatedClient();
  if (!authClient) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }

  const { data, error } = await authClient.rpc("portal_get_client_messages", {
    p_client_id: client.clientId,
  });

  if (error) {
    console.error("getClientMessages error:", error.message);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data || []).map((m: any) => ({
    id: m.id,
    senderType: m.sender_type,
    senderLabel: m.sender_label,
    body: m.body,
    createdAt: m.created_at,
  }));
}

export async function sendClientMessage(
  previewClientId: string | null | undefined,
  body: string
): Promise<ClientSupportMessage> {
  const client = await getCurrentClient(previewClientId);
  if (!client) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }
  const authClient = await getPortalAuthenticatedClient();
  if (!authClient) {
    throw new Error("No autorizado: Sesión de cliente inválida.");
  }

  const { data, error } = await authClient.rpc("portal_send_client_message", {
    p_client_id: client.clientId,
    p_body: body,
  });

  if (error) {
    throw new Error(`No se pudo enviar el mensaje: ${error.message}`);
  }

  return {
    id: data.id,
    senderType: data.sender_type,
    senderLabel: data.sender_label,
    body: data.body,
    createdAt: data.created_at,
  };
}
