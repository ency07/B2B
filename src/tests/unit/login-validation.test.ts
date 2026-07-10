import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginSchema } from "@/lib/utils/auth-schemas";

// ─── Mocks ────────────────────────────────────────────────────────────────────
// El mock debe estar en el scope del módulo para que vi.mock() lo hoise.
const mockRpc = vi.fn();

vi.mock("@/platform/auth/clients", () => ({
  getSupabaseAdmin: () => ({ rpc: mockRpc }),
  supabaseAdmin: { rpc: mockRpc },
}));

// ─── Zod schema ───────────────────────────────────────────────────────────────

describe("loginSchema — validación de entrada", () => {
  it("acepta credenciales válidas", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "password123" });
    expect(result.success).toBe(true);
  });

  it("rechaza email con formato inválido", () => {
    const result = loginSchema.safeParse({ email: "no-es-email", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rechaza email vacío", () => {
    const result = loginSchema.safeParse({ email: "", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rechaza email > 255 caracteres", () => {
    const email = "a".repeat(250) + "@x.com"; // 257 chars
    const result = loginSchema.safeParse({ email, password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rechaza password < 8 caracteres", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "short" });
    expect(result.success).toBe(false);
  });

  it("acepta password de exactamente 8 caracteres (límite inferior)", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "12345678" });
    expect(result.success).toBe(true);
  });

  it("rechaza password > 128 caracteres", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "x".repeat(129) });
    expect(result.success).toBe(false);
  });

  it("acepta password de exactamente 128 caracteres (límite superior)", () => {
    const result = loginSchema.safeParse({ email: "user@example.com", password: "x".repeat(128) });
    expect(result.success).toBe(true);
  });
});

// ─── Rate limiter ─────────────────────────────────────────────────────────────

describe("checkLoginRateLimit — lógica de bloqueo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("permite el intento cuando count = 1 (primer intento)", async () => {
    mockRpc.mockResolvedValueOnce({ data: 1, error: null });
    const { checkLoginRateLimit } = await import("@/lib/utils/rate-limiter");
    const { allowed } = await checkLoginRateLimit("user@test.com", "erp");
    expect(allowed).toBe(true);
  });

  it("permite el intento cuando count = 5 (5to — límite exacto)", async () => {
    mockRpc.mockResolvedValueOnce({ data: 5, error: null });
    const { checkLoginRateLimit } = await import("@/lib/utils/rate-limiter");
    const { allowed } = await checkLoginRateLimit("user@test.com", "erp");
    expect(allowed).toBe(true);
  });

  it("bloquea cuando count = 6 (6to intento — excede el límite de 5)", async () => {
    mockRpc.mockResolvedValueOnce({ data: 6, error: null });
    const { checkLoginRateLimit } = await import("@/lib/utils/rate-limiter");
    const { allowed } = await checkLoginRateLimit("user@test.com", "erp");
    expect(allowed).toBe(false);
  });

  it("llama al RPC con el identificador correcto para dominio erp", async () => {
    mockRpc.mockResolvedValueOnce({ data: 1, error: null });
    const { checkLoginRateLimit } = await import("@/lib/utils/rate-limiter");
    await checkLoginRateLimit("User@Test.COM", "erp");

    expect(mockRpc).toHaveBeenCalledOnce();
    const [fnName, args] = mockRpc.mock.calls[0];
    expect(fnName).toBe("check_and_increment_rate_limit");
    // El email debe normalizarse a minúsculas antes de construir el identificador
    expect(args.p_identifier).toBe("login:erp:user@test.com");
  });

  it("bloquea (fail-closed) cuando el RPC retorna un error de BD", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "connection timeout" } });
    const { checkLoginRateLimit } = await import("@/lib/utils/rate-limiter");
    const { allowed } = await checkLoginRateLimit("user@test.com", "portal");
    expect(allowed).toBe(false);
  });

  it("bloquea (fail-closed) cuando el RPC lanza una excepción", async () => {
    mockRpc.mockRejectedValueOnce(new Error("network error"));
    const { checkLoginRateLimit } = await import("@/lib/utils/rate-limiter");
    const { allowed } = await checkLoginRateLimit("user@test.com", "portal");
    expect(allowed).toBe(false);
  });
});
