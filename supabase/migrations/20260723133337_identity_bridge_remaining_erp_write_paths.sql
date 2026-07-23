-- Continuación de E-016 (identity_bridge_erp_actor_context): las 9 escrituras
-- reales restantes vía supabaseAdmin.from().insert()/.update() sobre tablas
-- gateadas por enforce_*_permissions, confirmadas por grep exhaustivo de todo
-- src/ (no solo core.ts): jobs (INSERT+UPDATE), inventory_movements (INSERT),
-- credit_notes (INSERT), requirements (INSERT+UPDATE, 2 call sites de UPDATE
-- comparten la misma forma), quotes (INSERT+UPDATE). Mismo patrón que
-- register_payment_for_invoice: cada RPC llama set_erp_actor_context() e
-- inserta/actualiza en la misma transacción.
--
-- NOTA (confirmado, no en el análisis original de 41 gaps ni en E-016): las
-- otras 6 tablas listadas originalmente como "gateadas sin arreglar"
-- (warehouses, inventory_batches, inventory_serials, approval_flows,
-- approval_rules, approval_steps) NO tienen ningún punto de escritura en todo
-- src/ — warehouses tiene 4 filas (solo seed/migración), las otras 5 están
-- vacías (0 filas). No hay código de app que romper ni que arreglar para
-- ellas hoy; no se crean RPCs para tablas sin escritor real.

