"use server";

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
 * Envía email real vía Resend cuando se crea un ticket.
 * Requiere RESEND_API_KEY en .env.
 * Si no está configurado, hace log y continúa sin error.
 */
export async function notifyClientTicketCreated(
  notification: TicketNotification
): Promise<{ ok: boolean; error?: string }> {
  try {
    const ctx = await getAuthContext();
    if (!ctx) return { ok: false, error: "No autenticado" };

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || "noreply@example.com";

    if (!resendKey) {
      console.log(
        `[notifications] RESEND_API_KEY no configurado — email de ticket omitido.\n`,
        `Ticket: ${notification.ticketCode} | Cliente: ${notification.clientName}`
      );
      return { ok: true };
    }

    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    const { error: emailErr } = await resend.emails.send({
      from: fromEmail,
      to: notification.clientEmail,
      subject: `[${notification.ticketCode}] Ticket registrado: ${notification.subject}`,
      html: renderTicketEmailTemplate(notification),
    });

    if (emailErr) {
      console.error("[notifications] Resend error:", emailErr);
      return { ok: false, error: String(emailErr) };
    }

    console.log(`[notifications] Email enviado a ${notification.clientEmail} para ${notification.ticketCode}`);
    return { ok: true };
  } catch (error) {
    console.error("[notifications] Error:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Error" };
  }
}

/**
 * Notifica al staff del tenant cuando cliente actúa (ticket/mensaje).
 * Soporta Slack y Discord vía webhooks configurados en .env.
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

    const slackUrl = process.env.SLACK_WEBHOOK_URL;
    const discordUrl = process.env.DISCORD_WEBHOOK_URL;

    // Si no hay webhooks configurados, solo loggear
    if (!slackUrl && !discordUrl) {
      const emoji = type === "ticket" ? "🎫" : "💬";
      console.log(
        `[notifications] ${emoji} ${type.toUpperCase()} de ${data.clientName}:`,
        type === "ticket"
          ? `${data.ticketCode} — ${data.subject}`
          : data.messageBody?.substring(0, 80)
      );
      return { ok: true };
    }

    const errors: string[] = [];

    // Slack webhook
    if (slackUrl) {
      const slackBody =
        type === "ticket"
          ? {
              text: `🎫 Nuevo ticket de *${data.clientName}*`,
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `🎫 *Nuevo Ticket* de *${data.clientName}*\n*${data.ticketCode}* — ${data.subject}`,
                  },
                },
              ],
            }
          : {
              text: `💬 Mensaje de *${data.clientName}*: ${data.messageBody?.substring(0, 100)}`,
            };

      const slackRes = await fetch(slackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(slackBody),
      });

      if (!slackRes.ok) {
        errors.push(`Slack: ${slackRes.status} ${slackRes.statusText}`);
      } else {
        console.log("[notifications] Slack webhook enviado OK");
      }
    }

    // Discord webhook
    if (discordUrl) {
      const discordBody =
        type === "ticket"
          ? {
              content: `🎫 **Nuevo ticket** de **${data.clientName}**`,
              embeds: [
                {
                  title: data.ticketCode || "Ticket",
                  description: data.subject || "",
                  color: 0x5865f2,
                  fields: [
                    { name: "Empresa", value: data.clientName, inline: true },
                  ],
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : {
              content: `💬 **${data.clientName}**: ${data.messageBody?.substring(0, 200)}`,
            };

      const discordRes = await fetch(discordUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(discordBody),
      });

      if (!discordRes.ok) {
        errors.push(`Discord: ${discordRes.status} ${discordRes.statusText}`);
      } else {
        console.log("[notifications] Discord webhook enviado OK");
      }
    }

    // También notificar al staff por email si hay un email de soporte configurado
    const staffEmail = process.env.STAFF_NOTIFICATION_EMAIL;
    const resendKey = process.env.RESEND_API_KEY;
    if (staffEmail && resendKey && type === "ticket") {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      const fromEmail = process.env.NOTIFICATION_FROM_EMAIL || "noreply@example.com";

      await resend.emails.send({
        from: fromEmail,
        to: staffEmail,
        subject: `[Portal] Nuevo ticket de ${data.clientName}: ${data.ticketCode}`,
        html: `<p>El cliente <strong>${data.clientName}</strong> ha creado el ticket <strong>${data.ticketCode}</strong>: ${data.subject}</p>`,
      });
    }

    if (errors.length > 0) {
      return { ok: false, error: errors.join("; ") };
    }

    return { ok: true };
  } catch (error) {
    console.error("[notifications] Error en notifyStaffClientUpdate:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Error" };
  }
}

/**
 * Template HTML para email de confirmación de ticket al cliente.
 */
export function renderTicketEmailTemplate(notification: TicketNotification): string {
  const severityColor =
    notification.severity === "ALTO"
      ? "#991b1b"
      : notification.severity === "MEDIO"
      ? "#92400e"
      : "#065f46";
  const severityBg =
    notification.severity === "ALTO"
      ? "#fee2e2"
      : notification.severity === "MEDIO"
      ? "#fef3c7"
      : "#d1fae5";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background: #f4f4f5; }
    .wrapper { max-width: 580px; margin: 32px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); padding: 32px 28px; }
    .header h1 { color: white; margin: 0; font-size: 22px; font-weight: 700; }
    .header .ticket-code { color: rgba(255,255,255,0.8); font-size: 13px; font-family: monospace; margin-top: 6px; }
    .body { padding: 28px; }
    .field { margin-bottom: 16px; }
    .field-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin-bottom: 4px; }
    .field-value { font-size: 15px; color: #111827; }
    .severity-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; background: ${severityBg}; color: ${severityColor}; }
    .cta { margin-top: 24px; padding: 16px; background: #f0f7ff; border-radius: 8px; border-left: 4px solid #2563eb; }
    .cta p { margin: 0; font-size: 14px; color: #1e40af; }
    .footer { padding: 20px 28px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Ticket de Soporte Registrado</h1>
      <div class="ticket-code">${notification.ticketCode}</div>
    </div>
    <div class="body">
      <div class="field">
        <div class="field-label">Empresa</div>
        <div class="field-value">${notification.clientName}</div>
      </div>
      <div class="field">
        <div class="field-label">Asunto</div>
        <div class="field-value">${notification.subject}</div>
      </div>
      <div class="field">
        <div class="field-label">Severidad</div>
        <div class="field-value"><span class="severity-badge">${notification.severity}</span></div>
      </div>
      <div class="field">
        <div class="field-label">Creado por</div>
        <div class="field-value">${notification.staffName}</div>
      </div>
      <hr>
      <div class="cta">
        <p>✅ Tu caso ha sido registrado y un especialista se pondrá en contacto contigo pronto.</p>
      </div>
    </div>
    <div class="footer">
      Este es un mensaje automático. No responder a este correo.<br>
      Para consultar el estado de tu ticket, accede al portal de clientes.
    </div>
  </div>
</body>
</html>`;
}
