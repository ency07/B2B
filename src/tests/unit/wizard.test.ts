import { describe, it, expect } from "vitest";

describe("Wizard flow", () => {
  it("should pass basic smoke test for module imports", async () => {
    const wizardModule = await import("@/web/actions/wizard");
    expect(wizardModule).toBeDefined();
    expect(wizardModule.submitWizardData).toBeInstanceOf(Function);
  });

  it("should pass basic smoke test for leads module", async () => {
    const leadsModule = await import("@/web/actions/leads");
    expect(leadsModule).toBeDefined();
  });
});
