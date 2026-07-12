import { test, expect, type Page, type BrowserContext } from "@playwright/test";
import {
  ACME_TENANT_ID,
  APEX_TENANT_ID,
  hasLiveCredentials,
  getAdminClient,
  createTestStaffUser,
  deleteTestStaffUserByEmail,
  TEST_PASSWORD,
  type TestStaffUser,
} from "./helpers";

/**
 * FASE 5.3 — Concurrencia multi-tenant real en navegador (Playwright).
 *
 * Complemento E2E de src/tests/security/concurrency.test.ts (que cubre
 * concurrencia a nivel de datos con clientes Supabase reales, sin UI). Aquí
 * se valida lo mismo desde dos navegadores reales operando en paralelo —
 * sesiones ACME y APEX simultáneas navegando el mismo dashboard.
 *
 * Nota de alcance (verificado contra el código real, no asumido): el ERP no
 * tiene un formulario de "Crear Lead" en el dashboard — los leads solo
 * entran por el wizard público (src/app/wizard/page.tsx) o el formulario de
 * contacto (src/web/actions/leads.ts), y "aprobar cotización" exige capturar
 * antes la firma del cliente (ver "Aprobar Oferta" en
 * src/app/(dashboard)/dashboard/quotes/page.tsx), un flujo no automatizable
 * de forma confiable aquí. Por eso los escenarios de este archivo verifican
 * concurrencia real y observable por UI: dos sesiones de tenants distintos
 * navegando y buscando al mismo tiempo, confirmando que el aislamiento por
 * tenant se sostiene bajo carga concurrente real (no solo en requests
 * secuenciales, que es lo que ya cubre auth-bypass.spec.ts).
 *
 * Los usuarios de prueba se crean vía admin API (igual que en los tests de
 * Vitest de esta misma carpeta) e inician sesión de verdad a través del
 * formulario de /login — no se reutiliza ninguna sesión ni cookie fabricada.
 *
 * Uso: npx playwright test src/tests/security/concurrency.spec.ts
 * Requiere el dev server corriendo en localhost:3000 (npm run dev).
 */

