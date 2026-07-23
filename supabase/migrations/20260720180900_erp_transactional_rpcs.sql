-- ============================================================================
-- ERP · RPCs transaccionales (auditoría ERP · Fase 3 — integridad de estado)
--
-- Problema: createInvoice y createInventoryItem hacían inserts multi-paso desde
-- el cliente JS (supabaseAdmin), que NO soporta transacciones multi-statement.
-- Si el 2º paso fallaba, quedaba estado inconsistente (factura sin líneas,
-- ítem sin stock/movimiento).
--
-- Solución: encapsular cada operación multi-paso en una función PL/pgSQL. Una
-- función se ejecuta dentro de una única transacción implícita: si CUALQUIER
-- statement lanza excepción, TODO hace rollback → atomicidad real.
--
-- Los códigos (invoice_code, movement_code) se dejan vacíos a propósito: los
-- triggers BEFORE INSERT (handle_invoice_sequences / handle_inventory_sequences)
-- los generan atómicamente con get_next_tenant_sequence().
-- ============================================================================

-- ── 1. Factura + primera línea (atómico) ────────────────────────────────────
-- IMPORTANTE: la factura DEBE crearse en BORRADOR para poder insertar líneas
-- (trg_invoice_item_totals_before bloquea líneas si status <> 'BORRADOR'), y
-- luego emitirse. El código original creaba la factura EMITIDA y el insert de
-- la línea era rechazado por el trigger — pero como no verificaba el error,
-- quedaban facturas EMITIDAS sin líneas (bug de estado silencioso).
CREATE OR REPLACE FUNCTION create_invoice_with_item(
  p_tenant_id  uuid,
  p_client_id  uuid,
  p_amount     decimal,
  p_concept    text,
  p_created_by uuid
)
RETURNS invoices
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_invoice invoices;
BEGIN
  -- 1. Cabecera en BORRADOR (totales en 0: los recalcula el after-trigger
  --    update_invoice_headers al insertar la línea).
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

  -- 2. Línea (permitida en BORRADOR).
  INSERT INTO invoice_items (
    tenant_id, invoice_id, line_number, description, quantity,
    unit_price, discount_amount, tax_amount, line_total, created_by
  ) VALUES (
    p_tenant_id, v_invoice.id, 1, p_concept, 1,
    p_amount, 0, 0, p_amount, p_created_by
  );

  -- 3. Emitir (enforce_invoice_immutability congela impuestos en BORRADOR→EMITIDA).
  UPDATE invoices SET status = 'EMITIDA' WHERE id = v_invoice.id
  RETURNING * INTO v_invoice;

  RETURN v_invoice;
END;
$$;

-- ── 2. Ítem de inventario + stock inicial + movimiento (atómico) ─────────────
CREATE OR REPLACE FUNCTION create_inventory_item_with_stock(
  p_tenant_id        uuid,
  p_item_code        text,
  p_name             text,
  p_description      text,
  p_category         text,
  p_item_type        text,
  p_unit             text,
  p_minimum_stock    decimal,
  p_maximum_stock    decimal,
  p_reorder_point    decimal,
  p_initial_quantity decimal,
  p_warehouse_id     uuid,
  p_created_by       uuid
)
RETURNS inventory_items
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_item inventory_items;
BEGIN
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

  -- Stock inicial + movimiento de entrada (solo si se especifica cantidad+bodega)
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
$$;

-- ── Hardening (Red Team) ─────────────────────────────────────────────────────
-- Estas funciones son SECURITY DEFINER (bypassean RLS) y SOLO deben invocarse
-- desde Server Actions con el service_role. Se revoca EXECUTE de PUBLIC (que es
-- de donde anon/authenticated heredan el permiso por defecto) y se otorga
-- explícitamente a service_role, para que NO sean llamables desde el cliente.
REVOKE EXECUTE ON FUNCTION create_invoice_with_item(uuid, uuid, numeric, text, uuid)
  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_inventory_item_with_stock(
  uuid, text, text, text, text, text, text, numeric, numeric, numeric, numeric, uuid, uuid
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION create_invoice_with_item(uuid, uuid, numeric, text, uuid)
  TO service_role;
GRANT EXECUTE ON FUNCTION create_inventory_item_with_stock(
  uuid, text, text, text, text, text, text, numeric, numeric, numeric, numeric, uuid, uuid
) TO service_role;
