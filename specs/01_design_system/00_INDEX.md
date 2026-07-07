# DESIGN SYSTEM — Índice Maestro

## Supremacía

Este documento es la **fuente única de verdad** para todo el sistema visual del ERP-B2B Premium (AeroMax Industrial).

Cualquier componente, página, modal, tabla o elemento visual debe construirse exclusivamente con los tokens, componentes y patrones definidos aquí.

> **Prohibido improvisar colores, espaciados, radios, sombras, tipografía, iconografía o jerarquías.**

---

## Estructura de archivos

| Archivo | Contenido |
|---|---|
| `01_TOKENS.md` | Color, spacing, radius, shadow, blur, typography, grid, containers, breakpoints, elevation, opacity, border |
| `02_COMPONENTS_CORE.md` | Buttons, inputs, cards, dialogs, tables, badges, tags, alerts |
| `03_COMPONENTS_LAYOUT.md` | Navbar, sidebar, footer, header, breadcrumb |
| `04_COMPONENTS_MARKETING.md` | Hero, product card, case study, solution card, industrial card, portal card |
| `05_COMPONENTS_DASHBOARD.md` | Metric card, dashboard card, charts, timeline, stepper, wizard |
| `06_MOTION.md` | Duraciones, easing, hover, focus, loading, skeleton, empty states, transitions, microinteracciones |
| `07_PATTERNS.md` | Form patterns, data display patterns, navigation patterns, feedback patterns |
| `08_THEME_WHITE_LABEL.md` | White label system, tenant theming, CSS custom properties |

---

## Stack tecnológico autorizado

| Elemento | Tecnología |
|---|---|
| Framework | Next.js 15 (App Router) |
| Estilos | Tailwind CSS v4 |
| Componentes base | Radix UI Primitives + shadcn/ui |
| Animación | Framer Motion |
| Iconos | Lucide React |
| Gráficos | Recharts |
| Header scroll | react-headroom |
| Temas | next-themes |
| Formularios | React Hook Form + Zod |
| Tablas | TanStack Table v8 |

### Prohibido

- HeroUI, Headless UI, Tabler Icons, Nivo, ECharts, Tremor, Chart.js
- CSS-in-JS (styled-components, emotion)
- Bootstrap, Material UI, Chakra UI, Ant Design

---

## Concepto estético: Ingeniería de Precisión

La plataforma transmite **rigurosidad técnica, confiabilidad y robustez industrial**.

**Inspiración**: Siemens, Autodesk, ABB, SAP Fiori.

**Prohibido**: Estéticas gamer/hacker, dashboards de juguete, plantillas SaaS genéricas, plataformas de consumo masivo.

---

## Reglas de construcción

1. **REUTILIZAR > EXTENDER > ADAPTAR > CREAR**
2. Consultar `06_COMPONENT_CATALOG.md` antes de crear cualquier componente nuevo
3. Prohibido crear variantes ad-hoc de componentes existentes
4. Todo componente debe soportar los 9 estados estándar (loading, skeleton, error, empty, success, offline, unauthorized, readonly, disabled)
5. RSC por defecto. `'use client'` solo con interacción real
6. WCAG 2.1 Level AA obligatorio

---

## Protocolo de diseño (8 pasos)

1. Identificar qué se construye
2. Ejecutar UI UX Pro Max
3. Mostrar resultado completo
4. Analizar resultado
5. Comparar contra Blueprint (este documento)
6. Si conflicto: **GANA EL BLUEPRINT**
7. Generar mini documento `DECISIÓN DE DISEÑO`
8. Escribir código

---

## Enterprise Visual Quality Gate (EVQG)

Toda pantalla debe obtener **9/10 o superior** en: Jerarquía Visual, Calidad Percibida, Profundidad, Tipografía, Hero, Tarjetas, Botones, Conversión.

Si cualquiera obtiene menos de 9: **el diseño NO está terminado.**
