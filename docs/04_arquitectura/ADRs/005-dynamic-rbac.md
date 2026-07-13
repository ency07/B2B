# ADR-005: RBAC Dinámico por Tenant

**Estado:** Aceptado  
**Fecha:** 2026-07-13  
**Autores:** Equipo ERP AeroMax  
**Reemplaza:** Uso exclusivo de enums en `role_code` para control de acceso

---

## Contexto

El sistema inició con roles de sistema estáticos (`SUPER_ADMIN`, `EJECUTIVO_COMERCIAL`, etc.) definidos como valores fijos en la tabla `roles` (`tenant_id IS NULL`) y reflejados en el archivo TypeScript `src/lib/role-permissions.ts`. Este enfoque funciona para el MVP, pero presenta dos limitaciones a medida que el producto crece:

1. **Rigidez**: No permite que cada empresa (tenant) defina roles que reflejen su propia estructura organizacional (ej: "Auxiliar Bodega", "Gerente Regional de Ventas").
2. **Granularidad**: El control actual es a nivel de ruta (`hasAccess('/dashboard/leads')`), no a nivel de acción sobre un recurso (`leads.create` vs `leads.view`).

La presión de mercado de clientes enterprise que requieren personalizar permisos antes del despliegue hace que este cambio sea necesario en Fase 8.

---

## Decisión

Extender el esquema existente con una tabla `role_permissions` que actúa como pivote entre `roles` y `permissions`, habilitando:

- **Roles de sistema** (`tenant_id IS NULL`): siguen existiendo con sus permisos mapeados en `role_permissions` (migración `20260713000052`).
- **Roles personalizados** (`tenant_id NOT NULL`): cada tenant puede crear roles propios y asignarles cualquier subconjunto de permisos del catálogo maestro.
- **Excepciones individuales**: la tabla `user_permissions` ya existente permite sobrescribir permisos puntualmente para un usuario.

La verificación se implementa mediante la función SQL `check_user_permission` (`SECURITY DEFINER`) llamada desde el middleware Edge y desde los Server Actions.

---

## Alternativas Consideradas

### A. Mantener enums + ampliar TypeScript matrix
- **Pro**: cero cambio de esquema, despliegue inmediato.
- **Contra**: no permite personalización por tenant; requiere un redeploy por cada nuevo rol; no escala a permisos granulares. Descartado.

### B. Tabla de permisos en JSON dentro de `tenants`
- **Pro**: sin tablas adicionales.
- **Contra**: imposible hacer queries relacionales (ej: "¿qué usuarios tienen `leads.delete`?"); sin integridad referencial. Descartado.

### C. Solución externa (Casbin, OPA, Auth0 Fine-Grained Authorization)
- **Pro**: motor de políticas maduro y auditado.
- **Contra**: dependencia externa costosa; latencia adicional en middleware Edge; complejidad operacional desproporcionada para el tamaño actual del sistema. Descartado para esta fase; puede reconsiderarse si se supera los 500 tenants activos.

### D. Esquema elegido (role_permissions relacional en Supabase)
- **Pro**: consistente con el stack existente; RLS nativo; consultas SQL expresivas; sin dependencias externas; retrocompatible con roles legacy.
- **Contra**: una query adicional al middleware por ruta protegida. Mitigado con cache a nivel de sesión en el futuro (ver sección de consecuencias).

---

## Esquema de Datos

```
permissions          roles (tenant_id IS NULL = sistema)
    id ──────────────┐    id ──────────────────┐
    permission_code  │    tenant_id (nullable)  │
    name             │    role_code             │
    module           │    name                  │
                     │                          │
              role_permissions                  │
                  role_id ────────────────────▶─┘
                  permission_id ──────────────▶─┘

users ──▶ user_roles ──▶ roles (sistema o custom)
      └──▶ user_permissions ──▶ permissions (excepciones)
```

