# TABLES: Facturación — Facturas, Pagos, NC, Cartera, Anticipos

## 1. facturas

```sql
CREATE TABLE facturas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id),
  codigo              text NOT NULL,
  cliente_id          uuid NOT NULL REFERENCES clientes(id),
  cotizacion_id       uuid REFERENCES cotizaciones(id),
  job_id              uuid REFERENCES ordenes_trabajo(id),
  proyecto            text,
  fecha_emision       date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento   date NOT NULL,
  subtotal            numeric(15,2) NOT NULL DEFAULT 0,
  descuento_total     numeric(15,2) DEFAULT 0,
  descuento_pct       numeric(5,2) DEFAULT 0,
  iva                 numeric(15,2) DEFAULT 0,
  iva_pct             numeric(5,2) DEFAULT 19,
  retencion           numeric(15,2) DEFAULT 0,
  total               numeric(15,2) NOT NULL DEFAULT 0,
  total_pagado        numeric(15,2) DEFAULT 0,
  saldo               numeric(15,2) GENERATED ALWAYS AS
    (total - total_pagado) STORED,
  estado              text NOT NULL DEFAULT 'FACTURA_BORRADOR',
  tipo                text DEFAULT 'venta',        -- venta, anticipo, recurrente
  forma_pago          text,
  dias_credito        integer DEFAULT 30,
  motivo_anulacion    text,
  nc_id               uuid,                         -- Referencia a NC si fue anulada
  enviada_en          timestamptz,
  pagada_en           timestamptz,
  metadata            jsonb DEFAULT '{}',
  -- Columnas estándar
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid NOT NULL REFERENCES auth.users(id),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  updated_by          uuid NOT NULL REFERENCES auth.users(id),
  deleted_at          timestamptz,
  deleted_by          uuid REFERENCES auth.users(id),
  delete_reason       text,
  UNIQUE (tenant_id, codigo)
);

ALTER TABLE facturas ADD CONSTRAINT ck_facturas_estado
CHECK (estado IN (
  'FACTURA_BORRADOR', 'FACTURA_EMITIDA', 'FACTURA_PAGADA_PARCIAL',
  'FACTURA_PAGADA_TOTAL', 'FACTURA_VENCIDA', 'FACTURA_ANULADA'
));

ALTER TABLE facturas ADD CONSTRAINT ck_facturas_monto_minimo
CHECK (total >= 50000);  -- $50,000 COP mínimo
```

---

## 2. factura_items

```sql
CREATE TABLE factura_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  factura_id      uuid NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
  descripcion     text NOT NULL,
  cantidad        numeric(15,2) NOT NULL DEFAULT 1,
  unidad          text DEFAULT 'un',
  precio_unitario numeric(15,2) NOT NULL,
  descuento       numeric(15,2) DEFAULT 0,
  iva_pct         numeric(5,2) DEFAULT 19,
  subtotal        numeric(15,2) GENERATED ALWAYS AS
    (cantidad * precio_unitario - descuento) STORED,
  producto_id     uuid REFERENCES productos(id),
  orden           integer DEFAULT 0,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

---

## 3. factura_versiones

```sql
CREATE TABLE factura_versiones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  factura_id      uuid NOT NULL REFERENCES facturas(id),
  version         integer NOT NULL,
  datos           jsonb NOT NULL,        -- Snapshot completo
  cambios         text,
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (factura_id, version)
);
-- INMUTABLE
```

---

## 4. pagos

```sql
CREATE TABLE pagos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  codigo          text NOT NULL,
  cliente_id      uuid NOT NULL REFERENCES clientes(id),
  monto           numeric(15,2) NOT NULL,
  metodo          text NOT NULL,           -- tarjeta, pse, transferencia, efectivo
  estado          text DEFAULT 'PAGO_PENDIENTE',
  referencia      text,                   -- Número de transacción
  wompi_transaccion text,                 -- ID de transacción en Wompi
  fecha_pago      date,
  confirmado_en   timestamptz,
  metadata        jsonb DEFAULT '{}',
  -- Columnas estándar
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      uuid REFERENCES auth.users(id),
  UNIQUE (tenant_id, codigo)
);

