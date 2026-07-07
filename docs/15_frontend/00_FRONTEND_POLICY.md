# 00_FRONTEND_POLICY: Políticas de Desarrollo Frontend y Reutilización

> [!IMPORTANT]
> **POLÍTICA SUPREMA:** Queda prohibida la duplicación de código de interfaz y la instalación de dependencias no autorizadas en el `package.json`. Toda implementación visual debe ceñirse estrictamente al catálogo aprobado y a este documento de gobernanza.

## 1. Stack Tecnológico Oficial y Exclusivo

Cualquier adición al frontend del ERP debe realizarse únicamente con el siguiente conjunto de herramientas:
*   **Framework**: React 19 / Next.js 15 (App Router).
*   **Estilado**: Tailwind CSS v4.
*   **Componentes interactivos base**: Primitivos de **Radix UI** y componentes atómicos de **shadcn/ui**.
*   **Animación**: **Framer Motion** únicamente.
*   **Iconografía**: **Lucide Icons** únicamente.
*   **Visualización de datos (Gráficos)**: **Recharts** únicamente.
*   **Header Scroll Widget**: `react-headroom` (`headroom.js`).

---

## 2. Librerías Prohibidas (Baneadas)
Para evitar fragmentación visual, peso de bundle excesivo o colisiones de estilos, se prohíbe el uso de:
*   **HeroUI** (anteriormente NextUI) y **Headless UI**: Su funcionalidad interactiva y accesibilidad ya están cubiertas de forma óptima por Radix y shadcn.
*   **Tabler Icons** u otras fuentes de iconos: Todo icono debe provenir de Lucide para consistencia.
*   **Nivo, ECharts, Tremor o Chart.js**: Toda gráfica analítica debe crearse exclusivamente con Recharts.

---

## 3. Directivas de Adaptación Local (Magic UI & Aceternity UI)
*   **Prohibida la instalación por npm**: No se permite agregar `@magic-ui/` o `@aceternity-ui/` a `package.json`.
*   **Copia local selectiva**: Solo se permite copiar y adaptar el código fuente de los componentes necesarios e insertarlos directamente dentro de la carpeta `/components/` del proyecto.
*   **Auditoría de código copiado**: El código copiado localmente debe ser refactorizado para integrarse con las variables CSS del sistema de diseño y las convenciones de TypeScript del proyecto.

---

## 4. Política Anti-Duplicidad de Componentes
*   Antes de crear cualquier componente visual, el desarrollador (o la IA) tiene la obligación de consultar el catálogo oficial en [06_COMPONENT_CATALOG.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/15_frontend/06_COMPONENT_CATALOG.md).
*   Si existe un componente similar o extensible, debe reutilizarse mediante props/variantes.
*   Queda estrictamente prohibido crear variantes ad-hoc (por ejemplo: `MainButton.tsx`, `BlueButton.tsx`, `PrimaryButton.tsx`). Todo botón debe ser una instancia de `Button.tsx` (shadcn) parametrizada mediante variants o Tailwind CSS.

---

## 5. Calidad de Código y Estructura
*   **Linter y Formatter**: Es obligatorio pasar ESLint y formatear con Prettier antes de confirmar cambios.
*   **Server vs Client Components**: Separar de forma estricta la lógica interactiva del lado del cliente (`"use client"`) de la maquetación estática de servidor para optimizar tiempos de carga.
