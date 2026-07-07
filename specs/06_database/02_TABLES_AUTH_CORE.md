# TABLES: Auth, Tenants, Users, Roles, Audit

## 1. tenants

```sql
CREATE TABLE tenants (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  slug        text NOT NULL UNIQUE,
  razon_social text,
  nit         text,
  direccion   text,
  ciudad      text,
  pais        text DEFAULT 'Colombia',
  telefono    text,
  correo      text,
  sitio_web   text,
  logo_url    text,
  favicon_url text,
  zona_horaria text DEFAULT 'America/Bogota',
  moneda      text DEFAULT 'COP',
  idioma      text DEFAULT 'es',
  activo      boolean DEFAULT true,
  plan        text DEFAULT 'gratuito',
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
```

---

## 2. tenant_settings

```sql
CREATE TABLE tenant_settings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL UNIQUE REFERENCES tenants(id),
  branding   jsonb DEFAULT '{}',
    -- { primary_color, secondary_color, success_color, warning_color,
    --   danger_color, info_color, font_family, border_radius }
  logos      jsonb DEFAULT '{}',
    -- { main, dark, light, print, login, sidebar, email, loader }
  email_from text,
  email_signature text,
  loader_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

---

## 3. users_profiles

Extiende `auth.users` con datos de perfil del ERP.

```sql
CREATE TABLE users_profiles (
  id             uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id      uuid NOT NULL REFERENCES tenants(id),
  nombre         text NOT NULL,
  apellido       text,
  cargo          text,
  telefono       text,
  avatar_url     text,
  activo         boolean DEFAULT true,
  ultimo_acceso  timestamptz,
  metadata       jsonb DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
```

---

## 4. roles

```sql
CREATE TABLE roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  codigo      text NOT NULL,         -- 'ADMIN', 'EJECUTIVO_COMERCIAL', etc.
  nombre      text NOT NULL,         -- 'Administrador', 'Ejecutivo Comercial'
  descripcion text,
  es_sistema  boolean DEFAULT false, -- Roles built-in no editables
  activo      boolean DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, codigo)
);
```

---

## 5. permissions

```sql
CREATE TABLE permissions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo      text NOT NULL UNIQUE,  -- 'leads.create', 'invoices.read'
  nombre      text NOT NULL,
  modulo      text NOT NULL,         -- 'crm', 'invoices', 'inventory'
  descripcion text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

---

## 6. role_permissions

```sql
CREATE TABLE role_permissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id       uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (role_id, permission_id)
);
```

---

## 7. usuario_roles

```sql
CREATE TABLE usuario_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id    uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  tenant_id  uuid NOT NULL REFERENCES tenants(id),
  es_principal boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (usuario_id, role_id)
);
```

---

## 8. audit_log

```sql
CREATE TABLE audit_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id),
  tabla        text NOT NULL,         -- 'leads', 'cotizaciones', etc.
  registro_id  uuid NOT NULL,         -- ID del registro modificado
  accion       text NOT NULL,         -- 'INSERT', 'UPDATE', 'DELETE'
  actor_id     uuid REFERENCES auth.users(id),
  old_data     jsonb,                 -- Valores anteriores
  new_data     jsonb,                 -- Valores nuevos
  diff         jsonb,                 -- Diff calculado (solo cambios)
  ip_address   text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Este registro es INMUTABLE. Sin updated_at, sin soft delete.
-- No se permite UPDATE ni DELETE sobre audit_log.
```

---

## 9. business_events

```sql
CREATE TABLE business_events (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES tenants(id),
  entity_type  text NOT NULL,         -- 'lead', 'quote', 'invoice', 'job'
  entity_id    uuid NOT NULL,
  accion       text NOT NULL,         -- 'created', 'status_changed', 'approved'
  actor_id     uuid REFERENCES auth.users(id),
  actor_role   text,
  old_status   text,
  new_status   text,
  metadata     jsonb DEFAULT '{}',
  ip_address   text,
  user_agent   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- INMUTABLE. Sin updated_at. Sin soft delete.
```

---

## 10. tenant_sequences

```sql
CREATE TABLE tenant_sequences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  entidad     text NOT NULL,          -- 'cotizacion', 'factura', 'ot', etc.
  prefijo     text NOT NULL,          -- 'COT', 'FAC', 'OT'
  ultimo_valor integer NOT NULL DEFAULT 0,
  formato     text DEFAULT '{PREFIJO}-{NUMERO:04d}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, entidad)
);
```

---

## 11. Integraciones

```sql
CREATE TABLE integraciones (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL REFERENCES tenants(id),
  proveedor      text NOT NULL,       -- 'wompi', 'twilio', 'meta', 'google'
  configuracion  jsonb NOT NULL DEFAULT '{}',
  activa         boolean DEFAULT false,
  ultima_sync    timestamptz,
  metadata       jsonb DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, proveedor)
);
```

---

## 12. notificaciones (plantillas)

```sql
CREATE TABLE plantillas_notificacion (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  evento      text NOT NULL,          -- 'lead.qualified', 'invoice.overdue'
  canal       text NOT NULL,          -- 'email', 'sms', 'whatsapp', 'in_app'
  asunto      text,
  cuerpo_html text,
  cuerpo_texto text,
  activa      boolean DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, evento, canal)
);
```

---

## 13. notificaciones (registro enviadas)

```sql
CREATE TABLE notificaciones_enviadas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES tenants(id),
  usuario_id      uuid REFERENCES auth.users(id),
  plantilla_id    uuid REFERENCES plantillas_notificacion(id),
  evento          text NOT NULL,
  canal           text NOT NULL,
  destinatario    text NOT NULL,       -- email, número de teléfono
  estado          text DEFAULT 'PENDIENTE',  -- PENDIENTE, ENVIADA, FALLIDA
  error           text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  enviado_at      timestamptz
);
```
