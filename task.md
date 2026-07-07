# Lista de Tareas - Rediseño de Web Pública y Wizard

## 1. Infraestructura de Base de Datos y Motores (Completado)
- [x] Migraciones de base de datos (`20260617000035_industrial_cms.sql` y `20260619000036_fix_leads_schema.sql` aplicadas)
- [x] Estructura jerárquica de catálogo de productos semilla (8 productos insertados en Supabase)
- [x] Motor de ingeniería (`src/utils/engineering.ts` integrado)
- [x] Motor de precios y estimación comercial (`src/utils/pricing.ts` integrado)
- [x] Server Actions modularizados (`catalog.ts`, `wizard.ts`, `leads.ts` integrados)

## 2. Fase A: Rediseño Visual Integral (UI/UX Refactor - En progreso)
- [x] **Landing Page pública**: Reorganizar `src/app/page.tsx`, integrar `ProcessesMapSVG` y `LandingCfmCalculator`
- [x] **Catálogo Técnico & Fichas**: Refactorizar `CatalogView.tsx` para usar lateral `Sheet`, inyectar curva SVG y especificaciones monoespaciadas
- [x] **Asistente Wizard**: Rediseñar `WizardStepper.tsx` a layout 60/40 con HUD de ingeniería y sliders reactivos
- [x] **Sidebar & Header (Consola Global)**
- [x] Refactorizar `dashboard-sidebar.tsx` para usar fondos translúcidos, bordes finos de 1px y textos compactos.
- [x] Refactorizar `dashboard-header.tsx` para incorporar breadcrumbs limpios e indicador de conexión `// DB_CONNECTED` con dot verde.
- [x] **Dashboard del ERP**: Reconstruir `dashboard/page.tsx` con barra SLA, composición asimétrica 70/30 y feed en tiempo real
- [x] **CRM / Leads Pipeline**: Modificar `leads/page.tsx` para usar lateral `Sheet` con timeline vertical de auditoría

## 3. Compilación y Cierre (Completado)
- [x] Ejecutar verificaciones TypeScript (`npx tsc --noEmit`)
- [x] Validar compilación Next.js para producción (`npm run build`)
- [x] Generar walkthrough final y reporte de cierre `walkthrough.md`
