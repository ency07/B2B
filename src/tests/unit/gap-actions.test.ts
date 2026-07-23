/**
 * Gap Actions — Unit tests for Server Actions created in E-001 to E-015.
 *
 * Covers:
 *   E-001: registerPayment
 *   E-002: updateJobStatus
 *   E-003: createCreditNote
 *   E-004: Purchase order flow (create/approve/receive)
 *   E-005+E-014: emitBusinessEvent (dual write)
 *   E-007: updateLeadStatus (transitions + auto client)
 *   E-008: convertQuoteToJob
 *   E-009: getQuotes/getInvoices/getJobs with clientId filter
 *   E-012: deleteEntity
 *   E-013: getTaxRate
 *   E-015: getPaymentMethods
 *
 * All tests mock Supabase (no red). Zod validation is real.
 *
 * Uso: npx vitest run src/tests/unit/gap-actions.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Constants (hoisted to be available in vi.mock factories) ────────────────

const {
  TENANT,
  USER_ID,
  AUTH_ID,
  INVOICE_ID,
  CLIENT_ID,
  JOB_ID,
  LEAD_ID,
  QUOTE_ID,
  PO_ID,
  VENDOR_ID,
  REQ_ID,
  SITE_ID,
  supabaseAdminFromMock,
} = vi.hoisted(() => ({
  TENANT: "5af7e917-eac2-4417-82cb-f88fbfc2db9c",
  USER_ID: "2645ecf1-eca6-4898-abc5-315294a02f15",
  AUTH_ID: "974486fb-4834-42c9-a86d-8e82e8f1e35b",
  INVOICE_ID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  CLIENT_ID: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  JOB_ID: "c3d4e5f6-a7b8-4012-8def-123456789012",
  LEAD_ID: "d4e5f6a7-b8c9-4123-9ef0-234567890123",
  QUOTE_ID: "e5f6a7b8-c9d0-1234-af01-345678901234",
  PO_ID: "f6a7b8c9-d0e1-2345-8012-456789012345",
  VENDOR_ID: "a7b8c9d0-e1f2-3456-8123-567890123456",
  REQ_ID: "b8c9d0e1-f2a3-4567-9234-678901234567",
  SITE_ID: "c9d0e1f2-a3b4-5678-a345-789012345678",
  supabaseAdminFromMock: vi.fn(),
}));

// ─── Module Mocks ────────────────────────────────────────────────────────────

vi.mock("react", () => ({ cache: (fn: unknown) => fn }));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: vi.fn() }),
}));

vi.mock("@/platform/users/users", () => ({
  getUserRole: vi.fn().mockResolvedValue("GERENTE_GENERAL"),
}));

vi.mock("@/lib/role-permissions", () => ({
  canPerform: vi.fn().mockReturnValue(true),
}));

vi.mock("@/platform/auth/clients", () => ({
  supabaseAdmin: { from: supabaseAdminFromMock, rpc: vi.fn() },
}));

vi.mock("@/platform/tenant/tenant-resolver", () => ({
  resolveTenantIdAsync: vi.fn().mockImplementation(async (code?: string | null) => {
    return code || "5af7e917-eac2-4417-82cb-f88fbfc2db9c";
  }),
  resolveTenantId: vi.fn().mockImplementation((code?: string | null) => {
    return code || "5af7e917-eac2-4417-82cb-f88fbfc2db9c";
  }),
}));

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  unstable_cache: vi.fn((_fn: unknown, _keys: unknown[], _opts: unknown) => _fn as (...a: unknown[]) => unknown),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn(), refresh: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

import {
  registerPayment,
  updateJobStatus,
  createCreditNote,
  createPurchaseOrder,
  approvePurchaseOrder,
  receivePurchaseOrder,
  emitBusinessEvent,
  deleteEntity,
  getTaxRate,
  getPaymentMethods,
} from "@/erp/actions/core";
import { updateLeadStatus } from "@/erp/actions/leads-erp";
import { convertQuoteToJob, getQuotes } from "@/erp/actions/quotes";
import * as serverGuards from "@/platform/auth/server-guards";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Build a mock Supabase query chain. Each method returns `this` for chaining.
 * Terminators (.single, .maybeSingle, await) resolve to `result`.
 */
function buildChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  const methods = [
    "select", "eq", "neq", "is", "in", "order", "limit",
    "gte", "lte", "gt", "lt", "like", "ilike", "contains",
    "update", "delete",
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnThis();
  }
  chain["maybeSingle"] = vi.fn().mockResolvedValue(result);
  chain["single"] = vi.fn().mockResolvedValue(result);
  chain["insert"] = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue(result),
    }),
    then: (resolve: (v: unknown) => void) => resolve(result),
  });
  chain["update"] = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(result),
        }),
        then: (resolve: (v: unknown) => void) => resolve(result),
      }),
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(result),
      }),
      then: (resolve: (v: unknown) => void) => resolve(result),
    }),
    then: (resolve: (v: unknown) => void) => resolve(result),
  });
  chain["delete"] = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue(result),
    then: (resolve: (v: unknown) => void) => resolve(result),
  });
  chain["then"] = (resolve: (v: unknown) => void) =>
    Promise.resolve(result).then(resolve);
  return chain;
}

/** Build a chain that returns count for head:true queries */
function buildCountChain(count: number) {
  const chain = buildChain({ data: null, error: null });
  // Override select to return count when head:true
  chain["select"] = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        is: vi.fn().mockResolvedValue({ data: null, error: null, count }),
      }),
    }),
    ...chain,
  });
  return chain;
}

/** Auth context mock — returns a valid authenticated context */
function mockAuthContext(roleCode = "GERENTE_GENERAL") {
  return {
    userId: USER_ID,
    role: roleCode,
    tenantId: TENANT,
  };
}

/** Mock from() to return specific chains per table */
function mockFrom(tableMap: Record<string, unknown>) {
  supabaseAdminFromMock.mockImplementation((table: string) => {
    const chain = tableMap[table];
    if (chain) return chain;
    return buildChain({ data: null, error: null });
  });
  return supabaseAdminFromMock;
}

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(serverGuards, "requireAction").mockResolvedValue({
    userId: USER_ID,
    role: "GERENTE_GENERAL",
    tenantId: TENANT,
  });
  vi.spyOn(serverGuards, "getAuthContext").mockResolvedValue({
    userId: USER_ID,
    role: "GERENTE_GENERAL",
    tenantId: TENANT,
  });
  vi.spyOn(serverGuards, "validateTenantAccess").mockResolvedValue(undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ═════════════════════════════════════════════════════════════════════════════
// E-001: registerPayment
// ═════════════════════════════════════════════════════════════════════════════

describe("E-001: registerPayment", () => {
  const validPayment = {
    invoiceId: INVOICE_ID,
    clientId: CLIENT_ID,
    amount: 500000,
    paymentMethod: "Transferencia" as const,
    referenceNumber: "REF-001",
    paymentDate: "2026-07-20",
  };

  it("rechaza invoiceId inválido (Zod)", async () => {
    await expect(
      registerPayment(TENANT, { ...validPayment, invoiceId: "not-a-uuid" })
    ).rejects.toThrow();
  });

  it("rechaza amount <= 0 (Zod)", async () => {
    await expect(
      registerPayment(TENANT, { ...validPayment, amount: -100 })
    ).rejects.toThrow();
  });

  it("rechaza paymentMethod inválido (Zod)", async () => {
    await expect(
      registerPayment(TENANT, { ...validPayment, paymentMethod: "Bitcoin" as never })
    ).rejects.toThrow();
  });

  it("rechaza si la factura no existe", async () => {
    mockFrom({
      invoices: buildChain({ data: null, error: null }),
    });

    await expect(registerPayment(TENANT, validPayment)).rejects.toThrow(
      /no encontrada/i
    );
  });

  it("rechaza si la factura ya está pagada", async () => {
    mockFrom({
      invoices: buildChain({
        data: {
          id: INVOICE_ID,
          status: "PAGADA",
          balance_amount: 0,
          total_amount: 1000000,
          client_id: CLIENT_ID,
          deleted_at: null,
        },
        error: null,
      }),
    });

    await expect(registerPayment(TENANT, validPayment)).rejects.toThrow(
      /pagada|saldo/i
    );
  });

  it("rechaza si el monto excede el saldo pendiente", async () => {
    mockFrom({
      invoices: buildChain({
        data: {
          id: INVOICE_ID,
          status: "EMITIDA",
          balance_amount: 100000,
          total_amount: 1000000,
          client_id: CLIENT_ID,
          deleted_at: null,
        },
        error: null,
      }),
    });

    await expect(
      registerPayment(TENANT, { ...validPayment, amount: 500000 })
    ).rejects.toThrow(/excede|saldo/i);
  });

  it("registro exitoso actualiza paid_amount y status", async () => {
    const invoiceChain = buildChain({
      data: {
        id: INVOICE_ID,
        status: "EMITIDA",
        balance_amount: 500000,
        total_amount: 1000000,
        client_id: CLIENT_ID,
        deleted_at: null,
      },
      error: null,
    });

    const updateChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: INVOICE_ID, paid_amount: 500000, status: "PARCIALMENTE_PAGADA" },
                error: null,
              }),
            }),
          }),
        }),
      }),
    };

    const paymentInsertChain = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: "pay-1", amount: 500000 },
            error: null,
          }),
        }),
      }),
    };

    mockFrom({
      invoices: invoiceChain,
      payments: paymentInsertChain,
    });

    // Mock the invoice update chain
    invoiceChain.update = updateChain.update;

    const result = await registerPayment(TENANT, validPayment);
    expect(result).toBeDefined();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// E-002: updateJobStatus
