# QUALITY — Estrategia de Pruebas y Calidad

## Stack

| Herramienta | Propósito |
|---|---|
| Vitest | Unit + Integration tests |
| React Testing Library | Component tests |
| Playwright | E2E tests |
| Zod | Runtime validation |
| ESLint | Static analysis |
| Prettier | Code formatting |
| TypeScript strict | Compile-time safety |

---

## Pirámide de pruebas

```
        ╱  E2E  ╲         Playwright — 10 tests críticos
       ╱──────────╲
      ╱ Integration╲       Vitest — 50+ tests (repositories, APIs)
     ╱──────────────╲
    ╱   Unit Tests   ╲     Vitest — 200+ tests (services, domain, utils)
   ╱──────────────────╲
  ╱   Static Analysis  ╲   ESLint + TypeScript + Zod
 ╱──────────────────────╲
```

---

## Cobertura objetivo

| Capa | Cobertura |
|---|---|
| Domain (entities, DTOs, rules) | 100% |
| Services (business logic) | > 80% |
| Utils (formatters, helpers) | 100% |
| Repositories (data access) | > 60% |
| Components (UI) | > 30% |
| E2E (critical paths) | 10 tests |
| **Global** | **> 70%** |

---

## Configuración

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/db/types.ts', 'src/**/*.test.*', 'src/app/**/layout.tsx'],
      thresholds: {
        branches: 60,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

## Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "lint": "eslint src/ --ext .ts,.tsx",
    "lint:fix": "eslint src/ --ext .ts,.tsx --fix",
    "typecheck": "tsc --noEmit",
    "format": "prettier --write 'src/**/*.{ts,tsx,json}'",
    "format:check": "prettier --check 'src/**/*.{ts,tsx,json}'",
    "quality": "npm run lint && npm run typecheck && npm run test -- --coverage",
    "ci": "npm run quality"
  }
}
```

---

## Archivos

| Archivo | Contenido |
|---|---|
| `00_INDEX.md` | Estrategia, pirámide, cobertura, configuración |
| `01_UNIT_TESTS.md` | Tests unitarios: services, domain, utils |
| `02_INTEGRATION_TESTS.md` | Tests de integración: repositories, actions |
| `03_E2E_TESTS.md` | Tests E2E: Playwright, critical paths |
| `04_CI_CD.md` | CI/CD pipeline, GitHub Actions |
