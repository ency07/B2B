# TABLES: Inventario — Productos, Stock, Movimientos, Bodegas

## 1. categorias_producto

```sql
CREATE TABLE categorias_producto (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  nombre      text NOT NULL,
  slug        text NOT NULL,
  descripcion text,
  icono       text,
  padre_id    uuid REFERENCES categorias_producto(id),
  activo      boolean DEFAULT true,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);
```

---

## 2. productos

```sql
CREATE TABLE productos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  codigo          text NOT NULL,
  sku             text,
  nombre          text NOT NULL,
  descripcion     text,
  categoria_id    uuid REFERENCES categorias_producto(id),
  marca           text,
  modelo          text,
  serie           text,
  unidad          text DEFAULT 'un',
  peso            numeric(10,2),
  dimensiones     text,               -- 'largo x ancho x alto en cm'
  costo_promedio  numeric(15,2) DEFAULT 0,
  costo_ultimo    numeric(15,2),
  precio_venta    numeric(15,2),
  stock_minimo    numeric(15,2) DEFAULT 0,
  stock_maximo    numeric(15,2),
  garantia_meses  integer DEFAULT 12,
  estado          text DEFAULT 'ACTIVO',
  especificaciones jsonb DEFAULT '{}',
  imagenes        jsonb DEFAULT '[]',
  documentos      jsonb DEFAULT '[]',
  proveedor_id    uuid REFERENCES proveedores(id),
  metadata        jsonb DEFAULT '{}',
  -- Columnas estándar
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

## 3. bodegas

```sql
CREATE TABLE bodegas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  codigo      text NOT NULL,
  nombre      text NOT NULL,
  direccion   text,
  ciudad      text,
  capacidad   text,
  supervisor_id uuid REFERENCES auth.users(id),
  activa      boolean DEFAULT true,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, codigo)
);
```

---

## 4. ubicaciones (dentro de bodegas)

```sql
CREATE TABLE ubicaciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  bodega_id   uuid NOT NULL REFERENCES bodegas(id),
  codigo      text NOT NULL,          -- 'A-01-03-02'
  zona        text,                   -- 'ZONA A'
  pasillo     text,
  estante     text,
  nivel       text,
  posicion    text,
  activa      boolean DEFAULT true,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, bodega_id, codigo)
);
```

---

## 5. stock (inventario actual por producto y bodega)

```sql
CREATE TABLE stock (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  producto_id   uuid NOT NULL REFERENCES productos(id),
  bodega_id     uuid NOT NULL REFERENCES bodegas(id),
  ubicacion_id  uuid REFERENCES ubicaciones(id),
  cantidad       numeric(15,2) NOT NULL DEFAULT 0,
  reservado     numeric(15,2) DEFAULT 0,
  disponible    numeric(15,2) GENERATED ALWAYS AS
    (cantidad - reservado) STORED,
  costo_promedio numeric(15,2) DEFAULT 0,
  ultimo_movimiento timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, producto_id, bodega_id)
);
```

---

## 6. series

Unidades individuales con número de serie.

```sql
CREATE TABLE series (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  producto_id   uuid NOT NULL REFERENCES productos(id),
  numero_serie  text NOT NULL,
  bodega_id     uuid REFERENCES bodegas(id),
  ubicacion_id  uuid REFERENCES ubicaciones(id),
  lote_id       uuid REFERENCES lotes(id),
  estado        text DEFAULT 'DISPONIBLE',
  -- DISPONIBLE, RESERVADO, INSTALADO, EN_REPARACION, PRESTADO, BAJA
  fecha_ingreso date,
  fecha_garantia date,
  cliente_id    uuid REFERENCES clientes(id),
  job_id        uuid REFERENCES ordenes_trabajo(id),
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, numero_serie)
);
```

---

## 7. lotes

```sql
CREATE TABLE lotes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id),
  producto_id       uuid NOT NULL REFERENCES productos(id),
  numero_lote       text NOT NULL,
  cantidad          numeric(15,2) NOT NULL DEFAULT 0,
  fecha_fabricacion date,
  fecha_ingreso     date NOT NULL DEFAULT CURRENT_DATE,
  fecha_vencimiento date,
  proveedor_id      uuid REFERENCES proveedores(id),
  bodega_id         uuid REFERENCES bodegas(id),
  estado            text DEFAULT 'DISPONIBLE',
  -- DISPONIBLE, CONSUMIDO, RESERVADO, BLOQUEADO, VENCIDO
  metadata          jsonb DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, numero_lote)
);
```

---

## 8. movimientos

```sql
CREATE TABLE movimientos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id),
  codigo            text NOT NULL,
  tipo              text NOT NULL,
  -- ENTRADA, SALIDA, TRANSFERENCIA, AJUSTE, RESERVA, CONSUMO,
  -- PRODUCCION, COMPRA, VENTA, DEVOLUCION
  producto_id       uuid NOT NULL REFERENCES productos(id),
  cantidad          numeric(15,2) NOT NULL,
  costo_unitario    numeric(15,2),
  costo_total       numeric(15,2),
  bodega_origen_id  uuid REFERENCES bodegas(id),
  bodega_destino_id uuid REFERENCES bodegas(id),
  ubicacion_origen  uuid REFERENCES ubicaciones(id),
  ubicacion_destino uuid REFERENCES ubicaciones(id),
  documento_tipo    text,             -- 'oc', 'ot', 'factura', 'ajuste', 'inventario_fisico'
  documento_id      uuid,
  serie_id          uuid REFERENCES series(id),
  lote_id           uuid REFERENCES lotes(id),
  usuario_id        uuid REFERENCES auth.users(id),
  motivo            text,
  aprobado_por      uuid REFERENCES auth.users(id),
  metadata          jsonb DEFAULT '{}',
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, codigo)
);
-- INMUTABLE. NUNCA SE EDITA NI SE ELIMINA.
```

---

## 9. inventario_fisico

```sql
CREATE TABLE inventario_fisico (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  codigo        text NOT NULL,
  bodega_id     uuid NOT NULL REFERENCES bodegas(id),
  estado        text DEFAULT 'ABIERTO',    -- ABIERTO, EN_CONTEO, RECONTEO, CERRADO
  fecha_inicio  date,
  fecha_fin     date,
  responsable_id uuid REFERENCES auth.users(id),
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, codigo)
);
```

### inventario_fisico_items

```sql
CREATE TABLE inventario_fisico_items (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id),
  inventario_fisico_id uuid NOT NULL REFERENCES inventario_fisico(id),
  producto_id         uuid NOT NULL REFERENCES productos(id),
  cantidad_sistema    numeric(15,2),
  cantidad_conteo     numeric(15,2),
  cantidad_reconteo   numeric(15,2),
  diferencia          numeric(15,2),
  motivo              text,
  ajustado            boolean DEFAULT false,
  metadata            jsonb DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
```

---

## 10. kardex (materialized view recomendada)

Vista materializada del histórico completo de movimientos por producto.

```sql
CREATE MATERIALIZED VIEW vw_kardex AS
SELECT
  m.tenant_id,
  m.producto_id,
  p.nombre AS producto_nombre,
  p.codigo AS producto_codigo,
  m.tipo,
  m.cantidad,
  CASE WHEN m.tipo IN ('ENTRADA', 'COMPRA', 'PRODUCCION', 'DEVOLUCION')
    THEN m.cantidad ELSE 0 END AS entrada,
  CASE WHEN m.tipo IN ('SALIDA', 'VENTA', 'CONSUMO')
    THEN m.cantidad ELSE 0 END AS salida,
  m.costo_unitario,
  m.costo_total,
  m.documento_tipo,
  m.documento_id,
  m.bodega_origen_id,
  m.bodega_destino_id,
  m.created_at
FROM movimientos m
JOIN productos p ON m.producto_id = p.id
WHERE m.deleted_at IS NULL
ORDER BY m.producto_id, m.created_at;
```
