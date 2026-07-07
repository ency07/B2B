-- MIGRACIÓN FASE 2: CLIENTES, CONTACTOS, SEDES Y EVENTOS DE NEGOCIO
-- Archivo: supabase/migrations/20260617000002_clients_core.sql

-- 1. Crear Función Auxiliar para Obtener Usuario en Sesión (si no existe)
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

-- 1b. Crear Función Auxiliar para Validar Roles del Usuario
CREATE OR REPLACE FUNCTION current_user_has_role(p_role_code varchar)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = get_current_user_id()
          AND r.role_code = p_role_code
          AND r.status = 'Activo'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear Tabla de Clientes (clients)
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
    email varchar(200),
    phone varchar(50),
    country varchar(100) NOT NULL,
    state varchar(100),
    city varchar(100),
    address text,
    assigned_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT, -- Todo cliente debe tener propietario
    assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
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
    CONSTRAINT unique_tenant_tax_id UNIQUE (tenant_id, tax_id), -- Permitir mismo TAX_ID en tenants distintos, único por tenant
    CONSTRAINT unique_tenant_client_code UNIQUE (tenant_id, client_code)
);

-- 3. Crear Tabla de Sedes de Clientes (client_sites)
CREATE TABLE client_sites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    site_name varchar(200) NOT NULL,
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

-- 4. Crear Tabla de Contactos (client_contacts)
CREATE TABLE client_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    first_name varchar(100) NOT NULL,
    last_name varchar(100),
    position varchar(150),
    email varchar(200),
    phone varchar(50),
    mobile varchar(50),
    is_primary boolean NOT NULL DEFAULT false,
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

-- 5. Crear Tabla de Eventos de Negocio (business_events)
CREATE TABLE business_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_code varchar(100) NOT NULL,
    entity_type varchar(100) NOT NULL,
    entity_id uuid NOT NULL,
    payload jsonb NOT NULL,
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamp NOT NULL DEFAULT NOW()
);

-- 6. Crear Índices de Rendimiento
CREATE INDEX idx_clients_tenant ON clients(tenant_id);
CREATE INDEX idx_clients_tax_id ON clients(tenant_id, tax_id);
CREATE INDEX idx_clients_code ON clients(tenant_id, client_code);
CREATE INDEX idx_clients_assigned ON clients(assigned_user_id);

CREATE INDEX idx_client_sites_tenant ON client_sites(tenant_id);
CREATE INDEX idx_client_sites_client ON client_sites(client_id);

CREATE INDEX idx_client_contacts_tenant ON client_contacts(tenant_id);
CREATE INDEX idx_client_contacts_client ON client_contacts(client_id);

CREATE INDEX idx_business_events_tenant ON business_events(tenant_id);
CREATE INDEX idx_business_events_composite ON business_events(entity_type, entity_id);
CREATE INDEX idx_business_events_code ON business_events(event_code);

-- 7. Triggers de Lógica de Negocio

-- 7.1 Generación e Inmutabilidad de client_code
CREATE OR REPLACE FUNCTION handle_client_code()
RETURNS TRIGGER AS $$
DECLARE
    next_num integer;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT COALESCE(MAX(SUBSTRING(client_code FROM 5)::integer), 0) + 1
        INTO next_num
        FROM clients
        WHERE tenant_id = NEW.tenant_id;

        NEW.client_code := 'CLI-' || LPAD(next_num::text, 6, '0');
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.client_code <> OLD.client_code THEN
            NEW.client_code := OLD.client_code;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_client_code
BEFORE INSERT OR UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION handle_client_code();

-- 7.2 Reemplazo Automático de Contacto Principal
CREATE OR REPLACE FUNCTION handle_primary_contact()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_primary = true AND (TG_OP = 'INSERT' OR OLD.is_primary = false) THEN
        UPDATE client_contacts
        SET is_primary = false
        WHERE client_id = NEW.client_id 
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND is_primary = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_primary_contact
BEFORE INSERT OR UPDATE OF is_primary ON client_contacts
FOR EACH ROW
EXECUTE FUNCTION handle_primary_contact();

-- 7.3 Automatización de Trazabilidad en clients
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
        
        IF NEW.status <> OLD.status THEN
            NEW.status_changed_at := NOW();
            NEW.status_changed_by := v_user_id;
        END IF;

        IF NEW.assigned_user_id <> OLD.assigned_user_id THEN
            NEW.assigned_by := v_user_id;
        END IF;

        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            NEW.deleted_by := v_user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_client_traceability
