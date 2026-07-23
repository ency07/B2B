"use server";

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

/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import { getTenantId } from "@/erp/actions/core";
import { requireAction, validateTenantAccess } from "@/platform/auth/server-guards";
import {
  validate,
  uuidSchema,
  createUserSchema,
  updateUserSchema,
  userRoleSchema,
} from "@/lib/validations/erp";
import createLogger from "@/lib/utils/logger";
import { startTimer } from "@/lib/utils/timing";

const logger = createLogger("erp:users");

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
  const ctx = await requireAction("users.edit");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const timer = startTimer("listUsers");

  const { data: usersData, error: usersErr } = await supabaseAdmin
    .from("users")
    .select("id, first_name, last_name, email, phone")
    .eq("tenant_id", tenantId)
    .order("first_name", { ascending: true });

  if (usersErr) {
    logger.error("Error listando usuarios", { data: { error: usersErr } });
    timer.stop({ ok: false });
    return [];
  }
  if (!usersData || usersData.length === 0) {
    timer.stop({ ok: true, count: 0 });
    return [];
  }

  const userIds = usersData.map((u: any) => u.id);

  const { data: assignmentsData, error: assignErr } = await supabaseAdmin
    .from("user_roles")
    .select("user_id, role_id, roles ( id, role_code, name, description )")
    .in("user_id", userIds);

  if (assignErr) {
    logger.error("Error listando asignaciones", { data: { error: assignErr } });
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

  timer.stop({ ok: true, count: usersData.length });
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
  const ctx = await requireAction("users.permissions");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data, error } = await supabaseAdmin
    .from("roles")
    .select("id, role_code, name, description")
    .eq("tenant_id", tenantId)
    .eq("status", "Activo")
    .order("name", { ascending: true });

  if (error) {
    logger.error("Error listando roles", { data: { error } });
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
  const ctx = await requireAction("users.create");
  data = validate(createUserSchema, data);
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const timer = startTimer("createUser");

  // 1. Crear usuario en Supabase Auth.
  const { data: authData, error: authErr } =
    await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      email_confirm: true,
    });
  if (authErr || !authData.user) {
    logger.error("Error creando usuario en Auth", { data: { error: authErr } });
    timer.stop({ ok: false });
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
    logger.error("Error creando fila de usuario", { data: { error: userErr } });
    // Rollback: borrar el auth user.
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    timer.stop({ ok: false });
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
      logger.error("Usuario creado pero no se pudo asignar el rol", { data: { error: roleErr } });
      timer.stop({ ok: true, roleAssigned: false });
      return {
        success: true,
        userId: user.id,
        error: `Usuario creado pero no se pudo asignar el rol: ${roleErr.message}`,
      };
    }
  }

  timer.stop({ ok: true, roleAssigned: !!data.roleId });
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
  const ctx = await requireAction("users.edit");
  validate(uuidSchema, userId);
  data = validate(updateUserSchema, data);
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

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
    logger.error("Error updating user", { data: { error } });
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
  const ctx = await requireAction("users.permissions");
  ({ userId, roleId } = validate(userRoleSchema, { userId, roleId }));
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

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
    logger.error("Error assigning role", { data: { error } });
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
  const ctx = await requireAction("users.permissions");
  ({ userId, roleId } = validate(userRoleSchema, { userId, roleId }));
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { error } = await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", userId)
    .eq("role_id", roleId)
    .eq("tenant_id", tenantId);

  if (error) {
    logger.error("Error removing role", { data: { error } });
    return { success: false, error: error.message };
  }
  return { success: true };
}
