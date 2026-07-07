# Guía de Dependencias — ERP B2B Premium

## Propósito

Documentar la justificación de cada dependencia del proyecto, su estado de madurez
y las alternativas consideradas. Esto facilita el mantenimiento y la toma de decisiones
futuras.

## Dependencias de Producción

| Dependencia | Versión | Por qué esta | Alternativas consideradas |
|---|---|---|---|
| `next` | 16.2.9 | Framework principal (App Router, Server Actions, RSC). Es la plataforma del proyecto. | — |
| `react` / `react-dom` | 19.2.4 | UI runtime. Version 19 por las nuevas APIs de Server Components. | — |
| `zod` | 4.4.3 | Validación de esquemas en TypeScript. Inferencia de tipos automática. **⚠ No estable** — usar con cautela, monitorear breaking changes. | `yup`, `io-ts`, `valibot` |
| `@supabase/supabase-js` | 2.108.2 | Cliente Supabase para auth, DB, storage en cliente y servidor. | — |
| `@hookform/resolvers` | 5.4.0 | Bridge entre react-hook-form y Zod para validación de formularios. | — |
| `react-hook-form` | 7.79.0 | Manejo de formularios con rendimiento optimizado (uncontrolled). | `formik`, `final-form` |
| `framer-motion` | 12.40.0 | Animaciones declarativas, gesture handling, layout animations. | `gsap`, `react-spring`, `motion` (antes Framer Motion) |
| `lucide-react` | 1.21.0 | Iconos SVG tree-shakeables, consistentes y ligeros. | `phosphor-icons`, `heroicons` |
| `recharts` | 3.8.1 | Gráficos declarativos para React (dashboard y analytics). | `nivo`, `visx`, `chart.js` |
| `sonner` | 2.0.7 | Toast notifications ligeras con soporte para Server Actions. | `react-hot-toast`, `react-toastify` |
| `@radix-ui/*` | varios | Primitivas UI accesibles, headless, unstyled. | `@reach-ui`, `react-aria` |
| `@tanstack/react-table` | 8.21.3 | Tablas con sort, filter, paginación, col virtual. Headless. | `ag-grid`, `react-data-grid` |
| `class-variance-authority` | 0.7.1 | Variantes de componentes tipadas (cva). | `tailwind-variants` |
| `clsx` | 2.1.1 | Concatenación condicional de clases. | `classnames` |
| `tailwind-merge` | 3.6.0 | Merge inteligente de clases Tailwind evitando conflictos. | — |
| `next-themes` | 0.4.6 | Soporte de tema claro/oscuro con Next.js App Router. | — |
| `react-headroom` | 3.2.1 | Header que se oculta al hacer scroll (landing). | — |
| `jspdf` | 4.2.1 | Generación de PDF (reportes, diagnósticos). | `pdfmake`, `react-pdf` |
| `dotenv` | 16.6.1 | Carga de variables de entorno en scripts Node.js. | — |

## Dependencias de Desarrollo

| Dependencia | Versión | Por qué esta | Alternativas |
|---|---|---|---|
| `typescript` | 5.9.3 | Type checking estricto. | — |
| `tailwindcss` | 4.3.1 | CSS utility-first. **v4 sin tailwind.config.js** — personalización vía CSS. | — |
| `@tailwindcss/postcss` | 4.3.1 | Plugin PostCSS para Tailwind v4. **⚠ Plugin alpha** — cambios frecuentes. | — |
| `eslint` | 9.39.4 | Linter, configuración plana (flat config). | — |
| `eslint-config-next` | 16.2.9 | Config ESLint oficial de Next.js. | — |
| `pg` | 8.22.0 | Cliente PostgreSQL nativo para scripts de migración y seed. | — |
| `@types/*` | varios | Tipados para TypeScript. | — |
| `ts-node` | 10.9.2 | Ejecución directa de TypeScript en scripts. | `tsx` |

## Estado de madurez

| Dependencia | Estado | Riesgo |
|---|---|---|
| `zod@4.x` | **Inestable** (v4 no es release estable) | Breaking changes frecuentes. Monitorear releases. |
| `@tailwindcss/postcss@4.x` | **Alpha/experimental** | API del plugin puede cambiar sin aviso. |
| `tailwindcss@4.x` | Estable (v4 lanzada) | Bajo. |
| `framer-motion@12.x` | Estable (renombrado a `motion`) | Bajo. |
| `next@16.x` | Estable (Canary) | Bajo si se mantiene actualizado. |
| `react@19.x` | Estable | Bajo. |
| `recharts@3.x` | Estable | Bajo. |

## Política de actualización

1. **Dependencias inestables** (`zod`, `@tailwindcss/postcss`): revisar manualmente cada
   release antes de actualizar. Preferir mantener versión exacta.
2. **Dependencias estables**: actualizar con `npm update` dentro del minor actual.
3. **Seguridad**: ejecutar `npm run audit:security` antes de cada commit.
4. **Dependabot**: configurado para abrir PRs de seguridad automáticas.
