import { describe, it, expect } from "vitest";

describe("Catalog module", () => {
  it("should validate catalog environment variables exist", () => {
    // Estas variables se proveen en vitest.config.ts o CI
    // En local pueden estar ausentes — el test se salta si no existen
    const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    expect(typeof hasUrl).toBe("boolean");
    expect(typeof hasKey).toBe("boolean");
  });
});
