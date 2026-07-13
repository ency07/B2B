/**
 * RBAC — Test 3: Aislamiento de tenant en Server Actions.
 *
 * Verifica que createCustomRole(), assignRoleToUser() y getUserPermissions()
 * rechacen operaciones cross-tenant y respeten las restricciones de autorización.
 *
 * Todos los tests mockean Supabase (sin red).
 *
 * Uso: npx vitest run src/tests/security/rbac-actions.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));
vi.mock('next/cache',            () => ({ revalidatePath: vi.fn() }));
vi.mock('@/platform/middleware/auth-utils', () => ({
  invalidatePermissionCache: vi.fn(),
}));

import { createClient } from '@supabase/supabase-js';
import {
  createCustomRole,
  assignRoleToUser,
  getUserPermissions,
} from '@/erp/actions/rbac';

// ---------------------------------------------------------------------------
// Constantes — UUIDs válidos obligatorios para pasar validación Zod
// ---------------------------------------------------------------------------

// UUID v4 válidos (Zod v4 requiere versión [1-8] y variante [89abAB])
const ACME_TENANT    = '5af7e917-eac2-4417-82cb-f88fbfc2db9c';
const APEX_TENANT    = '46070058-9654-43eb-8f71-0616506d4c73';
const CALLER_AUTH_ID = '974486fb-4834-42c9-a86d-8e82e8f1e35b';
const ACME_USER_ID   = '2645ecf1-eca6-4898-abc5-315294a02f15';
const PERM_ID_1      = 'e49c1194-70a2-4cf1-8f8a-c6cd61cfd72f';
const PERM_ID_2      = '274e9f7b-b552-4c85-a119-b9022b80ddaa';
const ACME_ROLE_ID   = '76290c0f-7243-48ca-bf1d-0db0e5ba94d9';

/**
 * Construye un objeto que simula la query-builder de Supabase.
 * Es thenable: `await builder` resuelve al result (sin necesitar .single() / .maybeSingle()).
 * Los métodos de filtrado (.select, .eq, .in, etc.) retornan `this` para encadenar.
 */
function buildChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq', 'neq', 'is', 'in', 'order', 'limit', 'delete'];

  for (const m of methods) {
    chain[m] = vi.fn().mockReturnThis();
  }

  // Para terminadores con resultado individual
  chain['maybeSingle'] = vi.fn().mockResolvedValue(result);
  chain['single']      = vi.fn().mockResolvedValue(result);

  // insert retorna una nueva chain con el mismo resultado (para .select().single())
  chain['insert'] = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue(result),
    }),
    // sin .select() → directo
    then: (resolve: (v: unknown) => void) => resolve(result),
  });

  // Hacer el chain thenable para `await db.from('t').select().in(...)` etc.
  chain['then'] = (resolve: (v: unknown) => void) => Promise.resolve(result).then(resolve);

  return chain;
}

// ---------------------------------------------------------------------------
// createCustomRole
// ---------------------------------------------------------------------------