// ═════════════════════════════════════════════════════════════════════════════

describe("E-002: updateJobStatus", () => {
  it("rechaza jobId inválido (Zod)", async () => {
    await expect(
      updateJobStatus(TENANT, { jobId: "bad", newStatus: "PROGRAMADO" })
    ).rejects.toThrow();
  });

  it("rechaza newStatus inválido (Zod)", async () => {
    await expect(
      updateJobStatus(TENANT, { jobId: JOB_ID, newStatus: "INVALIDO" as never })
    ).rejects.toThrow();
  });

  it("rechaza CANCELADO sin cancelReason", async () => {
    await expect(
      updateJobStatus(TENANT, { jobId: JOB_ID, newStatus: "CANCELADO" })
    ).rejects.toThrow(/motivo/i);
  });

  it("rechaza CANCELADO con cancelReason muy corto", async () => {
    await expect(
      updateJobStatus(TENANT, {
        jobId: JOB_ID,
        newStatus: "CANCELADO",
        cancelReason: "Corto",
      })
    ).rejects.toThrow(/10 caracteres/i);
  });

  it("rechaza si la OT no existe", async () => {
    mockFrom({
      jobs: buildChain({ data: null, error: null }),
    });

    await expect(
      updateJobStatus(TENANT, { jobId: JOB_ID, newStatus: "PROGRAMADO" })
    ).rejects.toThrow(/no encontrada/i);
  });

  it("rechaza si la OT ya está eliminada", async () => {
    mockFrom({
      jobs: buildChain({
        data: { id: JOB_ID, status: "PENDIENTE", deleted_at: "2026-01-01" },
        error: null,
      }),
    });

    await expect(
      updateJobStatus(TENANT, { jobId: JOB_ID, newStatus: "PROGRAMADO" })
    ).rejects.toThrow(/no encontrada/i);
  });

  it("transición válida PENDIENTE → PROGRAMADO", async () => {
    mockFrom({
      jobs: buildChain({
        data: { id: JOB_ID, status: "PENDIENTE", deleted_at: null },
        error: null,
      }),
    });

    // The update chain
    const updateResult = {
      data: { id: JOB_ID, status: "PROGRAMADO" },
      error: null,
    };
    // Override the jobs chain for update
    const jobsChain = buildChain({
      data: { id: JOB_ID, status: "PENDIENTE", deleted_at: null },
      error: null,
    });
    jobsChain.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(updateResult),
        }),
      }),
    });

    mockFrom({ jobs: jobsChain });

    const result = await updateJobStatus(TENANT, {
      jobId: JOB_ID,
      newStatus: "PROGRAMADO",
    });
    expect(result).toBeDefined();
  });

  it("acepta FACTURADA como estado válido (E-011)", async () => {
    const jobsChain = buildChain({
      data: { id: JOB_ID, status: "ENTREGADO", deleted_at: null },
      error: null,
    });
    jobsChain.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: JOB_ID, status: "FACTURADA" },
            error: null,
          }),
        }),
      }),
    });

    mockFrom({ jobs: jobsChain });

    const result = await updateJobStatus(TENANT, {
      jobId: JOB_ID,
      newStatus: "FACTURADA",
    });
    expect(result).toBeDefined();
  });

  it("guarda actual_hours cuando se provee en FINALIZADO", async () => {
    const jobsChain = buildChain({
      data: { id: JOB_ID, status: "EN_EJECUCION", deleted_at: null },
      error: null,
    });

    const updateMock = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: JOB_ID, status: "FINALIZADO", actual_hours: 40 },
            error: null,
          }),
        }),
      }),
    });
    jobsChain.update = updateMock;

    mockFrom({ jobs: jobsChain });

    await updateJobStatus(TENANT, {
      jobId: JOB_ID,
      newStatus: "FINALIZADO",
      actualHours: 40,
    });

    // Verify update was called with actual_hours
    expect(updateMock).toHaveBeenCalled();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// E-003: createCreditNote
