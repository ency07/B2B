"use server";

import { supabaseAdmin } from "@/platform/auth/clients";

export async function getUserRole(authUserId: string): Promise<string | null> {
  const { data: user, error: userErr } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_user_id", authUserId)
    .eq("status", "Activo")
    .limit(1)
    .maybeSingle();

  if (userErr || !user) {
    // Si no se encuentra en la tabla users, retornamos null
    return null;
  }

  const { data: userRole, error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .select(`
      roles (
        role_code
      )
    `)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (roleErr || !userRole) {
    return null;
  }

  // userRole.roles es un objeto o array dependiendo del tipado generado
  const rolesObj = userRole.roles as any;
  return rolesObj?.role_code || null;
}

export async function getUserTenant(authUserId: string): Promise<{ id: string; code: string } | null> {
  const { data: user, error: userErr } = await supabaseAdmin
    .from("users")
    .select(`
      tenant_id,
      tenants (
        id,
        code
      )
    `)
    .eq("auth_user_id", authUserId)
    .limit(1)
    .maybeSingle();

  if (userErr || !user) {
    return null;
  }

  const tenantsObj = user.tenants as any;
  if (!tenantsObj) return null;
  return {
    id: tenantsObj.id,
    code: tenantsObj.code,
  };
}
