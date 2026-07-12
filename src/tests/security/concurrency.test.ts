/**
 * FASE 5.3 — Concurrencia multi-tenant (ACME vs APEX operando en paralelo).
 *
 * Complemento de FASE 5.2 (rls-bypass.test.ts): esos tests confirman que el
 * aislamiento por tenant funciona bajo requests secuenciales. Aquí se valida
 * lo mismo bajo carga concurrente real — ambos tenants escribiendo/leyendo
 * al mismo tiempo — para detectar race conditions, deadlocks o fugas de
 * datos que solo aparecen bajo concurrencia (p.ej. un WHERE mal parametrizado
 * que dependa de una variable de sesión compartida entre requests).
 *
 * No se mockea Supabase: se usan sesiones reales (signInWithPassword) de dos
 * usuarios desechables, uno por tenant, y se disparan operaciones en paralelo
 * con Promise.all() contra PostgREST real.
 *
 * Uso: npx vitest run src/tests/security/concurrency.test.ts
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  ACME_TENANT_ID,
  APEX_TENANT_ID,
  hasLiveCredentials,
  getAdminClient,
  createTestStaffUser,
  deleteTestStaffUserByEmail,
  type TestStaffUser,
} from "./helpers";

const maybeDescribe = hasLiveCredentials ? describe : describe.skip;

interface JobFixture {
  clientId: string;
  requirementId: string;
  siteId: string;
  areaId: string;
}

maybeDescribe("Concurrencia multi-tenant — ACME vs APEX operando en paralelo", () => {
  const admin = getAdminClient();
  let acme: TestStaffUser;
  let apex: TestStaffUser;
  let acmeJobFixture: JobFixture;
  let apexJobFixture: JobFixture;
  let acmeQuoteId: string;
  let apexQuoteId: string;
  let acmeQuoteOriginalNotes: string | null;
  let apexQuoteOriginalNotes: string | null;

  const insertedLeadIds: string[] = [];
  const insertedJobIds: string[] = [];

  /** Fixtures reales de cliente/requerimiento/sitio/área — necesarios para insertar un job válido (todas son FK NOT NULL). */
  async function fetchJobFixture(tenantId: string): Promise<JobFixture> {
    const [clientRow, siteRow, areaRow] = await Promise.all([
      admin.from("clients").select("id").eq("tenant_id", tenantId).is("deleted_at", null).limit(1).single(),
      admin.from("sites").select("id").eq("tenant_id", tenantId).limit(1).single(),
      admin.from("areas").select("id").eq("tenant_id", tenantId).limit(1).single(),
    ]);
    if (clientRow.error || siteRow.error || areaRow.error) {
      throw new Error(`No se encontraron fixtures de cliente/sitio/área para tenant ${tenantId}. Este test asume datos sembrados.`);
    }
    const reqRow = await admin
      .from("requirements")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("client_id", clientRow.data!.id)
      .limit(1)
      .single();
    if (reqRow.error) {
      throw new Error(`No se encontró un requerimiento de fixture para el cliente ${clientRow.data!.id} (tenant ${tenantId}).`);
    }
    return {
      clientId: clientRow.data!.id,
      requirementId: reqRow.data!.id,
      siteId: siteRow.data!.id,
      areaId: areaRow.data!.id,
    };
  }

  beforeAll(async () => {
    [acme, apex] = await Promise.all([
      createTestStaffUser(admin, ACME_TENANT_ID, "conc-acme"),
      createTestStaffUser(admin, APEX_TENANT_ID, "conc-apex"),
    ]);

    [acmeJobFixture, apexJobFixture] = await Promise.all([
      fetchJobFixture(ACME_TENANT_ID),
      fetchJobFixture(APEX_TENANT_ID),
    ]);

    const [acmeQuote, apexQuote] = await Promise.all([
      admin.from("quotes").select("id, notes").eq("tenant_id", ACME_TENANT_ID).limit(1).single(),
      admin.from("quotes").select("id, notes").eq("tenant_id", APEX_TENANT_ID).limit(1).single(),
    ]);
    if (acmeQuote.error || apexQuote.error) {
      throw new Error("Se necesita al menos una cotización sembrada por tenant (ACME y APEX) para el test de concurrencia.");
    }
    acmeQuoteId = acmeQuote.data!.id;
    apexQuoteId = apexQuote.data!.id;
    acmeQuoteOriginalNotes = acmeQuote.data!.notes;
    apexQuoteOriginalNotes = apexQuote.data!.notes;
  }, 30000);

  afterAll(async () => {
    await Promise.all([
      ...insertedLeadIds.map((id) =>
        admin.from("leads").update({ deleted_at: new Date().toISOString(), delete_reason: "sectest cleanup" }).eq("id", id)
      ),
      ...insertedJobIds.map((id) =>
        admin.from("jobs").update({ deleted_at: new Date().toISOString(), delete_reason: "sectest cleanup" }).eq("id", id)
      ),
      admin.from("quotes").update({ notes: acmeQuoteOriginalNotes }).eq("id", acmeQuoteId),
      admin.from("quotes").update({ notes: apexQuoteOriginalNotes }).eq("id", apexQuoteId),
    ]);
    await Promise.all([
      deleteTestStaffUserByEmail(admin, acme.email),
      deleteTestStaffUserByEmail(admin, apex.email),
    ]);
  }, 30000);

  describe("Escenario 1 — creación concurrente de leads", () => {
    it("5 leads ACME + 5 leads APEX creados en paralelo: todos exitosos, cada uno con el tenant_id correcto, sin cruces", async () => {
      const N = 5;
      const start = Date.now();
      const acmeInserts = Array.from({ length: N }, (_, i) =>
        acme.client
          .from("leads")
          .insert({ tenant_id: ACME_TENANT_ID, name: `SECTEST-CONC-ACME-${i}`, urgency: "media" })
          .select("id, tenant_id, name")
          .single()
      );
      const apexInserts = Array.from({ length: N }, (_, i) =>
        apex.client
          .from("leads")
          .insert({ tenant_id: APEX_TENANT_ID, name: `SECTEST-CONC-APEX-${i}`, urgency: "media" })
          .select("id, tenant_id, name")
          .single()
      );

      const results = await Promise.all([...acmeInserts, ...apexInserts]);
      const elapsedMs = Date.now() - start;
      console.log(`[concurrency] 10 inserts de leads en paralelo (2 tenants): ${elapsedMs}ms total, ${(elapsedMs / (2 * N)).toFixed(1)}ms/op promedio`);

      for (const r of results) {
        expect(r.error).toBeNull();
        insertedLeadIds.push(r.data!.id);
      }

      const acmeResults = results.slice(0, N);
      const apexResults = results.slice(N);
      expect(acmeResults.every((r) => r.data!.tenant_id === ACME_TENANT_ID)).toBe(true);
      expect(apexResults.every((r) => r.data!.tenant_id === APEX_TENANT_ID)).toBe(true);

      // Cada sesión, leyendo inmediatamente después de la ráfaga de inserts, solo ve su propio tenant.
      const [acmeView, apexView] = await Promise.all([
        acme.client.from("leads").select("id, tenant_id").in("id", insertedLeadIds),
        apex.client.from("leads").select("id, tenant_id").in("id", insertedLeadIds),
      ]);
      expect(acmeView.data!.length).toBe(N);
      expect(acmeView.data!.every((r) => r.tenant_id === ACME_TENANT_ID)).toBe(true);
      expect(apexView.data!.length).toBe(N);
      expect(apexView.data!.every((r) => r.tenant_id === APEX_TENANT_ID)).toBe(true);
    }, 30000);
  });

  describe("Escenario 2 — actualización concurrente de quotes", () => {
    it("ACME actualiza su cotización mientras APEX actualiza la suya, en paralelo: cada uno solo modifica su propia fila", async () => {
      const acmeNewNotes = `SECTEST-CONC-ACME-${Date.now()}`;
      const apexNewNotes = `SECTEST-CONC-APEX-${Date.now()}`;

      const [acmeResult, apexResult] = await Promise.all([
        acme.client.from("quotes").update({ notes: acmeNewNotes }).eq("id", acmeQuoteId).select("notes, tenant_id").single(),
        apex.client.from("quotes").update({ notes: apexNewNotes }).eq("id", apexQuoteId).select("notes, tenant_id").single(),
      ]);

      expect(acmeResult.error).toBeNull();
      expect(apexResult.error).toBeNull();
      expect(acmeResult.data!.notes).toBe(acmeNewNotes);
      expect(apexResult.data!.notes).toBe(apexNewNotes);
      expect(acmeResult.data!.tenant_id).toBe(ACME_TENANT_ID);
      expect(apexResult.data!.tenant_id).toBe(APEX_TENANT_ID);

      // Confirmar contra la BD (cliente admin) que no hubo escritura cruzada entre tenants.
      const [acmeAfter, apexAfter] = await Promise.all([
        admin.from("quotes").select("notes").eq("id", acmeQuoteId).single(),
        admin.from("quotes").select("notes").eq("id", apexQuoteId).single(),
      ]);
      expect(acmeAfter.data!.notes).toBe(acmeNewNotes);
      expect(apexAfter.data!.notes).toBe(apexNewNotes);
    }, 30000);

    it("10 actualizaciones concurrentes sobre la MISMA cotización de ACME no producen escritura corrupta (no hay merge parcial de valores)", async () => {
      const N = 10;
      const updates = Array.from({ length: N }, (_, i) =>
        acme.client.from("quotes").update({ notes: `SECTEST-RACE-${i}` }).eq("id", acmeQuoteId).select("notes").single()
      );
      const results = await Promise.all(updates);
      results.forEach((r) => expect(r.error).toBeNull());

      const final = await admin.from("quotes").select("notes").eq("id", acmeQuoteId).single();
      const candidates = Array.from({ length: N }, (_, i) => `SECTEST-RACE-${i}`);
      // El valor final debe ser exactamente UNO de los N valores escritos, nunca una mezcla/corrupción de dos escrituras.
      expect(candidates).toContain(final.data!.notes);
    }, 30000);
  });

  describe("Escenario 3 — creación concurrente de jobs (órdenes de trabajo)", () => {
    it("ACME y APEX crean una OT cada uno en paralelo: ambas se crean sin bloqueo mutuo, con tenant_id y job_code correctos", async () => {
      const start = Date.now();
      const [acmeJob, apexJob] = await Promise.all([
        acme.client
          .from("jobs")
          .insert({
            tenant_id: ACME_TENANT_ID,
            client_id: acmeJobFixture.clientId,
            requirement_id: acmeJobFixture.requirementId,
            site_id: acmeJobFixture.siteId,
            area_id: acmeJobFixture.areaId,
            title: "SECTEST-CONC-JOB-ACME",
            assigned_user_id: acme.userId,
          })
          .select("id, tenant_id, job_code")
          .single(),
        apex.client
          .from("jobs")
          .insert({
            tenant_id: APEX_TENANT_ID,
            client_id: apexJobFixture.clientId,
            requirement_id: apexJobFixture.requirementId,
            site_id: apexJobFixture.siteId,
            area_id: apexJobFixture.areaId,
            title: "SECTEST-CONC-JOB-APEX",
            assigned_user_id: apex.userId,
          })
          .select("id, tenant_id, job_code")
          .single(),
      ]);
      const elapsedMs = Date.now() - start;
      console.log(`[concurrency] Creación paralela de 2 jobs (tenants distintos): ${elapsedMs}ms`);

      expect(acmeJob.error).toBeNull();
      expect(apexJob.error).toBeNull();
      insertedJobIds.push(acmeJob.data!.id, apexJob.data!.id);

      expect(acmeJob.data!.tenant_id).toBe(ACME_TENANT_ID);
      expect(apexJob.data!.tenant_id).toBe(APEX_TENANT_ID);
      expect(acmeJob.data!.job_code).toBeTruthy();
      expect(apexJob.data!.job_code).toBeTruthy();
      // Sin deadlock: ambas operaciones concurrentes en tablas/tenants distintos terminan bien dentro del timeout generoso.
      expect(elapsedMs).toBeLessThan(30_000);
    }, 30000);

    it("5 jobs concurrentes del MISMO tenant (ACME) obtienen job_code únicos — la secuencia atómica no colisiona bajo concurrencia", async () => {
      const N = 5;
      const inserts = Array.from({ length: N }, () =>
        acme.client
          .from("jobs")
          .insert({
            tenant_id: ACME_TENANT_ID,
            client_id: acmeJobFixture.clientId,
            requirement_id: acmeJobFixture.requirementId,
            site_id: acmeJobFixture.siteId,
            area_id: acmeJobFixture.areaId,
            title: "SECTEST-CONC-JOB-SEQ-ACME",
            assigned_user_id: acme.userId,
          })
          .select("id, job_code")
          .single()
      );
      const results = await Promise.all(inserts);
      results.forEach((r) => expect(r.error).toBeNull());
      results.forEach((r) => insertedJobIds.push(r.data!.id));

      const codes = results.map((r) => r.data!.job_code);
      expect(new Set(codes).size).toBe(N); // Todos únicos: get_next_tenant_sequence() no repitió números bajo concurrencia.
    }, 30000);
  });
});
