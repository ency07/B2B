/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import { requireAction, getAuthContext, validateTenantAccess } from "@/platform/auth/server-guards";
import { resolveTenantIdAsync } from "@/platform/tenant/tenant-resolver";
import {
  validate,
  createClientSchema,
  createJobSchema,
  createInventoryMovementSchema,
  createInvoiceSchema,
  registerPaymentSchema,
  updateJobStatusSchema,
  createCreditNoteSchema,
  createPurchaseOrderSchema,
  updateTenantSettingsSchema,
  createInventoryItemSchema,
} from "@/lib/validations/erp";

export async function getTenantId(tenantCode?: string | null): Promise<string> {
  return resolveTenantIdAsync(tenantCode);
}

/**
 * Devuelve el tenant_id del usuario autenticado leyendo su registro en la
 * tabla `users`. Usar en mutations que no reciben tenantCode como parámetro
 * para garantizar que el recurso modificado pertenece al tenant del llamador.
 */
export async function getCallerTenantId(): Promise<string> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");

  const { data } = await supabaseAdmin
    .from("users")
    .select("tenant_id")
    .eq("auth_user_id", ctx.userId)
    .maybeSingle();

  if (!data?.tenant_id) throw new Error("Usuario sin tenant asignado");
  return data.tenant_id as string;
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

  const clients = data || [];

  // Una sola query batch para todas las facturas del tenant — elimina N+1.
  const clientIds = clients.map((c: any) => c.id);
  const { data: invoiceRows } = clientIds.length > 0
    ? await supabaseAdmin
        .from("invoices")
        .select("client_id, total_amount")
        .eq("tenant_id", tenantId)
        .in("client_id", clientIds)
        .is("deleted_at", null)
        .in("status", ["EMITIDA", "PARCIALMENTE_PAGADA", "PAGADA"])
    : { data: [] };

  // Agregación en memoria por client_id.
  const invoicedByClient = new Map<string, number>();
  for (const inv of invoiceRows || []) {
    invoicedByClient.set(
      inv.client_id,
      (invoicedByClient.get(inv.client_id) ?? 0) + Number(inv.total_amount || 0)
    );
  }

  return clients.map((client: any) => ({
    id: client.id,
    taxId: client.tax_id,
    name: client.legal_name,
    segment: client.industry || "General",
    totalInvoiced: invoicedByClient.get(client.id) ?? 0,
    status: client.status as "ACTIVO" | "SUSPENDIDO" | "PENDIENTE" | "INACTIVO",
  }));
}

export async function createClient(
  tenantCode: string | null,
  clientData: { taxId: string; name: string; segment: string; email: string }
) {
  // P8: Validacion backend. Accion: clients.create.
  const ctx = await requireAction("clients.create");
  clientData = validate(createClientSchema, clientData);
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

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
      country: "Colombia",
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
    .select("id, job_code, title, priority, status, planned_start_date, planned_end_date, assigned_user_id")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching jobs:", error);
    throw new Error(error.message);
  }

  const jobs = data || [];

  // Batch query para nombres de técnicos asignados — evita datos inventados.
  const assignedIds = [...new Set(jobs.map((j: any) => j.assigned_user_id).filter(Boolean))];
  const { data: usersData } = assignedIds.length > 0
    ? await supabaseAdmin
        .from("users")
        .select("id, first_name, last_name")
        .in("id", assignedIds)
    : { data: [] };

  const usersById = new Map<string, string>();
  for (const u of usersData || []) {
    usersById.set(u.id, `${u.first_name} ${u.last_name}`);
  }

  return jobs.map((job: any) => ({
    id: job.id,
    code: job.job_code,
    description: job.title,
    assignedTech: job.assigned_user_id ? (usersById.get(job.assigned_user_id) ?? "Sin asignar") : "Sin asignar",
    priority: (job.priority === "HIGH" ? "ALTA" : job.priority === "LOW" ? "BAJA" : "MEDIA") as "BAJA" | "MEDIA" | "ALTA",
    startDate: job.planned_start_date ? job.planned_start_date.substring(0, 10) : "",
    endDate: job.planned_end_date ? job.planned_end_date.substring(0, 10) : "",
    status: job.status as "PENDIENTE" | "PROGRAMADO" | "EN_EJECUCION" | "SUSPENDIDO" | "FINALIZADO" | "ENTREGADO" | "CERRADO" | "CANCELADO",
  }));
}

