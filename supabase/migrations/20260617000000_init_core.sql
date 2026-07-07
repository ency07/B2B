-- MIGRACIÓN INICIAL: CREACIÓN DE ESTRUCTURA CORE Y SEGURIDAD RLS
-- Archivo: supabase/migrations/20260617000000_init_core.sql

-- 1. Crear Esquema de Auditoría y Enums
CREATE TYPE tenant_status_enum AS ENUM ('Activo', 'Inactivo', 'Suspendido');
CREATE TYPE user_status_enum AS ENUM ('Activo', 'Inactivo', 'Bloqueado');
CREATE TYPE role_status_enum AS ENUM ('Activo', 'Inactivo');
CREATE TYPE site_status_enum AS ENUM ('Activo', 'Inactivo');
CREATE TYPE area_status_enum AS ENUM ('Activo', 'Inactivo');

-- 2. Crear Tabla de Tenants
CREATE TABLE tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_code varchar(50) NOT NULL UNIQUE,
    name varchar(200) NOT NULL,
    legal_name varchar(250) NOT NULL,
    tax_id varchar(100) NOT NULL UNIQUE,
    email varchar(200),
    phone varchar(50),
    status tenant_status_enum NOT NULL DEFAULT 'Activo',
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW()
);

-- 3. Crear Tabla de Sedes (Sites)
CREATE TABLE sites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    site_code varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    description text,
    country varchar(100),
    state varchar(100),
    city varchar(100),
    address text,
    phone varchar(50),
    email varchar(200),
    manager_user_id uuid, -- se referencia despues por integridad circular
    status site_status_enum NOT NULL DEFAULT 'Activo',
    CONSTRAINT unique_tenant_site UNIQUE (tenant_id, site_code)
);

-- 4. Crear Tabla de Áreas (Areas)
CREATE TABLE areas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    area_code varchar(50) NOT NULL,
    name varchar(200) NOT NULL,
    description text,
    manager_user_id uuid, -- se referencia despues por integridad circular
    status area_status_enum NOT NULL DEFAULT 'Activo',
    CONSTRAINT unique_tenant_area UNIQUE (tenant_id, area_code)
);

-- 5. Crear Tabla de Usuarios
CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenants(id) ON DELETE RESTRICT, -- null para super admin de plataforma
    employee_code varchar(50),
    first_name varchar(100) NOT NULL,
    last_name varchar(100) NOT NULL,
    email varchar(200) NOT NULL,
    phone varchar(50),
    auth_user_id uuid UNIQUE, -- se asocia al auth.users de Supabase
    site_id uuid REFERENCES sites(id) ON DELETE SET NULL,
    area_id uuid REFERENCES areas(id) ON DELETE SET NULL,
    manager_id uuid REFERENCES users(id) ON DELETE SET NULL, -- relacion jerarquica
    is_platform_user boolean NOT NULL DEFAULT false, -- bypass de RLS para SUPER_ADMIN
    status user_status_enum NOT NULL DEFAULT 'Activo',
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_email UNIQUE (tenant_id, email)
);

-- Añadir restricciones circulares pendientes
ALTER TABLE sites ADD CONSTRAINT fk_sites_manager FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE areas ADD CONSTRAINT fk_areas_manager FOREIGN KEY (manager_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 6. Crear Tabla de Roles
CREATE TABLE roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE, -- null para roles globales del sistema
    role_code varchar(50) NOT NULL,
    name varchar(100) NOT NULL,
    description text,
    status role_status_enum NOT NULL DEFAULT 'Activo',
    CONSTRAINT unique_tenant_role UNIQUE (tenant_id, role_code)
);

-- 7. Crear Tabla de Permisos
CREATE TABLE permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_code varchar(100) NOT NULL UNIQUE,
    name varchar(150) NOT NULL,
    module varchar(100) NOT NULL,
    description text
);

-- 8. Crear Tabla de Relación User-Roles
CREATE TABLE user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE, -- null para roles globales/super admin
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at timestamp NOT NULL DEFAULT NOW(),
    assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_user_role UNIQUE (user_id, role_id)
);

-- 9. Crear Tabla de Relación User-Permissions (Excepciones)
CREATE TABLE user_permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE, -- null para excepciones globales
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted boolean NOT NULL DEFAULT true,
    assigned_at timestamp NOT NULL DEFAULT NOW(),
    assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_user_permission UNIQUE (user_id, permission_id)
);

-- 10. Crear Tabla de Auditoría (Audit Log)
CREATE TABLE audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
    event_code varchar(50) NOT NULL,
    entity_type varchar(100) NOT NULL,
    entity_id uuid,
    action varchar(50) NOT NULL,
    old_values jsonb,
    new_values jsonb,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    ip_address varchar(100),
    user_agent text,
    created_at timestamp NOT NULL DEFAULT NOW()
);

-- 11. Creación de Índices para Optimización
CREATE INDEX idx_tenants_code ON tenants(tenant_code);
CREATE INDEX idx_tenants_tax_id ON tenants(tax_id);
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_auth_id ON users(auth_user_id);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE INDEX idx_roles_tenant_code ON roles(tenant_id, role_code);
CREATE INDEX idx_permissions_code ON permissions(permission_code);
CREATE INDEX idx_user_roles_composite ON user_roles(user_id, role_id);
CREATE INDEX idx_user_roles_tenant ON user_roles(tenant_id);
CREATE INDEX idx_user_permissions_composite ON user_permissions(user_id, permission_id);
CREATE INDEX idx_sites_tenant_code ON sites(tenant_id, site_code);
CREATE INDEX idx_areas_tenant_code ON areas(tenant_id, area_code);
CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

