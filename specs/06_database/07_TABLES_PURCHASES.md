# TABLES: Compras — Solicitudes, Órdenes de Compra, Recepción

## 1. proveedores

```sql
CREATE TABLE proveedores (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  codigo          text NOT NULL,
  empresa_id      uuid REFERENCES empresas(id),
  razon_social    text NOT NULL,
  nit             text,
  direccion       text,
  ciudad          text,
  pais            text DEFAULT 'Colombia',
  telefono        text,
  correo          text,
  sitio_web       text,
  categoria       text,                -- materiales, servicios, equipos, consumibles
  estado          text DEFAULT 'ACTIVO',
  calificacion    numeric(3,1) DEFAULT 0, -- 0.0 - 5.0
  score           integer DEFAULT 50,    -- 0-100
  dias_credito    integer DEFAULT 30,
  condiciones_pago text,
  cuentas_bancarias jsonb DEFAULT '[]',
  bloqueado       boolean DEFAULT false,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      uuid NOT NULL REFERENCES auth.users(id),
  deleted_at      timestamptz,
  deleted_by      uuid REFERENCES auth.users(id),
  delete_reason   text,
  UNIQUE (tenant_id, codigo)
);
```

---

## 2. solicitudes_compra

```sql
CREATE TABLE solicitudes_compra (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id),
  codigo            text NOT NULL,
  solicitante_id    uuid NOT NULL REFERENCES auth.users(id),
  area              text,
  proyecto          text,
  prioridad         text DEFAULT 'MEDIA',
  estado            text DEFAULT 'PENDIENTE',
  -- PENDIENTE, APROBADA, RECHAZADA, COTIZANDO, CONVERTIDA, CANCELADA
  justificacion     text NOT NULL,
  fecha_necesidad   date,
  centro_costos     text,
  valor_estimado    numeric(15,2),
  aprobado_por      uuid REFERENCES auth.users(id),
  aprobado_en       timestamptz,
  motivo_rechazo    text,
  motivo_cancelacion text,
  metadata          jsonb DEFAULT '{}',
  -- Columnas estándar
  created_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid NOT NULL REFERENCES auth.users(id),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  updated_by        uuid NOT NULL REFERENCES auth.users(id),
  deleted_at        timestamptz,
  deleted_by        uuid REFERENCES auth.users(id),
  UNIQUE (tenant_id, codigo)
);

ALTER TABLE solicitudes_compra ADD CONSTRAINT ck_solicitudes_compra_estado
CHECK (estado IN (
  'PENDIENTE', 'APROBADA', 'RECHAZADA', 'COTIZANDO', 'CONVERTIDA', 'CANCELADA'
));
```

---

## 3. solicitud_compra_items

```sql
CREATE TABLE solicitud_compra_items (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL REFERENCES tenants(id),
  solicitud_id          uuid NOT NULL REFERENCES solicitudes_compra(id) ON DELETE CASCADE,
  producto_id           uuid REFERENCES productos(id),
  descripcion           text NOT NULL,
  cantidad              numeric(15,2) NOT NULL,
  unidad                text DEFAULT 'un',
  proveedor_sugerido_id uuid REFERENCES proveedores(id),
  metadata              jsonb DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now()
);
```

---

## 4. cotizaciones_proveedor

```sql
CREATE TABLE cotizaciones_proveedor (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  solicitud_id    uuid NOT NULL REFERENCES solicitudes_compra(id),
  proveedor_id    uuid NOT NULL REFERENCES proveedores(id),
  codigo          text NOT NULL,
  valor           numeric(15,2) NOT NULL,
  moneda          text DEFAULT 'COP',
  fecha_entrega   date,
  garantia        text,
  condiciones     text,
  estado          text DEFAULT 'RECIBIDA', -- RECIBIDA, ACEPTADA, RECHAZADA
  archivos        jsonb DEFAULT '[]',
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, codigo)
);
```

---

## 5. cotizacion_proveedor_items

