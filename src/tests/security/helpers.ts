/**
 * Helpers compartidos para tests de seguridad multi-tenant.
 *
 * Los tests se dividen en dos categorías:
 *  - Con credenciales reales (SUPABASE_SERVICE_ROLE_KEY en env): usan
 *    el cliente admin real contra el proyecto de staging/dev.
 *  - Sin credenciales (CI sin secrets): se saltan automáticamente.
 *
 * Los tests RBAC nuevos usan mocks de Vitest para no requerir credenciales.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Constantes de tenants de staging (usadas en tests de integración real)
// ---------------------------------------------------------------------------

export const ACME_TENANT_ID = process.env.TEST_ACME_TENANT_ID ?? 'a0000000-0000-0000-0000-000000000001';
export const APEX_TENANT_ID = process.env.TEST_APEX_TENANT_ID ?? 'b0000000-0000-0000-0000-000000000001';
export const TEST_PASSWORD  = process.env.TEST_USER_PASSWORD  ?? 'TestPass123!';

export const hasLiveCredentials =
  !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY !== 'placeholder-anon-key' &&
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

// ---------------------------------------------------------------------------
// Cliente admin (service role)
// ---------------------------------------------------------------------------

export function getAdminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface TestStaffUser {
  userId: string;      // users.id (internal)
  authUserId: string;  // auth.users.id
  email: string;
  tenantId: string;
  roleCode: string;
  client: SupabaseClient;
}

// ---------------------------------------------------------------------------
// Factory de usuarios de prueba
// ---------------------------------------------------------------------------

/**
 * Crea un usuario de prueba desechable via Supabase Admin API y lo registra
 * en la tabla `users` con el rol especificado.
 * Usar deleteTestStaffUserByEmail() en afterAll para limpiar.
 */
export async function createTestStaffUser(
  tenantId: string,
  roleCode: string,
  emailPrefix = 'test-rbac'
): Promise<TestStaffUser> {
  const admin = getAdminClient();
  const email = `${emailPrefix}-${roleCode.toLowerCase()}-${Date.now()}@test.internal`;

  // Crear auth user
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (authError || !authData.user) throw new Error(`createUser failed: ${authError?.message}`);

  const authUserId = authData.user.id;

  // Obtener el rol
  const { data: roleRow } = await admin
    .from('roles')
    .select('id')
    .eq('role_code', roleCode)
    .is('tenant_id', null)
    .single();
  if (!roleRow) throw new Error(`Rol ${roleCode} no encontrado en BD`);

  // Insertar en users
  const { data: userRow, error: userError } = await admin
    .from('users')
    .insert({
      tenant_id: tenantId,
      first_name: 'Test',
      last_name: roleCode,
      email,
      auth_user_id: authUserId,
      status: 'Activo',
    })
    .select('id')
    .single();
  if (userError || !userRow) throw new Error(`Insert users failed: ${userError?.message}`);

  // Asignar rol
  await admin.from('user_roles').insert({
    user_id: userRow.id,
    role_id: roleRow.id,
    tenant_id: tenantId,
  });

  // Cliente autenticado como el usuario
  const userClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  await userClient.auth.signInWithPassword({ email, password: TEST_PASSWORD });

  return {
    userId: userRow.id,
    authUserId,
    email,
    tenantId,
    roleCode,
    client: userClient,
  };
}

/**
 * Elimina un usuario de prueba por email (auth + users). Idempotente.
 */
export async function deleteTestStaffUserByEmail(email: string): Promise<void> {
  const admin = getAdminClient();

  const { data: authList } = await admin.auth.admin.listUsers();
  const authUser = authList?.users.find((u) => u.email === email);

  if (authUser) {
    await admin.auth.admin.deleteUser(authUser.id);
  }

  // La FK ON DELETE CASCADE elimina la fila de `users` automáticamente
  // cuando se borra el auth user. Si no, limpiamos manualmente.
  await admin.from('users').delete().eq('email', email);
}
