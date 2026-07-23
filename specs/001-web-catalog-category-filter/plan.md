# Implementation Plan: Filtro por Categoría en Catálogo Web

**Branch**: `feat/001-web-catalog-category-filter` | **Date**: 2026-07-21 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/001-web-catalog-category-filter/spec.md`

## Summary

Agregar una fila de pills de filtro por categoría sobre la grilla de productos en
`EngineeringCapabilities.tsx` (sección `#capacidades` de la landing pública). Las categorías se
derivan de los datos ya disponibles (`CatalogCategory[]` desde `getIndustrialCatalog()` o el
fallback estático `FALLBACK_CAPACITIES`, ambos ya traen `category`). Es un cambio 100% de UI de
cliente: estado `useState` local para la categoría activa, sin nueva tabla, RPC ni Server Action.
Cierra el gap W-001 de `GAP_ANALYSIS.md`.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19, Next.js 16 (App Router)

**Primary Dependencies**: Ninguna nueva. Reutiliza `framer-motion` (ya usado en el archivo para
animaciones) y los tokens de diseño existentes (`bg-paper`, `text-ink`, etc.)

**Storage**: N/A — no hay cambios de esquema. Los datos ya vienen tipados vía `CatalogCategory`
(`src/web/actions/catalog.ts`)

**Testing**: Vitest (unit), siguiendo los patrones existentes en `src/tests/`. Verificación manual
en navegador para el comportamiento visual/interactivo (bajo riesgo, un solo componente de cliente)

**Target Platform**: Web (navegador), SSR/CSR híbrido de Next.js

**Project Type**: Web application (proyecto Next.js único, sin split frontend/backend)

**Performance Goals**: Filtrado instantáneo (cliente, sin round-trip); sin layout shift perceptible

**Constraints**: No romper el modal de detalle técnico (`TechnicalDetailModal`) ni el link al
wizard de cotización (`/wizard?tenant=...&product=...`); no cambiar el comportamiento actual de
`extractFromCatalog` cuando no hay filtro activo (paridad con el estado hoy)

**Scale/Scope**: Un solo archivo de componente (`EngineeringCapabilities.tsx`, ~700 líneas);
cambio aislado, sin efectos en ERP ni Portal

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Aplica | Cumplimiento |
|-----------|--------|---------------|
| I. No Inventar | Sí | Categorías vienen de datos reales (`CatalogCategory.name`), no se inventan nombres. Confirmado por auditoría de código antes de este plan. |
| IV. UI Defensiva & RSC First | Sí | El componente ya es `"use client"` (interacción real: modal, filtro). Se agrega estado vacío defensivo por categoría sin resultados (FR-005). |
| V. Tipado Estricto | Sí | Sin `any` nuevos; se reutiliza `CapacityItem["category"]` ya tipado como `string`. |
| VII. Reutilización | Sí | Se reutiliza `CatalogCategory[]`, `CapacityItem`, `FALLBACK_CAPACITIES` y el patrón de pills ya diseñado en `specs/02_web/03_PRODUCTS_CATALOG.md`. No se crea ninguna entidad ni tabla nueva. |
| IX. Trazabilidad End-to-End | Sí | No afecta la cadena Web→Portal→ERP directamente, pero es uno de los gaps P1 identificados en `GAP_ANALYSIS.md` bajo ese principio. |
| Contratos Externos (congelados) | N/A | No toca Wompi/WhatsApp/Email ni el stack. |

**Resultado**: PASS. Sin violaciones, no se requiere Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-web-catalog-category-filter/
├── plan.md              # This file
├── research.md          # Phase 0 output (decisiones, sin NEEDS CLARIFICATION pendientes)
├── quickstart.md        # Phase 1 output (guía de validación manual)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

No se genera `data-model.md` ni `contracts/`: no hay entidades nuevas (ver spec.md → Key Entities)
ni interfaces públicas nuevas — es una feature puramente de presentación sobre datos existentes.

### Source Code (repository root)

```text
src/web/components/marketing-v2/
└── EngineeringCapabilities.tsx   # Único archivo modificado: agrega estado de filtro,
                                   # fila de pills, y lógica de filtrado sobre `items`
```

**Structure Decision**: Proyecto Next.js único (no hay split frontend/backend en este repo — ver
`src/app/`, `src/web/`, `src/erp/`, `src/portal/` como módulos dentro del mismo proyecto). El
cambio vive enteramente en `src/web/components/marketing-v2/EngineeringCapabilities.tsx`.

## Complexity Tracking

*Sin violaciones del Constitution Check — tabla no aplica.*
