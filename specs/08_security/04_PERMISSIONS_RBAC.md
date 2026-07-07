# PERMISSIONS & RBAC — Control de Acceso Basado en Roles

## 1. Arquitectura de permisos

### Sistema de permisos granular

```
PERMISSION_CODES (granularidad fina)
├── leads.create
├── leads.read
├── leads.edit
├── leads.delete
├── leads.assign
├── leads.export
├── clients.create
├── clients.read
├── ...
```

Un permiso tiene formato: `{modulo}.{accion}`

---

## 2. Verificación de permisos

### checkPermission (Server Action)

```typescript
// lib/permissions.ts
import { createClient } from '@/lib/supabase/server'
import type { UserRole } from '@/lib/auth-guards'

export async function checkPermission(
  userId: string,
  permission: string
): Promise<boolean> {
  const supabase = createClient()

  // 1. Verificar si es SUPER_ADMIN
  const { data: profile } = await supabase
    .from('users_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // SUPER_ADMIN bypass
  if (profile?.role === 'SUPER_ADMIN') return true

  // 2. Verificar permisos del usuario
  const { data: userRoles } = await supabase
    .from('usuario_roles')
    .select('role_id')
    .eq('usuario_id', userId)

  if (!userRoles?.length) return false

  const roleIds = userRoles.map(r => r.role_id)

  // 3. Verificar si alguno de sus roles tiene el permiso
  const { data: permissions } = await supabase
    .from('role_permissions')
    .select('permission:permission_id(codigo)')
    .in('role_id', roleIds)

  return permissions?.some(
    p => (p.permission as any).codigo === permission
  ) ?? false
}

// Versión con caché (para evitar queries repetidas)
const permissionCache = new Map<string, boolean>()

export async function checkPermissionCached(
  userId: string,
  permission: string
): Promise<boolean> {
  const key = `${userId}:${permission}`

  if (permissionCache.has(key)) {
    return permissionCache.get(key)!
  }

  const result = await checkPermission(userId, permission)
  permissionCache.set(key, result)

  // Expirar caché después de 5 minutos
  setTimeout(() => permissionCache.delete(key), 5 * 60 * 1000)

  return result
}
```

### hasPermission (middleware helper)

```typescript
export async function hasPermission(
  permission: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const session = await auth()

    // SUPER_ADMIN siempre tiene permisos
    if (session.role === 'SUPER_ADMIN') {
      return { allowed: true }
    }

    // ADMIN tiene permisos totales en su tenant
    if (session.role === 'ADMIN') {
      return { allowed: true }
    }

    const allowed = await checkPermission(session.userId, permission)
    return { allowed, reason: allowed ? undefined : `Permiso requerido: ${permission}` }
  } catch {
    return { allowed: false, reason: 'Error verificando permisos' }
  }
}
```

---

## 3. Uso de permisos en acciones

```typescript
// actions/leads.ts
'use server'

import { auth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export async function crearLead(formData: FormData) {
  const session = await auth()

  // Verificar permiso
  const { allowed, reason } = await hasPermission('leads.create')
  if (!allowed) {
    return { error: reason ?? 'Sin permisos' }
  }

  // ... crear lead
}

export async function eliminarLead(id: string) {
  const session = await auth()

  const { allowed } = await hasPermission('leads.delete')
  if (!allowed) {
    return { error: 'Sin permisos para eliminar' }
  }

  // ... soft delete
}
```

---

## 4. Permisos en UI (condicional rendering)

```typescript
// components/features/crm/leads-toolbar.tsx
import { hasPermission } from '@/lib/permissions'
import { auth } from '@/lib/auth'

export async function LeadsToolbar() {
  const session = await auth()
  const canCreate = await hasPermission('leads.create')
  const canExport = await hasPermission('leads.export')

  return (
    <div className="flex items-center gap-2">
      {canCreate.allowed && (
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Crear Lead
        </Button>
      )}
      {canExport.allowed && (
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </Button>
      )}
    </div>
  )
}
```

---

## 5. Permisos por dominio (matriz)

### Módulo CRM

| Acción | GERENTE | DIR_COM | EJEC_COM | ASIST_COM |
|---|---|---|---|---|
| leads.create | ✓ | ✓ | ✓ | ✗ |
| leads.read | ✓ | ✓ | ◐ | R |
| leads.edit | ✓ | ✓ | ◐ | ✗ |
| leads.delete | ✓ | ✓ | ✗ | ✗ |
| leads.assign | ✓ | ✓ | ✗ | ✗ |
| leads.export | ✓ | ✓ | ◐ | ✗ |

### Módulo Cotizaciones