BEFORE INSERT OR UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION handle_client_traceability();

-- 7.4 Automatización de Trazabilidad en client_contacts
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

        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            NEW.deleted_by := v_user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_contact_traceability
BEFORE INSERT OR UPDATE ON client_contacts
FOR EACH ROW
EXECUTE FUNCTION handle_contact_traceability();

-- 7.5 Automatización de Trazabilidad en client_sites
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

        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            NEW.deleted_by := v_user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_client_site_traceability
BEFORE INSERT OR UPDATE ON client_sites
FOR EACH ROW
EXECUTE FUNCTION handle_client_site_traceability();

-- 8. Triggers de Emisión de Eventos

-- 8.1 Emisión de Eventos de Clientes (AFTER INSERT/UPDATE)
CREATE OR REPLACE FUNCTION dispatch_client_events()
RETURNS TRIGGER AS $$
DECLARE
    v_payload jsonb;
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    -- EVENTO: CLIENT_CREATED
    IF TG_OP = 'INSERT' THEN
        v_payload := jsonb_build_object(
            'client_code', NEW.client_code,
            'legal_name', NEW.legal_name,
            'tax_id', NEW.tax_id,
            'status', NEW.status,
            'assigned_user_id', NEW.assigned_user_id
        );
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (NEW.tenant_id, 'CLIENT_CREATED', 'clients', NEW.id, v_payload, v_user_id);
        
    -- EVENTOS EN MODIFICACIÓN (UPDATE)
    ELSIF TG_OP = 'UPDATE' THEN
        -- 1. CLIENT_STATUS_CHANGED y derivados
        IF NEW.status <> OLD.status THEN
            v_payload := jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'change_reason', NEW.delete_reason
            );
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'CLIENT_STATUS_CHANGED', 'clients', NEW.id, v_payload, v_user_id);
            
            -- CLIENT_ARCHIVED
            IF NEW.status = 'ARCHIVADO' THEN
                INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
                VALUES (NEW.tenant_id, 'CLIENT_ARCHIVED', 'clients', NEW.id, 
                        jsonb_build_object('client_code', NEW.client_code, 'legal_name', NEW.legal_name, 'archived_at', NOW()), v_user_id);
            END IF;

            -- CLIENT_BLOCKED
            IF NEW.status = 'BLOQUEADO' THEN
                INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
                VALUES (NEW.tenant_id, 'CLIENT_BLOCKED', 'clients', NEW.id, 
                        jsonb_build_object('block_reason', NEW.delete_reason, 'blocked_at', NOW()), v_user_id);
            END IF;

            -- CLIENT_UNBLOCKED
            IF OLD.status = 'BLOQUEADO' AND NEW.status <> 'BLOQUEADO' THEN
                INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
                VALUES (NEW.tenant_id, 'CLIENT_UNBLOCKED', 'clients', NEW.id, 
                        jsonb_build_object('unblock_reason', 'Desbloqueo manual', 'unblocked_at', NOW()), v_user_id);
            END IF;
        END IF;

        -- 2. CLIENT_ASSIGNED (Cambio de responsable)
        IF NEW.assigned_user_id <> OLD.assigned_user_id THEN
            v_payload := jsonb_build_object(
                'old_assigned_user_id', OLD.assigned_user_id,
                'new_assigned_user_id', NEW.assigned_user_id
            );
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'CLIENT_ASSIGNED', 'clients', NEW.id, v_payload, v_user_id);
        END IF;

        -- 3. CLIENT_UPDATED (Cambios generales)
        DECLARE
            v_changes jsonb := '{}'::jsonb;
        BEGIN
            IF NEW.legal_name <> OLD.legal_name THEN v_changes := v_changes || jsonb_build_object('legal_name', jsonb_build_object('old', OLD.legal_name, 'new', NEW.legal_name)); END IF;
            IF NEW.commercial_name IS DISTINCT FROM OLD.commercial_name THEN v_changes := v_changes || jsonb_build_object('commercial_name', jsonb_build_object('old', OLD.commercial_name, 'new', NEW.commercial_name)); END IF;
            IF NEW.phone IS DISTINCT FROM OLD.phone THEN v_changes := v_changes || jsonb_build_object('phone', jsonb_build_object('old', OLD.phone, 'new', NEW.phone)); END IF;
            IF NEW.email IS DISTINCT FROM OLD.email THEN v_changes := v_changes || jsonb_build_object('email', jsonb_build_object('old', OLD.email, 'new', NEW.email)); END IF;

            IF v_changes <> '{}'::jsonb THEN
                INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
                VALUES (NEW.tenant_id, 'CLIENT_UPDATED', 'clients', NEW.id, jsonb_build_object('changes', v_changes), v_user_id);
            END IF;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_client_events
