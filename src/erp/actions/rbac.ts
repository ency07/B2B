'use server';

import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { invalidatePermissionCache } from '@/platform/middleware/auth-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/** Service-role client: bypasses RLS. Solo para Server Actions autorizadas. */
function adminClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// Schemas de validación
// ---------------------------------------------------------------------------

const UUIDSchema = z.string().uuid('ID inválido');

const CreateCustomRoleSchema = z.object({
  tenantId: UUIDSchema,
  roleName: z.string().min(3).max(100),
  roleCode: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_]+$/, 'El código debe ser mayúsculas, números y guiones bajos'),
  description: z.string().max(300).optional(),
  permissionIds: z.array(UUIDSchema).min(1, 'Debe asignar al menos un permiso'),
});

const AssignRoleSchema = z.object({
  userId: UUIDSchema,
  roleId: UUIDSchema,
  tenantId: UUIDSchema,
});

const GetPermissionsSchema = z.object({
  userId: UUIDSchema,
  tenantId: UUIDSchema,
});

// ---------------------------------------------------------------------------
// Tipos de respuesta y datos internos
// ---------------------------------------------------------------------------

type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type UserPermission = {
  permission_code: string;
  source: 'role' | 'individual_grant' | 'system_superuser';
};

export type CustomRole = {
  id: string;
  role_code: string;
  name: string;
  description: string | null;
  status: string;
  permissions: Array<{ id: string; permission_code: string; name: string }>;
};

type UserRoleRow = {
  user_roles: Array<{ roles: { role_code: string } }>;
};

type RoleRow = {
  id: string;
  role_code: string;
  name: string;
  description: string | null;
  status: string;
  role_permissions: Array<{ permissions: { id: string; permission_code: string; name: string } }>;
};

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

/** Verifica que todos los permissionIds existan en la tabla permissions. */
async function validatePermissionIds(ids: string[]): Promise<string | null> {
  const db = adminClient();
  const { data, error } = await db
    .from('permissions')
    .select('id')
    .in('id', ids);

  if (error) return 'Error al validar permisos';
  if (!data || data.length !== ids.length) {
    return `Uno o más permisos no existen en el sistema (esperados ${ids.length}, encontrados ${data?.length ?? 0})`;
  }
  return null;
}

/** Verifica que el usuario solicitante tenga permisos de administración en el tenant. */
async function assertTenantAdmin(callerAuthUserId: string, tenantId: string): Promise<string | null> {
  const db = adminClient();
  const { data } = await db
    .from('users')
    .select(`
      id,
      tenant_id,
      user_roles!user_roles_user_id_fkey(
        roles(role_code)
      )
    `)
    .eq('auth_user_id', callerAuthUserId)
    .eq('tenant_id', tenantId)
    .eq('status', 'Activo')
    .maybeSingle();

  if (!data) return 'Usuario no encontrado o sin acceso al tenant';

  const adminRoles = ['SUPER_ADMIN', 'ADMIN_EMPRESA', 'ADMIN_DEV'];
  const userRow = data as unknown as UserRoleRow;
  const userRoles = userRow.user_roles ?? [];
  const hasAdmin = userRoles.some((ur) =>
    adminRoles.includes(ur?.roles?.role_code)
  );
  if (!hasAdmin) return 'Permisos insuficientes: se requiere rol de administrador';

  return null;
}

// ---------------------------------------------------------------------------
// Server Action 1: createCustomRole
// ---------------------------------------------------------------------------

/**
 * Crea un rol personalizado para el tenant y le asigna los permisos indicados.
 *
 * Requiere que el caller sea ADMIN_EMPRESA, SUPER_ADMIN o ADMIN_DEV.
 * Los permissionIds son validados contra la tabla `permissions` para evitar
 * referencias inválidas.
 */
