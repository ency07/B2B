/**
 * Script para configurar archivos .env por entorno.
 *
 * Uso:
 *   npx ts-node scripts/setup-env.ts dev        # Copia .env.local
 *   npx ts-node scripts/setup-env.ts staging    # Copia .env.staging
 *   npx ts-node scripts/setup-env.ts production # Copia .env.production
 *
 * También se puede usar npm run setup-env -- dev
 */

import { copyFileSync, existsSync, writeFileSync } from "fs";
import { resolve } from "path";

const ENV_MAP: Record<string, string> = {
  dev: ".env.local",
  staging: ".env.staging",
  production: ".env.production",
  test: ".env.test",
};

const REQUIRED_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
];

const target = process.argv[2]?.toLowerCase();

if (!target || !ENV_MAP[target]) {
  console.error(`Uso: npx ts-node scripts/setup-env.ts <entorno>`);
  console.error(`Entornos válidos: ${Object.keys(ENV_MAP).join(", ")}`);
  process.exit(1);
}

const envFile = ENV_MAP[target];
const destPath = resolve(__dirname, "..", ".env.local");
const srcPath = resolve(__dirname, "..", envFile);

if (existsSync(srcPath)) {
  copyFileSync(srcPath, destPath);
  console.log(`[setup-env] Copiado ${envFile} → .env.local`);
} else {
  console.warn(`[setup-env] ${envFile} no existe. Creando .env.local desde .env.example`);
  const examplePath = resolve(__dirname, "..", ".env.example");
  if (!existsSync(examplePath)) {
    console.error("[setup-env] .env.example tampoco existe. Abortando.");
    process.exit(1);
  }
  copyFileSync(examplePath, destPath);
  console.log(`[setup-env] Copiado .env.example → .env.local`);
  console.log("[setup-env] EDIT .env.local con los valores reales del entorno.");
}

const destContent = require("fs").readFileSync(destPath, "utf-8");
const missing = REQUIRED_KEYS.filter(
  (key) => !destContent.includes(`${key}=`) || destContent.includes(`${key}=https://`)
);

if (missing.length > 0) {
  console.warn(`[setup-env] ⚠ Faltan o tienen valores placeholder: ${missing.join(", ")}`);
  console.warn("[setup-env]    Revisa .env.local y completa las variables.");
} else {
  console.log("[setup-env] ✓ Variables requeridas presentes.");
}
