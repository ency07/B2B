---
description: "Task list for feature implementation"
---

# Tasks: Filtro por Categoría en Catálogo Web

**Input**: Design documents from `specs/001-web-catalog-category-filter/`

**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: No se solicitaron tests nuevos explícitamente en el spec (feature de UI de bajo riesgo,
ver research.md → Decisión 4); se valida con `quickstart.md` + gates de pre-commit existentes.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias)
- **[Story]**: A qué user story pertenece (US1 = única historia de este feature)

## Phase 1: Setup

No aplica — no hay dependencias nuevas, no hay estructura de proyecto que crear. El feature vive
enteramente dentro de un archivo ya existente.

## Phase 2: Foundational

No aplica — no hay infraestructura compartida nueva (sin tablas, sin RPCs, sin Server Actions).

## Phase 3: User Story 1 - Explorar el catálogo por tipo de equipo (Priority: P1) 🎯 MVP

**Goal**: Agregar filtro de categoría funcional sobre la grilla del catálogo público.

**Independent Test**: Ver quickstart.md — clic en pill de categoría filtra la grilla; clic en
"Todos" la restaura.

### Implementation

- [x] T001 [US1] En `src/web/components/marketing-v2/EngineeringCapabilities.tsx`, dentro de
      `EngineeringCapabilities`, agregar `const [activeCategory, setActiveCategory] = React.useState<string | null>(null)`
      (`null` = "Todos") y `const categories = React.useMemo(() => Array.from(new Set(items.map(i => i.category))), [items])`
- [x] T002 [US1] Derivar `const visibleItems = React.useMemo(() => activeCategory ? items.filter(i => i.category === activeCategory) : items.slice(0, 9), [items, activeCategory])`
      — mantiene el cap de 9 solo en "Todos" (FR-004, Decisión 3 de research.md)
- [x] T003 [US1] Reemplazar `items.slice(0, 9).map(...)` en el grid (línea ~389) por
      `visibleItems.map(...)`, sin tocar el resto del JSX del grid ni `ProductCard`
- [x] T004 [US1] Agregar la fila de pills de filtro justo antes del `<div className="grid ...">`
      del catálogo: botón "Todos" (activo cuando `activeCategory === null`) + un botón por cada
      entrada de `categories`, usando tokens del design system existentes (no colores hardcodeados
      — Principio de limpieza visual ya aplicado en la auditoría del portal). Estilo pill activo/
      inactivo consistente con `statusColor`/badges ya presentes en el archivo
- [x] T005 [US1] Agregar estado vacío defensivo (FR-005): si `visibleItems.length === 0`, mostrar un
      mensaje simple en vez de un grid vacío (p.ej. "No hay equipos en esta categoría por ahora.")
- [x] T006 [US1] Si `categories.length <= 1`, omitir la fila de pills por completo (edge case de
      spec.md — no tiene sentido un filtro con una sola opción real)
- [x] T006b [US1] (No planeada, agregada durante verificación) `category` se deriva de
      `sub.name` (subcategoría), no `cat.name` (categoría) — corrección tras verificar contra la
      BD real (ver research.md Decisión 1). Se agregó dedupe por `prod.id` en `extractFromCatalog`
      y filtro de `deleted_at` en `catalog.ts` para no mostrar productos soft-eliminados
      duplicados (research.md Decisión 5).

**Checkpoint**: User Story 1 completa y verificable de forma independiente.

## Phase 4: Polish

- [x] T007 [P] Ejecutar `npx tsc --noEmit`, `npm run lint`, `npx vitest run` — pasan sin errores
      nuevos (1 falla preexistente no relacionada en `core-actions-auth-guard.test.ts`, flageada
      por separado)
- [~] T008 Verificado por inspección directa del DOM/datos (pills correctas, "Todos" muestra los 8
      productos reales deduplicados, sin errores de consola) porque el Browser pane de esta sesión
      no pudo resolver clics reales en esta página (falla incluso en botones preexistentes como
      "Menú" — limitación de la herramienta, no del código). No se verificó visualmente el toggle
      de pills con un clic real; queda pendiente de una verificación manual humana rápida.
- [x] T009 Actualizado `GAP_ANALYSIS.md`: W-001 marcado como cerrado con fecha y referencia a este
      feature branch, igual que se hizo para los gaps de ERP

## Dependencies & Execution Order

- T001 → T002 → T003 → T004 → T005 → T006 son secuenciales (mismo archivo, cada uno depende del
  estado agregado por el anterior)
- T007 y T008 dependen de T001–T006 completos
- T009 es independiente y puede hacerse en cualquier momento después de validar T008

## Notes

- Todo el cambio de código toca un único archivo (`EngineeringCapabilities.tsx`) — no hay
  paralelismo real entre tareas de implementación, solo entre las tareas de Polish.
- No relanzar `/speckit.specify` sobre W-001 en el futuro sin re-verificar el estado del código
  primero (mismo error que se encontró con los gaps E-001..E-015 del ERP).
