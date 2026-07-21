import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/tests/**/*.test.ts", "scripts/*.spec.ts"],
    exclude: ["node_modules", "src/tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/web/actions/**", "src/lib/**", "src/utils/**", "src/erp/actions/**"],
      exclude: ["src/tests/**", "node_modules"],
      thresholds: {
        statements: 40,
        branches: 30,
        functions: 40,
        lines: 40,
      },
    },
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
      SUPABASE_URL: "https://placeholder.supabase.co",
      SUPABASE_ANON_KEY: "placeholder-anon-key",
      SUPABASE_SERVICE_ROLE_KEY: "placeholder-service-key",
      SUPPRESS_TENANT_WARNINGS: "true",
    },
    setupFiles: [],
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@/web": path.resolve(__dirname, "src/web"),
      "@/lib": path.resolve(__dirname, "src/lib"),
      "@/utils": path.resolve(__dirname, "src/utils"),
      "@/platform": path.resolve(__dirname, "src/platform"),
    },
  },
});