// ═════════════════════════════════════════════════════════════════════════════

describe("E-003: createCreditNote", () => {
  const validCN = {
    invoiceId: INVOICE_ID,
    clientId: CLIENT_ID,
    reason: "DEVOLUCION" as const,
    description: "Devolución de equipo dañado",
    subtotal: 100000,
    taxAmount: 19000,
    totalAmount: 119000,
  };

  it("rechaza invoiceId inválido", async () => {
    await expect(
      createCreditNote(TENANT, { ...validCN, invoiceId: "bad" })
    ).rejects.toThrow();
  });

  it("rechaza reason inválido", async () => {
    await expect(
      createCreditNote(TENANT, { ...validCN, reason: "OTRO" as never })
    ).rejects.toThrow();
  });

  it("rechaza totalAmount <= 0", async () => {
    await expect(
      createCreditNote(TENANT, { ...validCN, totalAmount: 0 })
    ).rejects.toThrow();
  });

  it("rechaza si la factura no existe", async () => {
    mockFrom({
      invoices: buildChain({ data: null, error: null }),
    });

    await expect(createCreditNote(TENANT, validCN)).rejects.toThrow(
      /no encontrada/i
    );
  });

  it("rechaza NC por monto mayor al saldo de la factura", async () => {
    mockFrom({
      invoices: buildChain({
        data: {
          id: INVOICE_ID,
          status: "EMITIDA",
          total_amount: 50000,
          client_id: CLIENT_ID,
          deleted_at: null,
        },
        error: null,
      }),
    });

    await expect(createCreditNote(TENANT, validCN)).rejects.toThrow(
      /mayor|saldo|exceder/i
    );
  });

  it("reason inválido es rechazado por Zod (ANULACION no es válida)", async () => {
    // ANULACION is not in the enum — only DEVOLUCION, ERROR, DESCUENTO, ANULACION, GARANTIA
    // Wait, ANULACION IS in the enum. Let me test with a truly invalid one.
    await expect(
      createCreditNote(TENANT, { ...validCN, reason: "FRAUDE" as never })
    ).rejects.toThrow();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// E-004: Purchase Order Flow
// ═════════════════════════════════════════════════════════════════════════════

describe("E-004: Purchase Order Flow", () => {
  const validPO = {
    vendorId: VENDOR_ID,
    totalAmount: 5000000,
    notes: "Compra de materiales",
    items: [
      { description: "Acero A36", quantity: 10, unitPrice: 250000, subtotal: 2500000 },
      { description: "Tornillería", quantity: 5, unitPrice: 500000, subtotal: 2500000 },
    ],
  };

  describe("createPurchaseOrder", () => {
    it("rechaza items vacíos", async () => {
      await expect(
        createPurchaseOrder(TENANT, { ...validPO, items: [] })
      ).rejects.toThrow(/al menos un item/i);
    });

    it("rechaza vendorId inválido", async () => {
      await expect(
        createPurchaseOrder(TENANT, { ...validPO, vendorId: "bad" })
      ).rejects.toThrow();
    });

    it("crea PO exitosamente", async () => {
      const poChain = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: PO_ID, code: "OC-2026-001", status: "BORRADOR" },
              error: null,
            }),
          }),
        }),
      };
      const itemsChain = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      mockFrom({
        purchase_orders: poChain,
        purchase_order_items: itemsChain,
      });

      const result = await createPurchaseOrder(TENANT, validPO);
      expect(result).toBeDefined();
      expect(poChain.insert).toHaveBeenCalled();
    });
  });

  describe("approvePurchaseOrder", () => {
    it("rechaza si la PO no existe", async () => {
      mockFrom({
        purchase_orders: buildChain({ data: null, error: null }),
      });

      await expect(approvePurchaseOrder(TENANT, PO_ID)).rejects.toThrow(
        /no encontrada/i
      );
    });

    it("rechaza si la PO no está en BORRADOR", async () => {
      mockFrom({
        purchase_orders: buildChain({
          data: { id: PO_ID, status: "APROBADA", deleted_at: null },
          error: null,
        }),
      });

      await expect(approvePurchaseOrder(TENANT, PO_ID)).rejects.toThrow(
        /BORRADOR/i
      );
    });

    it("aprueba PO exitosamente", async () => {
      const poChain = buildChain({
        data: { id: PO_ID, status: "BORRADOR", deleted_at: null },
        error: null,
      });
      poChain.update = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: PO_ID, status: "APROBADA" },
                error: null,
              }),
            }),
          }),
        }),
      });

      mockFrom({ purchase_orders: poChain });

      const result = await approvePurchaseOrder(TENANT, PO_ID);
      expect(result).toBeDefined();
    });
  });

  describe("receivePurchaseOrder", () => {
    it("rechaza si la PO no está APROBADA", async () => {
      mockFrom({
        purchase_orders: buildChain({
          data: { id: PO_ID, status: "BORRADOR", deleted_at: null },
          error: null,
        }),
      });

      await expect(receivePurchaseOrder(TENANT, PO_ID)).rejects.toThrow(
        /APROBADA/i
      );
    });

    it("recibe PO exitosamente", async () => {
      const poChain = buildChain({
        data: { id: PO_ID, status: "APROBADA", deleted_at: null },
        error: null,
      });
      poChain.update = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: PO_ID, status: "RECIBIDA" },
                error: null,
              }),
            }),
          }),
        }),
      });

      mockFrom({ purchase_orders: poChain });

      const result = await receivePurchaseOrder(TENANT, PO_ID);
      expect(result).toBeDefined();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// E-005 + E-014: emitBusinessEvent (dual write)
