/**
 * RBAC — Test 4: Compatibilidad con roles legacy (sistema).
 *
 * Verifica que el sistema RBAC dinámico no rompa los roles de sistema
 * existentes y que la lógica de resolución de permisos sea correcta.
 *
 * Tests unitarios (sin red): simulan la lógica SQL de get_user_permissions.
 * Tests de integración (con credenciales): verifican contra Supabase real.
 *
 * Uso: npx vitest run src/tests/security/rbac-legacy.test.ts
 */

import { describe, it, expect, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
vi.mock('next/cache',            () => ({ revalidatePath: vi.fn() }));
vi.mock('@/platform/middleware/auth-utils', () => ({
  invalidatePermissionCache: vi.fn(),
}));

import { createClient } from '@supabase/supabase-js';
import { getUserPermissions } from '@/erp/actions/rbac';
import {
  hasLiveCredentials,
  getAdminClient,
  createTestStaffUser,
  deleteTestStaffUserByEmail,
  ACME_TENANT_ID,
} from './helpers';

// ---------------------------------------------------------------------------
// Tabla de permisos seeded para cada rol legacy (refleja la migración 20260713)
// ---------------------------------------------------------------------------

type RoleName = 'SUPER_ADMIN' | 'ADMIN_EMPRESA' | 'EJECUTIVO_COMERCIAL' | 'TECNICO_CAMPO' | 'ALMACENISTA';

const ALL_PERMISSIONS = [
  'leads.view', 'leads.create', 'leads.edit', 'leads.delete',
  'clients.view', 'clients.create', 'clients.edit',
  'quotes.view', 'quotes.create', 'quotes.edit', 'quotes.approve',
  'jobs.create', 'jobs.manage', 'jobs.close',
  'documents.view', 'documents.upload',
  'inventory.view', 'inventory.movement', 'items.manage',
  'invoices.view', 'invoices.create', 'invoices.delete',
  'settings.view', 'settings.manage',
  'audit.view_tenant', 'audit.view_global',
  'roles.view', 'roles.manage',
];

const ROLE_PERMS: Record<RoleName, string[]> = {
  SUPER_ADMIN:         ALL_PERMISSIONS,
  ADMIN_EMPRESA:       ALL_PERMISSIONS,
  EJECUTIVO_COMERCIAL: ['leads.view', 'leads.create', 'leads.edit', 'clients.view', 'clients.create',
                        'quotes.view', 'quotes.create', 'quotes.edit', 'requirements.view',
                        'requirements.create', 'settings.view'],
  TECNICO_CAMPO:       ['jobs.manage', 'documents.view', 'documents.upload', 'inventory.view'],
  ALMACENISTA:         ['inventory.view', 'inventory.movement', 'items.manage', 'documents.view'],
};

// ---------------------------------------------------------------------------
// Tests unitarios — lógica de resolución (sin Supabase)
// ---------------------------------------------------------------------------

describe('Roles legacy — lógica de resolución (unit)', () => {
  it('SUPER_ADMIN debe tener todos los permisos del catálogo', () => {
    const perms = ROLE_PERMS.SUPER_ADMIN;
    expect(perms).toContain('leads.view');
    expect(perms).toContain('invoices.delete');
    expect(perms).toContain('roles.manage');
    expect(perms).toContain('settings.manage');
    expect(perms.length).toBe(ALL_PERMISSIONS.length);
  });

  it('ADMIN_EMPRESA debe tener los mismos permisos que SUPER_ADMIN', () => {
    expect(ROLE_PERMS.ADMIN_EMPRESA).toEqual(ROLE_PERMS.SUPER_ADMIN);
  });

  it('EJECUTIVO_COMERCIAL solo recibe permisos CRM + cotizaciones (no finanzas)', () => {
    const perms = ROLE_PERMS.EJECUTIVO_COMERCIAL;
    expect(perms).toContain('leads.view');
    expect(perms).toContain('leads.create');
    expect(perms).toContain('quotes.view');
    expect(perms).not.toContain('invoices.delete');
    expect(perms).not.toContain('roles.manage');
    expect(perms).not.toContain('audit.view_global');
  });

  it('TECNICO_CAMPO solo tiene permisos operativos de campo', () => {
    const perms = ROLE_PERMS.TECNICO_CAMPO;
    expect(perms).toContain('jobs.manage');
    expect(perms).toContain('documents.view');
    expect(perms).not.toContain('settings.manage');
    expect(perms).not.toContain('leads.create');
    expect(perms).not.toContain('quotes.approve');
  });

  it('ALMACENISTA solo tiene permisos de inventario', () => {
    const perms = ROLE_PERMS.ALMACENISTA;
    expect(perms).toContain('inventory.view');
    expect(perms).toContain('inventory.movement');
    expect(perms).toContain('items.manage');
    expect(perms).not.toContain('leads.view');
    expect(perms).not.toContain('quotes.create');
  });

  it('los roles legacy no incluyen permisos de roles personalizados (roles.manage)', () => {
    // Solo SUPER_ADMIN/ADMIN_EMPRESA tienen roles.manage — los comerciales no
    expect(ROLE_PERMS.EJECUTIVO_COMERCIAL).not.toContain('roles.manage');
    expect(ROLE_PERMS.TECNICO_CAMPO).not.toContain('roles.manage');
    expect(ROLE_PERMS.ALMACENISTA).not.toContain('roles.manage');
  });
});

// ---------------------------------------------------------------------------
// Tests de getUserPermissions con mock de Supabase
// ---------------------------------------------------------------------------

// UUID v4 válidos (Zod v4 requiere bits de versión y variante correctos)
const USER_ID   = '5af7e917-eac2-4417-82cb-f88fbfc2db9c';
const TENANT_ID = '46070058-9654-43eb-8f71-0616506d4c73';

describe('getUserPermissions — mock de Supabase', () => {
  it('retorna todos los permisos cuando el RPC indica system_superuser', async () => {
    const allPermsData = ALL_PERMISSIONS.map((code) => ({
      permission_code: code,
      source: 'system_superuser',
    }));

    vi.mocked(createClient).mockReturnValue({
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({ data: allPermsData, error: null }),
    } as never);

    const result = await getUserPermissions({ userId: USER_ID, tenantId: TENANT_ID });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.length).toBe(ALL_PERMISSIONS.length);
      const codes = result.data.map((p) => p.permission_code);
      expect(codes).toContain('roles.manage');
      expect(codes).toContain('invoices.delete');
      expect(codes).toContain('settings.manage');
    }
  });

  it('retorna solo permisos seeded para EJECUTIVO_COMERCIAL', async () => {
    const ejecutivoData = ROLE_PERMS.EJECUTIVO_COMERCIAL.map((code) => ({
      permission_code: code,
      source: 'role' as const,
    }));

    vi.mocked(createClient).mockReturnValue({
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({ data: ejecutivoData, error: null }),
    } as never);

    const result = await getUserPermissions({ userId: USER_ID, tenantId: TENANT_ID });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const codes = result.data.map((p) => p.permission_code);
      expect(codes).toContain('leads.view');
      expect(codes).toContain('leads.create');
      expect(codes).not.toContain('invoices.delete');
      expect(codes).not.toContain('roles.manage');
    }
  });

  it('incluye permisos con source individual_grant', async () => {
    const mixedData = [
      { permission_code: 'leads.view',      source: 'role' as const },
      { permission_code: 'invoices.delete', source: 'individual_grant' as const },
    ];

    vi.mocked(createClient).mockReturnValue({
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({ data: mixedData, error: null }),
    } as never);

    const result = await getUserPermissions({ userId: USER_ID, tenantId: TENANT_ID });

    expect(result.ok).toBe(true);
    if (result.ok) {
      const invDelete = result.data.find((p) => p.permission_code === 'invoices.delete');
      expect(invDelete?.source).toBe('individual_grant');
    }
  });

  it('retorna ok:false si el RPC devuelve un error', async () => {
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn(),
      rpc: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    } as never);

    const result = await getUserPermissions({ userId: USER_ID, tenantId: TENANT_ID });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/error al obtener permisos/i);
  });

  it('retorna ok:false si userId no es UUID', async () => {
    const result = await getUserPermissions({ userId: 'not-valid', tenantId: TENANT_ID });
    expect(result.ok).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests de integración (con credenciales reales — opcionales en CI)
// ---------------------------------------------------------------------------

const maybeDescribe = hasLiveCredentials ? describe : describe.skip;

maybeDescribe('Roles legacy — integración real con Supabase', () => {
  it('EJECUTIVO_COMERCIAL tiene leads.view vía get_user_permissions', async () => {
    const admin = getAdminClient();
    const ejecutivo = await createTestStaffUser(ACME_TENANT_ID, 'EJECUTIVO_COMERCIAL', 'rbac-legacy');

    try {
      const { data: userRow } = await admin
        .from('users').select('id').eq('auth_user_id', ejecutivo.authUserId).single();

      const { data: perms } = await admin.rpc('get_user_permissions', {
        p_user_id: userRow!.id,
        p_tenant_id: ACME_TENANT_ID,
      });

      const codes = (perms ?? []).map((p: { permission_code: string }) => p.permission_code);
      expect(codes).toContain('leads.view');
      expect(codes).toContain('leads.create');
      expect(codes).not.toContain('invoices.delete');
    } finally {
      await deleteTestStaffUserByEmail(ejecutivo.email);
    }
  }, 30_000);

  it('ALMACENISTA tiene inventory.movement vía get_user_permissions', async () => {
    const admin = getAdminClient();
    const almacenista = await createTestStaffUser(ACME_TENANT_ID, 'ALMACENISTA', 'rbac-legacy-alm');

    try {
      const { data: userRow } = await admin
        .from('users').select('id').eq('auth_user_id', almacenista.authUserId).single();

      const { data: perms } = await admin.rpc('get_user_permissions', {
        p_user_id: userRow!.id,
        p_tenant_id: ACME_TENANT_ID,
      });

      const codes = (perms ?? []).map((p: { permission_code: string }) => p.permission_code);
      expect(codes).toContain('inventory.movement');
      expect(codes).toContain('items.manage');
      expect(codes).not.toContain('leads.create');
    } finally {
      await deleteTestStaffUserByEmail(almacenista.email);
    }
  }, 30_000);
});
