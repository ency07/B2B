# E2E TESTS — Playwright

## 1. Configuración

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }], ['json', { outputFile: 'test-results.json' }]],
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
})
```

---

## 2. Critical Paths (10 tests)

### Auth Flow

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test('usuario puede iniciar sesión y ver dashboard', async ({ page }) => {
  await page.goto('/login')

  await page.fill('input[name="email"]', 'admin@aeromax.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  await expect(page).toHaveURL(/\/dashboard/)
  await expect(page.getByText('Dashboard')).toBeVisible()
})

test('usuario no autenticado es redirigido a login', async ({ page }) => {
  await page.goto('/dashboard/crm/leads')
  await expect(page).toHaveURL(/\/login/)
})

test('cliente puede iniciar sesión y ver portal', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'cliente@nutresa.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/portal/)
})

test('cliente no puede acceder al ERP', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'cliente@nutresa.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')

  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/portal/)
})
```

### CRM Flow

```typescript
// e2e/crm.spec.ts
test('crear lead y verlo en la lista', async ({ page }) => {
  await loginAs(page, 'comercial@aeromax.com', 'password123')

  await page.goto('/dashboard/crm/leads')
  await page.click('button:has-text("Crear Lead")')

  await page.fill('input[name="nombre_contacto"]', 'Pedro Ramírez')
  await page.fill('input[name="empresa"]', 'Mina El Dorado')
  await page.selectOption('select[name="origen"]', 'web')
  await page.click('button:has-text("Guardar")')

  await expect(page.getByText('Pedro Ramírez')).toBeVisible()
})

test('filtrar leads por estado', async ({ page }) => {
  await loginAs(page, 'comercial@aeromax.com', 'password123')
  await page.goto('/dashboard/crm/leads')

  await page.click('button:has-text("Filtros")')
  await page.selectOption('select[name="estado"]', 'LEAD_NUEVO')

  // Esperar que la tabla se actualice
  await page.waitForResponse(resp => resp.url().includes('/leads') && resp.status() === 200)
})
```

### Quote Flow

```typescript
test('crear cotización con items', async ({ page }) => {
  await loginAs(page, 'comercial@aeromax.com', 'password123')
  await page.goto('/dashboard/quotes')

  await page.click('button:has-text("Nueva Cotización")')
  await page.fill('input[name="proyecto"]', 'Sistema Extracción Planta')
  await page.click('button:has-text("Agregar Item")')

  await page.fill('input[name="descripcion"]', 'Extractor Axial')
  await page.fill('input[name="cantidad"]', '2')
  await page.fill('input[name="precio_unitario"]', '22500000')

  await page.click('button:has-text("Guardar")')
  await expect(page.getByText('Extractor Axial')).toBeVisible()
})
```

### Mobile (Pixel 5)

```typescript
test('dashboard mobile muestra sidebar drawer', async ({ page }) => {
  await loginAs(page, 'admin@aeromax.com', 'password123')

  // En mobile, el sidebar está oculto
  await expect(page.locator('aside')).not.toBeVisible()

  // Click en hamburger
  await page.click('button[aria-label="Abrir menú"]')
  await expect(page.locator('aside')).toBeVisible()
})
```

---

## 3. Helpers

```typescript
// e2e/helpers.ts
import type { Page } from '@playwright/test'

export async function loginAs(
  page: Page,
  email: string,
  password: string
) {
  await page.goto('/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')
  await page.waitForURL(/^\/(dashboard|portal)/)
}
```

---

## 4. Ejecución

```bash
# Todos los tests
npx playwright test

# Solo chromium
npx playwright test --project=chromium

# Modo UI (debug)
npx playwright test --ui

# Solo un archivo
npx playwright test e2e/crm.spec.ts

# Con video en fallos
npx playwright test --trace on
```