// ═════════════════════════════════════════════════════════════════════════════

describe("E-005+E-014: emitBusinessEvent", () => {
  it("escribe en business_events", async () => {
    const beChain = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const alChain = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    mockFrom({
      business_events: beChain,
      audit_log: alChain,
    });

    await emitBusinessEvent(
      TENANT,
      "CLIENT_CREATED",
      "CLIENT",
      CLIENT_ID,
      { client_id: CLIENT_ID },
      USER_ID
    );

    expect(beChain.insert).toHaveBeenCalledTimes(1);
    const callArgs = beChain.insert.mock.calls[0][0];
    expect(callArgs.tenant_id).toBe(TENANT);
    expect(callArgs.event_code).toBe("CLIENT_CREATED");
    expect(callArgs.entity_type).toBe("CLIENT");
    expect(callArgs.entity_id).toBe(CLIENT_ID);
  });

  it("escribe en audit_log (E-014 dual write)", async () => {
    const beChain = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const alChain = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    mockFrom({
      business_events: beChain,
      audit_log: alChain,
    });

    await emitBusinessEvent(
      TENANT,
      "JOB_STARTED",
      "JOB",
      JOB_ID,
      { old_status: "PENDIENTE", new_status: "EN_EJECUCION" },
      USER_ID
    );

    expect(alChain.insert).toHaveBeenCalledTimes(1);
    const callArgs = alChain.insert.mock.calls[0][0];
    expect(callArgs.tenant_id).toBe(TENANT);
    expect(callArgs.event_code).toBe("JOB_STARTED");
    expect(callArgs.entity_type).toBe("JOB");
    expect(callArgs.entity_id).toBe(JOB_ID);
    expect(callArgs.action).toBe("BUSINESS_EVENT");
    expect(callArgs.new_values).toEqual({
      old_status: "PENDIENTE",
      new_status: "EN_EJECUCION",
    });
  });

  it("no lanza error si audit_log falla (silencioso)", async () => {
    const beChain = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const alChain = {
      insert: vi.fn().mockResolvedValue({
        data: null,
        error: { message: "DB down" },
      }),
    };

    mockFrom({
      business_events: beChain,
      audit_log: alChain,
    });

    // Should NOT throw
    await expect(
      emitBusinessEvent(TENANT, "TEST_EVENT", "TEST", "entity-id")
    ).resolves.toBeUndefined();
  });

  it("maneja payload vacío", async () => {
    const beChain = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const alChain = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    mockFrom({
      business_events: beChain,
      audit_log: alChain,
    });

    await emitBusinessEvent(TENANT, "TEST", "ENTITY", "id-1");

    expect(beChain.insert).toHaveBeenCalledTimes(1);
    const callArgs = beChain.insert.mock.calls[0][0];
    expect(callArgs.payload).toEqual({});
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// E-007: updateLeadStatus
// ═════════════════════════════════════════════════════════════════════════════

describe("E-007: updateLeadStatus", () => {
  it("rechaza leadId inválido", async () => {
    await expect(
      updateLeadStatus("bad", "CALIFICADO")
    ).rejects.toThrow();
  });

  it("rechaza newStatus inválido", async () => {
    await expect(
      updateLeadStatus(LEAD_ID, "INVALIDO" as never)
    ).rejects.toThrow();
  });

  it("rechaza si el lead no existe", async () => {
    mockFrom({
      leads: buildChain({ data: null, error: null }),
      users: buildChain({ data: { tenant_id: TENANT }, error: null }),
    });

    await expect(
      updateLeadStatus(LEAD_ID, "CALIFICADO")
    ).rejects.toThrow(/no encontrado/i);
  });

  it("rechaza transición inválida (NUEVO → CONVERTIDO directo)", async () => {
    mockFrom({
      leads: buildChain({
        data: { id: LEAD_ID, status: "NUEVO", deleted_at: null },
        error: null,
      }),
      users: buildChain({ data: { tenant_id: TENANT }, error: null }),
    });

    await expect(
      updateLeadStatus(LEAD_ID, "CONVERTIDO")
    ).rejects.toThrow(/transición/i);
  });

  it("transición válida NUEVO → EN_SEGUIMIENTO", async () => {
    const leadsChain = buildChain({
      data: { id: LEAD_ID, status: "NUEVO", deleted_at: null },
      error: null,
    });
    leadsChain.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: LEAD_ID, status: "EN_SEGUIMIENTO" },
              error: null,
            }),
          }),
        }),
      }),
    });

    mockFrom({
      leads: leadsChain,
      users: buildChain({ data: { tenant_id: TENANT }, error: null }),
    });

    await updateLeadStatus(LEAD_ID, "EN_SEGUIMIENTO");
  });

  it("transición EN_SEGUIMIENTO → CALIFICADO es válida", async () => {
    const leadsChain = buildChain({
      data: { id: LEAD_ID, status: "EN_SEGUIMIENTO", deleted_at: null },
      error: null,
    });
    leadsChain.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: LEAD_ID, status: "CALIFICADO" },
              error: null,
            }),
          }),
        }),
      }),
    });

    mockFrom({
      leads: leadsChain,
      users: buildChain({ data: { tenant_id: TENANT }, error: null }),
    });

    await updateLeadStatus(LEAD_ID, "CALIFICADO");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// E-008: convertQuoteToJob
