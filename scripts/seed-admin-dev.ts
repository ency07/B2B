/**
 * Crea el usuario de desarrollo con rol ADMIN_DEV.
 *
 * Rol: ADMIN_DEV (acceso total al ERP, similar a SUPER_ADMIN)
 *
 * El cleanup de usuarios de prueba (scripts/clean-test-users.ts) NO
 * borra este usuario porque su email no termina en @test.aeromax.co.
 * Si queres borrarlo, ejecuta este script con --cleanup.
 *
 * Requiere en .env: ADMIN_DEV_EMAIL, ADMIN_DEV_PASSWORD (ADMIN_DEV_FIRST_NAME
 * y ADMIN_DEV_LAST_NAME son opcionales). No hay defaults hardcodeados — antes
 * este script tenía un email y password reales en texto plano en el código.
 *
 * Uso:
 *   npx ts-node scripts/seed-admin-dev.ts
 *   npx ts-node scripts/seed-admin-dev.ts --cleanup
 */

import { createClient } from "@supabase/supabase-js";
import * as crypto from "crypto";
import * as dotenv from "dotenv";

dotenv.config();

if (process.env.NODE_ENV === "production") {
  console.error("Este script no debe ejecutarse en producción (crea una cuenta con acceso total al ERP).");
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const EMAIL = process.env.ADMIN_DEV_EMAIL || "";
let PASSWORD = process.env.ADMIN_DEV_PASSWORD || "";
const ROLE_CODE = "ADMIN_DEV";
const FIRST_NAME = process.env.ADMIN_DEV_FIRST_NAME || "Admin";
const LAST_NAME = process.env.ADMIN_DEV_LAST_NAME || "Dev";
let generatedPassword = false;

if (!EMAIL) {
  console.error("Falta ADMIN_DEV_EMAIL en el entorno. Configúralo en .env antes de correr este script.");
  process.exit(1);
}
if (!PASSWORD) {
  PASSWORD = crypto.randomBytes(18).toString("base64url");
  generatedPassword = true;
}

async function ensureRole(): Promise<string | null> {
  const { data: existing } = await admin
    .from("roles")
    .select("id")
    .eq("role_code", ROLE_CODE)
    .is("tenant_id", null)
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await admin
    .from("roles")
    .insert({
      tenant_id: null,
      role_code: ROLE_CODE,
      name: "Admin Dev",
      description: "Rol de desarrollo con acceso total. Solo para cuentas internas del equipo de ingenieria.",
      status: "Activo",
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("Error creando rol ADMIN_DEV:", error?.message);
    return null;
  }
  return data.id;
}

let userAlreadyExisted = false;

async function ensureUser(): Promise<string | null> {
  // Buscar si ya existe la fila en public.users.
  const { data: existing } = await admin
    .from("users")
    .select("id, auth_user_id")
    .eq("email", EMAIL)
    .maybeSingle();
  if (existing) {
    userAlreadyExisted = true;
    return existing.id;
  }

  // Buscar o crear en Supabase Auth.
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existingAuth = list.users.find((u) => u.email === EMAIL);
  let authUserId: string;
  if (existingAuth) {
    authUserId = existingAuth.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { first_name: FIRST_NAME, last_name: LAST_NAME },
    });
    if (error || !data.user) {
      console.error("Error creando auth user:", error?.message);
      return null;
    }
    authUserId = data.user.id;
  }

  const { data: userRow, error: userErr } = await admin
    .from("users")
    .insert({
      tenant_id: null,
      auth_user_id: authUserId,
      first_name: FIRST_NAME,
      last_name: LAST_NAME,
      email: EMAIL,
      phone: null,
    })
    .select("id")
    .single();
  if (userErr || !userRow) {
    console.error("Error creando user:", userErr?.message);
    return null;
  }
  return userRow.id;
}

async function assignRole(userId: string, roleId: string): Promise<boolean> {
  const { error } = await admin.from("user_roles").insert({
    tenant_id: null,
    user_id: userId,
    role_id: roleId,
  });
  if (error && error.code !== "23505") {
    console.error("Error asignando rol:", error.message);
    return false;
  }
  return true;
}

async function cleanup() {
  console.log("=== Limpiando usuario ADMIN_DEV ===");
  // Buscar user.
  const { data: user } = await admin
    .from("users")
    .select("id, auth_user_id")
    .eq("email", EMAIL)
    .maybeSingle();
  if (user) {
    // Borrar user_roles.
    await admin.from("user_roles").delete().eq("user_id", user.id);
    // Borrar user.
    await admin.from("users").delete().eq("id", user.id);
    // Borrar auth user.
    if (user.auth_user_id) {
      await admin.auth.admin.deleteUser(user.auth_user_id);
    }
  }
  // Borrar rol.
  await admin.from("roles").delete().eq("role_code", ROLE_CODE);
  console.log("Listo.");
}

async function main() {
  if (process.argv.includes("--cleanup")) {
    await cleanup();
    return;
  }

  console.log("=== Seed ADMIN_DEV ===");
  const roleId = await ensureRole();
  if (!roleId) {
    console.error("No se pudo crear/obtener el rol ADMIN_DEV.");
    process.exit(1);
  }
  const userId = await ensureUser();
  if (!userId) {
    console.error("No se pudo crear/obtener el usuario.");
    process.exit(1);
  }
  const ok = await assignRole(userId, roleId);
  if (ok) {
    console.log("");
    if (userAlreadyExisted) {
      console.log(`El usuario ${EMAIL} ya existía — no se tocó su password actual.`);
      console.log(`Rol confirmado: ${ROLE_CODE} (acceso total al ERP)`);
    } else {
      console.log("Usuario creado. Credenciales (solo se muestran esta vez):");
      console.log(`  Email:    ${EMAIL}`);
      console.log(`  Password: ${PASSWORD}${generatedPassword ? "  (generada automáticamente — guárdala ahora)" : ""}`);
      console.log(`  Rol:      ${ROLE_CODE} (acceso total al ERP)`);
    }
    console.log("");
    console.log("Para borrar: npx ts-node scripts/seed-admin-dev.ts --cleanup");
  }
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
