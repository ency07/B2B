/**
 * Helpers de autenticacion en servidor — EXCLUSIVOS del contexto ERP.
 *
 * Permiten a las Server Actions del ERP verificar la identidad del usuario
 * y validar que tiene la accion requerida por la matriz RBAC.
 *
 * IMPORTANTE: estas funciones leen SOLO sb-erp-access-token.
 * El Portal usa getCurrentClient() en @/lib/portal-auth, que lee
 * sb-portal-access-token. Nunca mezclar contextos (C-04).
 */

import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { canPerform, type Action, type RoleName } from "@/lib/role-permissions";
import { getUserRole } from "@/platform/users/users";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

export interface AuthContext {
  userId: string;
  role: RoleName;
}

/**
 * Devuelve el contexto de autenticacion del usuario que invoca la
 * Server Action, o null si no esta autenticado.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-erp-access-token")?.value;
    if (!accessToken) return null;

    // Server-side: usamos un cliente anon dedicado (no persistimos sesion).
    const serverClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await serverClient.auth.getUser(accessToken);
    if (error || !data.user) return null;

    const role = await getUserRole(data.user.id);
    if (!role) return null;

    return { userId: data.user.id, role: role as RoleName };
  } catch {
    return null;
  }
});

/**
 * Verifica que el invocador tenga la accion requerida por la matriz RBAC.
 * Lanza Error si no esta autenticado o no tiene permisos.
 * Devuelve el contexto (userId, role) si todo OK.
 */
export async function requireAction(action: Action): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    throw new Error("No autenticado");
  }
  if (!canPerform(ctx.role, action)) {
    throw new Error(`Permiso denegado: ${action}`);
  }
  return ctx;
}

/**
 * Valida que el usuario tenga acceso al tenant especificado (acceso cruzado).
 * Lanza un error si hay una discrepancia y el usuario no es admin global.
 */
export async function validateTenantAccess(
  userId: string,
  role: string,
  tenantId: string
): Promise<void> {
  if (role === "SUPER_ADMIN" || role === "ADMIN_DEV") {
    return; // Administradores de plataforma pueden saltarse la restricción de tenant
  }

  // Usamos el JWT del usuario (desde cookies) en vez de supabaseAdmin
  // para que RLS restrinja la consulta solo a su propio registro.
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-erp-access-token")?.value;
  if (!accessToken) {
    throw new Error("No autenticado");
  }

  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data, error } = await anonClient
    .from("users")
    .select("tenant_id")
    .eq("auth_user_id", userId)
    .eq("status", "Activo")
    .limit(1)
    .maybeSingle();

  if (error || !data || data.tenant_id !== tenantId) {
    throw new Error("Acceso cruzado denegado: No perteneces a este tenant");
  }
}
