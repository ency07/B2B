# REUSE_ANALYSIS: UI-02 — Layout Base (Sidebar, Header e Integración react-headroom)

**Fecha:** 2026-06-19
**Fase:** UI-02: Layout Base
**Estado:** EVALUADO

Para la implementación del layout base, que incluye el sidebar colapsable, el header inteligente y el área de trabajo adaptable, se auditan los siguientes recursos para decidir si reutilizar componentes o librerías existentes o construir una solución personalizada.

---

## 1. Análisis de Recurso: react-headroom

*   **Licencia**: MIT (Permisiva, compatible con uso comercial).
*   **Mantenimiento**: Estable y maduro.
*   **Estrellas (GitHub)**: ~2,000+ (vía `react-headroom`).
*   **Ventajas**:
    *   Empaqueta de forma limpia la lógica de scroll para ocultar/mostrar elementos de cabecera.
    *   No tiene dependencias pesadas y es extremadamente ligero.
    *   100% compatible con React 19 y Next.js.
*   **Desventajas**:
    *   Requiere deshabilitar el renderizado del lado del servidor para el componente envoltura o forzar `"use client"`.
*   **Compatibilidad**: Total con Tailwind CSS y shadcn.
*   **Vedicto**: **REUTILIZAR**
    *   *Justificación*: Escribir lógica manual de scroll en el eje Y introduce complejidad de listeners en React que pueden degradar el rendimiento del navegador. Se instala `react-headroom`.

---

## 2. Análisis de Recurso: next-themes

*   **Licencia**: MIT (Permisiva, compatible con uso comercial).
*   **Mantenimiento**: Muy activo, estándar del ecosistema Next.js.
*   **Estrellas (GitHub)**: ~7,500+
*   **Ventajas**:
    *   Gestiona el cambio de clase `.dark` en la etiqueta `html`.
    *   Evita el parpadeo visual (Flicker) al cargar la página en modo oscuro mediante Server Side Rendering (SSR).
*   **Desventajas**:
    *   Ninguna relevante para este caso de uso.
*   **Compatibilidad**: Total con Tailwind CSS v4 y Next.js 15/16.
*   **Veredicto**: **REUTILIZAR**
    *   *Justificación*: Es la solución estándar de la industria recomendada por shadcn/ui. Se instala `next-themes`.

---

## 3. Análisis de Recurso: lucide-react

*   **Licencia**: ISC (Permisiva, compatible con uso comercial).
*   **Mantenimiento**: Altamente activo y mantenido.
*   **Estrellas (GitHub)**: ~8,000+
*   **Ventajas**:
    *   Catálogo de iconos completo y visualmente coherente.
    *   Soporta tree-shaking nativo en empaquetadores (bundlers) de Next.js.
*   **Desventajas**:
    *   Ninguna.
*   **Compatibilidad**: Total con el stack.
*   **Veredicto**: **REUTILIZAR**
    *   *Justificación*: Iconografía unificada del ERP. Se instala `lucide-react`.

---

## 4. Análisis de Recurso: framer-motion

*   **Licencia**: MIT (Permisiva, compatible con uso comercial).
*   **Mantenimiento**: Muy activo.
*   **Estrellas (GitHub)**: ~22,000+
*   **Ventajas**:
    *   Estándar de facto para animaciones complejas y transiciones de entrada/salida en React.
*   **Desventajas**:
    *   Aumenta el tamaño del bundle si se abusa de ella.
*   **Compatibilidad**: Total.
*   **Veredicto**: **REUTILIZAR**
    *   *Justificación*: Permite animar de forma premium la colapsabilidad del Sidebar y las transiciones entre páginas. Se instala `framer-motion`.

---

## 5. Decisiones de Adquisición/Reutilización Registradas

| Recurso | Decisión | Uso en UI-02 |
|---|---|---|
| `react-headroom` | REUTILIZAR | Envoltura del Header para ocultación en scroll. |
| `next-themes` | REUTILIZAR | Proveedor de modo Claro/Oscuro en la cabecera. |
| `lucide-react` | REUTILIZAR | Iconos del Sidebar, botones de perfil y colapso. |
| `framer-motion` | REUTILIZAR | Transición suave del ancho del Sidebar y opacidad del contenido. |
