"use server";

import { getErpBrowserClient } from "@/platform/auth/clients";
import { applyTenantToPath, isSafeRedirect } from "@/utils/auth-redirect";
import { cookies } from "next/headers";

export async function loginErp(data: {
  email: string;
  password: string;
  tenant?: string | null;
  redirect?: string;
}) {
  const supabase = getErpBrowserClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return {
      success: false,
      error: error.message === "Invalid login credentials"
        ? "Credenciales incorrectas."
        : error.message,
    };
  }

  const tenantParam = data.tenant || null;
  const rawRedirect = data.redirect || "/dashboard";
  const redirectTo = isSafeRedirect(rawRedirect) ? rawRedirect : "/dashboard";
  const destination = applyTenantToPath(redirectTo, tenantParam);

  // Set session version cookie for cross-tab sync
  const cookieStore = await cookies();
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