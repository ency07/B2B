# Implementation Plan: Cotizaciones en el Portal de Clientes

**Branch**: `feat/002-portal-client-quotes` | **Date**: 2026-07-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/002-portal-client-quotes/spec.md`

## Summary

Exponer las cotizaciones (`quotes`/`quote_items`, ya existentes y maduras en el ERP) al portal de
clientes: lista, detalle con items, respuesta del cliente (aceptar/rechazar sin tocar el motor de
aprobación interno) y PDF. Sigue al pie el patrón ya establecido de 9 RPCs `portal_get_client_*` /
`portal_create_client_*` (`SECURITY DEFINER`, `is_admin_reviewer()` / `is_portal_client_for()`,
doble capa de aislamiento). La única pieza genuinamente nueva es la respuesta del cliente, que se
guarda en 4 columnas nuevas y separadas de `status` (ver spec.md → Contexto y decisión de diseño).

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19, Next.js 16 (App Router); PL/pgSQL para RPCs

**Primary Dependencies**: `jsPDF` (ya en uso para PDF de facturas), `zod` (validación), Supabase JS
(`getPortalAuthenticatedClient()` — anon key + JWT del usuario, RLS real, no `service_role`)

**Storage**: PostgreSQL (Supabase) — reutiliza `quotes`/`quote_items` existentes; agrega 4 columnas
nullable a `quotes` (`client_response`, `client_response_at`, `client_response_reason`,
`client_response_by`); no se crean tablas nuevas

**Testing**: Vitest (unit, patrón de `src/tests/`); verificación manual/DOM del portal (el Browser
pane de esta sesión no puede hacer clic real en la landing pública — ver research.md de
[001-web-catalog-category-filter] — a confirmar si el portal tiene el mismo problema)

**Target Platform**: Web (navegador), Next.js App Router, RPCs Postgres `SECURITY DEFINER`

**Project Type**: Web application (proyecto Next.js único; nueva pieza de backend son funciones SQL,
no un servicio separado)

**Performance Goals**: Lista de cotizaciones en una sola llamada RPC (igual que los otros 6 RPC de
lectura del portal, `LIMIT 50`); detalle de items bajo demanda, no precargado

**Constraints**: NO modificar `enforce_quote_permissions`, `validate_quote_state_transitions`,
`route_quote_approvals`, `check_quote_approval_lock`, `handle_quote_traceability` ni
`dispatch_quote_events` — son lógica de negocio interna ya en producción (19 cotizaciones APROBADA
reales) y quedaron fuera de alcance por decisión explícita del usuario. Cualquier columna nueva debe
ser nullable y aditiva.

**Scale/Scope**: 1 migración SQL (2 RPCs nuevos + 4 columnas), 1 archivo de acciones nuevo
(`src/portal/actions/quotes.ts`), 1 componente de sección nueva + wiring en 5 archivos existentes
del portal, 1 extensión de tipo en notificaciones, 1 métrica nueva en el dashboard

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplica | Cumplimiento |
|-----------|--------|---------------|
| I. No Inventar | Sí | Todo el diseño (tablas, triggers, RPCs existentes, columnas del schema real) se verificó contra la BD real vía `execute_sql` antes de escribir este plan, no contra los specs aspiracionales de `specs/04_portal/03_PORTAL_QUOTES.md` ni `specs/06_database/04_TABLES_QUOTES_REQUIREMENTS.md` (ambos con nombres de tabla/estado que no coinciden con el schema real). |
| II. Multi-Tenancy & RLS | Sí | RPCs `SECURITY DEFINER` con el mismo patrón de aislamiento tenant/cliente de doble capa que los 9 RPC del portal ya existentes. |
| III. Soft Delete & Auditoría | Sí | No se borra nada; `quotes` ya tiene trigger `audit_quotes` (AFTER INSERT/UPDATE/DELETE) que capturará el diff de las columnas nuevas automáticamente. Se agrega además un `business_events` manual para trazabilidad de negocio (el trigger `dispatch_quote_events` solo reacciona a cambios de `status`, no a las columnas nuevas). |
| IV. UI Defensiva | Sí | Estados vacíos, solo-lectura cuando no aplica responder, mensajes claros. |
| V. Tipado Estricto | Sí | Sin `any` nuevo evitable; Zod para el input de rechazo (motivo mínimo). |
| VII. Reutilización | Sí | Reutiliza `quotes`/`quote_items`, el patrón RPC de 9 funciones existentes, `getCurrentClient`/`getPortalAuthenticatedClient`, `notifyStaffClientUpdate`, el patrón de PDF de `downloadInvoicePdf`, y la estructura de `RequirementsSection.tsx`/`InvoicesSection.tsx` como base visual. |
| IX. Trazabilidad End-to-End | Sí | Cierra P-001, uno de los 2 gaps P1 de Portal que quedaban abiertos. No dispara la aprobación interna real (ver Assumptions de spec.md) — evita inventar una orquestación no solicitada. |
| Contratos Externos (congelados) | N/A | No toca Wompi/WhatsApp/Email; solo reutiliza el canal de notificaciones ya existente (Slack/Discord/Resend, todos opcionales). |

**Resultado**: PASS. Sin violaciones — el único cambio de schema es aditivo (columnas nullable), no
se tocan triggers ni RPCs de aprobación existentes.

## Project Structure

### Documentation (this feature)

```text
specs/002-portal-client-quotes/
├── plan.md              # This file
├── research.md          # Phase 0 output — hallazgos de auditoría de triggers reales
├── data-model.md        # Phase 1 output — columnas nuevas + contratos de los 2 RPC nuevos
├── quickstart.md        # Phase 1 output — guía de validación manual
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
supabase/migrations/
└── 20260721HHMMSS_portal_quotes.sql   # 2 RPC nuevos + 4 columnas nuevas en quotes

src/portal/actions/
└── quotes.ts                           # getClientQuotes, getClientQuoteItems, respondToQuote

src/portal/actions/
└── notifications.ts                    # extender type union con "quote_response"

src/portal/components/dashboard/
├── QuotesSection.tsx                   # nuevo — lista + detalle (Sheet) + accept/reject + PDF
├── types.ts                            # PortalActiveSection += "quotes"; tipos PortalQuote*
├── usePortalClientState.ts             # estado de quotes + handlers + downloadQuotePdf
├── SectionTabs.tsx                     # nueva pestaña "Cotizaciones"
├── MetricCards.tsx                     # nueva tarjeta "Cotizaciones pendientes"
└── CustomerPortal.tsx                  # wiring de la nueva sección

src/lib/validations/
└── portal.ts                           # respondToQuoteSchema (motivo de rechazo)

src/app/portal/
└── page.tsx                            # getClientQuotes() en el Promise.all + prop
```

**Structure Decision**: Mismo proyecto Next.js único. El único componente "backend" nuevo son
funciones SQL `SECURITY DEFINER` (no hay API routes ni servicio separado — consistente con
Principio VIII, Backend Puro vía Server Actions/RPC).

## Complexity Tracking

*Sin violaciones del Constitution Check — tabla no aplica.*
