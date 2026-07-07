# REUSE_ANALYSIS: UI-07 — Tablas (TanStack Table)

**Fecha:** 2026-06-19
**Fase:** UI-07: Tablas
**Estado:** EVALUADO

Para el diseño e interactividad de las tablas del ERP (UI-07), se evalúan las estrategias de adquisición y reutilización para la gestión del estado tabular:

---

## 1. Análisis de Recurso: TanStack Table (`@tanstack/react-table`)

*   **Licencia**: MIT
*   **Mantenimiento**: Extremadamente activo (de TanStack).
*   **Estrellas (GitHub)**: ~24,000+
*   **Ventajas**:
    *   Arquitectura "Headless" (sin estilos forzados), lo que permite acoplarse 100% a las variables y clases de Tailwind CSS del ERP.
    *   Gestión integrada de ordenamiento (sorting), filtrado global y por columna, paginación, selección de filas (row selection) y visibilidad de columnas.
    *   Excelente rendimiento en renderizado de grandes conjuntos de datos.
*   **Desventajas**:
    *   Requiere implementar localmente el marcado HTML (`table`, `tr`, `td`, etc.) y sus correspondientes clases Tailwind, pero shadcn/ui provee los estilos óptimos.
*   **Veredicto**: **REUTILIZAR**
    *   *Justificación*: Evita reinventar la compleja lógica de paginación, ordenación y selección del ERP, permitiendo construir tablas robustas rápidamente.

---

## 2. Decisiones de Adquisición/Reutilización Registradas

| Recurso | Decisión | Uso en UI-07 |
|---|---|---|
| `@tanstack/react-table` | REUTILIZAR | Gestión del estado, ordenación, filtrado y paginación de tablas de datos. |
