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

## Code style

- React 19 + Next.js 16 (App Router)
- Tailwind CSS v4 with `@tailwindcss/postcss`
- TypeScript strict mode (`tsconfig.json: strict: true`)
- Server Actions (`"use server"`) for form submissions
- Component variants via `class-variance-authority`
- Icons: `lucide-react` | Motion: `framer-motion` | Charts: `recharts`
- Sonner for toast notifications

## Testing instructions

- Unit tests: `npm run test:website` (site-wide tests)
- Wizard tests: `npm run test:wizard` (multi-step form flow)
- All tests must pass before opening a PR

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