AFTER INSERT OR UPDATE ON clients
FOR EACH ROW
EXECUTE FUNCTION dispatch_client_events();

-- 8.2 Emisión de Eventos de Contactos (AFTER INSERT/UPDATE)
CREATE OR REPLACE FUNCTION dispatch_contact_events()
RETURNS TRIGGER AS $$
DECLARE
    v_payload jsonb;
    v_user_id uuid;
    v_old_primary_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    -- EVENTO: CONTACT_CREATED
    IF TG_OP = 'INSERT' THEN
        v_payload := jsonb_build_object(
            'contact_id', NEW.id,
            'first_name', NEW.first_name,
            'last_name', NEW.last_name,
            'email', NEW.email,
            'is_primary', NEW.is_primary
        );
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (NEW.tenant_id, 'CONTACT_CREATED', 'client_contacts', NEW.id, v_payload, v_user_id);

        IF NEW.is_primary = true THEN
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'CONTACT_PRIMARY_CHANGED', 'client_contacts', NEW.id, 
                    jsonb_build_object('client_id', NEW.client_id, 'old_primary_contact_id', NULL, 'new_primary_contact_id', NEW.id), v_user_id);
        END IF;

    -- EVENTO: UPDATE
    ELSIF TG_OP = 'UPDATE' THEN
        -- 1. CONTACT_DELETED
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            v_payload := jsonb_build_object(
                'contact_id', NEW.id,
                'delete_reason', NEW.delete_reason,
                'deleted_at', NEW.deleted_at
            );
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'CONTACT_DELETED', 'client_contacts', NEW.id, v_payload, v_user_id);
            
        -- 2. CONTACT_PRIMARY_CHANGED
        ELSIF NEW.is_primary = true AND OLD.is_primary = false THEN
            SELECT id INTO v_old_primary_id 
            FROM client_contacts 
            WHERE client_id = NEW.client_id AND is_primary = false AND id <> NEW.id
            ORDER BY updated_at DESC LIMIT 1;

            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'CONTACT_PRIMARY_CHANGED', 'client_contacts', NEW.id, 
                    jsonb_build_object('client_id', NEW.client_id, 'old_primary_contact_id', v_old_primary_id, 'new_primary_contact_id', NEW.id), v_user_id);

        -- 3. CONTACT_UPDATED
        ELSE
            DECLARE
                v_changes jsonb := '{}'::jsonb;
            BEGIN
                IF NEW.first_name <> OLD.first_name THEN v_changes := v_changes || jsonb_build_object('first_name', jsonb_build_object('old', OLD.first_name, 'new', NEW.first_name)); END IF;
                IF NEW.last_name IS DISTINCT FROM OLD.last_name THEN v_changes := v_changes || jsonb_build_object('last_name', jsonb_build_object('old', OLD.last_name, 'new', NEW.last_name)); END IF;
                IF NEW.email IS DISTINCT FROM OLD.email THEN v_changes := v_changes || jsonb_build_object('email', jsonb_build_object('old', OLD.email, 'new', NEW.email)); END IF;
                IF NEW.phone IS DISTINCT FROM OLD.phone THEN v_changes := v_changes || jsonb_build_object('phone', jsonb_build_object('old', OLD.phone, 'new', NEW.phone)); END IF;

                IF v_changes <> '{}'::jsonb THEN
                    INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
                    VALUES (NEW.tenant_id, 'CONTACT_UPDATED', 'client_contacts', NEW.id, jsonb_build_object('changes', v_changes), v_user_id);
                END IF;
            END;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_contact_events
AFTER INSERT OR UPDATE ON client_contacts
FOR EACH ROW
EXECUTE FUNCTION dispatch_contact_events();

