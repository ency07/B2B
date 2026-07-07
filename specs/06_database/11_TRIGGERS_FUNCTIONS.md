# TRIGGERS, FUNCTIONS, RPC, SEQUENCES

## 1. Triggers obligatorios (toda tabla operacional)

### 1.1 Bloquear DELETE físico

```sql
CREATE OR REPLACE FUNCTION fn_block_physical_delete()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'DELETE físico prohibido en %. Usar soft delete.', TG_TABLE_NAME;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas:
CREATE TRIGGER trg_block_delete_{tabla}
  BEFORE DELETE ON {tabla}
  FOR EACH ROW EXECUTE FUNCTION fn_block_physical_delete();
```

### 1.2 Auditoría automática

```sql
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS trigger AS $$
DECLARE
  v_diff jsonb;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_diff := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    v_diff := jsonb_diff(to_jsonb(OLD), to_jsonb(NEW));
  ELSIF TG_OP = 'DELETE' THEN
    v_diff := to_jsonb(OLD);
  END IF;

  INSERT INTO audit_log (
    tenant_id, tabla, registro_id, accion, actor_id,
    old_data, new_data, diff, ip_address, user_agent
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    auth.uid(),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    v_diff,
    current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for',
    current_setting('request.headers', true)::jsonb ->> 'user-agent'
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar a todas las tablas:
CREATE TRIGGER trg_audit_{tabla}
  AFTER INSERT OR UPDATE OR DELETE ON {tabla}
  FOR EACH ROW EXECUTE FUNCTION fn_audit_log();
```

### 1.3 Evento de negocio en cambio de estado

```sql
CREATE OR REPLACE FUNCTION fn_business_event_on_status()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO business_events (
      tenant_id, entity_type, entity_id, accion, actor_id,
      old_status, new_status, ip_address, user_agent
    ) VALUES (
      NEW.tenant_id,
      TG_TABLE_NAME,
      NEW.id,
      'status_changed',
      auth.uid(),
      OLD.estado,
      NEW.estado,
      current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for',
      current_setting('request.headers', true)::jsonb ->> 'user-agent'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar a tablas con columna 'estado'
CREATE TRIGGER trg_business_event_status_{tabla}
  AFTER UPDATE OF estado ON {tabla}
  FOR EACH ROW
  WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
  EXECUTE FUNCTION fn_business_event_on_status();
```

### 1.4 Actualizar `updated_at`

```sql
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_timestamp_{tabla}
  BEFORE UPDATE ON {tabla}
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
```

---

## 2. Trigger de validación

### 2.1 Validar motivo de cancelación

```sql
CREATE OR REPLACE FUNCTION fn_validate_cancel_reason()
RETURNS trigger AS $$
BEGIN
  IF NEW.estado LIKE '%CANCELADO%' OR NEW.estado LIKE '%RECHAZADO%' THEN
    IF NEW.motivo_cancelacion IS NULL OR length(NEW.motivo_cancelacion) < 10 THEN
      RAISE EXCEPTION 'Motivo de cancelación requerido (mínimo 10 caracteres).';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a todas las tablas con cancelación:
CREATE TRIGGER trg_validate_cancel_{tabla}
  BEFORE UPDATE ON {tabla}
  FOR EACH ROW
  EXECUTE FUNCTION fn_validate_cancel_reason();
```

### 2.2 Validar factura mínima

```sql
CREATE OR REPLACE FUNCTION fn_validate_invoice_minimum()
RETURNS trigger AS $$
BEGIN
  IF NEW.total < 50000 THEN
    RAISE EXCEPTION 'El monto mínimo de factura es $50,000 COP.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_factura_minima
  BEFORE INSERT OR UPDATE ON facturas
  FOR EACH ROW EXECUTE FUNCTION fn_validate_invoice_minimum();
```

---

## 3. Trigger de inventario

