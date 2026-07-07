# INSTRUCCIÓN OBLIGATORIA: SIEMPRE RESPONDE EN ESPAÑOL
Todas tus respuestas deben ser en español, sin excepciones. Si el usuario escribe en inglés, responde en español.

# AGENTS.md

Core modular B2B ERP with RLS multi-tenancy — **Web Public Site** (marketing, lead generation, wizard)

## Scope

This file covers the public-facing website (`src/web/`), not the authenticated ERP dashboard (`src/app/(dashboard)/`).

## Setup commands

- Install deps: `npm install`
- Start dev:    `npm run dev`
- Build:        `npm run build`
- Test web:     `npm run test:website`
- Test wizard:  `npm run test:wizard`
- Lint:         `npm run lint`

## Environment setup (dev / staging / production)

Next.js carga archivos `.env.*` automáticamente según el modo de ejecución.
El proyecto sigue esta convención:

| Archivo              | Propósito          | Cargado por                       |
|----------------------|--------------------|-----------------------------------|
| `.env.local`         | Desarrollo local   | `next dev` (ignorado por git)     |
| `.env.staging`       | Staging            | Manual (ver abajo)                |
| `.env.production`    | Producción         | `next start` / `next build`       |
| `.env.test`          | Tests / CI         | `NODE_ENV=test`                   |

### Comandos por entorno

```bash
# Desarrollo local (usa .env.local automáticamente)
npm run dev

# Staging — cargar .env.staging manualmente
npx dotenv -e .env.staging -- next dev

# Producción
npm run build
npm start
```

### Script de setup rápido

```bash
npx ts-node scripts/setup-env.ts dev        # Copia .env.local
npx ts-node scripts/setup-env.ts staging    # Copia .env.staging → .env.local
npx ts-node scripts/setup-env.ts production # Copia .env.production → .env.local
```

### Supabase multi-entorno

Cada entorno debe apuntar a un proyecto Supabase diferente:

```env
# .env.local (desarrollo — Supabase local o cloud dev)
NEXT_PUBLIC_SUPABASE_URL=https://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...local-key

# .env.staging
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...staging-key

# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...prod-key
```

### Migraciones

Todas las migraciones se ejecutan contra el entorno configurado:

```bash
npx ts-node scripts/deploy-migrations.ts
```

Antes de deployar, verifica que `.env.local` apunte al entorno correcto.

## Requisitos de hardware

### Desarrollo local

| Recurso       | Mínimo       | Recomendado   |
|---------------|-------------|---------------|
| RAM           | 8 GB        | 16 GB         |
| CPU           | 4 núcleos   | 8 núcleos     |
| Almacenamiento| 10 GB libres| 20 GB SSD     |
| SO            | macOS / Linux / Windows (WSL2) | |
| Node.js       | 20.x        | 22.x          |

### Producción (servidor / VPS)

| Recurso       | Mínimo (bajo tráfico) | Recomendado (medio tráfico) |
|---------------|----------------------|----------------------------|
| RAM           | 2 GB                 | 4 GB                       |
| CPU           | 2 núcleos            | 4 núcleos                  |
| Almacenamiento| 20 GB SSD            | 40 GB SSD                  |
| Node.js       | 20.x LTS             | 22.x LTS                   |

Notas:
- El cuello de botella principal es Supabase (Postgres + storage), no el frontend.
- Para alto tráfico (>10k req/min), usar Vercel Pro o escalado horizontal con contenedores.
- Las imágenes se sirven optimizadas por Next.js; para almacenamiento adicional, usar Supabase Storage o S3.

## Project layout (web module)

- `src/web/actions/`   — Server Actions (wizard, leads, catalog, branding)
- `src/web/components/` — React components (marketing, wizard, shared)
- `src/app/page.tsx`   — Root landing page
- `src/app/wizard/`    — Wizard multi-step form page
- `src/app/portal/`    — Public portal page
- `src/app/(landing)/`  — Marketing landing routes

## Dependencias

El proyecto usa versiones **exactas** (pinned) para todas las dependencias, sin rangos `^`.
Consulta `docs/15_frontend/DEPENDENCY_GUIDE.md` para la justificación de cada una.

### Auditoría de seguridad

```bash
npm run audit:security   # npm audit con nivel high+
npm run audit:outdated   # Lista paquetes desactualizados
npm run deps:pin         # Fija versiones según package-lock.json
```

Dependabot está configurado en `.github/dependabot.yml` para PRs automáticos de seguridad.

### Dependencias inestables

| Paquete | Versión | Riesgo |
|---------|---------|--------|
| `zod` | 4.4.3 | v4 no es release estable. Monitorear breaking changes. |
| `@tailwindcss/postcss` | 4.3.1 | Plugin alpha para Tailwind v4. |

## Code style

- React 19 + Next.js 16 (App Router)
- Tailwind CSS v4 with `@tailwindcss/postcss`
- TypeScript strict mode (`tsconfig.json: strict: true`)
- Server Actions (`"use server"`) for form submissions
- Component variants via `class-variance-authority`
- Icons: `lucide-react` | Motion: `framer-motion` | Charts: `recharts`
- Sonner for toast notifications

## Testing instructions

