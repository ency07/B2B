# REUSE_ANALYSIS: UI-05 — Componentes Base (Button, Badge, Avatar, Skeleton, Spinner)

**Fecha:** 2026-06-19
**Fase:** UI-05: Componentes Base
**Estado:** EVALUADO

Para el desarrollo del catálogo de componentes base (UI-05), se evalúan las estrategias de implementación y dependencias para Button, Badge, Avatar, Skeleton y Spinner:

---

## 1. Análisis de Recurso: class-variance-authority (CVA)

*   **Licencia**: Apache 2.0
*   **Mantenimiento**: Muy activo.
*   **Estrellas (GitHub)**: ~7,000+
*   **Ventajas**:
    *   Permite construir variantes declarativas de clases CSS (ej. variantes de botones, tamaños y estados) de forma limpia y tipada en TypeScript.
    *   Es el motor utilizado por shadcn/ui para definir variants.
*   **Desventajas**:
    *   Ninguna relevante.
*   **Veredicto**: **REUTILIZAR**
    *   *Justificación*: Permite definir variantes consistentes (`default`, `secondary`, `destructive`, `outline`, `ghost`, `link`) sin código condicional desorganizado.

---

## 2. Análisis de Recurso: Radix UI Avatar (`@radix-ui/react-avatar`)

*   **Licencia**: MIT
*   **Mantenimiento**: Muy activo.
*   **Estrellas (GitHub)**: ~15,000+ (Radix Primitives)
*   **Ventajas**:
    *   Provee cargador asíncrono con control de fallos y fallback automático de iniciales para avatares de forma accesible.
*   **Desventajas**:
    *   Ninguna.
*   **Veredicto**: **REUTILIZAR**
    *   *Justificación*: Asegura comportamiento accesible para el perfil de usuario.

---

## 3. Decisiones de Adquisición/Reutilización Registradas

| Recurso | Decisión | Uso en UI-05 |
|---|---|---|
| `class-variance-authority` | REUTILIZAR | Gestión de variantes tipadas para Button y Badge. |
| `@radix-ui/react-avatar` | REUTILIZAR | Base interactiva y accesible para Avatar. |
