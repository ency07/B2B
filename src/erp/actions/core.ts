/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import { getBrandingDefaults } from "@/platform/branding/branding-defaults";
import { requireAction, getAuthContext, validateTenantAccess } from "@/platform/auth/server-guards";
import { resolveTenantIdAsync } from "@/platform/tenant/tenant-resolver";

export async function getTenantId(tenantCode?: string | null): Promise<string> {
  return resolveTenantIdAsync(tenantCode);
}

// ==========================================
// CLIENTS ACTIONS
// ==========================================

export async function getClients(tenantCode?: string | null) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data, error } = await supabaseAdmin
    .from("clients")
    .select("id, tax_id, legal_name, industry, status")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching clients:", error);
    throw new Error(error.message);
  }

  // Calculate sum of total invoiced for each client
  const clientsWithInvoiced = await Promise.all(
    (data || []).map(async (client: any) => {
      const { data: invoices } = await supabaseAdmin
        .from("invoices")
        .select("total_amount")
        .eq("client_id", client.id)
        .is("deleted_at", null)
        .in("status", ["EMITIDA", "PARCIALMENTE_PAGADA", "PAGADA"]);

      const totalInvoiced = (invoices || []).reduce(
        (sum: number, inv: any) => sum + Number(inv.total_amount || 0),
        0
      );

      return {
        id: client.id,
        taxId: client.tax_id,
        name: client.legal_name,
        segment: client.industry || "General",
        totalInvoiced,
        status: (client.status === "ACTIVO" ? "ACTIVO" : client.status === "INACTIVO" ? "SUSPENDIDO" : "PENDIENTE") as "ACTIVO" | "SUSPENDIDO" | "PENDIENTE",
      };
    })
  );

  return clientsWithInvoiced;
}

export async function createClient(
  tenantCode: string | null,
  clientData: { taxId: string; name: string; segment: string; email: string }
) {
  // P8: Validacion backend. Accion: clients.create.
  const ctx = await requireAction("clients.create");
  const tenantId = await getTenantId(tenantCode);
  
  // First, verify if client already exists (to prevent duplicate constraint error)
  const { data: existing } = await supabaseAdmin
    .from("clients")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("tax_id", clientData.taxId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (existing) {
    throw new Error("Ya existe un cliente con este NIT para este tenant.");
  }

  const { data, error } = await supabaseAdmin
    .from("clients")
    .insert({
      tenant_id: tenantId,
      tax_id: clientData.taxId,
      legal_name: clientData.name,
      industry: clientData.segment,
      email: clientData.email,
      client_type: "Empresa",
      country: "México",
      assigned_user_id: ctx.userId,
      status: "ACTIVO",
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating client:", error);
    throw new Error(error.message);
  }

  return data;
}

// ==========================================
// JOBS ACTIONS
// ==========================================

export async function getJobs(tenantCode?: string | null) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .select("id, job_code, title, description, priority, status, planned_start_date, planned_end_date")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching jobs:", error);
    throw new Error(error.message);
  }

  const defaults = getBrandingDefaults(tenantCode);
  const companyShortName = defaults.nombre_comercial.split(" ")[0];

  return (data || []).map((job: any) => ({
    id: job.id,
    code: job.job_code,
    description: job.title,
    assignedTech: `Ing. Administrador ${companyShortName}`,
    priority: (job.priority === "HIGH" ? "ALTA" : job.priority === "LOW" ? "BAJA" : "MEDIA") as "BAJA" | "MEDIA" | "ALTA",
    startDate: job.planned_start_date ? job.planned_start_date.substring(0, 10) : "",
    endDate: job.planned_end_date ? job.planned_end_date.substring(0, 10) : "",
    status: (job.status === "EN_EJECUCION" ? "EN_PROGRESO" : job.status) as "PENDIENTE" | "EN_PROGRESO" | "COMPLETADA" | "CANCELADA",
  }));
}

