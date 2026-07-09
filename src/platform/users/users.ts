"use server";

import { cache } from "react";
import { supabaseAdmin } from "@/platform/auth/clients";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const getUserRole = cache(async (authUserId: string): Promise<string | null> => {
  // JOIN en una sola query en lugar de dos sequenciales
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("user_roles!user_roles_user_id_fkey(roles(role_code))")
    .eq("auth_user_id", authUserId)
    .eq("status", "Activo")
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const userRoles = data.user_roles as any;
  const first = Array.isArray(userRoles) ? userRoles[0] : userRoles;
  return (first?.roles as any)?.role_code ?? null;
});
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function getUserTenant(authUserId: string): Promise<{ id: string; code: string } | null> {
  const { data: user, error: userErr } = await supabaseAdmin
    .from("users")
    .select(`
      tenant_id,
      tenants (
        id,
        tenant_code
      )
    `)
    .eq("auth_user_id", authUserId)
    .limit(1)
    .maybeSingle();

  if (userErr || !user) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantsObj = user.tenants as any;
  if (!tenantsObj) return null;
  return {
    id: tenantsObj.id,
    code: tenantsObj.tenant_code,
  };
}
