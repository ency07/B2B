"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { applyTenantToPath, isSafeRedirect } from "@/utils/auth-redirect";
import { logAuthEvent } from "@/lib/utils/audit-logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function loginPortal(
  email: string,
  password: string,
  tenant?: string | null,
  redirect?: string
): Promise<{ success: boolean; redirectTo?: string; error?: string }> {
  if (!email || !password) {
    return { success: false, error: "Email y contraseña requeridos" };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !authData?.user) {
    await logAuthEvent("LOGIN_FAILED", null, { email, error: error?.message });
    return { success: false, error: "Credenciales incorrectas" };
  }

  await logAuthEvent("LOGIN_SUCCESS", authData.user.id, { email });

  const cookieStore = await cookies();
  const safeRedirect = isSafeRedirect(redirect) ? redirect : "/portal";
  const destination = applyTenantToPath(safeRedirect, tenant);

  const session = authData.session;
  if (session) {
    cookieStore.set("sb-portal-access-token", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60,
    });
    cookieStore.set("sb-portal-refresh-token", session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  const sessionVersion = Number(cookieStore.get("sb-session-version")?.value || "0") + 1;
  cookieStore.set("sb-session-version", String(sessionVersion), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return { success: true, redirectTo: destination };
}