export async function createJob(
  tenantCode: string | null,
  jobData: { description: string; assignedTech: string; priority: string; startDate: string; endDate: string }
) {
  // P8: Validacion backend. Accion: jobs.create.
  const ctx = await requireAction("jobs.create");
  const tenantId = await getTenantId(tenantCode);

  // Retrieve default references to satisfy constraints
  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("id")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .limit(1)
    .single();

  const { data: req } = await supabaseAdmin
    .from("requirements")
    .select("id")
    .eq("tenant_id", tenantId)
    .limit(1)
    .single();

  const siteId = tenantId === "b0000000-0000-0000-0000-000000000000"
    ? "b1000000-0000-0000-0000-000000000000"
    : "a1000000-0000-0000-0000-000000000000";

  const areaId = tenantId === "b0000000-0000-0000-0000-000000000000"
    ? "b7000000-0000-0000-0000-000000000000"
    : "a7000000-0000-0000-0000-000000000000";

  // Calculate next sequential code
  const { count } = await supabaseAdmin
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const seq = (count || 0) + 1;
  const code = `JOB-2026-${String(seq).padStart(3, "0")}`;

  const { data, error } = await supabaseAdmin
    .from("jobs")
    .insert({
      tenant_id: tenantId,
      job_code: code,
      client_id: client?.id || "a3000000-0000-0000-0000-000000000000",
      requirement_id: req?.id || "a8000000-0000-0000-0000-000000000000",
      site_id: siteId,
      area_id: areaId,
      title: jobData.description.substring(0, 100),
      description: jobData.description,
      assigned_user_id: ctx.userId,
      planned_start_date: new Date(jobData.startDate).toISOString(),
      planned_end_date: new Date(jobData.endDate).toISOString(),
      priority: jobData.priority === "ALTA" ? "HIGH" : jobData.priority === "BAJA" ? "LOW" : "MEDIUM",
      status: "PENDIENTE",
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating job:", error);
    throw new Error(error.message);
  }

  return data;
}

// ==========================================
// INVENTORY ACTIONS
// ==========================================

export async function getInventoryStock(tenantCode?: string | null) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);
  
  const { data, error } = await supabaseAdmin
    .from("inventory_stock")
    .select(`
      quantity,
      reserved_quantity,
      available_quantity,
      warehouses (id, name, warehouse_code),
      inventory_items (id, name, item_code, category, unit_type)
    `)
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("Error fetching inventory stock:", error);
    throw new Error(error.message);
  }

  return (data || []).map((row: any) => ({
    id: `${row.warehouses?.id}-${row.inventory_items?.id}`,
    warehouseCode: row.warehouses?.warehouse_code || "",
    warehouseName: row.warehouses?.name || "",
    itemCode: row.inventory_items?.item_code || "",
    itemName: row.inventory_items?.name || "",
    sku: row.inventory_items?.item_code || "",
    category: row.inventory_items?.category || "",
    unit: row.inventory_items?.unit_type || "Unidad",
    quantity: Number(row.quantity),
    reserved: Number(row.reserved_quantity),
    available: Number(row.available_quantity),
  }));
}

export async function createInventoryMovement(
  tenantCode: string | null,
  movement: {
    type: "Entrada" | "Salida" | "Transferencia";
    itemCode: string;
    quantity: number;
    notes: string;
    sourceWarehouse: string; // warehouse_code
    destWarehouse?: string;  // warehouse_code
  }
) {
  // P8: Validacion backend. Accion: inventory.movement.
  const ctx = await requireAction("inventory.movement");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  // Get item_id
  const { data: item } = await supabaseAdmin
    .from("inventory_items")
    .select("id, purchase_price")
    .eq("tenant_id", tenantId)
    .eq("item_code", movement.itemCode)
    .limit(1)
    .single();

  if (!item) {
    throw new Error(`Artículo con código ${movement.itemCode} no encontrado.`);
  }

  // Get warehouses
  const { data: sourceWh } = await supabaseAdmin
    .from("warehouses")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("warehouse_code", movement.sourceWarehouse)
    .limit(1)
    .single();

  if (!sourceWh) {
    throw new Error(`Bodega origen ${movement.sourceWarehouse} no encontrada.`);
  }

  let destWhId = null;
  if (movement.type === "Transferencia" && movement.destWarehouse) {
    const { data: destWh } = await supabaseAdmin
      .from("warehouses")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("warehouse_code", movement.destWarehouse)
      .limit(1)
      .single();

    if (!destWh) {
      throw new Error(`Bodega destino ${movement.destWarehouse} no encontrada.`);
    }
    destWhId = destWh.id;
  }

  // --- VALIDACIÓN DE STOCK NEGATIVO ---
  if (movement.type === "Salida" || movement.type === "Transferencia") {
    const { data: stock, error: stockErr } = await supabaseAdmin
      .from("inventory_stock")
      .select("available_quantity")
      .eq("tenant_id", tenantId)
      .eq("item_id", item.id)
      .eq("warehouse_id", sourceWh.id)
      .limit(1)
      .maybeSingle();

    if (stockErr) {
      console.error("Error checking stock:", stockErr);
      throw new Error("Error al verificar la disponibilidad de stock.");
    }

    const available = stock?.available_quantity || 0;
    if (available < movement.quantity) {
      throw new Error(`Stock insuficiente en bodega origen. Disponible: ${available}, Requerido: ${movement.quantity}`);
    }
  }

  // Calculate sequence code
  const { count } = await supabaseAdmin
    .from("inventory_movements")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const seq = (count || 0) + 1;
  const code = `MOV-2026-${String(seq).padStart(4, "0")}`;

  const insertPayload: any = {
    tenant_id: tenantId,
    movement_code: code,
    item_id: item.id,
    movement_type: movement.type,
    quantity: movement.quantity,
    unit_cost: item.purchase_price || 0,
    notes: movement.notes,
    status: "Aplicado", // Auto apply in this demo
    created_by: ctx.userId,
  };

  if (movement.type === "Transferencia") {
    insertPayload.source_warehouse_id = sourceWh.id;
    insertPayload.destination_warehouse_id = destWhId;
  } else {
    insertPayload.warehouse_id = sourceWh.id;
  }

  const { data, error } = await supabaseAdmin
    .from("inventory_movements")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    console.error("Error creating movement:", error);
    throw new Error(error.message);
  }

  return data;
}

