import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Multi-tenancy / RLS isolation", () => {
  const migrationPaths = [
    "supabase/migrations/20260617000000_init_core.sql",
    "supabase/migrations/20260617000011_website_core.sql",
  ];

  let sqlContents: string[] = [];

  beforeAll(() => {
    sqlContents = migrationPaths.map((p) => {
      const fullPath = path.join(__dirname, "..", "..", "..", p);
      expect(fs.existsSync(fullPath)).toBe(true);
      return fs.readFileSync(fullPath, "utf8");
    });
  });

  it("should have RLS enabled in init migration", () => {
    const hasRLS = sqlContents.some((sql) =>
      sql.includes("ENABLE ROW LEVEL SECURITY")
    );
    expect(hasRLS).toBe(true);
  });

  it("should define tenants table", () => {
    const hasTenants = sqlContents.some((sql) =>
      sql.includes("CREATE TABLE tenants")
    );
    expect(hasTenants).toBe(true);
  });

  it("should define users table", () => {
    const hasUsers = sqlContents.some((sql) =>
      sql.includes("CREATE TABLE users")
    );
    expect(hasUsers).toBe(true);
  });

  it("should have audit triggers", () => {
    const hasTriggers = sqlContents.some((sql) =>
      sql.includes("CREATE TRIGGER")
    );
    expect(hasTriggers).toBe(true);
  });

  it("init core migration should exist", () => {
    const fullPath = path.join(
      __dirname,
      "..",
      "..",
      "..",
      "supabase/migrations/20260617000000_init_core.sql"
    );
    expect(fs.existsSync(fullPath)).toBe(true);
  });
});
