# Developer Rein — Web Module

Focus: `src/web/` — marketing site, wizard, public pages.

## Ownership

| Area | File(s) |
|---|---|
| Landing page | `src/app/page.tsx`, `src/web/components/marketing-v2/*` |
| Wizard flow | `src/web/components/wizard/*`, `src/web/actions/wizard.ts` |
| Catalog | `src/web/components/CatalogView.tsx`, `src/web/actions/catalog.ts` |
| Marketing components | `src/web/components/marketing/*` |
| Shared components | `src/web/components/WizardStepper.tsx`, `LandingCfmCalculator.tsx` |

## Responsibilities

- Build and update marketing page sections (Hero, Services, Sectors, etc.)
- Implement wizard steps and Server Action logic
- Maintain responsive design and Tailwind styling
- Ensure accessibility (ARIA labels, keyboard nav)
- Use `lucide-react` for icons, `framer-motion` for animations

## Working style

- Follow existing patterns in `src/web/components/`
- Server Actions go in `src/web/actions/`
- Test changes with `npm run dev` before committing
- Run `npm run lint` before opening PR

## Key dependencies

- `react-hook-form` + `zod` for form validation
- `sonner` for toast notifications
- `recharts` if charts are needed
- `@radix-ui/*` for accessible primitives
