# 02_COMPONENT_ARCHITECTURE: Arquitectura y Estructura de Componentes

> [!NOTE]
> Define el estándar técnico de arquitectura de archivos, modularidad y ciclo de vida de los componentes del frontend en Next.js.

## 1. Estructura de Carpetas

La carpeta raíz del proyecto utiliza la siguiente distribución modular para componentes:

```
/src
  /components
    /ui             ← Componentes base de shadcn/ui (atómicos, reutilizables e inmutables)
    /shared         ← Componentes compartidos del ERP (Headers, Layouts, Widgets)
    /forms          ← Componentes específicos de formularios y campos compuestos
    /features       ← Componentes lógicos agrupados por dominio de negocio (ej. /invoices)
```

---

## 2. Server Components vs. Client Components

Para optimizar el rendimiento y el SEO del ERP, seguimos una arquitectura híbrida estricta:

*   **Server Components (Default)**:
    *   Toda página y layout en Next.js es un Server Component por defecto.
    *   Utilizado para maquetar la estructura de la página, consultar bases de datos directas o APIs de Supabase.
    *   **Prohibido**: Añadir hooks de estado (`useState`, `useEffect`) o eventos (`onClick`).
*   **Client Components (`"use client"`)**:
    *   Declarados únicamente cuando hay interactividad (formularios, modals, animaciones de Framer Motion, pestañas dinámicas).
    *   Se deben mover a hojas de árbol lo más bajas posibles para evitar contaminar Server Components padres con el renderizado de cliente.

---

## 3. Estados Estándar de Componentes

Para garantizar la consistencia en la carga y retroalimentación al usuario, todo componente interactivo o página debe soportar y maquetar los siguientes estados:

1.  **Loading**: Indicadores de carga discretos (spinners circulares) o deshabilitación de botones para evitar dobles clics.
2.  **Skeleton**: Marcadores de posición grises animados en pulsación para la carga inicial de datos estructurados (ej. tablas o paneles de dashboard).
3.  **Error**: Mensajes visuales con contenedor rojo claro (`bg-red-50 text-red-700`) indicando el error y ofreciendo un botón de reintento.
4.  **Empty**: Vistas ilustrativas limpias que aparecen cuando un filtro o búsqueda devuelve cero resultados (debe incluir un icono gris discreto y texto descriptivo).
5.  **Success**: Retroalimentación de éxito efímera (check verde) tras completar una acción de guardado o validación.
6.  **Offline**: Banner superior no intrusivo indicando pérdida de conexión a internet.
7.  **Unauthorized**: Pantallas de bloqueo o redirección en caso de que la sesión del usuario no cuente con permisos RLS.
8.  **ReadOnly**: Deshabilitación visual y de interactividad para usuarios con rol de lectura.
9.  **Disabled**: Estilos visuales consistentes (`opacity-50 pointer-events-none`) para controles inactivos.

---

## 4. Estándar para Diálogos, Modales y Popovers

*   **Dialogs (Modals)**: Reservados para acciones críticas de confirmación o edición rápida que requieren atención inmediata del usuario. Deben estar centrados en pantalla y poseer un fondo traslúcido oscuro (`backdrop-blur-sm bg-black/50`).
*   **Sheets / Drawers**: Menús laterales deslizantes de derecha a izquierda. Reservados para la creación o edición detallada de entidades (ej. agregar un cliente, editar una factura), manteniendo visible el contexto de la página principal.
*   **Popovers & Tooltips**:
    *   *Popover*: Para menús dinámicos o selectores complejos que aparecen junto al botón disparador.
    *   *Tooltip*: Para explicar metadatos o acciones iconográficas únicamente en estado `:hover` (tiempo de respuesta inmediato sin interacción).
