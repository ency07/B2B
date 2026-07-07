/**
 * SEED DE USUARIOS DE PRUEBA (temporal).
 *
 * Crea usuarios en Supabase Auth + filas en public.users + asigna roles
 * en public.user_roles. Todos los datos son de PRUEBA y deben borrarse
 * despues de las pruebas con scripts/clean-test-users.ts.
 *
 * Credenciales que crea (todas con password TestRole2026!):
 * Whitelabel: dominio @wl.local, sin marcas hardcoded.
 *   test.superadmin@wl.local        -> SUPER_ADMIN
 *   test.director@wl.local          -> GERENTE_GENERAL
 *   test.director.financiero@wl.local -> DIRECTOR_FINANCIERO
 *   test.comercial@wl.local         -> DIRECTOR_COMERCIAL
 *   test.operaciones@wl.local       -> DIRECTOR_OPERACIONES
 *   test.tecnico@wl.local           -> TECNICO_CAMPO
 *   test.almacenista@wl.local       -> ALMACENISTA
 *   test.auditor@wl.local           -> AUDITOR
 *
 * Portal (rol CLIENTE):
 *   test.cliente1@wl.local          -> CLIENTE
 *   test.cliente2@wl.local          -> CLIENTE
 *   test.cliente3@wl.local          -> CLIENTE
 *
 * (Los emails usan dominio whitelabel @wl.local, sin marca especifica.)
 *
 * Limitaciones conocidas:
 *  - El portal cliente (/portal) ya tiene auth + per-client filtering,
 *    pero los clients de prueba requieren assigned_user_id vinculado
 *    al test user (lo cual este script hace automaticamente).
 *    Para que sea trazable por cliente, hace falta anadir auth al portal
 *    y filtrar data por client_id (no implementado en este script).
 *  - Los roles per-tenant que ya existen en el seed (ADMIN_EMPRESA) se
 *    reusan. Los roles faltantes (DIRECTOR_FINANCIERO, DIRECTOR_COMERCIAL,
 *    EJECUTIVO_COMERCIAL, INGENIERO_COMERCIAL, JEFE_PROYECTOS,
 *    JEFE_MANTENIMIENTO, JEFE_INVENTARIO, CLIENTE) se crean en este
 *    script si no existen.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const password = "TestRole2026!";

// Tenant ACME (el unico tenant sembrado con datos).
const ACME_TENANT_ID = "a0000000-0000-0000-0000-000000000000";
const ACME_ADMIN_USER_ID = "a9000000-0000-0000-0000-000000000000";

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type RoleCode =
  | "SUPER_ADMIN"
  | "ADMIN_EMPRESA"
  | "GERENTE_GENERAL"
  | "DIRECTOR_FINANCIERO"
  | "DIRECTOR_COMERCIAL"
  | "EJECUTIVO_COMERCIAL"
  | "INGENIERO_COMERCIAL"
  | "DIRECTOR_OPERACIONES"
  | "JEFE_PROYECTOS"
  | "TECNICO_CAMPO"
  | "JEFE_MANTENIMIENTO"
  | "ALMACENISTA"
  | "JEFE_INVENTARIO"
  | "AUDITOR"
  | "CLIENTE";

interface TestUser {
  email: string;
  firstName: string;
  lastName: string;
  role: RoleCode;
  phone?: string;
  // Para CLIENTE: clientCode para asociar a un cliente del seed.
  clientCode?: string;
}

const TEST_USERS: TestUser[] = [
  // === ERP roles (whitelabel: dominio generico, sin marca) ===
  { email: "test.superadmin@wl.local", firstName: "Test", lastName: "SuperAdmin", role: "SUPER_ADMIN" },
  { email: "test.director@wl.local", firstName: "Test", lastName: "Director", role: "GERENTE_GENERAL" },
  { email: "test.director.financiero@wl.local", firstName: "Test", lastName: "DirectorFinanciero", role: "DIRECTOR_FINANCIERO" },
  { email: "test.comercial@wl.local", firstName: "Test", lastName: "Comercial", role: "DIRECTOR_COMERCIAL" },
  { email: "test.operaciones@wl.local", firstName: "Test", lastName: "Operaciones", role: "DIRECTOR_OPERACIONES" },
  { email: "test.tecnico@wl.local", firstName: "Test", lastName: "Tecnico", role: "TECNICO_CAMPO" },
  { email: "test.almacenista@wl.local", firstName: "Test", lastName: "Almacenista", role: "ALMACENISTA" },
  { email: "test.auditor@wl.local", firstName: "Test", lastName: "Auditor", role: "AUDITOR" },

  // === Portal Cliente (3 clients, whitelabel) ===
  {
    email: "test.cliente1@wl.local",
    firstName: "Cliente",
    lastName: "Uno",
    role: "CLIENTE",
    clientCode: "CLI-TEST-1",
  },
  {
    email: "test.cliente2@wl.local",
    firstName: "Cliente",
    lastName: "Dos",
    role: "CLIENTE",
    clientCode: "CLI-TEST-2",
  },
  {
    email: "test.cliente3@wl.local",
    firstName: "Cliente",
    lastName: "Tres",
    role: "CLIENTE",
    clientCode: "CLI-TEST-3",
  },
];

async function ensureRole(
  roleCode: RoleCode,
  description: string
): Promise<string | null> {
  // Buscar si ya existe (los globales no tienen tenant).
  const { data: existing } = await admin
    .from("roles")
    .select("id")
    .eq("role_code", roleCode)
    .is("tenant_id", null)
    .maybeSingle();
  if (existing) return existing.id;

  // Crear (los CLIENTE y roles tenant-specific se crean con tenant ACME).
  const isClient = roleCode === "CLIENTE";
  const { data, error } = await admin
    .from("roles")
    .insert({
      tenant_id: isClient ? ACME_TENANT_ID : null,
      role_code: roleCode,
      name: description,
      description: `Rol de prueba: ${roleCode}`,
      status: "Activo",
    })
    .select("id")
    .single();
  if (error) {
    console.error(`  Error creando rol ${roleCode}:`, error.message);
    return null;
  }
  return data.id;
}

async function ensureClient(
  code: string,
  legalName: string,
  assignedUserId: string
): Promise<string | null> {
  const taxId = `TEST-${code}`;
  const { data: existing } = await admin
    .from("clients")
    .select("id")
    .eq("tax_id", taxId)
    .eq("tenant_id", ACME_TENANT_ID)
    .maybeSingle();
  if (existing) {
    // Update assigned_user_id to the CLIENTE user
    const { error: updateErr } = await admin
      .from("clients")
      .update({ assigned_user_id: assignedUserId })
      .eq("id", existing.id);
    if (updateErr) {
      console.error(`  Error actualizando cliente ${code}:`, updateErr.message);
    }
    return existing.id;
  }

  const { data, error } = await admin
    .from("clients")
    .insert({
      tenant_id: ACME_TENANT_ID,
      client_code: code,
      client_type: "Empresa",
      legal_name: legalName,
      tax_id: taxId,
      industry: "Test",
      country: "Colombia",
      assigned_user_id: assignedUserId,
      email: `${code.toLowerCase()}@test.wl.local`,
      status: "ACTIVO",
    })
    .select("id")
    .single();
  if (error) {
    console.error(`  Error creando cliente ${code}:`, error.message);
    return null;
  }
  return data.id;
}

async function ensureUser(
  email: string,
  firstName: string,
  lastName: string,
  phone?: string
): Promise<string | null> {
  // Buscar si ya existe la fila en public.users.
  const { data: existing } = await admin
    .from("users")
    .select("id, auth_user_id")
    .eq("email", email)
    .maybeSingle();
  if (existing) return existing.id;

  // Buscar o crear en Supabase Auth.
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 200 });
  const existingAuth = list.users.find((u) => u.email === email);
  let authUserId: string;
  if (existingAuth) {
    authUserId = existingAuth.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });
    if (error || !data.user) {
      console.error(`  Error creando auth user ${email}:`, error?.message);
      return null;
    }
    authUserId = data.user.id;
  }

  // Crear fila en public.users.
  const { data: userRow, error: userErr } = await admin
    .from("users")
    .insert({
      tenant_id: ACME_TENANT_ID,
      auth_user_id: authUserId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || null,
    })
    .select("id")
    .single();
  if (userErr || !userRow) {
    console.error(`  Error creando fila de user ${email}:`, userErr?.message);
    return null;
  }

  return userRow.id;
}

async function assignRole(userId: string, roleId: string): Promise<boolean> {
  const { error } = await admin.from("user_roles").insert({
    tenant_id: ACME_TENANT_ID,
    user_id: userId,
    role_id: roleId,
  });
  if (error && error.code !== "23505") {
    console.error(`  Error asignando rol:`, error.message);
    return false;
  }
  return true;
}

async function main() {
  console.log("=== SEED DE USUARIOS DE PRUEBA ===");
  console.log(`Tenant: ACME (${ACME_TENANT_ID})`);
  console.log("");

  for (const u of TEST_USERS) {
    console.log(`-> ${u.email} (${u.role})`);

    // Asegurar rol.
    const roleId = await ensureRole(u.role, u.role.replace(/_/g, " "));
    if (!roleId) continue;

    // Asegurar usuario (auth + users).
    const userId = await ensureUser(u.email, u.firstName, u.lastName, u.phone);
    if (!userId) continue;

    // Para CLIENTE: asegurar cliente en clients y asociarle el userId de su cuenta de usuario.
    if (u.role === "CLIENTE" && u.clientCode) {
      await ensureClient(u.clientCode, `${u.firstName} ${u.lastName} Test S.A.`, userId);
    }

    // Asignar rol.
    const assigned = await assignRole(userId, roleId);
    if (assigned) {
      console.log(`   OK (userId=${userId}, roleId=${roleId})`);
    }
  }

  console.log("");
  console.log("=== CREDENCIALES DE PRUEBA ===");
  console.log(`Password unico: ${password}`);
  console.log("");
  for (const u of TEST_USERS) {
    console.log(`  ${u.email.padEnd(45)} -> ${u.role}`);
  }
  console.log("");
  console.log("Para borrar todo: npm run seed:test:clean");
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
