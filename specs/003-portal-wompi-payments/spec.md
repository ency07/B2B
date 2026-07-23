# Feature Specification: Pasarela de Pagos Wompi/PSE en el Portal de Clientes

**Feature Branch**: `feat/003-portal-wompi-payments`

**Created**: 2026-07-21

**Status**: Draft

**Input**: User description: "Cerrar gap P-002/P1-06 de GAP_ANALYSIS.md — Integrar Wompi/PSE en Portal Cliente: pasarela de pagos con webhook y actualización de estado. El código comenta explícitamente 'sin gateway conectado'."

## Contexto y restricción conocida (importante)

**No hay credenciales de Wompi en el proyecto** (confirmado: sin variables de entorno, sin cuenta
en `comercios.wompi.co` registrada). Wompi no publica llaves sandbox universales — cada cuenta
genera su propio par `pub_test_`/`prv_test_`. Decisión confirmada con el usuario: se construye la
integración completa contra la API real y documentada de Wompi (Widget de checkout + webhooks +
verificación de firma), lista para activarse en cuanto se agreguen las llaves a `.env`. La prueba
de un pago real en vivo queda pendiente de esa configuración — no se simula un pago exitoso sin
que haya ocurrido una transacción real (mismo principio que ya aplicaba el código existente en
`usePortalClientState.ts`: "no se simula un pago exitoso... se muestra un estado honesto").

**Hallazgo que definió el diseño de escritura**: igual que con `quotes` (ver
[[002-portal-client-quotes]]), la tabla `payments` tiene un trigger `enforce_invoice_permissions()`
que exige un rol financiero interno (`AUXILIAR_FINANZAS`/`JEFE_FINANZAS`/`GERENTE`/
`GERENTE_GENERAL`) para insertar un pago. Un webhook de Wompi no tiene sesión de usuario. Se
resuelve con una excepción estrecha y auditable en ese mismo trigger (mismo patrón ya usado ahí
por `is_platform_super_admin()`), activada solo dentro de una función `SECURITY DEFINER` dedicada
que además está revocada de `PUBLIC`/`authenticated` y solo otorgada a `service_role` — el mismo
patrón que ya usan las RPC transaccionales del ERP (`create_invoice_with_item`).

**Reutilización de columnas existentes**: `invoices` ya tiene columnas `payment_link`,
`payment_token`, `payment_status`, `payment_provider`, `payment_url` — creadas en una migración
anterior pero nunca usadas por ningún código (verificado). Se reutilizan para trackear el intento
de pago en curso (referencia, estado PENDING/APPROVED/DECLINED/ERROR) en vez de crear una tabla
`payment_transactions` nueva. Estas columnas no están protegidas por ningún trigger de permisos ni
de inmutabilidad — se pueden actualizar libremente desde el webhook sin necesitar ninguna
excepción especial.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pagar una factura desde el portal (Priority: P1)

Un contacto de cliente con una factura pendiente quiere pagarla en línea con tarjeta o PSE sin
tener que coordinar una transferencia manual con su ejecutivo.

**Why this priority**: Es el gap crítico P-002 — hoy el botón de pago en el portal muestra
explícitamente "sin gateway conectado, coordina con tu ejecutivo".

**Independent Test**: Con llaves de Wompi configuradas, abrir una factura con saldo pendiente,
iniciar el pago, completar la transacción en el Widget de Wompi con una tarjeta de prueba
(`4242 4242 4242 4242`, aprobada en sandbox), y verificar que la factura pasa a
`PAGADA`/`PARCIALMENTE_PAGADA` automáticamente tras el webhook.

**Acceptance Scenarios**:

1. **Given** una factura con saldo pendiente (`EMITIDA`, `PARCIALMENTE_PAGADA` o `VENCIDA`),
   **When** el cliente hace clic en "Pagar", **Then** ve el Widget de Wompi con el monto exacto del
   saldo pendiente precargado, sin poder editarlo desde el navegador (firma de integridad calculada
   en el servidor).
2. **Given** el cliente completa el pago y Wompi lo aprueba, **When** el webhook llega y su firma es
   válida, **Then** se registra un `payments` real (`status='APLICADO'`) y la factura se actualiza
   automáticamente vía el mecanismo ya existente (`refresh_invoice_paid_amount`) — sin tocar
   `enforce_invoice_permissions` para ningún otro caso de uso.
