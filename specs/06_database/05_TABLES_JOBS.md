# TABLES: Órdenes de Trabajo, Checklist, Producción

## 1. ordenes_trabajo

```sql
CREATE TABLE ordenes_trabajo (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id),
  codigo              text NOT NULL,
  cliente_id          uuid NOT NULL REFERENCES clientes(id),
  requerimiento_id    uuid REFERENCES requerimientos(id),
  cotizacion_id       uuid REFERENCES cotizaciones(id),
  proyecto            text,
  descripcion         text NOT NULL,
  estado              text NOT NULL DEFAULT 'OT_PROGRAMADA',
  prioridad           text DEFAULT 'MEDIA',        -- URGENTE, ALTA, MEDIA, BAJA
  supervisor_id       uuid REFERENCES auth.users(id),
  responsable_id      uuid REFERENCES auth.users(id),
  fecha_inicio        date,
  fecha_entrega       date,
  fecha_inicio_real   timestamptz,
  fecha_fin_real      timestamptz,
  progreso            numeric(5,2) DEFAULT 0,
  horas_estimadas     numeric(7,2),
  horas_reales        numeric(7,2),
  costo_materiales    numeric(15,2) DEFAULT 0,
  costo_mano_obra     numeric(15,2) DEFAULT 0,
  costo_maquinaria    numeric(15,2) DEFAULT 0,
  costo_transporte    numeric(15,2) DEFAULT 0,
  costo_ingenieria    numeric(15,2) DEFAULT 0,
  costo_total         numeric(15,2) DEFAULT 0,
  precio_venta        numeric(15,2),
  margen              numeric(5,2),
  motivo_cancelacion  text,
  motivo_pausa        text,
  ubicacion           text,
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
  UNIQUE (tenant_id, codigo)
);

ALTER TABLE ordenes_trabajo ADD CONSTRAINT ck_ordenes_trabajo_estado
CHECK (estado IN (
  'OT_PROGRAMADA', 'OT_EN_EJECUCION', 'OT_PAUSADA',
  'OT_EN_VERIFICACION', 'OT_FINALIZADA', 'OT_CANCELADA'
));
```

---

## 2. job_tareas

Tareas individuales de una OT.

```sql
CREATE TABLE job_tareas (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id),
  job_id       uuid NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
  nombre       text NOT NULL,
  descripcion  text,
  estado       text DEFAULT 'PENDIENTE',   -- PENDIENTE, EN_PROGRESO, COMPLETADA
  responsable_id uuid REFERENCES auth.users(id),
  fecha_inicio date,
  fecha_fin    date,
  duracion_dias integer,
  orden        integer DEFAULT 0,
  metadata     jsonb DEFAULT '{}',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

---

## 3. job_checklist

Checklist técnica de verificación.

```sql
CREATE TABLE job_checklist (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  job_id        uuid NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
  grupo         text NOT NULL,           -- 'INSTALACION_MECANICA', 'CONEXION_ELECTRICA'
  item          text NOT NULL,           -- Título del ítem
  descripcion   text,
  estado        text DEFAULT 'PENDIENTE', -- PENDIENTE, EN_PROGRESO, COMPLETADO, NO_APLICA, OBSERVACION
  responsable_id uuid REFERENCES auth.users(id),
  completado_en timestamptz,
  observaciones text,
  evidencia_url text,
  orden         integer DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

---

## 4. job_materiales

Materiales consumidos en la OT.

```sql
CREATE TABLE job_materiales (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  job_id          uuid NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
  producto_id     uuid NOT NULL REFERENCES productos(id),
  cantidad_plan   numeric(15,2) DEFAULT 0,   -- Cantidad planificada
  cantidad_real   numeric(15,2) DEFAULT 0,   -- Cantidad realmente usada
  unidad          text DEFAULT 'un',
  costo_unitario  numeric(15,2),
  costo_total     numeric(15,2) GENERATED ALWAYS AS
    (cantidad_real * costo_unitario) STORED,
  devuelto        numeric(15,2) DEFAULT 0,
  justificacion   text,                      -- Si cantidad_real > cantidad_plan
  estado          text DEFAULT 'RESERVADO',  -- RESERVADO, CONSUMIDO, DEVUELTO
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

---

## 5. job_horas

Registro de horas-hombre y horas-máquina.

```sql
CREATE TABLE job_horas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  job_id          uuid NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
  tipo            text NOT NULL,           -- 'hombre', 'maquina'
  recurso_id      uuid REFERENCES auth.users(id),  -- Técnico
  maquina         text,                    -- Nombre de la máquina
  fecha           date NOT NULL,
  horas           numeric(5,2) NOT NULL,
  costo_hora      numeric(15,2),
  costo_total     numeric(15,2),
  actividad       text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

---

## 6. job_evidencias

Fotografías, videos, documentos de la OT.

```sql
CREATE TABLE job_evidencias (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  job_id      uuid NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
  tipo        text NOT NULL,               -- 'foto', 'video', 'pdf', 'plano', 'firma'
  nombre      text NOT NULL,
  url         text NOT NULL,
  tamanio     integer,                     -- bytes
  uploaded_by uuid REFERENCES auth.users(id),
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

---

## 7. job_hitos

Hitos o milestones de la OT.

```sql
CREATE TABLE job_hitos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id),
  job_id         uuid NOT NULL REFERENCES ordenes_trabajo(id) ON DELETE CASCADE,
  nombre         text NOT NULL,
  descripcion    text,
  fecha_estimada date,
  fecha_real     date,
  estado         text DEFAULT 'PENDIENTE', -- PENDIENTE, COMPLETADO
  orden          integer DEFAULT 0,
  completado_por uuid REFERENCES auth.users(id),
  completado_en  timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
```

---

## 8. produccion_ordenes

Órdenes de producción (fabricación).

```sql
CREATE TABLE produccion_ordenes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  job_id          uuid REFERENCES ordenes_trabajo(id),
  codigo          text NOT NULL,
  producto_id     uuid NOT NULL REFERENCES productos(id),
  cantidad        integer NOT NULL,
  estado          text DEFAULT 'PENDIENTE',
  -- PENDIENTE, PLANIFICADA, LIBERADA, EN_PRODUCCION,
  -- CONTROL_CALIDAD, EMPAQUE, DESPACHO, FINALIZADA
  responsable_id  uuid REFERENCES auth.users(id),
  fecha_inicio    date,
  fecha_fin       date,
  calidad         jsonb DEFAULT '{}',
  -- { aprobado, observaciones, inspector }
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid NOT NULL REFERENCES auth.users(id),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      uuid NOT NULL REFERENCES auth.users(id),
  UNIQUE (tenant_id, codigo)
);
```

---

## 9. produccion_tareas

Tareas del proceso de fabricación (Gantt).

```sql
CREATE TABLE produccion_tareas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL REFERENCES tenants(id),
  produccion_id     uuid NOT NULL REFERENCES produccion_ordenes(id) ON DELETE CASCADE,
  nombre            text NOT NULL,
  etapa             text NOT NULL,
  -- 'diseno', 'corte', 'soldadura', 'pintura', 'ensamble', 'pruebas', 'empaque'
  fecha_inicio      date,
  fecha_fin         date,
  duracion_dias     integer,
  responsable_id    uuid REFERENCES auth.users(id),
  maquina           text,
  estado            text DEFAULT 'PENDIENTE',
  dependencia_id    uuid REFERENCES produccion_tareas(id),
  orden             integer DEFAULT 0,
  progreso          numeric(5,2) DEFAULT 0,
  observaciones     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
```
