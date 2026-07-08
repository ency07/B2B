import { getSupabaseAdmin } from "@/platform/auth/clients";

export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): Promise<{ allowed: boolean; remaining: number }> {
  const admin = getSupabaseAdmin();
  const now = new Date();
  const windowKey = Math.floor(now.getTime() / windowMs).toString();
  const expiresAt = new Date(now.getTime() + windowMs).toISOString();

  // Upsert: increment count if exists, insert new if not
  const { data, error } = await admin
    .from("rate_limits")
    .upsert(
      {
        identifier,
        window_key: windowKey,
        count: 1,
        expires_at: expiresAt,
      },
      {
        onConflict: "identifier,window_key",
        ignoreDuplicates: false,
      }
    )
    .select("count")
    .single();

  if (error) {
    console.error("Rate limit check error:", error);
    // Fail open — permitir en caso de error de BD
    return { allowed: true, remaining: maxRequests };
  }

  const currentCount = data?.count ?? 1;
  const allowed = currentCount <= maxRequests;

  if (allowed && currentCount > 1) {
    // Increment count on subsequent requests
    await admin
      .from("rate_limits")
      .update({ count: currentCount })
      .eq("identifier", identifier)
      .eq("window_key", windowKey);
  }

  return { allowed, remaining: Math.max(0, maxRequests - currentCount) };
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