// ==========================================
// INVOICES ACTIONS
// ==========================================

export async function getInvoices(tenantCode?: string | null) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data, error } = await supabaseAdmin
    .from("invoices")
    .select(`
      id,
      invoice_code,
      total_amount,
      paid_amount,
      balance_amount,
      status,
      invoice_date,
      clients ( legal_name )
    `)
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching invoices:", error);
    throw new Error(error.message);
  }

  return (data || []).map((inv: any) => ({
    id: inv.id,
    code: inv.invoice_code,
    clientName: inv.clients?.legal_name || "Cliente General",
    totalAmount: Number(inv.total_amount),
    paidAmount: Number(inv.paid_amount || 0),
    status: inv.status as "BORRADOR" | "EMITIDA" | "PARCIALMENTE_PAGADA" | "PAGADA" | "ANULADA",
    date: inv.invoice_date ? inv.invoice_date.substring(0, 10) : "",
  }));
}

export async function createInvoice(
  tenantCode: string | null,
  invoiceData: { clientName: string; concept: string; amount: number }
) {
  const ctx = await requireAction("invoices.manage");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  // Get client matching the legal_name or pick the first client
  let { data: client } = await supabaseAdmin
    .from("clients")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("legal_name", invoiceData.clientName)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();

  if (!client) {
    const { data: firstClient } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .limit(1)
      .single();
    client = firstClient;
  }

  const clientId = client?.id || "a3000000-0000-0000-0000-000000000000";

  // Calculate invoice code
  const { count } = await supabaseAdmin
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const seq = (count || 0) + 1;
  const code = `FAC-2026-${String(seq).padStart(4, "0")}`;

  // Insert invoice header
  const { data: invoice, error } = await supabaseAdmin
    .from("invoices")
    .insert({
      tenant_id: tenantId,
      invoice_code: code,
      client_id: clientId,
      source_type: "CLIENT",
      source_id: clientId,
      invoice_date: new Date().toISOString().substring(0, 10),
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // 30 days default
      subtotal: invoiceData.amount,
      discount_amount: 0,
      tax_amount: 0,
      total_amount: invoiceData.amount,
      paid_amount: 0,
      status: "EMITIDA",
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating invoice:", error);
    throw new Error(error.message);
  }

  // Insert invoice items
  await supabaseAdmin.from("invoice_items").insert({
    tenant_id: tenantId,
    invoice_id: invoice.id,
    line_number: 1,
    description: invoiceData.concept,
    quantity: 1,
    unit_price: invoiceData.amount,
    discount_amount: 0,
    tax_amount: 0,
    line_total: invoiceData.amount,
    created_by: ctx.userId,
  });

  return invoice;
}

// ==========================================
// TENANT SETTINGS ACTIONS
// ==========================================

export async function getTenantSettings(tenantCode?: string | null) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data, error } = await supabaseAdmin
    .from("tenant_settings")
    .select("module, config_key, config_value, is_encrypted")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null);

  if (error) {
    console.error("Error fetching settings:", error);
    throw new Error(error.message);
  }

  // Reduce to record object, decrypting encrypted fields on the fly
  const settings: Record<string, any> = {};
  for (const row of (data || [])) {
    if (row.is_encrypted) {
      const { data: decryptedVal, error: decErr } = await supabaseAdmin
        .rpc("get_tenant_setting", {
          p_tenant_id: tenantId,
          p_module: row.module,
          p_key: row.config_key
        });
      
      if (decErr) {
        console.error(`Error decrypting key ${row.config_key}:`, decErr);
        settings[row.config_key] = row.config_value;
      } else {
        settings[row.config_key] = decryptedVal;
      }
    } else {
      settings[row.config_key] = row.config_value;
    }
  }

  return settings;
}

/**
 * Versión pública de getTenantSettings para páginas que no requieren auth.
 * Solo trae campos de branding público (nombre, logo, colors, favicon).
 */
