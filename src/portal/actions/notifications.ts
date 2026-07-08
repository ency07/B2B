"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import { getAuthContext } from "@/platform/auth/server-guards";

interface TicketNotification {
  ticketCode: string;
  subject: string;
  severity: string;
  clientName: string;
  clientEmail: string;
  staffName: string;
}

/**
 * Notifica al cliente cuando se crea un ticket via portal.
 * Ready para integrar con Resend, SendGrid, o Email service de tu elección.
 * Por ahora: logs en servidor + webhook placeholder.
 */
export async function notifyClientTicketCreated(
  notification: TicketNotification
): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return { ok: false, error: "No autenticado" };

    console.log(
      `\n📧 TICKET NOTIFICATION (webhook-ready):`,
      JSON.stringify(notification, null, 2)
    );

    // TODO: Integrar con Resend, SendGrid, o email service
    // const emailSent = await resend.emails.send({
    //   from: "tickets@empresa.com",
    //   to: notification.clientEmail,
    //   subject: `Ticket ${notification.ticketCode} creado`,
    //   html: renderTicketEmailTemplate(notification),
    // });

    // Placeholder: almacenar en BD que se intentó notificar
    // (útil para tracking/retry)
    await supabaseAdmin
      .from("client_support_tickets")
      .select("id")
      .eq("ticket_code", notification.ticketCode)
      .limit(1);
    // Could update a notification_sent_at column here if it existed

    return { ok: true };
  } catch (error) {
    console.error("Error notificando ticket:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Error enviando notificación",
    };
  }
}

/**
 * Notifica al staff del tenant cuando cliente crea ticket/envía mensaje.
 * Ready para webhooks hacia staff dashboard, Slack, PagerDuty, etc.
 */
export async function notifyStaffClientUpdate(
  type: "ticket" | "message",
  data: {
    clientName: string;
    tenantId: string;
    ticketCode?: string;
    subject?: string;
    messageBody?: string;
  }
): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return { ok: false, error: "No autenticado" };

    // Obtener emails de staff del tenant
    const { data: staffUsers } = await supabaseAdmin
      .from("users")
      .select("email, first_name, last_name")
      .eq("tenant_id", data.tenantId)
      .in("role_id", [
        // roles de staff/admin del tenant
      ])
      .limit(10);

    const staffEmails = staffUsers?.map((u: any) => u.email).filter(Boolean) || [];

    const message = {
      type,
      client: data.clientName,
      timestamp: new Date().toISOString(),
      ...(type === "ticket" && {
        ticket: data.ticketCode,
        subject: data.subject,
      }),
      ...(type === "message" && {
        text: data.messageBody,
      }),
    };

    console.log(
      `\n📢 STAFF NOTIFICATION (webhook-ready):`,
      JSON.stringify(message, null, 2),
      `\nTo: ${staffEmails.join(", ")}`
    );

    // TODO: Webhooks a Slack, email interno, Discord, etc.
    // await notifySlack(message);
    // await sendStaffEmail(staffEmails, message);

    return { ok: true };
  } catch (error) {
    console.error("Error notificando staff:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Error" };
  }
}

/**
 * Email template (React component) para notificación de ticket.
 * Usa componentes de Resend si lo integras.
 */
export function renderTicketEmailTemplate(notification: TicketNotification): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .body { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
          .detail { background: white; padding: 12px; margin: 8px 0; border-left: 4px solid #667eea; }
          .detail-label { font-weight: 600; color: #667eea; font-size: 12px; }
          .detail-value { margin-top: 4px; font-size: 14px; }
          .severity { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; }
          .severity-alto { background: #fee2e2; color: #991b1b; }
          .severity-medio { background: #fef3c7; color: #92400e; }
          .severity-bajo { background: #d1fae5; color: #065f46; }
          .footer { color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Nuevo Ticket de Soporte</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9;">Código: ${notification.ticketCode}</p>
          </div>
          <div class="body">
            <div class="detail">
              <div class="detail-label">Empresa</div>
              <div class="detail-value">${notification.clientName}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Asunto</div>
              <div class="detail-value">${notification.subject}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Severidad</div>
              <div class="detail-value">
                <span class="severity severity-${notification.severity.toLowerCase()}">
                  ${notification.severity}
                </span>
              </div>
            </div>
            <div class="detail">
              <div class="detail-label">Contacto del Cliente</div>
              <div class="detail-value">
                <a href="mailto:${notification.clientEmail}">${notification.clientEmail}</a>
              </div>
            </div>
            <div class="detail">
              <div class="detail-label">Creado por</div>
              <div class="detail-value">${notification.staffName}</div>
            </div>
            <div style="margin-top: 24px; padding: 12px; background: #eef2ff; border-radius: 4px;">
              <p style="margin: 0; font-size: 13px; color: #4f46e5;">
                ✓ Este ticket ha sido registrado en el portal de soporte y puede ser consultado en cualquier momento.
              </p>
            </div>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático. Por favor, no respondas a este correo.</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
