# Phase 0 Research: Filtro por Categoría en Catálogo Web

No quedaron marcadores `NEEDS CLARIFICATION` en `spec.md` — el alcance ya estaba acotado por el
gap W-001 documentado y el spec de diseño original. Este archivo registra las decisiones tomadas
en vez de dejarlas implícitas (Principio I — No Inventar).

## Decisión 1: Nivel de agrupación del filtro

- **Decision** (CORREGIDA tras verificar contra la BD real — ver nota abajo): Filtrar por
  `CatalogSubcategory.name` (`sub.name` en `extractFromCatalog`), no por `CatalogCategory.name`.
- **Rationale**: Se verificó con SQL directo contra el proyecto Supabase real (no solo contra el
  spec de ejemplo) que `product_categories` tiene una sola fila activa ("Sistemas de Aire") — es un
  paraguas de tenant, no una segmentación de tipo de producto. La segmentación real por "tipo de
  ventilador" vive un nivel más abajo, en `product_subcategories` ("Extractores e Inyectores" vs.
  "Ventiladores"). Filtrar por `CatalogCategory` habría producido un filtro inútil (una sola pill,
  oculta por la regla de `categories.length <= 1`).
- **Nota de corrección**: La primera versión de esta decisión (basada en `CatalogCategory.name`)
  se escribió antes de consultar los datos reales, apoyándose solo en las categorías de ejemplo de
  `specs/02_web/03_PRODUCTS_CATALOG.md` ("Extractores Axiales", "Ciclones", "Dampers", etc.), que
  resultaron ser ilustrativas y no coincidir con el esquema real. Se corrigió antes de dar el
  feature por terminado, verificando con `mcp__supabase__execute_sql` contra la BD real — ver
  Principio I (No Inventar) de la constitución: no asumir sin auditar la fuente real cuando está
  disponible.
- **Alternatives considered**: Filtrar por familia/serie — rechazado por ser demasiado granular
  para un visitante que aún no conoce el catálogo técnico (2 subcategorías es el nivel correcto de
  agrupación por ahora, con 8 productos totales).

## Decisión 2: Origen de las categorías del filtro

- **Decision**: Derivar las pills dinámicamente de `Array.from(new Set(items.map(i => i.category)))`
  sobre el listado ya cargado (`items`, que sale de `extractFromCatalog(catalog)` o de
  `FALLBACK_CAPACITIES`), no de una nueva consulta a `product_categories`.
- **Rationale**: `items` ya trae `category: cat.name` (línea `category: cat.name` en
  `extractFromCatalog`) y `FALLBACK_CAPACITIES` ya trae `category` como string libre. Reutilizar
  esto evita una query adicional y garantiza que solo aparezcan categorías con productos visibles
  (no categorías vacías en la BD).
- **Alternatives considered**: Pasar `catalog` completo al filtro y usar `cat.name` de primer nivel
  — más "correcto" jerárquicamente, pero duplicaría lógica ya resuelta en `extractFromCatalog` y
  podría mostrar categorías sin productos extraídos (los primeros 9 vs. el total). Se descarta por
  ahora; documentado como posible mejora futura si se levanta el cap de 9 en la vista "Todos".

## Decisión 3: Manejo del cap de 9 productos

- **Decision**: El cap de 9 solo aplica a la vista "Todos" (comportamiento actual sin cambios).
  Con un filtro de categoría activo, se muestran todos los productos de esa categoría presentes en
  `items` (no en todo `catalog` — ver Decisión 2).
- **Rationale**: Cambiar el layout de la vista "Todos" (grid 3-4 columnas, 9 ítems) no es parte del
  gap W-001; el gap es la ausencia de selector, no el tamaño de la grilla.
- **Alternatives considered**: Quitar el cap globalmente — fuera de alcance, cambiaría el diseño
  visual de la sección sin que se haya pedido.

## Decisión 5: Bug de datos encontrado durante la verificación (fuera del alcance original)

- **Hallazgo**: Al verificar el filtro contra datos reales, cada uno de los 8 productos activos
  tenía una fila duplicada con `deleted_at` seteado (soft-deleted, 2026-07-10) pero **igual código
  y nombre**, y `fetchRawCatalogFromDB()` (en `catalog.ts`) solo filtraba `deleted_at is null` en
  `product_categories` (nivel superior), no en el `products` embebido — por lo que el catálogo
  público mostraba cada producto duplicado.
- **Decision**: Se corrigió en el mismo cambio, no como tarea separada, porque bloqueaba
  directamente la verificación de FR-003/SC-002 de este feature: (1) se agregó `deleted_at` a la
  selección de `products` en `catalog.ts`, (2) se filtró `!prod.deleted_at` antes de mapear a
  `ProductDetail`, (3) se agregó un dedupe defensivo por `prod.id` en `extractFromCatalog` como
  segunda capa de protección (Principio IV — UI Defensiva).
- **Rationale**: Es una violación directa del Principio III (Soft Delete) — datos soft-eliminados
  no deben llegar nunca al usuario final — y el fix es de una línea en la query + un filtro, de
  riesgo mínimo (solo puede ocultar filas ya inválidas, nunca ocultar datos legítimos). La causa
  raíz de POR QUÉ existen esas filas duplicadas (¿doble seed? ¿bug de un flujo de "reemplazar
  producto"?) se dejó como tarea separada — no se investigó ni se tocó la tabla `products` ni las
  filas duplicadas en sí.

## Decisión 4: Testing

- **Decision**: Cobertura ligera — un test unitario de la función pura de filtrado (si se extrae) o
  verificación manual en navegador vía el flujo de verificación del proyecto (dev server +
  interacción). No se agrega Playwright E2E nuevo para este cambio de bajo riesgo.
- **Rationale**: Es un cambio de presentación sin lógica de negocio ni Server Action nueva; el
  Principio VI (Pruebas & Calidad) exige tests para flujos críticos — este no lo es (no toca
  facturación, RLS, ni concurrencia).