export async function getPublicTenantSettings(tenantCode?: string | null) {
  // Obtener tenantId sin auth - usa el tenantCode directamente
  const tenantId = await getTenantId(tenantCode);

  // Verificar que el tenant esté Activo (no servir branding de tenants suspendidos)
  const { data: tenantInfo } = await supabaseAdmin
    .from("tenants")
    .select("status")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenantInfo || tenantInfo.status !== "Activo") {
    return {};
  }

  // Solo traer campos públicos de branding
  const publicKeys = [
    "nombre_comercial",
    "razon_social", 
    "logo_url",
    "logo_secondary_url",
    "favicon_url",
    "primary_color",
    "secondary_color",
    "titulo_navegador",
    "descripcion_sitio",
  ];

  const { data, error } = await supabaseAdmin
    .from("tenant_settings")
    .select("config_key, config_value")
    .eq("tenant_id", tenantId)
    .in("config_key", publicKeys)
    .is("deleted_at", null);

  if (error) {
    console.error("Error fetching public settings:", error);
    return {};
  }

  // Reducir a objeto simple
  const settings: Record<string, any> = {};
  for (const row of (data || [])) {
    settings[row.config_key] = row.config_value;
  }

  return settings;
}

export async function updateTenantSettings(
  tenantCode: string | null,
  module: string,
  key: string,
  value: any,
  isEncrypted: boolean = false
) {
  const ctx = await requireAction("settings.manage");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data, error } = await supabaseAdmin
    .from("tenant_settings")
    .upsert({
      tenant_id: tenantId,
      module: module,
      config_key: key,
      config_value: value,
      is_encrypted: isEncrypted,
      updated_by: ctx.userId,
      updated_at: new Date().toISOString()
    }, {
      onConflict: "tenant_id,module,config_key"
    })
    .select()
    .single();

  if (error) {
    console.error("Error updating settings:", error);
    throw new Error(error.message);
  }

  return data;
}




export async function getWarehouses(tenantCode?: string | null) {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data, error } = await supabaseAdmin
    .from("warehouses")
    .select("id, name, warehouse_code")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching warehouses:", error);
    throw new Error(error.message);
  }

  return (data || []).map((w: any) => ({
    id: w.id,
    name: w.name,
    code: w.warehouse_code,
  }));
}

export async function createInventoryItem(
  tenantCode: string | null,
  itemData: {
    itemCode: string;
    name: string;
    description: string;
    category: string;
    itemType: "Material" | "Herramienta" | "Equipo" | "Consumible" | "Repuesto";
    unit: string;
    minimumStock: number;
    maximumStock: number;
    reorderPoint: number;
    initialQuantity?: number;
    warehouseId?: string;
  }
) {
  const ctx = await requireAction("items.manage");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  // 1. Insert item record
  const { data: item, error: itemErr } = await supabaseAdmin
    .from("inventory_items")
    .insert({
      tenant_id: tenantId,
      item_code: itemData.itemCode,
      name: itemData.name,
      description: itemData.description,
      category: itemData.category,
      item_type: itemData.itemType,
      unit: itemData.unit,
      minimum_stock: itemData.minimumStock,
      maximum_stock: itemData.maximumStock,
      reorder_point: itemData.reorderPoint,
      average_cost: 0,
      last_cost: 0,
      status: "Activo",
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (itemErr) {
    console.error("Error creating inventory item:", itemErr);
    throw new Error(itemErr.message);
  }

  // 2. If initial quantity is specified, create initial stock row and record movement
  if (itemData.initialQuantity && itemData.initialQuantity > 0 && itemData.warehouseId) {
    const { error: stockErr } = await supabaseAdmin
      .from("inventory_stock")
      .upsert({
        tenant_id: tenantId,
        warehouse_id: itemData.warehouseId,
        item_id: item.id,
        quantity: itemData.initialQuantity,
        reserved_quantity: 0,
        created_by: ctx.userId,
      }, {
        onConflict: "tenant_id,warehouse_id,item_id",
      });

    if (stockErr) {
      console.error("Error creating initial stock:", stockErr);
    } else {
      const { count } = await supabaseAdmin
        .from("inventory_movements")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId);

      const seq = (count || 0) + 1;
      const code = `MOV-2026-${String(seq).padStart(4, "0")}`;

      await supabaseAdmin.from("inventory_movements").insert({
        tenant_id: tenantId,
        movement_code: code,
        item_id: item.id,
        warehouse_id: itemData.warehouseId,
        movement_type: "Entrada",
        quantity: itemData.initialQuantity,
        unit_cost: 0,
        notes: "Carga inicial de inventario",
        status: "Aplicado",
        created_by: ctx.userId,
      });
    }
  }

  return item;
}

