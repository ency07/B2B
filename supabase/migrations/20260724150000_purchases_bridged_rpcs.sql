-- Puente de identidad para el módulo de Compras (9 tablas ya existían en BD,
-- 0 código de aplicación las usaba). Solo solicitudes_compra y ordenes_compra
-- tienen triggers de trazabilidad (handle_*_traceability) que leen
-- get_current_user_id() para created_by/status_changed_by/updated_by, y
-- validate_solicitud_compra_transitions() usa current_user_has_role() para
-- los umbrales de aprobación por monto — ambos requieren que el actor real
-- esté "puenteado" vía set_erp_actor_context() en la misma transacción
-- (mismo patrón que create_requirement_bridged / update_job_status_bridged).
-- El resto de tablas (proveedores, *_items, cotizaciones_proveedor,
-- recepciones) no tienen ese tipo de trigger — created_by/updated_by se
-- setean directo desde la Server Action, sin RPC puente.

CREATE OR REPLACE FUNCTION public.create_solicitud_compra_bridged(
  p_tenant_id uuid,
  p_area varchar,
  p_proyecto varchar,
  p_prioridad varchar,
  p_justificacion text,
  p_fecha_necesidad date,
  p_centro_costos varchar,
  p_valor_estimado numeric,
  p_actor_user_id uuid
)
RETURNS public.solicitudes_compra
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_sc public.solicitudes_compra;
BEGIN
  PERFORM set_erp_actor_context(p_actor_user_id);

  INSERT INTO public.solicitudes_compra (
    tenant_id, solicitante_id, area, proyecto, prioridad, justificacion,
    fecha_necesidad, centro_costos, valor_estimado
  ) VALUES (
    p_tenant_id, p_actor_user_id, p_area, p_proyecto, p_prioridad, p_justificacion,
    p_fecha_necesidad, p_centro_costos, p_valor_estimado
  )
  RETURNING * INTO v_sc;

  RETURN v_sc;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_solicitud_compra_bridged(uuid,varchar,varchar,varchar,text,date,varchar,numeric,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_solicitud_compra_bridged(uuid,varchar,varchar,varchar,text,date,varchar,numeric,uuid) TO service_role;


CREATE OR REPLACE FUNCTION public.update_solicitud_compra_status_bridged(
  p_solicitud_id uuid,
  p_tenant_id uuid,
  p_new_status varchar,
  p_actor_user_id uuid,
  p_motivo_rechazo text DEFAULT NULL,
  p_motivo_cancelacion text DEFAULT NULL
)
RETURNS public.solicitudes_compra
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_sc public.solicitudes_compra;
BEGIN
  PERFORM set_erp_actor_context(p_actor_user_id);

  UPDATE public.solicitudes_compra SET
    estado = p_new_status,
    motivo_rechazo = CASE WHEN p_new_status = 'RECHAZADA' THEN p_motivo_rechazo ELSE motivo_rechazo END,
    motivo_cancelacion = CASE WHEN p_new_status = 'CANCELADA' THEN p_motivo_cancelacion ELSE motivo_cancelacion END
  WHERE id = p_solicitud_id AND tenant_id = p_tenant_id
  RETURNING * INTO v_sc;

  RETURN v_sc;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_solicitud_compra_status_bridged(uuid,uuid,varchar,uuid,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_solicitud_compra_status_bridged(uuid,uuid,varchar,uuid,text,text) TO service_role;


CREATE OR REPLACE FUNCTION public.create_orden_compra_bridged(
  p_tenant_id uuid,
  p_solicitud_id uuid,
  p_proveedor_id uuid,
  p_cotizacion_id uuid,
  p_proyecto varchar,
  p_subtotal numeric,
  p_descuento_total numeric,
  p_iva numeric,
  p_retencion numeric,
  p_total numeric,
  p_fecha_entrega date,
  p_condiciones_pago text,
  p_actor_user_id uuid
)
RETURNS public.ordenes_compra
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_oc public.ordenes_compra;
BEGIN
  PERFORM set_erp_actor_context(p_actor_user_id);

  INSERT INTO public.ordenes_compra (
    tenant_id, solicitud_id, proveedor_id, cotizacion_id, proyecto,
    subtotal, descuento_total, iva, retencion, total,
    fecha_entrega, condiciones_pago, comprador_id
  ) VALUES (
    p_tenant_id, p_solicitud_id, p_proveedor_id, p_cotizacion_id, p_proyecto,
    p_subtotal, p_descuento_total, p_iva, p_retencion, p_total,
    p_fecha_entrega, p_condiciones_pago, p_actor_user_id
  )
  RETURNING * INTO v_oc;

  RETURN v_oc;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_orden_compra_bridged(uuid,uuid,uuid,uuid,varchar,numeric,numeric,numeric,numeric,numeric,date,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_orden_compra_bridged(uuid,uuid,uuid,uuid,varchar,numeric,numeric,numeric,numeric,numeric,date,text,uuid) TO service_role;


CREATE OR REPLACE FUNCTION public.update_orden_compra_status_bridged(
  p_orden_id uuid,
  p_tenant_id uuid,
  p_new_status varchar,
  p_actor_user_id uuid,
  p_motivo_cancelacion text DEFAULT NULL
)
RETURNS public.ordenes_compra
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_oc public.ordenes_compra;
BEGIN
  PERFORM set_erp_actor_context(p_actor_user_id);

  UPDATE public.ordenes_compra SET
    estado = p_new_status,
    motivo_cancelacion = CASE WHEN p_new_status = 'CANCELADA' THEN p_motivo_cancelacion ELSE motivo_cancelacion END,
    aprobado_por = CASE WHEN p_new_status = 'ACEPTADA' THEN p_actor_user_id ELSE aprobado_por END
  WHERE id = p_orden_id AND tenant_id = p_tenant_id
  RETURNING * INTO v_oc;

  RETURN v_oc;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_orden_compra_status_bridged(uuid,uuid,varchar,uuid,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_orden_compra_status_bridged(uuid,uuid,varchar,uuid,text) TO service_role;