describe('createCustomRole — validaciones de seguridad', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rechaza si el caller no es admin del tenant (rol EJECUTIVO_COMERCIAL)', async () => {
    const nonAdminResult = {
      data: {
        id: ACME_USER_ID,
        tenant_id: ACME_TENANT,
        user_roles: [{ roles: { role_code: 'EJECUTIVO_COMERCIAL' } }],
      },
      error: null,
    };
    const fromMock = vi.fn().mockReturnValue(buildChain(nonAdminResult));
    vi.mocked(createClient).mockReturnValue({ from: fromMock, rpc: vi.fn() } as never);

    const result = await createCustomRole(CALLER_AUTH_ID, {
      tenantId: ACME_TENANT,
      roleName: 'Auxiliar Bodega',
      roleCode: 'AUXILIAR_BODEGA',
      permissionIds: [PERM_ID_1],
    });

    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/permisos insuficientes/i);
  });

  it('rechaza si permissionIds está vacío (Zod)', async () => {
    const result = await createCustomRole(CALLER_AUTH_ID, {
      tenantId: ACME_TENANT,
      roleName: 'Rol sin permisos',
      roleCode: 'SIN_PERMISOS',
      permissionIds: [],
    });

    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/al menos un permiso/i);
  });

  it('rechaza si roleCode tiene minúsculas (Zod regex)', async () => {
    const result = await createCustomRole(CALLER_AUTH_ID, {
      tenantId: ACME_TENANT,
      roleName: 'Rol inválido',
      roleCode: 'rol-minusculas',
      permissionIds: [PERM_ID_1],
    });

    expect(result.ok).toBe(false);
  });

  it('rechaza si permissionId no existe en el catálogo de permisos', async () => {
    // admin check pasa, permission validation retorna array vacío
    let callIdx = 0;
    const chains = [
      // assertTenantAdmin → usuario admin
      buildChain({
        data: {
          id: ACME_USER_ID,
          tenant_id: ACME_TENANT,
          user_roles: [{ roles: { role_code: 'ADMIN_EMPRESA' } }],
        },
        error: null,
      }),
      // validatePermissionIds → retorna 0 filas (permiso no existe)
      buildChain({ data: [], error: null }),
    ];
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockImplementation(() => chains[callIdx++] ?? buildChain({ data: null, error: null })),
    } as never);

    const result = await createCustomRole(CALLER_AUTH_ID, {
      tenantId: ACME_TENANT,
      roleName: 'Rol Prueba',
      roleCode: 'ROL_PRUEBA',
      permissionIds: [PERM_ID_1],
    });

    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/permisos no existen/i);
  });

  it('retorna ok:true y roleId cuando todos los datos son válidos', async () => {
    let callIdx = 0;
    const chains = [
      // assertTenantAdmin
      buildChain({
        data: {
          id: ACME_USER_ID,
          tenant_id: ACME_TENANT,
          user_roles: [{ roles: { role_code: 'ADMIN_EMPRESA' } }],
        },
        error: null,
      }),
      // validatePermissionIds → 2 permisos válidos
      buildChain({ data: [{ id: PERM_ID_1 }, { id: PERM_ID_2 }], error: null }),
    ];

    // El insert de `roles` usa una cadena diferente: .insert({}).select('id').single()
    const roleInsertChain = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: ACME_ROLE_ID }, error: null }),
        }),
      }),
    };

    // El insert de `role_permissions` solo verifica error
    const rpInsertChain = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    const tableMap: Record<string, unknown> = {
      users: chains[callIdx++],
      permissions: chains[callIdx++],
      roles: roleInsertChain,
      role_permissions: rpInsertChain,
    };

    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockImplementation((table: string) =>
        tableMap[table] ?? buildChain({ data: null, error: null })
      ),
    } as never);

    const result = await createCustomRole(CALLER_AUTH_ID, {
      tenantId: ACME_TENANT,
      roleName: 'Auxiliar Bodega',
      roleCode: 'AUXILIAR_BODEGA',
      permissionIds: [PERM_ID_1, PERM_ID_2],
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.roleId).toBe(ACME_ROLE_ID);
  });
});

// ---------------------------------------------------------------------------
// assignRoleToUser
// ---------------------------------------------------------------------------

