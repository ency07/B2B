---
description: "Task list for feature implementation"
---

# Tasks: Cotizaciones en el Portal de Clientes

**Input**: Design documents from `specs/002-portal-client-quotes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Verificación manual/DOM (ver research.md Decisión 7) + gates de pre-commit existentes.
No se agregan tests automatizados nuevos para este feature (no se pidieron explícitamente y el
patrón de tests del portal no tiene precedente de tests de RPC/UI de este tipo).

## Phase 1: Base de datos (bloqueante — todo lo demás depende de esto)

- [x] T001 Escribir migración `supabase/migrations/<timestamp>_portal_quotes.sql`:
      4 columnas nuevas en `quotes` (`client_response`, `client_response_at`,
      `client_response_reason`, `client_response_by`) + CHECK de `client_response` + FK a
      `client_contacts(id)`
- [x] T002 En la misma migración: `portal_get_client_quotes(p_client_id uuid DEFAULT NULL)` —
      patrón de `portal_get_client_requirements`, join a `requirements` para el título, filtro de
      status (data-model.md RPC 1)
- [x] T003 En la misma migración: `portal_get_client_quote_items(p_quote_id uuid, p_client_id uuid
      DEFAULT NULL)` — detalle + cabecera (data-model.md RPC 2)
- [x] T004 En la misma migración: `portal_respond_to_quote(p_client_id uuid, p_quote_id uuid,
      p_response varchar, p_reason text DEFAULT NULL)` — mutación con las 9 reglas de
      data-model.md RPC 3, incluyendo el insert manual a `business_events`
- [x] T005 `REVOKE ALL ... FROM PUBLIC` + `GRANT EXECUTE ... TO authenticated` en los 3 RPC nuevos
- [x] T006 Aplicar la migración al proyecto Supabase real vía `mcp__supabase__apply_migration`
- [x] T007 Verificar con `execute_sql` (solo lectura): columnas existen, RPCs existen, y una
      llamada de prueba a `portal_get_client_quotes` con un `client_id` real no rompe (usando el
      contexto de servicio para inspección, no como sustituto de la prueba de RLS real desde la app)

**Checkpoint**: Backend listo y verificado antes de tocar TypeScript.

## Phase 2: Capa de acciones (Server Actions del portal)

- [x] T008 [P] Crear `src/portal/actions/quotes.ts`: `getClientQuotes`, `getClientQuoteDetail`,
      `respondToQuote` — mismo patrón que `getClientRequirements`/`createClientRequirement` en
      `portal.ts` (resolver cliente → `getPortalAuthenticatedClient()` → `.rpc(...)`)
- [x] T009 [P] Agregar `respondToQuoteSchema` (Zod) a `src/lib/validations/portal.ts`: `response`
      enum `ACEPTADA`/`RECHAZADA`, `reason` opcional pero `.min(10)` cuando `response ===
      'RECHAZADA'` (`.refine`)
- [x] T010 Extender `notifyStaffClientUpdate` en `src/portal/actions/notifications.ts`: agregar
      `"quote_response"` al union de `type`, rama de mensaje/Slack/Discord análoga a `"ticket"`
- [x] T011 `respondToQuote` en `quotes.ts` llama a `notifyStaffClientUpdate("quote_response", ...)`
      fire-and-forget tras un `respondToQuote` exitoso (mismo patrón que `createClientTicket`)
- [x] T012 Rate limit en `respondToQuote` con `checkRateLimit` (mismo patrón que tickets/mensajes,
      ej. 10 respuestas/minuto — no hay razón de negocio para más)

## Phase 3: UI — User Story 1 (lista) y User Story 2 (detalle + responder)

- [x] T013 `PortalActiveSection` en `types.ts` += `"quotes"`. No se creó `PortalQuote`/
      `PortalQuoteDetail` normalizados — `ClientQuote`/`ClientQuoteDetail` ya son camelCase y
      listos para UI (sin transformación tipo `mapStatusToProgress`), así que reutilizarlos
      directo evita una capa de mapeo redundante (Principio VII, sin sobre-abstraer).
- [x] T014 Crear `src/portal/components/dashboard/QuotesSection.tsx`: lista de tarjetas (patrón
      `RequirementsSection.tsx`, `STATUS_CONFIG` con los 5 estados visibles) + `Sheet` de detalle
      (patrón `InvoicesSection.tsx`) con items, totales, botones Aceptar/Rechazar condicionados a
      `status === 'ENVIADA' && !clientResponse`, diálogo de motivo para Rechazar
- [x] T015 `usePortalClientState.ts`: estado `quotes`, `selectedQuote`/`quoteDetail`, handlers
      `handleRespondToQuote(quoteId, response, reason?)` y `downloadQuotePdf(quoteId)` (mismo
      patrón que `downloadInvoicePdf`, usa `jsPDF`)
- [x] T016 `SectionTabs.tsx`: nueva pestaña "Cotizaciones" (ícono `FileSignature` o similar de
      lucide-react, distinto de los ya usados) con badge de pendientes
- [x] T017 `CustomerPortal.tsx`: pasar `quotes` prop, renderizar `QuotesSection` cuando
      `activeSection === "quotes"`
- [x] T018 `src/app/portal/page.tsx`: agregar `getClientQuotes(previewClientId)` al `Promise.all`
      existente, pasar `quotes={quotes}` a `CustomerPortalClient`

## Phase 4: Métrica de dashboard (US1, valor agregado explícito del gap)

- [x] T019 `usePortalClientState.ts`: derivar `pendingQuotesCount` (quotes con `status ===
      'ENVIADA' && !clientResponse`)
- [x] T020 `MetricCards.tsx`: 5ta tarjeta "Cotizaciones pendientes" (mismo patrón visual que las 4
      existentes), ajustar grid a 5 columnas en desktop
- [x] T021 `CustomerPortal.tsx`: pasar `pendingQuotesCount` a `MetricCards` y a `SectionTabs`

## Phase 5: PDF (US3)

- [x] T022 [P] `downloadQuotePdf` en `usePortalClientState.ts`: mismo patrón `jsPDF` de
      `downloadInvoicePdf`, incluye items + totales del detalle ya cargado

## Phase 6: Polish

- [x] T023 [P] `npx tsc --noEmit`, `npm run lint`, `npx vitest run` — sin errores nuevos (1 falla
      preexistente no relacionada en `core-actions-auth-guard.test.ts`, flageada por separado)
- [~] T024 Verificado con datos reales a través de una sesión admin-preview autenticada real (no
      mock): "Cotizaciones pendientes" muestra 0 correctamente para un cliente con 18 cotizaciones
      reales (todas APROBADA, ninguna ENVIADA) — prueba que `getClientQuotes` →
      `portal_get_client_quotes` → filtrado funciona end-to-end con RLS real. El flujo de
      responder (Aceptar/Rechazar) se verificó por lectura cuidadosa línea por línea contra cada
      uno de los 11 triggers de `quotes` (ver comentarios en la migración), pero NO se ejecutó en
      vivo: el Browser pane de esta sesión no puede hacer clic real en esta app (mismo problema
      que en [001-web-catalog-category-filter], confirmado de nuevo aquí con una página distinta —
      es de la herramienta, no del código) y hoy no existe ninguna cotización real en estado
      `ENVIADA` para probar la respuesta (nada se ha "enviado" bajo el flujo viejo). No se forzó
      una a `ENVIADA` vía SQL crudo a propósito — eso hubiera esquivado las mismas protecciones de
      aprobación que este feature fue diseñado para no tocar. Falta una pasada manual humana una
      vez exista una cotización real en `ENVIADA`.
- [x] T025 Actualizar `GAP_ANALYSIS.md`: marcar P-001 como cerrado con fecha y referencia a este
      feature branch, con nota de la decisión de diseño (no toca `status` real)

## Dependencies & Execution Order

- Phase 1 (BD) bloquea todo lo demás — sin RPCs no hay nada que llamar desde TypeScript.
- T008–T012 (Phase 2) dependen de Phase 1 completa y verificada.
- T013–T021 (Phase 3–4) dependen de Phase 2.
- T022 depende de T014 (necesita el detalle ya cargado en el componente).
- T023–T025 al final, tras todo lo anterior.

## Notes

- No relanzar `/speckit.specify` sobre P-001 sin releer primero la sección "Contexto y decisión de
  diseño" de spec.md — el diseño obvio (portal mueve `quotes.status` directo) está bloqueado por
  triggers de producción reales, no es un error de esta spec.
