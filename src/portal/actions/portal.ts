/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getCurrentClient, getPortalAuthenticatedClient } from "@/lib/portal-auth";
import { notifyClientMessageFromStaff, notifyStaffClientUpdate } from "./notifications";
import { createTicketSchema, sendMessageSchema, createRequirementSchema } from "@/lib/validations/portal";
import { checkRateLimit } from "@/lib/utils/rate-limiter";

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

  const { allowed } = await checkRateLimit(`portal:ticket:${client.clientId}`, 5, 60_000);
  if (!allowed) {
    throw new Error("Has excedido el límite de tickets. Intenta de nuevo en un minuto.");
  }

  const parsed = createTicketSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    throw new Error(`Validación fallida: ${firstError.path.join(".")} — ${firstError.message}`);
  }

  const { data, error } = await authClient.rpc("portal_create_client_ticket", {
    p_client_id: client.clientId,
    p_subject: parsed.data.subject,
    p_description: parsed.data.description,
    p_severity: parsed.data.severity,
    p_job_id: parsed.data.jobId ?? null,
  });

  if (error) {
    throw new Error(`No se pudo crear el ticket: ${error.message}`);
  }

  const ticket = {
    id: data.id,
    code: data.ticket_code,
    subject: data.subject,
    description: data.description,
    severity: data.severity,
    status: data.status,
    jobId: data.job_id,
    createdAt: data.created_at,
  };

  // Notificar al staff del tenant (async fire-and-forget)
  notifyStaffClientUpdate("ticket", {
    clientName: client.legalName,
    tenantId: client.tenantId || "",
    ticketCode: ticket.code,
    subject: ticket.subject,
  }).catch((err) => console.error("Error notificando staff:", err));

  return ticket;
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

   
  return (data || []).map((m: any) => ({
    id: m.id,
    senderType: m.sender_type,
    senderLabel: m.sender_label,
    body: m.body,
    createdAt: m.created_at,
  }));
}

// =============================================================================
// REQUERIMIENTOS — flujo de compra/solicitud desde el portal
// =============================================================================

export interface ClientRequirement {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
}

export async function getClientRequirements(
  previewClientId?: string | null
): Promise<ClientRequirement[]> {
  const client = await getCurrentClient(previewClientId);
  if (!client) throw new Error("No autorizado: Sesión de cliente inválida.");
  const authClient = await getPortalAuthenticatedClient();
  if (!authClient) throw new Error("No autorizado: Sesión de cliente inválida.");

  const { data, error } = await authClient.rpc("portal_get_client_requirements", {
    p_client_id: client.clientId,
  });

  if (error) {
    console.error("getClientRequirements error:", error.message);
    return [];
  }

   
  return (data || []).map((r: any) => ({
    id: r.id,
    code: r.requirement_code,
    title: r.title,
    description: r.description ?? null,
    category: r.category,
    priority: r.priority,
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function createClientRequirement(
  previewClientId: string | null | undefined,
  input: { title: string; description: string; category: string; priority: string }
): Promise<ClientRequirement> {
  const client = await getCurrentClient(previewClientId);
  if (!client) throw new Error("No autorizado: Sesión de cliente inválida.");
  const authClient = await getPortalAuthenticatedClient();
  if (!authClient) throw new Error("No autorizado: Sesión de cliente inválida.");

  const { allowed } = await checkRateLimit(`portal:requirement:${client.clientId}`, 3, 60_000);
  if (!allowed) {
    throw new Error("Has excedido el límite de solicitudes. Intenta de nuevo en un minuto.");
  }

  const parsed = createRequirementSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    throw new Error(`Validación fallida: ${firstError.path.join(".")} — ${firstError.message}`);
  }

  const { data, error } = await authClient.rpc("portal_create_client_requirement", {
    p_client_id: client.clientId,
    p_title: parsed.data.title,
    p_description: parsed.data.description,
    p_category: parsed.data.category,
    p_priority: parsed.data.priority,
  });

  if (error) {
    throw new Error(`No se pudo registrar el requerimiento: ${error.message}`);
  }

  const req: ClientRequirement = {
    id: data.id,
    code: data.requirement_code,
    title: data.title,
    description: data.description ?? null,
    category: data.category,
    priority: data.priority,
    status: data.status,
    createdAt: data.created_at,
  };

  // Notificar al staff vía Slack/Discord/email (fire-and-forget)
  notifyStaffClientUpdate("ticket", {
    clientName: client.legalName,
    tenantId: client.tenantId || "",
    ticketCode: req.code,
    subject: `[PORTAL] Nuevo requerimiento: ${req.title}`,
  }).catch((err) => console.error("Error notificando staff por requerimiento:", err));

  return req;
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

  const { allowed } = await checkRateLimit(`portal:message:${client.clientId}`, 20, 60_000);
  if (!allowed) {
    throw new Error("Has excedido el límite de mensajes. Intenta de nuevo en un minuto.");
  }

  const parsed = sendMessageSchema.safeParse({ body });
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    throw new Error(`Validación fallida: ${firstError.path.join(".")} — ${firstError.message}`);
  }

  const { data, error } = await authClient.rpc("portal_send_client_message", {
    p_client_id: client.clientId,
    p_body: parsed.data.body,
  });

  if (error) {
    throw new Error(`No se pudo enviar el mensaje: ${error.message}`);
  }

  const message = {
    id: data.id,
    senderType: data.sender_type,
    senderLabel: data.sender_label,
    body: data.body,
    createdAt: data.created_at,
  };

  // Si el mensaje viene de un cliente real, notificar al staff
  if (data.sender_type === "CLIENT") {
    notifyStaffClientUpdate("message", {
      clientName: client.legalName,
      tenantId: client.tenantId || "",
      messageBody: body.substring(0, 100),
    }).catch((err) => console.error("Error notificando staff:", err));
  }

  // Si el mensaje viene del staff, notificar al cliente por email
  if (data.sender_type === "STAFF" && client.email) {
    notifyClientMessageFromStaff(client.email, client.legalName, body)
      .catch((err) => console.error("Error notificando cliente:", err));
  }

  return message;
}