**Prioridad de resolución de permisos:**
1. Si el usuario tiene un rol `SUPER_ADMIN` / `ADMIN_EMPRESA` / `ADMIN_DEV` / `GERENTE_GENERAL` → todos los permisos (excepto revocaciones explícitas).
2. Permisos heredados de todos los roles del usuario (`role_permissions`).
3. Excepciones individuales: `user_permissions.granted = true` añade, `granted = false` revoca.

---

## Consecuencias

### Positivas
- Los tenants pueden modelar su estructura organizacional real sin esperar un redeploy.
- El catálogo de permisos es la fuente de verdad única, consultable y auditable.
- La función `get_user_permissions` es reutilizable desde Server Actions, middleware y futuras APIs.
- Los roles legacy siguen funcionando: `src/lib/role-permissions.ts` puede coexistir durante la transición.

### Negativas / Riesgos
- **Latencia de middleware**: cada ruta con `ROUTE_PERMISSION_MAP` hace 2 queries adicionales a Supabase. En produción con Edge Runtime, el P99 puede aumentar ~20-40ms por request en rutas protegidas. **Mitigación futura**: cachear el set de permisos en una cookie firmada con TTL de 15 min (invalidar en cambio de roles).
- **Proliferación de roles**: sin governanza, los tenants pueden crear docenas de roles fragmentados. **Mitigación**: UI con límite configurable de roles por tenant (por defecto: 20).
- **Desincronización TypeScript-BD**: `src/lib/role-permissions.ts` puede contradecir la BD durante la transición. Ver sección de migración.

---

## Plan de Migración de Usuarios Existentes

### Contexto del estado actual
Los usuarios tienen filas en `user_roles` referenciando roles de sistema (`tenant_id IS NULL`). La migración **no elimina** estos registros.

### Paso 1 — Migración automática (ya incluida en `20260713000052_dynamic_rbac.sql`)
Los roles de sistema reciben sus permisos en `role_permissions`. Cualquier usuario con `EJECUTIVO_COMERCIAL` ya obtiene automáticamente `leads.view`, `leads.create`, etc. sin ninguna acción manual.

### Paso 2 — Validación post-migración
```sql
-- Verificar que los roles de sistema tienen permisos asignados
SELECT r.role_code, COUNT(rp.id) AS num_permisos
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id = r.id
WHERE r.tenant_id IS NULL
GROUP BY r.role_code
ORDER BY r.role_code;
```

### Paso 3 — Deprecar `src/lib/role-permissions.ts` (Fase 9)
Una vez que todos los checks de permisos pasen por `check_user_permission` o `get_user_permissions`, el archivo TypeScript puede reducirse a solo la función `hasAccess` para compatibilidad de UI (visibilidad de menús), delegando la autorización real a la BD.

### Paso 4 — Migración de tenants a roles personalizados (opcional, self-service)
Los `ADMIN_EMPRESA` de cada tenant pueden crear roles personalizados vía la UI de Settings → Roles y reasignar usuarios. No hay migración forzada: los roles de sistema siguen siendo válidos indefinidamente.

---

## Reglas de Governanza

1. Los **roles de sistema** (`tenant_id IS NULL`) son inmutables desde la aplicación; solo se modifican via migraciones SQL versionadas.
2. Los **roles personalizados** solo pueden ser creados/modificados por `ADMIN_EMPRESA`, `SUPER_ADMIN` o `ADMIN_DEV` del propio tenant.
3. Un tenant **no puede** asignar permisos que no existan en el catálogo maestro (`permissions`). Validado a nivel de FK y de Server Action con Zod.
4. Las excepciones individuales (`user_permissions`) deben ser auditadas — cada fila debe tener `assigned_by` poblado.

---

## Referencias

- Migración: `supabase/migrations/20260713000052_dynamic_rbac.sql`
- Server Actions: `src/erp/actions/rbac.ts`
- Middleware: `src/erp/middleware/guard.ts`, `src/platform/middleware/auth-utils.ts`
- ADR-001: Multi-tenancy via RLS (contexto de aislamiento por tenant)
- ADR-003: Auth Hook Subquery (patrón SECURITY DEFINER para evitar recursión)
