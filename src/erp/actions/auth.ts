"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { applyTenantToPath, isSafeRedirect } from "@/utils/auth-redirect";
import { logAuthEvent } from "@/lib/utils/audit-logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function loginErp(data: {
  email: string;
  password: string;
  tenant?: string | null;
  redirect?: string;
}) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error || !authData.user) {
    await logAuthEvent("LOGIN_FAILED", null, { email: data.email, error: error?.message });
    return {
      success: false,
      error: error?.message === "Invalid login credentials"
        ? "Credenciales incorrectas."
        : error?.message || "Error de autenticación",
    };
  }

  if (!authData.session) {
    return { success: false, error: "Error al iniciar sesión" };
  }

  await logAuthEvent("LOGIN_SUCCESS", authData.user.id, { email: data.email });

  const cookieStore = await cookies();
  const redirectPath = data.redirect || "";
  const safeRedirect: string = isSafeRedirect(redirectPath) ? redirectPath : "/dashboard";
  const destination = applyTenantToPath(safeRedirect, data.tenant || null);

  const session = authData.session;
  if (!session.access_token || !session.refresh_token) {
    return { success: false, error: "Error al obtener tokens de sesión" };
  }
  cookieStore.set("sb-erp-access-token", session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  cookieStore.set("sb-erp-refresh-token", session.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  const sessionVersion = Number(cookieStore.get("sb-session-version")?.value || "0") + 1;
  // httpOnly: false es intencional — el SessionVersionListener necesita leer esta cookie
  // desde JS para detectar logouts en otras pestañas. No contiene datos sensibles.
  cookieStore.set("sb-session-version", String(sessionVersion), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 2,
  });

  return { success: true, redirectTo: destination };
}