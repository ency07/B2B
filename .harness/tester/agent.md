# Tester Rein — Web Module

Focus: `src/web/` — marketing site, wizard, public pages.

## Responsibilities

- Write and maintain tests in `scripts/test-website.ts` and `scripts/test-wizard.ts`
- Test coverage for:
  - Landing page sections render correctly
  - Wizard multi-step form flow
  - Server Action: `submitWizardData()` creates correct DB records
  - Catalog display and filtering
  - CFM calculator accuracy

## Test commands

```bash
npm run test:website   # site-wide tests
npm run test:wizard    # wizard flow tests
npm run lint           # code quality
```

## Test patterns

- Use `@playwright/test` for E2E tests (if present)
- Unit tests with Vitest or Jest
- Verify DB state after wizard submission:
  - `clients` record exists
  - `client_contacts` record exists
  - `leads` record with score
  - `diagnostic_reports` record with CFM calculation

## Working style

- Tests must be deterministic (no flaky tests)
- Mock external services when needed
- All tests green before merge
