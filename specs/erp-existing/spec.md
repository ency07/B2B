# Feature Specification: ERP Core (Dashboard + CRM + Jobs + Inventory + Purchases + Invoicing)

**Feature Branch**: `existing/erp-core`

**Status**: Implemented (retrospective spec)

## User Scenarios & Testing

### User Story 1 - Dashboard Ejecutivo (Priority: P1)

El operador ve KPIs en tiempo real del estado del negocio.

**Acceptance Scenarios**:

1. **Given** un usuario autenticado con rol operativo, **When** ingresa al dashboard, **Then** ve KPIs: leads activos, OT en curso, facturas por cobrar, inventario crítico
2. **Given** un KPI con tendencia, **When** hay datos del período anterior, **Then** muestra variación % con indicador visual
3. **Given** el dashboard en móvil, **When** se renderiza, **Then** layout responsivo con cards apilables

### User Story 2 - CRM y Gestión de Leads (Priority: P1)

El equipo comercial gestiona leads, oportunidades y clientes.

**Acceptance Scenarios**:

1. **Given** un lead nuevo del wizard, **When** aparece en CRM, **Then** tiene scoring automático y asignación por tenant
2. **Given** un comercial en CRM, **When** avanza un lead a "CALIFICADO", **Then** se crea oportunidad y se notifica al asignado
3. **Given** un cliente existente, **When** se ve su detalle, **Then** muestra: contacto, histórico de OT, facturas, garantías

### User Story 3 - Órdenes de Trabajo (OT) (Priority: P1)

**Acceptance Scenarios**:

1. **Given** un requerimiento aprobado, **When** se crea OT, **Then** hereda datos del requerimiento + genera número secuencial por tenant
2. **Given** una OT en curso, **When** se registra avance, **Then** actualiza estado y registra en `business_events`
3. **Given** una OT completada, **When** se cierra, **Then** trigger valida checklist mínimo

### User Story 4 - Inventario (Priority: P1)

**Acceptance Scenarios**:

1. **Given** un producto en inventario, **When** se consulta, **Then** muestra stock actual, mínimo, máximo y ubicación
2. **Given** un ajuste de inventario, **When** se registra, **Then** se audita en `audit_logs` con diff JSONB
3. **Given** stock por debajo del mínimo, **When** se actualiza, **Then** genera alerta de reorden

### User Story 5 - Compras (Priority: P2)

**Acceptance Scenarios**:

1. **Given** una necesidad de compra, **When** se crea solicitud, **Then** pasa por flujo de aprobación según monto
2. **Given** una orden de compra aprobada, **When** se recibe mercancía, **Then** actualiza inventario automáticamente

### User Story 6 - Facturación (Priority: P1)

**Acceptance Scenarios**:

1. **Given** una OT completada, **When** se genera factura, **Then** calcula montos, impuestos, descuentos por tenant
2. **Given** una factura emitida, **When** se registra pago, **Then** actualiza estado y genera business_event
3. **Given** una factura vencida, **When** pasa la fecha, **Then** trigger actualiza a "VENCIDA" y notifica

### Edge Cases

- ¿Qué pasa cuando se intenta eliminar una entidad con dependencias? → Soft delete con verificación de integridad
- ¿Qué pasa cuando el tenant no tiene configuración de impuestos? → Valores por defecto del sistema
- ¿Qué pasa con concurrencia en secuencias? → `tenant_sequences` con bloqueo a nivel fila

## Requirements

### Functional Requirements

- **FR-001**: Dashboard con KPIs: leads, OT, facturas, inventario crítico, rentabilidad
- **FR-002**: CRM con pipeline: Lead → Calificado → Oportunidad → Cotización → Cliente
- **FR-003**: OT con estados: PENDIENTE → EN_PROCESO → COMPLETADA → FACTURADA
- **FR-004**: Inventario con control de stock mínimo, ajustes auditados, alertas
- **FR-005**: Compras con aprobaciones por monto y recepción contra OC
- **FR-006**: Facturación con: emisión, pagos, NC, cartera, anticipos, dunning
- **FR-007**: Soft delete en todas las entidades operacionales
- **FR-008**: Auditoría dual: `audit_logs` + `business_events`
- **FR-009**: Códigos secuenciales por tenant vía `tenant_sequences`
- **FR-010**: Sidebar con navegación por módulos: Dashboard, CRM, Requerimientos, OT, Inventario, Compras, Facturación, CMS, Configuración
- **FR-011**: Layout con modo oscuro forzado (tema carbon/graphite)
- **FR-012**: Server Actions para toda mutación (`"use server"`)
- **FR-013**: Validación Zod en toda entrada de datos
- **FR-014**: Rate limiting por acción de usuario
- **FR-015**: Notificaciones de eventos críticos

### Key Entities

- **Lead**, **Client**, **ClientContact**, **Requirement** (requerimiento técnico), **Quote** (cotización), **Job** (OT), **InventoryItem**, **PurchaseOrder**, **Invoice**, **Payment**, **CreditNote**

## Success Criteria

- **SC-001**: Dashboard carga <1s con datos reales
- **SC-002**: CRUD de cualquier entidad <500ms
- **SC-003**: 100% de tablas operacionales con soft delete + auditoría
- **SC-004**: 100% de tablas con RLS por tenant
- **SC-005**: Sin fugas cross-tenant verificadas por tests de seguridad
- **SC-006**: Pre-commit gates pasan: tsc, lint, vitest, audit

## Assumptions

- Todos los usuarios tienen rol y permisos asignados vía RBAC
- Las tablas existen en Supabase con migraciones aplicadas
- El tenant se deriva del JWT, nunca del cliente
- El modo oscuro es el default del ERP (nunca claro)
