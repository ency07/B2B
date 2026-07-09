/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import { getTenantId } from "@/erp/actions/core";
import { requireAction, getAuthContext } from "@/platform/auth/server-guards";

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

  const rows = (data ?? []).map((row: any) => ({
    ...row,
    client: Array.isArray(row.client) ? row.client[0] ?? null : row.client,
    engineering_user: row.engineering_user_id ? { first_name: "Ing.", last_name: "Asignado" } : null
  }));

  return rows as any[];
}

export async function createRequirement(
  tenantCode: string | null,
  reqData: { title: string; clientId: string; category: string; priority: string }
) {
  const ctx = await requireAction("requirements");
  const tenantId = await getTenantId(tenantCode);

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

  const payload: any = {
    status: newStatus,
    updated_by: ctx.userId,
    ...extra,
  };

  const { data, error } = await supabaseAdmin
    .from("requirements")
    .update(payload)
    .eq("id", reqId)
    .select()
    .single();

  if (error) {
    console.error("Error updating requirement:", error);
    throw new Error(error.message);
  }

  return data;
}
