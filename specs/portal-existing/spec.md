# Feature Specification: Client Portal (Self-Service Dashboard)

**Feature Branch**: `existing/portal-cliente`

**Status**: Implemented (retrospective spec)

## User Scenarios & Testing

### User Story 1 - Portal Dashboard (Priority: P1)

El cliente accede a su portal y ve un resumen de su relación comercial.

**Acceptance Scenarios**:

1. **Given** un cliente autenticado en el portal, **When** ingresa al dashboard, **Then** ve: proyectos activos, cotizaciones pendientes, facturas por pagar, soporte reciente
2. **Given** datos del dashboard, **When** se cargan, **Then** modo claro siempre (nunca dark mode)
3. **Given** el cliente en mobile, **When** navega, **Then** layout responsivo con diseño adaptativo

### User Story 2 - Proyectos y Órdenes (Priority: P1)

**Acceptance Scenarios**:

1. **Given** un cliente con OT activas, **When** ve la lista de proyectos, **Then** muestra: número, descripción, estado, fecha, progreso
2. **Given** un proyecto en detalle, **When** el cliente hace clic, **Then** ve timeline de avances y documentos asociados

### User Story 3 - Cotizaciones (Priority: P1)

**Acceptance Scenarios**:

1. **Given** cotizaciones emitidas al cliente, **When** las revisa, **Then** puede ver detalle, descargar PDF, aceptar o solicitar cambio
2. **Given** una cotización aceptada, **When** el cliente confirma, **Then** genera requerimiento automático en ERP

### User Story 4 - Facturas y Pagos (Priority: P1)

**Acceptance Scenarios**:

1. **Given** facturas del cliente, **When** ve la lista, **Then** muestra: número, monto, estado, fecha vencimiento
2. **Given** una factura pendiente, **When** el cliente paga, **Then** redirige a pasarela Wompi y actualiza estado
3. **Given** pagos históricos, **When** se consultan, **Then** muestra recibo descargable en PDF

### User Story 5 - Soporte y Perfil (Priority: P2)

**Acceptance Scenarios**:

1. **Given** el cliente en soporte, **When** crea un ticket, **Then** se registra y notifica al equipo asignado
2. **Given** el perfil del cliente, **When** actualiza datos de contacto, **Then** valida con Zod antes de persistir

### Edge Cases

- ¿Qué pasa cuando el tenant no tiene white-label configurado? → Usar colores por defecto
- ¿Qué pasa cuando Wompi está caído? → Mensaje de error + opción de pago manual
- ¿Qué pasa cuando expira la sesión? → Redirigir a login con mensaje

## Requirements

### Functional Requirements

- **FR-001**: Dashboard con: proyectos activos, cotizaciones pendientes, facturas por pagar, soporte
- **FR-002**: Lista de proyectos con detalle y timeline
- **FR-003**: Cotizaciones: vista, PDF, aceptar/rechazar, solicitar cambio
- **FR-004**: Facturas: lista, detalle, pago Wompi, recibo PDF
- **FR-005**: Soporte: tickets con estado y prioridad
- **FR-006**: Perfil: datos de contacto, cambiar contraseña, preferencias
- **FR-007**: Modo claro SIEMPRE (nunca dark mode)
- **FR-008**: White-label: logo, colores, nombre del tenant
- **FR-009**: Server Actions para toda mutación
- **FR-010**: Validación Zod en formularios
- **FR-011**: UI Defensiva con skeletons y empty states
- **FR-012**: Navegación con 6 secciones máximas

### Key Entities

- **ClientUser** (usuario portal), **Project** (proyecto visible al cliente), **ClientQuote**, **ClientInvoice**, **SupportTicket**

## Success Criteria

- **SC-001**: Portal carga <2s
- **SC-002**: Pago Wompi completo <30s
- **SC-003**: Sin fugas cross-tenant en datos del portal
- **SC-004**: PDF de cotización/factura generado <3s
- **SC-005**: 100% white-label configurable sin recompilar

## Assumptions

- El portal usa tema light exclusivamente
- La pasarela de pagos es Wompi (Colombia)
- Los clientes se autentican con Supabase Auth
- El white-label se configura desde CMS
