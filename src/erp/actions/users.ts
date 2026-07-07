/**
 * Acciones para gestion de usuarios y roles (P5).
 *
 * Solo se exponen las acciones definidas en la columna "Visibilidad (UX)"
 * de la matriz RBAC para Administrador:
 *  - users.create    -> createUser
 *  - users.edit       -> updateUser
 *  - users.permissions -> assignRole / removeRole
 *
 * El resto (delete, ban, etc.) no se implementa porque la matriz no
 * lo define.
 */

"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import { getTenantId } from "@/erp/actions/core";
import { requireAction } from "@/platform/auth/server-guards";

export interface UserListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  roleIds: string[];
  roleCodes: string[];
}

export interface RoleListItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
}

/**
 * Lista los usuarios del tenant con sus roles asignados.
 */
export async function listUsers(
  tenantCode: string | null
): Promise<UserListItem[]> {
  const tenantId = await getTenantId(tenantCode);

  const { data: usersData, error: usersErr } = await supabaseAdmin
    .from("users")
    .select("id, first_name, last_name, email, phone")
    .eq("tenant_id", tenantId)
    .order("first_name", { ascending: true });

  if (usersErr) {
    console.error("Error listando usuarios:", usersErr);
    return [];
  }
  if (!usersData || usersData.length === 0) return [];

  const userIds = usersData.map((u: any) => u.id);

  const { data: assignmentsData, error: assignErr } = await supabaseAdmin
    .from("user_roles")
    .select("user_id, role_id, roles ( id, role_code, name, description )")
    .in("user_id", userIds);

  if (assignErr) {
    console.error("Error listando asignaciones:", assignErr);
  }

  const rolesByCode: Record<string, { id: string; code: string; name: string; description: string | null }> = {};
  const assignmentsByUser: Record<string, { roleId: string; roleCode: string }[]> = {};
  for (const a of assignmentsData || []) {
    const roleInfo = (a as any).roles;
    if (!roleInfo) continue;
    rolesByCode[roleInfo.role_code] = {
      id: roleInfo.id,
      code: roleInfo.role_code,
      name: roleInfo.name,
      description: roleInfo.description,
    };
    if (!assignmentsByUser[a.user_id]) {
      assignmentsByUser[a.user_id] = [];
    }
    assignmentsByUser[a.user_id].push({
      roleId: roleInfo.id,
      roleCode: roleInfo.role_code,
    });
  }

  return usersData.map((u: any) => {
    const assignments = assignmentsByUser[u.id] || [];
    return {
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      email: u.email,
      phone: u.phone,
      roleIds: assignments.map((a) => a.roleId),
      roleCodes: assignments.map((a) => a.roleCode),
    };
  });
}

/**
 * Lista los roles disponibles en el tenant.
 */
export async function listRoles(
  tenantCode: string | null
): Promise<RoleListItem[]> {
  const tenantId = await getTenantId(tenantCode);

  const { data, error } = await supabaseAdmin
    .from("roles")
    .select("id, role_code, name, description")
    .eq("tenant_id", tenantId)
    .eq("status", "Activo")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error listando roles:", error);
    return [];
  }

  return (data || []).map((r: any) => ({
    id: r.id,
    code: r.role_code,
    name: r.name,
    description: r.description,
  }));
}

/**
 * Crea un usuario nuevo en Supabase Auth + tabla users + asigna un rol.
 * Accion: users.create.
 */
export async function createUser(
  tenantCode: string | null,
  data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roleId: string | null;
  }
): Promise<{ success: boolean; error?: string; userId?: string }> {
  // P8: Validacion backend. Accion: users.create.
  await requireAction("users.create");
  const tenantId = await getTenantId(tenantCode);

  // 1. Crear usuario en Supabase Auth.
  const { data: authData, error: authErr } =
    await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
    });
  if (authErr || !authData.user) {
    return {
      success: false,
      error: authErr?.message || "Error creando usuario en Auth",
    };
  }

  // 2. Crear fila en users.
  const { data: user, error: userErr } = await supabaseAdmin
    .from("users")
    .insert({
      tenant_id: tenantId,
      auth_user_id: authData.user.id,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone || null,
    })
    .select("id")
    .single();

  if (userErr || !user) {
    // Rollback: borrar el auth user.
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    return {
      success: false,
      error: userErr?.message || "Error creando fila de usuario",
    };
  }

  // 3. Asignar rol si fue provisto.
  if (data.roleId) {
    const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
      tenant_id: tenantId,
      user_id: user.id,
      role_id: data.roleId,
    });
    if (roleErr) {
      return {
        success: true,
        userId: user.id,
        error: `Usuario creado pero no se pudo asignar el rol: ${roleErr.message}`,
      };
    }
  }

  return { success: true, userId: user.id };
}

/**
 * Actualiza los datos editables de un usuario.
 * Accion: users.edit.
 */
export async function updateUser(
  tenantCode: string | null,
  userId: string,
  data: { firstName?: string; lastName?: string; phone?: string }
): Promise<{ success: boolean; error?: string }> {
  // P8: Validacion backend. Accion: users.edit.
  await requireAction("users.edit");
  const tenantId = await getTenantId(tenantCode);

  const update: Record<string, string | null> = {};
  if (data.firstName !== undefined) update.first_name = data.firstName;
  if (data.lastName !== undefined) update.last_name = data.lastName;
  if (data.phone !== undefined) update.phone = data.phone;

  if (Object.keys(update).length === 0) {
    return { success: true };
  }

  const { error } = await supabaseAdmin
    .from("users")
    .update(update)
    .eq("id", userId)
    .eq("tenant_id", tenantId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Asigna un rol a un usuario.
 * Accion: users.permissions.
 */
export async function assignRole(
  tenantCode: string | null,
  userId: string,
  roleId: string
): Promise<{ success: boolean; error?: string }> {
  // P8: Validacion backend. Accion: users.permissions.
  await requireAction("users.permissions");
  const tenantId = await getTenantId(tenantCode);

  const { error } = await supabaseAdmin.from("user_roles").insert({
    tenant_id: tenantId,
    user_id: userId,
    role_id: roleId,
  });

  if (error) {
    // Si ya existe la asignacion, lo tomamos como exito idempotente.
    if (error.code === "23505") {
      return { success: true };
    }
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Quita un rol de un usuario.
 * Accion: users.permissions.
 */
export async function removeRole(
  tenantCode: string | null,
  userId: string,
  roleId: string
): Promise<{ success: boolean; error?: string }> {
  // P8: Validacion backend. Accion: users.permissions.
  await requireAction("users.permissions");
  const tenantId = await getTenantId(tenantCode);

  const { error } = await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role_id", roleId)
    .eq("tenant_id", tenantId);

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}