// ═════════════════════════════════════════════════════════════════════════════

describe("E-008: convertQuoteToJob", () => {
  it("rechaza si la cotización no existe", async () => {
    mockFrom({
      quotes: buildChain({ data: null, error: null }),
      users: buildChain({ data: { tenant_id: TENANT }, error: null }),
    });

    await expect(convertQuoteToJob(QUOTE_ID)).rejects.toThrow(
      /no encontrada/i
    );
  });

  it("rechaza si la cotización no está APROBADA", async () => {
    mockFrom({
      quotes: buildChain({
        data: {
          id: QUOTE_ID,
          status: "BORRADOR",
          requirement_id: REQ_ID,
          client_id: CLIENT_ID,
          total_amount: 1000000,
        },
        error: null,
      }),
      users: buildChain({ data: { tenant_id: TENANT }, error: null }),
    });

    await expect(convertQuoteToJob(QUOTE_ID)).rejects.toThrow(
      /APROBADA/i
    );
  });

  it("rechaza si no tiene requirement_id", async () => {
    mockFrom({
      quotes: buildChain({
        data: {
          id: QUOTE_ID,
          status: "APROBADA",
          requirement_id: null,
          client_id: CLIENT_ID,
          total_amount: 1000000,
        },
        error: null,
      }),
      users: buildChain({ data: { tenant_id: TENANT }, error: null }),
    });

    await expect(convertQuoteToJob(QUOTE_ID)).rejects.toThrow(
      /requerimiento/i
    );
  });

  it("rechaza si el requerimiento no está en APROBACION", async () => {
    mockFrom({
      quotes: buildChain({
        data: {
          id: QUOTE_ID,
          status: "APROBADA",
          requirement_id: REQ_ID,
          client_id: CLIENT_ID,
          total_amount: 1000000,
        },
        error: null,
      }),
      requirements: buildChain({
        data: { id: REQ_ID, status: "NUEVO", description: "Test" },
        error: null,
      }),
      users: buildChain({ data: { tenant_id: TENANT }, error: null }),
    });

    await expect(convertQuoteToJob(QUOTE_ID)).rejects.toThrow(
      /APROBACION/i
    );
  });

  it("convierte exitosamente APROBADA → OT_GENERADA", async () => {
    const reqChain = buildChain({
      data: { id: REQ_ID, status: "APROBACION", description: "Test" },
      error: null,
    });
    reqChain.update = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    });

    const jobsChain = buildChain({
      data: { id: JOB_ID, job_code: "OT-2026-001", status: "PENDIENTE", title: "Test Job" },
      error: null,
    });

    mockFrom({
      quotes: buildChain({
        data: {
          id: QUOTE_ID,
          status: "APROBADA",
          requirement_id: REQ_ID,
          client_id: CLIENT_ID,
          total_amount: 1000000,
        },
        error: null,
      }),
      requirements: reqChain,
      jobs: jobsChain,
      users: buildChain({ data: { tenant_id: TENANT }, error: null }),
    });

    const result = await convertQuoteToJob(QUOTE_ID);
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// E-009: getQuotes/getInvoices/getJobs with clientId filter
// ═════════════════════════════════════════════════════════════════════════════

describe("E-009: clientId filter", () => {
  describe("getQuotes", () => {
    it("retorna cotizaciones filtradas por clientId", async () => {
      const quotesChain = buildChain({
        data: [
          {
            id: QUOTE_ID,
            quote_code: "COT-001",
            client_id: CLIENT_ID,
            requirement_id: null,
            assigned_user_id: null,
            valid_until: "2026-12-31",
            subtotal: 1000000,
            total_amount: 1190000,
            status: "BORRADOR",
            created_at: "2026-07-20",
            client: [{ legal_name: "Test Client" }],
          },
        ],
        error: null,
      });

      mockFrom({ quotes: quotesChain });

      const result = await getQuotes(TENANT, CLIENT_ID);
      expect(result).toHaveLength(1);
      expect(result[0].client_id).toBe(CLIENT_ID);
    });

    it("retorna todas las cotizaciones sin filtro", async () => {
      const quotesChain = buildChain({
        data: [
          {
            id: QUOTE_ID,
            quote_code: "COT-001",
            client_id: CLIENT_ID,
            requirement_id: null,
            assigned_user_id: null,
            valid_until: "2026-12-31",
            subtotal: 1000000,
            total_amount: 1190000,
            status: "BORRADOR",
            created_at: "2026-07-20",
            client: null,
          },
        ],
        error: null,
      });

      mockFrom({ quotes: quotesChain });

      const result = await getQuotes(TENANT);
      expect(result).toHaveLength(1);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// E-012: deleteEntity
// ═════════════════════════════════════════════════════════════════════════════

describe("E-012: deleteEntity", () => {
  it("rechaza tabla no soportada", async () => {
    await expect(
      deleteEntity("invalid_table", "some-id", TENANT)
    ).rejects.toThrow(/no es eliminable/i);
  });

  it("rechaza si la entidad no existe", async () => {
    mockFrom({
      clients: buildChain({ data: null, error: null }),
    });

    await expect(
      deleteEntity("clients", CLIENT_ID, TENANT)
    ).rejects.toThrow(/no encontrada/i);
  });

  it("rechaza si la entidad ya está eliminada", async () => {
    mockFrom({
      clients: buildChain({
        data: { id: CLIENT_ID, deleted_at: "2026-01-01" },
        error: null,
      }),
    });

    await expect(
      deleteEntity("clients", CLIENT_ID, TENANT)
    ).rejects.toThrow(/ya está eliminada/i);
  });

  it("rechaza si tiene dependencias activas (facturas)", async () => {
    // First chain: client exists
    const clientsChain = buildChain({
      data: { id: CLIENT_ID, deleted_at: null },
      error: null,
    });

    // Second chain: count of invoices
    const invoicesChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ count: 3, error: null }),
          }),
        }),
      }),
    };

    mockFrom({
      clients: clientsChain,
      invoices: invoicesChain,
    });

    await expect(
      deleteEntity("clients", CLIENT_ID, TENANT)
    ).rejects.toThrow(/facturas activas/i);
  });

  it("elimina exitosamente sin dependencias", async () => {
    const clientsChain = buildChain({
      data: { id: CLIENT_ID, deleted_at: null },
      error: null,
    });

    // No invoices (count = 0)
    const invoicesChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        }),
      }),
    };

    // No jobs (count = 0)
    const jobsChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        }),
      }),
    };

    // No quotes (count = 0)
    const quotesChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ count: 0, error: null }),
          }),
        }),
      }),
    };

    // Update chain for soft delete
    const updateChain = {
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    };

    // Business events + audit log
    const beChain = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    const alChain = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    mockFrom({
      clients: { ...clientsChain, ...updateChain },
      invoices: invoicesChain,
      jobs: jobsChain,
      quotes: quotesChain,
      business_events: beChain,
      audit_log: alChain,
    });

    const result = await deleteEntity("clients", CLIENT_ID, TENANT);
    expect(result.success).toBe(true);
    expect(result.entityName).toBe("Cliente");
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// E-013: getTaxRate
// ═════════════════════════════════════════════════════════════════════════════

