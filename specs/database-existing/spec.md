# Feature Specification: Database Schema (47 Migrations)

**Feature Branch**: `existing/database`

**Status**: Implemented (retrospective spec)

## User Scenarios & Testing

### User Story 1 - Multi-Tenant Schema (Priority: P1)

La base de datos soporta aislamiento completo por tenant.

**Acceptance Scenarios**:

1. **Given** un tenant nuevo, **When** se crea, **Then** todas las tablas operacionales reference `tenants(id)`
2. **Given** datos de diferentes tenants, **When** se consultan, **Then** RLS aísla completamente
3. **Given** un tenant eliminado, **When** se consultan sus datos, **Then** soft delete activo

### User Story 2 - Soft Delete + Auditoría (Priority: P1)

**Acceptance Scenarios**:

1. **Given** cualquier tabla operacional, **When** se intenta DELETE, **Then** trigger bloquea
2. **Given** una mutación en cualquier tabla, **When** se ejecuta, **Then** `audit_logs` registra diff JSONB
3. **Given** un hito de negocio, **When** ocurre, **Then** `business_events` registra entidad + acción + metadata

### User Story 3 - Migraciones (Priority: P1)

**Acceptance Scenarios**:

1. **Given** una migración nueva, **When** se ejecuta, **Then** se registra en `_migrations` tracking
2. **Given** migraciones existentes, **When** se deploya, **Then** `deploy-migrations.ts` ejecuta en orden

### User Story 4 - Índices y Performance (Priority: P2)

**Acceptance Scenarios**:

1. **Given** consultas frecuentes, **When** se analiza performance, **Then** índices cubren los patrones de acceso
2. **Given** tablas grandes, **When** se consulta con filtro por tenant, **Then** índice compuesto (tenant_id + timestamp) acelera

### Edge Cases

- ¿Qué pasa cuando una migración falla? → Rollback manual requiere script de reversión
- ¿Qué pasa cuando hay colisión de índices? → `check-index-collisions.ts` detecta
- ¿Qué pasa con RLS faltante? → `check-rls-coverage.ts` detecta tablas sin cobertura

## Requirements

### Functional Requirements

- **FR-001**: 47 migraciones SQL secuenciales en `supabase/migrations/`
- **FR-002**: Naming convention: `YYYYMMDDHHMMSS_descripcion.sql`
- **FR-003**: Toda tabla operacional tiene: `id`, `tenant_id`, `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`, `deleted_by`, `delete_reason`
- **FR-004**: RLS habilitado en toda tabla operacional vía `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- **FR-005**: Políticas RLS: `tenant_id = auth.jwt()->>'tenant_id'`
- **FR-006**: Trigger `before delete` bloquea DELETE físico
- **FR-007**: `audit_logs` function en cada mutación
- **FR-008**: `business_events` para hitos de negocio
- **FR-009**: `tenant_sequences` para códigos correlativos por tenant
- **FR-010**: Índices compuestos (tenant_id + timestamp) en tablas grandes
- **FR-011**: Storage buckets para assets de tenant (logos, documentos)
- **FR-012**: Tablas de catálogo compartidas (no tenant_id) para datos maestros

### Key Schema Areas

- **Auth/Core**: tenants, user_roles, role_permissions, rate_limits
- **CRM**: leads, clients, client_contacts, opportunities
- **Commercial**: requirements, quotes, quote_items, approvals
- **Operations**: jobs, job_tasks, inventory_items, inventory_movements
- **Financial**: invoices, invoice_items, payments, credit_notes
- **Portal**: client_users, support_tickets, portal_notifications
- **CMS/Branding**: brand_configs, cms_pages, media_assets
- **System**: audit_logs, business_events, tenant_sequences, notifications

## Success Criteria

- **SC-001**: 100% de tablas operacionales con RLS + soft delete + auditoría
- **SC-002**: 0 colisiones de índices
- **SC-003**: 100% de cobertura RLS verificada por tests
- **SC-004**: Migraciones ejecutables en orden sin errores
- **SC-005**: Sin tablas sin `tenant_id`
- **SC-006**: Sin triggers faltantes en tablas operacionales

## Assumptions

- Las migraciones son secuenciales y no se saltan números
- No hay down migrations — la reversión es manual via SQL
- Los catálogos compartidos (ej: tipos de producto) no tienen tenant_id
- El seed de datos maestros se hace manualmente, no automático
