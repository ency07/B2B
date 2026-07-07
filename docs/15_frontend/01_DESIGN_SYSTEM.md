# 01_DESIGN_SYSTEM: Sistema de Diseño y Tokens Visuales

> [!NOTE]
> Este documento centraliza los tokens visuales y directivas de diseño para garantizar una experiencia visualmente premium en el ERP-B2B. Se integra con la configuración nativa de Tailwind CSS v4.

## 1. Tipografía y Escala
*   **Fuentes oficiales**:
    *   `font-sans`: **Inter** (para textos de lectura, tablas, formularios e interfaz general).
    *   `font-display`: **Outfit** (para headers principales, KPIs, títulos de secciones y marca).
*   **Escala de tamaños**:
    *   `text-xs`: 0.75rem (12px) - Reservado para etiquetas secundarias, metadatos y mini-tablas.
    *   `text-sm`: 0.875rem (14px) - Tamaño de texto base, contenido de tablas y campos de formularios.
    *   `text-base`: 1.0rem (16px) - Párrafos y botones destacados.
    *   `text-lg`: 1.125rem (18px) - Títulos de cards o modales secundarios.
    *   `text-xl` a `text-3xl`: Títulos de sección y tarjetas de métricas.
    *   `text-4xl`+: Reservado para KPIs principales de dashboards y títulos de landing.

---

## 2. Espaciados y Rejilla
*   **Grid del Sistema**: Rejilla base de `4px` (`rem` equivalentes).
*   **Contenedor Principal**: Máximo `max-w-7xl` con padding lateral responsivo (`px-4 sm:px-6 lg:px-8`).
*   **Espacios Estándar**:
    *   Entre controles de formulario: `space-y-4` o `gap-4`.
    *   Entre secciones principales: `space-y-8` o `gap-8`.
    *   Padding interno de tarjetas: `p-6` para desktop, `p-4` para móvil.

---

## 3. Bordes y Sombras (Radius & Elevation)
*   **Bordes (Radius)**:
    *   Botones e Inputs: `rounded-lg` (8px).
    *   Tarjetas, Contenedores y Modales: `rounded-xl` (12px).
    *   Imágenes y elementos grandes: `rounded-2xl` (16px).
*   **Sombras (Shadows)**:
    *   Cards base: `shadow-sm` para evitar ruido visual en grids complejas.
    *   Modales y Menús Desplegables: `shadow-lg` o `shadow-xl` para sensación de elevación en el eje Z.

---

## 4. Breakpoints y Adaptabilidad Responsiva
*   **Móvil**: `< 640px` (clases por defecto). Ocultar paneles secundarios, usar layouts verticales de 1 columna.
*   **Tablet**: `>= 640px` (`sm:`). El Sidebar colapsa a iconos; formularios cambian a 2 columnas.
*   **Desktop**: `>= 1024px` (`lg:`). Sidebar visible por defecto; layouts en grid multi-columna.
*   **Ultra-wide**: `>= 1280px` (`xl:`). Contenedor centrado para evitar estiramientos desproporcionados de tablas.

---

## 5. Directivas de Gráficos (Recharts) e Iconos (Lucide)
*   **Gráficos**:
    *   Deben usar el color semántico de marca (`var(--color-primary)`) para datos principales.
    *   Paletas secuenciales legibles y de alto contraste (para usuarios con daltonismo).
    *   Dimensiones estables con aspect ratio controlado (`aspect-[4/3]` o `aspect-[16/9]`).
*   **Iconos**:
    *   Tamaño predeterminado para controles e inputs: `w-4 h-4` (16px).
    *   Tamaño predeterminado para menús y navegación principal: `w-5 h-5` (20px).
    *   Siempre aplicar `shrink-0` para evitar deformaciones en flex layouts.

---

## 6. Guía de Animación (Framer Motion)

> [!TIP]
> **POLÍTICA DE ANIMACIÓN (20 LÍNEAS):**
> 1. Las animaciones deben ser sutiles, informativas y rápidas (duración máxima `0.2s` o `200ms`).
> 2. Prohibido usar rebotes bruscos u oscilaciones excesivas que distraigan o fatiguen al usuario en su jornada de trabajo diaria.
> 3. Transición de páginas: Desvanecimiento suave en opacidad (`opacity: [0, 1]`) con traslación vertical ligera (`y: [10, 0]`).
> 4. Micro-interacciones de botones/tarjetas: Escala ligera (`whileHover={{ scale: 1.01 }}`) y opacidad activa (`whileTap={{ scale: 0.98 }}`).
> 5. Desplegables y menús: Efecto acordeón vertical (`height: [0, "auto"]`, `opacity: [0, 1]`) usando transiciones tipo `easeOut` o curvas bezier lineales.
> 6. Skeletons: Animación infinita de pulso de opacidad (`animate={{ opacity: [0.4, 0.8, 0.4] }}`) con duración de `1.5s`.
> 7. La propiedad CSS `will-change` debe aplicarse únicamente a elementos animados complejos para optimizar la GPU del navegador.
