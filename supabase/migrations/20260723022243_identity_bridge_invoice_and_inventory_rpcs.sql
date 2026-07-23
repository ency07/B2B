-- Mismo bug que registerPayment (ver migración identity_bridge_erp_actor_context):
-- estos RPCs son SECURITY DEFINER y hacen su INSERT internamente, así que el fix
-- es de una sola línea cada uno — set_erp_actor_context() ya existe y
-- get_current_user_id() ya chequea el override, solo falta que estos RPCs lo fijen
-- antes de escribir. Sin esto, invoices/invoice_items/inventory_items/
-- inventory_stock/inventory_movements se insertan con current_user_has_role()
-- resolviendo false para cualquier llamada real vía supabaseAdmin.

CREATE OR REPLACE FUNCTION public.create_invoice_with_item(p_tenant_id uuid, p_client_id uuid, p_amount numeric, p_concept text, p_created_by uuid)
 RETURNS invoices
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_invoice invoices;
BEGIN
  PERFORM set_erp_actor_context(p_created_by);

  -- 1. Cabecera en BORRADOR (totales en 0: los recalcula el after-trigger)
  INSERT INTO invoices (
    tenant_id, invoice_code, client_id, source_type, source_id,
    invoice_date, due_date, subtotal, discount_amount, tax_amount,
    total_amount, paid_amount, status, created_by
  ) VALUES (
    p_tenant_id, '', p_client_id, 'CLIENT', p_client_id,
    CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 0, 0, 0,
    0, 0, 'BORRADOR', p_created_by
  )
  RETURNING * INTO v_invoice;

  -- 2. Línea (permitida en BORRADOR; el after-trigger sube totales a cabecera)
  INSERT INTO invoice_items (
    tenant_id, invoice_id, line_number, description, quantity,
    unit_price, discount_amount, tax_amount, line_total, created_by
  ) VALUES (
    p_tenant_id, v_invoice.id, 1, p_concept, 1,
    p_amount, 0, 0, p_amount, p_created_by
  );

  -- 3. Emitir (congela impuestos vía enforce_invoice_immutability)
  UPDATE invoices SET status = 'EMITIDA' WHERE id = v_invoice.id
  RETURNING * INTO v_invoice;

  RETURN v_invoice;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_inventory_item_with_stock(p_tenant_id uuid, p_item_code text, p_name text, p_description text, p_category text, p_item_type text, p_unit text, p_minimum_stock numeric, p_maximum_stock numeric, p_reorder_point numeric, p_initial_quantity numeric, p_warehouse_id uuid, p_created_by uuid)
 RETURNS inventory_items
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_item inventory_items;
BEGIN
  PERFORM set_erp_actor_context(p_created_by);

  INSERT INTO inventory_items (
    tenant_id, item_code, name, description, category, item_type, unit,
    minimum_stock, maximum_stock, reorder_point, average_cost, last_cost,
    status, created_by
  ) VALUES (
    p_tenant_id, COALESCE(p_item_code, ''), p_name, p_description, p_category,
    p_item_type, p_unit, p_minimum_stock, p_maximum_stock, p_reorder_point,
    0, 0, 'Activo', p_created_by
  )
  RETURNING * INTO v_item;

  IF p_initial_quantity IS NOT NULL
     AND p_initial_quantity > 0
     AND p_warehouse_id IS NOT NULL THEN

    INSERT INTO inventory_stock (
      tenant_id, warehouse_id, item_id, quantity, reserved_quantity, created_by
    ) VALUES (
      p_tenant_id, p_warehouse_id, v_item.id, p_initial_quantity, 0, p_created_by
    )
    ON CONFLICT (tenant_id, warehouse_id, item_id) DO UPDATE
      SET quantity = EXCLUDED.quantity;

    INSERT INTO inventory_movements (
      tenant_id, movement_code, item_id, warehouse_id, movement_type,
      quantity, unit_cost, notes, status, created_by
    ) VALUES (
      p_tenant_id, '', v_item.id, p_warehouse_id, 'Entrada',
      p_initial_quantity, 0, 'Carga inicial de inventario', 'Aplicado', p_created_by
    );
  END IF;

  RETURN v_item;
END;
$function$;
