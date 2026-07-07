# TABLES: Requerimientos y Cotizaciones

## 1. requerimientos

```sql
CREATE TABLE requerimientos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id),
  codigo              text NOT NULL,
  cliente_id          uuid NOT NULL REFERENCES clientes(id),
  empresa_id          uuid REFERENCES empresas(id),
  contacto_id         uuid REFERENCES contactos(id),
  proyecto            text,
  servicio            text,
  descripcion         text NOT NULL,
  necesidad           text,
  estado              text NOT NULL DEFAULT 'REQUERIMIENTO_ABIERTO',
  prioridad           text DEFAULT 'MEDIA',        -- URGENTE, ALTA, MEDIA, BAJA
  responsable_id      uuid REFERENCES auth.users(id),
  ingeniero_id        uuid REFERENCES auth.users(id),
  fecha_compromiso    date,
  fecha_cierre        date,
  costo_estimado      numeric(15,2),
  progreso            numeric(5,2) DEFAULT 0,
  sla_horas           integer,
  motivo_cancelacion  text,
  metadata            jsonb DEFAULT '{}',
  -- Columnas estándar
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid NOT NULL REFERENCES auth.users(id),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  updated_by          uuid NOT NULL REFERENCES auth.users(id),
  deleted_at          timestamptz,
  deleted_by          uuid REFERENCES auth.users(id),
  delete_reason       text,
  version             integer DEFAULT 1,
  UNIQUE (tenant_id, codigo)
);
```

### CHECK estado

```sql
ALTER TABLE requerimientos ADD CONSTRAINT ck_requerimientos_estado
CHECK (estado IN (
  'REQUERIMIENTO_ABIERTO', 'REQUERIMIENTO_EN_EVALUACION',
  'REQUERIMIENTO_PRESUPUESTADO', 'REQUERIMIENTO_APROBADO',
  'REQUERIMIENTO_EN_PROYECTO', 'REQUERIMIENTO_FACTURADO',
  'REQUERIMIENTO_CERRADO', 'REQUERIMIENTO_CANCELADO'
));
```

---

## 2. requerimiento_diagnosticos

```sql
CREATE TABLE requerimiento_diagnosticos (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id),
  requerimiento_id  uuid NOT NULL REFERENCES requerimientos(id),
  ingeniero_id      uuid REFERENCES auth.users(id),
  descripcion       text NOT NULL,
  observaciones     text,
  fecha_visita      date,
  datos_tecnicos    jsonb DEFAULT '{}',
  -- { caudal, presion, temperatura, rpm, voltaje, frecuencia, dimensiones }
  archivos          jsonb DEFAULT '[]',
  estado            text DEFAULT 'BORRADOR',
  created_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid NOT NULL REFERENCES auth.users(id),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  updated_by        uuid NOT NULL REFERENCES auth.users(id)
);
```

---

## 3. requerimiento_ingenieria

```sql
CREATE TABLE requerimiento_ingenieria (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id),
  requerimiento_id  uuid NOT NULL REFERENCES requerimientos(id),
  ingeniero_id      uuid REFERENCES auth.users(id),
  tipo              text NOT NULL,       -- 'cfd', 'diseno', 'planos', 'calculo'
  descripcion       text,
  resultado         text,
  datos             jsonb DEFAULT '{}',
  -- { cfm, presion_estatica, perdidas, factor_seguridad, normas_aplicadas }
  archivos          jsonb DEFAULT '[]',
  -- [{ nombre, tipo, url, tamanio }]
  version           integer DEFAULT 1,
  estado            text DEFAULT 'BORRADOR',
  created_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid NOT NULL REFERENCES auth.users(id),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  updated_by        uuid NOT NULL REFERENCES auth.users(id)
);
```

---

## 4. cotizaciones

