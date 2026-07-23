# Phase 0 Research: Pasarela de Pagos Wompi/PSE

## Decisión 1: Sin credenciales, se construye contra la API real documentada

- **Decision**: Implementar contra `docs.wompi.co` (verificado por WebFetch, no memoria del
  modelo), dejando la activación pendiente de `.env`.
- **Rationale**: Confirmado con el usuario. Wompi no tiene llaves sandbox universales — cada cuenta
  en `comercios.wompi.co` genera su propio par. Fabricar credenciales falsas sería peor que no
  tener ninguna.
- **Fuente verificada**: [Environments and Keys](https://docs.wompi.co/en/docs/colombia/ambientes-y-llaves/),
  [Widget & Checkout Web](https://docs.wompi.co/en/docs/colombia/widget-checkout-web/),
  [Webhooks/Events](https://docs.wompi.co/en/docs/colombia/eventos/) (vía WebFetch, 2026-07-21).

## Decisión 2: Widget de checkout, no integración server-to-server

- **Decision**: `<script src="https://checkout.wompi.co/widget.js">` con atributos `data-*`, no la
  API de "Payment Links" server-to-server.
- **Rationale**: Es lo que ya proponía `specs/04_portal/04_PORTAL_INVOICES_PAYMENTS.md`
  (`{/* Wompi Widget se renderiza aquí */} <div id="wompi-checkout" />`) y es la opción más simple
  documentada por Wompi para este caso de uso (pagar una factura ya emitida por un monto fijo).

## Decisión 3: Firma de integridad — cálculo exacto

- **Decision**: `SHA256(reference + amount_in_cents + currency + integrity_secret)`, calculado en
  el servidor (Server Action), nunca expuesto al navegador salvo el resultado (hash) ya calculado.
- **Fuente**: doc oficial del Widget — orden exacto: referencia, monto en centavos, moneda, secreto
  de integridad (del dashboard de comercio, distinto del secreto de eventos).
- **Rationale**: Evita que el cliente manipule el monto a pagar desde el navegador — Wompi rechaza
  la transacción si la firma no coincide con lo que el comercio realmente cobra.

## Decisión 4: Verificación de webhook — checksum exacto

- **Decision**: Para cada evento recibido: tomar los valores de `signature.properties` (en el orden
  dado, ej. `transaction.id`, `transaction.status`, `transaction.amount_in_cents`), concatenarlos,
  agregar `timestamp`, agregar el **Event Secret** (distinto del Integrity Secret), `SHA256` el
  resultado, comparar con `signature.checksum` (o header `X-Event-Checksum`) usando comparación en
  tiempo constante (`crypto.timingSafeEqual`).
- **Fuente**: [Eventos | Wompi Docs](https://docs.wompi.co/en/docs/colombia/eventos/).
- **Rationale**: Es el único mecanismo de autenticidad del webhook — no hay mTLS ni IP allowlist
  documentado. Si el checksum no coincide, se rechaza con 401 sin tocar ningún dato.

## Decisión 5: Escritura del pago — bypass estrecho, no cambiar RBAC existente

- **Decision**: Igual patrón que [[003-portal-wompi-payments]] hermano [[002-portal-client-quotes]]:
  no reinventar el sistema de permisos. Se agrega:
  1. `is_wompi_payment_context()` — helper que lee `current_setting('app.wompi_payment_context', true)`.
  2. Una condición OR adicional en `enforce_invoice_permissions()`, SOLO en la rama
     `TG_TABLE_NAME='payments' AND TG_OP='INSERT'` — ninguna otra rama (invoices, UPDATE de
     payments) se toca.
  3. `wompi_confirm_payment(...)` — RPC `SECURITY DEFINER`, `REVOKE FROM PUBLIC`, `GRANT TO
     service_role` únicamente (mismo patrón que `create_invoice_with_item`, la RPC transaccional ya
     existente del ERP) — hace `SET LOCAL app.wompi_payment_context = 'true'` y luego el `INSERT`,
     dentro de la misma transacción (el flag muere solo al terminar).
- **Hallazgo que lo motivó**: se auditaron los 8 triggers de `payments` y los 9 de `invoices` con
  `execute_sql` antes de diseñar (no asumido). `enforce_invoice_permissions()` exige
  `AUXILIAR_FINANZAS`/`JEFE_FINANZAS`/`GERENTE`/`GERENTE_GENERAL` para el INSERT en `payments`. Un
  webhook no tiene `auth.uid()`.
- **Por qué no hace falta tocar la actualización de `invoices.status`**: `refresh_invoice_paid_amount()`
  (llamada por `handle_payment_application` tras el INSERT) actualiza `invoices.status` a
  `PARCIALMENTE_PAGADA`/`PAGADA` — esa transición específica NO está en el conjunto vigilado por
  `enforce_invoice_permissions` (solo vigila transiciones a `EMITIDA`/`ANULADA` desde `BORRADOR`, y
  a `ANULADA` desde cualquier estado). Tampoco la vigila `enforce_invoice_immutability` de forma que
  la bloquee (permite cualquier transición excepto reabrir `PAGADA`/`ANULADA`). Verificado leyendo
  ambas funciones completas, no asumido.
- **Hallazgo colateral fuera de alcance**: la misma auditoría sugiere que `registerPayment()` (acción
  interna del ERP, ya existente) podría tener el mismo problema al usar `supabaseAdmin` sin ningún
  mecanismo que le dé identidad de `auth.uid()` — los pagos reales en la BD tienen `created_by:
  null` y timestamps de un mismo lote (probablemente seed, no uso real de la app). Se flageó por
  separado (`task_9833b2d7`) — no se investiga ni se toca en este feature.

## Decisión 6: Columnas reutilizadas en `invoices`, no tabla nueva

- **Decision**: `payment_provider='WOMPI'`, `payment_token=<reference>`, `payment_status=
  'PENDING'|'APPROVED'|'DECLINED'|'ERROR'`, `payment_url` (si se usa el flujo de redirect en vez
  de Widget embebido, queda disponible para el futuro).
- **Rationale**: Ya existen, sin usar (verificado por grep — 0 archivos las referencian), y no
  tienen ningún trigger de permisos/inmutabilidad vigilándolas — se pueden actualizar libremente
  desde el webhook sin ninguna excepción especial, a diferencia del INSERT en `payments`.
- **Alternativa rechazada**: crear `payment_transactions` (como proponía el doc aspiracional
  `docs/13_finanzas/21 PASARELA DE PAGOS.txt`) — innecesario, viola Principio VII (Reutilización)
  cuando las columnas ya existen para este propósito exacto.

## Decisión 8: Verificación real del bypass, no solo lectura estática (actualización post-implementación)

- **Hallazgo**: `execute_sql` (la herramienta de este agente) conecta como `session_user='postgres'`
  literal — `is_platform_super_admin()` retorna `true` para CUALQUIER cosa hecha por esa vía,
  incluida una llamada directa a `wompi_confirm_payment`. Un primer intento de "probar" el bypass
  llamando la RPC vía `execute_sql` NO probaba nada real — solo confirmaba que un superusuario
  puede insertar, lo cual nunca estuvo en duda.
- **Decision**: Se agregaron credenciales Wompi de PLACEHOLDER a `.env` local (no reales, Wompi las
  rechazaría) y se probó el flujo completo con peticiones HTTP reales contra el webhook corriendo
  en el dev server — ese camino SÍ usa `supabaseAdmin` (service_role real, vía PostgREST, sin
  `auth.uid()`), la misma condición que el webhook real de Wompi tendrá en producción.
- **Resultado de la prueba real** (2026-07-21/22): se detectó y corrigió un bug real
  (`extractSignatureValues` se llamaba con la raíz del payload en vez de `payload.data` — los paths
  de `signature.properties` son relativos a `data`, no a la raíz) que la revisión estática no había
  detectado. Tras el fix: firma válida + `APPROVED` → pago aplicado correctamente vía el bypass
  real (`created_by: null`, monto correcto, `payment_code` autogenerado, factura recalculada a
  `PARCIALMENTE_PAGADA`); reenvío del mismo evento → sin duplicado (idempotencia); payload alterado
  → 401 sin tocar datos; `DECLINED` → solo tracking, sin pago creado. Todo revertido después de
  forma legítima (pago pasado a `ANULADO`, que dispara el mismo mecanismo de reversión ya
  existente — no se usó ningún atajo).
- **Lo que sigue sin poder probarse sin credenciales reales**: que Wompi realmente acepte la firma
  de integridad del Widget y complete un cobro de tarjeta real — eso requiere una cuenta real en
  `comercios.wompi.co`.

## Decisión 7: Idempotencia

- **Decision**: `wompi_confirm_payment` verifica, antes de insertar, si ya existe un `payments` con
  `reference_number = p_wompi_transaction_id` para ese `invoice_id`; si existe, retorna esa fila sin
  insertar de nuevo.
- **Rationale**: Wompi reintenta el webhook hasta 3 veces si no recibe 200 en 24h (documentado) —
  sin esto, un pago se aplicaría dos veces.