3. **Given** el mismo evento de webhook llega dos veces (Wompi reintenta hasta 3 veces si no recibe
   200 en 24h), **When** se procesa el segundo evento, **Then** NO se crea un segundo pago
   duplicado (idempotencia por `reference_number`).
4. **Given** Wompi rechaza el pago, **When** llega el webhook de `DECLINED`, **Then** NO se crea
   ningún `payments`, la factura no cambia de estado, y el cliente ve un mensaje honesto de que el
   pago no se pudo procesar.
5. **Given** un webhook llega con una firma inválida (no viene realmente de Wompi), **When** se
   recibe, **Then** se rechaza con 401 sin tocar ningún dato.
6. **Given** no hay credenciales de Wompi configuradas en `.env`, **When** el cliente abre una
   factura pagable, **Then** ve el mensaje honesto actual ("coordina con tu ejecutivo") en vez de un
   Widget roto — no se cambia ese comportamiento hasta que se configuren las llaves.

### Edge Cases

- Factura ya pagada por otro medio mientras el cliente tenía el Widget abierto → el webhook de
  Wompi (si el cliente insiste y paga de más) no debe duplicar el pago; validar saldo pendiente
  dentro de la RPC antes de insertar.
- Referencia de pago reutilizada/adivinada por un tercero → el webhook handler resuelve la factura
  por `payment_token`, no confía en ningún dato que venga del navegador del cliente.
- Cliente cierra el navegador antes de que el Widget confirme → el webhook sigue llegando de forma
  asíncrona igual; el estado se actualiza cuando llegue, sin depender de que el cliente siga en la
  página.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE generar, en el servidor, la firma de integridad de Wompi (referencia +
  monto + moneda + secreto), nunca en el navegador.
- **FR-002**: El sistema DEBE verificar la firma (`checksum`) de cada webhook recibido antes de
  procesar cualquier dato, usando el secreto de eventos configurado en `.env`.
- **FR-003**: El sistema DEBE ser idempotente ante webhooks duplicados/reintentados.
- **FR-004**: El sistema NO DEBE crear un pago (`payments`) para transacciones no `APPROVED`.
- **FR-005**: El sistema DEBE aplicar el pago reutilizando el mecanismo existente
  (`refresh_invoice_paid_amount` vía la tabla `payments`), no debe escribir `invoices.status`
  directamente.
- **FR-006**: El sistema DEBE dejar el flujo actual (mensaje honesto "sin gateway") intacto cuando
  las credenciales de Wompi no están configuradas.
- **FR-007**: El sistema DEBE limitar el bypass de `enforce_invoice_permissions` estrictamente al
  INSERT de pagos confirmados por Wompi — ningún otro caso de uso debe verse afectado.

### Key Entities

- Ninguna entidad nueva. Se reutilizan `invoices` (columnas `payment_*` ya existentes) y `payments`
  (tabla existente, mismo flujo que un pago registrado manualmente por finanzas).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Con credenciales configuradas, un cliente puede pagar una factura de principio a fin
  sin salir del portal.
- **SC-002**: Un webhook duplicado nunca produce un pago duplicado (0 duplicados en pruebas
  repetidas).
- **SC-003**: Un webhook con firma inválida nunca altera ningún dato (0% de aceptación de eventos
  no auténticos).
- **SC-004**: Ningún otro flujo de pagos/facturas (registro manual por finanzas, anulación, etc.)
  cambia de comportamiento — el bypass es invisible fuera del camino de Wompi.

## Assumptions

- Se usa el Widget de checkout de Wompi (`checkout.wompi.co/widget.js`), no la integración
  server-to-server de "Payment Links" — es la opción documentada más simple y la que ya proponía el
  spec de diseño original (`specs/04_portal/04_PORTAL_INVOICES_PAYMENTS.md`).
- Se soporta pago del saldo pendiente completo de una factura por transacción — no pagos parciales
  personalizados por el cliente (el spec original tampoco lo pedía; simplifica la integridad de la
  firma).
- El webhook vive en una ruta pública de Next.js (`/api/webhooks/wompi`), fuera del árbol de Server
  Actions autenticadas — es la única forma de recibir un POST de un servidor externo.
- Durante esta sesión se encontró evidencia de que `registerPayment()` (acción interna del ERP) 
  podría tener el mismo problema de permisos que motivó este diseño, mucho antes de este feature —
  se flageó por separado (tarea `task_9833b2d7`), no se investiga ni se toca aquí.