CREATE OR REPLACE FUNCTION public.create_job_bridged(
  p_tenant_id uuid,
  p_client_id uuid,
  p_requirement_id uuid,
  p_site_id uuid,
  p_area_id uuid,
  p_title varchar,
  p_description text,
  p_assigned_user_id uuid,
  p_planned_start_date timestamp,
  p_planned_end_date timestamp,
  p_priority varchar,
  p_actor_user_id uuid
)
RETURNS public.jobs
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_job public.jobs;
BEGIN
  PERFORM set_erp_actor_context(p_actor_user_id);

  INSERT INTO public.jobs (
    tenant_id, client_id, requirement_id, site_id, area_id, title, description,
    assigned_user_id, planned_start_date, planned_end_date, priority, status, created_by
  ) VALUES (
    p_tenant_id, p_client_id, p_requirement_id, p_site_id, p_area_id, p_title, p_description,
    p_assigned_user_id, p_planned_start_date, p_planned_end_date, p_priority, 'PENDIENTE', p_actor_user_id
  )
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_job_bridged(uuid,uuid,uuid,uuid,uuid,varchar,text,uuid,timestamp,timestamp,varchar,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_job_bridged(uuid,uuid,uuid,uuid,uuid,varchar,text,uuid,timestamp,timestamp,varchar,uuid) TO service_role;


CREATE OR REPLACE FUNCTION public.update_job_status_bridged(
  p_job_id uuid,
  p_new_status varchar,
  p_actor_user_id uuid,
  p_cancel_reason text DEFAULT NULL,
  p_actual_hours numeric DEFAULT NULL
)
RETURNS public.jobs
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_job public.jobs;
BEGIN
  PERFORM set_erp_actor_context(p_actor_user_id);

  UPDATE public.jobs SET
    status = p_new_status,
    updated_by = p_actor_user_id,
    updated_at = now(),
    actual_start_date = CASE WHEN p_new_status = 'EN_EJECUCION' THEN now() ELSE actual_start_date END,
    actual_end_date = CASE WHEN p_new_status = 'FINALIZADO' THEN now() ELSE actual_end_date END,
    actual_hours = CASE WHEN p_new_status = 'FINALIZADO' AND p_actual_hours IS NOT NULL THEN p_actual_hours ELSE actual_hours END,
    cancel_reason = CASE WHEN p_new_status = 'CANCELADO' THEN p_cancel_reason ELSE cancel_reason END,
    cancelled_by = CASE WHEN p_new_status = 'CANCELADO' THEN p_actor_user_id ELSE cancelled_by END,
    cancelled_at = CASE WHEN p_new_status = 'CANCELADO' THEN now() ELSE cancelled_at END
  WHERE id = p_job_id
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_job_status_bridged(uuid,varchar,uuid,text,numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_job_status_bridged(uuid,varchar,uuid,text,numeric) TO service_role;


CREATE OR REPLACE FUNCTION public.create_inventory_movement_bridged(
  p_tenant_id uuid,
  p_item_id uuid,
  p_movement_type varchar,
  p_quantity numeric,
  p_unit_cost numeric,
  p_notes text,
  p_source_warehouse_id uuid,
  p_destination_warehouse_id uuid,
  p_actor_user_id uuid
)
RETURNS public.inventory_movements
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_mov public.inventory_movements;
BEGIN
  PERFORM set_erp_actor_context(p_actor_user_id);

  IF p_movement_type = 'Transferencia' THEN
    INSERT INTO public.inventory_movements (
      tenant_id, item_id, movement_type, quantity, unit_cost, notes, status,
      source_warehouse_id, destination_warehouse_id, created_by
    ) VALUES (
      p_tenant_id, p_item_id, p_movement_type, p_quantity, p_unit_cost, p_notes, 'Aplicado',
      p_source_warehouse_id, p_destination_warehouse_id, p_actor_user_id
    )
    RETURNING * INTO v_mov;
  ELSE
    INSERT INTO public.inventory_movements (
      tenant_id, item_id, movement_type, quantity, unit_cost, notes, status,
      warehouse_id, created_by
    ) VALUES (
      p_tenant_id, p_item_id, p_movement_type, p_quantity, p_unit_cost, p_notes, 'Aplicado',
      p_source_warehouse_id, p_actor_user_id
    )
    RETURNING * INTO v_mov;
  END IF;

  RETURN v_mov;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_inventory_movement_bridged(uuid,uuid,varchar,numeric,numeric,text,uuid,uuid,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_inventory_movement_bridged(uuid,uuid,varchar,numeric,numeric,text,uuid,uuid,uuid) TO service_role;


CREATE OR REPLACE FUNCTION public.create_credit_note_bridged(
  p_tenant_id uuid,
  p_invoice_id uuid,
  p_client_id uuid,
  p_reason varchar,
  p_description text,
  p_subtotal numeric,
  p_tax_amount numeric,
  p_total_amount numeric,
  p_actor_user_id uuid
)
RETURNS public.credit_notes
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_cn public.credit_notes;
BEGIN
  PERFORM set_erp_actor_context(p_actor_user_id);

  INSERT INTO public.credit_notes (
    tenant_id, invoice_id, client_id, reason, description, subtotal, tax_amount, total_amount, status, created_by
  ) VALUES (
    p_tenant_id, p_invoice_id, p_client_id, p_reason, p_description, p_subtotal, p_tax_amount, p_total_amount, 'APLICADA', p_actor_user_id
  )
  RETURNING * INTO v_cn;

  RETURN v_cn;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_credit_note_bridged(uuid,uuid,uuid,varchar,text,numeric,numeric,numeric,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_credit_note_bridged(uuid,uuid,uuid,varchar,text,numeric,numeric,numeric,uuid) TO service_role;


CREATE OR REPLACE FUNCTION public.create_requirement_bridged(
  p_tenant_id uuid,
  p_client_id uuid,
  p_title varchar,
  p_category varchar,
  p_priority varchar,
  p_actor_user_id uuid
)
RETURNS public.requirements
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_req public.requirements;
BEGIN
  PERFORM set_erp_actor_context(p_actor_user_id);

  INSERT INTO public.requirements (
    tenant_id, client_id, title, category, priority, status, created_by
  ) VALUES (
    p_tenant_id, p_client_id, p_title, p_category, p_priority, 'BORRADOR', p_actor_user_id
  )
  RETURNING * INTO v_req;

  RETURN v_req;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_requirement_bridged(uuid,uuid,varchar,varchar,varchar,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_requirement_bridged(uuid,uuid,varchar,varchar,varchar,uuid) TO service_role;


-- Compartido por updateRequirementStatus() y convertQuoteToJob() — ambas
-- hacen la misma forma de escritura (status + quién + opcionalmente
-- ingeniero/comercial asignado). p_set_engineering/p_set_sales replican el
-- whitelist anti mass-assignment que ya existía en TypeScript
-- (ALLOWED_EXTRA_KEYS): "no tocar la columna" vs "tocarla con este valor,
-- incluido NULL" son cosas distintas y había que preservar esa diferencia.
CREATE OR REPLACE FUNCTION public.update_requirement_status_bridged(
  p_requirement_id uuid,
  p_tenant_id uuid,
  p_new_status varchar,
  p_actor_user_id uuid,
  p_set_engineering boolean DEFAULT false,
  p_engineering_user_id uuid DEFAULT NULL,
  p_set_sales boolean DEFAULT false,
  p_sales_user_id uuid DEFAULT NULL
)
RETURNS public.requirements
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_req public.requirements;
BEGIN
  PERFORM set_erp_actor_context(p_actor_user_id);

  UPDATE public.requirements SET
    status = p_new_status,
    updated_by = p_actor_user_id,
    updated_at = now(),
    engineering_user_id = CASE WHEN p_set_engineering THEN p_engineering_user_id ELSE engineering_user_id END,
    sales_user_id = CASE WHEN p_set_sales THEN p_sales_user_id ELSE sales_user_id END
  WHERE id = p_requirement_id AND tenant_id = p_tenant_id
  RETURNING * INTO v_req;

  RETURN v_req;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_requirement_status_bridged(uuid,uuid,varchar,uuid,boolean,uuid,boolean,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_requirement_status_bridged(uuid,uuid,varchar,uuid,boolean,uuid,boolean,uuid) TO service_role;


CREATE OR REPLACE FUNCTION public.create_quote_bridged(
  p_tenant_id uuid,
  p_client_id uuid,
  p_requirement_id uuid,
  p_assigned_user_id uuid,
  p_valid_until date,
  p_actor_user_id uuid
)
RETURNS public.quotes
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_quote public.quotes;
BEGIN
  PERFORM set_erp_actor_context(p_actor_user_id);

  INSERT INTO public.quotes (
    tenant_id, client_id, requirement_id, assigned_user_id, valid_until, status, created_by
  ) VALUES (
    p_tenant_id, p_client_id, p_requirement_id, p_assigned_user_id, p_valid_until, 'BORRADOR', p_actor_user_id
  )
  RETURNING * INTO v_quote;

  RETURN v_quote;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_quote_bridged(uuid,uuid,uuid,uuid,date,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_quote_bridged(uuid,uuid,uuid,uuid,date,uuid) TO service_role;


CREATE OR REPLACE FUNCTION public.update_quote_status_bridged(
  p_quote_id uuid,
  p_tenant_id uuid,
  p_status varchar,
  p_actor_user_id uuid
)
RETURNS public.quotes
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_quote public.quotes;
BEGIN
  PERFORM set_erp_actor_context(p_actor_user_id);

  UPDATE public.quotes SET
    status = p_status,
    status_changed_by = p_actor_user_id,
    status_changed_at = now()
  WHERE id = p_quote_id AND tenant_id = p_tenant_id
  RETURNING * INTO v_quote;

  RETURN v_quote;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_quote_status_bridged(uuid,uuid,varchar,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_quote_status_bridged(uuid,uuid,varchar,uuid) TO service_role;
