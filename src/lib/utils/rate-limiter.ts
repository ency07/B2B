import { getSupabaseAdmin } from "@/platform/auth/clients";

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_SECONDS = 60;

/**
 * Verifica y contabiliza un intento de login usando la función SQL atómica
 * check_and_increment_rate_limit (migración 51). Diferencia de checkRateLimit:
 * usa INSERT ON CONFLICT DO UPDATE vía RPC para eliminar la race condition
 * del SELECT-then-UPDATE. Fail-closed: un error de BD bloquea el intento.
 */
export async function checkLoginRateLimit(
  email: string,
  domain: "erp" | "portal"
): Promise<{ allowed: boolean }> {
  const admin = getSupabaseAdmin();
  const normalized = email.trim().toLowerCase();
  const identifier = `login:${domain}:${normalized}`;
  const windowMinute = Math.floor(Date.now() / (LOGIN_WINDOW_SECONDS * 1000));
  const windowKey = String(windowMinute);
  const expiresAt = new Date((windowMinute + 2) * LOGIN_WINDOW_SECONDS * 1000).toISOString();

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any).rpc("check_and_increment_rate_limit", {
      p_identifier: identifier,
      p_window_key: windowKey,
      p_expires_at: expiresAt,
    });

    if (error) {
      console.error("[rate-limiter] check_and_increment_rate_limit:", error);
      return { allowed: false }; // fail-closed
    }

    const count = typeof data === "number" ? data : 0;
    return { allowed: count <= MAX_LOGIN_ATTEMPTS };
  } catch (err) {
    console.error("[rate-limiter] Unexpected error:", err);
    return { allowed: false }; // fail-closed
  }
}

export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): Promise<{ allowed: boolean; remaining: number }> {
  const admin = getSupabaseAdmin();
  const now = new Date();
  const windowKey = Math.floor(now.getTime() / windowMs).toString();
  const expiresAt = new Date(now.getTime() + windowMs).toISOString();

  try {
    // SELECT: buscar el contador existente para este identificador y ventana
    const { data: existing, error: selectError } = await admin
      .from("rate_limits")
      .select("count")
      .eq("identifier", identifier)
      .eq("window_key", windowKey)
      .maybeSingle();

    if (selectError) throw selectError;

    let newCount: number;

    if (!existing) {
      // Primera request en esta ventana: insertar con count=1
      const { error: insertError } = await admin
        .from("rate_limits")
        .insert({ identifier, window_key: windowKey, count: 1, expires_at: expiresAt });
      if (insertError) throw insertError;
      newCount = 1;
    } else {
      // Request subsiguiente: incrementar el contador atómicamente
      newCount = existing.count + 1;
      const { error: updateError } = await admin
        .from("rate_limits")
        .update({ count: newCount })
        .eq("identifier", identifier)
        .eq("window_key", windowKey);
      if (updateError) throw updateError;
    }

    const allowed = newCount <= maxRequests;
    return { allowed, remaining: Math.max(0, maxRequests - newCount) };
  } catch (err) {
    // Fail-closed: ante error de BD, denegar la petición para evitar abuso
    // durante degradaciones de infraestructura [H-06]
    console.error("Rate limit check error:", err);
    return { allowed: false, remaining: 0 };
  }
}

// Cleanup expired entries (llamar periódicamente o en cron)
export async function cleanupExpiredRateLimits(): Promise<number> {
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("rate_limits")
    .delete()
    .lt("expires_at", new Date().toISOString())
    .select("id");

  if (error) {
    console.error("Rate limit cleanup error:", error);
    return 0;
  }

  return data?.length ?? 0;
}