```sql
CREATE OR REPLACE FUNCTION fn_update_stock_on_reception()
RETURNS trigger AS $$
BEGIN
  IF NEW.estado = 'ACEPTADO' AND OLD.estado IS DISTINCT FROM 'ACEPTADO' THEN
    -- Obtener datos de la OC item y producto
    -- Insertar movimiento de ENTRADA
    INSERT INTO movimientos (
      tenant_id, tipo, producto_id, cantidad,
      bodega_destino_id, documento_tipo, documento_id,
      costo_unitario, costo_total, usuario_id
    )
    SELECT
      ri.tenant_id,
      'ENTRADA',
      oi.producto_id,
      NEW.cantidad_recibida,
      oc.bodega_destino_id,  -- asumiendo campo en OC
      'oc',
      oc.id,
      oi.precio_unitario,
      NEW.cantidad_recibida * oi.precio_unitario,
      auth.uid()
    FROM recepcion_items ri
    JOIN oc_items oi ON ri.oc_item_id = oi.id
    JOIN recepciones r ON ri.recepcion_id = r.id
    JOIN ordenes_compra oc ON r.oc_id = oc.id
    WHERE ri.id = NEW.id;

    -- Actualizar stock
    UPDATE stock
    SET cantidad = cantidad + NEW.cantidad_recibida,
        updated_at = now()
    WHERE producto_id = (
      SELECT oi.producto_id FROM oc_items oi
      JOIN recepcion_items ri ON oi.id = ri.oc_item_id
      WHERE ri.id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_inventory_on_reception
  AFTER UPDATE ON recepcion_items
  FOR EACH ROW EXECUTE FUNCTION fn_update_stock_on_reception();
```

---

## 4. Funciones RPC (Supabase Edge Functions)

### 4.1 Generar código secuencial

```sql
CREATE OR REPLACE FUNCTION fn_generar_codigo(
  p_tenant_id uuid,
  p_entidad text
) RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seq record;
  v_codigo text;
BEGIN
  -- Bloquear la fila para evitar concurrencia
  SELECT * INTO v_seq
  FROM tenant_sequences
  WHERE tenant_id = p_tenant_id AND entidad = p_entidad
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Crear secuencia si no existe
    INSERT INTO tenant_sequences (tenant_id, entidad, prefijo, ultimo_valor)
    VALUES (p_tenant_id, p_entidad,
      CASE p_entidad
        WHEN 'cotizacion' THEN 'COT'
        WHEN 'orden_trabajo' THEN 'OT'
        WHEN 'factura' THEN 'FAC'
        WHEN 'pago' THEN 'REC'
        WHEN 'cliente' THEN 'CLI'
        WHEN 'lead' THEN 'LD'
        WHEN 'producto' THEN 'PROD'
        WHEN 'orden_compra' THEN 'OC'
        WHEN 'ticket' THEN 'TK'
        ELSE 'GEN'
      END,
      1
    )
    RETURNING * INTO v_seq;
  END IF;

  -- Incrementar
  UPDATE tenant_sequences
  SET ultimo_valor = ultimo_valor + 1,
      updated_at = now()
  WHERE id = v_seq.id;

  -- Formatear
  v_codigo := v_seq.prefijo || '-' || LPAD((v_seq.ultimo_valor + 1)::text, 4, '0');
  RETURN v_codigo;
END;
$$;
```

### 4.2 Calcular scoring de lead

```sql
CREATE OR REPLACE FUNCTION fn_calcular_score_lead(
  p_industria text,
  p_cargo text,
  p_urgencia boolean,
  p_solicito_cotizacion boolean,
  p_descargo_catalogo boolean,
  p_uso_calculadora boolean,
  p_telefono_valido boolean,
  p_correo_corporativo boolean
) RETURNS integer
LANGUAGE sql IMMUTABLE
AS $$
  SELECT
    CASE WHEN p_industria IN ('mineria', 'siderurgia', 'data_center') THEN 15 ELSE 0 END
    + CASE WHEN p_cargo IN ('Gerente', 'Director', 'Jefe') THEN 10 ELSE 0 END
    + CASE WHEN p_urgencia THEN 20 ELSE 0 END
    + CASE WHEN p_solicito_cotizacion THEN 15 ELSE 0 END
    + CASE WHEN p_descargo_catalogo THEN 5 ELSE 0 END
    + CASE WHEN p_uso_calculadora THEN 10 ELSE 0 END
    + CASE WHEN p_telefono_valido THEN 5 ELSE 0 END
    + CASE WHEN p_correo_corporativo THEN 5 ELSE 0 END;
$$;
```

### 4.3 Calcular CFM estimado

