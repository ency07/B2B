/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

/**
 * Módulo de Compras — proveedores, solicitudes de compra, cotizaciones de
 * proveedor, órdenes de compra (OC) y recepciones.
 *
 * Las 9 tablas subyacentes ya existían en la BD con RLS, auditoría y
 * triggers de negocio reales (numeración automática, máquina de estados,
 * umbrales de aprobación por monto, bloqueo de proveedores incumplidos,
 * posting automático a inventario en recepción) — ver
 * supabase/migrations/*_identity_bridge_erp*.sql y *_purchases_bridged_rpcs.sql.
 * Antes de este módulo, cero código de aplicación las usaba; la página de
 * compras apuntaba a una tabla `purchase_orders` que nunca existió en
 * producción.
 *
 * Solo `solicitudes_compra` y `ordenes_compra` tienen triggers de
 * trazabilidad/aprobación que leen el actor real vía get_current_user_id() —
 * sus escrituras pasan por RPCs "puenteadas" (create_*_bridged,
 * update_*_status_bridged). El resto de tablas no depende de eso: created_by
 * se setea directo desde acá con el usuario autenticado real.
 */

import { supabaseAdmin } from "@/platform/auth/clients";
import { getTenantId, emitBusinessEvent } from "@/erp/actions/core";
import { requireAction, validateTenantAccess } from "@/platform/auth/server-guards";
import {
  validate,
  createProveedorSchema,
  updateProveedorSchema,
  createSolicitudCompraSchema,
  updateSolicitudCompraStatusSchema,
  createCotizacionProveedorSchema,
  cotizacionProveedorEstadoSchema,
  createOrdenCompraSchema,
  updateOrdenCompraStatusSchema,
  createRecepcionSchema,
} from "@/lib/validations/erp";
import createLogger from "@/lib/utils/logger";

const logger = createLogger("erp:purchases");

// ==========================================
// PROVEEDORES
// ==========================================

export interface ProveedorRow {
  id: string;
  codigo: string;
  razonSocial: string;
  nit: string | null;
  ciudad: string | null;
  telefono: string | null;
  correo: string | null;
  categoria: string;
  estado: string;
  score: number;
  incumplimientosCount: number;
  bloqueado: boolean;
  bloqueadoMotivo: string | null;
  diasCredito: number;
}

export async function listProveedores(tenantCode?: string | null): Promise<ProveedorRow[]> {
  const ctx = await requireAction("purchases.view");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data, error } = await supabaseAdmin
    .from("proveedores")
    .select("id, codigo, razon_social, nit, ciudad, telefono, correo, categoria, estado, score, incumplimientos_count, bloqueado, bloqueado_motivo, dias_credito")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("razon_social", { ascending: true });

  if (error) {
    logger.error("Error listando proveedores", { data: { error } });
    return [];
  }

  return (data || []).map((p: any) => ({
    id: p.id,
    codigo: p.codigo,
    razonSocial: p.razon_social,
    nit: p.nit,
    ciudad: p.ciudad,
    telefono: p.telefono,
    correo: p.correo,
    categoria: p.categoria,
    estado: p.estado,
    score: p.score,
    incumplimientosCount: p.incumplimientos_count,
    bloqueado: p.bloqueado,
    bloqueadoMotivo: p.bloqueado_motivo,
    diasCredito: p.dias_credito,
  }));
}

