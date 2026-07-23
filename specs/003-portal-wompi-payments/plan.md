# Implementation Plan: Pasarela de Pagos Wompi/PSE en el Portal de Clientes

**Branch**: `feat/003-portal-wompi-payments` | **Date**: 2026-07-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-portal-wompi-payments/spec.md`

## Summary

Integrar el Widget de checkout de Wompi en el portal: firma de integridad generada en servidor,
webhook público con verificación de firma (SHA256), y aplicación del pago reutilizando el flujo
`payments` → `refresh_invoice_paid_amount` ya existente. El único cambio a lógica de negocio
existente es una excepción estrecha y auditable en `enforce_invoice_permissions()`, activada solo
dentro de una RPC dedicada, gated a `service_role`. Sin credenciales de Wompi, el código queda
completo pero sin probar en vivo (ver spec.md).

## Technical Context

**Language/Version**: TypeScript 5 (strict), Next.js 16 (Route Handler para el webhook, Server
Actions para iniciar el checkout); PL/pgSQL para la RPC de confirmación

**Primary Dependencies**: Ninguna nueva de npm — Wompi Widget se carga como `<script>` externo
(`checkout.wompi.co/widget.js`), firma con el módulo nativo `crypto` de Node (`createHash('sha256')`)

**Storage**: PostgreSQL (Supabase). Reutiliza `invoices.payment_link/payment_token/payment_status/
payment_provider/payment_url` (existentes, sin usar hasta ahora) y `payments` (existente). Sin
tablas nuevas.

**Testing**: Sin credenciales reales, no hay prueba end-to-end de un pago. Se verifica: (a) la
migración con `execute_sql` de solo lectura, (b) el cálculo de firma contra el ejemplo oficial de
la documentación de Wompi (valor conocido, verificable sin credenciales reales), (c) el webhook
handler con un payload simulado firmado con un secreto de prueba local, (d) tsc/lint/vitest.

**Target Platform**: Web (navegador para el Widget), Next.js Route Handler público para el webhook

**Project Type**: Web application (proyecto Next.js único)

**Performance Goals**: El webhook debe responder 200 rápido (Wompi no define un SLA estricto pero
recomienda procesar async si es lento); para este alcance el procesamiento es síncrono y simple, no
hace falta cola.

**Constraints**: NO modificar `validate_quote_state_transitions`, `route_quote_approvals`,
`enforce_quote_permissions` (fuera de alcance, pertenecen a P1-04). NO modificar
`handle_payment_application`, `refresh_invoice_paid_amount`, `dispatch_invoice_events` — se
reutilizan tal cual. El único cambio de trigger es aditivo en `enforce_invoice_permissions`, una
sola condición OR adicional, sin tocar ninguna rama existente.

**Scale/Scope**: 1 migración SQL (1 RPC `wompi_confirm_payment` + 1 helper
`is_wompi_payment_context()` + 1 condición añadida a `enforce_invoice_permissions`), 1 módulo de
firma/verificación (`src/lib/wompi.ts`), 1 Route Handler (`src/app/api/webhooks/wompi/route.ts`),
1 Server Action de portal para iniciar checkout, UI de pago en `InvoicesSection.tsx` (reemplaza el
mensaje "sin gateway" cuando hay credenciales configuradas).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplica | Cumplimiento |
|-----------|--------|---------------|
| I. No Inventar | Sí | Firma de integridad, estructura de webhook y checksum verificados contra la documentación oficial de Wompi (`docs.wompi.co`), no inventados. Schema real de `invoices`/`payments`/triggers auditado con `execute_sql` antes de diseñar. |
| II. Multi-Tenancy & RLS | Sí | El webhook resuelve la factura por `payment_token` (único), y la RPC valida `tenant_id`/`client_id` de esa factura antes de insertar el pago — no confía en nada que venga del payload salvo lo ya verificado por firma. |
| III. Soft Delete & Auditoría | Sí | `payments` ya tiene `audit_payments` (AFTER INSERT/UPDATE/DELETE) — el pago vía Wompi queda auditado igual que uno manual. `dispatch_invoice_events`/`dispatch_payment_events` ya emiten `business_events` automáticamente para este INSERT — no hace falta insert manual (a diferencia de quotes). |
| IV. UI Defensiva | Sí | Sin credenciales configuradas, se mantiene el mensaje honesto actual — nunca se simula un pago. |
| V. Tipado Estricto | Sí | Sin `any` nuevo evitable; tipos explícitos para el payload de webhook de Wompi. |
| VII. Reutilización | Sí | Reutiliza columnas `payment_*` de `invoices` ya existentes (creadas, nunca usadas), el flujo `payments`→`refresh_invoice_paid_amount` ya existente, y el patrón `REVOKE FROM PUBLIC + GRANT service_role` que ya usan las RPC transaccionales del ERP (`create_invoice_with_item`). |
| IX. Trazabilidad End-to-End | Sí | Cierra el último gap P1 (P-002/P1-06). |
| Contratos Externos (congelados) | Sí — el más relevante de todo el mandato | Wompi está explícitamente nombrado en la constitución como contrato congelado. Este plan no inventa un contrato nuevo: implementa exactamente el contrato público y documentado de Wompi (Widget + webhook + firma), sin desviaciones. |

**Resultado**: PASS. El único cambio a lógica existente (`enforce_invoice_permissions`) es aditivo,
de una sola condición, y no altera ninguna rama que ya esté en uso.

## Project Structure

### Documentation (this feature)

```text
specs/003-portal-wompi-payments/
├── plan.md              # This file
├── research.md          # Phase 0 output — contrato de Wompi verificado, hallazgos de triggers
├── data-model.md         # Phase 1 output — contrato de la RPC, forma del webhook, firma
├── quickstart.md        # Phase 1 output — cómo activar con credenciales reales + prueba de firma sin credenciales
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
supabase/migrations/
└── 20260721HHMMSS_wompi_payments.sql   # RPC wompi_confirm_payment + helper + 1 condición en enforce_invoice_permissions

src/lib/
└── wompi.ts                             # computeIntegritySignature(), verifyEventChecksum() — funciones puras, testeables sin credenciales reales

src/app/api/webhooks/wompi/
└── route.ts                             # Route Handler público — verifica firma, resuelve factura, llama a la RPC o actualiza payment_status

src/portal/actions/
└── payments.ts                          # createWompiCheckout(invoiceId) — Server Action que genera reference + firma + actualiza invoices.payment_*

src/portal/components/dashboard/
└── InvoicesSection.tsx                  # reemplaza el mensaje "sin gateway" por el Widget cuando WOMPI_PUBLIC_KEY existe; sin cambios si no existe
```

**Structure Decision**: Mismo proyecto Next.js único. El webhook vive fuera del árbol de Server
Actions autenticadas (`src/app/api/`) porque debe ser alcanzable por un POST externo sin sesión de
Supabase — es la única ruta de este tipo en el proyecto hasta ahora, consistente con que Backend
Puro (Principio VIII) prohíbe API Routes para lógica de negocio normal pero un webhook de un
proveedor externo es, por definición, el único caso legítimo de excepción (no hay Server Action
posible sin una sesión de navegador).

## Complexity Tracking

*Sin violaciones del Constitution Check — tabla no aplica.*
