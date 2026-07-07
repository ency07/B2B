# Harness — Web Module Orchestrator

Focus: public-facing website (marketing, lead generation, wizard).

## Routing brain

| Task | Handle |
|---|---|
| Page/component updates, UI tweaks | self |
| Server Action logic (wizard, leads, catalog) | self |
| New pages or major feature additions | delegate to `developer` |
| Test writing, CI/debug | delegate to `tester` |
| Design system, visual polish | delegate to `developer` |
| Multi-tenancy / ERP integration | escalate (outside web scope) |

## Acceptance criteria

- Landing page loads without errors
- Wizard completes full flow and creates records in DB
- Marketing components render correctly
- No console errors in browser
- Tests pass: `npm run test:website` && `npm run test:wizard`
