# Feature Specification: Filtro por Categoría en Catálogo Web

**Feature Branch**: `feat/001-web-catalog-category-filter`

**Created**: 2026-07-21

**Status**: Draft

**Input**: User description: "Cerrar gap W-001 de GAP_ANALYSIS.md — el catálogo público (`EngineeringCapabilities.tsx`) muestra los productos en una grilla estática de máximo 9 ítems sin selector de categoría/tipo de ventilador, pese a que la BD sí tiene jerarquía de categorías (`product_categories`) y el spec original (`specs/02_web/03_PRODUCTS_CATALOG.md`) ya diseñaba pills de filtro ('Todos', 'Extractores Axiales', etc.)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Explorar el catálogo por tipo de equipo (Priority: P1)

Un visitante de la web pública quiere encontrar rápidamente el tipo de ventilador/extractor que necesita (axial, centrífugo, blower, etc.) sin tener que escanear una grilla mezclada de todos los productos.

**Why this priority**: Es el gap crítico documentado (W-001) — sin esto, el catálogo no cumple su función de ayudar al visitante a autoservirse antes de contactar ventas. Bloquea la promesa de "biblioteca de especificaciones de ingeniería" del spec original.

**Independent Test**: Cargar la landing, ir a la sección de catálogo (`#capacidades`), hacer clic en una categoría distinta de "Todos" y verificar que solo se muestran productos de esa categoría; hacer clic en "Todos" y verificar que vuelve a mostrar el catálogo completo.

**Acceptance Scenarios**:

1. **Given** el catálogo cargó productos desde la base de datos con al menos 2 categorías distintas, **When** el visitante ve la sección de catálogo, **Then** ve una fila de pills de filtro con "Todos" (activo por defecto) seguido de cada categoría presente en los productos cargados.
2. **Given** el visitante hace clic en una pill de categoría específica, **When** el filtro se aplica, **Then** la grilla muestra únicamente los productos de esa categoría y la pill seleccionada queda marcada visualmente como activa.
3. **Given** el visitante tiene un filtro de categoría activo, **When** hace clic en "Todos", **Then** la grilla vuelve a mostrar todos los productos disponibles.
4. **Given** una categoría filtrada no tiene productos disponibles (caso borde), **When** se selecciona, **Then** se muestra un estado vacío claro en vez de una grilla en blanco (UI Defensiva).

### Edge Cases

- ¿Qué pasa si el catálogo de la BD está vacío y se usa el fallback estático (`FALLBACK_CAPACITIES`)? → El filtro debe funcionar igual sobre las categorías presentes en el fallback (ya tienen campo `category`).
- ¿Qué pasa si solo existe una categoría en todo el catálogo? → No tiene sentido mostrar pills de filtro con una sola opción real; se muestra solo "Todos" o se omite la fila de filtros (decisión de implementación, no cambia el comportamiento del usuario).
- ¿Qué pasa si hay más de 9 productos en una categoría? → Ya no aplica el límite fijo de 9 ítems globales; se listan todos los productos de la categoría seleccionada (ver FR-004).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE mostrar, sobre la grilla de productos del catálogo, una fila de controles de filtro por categoría con una opción "Todos" siempre presente y activa por defecto.
- **FR-002**: El sistema DEBE derivar las categorías del filtro de los datos reales del catálogo cargado (nombre de categoría tal como viene de `product_categories.name` vía `CatalogCategory[]`), sin hardcodear nombres de categoría en el componente.
- **FR-003**: Al seleccionar una categoría, el sistema DEBE mostrar únicamente los productos que pertenecen a esa categoría, y marcar visualmente cuál filtro está activo.
- **FR-004**: El sistema NO DEBE limitar la grilla a un máximo fijo de 9 productos cuando hay un filtro de categoría activo; el límite de 9 solo aplica a la vista "Todos" por razones de layout inicial (ver Assumptions).
- **FR-005**: El sistema DEBE mostrar un estado vacío defensivo (no una grilla en blanco) si una categoría filtrada no tiene productos.
- **FR-006**: El comportamiento de filtro DEBE funcionar tanto con datos reales de la BD como con el catálogo de respaldo estático (`FALLBACK_CAPACITIES`), ya que ambos exponen el campo `category`.
- **FR-007**: El filtro DEBE ser interacción de cliente (no recarga de página) y no debe romper el modal de detalle técnico existente ni el flujo hacia el wizard de cotización.

### Key Entities

- **Categoría de catálogo**: agrupador de productos ya existente en la jerarquía `CatalogCategory → subcategories → families → series → products`; para este filtro solo se usa el nombre de la categoría de nivel superior (`CatalogCategory.name`), no se crea ninguna entidad nueva.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un visitante puede filtrar el catálogo a una categoría específica y ver solo esos productos en menos de 1 segundo (interacción local, sin round-trip al servidor).
- **SC-002**: El 100% de las categorías presentes en el catálogo cargado (real o fallback) tienen una pill de filtro correspondiente — ninguna categoría queda inaccesible.
- **SC-003**: Cambiar de filtro no produce errores en consola ni rompe el modal de ficha técnica ni el CTA "Solicitar Ingeniería · Cotizador".

## Assumptions

- El límite de 9 productos en la vista "Todos" es una decisión de layout preexistente (grid de 3-4 columnas) y se mantiene solo para esa vista; no estaba en el alcance de W-001 cambiar el diseño de la grilla, solo agregar el selector de categoría.
- No se requiere persistir el filtro seleccionado (URL query param, localStorage) — es un estado de UI efímero por visita a la página, consistente con que el resto de la landing no usa routing por sección.
- "Filtro por categoría" (título del feature) se implementó a nivel `CatalogSubcategory`, no `CatalogCategory` — se verificó contra la BD real que `product_categories` es un paraguas de tenant con una sola fila, y la segmentación real de "tipo de ventilador" vive en `product_subcategories`. Ver `research.md` → Decisión 1 para el detalle de esta corrección.
