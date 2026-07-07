# REUSE_ANALYSIS: UI-04 — Dashboard (Gráficos Interactivos con Recharts)

**Fecha:** 2026-06-19
**Fase:** UI-04: Dashboard
**Estado:** EVALUADO

Para la implementación de las vistas de analítica y visualización de datos en el Dashboard principal, se audita el recurso Recharts para validar su adecuación al proyecto.

---

## 1. Análisis de Recurso: Recharts

*   **Licencia**: MIT
*   **Mantenimiento**: Muy activo.
*   **Estrellas (GitHub)**: ~22,000+
*   **Ventajas**:
    *   Biblioteca declarativa nativa de React para dibujar componentes SVG.
    *   Muy fácil de parametrizar con clases Tailwind y variables CSS para alineación con temas claros/oscuros.
    *   Ya fue pre-aprobada en la gobernanza frontend.
*   **Desventajas**:
    *   Tiene dependencias de D3 de tamaño considerable, pero es el estándar óptimo de fiabilidad.
    *   Requiere `"use client"` para renderizado de cliente.
*   **Veredicto**: **REUTILIZAR**
    *   *Justificación*: Cumple con el requerimiento de visualización interactiva y es el único proveedor de gráficos aprobado en el proyecto.

---

## 2. Decisiones de Adquisición/Reutilización Registradas

| Recurso | Decisión | Uso en UI-04 |
|---|---|---|
| `recharts` | REUTILIZAR | Gráficos de barra, línea y áreas en los widgets de análisis. |