-- 12. Motor de Auditoría y Triggers
CREATE OR REPLACE FUNCTION process_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id uuid;
    current_tenant_id uuid;
    action_type varchar(50);
    old_data jsonb := NULL;
    new_data jsonb := NULL;
    entity_id_val uuid := NULL;
BEGIN
    -- Determinar el tipo de operación
    IF (TG_OP = 'DELETE') THEN
        action_type := 'DELETE';
        old_data := to_jsonb(OLD);
        entity_id_val := OLD.id;
        IF (TG_TABLE_NAME = 'tenants') THEN
            current_tenant_id := OLD.id;
        ELSE
            current_tenant_id := OLD.tenant_id;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        action_type := 'UPDATE';
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);
        entity_id_val := NEW.id;
        IF (TG_TABLE_NAME = 'tenants') THEN
            current_tenant_id := NEW.id;
        ELSE
            current_tenant_id := NEW.tenant_id;
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        action_type := 'CREATE';
        new_data := to_jsonb(NEW);
        entity_id_val := NEW.id;
        IF (TG_TABLE_NAME = 'tenants') THEN
            current_tenant_id := NEW.id;
        ELSE
            current_tenant_id := NEW.tenant_id;
        END IF;
    END IF;

    -- Intentar obtener el user_id operativo desde auth.uid() de Supabase
    SELECT id, tenant_id INTO current_user_id, current_tenant_id 
    FROM users 
    WHERE auth_user_id = auth.uid() 
    LIMIT 1;

    -- Si no hay usuario en sesión (p. ej. scripts o carga inicial), usar valores del registro si aplica
    IF (current_tenant_id IS NULL) THEN
        IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
            IF (TG_TABLE_NAME = 'tenants') THEN
                current_tenant_id := NEW.id;
            ELSE
                current_tenant_id := NEW.tenant_id;
            END IF;
        ELSE
            IF (TG_TABLE_NAME = 'tenants') THEN
                current_tenant_id := OLD.id;
            ELSE
                current_tenant_id := OLD.tenant_id;
            END IF;
        END IF;
    END IF;

    -- Insertar en el log de auditoría
    INSERT INTO audit_log (
        tenant_id,
        event_code,
        entity_type,
        entity_id,
        action,
        old_values,
        new_values,
        user_id,
        ip_address,
        user_agent
    ) VALUES (
        current_tenant_id,
        upper(TG_TABLE_NAME) || '_' || action_type,
        TG_TABLE_NAME,
        entity_id_val,
        action_type,
        old_data,
        new_data,
        current_user_id,
        inet_client_addr()::varchar,
        NULL -- Supabase no expone user-agent en contexto nativo SQL de forma directa sin custom claims
    );

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adjuntar Triggers de Auditoría
CREATE TRIGGER audit_tenants AFTER INSERT OR UPDATE OR DELETE ON tenants FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_sites AFTER INSERT OR UPDATE OR DELETE ON sites FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_areas AFTER INSERT OR UPDATE OR DELETE ON areas FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_roles AFTER INSERT OR UPDATE OR DELETE ON roles FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_user_roles AFTER INSERT OR UPDATE OR DELETE ON user_roles FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_user_permissions AFTER INSERT OR UPDATE OR DELETE ON user_permissions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 13. Habilitar Seguridad RLS y Definir Políticas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Auxiliar: Función de verificación de SUPER_ADMIN
CREATE OR REPLACE FUNCTION is_platform_super_admin()
RETURNS boolean AS $$
BEGIN
    IF session_user = 'postgres' THEN
        RETURN true;
    END IF;
    RETURN COALESCE(
        (SELECT is_platform_user FROM users WHERE auth_user_id = auth.uid() LIMIT 1),
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas de RLS por Tabla

-- Tenants
CREATE POLICY tenants_isolation ON tenants
    FOR ALL USING (
        is_platform_super_admin() OR id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    );

-- Sites
CREATE POLICY sites_isolation ON sites
    FOR ALL USING (
        is_platform_super_admin() OR tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    );

-- Areas
CREATE POLICY areas_isolation ON areas
    FOR ALL USING (
        is_platform_super_admin() OR tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    );

-- Users
CREATE POLICY users_isolation ON users
    FOR ALL USING (
        is_platform_super_admin() OR tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    );

-- Roles
CREATE POLICY roles_isolation ON roles
    FOR ALL USING (
        is_platform_super_admin() OR tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) OR tenant_id IS NULL
    );

-- User Roles
CREATE POLICY user_roles_isolation ON user_roles
    FOR ALL USING (
        is_platform_super_admin() OR tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    );

-- User Permissions
CREATE POLICY user_permissions_isolation ON user_permissions
    FOR ALL USING (
        is_platform_super_admin() OR tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    );

-- Audit Log
CREATE POLICY audit_log_isolation ON audit_log
    FOR ALL USING (
        is_platform_super_admin() OR tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    );

-- Permissions (Lectura libre para autenticados, escritura solo Super Admin)
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY permissions_read_all ON permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY permissions_write_admin ON permissions FOR ALL TO authenticated USING (is_platform_super_admin());
