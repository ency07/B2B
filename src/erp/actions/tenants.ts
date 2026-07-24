"use server";

/**
 * Alta de tenants nuevos (onboarding de clientes).
 *
 * Acción exclusiva de administradores de plataforma (SUPER_ADMIN / ADMIN_DEV)
 * — no de un ADMIN_EMPRESA/GERENTE_GENERAL de un tenant existente, aunque
 * ambos tengan "*" en la matriz RBAC de rutas. Crear un tenant nuevo es una
 * operación de plataforma, no una acción dentro del alcance de un tenant.
 *
 * Provisiona en un solo paso: fila en `tenants` + usuario admin en Auth +
 * fila en `public.users` + asignación del rol ADMIN_EMPRESA (rol global,
 * no requiere seed por tenant — ver hallazgo en roles.tenant_id). Si
 * cualquier paso falla, se revierte lo ya creado para no dejar tenants
 * huérfanos o a medio provisionar.
 */

import { supabaseAdmin } from "@/platform/auth/clients";
import { getAuthContext } from "@/platform/auth/server-guards";
import { validate, createTenantSchema } from "@/lib/validations/erp";
import createLogger from "@/lib/utils/logger";
import { startTimer } from "@/lib/utils/timing";

const logger = createLogger("erp:tenants");

function isPlatformAdmin(role: string): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN_DEV";
}

export interface CreateTenantInput {
  tenantCode: string;
  name: string;
  legalName: string;
  taxId: string;
  email?: string;
  phone?: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
}

export interface CreateTenantResult {
  success: boolean;
  error?: string;
  tenantId?: string;
  tenantCode?: string;
  adminUserId?: string;
}

export async function createTenant(input: CreateTenantInput): Promise<CreateTenantResult> {
  const ctx = await getAuthContext();
  if (!ctx) {
    return { success: false, error: "No autenticado" };
  }
  if (!isPlatformAdmin(ctx.role)) {
    return { success: false, error: "Solo un administrador de plataforma puede crear tenants nuevos." };
  }

  const data = validate(createTenantSchema, input);
  const timer = startTimer("createTenant");

  // 1. Crear el tenant.
  const { data: tenant, error: tenantErr } = await supabaseAdmin
    .from("tenants")
    .insert({
      tenant_code: data.tenantCode,
      name: data.name,
      legal_name: data.legalName,
      tax_id: data.taxId,
      email: data.email || null,
      phone: data.phone || null,
    })
    .select("id")
    .single();

  if (tenantErr || !tenant) {
    logger.error("Error creando tenant", { data: { error: tenantErr } });
    timer.stop({ ok: false, step: "tenant" });
    if (tenantErr?.code === "23505") {
      const field = tenantErr.message.includes("tenant_code") ? "código de tenant" : "NIT";
      return { success: false, error: `Ya existe un tenant con ese ${field}.` };
    }
    return { success: false, error: tenantErr?.message || "Error creando el tenant" };
  }

  // 2. Crear el usuario administrador en Supabase Auth. Sin password: el
  // administrador usa el flujo de "olvidé mi contraseña" en su primer
  // ingreso (mismo patrón que createUser() en users.ts).
  const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email: data.adminEmail,
    email_confirm: true,
  });

  if (authErr || !authData.user) {
    logger.error("Error creando usuario admin en Auth", { data: { error: authErr } });
    await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
    timer.stop({ ok: false, step: "auth" });
    return { success: false, error: authErr?.message || "Error creando el usuario administrador" };
  }

  // 3. Crear la fila en public.users.
  const { data: userRow, error: userErr } = await supabaseAdmin
    .from("users")
    .insert({
      tenant_id: tenant.id,
      auth_user_id: authData.user.id,
      first_name: data.adminFirstName,
      last_name: data.adminLastName,
      email: data.adminEmail,
    })
    .select("id")
    .single();

  if (userErr || !userRow) {
    logger.error("Error creando fila de usuario admin", { data: { error: userErr } });
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
    timer.stop({ ok: false, step: "users" });
    return { success: false, error: userErr?.message || "Error creando la fila de usuario" };
  }

  // 4. Asignar el rol ADMIN_EMPRESA. Es un rol GLOBAL (tenant_id null) en
  // el estado actual de la BD, no hace falta sembrarlo por tenant.
  const { data: role, error: roleErr } = await supabaseAdmin
    .from("roles")
    .select("id")
    .eq("role_code", "ADMIN_EMPRESA")
    .is("tenant_id", null)
    .maybeSingle();

  if (roleErr || !role) {
    logger.error("Rol ADMIN_EMPRESA no encontrado", { data: { error: roleErr } });
    await supabaseAdmin.from("users").delete().eq("id", userRow.id);
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
    timer.stop({ ok: false, step: "role_lookup" });
    return { success: false, error: "No se encontró el rol de administrador. Contacte soporte técnico." };
  }

  const { error: assignErr } = await supabaseAdmin.from("user_roles").insert({
    tenant_id: tenant.id,
    user_id: userRow.id,
    role_id: role.id,
  });

  if (assignErr) {
    logger.error("Error asignando rol al admin del tenant", { data: { error: assignErr } });
    await supabaseAdmin.from("users").delete().eq("id", userRow.id);
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
    timer.stop({ ok: false, step: "role_assign" });
    return { success: false, error: assignErr.message };
  }

  timer.stop({ ok: true, tenantId: tenant.id });
  return {
    success: true,
    tenantId: tenant.id,
    tenantCode: data.tenantCode,
    adminUserId: userRow.id,
  };
}

export interface TenantListItem {
  id: string;
  tenantCode: string;
  name: string;
  legalName: string;
  status: string;
  createdAt: string;
}

interface TenantRow {
  id: string;
  tenant_code: string;
  name: string;
  legal_name: string;
  status: string;
  created_at: string;
}

/**
 * Lista todos los tenants de la plataforma. Exclusivo de administradores
 * de plataforma — no filtra por tenant porque es, precisamente, la lista
 * de tenants.
 */
export async function listTenants(): Promise<TenantListItem[]> {
  const ctx = await getAuthContext();
  if (!ctx || !isPlatformAdmin(ctx.role)) {
    return [];
  }

  const { data, error } = await supabaseAdmin
    .from("tenants")
    .select("id, tenant_code, name, legal_name, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Error listando tenants", { data: { error } });
    return [];
  }

  return ((data as TenantRow[]) || []).map((t) => ({
    id: t.id,
    tenantCode: t.tenant_code,
    name: t.name,
    legalName: t.legal_name,
    status: t.status,
    createdAt: t.created_at,
  }));
}