test.describe("Concurrencia multi-tenant — dos navegadores reales (ACME + APEX)", () => {
  test.skip(!hasLiveCredentials, "Sin credenciales reales de Supabase — test saltado.");

  const admin = getAdminClient();
  let acme: TestStaffUser;
  let apex: TestStaffUser;
  // El buscador de /dashboard/leads (src/features/crm/lead-inbox.tsx) filtra
  // por companyName/contactName/leadCode — NO por `leads.name` (columna legacy
  // ya no mostrada en la UI, ver 20260619000036_fix_leads_schema.sql). Por
  // eso el marcador de búsqueda es el lead_code real generado por el trigger,
  // capturado después del insert — mismo patrón que flow2-erp-lead-to-invoice.spec.ts.
  let acmeLeadMarker: string;
  let apexLeadMarker: string;
  const insertedLeadIds: string[] = [];

  let acmeContext: BrowserContext;
  let apexContext: BrowserContext;
  let acmePage: Page;
  let apexPage: Page;

  async function login(page: Page, email: string) {
    await page.goto("/login");
    await page.getByPlaceholder("nombre@empresa.com").fill(email);
    await page.getByPlaceholder("••••••••").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Entrar al panel" }).click();
    await page.waitForURL("**/dashboard", { timeout: 30_000 });
  }

  test.beforeAll(async ({ browser }, testInfo) => {
    // slowMo de 7s/acción (ver playwright.config.ts) + 2 logins reales en
    // paralelo necesitan más que el timeout por defecto de 30s.
    testInfo.setTimeout(120_000);

    [acme, apex] = await Promise.all([
      createTestStaffUser(admin, ACME_TENANT_ID, "ui-conc-acme"),
      createTestStaffUser(admin, APEX_TENANT_ID, "ui-conc-apex"),
    ]);

    // loginErp() (src/erp/actions/auth.ts) rechaza el login si el usuario no
    // tiene un rol distinto de CLIENTE en user_roles — a diferencia de RLS
    // (que solo exige tenant_id, ver la nota en helpers.ts), la UI sí exige
    // rol. EJECUTIVO_COMERCIAL es un rol global (tenant_id NULL en roles).
    const role = await admin.from("roles").select("id").eq("role_code", "EJECUTIVO_COMERCIAL").is("tenant_id", null).single();
    if (role.error) {
      throw new Error("No se encontró el rol global EJECUTIVO_COMERCIAL — requerido para que los usuarios de prueba puedan iniciar sesión en la UI del ERP.");
    }
    const rolesResult = await Promise.all([
      admin.from("user_roles").insert({ tenant_id: ACME_TENANT_ID, user_id: acme.userId, role_id: role.data.id }),
      admin.from("user_roles").insert({ tenant_id: APEX_TENANT_ID, user_id: apex.userId, role_id: role.data.id }),
    ]);
    if (rolesResult.some((r) => r.error)) {
      throw new Error("No se pudo asignar el rol EJECUTIVO_COMERCIAL a los usuarios de prueba.");
    }

    // Los leads se siembran directo en BD (no hay formulario de creación en
    // el dashboard — ver nota de alcance arriba); lo que se prueba con UI
    // real es la LECTURA/búsqueda concurrente, no la creación.
    const [acmeLead, apexLead] = await Promise.all([
      admin.from("leads").insert({ tenant_id: ACME_TENANT_ID, urgency: "media" }).select("id, lead_code").single(),
      admin.from("leads").insert({ tenant_id: APEX_TENANT_ID, urgency: "media" }).select("id, lead_code").single(),
    ]);
    if (acmeLead.error || apexLead.error) {
      throw new Error("No se pudieron sembrar los leads de fixture para el test de concurrencia en UI.");
    }
    insertedLeadIds.push(acmeLead.data!.id, apexLead.data!.id);
    acmeLeadMarker = acmeLead.data!.lead_code;
    apexLeadMarker = apexLead.data!.lead_code;

    acmeContext = await browser.newContext();
    apexContext = await browser.newContext();
    acmePage = await acmeContext.newPage();
    apexPage = await apexContext.newPage();

    await Promise.all([login(acmePage, acme.email), login(apexPage, apex.email)]);
  });

  test.afterAll(async () => {
    await Promise.all(
      insertedLeadIds.map((id) =>
        admin.from("leads").update({ deleted_at: new Date().toISOString(), delete_reason: "sectest cleanup" }).eq("id", id)
      )
    );
    await Promise.all([
      deleteTestStaffUserByEmail(admin, acme.email),
      deleteTestStaffUserByEmail(admin, apex.email),
    ]);
    await acmeContext?.close();
    await apexContext?.close();
  });

  test("Escenario 1 — ambas sesiones navegan y buscan en /dashboard/leads al mismo tiempo, cada una solo ve su propio lead", async () => {
    test.setTimeout(90_000);

    await Promise.all([acmePage.goto("/dashboard/leads"), apexPage.goto("/dashboard/leads")]);
    await Promise.all([
      acmePage.getByRole("tab", { name: /Inbox/i }).click(),
      apexPage.getByRole("tab", { name: /Inbox/i }).click(),
    ]);
    await Promise.all([
      acmePage.getByPlaceholder(/Buscar lead por empresa/i).fill(acmeLeadMarker),
      apexPage.getByPlaceholder(/Buscar lead por empresa/i).fill(apexLeadMarker),
    ]);

    await expect(acmePage.getByText(acmeLeadMarker)).toBeVisible({ timeout: 30_000 });
    await expect(apexPage.getByText(apexLeadMarker)).toBeVisible({ timeout: 30_000 });

    // Aislamiento cruzado bajo concurrencia real: ninguna sesión ve el marcador del otro tenant.
    await expect(acmePage.getByText(apexLeadMarker)).toHaveCount(0);
    await expect(apexPage.getByText(acmeLeadMarker)).toHaveCount(0);
  });

  test("Escenario 2 — ambas sesiones cargan y buscan en /dashboard/quotes al mismo tiempo, sin errores ni timeouts", async () => {
    test.setTimeout(90_000);

    const responses = await Promise.all([
      acmePage.goto("/dashboard/quotes", { timeout: 30_000 }),
      apexPage.goto("/dashboard/quotes", { timeout: 30_000 }),
    ]);
    for (const res of responses) {
      expect(res?.status(), "la navegación concurrente a /dashboard/quotes no debe devolver error").toBeLessThan(400);
    }

    await Promise.all([
      acmePage.getByPlaceholder(/Buscar por folio o cliente/i).fill("SECTEST-CONC-NOPE"),
      apexPage.getByPlaceholder(/Buscar por folio o cliente/i).fill("SECTEST-CONC-NOPE"),
    ]);

    // Sin pantalla de error de Next.js tras la carga concurrente.
    await expect(acmePage.getByText(/Application error/i)).toHaveCount(0);
    await expect(apexPage.getByText(/Application error/i)).toHaveCount(0);
  });
});