export async function createCustomRole(
  callerAuthUserId: string,
  input: z.infer<typeof CreateCustomRoleSchema>
): Promise<ActionResult<{ roleId: string }>> {
  const parsed = CreateCustomRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { tenantId, roleName, roleCode, description, permissionIds } = parsed.data;

  // Verificar autorización
  const authError = await assertTenantAdmin(callerAuthUserId, tenantId);
  if (authError) return { ok: false, error: authError };

  // Validar que los permisos existan
  const permError = await validatePermissionIds(permissionIds);
  if (permError) return { ok: false, error: permError };

  const db = adminClient();

  // Insertar el rol personalizado
  const { data: newRole, error: roleError } = await db
    .from('roles')
    .insert({
      tenant_id: tenantId,
      role_code: roleCode,
      name: roleName,
      description: description ?? null,
      status: 'Activo',
    })
    .select('id')
    .single();

  if (roleError) {
    if (roleError.code === '23505') {
      return { ok: false, error: `El código de rol '${roleCode}' ya existe en este tenant` };
    }
    return { ok: false, error: 'Error al crear el rol: ' + roleError.message };
  }

  // Asignar permisos al nuevo rol
  const rolePermissions = permissionIds.map((pid) => ({
    role_id: newRole.id,
    permission_id: pid,
  }));

  const { error: rpError } = await db
    .from('role_permissions')
    .insert(rolePermissions);

  if (rpError) {
    // Rollback manual: eliminar el rol recién creado
    await db.from('roles').delete().eq('id', newRole.id);
    return { ok: false, error: 'Error al asignar permisos al rol: ' + rpError.message };
  }

  revalidatePath('/dashboard/settings/roles');
  return { ok: true, data: { roleId: newRole.id } };
}

// ---------------------------------------------------------------------------
// Server Action 2: assignRoleToUser
// ---------------------------------------------------------------------------

/**
 * Asigna un rol personalizado del tenant a un usuario.
 * El rol debe pertenecer al mismo tenant del usuario.
 */