```sql
CREATE TABLE cotizacion_proveedor_items (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               uuid NOT NULL REFERENCES tenants(id),
  cotizacion_proveedor_id uuid NOT NULL REFERENCES cotizaciones_proveedor(id) ON DELETE CASCADE,
  descripcion             text NOT NULL,
  cantidad                numeric(15,2) NOT NULL,
  unidad                  text DEFAULT 'un',
  precio_unitario         numeric(15,2) NOT NULL,
  subtotal                numeric(15,2),
  metadata                jsonb DEFAULT '{}',
  created_at              timestamptz NOT NULL DEFAULT now()
);
```

---

## 6. ordenes_compra

```sql
CREATE TABLE ordenes_compra (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id),
  codigo            text NOT NULL,
  solicitud_id      uuid REFERENCES solicitudes_compra(id),
  proveedor_id      uuid NOT NULL REFERENCES proveedores(id),
  cotizacion_id     uuid REFERENCES cotizaciones_proveedor(id),
  proyecto          text,
  subtotal          numeric(15,2) DEFAULT 0,
  descuento_total   numeric(15,2) DEFAULT 0,
  iva               numeric(15,2) DEFAULT 0,
  retencion         numeric(15,2) DEFAULT 0,
  total             numeric(15,2) NOT NULL DEFAULT 0,
  estado            text DEFAULT 'BORRADOR',
  -- BORRADOR, ENVIADA, ACEPTADA, PARCIAL, RECIBIDA, FACTURADA, PAGADA, CANCELADA
  fecha_entrega     date,
  condiciones_pago  text,
  comprador_id      uuid REFERENCES auth.users(id),
  aprobado_por      uuid REFERENCES auth.users(id),
  enviada_en        timestamptz,
  motivo_cancelacion text,
  metadata          jsonb DEFAULT '{}',
  -- Columnas estándar
  created_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid NOT NULL REFERENCES auth.users(id),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  updated_by        uuid NOT NULL REFERENCES auth.users(id),
  deleted_at        timestamptz,
  deleted_by        uuid REFERENCES auth.users(id),
  UNIQUE (tenant_id, codigo)
);
```

---

## 7. oc_items

```sql
CREATE TABLE oc_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  oc_id           uuid NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  producto_id     uuid REFERENCES productos(id),
  descripcion     text NOT NULL,
  cantidad        numeric(15,2) NOT NULL,
  unidad          text DEFAULT 'un',
  precio_unitario numeric(15,2) NOT NULL,
  descuento       numeric(15,2) DEFAULT 0,
  subtotal        numeric(15,2) GENERATED ALWAYS AS
    (cantidad * precio_unitario - descuento) STORED,
  recibido        numeric(15,2) DEFAULT 0,
  pendiente       numeric(15,2) GENERATED ALWAYS AS
    (cantidad - recibido) STORED,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

---

## 8. recepciones

```sql
CREATE TABLE recepciones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  codigo          text NOT NULL,
  oc_id           uuid NOT NULL REFERENCES ordenes_compra(id),
  proveedor_id    uuid NOT NULL REFERENCES proveedores(id),
  tipo            text NOT NULL,           -- TOTAL, PARCIAL, RECHAZO, DEVOLUCION
  fecha_recepcion date NOT NULL DEFAULT CURRENT_DATE,
  recibido_por    uuid REFERENCES auth.users(id),
  inspector_id    uuid REFERENCES auth.users(id),
  estado          text DEFAULT 'COMPLETADA', -- COMPLETADA, CON_DIFERENCIAS
  observaciones   text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, codigo)
);
```

### recepcion_items

```sql
CREATE TABLE recepcion_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  recepcion_id    uuid NOT NULL REFERENCES recepciones(id) ON DELETE CASCADE,
  oc_item_id      uuid NOT NULL REFERENCES oc_items(id),
  cantidad_recibida numeric(15,2) NOT NULL,
  estado          text DEFAULT 'ACEPTADO', -- ACEPTADO, CONDICIONAL, RECHAZADO
  observaciones   text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);
```
