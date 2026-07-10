"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { applyTenantToPath, isSafeRedirect } from "@/utils/auth-redirect";
import { logAuthEvent } from "@/lib/utils/audit-logger";
import { ROUTES } from "@/lib/routes";
import { loginSchema } from "@/lib/utils/auth-schemas";
import { checkLoginRateLimit } from "@/lib/utils/rate-limiter";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function loginPortal(
  email: string,
  password: string,
  tenant?: string | null,
  redirect?: string
): Promise<{ success: boolean; redirectTo?: string; error?: string; session?: { access_token: string; refresh_token: string; expires_in: number } }> {
  // — M-01: Validación Zod —
  const parseResult = loginSchema.safeParse({ email, password });
  if (!parseResult.success) {
    return { success: false, error: "Credenciales inválidas" };
  }
  const normalizedEmail = parseResult.data.email.trim().toLowerCase();

  // — M-02: Rate limiting (5 intentos por minuto por email) —
  const { allowed } = await checkLoginRateLimit(normalizedEmail, "portal");
  if (!allowed) {
    await logAuthEvent("LOGIN_FAILED", null, { email: normalizedEmail, error: "rate_limit_exceeded" });
    return { success: false, error: "Demasiados intentos. Espera 1 minuto." };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: parseResult.data.password,
  });

  if (error || !authData?.user) {
    await logAuthEvent("LOGIN_FAILED", null, { email: normalizedEmail, error: error?.message });
    return { success: false, error: "Credenciales inválidas" };
  }

  if (!authData.session) {
    await logAuthEvent("LOGIN_FAILED", null, { email: normalizedEmail, error: "no_session" });
    return { success: false, error: "Tu cuenta aún no está activada. Revisa tu correo de confirmación." };
  }

  const session = authData.session;
  if (!session.access_token || !session.refresh_token) {
    return { success: false, error: "Error al obtener tokens de sesión" };
  }

  await logAuthEvent("LOGIN_SUCCESS", authData.user.id, { email: normalizedEmail });

  const cookieStore = await cookies();
  const redirectStr = redirect || "";
  const safeRedirect: string = isSafeRedirect(redirectStr) ? redirectStr : ROUTES.PORTAL;
  const destination = applyTenantToPath(safeRedirect, tenant);

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

  return {
    success: true,
    redirectTo: destination,
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in ?? 3600,
    },
  };
}