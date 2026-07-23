---
description: "Task list for feature implementation"
---

# Tasks: Pasarela de Pagos Wompi/PSE en el Portal de Clientes

**Input**: Design documents from `specs/003-portal-wompi-payments/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Sin credenciales reales de Wompi no hay prueba end-to-end de un pago (ver spec.md). Se
verifican en su lugar: firma de integridad contra el ejemplo oficial de Wompi, verificación de
checksum con un secreto de prueba local, y los gates de pre-commit habituales.

## Phase 1: Base de datos (bloqueante)

- [x] T001 Migración `supabase/migrations/<timestamp>_wompi_payments.sql`: helper
      `is_wompi_payment_context()` (data-model.md)
- [x] T002 Misma migración: extender `enforce_invoice_permissions()` con la condición OR adicional
      SOLO en la rama `payments` INSERT — copiar la función completa vía `CREATE OR REPLACE` con
      esa única línea añadida, sin tocar ninguna otra rama
- [x] T003 Misma migración: RPC `wompi_confirm_payment(...)` — idempotencia por
      `reference_number`, validación de estado/saldo de la factura, `SET LOCAL` del flag antes del
      INSERT, `REVOKE FROM PUBLIC` + `GRANT TO service_role` únicamente
- [x] T004 Aplicar la migración vía `mcp__supabase__apply_migration`
- [x] T005 Verificado con `execute_sql` de solo lectura: función y helper existen,
      `enforce_invoice_permissions` conserva las 2 ramas de `invoices` intactas. **Hallazgo real**:
      `REVOKE ALL ... FROM PUBLIC` NO quita el grant automático de Supabase a `anon`/`authenticated`
      en funciones nuevas — `wompi_confirm_payment` quedó inicialmente invocable por `anon` (hueco
      explotable: cualquiera con la anon key pública podía fabricar un pago). Corregido en una
      segunda migración (`wompi_payments_lockdown_grants`) con `REVOKE ... FROM PUBLIC, anon,
      authenticated`. Verificado que solo `postgres`+`service_role` quedan con EXECUTE. El mismo
      problema (pero no explotable, ver research.md Decisión 8) existe en las RPC de quotes y en
      RPC del portal ya en producción — flageado por separado (`task_b5609633`).

**Checkpoint**: Backend listo. Ningún otro flujo de pagos/facturas cambia de comportamiento.

## Phase 2: Firma y verificación (funciones puras, testeables sin credenciales)

- [x] T006 [P] Crear `src/lib/wompi.ts`: `computeIntegritySignature()`, `verifyEventChecksum()` —
      usa `crypto.createHash('sha256')` y `crypto.timingSafeEqual()` (comparación en tiempo
      constante para el checksum)
- [x] T007 [P] Verificar `computeIntegritySignature()` contra el ejemplo oficial de la
      documentación de Wompi (quickstart.md paso 2) — si no coincide, revisar el orden de
      concatenación antes de continuar

## Phase 3: Checkout (iniciar el pago)

- [x] T008 Agregar `WOMPI_PUBLIC_KEY`, `WOMPI_INTEGRITY_SECRET`, `WOMPI_EVENTS_SECRET` como
      variables opcionales documentadas (comentario en `.env.example` si existe, o nota en
      quickstart.md) — el código debe tratar su ausencia como "gateway no disponible", no como error
- [x] T009 Crear `src/portal/actions/payments.ts`: `createWompiCheckout(previewClientId, invoiceId)`
      — resuelve cliente vía `getCurrentClient`, verifica que la factura pertenece al cliente y
      tiene saldo pendiente, genera `reference` única, calcula la firma con `wompi.ts`, actualiza
      `invoices.payment_provider/payment_token/payment_status='PENDING'` (UPDATE simple, sin RPC —
      esas columnas no están gated), retorna `{ unavailable: true }` si faltan las env vars
- [x] T010 Rate limit en `createWompiCheckout` con `checkRateLimit` (mismo patrón que otras
      acciones del portal)

## Phase 4: Webhook (confirmar el pago)

- [x] T011 Crear `src/app/api/webhooks/wompi/route.ts`: `POST` — parsear el payload, verificar
      checksum con `wompi.ts`, responder 401 si no valida
- [x] T012 Resolver la factura por `invoices.payment_token = data.transaction.reference` (usar
      `supabaseAdmin`, lectura simple, sin RPC)
- [x] T013 Si `status === 'APPROVED'`: llamar `supabaseAdmin.rpc('wompi_confirm_payment', {...})`;
      cualquier otro estado (`DECLINED`, `VOIDED`, `ERROR`): solo `UPDATE invoices SET
      payment_status = ...` (sin RPC)
- [x] T014 Responder 200 para cualquier evento reconocido y procesado (incluyendo declined) para
      que Wompi no reintente innecesariamente; loguear errores inesperados sin filtrar detalles al
      response

## Phase 5: UI del portal

- [x] T015 `InvoicesSection.tsx`: cuando `createWompiCheckout` NO retorna `{ unavailable: true }`,
      renderizar el Widget de Wompi (`<script data-render="button" ...>` con los atributos de
      data-model.md) en vez del mensaje "coordina con tu ejecutivo"; si retorna `unavailable`,
      mantener el mensaje actual sin cambios (FR-006, no regresión)
- [x] T016 Manejar `data-redirect-url` del Widget apuntando de vuelta al portal — al volver, la
      factura debe reflejar el estado más reciente (revalidar o refrescar los datos de la factura)

## Phase 6: Polish

- [x] T017 [P] `npx tsc --noEmit`, `npm run lint`, `npx vitest run` — sin errores nuevos
- [x] T018 Verificación real, más allá de lo planeado originalmente (ver research.md Decisión 8):
      firma de integridad verificada byte a byte contra el ejemplo oficial de Wompi; con
      credenciales PLACEHOLDER en `.env` local + el dev server corriendo, se enviaron peticiones
      HTTP reales al webhook: firma válida+APPROVED → pago aplicado (verificado que pasa por el
      `service_role` real, no por mi conexión privilegiada de herramienta — encontró y permitió
      corregir un bug real en `extractSignatureValues`); reenvío del mismo evento → idempotente,
      sin duplicar; payload alterado → 401; DECLINED → sin pago, solo tracking. Todo revertido
      después de forma legítima (`ANULADO`, no un hack). Sigue pendiente solo la prueba de un cobro
      real de tarjeta contra los servidores de Wompi, que exige una cuenta real.
- [x] T019 Actualizado `GAP_ANALYSIS.md`: P-002 marcado como cerrado en cuanto a código e
      integración (probada de extremo a extremo con credenciales de prueba locales) — con nota
      explícita de que el cobro real contra Wompi sigue sin probarse hasta que el usuario configure
      una cuenta real

## Dependencies & Execution Order

- Phase 1 (BD) bloquea Phase 3 y 4 (necesitan la RPC).
- Phase 2 es independiente, puede ir en paralelo con Phase 1.
- Phase 3 y 4 dependen de Phase 1 y 2.
- Phase 5 depende de Phase 3 (necesita `createWompiCheckout`).
- Phase 6 al final.

## Notes

- Este es el único gap P1 que queda documentado como "código listo, sin probar en vivo" — no
  inflar el estado a "cerrado" en `GAP_ANALYSIS.md` sin que alguien complete la prueba end-to-end
  con credenciales reales.
- Si se retoma: no volver a proponer mover `invoices`/`payments` fuera del patrón `payments` →
  `refresh_invoice_paid_amount` ya existente — ya se evaluó y es el camino correcto (research.md
  Decisión 6).
