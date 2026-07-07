# 05_ACCESSIBILITY: Directivas de Accesibilidad (A11y)

> [!NOTE]
> Define los requerimientos para asegurar que el ERP sea plenamente utilizable por personas con capacidades diversas, cumpliendo con los estándares de la industria.

## 1. Estándar de Conformidad
El ERP-B2B debe cumplir rigurosamente con las pautas **WCAG 2.1 nivel AA**. Esto implica altos niveles de contraste, adaptabilidad a lectores de pantalla y control total a través de periféricos alternativos.

---

## 2. Navegación por Teclado

Todo elemento interactivo debe poder ser operado mediante teclado estándar:

*   **Enlace de Salto Rápido ("Skip to Content")**: Presente al inicio de la página para permitir a los usuarios de teclado omitir la barra de navegación lateral y superior e ir directamente al área de trabajo.
*   **Focus Traps**: En modales, diálogos y menús deslizantes (Drawers), el foco debe quedar "atrapado" de forma segura dentro del diálogo abierto y no poder salir al fondo mediante tabulaciones hasta que se cierre (resuelto nativamente usando los primitivos de Radix UI).
*   **Teclas Estándar**:
    *   `Tab` / `Shift + Tab`: Navegar entre controles interactivos en orden secuencial lógico.
    *   `Enter` / `Space`: Activar botones, enlaces y seleccionar checkboxes/radios.
    *   `Escape`: Cerrar diálogos, popovers, menús desplegables o tooltips abiertos.

---

## 3. Estados de Foco Visibles (Focus States)
*   **Prohibido**: Ocultar el foco de los elementos (`outline: none` o `focus:outline-none`) sin proveer un estilo visual alternativo de igual o mayor contraste.
*   **Estilo Estándar**:
    *   Todo input o control debe usar `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.
    *   El anillo del foco debe tener un contraste de al menos `3:1` contra el fondo circundante.

---

## 4. Estructura Semántica HTML5
Para facilitar la lectura y el indexado de tecnologías de asistencia, se debe estructurar el marcado con etiquetas semánticas claras:
*   `<main id="main-content">`: Contenedor principal de la vista actual.
*   `<nav>`: Para menús de navegación principal (Sidebar) y secundario.
*   `<header>`: Para el panel superior inteligente de la aplicación.
*   `<section>` y `<article>`: Para modular y agrupar bloques lógicos dentro de las páginas.
*   `<h1>` a `<h6>`: Jerarquía coherente de encabezados. Solo debe existir **un único `<h1>` por página** correspondiente al título principal.

---

## 5. Etiquetas ARIA y Descriptores
*   **Iconografía interactiva**: Todo botón que contenga únicamente un icono (ej. botón de cierre `X` en un modal, botón de refresco) debe incluir el atributo `aria-label` o `aria-labelledby` con texto descriptivo descriptivo en español (ej. `aria-label="Cerrar modal"`).
*   **Dynamic Announcements**: Se deben utilizar regiones de anuncio (`aria-live="polite"` o `aria-live="assertive"`) para notificar cambios de estado dinámicos en la UI, como alertas, cargas en progreso o cambios en tablas de búsqueda que no recarguen la página por completo.
