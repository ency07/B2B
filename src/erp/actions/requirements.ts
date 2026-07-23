/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import { getTenantId, getCallerTenantId } from "@/erp/actions/core";
import { requireAction, getAuthContext, validateTenantAccess } from "@/platform/auth/server-guards";
import {
  validate,
  createRequirementSchema,
  updateRequirementStatusSchema,
} from "@/lib/validations/erp";
import createLogger from "@/lib/utils/logger";
import { startTimer } from "@/lib/utils/timing";

const logger = createLogger("erp:requirements");

export interface RequirementRow {
  id: string;
  requirement_code: string;
  title: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "BORRADOR" | "NUEVO" | "EN_REVISION" | "DIAGNOSTICO" | "COTIZACION" | "COMPLETADO" | "CANCELADO";
  client_id: string;
  engineering_user_id: string | null;
  sales_user_id: string | null;
  created_at: string;
  client: { legal_name: string; city: string | null } | null;
  engineering_user?: { first_name: string; last_name: string } | null;
}

export async function getRequirements(tenantCode?: string | null): Promise<RequirementRow[]> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");
  const tenantId = await getTenantId(tenantCode ?? null);

  const { data, error } = await supabaseAdmin
    .from("requirements")
    .select(`
      id, requirement_code, title, category, priority, status, client_id, engineering_user_id, sales_user_id, created_at,
      client:client_id ( legal_name, city )
    `)
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Error fetching requirements", { data: { error } });
    return [];
  }

  const reqs = data ?? [];

  // Batch query para nombres de ingenieros asignados — evita datos inventados.
  const engIds = [...new Set(reqs.map((r: any) => r.engineering_user_id).filter(Boolean))];
  const { data: engUsers } = engIds.length > 0
    ? await supabaseAdmin
        .from("users")
        .select("id, first_name, last_name")
        .in("id", engIds)
    : { data: [] };

  const engById = new Map<string, { first_name: string; last_name: string }>();
  for (const u of engUsers || []) {
    engById.set(u.id, { first_name: u.first_name, last_name: u.last_name });
  }

  const rows = reqs.map((row: any) => ({
    ...row,
    client: Array.isArray(row.client) ? row.client[0] ?? null : row.client,
    engineering_user: row.engineering_user_id ? (engById.get(row.engineering_user_id) ?? null) : null,
  }));

  return rows as any[];
}

export async function createRequirement(
  tenantCode: string | null,
  reqData: { title: string; clientId: string; category: string; priority: string }
) {
  const ctx = await requireAction("requirements");
  reqData = validate(createRequirementSchema, reqData);
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const timer = startTimer("createRequirement");

  // RPC (puente de identidad): ver supabase/migrations/*_identity_bridge_remaining_erp_write_paths.sql
  const { data, error } = await supabaseAdmin.rpc("create_requirement_bridged", {
    p_tenant_id: tenantId,
    p_client_id: reqData.clientId,
    p_title: reqData.title,
    p_category: reqData.category,
    p_priority: reqData.priority,
    p_actor_user_id: ctx.userId,
  });

  if (error) {
    logger.error("Error creating requirement", { data: { error } });
    timer.stop({ ok: false });
    throw new Error(error.message);
  }

  timer.stop({ ok: true });
  return data;
}

export async function updateRequirementStatus(
  reqId: string,
  newStatus: string,
  extra?: Record<string, any>
) {
  const ctx = await requireAction("requirements");
  ({ reqId, newStatus } = validate(updateRequirementStatusSchema, { reqId, newStatus }));
  const tenantId = await getCallerTenantId();

  const timer = startTimer("updateRequirementStatus");

  // Whitelist anti mass-assignment: `extra` solo puede setear estas columnas
  // (asignación de ingeniería/ventas). Evita que un caller inyecte columnas
  // arbitrarias (tenant_id, created_by, etc.) vía el spread. p_set_engineering/
  // p_set_sales distinguen "no tocar la columna" de "tocarla" en el RPC — ver
  // supabase/migrations/*_identity_bridge_remaining_erp_write_paths.sql
  const { data, error } = await supabaseAdmin.rpc("update_requirement_status_bridged", {
    p_requirement_id: reqId,
    p_tenant_id: tenantId,
    p_new_status: newStatus,
    p_actor_user_id: ctx.userId,
    p_set_engineering: extra?.engineering_user_id !== undefined,
    p_engineering_user_id: extra?.engineering_user_id ?? null,
    p_set_sales: extra?.sales_user_id !== undefined,
    p_sales_user_id: extra?.sales_user_id ?? null,
  });

  if (error) {
    logger.error("Error updating requirement", { data: { error } });
    timer.stop({ ok: false });
    throw new Error(error.message);
  }

  timer.stop({ ok: true });
  return data;
}
