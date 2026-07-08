import { getSupabaseAdmin } from "@/platform/auth/clients";

export type AuthEvent =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "PASSWORD_RESET_REQUEST"
  | "PASSWORD_RESET_COMPLETED"
  | "INVITE_SENT"
  | "ROLE_CHANGED"
  | "USER_DEACTIVATED";

export async function logAuthEvent(
  event: AuthEvent,
  userId?: string | null,
  metadata?: Record<string, unknown>
) {
  try {
    const admin = getSupabaseAdmin();
    await admin.from("audit_log").insert({
      tenant_id: null, // auth events are cross-tenant
      event_code: event,
      entity_type: "auth",
      entity_id: userId,
      action: event.toLowerCase(),
      new_values: metadata || {},
      user_id: userId,
      ip_address: null, // No disponible en serverless
      user_agent: null,
    });
  } catch (err) {
    console.error(`[audit] Failed to log event ${event}:`, err);
  }
}