```sql
CREATE OR REPLACE FUNCTION fn_calcular_cfm(
  p_largo numeric,
  p_ancho numeric,
  p_alto numeric,
  p_tipo_actividad text,
  p_altitud_msnm numeric DEFAULT 2600
) RETURNS numeric
LANGUAGE sql IMMUTABLE
AS $$
  WITH calculos AS (
    SELECT
      p_largo * p_ancho * p_alto AS volumen_m3,
      CASE p_tipo_actividad
        WHEN 'manufactura' THEN 10
        WHEN 'soldadura' THEN 15
        WHEN 'quimico' THEN 12
        WHEN 'almacenamiento' THEN 6
        WHEN 'data_center' THEN 20
        WHEN 'alimentos' THEN 8
        ELSE 8
      END AS ach,
      CASE
        WHEN p_altitud_msnm <= 1000 THEN 1.0
        WHEN p_altitud_msnm <= 2000 THEN 1.1
        WHEN p_altitud_msnm <= 3000 THEN 1.25
        ELSE 1.4
      END AS factor_altitud
  )
  SELECT ROUND((volumen_m3 * ach / 60) * factor_altitud, 0)
  FROM calculos;
$$;
```

### 4.4 Verificar disponibilidad de stock

```sql
CREATE OR REPLACE FUNCTION fn_verificar_stock(
  p_producto_id uuid,
  p_bodega_id uuid,
  p_cantidad numeric
) RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_disponible numeric;
BEGIN
  SELECT disponible INTO v_disponible
  FROM stock
  WHERE producto_id = p_producto_id
    AND bodega_id = p_bodega_id;

  RETURN COALESCE(v_disponible, 0) >= p_cantidad;
END;
$$;
```

### 4.5 Obtener Kardex de producto

```sql
CREATE OR REPLACE FUNCTION fn_obtener_kardex(
  p_tenant_id uuid,
  p_producto_id uuid,
  p_fecha_inicio date DEFAULT NULL,
  p_fecha_fin date DEFAULT NULL
) RETURNS TABLE(
  fecha timestamptz,
  tipo text,
  documento_tipo text,
  documento_id uuid,
  entrada numeric,
  salida numeric,
  costo_unitario numeric,
  costo_total numeric,
  bodega_origen text,
  bodega_destino text
)
LANGUAGE sql STABLE
AS $$
  SELECT m.created_at, m.tipo, m.documento_tipo, m.documento_id,
    CASE WHEN m.tipo IN ('ENTRADA', 'COMPRA', 'PRODUCCION', 'DEVOLUCION')
      THEN m.cantidad ELSE 0 END,
    CASE WHEN m.tipo IN ('SALIDA', 'VENTA', 'CONSUMO')
      THEN m.cantidad ELSE 0 END,
    m.costo_unitario, m.costo_total,
    bo.nombre, bd.nombre
  FROM movimientos m
  LEFT JOIN bodegas bo ON m.bodega_origen_id = bo.id
  LEFT JOIN bodegas bd ON m.bodega_destino_id = bd.id
  WHERE m.tenant_id = p_tenant_id
    AND m.producto_id = p_producto_id
    AND (p_fecha_inicio IS NULL OR m.created_at >= p_fecha_inicio)
    AND (p_fecha_fin IS NULL OR m.created_at <= p_fecha_fin)
  ORDER BY m.created_at;
$$;
```

---

## 5. Secuencias (`tenant_sequences`)

La tabla `tenant_sequences` implementa el patrón "Hi/Lo" simplificado:

```sql
-- Obtener el siguiente código (thread-safe)
-- La función fn_generar_codigo usa SELECT ... FOR UPDATE
-- que bloquea la fila a nivel de base de datos.
```

### Formato de códigos

| Entidad | Prefijo | Formato |
|---|---|---|
| cotizacion | COT | `COT-{0001..9999}` |
| orden_trabajo | OT | `OT-{0001..9999}` |
| factura | FAC | `FAC-{0001..9999}` |
| pago | REC | `REC-{0001..9999}` |
| cliente | CLI | `CLI-{0001..9999}` |
| lead | LD | `LD-{0001..9999}` |
| producto | PROD | `PROD-{0001..9999}` |
| orden_compra | OC | `OC-{0001..9999}` |
| ticket | TK | `TK-{0001..9999}` |
