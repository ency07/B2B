# MODELO DE ENTIDADES DE CLIENTES (CLIENTS ENTITY MODEL)

Este documento especifica el diseño relacional, las restricciones físicas y el comportamiento automático para las tablas `clients`, `client_contacts` y la nueva tabla `client_sites` (consecuencia de la PREGUNTA 4 y PREGUNTA 5).

---

## 1. Estructura de Tablas (DDL)

```sql
-- Estado del Cliente: PROSPECTO, ACTIVO, INACTIVO, BLOQUEADO, ARCHIVADO
-- Estado del Contacto: ACTIVO, INACTIVO

-- Tabla principal de Clientes
CREATE TABLE clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    client_code varchar(50) NOT NULL,
    client_type varchar(50) NOT NULL CHECK (client_type IN ('Empresa', 'Persona')),
    legal_name varchar(250) NOT NULL,
    commercial_name varchar(250),
    tax_id varchar(100) NOT NULL,
    industry varchar(150),
    website varchar(250),
    email varchar(200), -- Email de contacto legal/principal de la empresa
    phone varchar(50),
    country varchar(100) NOT NULL,
    state varchar(100),
    city varchar(100),
    address text,
    assigned_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- Comercial asignado (Obligatorio, no huérfanos)
    assigned_by uuid REFERENCES users(id) ON DELETE SET NULL, -- Quién asignó al comercial
    status varchar(50) NOT NULL DEFAULT 'PROSPECTO' CHECK (status IN ('PROSPECTO', 'ACTIVO', 'INACTIVO', 'BLOQUEADO', 'ARCHIVADO')),
    
    -- Trazabilidad
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,
    status_changed_at timestamp,
    status_changed_by uuid REFERENCES users(id) ON DELETE SET NULL,

    -- Restricciones de Unicidad
    CONSTRAINT unique_tenant_tax_id UNIQUE (tenant_id, tax_id), -- Mismo TAX_ID permitido en diferentes tenants
    CONSTRAINT unique_tenant_client_code UNIQUE (tenant_id, client_code)
);

-- Tabla de Múltiples Sedes de Clientes (Pregunta 4 — Opción A)
CREATE TABLE client_sites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    site_name varchar(200) NOT NULL, -- Ej: "Bodega Principal", "Sucursal Norte"
    country varchar(100) NOT NULL,
    state varchar(100),
    city varchar(100),
    address text NOT NULL,
    phone varchar(50),
    is_billing boolean NOT NULL DEFAULT false,
    is_shipping boolean NOT NULL DEFAULT false,
    
    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

-- Tabla de Contactos y Múltiples Correos (Pregunta 5 — Opción A)
CREATE TABLE client_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    first_name varchar(100) NOT NULL,
    last_name varchar(100),
    position varchar(150),
    email varchar(200), -- Permite múltiples correos corporativos asociados a distintos contactos del cliente
    phone varchar(50),
    mobile varchar(50),
    is_primary boolean NOT NULL DEFAULT false, -- Reemplazo automático por trigger
    status varchar(50) NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'INACTIVO')),
    
    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);
```

---

## 2. Auxiliar: Obtener Usuario en Sesión

```sql
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid AS $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id
    FROM users 
    WHERE auth_user_id = auth.uid() 
    LIMIT 1;
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. Generación Automática e Inmutabilidad de `client_code`

```sql
CREATE OR REPLACE FUNCTION handle_client_code()
RETURNS TRIGGER AS $$
DECLARE
    next_num integer;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Bloquear consulta para evitar condiciones de carrera en inserciones concurrentes
        SELECT COALESCE(MAX(SUBSTRING(client_code FROM 5)::integer), 0) + 1
        INTO next_num
        FROM clients
        WHERE tenant_id = NEW.tenant_id;

        -- Formatear a CLI-000001
        NEW.client_code := 'CLI-' || LPAD(next_num::text, 6, '0');
    ELSIF TG_OP = 'UPDATE' THEN
        -- Impedir que el código de cliente sea editado
        IF NEW.client_code <> OLD.client_code THEN
            NEW.client_code := OLD.client_code;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_client_code
BEFORE INSERT OR UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION handle_client_code();
```

---

## 4. Lógica del Contacto Principal (Reemplazo Automático)

```sql
CREATE OR REPLACE FUNCTION handle_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el contacto actual se está marcando como principal
    IF NEW.is_primary = true AND (TG_OP = 'INSERT' OR OLD.is_primary = false) THEN
        -- Desmarcar el contacto principal actual para este cliente
        UPDATE client_contacts
        SET is_primary = false
        WHERE client_id = NEW.client_id 
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_primary_contact
BEFORE INSERT OR UPDATE OF is_primary ON client_contacts
FOR EACH ROW
EXECUTE FUNCTION handle_primary_contact();
```

---

## 5. Automatización de Trazabilidad (Triggers)

```sql
-- Trigger para la tabla clients
CREATE OR REPLACE FUNCTION handle_client_traceability()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_OP = 'INSERT' THEN
        NEW.created_at := NOW();
        IF NEW.created_by IS NULL THEN
            NEW.created_by := v_user_id;
        END IF;
        NEW.status_changed_at := NOW();
        NEW.status_changed_by := NEW.created_by;
        NEW.assigned_by := NEW.created_by;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_at := NOW();
        NEW.updated_by := v_user_id;
        
        -- Si cambia el estado (Status transition traceability)
        IF NEW.status <> OLD.status THEN
            NEW.status_changed_at := NOW();
            NEW.status_changed_by := v_user_id;
        END IF;

        -- Si cambia el ejecutivo responsable
        IF NEW.assigned_user_id <> OLD.assigned_user_id THEN
            NEW.assigned_by := v_user_id;
        END IF;

        -- Si se ejecuta borrado lógico directo sobre el cliente
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            NEW.deleted_by := v_user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_client_traceability
BEFORE INSERT OR UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION handle_client_traceability();
```

```sql
-- Trigger para la tabla client_contacts
CREATE OR REPLACE FUNCTION handle_contact_traceability()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_OP = 'INSERT' THEN
        NEW.created_at := NOW();
        IF NEW.created_by IS NULL THEN
            NEW.created_by := v_user_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_at := NOW();
        NEW.updated_by := v_user_id;

        -- Si es un borrado lógico (soft delete)
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            NEW.deleted_by := v_user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_contact_traceability
BEFORE INSERT OR UPDATE ON client_contacts
FOR EACH ROW
EXECUTE FUNCTION handle_contact_traceability();
```

```sql
-- Trigger para la tabla client_sites
CREATE OR REPLACE FUNCTION handle_client_site_traceability()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_OP = 'INSERT' THEN
        NEW.created_at := NOW();
        IF NEW.created_by IS NULL THEN
            NEW.created_by := v_user_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_at := NOW();
        NEW.updated_by := v_user_id;

        -- Si es un borrado lógico (soft delete)
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            NEW.deleted_by := v_user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_client_site_traceability
BEFORE INSERT OR UPDATE ON client_sites
FOR EACH ROW
EXECUTE FUNCTION handle_client_site_traceability();
```