```sql
CREATE TABLE cotizaciones (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id),
  codigo              text NOT NULL,
  cliente_id          uuid NOT NULL REFERENCES clientes(id),
  requerimiento_id    uuid REFERENCES requerimientos(id),
  contacto_id         uuid REFERENCES contactos(id),
  proyecto            text,
  moneda              text DEFAULT 'COP',
  idioma              text DEFAULT 'es',
  forma_pago          text,
  tiempo_entrega      text,
  garantia            text,
  incoterm            text,
  vigencia            date,
  subtotal            numeric(15,2) DEFAULT 0,
  descuento_total     numeric(15,2) DEFAULT 0,
  descuento_pct       numeric(5,2) DEFAULT 0,
  iva                 numeric(15,2) DEFAULT 0,
  iva_pct             numeric(5,2) DEFAULT 19,
  total               numeric(15,2) DEFAULT 0,
  costo_total         numeric(15,2) DEFAULT 0,
  margen              numeric(5,2) DEFAULT 0,
  rentabilidad        numeric(5,2) DEFAULT 0,
  estado              text NOT NULL DEFAULT 'COTIZACION_BORRADOR',
  aprobado_por        uuid REFERENCES auth.users(id),
  aprobado_en         timestamptz,
  enviado_en          timestamptz,
  aceptado_en         timestamptz,
  rechazado_en        timestamptz,
  motivo_cancelacion  text,
  motivo_rechazo      text,
  condiciones         text,
  observaciones       text,
  metadata            jsonb DEFAULT '{}',
  -- Columnas estándar
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid NOT NULL REFERENCES auth.users(id),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  updated_by          uuid NOT NULL REFERENCES auth.users(id),
  deleted_at          timestamptz,
  deleted_by          uuid REFERENCES auth.users(id),
  delete_reason       text,
  version             integer DEFAULT 1,
  UNIQUE (tenant_id, codigo)
);

ALTER TABLE cotizaciones ADD CONSTRAINT ck_cotizaciones_estado
CHECK (estado IN (
  'COTIZACION_BORRADOR', 'COTIZACION_ENVIADA', 'COTIZACION_ACEPTADA',
  'COTIZACION_RECHAZADA', 'COTIZACION_CONVERTIDA_EN_OT',
  'COTIZACION_CANCELADA'
));
```

---

## 5. cotizacion_items

```sql
CREATE TABLE cotizacion_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  cotizacion_id   uuid NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  tipo            text DEFAULT 'producto',    -- 'producto', 'servicio', 'accesorio'
  producto_id     uuid REFERENCES productos(id),
  descripcion     text NOT NULL,
  cantidad        numeric(15,2) NOT NULL DEFAULT 1,
  unidad          text DEFAULT 'un',
  precio_unitario numeric(15,2) NOT NULL,
  descuento       numeric(15,2) DEFAULT 0,
  descuento_pct   numeric(5,2) DEFAULT 0,
  iva_pct         numeric(5,2) DEFAULT 19,
  subtotal        numeric(15,2) GENERATED ALWAYS AS
    (cantidad * precio_unitario - descuento) STORED,
  orden           integer DEFAULT 0,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

---

## 6. cotizacion_versiones

Historial inmutable de cambios de cotización.

```sql
CREATE TABLE cotizacion_versiones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  cotizacion_id   uuid NOT NULL REFERENCES cotizaciones(id),
  version         integer NOT NULL,
  datos           jsonb NOT NULL,    -- Snapshot completo de la cotización
  cambios         text,              -- Descripción de cambios
  total_anterior  numeric(15,2),
  total_nuevo     numeric(15,2),
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cotizacion_id, version)
);
-- INMUTABLE. Sin UPDATE ni DELETE.
```

---

## 7. cotizacion_aprobaciones

```sql
CREATE TABLE cotizacion_aprobaciones (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  cotizacion_id   uuid NOT NULL REFERENCES cotizaciones(id),
  nivel           integer NOT NULL,    -- 1 = comercial, 2 = director, 3 = gerente
  aprobador_id    uuid REFERENCES auth.users(id),
  estado          text DEFAULT 'PENDIENTE',  -- PENDIENTE, APROBADO, RECHAZADO
  comentario      text,
  aprobado_en     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```