export async function createProveedor(
  tenantCode: string | null,
  input: unknown
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const ctx = await requireAction("purchases.create");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);
    const data = validate(createProveedorSchema, input);

    const { data: prov, error } = await supabaseAdmin
      .from("proveedores")
      .insert({
        tenant_id: tenantId,
        razon_social: data.razonSocial,
        nit: data.nit || null,
        direccion: data.direccion || null,
        ciudad: data.ciudad || null,
        telefono: data.telefono || null,
        correo: data.correo || null,
        sitio_web: data.sitioWeb || null,
        categoria: data.categoria,
        dias_credito: data.diasCredito,
        condiciones_pago: data.condicionesPago || null,
        created_by: ctx.userId,
      })
      .select("id")
      .single();

    if (error || !prov) {
      logger.error("Error creando proveedor", { data: { error } });
      return { success: false, error: error?.message || "Error creando el proveedor" };
    }

    return { success: true, id: prov.id };
  } catch (err) {
    logger.error("Exception in createProveedor", { error: err instanceof Error ? err : undefined });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateProveedor(
  tenantCode: string | null,
  proveedorId: string,
  input: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await requireAction("purchases.create");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);
    const data = validate(updateProveedorSchema, input);

    const { data: existing } = await supabaseAdmin
      .from("proveedores")
      .select("id")
      .eq("id", proveedorId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (!existing) return { success: false, error: "Proveedor no encontrado en este tenant." };

    const update: Record<string, unknown> = { updated_by: ctx.userId, updated_at: new Date().toISOString() };
    if (data.razonSocial !== undefined) update.razon_social = data.razonSocial;
    if (data.nit !== undefined) update.nit = data.nit;
    if (data.direccion !== undefined) update.direccion = data.direccion;
    if (data.ciudad !== undefined) update.ciudad = data.ciudad;
    if (data.telefono !== undefined) update.telefono = data.telefono;
    if (data.correo !== undefined) update.correo = data.correo;
    if (data.sitioWeb !== undefined) update.sitio_web = data.sitioWeb;
    if (data.categoria !== undefined) update.categoria = data.categoria;
    if (data.diasCredito !== undefined) update.dias_credito = data.diasCredito;
    if (data.condicionesPago !== undefined) update.condiciones_pago = data.condicionesPago;
    if (data.estado !== undefined) update.estado = data.estado;

    const { error } = await supabaseAdmin
      .from("proveedores")
      .update(update)
      .eq("id", proveedorId)
      .eq("tenant_id", tenantId);

    if (error) {
      logger.error("Error actualizando proveedor", { data: { error } });
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    logger.error("Exception in updateProveedor", { error: err instanceof Error ? err : undefined });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ==========================================
// SOLICITUDES DE COMPRA
// ==========================================

export interface SolicitudCompraRow {
  id: string;
  codigo: string;
  area: string | null;
  proyecto: string | null;
  prioridad: string;
  estado: string;
  justificacion: string;
  valorEstimado: number | null;
  fechaNecesidad: string | null;
  solicitanteNombre: string;
  motivoRechazo: string | null;
  motivoCancelacion: string | null;
  createdAt: string;
  items: { id: string; descripcion: string; cantidad: number; unidad: string }[];
}

export async function listSolicitudesCompra(tenantCode?: string | null): Promise<SolicitudCompraRow[]> {
  const ctx = await requireAction("purchases.view");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data, error } = await supabaseAdmin
    .from("solicitudes_compra")
    .select("id, codigo, area, proyecto, prioridad, estado, justificacion, valor_estimado, fecha_necesidad, solicitante_id, motivo_rechazo, motivo_cancelacion, created_at")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Error listando solicitudes de compra", { data: { error } });
    return [];
  }

  const rows = data || [];
  const solicitanteIds = [...new Set(rows.map((r: any) => r.solicitante_id).filter(Boolean))];
  const { data: users } = solicitanteIds.length > 0
    ? await supabaseAdmin.from("users").select("id, first_name, last_name").in("id", solicitanteIds)
    : { data: [] };
  const userById = new Map((users || []).map((u: any) => [u.id, `${u.first_name} ${u.last_name}`]));

  const solicitudIds = rows.map((r: any) => r.id);
  const { data: items } = solicitudIds.length > 0
    ? await supabaseAdmin.from("solicitud_compra_items").select("id, solicitud_id, descripcion, cantidad, unidad").in("solicitud_id", solicitudIds)
    : { data: [] };
  const itemsBySolicitud = new Map<string, { id: string; descripcion: string; cantidad: number; unidad: string }[]>();
  for (const it of items || []) {
    const list = itemsBySolicitud.get(it.solicitud_id) || [];
    list.push({ id: it.id, descripcion: it.descripcion, cantidad: Number(it.cantidad), unidad: it.unidad });
    itemsBySolicitud.set(it.solicitud_id, list);
  }

  return rows.map((r: any) => ({
    id: r.id,
    codigo: r.codigo,
    area: r.area,
    proyecto: r.proyecto,
    prioridad: r.prioridad,
    estado: r.estado,
    justificacion: r.justificacion,
    valorEstimado: r.valor_estimado !== null ? Number(r.valor_estimado) : null,
    fechaNecesidad: r.fecha_necesidad,
    solicitanteNombre: userById.get(r.solicitante_id) || "—",
    motivoRechazo: r.motivo_rechazo,
    motivoCancelacion: r.motivo_cancelacion,
    createdAt: r.created_at,
    items: itemsBySolicitud.get(r.id) || [],
  }));
}

export async function createSolicitudCompra(
  tenantCode: string | null,
  input: unknown
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const ctx = await requireAction("purchases.create");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);
    const data = validate(createSolicitudCompraSchema, input);

    const { data: sc, error } = await supabaseAdmin.rpc("create_solicitud_compra_bridged", {
      p_tenant_id: tenantId,
      p_area: data.area || null,
      p_proyecto: data.proyecto || null,
      p_prioridad: data.prioridad,
      p_justificacion: data.justificacion,
      p_fecha_necesidad: data.fechaNecesidad || null,
      p_centro_costos: data.centroCostos || null,
      p_valor_estimado: data.valorEstimado ?? null,
      p_actor_user_id: ctx.userId,
    });

    if (error || !sc) {
      logger.error("Error creando solicitud de compra", { data: { error } });
      return { success: false, error: error?.message || "Error creando la solicitud" };
    }

    const { error: itemsErr } = await supabaseAdmin.from("solicitud_compra_items").insert(
      data.items.map((it) => ({
        tenant_id: tenantId,
        solicitud_id: sc.id,
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        unidad: it.unidad,
        proveedor_sugerido_id: it.proveedorSugeridoId || null,
      }))
    );
    if (itemsErr) {
      logger.error("Error creando items de solicitud de compra", { data: { error: itemsErr } });
      return { success: false, error: itemsErr.message };
    }

    emitBusinessEvent(tenantId, "SOLICITUD_COMPRA_CREATED", "SOLICITUD_COMPRA", sc.id, { codigo: sc.codigo }, ctx.userId);
    return { success: true, id: sc.id };
  } catch (err) {
    logger.error("Exception in createSolicitudCompra", { error: err instanceof Error ? err : undefined });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateSolicitudCompraStatus(
  tenantCode: string | null,
  input: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await requireAction("purchases.approve");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);
    const data = validate(updateSolicitudCompraStatusSchema, input);

    const { error } = await supabaseAdmin.rpc("update_solicitud_compra_status_bridged", {
      p_solicitud_id: data.solicitudId,
      p_tenant_id: tenantId,
      p_new_status: data.newStatus,
      p_actor_user_id: ctx.userId,
      p_motivo_rechazo: data.motivoRechazo || null,
      p_motivo_cancelacion: data.motivoCancelacion || null,
    });

    if (error) {
      logger.error("Error actualizando estado de solicitud de compra", { data: { error } });
      return { success: false, error: error.message };
    }

    emitBusinessEvent(tenantId, "SOLICITUD_COMPRA_STATUS_CHANGED", "SOLICITUD_COMPRA", data.solicitudId, { newStatus: data.newStatus }, ctx.userId);
    return { success: true };
  } catch (err) {
    logger.error("Exception in updateSolicitudCompraStatus", { error: err instanceof Error ? err : undefined });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ==========================================
// COTIZACIONES DE PROVEEDOR
// ==========================================

export interface CotizacionProveedorRow {
  id: string;
  codigo: string;
  solicitudId: string;
  proveedorId: string;
  proveedorNombre: string;
  valor: number;
  moneda: string;
  estado: string;
  fechaEntrega: string | null;
  garantia: string | null;
}

export async function listCotizacionesProveedor(
  tenantCode: string | null,
  solicitudId?: string
): Promise<CotizacionProveedorRow[]> {
  const ctx = await requireAction("purchases.view");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  let query = supabaseAdmin
    .from("cotizaciones_proveedor")
    .select("id, codigo, solicitud_id, proveedor_id, valor, moneda, estado, fecha_entrega, garantia")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (solicitudId) query = query.eq("solicitud_id", solicitudId);

  const { data, error } = await query;
  if (error) {
    logger.error("Error listando cotizaciones de proveedor", { data: { error } });
    return [];
  }

  const rows = data || [];
  const proveedorIds = [...new Set(rows.map((r: any) => r.proveedor_id))];
  const { data: provs } = proveedorIds.length > 0
    ? await supabaseAdmin.from("proveedores").select("id, razon_social").in("id", proveedorIds)
    : { data: [] };
  const provById = new Map((provs || []).map((p: any) => [p.id, p.razon_social]));

  return rows.map((r: any) => ({
    id: r.id,
    codigo: r.codigo,
    solicitudId: r.solicitud_id,
    proveedorId: r.proveedor_id,
    proveedorNombre: provById.get(r.proveedor_id) || "—",
    valor: Number(r.valor),
    moneda: r.moneda,
    estado: r.estado,
    fechaEntrega: r.fecha_entrega,
    garantia: r.garantia,
  }));
}

export async function createCotizacionProveedor(
  tenantCode: string | null,
  input: unknown
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const ctx = await requireAction("purchases.create");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);
    const data = validate(createCotizacionProveedorSchema, input);

    const { data: cot, error } = await supabaseAdmin
      .from("cotizaciones_proveedor")
      .insert({
        tenant_id: tenantId,
        solicitud_id: data.solicitudId,
        proveedor_id: data.proveedorId,
        valor: data.valor,
        moneda: data.moneda,
        fecha_entrega: data.fechaEntrega || null,
        garantia: data.garantia || null,
        condiciones: data.condiciones || null,
        created_by: ctx.userId,
      })
      .select("id")
      .single();

    if (error || !cot) {
      logger.error("Error creando cotización de proveedor", { data: { error } });
      return { success: false, error: error?.message || "Error creando la cotización" };
    }

    if (data.items.length > 0) {
      const { error: itemsErr } = await supabaseAdmin.from("cotizacion_proveedor_items").insert(
        data.items.map((it) => ({
          tenant_id: tenantId,
          cotizacion_proveedor_id: cot.id,
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          unidad: it.unidad,
          precio_unitario: it.precioUnitario,
        }))
      );
      if (itemsErr) logger.error("Error creando items de cotización", { data: { error: itemsErr } });
    }

    return { success: true, id: cot.id };
  } catch (err) {
    logger.error("Exception in createCotizacionProveedor", { error: err instanceof Error ? err : undefined });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateCotizacionProveedorEstado(
  tenantCode: string | null,
  input: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await requireAction("purchases.create");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);
    const data = validate(cotizacionProveedorEstadoSchema, input);

    const { data: existing } = await supabaseAdmin
      .from("cotizaciones_proveedor")
      .select("id")
      .eq("id", data.cotizacionId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (!existing) return { success: false, error: "Cotización no encontrada en este tenant." };

    const { error } = await supabaseAdmin
      .from("cotizaciones_proveedor")
      .update({ estado: data.estado, updated_by: ctx.userId, updated_at: new Date().toISOString() })
      .eq("id", data.cotizacionId)
      .eq("tenant_id", tenantId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    logger.error("Exception in updateCotizacionProveedorEstado", { error: err instanceof Error ? err : undefined });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ==========================================
// ÓRDENES DE COMPRA
// ==========================================

export interface OrdenCompraItemRow {
  id: string;
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  subtotal: number;
  recibido: number;
  pendiente: number;
}

export interface OrdenCompraRow {
  id: string;
  codigo: string;
  proveedorId: string;
  proveedorNombre: string;
  estado: string;
  subtotal: number;
  iva: number;
  retencion: number;
  total: number;
  fechaEntrega: string | null;
  motivoCancelacion: string | null;
  createdAt: string;
  items: OrdenCompraItemRow[];
}

export async function listOrdenesCompra(tenantCode?: string | null): Promise<OrdenCompraRow[]> {
  const ctx = await requireAction("purchases.view");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data, error } = await supabaseAdmin
    .from("ordenes_compra")
    .select("id, codigo, proveedor_id, estado, subtotal, iva, retencion, total, fecha_entrega, motivo_cancelacion, created_at")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Error listando órdenes de compra", { data: { error } });
    return [];
  }

  const rows = data || [];
  const proveedorIds = [...new Set(rows.map((r: any) => r.proveedor_id))];
  const { data: provs } = proveedorIds.length > 0
    ? await supabaseAdmin.from("proveedores").select("id, razon_social").in("id", proveedorIds)
    : { data: [] };
  const provById = new Map((provs || []).map((p: any) => [p.id, p.razon_social]));

  const ocIds = rows.map((r: any) => r.id);
  const { data: items } = ocIds.length > 0
    ? await supabaseAdmin.from("oc_items").select("id, oc_id, descripcion, cantidad, unidad, precio_unitario, subtotal, recibido, pendiente").in("oc_id", ocIds)
    : { data: [] };
  const itemsByOc = new Map<string, OrdenCompraItemRow[]>();
  for (const it of items || []) {
    const list = itemsByOc.get(it.oc_id) || [];
    list.push({
      id: it.id,
      descripcion: it.descripcion,
      cantidad: Number(it.cantidad),
      unidad: it.unidad,
      precioUnitario: Number(it.precio_unitario),
      subtotal: Number(it.subtotal),
      recibido: Number(it.recibido),
      pendiente: Number(it.pendiente),
    });
    itemsByOc.set(it.oc_id, list);
  }

  return rows.map((r: any) => ({
    id: r.id,
    codigo: r.codigo,
    proveedorId: r.proveedor_id,
    proveedorNombre: provById.get(r.proveedor_id) || "—",
    estado: r.estado,
    subtotal: Number(r.subtotal),
    iva: Number(r.iva),
    retencion: Number(r.retencion),
    total: Number(r.total),
    fechaEntrega: r.fecha_entrega,
    motivoCancelacion: r.motivo_cancelacion,
    createdAt: r.created_at,
    items: itemsByOc.get(r.id) || [],
  }));
}

export async function createOrdenCompra(
  tenantCode: string | null,
  input: unknown
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const ctx = await requireAction("purchases.create");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);
    const data = validate(createOrdenCompraSchema, input);

    const subtotal = data.items.reduce((sum, it) => sum + it.cantidad * it.precioUnitario - it.descuento, 0);
    const total = subtotal + data.iva - data.retencion;

    const { data: oc, error } = await supabaseAdmin.rpc("create_orden_compra_bridged", {
      p_tenant_id: tenantId,
      p_solicitud_id: data.solicitudId || null,
      p_proveedor_id: data.proveedorId,
      p_cotizacion_id: data.cotizacionId || null,
      p_proyecto: data.proyecto || null,
      p_subtotal: subtotal,
      p_descuento_total: data.items.reduce((sum, it) => sum + it.descuento, 0),
      p_iva: data.iva,
      p_retencion: data.retencion,
      p_total: total,
      p_fecha_entrega: data.fechaEntrega || null,
      p_condiciones_pago: data.condicionesPago || null,
      p_actor_user_id: ctx.userId,
    });

    if (error || !oc) {
      logger.error("Error creando orden de compra", { data: { error } });
      return { success: false, error: error?.message || "Error creando la orden de compra" };
    }

    const { error: itemsErr } = await supabaseAdmin.from("oc_items").insert(
      data.items.map((it) => ({
        tenant_id: tenantId,
        oc_id: oc.id,
        producto_id: it.productoId || null,
        descripcion: it.descripcion,
        cantidad: it.cantidad,
        unidad: it.unidad,
        precio_unitario: it.precioUnitario,
        descuento: it.descuento,
      }))
    );
    if (itemsErr) {
      logger.error("Error creando items de orden de compra", { data: { error: itemsErr } });
      return { success: false, error: itemsErr.message };
    }

    emitBusinessEvent(tenantId, "ORDEN_COMPRA_CREATED", "ORDEN_COMPRA", oc.id, { codigo: oc.codigo, total }, ctx.userId);
    return { success: true, id: oc.id };
  } catch (err) {
    logger.error("Exception in createOrdenCompra", { error: err instanceof Error ? err : undefined });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function updateOrdenCompraStatus(
  tenantCode: string | null,
  input: unknown
): Promise<{ success: boolean; error?: string }> {
  try {
    const ctx = await requireAction("purchases.approve");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);
    const data = validate(updateOrdenCompraStatusSchema, input);

    const { error } = await supabaseAdmin.rpc("update_orden_compra_status_bridged", {
      p_orden_id: data.ordenId,
      p_tenant_id: tenantId,
      p_new_status: data.newStatus,
      p_actor_user_id: ctx.userId,
      p_motivo_cancelacion: data.motivoCancelacion || null,
    });

    if (error) {
      logger.error("Error actualizando estado de orden de compra", { data: { error } });
      return { success: false, error: error.message };
    }

    emitBusinessEvent(tenantId, "ORDEN_COMPRA_STATUS_CHANGED", "ORDEN_COMPRA", data.ordenId, { newStatus: data.newStatus }, ctx.userId);
    return { success: true };
  } catch (err) {
    logger.error("Exception in updateOrdenCompraStatus", { error: err instanceof Error ? err : undefined });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ==========================================
// RECEPCIONES
// ==========================================

export interface RecepcionRow {
  id: string;
  codigo: string;
  ocId: string;
  ocCodigo: string;
  tipo: string;
  estado: string;
  fechaRecepcion: string;
  observaciones: string | null;
}

export async function listRecepciones(tenantCode: string | null, ocId?: string): Promise<RecepcionRow[]> {
  const ctx = await requireAction("purchases.view");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  let query = supabaseAdmin
    .from("recepciones")
    .select("id, codigo, oc_id, tipo, estado, fecha_recepcion, observaciones")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (ocId) query = query.eq("oc_id", ocId);

  const { data, error } = await query;
  if (error) {
    logger.error("Error listando recepciones", { data: { error } });
    return [];
  }

  const rows = data || [];
  const ocIds = [...new Set(rows.map((r: any) => r.oc_id))];
  const { data: ocs } = ocIds.length > 0
    ? await supabaseAdmin.from("ordenes_compra").select("id, codigo").in("id", ocIds)
    : { data: [] };
  const ocById = new Map((ocs || []).map((o: any) => [o.id, o.codigo]));

  return rows.map((r: any) => ({
    id: r.id,
    codigo: r.codigo,
    ocId: r.oc_id,
    ocCodigo: ocById.get(r.oc_id) || "—",
    tipo: r.tipo,
    estado: r.estado,
    fechaRecepcion: r.fecha_recepcion,
    observaciones: r.observaciones,
  }));
}

export async function createRecepcion(
  tenantCode: string | null,
  input: unknown
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    const ctx = await requireAction("purchases.create");
    const tenantId = await getTenantId(tenantCode);
    await validateTenantAccess(ctx.userId, ctx.role, tenantId);
    const data = validate(createRecepcionSchema, input);

    const { data: oc } = await supabaseAdmin
      .from("ordenes_compra")
      .select("id, proveedor_id")
      .eq("id", data.ocId)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    if (!oc) return { success: false, error: "Orden de compra no encontrada en este tenant." };

    const { data: rec, error } = await supabaseAdmin
      .from("recepciones")
      .insert({
        tenant_id: tenantId,
        oc_id: data.ocId,
        proveedor_id: oc.proveedor_id,
        warehouse_id: data.warehouseId,
        tipo: data.tipo,
        recibido_por: ctx.userId,
        observaciones: data.observaciones || null,
        created_by: ctx.userId,
      })
      .select("id, codigo")
      .single();

    if (error || !rec) {
      logger.error("Error creando recepción", { data: { error } });
      return { success: false, error: error?.message || "Error creando la recepción" };
    }

    // Los items disparan handle_recepcion_item_inventory (posting a
    // inventory_movements + recálculo de estado de la OC) y, si algún item
    // llega RECHAZADO, handle_proveedor_incumplimiento (score/bloqueo del
    // proveedor) — ambos ya viven en la BD, no se reimplementan acá.
    const { error: itemsErr } = await supabaseAdmin.from("recepcion_items").insert(
      data.items.map((it) => ({
        tenant_id: tenantId,
        recepcion_id: rec.id,
        oc_item_id: it.ocItemId,
        cantidad_recibida: it.cantidadRecibida,
        estado: it.estado,
        observaciones: it.observaciones || null,
      }))
    );
    if (itemsErr) {
      logger.error("Error creando items de recepción", { data: { error: itemsErr } });
      return { success: false, error: itemsErr.message };
    }

    emitBusinessEvent(tenantId, "RECEPCION_CREATED", "RECEPCION", rec.id, { codigo: rec.codigo, ocId: data.ocId }, ctx.userId);
    return { success: true, id: rec.id };
  } catch (err) {
    logger.error("Exception in createRecepcion", { error: err instanceof Error ? err : undefined });
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ==========================================
// HELPERS (dropdowns)
// ==========================================

export interface WarehouseOption {
  id: string;
  name: string;
}

export async function listWarehousesForPurchases(tenantCode?: string | null): Promise<WarehouseOption[]> {
  const ctx = await requireAction("purchases.view");
  const tenantId = await getTenantId(tenantCode);
  await validateTenantAccess(ctx.userId, ctx.role, tenantId);

  const { data, error } = await supabaseAdmin
    .from("warehouses")
    .select("id, name")
    .eq("tenant_id", tenantId)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  if (error) {
    logger.error("Error listando bodegas", { data: { error } });
    return [];
  }
  return data || [];
}