| Acción | GERENTE | DIR_COM | EJEC_COM | ING_PROY |
|---|---|---|---|---|
| quotes.create | ✓ | ✓ | ✓ | ✓ |
| quotes.read | ✓ | ✓ | ◐ | ◐ |
| quotes.edit | ✓ | ✓ | ◐ | ✗ |
| quotes.delete | ✓ | ✓ | ✗ | ✗ |
| quotes.approve | ✓ | ✓* | ✗ | ✗ |
| quotes.margin_view | ✓ | ✓ | ✗ | ✓ |

\* Según monto

---

## 6. Seed de permisos

```sql
-- Insertar todos los códigos de permiso
INSERT INTO permissions (codigo, nombre, modulo) VALUES
  -- CRM
  ('leads.create', 'Crear leads', 'crm'),
  ('leads.read', 'Ver leads', 'crm'),
  ('leads.edit', 'Editar leads', 'crm'),
  ('leads.delete', 'Eliminar leads', 'crm'),
  ('leads.assign', 'Asignar leads', 'crm'),
  ('leads.export', 'Exportar leads', 'crm'),
  ('clients.create', 'Crear clientes', 'crm'),
  ('clients.read', 'Ver clientes', 'crm'),
  ('clients.edit', 'Editar clientes', 'crm'),
  -- Cotizaciones
  ('quotes.create', 'Crear cotizaciones', 'quotes'),
  ('quotes.read', 'Ver cotizaciones', 'quotes'),
  ('quotes.edit', 'Editar cotizaciones', 'quotes'),
  ('quotes.delete', 'Eliminar cotizaciones', 'quotes'),
  ('quotes.approve', 'Aprobar cotizaciones', 'quotes'),
  ('quotes.send', 'Enviar cotizaciones', 'quotes'),
  ('quotes.margin_view', 'Ver márgenes', 'quotes'),
  -- OTs
  ('jobs.create', 'Crear OTs', 'jobs'),
  ('jobs.read', 'Ver OTs', 'jobs'),
  ('jobs.edit', 'Editar OTs', 'jobs'),
  ('jobs.assign', 'Asignar OTs', 'jobs'),
  ('jobs.checklist', 'Completar checklist', 'jobs'),
  ('jobs.close', 'Cerrar OTs', 'jobs'),
  ('jobs.costs_view', 'Ver costos', 'jobs'),
  -- Inventario
  ('inventory.products_create', 'Crear productos', 'inventory'),
  ('inventory.products_read', 'Ver productos', 'inventory'),
  ('inventory.products_edit', 'Editar productos', 'inventory'),
  ('inventory.movements_read', 'Ver movimientos', 'inventory'),
  ('inventory.movements_create', 'Crear movimientos', 'inventory'),
  ('inventory.kardex_read', 'Ver kardex', 'inventory'),
  -- Facturación
  ('invoices.create', 'Crear facturas', 'invoices'),
  ('invoices.read', 'Ver facturas', 'invoices'),
  ('invoices.edit', 'Editar facturas', 'invoices'),
  ('invoices.annul', 'Anular facturas', 'invoices'),
  ('payments.register', 'Registrar pagos', 'payments'),
  ('payments.confirm', 'Confirmar pagos', 'payments'),
  -- Settings
  ('settings.company', 'Configurar empresa', 'settings'),
  ('settings.users', 'Gestionar usuarios', 'settings'),
  ('settings.roles', 'Gestionar roles', 'settings'),
  ('settings.white_label', 'Configurar white label', 'settings'),
  ('audit.read', 'Ver auditoría', 'system');

-- Asignar permisos a roles
-- Ejemplo: Rol GERENTE
INSERT INTO role_permissions (role_id, permission_id, tenant_id)
SELECT r.id, p.id, r.tenant_id
FROM roles r, permissions p
WHERE r.codigo = 'GERENTE'
  AND p.codigo IN (
    'leads.read', 'leads.export',
    'quotes.read', 'quotes.approve',
    'jobs.read', 'inventory.products_read',
    'invoices.read', 'payments.read',
    'audit.read'
  );
```

---

## 7. Reglas de RBAC

1. **Deny by default.** Si no se encuentra el permiso explícitamente, se deniega.
2. **SUPER_ADMIN bypass.** Tiene todos los permisos.
3. **ADMIN bypass en su tenant.** Tiene todos los permisos de su tenant.
4. **Permisos heredados.** Un usuario hereda los permisos de todos sus roles (unión).
5. **Validación en backend.** El frontend solo oculta UI. La verdadera seguridad está en actions.
6. **Auditoría de cambios de permisos.** Toda modificación a roles/permisos se audita.
