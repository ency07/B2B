# Feature Specification: Cotizaciones en el Portal de Clientes

**Feature Branch**: `feat/002-portal-client-quotes`

**Created**: 2026-07-21

**Status**: Draft

**Input**: User description: "Cerrar gap P-001 de GAP_ANALYSIS.md (P1-04) — Implementar módulo de cotizaciones en Portal Cliente: el cliente debe poder ver sus cotizaciones, revisar el detalle, responder aceptar/rechazar, y descargar el PDF."

## Contexto y decisión de diseño (importante)

Al auditar la tabla real `quotes` (Principio I — No Inventar) se encontraron triggers de producción
(`enforce_quote_permissions`, `validate_quote_state_transitions`, `route_quote_approvals`) que ya
imponen un motor de aprobación **interno**: solo usuarios con rol `GERENTE_GENERAL` o
`DIRECTOR_COMERCIAL` pueden mover `quotes.status` a `APROBADA`/`RECHAZADA`, y `APROBADA` además
exige que el `requirement` asociado esté en `APROBACION`. Un `client_contact` del portal no tiene
rol en ese sistema — la base de datos rechazaría cualquier intento de moverlo directamente.

**Decisión (confirmada con el usuario)**: el portal NO dispara la transición real de `quotes.status`.
En su lugar, la respuesta del cliente se registra en columnas nuevas y separadas
(`client_response`, `client_response_at`, `client_response_reason`, `client_response_by`). El
staff ve esa respuesta en el ERP y formaliza la aprobación interna con el flujo que ya existe hoy.
Esto es aditivo — no toca ningún trigger ni permiso existente.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver mis cotizaciones (Priority: P1)

Un contacto de cliente autenticado en el portal quiere ver todas las propuestas comerciales que le
han enviado, con su estado, para saber qué tiene pendiente de revisar.

**Why this priority**: Es el gap crítico P-001 — hoy el portal no muestra ninguna cotización, pese
a que `GAP_ANALYSIS.md` señala explícitamente "el dashboard no puede mostrar cotizaciones
pendientes". Sin esto no hay nada que aceptar/rechazar ni descargar.

**Independent Test**: Iniciar sesión como un `client_contact` con cotizaciones en estado `ENVIADA`
o `APROBADA`/`RECHAZADA` asociadas a su `client_id`, entrar a la pestaña "Cotizaciones" y verificar
que aparecen solo esas cotizaciones (nunca `BORRADOR`/`EN_REVISION`, que son internas).

**Acceptance Scenarios**:

1. **Given** el cliente tiene cotizaciones con `status` en `ENVIADA`, `APROBADA`, `RECHAZADA`,
   `VENCIDA` o `CANCELADA`, **When** abre la pestaña Cotizaciones, **Then** ve una tarjeta por cada
   una con código, título (derivado del requerimiento asociado), monto total, fecha de vigencia y
   estado.
2. **Given** el cliente tiene cotizaciones en `BORRADOR` o `EN_REVISION` (aún no enviadas), **When**
   abre la pestaña, **Then** esas cotizaciones NO aparecen (son trabajo interno, no listo para el
   cliente).
3. **Given** el cliente no tiene ninguna cotización visible, **When** abre la pestaña, **Then** ve
   un estado vacío claro (UI Defensiva), no una lista en blanco.

### User Story 2 - Revisar el detalle y responder (Priority: P1)

El cliente quiere ver el desglose completo de una cotización (items, subtotal, IVA, total) y decidir
si la acepta o la rechaza, dejando su respuesta registrada.

**Why this priority**: Es la acción central del gap — sin poder "aceptar o rechazar con un clic" la
cotización no cumple su función en el portal.

**Independent Test**: Abrir una cotización en estado `ENVIADA` sin respuesta previa, ver el detalle
con items reales, hacer clic en "Aceptar" (o "Rechazar" con motivo), y verificar que la tarjeta
pasa a mostrar "Tu respuesta: Aceptada/Rechazada" sin poder volver a responder.

**Acceptance Scenarios**:

1. **Given** una cotización en `ENVIADA` sin `client_response` previo, **When** el cliente abre el
   detalle, **Then** ve los items reales (`quote_items`: descripción, cantidad, valor unitario) y
   los totales (subtotal, impuestos, total), y botones "Aceptar" / "Rechazar".
2. **Given** el cliente hace clic en "Aceptar", **When** confirma, **Then** se registra
   `client_response = 'ACEPTADA'` con fecha y su identidad de contacto; la cotización pasa a modo
   solo-lectura para el cliente ("Ya respondiste: Aceptada").
3. **Given** el cliente hace clic en "Rechazar", **When** ingresa un motivo (mínimo 10 caracteres,
   igual al mínimo que ya exige la validación interna de rechazo) y confirma, **Then** se registra
   `client_response = 'RECHAZADA'` con el motivo.
4. **Given** una cotización que NO está en `ENVIADA` (ya está `APROBADA`, `RECHAZADA`, `VENCIDA`,
   `CANCELADA`, o ya tiene `client_response` registrado), **When** el cliente la abre, **Then** ve
   el detalle en solo lectura, sin botones de acción — no puede responder dos veces ni sobre
   cotizaciones ya cerradas.
