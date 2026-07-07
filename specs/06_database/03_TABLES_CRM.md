# TABLES: CRM — Leads, Clientes, Empresas, Contactos, Pipeline

## 1. leads

```sql
CREATE TABLE leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id),
  codigo              text NOT NULL,
  empresa             text,
  nombre_contacto     text NOT NULL,
  cargo               text,
  correo              text,
  telefono            text,
  ciudad              text,
  origen              text NOT NULL DEFAULT 'web',  -- web, wizard, whatsapp, llamada, feria
  industria           text,
  estado              text NOT NULL DEFAULT 'LEAD_NUEVO',
  score               integer DEFAULT 0,
  riesgo              text DEFAULT 'MEDIO',         -- BAJO, MEDIO, ALTO
  comercial_id        uuid REFERENCES auth.users(id),
  ultimo_contacto     timestamptz,
  proximo_contacto    timestamptz,
  sla_vencimiento     timestamptz,
  notas               text,
  motivo_descarte     text,
  convertido_a_cliente uuid REFERENCES clientes(id),
  metadata            jsonb DEFAULT '{}',
  -- Columnas estándar
  created_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  updated_by          uuid REFERENCES auth.users(id),
  deleted_at          timestamptz,
  deleted_by          uuid REFERENCES auth.users(id),
  delete_reason       text,
  UNIQUE (tenant_id, codigo)
);

-- Estados válidos
ALTER TABLE leads ADD CONSTRAINT ck_leads_estado
CHECK (estado IN (
  'LEAD_NUEVO', 'LEAD_CONTACTADO', 'LEAD_CALIFICADO',
  'LEAD_ASIGNADO', 'LEAD_NO_CALIFICA', 'LEAD_CONVERTIDO',
  'LEAD_DESCARTADO'
));
```

---

## 2. lead_interacciones

Historial de interacciones con leads.

```sql
CREATE TABLE lead_interacciones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  lead_id     uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tipo        text NOT NULL,             -- llamada, whatsapp, correo, visita, nota
  descripcion text NOT NULL,
  resultado   text,                      -- interesado, no_interesado, reenviar
  actor_id    uuid REFERENCES auth.users(id),
  duracion    integer,                   -- minutos
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

---

## 3. empresas

```sql
CREATE TABLE empresas (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  codigo      text,
  razon_social text NOT NULL,
  nit         text,
  sector      text,                      -- mineria, siderurgia, alimentos
  tipo        text DEFAULT 'cliente',    -- cliente, proveedor, aliado, distribuidor
  tamanio     text,                      -- pequena, mediana, grande
  direccion   text,
  ciudad      text,
  pais        text DEFAULT 'Colombia',
  telefono    text,
  sitio_web   text,
  logo_url    text,
  estado      text DEFAULT 'ACTIVO',
  metadata    jsonb DEFAULT '{}',
  -- Columnas estándar
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid NOT NULL REFERENCES auth.users(id),
  deleted_at  timestamptz,
  deleted_by  uuid REFERENCES auth.users(id),
  delete_reason text
);
```

---

## 4. contactos

```sql
CREATE TABLE contactos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  empresa_id  uuid NOT NULL REFERENCES empresas(id),
  nombre      text NOT NULL,
  apellido    text,
  cargo       text,
  correo      text,
  telefono    text,
  whatsapp    text,
  es_principal boolean DEFAULT false,
  estado      text DEFAULT 'ACTIVO',
  metadata    jsonb DEFAULT '{}',
  -- Columnas estándar
  created_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid NOT NULL REFERENCES auth.users(id),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  updated_by  uuid NOT NULL REFERENCES auth.users(id),
  deleted_at  timestamptz,
  deleted_by  uuid REFERENCES auth.users(id),
  delete_reason text
);
```

---

## 5. clientes

Cliente activo del ERP (vínculo empresa + datos comerciales).

```sql
CREATE TABLE clientes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  codigo          text NOT NULL,
  empresa_id      uuid NOT NULL REFERENCES empresas(id),
  comercial_id    uuid REFERENCES auth.users(id),
  lead_origen_id  uuid REFERENCES leads(id),
  estado          text DEFAULT 'CLIENTE_ACTIVO',
  ultima_compra   date,
  facturacion_anual numeric(15,2) DEFAULT 0,
  dias_credito    integer DEFAULT 30,
  limite_credito  numeric(15,2),
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

ALTER TABLE clientes ADD CONSTRAINT ck_clientes_estado
CHECK (estado IN (
  'CLIENTE_ACTIVO', 'CLIENTE_SUSPENDIDO', 'CLIENTE_INACTIVO'
));
```

---

## 6. oportunidades

Oportunidades de venta en pipeline.

```sql
CREATE TABLE oportunidades (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  codigo          text NOT NULL,
  empresa_id      uuid REFERENCES empresas(id),
  cliente_id      uuid REFERENCES clientes(id),
  lead_id         uuid REFERENCES leads(id),
  nombre          text NOT NULL,
  descripcion     text,
  monto_estimado  numeric(15,2),
  probabilidad    integer DEFAULT 10,    -- 0-100
  fase            text DEFAULT 'NUEVO',  -- NUEVO, CONTACTADO, DIAGNOSTICO, COTIZACION, NEGOCIACION, GANADO, PERDIDO
  responsable_id  uuid REFERENCES auth.users(id),
  fecha_cierre    date,
  fecha_ganado    date,
  fecha_perdido   date,
  motivo_perdida  text,
  notas           text,
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

## 7. oportunidad_actividades

Actividades de seguimiento de una oportunidad.

```sql
CREATE TABLE oportunidad_actividades (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  oportunidad_id  uuid NOT NULL REFERENCES oportunidades(id) ON DELETE CASCADE,
  tipo            text NOT NULL,          -- llamada, correo, whatsapp, visita, nota
  descripcion     text NOT NULL,
  actor_id        uuid REFERENCES auth.users(id),
  fecha           date,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);
```
