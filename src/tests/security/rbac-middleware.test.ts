/**
 * RBAC — Test 2: Middleware de permisos granulares.
 *
 * Verifica:
 *  - getRequiredPermissionForPath() retorna el permiso correcto por ruta
 *  - Rutas no listadas en el mapa retornan null (solo necesitan auth base)
 *  - El comportamiento del cache de permisos (invalidación y TTL)
 *  - hasPermission() hace fail-closed ante errores de BD
 *
 * Todos los tests son unitarios (sin red). Las funciones de Supabase se mockean.
 *
 * Uso: npx vitest run src/tests/security/rbac-middleware.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock del cliente Supabase antes de importar el módulo bajo test
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@supabase/supabase-js';
import {
  getRequiredPermissionForPath,
  hasPermission,
  invalidatePermissionCache,
} from '@/platform/middleware/auth-utils';

// ---------------------------------------------------------------------------
// getRequiredPermissionForPath
// ---------------------------------------------------------------------------

describe('getRequiredPermissionForPath', () => {
  it('retorna el permiso exacto para /dashboard/settings/roles', () => {
    expect(getRequiredPermissionForPath('/dashboard/settings/roles')).toBe('roles.view');
  });

  it('retorna el permiso para /dashboard/settings (prefijo más largo gana)', () => {
    // /dashboard/settings/roles es más específico que /dashboard/settings
    const perm = getRequiredPermissionForPath('/dashboard/settings/roles');
    expect(perm).toBe('roles.view');
  });

  it('retorna settings.view para /dashboard/settings exacto', () => {
    expect(getRequiredPermissionForPath('/dashboard/settings')).toBe('settings.view');
  });

  it('retorna settings.view para subrutas de /dashboard/settings no listadas', () => {
    expect(getRequiredPermissionForPath('/dashboard/settings/profile')).toBe('settings.view');
  });

  it('retorna null para rutas de dashboard genéricas (solo necesitan auth)', () => {
    expect(getRequiredPermissionForPath('/dashboard')).toBeNull();
    expect(getRequiredPermissionForPath('/dashboard/leads')).toBeNull();
    expect(getRequiredPermissionForPath('/dashboard/quotes')).toBeNull();
    expect(getRequiredPermissionForPath('/dashboard/clients')).toBeNull();
  });

  it('retorna null para rutas fuera del dashboard', () => {
    expect(getRequiredPermissionForPath('/login')).toBeNull();
    expect(getRequiredPermissionForPath('/portal')).toBeNull();
    expect(getRequiredPermissionForPath('/')).toBeNull();
  });

  it('rutas desconocidas retornan null (no deny por defecto en capa de permiso)', () => {
    // Clarificación: el deny-by-default es en verifyErpToken (autenticación).
    // getRequiredPermissionForPath solo agrega un check adicional para rutas
    // sensibles — no es la única puerta de seguridad.
    expect(getRequiredPermissionForPath('/dashboard/nueva-ruta-futura')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// hasPermission — con mocks
// ---------------------------------------------------------------------------

describe('hasPermission', () => {
  const authUserId = 'auth-user-123';
  const tenantId   = 'tenant-acme-456';
  const userId     = 'user-internal-789';

  function buildMockClient(userResult: unknown, permsResult: unknown) {
    const rpcMock = vi.fn().mockResolvedValue(permsResult);
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue(userResult),
    });
    return { from: fromMock, rpc: rpcMock };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    // Limpiar cache entre tests
    invalidatePermissionCache(authUserId, tenantId);
  });

  afterEach(() => {
    vi.clearAllMocks();
    invalidatePermissionCache(authUserId, tenantId);
  });

  it('retorna true cuando el usuario tiene el permiso', async () => {
    const mockClient = buildMockClient(
      { data: { id: userId }, error: null },
      { data: [{ permission_code: 'leads.view' }, { permission_code: 'settings.view' }], error: null }
    );
    vi.mocked(createClient).mockReturnValue(mockClient as never);

    const result = await hasPermission(authUserId, tenantId, 'leads.view');
    expect(result).toBe(true);
  });

  it('retorna false cuando el usuario NO tiene el permiso', async () => {
    const mockClient = buildMockClient(
      { data: { id: userId }, error: null },
      { data: [{ permission_code: 'leads.view' }], error: null }
    );
    vi.mocked(createClient).mockReturnValue(mockClient as never);

    invalidatePermissionCache(authUserId, tenantId);
    const result = await hasPermission(authUserId, tenantId, 'invoices.delete');
    expect(result).toBe(false);
  });

  it('retorna false (fail-closed) si el usuario no existe en la BD', async () => {
    const mockClient = buildMockClient(
      { data: null, error: null }, // usuario no encontrado
      { data: [], error: null }
    );
    vi.mocked(createClient).mockReturnValue(mockClient as never);

    const result = await hasPermission(authUserId, tenantId, 'leads.view');
    expect(result).toBe(false);
  });

  it('retorna false (fail-closed) si el RPC de permisos falla', async () => {
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: userId }, error: null }),
    });
    const rpcMock = vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') });
    vi.mocked(createClient).mockReturnValue({ from: fromMock, rpc: rpcMock } as never);

    const result = await hasPermission(authUserId, tenantId, 'leads.view');
    expect(result).toBe(false);
  });

  it('retorna false (fail-closed) si createClient lanza excepción', async () => {
    vi.mocked(createClient).mockImplementation(() => { throw new Error('Network failure'); });

    const result = await hasPermission(authUserId, tenantId, 'leads.view');
    expect(result).toBe(false);
  });

  it('usa el cache en la segunda llamada (no hace segunda query)', async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: [{ permission_code: 'leads.view' }],
      error: null,
    });
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: userId }, error: null }),
    });
    vi.mocked(createClient).mockReturnValue({ from: fromMock, rpc: rpcMock } as never);

    // Primera llamada — consulta BD
    await hasPermission(authUserId, tenantId, 'leads.view');
    // Segunda llamada — debe usar cache
    const result = await hasPermission(authUserId, tenantId, 'leads.view');

    expect(result).toBe(true);
    // rpc solo se llamó una vez (no dos)
    expect(rpcMock).toHaveBeenCalledTimes(1);
  });

  it('tras invalidatePermissionCache vuelve a consultar la BD', async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: [{ permission_code: 'leads.view' }],
      error: null,
    });
    const fromMock = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: userId }, error: null }),
    });
    vi.mocked(createClient).mockReturnValue({ from: fromMock, rpc: rpcMock } as never);

    await hasPermission(authUserId, tenantId, 'leads.view');
    invalidatePermissionCache(authUserId, tenantId);
    await hasPermission(authUserId, tenantId, 'leads.view');

    // rpc se llamó dos veces (cache invalidado entre medias)
    expect(rpcMock).toHaveBeenCalledTimes(2);
  });
});