5. **Given** el cliente responde una cotización, **When** la respuesta se guarda, **Then** el staff
   del tenant recibe una notificación (mismo canal que tickets/mensajes: Slack/Discord/email si
   están configurados, log si no).

### User Story 3 - Descargar el PDF (Priority: P2)

El cliente quiere descargar un PDF de la cotización para uso interno o archivo.

**Why this priority**: Mencionado explícitamente en el gap ("ni PDF"), pero de menor urgencia que
poder ver/responder — es un extra sobre datos que ya están cargados.

**Independent Test**: Abrir el detalle de una cotización y hacer clic en "Descargar PDF"; se genera
un PDF con los datos reales de esa cotización (mismo patrón que la factura ya existente).

**Acceptance Scenarios**:

1. **Given** el cliente está viendo el detalle de una cotización, **When** hace clic en "Descargar
   PDF", **Then** se descarga un PDF (jsPDF, client-side, igual que facturas) con código, cliente,
   items, totales y estado — sin depender de un servicio externo.

### Edge Cases

- Cotización sin `requirement` con título usable → usar `quote_code` como fallback de título
  (nunca mostrar un título vacío o inventado).
- Cliente intenta responder una cotización de OTRO cliente (manipulando el `quoteId` en el
  request) → el RPC valida `quote.client_id = v_client_id` resuelto por sesión; si no coincide,
  no se actualiza ninguna fila y se lanza un error genérico (no se revela si la cotización existe).
- Admin en modo revisión (`previewClientId`) responde una cotización → se permite (paridad con el
  resto de acciones del portal), pero `client_response_by` queda NULL porque no hay un
  `client_contact` real actuando — no se atribuye a nadie una respuesta que no existe.
- Rechazo sin motivo o motivo muy corto → error de validación, igual que el rechazo interno ya
  exige `reject_reason` de mínimo 10 caracteres.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE listar, para el cliente autenticado, sus cotizaciones con
  `status IN ('ENVIADA','APROBADA','RECHAZADA','VENCIDA','CANCELADA')`, excluyendo `BORRADOR` y
  `EN_REVISION`.
- **FR-002**: El sistema DEBE mostrar el detalle de una cotización (items + totales) bajo demanda,
  sin cargar los items de todas las cotizaciones por adelantado.
- **FR-003**: El sistema DEBE permitir que el cliente registre una respuesta (`ACEPTADA` o
  `RECHAZADA` con motivo) SOLO sobre cotizaciones en `ENVIADA` que no tengan respuesta previa.
- **FR-004**: El sistema NO DEBE modificar `quotes.status` desde el portal — la respuesta del
  cliente se registra en columnas separadas, dejando intacto el flujo de aprobación interno.
- **FR-005**: El sistema DEBE aislar los datos por `client_id`/`tenant_id` con el mismo patrón de
  doble capa (TypeScript + RPC `SECURITY DEFINER` con `is_portal_client_for`) que ya usan
  requerimientos, facturas, pagos y tickets del portal.
- **FR-006**: El sistema DEBE notificar al staff del tenant cuando el cliente responde (reusa
  `notifyStaffClientUpdate`).
- **FR-007**: El sistema DEBE permitir descargar un PDF de la cotización con los datos reales
  (cliente-side, sin gateway externo).
- **FR-008**: El sistema DEBE mostrar un estado vacío defensivo si el cliente no tiene cotizaciones
  visibles.

### Key Entities

- **Respuesta del cliente a una cotización**: no es una entidad nueva — son 4 columnas nuevas en la
  tabla `quotes` existente (`client_response`, `client_response_at`, `client_response_reason`,
  `client_response_by`), deliberadamente separadas de `status` para no interferir con el motor de
  aprobación interno ya existente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un cliente puede ver el estado de todas sus cotizaciones enviadas sin tener que
  contactar a su ejecutivo.
- **SC-002**: Un cliente puede aceptar o rechazar una cotización en menos de 1 minuto sin salir del
  portal.
- **SC-003**: Ninguna cotización de otro cliente ni en estado interno (`BORRADOR`/`EN_REVISION`) es
  visible ni accionable desde el portal (0 filtraciones cross-tenant/cross-cliente).
- **SC-004**: El staff del tenant se entera de una respuesta del cliente sin tener que revisar la
  BD manualmente (notificación automática).

## Assumptions

- "Aceptar/Rechazar" en el portal registra la INTENCIÓN del cliente, no dispara la aprobación
  formal interna (ver sección de contexto arriba) — el staff sigue siendo quien mueve `status` a
  `APROBADA`/`RECHAZADA` con el flujo ya existente, ahora informado por la respuesta del cliente.
- No se implementa en este alcance la generación automática de una OT al aceptar — `convertQuoteToJob`
  en el ERP ya es una acción staff-gated con sus propias precondiciones (requirement en
  `APROBACION`); encadenarla automáticamente sería inventar una orquestación no solicitada.
- El "título" de la cotización se deriva de `requirements.title` vía `quotes.requirement_id`
  (NOT NULL) — no existe columna de título propia en `quotes`.
- No se implementa expiración automática de cotizaciones (`VENCIDA`) — se muestra el estado tal
  como está almacenado, sin inventar un job de auto-expiración fuera de alcance.
