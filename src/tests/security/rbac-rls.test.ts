/**
 * RBAC — Test 1: Aislamiento RLS entre tenants.
 *
 * Verifica que las políticas RLS impidan que un usuario de ACME pueda
 * leer, insertar o modificar datos de RBAC de APEX, y viceversa.
 *
 * Tests de integración (requieren SUPABASE_SERVICE_ROLE_KEY) → se saltan en CI.
 * Tests unitarios (siempre corren) → simulan la lógica de las políticas RLS.
 *
 * Uso: npx vitest run src/tests/security/rbac-rls.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  ACME_TENANT_ID,
  APEX_TENANT_ID,
  hasLiveCredentials,
  createTestStaffUser,
  deleteTestStaffUserByEmail,
  type TestStaffUser,
} from './helpers';

// ---------------------------------------------------------------------------
// Tests unitarios — lógica de políticas RLS (sin Supabase)
// ---------------------------------------------------------------------------

describe('RBAC RLS — lógica de políticas (unit)', () => {
  it('política SELECT en roles: tenant propio y sistema son visibles, otros tenants no', () => {
    function canSelectRole(roleTenantId: string | null, userTenantId: string, isSuperAdmin: boolean): boolean {
      if (isSuperAdmin) return true;
      return roleTenantId === null || roleTenantId === userTenantId;
    }

    expect(canSelectRole(null, 'acme', false)).toBe(true);       // roles de sistema: visibles
    expect(canSelectRole('acme', 'acme', false)).toBe(true);     // propio tenant: visible
    expect(canSelectRole('apex', 'acme', false)).toBe(false);    // otro tenant: bloqueado
    expect(canSelectRole('apex', 'acme', true)).toBe(true);      // super admin: siempre visible
  });

  it('política INSERT en roles: requiere tenant_id NOT NULL y ser admin', () => {
    function canInsertRole(roleTenantId: string | null, isAdmin: boolean, sameTenant: boolean): boolean {
      return roleTenantId !== null && isAdmin && sameTenant;
    }

    expect(canInsertRole(null, true, true)).toBe(false);    // roles de sistema: inmutables desde app
    expect(canInsertRole('acme', false, true)).toBe(false); // no admin: denegado
    expect(canInsertRole('acme', true, false)).toBe(false); // tenant diferente: denegado
    expect(canInsertRole('acme', true, true)).toBe(true);   // admin + mismo tenant: permitido
  });

  it('política UPDATE/DELETE en roles: nunca para roles de sistema', () => {
    function canModifyRole(roleTenantId: string | null): boolean {
      return roleTenantId !== null; // solo roles personalizados modificables
    }

    expect(canModifyRole(null)).toBe(false);    // sistema: inmutable
    expect(canModifyRole('acme')).toBe(true);   // personalizado: modificable (si es admin)
  });

  it('política en role_permissions: INSERT solo para roles del propio tenant', () => {
    function canInsertRolePermission(
      roleTenantId: string | null,
      userTenantId: string,
      isAdmin: boolean
    ): boolean {
      if (roleTenantId === null) return false; // permisos de roles de sistema: inmutables
      return roleTenantId === userTenantId && isAdmin;
    }

    expect(canInsertRolePermission(null, 'acme', true)).toBe(false);    // sistema: inmutable
    expect(canInsertRolePermission('apex', 'acme', true)).toBe(false);  // otro tenant: denegado
    expect(canInsertRolePermission('acme', 'acme', false)).toBe(false); // no admin: denegado
    expect(canInsertRolePermission('acme', 'acme', true)).toBe(true);   // correcto: permitido
  });

  it('user_roles: cualquier usuario autenticado puede ver sus asignaciones de rol', () => {
    function canSelectUserRole(userRoleTenantId: string, callerTenantId: string): boolean {
      return userRoleTenantId === callerTenantId;
    }

    expect(canSelectUserRole('acme', 'acme')).toBe(true);
    expect(canSelectUserRole('apex', 'acme')).toBe(false);
  });

  it('user_roles: INSERT requiere ser admin (previene auto-asignación de SUPER_ADMIN)', () => {
    function canInsertUserRole(callerRole: string, targetTenantId: string, callerTenantId: string): boolean {
      const adminRoles = ['ADMIN_EMPRESA', 'SUPER_ADMIN', 'ADMIN_DEV'];
      return adminRoles.includes(callerRole) && targetTenantId === callerTenantId;
    }

    // Un EJECUTIVO no puede asignarse SUPER_ADMIN a sí mismo
    expect(canInsertUserRole('EJECUTIVO_COMERCIAL', 'acme', 'acme')).toBe(false);
    // Un ADMIN puede asignar roles en su tenant
    expect(canInsertUserRole('ADMIN_EMPRESA', 'acme', 'acme')).toBe(true);
    // Nadie puede asignar roles en otro tenant
    expect(canInsertUserRole('ADMIN_EMPRESA', 'apex', 'acme')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests de integración (con credenciales reales)
// ---------------------------------------------------------------------------

const maybeDescribe = hasLiveCredentials ? describe : describe.skip;

maybeDescribe('RBAC RLS — aislamiento real con Supabase', () => {
  let acmeAdmin: TestStaffUser;
  let apexAdmin: TestStaffUser;
  let acmeCustomRoleId: string;

  beforeAll(async () => {
    // Importar dentro de beforeAll para evitar llamada a getAdminClient() en tiempo de módulo
    const { getAdminClient } = await import('./helpers');
    const admin = getAdminClient();

    [acmeAdmin, apexAdmin] = await Promise.all([
      createTestStaffUser(ACME_TENANT_ID, 'ADMIN_EMPRESA', 'rbac-rls-acme'),
      createTestStaffUser(APEX_TENANT_ID, 'ADMIN_EMPRESA', 'rbac-rls-apex'),
    ]);

    const { data: roleRow } = await admin.from('roles').insert({
      tenant_id: ACME_TENANT_ID,
      role_code: 'TEST_ACME_CUSTOM_RLS',
      name: 'Rol Test ACME RLS',
      status: 'Activo',
    }).select('id').single();

    acmeCustomRoleId = roleRow!.id;
  }, 30_000);

  afterAll(async () => {
    const { getAdminClient } = await import('./helpers');
    const admin = getAdminClient();

    await admin.from('roles').delete().eq('id', acmeCustomRoleId);
    await Promise.all([
      deleteTestStaffUserByEmail(acmeAdmin?.email),
      deleteTestStaffUserByEmail(apexAdmin?.email),
    ]);
  }, 30_000);

  it('usuario APEX no puede SELECT roles personalizados de ACME', async () => {
    const { data } = await apexAdmin.client
      .from('roles').select('id').eq('tenant_id', ACME_TENANT_ID);
    expect(data).toHaveLength(0);
  });

  it('usuario APEX no puede INSERT un rol en el tenant de ACME', async () => {
    const { error } = await apexAdmin.client.from('roles').insert({
      tenant_id: ACME_TENANT_ID,
      role_code: 'APEX_INTRUSION',
      name: 'Intrusión',
      status: 'Activo',
    });
    expect(error).not.toBeNull();
  });

  it('usuario ACME puede SELECT sus propios roles personalizados', async () => {
    const { data, error } = await acmeAdmin.client
      .from('roles').select('id').eq('tenant_id', ACME_TENANT_ID);
    expect(error).toBeNull();
    expect(data!.some((r: { id: string }) => r.id === acmeCustomRoleId)).toBe(true);
  });

  it('usuario ACME puede ver roles de sistema (tenant_id IS NULL)', async () => {
    const { data, error } = await acmeAdmin.client
      .from('roles').select('role_code').is('tenant_id', null);
    expect(error).toBeNull();
    expect(data!.some((r: { role_code: string }) => r.role_code === 'EJECUTIVO_COMERCIAL')).toBe(true);
  });

  it('usuario no-admin de ACME no puede INSERT roles en su propio tenant', async () => {
    const comercial = await createTestStaffUser(ACME_TENANT_ID, 'EJECUTIVO_COMERCIAL', 'rbac-rls-nonadmin');
    try {
      const { error } = await comercial.client.from('roles').insert({
        tenant_id: ACME_TENANT_ID,
        role_code: 'SELF_ESCALATION',
        name: 'Escalada propia',
        status: 'Activo',
      });
      expect(error).not.toBeNull();
    } finally {
      await deleteTestStaffUserByEmail(comercial.email);
    }
  }, 30_000);
});