describe('assignRoleToUser — validaciones de seguridad', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rechaza si el rol pertenece a otro tenant (cross-tenant)', async () => {
    let callIdx = 0;
    const chains = [
      // assertTenantAdmin → admin de ACME
      buildChain({
        data: {
          id: ACME_USER_ID,
          tenant_id: ACME_TENANT,
          user_roles: [{ roles: { role_code: 'ADMIN_EMPRESA' } }],
        },
        error: null,
      }),
      // role → pertenece a APEX (otro tenant)
      buildChain({ data: { id: ACME_ROLE_ID, tenant_id: APEX_TENANT, status: 'Activo' }, error: null }),
    ];
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockImplementation(() => chains[callIdx++] ?? buildChain({ data: null, error: null })),
    } as never);

    const result = await assignRoleToUser(CALLER_AUTH_ID, {
      userId: ACME_USER_ID,
      roleId: ACME_ROLE_ID,
      tenantId: ACME_TENANT,
    });

    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/no pertenece a este tenant/i);
  });

  it('rechaza si el usuario objetivo es de otro tenant', async () => {
    let callIdx = 0;
    const chains = [
      // assertTenantAdmin → admin de ACME
      buildChain({
        data: {
          id: ACME_USER_ID,
          tenant_id: ACME_TENANT,
          user_roles: [{ roles: { role_code: 'ADMIN_EMPRESA' } }],
        },
        error: null,
      }),
      // rol → pertenece al mismo tenant ACME
      buildChain({ data: { id: ACME_ROLE_ID, tenant_id: ACME_TENANT, status: 'Activo' }, error: null }),
      // usuario objetivo → no encontrado en ACME (de otro tenant)
      buildChain({ data: null, error: null }),
    ];
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockImplementation(() => chains[callIdx++] ?? buildChain({ data: null, error: null })),
    } as never);

    const result = await assignRoleToUser(CALLER_AUTH_ID, {
      userId: '5cc4a2d5-3cbe-4f6f-9725-455c78c6d6dc', // UUID válido pero de otro tenant
      roleId: ACME_ROLE_ID,
      tenantId: ACME_TENANT,
    });

    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/no encontrado en este tenant/i);
  });

  it('rechaza si el rol está inactivo', async () => {
    let callIdx = 0;
    const chains = [
      buildChain({
        data: {
          id: ACME_USER_ID,
          tenant_id: ACME_TENANT,
          user_roles: [{ roles: { role_code: 'ADMIN_EMPRESA' } }],
        },
        error: null,
      }),
      buildChain({ data: { id: ACME_ROLE_ID, tenant_id: ACME_TENANT, status: 'Inactivo' }, error: null }),
    ];
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockImplementation(() => chains[callIdx++] ?? buildChain({ data: null, error: null })),
    } as never);

    const result = await assignRoleToUser(CALLER_AUTH_ID, {
      userId: ACME_USER_ID,
      roleId: ACME_ROLE_ID,
      tenantId: ACME_TENANT,
    });

    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/inactivo/i);
  });

  it('rechaza si el caller no es admin del tenant', async () => {
    const nonAdminChain = buildChain({
      data: {
        id: ACME_USER_ID,
        tenant_id: ACME_TENANT,
        user_roles: [{ roles: { role_code: 'TECNICO_CAMPO' } }],
      },
      error: null,
    });
    vi.mocked(createClient).mockReturnValue({
      from: vi.fn().mockReturnValue(nonAdminChain),
    } as never);

    const result = await assignRoleToUser(CALLER_AUTH_ID, {
      userId: ACME_USER_ID,
      roleId: ACME_ROLE_ID,
      tenantId: ACME_TENANT,
    });

    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/permisos insuficientes/i);
  });
});

// ---------------------------------------------------------------------------
// getUserPermissions
// ---------------------------------------------------------------------------

describe('getUserPermissions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retorna ok:false si userId no es UUID válido', async () => {
    const result = await getUserPermissions({ userId: 'not-a-uuid', tenantId: ACME_TENANT });
    expect(result.ok).toBe(false);
  });

  it('retorna ok:false si tenantId no es UUID válido', async () => {
    const result = await getUserPermissions({ userId: ACME_USER_ID, tenantId: 'not-a-uuid' });
    expect(result.ok).toBe(false);
  });

  it('retorna ok:false si el RPC falla', async () => {
    const rpcMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB down' } });
    vi.mocked(createClient).mockReturnValue({ from: vi.fn(), rpc: rpcMock } as never);

    const result = await getUserPermissions({ userId: ACME_USER_ID, tenantId: ACME_TENANT });

    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/error al obtener permisos/i);
  });

  it('retorna la lista de permisos cuando el RPC tiene éxito', async () => {
    const permsData = [
      { permission_code: 'leads.view',   source: 'role' },
      { permission_code: 'leads.create', source: 'role' },
    ];
    const rpcMock = vi.fn().mockResolvedValue({ data: permsData, error: null });
    vi.mocked(createClient).mockReturnValue({ from: vi.fn(), rpc: rpcMock } as never);

    const result = await getUserPermissions({ userId: ACME_USER_ID, tenantId: ACME_TENANT });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toHaveLength(2);
      expect(result.data[0].permission_code).toBe('leads.view');
    }
  });
});