export async function getAssignableUsers(tenantCode: string | null): Promise<{ id: string; name: string }[]> {
  const ctx = await requireAction("jobs.create");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, first_name, last_name")
    .eq("tenant_id", tenantId)
    .order("first_name", { ascending: true });

  if (error) {
    console.error("Error fetching assignable users:", error);
    return [];
  }

  return (data || []).map((u: any) => ({ id: u.id, name: `${u.first_name} ${u.last_name}` }));
}

export async function createJob(
  tenantCode: string | null,
  jobData: {
    clientId: string;
    requirementId: string;
    assignedUserId: string;
    description: string;
    priority: string;
    startDate: string;
    endDate: string;
  }
) {
  const ctx = await requireAction("jobs.create");
  jobData = validate(createJobSchema, jobData);
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  // Validar que cliente y requerimiento pertenecen al tenant (evita IDOR)
  const [clientResult, reqResult, siteResult, areaResult] = await Promise.all([
    supabaseAdmin.from("clients").select("id").eq("tenant_id", tenantId).eq("id", jobData.clientId).is("deleted_at", null).maybeSingle(),
    supabaseAdmin.from("requirements").select("id").eq("tenant_id", tenantId).eq("id", jobData.requirementId).maybeSingle(),
    supabaseAdmin.from("sites").select("id").eq("tenant_id", tenantId).limit(1).maybeSingle(),
    supabaseAdmin.from("areas").select("id").eq("tenant_id", tenantId).limit(1).maybeSingle(),
  ]);

  if (!clientResult.data) throw new Error("Cliente no encontrado en este tenant.");
  if (!reqResult.data) throw new Error("Requerimiento no encontrado en este tenant.");
  if (!siteResult.data) throw new Error("El tenant no tiene sitios configurados. Contacta al administrador.");
  if (!areaResult.data) throw new Error("El tenant no tiene áreas configuradas. Contacta al administrador.");

  // job_code se omite intencionalmente: el trigger handle_job_sequences()
  // lo genera con get_next_tenant_sequence() de forma atómica y sin race conditions.
  const { data, error } = await supabaseAdmin
    .from("jobs")
    .insert({
      tenant_id: tenantId,
      client_id: jobData.clientId,
      requirement_id: jobData.requirementId,
      site_id: siteResult.data.id,
      area_id: areaResult.data.id,
      title: jobData.description.substring(0, 100),
      description: jobData.description,
      assigned_user_id: jobData.assignedUserId,
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

export async function updateJobStatus(
  tenantCode: string | null,
  data: {
    jobId: string;
    newStatus: "PENDIENTE" | "PROGRAMADO" | "EN_EJECUCION" | "SUSPENDIDO" | "FINALIZADO" | "ENTREGADO" | "CERRADO" | "CANCELADO";
    cancelReason?: string;
    actualHours?: number;
  }
) {
  const ctx = await requireAction("jobs.manage");
  data = validate(updateJobStatusSchema, data);
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  // Verificar que la OT pertenece al tenant
  const { data: job, error: jobErr } = await supabaseAdmin
    .from("jobs")
    .select("id, status, deleted_at")
    .eq("id", data.jobId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (jobErr || !job || job.deleted_at) {
    throw new Error("Orden de trabajo no encontrada.");
  }

  if (job.status === "CERRADO") {
    throw new Error("No se puede modificar una OT con estado final CERRADO.");
  }

  if (job.status === data.newStatus) {
    throw new Error(`La OT ya se encuentra en estado ${data.newStatus}.`);
  }

  // Actualizar estado — el trigger validate_job_state_transitions valida la transición
  // y dispatch_job_events emite el business_event correspondiente
  const updatePayload: Record<string, unknown> = {
    status: data.newStatus,
    updated_by: ctx.userId,
    updated_at: new Date().toISOString(),
  };

  if (data.newStatus === "EN_EJECUCION") {
    updatePayload.actual_start_date = new Date().toISOString();
  }

  if (data.newStatus === "FINALIZADO") {
    updatePayload.actual_end_date = new Date().toISOString();
    if (data.actualHours !== undefined) {
      updatePayload.actual_hours = data.actualHours;
    }
  }

  if (data.newStatus === "CANCELADO") {
    updatePayload.cancel_reason = data.cancelReason;
    updatePayload.cancelled_by = ctx.userId;
    updatePayload.cancelled_at = new Date().toISOString();
  }

  const { data: updated, error: updateErr } = await supabaseAdmin
    .from("jobs")
    .update(updatePayload)
    .eq("id", data.jobId)
    .select()
    .single();

  if (updateErr) {
    console.error("Error updating job status:", updateErr);
    throw new Error(updateErr.message);
  }

  return updated;
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
      inventory_items (id, name, item_code, category, unit)
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
    unit: row.inventory_items?.unit || "Unidad",
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
  movement = validate(createInventoryMovementSchema, movement);
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

  // movement_code se omite intencionalmente: el trigger handle_inventory_sequences()
  // lo genera con get_next_tenant_sequence() de forma atómica (MOV-000001), sin el
  // race condition del antiguo count+1.
  const insertPayload: any = {
    tenant_id: tenantId,
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
  invoiceData = validate(createInvoiceSchema, invoiceData);
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

  if (!client) throw new Error("No se encontró ningún cliente para este tenant. Crea un cliente antes de emitir una factura.");
  const clientId = client.id;

  // Cabecera de factura + primera línea de forma ATÓMICA vía RPC transaccional.
  // Antes eran 2 inserts separados sin transacción (y el 2º ni verificaba error):
  // si fallaba el insert de invoice_items quedaba una factura huérfana sin líneas.
  // invoice_code lo genera el trigger handle_invoice_sequences (FAC-000001).
  const { data: invoice, error } = await supabaseAdmin.rpc("create_invoice_with_item", {
    p_tenant_id: tenantId,
    p_client_id: clientId,
    p_amount: invoiceData.amount,
    p_concept: invoiceData.concept,
    p_created_by: ctx.userId,
  });

  if (error) {
    console.error("Error creating invoice:", error);
    throw new Error(error.message);
  }

  return invoice;
}

// ==========================================
// PAYMENTS ACTIONS
// ==========================================

export async function registerPayment(
  tenantCode: string | null,
  paymentData: {
    invoiceId: string;
    clientId: string;
    amount: number;
    paymentMethod: "Transferencia" | "Efectivo" | "Cheque" | "Tarjeta" | "PSE" | "Otro";
    referenceNumber?: string;
    paymentDate: string;
    notes?: string;
  }
) {
  const ctx = await requireAction("payments.confirm");
  paymentData = validate(registerPaymentSchema, paymentData);
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  // Verificar que la factura pertenece al tenant y está en estado válido
  const { data: invoice, error: invErr } = await supabaseAdmin
    .from("invoices")
    .select("id, status, balance_amount, total_amount, client_id, deleted_at")
    .eq("id", paymentData.invoiceId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (invErr || !invoice || invoice.deleted_at) {
    throw new Error("Factura no encontrada.");
  }

  if (!["EMITIDA", "PARCIALMENTE_PAGADA", "VENCIDA"].includes(invoice.status)) {
    throw new Error(`No se puede registrar un pago para una factura en estado ${invoice.status}.`);
  }

  if (invoice.client_id !== paymentData.clientId) {
    throw new Error("El cliente no coincide con la factura.");
  }

  const balance = Number(invoice.balance_amount);
  if (paymentData.amount > balance) {
    throw new Error(
      `El monto del pago ($${paymentData.amount}) excede el saldo pendiente ($${balance}).`
    );
  }

  // Insertar pago — el trigger trg_handle_payment_code genera payment_code
  // y trg_handle_payment_application actualiza invoices.paid_amount + status
  // cuando el pago pasa a APLICADO.
  const { data: payment, error: payErr } = await supabaseAdmin
    .from("payments")
    .insert({
      tenant_id: tenantId,
      client_id: paymentData.clientId,
      invoice_id: paymentData.invoiceId,
      payment_date: paymentData.paymentDate,
      payment_method: paymentData.paymentMethod,
      reference_number: paymentData.referenceNumber || null,
      amount: paymentData.amount,
      status: "APLICADO",
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (payErr) {
    console.error("Error registering payment:", payErr);
    throw new Error(payErr.message);
  }

  return payment;
}

// ==========================================
// CREDIT NOTES ACTIONS
// ==========================================

export async function createCreditNote(
  tenantCode: string | null,
  data: {
    invoiceId: string;
    clientId: string;
    reason: "DEVOLUCION" | "ERROR" | "DESCUENTO" | "ANULACION" | "GARANTIA";
    description?: string;
    subtotal: number;
    taxAmount?: number;
    totalAmount: number;
  }
) {
  const ctx = await requireAction("credit_notes.create");
  data = validate(createCreditNoteSchema, data);
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  // Verificar que la factura pertenece al tenant y está en estado válido
  const { data: invoice, error: invErr } = await supabaseAdmin
    .from("invoices")
    .select("id, status, total_amount, client_id, deleted_at")
    .eq("id", data.invoiceId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (invErr || !invoice || invoice.deleted_at) {
    throw new Error("Factura no encontrada.");
  }

  if (!["EMITIDA", "PARCIALMENTE_PAGADA", "PAGADA", "VENCIDA"].includes(invoice.status)) {
    throw new Error(`No se puede emitir NC para una factura en estado ${invoice.status}.`);
  }

  if (invoice.client_id !== data.clientId) {
    throw new Error("El cliente no coincide con la factura.");
  }

  if (data.totalAmount > Number(invoice.total_amount)) {
    throw new Error(
      `El monto de la NC ($${data.totalAmount}) no puede exceder el total de la factura ($${invoice.total_amount}).`
    );
  }

  // Insertar NC — el trigger valida el monto y genera el código
  const { data: creditNote, error: cnErr } = await supabaseAdmin
    .from("credit_notes")
    .insert({
      tenant_id: tenantId,
      invoice_id: data.invoiceId,
      client_id: data.clientId,
      reason: data.reason,
      description: data.description || null,
      subtotal: data.subtotal,
      tax_amount: data.taxAmount || 0,
      total_amount: data.totalAmount,
      status: "APLICADA",
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (cnErr) {
    console.error("Error creating credit note:", cnErr);
    throw new Error(cnErr.message);
  }

  return creditNote;
}

// ==========================================
// PURCHASES ACTIONS
// ==========================================

export async function createPurchaseOrder(
  tenantCode: string | null,
  data: {
    vendorId: string;
    totalAmount: number;
    notes?: string;
    items: {
      description: string;
      quantity: number;
      unitPrice: number;
      subtotal: number;
    }[];
  }
) {
  const ctx = await requireAction("purchases.create");
  data = validate(createPurchaseOrderSchema, data);
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  // Insertar cabecera
  const { data: po, error: poErr } = await supabaseAdmin
    .from("purchase_orders")
    .insert({
      tenant_id: tenantId,
      vendor_id: data.vendorId,
      total_amount: data.totalAmount,
      notes: data.notes,
      status: "BORRADOR",
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (poErr) throw new Error(poErr.message);

  // Insertar items
  const { error: itemsErr } = await supabaseAdmin
    .from("purchase_order_items")
    .insert(data.items.map((item) => ({
      po_id: po.id,
      ...item
    })));

  if (itemsErr) throw new Error(itemsErr.message);

  return po;
}

export async function approvePurchaseOrder(
  tenantCode: string | null,
  poId: string
) {
  const ctx = await requireAction("purchases.approve");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data: po, error: poErr } = await supabaseAdmin
    .from("purchase_orders")
    .update({
      status: "APROBADA",
      approved_by: ctx.userId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", poId)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (poErr) throw new Error(poErr.message);
  return po;
}

export async function receivePurchaseOrder(
  tenantCode: string | null,
  poId: string
) {
  const ctx = await requireAction("purchases.create");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data: po, error: poErr } = await supabaseAdmin
    .from("purchase_orders")
    .update({ status: "RECIBIDA" })
    .eq("id", poId)
    .eq("tenant_id", tenantId)
    .select()
    .single();

  if (poErr) throw new Error(poErr.message);
  return po;
}

export interface PurchaseOrderItemData {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface PurchaseOrderData {
  id: string;
  code: string;
  vendor_id: string;
  vendor_name: string;
  status: string;
  total_amount: number;
  notes: string | null;
  created_at: string;
  items: PurchaseOrderItemData[];
}

export async function getPurchaseOrders(
  tenantCode: string | null
): Promise<PurchaseOrderData[]> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data: orders, error: ordersErr } = await supabaseAdmin
    .from("purchase_orders")
    .select("id, code, vendor_id, status, total_amount, notes, created_at")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (ordersErr) throw new Error(ordersErr.message);

  const vendorIds = [...new Set(orders.map((o: any) => o.vendor_id))];

  const { data: vendors } = await supabaseAdmin
    .from("clients")
    .select("id, name")
    .in("id", vendorIds);

  const vendorMap = new Map((vendors || []).map((v: any) => [v.id, v.name]));

  const poIds = orders.map((o: any) => o.id);
  const { data: items } = await supabaseAdmin
    .from("purchase_order_items")
    .select("id, po_id, description, quantity, unit_price, subtotal")
    .in("po_id", poIds);

  const itemsByPo = new Map<string, PurchaseOrderItemData[]>();
  (items || []).forEach((it: any) => {
    const list = itemsByPo.get(it.po_id) || [];
    list.push(it);
    itemsByPo.set(it.po_id, list);
  });

  return orders.map((o: any) => ({
    id: o.id,
    code: o.code,
    vendor_id: o.vendor_id,
    vendor_name: vendorMap.get(o.vendor_id) || "—",
    status: o.status,
    total_amount: Number(o.total_amount),
    notes: o.notes,
    created_at: o.created_at,
    items: itemsByPo.get(o.id) || [],
  }));
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

  // Separar campos encriptados y planos para desencriptar en batch (evitar N+1)
  const rows = data || [];
  const plain = rows.filter((r) => !r.is_encrypted);
  const encrypted = rows.filter((r) => r.is_encrypted);

  // Lanzar todas las RPCs de desencriptación en paralelo
  const decryptedResults = await Promise.all(
    encrypted.map((row) =>
      supabaseAdmin
        .rpc("get_tenant_setting", {
          p_tenant_id: tenantId,
          p_module: row.module,
          p_key: row.config_key,
        })
        .then(({ data: val, error: decErr }) => ({
          key: row.config_key,
          value: decErr ? row.config_value : val,
        }))
    )
  );

  const settings: Record<string, any> = {};
  for (const row of plain) {
    settings[row.config_key] = row.config_value;
  }
  for (const { key, value } of decryptedResults) {
    settings[key] = value;
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
  validate(updateTenantSettingsSchema, { module, key, isEncrypted });
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
  itemData = validate(createInventoryItemSchema, itemData);
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  // Ítem + stock inicial + movimiento de entrada de forma ATÓMICA vía RPC
  // transaccional. Antes eran 3 inserts separados sin transacción: si fallaba
  // el stock/movimiento quedaba el ítem sin inventario coherente. Ahora si
  // cualquier paso falla, todo hace rollback. Los códigos los generan los
  // triggers (item_code / movement_code).
  const { data: item, error } = await supabaseAdmin.rpc("create_inventory_item_with_stock", {
    p_tenant_id: tenantId,
    p_item_code: itemData.itemCode,
    p_name: itemData.name,
    p_description: itemData.description,
    p_category: itemData.category,
    p_item_type: itemData.itemType,
    p_unit: itemData.unit,
    p_minimum_stock: itemData.minimumStock,
    p_maximum_stock: itemData.maximumStock,
    p_reorder_point: itemData.reorderPoint,
    p_initial_quantity: itemData.initialQuantity ?? null,
    p_warehouse_id: itemData.warehouseId ?? null,
    p_created_by: ctx.userId,
  });

  if (error) {
    console.error("Error creating inventory item:", error);
    throw new Error(error.message);
  }

  return item;
}

