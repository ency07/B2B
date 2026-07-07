/**
 * Verificacion de roles y usuarios del sistema.
 *
 * Lista todos los roles, usuarios y asignaciones, mostrando su estado
 * (activo/inactivo, tenant, etc.). Solo lectura: NO modifica nada.
 *
 * Uso: npx ts-node scripts/list-users-roles.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function fmt(s: string | null | undefined, width = 30): string {
  if (!s) return "".padEnd(width);
  return s.length > width ? s.substring(0, width - 1) + "…" : s.padEnd(width);
}

async function main() {
  console.log("============================================================");
  console.log(" AUDITORIA DE ROLES Y USUARIOS DEL SISTEMA");
  console.log(" Tenant: " + (process.env.SUPABASE_URL || "acme"));
  console.log("============================================================\n");

  // 1. ROLES
  const { data: roles, error: rolesErr } = await admin
    .from("roles")
    .select("id, role_code, name, description, status, tenant_id")
    .order("role_code", { ascending: true });

  if (rolesErr) {
    console.error("Error listando roles:", rolesErr.message);
  } else {
    console.log(`--- ROLES (${roles?.length || 0}) ---`);
    console.log(
      "  " +
        fmt("ROLE_CODE", 18) +
        fmt("NAME", 28) +
        fmt("TENANT", 10) +
        "STATUS"
    );
    for (const r of roles || []) {
      const tenant = r.tenant_id ? "tenant" : "global";
      const status = r.status === "Activo" ? "ACTIVO" : "INACTIVO";
      console.log(
        "  " +
          fmt(r.role_code, 18) +
          fmt(r.name, 28) +
          fmt(tenant, 10) +
          status
      );
    }
    console.log("");
  }

  // 2. USERS
  const { data: users, error: usersErr } = await admin
    .from("users")
    .select("id, first_name, last_name, email, status, tenant_id, auth_user_id, created_at")
    .order("email", { ascending: true });

  if (usersErr) {
    console.error("Error listando users:", usersErr.message);
  } else {
    console.log(`--- USERS (${users?.length || 0}) ---`);
    console.log(
      "  " +
        fmt("EMAIL", 36) +
        fmt("NAME", 22) +
        fmt("TENANT", 10) +
        "STATUS"
    );
    for (const u of users || []) {
      const tenant = u.tenant_id ? "tenant" : "global";
      const status = u.status === "Activo" ? "ACTIVO" : "INACTIVO";
      const name = `${u.first_name} ${u.last_name}`;
      console.log(
        "  " + fmt(u.email, 36) + fmt(name, 22) + fmt(tenant, 10) + status
      );
    }
    console.log("");
  }

  // 3. ASIGNACIONES DE ROL
  // La tabla user_roles tiene 2 FKs a users (user_id y assigned_by),
  // por eso hay que usar !inner con la foreign key explicita.
  const { data: assignments, error: assignErr } = await admin
    .from("user_roles")
    .select(
      "user_id, role_id, assigned_at, user_roles_user_id_fkey:users!user_roles_user_id_fkey(email), roles(role_code, name)"
    )
    .order("assigned_at", { ascending: false });

  if (assignErr) {
    console.error("Error listando asignaciones:", assignErr.message);
  } else {
    console.log(`--- ASIGNACIONES (${assignments?.length || 0}) ---`);
    console.log(
      "  " +
        fmt("EMAIL", 36) +
        fmt("ROLE", 18) +
        "ASSIGNED AT"
    );
    for (const a of assignments || []) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userData = (a as any).users;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roleData = (a as any).roles;
      const email = userData?.email || "?";
      const roleCode = roleData?.role_code || "?";
      const at = a.assigned_at ? a.assigned_at.substring(0, 10) : "?";
      console.log("  " + fmt(email, 36) + fmt(roleCode, 18) + at);
    }
    console.log("");
  }

  // 4. AUTH USERS (Supabase)
  const { data: authData, error: authErr } = await admin.auth.admin.listUsers({
    perPage: 500,
  });
  const authUsers = authData?.users ?? [];

  if (authErr) {
    console.error("Error listando auth users:", authErr.message);
  } else {
    console.log(`--- AUTH USERS (${authUsers.length}) ---`);
    console.log(
      "  " +
        fmt("EMAIL", 36) +
        fmt("CREATED", 12) +
        fmt("LAST SIGN IN", 14) +
        "STATUS"
    );
    for (const u of authUsers) {
      const created = u.created_at ? u.created_at.substring(0, 10) : "?";
      const last = u.last_sign_in_at ? u.last_sign_in_at.substring(0, 10) : "nunca";
      const status = u.banned_until ? "BANEADO" : u.confirmed_at ? "ACTIVO" : "PENDIENTE";
      console.log("  " + fmt(u.email || "?", 36) + fmt(created, 12) + fmt(last, 14) + status);
    }
    console.log("");
  }

  // 5. CLIENTS (para per-client filtering del portal)
  const { data: clients, error: clientsErr } = await admin
    .from("clients")
    .select("id, client_code, legal_name, tax_id, email, status, assigned_user_id, tenant_id")
    .order("client_code", { ascending: true });

  if (clientsErr) {
    console.error("Error listando clients:", clientsErr.message);
  } else {
    console.log(`--- CLIENTS (${clients?.length || 0}) ---`);
    console.log(
      "  " +
        fmt("CLIENT_CODE", 18) +
        fmt("LEGAL_NAME", 32) +
        fmt("EMAIL", 30) +
        "STATUS"
    );
    for (const c of clients || []) {
      console.log(
        "  " +
          fmt(c.client_code, 18) +
          fmt(c.legal_name, 32) +
          fmt(c.email || "", 30) +
          (c.status === "ACTIVO" ? "ACTIVO" : "INACTIVO")
      );
    }
    console.log("");
  }

  // 6. RESUMEN
  console.log("============================================================");
  console.log(" RESUMEN");
  console.log("============================================================");
  console.log(`  Roles definidos:       ${roles?.length || 0}`);
  console.log(`  Usuarios en public.users: ${users?.length || 0}`);
  console.log(`  Usuarios en auth.users:  ${authUsers.length}`);
  console.log(`  Asignaciones user_roles:  ${assignments?.length || 0}`);
  console.log(`  Clientes:                ${clients?.length || 0}`);
  console.log("");

  // 7. CHECK: Auth link roto
  if (users && authUsers) {
    const authEmails = new Set(authUsers.map((u) => u.email).filter(Boolean));
    const orphanUsers = users.filter((u) => !authEmails.has(u.email));
    if (orphanUsers.length > 0) {
      console.log("--- USERS SIN AUTH (no pueden hacer login) ---");
      for (const u of orphanUsers) {
        console.log(`  ${u.email} (${u.first_name} ${u.last_name})`);
      }
    } else {
      console.log("OK: todos los public.users tienen auth_user_id.");
    }
  }

  // 8. CHECK: User sin role
  if (users && assignments) {
    const usersWithRoles = new Set(assignments.map((a) => a.user_id));
    const orphanUsersNoRole = users.filter((u) => !usersWithRoles.has(u.id));
    if (orphanUsersNoRole.length > 0) {
      console.log("--- USERS SIN ROL (no pueden hacer login en el ERP) ---");
      for (const u of orphanUsersNoRole) {
        console.log(`  ${u.email} (${u.first_name} ${u.last_name})`);
      }
    } else {
      console.log("OK: todos los users tienen al menos un rol.");
    }
  }

  // 9. CHECK: Client sin user asignado
  if (clients && users) {
    const userIds = new Set(users.map((u) => u.id));
    const orphanClients = clients.filter(
      (c) => c.assigned_user_id && !userIds.has(c.assigned_user_id)
    );
    if (orphanClients.length > 0) {
      console.log(
        "--- CLIENTS CON assigned_user_id QUE NO EXISTE EN USERS ---"
      );
      for (const c of orphanClients) {
        console.log(
          `  ${c.client_code} (${c.legal_name}) -> assigned_user_id: ${c.assigned_user_id}`
        );
      }
    } else {
      console.log("OK: todos los assigned_user_id de clients existen en users.");
    }
  }
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
