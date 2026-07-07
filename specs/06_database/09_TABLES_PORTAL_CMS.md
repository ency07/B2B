# TABLES: Portal Cliente, CMS, Tickets, Garantías, Banners

## 1. garantias

```sql
CREATE TABLE garantias (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  codigo          text NOT NULL,
  job_id          uuid NOT NULL REFERENCES ordenes_trabajo(id),
  cliente_id      uuid NOT NULL REFERENCES clientes(id),
  producto_id     uuid REFERENCES productos(id),
  duracion_meses  integer NOT NULL DEFAULT 12,
  fecha_inicio    date NOT NULL,
  fecha_fin       date NOT NULL,
  estado          text DEFAULT 'GARANTIA_ACTIVA',
  motivo_reclamo  text,
  evaluacion      text,
  resolucion      text,
  costo_reposicion numeric(15,2),
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, codigo)
);

ALTER TABLE garantias ADD CONSTRAINT ck_garantias_estado
CHECK (estado IN (
  'GARANTIA_ACTIVA', 'GARANTIA_EN_RECLAMO', 'GARANTIA_EN_EVALUACION',
  'GARANTIA_APROBADA', 'GARANTIA_RECHAZADA', 'GARANTIA_CERRADA',
  'GARANTIA_VENCIDA'
));
```

---

## 2. tickets

```sql
CREATE TABLE tickets (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  codigo        text NOT NULL,
  cliente_id    uuid NOT NULL REFERENCES clientes(id),
  job_id        uuid REFERENCES ordenes_trabajo(id),
  asunto        text NOT NULL,
  prioridad     text DEFAULT 'MEDIA',     -- BAJA, MEDIA, ALTA
  estado        text DEFAULT 'ABIERTO',   -- ABIERTO, EN_PROCESO, RESUELTO, CERRADO
  creado_por    uuid NOT NULL REFERENCES auth.users(id),
  asignado_a    uuid REFERENCES auth.users(id),
  cerrado_en    timestamptz,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, codigo)
);
```

---

## 3. ticket_mensajes

```sql
CREATE TABLE ticket_mensajes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  ticket_id   uuid NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  autor_id    uuid NOT NULL REFERENCES auth.users(id),
  es_cliente  boolean DEFAULT false,
  contenido   text NOT NULL,
  archivos    jsonb DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now()
);
-- INMUTABLE. Sin UPDATE.
```

---

## 4. cms_paginas

```sql
CREATE TABLE cms_paginas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  titulo          text NOT NULL,
  slug            text NOT NULL,
  contenido       jsonb NOT NULL DEFAULT '{}',
  -- { secciones: [{ tipo, datos }] }
  meta_title      text,
  meta_description text,
  social_image    text,
  estado          text DEFAULT 'BORRADOR',  -- BORRADOR, PUBLICADO, PROGRAMADO, OCULTO
  publicado_en    timestamptz,
  programado_para timestamptz,
  autor_id        uuid REFERENCES auth.users(id),
  version         integer DEFAULT 1,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (tenant_id, slug)
);
```

---

## 5. cms_blog

```sql
CREATE TABLE cms_blog (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id),
  titulo              text NOT NULL,
  slug                text NOT NULL,
  resumen             text,
  contenido           text NOT NULL,
  imagen_destacada    text,
  categoria           text,
  autor_id            uuid REFERENCES auth.users(id),
  estado              text DEFAULT 'BORRADOR',
  publicado_en        timestamptz,
  vistas              integer DEFAULT 0,
  tiempo_lectura      integer,         -- minutos
  meta_title          text,
  meta_description    text,
  productos_relacionados uuid[] DEFAULT '{}',
  metadata            jsonb DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  UNIQUE (tenant_id, slug)
);
```

---

## 6. cms_productos

```sql
CREATE TABLE cms_productos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  producto_id     uuid NOT NULL REFERENCES productos(id),
  -- Datos para la web pública
  titulo_web      text,
  descripcion_web text,
  imagen_principal text,
  imagenes        jsonb DEFAULT '[]',
  especificaciones jsonb DEFAULT '[]',
  documentos      jsonb DEFAULT '[]',
  -- [{ nombre, tipo, url, tamanio }]
  estado          text DEFAULT 'BORRADOR',
  meta_title      text,
  meta_description text,
  publicado_en    timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, producto_id)
);
```

---

## 7. cms_servicios

```sql
CREATE TABLE cms_servicios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  titulo          text NOT NULL,
  slug            text NOT NULL,
  descripcion     text,
  imagen          text,
  icono           text,
  categoria       text,
  features        jsonb DEFAULT '[]',
  estado          text DEFAULT 'BORRADOR',
  orden           integer DEFAULT 0,
  published_at    timestamptz,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);
```

---

## 8. cms_casos_exito

```sql
CREATE TABLE cms_casos_exito (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  titulo          text NOT NULL,
  slug            text NOT NULL,
  sector          text,
  cliente         text,
  logo_cliente    text,
  imagen          text,
  descripcion     text,
  metrica1_valor  text,
  metrica1_label  text,
  metrica2_valor  text,
  metrica2_label  text,
  metrica3_valor  text,
  metrica3_label  text,
  galeria         jsonb DEFAULT '[]',
  destacado       boolean DEFAULT false,
  estado          text DEFAULT 'BORRADOR',
  orden           integer DEFAULT 0,
  publicado_en    timestamptz,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);
```

---

## 9. cms_testimonios

```sql
CREATE TABLE cms_testimonios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  nombre          text NOT NULL,
  cargo           text,
  empresa         text,
  foto            text,
  contenido       text NOT NULL,
  estado          text DEFAULT 'BORRADOR',
  orden           integer DEFAULT 0,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

---

## 10. cms_banners

```sql
CREATE TABLE cms_banners (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  titulo          text NOT NULL,
  subtitulo       text,
  imagen          text NOT NULL,
  imagen_mobile   text,
  cta_texto       text,
  cta_url         text,
  ubicacion       text DEFAULT 'home',   -- home, productos, servicios
  fecha_inicio    date NOT NULL,
  fecha_fin       date NOT NULL,
  estado          text DEFAULT 'ACTIVO', -- ACTIVO, INACTIVO, EXPIRADO
  orden           integer DEFAULT 0,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

---

## 11. cms_menu

```sql
CREATE TABLE cms_menu (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  label       text NOT NULL,
  url         text NOT NULL,
  target      text DEFAULT '_self',
  padre_id    uuid REFERENCES cms_menu(id),
  orden       integer DEFAULT 0,
  activo      boolean DEFAULT true,
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

---

## 12. documentos (repositorio centralizado)

```sql
CREATE TABLE documentos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  nombre          text NOT NULL,
  tipo            text NOT NULL,          -- pdf, dwg, step, dxf, jpg, png, zip
  url             text NOT NULL,          -- Storage URL
  tamanio         integer,               -- bytes
  entidad_tipo    text,                  -- 'producto', 'ot', 'cotizacion', 'factura'
  entidad_id      uuid,
  version         integer DEFAULT 1,
  es_publico      boolean DEFAULT false,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id),
  deleted_at      timestamptz
);
```
