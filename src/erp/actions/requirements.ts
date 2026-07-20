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
    console.error("Error fetching requirements:", error);
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

  const { data, error } = await supabaseAdmin
    .from("requirements")
    .insert({
      tenant_id: tenantId,
      client_id: reqData.clientId,
      title: reqData.title,
      category: reqData.category,
      priority: reqData.priority,
      status: "BORRADOR",
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating requirement:", error);
    throw new Error(error.message);
  }

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

  // Whitelist anti mass-assignment: `extra` solo puede setear estas columnas
  // (asignación de ingeniería/ventas). Evita que un caller inyecte columnas
  // arbitrarias (tenant_id, created_by, etc.) vía el spread.
  const ALLOWED_EXTRA_KEYS = ["engineering_user_id", "sales_user_id"] as const;
  const sanitizedExtra: Record<string, unknown> = {};
  if (extra) {
    for (const key of ALLOWED_EXTRA_KEYS) {
      if (extra[key] !== undefined) sanitizedExtra[key] = extra[key];
    }
  }

  const payload: any = {
    status: newStatus,
    updated_by: ctx.userId,
    ...sanitizedExtra,
  };

  const { data, error } = await supabaseAdmin
    .from("requirements")
    .update(payload)
    .eq("id", reqId)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (error) {
    console.error("Error updating requirement:", error);
    throw new Error(error.message);
  }

  return data;
}
