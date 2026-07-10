"use server";

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { applyTenantToPath, isSafeRedirect } from "@/utils/auth-redirect";
import { logAuthEvent } from "@/lib/utils/audit-logger";
import { supabaseAdmin } from "@/platform/auth/clients";
import { loginSchema } from "@/lib/utils/auth-schemas";
import { checkLoginRateLimit } from "@/lib/utils/rate-limiter";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export async function loginErp(data: {
  email: string;
  password: string;
  tenant?: string | null;
  redirect?: string;
}) {
  // — M-01: Validación Zod —
  const parseResult = loginSchema.safeParse({ email: data.email, password: data.password });
  if (!parseResult.success) {
    return { success: false, error: "Credenciales inválidas" };
  }
  const normalizedEmail = parseResult.data.email.trim().toLowerCase();

  // — M-02: Rate limiting (5 intentos por minuto por email) —
  const { allowed } = await checkLoginRateLimit(normalizedEmail, "erp");
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

  if (error || !authData.user) {
    await logAuthEvent("LOGIN_FAILED", null, { email: normalizedEmail, error: error?.message });
    return { success: false, error: "Credenciales inválidas" };
  }

  if (!authData.session) {
    return { success: false, error: "Error al iniciar sesión" };
  }

  // Verificar acceso ERP antes de emitir cookies.
  // Sin esta verificación, un usuario sin fila en public.users o sin user_roles
  // causa un loop silencioso: middleware y layout redirigen a /login porque
  // getUserRole() devuelve null.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const { data: erpUser } = await supabaseAdmin
    .from("users")
    .select("id, user_roles!user_roles_user_id_fkey(roles(role_code))")
    .eq("auth_user_id", authData.user.id)
    .eq("status", "Activo")
    .limit(1)
    .maybeSingle();

  if (!erpUser) {
    await logAuthEvent("LOGIN_FAILED", authData.user.id, {
      email: normalizedEmail,
      error: "Usuario no encontrado o inactivo en ERP",
    });
    return { success: false, error: "Tu cuenta no está configurada en el ERP. Contacta al administrador." };
  }

  const roles = ((erpUser as any).user_roles as any[]) || [];
  const roleCode: string | undefined = (roles[0] as any)?.roles?.role_code;
  /* eslint-enable @typescript-eslint/no-explicit-any */
  if (!roleCode || roleCode === "CLIENTE") {
    await logAuthEvent("LOGIN_FAILED", authData.user.id, {
      email: normalizedEmail,
      error: `Rol sin acceso ERP: ${roleCode ?? "sin rol"}`,
    });
    return { success: false, error: "No tienes permisos de acceso al ERP. Contacta al administrador." };
  }

  await logAuthEvent("LOGIN_SUCCESS", authData.user.id, { email: normalizedEmail });

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

  // Devolver los tokens al cliente para hidratar el browser Supabase client
  // vía setSession() → localStorage. El layout usa getAuthContext() (cookies HttpOnly);
  // los client components (DashboardPage, etc.) usan el browser client (localStorage).
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