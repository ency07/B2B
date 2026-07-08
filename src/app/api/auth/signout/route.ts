import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function POST(request: Request) {
  const cookieStore = await cookies();

  // Try to get user info before revoking tokens (for audit logging)
  let userId: string | null = null;
  for (const name of ["sb-portal-access-token", "sb-erp-access-token"]) {
    const token = cookieStore.get(name)?.value;
    if (token) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) userId = user.id;
      } catch {
        // Continue
      }
      break;
    }
  }

  // Try to revoke each active session token gracefully
  const tokenNames = [
    "sb-portal-access-token",
    "sb-erp-access-token",
  ];

  for (const name of tokenNames) {
    const token = cookieStore.get(name)?.value;
    if (token) {
      try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        await supabase.auth.signOut();
      } catch {
        // Continue cleaning cookies even if revocation fails
      }
    }
  }

  const response = NextResponse.redirect(new URL("/login", request.url));

  const cookiesToClear = [
    "sb-portal-access-token",
    "sb-portal-refresh-token",
    "sb-erp-access-token",
    "sb-erp-refresh-token",
  ];

  for (const name of cookiesToClear) {
    response.cookies.set(name, "", { path: "/", maxAge: 0, sameSite: "lax" });
  }

  // Increment session version to force other tabs to detect logout
  const sessionVersion = Number(cookieStore.get("sb-session-version")?.value || "0") + 1;
  response.cookies.set("sb-session-version", String(sessionVersion), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  // Log logout event (fire-and-forget)
  if (userId) {
    import("@/lib/utils/audit-logger").then(({ logAuthEvent }) =>
      logAuthEvent("LOGOUT", userId, {})
    );
  }

  return response;
}