- Unit tests (vitest): `npm run test:unit` or `npx vitest run`
- Watch mode:   `npx vitest`
- Coverage:     `npx vitest run --coverage`
- Legacy SQL validation scripts: `npm run test:website`, `npm run test:wizard` (serán migrados a vitest progresivamente)
- All tests must pass before opening a PR

## Pre-commit quality gates

1. `npx tsc --noEmit` — Sin errores de tipo
2. `npm run lint` — Sin errores de lint (nuevos)
3. `npx vitest run` — Tests unitarios pasan
4. `npm audit --audit-level=high` — Sin vulnerabilidades high+

## CI/CD (GitHub Actions)

El workflow en `.github/workflows/ci.yml` ejecuta en cada push/PR:
- `tsc --noEmit`, `lint`, `vitest run`, `npm audit`

Para deploy, ejecutar manualmente:
```bash
npm run build
npm start
```

## Cómo añadir una nueva funcionalidad

### 1. Nueva página (ruta)
1. Crear archivo en `src/app/` (App Router)
2. Si pertenece al web público, usa `src/app/(landing)/*`
3. Si pertenece al dashboard, usa `src/app/(dashboard)/dashboard/*`
4. El layout se hereda automáticamente del segmento de ruta

### 2. Nueva Server Action
1. Crear archivo en `src/web/actions/` (web) o `src/erp/actions/` (ERP)
2. Marcar con `"use server"`
3. Validar entrada con Zod (ver `src/lib/validations/`)
4. Sanitizar salida con `sanitizeObject` (`src/lib/utils/sanitize.ts`)
5. Usar logger estructurado (`src/lib/utils/logger.ts`) en vez de `console.*`
6. Registrar en las migraciones de Supabase si la acción requiere nuevas tablas

### 3. Nueva tabla en Supabase
1. Crear migración en `supabase/migrations/YYYYMMDDHHMMSS_descripcion.sql`
2. Incluir: `CREATE TABLE`, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, políticas RLS, triggers de trazabilidad
3. Ejecutar: `npx ts-node scripts/deploy-migrations.ts`

### 4. Nuevo test
1. Tests unitarios: `src/tests/unit/*.test.ts`
2. Tests de integración: `src/tests/integration/*.test.ts`
3. Tests E2E (futuro): `src/tests/e2e/*.test.ts`
4. Usar `describe`/`it`/`expect` de vitest

## Plan de rollback

### Rollback de código
```bash
git revert HEAD --no-edit
git push origin main
```

### Rollback de migraciones de BD
```bash
# 1. Identificar la migración a revertir
# 2. Ejecutar SQL de reversión manual (el proyecto no usa down migrations)
# 3. Opcional: restaurar desde backup de Supabase (Point-in-Time Recovery)
```

### Rollback completo (código + BD)
1. `git revert <commit-hash>` del deploy fallido
2. Restaurar BD desde snapshot de Supabase (PITR)
3. Re-deployar: `npm run build && npm start`

## Estrategia de migraciones para producción

1. **Desarrollo**: las migraciones se crean en `supabase/migrations/` con timestamp
2. **Staging**: `npx ts-node scripts/deploy-migrations.ts` (usa `.env.local` apuntando a staging)
3. **Producción**:
   - Actualizar `.env.local` para que apunte al proyecto de producción
   - Revisar SQL manualmente antes de ejecutar
   - Ejecutar: `npx ts-node scripts/deploy-migrations.ts`
   - Verificar: `npx ts-node scripts/check-index-collisions.ts`
4. **Seed de producción**: No hay seed automático. Los datos maestros se insertan manualmente.
5. **Alternativa**: Usar Supabase Dashboard → SQL Editor para migraciones manuales.

## Key features (web module)

### Landing Page
- Marketing hero, services, sectors, disciplines sections
- CFM calculator widget (`LandingCfmCalculator.tsx`)
- Trust marquee, process pipeline, featured case studies
- Floating CTA and contact form

### Wizard (Lead Generation Funnel)
- 5-step form: Corporate Info → Service Selection → Technical Analysis → Summary → Success
- Server Action: `submitWizardData()` in `src/web/actions/wizard.ts`
- Flow: CFM calculation → Client/Contact upsert → Lead creation with scoring → Diagnostic report
- Integrates with: `clients`, `client_contacts`, `leads`, `diagnostic_reports` tables

### Catalog
- `CatalogView.tsx` — Public product catalog
- Server Actions: `catalog.ts`, `catalog-cache.ts`

### White-label Branding
- `src/web/actions/branding.ts` — Dynamic theming per tenant

## API / Data flow

```
Landing Page → Wizard Form → submitWizardData()
                               ├── calculateRequiredCfm()  (src/utils/engineering.ts)
                               ├── estimatePrice()         (src/utils/pricing.ts)
                               ├── Client upsert           (clients table)
                               ├── Contact upsert          (client_contacts table)
                               ├── Lead + Score            (leads table)
                               └── Diagnostic Report       (diagnostic_reports table)
```

## PR & commit conventions

- Branch from `main`; never push to it directly
- Commit message: conventional commits (`feat:`, `fix:`, `docs:`)
- Test web flows end-to-end before merging
