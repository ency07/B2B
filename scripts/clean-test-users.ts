/**
 * LIMPIEZA DE USUARIOS DE PRUEBA (whitelabel).
 *
 * Borra todos los usuarios creados por scripts/seed-test-users.ts:
 *  - Borra de public.user_roles (cascade deberia limpiar)
 *  - Borra de public.users
 *  - Borra de auth.users
 *  - Borra los clients de prueba (cualquier client con email *@test.aeromax.co
 *    o *@test.wl.local, ya que el seed cambio de dominio)
 *  - Borra los roles de prueba que este script creo (los que no existian)
 *
 * ATENCION: solo borra usuarios con email *@test.aeromax.co o *@test.wl.local.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ACME_TENANT_ID = "a0000000-0000-0000-0000-000000000000";
const TEST_EMAIL_PATTERN = /@(test\.aeromax\.co|test\.wl\.local)$/;
const TEST_CLIENT_CODES = [
  "CLI-TEST-1",
  "CLI-TEST-2",
  "CLI-TEST-3",
  // Codigos auto-generados por el trigger del seed (los duplicados).
  "CLI-000027", "CLI-000028", "CLI-000029",
  "CLI-000030", "CLI-000031", "CLI-000032",
];

async function clean() {
  console.log("=== LIMPIEZA DE USUARIOS DE PRUEBA ===");

  // 1. Obtener todos los auth users de prueba.
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 500 });
  const testAuthUsers = list.users.filter((u) => u.email && TEST_EMAIL_PATTERN.test(u.email));
  console.log(`Auth users de prueba: ${testAuthUsers.length}`);

  // 2. Obtener las filas de public.users correspondientes.
  const authIds = testAuthUsers.map((u) => u.id);
  const { data: publicUsers } = await admin
    .from("users")
    .select("id, auth_user_id, email")
    .in("auth_user_id", authIds);
  const publicUserIds = (publicUsers || []).map((u) => u.id);
  console.log(`Filas en public.users: ${publicUserIds.length}`);

  // 3. Borrar user_roles (cascade automatico).
  if (publicUserIds.length > 0) {
    const { error: urErr } = await admin
      .from("user_roles")
      .delete()
      .in("user_id", publicUserIds);
    if (urErr) console.error("  Error borrando user_roles:", urErr.message);
    else console.log("  user_roles borradas");
  }

  // 4. Borrar filas de public.users.
  if (authIds.length > 0) {
    const { error: uErr } = await admin
      .from("users")
      .delete()
      .in("auth_user_id", authIds);
    if (uErr) console.error("  Error borrando users:", uErr.message);
    else console.log("  public.users borradas");
  }

  // 5. Borrar clientes de prueba (cualquiera con email *@test.*).
  // Borra por email para no depender de client_code auto-generados.
  const { error: cErr } = await admin
    .from("clients")
    .delete()
    .eq("tenant_id", ACME_TENANT_ID)
    .or("email.like.%@test.aeromax.co,email.like.%@test.wl.local");
  if (cErr) console.error("  Error borrando clients:", cErr.message);
  else console.log("  clients de prueba borrados");

  // 6. Borrar auth users.
  for (const u of testAuthUsers) {
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (error) console.error(`  Error borrando auth ${u.email}:`, error.message);
  }
  console.log("  auth users borrados");

  // 7. Borrar roles de prueba (los que tienen descripcion "Rol de prueba: ...").
  const { data: testRoles } = await admin
    .from("roles")
    .select("id, role_code, description")
    .eq("tenant_id", ACME_TENANT_ID);
  const rolesToDelete = (testRoles || []).filter(
    (r) => r.description && r.description.startsWith("Rol de prueba:")
  );
  if (rolesToDelete.length > 0) {
    const { error: rErr } = await admin
      .from("roles")
      .delete()
      .in(
        "id",
        rolesToDelete.map((r) => r.id)
      );
    if (rErr) console.error("  Error borrando roles:", rErr.message);
    else console.log(`  ${rolesToDelete.length} roles de prueba borrados`);
  }

  console.log("");
  console.log("Limpieza completa.");
}

clean().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