export async function assignRoleToUser(
  callerAuthUserId: string,
  input: z.infer<typeof AssignRoleSchema>
): Promise<ActionResult> {
  const parsed = AssignRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { userId, roleId, tenantId } = parsed.data;

  // Verificar autorización
  const authError = await assertTenantAdmin(callerAuthUserId, tenantId);
  if (authError) return { ok: false, error: authError };

  const db = adminClient();

  // Verificar que el rol pertenezca al tenant (o sea de sistema)
  const { data: role } = await db
    .from('roles')
    .select('id, tenant_id, status')
    .eq('id', roleId)
    .maybeSingle();

  if (!role) return { ok: false, error: 'Rol no encontrado' };
  if (role.status !== 'Activo') return { ok: false, error: 'El rol está inactivo' };
  if (role.tenant_id !== null && role.tenant_id !== tenantId) {
    return { ok: false, error: 'El rol no pertenece a este tenant' };
  }

  // Verificar que el usuario objetivo pertenezca al tenant
  const { data: targetUser } = await db
    .from('users')
    .select('id, tenant_id')
    .eq('id', userId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (!targetUser) return { ok: false, error: 'Usuario no encontrado en este tenant' };

  const { error: urError } = await db
    .from('user_roles')
    .insert({
      user_id: userId,
      role_id: roleId,
      tenant_id: tenantId,
    });

  if (urError) {
    if (urError.code === '23505') {
      return { ok: false, error: 'El usuario ya tiene asignado este rol' };
    }
    return { ok: false, error: 'Error al asignar el rol: ' + urError.message };
  }

  // Invalidar cache del usuario afectado para que el próximo request
  // refleje el nuevo rol sin esperar la expiración del TTL.
  invalidatePermissionCache(callerAuthUserId, tenantId);
  revalidatePath('/dashboard/settings/users');
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Server Action 3: revokeRoleFromUser
// ---------------------------------------------------------------------------

/** Revoca un rol de un usuario dentro del tenant. */
export async function revokeRoleFromUser(
  callerAuthUserId: string,
  input: z.infer<typeof AssignRoleSchema>
): Promise<ActionResult> {
  const parsed = AssignRoleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { userId, roleId, tenantId } = parsed.data;

  const authError = await assertTenantAdmin(callerAuthUserId, tenantId);
  if (authError) return { ok: false, error: authError };

  const db = adminClient();
  const { error } = await db
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role_id', roleId);

  if (error) return { ok: false, error: 'Error al revocar el rol: ' + error.message };

  revalidatePath('/dashboard/settings/users');
  return { ok: true, data: undefined };
}

// ---------------------------------------------------------------------------
// Server Action 4: getUserPermissions
// ---------------------------------------------------------------------------

/**
 * Retorna la lista de permisos efectivos del usuario (permisos_code + source).
 * Llama a la función SQL `get_user_permissions` con SECURITY DEFINER.
 */
export async function getUserPermissions(
  input: z.infer<typeof GetPermissionsSchema>
): Promise<ActionResult<UserPermission[]>> {
  const parsed = GetPermissionsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { userId, tenantId } = parsed.data;
  const db = adminClient();

  const { data, error } = await db.rpc('get_user_permissions', {
    p_user_id: userId,
    p_tenant_id: tenantId,
  });

  if (error) return { ok: false, error: 'Error al obtener permisos: ' + error.message };

  return { ok: true, data: (data ?? []) as UserPermission[] };
}

// ---------------------------------------------------------------------------
// Server Action 5: listCustomRoles
// ---------------------------------------------------------------------------

/** Lista los roles personalizados de un tenant con sus permisos asociados. */
export async function listCustomRoles(
  tenantId: string
): Promise<ActionResult<CustomRole[]>> {
  const uuidParsed = UUIDSchema.safeParse(tenantId);
  if (!uuidParsed.success) return { ok: false, error: 'tenantId inválido' };

  const db = adminClient();
  const { data, error } = await db
    .from('roles')
    .select(`
      id,
      role_code,
      name,
      description,
      status,
      role_permissions(
        permissions(id, permission_code, name)
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('status', 'Activo')
    .order('name');

  if (error) return { ok: false, error: error.message };

  const roles: CustomRole[] = (data ?? []).map((r: unknown) => {
    const roleRow = r as RoleRow;
    return {
      id: roleRow.id,
      role_code: roleRow.role_code,
      name: roleRow.name,
      description: roleRow.description,
      status: roleRow.status,
      permissions: (roleRow.role_permissions ?? [])
        .map((rp) => rp.permissions)
        .filter(Boolean),
    };
  });

  return { ok: true, data: roles };
}

// ---------------------------------------------------------------------------
// Server Action 6: updateCustomRolePermissions
// ---------------------------------------------------------------------------

/**
 * Reemplaza el conjunto de permisos de un rol personalizado.
 * Elimina los permisos existentes y asigna los nuevos en una operación atómica.
 */
export async function updateCustomRolePermissions(
  callerAuthUserId: string,
  roleId: string,
  tenantId: string,
  permissionIds: string[]
): Promise<ActionResult> {
  const roleIdParsed = UUIDSchema.safeParse(roleId);
  const tenantIdParsed = UUIDSchema.safeParse(tenantId);
  if (!roleIdParsed.success || !tenantIdParsed.success) {
    return { ok: false, error: 'IDs inválidos' };
  }
  if (permissionIds.length === 0) {
    return { ok: false, error: 'Debe asignar al menos un permiso' };
  }

  const authError = await assertTenantAdmin(callerAuthUserId, tenantId);
  if (authError) return { ok: false, error: authError };

  const permError = await validatePermissionIds(permissionIds);
  if (permError) return { ok: false, error: permError };

  const db = adminClient();

  // Verificar que el rol pertenezca al tenant
  const { data: role } = await db
    .from('roles')
    .select('id, tenant_id')
    .eq('id', roleId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (!role) return { ok: false, error: 'Rol no encontrado en este tenant' };

  // Eliminar permisos actuales
  const { error: delError } = await db
    .from('role_permissions')
    .delete()
    .eq('role_id', roleId);

  if (delError) return { ok: false, error: 'Error al actualizar permisos: ' + delError.message };

  // Insertar nuevos permisos
  const newRolePerms = permissionIds.map((pid) => ({
    role_id: roleId,
    permission_id: pid,
  }));

  const { error: insError } = await db
    .from('role_permissions')
    .insert(newRolePerms);

  if (insError) return { ok: false, error: 'Error al insertar permisos: ' + insError.message };

  revalidatePath('/dashboard/settings/roles');
  return { ok: true, data: undefined };
}
