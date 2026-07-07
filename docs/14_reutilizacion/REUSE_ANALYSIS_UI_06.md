# REUSE_ANALYSIS: UI-06 — Formularios (Input, Textarea, Checkbox, Select, Label)

**Fecha:** 2026-06-19
**Fase:** UI-06: Formularios
**Estado:** EVALUADO

Para la implementación de los controles de formularios y sus validaciones (UI-06), se evalúan las estrategias de adquisición y reutilización para Input, Textarea, Checkbox, Select y Label:

---

## 1. Análisis de Recurso: Radix UI Checkbox (`@radix-ui/react-checkbox`)

*   **Licencia**: MIT
*   **Mantenimiento**: Muy activo.
*   **Estrellas (GitHub)**: ~15,000+ (Radix Primitives)
*   **Ventajas**:
    *   Provee el control interactivo de Checkbox con soporte nativo de accesibilidad (WAI-ARIA), navegación por teclado y estado indeterminado.
*   **Desventajas**:
    *   Requiere estilización personalizada mediante Tailwind.
*   **Veredicto**: **REUTILIZAR**
    *   *Justificación*: Permite implementar selectores de casilla estables y accesibles integrados con shadcn/ui.

---

## 2. Análisis de Recurso: Radix UI Select (`@radix-ui/react-select`)

*   **Licencia**: MIT
*   **Mantenimiento**: Muy activo.
*   **Ventajas**:
    *   Gestión avanzada de menús desplegables (dropdowns) de selección con posicionamiento automático, soporte para scroll interno, accesibilidad de lectura por voz y navegación por teclado.
*   **Desventajas**:
    *   Complejo de estilizar desde cero, pero shadcn/ui ya provee los estilos listos sobre este primitivo.
*   **Veredicto**: **REUTILIZAR**
    *   *Justificación*: Garantiza que las listas de selección del ERP se comporten de forma robusta y accesible en dispositivos móviles y de escritorio.

---

## 3. Análisis de Recurso: Radix UI Label (`@radix-ui/react-label`)

*   **Licencia**: MIT
*   **Mantenimiento**: Muy activo.
*   **Ventajas**:
    *   Extiende el elemento `<label>` HTML estándar para asociarse de manera accesible a los controles Radix y prevenir selecciones de texto accidentales.
*   **Desventajas**:
    *   Ninguna.
*   **Veredicto**: **REUTILIZAR**
    *   *Justificación*: Es un requisito esencial de accesibilidad para asociar etiquetas con inputs.

---

## 4. Decisiones de Adquisición/Reutilización Registradas

| Recurso | Decisión | Uso en UI-06 |
|---|---|---|
| `@radix-ui/react-checkbox` | REUTILIZAR | Casillas de selección accesibles. |
| `@radix-ui/react-select` | REUTILIZAR | Menús desplegables de opción única. |
| `@radix-ui/react-label` | REUTILIZAR | Etiquetas accesibles vinculadas a los controles. |
