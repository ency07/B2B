# Feature Specification: Security Architecture (Auth + RLS + RBAC + Rate Limiting)

**Feature Branch**: `existing/security`

**Status**: Implemented (retrospective spec)

## User Scenarios & Testing

### User Story 1 - Autenticación Multi-Rol (Priority: P1)

Usuarios con diferentes roles acceden al sistema según su perfil.

**Acceptance Scenarios**:

1. **Given** un usuario no autenticado, **When** intenta acceder al dashboard, **Then** redirige a login
2. **Given** un usuario ERP (admin/operador), **When** inicia sesión, **Then** JWT incluye tenant_id + rol
3. **Given** un usuario portal (cliente), **When** inicia sesión, **Then** redirige a portal con datos de su tenant
4. **Given** un usuario con sesión expirada, **When** hace una petición, **Then** middleware redirige a login

### User Story 2 - RLS Multi-Tenant (Priority: P1)

Cada usuario ve solo datos de su tenant.

**Acceptance Scenarios**:

1. **Given** un usuario del Tenant A, **When** consulta cualquier tabla operacional, **Then** solo ve filas con su tenant_id
2. **Given** un usuario admin, **When** consulta datos, **Then** ve datos de su tenant (no cross-tenant)
3. **Given** un intento de cross-tenant query, **When** se ejecuta, **Then** RLS retorna 0 filas

### User Story 3 - RBAC Dinámico (Priority: P1)

**Acceptance Scenarios**:

1. **Given** un usuario con rol "operador", **When** intenta acceder a configuración, **Then** middleware bloquea
2. **Given** un usuario admin, **When** asigna permisos, **Then** se actualiza `role_permissions` en runtime
3. **Given** un permiso removido, **When** el usuario intenta la acción, **Then** se deniega en Server Action

### User Story 4 - Rate Limiting (Priority: P2)

**Acceptance Scenarios**:

1. **Given** múltiples intentos de login fallidos, **When** supera el límite, **Then** bloquea temporalmente
2. **Given** un rate limit excedido, **When** se intenta cualquier acción, **Then** retorna 429

### User Story 5 - CSP y Headers (Priority: P2)

**Acceptance Scenarios**:

1. **Given** cualquier página, **When** se sirve, **Then** incluye CSP, HSTS, X-Frame-Options
2. **Given** un intento de XSS, **When** se inyecta script, **Then** CSP bloquea

### Edge Cases

- ¿Qué pasa cuando el JWT es manipulado? → Verificación en middleware + RLS
- ¿Qué pasa cuando un token de refresh expira? → Redirigir a login
- ¿Qué pasa con rate limiting en webhooks? → Excepción configurable por IP

## Requirements

### Functional Requirements

- **FR-001**: Autenticación con Supabase Auth + JWT
- **FR-002**: JWT incluye: `tenant_id`, `role`, `user_metadata`
- **FR-003**: Middleware Next.js verifica sesión en cada request
- **FR-004**: RLS obligatorio en TODAS las tablas operacionales
- **FR-005**: Políticas RLS: `tenant_id = auth.jwt()->>'tenant_id'`
- **FR-006**: RBAC dinámico vía `role_permissions` (no hardcodeado)
- **FR-007**: Rate limiting por IP en login + por usuario en acciones
- **FR-008**: CSP configurado en next.config.ts
- **FR-009**: HSTS, X-Frame-Options, X-Content-Type-Options
- **FR-010**: Input validation con Zod en toda entrada
- **FR-011**: Sanitización de output con `sanitizeObject()`
- **FR-012**: Secrets solo en `.env.*` — prohibido hardcodear
- **FR-013**: Protección contra path traversal en file uploads
- **FR-014**: Magic bytes validation en uploads

### Key Entities

- **User** (auth.users), **UserRole**, **RolePermission**, **RateLimitEntry**, **AuditLog**, **BusinessEvent**

## Success Criteria

- **SC-001**: 0 riesgos de seguridad conocidos (audit high+)
- **SC-002**: 100% de tablas operacionales con RLS
- **SC-003**: Tests de seguridad verifican aislamiento cross-tenant
- **SC-004**: Rate limiting previene fuerza bruta en login
- **SC-005**: Sin secretos expuestos en frontend
- **SC-006**: CSP bloquea inline scripts no autorizados

## Assumptions

- Supabase Auth maneja la infraestructura de autenticación
- El tenant_id se deriva del JWT, nunca del request del cliente
- Los roles se definen en `role_permissions` (tabla), no en código
- Las políticas RLS se aplican en migraciones SQL