-- 8.3 Emisión de Eventos de Sedes (AFTER INSERT/UPDATE)
CREATE OR REPLACE FUNCTION dispatch_client_site_events()
RETURNS TRIGGER AS $$
DECLARE
    v_payload jsonb;
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    -- EVENTO: CLIENT_SITE_CREATED
    IF TG_OP = 'INSERT' THEN
        v_payload := jsonb_build_object(
            'client_id', NEW.client_id,
            'site_name', NEW.site_name,
            'city', NEW.city,
            'address', NEW.address
        );
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (NEW.tenant_id, 'CLIENT_SITE_CREATED', 'client_sites', NEW.id, v_payload, v_user_id);

    -- EVENTO: UPDATE
    ELSIF TG_OP = 'UPDATE' THEN
        -- 1. CLIENT_SITE_DELETED (Soft delete)
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            v_payload := jsonb_build_object(
                'client_id', NEW.client_id,
                'site_name', NEW.site_name,
                'delete_reason', NEW.delete_reason,
                'deleted_at', NEW.deleted_at
            );
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'CLIENT_SITE_DELETED', 'client_sites', NEW.id, v_payload, v_user_id);
            
        -- 2. CLIENT_SITE_UPDATED
        ELSE
            DECLARE
                v_changes jsonb := '{}'::jsonb;
            BEGIN
                IF NEW.site_name <> OLD.site_name THEN v_changes := v_changes || jsonb_build_object('site_name', jsonb_build_object('old', OLD.site_name, 'new', NEW.site_name)); END IF;
                IF NEW.address <> OLD.address THEN v_changes := v_changes || jsonb_build_object('address', jsonb_build_object('old', OLD.address, 'new', NEW.address)); END IF;
                IF NEW.phone IS DISTINCT FROM OLD.phone THEN v_changes := v_changes || jsonb_build_object('phone', jsonb_build_object('old', OLD.phone, 'new', NEW.phone)); END IF;

                IF v_changes <> '{}'::jsonb THEN
                    INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
                    VALUES (NEW.tenant_id, 'CLIENT_SITE_UPDATED', 'client_sites', NEW.id, jsonb_build_object('changes', v_changes), v_user_id);
                END IF;
            END;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_client_site_events
AFTER INSERT OR UPDATE ON client_sites
FOR EACH ROW
EXECUTE FUNCTION dispatch_client_site_events();

-- 9. Triggers de Auditoría Técnica

CREATE TRIGGER audit_clients_trigger
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW
EXECUTE FUNCTION process_audit_log();

CREATE TRIGGER audit_contacts_trigger
AFTER INSERT OR UPDATE OR DELETE ON client_contacts
FOR EACH ROW
EXECUTE FUNCTION process_audit_log();

CREATE TRIGGER audit_client_sites_trigger
AFTER INSERT OR UPDATE OR DELETE ON client_sites
FOR EACH ROW
EXECUTE FUNCTION process_audit_log();

-- 10. Row Level Security (RLS)

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_events ENABLE ROW LEVEL SECURITY;

-- 10.1 Políticas para clients
CREATE POLICY clients_super_admin ON clients FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY clients_select_tenant ON clients FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR
        deleted_at IS NULL
    )
);

CREATE POLICY clients_insert_tenant ON clients FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY clients_update_tenant ON clients FOR UPDATE TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND deleted_at IS NULL
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- 10.2 Políticas para client_contacts
CREATE POLICY contacts_super_admin ON client_contacts FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY contacts_select_tenant ON client_contacts FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR
        deleted_at IS NULL
    )
);

CREATE POLICY contacts_insert_tenant ON client_contacts FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (SELECT deleted_at FROM clients WHERE id = client_id) IS NULL
);

CREATE POLICY contacts_update_tenant ON client_contacts FOR UPDATE TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND deleted_at IS NULL
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- 10.3 Políticas para client_sites
CREATE POLICY client_sites_super_admin ON client_sites FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY client_sites_select_tenant ON client_sites FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR
        deleted_at IS NULL
    )
);

CREATE POLICY client_sites_insert_tenant ON client_sites FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (SELECT deleted_at FROM clients WHERE id = client_id) IS NULL
);

CREATE POLICY client_sites_update_tenant ON client_sites FOR UPDATE TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND deleted_at IS NULL
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- 10.4 Políticas para business_events
CREATE POLICY business_events_super_admin ON business_events FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY business_events_select ON business_events FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);