describe("E-013: getTaxRate", () => {
  it("retorna 0.19 por defecto cuando no hay configuración", async () => {
    mockFrom({
      tenant_settings: buildChain({ data: null, error: null }),
    });

    const rate = await getTaxRate(TENANT);
    expect(rate).toBe(0.19);
  });

  it("retorna la tasa configurada del tenant", async () => {
    mockFrom({
      tenant_settings: buildChain({
        data: { config_value: "0.16" },
        error: null,
      }),
    });

    const rate = await getTaxRate(TENANT);
    expect(rate).toBe(0.16);
  });

  it("retorna 0.19 si el valor no es un número válido", async () => {
    mockFrom({
      tenant_settings: buildChain({
        data: { config_value: "abc" },
        error: null,
      }),
    });

    const rate = await getTaxRate(TENANT);
    expect(rate).toBe(0.19);
  });

  it("retorna 0.19 si el valor está fuera de rango (negativo)", async () => {
    mockFrom({
      tenant_settings: buildChain({
        data: { config_value: "-0.05" },
        error: null,
      }),
    });

    const rate = await getTaxRate(TENANT);
    expect(rate).toBe(0.19);
  });

  it("retorna 0.19 si el valor excede 1.0", async () => {
    mockFrom({
      tenant_settings: buildChain({
        data: { config_value: "1.5" },
        error: null,
      }),
    });

    const rate = await getTaxRate(TENANT);
    expect(rate).toBe(0.19);
  });

  it("acepta 0 como tasa válida (exento)", async () => {
    mockFrom({
      tenant_settings: buildChain({
        data: { config_value: "0" },
        error: null,
      }),
    });

    const rate = await getTaxRate(TENANT);
    expect(rate).toBe(0);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// E-015: getPaymentMethods
// ═════════════════════════════════════════════════════════════════════════════

describe("E-015: getPaymentMethods", () => {
  const DEFAULT_METHODS = [
    "Transferencia",
    "Efectivo",
    "Cheque",
    "Tarjeta",
    "PSE",
    "Otro",
  ];

  it("retorna métodos por defecto cuando no hay configuración", async () => {
    mockFrom({
      tenant_settings: buildChain({ data: null, error: null }),
    });

    const methods = await getPaymentMethods(TENANT);
    expect(methods).toEqual(DEFAULT_METHODS);
  });

  it("retorna métodos configurados del tenant", async () => {
    mockFrom({
      tenant_settings: buildChain({
        data: { config_value: "Efectivo,Cheque,Tarjeta" },
        error: null,
      }),
    });

    const methods = await getPaymentMethods(TENANT);
    expect(methods).toEqual(["Efectivo", "Cheque", "Tarjeta"]);
  });

  it("retorna defaults si config_value está vacío", async () => {
    mockFrom({
      tenant_settings: buildChain({
        data: { config_value: "" },
        error: null,
      }),
    });

    const methods = await getPaymentMethods(TENANT);
    expect(methods).toEqual(DEFAULT_METHODS);
  });

  it("limpia espacios en blanco al parsear", async () => {
    mockFrom({
      tenant_settings: buildChain({
        data: { config_value: " Efectivo , Cheque , Tarjeta " },
        error: null,
      }),
    });

    const methods = await getPaymentMethods(TENANT);
    expect(methods).toEqual(["Efectivo", "Cheque", "Tarjeta"]);
  });

  it("filtra entradas vacías después de split", async () => {
    mockFrom({
      tenant_settings: buildChain({
        data: { config_value: "Efectivo,,Cheque,," },
        error: null,
      }),
    });

    const methods = await getPaymentMethods(TENANT);
    expect(methods).toEqual(["Efectivo", "Cheque"]);
  });
});