ALTER TABLE pagos ADD CONSTRAINT ck_pagos_estado
CHECK (estado IN (
  'PAGO_PENDIENTE', 'PAGO_PROCESANDO', 'PAGO_CONFIRMADO',
  'PAGO_RECHAZADO', 'PAGO_REVERSADO'
));
```

---

## 5. pago_facturas (relación pago → facturas)

```sql
CREATE TABLE pago_facturas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  pago_id         uuid NOT NULL REFERENCES pagos(id) ON DELETE CASCADE,
  factura_id      uuid NOT NULL REFERENCES facturas(id),
  monto_aplicado  numeric(15,2) NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);
-- Un pago puede aplicarse a múltiples facturas.
-- Una factura puede recibir múltiples pagos.
```

---

## 6. notas_credito

```sql
CREATE TABLE notas_credito (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  codigo          text NOT NULL,
  factura_id      uuid NOT NULL REFERENCES facturas(id),
  cliente_id      uuid NOT NULL REFERENCES clientes(id),
  motivo          text NOT NULL,           -- devolucion, error, descuento, anulacion, garantia
  descripcion     text,
  subtotal        numeric(15,2) NOT NULL,
  iva             numeric(15,2) DEFAULT 0,
  total           numeric(15,2) NOT NULL,
  estado          text DEFAULT 'EMITIDA',
  aplicada_en     timestamptz,
  metadata        jsonb DEFAULT '{}',
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, codigo)
);
```

---

## 7. anticipos

```sql
CREATE TABLE anticipos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  codigo          text NOT NULL,
  cliente_id      uuid NOT NULL REFERENCES clientes(id),
  cotizacion_id   uuid REFERENCES cotizaciones(id),
  monto           numeric(15,2) NOT NULL,
  monto_aplicado  numeric(15,2) DEFAULT 0,
  saldo           numeric(15,2) GENERATED ALWAYS AS
    (monto - monto_aplicado) STORED,
  estado          text DEFAULT 'PENDIENTE',  -- PENDIENTE, APLICADO_PARCIAL, APLICADO_TOTAL
  fecha_anticipo  date NOT NULL DEFAULT CURRENT_DATE,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, codigo)
);
```

---

## 8. cartera_resumen (materialized view)

```sql
CREATE MATERIALIZED VIEW vw_cartera AS
SELECT
  f.tenant_id,
  f.cliente_id,
  c.empresa_id,
  e.razon_social AS empresa,
  COUNT(f.id) AS facturas_pendientes,
  SUM(f.saldo) AS saldo_total,
  SUM(CASE WHEN f.fecha_vencimiento >= CURRENT_DATE
    THEN f.saldo ELSE 0 END) AS corriente,
  SUM(CASE WHEN f.fecha_vencimiento < CURRENT_DATE
    AND f.fecha_vencimiento >= CURRENT_DATE - INTERVAL '30 days'
    THEN f.saldo ELSE 0 END) AS vencido_30,
  SUM(CASE WHEN f.fecha_vencimiento < CURRENT_DATE - INTERVAL '30 days'
    AND f.fecha_vencimiento >= CURRENT_DATE - INTERVAL '60 days'
    THEN f.saldo ELSE 0 END) AS vencido_60,
  SUM(CASE WHEN f.fecha_vencimiento < CURRENT_DATE - INTERVAL '60 days'
    THEN f.saldo ELSE 0 END) AS vencido_mas_60
FROM facturas f
JOIN clientes c ON f.cliente_id = c.id
JOIN empresas e ON c.empresa_id = e.id
WHERE f.deleted_at IS NULL
  AND f.estado IN ('FACTURA_EMITIDA', 'FACTURA_PAGADA_PARCIAL', 'FACTURA_VENCIDA')
  AND f.saldo > 0
GROUP BY f.tenant_id, f.cliente_id, c.empresa_id, e.razon_social;
```
