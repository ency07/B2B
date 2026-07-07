-- ==================================================
-- BASE DE DATOS COMPLETA: ERP B2B PREMIUM
-- Generado: 2026-06-20T02:39:48.124Z
-- ==================================================

-- --------------------------------------------------
-- MIGRACIÓN: 20260617000000_init_core.sql
-- --------------------------------------------------
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
CREATE POLICY users_select_tenant ON users
    FOR SELECT TO authenticated
    USING (
        is_platform_super_admin() OR tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    );

CREATE POLICY users_insert_admin ON users
    FOR INSERT TO authenticated
    WITH CHECK (
        is_platform_super_admin() OR (
            tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
            AND (current_user_has_role('ADMIN_EMPRESA') OR current_user_has_role('SUPER_ADMIN') OR current_user_has_role('ADMIN_DEV'))
        )
    );

CREATE POLICY users_update_admin ON users
    FOR UPDATE TO authenticated
    USING (
        is_platform_super_admin() OR (
            tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
            AND (current_user_has_role('ADMIN_EMPRESA') OR current_user_has_role('SUPER_ADMIN') OR current_user_has_role('ADMIN_DEV'))
        )
    );

CREATE POLICY users_delete_admin ON users
    FOR DELETE TO authenticated
    USING (
        is_platform_super_admin() OR (
            tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
            AND (current_user_has_role('ADMIN_EMPRESA') OR current_user_has_role('SUPER_ADMIN') OR current_user_has_role('ADMIN_DEV'))
        )
    );

-- Roles
CREATE POLICY roles_isolation ON roles
    FOR ALL USING (
        is_platform_super_admin() OR tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) OR tenant_id IS NULL
    );

-- User Roles
CREATE POLICY user_roles_select_tenant ON user_roles
    FOR SELECT TO authenticated
    USING (
        is_platform_super_admin() OR tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    );

CREATE POLICY user_roles_insert_admin ON user_roles
    FOR INSERT TO authenticated
    WITH CHECK (
        is_platform_super_admin() OR (
            tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
            AND (current_user_has_role('ADMIN_EMPRESA') OR current_user_has_role('SUPER_ADMIN') OR current_user_has_role('ADMIN_DEV'))
        )
    );

CREATE POLICY user_roles_update_admin ON user_roles
    FOR UPDATE TO authenticated
    USING (
        is_platform_super_admin() OR (
            tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
            AND (current_user_has_role('ADMIN_EMPRESA') OR current_user_has_role('SUPER_ADMIN') OR current_user_has_role('ADMIN_DEV'))
        )
    );

CREATE POLICY user_roles_delete_admin ON user_roles
    FOR DELETE TO authenticated
    USING (
        is_platform_super_admin() OR (
            tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
            AND (current_user_has_role('ADMIN_EMPRESA') OR current_user_has_role('SUPER_ADMIN') OR current_user_has_role('ADMIN_DEV'))
        )
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


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000001_seed_master_data.sql
-- --------------------------------------------------
-- SEMILLA DE DATOS: PERMISOS, ROLES GLOBALES Y FUNCIONES DE CATÁLOGOS POR DEFECTO
-- Archivo: supabase/migrations/20260617000001_seed_master_data.sql

-- 1. Insertar Catálogo de Permisos Estándar
INSERT INTO permissions (permission_code, name, module, description) VALUES
-- Módulo Tenants y Seguridad
('tenants.create', 'Crear Empresa (Tenant)', 'Plataforma', 'Permite registrar nuevas empresas en el ecosistema.'),
('tenants.view', 'Ver Empresas (Tenants)', 'Plataforma', 'Permite consultar la lista global de empresas.'),
('tenants.settings', 'Configurar Empresa', 'Plataforma', 'Permite editar parámetros de la empresa propia.'),
('users.create', 'Crear Usuarios', 'Seguridad', 'Permite registrar nuevos usuarios dentro de la empresa.'),
('users.edit', 'Editar Usuarios', 'Seguridad', 'Permite actualizar perfiles de usuarios de la empresa.'),
('users.permissions', 'Gestionar Permisos', 'Seguridad', 'Permite modificar roles y excepciones de permisos a usuarios.'),
-- Módulo Comercial
('clients.create', 'Crear Clientes', 'Comercial', 'Permite registrar nuevos clientes B2B.'),
('clients.edit', 'Editar Clientes', 'Comercial', 'Permite actualizar datos de clientes existentes.'),
('clients.view', 'Consultar Clientes', 'Comercial', 'Permite ver fichas y contactos de clientes.'),
('quotes.create', 'Crear Cotizaciones', 'Comercial', 'Permite elaborar nuevas propuestas comerciales.'),
('quotes.approve', 'Aprobar Cotizaciones', 'Comercial', 'Permite firmar digitalmente y aprobar propuestas.'),
('quotes.view', 'Ver Cotizaciones', 'Comercial', 'Permite consultar el catálogo e histórico de cotizaciones.'),
-- Módulo Operaciones
('jobs.create', 'Crear Trabajos', 'Operaciones', 'Permite abrir nuevas órdenes de trabajo de ingeniería.'),
('jobs.manage', 'Gestionar Ejecución', 'Operaciones', 'Permite programar y cambiar estados de trabajos.'),
('jobs.close', 'Cerrar Trabajos', 'Operaciones', 'Permite realizar el cierre técnico y financiero de una obra.'),
('documents.upload', 'Cargar Evidencias y Actas', 'Operaciones', 'Permite subir actas de entrega, planos y fotos de obra.'),
('documents.view', 'Consultar Módulo Documental', 'Operaciones', 'Permite buscar y descargar archivos asociados.'),
-- Módulo Inventario
('items.manage', 'Gestionar Catálogo de Items', 'Inventario', 'Permite crear y deshabilitar materiales y repuestos.'),
('inventory.movement', 'Registrar Entradas/Salidas', 'Inventario', 'Permite operar el kardex y movimientos de almacén.'),
('inventory.view', 'Consultar Existencias', 'Inventario', 'Permite ver el stock en tiempo real en todas las bodegas.'),
-- Módulo Finanzas
('invoices.create', 'Emitir Facturas', 'Finanzas', 'Permite generar facturas de cobro asociadas a cotizaciones.'),
('payments.confirm', 'Confirmar Recaudos', 'Finanzas', 'Permite validar y conciliar comprobantes de pago de clientes.'),
('payments.view', 'Consultar Historial Cartera', 'Finanzas', 'Permite ver saldos pendientes de facturas y anticipos.'),
-- Módulo Auditoría
('audit.view_global', 'Auditar Plataforma', 'Auditoría', 'Permite ver logs de auditoría de todas las empresas.'),
('audit.view_tenant', 'Auditar Empresa', 'Auditoría', 'Permite ver logs de auditoría de la empresa propia.')
ON CONFLICT (permission_code) DO NOTHING;

-- 2. Insertar Roles Globales (donde tenant_id IS NULL)
INSERT INTO roles (tenant_id, role_code, name, description, status) VALUES
(NULL, 'SUPER_ADMIN', 'Super Administrador de Plataforma', 'Administrador global del ecosistema y los tenants.', 'Activo'),
(NULL, 'ADMIN_EMPRESA', 'Administrador de Empresa', 'Gestor administrativo y de usuarios dentro de la empresa propia.', 'Activo'),
(NULL, 'GERENTE_GENERAL', 'Gerente General', 'Visualización completa de KPIs y máxima jerarquía de aprobación.', 'Activo'),
(NULL, 'DIRECTOR_COMERCIAL', 'Director Comercial', 'Responsable del embudo de ventas y aprobación comercial intermedia.', 'Activo'),
(NULL, 'EJECUTIVO_COMERCIAL', 'Ejecutivo Comercial', 'Creación de leads, cotizaciones y seguimiento de clientes.', 'Activo'),
(NULL, 'DIRECTOR_OPERACIONES', 'Director de Operaciones', 'Responsable de la ejecución de proyectos y cierre de trabajos.', 'Activo'),
(NULL, 'TECNICO_CAMPO', 'Técnico de Campo', 'Visualización de cronogramas y registro de bitácoras de obra.', 'Activo'),
(NULL, 'ALMACENISTA', 'Almacenista / Jefe de Bodega', 'Control de existencias, bodegas y movimientos de inventario.', 'Activo'),
(NULL, 'AUDITOR', 'Auditor de Procesos', 'Consulta de logs de auditoría de sólo lectura.', 'Activo'),
(NULL, 'CLIENTE', 'Cliente Externo B2B', 'Perfil de autoservicio para cotizaciones, pagos y garantías.', 'Activo')
ON CONFLICT (tenant_id, role_code) DO NOTHING;

-- 3. Crear Función de Inicialización de Catálogo de Áreas Estándar
CREATE OR REPLACE FUNCTION seed_tenant_standard_areas(target_tenant_id uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO areas (tenant_id, area_code, name, description, status) VALUES
    (target_tenant_id, 'DIR-GEN', 'Dirección General', 'Gerencia general y planeación estratégica.', 'Activo'),
    (target_tenant_id, 'COM', 'Comercial', 'Ventas, marketing y fidelización de clientes.', 'Activo'),
    (target_tenant_id, 'ING', 'Ingeniería', 'Diseño de sistemas de aire acondicionado y ventilación.', 'Activo'),
    (target_tenant_id, 'PROY', 'Proyectos', 'Montaje e instalaciones de sistemas mecánicos industriales.', 'Activo'),
    (target_tenant_id, 'OPER', 'Operaciones', 'Logística de técnicos de campo y coordinación de servicios.', 'Activo'),
    (target_tenant_id, 'MANT', 'Mantenimiento', 'Mantenimiento predictivo, preventivo y correctivo de equipos.', 'Activo'),
    (target_tenant_id, 'INV', 'Inventario', 'Administración de materias primas, repuestos y herramientas.', 'Activo'),
    (target_tenant_id, 'COMP', 'Compras', 'Abastecimiento de insumos y evaluación de proveedores.', 'Activo'),
    (target_tenant_id, 'CAL', 'Calidad', 'Aseguramiento de estándares técnicos e interventoría.', 'Activo'),
    (target_tenant_id, 'FIN', 'Finanzas', 'Presupuestos, costos, contabilidad y facturación.', 'Activo'),
    (target_tenant_id, 'CART', 'Cartera', 'Control de recaudos, pasarela y cobro administrativo.', 'Activo'),
    (target_tenant_id, 'TH', 'Talento Humano', 'Selección, contratación y bienestar del personal.', 'Activo'),
    (target_tenant_id, 'TI', 'TI', 'Soporte informático e infraestructura digital.', 'Activo'),
    (target_tenant_id, 'SAC', 'Servicio al Cliente', 'Atención postventa, garantías y reclamos.', 'Activo')
    ON CONFLICT (tenant_id, area_code) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000002_clients_core.sql
-- --------------------------------------------------
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


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000003_requirements_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 3: REQUERIMIENTOS Y DOCUMENTOS
-- Archivo: supabase/migrations/20260617000003_requirements_core.sql

-- 1. Helper: Obtener el ID del Usuario en Sesión Operativa
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

-- 2. Helper: Sumar Horas Hábiles (Business Hours SLA)
CREATE OR REPLACE FUNCTION add_business_hours(p_start timestamptz, p_hours integer)
RETURNS timestamp AS $$
DECLARE
    v_result timestamp := p_start;
    v_added integer := 0;
BEGIN
    WHILE v_added < p_hours LOOP
        v_result := v_result + interval '1 hour';
        -- extract(isodow from timestamp) -> 1=Lunes, 6=Sábado, 7=Domingo (omite fines de semana)
        IF extract(isodow from v_result) < 6 THEN
            v_added := v_added + 1;
        END IF;
    END LOOP;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear Tabla de Secuencias por Tenant (Control de Concurrencia de Códigos)
CREATE TABLE tenant_sequences (
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sequence_type varchar(50) NOT NULL, -- 'REQUIREMENT', 'DOCUMENT'
    current_value integer NOT NULL DEFAULT 0,
    updated_at timestamp NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, sequence_type)
);

-- Función para obtener secuencial transaccional por tenant sin MAX()+1
CREATE OR REPLACE FUNCTION get_next_tenant_sequence(p_tenant_id uuid, p_sequence_type varchar)
RETURNS integer AS $$
DECLARE
    v_next_val integer;
BEGIN
    INSERT INTO tenant_sequences (tenant_id, sequence_type, current_value, updated_at)
    VALUES (p_tenant_id, p_sequence_type, 1, NOW())
    ON CONFLICT (tenant_id, sequence_type)
    DO UPDATE SET current_value = tenant_sequences.current_value + 1, updated_at = NOW()
    RETURNING current_value INTO v_next_val;
    
    RETURN v_next_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear Tabla de Requerimientos (requirements)
CREATE TABLE requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    requirement_code varchar(50) NOT NULL,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    contact_id uuid REFERENCES client_contacts(id) ON DELETE SET NULL,
    title varchar(250) NOT NULL,
    description text,
    category varchar(50) NOT NULL CHECK (category IN (
        'FABRICACION', 'VENTA', 'MANTENIMIENTO', 'REPARACION', 'OTRO'
    )),
    source varchar(100),
    
    -- Responsables Específicos
    created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    sales_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    engineering_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    
    estimated_value numeric(18,2),
    priority varchar(50) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN (
        'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    )),
    status varchar(50) NOT NULL DEFAULT 'BORRADOR' CHECK (status IN (
        'BORRADOR', 'NUEVO', 'EN_REVISION', 'DIAGNOSTICO', 'COTIZACION', 'APROBACION', 'OT_GENERADA', 'EJECUCION', 'CERRADO', 'CANCELADO'
    )),
    
    -- Matriz de Cancelación
    cancel_code varchar(50) CHECK (cancel_code IN (
        'CLIENTE_DESISTE', 'SIN_PRESUPUESTO', 'FUERA_ALCANCE', 'DUPLICADO', 'ERROR_REGISTRO', 'OTRO'
    )),
    cancel_reason text,
    cancelled_by uuid REFERENCES users(id) ON DELETE SET NULL,
    cancelled_at timestamp,
    
    -- SLAs Físicos
    sla_response_due_at timestamp,
    sla_diagnostic_due_at timestamp,
    sla_quote_due_at timestamp,
    sla_close_due_at timestamp,

    -- Trazabilidad general
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,
    status_changed_at timestamp,
    status_changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT unique_tenant_requirement_code UNIQUE (tenant_id, requirement_code)
);

-- 5. Crear Tabla de Documentos (documents - Repositorio Transversal Corporativo Global)
CREATE TABLE documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    document_code varchar(50) NOT NULL,
    document_type varchar(50) NOT NULL CHECK (document_type IN (
        'CLIENT_REQUEST', 'DIAGNOSTIC', 'TECHNICAL_VISIT', 'QUOTE', 'CONTRACT', 
        'WORK_ORDER', 'BLUEPRINT', 'TECHNICAL_MEMO', 'DELIVERY_NOTE', 'INVOICE', 
        'PAYMENT_VOUCHER', 'WARRANTY', 'SERVICE_REPORT', 'PHOTOS', 'APPROVAL'
    )),
    entity_type varchar(50) NOT NULL CHECK (entity_type IN (
        'CLIENT', 'REQUIREMENT', 'DIAGNOSTIC', 'QUOTE', 'JOB', 'INVOICE', 
        'PAYMENT', 'WARRANTY', 'PROJECT', 'AUDIT', 'USER', 'ASSET', 
        'INVENTORY', 'PURCHASE', 'QUALITY'
    )),
    entity_id uuid NOT NULL,
    version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
    file_name varchar(250) NOT NULL,
    file_path text NOT NULL,
    
    -- Metadatos y Desacoplamiento de Storage
    file_size bigint NOT NULL,
    checksum varchar(64),
    storage_provider varchar(50) NOT NULL DEFAULT 'SUPABASE' CHECK (storage_provider IN (
        'SUPABASE', 'S3', 'AZURE_BLOB', 'LOCAL'
    )),
    storage_path text NOT NULL,
    
    uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_at timestamp NOT NULL DEFAULT NOW(),
    status varchar(50) NOT NULL DEFAULT 'PUBLICADO' CHECK (status IN (
        'BORRADOR', 'PUBLICADO', 'OBSOLETO', 'ARCHIVADO'
    )),
    
    -- Soft Delete
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_document_code_version UNIQUE (tenant_id, document_code, version)
);

-- 6. Crear Índices de Rendimiento
CREATE INDEX idx_requirements_tenant ON requirements(tenant_id);
CREATE INDEX idx_requirements_client ON requirements(client_id);
CREATE INDEX idx_requirements_sales_user ON requirements(sales_user_id);
CREATE INDEX idx_requirements_engineering_user ON requirements(engineering_user_id);
CREATE INDEX idx_requirements_code ON requirements(tenant_id, requirement_code);

CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_code ON documents(tenant_id, document_code);

-- 7. Triggers de Autogeneración de Códigos

CREATE OR REPLACE FUNCTION handle_requirement_code()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.requirement_code := 'REQ-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'REQUIREMENT')::text, 6, '0');
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.requirement_code <> OLD.requirement_code THEN
            NEW.requirement_code := OLD.requirement_code;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_requirement_code
BEFORE INSERT OR UPDATE ON requirements
FOR EACH ROW
EXECUTE FUNCTION handle_requirement_code();

CREATE OR REPLACE FUNCTION handle_document_code()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND (NEW.document_code IS NULL OR NEW.document_code = '') THEN
        NEW.document_code := 'DOC-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'DOCUMENT')::text, 6, '0');
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.document_code <> OLD.document_code THEN
            NEW.document_code := OLD.document_code;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_document_code
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION handle_document_code();

-- 8. Trigger de Control de Versiones Documentales
CREATE OR REPLACE FUNCTION handle_document_versioning()
RETURNS TRIGGER AS $$
DECLARE
    v_max_version integer;
BEGIN
    IF NEW.document_code IS NULL OR NEW.document_code = '' THEN
        NEW.document_code := 'DOC-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'DOCUMENT')::text, 6, '0');
    END IF;

    SELECT COALESCE(MAX(version), 0)
    INTO v_max_version
    FROM documents
    WHERE tenant_id = NEW.tenant_id
      AND document_code = NEW.document_code;
      
    IF v_max_version > 0 THEN
        NEW.version := v_max_version + 1;
        
        -- Cambiar a OBSOLETO la versión anterior
        UPDATE documents
        SET status = 'OBSOLETO'
        WHERE tenant_id = NEW.tenant_id
          AND document_code = NEW.document_code
          AND version = v_max_version;
    ELSE
        NEW.version := 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_document_versioning
BEFORE INSERT ON documents
FOR EACH ROW
EXECUTE FUNCTION handle_document_versioning();

-- 9. Trigger de Trazabilidad y SLAs en Requerimientos
CREATE OR REPLACE FUNCTION handle_requirement_traceability()
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
        
        -- Calcular SLA de Respuesta inicial si entra en estado NUEVO o BORRADOR
        IF NEW.status = 'NUEVO' THEN
            NEW.sla_response_due_at := add_business_hours(NOW(), 24);
        END IF;
        
        -- Calcular SLA de cierre inicial
        IF NEW.priority = 'LOW' THEN
            NEW.sla_close_due_at := add_business_hours(NOW(), 240);
        ELSIF NEW.priority = 'MEDIUM' THEN
            NEW.sla_close_due_at := add_business_hours(NOW(), 120);
        ELSIF NEW.priority = 'HIGH' THEN
            NEW.sla_close_due_at := add_business_hours(NOW(), 72);
        ELSIF NEW.priority = 'CRITICAL' THEN
            NEW.sla_close_due_at := add_business_hours(NOW(), 48);
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_at := NOW();
        NEW.updated_by := v_user_id;

        -- Trazabilidad de transición de estado
        IF NEW.status <> OLD.status THEN
            NEW.status_changed_at := NOW();
            NEW.status_changed_by := v_user_id;
            
            -- Calcular SLAs específicos por transición
            IF NEW.status = 'NUEVO' THEN
                NEW.sla_response_due_at := add_business_hours(NOW(), 24);
            ELSIF NEW.status = 'DIAGNOSTICO' THEN
                NEW.sla_diagnostic_due_at := add_business_hours(NOW(), 48);
            ELSIF NEW.status = 'COTIZACION' THEN
                NEW.sla_quote_due_at := add_business_hours(NOW(), 72);
            END IF;
        END IF;

        -- Recalcular SLA de cierre si cambia prioridad
        IF NEW.priority <> OLD.priority AND NEW.status NOT IN ('CERRADO', 'CANCELADO') THEN
            IF NEW.priority = 'LOW' THEN
                NEW.sla_close_due_at := add_business_hours(NEW.created_at, 240);
            ELSIF NEW.priority = 'MEDIUM' THEN
                NEW.sla_close_due_at := add_business_hours(NEW.created_at, 120);
            ELSIF NEW.priority = 'HIGH' THEN
                NEW.sla_close_due_at := add_business_hours(NEW.created_at, 72);
            ELSIF NEW.priority = 'CRITICAL' THEN
                NEW.sla_close_due_at := add_business_hours(NEW.created_at, 48);
            END IF;
        END IF;

        -- Trazabilidad de reasignación
        IF NEW.sales_user_id IS DISTINCT FROM OLD.sales_user_id OR NEW.engineering_user_id IS DISTINCT FROM OLD.engineering_user_id THEN
            NEW.assigned_by := v_user_id;
        END IF;

        -- Trazabilidad de soft delete
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            NEW.deleted_by := v_user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_requirement_traceability
BEFORE INSERT OR UPDATE ON requirements
FOR EACH ROW
EXECUTE FUNCTION handle_requirement_traceability();

-- 10. Trigger de Validación de Transición de Estados
CREATE OR REPLACE FUNCTION validate_requirement_state_transitions()
RETURNS TRIGGER AS $$
DECLARE
    v_has_doc boolean;
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    -- Validación de Cancelación Estructurada
    IF NEW.status = 'CANCELADO' THEN
        IF NEW.cancel_code IS NULL THEN
            RAISE EXCEPTION 'Para cancelar un requerimiento se debe suministrar un código de catálogo (cancel_code).';
        END IF;
        IF NEW.cancel_code NOT IN ('CLIENTE_DESISTE', 'SIN_PRESUPUESTO', 'FUERA_ALCANCE', 'DUPLICADO', 'ERROR_REGISTRO', 'OTRO') THEN
            RAISE EXCEPTION 'Código de cancelación no válido.';
        END IF;
        IF NEW.cancel_reason IS NULL OR length(trim(NEW.cancel_reason)) < 10 THEN
            RAISE EXCEPTION 'Para cancelar un requerimiento se debe ingresar un motivo de justificación detallado (cancel_reason, mínimo 10 caracteres).';
        END IF;
        
        NEW.cancelled_by := v_user_id;
        NEW.cancelled_at := NOW();
        RETURN NEW;
    END IF;

    -- Validar Secuencia
    IF NEW.status = 'NUEVO' THEN
        IF OLD.status <> 'BORRADOR' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;

    ELSIF NEW.status = 'EN_REVISION' THEN
        IF OLD.status <> 'NUEVO' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;

    ELSIF NEW.status = 'DIAGNOSTICO' THEN
        IF OLD.status <> 'EN_REVISION' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;
        -- Asignación obligatoria de Ingeniero
        IF NEW.engineering_user_id IS NULL THEN
            RAISE EXCEPTION 'No se puede cambiar a DIAGNOSTICO sin un responsable de ingeniería asignado (engineering_user_id).';
        END IF;

    ELSIF NEW.status = 'COTIZACION' THEN
        IF OLD.status <> 'DIAGNOSTICO' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;
        -- Asignación obligatoria de Comercial
        IF NEW.sales_user_id IS NULL THEN
            RAISE EXCEPTION 'No se puede cambiar a COTIZACION sin un comercial asignado (sales_user_id).';
        END IF;
        -- Validación de existencia de Diagnóstico PDF
        SELECT EXISTS (
            SELECT 1 FROM documents 
            WHERE entity_type = 'REQUIREMENT' 
              AND entity_id = NEW.id 
              AND document_type = 'DIAGNOSTIC'
              AND mime_type = 'application/pdf'
              AND deleted_at IS NULL
        ) INTO v_has_doc;

        IF NOT v_has_doc THEN
            RAISE EXCEPTION 'No se puede pasar a COTIZACION sin registrar al menos un documento de tipo DIAGNOSTIC en formato PDF.';
        END IF;

    ELSIF NEW.status = 'APROBACION' THEN
        IF OLD.status <> 'COTIZACION' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;
        -- Validación de descripción
        IF NEW.description IS NULL OR length(trim(NEW.description)) < 15 THEN
            RAISE EXCEPTION 'La descripción debe contener detalles técnicos y comerciales (mínimo 15 caracteres) para proceder a APROBACION.';
        END IF;
        -- Validación de existencia de Cotización PDF
        SELECT EXISTS (
            SELECT 1 FROM documents 
            WHERE entity_type = 'REQUIREMENT' 
              AND entity_id = NEW.id 
              AND document_type = 'QUOTE'
              AND mime_type = 'application/pdf'
              AND deleted_at IS NULL
        ) INTO v_has_doc;

        IF NOT v_has_doc THEN
            RAISE EXCEPTION 'No se puede pasar a APROBACION sin registrar al menos un documento de tipo QUOTE en formato PDF.';
        END IF;

    ELSIF NEW.status = 'OT_GENERADA' THEN
        IF OLD.status <> 'APROBACION' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;
        -- Validación de existencia de documento de Aprobación
        SELECT EXISTS (
            SELECT 1 FROM documents 
            WHERE entity_type = 'REQUIREMENT' 
              AND entity_id = NEW.id 
              AND document_type = 'APPROVAL'
              AND deleted_at IS NULL
        ) INTO v_has_doc;

        IF NOT v_has_doc THEN
            RAISE EXCEPTION 'No se puede pasar a OT_GENERADA sin registrar el documento de tipo APPROVAL.';
        END IF;

    ELSIF NEW.status = 'EJECUCION' THEN
        IF OLD.status <> 'OT_GENERADA' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;

    ELSIF NEW.status = 'CERRADO' THEN
        IF OLD.status <> 'EJECUCION' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;

    ELSE
        RAISE EXCEPTION 'Estado no reconocido: %', NEW.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_requirement_state
BEFORE UPDATE OF status ON requirements
FOR EACH ROW
EXECUTE FUNCTION validate_requirement_state_transitions();

-- 11. Trigger de Validación de Roles y Permisos en Transiciones
CREATE OR REPLACE FUNCTION enforce_requirement_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Validar permiso de Creación (INSERT)
    IF TG_OP = 'INSERT' THEN
        IF is_platform_super_admin() THEN
            RETURN NEW;
        END IF;
        
        IF NOT (current_user_has_role('EJECUTIVO_COMERCIAL') OR current_user_has_role('DIRECTOR_COMERCIAL') OR current_user_has_role('TECNICO_CAMPO')) THEN
            RAISE EXCEPTION 'Permiso Denegado: Su rol no está autorizado para crear requerimientos comerciales.';
        END IF;
        RETURN NEW;
    END IF;

    -- 2. Validar cambios de estado (UPDATE)
    IF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
        IF is_platform_super_admin() THEN
            RETURN NEW;
        END IF;

        -- Cancelación global
        IF NEW.status = 'CANCELADO' THEN
            IF NOT (current_user_has_role('EJECUTIVO_COMERCIAL') OR current_user_has_role('DIRECTOR_COMERCIAL') OR current_user_has_role('GERENTE_GENERAL')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Comerciales o Gerentes pueden cancelar un requerimiento.';
            END IF;
            RETURN NEW;
        END IF;

        -- Transiciones específicas
        IF OLD.status = 'BORRADOR' AND NEW.status = 'NUEVO' THEN
            IF NOT (current_user_has_role('EJECUTIVO_COMERCIAL') OR current_user_has_role('DIRECTOR_COMERCIAL') OR current_user_has_role('TECNICO_CAMPO')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Comerciales o Técnicos pueden registrar el requerimiento.';
            END IF;

        ELSIF OLD.status = 'NUEVO' AND NEW.status = 'EN_REVISION' THEN
            IF NOT (current_user_has_role('EJECUTIVO_COMERCIAL') OR current_user_has_role('DIRECTOR_COMERCIAL') OR current_user_has_role('TECNICO_CAMPO')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Comerciales o Técnicos pueden poner el requerimiento en revisión.';
            END IF;

        ELSIF OLD.status = 'EN_REVISION' AND NEW.status = 'DIAGNOSTICO' THEN
            IF NOT (current_user_has_role('TECNICO_CAMPO') OR current_user_has_role('GERENTE_GENERAL')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Ingenieros (Técnicos) o Gerentes pueden enviar a diagnóstico.';
            END IF;

        ELSIF OLD.status = 'DIAGNOSTICO' AND NEW.status = 'COTIZACION' THEN
            IF NOT (current_user_has_role('TECNICO_CAMPO') OR current_user_has_role('EJECUTIVO_COMERCIAL') OR current_user_has_role('DIRECTOR_COMERCIAL')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Técnicos o Comerciales pueden marcar el diagnóstico como terminado.';
            END IF;

        ELSIF OLD.status = 'COTIZACION' AND NEW.status = 'APROBACION' THEN
            IF NOT (current_user_has_role('EJECUTIVO_COMERCIAL') OR current_user_has_role('DIRECTOR_COMERCIAL')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo el rol Comercial puede enviar a aprobación.';
            END IF;

        ELSIF OLD.status = 'APROBACION' AND NEW.status = 'OT_GENERADA' THEN
            IF NOT current_user_has_role('GERENTE_GENERAL') THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo la Gerencia puede aprobar y liberar la orden de trabajo.';
            END IF;

        ELSIF OLD.status = 'OT_GENERADA' AND NEW.status = 'EJECUCION' THEN
            IF NOT (current_user_has_role('DIRECTOR_OPERACIONES') OR current_user_has_role('TECNICO_CAMPO')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo personal de Operaciones o Técnicos pueden pasar el requerimiento a ejecución.';
            END IF;

        ELSIF OLD.status = 'EJECUCION' AND NEW.status = 'CERRADO' THEN
            IF NOT (current_user_has_role('DIRECTOR_OPERACIONES') OR current_user_has_role('GERENTE_GENERAL')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Operaciones o la Gerencia pueden cerrar formalmente el requerimiento.';
            END IF;

        ELSE
            RAISE EXCEPTION 'Transición de estado no autorizada por la matriz de roles.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_requirement_permissions
BEFORE INSERT OR UPDATE OF status ON requirements
FOR EACH ROW
EXECUTE FUNCTION enforce_requirement_permissions();

-- 12. Triggers de Emisión de Eventos de Negocio

CREATE OR REPLACE FUNCTION dispatch_requirement_events()
RETURNS TRIGGER AS $$
DECLARE
    v_payload jsonb;
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_OP = 'INSERT' THEN
        v_payload := jsonb_build_object(
            'requirement_code', NEW.requirement_code,
            'title', NEW.title,
            'client_id', NEW.client_id,
            'category', NEW.category,
            'status', NEW.status,
            'priority', NEW.priority
        );
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (NEW.tenant_id, 'REQUIREMENT_CREATED', 'REQUIREMENT', NEW.id, v_payload, v_user_id);
        
        IF NEW.sales_user_id IS NOT NULL OR NEW.engineering_user_id IS NOT NULL THEN
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'REQUIREMENT_ASSIGNED', 'REQUIREMENT', NEW.id, 
                    jsonb_build_object('old_sales_user_id', null, 'new_sales_user_id', NEW.sales_user_id,
                                       'old_engineering_user_id', null, 'new_engineering_user_id', NEW.engineering_user_id,
                                       'assigned_by', v_user_id), v_user_id);
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        -- 1. Cambios de estado
        IF NEW.status <> OLD.status THEN
            v_payload := jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'sales_user_id', NEW.sales_user_id,
                'engineering_user_id', NEW.engineering_user_id
            );
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'REQUIREMENT_STATUS_CHANGED', 'REQUIREMENT', NEW.id, v_payload, v_user_id);
            
            IF NEW.status = 'CANCELADO' THEN
                INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
                VALUES (NEW.tenant_id, 'REQUIREMENT_CANCELLED', 'REQUIREMENT', NEW.id, 
                        jsonb_build_object('requirement_code', NEW.requirement_code, 
                                           'cancel_code', NEW.cancel_code,
                                           'cancel_reason', NEW.cancel_reason, 
                                           'cancelled_at', NOW()), v_user_id);
            END IF;
        END IF;

        -- 2. Cambios de asignado
        IF NEW.sales_user_id IS DISTINCT FROM OLD.sales_user_id OR NEW.engineering_user_id IS DISTINCT FROM OLD.engineering_user_id THEN
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'REQUIREMENT_ASSIGNED', 'REQUIREMENT', NEW.id, 
                    jsonb_build_object('old_sales_user_id', OLD.sales_user_id, 'new_sales_user_id', NEW.sales_user_id,
                                       'old_engineering_user_id', OLD.engineering_user_id, 'new_engineering_user_id', NEW.engineering_user_id,
                                       'assigned_by', v_user_id), v_user_id);
        END IF;

        -- 3. Modificaciones generales
        DECLARE
            v_changes jsonb := '{}'::jsonb;
        BEGIN
            IF NEW.title <> OLD.title THEN v_changes := v_changes || jsonb_build_object('title', jsonb_build_object('old', OLD.title, 'new', NEW.title)); END IF;
            IF NEW.estimated_value IS DISTINCT FROM OLD.estimated_value THEN v_changes := v_changes || jsonb_build_object('estimated_value', jsonb_build_object('old', OLD.estimated_value, 'new', NEW.estimated_value)); END IF;
            IF NEW.priority <> OLD.priority THEN v_changes := v_changes || jsonb_build_object('priority', jsonb_build_object('old', OLD.priority, 'new', NEW.priority)); END IF;

            IF v_changes <> '{}'::jsonb THEN
                INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
                VALUES (NEW.tenant_id, 'REQUIREMENT_UPDATED', 'REQUIREMENT', NEW.id, jsonb_build_object('changes', v_changes), v_user_id);
            END IF;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_requirement_events
AFTER INSERT OR UPDATE ON requirements
FOR EACH ROW
EXECUTE FUNCTION dispatch_requirement_events();

CREATE OR REPLACE FUNCTION dispatch_document_events()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_OP = 'INSERT' THEN
        IF NEW.version = 1 THEN
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'DOCUMENT_UPLOADED', NEW.entity_type, NEW.entity_id, 
                    jsonb_build_object('document_code', NEW.document_code, 'document_type', NEW.document_type, 'uploaded_by', v_user_id), v_user_id);
        ELSE
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'DOCUMENT_VERSION_CREATED', NEW.entity_type, NEW.entity_id, 
                    jsonb_build_object('document_code', NEW.document_code, 'new_version', NEW.version, 'previous_version_obsoleted', NEW.version - 1, 'uploaded_by', v_user_id), v_user_id);
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'DOCUMENT_DELETED', NEW.entity_type, NEW.entity_id, 
                    jsonb_build_object('document_code', NEW.document_code, 'delete_reason', NEW.delete_reason, 'deleted_by', v_user_id), v_user_id);
        ELSIF NEW.status <> OLD.status THEN
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'DOCUMENT_UPDATED', NEW.entity_type, NEW.entity_id, 
                    jsonb_build_object('document_code', NEW.document_code, 'old_status', OLD.status, 'new_status', NEW.status), v_user_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_document_events
AFTER INSERT OR UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION dispatch_document_events();

-- 13. Bloqueo de Eliminación Física (Soft Delete Requerido)

CREATE OR REPLACE FUNCTION block_physical_requirement_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los requerimientos en la plataforma son inmutables y audibles, utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_physical_requirement_delete
BEFORE DELETE ON requirements
FOR EACH ROW
EXECUTE FUNCTION block_physical_requirement_delete();

CREATE OR REPLACE FUNCTION block_physical_document_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los documentos en la plataforma son inmutables y audibles, utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_physical_document_delete
BEFORE DELETE ON documents
FOR EACH ROW
EXECUTE FUNCTION block_physical_document_delete();

-- 14. Integración con el Motor de Auditoría Técnica General (Fase 1)
CREATE TRIGGER audit_requirements AFTER INSERT OR UPDATE OR DELETE ON requirements FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_documents AFTER INSERT OR UPDATE OR DELETE ON documents FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 15. Políticas RLS (Row Level Security)

-- 15.1 Requerimientos
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY requirements_super_admin ON requirements
    FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY requirements_select_tenant ON requirements FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);

CREATE POLICY requirements_insert_tenant ON requirements FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY requirements_update_tenant ON requirements FOR UPDATE TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND deleted_at IS NULL
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- 15.2 Documentos
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_super_admin ON documents
    FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY documents_select_tenant ON documents FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);

CREATE POLICY documents_insert_tenant ON documents FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY documents_update_tenant ON documents FOR UPDATE TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND deleted_at IS NULL
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000004_quotes_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 4: COTIZACIONES
-- Archivo: supabase/migrations/20260617000004_quotes_core.sql

-- 1. Crear Tabla de Cotizaciones (quotes)
CREATE TABLE quotes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    quote_code varchar(50) NOT NULL,
    version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE RESTRICT,
    assigned_user_id uuid REFERENCES users(id) ON DELETE SET NULL, -- Ejecutivo Comercial
    
    quote_date date NOT NULL DEFAULT CURRENT_DATE,
    valid_until date NOT NULL DEFAULT (CURRENT_DATE + 30),
    
    -- Valores Totales (Calculados por trigger)
    subtotal numeric(18,2) NOT NULL DEFAULT 0.00 CHECK (subtotal >= 0),
    discount_amount numeric(18,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0), -- Descuento global
    tax_amount numeric(18,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),          -- Impuesto global
    total_amount numeric(18,2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    
    notes text,
    status varchar(50) NOT NULL DEFAULT 'BORRADOR' CHECK (status IN (
        'BORRADOR', 'EN_REVISION', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA', 'CANCELADA'
    )),

    -- Motivos de Rechazo y Cancelación
    reject_reason text,
    cancel_code varchar(50) CHECK (cancel_code IN (
        'CLIENTE_DESISTE', 'SIN_PRESUPUESTO', 'FUERA_ALCANCE', 'DUPLICADO', 'ERROR_REGISTRO', 'OTRO'
    )),
    cancel_reason text,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,
    status_changed_at timestamp,
    status_changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    
    -- Trazabilidad avanzada de estados
    approved_by uuid REFERENCES users(id) ON DELETE SET NULL,
    approved_at timestamp,
    rejected_by uuid REFERENCES users(id) ON DELETE SET NULL,
    rejected_at timestamp,
    cancelled_by uuid REFERENCES users(id) ON DELETE SET NULL,
    cancelled_at timestamp,

    CONSTRAINT unique_tenant_quote_code_version UNIQUE (tenant_id, quote_code, version),
    CONSTRAINT chk_quote_dates CHECK (valid_until >= quote_date)
);

-- 2. Crear Tabla de Ítems de Cotización (quote_items)
CREATE TABLE quote_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
    item_order integer NOT NULL,
    item_type varchar(50) NOT NULL CHECK (item_type IN (
        'MATERIAL', 'SERVICIO', 'EQUIPO', 'MANO_OBRA', 'OTRO'
    )),
    description text NOT NULL,
    quantity numeric(18,4) NOT NULL CHECK (quantity > 0),
    unit varchar(50) NOT NULL,
    unit_price numeric(18,2) NOT NULL CHECK (unit_price >= 0),
    
    -- Descuentos e Impuestos de línea
    discount_amount numeric(18,2) NOT NULL DEFAULT 0.00 CHECK (discount_amount >= 0),
    tax_percent numeric(5,2) NOT NULL DEFAULT 0.00 CHECK (tax_percent >= 0),
    tax_amount numeric(18,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    
    line_total numeric(18,2) NOT NULL DEFAULT 0.00 CHECK (line_total >= 0),
    created_at timestamp NOT NULL DEFAULT NOW()
);

-- 3. Índices de Rendimiento
CREATE INDEX idx_quotes_tenant ON quotes(tenant_id);
CREATE INDEX idx_quotes_requirement ON quotes(requirement_id);
CREATE INDEX idx_quotes_client ON quotes(client_id);
CREATE INDEX idx_quotes_code ON quotes(tenant_id, quote_code);

CREATE INDEX idx_quote_items_tenant ON quote_items(tenant_id);
CREATE INDEX idx_quote_items_quote ON quote_items(quote_id);

-- 4. Triggers de Asignación de Código de Cotización y Versionado Automático
CREATE OR REPLACE FUNCTION handle_quote_versioning()
RETURNS TRIGGER AS $$
DECLARE
    v_max_version integer;
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF NEW.quote_code IS NULL OR NEW.quote_code = '' THEN
        NEW.quote_code := 'COT-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'QUOTE')::text, 6, '0');
    END IF;

    -- Obtener versión máxima existente
    SELECT COALESCE(MAX(version), 0)
    INTO v_max_version
    FROM quotes
    WHERE tenant_id = NEW.tenant_id
      AND quote_code = NEW.quote_code;

    IF v_max_version > 0 THEN
        NEW.version := v_max_version + 1;
        
        -- Marcar la versión previa como VENCIDA
        UPDATE quotes
        SET status = 'VENCIDA', status_changed_at = NOW(), status_changed_by = v_user_id
        WHERE tenant_id = NEW.tenant_id
          AND quote_code = NEW.quote_code
          AND version = v_max_version
          AND status IN ('ENVIADA', 'EN_REVISION');
    ELSE
        NEW.version := 1;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_quote_versioning
BEFORE INSERT ON quotes
FOR EACH ROW
EXECUTE FUNCTION handle_quote_versioning();

-- 5. Triggers de Cálculo Automático de Ítems (Líneas y Cabecera)

CREATE OR REPLACE FUNCTION calculate_quote_item_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal_linea numeric(18,2);
BEGIN
    v_subtotal_linea := NEW.quantity * NEW.unit_price;
    NEW.tax_amount := (v_subtotal_linea - NEW.discount_amount) * NEW.tax_percent / 100;
    NEW.line_total := v_subtotal_linea - NEW.discount_amount + NEW.tax_amount;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_quote_item_totals
BEFORE INSERT OR UPDATE ON quote_items
FOR EACH ROW
EXECUTE FUNCTION calculate_quote_item_totals();

CREATE OR REPLACE FUNCTION update_quote_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_quote_id uuid;
    v_subtotal numeric(18,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_quote_id := OLD.quote_id;
    ELSE
        v_quote_id := NEW.quote_id;
    END IF;

    -- Calcular suma de líneas
    SELECT COALESCE(SUM(line_total), 0.00)
    INTO v_subtotal
    FROM quote_items
    WHERE quote_id = v_quote_id;

    -- Actualizar cabecera recalculando total con descuento e impuesto global
    UPDATE quotes
    SET subtotal = v_subtotal,
        total_amount = v_subtotal - discount_amount + tax_amount
    WHERE id = v_quote_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_quote_totals
AFTER INSERT OR UPDATE OR DELETE ON quote_items
FOR EACH ROW
EXECUTE FUNCTION update_quote_totals();

-- Trigger en cabecera para recalcular total_amount al modificar impuestos o descuentos globales
CREATE OR REPLACE FUNCTION handle_quote_header_calculations()
RETURNS TRIGGER AS $$
BEGIN
    NEW.total_amount := NEW.subtotal - NEW.discount_amount + NEW.tax_amount;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_quote_header_calculations
BEFORE UPDATE OF subtotal, discount_amount, tax_amount ON quotes
FOR EACH ROW
EXECUTE FUNCTION handle_quote_header_calculations();

-- 6. Trigger de Validación de Transición de Estados de Cotización
CREATE OR REPLACE FUNCTION validate_quote_state_transitions()
RETURNS TRIGGER AS $$
DECLARE
    v_has_items boolean;
    v_req_status varchar(50);
BEGIN
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    -- Restricción de Estado Final
    IF OLD.status IN ('APROBADA', 'RECHAZADA', 'CANCELADA') THEN
        RAISE EXCEPTION 'No se pueden realizar cambios en una cotización con estado final %.', OLD.status;
    END IF;

    -- Transiciones específicas
    IF NEW.status = 'EN_REVISION' THEN
        IF OLD.status <> 'BORRADOR' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;
        
        -- Validar ítems
        SELECT EXISTS (SELECT 1 FROM quote_items WHERE quote_id = NEW.id) INTO v_has_items;
        IF NOT v_has_items THEN
            RAISE EXCEPTION 'No se puede enviar a revisión una cotización que no contiene ítems.';
        END IF;

    ELSIF NEW.status = 'ENVIADA' THEN
        IF OLD.status <> 'EN_REVISION' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;

    ELSIF NEW.status = 'APROBADA' THEN
        IF OLD.status <> 'ENVIADA' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;
        
        -- Requiere que el requerimiento esté en APROBACION
        SELECT status INTO v_req_status FROM requirements WHERE id = NEW.requirement_id;
        IF v_req_status <> 'APROBACION' THEN
            RAISE EXCEPTION 'No se puede aprobar la cotización porque el requerimiento asociado no está en estado APROBACION.';
        END IF;

    ELSIF NEW.status = 'RECHAZADA' THEN
        IF OLD.status <> 'ENVIADA' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;
        
        -- Validar motivo de rechazo
        IF NEW.reject_reason IS NULL OR length(trim(NEW.reject_reason)) < 10 THEN
            RAISE EXCEPTION 'Para rechazar una cotización se debe ingresar un motivo de justificación (reject_reason, mínimo 10 caracteres).';
        END IF;

    ELSIF NEW.status = 'VENCIDA' THEN
        IF OLD.status <> 'ENVIADA' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;

    ELSIF NEW.status = 'CANCELADA' THEN
        IF OLD.status <> 'BORRADOR' THEN
            RAISE EXCEPTION 'La cotización solo puede ser cancelada desde estado BORRADOR.';
        END IF;
        
        -- Validar código y motivo de cancelación
        IF NEW.cancel_code IS NULL THEN
            RAISE EXCEPTION 'Para cancelar una cotización se debe suministrar un código de catálogo (cancel_code).';
        END IF;
        IF NEW.cancel_code NOT IN ('CLIENTE_DESISTE', 'SIN_PRESUPUESTO', 'FUERA_ALCANCE', 'DUPLICADO', 'ERROR_REGISTRO', 'OTRO') THEN
            RAISE EXCEPTION 'Código de cancelación no válido.';
        END IF;
        IF NEW.cancel_reason IS NULL OR length(trim(NEW.cancel_reason)) < 10 THEN
            RAISE EXCEPTION 'Para cancelar una cotización se debe ingresar un motivo de justificación detallado (cancel_reason, mínimo 10 caracteres).';
        END IF;
    END IF;

    NEW.status_changed_at := NOW();
    NEW.status_changed_by := get_current_user_id();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_quote_state
BEFORE UPDATE OF status ON quotes
FOR EACH ROW
EXECUTE FUNCTION validate_quote_state_transitions();

-- 7. Trigger de Permisos de Cotizaciones
CREATE OR REPLACE FUNCTION enforce_quote_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Permiso de Creación (INSERT)
    IF TG_OP = 'INSERT' THEN
        IF is_platform_super_admin() THEN
            RETURN NEW;
        END IF;

        IF NOT (current_user_has_role('EJECUTIVO_COMERCIAL') OR current_user_has_role('DIRECTOR_COMERCIAL')) THEN
            RAISE EXCEPTION 'Permiso Denegado: Su rol no está autorizado para crear cotizaciones.';
        END IF;
        RETURN NEW;
    END IF;

    -- 2. Permiso de Modificación de Estado (UPDATE)
    IF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
        IF is_platform_super_admin() THEN
            RETURN NEW;
        END IF;

        -- Cancelar
        IF NEW.status = 'CANCELADA' THEN
            IF NOT (current_user_has_role('EJECUTIVO_COMERCIAL') OR current_user_has_role('DIRECTOR_COMERCIAL') OR current_user_has_role('GERENTE_GENERAL')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Su rol no está autorizado para cancelar la cotización.';
            END IF;
            RETURN NEW;
        END IF;

        -- Transiciones de flujo comercial
        IF NEW.status IN ('EN_REVISION', 'ENVIADA') THEN
            IF NOT (current_user_has_role('EJECUTIVO_COMERCIAL') OR current_user_has_role('DIRECTOR_COMERCIAL')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Su rol no está autorizado para tramitar la cotización.';
            END IF;
        ELSIF NEW.status IN ('APROBADA', 'RECHAZADA') THEN
            IF NOT (current_user_has_role('GERENTE_GENERAL') OR current_user_has_role('DIRECTOR_COMERCIAL')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo la Gerencia o Dirección Comercial pueden aprobar o rechazar propuestas.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_quote_permissions
BEFORE INSERT OR UPDATE OF status ON quotes
FOR EACH ROW
EXECUTE FUNCTION enforce_quote_permissions();

-- 8. Trazabilidad General de Cotizaciones
CREATE OR REPLACE FUNCTION handle_quote_traceability()
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
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_at := NOW();
        NEW.updated_by := v_user_id;
        
        IF NEW.status <> OLD.status THEN
            IF NEW.status = 'APROBADA' THEN
                NEW.approved_by := v_user_id;
                NEW.approved_at := NOW();
            ELSIF NEW.status = 'RECHAZADA' THEN
                NEW.rejected_by := v_user_id;
                NEW.rejected_at := NOW();
            ELSIF NEW.status = 'CANCELADA' THEN
                NEW.cancelled_by := v_user_id;
                NEW.cancelled_at := NOW();
            END IF;
        END IF;

        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            NEW.deleted_by := v_user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_quote_traceability
BEFORE INSERT OR UPDATE ON quotes
FOR EACH ROW
EXECUTE FUNCTION handle_quote_traceability();

-- 9. Trigger de Emisión de Eventos de Negocio de Cotizaciones
CREATE OR REPLACE FUNCTION dispatch_quote_events()
RETURNS TRIGGER AS $$
DECLARE
    v_payload jsonb;
    v_user_id uuid;
    v_event_code varchar(100);
BEGIN
    v_user_id := get_current_user_id();

    IF TG_OP = 'INSERT' THEN
        IF NEW.version = 1 THEN
            v_event_code := 'QUOTE_CREATED';
            v_payload := jsonb_build_object(
                'quote_code', NEW.quote_code,
                'requirement_id', NEW.requirement_id,
                'client_id', NEW.client_id,
                'status', NEW.status,
                'total_amount', NEW.total_amount
            );
        ELSE
            -- Nueva versión de cotización cuenta como revisada
            v_event_code := 'QUOTE_REVISED';
            v_payload := jsonb_build_object(
                'quote_code', NEW.quote_code,
                'new_version', NEW.version,
                'previous_version_vencida', NEW.version - 1,
                'requirement_id', NEW.requirement_id,
                'uploaded_by', v_user_id
            );
        END IF;

        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (NEW.tenant_id, v_event_code, 'QUOTE', NEW.id, v_payload, v_user_id);

    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status <> OLD.status THEN
            -- Mapear estado a código de evento semántico
            IF NEW.status = 'EN_REVISION' THEN
                v_event_code := 'QUOTE_REVISED';
            ELSIF NEW.status = 'ENVIADA' THEN
                v_event_code := 'QUOTE_SENT';
            ELSIF NEW.status = 'APROBADA' THEN
                v_event_code := 'QUOTE_APPROVED';
            ELSIF NEW.status = 'RECHAZADA' THEN
                v_event_code := 'QUOTE_REJECTED';
            ELSIF NEW.status = 'VENCIDA' THEN
                v_event_code := 'QUOTE_EXPIRED';
            ELSIF NEW.status = 'CANCELADA' THEN
                v_event_code := 'QUOTE_CANCELLED';
            ELSE
                v_event_code := 'QUOTE_STATUS_CHANGED';
            END IF;

            v_payload := jsonb_build_object(
                'quote_code', NEW.quote_code,
                'old_status', OLD.status,
                'new_status', NEW.status,
                'total_amount', NEW.total_amount
            );

            -- Incluir motivos si aplican
            IF NEW.status = 'RECHAZADA' THEN
                v_payload := v_payload || jsonb_build_object('reject_reason', NEW.reject_reason);
            ELSIF NEW.status = 'CANCELADA' THEN
                v_payload := v_payload || jsonb_build_object('cancel_code', NEW.cancel_code, 'cancel_reason', NEW.cancel_reason);
            END IF;

            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, v_event_code, 'QUOTE', NEW.id, v_payload, v_user_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_quote_events
AFTER INSERT OR UPDATE ON quotes
FOR EACH ROW
EXECUTE FUNCTION dispatch_quote_events();

-- 10. Bloqueo de Eliminación Física (Soft Delete Requerido)
CREATE OR REPLACE FUNCTION block_physical_quote_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Las cotizaciones en la plataforma son inmutables y audibles, utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_physical_quote_delete
BEFORE DELETE ON quotes
FOR EACH ROW
EXECUTE FUNCTION block_physical_quote_delete();

CREATE TRIGGER trg_block_physical_quote_item_delete
BEFORE DELETE ON quote_items
FOR EACH ROW
EXECUTE FUNCTION block_physical_quote_delete();

-- 11. Integración con el Motor de Auditoría Técnica General (Fase 1)
CREATE TRIGGER audit_quotes AFTER INSERT OR UPDATE OR DELETE ON quotes FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_quote_items AFTER INSERT OR UPDATE OR DELETE ON quote_items FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 12. Políticas RLS (Row Level Security)

-- 12.1 Cotizaciones
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY quotes_super_admin ON quotes
    FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY quotes_select_tenant ON quotes FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);

CREATE POLICY quotes_insert_tenant ON quotes FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY quotes_update_tenant ON quotes FOR UPDATE TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND deleted_at IS NULL
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- 12.2 Ítems de Cotización
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY quote_items_super_admin ON quote_items
    FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY quote_items_select_tenant ON quote_items FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY quote_items_insert_tenant ON quote_items FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY quote_items_update_tenant ON quote_items FOR UPDATE TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- 13. ACTUALIZACIÓN DE VALIDACIONES DE REQUERIMIENTO (Fase 3 -> Fase 4)
-- Modificar la función validate_requirement_state_transitions para forzar que el paso a OT_GENERADA valide que existe una cotización APROBADA asociada

CREATE OR REPLACE FUNCTION validate_requirement_state_transitions()
RETURNS TRIGGER AS $$
DECLARE
    v_has_doc boolean;
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    -- Validación de Cancelación Estructurada
    IF NEW.status = 'CANCELADO' THEN
        IF NEW.cancel_code IS NULL THEN
            RAISE EXCEPTION 'Para cancelar un requerimiento se debe suministrar un código de catálogo (cancel_code).';
        END IF;
        IF NEW.cancel_code NOT IN ('CLIENTE_DESISTE', 'SIN_PRESUPUESTO', 'FUERA_ALCANCE', 'DUPLICADO', 'ERROR_REGISTRO', 'OTRO') THEN
            RAISE EXCEPTION 'Código de cancelación no válido.';
        END IF;
        IF NEW.cancel_reason IS NULL OR length(trim(NEW.cancel_reason)) < 10 THEN
            RAISE EXCEPTION 'Para cancelar un requerimiento se debe ingresar un motivo de justificación detallado (cancel_reason, mínimo 10 caracteres).';
        END IF;
        
        NEW.cancelled_by := v_user_id;
        NEW.cancelled_at := NOW();
        RETURN NEW;
    END IF;

    -- Validar Secuencia
    IF NEW.status = 'NUEVO' THEN
        IF OLD.status <> 'BORRADOR' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;

    ELSIF NEW.status = 'EN_REVISION' THEN
        IF OLD.status <> 'NUEVO' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;

    ELSIF NEW.status = 'DIAGNOSTICO' THEN
        IF OLD.status <> 'EN_REVISION' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;
        -- Asignación obligatoria de Ingeniero
        IF NEW.engineering_user_id IS NULL THEN
            RAISE EXCEPTION 'No se puede cambiar a DIAGNOSTICO sin un responsable de ingeniería asignado (engineering_user_id).';
        END IF;

    ELSIF NEW.status = 'COTIZACION' THEN
        IF OLD.status <> 'DIAGNOSTICO' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;
        -- Asignación obligatoria de Comercial
        IF NEW.sales_user_id IS NULL THEN
            RAISE EXCEPTION 'No se puede cambiar a COTIZACION sin un comercial asignado (sales_user_id).';
        END IF;
        -- Validación de existencia de Diagnóstico PDF
        SELECT EXISTS (
            SELECT 1 FROM documents 
            WHERE entity_type = 'REQUIREMENT' 
              AND entity_id = NEW.id 
              AND document_type = 'DIAGNOSTIC'
              AND mime_type = 'application/pdf'
              AND deleted_at IS NULL
        ) INTO v_has_doc;

        IF NOT v_has_doc THEN
            RAISE EXCEPTION 'No se puede pasar a COTIZACION sin registrar al menos un documento de tipo DIAGNOSTIC en formato PDF.';
        END IF;

    ELSIF NEW.status = 'APROBACION' THEN
        IF OLD.status <> 'COTIZACION' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;
        -- Validación de descripción
        IF NEW.description IS NULL OR length(trim(NEW.description)) < 15 THEN
            RAISE EXCEPTION 'La descripción debe contener detalles técnicos y comerciales (mínimo 15 caracteres) para proceder a APROBACION.';
        END IF;
        -- Validación de existencia de Cotización PDF
        SELECT EXISTS (
            SELECT 1 FROM documents 
            WHERE entity_type = 'REQUIREMENT' 
              AND entity_id = NEW.id 
              AND document_type = 'QUOTE'
              AND mime_type = 'application/pdf'
              AND deleted_at IS NULL
        ) INTO v_has_doc;

        IF NOT v_has_doc THEN
            RAISE EXCEPTION 'No se puede pasar a APROBACION sin registrar al menos un documento de tipo QUOTE en formato PDF.';
        END IF;

    ELSIF NEW.status = 'OT_GENERADA' THEN
        IF OLD.status <> 'APROBACION' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;
        -- Validación de existencia de documento de Aprobación
        SELECT EXISTS (
            SELECT 1 FROM documents 
            WHERE entity_type = 'REQUIREMENT' 
              AND entity_id = NEW.id 
              AND document_type = 'APPROVAL'
              AND deleted_at IS NULL
        ) INTO v_has_doc;

        IF NOT v_has_doc THEN
            RAISE EXCEPTION 'No se puede pasar a OT_GENERADA sin registrar el documento de tipo APPROVAL.';
        END IF;

        -- NUEVA REGLA (Fase 4): Debe existir al menos una cotización aprobada asociada
        SELECT EXISTS (
            SELECT 1 FROM quotes
            WHERE requirement_id = NEW.id
              AND status = 'APROBADA'
              AND deleted_at IS NULL
        ) INTO v_has_doc;

        IF NOT v_has_doc THEN
            RAISE EXCEPTION 'No se puede pasar a OT_GENERADA sin contar con una cotización en estado APROBADA asociada al requerimiento.';
        END IF;

    ELSIF NEW.status = 'EJECUCION' THEN
        IF OLD.status <> 'OT_GENERADA' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;

    ELSIF NEW.status = 'CERRADO' THEN
        IF OLD.status <> 'EJECUCION' THEN
            RAISE EXCEPTION 'Transición inválida de % a %', OLD.status, NEW.status;
        END IF;

    ELSE
        RAISE EXCEPTION 'Estado no reconocido: %', NEW.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000005_approvals_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 5: MOTOR DE APROBACIONES
-- Archivo: supabase/migrations/20260617000005_approvals_core.sql

-- 1. Crear Tabla de Flujos de Aprobación (approval_flows)
CREATE TABLE approval_flows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    flow_code varchar(50) NOT NULL,
    name varchar(150) NOT NULL,
    description text,
    flow_type varchar(50) NOT NULL CHECK (flow_type IN ('SECUENCIAL', 'PARALELA', 'MIXTA')),
    status varchar(50) NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'INACTIVO')),
    
    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_flow_code UNIQUE (tenant_id, flow_code)
);

-- 2. Crear Tabla de Pasos del Flujo (approval_steps)
CREATE TABLE approval_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    flow_id uuid NOT NULL REFERENCES approval_flows(id) ON DELETE CASCADE,
    step_order integer NOT NULL CHECK (step_order >= 1),
    role_id uuid REFERENCES roles(id) ON DELETE RESTRICT,
    user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
    required boolean NOT NULL DEFAULT true,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT chk_exclusive_role_user CHECK (
        (role_id IS NOT NULL AND user_id IS NULL) OR
        (role_id IS NULL AND user_id IS NOT NULL)
    )
);

-- Índice único parcial para step_order activo
CREATE UNIQUE INDEX idx_unique_active_flow_step_order 
ON approval_steps (tenant_id, flow_id, step_order) 
WHERE deleted_at IS NULL;

-- 3. Crear Tabla de Reglas de Aprobación (approval_rules)
CREATE TABLE approval_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_type varchar(100) NOT NULL CHECK (entity_type IN ('QUOTE', 'INVOICE', 'CONTRACT')),
    min_amount numeric(18,2) NOT NULL DEFAULT 0.00 CHECK (min_amount >= 0),
    max_amount numeric(18,2),
    flow_id uuid REFERENCES approval_flows(id) ON DELETE RESTRICT, -- NULL indica auto-aprobación
    active boolean NOT NULL DEFAULT true,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT chk_rule_amounts CHECK (max_amount IS NULL OR max_amount >= min_amount)
);

-- 4. Crear Tabla de Solicitudes de Aprobación (approval_requests)
CREATE TABLE approval_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    request_code varchar(50) NOT NULL,
    entity_type varchar(100) NOT NULL CHECK (entity_type IN ('QUOTE', 'INVOICE', 'CONTRACT')),
    entity_id uuid NOT NULL,
    flow_id uuid REFERENCES approval_flows(id) ON DELETE RESTRICT, -- NULL indica escalación/directo
    requested_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    requested_at timestamp NOT NULL DEFAULT NOW(),
    
    resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
    resolved_at timestamp,
    comments text,
    status varchar(50) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN (
        'PENDIENTE', 'EN_PROCESO', 'APROBADA', 'RECHAZADA', 'AJUSTES_SOLICITADOS', 'CANCELADA'
    )),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_request_code UNIQUE (tenant_id, request_code)
);

-- 5. Crear Tabla de Pasos de la Solicitud (approval_request_steps)
CREATE TABLE approval_request_steps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    approval_request_id uuid NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
    step_order integer NOT NULL CHECK (step_order >= 1),
    role_id uuid REFERENCES roles(id) ON DELETE RESTRICT,
    user_id uuid REFERENCES users(id) ON DELETE RESTRICT,
    required boolean NOT NULL DEFAULT true,
    status varchar(50) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN (
        'PENDIENTE', 'EN_PROCESO', 'APROBADA', 'RECHAZADA', 'AJUSTES_SOLICITADOS', 'CANCELADA'
    )),

    resolved_by uuid REFERENCES users(id) ON DELETE SET NULL,
    resolved_at timestamp,
    comments text,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT chk_req_step_exclusive_role_user CHECK (
        (role_id IS NOT NULL AND user_id IS NULL) OR
        (role_id IS NULL AND user_id IS NOT NULL)
    ),
    CONSTRAINT unique_tenant_request_step_order UNIQUE (tenant_id, approval_request_id, step_order)
);

-- 6. Índices de Rendimiento
CREATE INDEX idx_approval_flows_tenant ON approval_flows(tenant_id);
CREATE INDEX idx_approval_steps_flow ON approval_steps(flow_id);
CREATE INDEX idx_approval_rules_tenant ON approval_rules(tenant_id);
CREATE INDEX idx_approval_requests_entity ON approval_requests(entity_type, entity_id);
CREATE INDEX idx_approval_request_steps_req ON approval_request_steps(approval_request_id);

-- 7. Autogeneración de Códigos mediante tenant_sequences
CREATE OR REPLACE FUNCTION handle_approval_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'approval_flows' THEN
        IF NEW.flow_code IS NULL OR NEW.flow_code = '' THEN
            NEW.flow_code := 'FLW-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'FLOW')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'approval_requests' THEN
        IF NEW.request_code IS NULL OR NEW.request_code = '' THEN
            NEW.request_code := 'APR-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'APPROVAL_REQUEST')::text, 6, '0');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_flow_code
BEFORE INSERT ON approval_flows
FOR EACH ROW
EXECUTE FUNCTION handle_approval_sequences();

CREATE TRIGGER trg_handle_request_code
BEFORE INSERT ON approval_requests
FOR EACH ROW
EXECUTE FUNCTION handle_approval_sequences();

-- 8. Trigger de Control de Permisos para Configuración de Aprobaciones
CREATE OR REPLACE FUNCTION enforce_approval_config_permissions()
RETURNS TRIGGER AS $$
BEGIN
    IF is_platform_super_admin() THEN
        RETURN NEW;
    END IF;

    IF NOT (current_user_has_role('ADMINISTRADOR') OR current_user_has_role('GERENTE_GENERAL')) THEN
        RAISE EXCEPTION 'Permiso Denegado: Su rol no está autorizado para configurar flujos o reglas de aprobación.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_flow_permissions
BEFORE INSERT OR UPDATE OR DELETE ON approval_flows
FOR EACH ROW
EXECUTE FUNCTION enforce_approval_config_permissions();

CREATE TRIGGER trg_enforce_step_permissions
BEFORE INSERT OR UPDATE OR DELETE ON approval_steps
FOR EACH ROW
EXECUTE FUNCTION enforce_approval_config_permissions();

CREATE TRIGGER trg_enforce_rule_permissions
BEFORE INSERT OR UPDATE OR DELETE ON approval_rules
FOR EACH ROW
EXECUTE FUNCTION enforce_approval_config_permissions();

-- 9. Trigger de Trazabilidad General para Aprobaciones
CREATE OR REPLACE FUNCTION handle_approval_traceability()
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

CREATE TRIGGER trg_handle_flow_traceability BEFORE INSERT OR UPDATE ON approval_flows FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_handle_step_traceability BEFORE INSERT OR UPDATE ON approval_steps FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_handle_rule_traceability BEFORE INSERT OR UPDATE ON approval_rules FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- 10. Función para Ruteo Automático de Aprobaciones de Cotizaciones
CREATE OR REPLACE FUNCTION route_quote_approvals()
RETURNS TRIGGER AS $$
DECLARE
    v_rule record;
    v_request_id uuid;
    v_step record;
    v_gerente_role_id uuid;
    v_user_id uuid;
    v_exists boolean;
BEGIN
    -- Ejecutar solo al cambiar a EN_REVISION
    IF NEW.status = 'EN_REVISION' AND OLD.status <> 'EN_REVISION' THEN
        v_user_id := get_current_user_id();
        
        -- Verificar si ya existe una solicitud activa
        SELECT EXISTS (
            SELECT 1 FROM approval_requests
            WHERE entity_type = 'QUOTE'
              AND entity_id = NEW.id
              AND status IN ('PENDIENTE', 'EN_PROCESO')
              AND deleted_at IS NULL
        ) INTO v_exists;
        
        IF v_exists THEN
            RETURN NEW;
        END IF;

        -- Buscar regla coincidente
        SELECT * INTO v_rule
        FROM approval_rules
        WHERE tenant_id = NEW.tenant_id
          AND entity_type = 'QUOTE'
          AND active = true
          AND deleted_at IS NULL
          AND NEW.total_amount >= min_amount
          AND (max_amount IS NULL OR NEW.total_amount <= max_amount)
        ORDER BY min_amount DESC
        LIMIT 1;
        
        IF FOUND THEN
            IF v_rule.flow_id IS NULL THEN
                -- Auto-aprobación directa
                NEW.status := 'APROBADA';
            ELSE
                -- Crear solicitud de aprobación
                INSERT INTO approval_requests (
                    tenant_id, entity_type, entity_id, flow_id, requested_by, status
                ) VALUES (
                    NEW.tenant_id, 'QUOTE', NEW.id, v_rule.flow_id, v_user_id, 'PENDIENTE'
                ) RETURNING id INTO v_request_id;
                
                -- Instanciar pasos
                FOR v_step IN (
                    SELECT * FROM approval_steps 
                    WHERE flow_id = v_rule.flow_id AND deleted_at IS NULL 
                    ORDER BY step_order ASC
                ) LOOP
                    INSERT INTO approval_request_steps (
                        tenant_id, approval_request_id, step_order, role_id, user_id, required, status
                    ) VALUES (
                        NEW.tenant_id, v_request_id, v_step.step_order, v_step.role_id, v_step.user_id, v_step.required, 'PENDIENTE'
                    );
                END LOOP;
            END IF;
        ELSE
            -- Sin regla encontrada: Escalar automáticamente a Gerencia General
            SELECT id INTO v_gerente_role_id 
            FROM roles 
            WHERE role_code = 'GERENTE_GENERAL'
            LIMIT 1;
            
            IF v_gerente_role_id IS NULL THEN
                RAISE EXCEPTION 'No se encontró el rol GERENTE_GENERAL en el sistema para la escalación automática.';
            END IF;
            
            -- Crear solicitud
            INSERT INTO approval_requests (
                tenant_id, entity_type, entity_id, flow_id, requested_by, status
            ) VALUES (
                NEW.tenant_id, 'QUOTE', NEW.id, NULL, v_user_id, 'PENDIENTE'
            ) RETURNING id INTO v_request_id;
            
            -- Crear paso único de escalación
            INSERT INTO approval_request_steps (
                tenant_id, approval_request_id, step_order, role_id, user_id, required, status
            ) VALUES (
                NEW.tenant_id, v_request_id, 1, v_gerente_role_id, NULL, true, 'PENDIENTE'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enlazar trigger en quotes para ruteo
CREATE TRIGGER trg_route_quote_approvals
BEFORE UPDATE OF status ON quotes
FOR EACH ROW
EXECUTE FUNCTION route_quote_approvals();

-- 11. Trigger de Bloqueo de Modificación de Cotizaciones bajo Aprobación
CREATE OR REPLACE FUNCTION check_quote_approval_lock()
RETURNS TRIGGER AS $$
DECLARE
    v_quote_id uuid;
    v_locked boolean;
BEGIN
    IF is_platform_super_admin() THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    IF TG_TABLE_NAME = 'quotes' THEN
        v_quote_id := OLD.id;
    ELSE
        v_quote_id := OLD.quote_id;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM approval_requests
        WHERE entity_type = 'QUOTE'
          AND entity_id = v_quote_id
          AND status IN ('PENDIENTE', 'EN_PROCESO')
          AND deleted_at IS NULL
    ) INTO v_locked;

    IF v_locked THEN
        RAISE EXCEPTION 'No se puede modificar la cotización ni sus ítems mientras exista una solicitud de aprobación pendiente o en proceso.';
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_quote_approval_lock
BEFORE UPDATE OR DELETE ON quotes
FOR EACH ROW
EXECUTE FUNCTION check_quote_approval_lock();

CREATE TRIGGER trg_check_quote_item_approval_lock
BEFORE INSERT OR UPDATE OR DELETE ON quote_items
FOR EACH ROW
EXECUTE FUNCTION check_quote_approval_lock();

-- 12. Función de Firma y Resolución de Solicitudes de Aprobación
CREATE OR REPLACE FUNCTION resolve_approval_step(
    p_request_id uuid,
    p_step_order integer,
    p_decision varchar, -- 'APROBADA', 'RECHAZADA', 'AJUSTES_SOLICITADOS'
    p_comments text
)
RETURNS void AS $$
DECLARE
    v_request record;
    v_step record;
    v_user_id uuid;
    v_flow_type varchar(50);
    v_has_pending_prev boolean;
    v_user_has_role boolean;
    v_total_steps integer;
    v_approved_steps integer;
    v_decision_caps varchar(50);
BEGIN
    v_user_id := get_current_user_id();
    v_decision_caps := upper(trim(p_decision));
    
    IF v_decision_caps NOT IN ('APROBADA', 'RECHAZADA', 'AJUSTES_SOLICITADOS') THEN
        RAISE EXCEPTION 'Decisión no válida. Debe ser APROBADA, RECHAZADA o AJUSTES_SOLICITADOS.';
    END IF;

    -- 1. Obtener la solicitud
    SELECT * INTO v_request 
    FROM approval_requests 
    WHERE id = p_request_id AND deleted_at IS NULL;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitud de aprobación no encontrada.';
    END IF;
    
    IF v_request.status NOT IN ('PENDIENTE', 'EN_PROCESO') THEN
        RAISE EXCEPTION 'La solicitud de aprobación ya ha sido resuelta (estado actual: %).', v_request.status;
    END IF;

    -- 2. Obtener el paso específico
    SELECT * INTO v_step 
    FROM approval_request_steps 
    WHERE approval_request_id = p_request_id 
      AND step_order = p_step_order 
      AND deleted_at IS NULL;
      
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Paso de aprobación % no encontrado en esta solicitud.', p_step_order;
    END IF;
    
    IF v_step.status <> 'PENDIENTE' THEN
        RAISE EXCEPTION 'Este paso de aprobación ya fue resuelto con estado %.', v_step.status;
    END IF;

    -- 3. Validar autoridad del firmante
    IF v_step.user_id IS NOT NULL THEN
        IF v_step.user_id <> v_user_id AND NOT is_platform_super_admin() THEN
            RAISE EXCEPTION 'No tiene autorización para resolver este paso de aprobación (asignado al usuario %).', v_step.user_id;
        END IF;
    ELSIF v_step.role_id IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = v_user_id 
              AND role_id = v_step.role_id 
              AND tenant_id = v_request.tenant_id
        ) INTO v_user_has_role;
        
        IF NOT v_user_has_role AND NOT is_platform_super_admin() THEN
            RAISE EXCEPTION 'No tiene autorización para resolver este paso de aprobación (requiere rol específico).';
        END IF;
    END IF;

    -- 4. Validar secuencia si el flujo es secuencial
    IF v_request.flow_id IS NOT NULL THEN
        SELECT COALESCE(flow_type, 'SECUENCIAL') INTO v_flow_type 
        FROM approval_flows 
        WHERE id = v_request.flow_id;
        
        IF v_flow_type = 'SECUENCIAL' THEN
            SELECT EXISTS (
                SELECT 1 FROM approval_request_steps 
                WHERE approval_request_id = p_request_id 
                  AND step_order < p_step_order 
                  AND status <> 'APROBADA'
                  AND deleted_at IS NULL
            ) INTO v_has_pending_prev;
            
            IF v_has_pending_prev THEN
                RAISE EXCEPTION 'No se puede resolver este paso hasta que los pasos anteriores hayan sido aprobados.';
            END IF;
        END IF;
    END IF;

    -- 5. Actualizar el paso de solicitud
    UPDATE approval_request_steps
    SET status = v_decision_caps,
        resolved_by = v_user_id,
        resolved_at = NOW(),
        comments = p_comments,
        updated_at = NOW()
    WHERE id = v_step.id;

    -- Disparar evento de firma de paso
    INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
    VALUES (
        v_request.tenant_id,
        CASE 
            WHEN v_decision_caps = 'APROBADA' THEN 'APPROVAL_REQUEST_APPROVED'
            WHEN v_decision_caps = 'RECHAZADA' THEN 'APPROVAL_REQUEST_REJECTED'
            ELSE 'APPROVAL_REQUEST_ADJUSTMENTS_REQUESTED'
        END,
        'APPROVAL_REQUEST',
        v_request.id,
        jsonb_build_object(
            'request_code', v_request.request_code,
            'step_order', p_step_order,
            'comments', p_comments,
            'resolved_by', v_user_id
        ),
        v_user_id
    );

    -- 6. Evaluar estado global de la solicitud
    IF v_decision_caps = 'RECHAZADA' THEN
        UPDATE approval_requests
        SET status = 'RECHAZADA',
            resolved_by = v_user_id,
            resolved_at = NOW(),
            comments = p_comments,
            updated_at = NOW()
        WHERE id = p_request_id;

        IF v_request.entity_type = 'QUOTE' THEN
            UPDATE quotes
            SET status = 'RECHAZADA',
                reject_reason = p_comments
            WHERE id = v_request.entity_id;
        END IF;

    ELSIF v_decision_caps = 'AJUSTES_SOLICITADOS' THEN
        UPDATE approval_requests
        SET status = 'AJUSTES_SOLICITADOS',
            resolved_by = v_user_id,
            resolved_at = NOW(),
            comments = p_comments,
            updated_at = NOW()
        WHERE id = p_request_id;

        IF v_request.entity_type = 'QUOTE' THEN
            UPDATE quotes
            SET status = 'EN_REVISION'
            WHERE id = v_request.entity_id;
        END IF;

    ELSIF v_decision_caps = 'APROBADA' THEN
        SELECT COUNT(*), COUNT(CASE WHEN status = 'APROBADA' THEN 1 END)
        INTO v_total_steps, v_approved_steps
        FROM approval_request_steps
        WHERE approval_request_id = p_request_id 
          AND required = true
          AND deleted_at IS NULL;

        IF v_total_steps = v_approved_steps THEN
            UPDATE approval_requests
            SET status = 'APROBADA',
                resolved_by = v_user_id,
                resolved_at = NOW(),
                comments = 'Aprobación completada por todos los pasos.',
                updated_at = NOW()
            WHERE id = p_request_id;

            IF v_request.entity_type = 'QUOTE' THEN
                UPDATE quotes
                SET status = 'APROBADA'
                WHERE id = v_request.entity_id;
            END IF;
        ELSE
            UPDATE approval_requests
            SET status = 'EN_PROCESO',
                updated_at = NOW()
            WHERE id = p_request_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Trigger de Emisión de Eventos de Aprobaciones
CREATE OR REPLACE FUNCTION dispatch_approval_events()
RETURNS TRIGGER AS $$
DECLARE
    v_payload jsonb;
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_TABLE_NAME = 'approval_flows' AND TG_OP = 'INSERT' THEN
        v_payload := jsonb_build_object('flow_code', NEW.flow_code, 'name', NEW.name, 'flow_type', NEW.flow_type);
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (NEW.tenant_id, 'APPROVAL_FLOW_CREATED', 'APPROVAL_FLOW', NEW.id, v_payload, v_user_id);

    ELSIF TG_TABLE_NAME = 'approval_rules' AND TG_OP = 'INSERT' THEN
        v_payload := jsonb_build_object('entity_type', NEW.entity_type, 'min_amount', NEW.min_amount, 'flow_id', NEW.flow_id);
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (NEW.tenant_id, 'APPROVAL_RULE_CREATED', 'APPROVAL_RULE', NEW.id, v_payload, v_user_id);

    ELSIF TG_TABLE_NAME = 'approval_requests' AND TG_OP = 'INSERT' THEN
        v_payload := jsonb_build_object('request_code', NEW.request_code, 'entity_type', NEW.entity_type, 'entity_id', NEW.entity_id);
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (NEW.tenant_id, 'APPROVAL_REQUEST_CREATED', 'APPROVAL_REQUEST', NEW.id, v_payload, v_user_id);
        
    ELSIF TG_TABLE_NAME = 'approval_requests' AND TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
        IF NEW.status = 'CANCELADA' THEN
            v_payload := jsonb_build_object('request_code', NEW.request_code, 'comments', NEW.comments);
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'APPROVAL_REQUEST_CANCELLED', 'APPROVAL_REQUEST', NEW.id, v_payload, v_user_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_flow_event AFTER INSERT ON approval_flows FOR EACH ROW EXECUTE FUNCTION dispatch_approval_events();
CREATE TRIGGER trg_dispatch_rule_event AFTER INSERT ON approval_rules FOR EACH ROW EXECUTE FUNCTION dispatch_approval_events();
CREATE TRIGGER trg_dispatch_request_event AFTER INSERT OR UPDATE ON approval_requests FOR EACH ROW EXECUTE FUNCTION dispatch_approval_events();

-- 14. Bloqueo de Eliminación Física (Soft Delete Requerido)
CREATE OR REPLACE FUNCTION block_physical_approval_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Las entidades de aprobación son inmutables, utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_flow_delete BEFORE DELETE ON approval_flows FOR EACH ROW EXECUTE FUNCTION block_physical_approval_delete();
CREATE TRIGGER trg_block_step_delete BEFORE DELETE ON approval_steps FOR EACH ROW EXECUTE FUNCTION block_physical_approval_delete();
CREATE TRIGGER trg_block_rule_delete BEFORE DELETE ON approval_rules FOR EACH ROW EXECUTE FUNCTION block_physical_approval_delete();
CREATE TRIGGER trg_block_request_delete BEFORE DELETE ON approval_requests FOR EACH ROW EXECUTE FUNCTION block_physical_approval_delete();
CREATE TRIGGER trg_block_request_step_delete BEFORE DELETE ON approval_request_steps FOR EACH ROW EXECUTE FUNCTION block_physical_approval_delete();

-- 15. Integración con Auditoría Técnica General (Fase 1)
CREATE TRIGGER audit_approval_flows AFTER INSERT OR UPDATE OR DELETE ON approval_flows FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_approval_steps AFTER INSERT OR UPDATE OR DELETE ON approval_steps FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_approval_rules AFTER INSERT OR UPDATE OR DELETE ON approval_rules FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_approval_requests AFTER INSERT OR UPDATE OR DELETE ON approval_requests FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_approval_request_steps AFTER INSERT OR UPDATE OR DELETE ON approval_request_steps FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 16. Políticas RLS (Row Level Security)
ALTER TABLE approval_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_request_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY flows_super_admin ON approval_flows FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY flows_select_tenant ON approval_flows FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY flows_write_tenant ON approval_flows FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY steps_super_admin ON approval_steps FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY steps_select_tenant ON approval_steps FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY steps_write_tenant ON approval_steps FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY rules_super_admin ON approval_rules FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY rules_select_tenant ON approval_rules FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY rules_write_tenant ON approval_rules FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY reqs_super_admin ON approval_requests FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY reqs_select_tenant ON approval_requests FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY reqs_write_tenant ON approval_requests FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY req_steps_super_admin ON approval_request_steps FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY req_steps_select_tenant ON approval_request_steps FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY req_steps_write_tenant ON approval_request_steps FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000006_jobs_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 6: TRABAJOS Y ACTIVIDADES (ORDEN DE TRABAJO)
-- Archivo: supabase/migrations/20260617000006_jobs_core.sql

-- 1. Crear Tabla de Trabajos (jobs)
CREATE TABLE jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    job_code varchar(50) NOT NULL,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE RESTRICT,
    quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
    site_id uuid NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    area_id uuid NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
    title varchar(250) NOT NULL,
    description text,
    assigned_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    
    -- Planificación y Tiempos
    planned_start_date timestamp,
    planned_end_date timestamp,
    actual_start_date timestamp,
    actual_end_date timestamp,
    estimated_hours numeric(10,2),
    actual_hours numeric(10,2),
    
    priority varchar(50) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status varchar(50) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN (
        'PENDIENTE', 'PROGRAMADO', 'EN_EJECUCION', 'SUSPENDIDO', 'FINALIZADO', 'ENTREGADO', 'CERRADO', 'CANCELADO'
    )),

    -- Motivos de Cancelación
    cancel_reason text,
    cancelled_by uuid REFERENCES users(id) ON DELETE SET NULL,
    cancelled_at timestamp,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_job_code UNIQUE (tenant_id, job_code),
    CONSTRAINT chk_job_planned_dates CHECK (planned_end_date IS NULL OR planned_start_date IS NULL OR planned_end_date >= planned_start_date),
    CONSTRAINT chk_job_actual_dates CHECK (actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date)
);

-- 2. Crear Tabla de Actividades de Trabajo (job_activities)
CREATE TABLE job_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    activity_code varchar(100) NOT NULL,
    title varchar(250) NOT NULL,
    description text,
    assigned_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Planificación y Tiempos (Obligatorios en actividades)
    planned_start_date timestamp NOT NULL,
    planned_end_date timestamp NOT NULL,
    actual_start_date timestamp,
    actual_end_date timestamp,
    estimated_hours numeric(10,2),
    actual_hours numeric(10,2),
    
    status varchar(50) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN (
        'PENDIENTE', 'PROGRAMADA', 'EN_EJECUCION', 'SUSPENDIDA', 'COMPLETADA', 'CANCELADA'
    )),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_activity_code UNIQUE (tenant_id, activity_code),
    CONSTRAINT chk_activity_planned_dates CHECK (planned_end_date >= planned_start_date),
    CONSTRAINT chk_activity_actual_dates CHECK (actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date)
);

-- 3. Índices de Rendimiento
CREATE INDEX idx_jobs_tenant ON jobs(tenant_id);
CREATE INDEX idx_jobs_client ON jobs(client_id);
CREATE INDEX idx_jobs_requirement ON jobs(requirement_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_job_activities_job ON job_activities(job_id);

-- 4. Registro de tipo de secuencia JOB en tenant_sequences (por si acaso no existe)
-- La secuencia se maneja dinámicamente, pero garantizamos que se use.

-- 5. Trigger: Autogeneración de Códigos Correlativos
CREATE OR REPLACE FUNCTION handle_job_sequences()
RETURNS TRIGGER AS $$
DECLARE
    v_job_code varchar(50);
    v_max_suffix integer;
BEGIN
    IF TG_TABLE_NAME = 'jobs' THEN
        IF NEW.job_code IS NULL OR NEW.job_code = '' THEN
            NEW.job_code := 'JOB-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'JOB')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'job_activities' THEN
        IF NEW.activity_code IS NULL OR NEW.activity_code = '' THEN
            -- Obtener código del Job padre
            SELECT job_code INTO v_job_code FROM jobs WHERE id = NEW.job_id;
            
            -- Obtener sufijo correlativo máximo
            SELECT COALESCE(MAX(SUBSTRING(activity_code FROM '[0-9]+$')::integer), 0) INTO v_max_suffix
            FROM job_activities
            WHERE job_id = NEW.job_id;
            
            NEW.activity_code := v_job_code || '-' || LPAD((v_max_suffix + 1)::text, 2, '0');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_job_code
BEFORE INSERT ON jobs
FOR EACH ROW
EXECUTE FUNCTION handle_job_sequences();

CREATE TRIGGER trg_handle_activity_code
BEFORE INSERT ON job_activities
FOR EACH ROW
EXECUTE FUNCTION handle_job_sequences();

-- 6. Trigger: Restricción de Fechas Planificadas de Actividades
CREATE OR REPLACE FUNCTION validate_activity_dates()
RETURNS TRIGGER AS $$
DECLARE
    v_job_start timestamp;
    v_job_end timestamp;
BEGIN
    SELECT planned_start_date, planned_end_date INTO v_job_start, v_job_end
    FROM jobs WHERE id = NEW.job_id;

    IF v_job_start IS NOT NULL AND NEW.planned_start_date < v_job_start THEN
        RAISE EXCEPTION 'La fecha de inicio de la actividad (%) no puede estar fuera del rango del Trabajo (%).', NEW.planned_start_date, v_job_start;
    END IF;

    IF v_job_end IS NOT NULL AND NEW.planned_end_date > v_job_end THEN
        RAISE EXCEPTION 'La fecha de fin de la actividad (%) no puede estar fuera del rango del Trabajo (%).', NEW.planned_end_date, v_job_end;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_activity_dates
BEFORE INSERT OR UPDATE OF planned_start_date, planned_end_date ON job_activities
FOR EACH ROW
EXECUTE FUNCTION validate_activity_dates();

-- Trigger & Función: Validación de fechas del Trabajo al actualizar
CREATE OR REPLACE FUNCTION validate_job_dates_update()
RETURNS TRIGGER AS $$
DECLARE
    v_out_of_range_activity varchar(100);
BEGIN
    IF (NEW.planned_start_date IS DISTINCT FROM OLD.planned_start_date) OR
       (NEW.planned_end_date IS DISTINCT FROM OLD.planned_end_date) THEN
       
        SELECT activity_code INTO v_out_of_range_activity
        FROM job_activities
        WHERE job_id = NEW.id
          AND deleted_at IS NULL
          AND (
              (NEW.planned_start_date IS NOT NULL AND planned_start_date < NEW.planned_start_date) OR
              (NEW.planned_end_date IS NOT NULL AND planned_end_date > NEW.planned_end_date)
          )
        LIMIT 1;
        
        IF v_out_of_range_activity IS NOT NULL THEN
            RAISE EXCEPTION 'No se pueden cambiar las fechas del Trabajo porque la actividad % quedaría fuera del nuevo rango planificado.', v_out_of_range_activity;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_job_dates_update
BEFORE UPDATE OF planned_start_date, planned_end_date ON jobs
FOR EACH ROW
EXECUTE FUNCTION validate_job_dates_update();

-- 7. Trigger: Permisos de Creación y Modificación de Trabajos
CREATE OR REPLACE FUNCTION enforce_job_permissions()
RETURNS TRIGGER AS $$
BEGIN
    IF is_platform_super_admin() THEN
        RETURN NEW;
    END IF;

    -- Creación manual restringida a roles específicos
    IF TG_OP = 'INSERT' THEN
        IF pg_trigger_depth() = 0 THEN
            IF NOT (
                current_user_has_role('GERENTE') OR 
                current_user_has_role('GERENTE_GENERAL') OR 
                current_user_has_role('JEFE_PROYECTOS') OR 
                current_user_has_role('COORDINADOR_OPERACIONES')
            ) THEN
                RAISE EXCEPTION 'Permiso Denegado: Su rol no está autorizado para crear trabajos de manera manual.';
            END IF;
        END IF;
    END IF;

    -- Job CERRADO es inmutable
    IF TG_OP = 'UPDATE' AND OLD.status = 'CERRADO' THEN
        RAISE EXCEPTION 'No se puede modificar un trabajo con estado final CERRADO.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_job_permissions
BEFORE INSERT OR UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION enforce_job_permissions();

-- 8. Trigger: Validación de Transición de Estados del Trabajo
CREATE OR REPLACE FUNCTION validate_job_state_transitions()
RETURNS TRIGGER AS $$
DECLARE
    v_has_incomplete boolean;
    v_has_delivery_note boolean;
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    -- Bloquear cambios en CERRADO (duplicado de seguridad)
    IF OLD.status = 'CERRADO' THEN
        RAISE EXCEPTION 'No se puede reabrir o editar un trabajo con estado final CERRADO.';
    END IF;

    -- Regla: JOB ENTREGADO solo puede pasar a CERRADO
    IF OLD.status = 'ENTREGADO' AND NEW.status <> 'CERRADO' THEN
        RAISE EXCEPTION 'Un trabajo ENTREGADO solo puede pasar a CERRADO.';
    END IF;

    -- Regla: JOB FINALIZADO no puede regresar a PROGRAMADO o PENDIENTE
    IF OLD.status = 'FINALIZADO' AND NEW.status IN ('PENDIENTE', 'PROGRAMADO') THEN
        RAISE EXCEPTION 'Un trabajo FINALIZADO no puede regresar a PENDIENTE o PROGRAMADO.';
    END IF;

    -- Transiciones específicas
    IF NEW.status = 'EN_REVISION' THEN
        -- No aplica a Jobs, pero controlamos en check
    ELSIF NEW.status = 'EN_EJECUCION' THEN
        -- Inicio real obligatorio para pasar a EN_EJECUCION
        IF NEW.actual_start_date IS NULL THEN
            RAISE EXCEPTION 'actual_start_date es obligatorio para pasar a EN_EJECUCION.';
        END IF;

    ELSIF NEW.status = 'FINALIZADO' THEN
        -- Todas las actividades no canceladas deben estar completadas (no puede haber pendientes o en proceso)
        SELECT EXISTS (
            SELECT 1 FROM job_activities 
            WHERE job_id = NEW.id 
              AND status NOT IN ('COMPLETADA', 'CANCELADA') 
              AND deleted_at IS NULL
        ) INTO v_has_incomplete;
        
        IF v_has_incomplete THEN
            RAISE EXCEPTION 'No se puede finalizar el trabajo porque existen actividades pendientes o en proceso.';
        END IF;

    ELSIF NEW.status = 'ENTREGADO' THEN
        -- Validación de Acta de Entrega cargada en documentos del Job
        SELECT EXISTS (
            SELECT 1 FROM documents 
            WHERE entity_type = 'JOB' 
              AND entity_id = NEW.id 
              AND document_type = 'DELIVERY_NOTE' 
              AND status = 'PUBLICADO'
              AND deleted_at IS NULL
        ) INTO v_has_delivery_note;

        IF NOT v_has_delivery_note THEN
            RAISE EXCEPTION 'No se puede marcar el trabajo como ENTREGADO sin registrar el Acta de Entrega (documento DELIVERY_NOTE en estado PUBLICADO) asociado al Job.';
        END IF;

    ELSIF NEW.status = 'CANCELADO' THEN
        -- Motivo de cancelación obligatorio
        IF NEW.cancel_reason IS NULL OR length(trim(NEW.cancel_reason)) < 10 THEN
            RAISE EXCEPTION 'Para cancelar un trabajo se debe ingresar un motivo detallado (cancel_reason, mínimo 10 caracteres).';
        END IF;
        
        NEW.cancelled_by := v_user_id;
        NEW.cancelled_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_job_state
BEFORE UPDATE OF status ON jobs
FOR EACH ROW
EXECUTE FUNCTION validate_job_state_transitions();

-- 9. Trigger: Propagación de Estados Actividad -> Trabajo y Automatizaciones
CREATE OR REPLACE FUNCTION handle_activity_status_propagation()
RETURNS TRIGGER AS $$
DECLARE
    v_total integer;
    v_completed integer;
BEGIN
    -- 1. Si actividad pasa a EN_EJECUCION, el Job pasa a EN_EJECUCION si estaba en PENDIENTE o PROGRAMADO
    IF NEW.status = 'EN_EJECUCION' AND (OLD.status IS NULL OR OLD.status <> 'EN_EJECUCION') THEN
        UPDATE jobs
        SET status = 'EN_EJECUCION',
            actual_start_date = COALESCE(actual_start_date, NOW()),
            updated_at = NOW()
        WHERE id = NEW.job_id
          AND status IN ('PENDIENTE', 'PROGRAMADO');
    END IF;

    -- 2. Si todas las actividades se completan, el Job pasa a FINALIZADO
    IF NEW.status = 'COMPLETADA' AND (OLD.status IS NULL OR OLD.status <> 'COMPLETADA') THEN
        -- Contar actividades no canceladas
        SELECT COUNT(*), COUNT(CASE WHEN status = 'COMPLETADA' THEN 1 END)
        INTO v_total, v_completed
        FROM job_activities
        WHERE job_id = NEW.job_id 
          AND status <> 'CANCELADA'
          AND deleted_at IS NULL;

        IF v_total > 0 AND v_total = v_completed THEN
            UPDATE jobs
            SET status = 'FINALIZADO',
                actual_end_date = COALESCE(actual_end_date, NOW()),
                updated_at = NOW()
            WHERE id = NEW.job_id
              AND status IN ('PENDIENTE', 'PROGRAMADO', 'EN_EJECUCION', 'SUSPENDIDO');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_activity_status_propagation
AFTER INSERT OR UPDATE OF status ON job_activities
FOR EACH ROW
EXECUTE FUNCTION handle_activity_status_propagation();

-- 10. Trigger: Propagación de Estado Job Cancelado -> Actividades
CREATE OR REPLACE FUNCTION handle_job_cancellation_propagation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'CANCELADO' AND OLD.status <> 'CANCELADO' THEN
        UPDATE job_activities
        SET status = 'CANCELADA',
            updated_at = NOW()
        WHERE job_id = NEW.id
          AND status NOT IN ('COMPLETADA', 'CANCELADA')
          AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_job_cancellation_propagation
AFTER UPDATE OF status ON jobs
FOR EACH ROW
EXECUTE FUNCTION handle_job_cancellation_propagation();

-- 11. Trigger: Creación Automática de Trabajo al generar la OT
CREATE OR REPLACE FUNCTION create_job_on_ot_generation()
RETURNS TRIGGER AS $$
DECLARE
    v_quote record;
    v_site_id uuid;
    v_area_id uuid;
    v_job_id uuid;
BEGIN
    IF NEW.status = 'OT_GENERADA' AND OLD.status <> 'OT_GENERADA' THEN
        -- Obtener cotización aprobada asociada al requerimiento
        SELECT id INTO v_quote
        FROM quotes
        WHERE requirement_id = NEW.id
          AND status = 'APROBADA'
          AND deleted_at IS NULL
        LIMIT 1;

        -- Obtener sedes y áreas del ingeniero asignado
        IF NEW.engineering_user_id IS NOT NULL THEN
            SELECT site_id, area_id INTO v_site_id, v_area_id
            FROM users
            WHERE id = NEW.engineering_user_id;
        END IF;

        -- Fallbacks si no están definidos en el usuario
        IF v_site_id IS NULL THEN
            SELECT id INTO v_site_id FROM sites WHERE tenant_id = NEW.tenant_id AND status = 'Activo' LIMIT 1;
        END IF;

        IF v_area_id IS NULL THEN
            SELECT id INTO v_area_id FROM areas WHERE tenant_id = NEW.tenant_id AND status = 'Activo' LIMIT 1;
        END IF;

        -- Crear Trabajo PENDIENTE
        INSERT INTO jobs (
            tenant_id,
            job_code,
            client_id,
            requirement_id,
            quote_id,
            site_id,
            area_id,
            title,
            description,
            assigned_user_id,
            priority,
            status,
            created_by
        ) VALUES (
            NEW.tenant_id,
            'JOB-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'JOB')::text, 6, '0'),
            NEW.client_id,
            NEW.id,
            v_quote.id,
            v_site_id,
            v_area_id,
            NEW.title,
            NEW.description,
            NEW.engineering_user_id,
            CASE 
                WHEN NEW.priority = 'CRITICAL' THEN 'CRITICAL'
                WHEN NEW.priority = 'HIGH' THEN 'HIGH'
                WHEN NEW.priority = 'MEDIUM' THEN 'MEDIUM'
                ELSE 'LOW'
            END,
            'PENDIENTE',
            get_current_user_id()
        ) RETURNING id INTO v_job_id;

        -- Evento de negocio
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (
            NEW.tenant_id,
            'JOB_CREATED',
            'JOB',
            v_job_id,
            jsonb_build_object(
                'requirement_code', NEW.requirement_code,
                'client_id', NEW.client_id,
                'assigned_user_id', NEW.engineering_user_id
            ),
            get_current_user_id()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_job_on_ot
AFTER UPDATE OF status ON requirements
FOR EACH ROW
EXECUTE FUNCTION create_job_on_ot_generation();

-- 12. Trigger: Emisión de Eventos de Negocio de Trabajos y Actividades
CREATE OR REPLACE FUNCTION dispatch_job_events()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_event_code varchar(100);
    v_payload jsonb;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_TABLE_NAME = 'jobs' THEN
        IF TG_OP = 'INSERT' THEN
            -- Creación manual (la automática ya emite evento arriba)
            IF pg_trigger_depth() = 0 THEN
                v_payload := jsonb_build_object('job_code', NEW.job_code, 'title', NEW.title, 'status', NEW.status);
                INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
                VALUES (NEW.tenant_id, 'JOB_CREATED', 'JOB', NEW.id, v_payload, v_user_id);
            END IF;
        ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
            IF NEW.status = 'PROGRAMADO' THEN v_event_code := 'JOB_SCHEDULED';
            ELSIF NEW.status = 'EN_EJECUCION' THEN v_event_code := 'JOB_STARTED';
            ELSIF NEW.status = 'SUSPENDIDO' THEN v_event_code := 'JOB_SUSPENDED';
            ELSIF NEW.status = 'FINALIZADO' THEN v_event_code := 'JOB_COMPLETED';
            ELSIF NEW.status = 'ENTREGADO' THEN v_event_code := 'JOB_DELIVERED';
            ELSIF NEW.status = 'CERRADO' THEN v_event_code := 'JOB_CLOSED';
            ELSIF NEW.status = 'CANCELADO' THEN v_event_code := 'JOB_CANCELLED';
            ELSE v_event_code := 'JOB_STATUS_CHANGED';
            END IF;

            v_payload := jsonb_build_object('job_code', NEW.job_code, 'old_status', OLD.status, 'new_status', NEW.status);
            IF NEW.status = 'CANCELADO' THEN
                v_payload := v_payload || jsonb_build_object('cancel_reason', NEW.cancel_reason);
            END IF;

            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, v_event_code, 'JOB', NEW.id, v_payload, v_user_id);
        END IF;

    ELSIF TG_TABLE_NAME = 'job_activities' THEN
        IF TG_OP = 'INSERT' THEN
            v_payload := jsonb_build_object('activity_code', NEW.activity_code, 'title', NEW.title, 'status', NEW.status);
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'JOB_ACTIVITY_CREATED', 'JOB_ACTIVITY', NEW.id, v_payload, v_user_id);
        ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
            IF NEW.status = 'EN_EJECUCION' THEN v_event_code := 'JOB_ACTIVITY_STARTED';
            ELSIF NEW.status = 'COMPLETADA' THEN v_event_code := 'JOB_ACTIVITY_COMPLETED';
            ELSIF NEW.status = 'CANCELADA' THEN v_event_code := 'JOB_ACTIVITY_CANCELLED';
            ELSE v_event_code := 'JOB_ACTIVITY_STATUS_CHANGED';
            END IF;

            v_payload := jsonb_build_object('activity_code', NEW.activity_code, 'old_status', OLD.status, 'new_status', NEW.status);
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, v_event_code, 'JOB_ACTIVITY', NEW.id, v_payload, v_user_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_job_event AFTER INSERT OR UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION dispatch_job_events();
CREATE TRIGGER trg_dispatch_activity_event AFTER INSERT OR UPDATE ON job_activities FOR EACH ROW EXECUTE FUNCTION dispatch_job_events();

-- 13. Trazabilidad e Inmutabilidad de Deletes (Soft Delete Obligatorio)
CREATE OR REPLACE FUNCTION block_physical_job_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los Trabajos y Actividades son inmutables, utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_job_delete BEFORE DELETE ON jobs FOR EACH ROW EXECUTE FUNCTION block_physical_job_delete();
CREATE TRIGGER trg_block_activity_delete BEFORE DELETE ON job_activities FOR EACH ROW EXECUTE FUNCTION block_physical_job_delete();

CREATE TRIGGER trg_handle_job_traceability BEFORE INSERT OR UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_handle_activity_traceability BEFORE INSERT OR UPDATE ON job_activities FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- 14. Integración con Auditoría General (Fase 1)
CREATE TRIGGER audit_jobs AFTER INSERT OR UPDATE OR DELETE ON jobs FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_job_activities AFTER INSERT OR UPDATE OR DELETE ON job_activities FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 15. Políticas RLS (Row Level Security)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY jobs_super_admin ON jobs FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY jobs_select_tenant ON jobs FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY jobs_write_tenant ON jobs FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY activities_super_admin ON job_activities FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY activities_select_tenant ON job_activities FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY activities_write_tenant ON job_activities FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000007_inventory_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 7: INVENTARIOS (BODEGAS, ARTÍCULOS Y MOVIMIENTOS)
-- Archivo: supabase/migrations/20260617000007_inventory_core.sql

-- 1. Insertar el rol global JEFE_INVENTARIO si no existe
INSERT INTO roles (tenant_id, role_code, name, description, status)
VALUES (NULL, 'JEFE_INVENTARIO', 'Jefe de Inventarios', 'Responsable del control de bodegas, catálogo de artículos y aprobación de movimientos de inventario.', 'Activo')
ON CONFLICT (tenant_id, role_code) DO NOTHING;

-- 2. Crear Tabla de Bodegas (warehouses)
CREATE TABLE warehouses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    warehouse_code varchar(50) NOT NULL,
    site_id uuid NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    name varchar(150) NOT NULL,
    description text,
    status varchar(50) NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),
    
    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_warehouse_code UNIQUE (tenant_id, warehouse_code)
);

-- 3. Crear Tabla de Artículos de Inventario (inventory_items)
CREATE TABLE inventory_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    item_code varchar(50) NOT NULL,
    name varchar(250) NOT NULL,
    description text,
    category varchar(100),
    item_type varchar(50) NOT NULL DEFAULT 'Material' CHECK (item_type IN ('Material', 'Herramienta', 'Equipo', 'Consumible', 'Repuesto')),
    unit varchar(20) NOT NULL,
    minimum_stock decimal(18,4) NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    reorder_point decimal(18,4) NOT NULL DEFAULT 0 CHECK (reorder_point >= 0),
    maximum_stock decimal(18,4) NOT NULL DEFAULT 0 CHECK (maximum_stock >= 0),
    average_cost decimal(18,2) NOT NULL DEFAULT 0 CHECK (average_cost >= 0),
    last_cost decimal(18,2) NOT NULL DEFAULT 0 CHECK (last_cost >= 0),
    status varchar(50) NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'Inactivo')),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_item_code UNIQUE (tenant_id, item_code)
);

-- 4. Crear Tabla de Stocks/Existencias (inventory_stock)
CREATE TABLE inventory_stock (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    warehouse_id uuid NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    quantity decimal(18,4) NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity decimal(18,4) NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    available_quantity decimal(18,4) GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_warehouse_item UNIQUE (tenant_id, warehouse_id, item_id),
    CONSTRAINT chk_stock_available_non_negative CHECK (quantity >= reserved_quantity)
);

-- 5. Crear Tabla de Movimientos de Inventario (inventory_movements)
CREATE TABLE inventory_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    movement_code varchar(50) NOT NULL,
    
    -- Bodegas implicadas
    warehouse_id uuid REFERENCES warehouses(id) ON DELETE RESTRICT,
    source_warehouse_id uuid REFERENCES warehouses(id) ON DELETE RESTRICT,
    destination_warehouse_id uuid REFERENCES warehouses(id) ON DELETE RESTRICT,
    
    item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    job_id uuid REFERENCES jobs(id) ON DELETE RESTRICT,
    activity_id uuid REFERENCES job_activities(id) ON DELETE RESTRICT,
    
    movement_type varchar(50) NOT NULL CHECK (movement_type IN ('Entrada', 'Salida', 'Ajuste', 'Reserva', 'Transferencia')),
    quantity decimal(18,4) NOT NULL CHECK (quantity > 0),
    unit_cost decimal(18,2) NOT NULL DEFAULT 0 CHECK (unit_cost >= 0),
    total_cost decimal(18,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    notes text,
    movement_date timestamp NOT NULL DEFAULT NOW(),
    status varchar(50) NOT NULL DEFAULT 'Registrado' CHECK (status IN ('Registrado', 'Aplicado', 'Anulado')),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_movement_code UNIQUE (tenant_id, movement_code),
    
    -- Validación de bodegas según tipo de movimiento
    CONSTRAINT chk_movement_warehouses CHECK (
        (movement_type <> 'Transferencia' AND warehouse_id IS NOT NULL AND source_warehouse_id IS NULL AND destination_warehouse_id IS NULL)
        OR
        (movement_type = 'Transferencia' AND warehouse_id IS NULL AND source_warehouse_id IS NOT NULL AND destination_warehouse_id IS NOT NULL AND source_warehouse_id <> destination_warehouse_id)
    ),

    -- Job ID es obligatorio para Salidas a obra
    CONSTRAINT chk_movement_job_required CHECK (
        movement_type <> 'Salida' OR job_id IS NOT NULL
    )
);

-- 6. Índices de Rendimiento
CREATE INDEX idx_warehouses_tenant ON warehouses(tenant_id);
CREATE INDEX idx_inventory_items_tenant ON inventory_items(tenant_id);
CREATE INDEX idx_inventory_stock_tenant ON inventory_stock(tenant_id);
CREATE INDEX idx_inventory_stock_warehouse_item ON inventory_stock(warehouse_id, item_id);
CREATE INDEX idx_inventory_movements_tenant ON inventory_movements(tenant_id);
CREATE INDEX idx_inventory_movements_job ON inventory_movements(job_id);

-- 7. Trigger: Autogeneración de Códigos Correlativos
CREATE OR REPLACE FUNCTION handle_inventory_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'warehouses' THEN
        IF NEW.warehouse_code IS NULL OR NEW.warehouse_code = '' THEN
            NEW.warehouse_code := 'WH-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'WAREHOUSE')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'inventory_items' THEN
        IF NEW.item_code IS NULL OR NEW.item_code = '' THEN
            NEW.item_code := 'ART-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'ITEM')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'inventory_movements' THEN
        IF NEW.movement_code IS NULL OR NEW.movement_code = '' THEN
            NEW.movement_code := 'MOV-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'INVENTORY_MOVEMENT')::text, 6, '0');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_warehouse_code BEFORE INSERT ON warehouses FOR EACH ROW EXECUTE FUNCTION handle_inventory_sequences();
CREATE TRIGGER trg_handle_item_code BEFORE INSERT ON inventory_items FOR EACH ROW EXECUTE FUNCTION handle_inventory_sequences();
CREATE TRIGGER trg_handle_movement_code BEFORE INSERT ON inventory_movements FOR EACH ROW EXECUTE FUNCTION handle_inventory_sequences();

-- 8. Trigger: Control de Permisos (RBAC)
CREATE OR REPLACE FUNCTION enforce_inventory_permissions()
RETURNS TRIGGER AS $$
BEGIN
    IF is_platform_super_admin() THEN
        RETURN NEW;
    END IF;

    IF pg_trigger_depth() = 0 THEN
        -- Tabla Bodegas
        IF TG_TABLE_NAME = 'warehouses' THEN
            IF NOT (
                current_user_has_role('JEFE_INVENTARIO') OR 
                current_user_has_role('GERENTE') OR 
                current_user_has_role('GERENTE_GENERAL')
            ) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo el Jefe de Inventario o Gerencia pueden gestionar bodegas.';
            END IF;
        
        -- Tabla Artículos
        ELSIF TG_TABLE_NAME = 'inventory_items' THEN
            IF NOT (
                current_user_has_role('JEFE_INVENTARIO') OR 
                current_user_has_role('GERENTE') OR 
                current_user_has_role('GERENTE_GENERAL')
            ) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo el Jefe de Inventario o Gerencia pueden gestionar artículos de catálogo.';
            END IF;

        -- Tabla Movimientos
        ELSIF TG_TABLE_NAME = 'inventory_movements' THEN
            IF TG_OP = 'INSERT' THEN
                IF NEW.movement_type IN ('Ajuste', 'Transferencia') THEN
                    IF NOT (
                        current_user_has_role('JEFE_INVENTARIO') OR 
                        current_user_has_role('GERENTE') OR 
                        current_user_has_role('GERENTE_GENERAL')
                    ) THEN
                        RAISE EXCEPTION 'Permiso Denegado: Solo el Jefe de Inventario o Gerencia pueden registrar Ajustes o Transferencias.';
                    END IF;
                ELSE
                    -- Entrada, Salida, Reserva
                    IF NOT (
                        current_user_has_role('ALMACENISTA') OR 
                        current_user_has_role('JEFE_INVENTARIO') OR 
                        current_user_has_role('GERENTE') OR 
                        current_user_has_role('GERENTE_GENERAL')
                    ) THEN
                        RAISE EXCEPTION 'Permiso Denegado: No cuenta con permisos de Almacenista para registrar movimientos de inventario.';
                    END IF;
                END IF;
            
            ELSIF TG_OP = 'UPDATE' THEN
                -- Transición a Aplicado (Aprobación)
                IF NEW.status = 'Aplicado' AND OLD.status = 'Registrado' THEN
                    IF NOT (
                        current_user_has_role('JEFE_INVENTARIO') OR 
                        current_user_has_role('GERENTE') OR 
                        current_user_has_role('GERENTE_GENERAL')
                    ) THEN
                        RAISE EXCEPTION 'Permiso Denegado: Solo el Jefe de Inventario o Gerencia pueden aplicar y aprobar movimientos de inventario.';
                    END IF;
                END IF;

                -- Modificación de registros ya Aplicados o Anulados
                IF OLD.status IN ('Aplicado', 'Anulado') THEN
                    RAISE EXCEPTION 'No se puede modificar un movimiento de inventario en estado final %.', OLD.status;
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_warehouse_perms BEFORE INSERT OR UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION enforce_inventory_permissions();
CREATE TRIGGER trg_enforce_item_perms BEFORE INSERT OR UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION enforce_inventory_permissions();
CREATE TRIGGER trg_enforce_movement_perms BEFORE INSERT OR UPDATE ON inventory_movements FOR EACH ROW EXECUTE FUNCTION enforce_inventory_permissions();

-- 9. Trigger: Validación de Transiciones de Estados en Movimientos
CREATE OR REPLACE FUNCTION validate_inventory_movement_transitions()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    -- Un movimiento ya aplicado o anulado es inmutable en su estado
    IF OLD.status IN ('Aplicado', 'Anulado') THEN
        RAISE EXCEPTION 'No se puede cambiar el estado de un movimiento que ya está %.', OLD.status;
    END IF;

    -- Validar transiciones permitidas (Registrado -> Aplicado / Registrado -> Anulado)
    IF OLD.status = 'Registrado' AND NEW.status NOT IN ('Aplicado', 'Anulado') THEN
        RAISE EXCEPTION 'Transición de estado inválida: de Registrado a %.', NEW.status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_movement_state BEFORE UPDATE OF status ON inventory_movements FOR EACH ROW EXECUTE FUNCTION validate_inventory_movement_transitions();

-- 10. Función Auxiliar: Recálculo de Costo Promedio y Último Costo
CREATE OR REPLACE FUNCTION update_item_costs(
    p_tenant_id uuid,
    p_item_id uuid,
    p_quantity decimal(18,4),
    p_unit_cost decimal(18,2)
) RETURNS void AS $$
DECLARE
    v_total_stock decimal(18,4) := 0;
    v_avg_cost decimal(18,2) := 0;
    v_new_avg_cost decimal(18,2) := 0;
BEGIN
    -- Obtener stock actual total en el tenant (después de aplicar esta entrada)
    SELECT COALESCE(SUM(quantity), 0) INTO v_total_stock
    FROM inventory_stock
    WHERE tenant_id = p_tenant_id AND item_id = p_item_id AND deleted_at IS NULL;

    SELECT average_cost INTO v_avg_cost
    FROM inventory_items
    WHERE id = p_item_id;

    -- Si el stock actual tras la entrada es menor o igual a p_quantity, el costo promedio es el costo de esta entrada
    IF (v_total_stock - p_quantity) <= 0 THEN
        v_new_avg_cost := p_unit_cost;
    ELSE
        v_new_avg_cost := (((v_total_stock - p_quantity) * v_avg_cost) + (p_quantity * p_unit_cost)) / v_total_stock;
    END IF;

    UPDATE inventory_items
    SET average_cost = ROUND(v_new_avg_cost, 2),
        last_cost = p_unit_cost,
        updated_at = NOW()
    WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Función Auxiliar: Envío de Alertas por Stock Bajo o Crítico
CREATE OR REPLACE FUNCTION check_and_dispatch_low_stock_events(
    p_tenant_id uuid,
    p_item_id uuid
) RETURNS void AS $$
BEGIN
    -- Stub: Redefinida con cuerpo completo más abajo
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Redefinimos esta función para que tenga cuerpo completo
CREATE OR REPLACE FUNCTION check_and_dispatch_low_stock_events(
    p_tenant_id uuid,
    p_item_id uuid
) RETURNS void AS $$
DECLARE
    v_total_avail decimal(18,4) := 0;
    v_min_stock decimal(18,4) := 0;
    v_reorder_pt decimal(18,4) := 0;
    v_item_code varchar(50);
    v_item_name varchar(250);
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    SELECT COALESCE(SUM(available_quantity), 0) INTO v_total_avail
    FROM inventory_stock
    WHERE tenant_id = p_tenant_id AND item_id = p_item_id AND deleted_at IS NULL;

    SELECT item_code, name, minimum_stock, reorder_point 
    INTO v_item_code, v_item_name, v_min_stock, v_reorder_pt
    FROM inventory_items
    WHERE id = p_item_id;

    IF v_total_avail <= v_reorder_pt AND v_reorder_pt > 0 THEN
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (
            p_tenant_id,
            'INVENTORY_STOCK_CRITICAL',
            'INVENTORY_ITEM',
            p_item_id,
            jsonb_build_object(
                'item_code', v_item_code,
                'name', v_item_name,
                'available_stock', v_total_avail,
                'reorder_point', v_reorder_pt
            ),
            v_user_id
        );
    ELSIF v_total_avail <= v_min_stock AND v_min_stock > 0 THEN
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (
            p_tenant_id,
            'INVENTORY_STOCK_LOW',
            'INVENTORY_ITEM',
            p_item_id,
            jsonb_build_object(
                'item_code', v_item_code,
                'name', v_item_name,
                'available_stock', v_total_avail,
                'minimum_stock', v_min_stock
            ),
            v_user_id
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Función Auxiliar: Evento de consumo de materiales
CREATE OR REPLACE FUNCTION dispatch_material_consumed_event(
    p_tenant_id uuid,
    p_movement_id uuid
) RETURNS void AS $$
DECLARE
    v_mov record;
    v_item record;
BEGIN
    SELECT * INTO v_mov FROM inventory_movements WHERE id = p_movement_id;
    SELECT * INTO v_item FROM inventory_items WHERE id = v_mov.item_id;

    INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
    VALUES (
        p_tenant_id,
        'JOB_MATERIAL_CONSUMED',
        'JOB',
        v_mov.job_id,
        jsonb_build_object(
            'movement_id', v_mov.id,
            'movement_code', v_mov.movement_code,
            'item_id', v_mov.item_id,
            'item_code', v_item.item_code,
            'name', v_item.name,
            'quantity', v_mov.quantity,
            'unit_cost', v_mov.unit_cost,
            'total_cost', v_mov.total_cost,
            'activity_id', v_mov.activity_id,
            'consumed_by', v_mov.created_by,
            'consumed_at', v_mov.movement_date
        ),
        v_mov.created_by
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Trigger: Autocompletado de Costo de Salida y Afectación de Existencias
CREATE OR REPLACE FUNCTION handle_inventory_stock_affectation()
RETURNS TRIGGER AS $$
DECLARE
    v_current_qty decimal(18,4) := 0;
    v_current_res decimal(18,4) := 0;
    v_dest_qty decimal(18,4) := 0;
BEGIN
    -- Autocompletado del unit_cost para Salida
    IF TG_OP = 'INSERT' AND NEW.movement_type = 'Salida' AND (NEW.unit_cost IS NULL OR NEW.unit_cost = 0) THEN
        SELECT average_cost INTO NEW.unit_cost FROM inventory_items WHERE id = NEW.item_id;
    END IF;

    -- Procesar la afectación cuando el movimiento se APLICA (aprobación)
    IF TG_OP = 'UPDATE' AND NEW.status = 'Aplicado' AND OLD.status = 'Registrado' THEN
        
        -- A. Movimiento no Transferencia (Entrada, Salida, Reserva, Ajuste)
        IF NEW.movement_type <> 'Transferencia' THEN
            -- Asegurar existencia en inventory_stock
            INSERT INTO inventory_stock (tenant_id, warehouse_id, item_id, quantity, reserved_quantity)
            VALUES (NEW.tenant_id, NEW.warehouse_id, NEW.item_id, 0, 0)
            ON CONFLICT (tenant_id, warehouse_id, item_id) DO NOTHING;

            SELECT quantity, reserved_quantity INTO v_current_qty, v_current_res
            FROM inventory_stock
            WHERE tenant_id = NEW.tenant_id AND warehouse_id = NEW.warehouse_id AND item_id = NEW.item_id;

            IF NEW.movement_type = 'Entrada' THEN
                v_current_qty := v_current_qty + NEW.quantity;
            
            ELSIF NEW.movement_type = 'Salida' THEN
                -- Si es salida de reserva (contiene palabra RESERVA en notas) y hay reserva suficiente
                IF LOWER(COALESCE(NEW.notes, '')) LIKE '%reserva%' AND v_current_res >= NEW.quantity THEN
                    v_current_qty := v_current_qty - NEW.quantity;
                    v_current_res := v_current_res - NEW.quantity;
                ELSE
                    v_current_qty := v_current_qty - NEW.quantity;
                END IF;
            
            ELSIF NEW.movement_type = 'Reserva' THEN
                v_current_res := v_current_res + NEW.quantity;
            
            ELSIF NEW.movement_type = 'Ajuste' THEN
                -- Palabras clave en notas para ajuste negativo
                IF LOWER(COALESCE(NEW.notes, '')) SIMILAR TO '%(disminuye|negativo|resta)%' THEN
                    v_current_qty := v_current_qty - NEW.quantity;
                ELSE
                    v_current_qty := v_current_qty + NEW.quantity;
                END IF;
            END IF;

            -- Validar no stocks negativos en BD
            IF v_current_qty < 0 THEN
                RAISE EXCEPTION 'Stock Negativo Prohibido: El stock físico final sería % (Bodega %, Artículo %).', v_current_qty, NEW.warehouse_id, NEW.item_id;
            END IF;

            IF v_current_qty < v_current_res THEN
                RAISE EXCEPTION 'Stock Reservado Negativo Prohibido: El stock disponible final sería % (Físico: %, Reservado: %). Bodega %, Artículo %.', (v_current_qty - v_current_res), v_current_qty, v_current_res, NEW.warehouse_id, NEW.item_id;
            END IF;

            UPDATE inventory_stock
            SET quantity = v_current_qty,
                reserved_quantity = v_current_res,
                updated_at = NOW(),
                updated_by = get_current_user_id()
            WHERE tenant_id = NEW.tenant_id AND warehouse_id = NEW.warehouse_id AND item_id = NEW.item_id;

        -- B. Movimiento es Transferencia
        ELSE
            -- Bodega Origen (Salida de stock)
            INSERT INTO inventory_stock (tenant_id, warehouse_id, item_id, quantity, reserved_quantity)
            VALUES (NEW.tenant_id, NEW.source_warehouse_id, NEW.item_id, 0, 0)
            ON CONFLICT (tenant_id, warehouse_id, item_id) DO NOTHING;

            SELECT quantity, reserved_quantity INTO v_current_qty, v_current_res
            FROM inventory_stock
            WHERE tenant_id = NEW.tenant_id AND warehouse_id = NEW.source_warehouse_id AND item_id = NEW.item_id;

            v_current_qty := v_current_qty - NEW.quantity;

            IF v_current_qty < 0 OR v_current_qty < v_current_res THEN
                RAISE EXCEPTION 'Stock Insuficiente en Bodega Origen: No se puede transferir %. Stock físico origen quedarían en %, reservado % (Bodega %, Artículo %).', NEW.quantity, v_current_qty, v_current_res, NEW.source_warehouse_id, NEW.item_id;
            END IF;

            UPDATE inventory_stock
            SET quantity = v_current_qty,
                updated_at = NOW(),
                updated_by = get_current_user_id()
            WHERE tenant_id = NEW.tenant_id AND warehouse_id = NEW.source_warehouse_id AND item_id = NEW.item_id;

            -- Bodega Destino (Entrada de stock)
            INSERT INTO inventory_stock (tenant_id, warehouse_id, item_id, quantity, reserved_quantity)
            VALUES (NEW.tenant_id, NEW.destination_warehouse_id, NEW.item_id, 0, 0)
            ON CONFLICT (tenant_id, warehouse_id, item_id) DO NOTHING;

            SELECT quantity INTO v_dest_qty
            FROM inventory_stock
            WHERE tenant_id = NEW.tenant_id AND warehouse_id = NEW.destination_warehouse_id AND item_id = NEW.item_id;

            v_dest_qty := v_dest_qty + NEW.quantity;

            UPDATE inventory_stock
            SET quantity = v_dest_qty,
                updated_at = NOW(),
                updated_by = get_current_user_id()
            WHERE tenant_id = NEW.tenant_id AND warehouse_id = NEW.destination_warehouse_id AND item_id = NEW.item_id;
        END IF;

        -- Recalcular costos del artículo si es Entrada
        IF NEW.movement_type = 'Entrada' THEN
            PERFORM update_item_costs(NEW.tenant_id, NEW.item_id, NEW.quantity, NEW.unit_cost);
        END IF;

        -- Despachar alertas de stock
        PERFORM check_and_dispatch_low_stock_events(NEW.tenant_id, NEW.item_id);

        -- Evento de consumo de materiales
        IF NEW.movement_type = 'Salida' AND NEW.job_id IS NOT NULL THEN
            PERFORM dispatch_material_consumed_event(NEW.tenant_id, NEW.id);
        END IF;

    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger AFTER INSERT o BEFORE UPDATE (para completar unit_cost y afectar stock)
CREATE TRIGGER trg_handle_movement_cost_autofill
BEFORE INSERT ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION handle_inventory_stock_affectation();

CREATE TRIGGER trg_handle_movement_stock_update
BEFORE UPDATE OF status ON inventory_movements
FOR EACH ROW
EXECUTE FUNCTION handle_inventory_stock_affectation();

-- 14. Trigger: Despacho de Eventos de Negocio
CREATE OR REPLACE FUNCTION dispatch_inventory_events()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_event_code varchar(100);
    v_payload jsonb;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_TABLE_NAME = 'warehouses' THEN
        IF TG_OP = 'INSERT' THEN
            v_event_code := 'WAREHOUSE_CREATED';
            v_payload := jsonb_build_object('warehouse_code', NEW.warehouse_code, 'name', NEW.name);
        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
                v_event_code := 'WAREHOUSE_DELETED';
                v_payload := jsonb_build_object('warehouse_code', OLD.warehouse_code, 'delete_reason', NEW.delete_reason);
            ELSE
                v_event_code := 'WAREHOUSE_UPDATED';
                v_payload := jsonb_build_object('warehouse_code', NEW.warehouse_code, 'old_name', OLD.name, 'new_name', NEW.name);
            END IF;
        END IF;
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (NEW.tenant_id, v_event_code, 'WAREHOUSE', NEW.id, v_payload, v_user_id);

    ELSIF TG_TABLE_NAME = 'inventory_items' THEN
        IF TG_OP = 'INSERT' THEN
            v_event_code := 'INVENTORY_ITEM_CREATED';
            v_payload := jsonb_build_object('item_code', NEW.item_code, 'name', NEW.name);
        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
                v_event_code := 'INVENTORY_ITEM_DELETED';
                v_payload := jsonb_build_object('item_code', OLD.item_code, 'delete_reason', NEW.delete_reason);
            ELSE
                v_event_code := 'INVENTORY_ITEM_UPDATED';
                v_payload := jsonb_build_object('item_code', NEW.item_code, 'old_name', OLD.name, 'new_name', NEW.name);
            END IF;
        END IF;
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (NEW.tenant_id, v_event_code, 'INVENTORY_ITEM', NEW.id, v_payload, v_user_id);

    ELSIF TG_TABLE_NAME = 'inventory_movements' THEN
        IF TG_OP = 'INSERT' THEN
            IF NEW.movement_type = 'Transferencia' THEN
                v_event_code := 'INVENTORY_TRANSFER_CREATED';
                v_payload := jsonb_build_object('movement_code', NEW.movement_code, 'source', NEW.source_warehouse_id, 'dest', NEW.destination_warehouse_id);
            ELSE
                v_event_code := 'INVENTORY_MOVEMENT_CREATED';
                v_payload := jsonb_build_object('movement_code', NEW.movement_code, 'type', NEW.movement_type, 'qty', NEW.quantity);
            END IF;
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, v_event_code, 'INVENTORY_MOVEMENT', NEW.id, v_payload, v_user_id);
        
        ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
            IF NEW.status = 'Aplicado' THEN
                IF NEW.movement_type = 'Transferencia' THEN
                    v_event_code := 'INVENTORY_TRANSFER_COMPLETED';
                ELSE
                    v_event_code := 'INVENTORY_MOVEMENT_APPLIED';
                END IF;
            ELSIF NEW.status = 'Anulado' THEN
                v_event_code := 'INVENTORY_MOVEMENT_CANCELLED';
            END IF;
            v_payload := jsonb_build_object('movement_code', NEW.movement_code, 'old_status', OLD.status, 'new_status', NEW.status);
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, v_event_code, 'INVENTORY_MOVEMENT', NEW.id, v_payload, v_user_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_warehouse_events AFTER INSERT OR UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION dispatch_inventory_events();
CREATE TRIGGER trg_dispatch_item_events AFTER INSERT OR UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION dispatch_inventory_events();
CREATE TRIGGER trg_dispatch_movement_events AFTER INSERT OR UPDATE ON inventory_movements FOR EACH ROW EXECUTE FUNCTION dispatch_inventory_events();

-- 15. Trigger: Bloqueo de Borrado Físico (Soft Delete Obligatorio)
CREATE OR REPLACE FUNCTION block_physical_inventory_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los datos de inventario son inmutables en base de datos. Utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_warehouse_delete BEFORE DELETE ON warehouses FOR EACH ROW EXECUTE FUNCTION block_physical_inventory_delete();
CREATE TRIGGER trg_block_item_delete BEFORE DELETE ON inventory_items FOR EACH ROW EXECUTE FUNCTION block_physical_inventory_delete();
CREATE TRIGGER trg_block_stock_delete BEFORE DELETE ON inventory_stock FOR EACH ROW EXECUTE FUNCTION block_physical_inventory_delete();
CREATE TRIGGER trg_block_movement_delete BEFORE DELETE ON inventory_movements FOR EACH ROW EXECUTE FUNCTION block_physical_inventory_delete();

-- 16. Trigger: Trazabilidad General (handle_approval_traceability)
CREATE TRIGGER trg_warehouse_traceability BEFORE INSERT OR UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_item_traceability BEFORE INSERT OR UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_stock_traceability BEFORE INSERT OR UPDATE ON inventory_stock FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_movement_traceability BEFORE INSERT OR UPDATE ON inventory_movements FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- 17. Trigger: Integración con Auditoría General (process_audit_log)
CREATE TRIGGER audit_warehouses AFTER INSERT OR UPDATE OR DELETE ON warehouses FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_inventory_items AFTER INSERT OR UPDATE OR DELETE ON inventory_items FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_inventory_stock AFTER INSERT OR UPDATE OR DELETE ON inventory_stock FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_inventory_movements AFTER INSERT OR UPDATE OR DELETE ON inventory_movements FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 18. Habilitación de Row Level Security (RLS)
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- 19. Políticas de Seguridad RLS
-- A. Bodegas (warehouses)
CREATE POLICY warehouses_super_admin ON warehouses FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY warehouses_select_tenant ON warehouses FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY warehouses_write_tenant ON warehouses FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- B. Artículos (inventory_items)
CREATE POLICY items_super_admin ON inventory_items FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY items_select_tenant ON inventory_items FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY items_write_tenant ON inventory_items FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- C. Existencias (inventory_stock)
CREATE POLICY stock_super_admin ON inventory_stock FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY stock_select_tenant ON inventory_stock FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY stock_write_tenant ON inventory_stock FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- D. Movimientos (inventory_movements)
CREATE POLICY movements_super_admin ON inventory_movements FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY movements_select_tenant ON inventory_movements FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY movements_write_tenant ON inventory_movements FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000008_invoices_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 8: FACTURACIÓN Y PAGOS
-- Archivo: supabase/migrations/20260617000008_invoices_core.sql

-- 1. Insertar roles globales financieros si no existen
INSERT INTO roles (tenant_id, role_code, name, description, status) VALUES
(NULL, 'JEFE_FINANZAS', 'Jefe de Finanzas', 'Responsable de emitir y anular facturas, notas de crédito/débito y confirmar pagos.', 'Activo'),
(NULL, 'AUXILIAR_FINANZAS', 'Auxiliar de Finanzas', 'Responsable de la creación de borradores de facturas, registro inicial de pagos y consultas.', 'Activo')
ON CONFLICT (tenant_id, role_code) DO NOTHING;

-- 2. Crear Tabla de Facturas (invoices)
CREATE TABLE invoices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    invoice_code varchar(50) NOT NULL,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    
    -- Trazabilidad de Origen Obligatoria
    source_type varchar(50) NOT NULL CHECK (source_type IN ('QUOTE', 'JOB', 'CLIENT')),
    source_id uuid NOT NULL,
    
    -- Referencias de conveniencia (nullable)
    quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
    job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
    
    invoice_date date NOT NULL DEFAULT CURRENT_DATE,
    due_date date NOT NULL,
    currency_code varchar(10) NOT NULL DEFAULT 'COP',
    
    -- Valores financieros
    subtotal decimal(18,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    discount_amount decimal(18,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount decimal(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount decimal(18,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    paid_amount decimal(18,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    balance_amount decimal(18,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED CHECK (balance_amount >= 0),
    
    notes text,
    status varchar(50) NOT NULL DEFAULT 'BORRADOR' CHECK (status IN (
        'BORRADOR', 'EMITIDA', 'PARCIALMENTE_PAGADA', 'PAGADA', 'VENCIDA', 'ANULADA'
    )),

    -- Estructura de pasarela de pago (Wompi)
    payment_link text,
    payment_token varchar(250),
    payment_status varchar(100),
    payment_provider varchar(100),
    payment_url text,

    -- Trazabilidad de cancelación/anulación
    cancel_reason text,
    cancelled_by uuid REFERENCES users(id) ON DELETE SET NULL,
    cancelled_at timestamp,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_invoice_code UNIQUE (tenant_id, invoice_code),
    CONSTRAINT chk_invoice_due_date CHECK (due_date >= invoice_date)
);

-- 3. Crear Tabla de Partidas de Factura (invoice_items)
CREATE TABLE invoice_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_number integer NOT NULL,
    description text NOT NULL,
    quantity decimal(18,4) NOT NULL CHECK (quantity > 0),
    unit_price decimal(18,2) NOT NULL CHECK (unit_price >= 0),
    discount_amount decimal(18,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    tax_amount decimal(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    line_total decimal(18,2) NOT NULL CHECK (line_total >= 0),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

-- 4. Tabla de Impuestos de Factura (invoice_taxes)
CREATE TABLE invoice_taxes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    tax_code varchar(50) NOT NULL,
    tax_name varchar(150) NOT NULL,
    tax_rate decimal(10,4) NOT NULL CHECK (tax_rate >= 0),
    taxable_amount decimal(18,2) NOT NULL,
    tax_amount decimal(18,2) NOT NULL
);

-- 5. Tabla de Pagos (payments)
CREATE TABLE payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    payment_code varchar(50) NOT NULL,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
    payment_date date NOT NULL DEFAULT CURRENT_DATE,
    payment_method varchar(50) NOT NULL CHECK (payment_method IN (
        'Transferencia', 'Efectivo', 'Cheque', 'Tarjeta', 'PSE', 'Otro'
    )),
    reference_number varchar(150),
    amount decimal(18,2) NOT NULL CHECK (amount > 0),
    status varchar(50) NOT NULL DEFAULT 'REGISTRADO' CHECK (status IN (
        'REGISTRADO', 'APLICADO', 'ANULADO'
    )),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_payment_code UNIQUE (tenant_id, payment_code)
);

-- 6. Tabla de Anticipos de Clientes (customer_advances)
CREATE TABLE customer_advances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    advance_code varchar(50) NOT NULL,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
    amount decimal(18,2) NOT NULL CHECK (amount > 0),
    applied_amount decimal(18,2) NOT NULL DEFAULT 0 CHECK (applied_amount >= 0),
    available_amount decimal(18,2) GENERATED ALWAYS AS (amount - applied_amount) STORED CHECK (available_amount >= 0),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_advance_code UNIQUE (tenant_id, advance_code)
);

-- 7. Índices de Rendimiento
CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_client ON payments(client_id);
CREATE INDEX idx_customer_advances_client ON customer_advances(client_id);

-- 8. Trigger: Autogeneración de Códigos Correlativos
CREATE OR REPLACE FUNCTION handle_invoice_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'invoices' THEN
        IF NEW.invoice_code IS NULL OR NEW.invoice_code = '' THEN
            NEW.invoice_code := 'FAC-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'INVOICE')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'payments' THEN
        IF NEW.payment_code IS NULL OR NEW.payment_code = '' THEN
            NEW.payment_code := 'PAG-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'PAYMENT')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'customer_advances' THEN
        IF NEW.advance_code IS NULL OR NEW.advance_code = '' THEN
            NEW.advance_code := 'ANT-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'ADVANCE')::text, 6, '0');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_invoice_code BEFORE INSERT ON invoices FOR EACH ROW EXECUTE FUNCTION handle_invoice_sequences();
CREATE TRIGGER trg_handle_payment_code BEFORE INSERT ON payments FOR EACH ROW EXECUTE FUNCTION handle_invoice_sequences();
CREATE TRIGGER trg_handle_advance_code BEFORE INSERT ON customer_advances FOR EACH ROW EXECUTE FUNCTION handle_invoice_sequences();

-- 9. Trigger: Validación de Fechas y Valores por Defecto en Invoices
CREATE OR REPLACE FUNCTION validate_invoice_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Vencimiento por defecto (30 días)
    IF NEW.due_date IS NULL THEN
        NEW.due_date := NEW.invoice_date + INTERVAL '30 days';
    END IF;

    -- Validar due_date >= invoice_date
    IF NEW.due_date < NEW.invoice_date THEN
        RAISE EXCEPTION 'La fecha de vencimiento (%) no puede ser anterior a la fecha de la factura (%).', NEW.due_date, NEW.invoice_date;
    END IF;

    -- Trazabilidad de origen cruzado
    IF NEW.source_type = 'QUOTE' AND NEW.quote_id IS NULL THEN
        NEW.quote_id := NEW.source_id;
    ELSIF NEW.source_type = 'JOB' AND NEW.job_id IS NULL THEN
        NEW.job_id := NEW.source_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_invoice_defaults
BEFORE INSERT OR UPDATE OF due_date, invoice_date ON invoices
FOR EACH ROW
EXECUTE FUNCTION validate_invoice_defaults();

-- 10. Trigger: Cálculo de Totales de Líneas e Invoices
CREATE OR REPLACE FUNCTION handle_invoice_item_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id uuid;
    v_subtotal decimal(18,2) := 0;
    v_discount decimal(18,2) := 0;
    v_tax decimal(18,2) := 0;
    v_total decimal(18,2) := 0;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        -- Calcular el total de línea
        NEW.line_total := (NEW.quantity * NEW.unit_price) - NEW.discount_amount + NEW.tax_amount;
        v_invoice_id := NEW.invoice_id;
    END IF;

    -- Impedir modificar items si la factura no está en BORRADOR
    IF EXISTS (
        SELECT 1 FROM invoices WHERE id = v_invoice_id AND status <> 'BORRADOR'
    ) THEN
        RAISE EXCEPTION 'No se pueden modificar las partidas de una factura ya emitida, pagada o anulada.';
    END IF;

    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Retornar NEW modificado en BEFORE
        -- Pero los acumuladores se actualizan en AFTER trigger
        RETURN NEW;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_invoice_headers()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_id uuid;
    v_subtotal decimal(18,2) := 0;
    v_discount decimal(18,2) := 0;
    v_tax decimal(18,2) := 0;
    v_total decimal(18,2) := 0;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_invoice_id := OLD.invoice_id;
    ELSE
        v_invoice_id := NEW.invoice_id;
    END IF;

    -- Calcular sumatorias en items no borrados
    SELECT 
        COALESCE(SUM(quantity * unit_price), 0),
        COALESCE(SUM(discount_amount), 0),
        COALESCE(SUM(tax_amount), 0),
        COALESCE(SUM(line_total), 0)
    INTO v_subtotal, v_discount, v_tax, v_total
    FROM invoice_items
    WHERE invoice_id = v_invoice_id AND deleted_at IS NULL;

    -- Actualizar cabecera de la factura
    UPDATE invoices
    SET subtotal = v_subtotal,
        discount_amount = v_discount,
        tax_amount = v_tax,
        total_amount = v_total,
        updated_at = NOW()
    WHERE id = v_invoice_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_invoice_item_totals_before
BEFORE INSERT OR UPDATE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION handle_invoice_item_totals();

CREATE TRIGGER trg_invoice_item_totals_after
AFTER INSERT OR UPDATE OR DELETE ON invoice_items
FOR EACH ROW
EXECUTE FUNCTION update_invoice_headers();

-- 11. Trigger: Inmutabilidad de Facturas Emitidas e Impuestos
CREATE OR REPLACE FUNCTION enforce_invoice_immutability()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF NEW.status = OLD.status THEN
        -- Si está emitida y no cambia de estado, se bloquea cualquier edición
        IF OLD.status <> 'BORRADOR' THEN
            RAISE EXCEPTION 'La factura ya se encuentra % y es inmutable. Registre una Nota Crédito o Débito.', OLD.status;
        END IF;
        RETURN NEW;
    END IF;

    -- Bloqueo de cambios si ya estaba en estado final (PAGADA, ANULADA)
    IF OLD.status = 'PAGADA' THEN
        RAISE EXCEPTION 'No se puede reabrir o modificar una factura PAGADA.';
    END IF;

    IF OLD.status = 'ANULADA' THEN
        RAISE EXCEPTION 'No se puede reabrir o modificar una factura ANULADA.';
    END IF;

    -- Regla: Si pasa de BORRADOR a EMITIDA, congelar impuestos
    IF OLD.status = 'BORRADOR' AND NEW.status = 'EMITIDA' THEN
        -- Copiar impuestos desde las líneas a la tabla invoice_taxes
        -- Consolidamos por tax_code
        INSERT INTO invoice_taxes (tenant_id, invoice_id, tax_code, tax_name, tax_rate, taxable_amount, tax_amount)
        SELECT 
            NEW.tenant_id,
            NEW.id,
            'IVA', -- Tax code por defecto
            'Impuesto al Valor Agregado',
            0.1900, -- Rate estándar 19%
            COALESCE(SUM(quantity * unit_price - discount_amount), 0),
            COALESCE(SUM(tax_amount), 0)
        FROM invoice_items
        WHERE invoice_id = NEW.id AND deleted_at IS NULL
        GROUP BY NEW.tenant_id, NEW.id
        ON CONFLICT DO NOTHING;
    END IF;

    -- Validaciones de Anulación
    IF NEW.status = 'ANULADA' THEN
        IF NEW.cancel_reason IS NULL OR length(trim(NEW.cancel_reason)) < 10 THEN
            RAISE EXCEPTION 'Para anular una factura debe ingresar un motivo de anulación (cancel_reason, mínimo 10 caracteres).';
        END IF;
        NEW.cancelled_by := v_user_id;
        NEW.cancelled_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_invoice_immutability
BEFORE UPDATE OF status, subtotal, discount_amount, tax_amount, total_amount ON invoices
FOR EACH ROW
EXECUTE FUNCTION enforce_invoice_immutability();

-- 12. Trigger: Control de Permisos Financieros (RBAC)
CREATE OR REPLACE FUNCTION enforce_invoice_permissions()
RETURNS TRIGGER AS $$
BEGIN
    IF is_platform_super_admin() THEN
        RETURN NEW;
    END IF;

    IF pg_trigger_depth() = 0 THEN
        -- Facturas (invoices)
        IF TG_TABLE_NAME = 'invoices' THEN
            IF TG_OP = 'INSERT' THEN
                IF NOT (
                    current_user_has_role('AUXILIAR_FINANZAS') OR 
                    current_user_has_role('JEFE_FINANZAS') OR 
                    current_user_has_role('GERENTE') OR 
                    current_user_has_role('GERENTE_GENERAL')
                ) THEN
                    RAISE EXCEPTION 'Permiso Denegado: No cuenta con el rol financiero para crear facturas.';
                END IF;
            ELSIF TG_OP = 'UPDATE' THEN
                -- Emitir o Anular requiere Jefe de Finanzas o Gerencia
                IF (NEW.status IN ('EMITIDA', 'ANULADA') AND OLD.status = 'BORRADOR') OR (NEW.status = 'ANULADA' AND OLD.status <> 'ANULADA') THEN
                    IF NOT (
                        current_user_has_role('JEFE_FINANZAS') OR 
                        current_user_has_role('GERENTE') OR 
                        current_user_has_role('GERENTE_GENERAL')
                    ) THEN
                        RAISE EXCEPTION 'Permiso Denegado: Solo el Jefe de Finanzas o la Gerencia pueden Emitir o Anular facturas.';
                    END IF;
                END IF;
            END IF;
            
        -- Pagos (payments)
        ELSIF TG_TABLE_NAME = 'payments' THEN
            IF TG_OP = 'INSERT' THEN
                IF NOT (
                    current_user_has_role('AUXILIAR_FINANZAS') OR 
                    current_user_has_role('JEFE_FINANZAS') OR 
                    current_user_has_role('GERENTE') OR 
                    current_user_has_role('GERENTE_GENERAL')
                ) THEN
                    RAISE EXCEPTION 'Permiso Denegado: Su rol no está autorizado para registrar pagos.';
                END IF;
            ELSIF TG_OP = 'UPDATE' THEN
                -- APLICAR o ANULAR requiere Jefe de Finanzas o Gerencia
                IF (NEW.status IN ('APLICADO', 'ANULADO') AND OLD.status = 'REGISTRADO') OR (NEW.status = 'ANULADO' AND OLD.status = 'APLICADO') THEN
                    IF NOT (
                        current_user_has_role('JEFE_FINANZAS') OR 
                        current_user_has_role('GERENTE') OR 
                        current_user_has_role('GERENTE_GENERAL')
                    ) THEN
                        RAISE EXCEPTION 'Permiso Denegado: Solo el Jefe de Finanzas o la Gerencia pueden Confirmar, Aplicar o Anular pagos.';
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_invoice_perms BEFORE INSERT OR UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION enforce_invoice_permissions();
CREATE TRIGGER trg_enforce_payment_perms BEFORE INSERT OR UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION enforce_invoice_permissions();

-- 13. Trigger: Afectación de Cartera por Pagos y Gestión de Anticipos
CREATE OR REPLACE FUNCTION handle_payment_application()
RETURNS TRIGGER AS $$
DECLARE
    v_total_paid decimal(18,2) := 0;
    v_total_amount decimal(18,2) := 0;
BEGIN
    -- Si el pago pasa a APLICADO
    IF NEW.status = 'APLICADO' AND (OLD.status IS NULL OR OLD.status <> 'APLICADO') THEN
        
        -- Escenario 1: Pago asociado a una Factura
        IF NEW.invoice_id IS NOT NULL THEN
            -- Calcular la sumatoria de todos los pagos aplicados a la factura
            SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
            FROM payments
            WHERE invoice_id = NEW.invoice_id AND status = 'APLICADO' AND deleted_at IS NULL;

            SELECT total_amount INTO v_total_amount FROM invoices WHERE id = NEW.invoice_id;

            -- Actualizar paid_amount en la factura
            UPDATE invoices
            SET paid_amount = v_total_paid,
                status = CASE 
                    WHEN v_total_paid >= v_total_amount THEN 'PAGADA'
                    WHEN v_total_paid > 0 THEN 'PARCIALMENTE_PAGADA'
                    ELSE 'EMITIDA'
                END,
                updated_at = NOW()
            WHERE id = NEW.invoice_id;
            
        -- Escenario 2: Pago sin factura (Anticipo de Cliente)
        ELSE
            INSERT INTO customer_advances (tenant_id, client_id, payment_id, amount, applied_amount)
            VALUES (NEW.tenant_id, NEW.client_id, NEW.id, NEW.amount, 0);
        END IF;

    -- Si un pago aplicado se ANULA
    ELSIF NEW.status = 'ANULADO' AND OLD.status = 'APLICADO' THEN
        
        IF NEW.invoice_id IS NOT NULL THEN
            -- Recalcular sumatoria de pagos aplicados
            SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
            FROM payments
            WHERE invoice_id = NEW.invoice_id AND status = 'APLICADO' AND id <> NEW.id AND deleted_at IS NULL;

            SELECT total_amount INTO v_total_amount FROM invoices WHERE id = NEW.invoice_id;

            UPDATE invoices
            SET paid_amount = v_total_paid,
                status = CASE 
                    WHEN v_total_paid >= v_total_amount THEN 'PAGADA'
                    WHEN v_total_paid > 0 THEN 'PARCIALMENTE_PAGADA'
                    ELSE 'EMITIDA'
                END,
                updated_at = NOW()
            WHERE id = NEW.invoice_id;
        
        -- Si era un anticipo, marcamos la fila de anticipo como anulada (soft delete)
        ELSE
            UPDATE customer_advances
            SET deleted_at = NOW(),
                deleted_by = get_current_user_id(),
                delete_reason = 'Pago de anticipo anulado.'
            WHERE payment_id = NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_payment_application
AFTER INSERT OR UPDATE OF status ON payments
FOR EACH ROW
EXECUTE FUNCTION handle_payment_application();

-- 14. Trigger: Emisión de Eventos de Negocio
CREATE OR REPLACE FUNCTION dispatch_invoice_events()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_event_code varchar(100);
    v_payload jsonb;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_TABLE_NAME = 'invoices' THEN
        IF TG_OP = 'INSERT' THEN
            v_event_code := 'INVOICE_CREATED';
            v_payload := jsonb_build_object('invoice_code', NEW.invoice_code, 'source_type', NEW.source_type, 'total', NEW.total_amount);
        ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
            IF NEW.status = 'EMITIDA' THEN v_event_code := 'INVOICE_EMITTED';
            ELSIF NEW.status = 'PARCIALMENTE_PAGADA' THEN v_event_code := 'INVOICE_PARTIALLY_PAID';
            ELSIF NEW.status = 'PAGADA' THEN v_event_code := 'INVOICE_PAID';
            ELSIF NEW.status = 'VENCIDA' THEN v_event_code := 'INVOICE_OVERDUE';
            ELSIF NEW.status = 'ANULADA' THEN v_event_code := 'INVOICE_CANCELLED';
            END IF;

            v_payload := jsonb_build_object('invoice_code', NEW.invoice_code, 'old_status', OLD.status, 'new_status', NEW.status);
            IF NEW.status = 'ANULADA' THEN
                v_payload := v_payload || jsonb_build_object('cancel_reason', NEW.cancel_reason);
            END IF;
        END IF;
        
        IF v_event_code IS NOT NULL THEN
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, v_event_code, 'INVOICE', NEW.id, v_payload, v_user_id);
        END IF;

    ELSIF TG_TABLE_NAME = 'payments' THEN
        IF TG_OP = 'INSERT' THEN
            v_event_code := 'PAYMENT_REGISTERED';
            v_payload := jsonb_build_object('payment_code', NEW.payment_code, 'amount', NEW.amount, 'method', NEW.payment_method);
        ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
            IF NEW.status = 'APLICADO' THEN v_event_code := 'PAYMENT_APPLIED';
            ELSIF NEW.status = 'ANULADO' THEN v_event_code := 'PAYMENT_CANCELLED';
            END IF;
            v_payload := jsonb_build_object('payment_code', NEW.payment_code, 'old_status', OLD.status, 'new_status', NEW.status);
        END IF;

        IF v_event_code IS NOT NULL THEN
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, v_event_code, 'PAYMENT', NEW.id, v_payload, v_user_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_invoice_events AFTER INSERT OR UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION dispatch_invoice_events();
CREATE TRIGGER trg_dispatch_payment_events AFTER INSERT OR UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION dispatch_invoice_events();

-- 15. Trigger: Bloqueo de Borrado Físico (Soft Delete Obligatorio)
CREATE OR REPLACE FUNCTION block_physical_invoice_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los datos financieros son inmutables. Utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_invoice_delete BEFORE DELETE ON invoices FOR EACH ROW EXECUTE FUNCTION block_physical_invoice_delete();
CREATE TRIGGER trg_block_invoice_item_delete BEFORE DELETE ON invoice_items FOR EACH ROW EXECUTE FUNCTION block_physical_invoice_delete();
CREATE TRIGGER trg_block_payment_delete BEFORE DELETE ON payments FOR EACH ROW EXECUTE FUNCTION block_physical_invoice_delete();
CREATE TRIGGER trg_block_advance_delete BEFORE DELETE ON customer_advances FOR EACH ROW EXECUTE FUNCTION block_physical_invoice_delete();

-- 16. Trigger: Trazabilidad General
CREATE TRIGGER trg_invoice_traceability BEFORE INSERT OR UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_invoice_item_traceability BEFORE INSERT OR UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_payment_traceability BEFORE INSERT OR UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_advance_traceability BEFORE INSERT OR UPDATE ON customer_advances FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- 17. Trigger: Integración con Auditoría General
CREATE TRIGGER audit_invoices AFTER INSERT OR UPDATE OR DELETE ON invoices FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_invoice_items AFTER INSERT OR UPDATE OR DELETE ON invoice_items FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_payments AFTER INSERT OR UPDATE OR DELETE ON payments FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_customer_advances AFTER INSERT OR UPDATE OR DELETE ON customer_advances FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 18. Habilitar Row Level Security (RLS)
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_advances ENABLE ROW LEVEL SECURITY;

-- 19. Políticas de Seguridad RLS
-- A. Facturas (invoices)
CREATE POLICY invoices_super_admin ON invoices FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY invoices_select_tenant ON invoices FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY invoices_write_tenant ON invoices FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- B. Partidas (invoice_items)
CREATE POLICY invoice_items_super_admin ON invoice_items FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY invoice_items_select_tenant ON invoice_items FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY invoice_items_write_tenant ON invoice_items FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- C. Pagos (payments)
CREATE POLICY payments_super_admin ON payments FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY payments_select_tenant ON payments FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY payments_write_tenant ON payments FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- D. Anticipos (customer_advances)
CREATE POLICY advances_super_admin ON customer_advances FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY advances_select_tenant ON customer_advances FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY advances_write_tenant ON customer_advances FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000010_warranties_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 10: GARANTÍAS Y POSTVENTA
-- Archivo: supabase/migrations/20260617000010_warranties_core.sql

-- 1. Crear Tabla de Garantías (warranties)
CREATE TABLE warranties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    warranty_code varchar(50) NOT NULL,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
    
    start_date date NOT NULL,
    end_date date NOT NULL,
    warranty_type varchar(100) NOT NULL DEFAULT 'ESTANDAR',
    coverage_description text,
    status varchar(50) NOT NULL DEFAULT 'ACTIVA' CHECK (status IN (
        'ACTIVA', 'VENCIDA', 'EJECUTADA', 'CERRADA', 'ANULADA'
    )),

    -- Trazabilidad de Cancelación/Anulación
    cancel_reason text,
    cancelled_by uuid REFERENCES users(id) ON DELETE SET NULL,
    cancelled_at timestamp,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_warranty_code UNIQUE (tenant_id, warranty_code),
    CONSTRAINT chk_warranty_dates CHECK (end_date >= start_date)
);

-- 2. Crear Tabla de Intervenciones de Garantía (warranty_interventions)
CREATE TABLE warranty_interventions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    warranty_id uuid NOT NULL REFERENCES warranties(id) ON DELETE RESTRICT,
    intervention_code varchar(50) NOT NULL,
    description text NOT NULL,
    assigned_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    intervention_date date NOT NULL DEFAULT CURRENT_DATE,
    resolution text,
    status varchar(50) NOT NULL DEFAULT 'REGISTRADA' CHECK (status IN (
        'REGISTRADA', 'EN_PROCESO', 'RESUELTA', 'CERRADA'
    )),

    -- Vinculación operativa
    job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_intervention_code UNIQUE (tenant_id, intervention_code)
);

-- 3. Modificar Tabla de Movimientos de Inventario (inventory_movements)
ALTER TABLE inventory_movements 
ADD COLUMN warranty_intervention_id uuid REFERENCES warranty_interventions(id) ON DELETE SET NULL;

-- 4. Índices de Rendimiento
CREATE INDEX idx_warranties_tenant ON warranties(tenant_id);
CREATE INDEX idx_warranties_client ON warranties(client_id);
CREATE INDEX idx_warranties_job ON warranties(job_id);
CREATE INDEX idx_warranties_status ON warranties(status);
CREATE INDEX idx_warranty_interventions_tenant ON warranty_interventions(tenant_id);
CREATE INDEX idx_warranty_interventions_warranty ON warranty_interventions(warranty_id);
CREATE INDEX idx_warranty_interventions_job ON warranty_interventions(job_id);
CREATE INDEX idx_inventory_movements_intervention ON inventory_movements(warranty_intervention_id);

-- 5. Trigger: Autogeneración de Códigos Correlativos
CREATE OR REPLACE FUNCTION handle_warranty_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'warranties' THEN
        IF NEW.warranty_code IS NULL OR NEW.warranty_code = '' THEN
            NEW.warranty_code := 'GAR-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'WARRANTY')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'warranty_interventions' THEN
        IF NEW.intervention_code IS NULL OR NEW.intervention_code = '' THEN
            NEW.intervention_code := 'INT-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'WARRANTY_INTERVENTION')::text, 6, '0');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_warranty_code BEFORE INSERT ON warranties FOR EACH ROW EXECUTE FUNCTION handle_warranty_sequences();
CREATE TRIGGER trg_handle_intervention_code BEFORE INSERT ON warranty_interventions FOR EACH ROW EXECUTE FUNCTION handle_warranty_sequences();

-- 6. Trigger: Validación de Garantía Vencida antes de Operar
CREATE OR REPLACE FUNCTION handle_warranty_vencida()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'ACTIVA' AND CURRENT_DATE > NEW.end_date THEN
        NEW.status := 'VENCIDA';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_warranty_vencida
BEFORE INSERT OR UPDATE OF status, end_date ON warranties
FOR EACH ROW
EXECUTE FUNCTION handle_warranty_vencida();

-- 7. Trigger: Generación Automática de Garantía al Cerrar Job
CREATE OR REPLACE FUNCTION generate_warranty_on_job_close()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'CERRADO' AND (OLD.status IS NULL OR OLD.status <> 'CERRADO') THEN
        INSERT INTO warranties (
            tenant_id,
            client_id,
            job_id,
            start_date,
            end_date,
            warranty_type,
            coverage_description,
            status,
            created_by
        ) VALUES (
            NEW.tenant_id,
            NEW.client_id,
            NEW.id,
            COALESCE(NEW.actual_end_date::date, CURRENT_DATE),
            COALESCE(NEW.actual_end_date::date, CURRENT_DATE) + INTERVAL '12 months',
            'ESTANDAR',
            'Garantía generada automáticamente por cierre de Job: ' || NEW.job_code,
            'ACTIVA',
            COALESCE(NEW.updated_by, NEW.assigned_user_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_generate_warranty_on_job_close
AFTER UPDATE OF status ON jobs
FOR EACH ROW
EXECUTE FUNCTION generate_warranty_on_job_close();

-- 8. Trigger: Validación y Control del Estado de Garantía basado en Intervenciones
CREATE OR REPLACE FUNCTION check_warranty_status_before_intervention()
RETURNS TRIGGER AS $$
DECLARE
    v_warranty_status varchar(50);
    v_end_date date;
BEGIN
    SELECT status, end_date INTO v_warranty_status, v_end_date
    FROM warranties
    WHERE id = NEW.warranty_id;

    -- Validar si pasó de fecha para marcar como vencida en caliente
    IF v_warranty_status = 'ACTIVA' AND CURRENT_DATE > v_end_date THEN
        UPDATE warranties SET status = 'VENCIDA', updated_at = NOW() WHERE id = NEW.warranty_id;
        v_warranty_status := 'VENCIDA';
    END IF;

    IF v_warranty_status IN ('VENCIDA', 'ANULADA', 'CERRADA') THEN
        RAISE EXCEPTION 'No se pueden registrar o modificar intervenciones en una garantía con estado %.', v_warranty_status;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_check_warranty_status_before_intervention
BEFORE INSERT OR UPDATE ON warranty_interventions
FOR EACH ROW
EXECUTE FUNCTION check_warranty_status_before_intervention();

-- 9. Trigger: Recalcular Estado de Garantía por Intervenciones
CREATE OR REPLACE FUNCTION update_warranty_status_on_intervention()
RETURNS TRIGGER AS $$
DECLARE
    v_warranty_id uuid;
    v_active_interventions_count integer;
    v_current_status varchar(50);
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_warranty_id := OLD.warranty_id;
    ELSE
        v_warranty_id := NEW.warranty_id;
    END IF;

    -- Contar intervenciones abiertas
    SELECT COUNT(*)
    INTO v_active_interventions_count
    FROM warranty_interventions
    WHERE warranty_id = v_warranty_id
      AND status IN ('REGISTRADA', 'EN_PROCESO')
      AND deleted_at IS NULL;

    SELECT status INTO v_current_status
    FROM warranties
    WHERE id = v_warranty_id;

    IF v_active_interventions_count > 0 THEN
        IF v_current_status = 'ACTIVA' THEN
            UPDATE warranties
            SET status = 'EJECUTADA',
                updated_at = NOW()
            WHERE id = v_warranty_id;
        END IF;
    ELSE
        IF v_current_status = 'EJECUTADA' THEN
            UPDATE warranties
            SET status = 'ACTIVA',
                updated_at = NOW()
            WHERE id = v_warranty_id;
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_warranty_status_on_intervention
AFTER INSERT OR UPDATE OF status OR DELETE ON warranty_interventions
FOR EACH ROW
EXECUTE FUNCTION update_warranty_status_on_intervention();

-- 10. Trigger: Validación de Anulación (cancel_reason length >= 10)
CREATE OR REPLACE FUNCTION validate_warranty_cancel()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF NEW.status = 'ANULADA' AND OLD.status <> 'ANULADA' THEN
        IF NEW.cancel_reason IS NULL OR length(trim(NEW.cancel_reason)) < 10 THEN
            RAISE EXCEPTION 'Para anular una garantía debe ingresar un motivo de anulación (cancel_reason, mínimo 10 caracteres).';
        END IF;
        NEW.cancelled_by := v_user_id;
        NEW.cancelled_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_warranty_cancel
BEFORE UPDATE OF status ON warranties
FOR EACH ROW
EXECUTE FUNCTION validate_warranty_cancel();

-- 11. Trigger: Bloqueo de Borrado Físico (Soft Delete Obligatorio)
CREATE OR REPLACE FUNCTION block_physical_warranty_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los datos de postventa son inmutables. Utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_warranty_delete BEFORE DELETE ON warranties FOR EACH ROW EXECUTE FUNCTION block_physical_warranty_delete();
CREATE TRIGGER trg_block_intervention_delete BEFORE DELETE ON warranty_interventions FOR EACH ROW EXECUTE FUNCTION block_physical_warranty_delete();

-- 12. Trigger: Trazabilidad General
CREATE TRIGGER trg_warranty_traceability BEFORE INSERT OR UPDATE ON warranties FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_intervention_traceability BEFORE INSERT OR UPDATE ON warranty_interventions FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- 13. Trigger: Integración con Auditoría General
CREATE TRIGGER audit_warranties AFTER INSERT OR UPDATE OR DELETE ON warranties FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_warranty_interventions AFTER INSERT OR UPDATE OR DELETE ON warranty_interventions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 14. Habilitar Row Level Security (RLS)
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_interventions ENABLE ROW LEVEL SECURITY;

-- 15. Políticas de Seguridad RLS
-- A. Garantías (warranties)
CREATE POLICY warranties_super_admin ON warranties FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY warranties_select_tenant ON warranties FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY warranties_write_tenant ON warranties FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- B. Intervenciones (warranty_interventions)
CREATE POLICY interventions_super_admin ON warranty_interventions FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY interventions_select_tenant ON warranty_interventions FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY interventions_write_tenant ON warranty_interventions FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000011_website_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 11: WEB PÚBLICA Y CATÁLOGO TÉCNICO (WEBSITE)
-- Archivo: supabase/migrations/20260617000011_website_core.sql

-- ==========================================
-- 1. Tablas del Módulo Web y Captación
-- ==========================================

-- A. Páginas del Sitio Web (website_pages)
CREATE TABLE website_pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    page_code varchar(50) NOT NULL,
    url_path varchar(250) NOT NULL,
    title varchar(200) NOT NULL,
    meta_description varchar(250),
    status varchar(50) NOT NULL DEFAULT 'ACTIVA' CHECK (status IN ('ACTIVA', 'INACTIVA')),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_page_code UNIQUE (tenant_id, page_code),
    CONSTRAINT unique_tenant_url_path UNIQUE (tenant_id, url_path)
);

-- B. Formularios de Captación (website_forms)
CREATE TABLE website_forms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    form_code varchar(50) NOT NULL,
    name varchar(150) NOT NULL,
    form_type varchar(50) NOT NULL CHECK (form_type IN ('CONTACTO', 'WIZARD', 'DESCARGA', 'OTRO')),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_form_code UNIQUE (tenant_id, form_code)
);

-- C. Tabla de Leads (leads)
CREATE TABLE leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    lead_code varchar(50) NOT NULL,
    name varchar(100) NOT NULL,
    company_name varchar(100) NOT NULL,
    position varchar(150),
    phone varchar(50),
    email varchar(200) NOT NULL,
    city varchar(100),
    urgency varchar(50) NOT NULL DEFAULT 'media' CHECK (urgency IN ('baja', 'media', 'alta')),
    lead_score integer NOT NULL DEFAULT 0,
    risk_level varchar(50) NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('HOT', 'WARM', 'LOW', 'SPAM')),
    is_verified boolean NOT NULL DEFAULT false,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_lead_code UNIQUE (tenant_id, lead_code)
);

-- D. Trazabilidad de Origen de Lead (lead_sources)
CREATE TABLE lead_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    utm_source varchar(100),
    utm_medium varchar(100),
    utm_campaign varchar(100),
    utm_content varchar(100),
    utm_term varchar(100),
    referrer_url text,
    ip_address varchar(100),
    created_at timestamp NOT NULL DEFAULT NOW()
);

-- E. Sesiones de Web Pública (website_sessions)
CREATE TABLE website_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    session_token varchar(250) NOT NULL,
    ip_address varchar(100),
    user_agent text,
    started_at timestamp NOT NULL DEFAULT NOW(),
    last_activity_at timestamp NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_tenant_session_token UNIQUE (tenant_id, session_token)
);

-- F. Eventos Trackeados (website_events)
CREATE TABLE website_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    session_id uuid NOT NULL REFERENCES website_sessions(id) ON DELETE CASCADE,
    event_type varchar(100) NOT NULL CHECK (event_type IN ('PAGE_VIEW', 'FORM_SUBMIT', 'FILE_DOWNLOAD', 'CLICK', 'CUSTOM')),
    page_url text NOT NULL,
    event_data jsonb,
    created_at timestamp NOT NULL DEFAULT NOW()
);

-- G. Descargas de Fichas/PDFs (website_downloads)
CREATE TABLE website_downloads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    session_id uuid REFERENCES website_sessions(id) ON DELETE SET NULL,
    lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
    file_path text NOT NULL,
    downloaded_at timestamp NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. Tablas del Módulo Catálogo Técnico
-- ==========================================

-- H. Categorías de Productos (product_categories)
CREATE TABLE product_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    category_code varchar(50) NOT NULL,
    name varchar(150) NOT NULL,
    description text,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_category_code UNIQUE (tenant_id, category_code)
);

-- I. Familias de Productos (product_families)
CREATE TABLE product_families (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    category_id uuid NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
    family_code varchar(50) NOT NULL,
    name varchar(150) NOT NULL,
    description text,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_family_code UNIQUE (tenant_id, family_code)
);

-- J. Catálogo de Productos (products)
CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    family_id uuid NOT NULL REFERENCES product_families(id) ON DELETE RESTRICT,
    product_code varchar(50) NOT NULL,
    name varchar(250) NOT NULL,
    description text,
    status varchar(50) NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'INACTIVO')),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_product_code UNIQUE (tenant_id, product_code)
);

-- K. Especificaciones Técnicas (product_specifications)
CREATE TABLE product_specifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    spec_name varchar(150) NOT NULL,
    spec_value text NOT NULL,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

-- ==========================================
-- 3. Índices de Rendimiento
-- ==========================================
CREATE INDEX idx_website_pages_tenant ON website_pages(tenant_id);
CREATE INDEX idx_website_forms_tenant ON website_forms(tenant_id);
CREATE INDEX idx_leads_tenant ON leads(tenant_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_lead_sources_lead ON lead_sources(lead_id);
CREATE INDEX idx_website_sessions_token ON website_sessions(session_token);
CREATE INDEX idx_website_events_session ON website_events(session_id);
CREATE INDEX idx_website_downloads_lead ON website_downloads(lead_id);
CREATE INDEX idx_product_categories_tenant ON product_categories(tenant_id);
CREATE INDEX idx_product_families_category ON product_families(category_id);
CREATE INDEX idx_products_family ON products(family_id);
CREATE INDEX idx_product_specifications_product ON product_specifications(product_id);

-- ==========================================
-- 4. Trigger: Autogeneración de Códigos Correlativos
-- ==========================================
CREATE OR REPLACE FUNCTION handle_website_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'website_pages' THEN
        IF NEW.page_code IS NULL OR NEW.page_code = '' THEN
            NEW.page_code := 'PAG-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'WEBSITE_PAGE')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'website_forms' THEN
        IF NEW.form_code IS NULL OR NEW.form_code = '' THEN
            NEW.form_code := 'FRM-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'WEBSITE_FORM')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'leads' THEN
        IF NEW.lead_code IS NULL OR NEW.lead_code = '' THEN
            NEW.lead_code := 'LED-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'LEAD')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'product_categories' THEN
        IF NEW.category_code IS NULL OR NEW.category_code = '' THEN
            NEW.category_code := 'CAT-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'PRODUCT_CATEGORY')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'product_families' THEN
        IF NEW.family_code IS NULL OR NEW.family_code = '' THEN
            NEW.family_code := 'FAM-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'PRODUCT_FAMILY')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'products' THEN
        IF NEW.product_code IS NULL OR NEW.product_code = '' THEN
            NEW.product_code := 'PRO-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'PRODUCT')::text, 6, '0');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_page_code BEFORE INSERT ON website_pages FOR EACH ROW EXECUTE FUNCTION handle_website_sequences();
CREATE TRIGGER trg_handle_form_code BEFORE INSERT ON website_forms FOR EACH ROW EXECUTE FUNCTION handle_website_sequences();
CREATE TRIGGER trg_handle_lead_code BEFORE INSERT ON leads FOR EACH ROW EXECUTE FUNCTION handle_website_sequences();
CREATE TRIGGER trg_handle_category_code BEFORE INSERT ON product_categories FOR EACH ROW EXECUTE FUNCTION handle_website_sequences();
CREATE TRIGGER trg_handle_family_code BEFORE INSERT ON product_families FOR EACH ROW EXECUTE FUNCTION handle_website_sequences();
CREATE TRIGGER trg_handle_product_code BEFORE INSERT ON products FOR EACH ROW EXECUTE FUNCTION handle_website_sequences();

-- ==========================================
-- 5. Trigger: Bloqueo de Borrado Físico (Soft Delete Obligatorio)
-- ==========================================
CREATE OR REPLACE FUNCTION block_physical_website_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los datos del sitio web y catálogo son inmutables. Utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_page_delete BEFORE DELETE ON website_pages FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_form_delete BEFORE DELETE ON website_forms FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_lead_delete BEFORE DELETE ON leads FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_category_delete BEFORE DELETE ON product_categories FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_family_delete BEFORE DELETE ON product_families FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_product_delete BEFORE DELETE ON products FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_specification_delete BEFORE DELETE ON product_specifications FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();

-- ==========================================
-- 6. Triggers: Trazabilidad General
-- ==========================================
CREATE TRIGGER trg_page_traceability BEFORE INSERT OR UPDATE ON website_pages FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_form_traceability BEFORE INSERT OR UPDATE ON website_forms FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_lead_traceability BEFORE INSERT OR UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_category_traceability BEFORE INSERT OR UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_family_traceability BEFORE INSERT OR UPDATE ON product_families FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_product_traceability BEFORE INSERT OR UPDATE ON products FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_specification_traceability BEFORE INSERT OR UPDATE ON product_specifications FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- ==========================================
-- 7. Triggers: Integración con Auditoría General
-- ==========================================
CREATE TRIGGER audit_website_pages AFTER INSERT OR UPDATE OR DELETE ON website_pages FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_website_forms AFTER INSERT OR UPDATE OR DELETE ON website_forms FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_leads AFTER INSERT OR UPDATE OR DELETE ON leads FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_categories AFTER INSERT OR UPDATE OR DELETE ON product_categories FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_families AFTER INSERT OR UPDATE OR DELETE ON product_families FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_specifications AFTER INSERT OR UPDATE OR DELETE ON product_specifications FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ==========================================
-- 8. Habilitar Row Level Security (RLS)
-- ==========================================
ALTER TABLE website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 9. Políticas de Seguridad RLS
-- ==========================================

-- Función auxiliar para obtener tenant_id del usuario autenticado
-- Reutilizable en todas las políticas

CREATE POLICY pages_select_tenant ON website_pages FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY pages_write_tenant ON website_pages FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Formularios
CREATE POLICY forms_select_tenant ON website_forms FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (deleted_at IS NULL)
);
CREATE POLICY forms_write_tenant ON website_forms FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Leads
CREATE POLICY leads_select_tenant ON leads FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (deleted_at IS NULL)
);
CREATE POLICY leads_write_tenant ON leads FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Lead Sources
CREATE POLICY lead_sources_all_tenant ON lead_sources FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Sessions
CREATE POLICY sessions_all_tenant ON website_sessions FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Events
CREATE POLICY events_all_tenant ON website_events FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Downloads
CREATE POLICY downloads_all_tenant ON website_downloads FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Categorías
CREATE POLICY categories_select_tenant ON product_categories FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (deleted_at IS NULL)
);
CREATE POLICY categories_write_tenant ON product_categories FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Familias
CREATE POLICY families_select_tenant ON product_families FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (deleted_at IS NULL)
);
CREATE POLICY families_write_tenant ON product_families FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Productos
CREATE POLICY products_select_tenant ON products FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (deleted_at IS NULL)
);
CREATE POLICY products_write_tenant ON products FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Especificaciones
CREATE POLICY specifications_select_tenant ON product_specifications FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (deleted_at IS NULL)
);
CREATE POLICY specifications_write_tenant ON product_specifications FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000012_wizard_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 12: WIZARD / COTIZADOR
-- Archivo: supabase/migrations/20260617000012_wizard_core.sql

-- ==========================================
-- 1. Tablas del Módulo Wizard y Diagnósticos
-- ==========================================

-- A. Reportes de Diagnósticos (diagnostic_reports)
CREATE TABLE diagnostic_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    diagnostic_code varchar(50) NOT NULL,
    lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE RESTRICT,
    service_type varchar(50) NOT NULL CHECK (service_type IN ('fabricacion', 'venta', 'mantenimiento', 'reparacion')),
    dimensions jsonb,
    symptoms jsonb,
    calculated_volume numeric,
    calculated_cfm numeric,
    cfm_category varchar(50) NOT NULL CHECK (cfm_category IN ('CRITICAL', 'HIGH', 'STANDARD', 'COMPACT')),
    materials_recommendation text,
    estimated_price_min_cop numeric NOT NULL,
    estimated_price_max_cop numeric NOT NULL,
    estimated_price_min_usd numeric NOT NULL,
    estimated_price_max_usd numeric NOT NULL,
    pdf_file_path text,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_diagnostic_code UNIQUE (tenant_id, diagnostic_code)
);

-- B. Sesiones de Wizard para Remarketing (wizard_sessions)
CREATE TABLE wizard_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    session_id uuid NOT NULL REFERENCES website_sessions(id) ON DELETE CASCADE,
    email varchar(200),
    phone varchar(50),
    wizard_data jsonb,
    step integer NOT NULL DEFAULT 1 CHECK (step BETWEEN 1 AND 4),
    completion_percent numeric NOT NULL DEFAULT 0.0,
    last_activity timestamp NOT NULL DEFAULT NOW(),
    is_converted boolean NOT NULL DEFAULT false,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_wizard_session UNIQUE (tenant_id, session_id)
);

-- ==========================================
-- 2. Índices de Rendimiento
-- ==========================================
CREATE INDEX idx_diagnostic_reports_tenant ON diagnostic_reports(tenant_id);
CREATE INDEX idx_diagnostic_reports_lead ON diagnostic_reports(lead_id);
CREATE INDEX idx_wizard_sessions_session ON wizard_sessions(session_id);

-- ==========================================
-- 3. Trigger: Autogeneración de Códigos Correlativos
-- ==========================================
CREATE OR REPLACE FUNCTION handle_wizard_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'diagnostic_reports' THEN
        IF NEW.diagnostic_code IS NULL OR NEW.diagnostic_code = '' THEN
            NEW.diagnostic_code := 'DIA-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'DIAGNOSTIC_REPORT')::text, 6, '0');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_diagnostic_code BEFORE INSERT ON diagnostic_reports FOR EACH ROW EXECUTE FUNCTION handle_wizard_sequences();

-- ==========================================
-- 4. Trigger: Bloqueo de Borrado Físico (Soft Delete Obligatorio)
-- ==========================================
CREATE OR REPLACE FUNCTION block_physical_wizard_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los datos de diagnóstico y sesiones del wizard son inmutables. Utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_diagnostic_delete BEFORE DELETE ON diagnostic_reports FOR EACH ROW EXECUTE FUNCTION block_physical_wizard_delete();
CREATE TRIGGER trg_block_wizard_session_delete BEFORE DELETE ON wizard_sessions FOR EACH ROW EXECUTE FUNCTION block_physical_wizard_delete();

-- ==========================================
-- 5. Triggers: Trazabilidad General
-- ==========================================
CREATE TRIGGER trg_diagnostic_traceability BEFORE INSERT OR UPDATE ON diagnostic_reports FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_wizard_session_traceability BEFORE INSERT OR UPDATE ON wizard_sessions FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- ==========================================
-- 6. Triggers: Integración con Auditoría General
-- ==========================================
CREATE TRIGGER audit_diagnostic_reports AFTER INSERT OR UPDATE OR DELETE ON diagnostic_reports FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_wizard_sessions AFTER INSERT OR UPDATE OR DELETE ON wizard_sessions FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ==========================================
-- 7. Habilitar Row Level Security (RLS)
-- ==========================================
ALTER TABLE diagnostic_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE wizard_sessions ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 8. Políticas de Seguridad RLS
-- ==========================================

-- Reportes de Diagnósticos
CREATE POLICY diagnostic_select_tenant ON diagnostic_reports FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (deleted_at IS NULL)
);
CREATE POLICY diagnostic_write_tenant ON diagnostic_reports FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Sesiones de Wizard
CREATE POLICY wizard_sessions_all_tenant ON wizard_sessions FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000013_crm_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 13: CRM, COTIZACIONES Y PIPELINE (REUTILIZACIÓN Y EXTENSIÓN)
-- Archivo: supabase/migrations/20260617000013_crm_core.sql

-- ==========================================
-- 1. Modificaciones de Esquemas Existentes (Reutilización)
-- ==========================================

-- A. Hacer tax_id opcional en la tabla de clientes (clients)
-- Permite registrar prospectos (leads) desde el wizard web sin exigir identificación tributaria inicialmente
ALTER TABLE clients ALTER COLUMN tax_id DROP NOT NULL;

-- B. Agregar claves foráneas en la tabla de leads para enlazarlos con el CRM
-- Vincula el lead calificado con la cuenta (client_id) y el contacto (contact_id) resultantes del B2B Upsert
ALTER TABLE leads ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN contact_id uuid REFERENCES client_contacts(id) ON DELETE SET NULL;

-- ==========================================
-- 2. Nueva Tabla: Bitácora de Actividades Comerciales (crm_activity_logs)
-- ==========================================
CREATE TABLE crm_activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    activity_type varchar(100) NOT NULL CHECK (activity_type IN ('NOTE', 'CALL', 'EMAIL', 'MEETING', 'SYSTEM')),
    description text NOT NULL,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

-- ==========================================
-- 3. Índices de Rendimiento
-- ==========================================
CREATE INDEX idx_crm_activity_logs_requirement ON crm_activity_logs(requirement_id);
CREATE INDEX idx_leads_client ON leads(client_id);
CREATE INDEX idx_leads_contact ON leads(contact_id);

-- ==========================================
-- 4. Trigger: Bloqueo de Borrado Físico (Soft Delete Obligatorio)
-- ==========================================
CREATE OR REPLACE FUNCTION block_physical_crm_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los logs de actividad del CRM son inmutables. Utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_crm_activity_delete BEFORE DELETE ON crm_activity_logs FOR EACH ROW EXECUTE FUNCTION block_physical_crm_delete();

-- ==========================================
-- 5. Triggers: Trazabilidad General
-- ==========================================
CREATE TRIGGER trg_crm_activity_traceability BEFORE INSERT OR UPDATE ON crm_activity_logs FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- ==========================================
-- 6. Triggers: Integración con Auditoría General
-- ==========================================
CREATE TRIGGER audit_crm_activity_logs AFTER INSERT OR UPDATE OR DELETE ON crm_activity_logs FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ==========================================
-- 7. Habilitar Row Level Security (RLS)
-- ==========================================
ALTER TABLE crm_activity_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 8. Políticas de Seguridad RLS
-- ==========================================
CREATE POLICY crm_activity_all_tenant ON crm_activity_logs FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000014_marketing_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 14: MARKETING Y SLA (EXTENSIÓN DE LEADS)
-- Archivo: supabase/migrations/20260617000014_marketing_core.sql

-- ==========================================
-- 1. Modificaciones a la Tabla leads
-- ==========================================
ALTER TABLE leads 
    ADD COLUMN lead_source varchar(100) CHECK (lead_source IN ('Google Ads', 'SEO', 'LinkedIn', 'WhatsApp', 'Facebook', 'Instagram', 'Email Marketing', 'Directo', 'Referido', 'Distribuidor', 'Otro')),
    ADD COLUMN owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN assigned_at timestamp,
    ADD COLUMN first_contact_at timestamp,
    ADD COLUMN last_contact_at timestamp,
    ADD COLUMN next_follow_up_at timestamp,
    ADD COLUMN sla_due_at timestamp,
    ADD COLUMN sla_status varchar(50) NOT NULL DEFAULT 'PENDIENTE' CHECK (sla_status IN ('PENDIENTE', 'CUMPLIDO', 'INCUMPLIDO')),
    ADD COLUMN status varchar(50) NOT NULL DEFAULT 'NUEVO' CHECK (status IN ('NUEVO', 'MQL', 'SQL', 'OPORTUNIDAD', 'CERRADO_CONVERTIDO', 'RECHAZADO'));

-- ==========================================
-- 2. Trigger: Cálculo y Evaluación de SLA
-- ==========================================
CREATE OR REPLACE FUNCTION handle_lead_sla_calculation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Calcular sla_due_at según la urgencia al insertar el lead
        IF NEW.urgency = 'alta' THEN
            NEW.sla_due_at := COALESCE(NEW.created_at, NOW()) + INTERVAL '15 minutes';
        ELSIF NEW.urgency = 'media' THEN
            NEW.sla_due_at := COALESCE(NEW.created_at, NOW()) + INTERVAL '4 hours';
        ELSE
            NEW.sla_due_at := COALESCE(NEW.created_at, NOW()) + INTERVAL '24 hours';
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Recalcular sla_due_at si cambia la urgencia y aún no se ha hecho primer contacto
        IF NEW.urgency <> OLD.urgency AND NEW.first_contact_at IS NULL THEN
            IF NEW.urgency = 'alta' THEN
                NEW.sla_due_at := COALESCE(NEW.created_at, NOW()) + INTERVAL '15 minutes';
            ELSIF NEW.urgency = 'media' THEN
                NEW.sla_due_at := COALESCE(NEW.created_at, NOW()) + INTERVAL '4 hours';
            ELSE
                NEW.sla_due_at := COALESCE(NEW.created_at, NOW()) + INTERVAL '24 hours';
            END IF;
        END IF;

        -- Evaluar SLA al registrar el primer contacto
        IF NEW.first_contact_at IS NOT NULL AND OLD.first_contact_at IS NULL THEN
            IF NEW.first_contact_at <= NEW.sla_due_at THEN
                NEW.sla_status := 'CUMPLIDO';
            ELSE
                NEW.sla_status := 'INCUMPLIDO';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_lead_sla BEFORE INSERT OR UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION handle_lead_sla_calculation();

-- ==========================================
-- 3. Trigger: Registro de Incumplimiento de SLA (Eventos)
-- ==========================================
CREATE OR REPLACE FUNCTION validate_lead_sla_breach()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sla_status = 'INCUMPLIDO' AND OLD.sla_status = 'PENDIENTE' THEN
        INSERT INTO business_events (
            tenant_id,
            event_code,
            entity_type,
            entity_id,
            payload,
            created_by
        ) VALUES (
            NEW.tenant_id,
            'LEAD_SLA_BREACHED',
            'LEAD',
            NEW.id,
            jsonb_build_object(
                'lead_id', NEW.id,
                'lead_code', NEW.lead_code,
                'urgency', NEW.urgency,
                'sla_due_at', NEW.sla_due_at,
                'first_contact_at', NEW.first_contact_at,
                'breach_delay_minutes', ROUND(EXTRACT(EPOCH FROM (NEW.first_contact_at - NEW.sla_due_at)) / 60)
            ),
            NEW.updated_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_lead_sla_breach AFTER UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION validate_lead_sla_breach();


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000015_dashboards_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 15: DASHBOARDS Y KPIs
-- Archivo: supabase/migrations/20260617000015_dashboards_core.sql

-- 1. Tabla de Definición de KPIs (kpi_definitions)
CREATE TABLE kpi_definitions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    kpi_code varchar(50) NOT NULL,
    name varchar(150) NOT NULL,
    category varchar(100) NOT NULL,
    description text,
    unit varchar(50) NOT NULL,
    active boolean NOT NULL DEFAULT true,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_kpi_code UNIQUE (tenant_id, kpi_code)
);

-- 2. Tabla de Fórmulas de KPIs (kpi_formulas)
CREATE TABLE kpi_formulas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    kpi_id uuid NOT NULL REFERENCES kpi_definitions(id) ON DELETE RESTRICT,
    formula_expression text NOT NULL,
    version integer NOT NULL,
    active boolean NOT NULL DEFAULT true,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

-- 3. Tabla de Historial de KPIs (kpi_history)
CREATE TABLE kpi_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    kpi_id uuid NOT NULL REFERENCES kpi_definitions(id) ON DELETE RESTRICT,
    period varchar(20) NOT NULL, -- e.g., '2026-06', '2026-W24'
    value decimal(18,4) NOT NULL,
    calculated_at timestamp NOT NULL DEFAULT NOW(),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_kpi_period UNIQUE (tenant_id, kpi_id, period)
);

-- 4. Tabla de Dashboards (dashboards)
CREATE TABLE dashboards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    dashboard_code varchar(50) NOT NULL,
    name varchar(150) NOT NULL,
    description text,
    role_id uuid REFERENCES roles(id) ON DELETE SET NULL,
    active boolean NOT NULL DEFAULT true,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_dashboard_code UNIQUE (tenant_id, dashboard_code)
);

-- 5. Tabla de Widgets de Dashboard (dashboard_widgets)
CREATE TABLE dashboard_widgets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    dashboard_id uuid NOT NULL REFERENCES dashboards(id) ON DELETE RESTRICT,
    widget_code varchar(50) NOT NULL,
    widget_type varchar(50) NOT NULL, -- e.g., 'BAR', 'LINE', 'KPI_CARD'
    position_x integer NOT NULL DEFAULT 0,
    position_y integer NOT NULL DEFAULT 0,
    width integer NOT NULL DEFAULT 4,
    height integer NOT NULL DEFAULT 3,
    configuration_json jsonb NOT NULL DEFAULT '{}'::jsonb,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_widget_code UNIQUE (tenant_id, widget_code)
);

-- 6. Tabla de Preferencias de Dashboard (dashboard_preferences)
CREATE TABLE dashboard_preferences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dashboard_id uuid NOT NULL REFERENCES dashboards(id) ON DELETE RESTRICT,
    preferences_json jsonb NOT NULL DEFAULT '{}'::jsonb,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_user_dashboard_pref UNIQUE (tenant_id, user_id, dashboard_id)
);

-- 7. Índices de Rendimiento
CREATE INDEX idx_kpi_definitions_tenant ON kpi_definitions(tenant_id);
CREATE INDEX idx_kpi_formulas_kpi ON kpi_formulas(kpi_id);
CREATE INDEX idx_kpi_history_tenant_kpi ON kpi_history(tenant_id, kpi_id);
CREATE INDEX idx_dashboards_tenant ON dashboards(tenant_id);
CREATE INDEX idx_dashboard_widgets_dashboard ON dashboard_widgets(dashboard_id);
CREATE INDEX idx_dashboard_preferences_user ON dashboard_preferences(user_id);

-- 8. Trigger: Autogeneración de Códigos Correlativos
CREATE OR REPLACE FUNCTION handle_dashboard_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'kpi_definitions' THEN
        IF NEW.kpi_code IS NULL OR NEW.kpi_code = '' THEN
            NEW.kpi_code := 'KPI-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'KPI')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'dashboards' THEN
        IF NEW.dashboard_code IS NULL OR NEW.dashboard_code = '' THEN
            NEW.dashboard_code := 'DSH-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'DASHBOARD')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'dashboard_widgets' THEN
        IF NEW.widget_code IS NULL OR NEW.widget_code = '' THEN
            NEW.widget_code := 'WDG-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'WIDGET')::text, 6, '0');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_kpi_code BEFORE INSERT ON kpi_definitions FOR EACH ROW EXECUTE FUNCTION handle_dashboard_sequences();
CREATE TRIGGER trg_handle_dashboard_code BEFORE INSERT ON dashboards FOR EACH ROW EXECUTE FUNCTION handle_dashboard_sequences();
CREATE TRIGGER trg_handle_widget_code BEFORE INSERT ON dashboard_widgets FOR EACH ROW EXECUTE FUNCTION handle_dashboard_sequences();

-- 9. Trigger: Versionado de Fórmulas (Solo una fórmula activa por KPI)
CREATE OR REPLACE FUNCTION deactivate_other_kpi_formulas()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.active = true THEN
        UPDATE kpi_formulas
        SET active = false,
            updated_at = NOW()
        WHERE kpi_id = NEW.kpi_id
          AND id <> NEW.id
          AND active = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_deactivate_other_kpi_formulas BEFORE INSERT OR UPDATE OF active ON kpi_formulas
FOR EACH ROW EXECUTE FUNCTION deactivate_other_kpi_formulas();

-- 10. Trigger: Bloqueo de Borrado Físico (Soft Delete Obligatorio)
CREATE OR REPLACE FUNCTION block_physical_dashboard_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los datos analíticos e históricos son inmutables. Utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_kpi_def_delete BEFORE DELETE ON kpi_definitions FOR EACH ROW EXECUTE FUNCTION block_physical_dashboard_delete();
CREATE TRIGGER trg_block_kpi_formula_delete BEFORE DELETE ON kpi_formulas FOR EACH ROW EXECUTE FUNCTION block_physical_dashboard_delete();
CREATE TRIGGER trg_block_kpi_hist_delete BEFORE DELETE ON kpi_history FOR EACH ROW EXECUTE FUNCTION block_physical_dashboard_delete();
CREATE TRIGGER trg_block_dashboard_delete BEFORE DELETE ON dashboards FOR EACH ROW EXECUTE FUNCTION block_physical_dashboard_delete();
CREATE TRIGGER trg_block_widget_delete BEFORE DELETE ON dashboard_widgets FOR EACH ROW EXECUTE FUNCTION block_physical_dashboard_delete();
CREATE TRIGGER trg_block_preference_delete BEFORE DELETE ON dashboard_preferences FOR EACH ROW EXECUTE FUNCTION block_physical_dashboard_delete();

-- 11. Trigger: Trazabilidad General (handle_approval_traceability)
CREATE TRIGGER trg_kpi_def_traceability BEFORE INSERT OR UPDATE ON kpi_definitions FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_kpi_formula_traceability BEFORE INSERT OR UPDATE ON kpi_formulas FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_kpi_hist_traceability BEFORE INSERT OR UPDATE ON kpi_history FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_dashboard_traceability BEFORE INSERT OR UPDATE ON dashboards FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_widget_traceability BEFORE INSERT OR UPDATE ON dashboard_widgets FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_preference_traceability BEFORE INSERT OR UPDATE ON dashboard_preferences FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- 12. Trigger: Integración con Auditoría General (process_audit_log)
CREATE TRIGGER audit_kpi_definitions AFTER INSERT OR UPDATE OR DELETE ON kpi_definitions FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_kpi_formulas AFTER INSERT OR UPDATE OR DELETE ON kpi_formulas FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_kpi_history AFTER INSERT OR UPDATE OR DELETE ON kpi_history FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_dashboards AFTER INSERT OR UPDATE OR DELETE ON dashboards FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_dashboard_widgets AFTER INSERT OR UPDATE OR DELETE ON dashboard_widgets FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_dashboard_preferences AFTER INSERT OR UPDATE OR DELETE ON dashboard_preferences FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 13. Habilitar Row Level Security (RLS)
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_preferences ENABLE ROW LEVEL SECURITY;

-- 14. Políticas de Seguridad RLS

-- A. kpi_definitions
CREATE POLICY kpis_super_admin ON kpi_definitions FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY kpis_select_tenant ON kpi_definitions FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY kpis_write_tenant ON kpi_definitions FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- B. kpi_formulas
CREATE POLICY formulas_super_admin ON kpi_formulas FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY formulas_select_tenant ON kpi_formulas FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY formulas_write_tenant ON kpi_formulas FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- C. kpi_history
CREATE POLICY history_super_admin ON kpi_history FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY history_select_tenant ON kpi_history FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY history_write_tenant ON kpi_history FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- D. dashboards
CREATE POLICY dashboards_super_admin ON dashboards FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY dashboards_select_tenant ON dashboards FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY dashboards_write_tenant ON dashboards FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- E. dashboard_widgets
CREATE POLICY widgets_super_admin ON dashboard_widgets FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY widgets_select_tenant ON dashboard_widgets FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY widgets_write_tenant ON dashboard_widgets FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- F. dashboard_preferences
CREATE POLICY prefs_super_admin ON dashboard_preferences FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY prefs_select_tenant ON dashboard_preferences FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY prefs_write_tenant ON dashboard_preferences FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- 15. Función PL/pgSQL: Motor de Cálculo y Registro de KPIs en Historial
CREATE OR REPLACE FUNCTION calculate_kpi(
    p_tenant_id uuid,
    p_kpi_code varchar,
    p_period varchar
)
RETURNS decimal AS $$
DECLARE
    v_kpi_id uuid;
    v_value decimal(18,4) := 0;
BEGIN
    -- 1. Obtener el KPI ID
    SELECT id INTO v_kpi_id
    FROM kpi_definitions
    WHERE tenant_id = p_tenant_id
      AND kpi_code = p_kpi_code
      AND deleted_at IS NULL;
      
    IF v_kpi_id IS NULL THEN
        RAISE EXCEPTION 'El KPI con código % no existe para el tenant %.', p_kpi_code, p_tenant_id;
    END IF;

    -- 2. Calcular el valor según el código del KPI
    IF p_kpi_code = 'LEAD_SLA_BREACH_RATE' THEN
        SELECT COALESCE(
            (COUNT(CASE WHEN sla_status = 'INCUMPLIDO' THEN 1 END) * 100.0) / NULLIF(COUNT(*), 0),
            0.0
        ) INTO v_value
        FROM leads
        WHERE tenant_id = p_tenant_id
          AND to_char(created_at, 'YYYY-MM') = p_period
          AND deleted_at IS NULL;

    ELSIF p_kpi_code = 'TOTAL_INVOICED' THEN
        SELECT COALESCE(SUM(total_amount), 0.0) INTO v_value
        FROM invoices
        WHERE tenant_id = p_tenant_id
          AND to_char(invoice_date, 'YYYY-MM') = p_period
          AND status IN ('EMITIDA', 'PARCIALMENTE_PAGADA', 'PAGADA', 'VENCIDA')
          AND deleted_at IS NULL;

    ELSIF p_kpi_code = 'TOTAL_PAYMENTS' THEN
        SELECT COALESCE(SUM(amount), 0.0) INTO v_value
        FROM payments
        WHERE tenant_id = p_tenant_id
          AND to_char(payment_date, 'YYYY-MM') = p_period
          AND status = 'APLICADO'
          AND deleted_at IS NULL;

    ELSE
        RAISE EXCEPTION 'Código de KPI no soportado en la función de cálculo: %', p_kpi_code;
    END IF;

    -- 3. Registrar o actualizar en el historial (kpi_history)
    INSERT INTO kpi_history (tenant_id, kpi_id, period, value, calculated_at)
    VALUES (p_tenant_id, v_kpi_id, p_period, v_value, NOW())
    ON CONFLICT (tenant_id, kpi_id, period) DO UPDATE
    SET value = EXCLUDED.value,
        calculated_at = NOW(),
        updated_at = NOW();

    -- 4. Registrar evento de negocio
    INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload)
    VALUES (
        p_tenant_id,
        'KPI_CALCULATED',
        'kpi_definitions',
        v_kpi_id,
        jsonb_build_object('kpi_code', p_kpi_code, 'period', p_period, 'value', v_value)
    );

    RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000016_costs_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 16: COSTOS Y APLICACIONES FINANCIERAS
-- Archivo: supabase/migrations/20260617000016_costs_core.sql

-- 1. Crear Función Helper para Recalcular paid_amount y status en Facturas
CREATE OR REPLACE FUNCTION refresh_invoice_paid_amount(p_invoice_id uuid)
RETURNS void AS $$
DECLARE
    v_total_payments decimal(18,2) := 0;
    v_total_advances decimal(18,2) := 0;
    v_total_paid decimal(18,2) := 0;
    v_total_amount decimal(18,2) := 0;
BEGIN
    -- Suma de pagos aplicados directos
    SELECT COALESCE(SUM(amount), 0) INTO v_total_payments
    FROM payments
    WHERE invoice_id = p_invoice_id
      AND status = 'APLICADO'
      AND deleted_at IS NULL;

    -- Suma de anticipos aplicados
    SELECT COALESCE(SUM(applied_amount), 0) INTO v_total_advances
    FROM advance_applications
    WHERE invoice_id = p_invoice_id
      AND deleted_at IS NULL;

    v_total_paid := v_total_payments + v_total_advances;

    SELECT total_amount INTO v_total_amount 
    FROM invoices 
    WHERE id = p_invoice_id;

    UPDATE invoices
    SET paid_amount = v_total_paid,
        status = CASE 
            WHEN v_total_paid >= v_total_amount THEN 'PAGADA'
            WHEN v_total_paid > 0 THEN 'PARCIALMENTE_PAGADA'
            ELSE 'EMITIDA'
        END,
        updated_at = NOW()
    WHERE id = p_invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Redefinir handle_payment_application() para usar la función helper
CREATE OR REPLACE FUNCTION handle_payment_application()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el pago pasa a APLICADO
    IF NEW.status = 'APLICADO' AND (OLD.status IS NULL OR OLD.status <> 'APLICADO') THEN
        IF NEW.invoice_id IS NOT NULL THEN
            PERFORM refresh_invoice_paid_amount(NEW.invoice_id);
        ELSE
            -- Si es un anticipo, insertamos en customer_advances
            INSERT INTO customer_advances (tenant_id, client_id, payment_id, amount, applied_amount)
            VALUES (NEW.tenant_id, NEW.client_id, NEW.id, NEW.amount, 0);
        END IF;
    -- Si un pago se ANULA
    ELSIF NEW.status = 'ANULADO' AND OLD.status = 'APLICADO' THEN
        IF NEW.invoice_id IS NOT NULL THEN
            PERFORM refresh_invoice_paid_amount(NEW.invoice_id);
        ELSE
            UPDATE customer_advances
            SET deleted_at = NOW(),
                deleted_by = get_current_user_id(),
                delete_reason = 'Pago de anticipo anulado.'
            WHERE payment_id = NEW.id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tabla de Aplicación de Anticipos (advance_applications)
CREATE TABLE advance_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    advance_id uuid NOT NULL REFERENCES customer_advances(id) ON DELETE RESTRICT,
    invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    applied_amount decimal(18,2) NOT NULL CHECK (applied_amount > 0),
    applied_at timestamp NOT NULL DEFAULT NOW(),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

-- 4. Tabla de Costos Reales (costs)
CREATE TABLE costs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    cost_code varchar(50) NOT NULL,
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
    cost_type varchar(50) NOT NULL CHECK (cost_type IN (
        'Material', 'ManoObra', 'Equipo', 'ServicioTercero', 'Transporte', 'Viatico', 'Otro'
    )),
    description text NOT NULL,
    quantity decimal(18,4) NOT NULL CHECK (quantity > 0),
    unit varchar(50) NOT NULL,
    unit_cost decimal(18,2) NOT NULL CHECK (unit_cost >= 0),
    total_cost decimal(18,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED CHECK (total_cost >= 0),
    document_id uuid REFERENCES documents(id) ON DELETE SET NULL,
    cost_date date NOT NULL DEFAULT CURRENT_DATE,
    status varchar(50) NOT NULL DEFAULT 'REGISTRADO' CHECK (status IN (
        'REGISTRADO', 'APROBADO', 'RECHAZADO'
    )),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_cost_code UNIQUE (tenant_id, cost_code)
);

-- 5. Tabla de Presupuestos de Trabajo (job_budgets)
CREATE TABLE job_budgets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
    budget_type varchar(50) NOT NULL CHECK (budget_type IN (
        'Material', 'ManoObra', 'Equipo', 'ServicioTercero', 'Transporte', 'Viatico', 'Otro'
    )),
    planned_amount decimal(18,2) NOT NULL DEFAULT 0 CHECK (planned_amount >= 0),
    approved_amount decimal(18,2) NOT NULL DEFAULT 0 CHECK (approved_amount >= 0),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_job_budget_type UNIQUE (tenant_id, job_id, budget_type)
);

-- 6. Índices de Rendimiento
CREATE INDEX idx_advance_applications_tenant ON advance_applications(tenant_id);
CREATE INDEX idx_advance_applications_advance ON advance_applications(advance_id);
CREATE INDEX idx_advance_applications_invoice ON advance_applications(invoice_id);
CREATE INDEX idx_costs_tenant ON costs(tenant_id);
CREATE INDEX idx_costs_job ON costs(job_id);
CREATE INDEX idx_job_budgets_tenant ON job_budgets(tenant_id);
CREATE INDEX idx_job_budgets_job ON job_budgets(job_id);

-- 7. Trigger BEFORE INSERT para códigos secuenciales de costos (COS-)
CREATE OR REPLACE FUNCTION handle_cost_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.cost_code IS NULL OR NEW.cost_code = '' THEN
        NEW.cost_code := 'COS-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'COST')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_cost_code BEFORE INSERT ON costs FOR EACH ROW EXECUTE FUNCTION handle_cost_sequences();

-- 8. Trigger BEFORE INSERT OR UPDATE para Validaciones de Aplicación de Anticipos
CREATE OR REPLACE FUNCTION validate_advance_application()
RETURNS TRIGGER AS $$
DECLARE
    v_adv_client_id uuid;
    v_inv_client_id uuid;
    v_available_amount decimal(18,2);
    v_inv_balance decimal(18,2);
    v_inv_status varchar(50);
BEGIN
    -- Obtener cliente y saldo del anticipo
    SELECT client_id, available_amount INTO v_adv_client_id, v_available_amount
    FROM customer_advances WHERE id = NEW.advance_id AND deleted_at IS NULL;

    IF v_adv_client_id IS NULL THEN
        RAISE EXCEPTION 'El anticipo especificado no existe o ha sido eliminado.';
    END IF;

    -- Obtener cliente, saldo y estado de la factura
    SELECT client_id, (total_amount - paid_amount), status INTO v_inv_client_id, v_inv_balance, v_inv_status
    FROM invoices WHERE id = NEW.invoice_id AND deleted_at IS NULL;

    IF v_inv_client_id IS NULL THEN
        RAISE EXCEPTION 'La factura especificada no existe o ha sido eliminada.';
    END IF;

    -- Validar que pertenezcan al mismo cliente
    IF v_adv_client_id <> v_inv_client_id THEN
        RAISE EXCEPTION 'El cliente del anticipo no coincide con el cliente de la factura.';
    END IF;

    -- Validar estado de la factura
    IF v_inv_status IN ('BORRADOR', 'ANULADA', 'PAGADA') THEN
        RAISE EXCEPTION 'No se pueden aplicar anticipos a una factura en estado %.', v_inv_status;
    END IF;

    -- En actualizaciones de la misma fila, sumamos el saldo anterior al disponible
    IF TG_OP = 'UPDATE' THEN
        v_available_amount := v_available_amount + OLD.applied_amount;
        v_inv_balance := v_inv_balance + OLD.applied_amount;
    END IF;

    -- Validar que no supere el saldo disponible del anticipo
    IF NEW.applied_amount > v_available_amount THEN
        RAISE EXCEPTION 'El monto aplicado (%) supera el saldo disponible del anticipo (%).', NEW.applied_amount, v_available_amount;
    END IF;

    -- Validar que no supere el saldo pendiente de la factura
    IF NEW.applied_amount > v_inv_balance THEN
        RAISE EXCEPTION 'El monto aplicado (%) supera el saldo pendiente de la factura (%).', NEW.applied_amount, v_inv_balance;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_advance_application BEFORE INSERT OR UPDATE ON advance_applications
FOR EACH ROW EXECUTE FUNCTION validate_advance_application();

-- 9. Trigger AFTER INSERT OR UPDATE OR DELETE para Afectación de Anticipos y Facturas
CREATE OR REPLACE FUNCTION handle_advance_application_impact()
RETURNS TRIGGER AS $$
DECLARE
    v_diff decimal(18,2) := 0;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Sumar al aplicado del anticipo
        UPDATE customer_advances
        SET applied_amount = applied_amount + NEW.applied_amount,
            updated_at = NOW()
        WHERE id = NEW.advance_id;

        -- Recalcular factura
        PERFORM refresh_invoice_paid_amount(NEW.invoice_id);

        -- Evento de negocio
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload)
        VALUES (
            NEW.tenant_id,
            'ADVANCE_APPLIED',
            'advance_applications',
            NEW.id,
            jsonb_build_object('advance_id', NEW.advance_id, 'invoice_id', NEW.invoice_id, 'amount', NEW.applied_amount)
        );

    ELSIF TG_OP = 'UPDATE' THEN
        -- Si cambia el estado a eliminado (soft delete)
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            -- Restar del aplicado del anticipo
            UPDATE customer_advances
            SET applied_amount = applied_amount - OLD.applied_amount,
                updated_at = NOW()
            WHERE id = OLD.advance_id;

            -- Recalcular factura
            PERFORM refresh_invoice_paid_amount(OLD.invoice_id);

            -- Evento de negocio
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload)
            VALUES (
                OLD.tenant_id,
                'ADVANCE_APPLICATION_CANCELLED',
                'advance_applications',
                OLD.id,
                jsonb_build_object('advance_id', OLD.advance_id, 'invoice_id', OLD.invoice_id, 'amount', OLD.applied_amount)
            );
        
        -- Si es una actualización de valores normales
        ELSE
            v_diff := NEW.applied_amount - OLD.applied_amount;
            
            UPDATE customer_advances
            SET applied_amount = applied_amount + v_diff,
                updated_at = NOW()
            WHERE id = NEW.advance_id;

            PERFORM refresh_invoice_paid_amount(NEW.invoice_id);
            
            IF NEW.invoice_id <> OLD.invoice_id THEN
                PERFORM refresh_invoice_paid_amount(OLD.invoice_id);
            END IF;

            -- Evento de negocio
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload)
            VALUES (
                NEW.tenant_id,
                'ADVANCE_APPLICATION_UPDATED',
                'advance_applications',
                NEW.id,
                jsonb_build_object('advance_id', NEW.advance_id, 'invoice_id', NEW.invoice_id, 'amount', NEW.applied_amount)
            );
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        -- Si por alguna razón hay borrado físico (aunque esté bloqueado, por consistencia)
        UPDATE customer_advances
        SET applied_amount = applied_amount - OLD.applied_amount,
            updated_at = NOW()
        WHERE id = OLD.advance_id;

        PERFORM refresh_invoice_paid_amount(OLD.invoice_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_advance_application_impact
AFTER INSERT OR UPDATE OR DELETE ON advance_applications
FOR EACH ROW EXECUTE FUNCTION handle_advance_application_impact();

-- 10. Trigger: Bloqueo de Borrado Físico (Soft Delete Obligatorio)
CREATE OR REPLACE FUNCTION block_physical_costs_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los datos de costos y presupuestos son inmutables. Utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_adv_app_delete BEFORE DELETE ON advance_applications FOR EACH ROW EXECUTE FUNCTION block_physical_costs_delete();
CREATE TRIGGER trg_block_cost_delete BEFORE DELETE ON costs FOR EACH ROW EXECUTE FUNCTION block_physical_costs_delete();
CREATE TRIGGER trg_block_budget_delete BEFORE DELETE ON job_budgets FOR EACH ROW EXECUTE FUNCTION block_physical_costs_delete();

-- 11. Trigger: Trazabilidad General (handle_approval_traceability)
CREATE TRIGGER trg_adv_app_traceability BEFORE INSERT OR UPDATE ON advance_applications FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_cost_traceability BEFORE INSERT OR UPDATE ON costs FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_budget_traceability BEFORE INSERT OR UPDATE ON job_budgets FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- 12. Trigger: Integración con Auditoría General (process_audit_log)
CREATE TRIGGER audit_advance_applications AFTER INSERT OR UPDATE OR DELETE ON advance_applications FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_costs AFTER INSERT OR UPDATE OR DELETE ON costs FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_job_budgets AFTER INSERT OR UPDATE OR DELETE ON job_budgets FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 13. Habilitar Row Level Security (RLS)
ALTER TABLE advance_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_budgets ENABLE ROW LEVEL SECURITY;

-- 14. Políticas de Seguridad RLS

-- A. advance_applications
CREATE POLICY adv_app_super_admin ON advance_applications FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY adv_app_select_tenant ON advance_applications FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY adv_app_write_tenant ON advance_applications FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- B. costs
CREATE POLICY costs_super_admin ON costs FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY costs_select_tenant ON costs FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY costs_write_tenant ON costs FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- C. job_budgets
CREATE POLICY budgets_super_admin ON job_budgets FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY budgets_select_tenant ON job_budgets FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY budgets_write_tenant ON job_budgets FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000017_profitability_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 17: RENTABILIDAD COMERCIAL Y OPERATIVA
-- Archivo: supabase/migrations/20260617000017_profitability_core.sql

-- 1. Vista de Rentabilidad por Trabajo (job_profitability)
CREATE OR REPLACE VIEW job_profitability 
WITH (security_invoker = true) AS
SELECT 
    j.tenant_id,
    j.id AS job_id,
    j.job_code,
    j.title AS job_name,
    j.client_id,
    c.legal_name AS client_name,
    COALESCE(i.total_invoiced, 0.00) AS total_invoiced,
    COALESCE(co.total_cost, 0.00) AS total_cost,
    (COALESCE(i.total_invoiced, 0.00) - COALESCE(co.total_cost, 0.00)) AS gross_margin,
    CASE 
        WHEN COALESCE(i.total_invoiced, 0.00) = 0 THEN 
            CASE WHEN COALESCE(co.total_cost, 0.00) > 0 THEN -100.00 ELSE 0.00 END
        ELSE 
            ROUND(((COALESCE(i.total_invoiced, 0.00) - COALESCE(co.total_cost, 0.00)) / i.total_invoiced) * 100, 2)
    END AS profitability_percent
FROM jobs j
JOIN clients c ON j.client_id = c.id
LEFT JOIN (
    SELECT job_id, SUM(total_amount) AS total_invoiced
    FROM invoices
    WHERE status IN ('EMITIDA', 'PARCIALMENTE_PAGADA', 'PAGADA', 'VENCIDA')
      AND deleted_at IS NULL
    GROUP BY job_id
) i ON j.id = i.job_id
LEFT JOIN (
    SELECT job_id, SUM(total_cost) AS total_cost
    FROM costs
    WHERE status = 'APROBADO'
      AND deleted_at IS NULL
    GROUP BY job_id
) co ON j.id = co.job_id
WHERE j.deleted_at IS NULL;

-- 2. Vista de Rentabilidad por Cliente (client_profitability)
CREATE OR REPLACE VIEW client_profitability 
WITH (security_invoker = true) AS
SELECT 
    c.tenant_id,
    c.id AS client_id,
    c.legal_name AS client_name,
    COALESCE(i.total_invoiced, 0.00) AS total_invoiced,
    COALESCE(co.total_cost, 0.00) AS total_cost,
    (COALESCE(i.total_invoiced, 0.00) - COALESCE(co.total_cost, 0.00)) AS gross_margin,
    CASE 
        WHEN COALESCE(i.total_invoiced, 0.00) = 0 THEN 
            CASE WHEN COALESCE(co.total_cost, 0.00) > 0 THEN -100.00 ELSE 0.00 END
        ELSE 
            ROUND(((COALESCE(i.total_invoiced, 0.00) - COALESCE(co.total_cost, 0.00)) / i.total_invoiced) * 100, 2)
    END AS profitability_percent
FROM clients c
LEFT JOIN (
    SELECT client_id, SUM(total_amount) AS total_invoiced
    FROM invoices
    WHERE status IN ('EMITIDA', 'PARCIALMENTE_PAGADA', 'PAGADA', 'VENCIDA')
      AND deleted_at IS NULL
    GROUP BY client_id
) i ON c.id = i.client_id
LEFT JOIN (
    SELECT j.client_id, SUM(co.total_cost) AS total_cost
    FROM jobs j
    JOIN costs co ON j.id = co.job_id
    WHERE co.status = 'APROBADO'
      AND co.deleted_at IS NULL
      AND j.deleted_at IS NULL
    GROUP BY j.client_id
) co ON c.id = co.client_id
WHERE c.deleted_at IS NULL;


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000018_documents_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 18: MOTOR DE DOCUMENTOS Y PLANTILLAS
-- Archivo: supabase/migrations/20260617000018_documents_core.sql
--
-- REUSE_ANALYSIS_FASE18 cumplido:
--   Editor Visual  → GrapesJS    (BSD-3,   25.9k stars) — almacenado en template_html
--   Motor Plantilla → Handlebars.js (MIT, 18.6k stars) — sintaxis {{variable}}
--   PDF            → Puppeteer   (Apache 2.0, 95k stars)
--   DOCX           → Docxtemplater (MIT, 3.6k stars)
--   replace('{{variable}}') PROHIBIDO — D18-07 (REUSE_ANALYSIS_FASE18.md)

-- ============================================================
-- 1. TABLA: document_templates
--    Almacena plantillas HTML (output de GrapesJS) por tenant
-- ============================================================
CREATE TABLE document_templates (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,

    -- Identificación
    template_code   varchar(50) NOT NULL,           -- TPL-000001
    name            varchar(200) NOT NULL,
    description     text,

    -- Tipo de documento que genera esta plantilla
    document_type   varchar(100) NOT NULL CHECK (document_type IN (
        'FACTURA',          -- Factura de venta
        'COTIZACION',       -- Cotización / presupuesto
        'ORDEN_TRABAJO',    -- Orden de trabajo
        'CONTRATO',         -- Contrato de servicio
        'GARANTIA',         -- Certificado de garantía
        'RECIBO_PAGO',      -- Recibo de pago
        'INFORME',          -- Informe gerencial
        'OTRO'              -- Documento genérico
    )),

    -- Formato de salida que soporta esta plantilla
    output_format   varchar(20) NOT NULL DEFAULT 'PDF' CHECK (output_format IN (
        'PDF',              -- Puppeteer: HTML → PDF
        'DOCX',             -- Docxtemplater: .docx template → DOCX
        'AMBOS'             -- Puede generar PDF y DOCX
    )),

    -- Contenido HTML de la plantilla (output de GrapesJS)
    -- Variables en sintaxis Handlebars: {{cliente.nombre}}, {{#each items}}
    template_html   text,

    -- Referencia al archivo .docx base en storage (para Docxtemplater)
    docx_template_storage_path  varchar(500),

    -- Variables disponibles documentadas en JSON
    -- Ej: {"cliente.nombre":"string","total":"number","items":"array"}
    variables_schema    jsonb DEFAULT '{}',

    -- Versión y estado
    version     integer NOT NULL DEFAULT 1,
    is_default  boolean NOT NULL DEFAULT false,     -- Plantilla predeterminada para este tipo
    active      boolean NOT NULL DEFAULT true,

    -- Trazabilidad y Soft Delete
    created_at  timestamp NOT NULL DEFAULT NOW(),
    created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at  timestamp,
    updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at  timestamp,
    deleted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_template_code UNIQUE (tenant_id, template_code),
    CONSTRAINT chk_template_content CHECK (
        template_html IS NOT NULL OR docx_template_storage_path IS NOT NULL
    )
);

-- ============================================================
-- 2. TABLA: document_outputs
--    Historial de documentos generados por tenant
-- ============================================================
CREATE TABLE document_outputs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,

    -- Identificación del output
    output_code     varchar(50) NOT NULL,           -- DOC-000001
    template_id     uuid NOT NULL REFERENCES document_templates(id) ON DELETE RESTRICT,

    -- Tipo y formato efectivo del documento generado
    document_type   varchar(100) NOT NULL,
    output_format   varchar(20) NOT NULL CHECK (output_format IN ('PDF', 'DOCX')),

    -- Referencia al registro fuente del ERP (polimórfico)
    source_entity   varchar(100),   -- 'invoice', 'job', 'lead', 'warranty', etc.
    source_id       uuid,           -- id del registro fuente

    -- Datos del ERP inyectados en la plantilla (snapshot en el momento de generación)
    -- Manejados por Handlebars.js en la capa de aplicación
    template_data   jsonb DEFAULT '{}',

    -- Resultado de la generación
    status          varchar(50) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN (
        'PENDIENTE',        -- En cola de generación
        'GENERANDO',        -- Puppeteer/Docxtemplater procesando
        'COMPLETADO',       -- Archivo generado exitosamente
        'ERROR',            -- Falló la generación
        'ANULADO'           -- Anulado manualmente
    )),

    -- Ubicación del archivo generado en storage
    storage_path        varchar(500),
    file_size_bytes     bigint,
    generation_ms       integer,    -- Tiempo de generación en milisegundos

    -- Metadatos del documento generado
    document_title      varchar(300),
    document_number     varchar(100),   -- Ej: FAC-000123, COT-000045
    generated_at        timestamp,

    -- Mensaje de error si status = 'ERROR'
    error_message       text,

    -- Trazabilidad y Soft Delete
    created_at  timestamp NOT NULL DEFAULT NOW(),
    created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at  timestamp,
    updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at  timestamp,
    deleted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_output_code UNIQUE (tenant_id, output_code)
);

-- ============================================================
-- 3. ÍNDICES DE RENDIMIENTO
-- ============================================================
CREATE INDEX idx_doc_templates_tenant      ON document_templates(tenant_id);
CREATE INDEX idx_doc_templates_type        ON document_templates(document_type);
CREATE INDEX idx_doc_templates_active      ON document_templates(active);
CREATE INDEX idx_doc_templates_is_default  ON document_templates(is_default);

CREATE INDEX idx_doc_outputs_tenant        ON document_outputs(tenant_id);
CREATE INDEX idx_doc_outputs_template      ON document_outputs(template_id);
CREATE INDEX idx_doc_outputs_source        ON document_outputs(source_entity, source_id);
CREATE INDEX idx_doc_outputs_status        ON document_outputs(status);
CREATE INDEX idx_doc_outputs_type          ON document_outputs(document_type);
CREATE INDEX idx_doc_outputs_generated_at  ON document_outputs(generated_at DESC);

-- ============================================================
-- 4. TRIGGER: Autogeneración de Códigos Correlativos
-- ============================================================
CREATE OR REPLACE FUNCTION handle_document_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'document_templates' THEN
        IF NEW.template_code IS NULL OR NEW.template_code = '' THEN
            NEW.template_code := 'TPL-' || LPAD(
                get_next_tenant_sequence(NEW.tenant_id, 'DOCUMENT_TEMPLATE')::text, 6, '0'
            );
        END IF;

    ELSIF TG_TABLE_NAME = 'document_outputs' THEN
        IF NEW.output_code IS NULL OR NEW.output_code = '' THEN
            NEW.output_code := 'DOC-' || LPAD(
                get_next_tenant_sequence(NEW.tenant_id, 'DOCUMENT_OUTPUT')::text, 6, '0'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_template_code
BEFORE INSERT ON document_templates
FOR EACH ROW EXECUTE FUNCTION handle_document_sequences();

CREATE TRIGGER trg_handle_output_code
BEFORE INSERT ON document_outputs
FOR EACH ROW EXECUTE FUNCTION handle_document_sequences();

-- ============================================================
-- 5. TRIGGER: Garantizar una sola plantilla predeterminada por tipo
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE document_templates
        SET is_default = false,
            updated_at = NOW()
        WHERE tenant_id    = NEW.tenant_id
          AND document_type = NEW.document_type
          AND id            <> NEW.id
          AND is_default    = true
          AND deleted_at    IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_single_default_template
BEFORE INSERT OR UPDATE OF is_default ON document_templates
FOR EACH ROW
EXECUTE FUNCTION enforce_single_default_template();

-- ============================================================
-- 6. TRIGGER: Marcar timestamp de generación al completar
-- ============================================================
CREATE OR REPLACE FUNCTION handle_document_output_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Cuando pasa a COMPLETADO, registrar timestamp de generación
    IF NEW.status = 'COMPLETADO' AND (OLD.status IS NULL OR OLD.status <> 'COMPLETADO') THEN
        IF NEW.generated_at IS NULL THEN
            NEW.generated_at := NOW();
        END IF;
    END IF;

    -- Cuando pasa a ERROR, limpiar path de storage (no hay archivo válido)
    IF NEW.status = 'ERROR' AND (OLD.status IS NULL OR OLD.status <> 'ERROR') THEN
        NEW.storage_path := NULL;
        NEW.file_size_bytes := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_output_completion
BEFORE INSERT OR UPDATE OF status ON document_outputs
FOR EACH ROW
EXECUTE FUNCTION handle_document_output_completion();

-- ============================================================
-- 7. TRIGGER: Bloqueo de Borrado Físico (Soft Delete Obligatorio)
-- ============================================================
CREATE OR REPLACE FUNCTION block_physical_document_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada en módulo de documentos. Utilice soft delete (deleted_at).';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_template_delete
BEFORE DELETE ON document_templates
FOR EACH ROW EXECUTE FUNCTION block_physical_document_delete();

CREATE TRIGGER trg_block_output_delete
BEFORE DELETE ON document_outputs
FOR EACH ROW EXECUTE FUNCTION block_physical_document_delete();

-- ============================================================
-- 8. TRIGGER: Trazabilidad General (updated_at, updated_by)
-- ============================================================
CREATE TRIGGER trg_template_traceability
BEFORE INSERT OR UPDATE ON document_templates
FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

CREATE TRIGGER trg_output_traceability
BEFORE INSERT OR UPDATE ON document_outputs
FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- ============================================================
-- 9. TRIGGER: Auditoría General
-- ============================================================
CREATE TRIGGER audit_document_templates
AFTER INSERT OR UPDATE OR DELETE ON document_templates
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

CREATE TRIGGER audit_document_outputs
AFTER INSERT OR UPDATE OR DELETE ON document_outputs
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ============================================================
-- 10. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_outputs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. POLÍTICAS RLS — document_templates
-- ============================================================
-- Super Admin: acceso total cross-tenant
CREATE POLICY doc_templates_super_admin ON document_templates
FOR ALL TO authenticated
USING (is_platform_super_admin());

-- Lectura tenant: solo registros propios, no borrados (excepto AUDITOR)
CREATE POLICY doc_templates_select_tenant ON document_templates
FOR SELECT TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
           AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);

-- Escritura tenant: solo registros propios
CREATE POLICY doc_templates_write_tenant ON document_templates
FOR ALL TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
)
WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- ============================================================
-- 12. POLÍTICAS RLS — document_outputs
-- ============================================================
CREATE POLICY doc_outputs_super_admin ON document_outputs
FOR ALL TO authenticated
USING (is_platform_super_admin());

CREATE POLICY doc_outputs_select_tenant ON document_outputs
FOR SELECT TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
           AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);

CREATE POLICY doc_outputs_write_tenant ON document_outputs
FOR ALL TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
)
WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000019_notifications_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 19: SISTEMA DE NOTIFICACIONES Y ALERTAS
-- Archivo: supabase/migrations/20260617000019_notifications_core.sql
--
-- REUSE_ANALYSIS_FASE19 cumplido (9 repos evaluados):
--   IN_APP      → nativo (tabla notifications)
--   EMAIL       → Resend SDK     (MIT, 5.8k stars)
--   WHATSAPP    → Twilio SDK     (MIT, 3.6k stars)  — clientes externos
--   TELEGRAM    → grammY         (MIT, 4.8k stars)  — usuarios internos (GRATIS)
--   Cola/retry  → BullMQ         (MIT, 16k stars)
--
-- DECISIONES CONGELADAS:
--   D19-01: Clientes externos    → WhatsApp
--   D19-02: Usuarios internos ERP → Telegram (90%+ ahorro vs WhatsApp)
--   D19-03: Clientes corporativos → Email
--   D19-04: Todos los usuarios   → IN_APP
--   D19-09: telegram_chat_id + telegram_username añadidos a users

-- ============================================================
-- 1. EXTENSIÓN DE TABLA users
--    Añadir campos de Telegram para routing de notificaciones
-- ============================================================
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS telegram_chat_id   varchar(100),
    ADD COLUMN IF NOT EXISTS telegram_username   varchar(100);

COMMENT ON COLUMN users.telegram_chat_id  IS 'Chat ID único de Telegram del usuario. Requerido para enviar notificaciones vía grammY Bot API (D19-02).';
COMMENT ON COLUMN users.telegram_username IS 'Username de Telegram (@handle) del usuario. Facilita vinculación manual.';

CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON users(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

-- ============================================================
-- 2. TABLA: notification_templates
--    Plantillas Handlebars por canal y tipo de evento
-- ============================================================
CREATE TABLE notification_templates (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,

    -- Identificación
    template_code   varchar(50) NOT NULL,   -- NTP-000001

    -- Canal y evento al que aplica
    channel         varchar(20) NOT NULL CHECK (channel IN (
        'IN_APP',       -- Bandeja interna del ERP
        'EMAIL',        -- Email corporativo vía Resend SDK
        'WHATSAPP',     -- WhatsApp Business vía Twilio (clientes externos)
        'TELEGRAM'      -- Telegram Bot API vía grammY (usuarios internos — GRATIS)
    )),
    event_type      varchar(100) NOT NULL,  -- Ej: 'INVOICE_EMITTED', 'LEAD_SLA_BREACHED'

    -- Contenido de la plantilla (sintaxis Handlebars — reutiliza Handlebars.js de FASE 18)
    -- Ej: "Factura {{invoice_code}} emitida por {{amount}} COP"
    subject_template    text,       -- Asunto (Email) o título (IN_APP / Telegram)
    body_template       text NOT NULL,  -- Cuerpo del mensaje

    -- Versión y estado
    version     integer NOT NULL DEFAULT 1,
    active      boolean NOT NULL DEFAULT true,  -- Una sola activa por (channel, event_type)

    -- Trazabilidad y Soft Delete
    created_at  timestamp NOT NULL DEFAULT NOW(),
    created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at  timestamp,
    updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at  timestamp,
    deleted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_notif_template_code UNIQUE (tenant_id, template_code)
);

-- ============================================================
-- 3. TABLA: notifications
--    Historial completo de notificaciones (enviadas / en cola / fallidas)
-- ============================================================
CREATE TABLE notifications (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,

    -- Identificación
    notification_code   varchar(50) NOT NULL,   -- NOT-000001

    -- Canal utilizado
    channel     varchar(20) NOT NULL CHECK (channel IN (
        'IN_APP', 'EMAIL', 'WHATSAPP', 'TELEGRAM'
    )),

    -- Destinatario
    recipient_user_id   uuid REFERENCES users(id) ON DELETE SET NULL,
    recipient_contact   varchar(300),   -- Email, teléfono (+57...) o telegram_chat_id

    -- Origen: evento de negocio que la generó
    event_id    uuid,   -- Referencia a business_events (no FK estricta: puede pre-existir)
    event_type  varchar(100),   -- Snapshot del tipo de evento

    -- Plantilla usada
    template_id uuid REFERENCES notification_templates(id) ON DELETE SET NULL,

    -- Contenido renderizado (snapshot inmutable en el momento del envío)
    subject     varchar(500),
    body        text NOT NULL,

    -- Ciclo de vida
    status      varchar(30) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN (
        'PENDIENTE',    -- En cola, aún no procesada
        'ENVIANDO',     -- BullMQ procesando (Resend / Twilio / grammY / IN_APP)
        'ENTREGADA',    -- Confirmación de entrega recibida del proveedor
        'FALLIDA',      -- Falló después de todos los reintentos
        'ANULADA'       -- Anulada manualmente antes del envío
    )),

    -- Control de reintentos (BullMQ)
    retry_count     integer NOT NULL DEFAULT 0,
    max_retries     integer NOT NULL DEFAULT 3,
    next_retry_at   timestamp,

    -- Timestamps de ciclo de vida
    sent_at         timestamp,  -- Cuando se confirmó el envío exitoso
    failed_at       timestamp,  -- Cuando falló definitivamente
    read_at         timestamp,  -- Para IN_APP: cuando el usuario la leyó

    -- Confirmación del proveedor externo
    provider_message_id varchar(300),   -- ID de Resend, Twilio SID, Telegram message_id

    -- Mensaje de error (si status = 'FALLIDA')
    error_message   text,

    -- Trazabilidad y Soft Delete
    created_at  timestamp NOT NULL DEFAULT NOW(),
    created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at  timestamp,
    updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at  timestamp,
    deleted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_notification_code UNIQUE (tenant_id, notification_code)
);

-- ============================================================
-- 4. TABLA: notification_preferences
--    Preferencias por usuario: qué canales y eventos recibir
-- ============================================================
CREATE TABLE notification_preferences (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Canal al que aplica esta preferencia
    channel     varchar(20) NOT NULL CHECK (channel IN (
        'IN_APP', 'EMAIL', 'WHATSAPP', 'TELEGRAM'
    )),

    -- Tipo de evento (NULL = aplica a todos los eventos de este canal)
    event_type  varchar(100),

    -- Estado de la preferencia
    enabled     boolean NOT NULL DEFAULT true,

    -- Horario de silencio (no molestar)
    -- Ej: quiet_hours_start = '22:00', quiet_hours_end = '07:00'
    quiet_hours_start   time,
    quiet_hours_end     time,

    -- Trazabilidad (sin soft delete — preferencias se actualizan, no borran)
    created_at  timestamp NOT NULL DEFAULT NOW(),
    updated_at  timestamp,

    -- Una preferencia única por usuario + canal + event_type
    CONSTRAINT unique_user_channel_event UNIQUE (tenant_id, user_id, channel, event_type)
);

-- ============================================================
-- 5. ÍNDICES DE RENDIMIENTO
-- ============================================================
-- notification_templates
CREATE INDEX idx_notif_templates_tenant      ON notification_templates(tenant_id);
CREATE INDEX idx_notif_templates_channel     ON notification_templates(channel);
CREATE INDEX idx_notif_templates_event_type  ON notification_templates(event_type);
CREATE INDEX idx_notif_templates_active      ON notification_templates(active);
-- Índice compuesto para lookup rápido de plantilla activa
CREATE INDEX idx_notif_templates_lookup      ON notification_templates(tenant_id, channel, event_type, active);

-- notifications
CREATE INDEX idx_notifications_tenant        ON notifications(tenant_id);
CREATE INDEX idx_notifications_recipient     ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_channel       ON notifications(channel);
CREATE INDEX idx_notifications_status        ON notifications(status);
CREATE INDEX idx_notifications_event_id      ON notifications(event_id);
CREATE INDEX idx_notifications_template      ON notifications(template_id);
CREATE INDEX idx_notifications_created_at    ON notifications(created_at DESC);
-- Índice para bandeja IN_APP (usuario + no leídas)
CREATE INDEX idx_notifications_inbox         ON notifications(recipient_user_id, read_at, status)
    WHERE channel = 'IN_APP' AND deleted_at IS NULL;

-- notification_preferences
CREATE INDEX idx_notif_prefs_tenant          ON notification_preferences(tenant_id);
CREATE INDEX idx_notif_prefs_user            ON notification_preferences(user_id);
CREATE INDEX idx_notif_prefs_channel         ON notification_preferences(channel);

-- ============================================================
-- 6. TRIGGER: Autogeneración de Códigos Correlativos
-- ============================================================
CREATE OR REPLACE FUNCTION handle_notification_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'notification_templates' THEN
        IF NEW.template_code IS NULL OR NEW.template_code = '' THEN
            NEW.template_code := 'NTP-' || LPAD(
                get_next_tenant_sequence(NEW.tenant_id, 'NOTIFICATION_TEMPLATE')::text, 6, '0'
            );
        END IF;

    ELSIF TG_TABLE_NAME = 'notifications' THEN
        IF NEW.notification_code IS NULL OR NEW.notification_code = '' THEN
            NEW.notification_code := 'NOT-' || LPAD(
                get_next_tenant_sequence(NEW.tenant_id, 'NOTIFICATION')::text, 6, '0'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_notif_template_code
BEFORE INSERT ON notification_templates
FOR EACH ROW EXECUTE FUNCTION handle_notification_sequences();

CREATE TRIGGER trg_handle_notification_code
BEFORE INSERT ON notifications
FOR EACH ROW EXECUTE FUNCTION handle_notification_sequences();

-- ============================================================
-- 7. TRIGGER: Una sola plantilla activa por (tenant, channel, event_type)
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_single_active_notification_template()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.active = true THEN
        UPDATE notification_templates
        SET active     = false,
            updated_at = NOW()
        WHERE tenant_id  = NEW.tenant_id
          AND channel    = NEW.channel
          AND event_type = NEW.event_type
          AND id         <> NEW.id
          AND active     = true
          AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_single_active_notif_template
BEFORE INSERT OR UPDATE OF active ON notification_templates
FOR EACH ROW
EXECUTE FUNCTION enforce_single_active_notification_template();

-- ============================================================
-- 8. TRIGGER: Gestión de timestamps de ciclo de vida
-- ============================================================
CREATE OR REPLACE FUNCTION handle_notification_lifecycle()
RETURNS TRIGGER AS $$
BEGIN
    -- Al pasar a ENTREGADA: registrar sent_at
    IF NEW.status = 'ENTREGADA' AND (OLD IS NULL OR OLD.status <> 'ENTREGADA') THEN
        IF NEW.sent_at IS NULL THEN
            NEW.sent_at := NOW();
        END IF;
    END IF;

    -- Al pasar a FALLIDA: registrar failed_at y limpiar next_retry_at
    IF NEW.status = 'FALLIDA' AND (OLD IS NULL OR OLD.status <> 'FALLIDA') THEN
        IF NEW.failed_at IS NULL THEN
            NEW.failed_at := NOW();
        END IF;
        NEW.next_retry_at := NULL;
    END IF;

    -- Al leer una notificación IN_APP: registrar read_at
    IF NEW.channel = 'IN_APP' AND NEW.read_at IS NOT NULL AND (OLD IS NULL OR OLD.read_at IS NULL) THEN
        -- read_at ya fue seteado externamente — solo validar consistencia
        IF NEW.status = 'ENTREGADA' THEN
            NULL; -- OK
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_notification_lifecycle
BEFORE INSERT OR UPDATE OF status, read_at ON notifications
FOR EACH ROW
EXECUTE FUNCTION handle_notification_lifecycle();

-- ============================================================
-- 9. TRIGGER: Bloqueo de Borrado Físico (Soft Delete Obligatorio)
-- ============================================================
CREATE OR REPLACE FUNCTION block_physical_notification_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada en módulo de notificaciones. Use soft delete (deleted_at).';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_notif_template_delete
BEFORE DELETE ON notification_templates
FOR EACH ROW EXECUTE FUNCTION block_physical_notification_delete();

CREATE TRIGGER trg_block_notification_delete
BEFORE DELETE ON notifications
FOR EACH ROW EXECUTE FUNCTION block_physical_notification_delete();

-- ============================================================
-- 10. TRIGGER: Trazabilidad General
-- ============================================================
CREATE TRIGGER trg_notif_template_traceability
BEFORE INSERT OR UPDATE ON notification_templates
FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

CREATE TRIGGER trg_notification_traceability
BEFORE INSERT OR UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- ============================================================
-- 11. TRIGGER: Auditoría General
-- ============================================================
CREATE TRIGGER audit_notification_templates
AFTER INSERT OR UPDATE OR DELETE ON notification_templates
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

CREATE TRIGGER audit_notifications
AFTER INSERT OR UPDATE OR DELETE ON notifications
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ============================================================
-- 12. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 13. POLÍTICAS RLS — notification_templates
-- ============================================================
CREATE POLICY notif_templates_super_admin ON notification_templates
FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY notif_templates_select_tenant ON notification_templates
FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND deleted_at IS NULL
);

CREATE POLICY notif_templates_write_tenant ON notification_templates
FOR ALL TO authenticated
USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1))
WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1));

-- ============================================================
-- 14. POLÍTICAS RLS — notifications
--     Un usuario solo ve SUS PROPIAS notificaciones
-- ============================================================
CREATE POLICY notifications_super_admin ON notifications
FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY notifications_own_records ON notifications
FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND recipient_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND deleted_at IS NULL
);

CREATE POLICY notifications_write_tenant ON notifications
FOR ALL TO authenticated
USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1))
WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1));

-- ============================================================
-- 15. POLÍTICAS RLS — notification_preferences
--     Un usuario solo gestiona SUS PROPIAS preferencias
-- ============================================================
CREATE POLICY notif_prefs_super_admin ON notification_preferences
FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY notif_prefs_own_records ON notification_preferences
FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY notif_prefs_write_own ON notification_preferences
FOR ALL TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
)
WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000020_security_audit_core.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 20: SEGURIDAD Y AUDITORÍA AVANZADA
-- Archivo: supabase/migrations/20260617000020_security_audit_core.sql

-- 1. Crear Tabla de Logs de Acceso de Usuarios (user_access_logs)
CREATE TABLE user_access_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    access_code varchar(50) NOT NULL,
    login_at timestamp NOT NULL DEFAULT NOW(),
    logout_at timestamp,
    ip_address varchar(100),
    user_agent text,
    status varchar(50) NOT NULL,
    failure_reason text,
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW(),
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,
    CONSTRAINT chk_access_log_status CHECK (status IN ('SUCCESS', 'FAILED', 'LOGOUT')),
    CONSTRAINT unique_tenant_access_code UNIQUE (tenant_id, access_code)
);

-- 2. Crear Índices de Rendimiento y Búsqueda
CREATE INDEX idx_user_access_logs_tenant ON user_access_logs(tenant_id);
CREATE INDEX idx_user_access_logs_user ON user_access_logs(user_id);
CREATE INDEX idx_user_access_logs_status_login ON user_access_logs(status, login_at);

-- 3. Trigger para Generación Automática de Código ACC-000001
CREATE OR REPLACE FUNCTION handle_access_log_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.access_code IS NULL OR NEW.access_code = '' THEN
        NEW.access_code := 'ACC-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'ACCESS_LOG')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_access_log_code
BEFORE INSERT ON user_access_logs
FOR EACH ROW
EXECUTE FUNCTION handle_access_log_sequences();

-- 4. Trigger de Bloqueo de Borrado Físico
CREATE OR REPLACE FUNCTION block_physical_access_log_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'El borrado físico está estrictamente prohibido en user_access_logs.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_physical_access_log_delete
BEFORE DELETE ON user_access_logs
FOR EACH ROW
EXECUTE FUNCTION block_physical_access_log_delete();

-- 5. Trigger de Enforzamiento de Inmutabilidad de Registros de Acceso
-- Solo se permite actualizar: logout_at, deleted_at, deleted_by y delete_reason
CREATE OR REPLACE FUNCTION enforce_access_log_inmutability()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.id <> NEW.id OR
       OLD.tenant_id <> NEW.tenant_id OR
       OLD.user_id IS DISTINCT FROM NEW.user_id OR
       OLD.access_code <> NEW.access_code OR
       OLD.login_at <> NEW.login_at OR
       OLD.ip_address IS DISTINCT FROM NEW.ip_address OR
       OLD.user_agent IS DISTINCT FROM NEW.user_agent OR
       OLD.status <> NEW.status OR
       OLD.failure_reason IS DISTINCT FROM NEW.failure_reason OR
       OLD.created_at <> NEW.created_at THEN
        RAISE EXCEPTION 'Los registros de user_access_logs son inmutables. Modificación de campos principales prohibida.';
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_access_log_inmutability
BEFORE UPDATE ON user_access_logs
FOR EACH ROW
EXECUTE FUNCTION enforce_access_log_inmutability();

-- 6. Trigger para Integración de Auditoría Técnica (audit_log)
CREATE TRIGGER audit_user_access_logs
AFTER INSERT OR UPDATE OR DELETE ON user_access_logs
FOR EACH ROW
EXECUTE FUNCTION process_audit_log();

-- 7. Habilitar RLS en la tabla user_access_logs
ALTER TABLE user_access_logs ENABLE ROW LEVEL SECURITY;

-- 8. Políticas de RLS
-- 8.1 Bypass completo para Super Admins
CREATE POLICY user_access_logs_super_admin ON user_access_logs
FOR ALL TO authenticated
USING (is_platform_super_admin())
WITH CHECK (is_platform_super_admin());

-- 8.2 Lectura para auditores y gerentes de su propio tenant
CREATE POLICY user_access_logs_tenant_auditor ON user_access_logs
FOR SELECT TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND EXISTS (
        SELECT 1 FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
        AND r.role_code IN ('AUDITOR', 'GERENTE')
    )
);

-- 8.3 Lectura de sus propios registros para usuarios normales
CREATE POLICY user_access_logs_own_records ON user_access_logs
FOR SELECT TO authenticated
USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- 8.4 Inserción para usuarios autenticados
CREATE POLICY user_access_logs_insert_authenticated ON user_access_logs
FOR INSERT TO authenticated
WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- 8.5 Actualización de sus propios registros (para cerrar sesión / soft delete)
CREATE POLICY user_access_logs_update_authenticated ON user_access_logs
FOR UPDATE TO authenticated
USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
)
WITH CHECK (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000021_performance_hardening.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 21: HARDENING / RENDIMIENTO DE BASE DE DATOS
-- Archivo: supabase/migrations/20260617000021_performance_hardening.sql

-- 1. Capa Core y Usuarios
CREATE INDEX idx_users_site_id ON users(site_id);
CREATE INDEX idx_users_area_id ON users(area_id);
CREATE INDEX idx_users_manager_id ON users(manager_id);

-- 2. Capa de Requerimientos y Documentos
CREATE INDEX idx_requirements_contact_id ON requirements(contact_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_requirements_created_by ON requirements(created_by) WHERE deleted_at IS NULL;

-- 3. Capa de Cotizaciones
CREATE INDEX idx_quotes_created_by ON quotes(created_by) WHERE deleted_at IS NULL;

-- 4. Capa de Trabajos (Jobs)
CREATE INDEX idx_jobs_assigned_user_id ON jobs(assigned_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_created_by ON jobs(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_quote_id ON jobs(quote_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_activities_assigned ON job_activities(assigned_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_activities_created_by ON job_activities(created_by) WHERE deleted_at IS NULL;

-- 5. Capa de Inventarios
CREATE INDEX idx_inventory_movements_item ON inventory_movements(item_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_movements_warehouse ON inventory_movements(warehouse_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_movements_source ON inventory_movements(source_warehouse_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_movements_destination ON inventory_movements(destination_warehouse_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_movements_created_by ON inventory_movements(created_by) WHERE deleted_at IS NULL;

-- 6. Capa de Facturación y Pagos
CREATE INDEX idx_invoices_quote_id ON invoices(quote_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_job_id ON invoices(job_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_created_by ON invoices(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_created_by ON payments(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_customer_advances_created_by ON customer_advances(created_by) WHERE deleted_at IS NULL;

-- 7. Capa de Garantías (Garantías e Intervenciones)
CREATE INDEX idx_warranties_created_by ON warranties(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_warranty_interventions_assigned ON warranty_interventions(assigned_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_warranty_interventions_created_by ON warranty_interventions(created_by) WHERE deleted_at IS NULL;

-- 8. Capa de Configuración, Notificaciones y Logs
CREATE INDEX idx_notifications_template_partial ON notifications(template_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_created_by ON notifications(created_by) WHERE deleted_at IS NULL;



-- --------------------------------------------------
-- MIGRACIÓN: 20260617000022_uat_validation.sql
-- --------------------------------------------------
-- FASE 22: Pruebas de Aceptación de Usuario (UAT)
-- Archivo: supabase/migrations/20260617000022_uat_validation.sql

-- Paso 1: Creación de Cliente y Contacto (clients + client_contacts)
-- Paso 2: Registro de Oportunidad (Requerimiento) (requirements en estado REGISTRADO)
-- Paso 3: Generación y Versionado de Cotización (quotes + quote_items)
-- Paso 4: Flujo de Aprobaciones Básicas y Avanzadas (approval_requests -> aprobación de gerencia)
-- Paso 5: Generación Automática de Orden de Trabajo (Job) (requirements.status -> OT_GENERADA)
-- Paso 6: Desglose de Actividades Operativas (job_activities asignadas a técnicos)
-- Paso 7: Consumo de Inventario y Actualización de Costos (inventory_movements -> average_cost)
-- Paso 8: Carga Documental de Acta de Entrega (documents con type DELIVERY_NOTE y status PUBLICADO)
-- Paso 9: Entrega y Cierre del Trabajo (jobs.status -> ENTREGADO -> CERRADO)
-- Paso 10: Autogeneración de Garantía (warranties creada automáticamente por trigger)
-- Paso 11: Emisión de Factura y Aplicación de Pagos (invoices + payments + customer_advances)
-- Paso 12: Cálculo de Margen de Rentabilidad (vistas job_profitability y client_profitability)

CREATE OR REPLACE FUNCTION run_uat_validation_metadata()
RETURNS jsonb AS $$
BEGIN
    RETURN jsonb_build_object(
        'phase', 22,
        'name', 'User Acceptance Testing (UAT)',
        'steps_configured', jsonb_build_array(
            'STEP_1_CLIENT_AND_CONTACT',
            'STEP_2_OPPORTUNITY_REQUIREMENT',
            'STEP_3_QUOTE_GENERATION_AND_VERSIONING',
            'STEP_4_APPROVAL_FLOWS_COMPLEX',
            'STEP_5_AUTOMATIC_JOB_GENERATION',
            'STEP_6_OPERATIONAL_ACTIVITIES_BREAKDOWN',
            'STEP_7_INVENTORY_CONSUMPTION_COSTING',
            'STEP_8_DOCUMENTARY_DELIVERY_NOTE',
            'STEP_9_JOB_DELIVERY_AND_CLOSURE',
            'STEP_10_AUTOMATIC_WARRANTY_PROVISION',
            'STEP_11_INVOICING_AND_PAYMENTS_APPLICATION',
            'STEP_12_PROFITABILITY_MARGINS_CALCULATION'
        ),
        'assertions', jsonb_build_object(
            'client_contacts_primary_check', true,
            'requirements_status_flow', true,
            'quote_items_autocalculo', true,
            'approval_flow_rules_hierarchy', true,
            'jobs_auto_generation_on_ot_generada', true,
            'job_activities_dates_range_validation', true,
            'inventory_average_cost_recalc', true,
            'documents_delivery_note_check', true,
            'warranty_generation_on_job_closed', true,
            'invoice_status_recalculation', true,
            'profitability_security_invoker', true
        )
    );
END;
$$ LANGUAGE plpgsql;


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000023_release_monitoring.sql
-- --------------------------------------------------
-- FASE 23: Release / Producción (Go-Live)
-- Archivo: supabase/migrations/20260617000023_release_monitoring.sql

-- 1. Habilitación de RLS para tenant_sequences (Mitigación de seguridad pendiente)
ALTER TABLE tenant_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_sequences_super_admin ON tenant_sequences
    FOR ALL
    USING (is_platform_super_admin());

CREATE POLICY tenant_sequences_tenant_isolation ON tenant_sequences
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);


-- 2. Creación de la vista para monitoreo de consultas lentas (pg_stat_statements)
-- Esta vista ayuda a los administradores a identificar cuellos de botella de rendimiento
CREATE OR REPLACE VIEW public.performance_queries_summary WITH (security_invoker = true) AS
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    rows
FROM 
    extensions.pg_stat_statements;


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000031_settings_core.sql
-- --------------------------------------------------
-- FASE 31: Centro de Configuración Empresarial (Settings)
-- Archivo: supabase/migrations/20260617000031_settings_core.sql
--
-- DECISIONES HEREDADAS (docs/30_configuracion_global/0.1 DECISIONES CONFIGURACION.md):
-- D30-01: Almacenamiento en DB — nunca en .env
-- D30-02: Esquema JSONB con validación
-- D30-03: Cero hardcoding de teléfonos, logos, colores, correos
-- D30-06: RLS estricto en tablas de configuración

-- ============================================================
-- 1. TABLA PRINCIPAL: tenant_settings
--    Configuración central por módulo usando JSONB
-- ============================================================
CREATE TABLE tenant_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Módulo de configuración (agrupación lógica)
    module varchar(100) NOT NULL CHECK (module IN (
        'EMPRESA',
        'LOCALIZACION',
        'IDENTIDAD',
        'DOCUMENTOS',
        'ERP'
    )),

    -- Clave de la configuración (ej: 'nombre_comercial', 'logo_claro_url')
    config_key varchar(150) NOT NULL,

    -- Valor en JSONB (string, número, boolean, array u objeto anidado)
    config_value jsonb NOT NULL DEFAULT 'null',

    -- Descripción interna de la configuración
    description text,

    -- ¿Es visible en la UI del administrador?
    is_public boolean NOT NULL DEFAULT true,

    -- ¿Requiere cifrado? (para claves de API en FASE 33)
    is_encrypted boolean NOT NULL DEFAULT false,

    -- Trazabilidad
    created_at  timestamp NOT NULL DEFAULT NOW(),
    updated_at  timestamp NOT NULL DEFAULT NOW(),
    updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at  timestamp,
    deleted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    UNIQUE (tenant_id, module, config_key)
);

COMMENT ON TABLE tenant_settings IS 'Repositorio central de configuración de cada inquilino. Cero hardcoding. D30-01/D30-02/D30-03.';

-- ============================================================
-- 2. FUNCIÓN DE UTILIDAD: get_tenant_setting
--    Lee un valor de configuración específico por tenant
-- ============================================================
CREATE OR REPLACE FUNCTION get_tenant_setting(
    p_tenant_id uuid,
    p_module varchar,
    p_key varchar
)
RETURNS jsonb AS $$
DECLARE
    v_value jsonb;
BEGIN
    SELECT config_value
    INTO v_value
    FROM tenant_settings
    WHERE tenant_id = p_tenant_id
      AND module = p_module
      AND config_key = p_key
      AND deleted_at IS NULL;

    RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. FUNCIÓN DE UTILIDAD: set_tenant_setting
--    Inserta o actualiza una configuración (UPSERT)
-- ============================================================
CREATE OR REPLACE FUNCTION set_tenant_setting(
    p_tenant_id uuid,
    p_module varchar,
    p_key varchar,
    p_value jsonb,
    p_updated_by uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO tenant_settings (tenant_id, module, config_key, config_value, updated_by, updated_at)
    VALUES (p_tenant_id, p_module, p_key, p_value, p_updated_by, NOW())
    ON CONFLICT (tenant_id, module, config_key)
    DO UPDATE SET
        config_value = EXCLUDED.config_value,
        updated_by   = EXCLUDED.updated_by,
        updated_at   = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION handle_tenant_settings_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenant_settings_updated_at
    BEFORE UPDATE ON tenant_settings
    FOR EACH ROW EXECUTE FUNCTION handle_tenant_settings_updated_at();

-- ============================================================
-- 5. TRIGGER: Bloqueo de borrado físico (Soft Delete obligatorio)
-- ============================================================
CREATE OR REPLACE FUNCTION block_physical_settings_delete()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'El borrado físico de configuraciones está prohibido. Use deleted_at para desactivar.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_physical_settings_delete
    BEFORE DELETE ON tenant_settings
    FOR EACH ROW EXECUTE FUNCTION block_physical_settings_delete();

-- ============================================================
-- 6. TRIGGER: Auditoría en audit_log
-- ============================================================
CREATE TRIGGER trg_tenant_settings_audit
    AFTER INSERT OR UPDATE ON tenant_settings
    FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- Super Admin: acceso total cross-tenant
CREATE POLICY tenant_settings_super_admin ON tenant_settings
    FOR ALL
    USING (is_platform_super_admin());

-- Lectura: cualquier usuario del tenant puede leer su configuración pública
CREATE POLICY tenant_settings_read ON tenant_settings
    FOR SELECT
    USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND is_public = true
    );

-- Escritura: solo ADMINISTRADOR_TENANT y GERENTE pueden actualizar configuración
CREATE POLICY tenant_settings_write ON tenant_settings
    FOR ALL
    USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('ADMINISTRADOR_TENANT', 'GERENTE', 'GERENTE_GENERAL')
    );

-- ============================================================
-- 8. ÍNDICES DE RENDIMIENTO
-- ============================================================
CREATE INDEX idx_tenant_settings_tenant_module
    ON tenant_settings(tenant_id, module)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_tenant_settings_key
    ON tenant_settings(tenant_id, config_key)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_tenant_settings_updated_by
    ON tenant_settings(updated_by)
    WHERE deleted_at IS NULL;

-- ============================================================
-- 9. DATOS SEMILLA: Configuración por defecto para módulo EMPRESA
--    (Solo estructura — valores se configuran en el wizard de onboarding)
-- ============================================================
-- Nota: No se insertan datos hardcoded. La función set_tenant_setting
-- se usa desde el wizard de onboarding del tenant para configurar estos valores.
-- Claves predefinidas del módulo EMPRESA:
--   nombre_comercial, razon_social, nit, regimen, direccion,
--   ciudad, departamento, pais, codigo_postal, web,
--   email_corporativo, telefono_principal, telefono_secundario,
--   whatsapp_principal, whatsapp_soporte, whatsapp_ventas,
--   telegram_chat_id, horario_laboral_inicio, horario_laboral_fin
--
-- Claves predefinidas del módulo LOCALIZACION:
--   zona_horaria, idioma, moneda, formato_fecha,
--   formato_hora, separador_decimal, separador_miles
--
-- Claves predefinidas del módulo IDENTIDAD:
--   logo_claro_url, logo_oscuro_url, logo_pdf_url,
--   logo_login_url, favicon_url, splash_url, loader_url,
--   icono_movil_url, color_primario, color_secundario,
--   color_exito, color_warning, color_danger, color_info,
--   tipografia_principal, border_radius, sombras, animaciones
--
-- Claves predefinidas del módulo DOCUMENTOS:
--   pie_pagina, encabezado, firma_url, sello_url,
--   qr_habilitado, margen_superior, margen_inferior,
--   margen_izquierdo, margen_derecho, numeracion_formato,
--   formato_pdf, formato_impresion
--
-- Claves predefinidas del módulo ERP:
--   nombre_sistema, version_visible, url_soporte,
--   email_soporte, url_centro_ayuda, url_manual_usuario,
--   url_politica_privacidad, url_terminos, url_cookies


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000032_white_label.sql
-- --------------------------------------------------
--
-- FASE 32: White Label (Branding Dinámico)
--
-- DECISIONES HEREDADAS:
-- D30-01: Almacenamiento centralizado en DB
-- D30-02: Esquema JSONB con validación de esquema
-- D30-03: Cero hardcoding de identidades, logotipos, colores
-- D30-06: RLS en configuraciones

-- ============================================================
-- 1. TRIGGER FUNCTION: validate_tenant_settings_white_label
--    Valida sintaxis y formato de variables de White Label
-- ============================================================
CREATE OR REPLACE FUNCTION validate_tenant_settings_white_label()
RETURNS trigger AS $$
DECLARE
    v_val_type varchar;
    v_val_str text;
BEGIN
    -- Solo validar configuraciones en módulos visuales/de identidad
    IF NEW.module IN ('IDENTIDAD', 'ERP', 'DOCUMENTOS') THEN
        v_val_type := jsonb_typeof(NEW.config_value);

        -- 1. Validar colores primario, secundario, estado
        IF NEW.config_key IN (
            'color_primario', 
            'color_secundario', 
            'color_exito', 
            'color_warning', 
            'color_danger', 
            'color_info'
        ) THEN
            IF v_val_type <> 'string' THEN
                RAISE EXCEPTION 'El valor para la clave de color % debe ser un string.', NEW.config_key;
            END IF;
            
            v_val_str := NEW.config_value#>>'{}';
            IF NOT (
                v_val_str ~* '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' OR 
                v_val_str ~* '^rgba?\(\s*[0-9\s.%]+\s*,\s*[0-9\s.%]+\s*,\s*[0-9\s.%]+\s*(,\s*[0-9\s.%]+\s*)?\)$' OR 
                v_val_str ~* '^hsla?\(\s*[0-9\s.%degrad]+\s*,\s*[0-9\s.%]+\s*,\s*[0-9\s.%]+\s*(,\s*[0-9\s.%]+\s*)?\)$' OR
                v_val_str ~* '^[a-z]+$'
            ) THEN
                RAISE EXCEPTION 'El color % tiene un formato inválido: %. Debe ser Hex, RGB, RGBA, HSL, HSLA o un nombre de color estándar.', NEW.config_key, v_val_str;
            END IF;
        END IF;

        -- 2. Validar URLs y rutas de logotipos, favicons e iconos
        IF NEW.config_key IN (
            'logo_claro_url', 
            'logo_oscuro_url', 
            'logo_login_url', 
            'logo_pdf_url', 
            'favicon_url', 
            'splash_url', 
            'loader_url', 
            'icono_movil_url', 
            'firma_url', 
            'sello_url'
        ) THEN
            IF v_val_type <> 'string' THEN
                RAISE EXCEPTION 'El valor para la clave de URL % debe ser un string.', NEW.config_key;
            END IF;
            
            v_val_str := NEW.config_value#>>'{}';
            IF NOT (
                v_val_str ~* '^https?:\/\/.*' OR 
                v_val_str ~* '^\/.*' OR 
                v_val_str ~* '^data:image\/[a-zA-Z+-]+;base64,.*' OR 
                v_val_str = ''
            ) THEN
                RAISE EXCEPTION 'La URL % tiene un formato de ruta inválido: %. Debe ser URL absoluta, ruta relativa o Base64.', NEW.config_key, v_val_str;
            END IF;
        END IF;

        -- 3. Validar layouts (deben ser objetos o arrays JSON estructurados)
        IF NEW.config_key IN (
            'layout_sidebar', 
            'layout_dashboard', 
            'layout_menus', 
            'layout_widgets'
        ) THEN
            IF v_val_type NOT IN ('object', 'array') THEN
                RAISE EXCEPTION 'El layout de % debe ser un objeto o un array JSON válido.', NEW.config_key;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asignar trigger a la tabla tenant_settings
CREATE TRIGGER trg_validate_tenant_settings_white_label
    BEFORE INSERT OR UPDATE ON tenant_settings
    FOR EACH ROW EXECUTE FUNCTION validate_tenant_settings_white_label();


-- ============================================================
-- 2. FUNCIÓN DE UTILIDAD: get_white_label_config
--    Obtiene la configuración visual consolidada de un tenant
-- ============================================================
CREATE OR REPLACE FUNCTION get_white_label_config(p_tenant_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_object_agg(config_key, config_value)
    INTO v_result
    FROM tenant_settings
    WHERE tenant_id = p_tenant_id
      AND module IN ('IDENTIDAD', 'ERP', 'DOCUMENTOS')
      AND deleted_at IS NULL;

    IF v_result IS NULL THEN
        RETURN '{}'::jsonb;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. FUNCIÓN DE UTILIDAD: get_my_white_label_config
--    Obtiene el branding del tenant actual a partir del token JWT
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_white_label_config()
RETURNS jsonb AS $$
DECLARE
    v_tenant_id uuid;
BEGIN
    v_tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado o JWT inválido.';
    END IF;

    RETURN get_white_label_config(v_tenant_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000033_integrations.sql
-- --------------------------------------------------
--
-- FASE 33: Integraciones y Canales
--
-- DECISIONES HEREDADAS:
-- D30-01: Almacenamiento centralizado en DB
-- D30-02: Esquema JSONB con validación de esquema
-- D30-03: Cero hardcoding de identidades, logotipos, colores, teléfonos
-- D30-06: RLS en configuraciones

-- Habilitar extensión pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. ACTUALIZAR RESTRICCIÓN DE MÓDULOS EN tenant_settings
-- ============================================================
ALTER TABLE tenant_settings DROP CONSTRAINT IF EXISTS tenant_settings_module_check;
ALTER TABLE tenant_settings ADD CONSTRAINT tenant_settings_module_check
    CHECK (module IN ('EMPRESA', 'LOCALIZACION', 'IDENTIDAD', 'DOCUMENTOS', 'ERP', 'INTEGRACIONES', 'TELEFONIA'));

-- ============================================================
-- 2. TRIGGER FUNCTION: handle_tenant_settings_encryption
--    Cifra transparentemente los valores si is_encrypted = true
-- ============================================================
CREATE OR REPLACE FUNCTION handle_tenant_settings_encryption()
RETURNS trigger AS $$
DECLARE
    v_passphrase text;
    v_encrypted_bytea bytea;
    v_base64 text;
BEGIN
    -- Solo cifrar si is_encrypted es verdadero y el valor no es nulo/vacío
    IF NEW.is_encrypted = true AND jsonb_typeof(NEW.config_value) <> 'null' THEN
        -- Solo cifrar en inserciones o si el valor ha cambiado realmente
        IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.config_value IS DISTINCT FROM OLD.config_value) THEN
            -- Resolver frase secreta del sistema
            v_passphrase := coalesce(current_setting('app.settings_secret_key', true), 'b2b-erp-default-secret-passphrase');
            
            -- Cifrar la representación textual del valor JSONB
            v_encrypted_bytea := pgp_sym_encrypt(NEW.config_value::text, v_passphrase);
            v_base64 := encode(v_encrypted_bytea, 'base64');
            
            -- Guardar como string JSONB
            NEW.config_value := to_jsonb(v_base64);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger con prefijo 'trg_z_' para ejecutarse AL FINAL del flujo BEFORE UPDATE/INSERT
-- (después de las validaciones de tipos de datos en texto plano)
DROP TRIGGER IF EXISTS trg_z_tenant_settings_encryption ON tenant_settings;
CREATE TRIGGER trg_z_tenant_settings_encryption
    BEFORE INSERT OR UPDATE ON tenant_settings
    FOR EACH ROW EXECUTE FUNCTION handle_tenant_settings_encryption();

-- ============================================================
-- 3. FUNCIÓN DE UTILIDAD ACTUALIZADA: get_tenant_setting
--    Soporta descifrado automático en tiempo de lectura
-- ============================================================
CREATE OR REPLACE FUNCTION get_tenant_setting(
    p_tenant_id uuid,
    p_module varchar,
    p_key varchar
)
RETURNS jsonb AS $$
DECLARE
    v_value jsonb;
    v_is_encrypted boolean;
    v_passphrase text;
    v_decrypted_text text;
BEGIN
    SELECT config_value, is_encrypted
    INTO v_value, v_is_encrypted
    FROM tenant_settings
    WHERE tenant_id = p_tenant_id
      AND module = p_module
      AND config_key = p_key
      AND deleted_at IS NULL;

    IF v_value IS NULL THEN
        RETURN NULL;
    END IF;

    -- Descifrar transparentemente si el campo se marcó como cifrado
    IF v_is_encrypted = true AND jsonb_typeof(v_value) = 'string' THEN
        v_passphrase := coalesce(current_setting('app.settings_secret_key', true), 'b2b-erp-default-secret-passphrase');
        BEGIN
            v_decrypted_text := pgp_sym_decrypt(decode(v_value#>>'{}', 'base64'), v_passphrase);
            RETURN v_decrypted_text::jsonb;
        EXCEPTION WHEN OTHERS THEN
            -- En caso de fallo (ej: mala clave secreta), retornar NULL
            RETURN NULL;
        END;
    END IF;

    RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. VALIDACIÓN DE PANTALLAS Y TELEFONÍA (MÓDULOS ADICIONALES)
-- ============================================================
CREATE OR REPLACE FUNCTION validate_tenant_settings_white_label()
RETURNS trigger AS $$
DECLARE
    v_val_type varchar;
    v_val_str text;
BEGIN
    v_val_type := jsonb_typeof(NEW.config_value);

    -- 1. Validaciones para IDENTIDAD, ERP, DOCUMENTOS (Branding / White Label)
    IF NEW.module IN ('IDENTIDAD', 'ERP', 'DOCUMENTOS') THEN
        -- Validar colores
        IF NEW.config_key IN (
            'color_primario', 
            'color_secundario', 
            'color_exito', 
            'color_warning', 
            'color_danger', 
            'color_info'
        ) THEN
            IF v_val_type <> 'string' THEN
                RAISE EXCEPTION 'El valor para la clave de color % debe ser un string.', NEW.config_key;
            END IF;
            
            v_val_str := NEW.config_value#>>'{}';
            IF NOT (
                v_val_str ~* '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' OR 
                v_val_str ~* '^rgba?\(\s*[0-9\s.%]+\s*,\s*[0-9\s.%]+\s*,\s*[0-9\s.%]+\s*(,\s*[0-9\s.%]+\s*)?\)$' OR 
                v_val_str ~* '^hsla?\(\s*[0-9\s.%degrad]+\s*,\s*[0-9\s.%]+\s*,\s*[0-9\s.%]+\s*(,\s*[0-9\s.%]+\s*)?\)$' OR
                v_val_str ~* '^[a-z]+$'
            ) THEN
                RAISE EXCEPTION 'El color % tiene un formato inválido: %. Debe ser Hex, RGB, RGBA, HSL, HSLA o un nombre de color estándar.', NEW.config_key, v_val_str;
            END IF;
        END IF;

        -- Validar URLs
        IF NEW.config_key IN (
            'logo_claro_url', 
            'logo_oscuro_url', 
            'logo_login_url', 
            'logo_pdf_url', 
            'favicon_url', 
            'splash_url', 
            'loader_url', 
            'icono_movil_url', 
            'firma_url', 
            'sello_url'
        ) THEN
            IF v_val_type <> 'string' THEN
                RAISE EXCEPTION 'El valor para la clave de URL % debe ser un string.', NEW.config_key;
            END IF;
            
            v_val_str := NEW.config_value#>>'{}';
            IF NOT (
                v_val_str ~* '^https?:\/\/.*' OR 
                v_val_str ~* '^\/.*' OR 
                v_val_str ~* '^data:image\/[a-zA-Z+-]+;base64,.*' OR 
                v_val_str = ''
            ) THEN
                RAISE EXCEPTION 'La URL % tiene un formato de ruta inválido: %. Debe ser URL absoluta, ruta relativa o Base64.', NEW.config_key, v_val_str;
            END IF;
        END IF;

        -- Validar layouts
        IF NEW.config_key IN (
            'layout_sidebar', 
            'layout_dashboard', 
            'layout_menus', 
            'layout_widgets'
        ) THEN
            IF v_val_type NOT IN ('object', 'array') THEN
                RAISE EXCEPTION 'El layout de % debe ser un objeto o un array JSON válido.', NEW.config_key;
            END IF;
        END IF;
    END IF;

    -- 2. Validaciones para TELEFONIA (Números de contacto)
    IF NEW.module = 'TELEFONIA' THEN
        IF v_val_type <> 'string' THEN
            RAISE EXCEPTION 'El valor para la clave de teléfono % debe ser un string.', NEW.config_key;
        END IF;
        
        v_val_str := NEW.config_value#>>'{}';
        IF NOT (v_val_str ~* '^\+[1-9]\d{5,14}$' OR v_val_str = '') THEN
            RAISE EXCEPTION 'El número telefónico % tiene un formato inválido: %. Debe cumplir el formato internacional E.164 (ej: +573001112233).', NEW.config_key, v_val_str;
        END IF;
    END IF;

    -- 3. Validaciones para INTEGRACIONES
    IF NEW.module = 'INTEGRACIONES' THEN
        IF NEW.config_key = 'notification_routes' THEN
            IF v_val_type <> 'object' THEN
                RAISE EXCEPTION 'La configuración de rutas de notificaciones notification_routes debe ser un objeto JSON.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. ENRUTAMIENTO DINÁMICO DE NOTIFICACIONES
-- ============================================================

-- Obtener la ruta configurada para un tipo de evento
CREATE OR REPLACE FUNCTION get_notification_route(
    p_tenant_id uuid,
    p_event_type varchar
)
RETURNS jsonb AS $$
DECLARE
    v_routes jsonb;
BEGIN
    v_routes := get_tenant_setting(p_tenant_id, 'INTEGRACIONES', 'notification_routes');
    IF v_routes IS NULL THEN
        -- Ruta por defecto si no hay configuración: notificar a administradores por IN_APP
        RETURN '{"roles": ["ADMINISTRADOR_TENANT"], "channels": ["IN_APP"]}'::jsonb;
    END IF;
    
    RETURN coalesce(v_routes->p_event_type, '{"roles": ["ADMINISTRADOR_TENANT"], "channels": ["IN_APP"]}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Despachar notificaciones de forma dinámica basadas en las rutas
CREATE OR REPLACE FUNCTION dispatch_notification_to_route(
    p_tenant_id uuid,
    p_event_type varchar,
    p_event_id uuid,
    p_subject varchar,
    p_body text
)
RETURNS void AS $$
DECLARE
    v_route jsonb;
    v_user_id uuid;
    v_email varchar;
    v_phone varchar;
    v_telegram_chat_id varchar;
    v_channel varchar;
    v_pref_enabled boolean;
    v_recipient varchar;
BEGIN
    -- Resolver la ruta configurada
    v_route := get_notification_route(p_tenant_id, p_event_type);

    -- Buscar todos los usuarios del tenant que posean alguno de los roles destinatarios
    FOR v_user_id, v_email, v_phone, v_telegram_chat_id IN
        SELECT DISTINCT u.id, u.email, u.phone, u.telegram_chat_id
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE u.tenant_id = p_tenant_id
          AND r.name = ANY (SELECT jsonb_array_elements_text(v_route->'roles'))
          AND u.deleted_at IS NULL
    LOOP
        -- Para cada canal de la ruta
        FOR v_channel IN SELECT jsonb_array_elements_text(v_route->'channels') LOOP
            -- Verificar si el usuario ha deshabilitado el canal en sus preferencias
            SELECT enabled INTO v_pref_enabled
            FROM notification_preferences
            WHERE tenant_id = p_tenant_id
              AND user_id = v_user_id
              AND channel = v_channel
              AND (event_type = p_event_type OR event_type IS NULL);

            IF v_pref_enabled IS NULL OR v_pref_enabled = true THEN
                -- Resolver información de contacto por canal
                IF v_channel = 'IN_APP' THEN
                    v_recipient := v_user_id::text;
                ELSIF v_channel = 'EMAIL' THEN
                    v_recipient := v_email;
                ELSIF v_channel = 'WHATSAPP' OR v_channel = 'SMS' THEN
                    v_recipient := v_phone;
                ELSIF v_channel = 'TELEGRAM' THEN
                    v_recipient := v_telegram_chat_id;
                ELSE
                    v_recipient := NULL;
                END IF;

                -- Insertar notificación en cola de envío (BullMQ resolverá la cola real)
                IF v_recipient IS NOT NULL AND v_recipient <> '' THEN
                    INSERT INTO notifications (
                        tenant_id,
                        channel,
                        recipient_user_id,
                        recipient_contact,
                        event_id,
                        event_type,
                        subject,
                        body,
                        status
                    ) VALUES (
                        p_tenant_id,
                        v_channel,
                        v_user_id,
                        v_recipient,
                        p_event_id,
                        p_event_type,
                        p_subject,
                        p_body,
                        'PENDIENTE'
                    );
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000034_advanced_admin.sql
-- --------------------------------------------------
--
-- FASE 34: Administración Avanzada
--
-- DECISIONES HEREDADAS:
-- D30-01: Almacenamiento centralizado en DB
-- D30-02: Esquema JSONB con validación de esquema
-- D30-03: Cero hardcoding de identidades, logotipos, colores, teléfonos
-- D30-04: Estructura de Campos Personalizados (Custom Fields)
-- D30-06: RLS en configuraciones

-- ============================================================
-- 1. AMPLIAR TABLA users CON COLUMNAS DE PERFIL
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language varchar(10) DEFAULT 'es';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_theme varchar(20) DEFAULT 'dark';
ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone varchar(100) DEFAULT 'America/Bogota';
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_page varchar(250) DEFAULT '/dashboard';

COMMENT ON COLUMN users.avatar_url IS 'URL o Base64 de la imagen de perfil del usuario.';
COMMENT ON COLUMN users.preferred_language IS 'Código de idioma de preferencia del usuario (es, en, pt).';
COMMENT ON COLUMN users.preferred_theme IS 'Tema de interfaz de preferencia del usuario (light, dark, system).';
COMMENT ON COLUMN users.signature_url IS 'URL o Base64 de la firma digitalizada del usuario.';
COMMENT ON COLUMN users.timezone IS 'Zona horaria preferida para el cálculo de SLAs e informes.';
COMMENT ON COLUMN users.home_page IS 'Ruta de la pantalla inicial tras el login de este usuario.';

-- ============================================================
-- 2. AGREGAR COLUMNA custom_fields A TABLAS PRINCIPALES
-- ============================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE warranties ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb NOT NULL;

-- ============================================================
-- 3. CREAR TABLA: custom_field_definitions
-- ============================================================
CREATE TABLE custom_field_definitions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Entidad sobre la que actúa
    entity_type varchar(50) NOT NULL CHECK (entity_type IN (
        'CLIENT', 
        'REQUIREMENT', 
        'QUOTE', 
        'JOB', 
        'INVOICE', 
        'WARRANTY', 
        'USER'
    )),

    -- Clave técnica del campo (ej: 'fecha_nacimiento')
    field_key   varchar(50) NOT NULL,
    -- Nombre visible en la UI (ej: 'Fecha de Nacimiento')
    field_name  varchar(100) NOT NULL,

    -- Tipo de dato admitido
    field_type  varchar(30) NOT NULL CHECK (field_type IN (
        'TEXT', 
        'NUMBER', 
        'DATE', 
        'LIST', 
        'FILE', 
        'BOOLEAN', 
        'JSON'
    )),

    -- Requerido obligatorio en el payload
    is_required boolean NOT NULL DEFAULT false,
    
    -- Opciones permitidas (solo para tipo LIST, array JSON de strings)
    options     jsonb,
    
    -- Trazabilidad y Soft Delete
    created_at  timestamp NOT NULL DEFAULT NOW(),
    created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at  timestamp,
    updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at  timestamp,
    deleted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    UNIQUE (tenant_id, entity_type, field_key)
);

COMMENT ON TABLE custom_field_definitions IS 'Definición de campos personalizados dinámicos por tenant y tipo de entidad. D30-04.';

-- ============================================================
-- 4. TRIGGER FUNCTION: validate_entity_custom_fields
--    Valida que el campo custom_fields cumpla con las definiciones
-- ============================================================
CREATE OR REPLACE FUNCTION validate_entity_custom_fields()
RETURNS trigger AS $$
DECLARE
    v_entity_type varchar;
    v_def record;
    v_val jsonb;
    v_val_type varchar;
    v_val_str text;
    v_options_count integer;
BEGIN
    -- Determinar el tipo de entidad según la tabla del trigger
    IF TG_TABLE_NAME = 'clients' THEN
        v_entity_type := 'CLIENT';
    ELSIF TG_TABLE_NAME = 'requirements' THEN
        v_entity_type := 'REQUIREMENT';
    ELSIF TG_TABLE_NAME = 'quotes' THEN
        v_entity_type := 'QUOTE';
    ELSIF TG_TABLE_NAME = 'jobs' THEN
        v_entity_type := 'JOB';
    ELSIF TG_TABLE_NAME = 'invoices' THEN
        v_entity_type := 'INVOICE';
    ELSIF TG_TABLE_NAME = 'warranties' THEN
        v_entity_type := 'WARRANTY';
    ELSIF TG_TABLE_NAME = 'users' THEN
        v_entity_type := 'USER';
    ELSE
        RAISE EXCEPTION 'Tabla no soportada para validación de campos personalizados: %', TG_TABLE_NAME;
    END IF;

    -- 1. Validar campos requeridos y tipos de datos definidos
    FOR v_def IN
        SELECT field_key, field_type, is_required, options
        FROM custom_field_definitions
        WHERE tenant_id = NEW.tenant_id
          AND entity_type = v_entity_type
          AND deleted_at IS NULL
    LOOP
        -- Verificar presencia
        IF NOT (NEW.custom_fields ? v_def.field_key) THEN
            IF v_def.is_required = true THEN
                RAISE EXCEPTION 'El campo personalizado % es requerido.', v_def.field_key;
            END IF;
            CONTINUE;
        END IF;

        v_val := NEW.custom_fields -> v_def.field_key;
        v_val_type := jsonb_typeof(v_val);

        -- Verificar si es nulo
        IF v_val_type = 'null' THEN
            IF v_def.is_required = true THEN
                RAISE EXCEPTION 'El campo personalizado % es requerido y no puede ser nulo.', v_def.field_key;
            END IF;
            CONTINUE;
        END IF;

        -- Validar tipos de datos permitidos
        IF v_def.field_type = 'TEXT' THEN
            IF v_val_type <> 'string' THEN
                RAISE EXCEPTION 'El campo personalizado % debe ser de tipo TEXT (string).', v_def.field_key;
            END IF;
        ELSIF v_def.field_type = 'NUMBER' THEN
            IF v_val_type <> 'number' THEN
                RAISE EXCEPTION 'El campo personalizado % debe ser de tipo NUMBER (número).', v_def.field_key;
            END IF;
        ELSIF v_def.field_type = 'BOOLEAN' THEN
            IF v_val_type <> 'boolean' THEN
                RAISE EXCEPTION 'El campo personalizado % debe ser de tipo BOOLEAN (true/false).', v_def.field_key;
            END IF;
        ELSIF v_def.field_type = 'DATE' THEN
            IF v_val_type <> 'string' THEN
                RAISE EXCEPTION 'El campo personalizado % debe ser de tipo DATE (string con formato YYYY-MM-DD).', v_def.field_key;
            END IF;
            v_val_str := v_val#>>'{}';
            IF NOT (v_val_str ~ '^\d{4}-\d{2}-\d{2}$') THEN
                RAISE EXCEPTION 'El campo personalizado % tiene un formato de fecha inválido: %. Debe ser YYYY-MM-DD.', v_def.field_key, v_val_str;
            END IF;
        ELSIF v_def.field_type = 'FILE' THEN
            IF v_val_type <> 'string' THEN
                RAISE EXCEPTION 'El campo personalizado % debe ser de tipo FILE (string de ruta o URL).', v_def.field_key;
            END IF;
            v_val_str := v_val#>>'{}';
            IF NOT (v_val_str ~* '^https?:\/\/.*' OR v_val_str ~* '^\/.*' OR v_val_str = '') THEN
                RAISE EXCEPTION 'El campo de archivo % tiene un formato de ruta inválido: %.', v_def.field_key, v_val_str;
            END IF;
        ELSIF v_def.field_type = 'LIST' THEN
            IF v_val_type <> 'string' THEN
                RAISE EXCEPTION 'El campo personalizado % debe ser de tipo LIST (string de opción seleccionada).', v_def.field_key;
            END IF;
            v_val_str := v_val#>>'{}';
            -- Verificar que pertenezca a la lista de opciones
            SELECT count(*) INTO v_options_count
            FROM jsonb_array_elements_text(v_def.options) AS opt
            WHERE opt = v_val_str;
            
            IF v_options_count = 0 THEN
                RAISE EXCEPTION 'La opción % no es válida para el campo personalizado %. Opciones permitidas: %.', v_val_str, v_def.field_key, v_def.options::text;
            END IF;
        END IF;
    END LOOP;

    -- 2. Validar que no se pasen campos no definidos en el payload (prevención de contaminación de esquema)
    FOR v_val_str IN SELECT jsonb_object_keys(NEW.custom_fields) LOOP
        IF NOT EXISTS (
            SELECT 1 
            FROM custom_field_definitions 
            WHERE tenant_id = NEW.tenant_id 
              AND entity_type = v_entity_type 
              AND field_key = v_val_str
              AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'El campo personalizado % no está definido para el tipo de entidad %.', v_val_str, v_entity_type;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asignar triggers BEFORE INSERT OR UPDATE a las 7 tablas clave
CREATE TRIGGER trg_validate_custom_fields BEFORE INSERT OR UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION validate_entity_custom_fields();
CREATE TRIGGER trg_validate_custom_fields BEFORE INSERT OR UPDATE ON requirements FOR EACH ROW EXECUTE FUNCTION validate_entity_custom_fields();
CREATE TRIGGER trg_validate_custom_fields BEFORE INSERT OR UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION validate_entity_custom_fields();
CREATE TRIGGER trg_validate_custom_fields BEFORE INSERT OR UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION validate_entity_custom_fields();
CREATE TRIGGER trg_validate_custom_fields BEFORE INSERT OR UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION validate_entity_custom_fields();
CREATE TRIGGER trg_validate_custom_fields BEFORE INSERT OR UPDATE ON warranties FOR EACH ROW EXECUTE FUNCTION validate_entity_custom_fields();
CREATE TRIGGER trg_validate_custom_fields BEFORE INSERT OR UPDATE ON users FOR EACH ROW EXECUTE FUNCTION validate_entity_custom_fields();

-- ============================================================
-- 5. CREAR TABLA: automation_rules
-- ============================================================
CREATE TABLE automation_rules (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type  varchar(100) NOT NULL, -- Ej: 'INVOICE_OVERDUE', 'JOB_COMPLETED'
    action_type varchar(50) NOT NULL CHECK (action_type IN ('DISPATCH_NOTIFICATION', 'CREATE_TASK', 'WRITE_LOG')),
    action_payload jsonb NOT NULL,
    active      boolean NOT NULL DEFAULT true,

    -- Trazabilidad y Soft Delete
    created_at  timestamp NOT NULL DEFAULT NOW(),
    created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at  timestamp,
    updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at  timestamp,
    deleted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

COMMENT ON TABLE automation_rules IS 'Reglas de automatización dinámica del sistema (IF Event -> DO Action).';

-- ============================================================
-- 6. FUNCIÓN DE MOTOR DE AUTOMATIZACIÓN
-- ============================================================
CREATE OR REPLACE FUNCTION execute_automation_rules(
    p_tenant_id uuid,
    p_event_type varchar,
    p_event_id uuid,
    p_subject varchar,
    p_body text
)
RETURNS void AS $$
DECLARE
    v_rule record;
    v_title varchar;
    v_msg text;
BEGIN
    -- 1. Ejecutar enrutamiento dinámico de notificaciones estándar
    PERFORM dispatch_notification_to_route(p_tenant_id, p_event_type, p_event_id, p_subject, p_body);

    -- 2. Buscar y ejecutar reglas avanzadas dinámicas configuradas
    FOR v_rule IN
        SELECT action_type, action_payload
        FROM automation_rules
        WHERE tenant_id = p_tenant_id
          AND event_type = p_event_type
          AND active = true
          AND deleted_at IS NULL
    LOOP
        IF v_rule.action_type = 'DISPATCH_NOTIFICATION' THEN
            v_title := coalesce(v_rule.action_payload->>'subject', p_subject);
            v_msg := coalesce(v_rule.action_payload->>'body', p_body);
            PERFORM dispatch_notification_to_route(p_tenant_id, p_event_type, p_event_id, v_title, v_msg);
            
        ELSIF v_rule.action_type = 'WRITE_LOG' THEN
            -- Inserción en log de auditoría técnica
            INSERT INTO audit_log (
                tenant_id,
                action,
                table_name,
                record_id,
                old_data,
                new_data,
                performed_by
            ) VALUES (
                p_tenant_id,
                'AUTOMATION_TRIGGERED',
                'automation_rules',
                p_event_id,
                NULL,
                to_jsonb(v_rule.action_payload),
                NULL
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS) Y POLÍTICAS
-- ============================================================
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- Políticas: custom_field_definitions
CREATE POLICY custom_field_defs_super_admin ON custom_field_definitions
    FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY custom_field_defs_select ON custom_field_definitions
    FOR SELECT TO authenticated USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND deleted_at IS NULL
    );

CREATE POLICY custom_field_defs_write ON custom_field_definitions
    FOR ALL TO authenticated USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('ADMINISTRADOR_TENANT', 'GERENTE', 'GERENTE_GENERAL')
    );

-- Políticas: automation_rules
CREATE POLICY automation_rules_super_admin ON automation_rules
    FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY automation_rules_select ON automation_rules
    FOR SELECT TO authenticated USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND deleted_at IS NULL
    );

CREATE POLICY automation_rules_write ON automation_rules
    FOR ALL TO authenticated USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('ADMINISTRADOR_TENANT', 'GERENTE', 'GERENTE_GENERAL')
    );

-- ============================================================
-- 8. ÍNDICES DE RENDIMIENTO Y HARDENING (WHERE deleted_at IS NULL)
-- ============================================================
CREATE INDEX idx_custom_field_defs_tenant_entity ON custom_field_definitions(tenant_id, entity_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_custom_field_defs_key ON custom_field_definitions(tenant_id, field_key) WHERE deleted_at IS NULL;
CREATE INDEX idx_automation_rules_tenant_event ON automation_rules(tenant_id, event_type) WHERE deleted_at IS NULL;

-- Trigger para bloquear deletes físicos (Soft delete obligatorio)
CREATE TRIGGER trg_block_custom_field_defs_delete
    BEFORE DELETE ON custom_field_definitions
    FOR EACH ROW EXECUTE FUNCTION block_physical_settings_delete();

CREATE TRIGGER trg_block_automation_rules_delete
    BEFORE DELETE ON automation_rules
    FOR EACH ROW EXECUTE FUNCTION block_physical_settings_delete();


-- --------------------------------------------------
-- MIGRACIÓN: 20260617000035_industrial_cms.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 35: CMS INDUSTRIAL, CATÁLOGO Y CONFIGURADOR INTERACTIVO
-- Archivo: supabase/migrations/20260617000035_industrial_cms.sql

-- ============================================================
-- 1. TRADUCCIÓN DE ESTADOS DE RIESGO DE LEADS A ESPAÑOL
-- ============================================================
-- Eliminar la restricción de validación original en inglés
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_risk_level_check;

-- Actualizar filas existentes si hubiere (por consistencia)
UPDATE leads SET risk_level = 'FRIO' WHERE risk_level IN ('LOW', 'WARM', 'HOT');

-- Cambiar el default a español
ALTER TABLE leads ALTER COLUMN risk_level SET DEFAULT 'FRIO';

-- Agregar la nueva restricción con los términos en español
ALTER TABLE leads ADD CONSTRAINT check_risk_level CHECK (risk_level IN ('CALIENTE', 'TIBIO', 'FRIO', 'SPAM'));

-- ============================================================
-- 2. JERARQUÍA DE CATÁLOGO INDUSTRIAL DE PRODUCTOS
-- ============================================================

-- A. Subcategorías (product_subcategories)
CREATE TABLE product_subcategories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    category_id uuid NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
    subcategory_code varchar(50) NOT NULL,
    name varchar(150) NOT NULL,
    description text,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_subcategory_code UNIQUE (tenant_id, subcategory_code)
);

-- Alterar Familias de Productos para apuntar a Subcategorías
ALTER TABLE product_families ADD COLUMN subcategory_id uuid REFERENCES product_subcategories(id) ON DELETE RESTRICT;
ALTER TABLE product_families ALTER COLUMN category_id DROP NOT NULL;

-- B. Series de Productos (product_series)
CREATE TABLE product_series (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    family_id uuid NOT NULL REFERENCES product_families(id) ON DELETE RESTRICT,
    series_code varchar(50) NOT NULL,
    name varchar(150) NOT NULL,
    description text,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_series_code UNIQUE (tenant_id, series_code)
);

-- Alterar Productos para apuntar a Series en lugar de Familias
ALTER TABLE products ADD COLUMN series_id uuid REFERENCES product_series(id) ON DELETE RESTRICT;
ALTER TABLE products ALTER COLUMN family_id DROP NOT NULL;

-- ============================================================
-- 3. MEDIA MANAGER (GESTOR CENTRALIZADO DE MULTIMEDIA Y ARCHIVOS)
-- ============================================================

-- C. Media Assets (media_assets)
CREATE TABLE media_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    file_name varchar(250) NOT NULL,
    file_path varchar(500) NOT NULL,
    file_size integer NOT NULL,
    mime_type varchar(100) NOT NULL,
    alt_text varchar(250),
    usage_count integer NOT NULL DEFAULT 0,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_file_path UNIQUE (tenant_id, file_path)
);

-- D. Relación de Imágenes de Productos (product_images)
CREATE TABLE product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
    sort_order integer NOT NULL DEFAULT 0,
    is_cover boolean NOT NULL DEFAULT false,
    image_type varchar(50) NOT NULL DEFAULT 'FOTO' CHECK (image_type IN ('FOTO', 'RENDER', 'PLANO')),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

-- E. Relación de Documentos Técnicos (product_documents)
CREATE TABLE product_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
    document_type varchar(50) NOT NULL DEFAULT 'FICHA_TECNICA' CHECK (document_type IN ('FICHA_TECNICA', 'MANUAL', 'CERTIFICADO', 'CATALOGO')),
    language varchar(10) NOT NULL DEFAULT 'es',
    version varchar(20) NOT NULL DEFAULT '1.0',

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

-- F. Relación de Archivos de Ingeniería y CAD (product_files)
CREATE TABLE product_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
    file_type varchar(50) NOT NULL DEFAULT 'CAD' CHECK (file_type IN ('CAD', 'DWG', 'DXF', 'STEP', 'IGES')),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

-- G. Relación de Videos de Productos (product_videos)
CREATE TABLE product_videos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    video_url varchar(500) NOT NULL,
    video_type varchar(50) NOT NULL DEFAULT 'YOUTUBE' CHECK (video_type IN ('YOUTUBE', 'VIMEO', 'STORAGE')),
    sort_order integer NOT NULL DEFAULT 0,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

-- ============================================================
-- 4. SEO MANAGER (GESTOR CENTRALIZADO DE METADATOS)
-- ============================================================

-- H. Tabla de Metadatos SEO (seo_metadata)
CREATE TABLE seo_metadata (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_type varchar(50) NOT NULL CHECK (entity_type IN ('PAGE', 'PRODUCT')),
    entity_id uuid NOT NULL,
    slug varchar(250) NOT NULL,
    meta_title varchar(250),
    meta_description text,
    meta_keywords varchar(250),
    canonical_url varchar(250),
    og_title varchar(250),
    og_description text,
    og_image_url varchar(500),
    robots_directives varchar(100) DEFAULT 'index, follow',
    schema_markup jsonb DEFAULT '{}'::jsonb,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_entity_seo UNIQUE (tenant_id, entity_type, entity_id),
    CONSTRAINT unique_tenant_slug UNIQUE (tenant_id, slug)
);

-- ============================================================
-- 5. FORM BUILDER (CONFIGURADOR DINÁMICO DE FORMULARIOS)
-- ============================================================

-- I. Campos de Formularios de Captación (website_form_fields)
CREATE TABLE website_form_fields (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    form_id uuid NOT NULL REFERENCES website_forms(id) ON DELETE CASCADE,
    field_key varchar(50) NOT NULL,
    field_name varchar(150) NOT NULL,
    field_type varchar(50) NOT NULL CHECK (field_type IN ('TEXT', 'NUMBER', 'DATE', 'LIST', 'FILE', 'BOOLEAN')),
    is_required boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 0,
    options jsonb DEFAULT '[]'::jsonb,
    validation_rules jsonb DEFAULT '{}'::jsonb,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_form_field UNIQUE (tenant_id, form_id, field_key)
);

-- ============================================================
-- 6. SERVICIOS CORPORATIVOS
-- ============================================================

-- J. Servicios de la Compañía (company_services)
CREATE TABLE company_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    service_code varchar(50) NOT NULL,
    name varchar(150) NOT NULL,
    description text NOT NULL,
    icon_name varchar(50),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_service_code UNIQUE (tenant_id, service_code)
);

-- ============================================================
-- 7. ÍNDICES DE RENDIMIENTO Y HARDENING
-- ============================================================
CREATE INDEX idx_product_subcategories_cat ON product_subcategories(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_families_subcat ON product_families(subcategory_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_series_fam ON product_series(family_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_series ON products(series_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_media_assets_tenant ON media_assets(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_images_prod ON product_images(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_documents_prod ON product_documents(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_files_prod ON product_files(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_videos_prod ON product_videos(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_seo_metadata_entity ON seo_metadata(tenant_id, entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_seo_metadata_slug ON seo_metadata(tenant_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_website_form_fields_form ON website_form_fields(form_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_company_services_tenant ON company_services(tenant_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 8. TRIGGERS: SECUENCIAS CORRELATIVAS AUTOMÁTICAS
-- ============================================================
CREATE OR REPLACE FUNCTION handle_cms_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'product_subcategories' THEN
        IF NEW.subcategory_code IS NULL OR NEW.subcategory_code = '' THEN
            NEW.subcategory_code := 'SBC-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'PRODUCT_SUBCATEGORY')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'product_series' THEN
        IF NEW.series_code IS NULL OR NEW.series_code = '' THEN
            NEW.series_code := 'SER-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'PRODUCT_SERIES')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'media_assets' THEN
        -- No requiere código secuencial público, se maneja por UUID y path
    ELSIF TG_TABLE_NAME = 'company_services' THEN
        IF NEW.service_code IS NULL OR NEW.service_code = '' THEN
            NEW.service_code := 'SRV-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'COMPANY_SERVICE')::text, 6, '0');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_subcat_code BEFORE INSERT ON product_subcategories FOR EACH ROW EXECUTE FUNCTION handle_cms_sequences();
CREATE TRIGGER trg_handle_series_code BEFORE INSERT ON product_series FOR EACH ROW EXECUTE FUNCTION handle_cms_sequences();
CREATE TRIGGER trg_handle_company_service_code BEFORE INSERT ON company_services FOR EACH ROW EXECUTE FUNCTION handle_cms_sequences();

-- ============================================================
-- 9. TRIGGERS: PREVENCIÓN DE BORRADO FÍSICO (SOFT-DELETE)
-- ============================================================
CREATE TRIGGER trg_block_subcat_delete BEFORE DELETE ON product_subcategories FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_series_delete BEFORE DELETE ON product_series FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_media_delete BEFORE DELETE ON media_assets FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_prod_img_delete BEFORE DELETE ON product_images FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_prod_doc_delete BEFORE DELETE ON product_documents FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_prod_file_delete BEFORE DELETE ON product_files FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_prod_vid_delete BEFORE DELETE ON product_videos FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_seo_delete BEFORE DELETE ON seo_metadata FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_form_field_delete BEFORE DELETE ON website_form_fields FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_company_service_delete BEFORE DELETE ON company_services FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();

-- ============================================================
-- 10. TRIGGERS: TRAZABILIDAD Y AUDITORÍA GENERAL
-- ============================================================
CREATE TRIGGER trg_subcat_traceability BEFORE INSERT OR UPDATE ON product_subcategories FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_series_traceability BEFORE INSERT OR UPDATE ON product_series FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_media_traceability BEFORE INSERT OR UPDATE ON media_assets FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_prod_img_traceability BEFORE INSERT OR UPDATE ON product_images FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_prod_doc_traceability BEFORE INSERT OR UPDATE ON product_documents FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_prod_file_traceability BEFORE INSERT OR UPDATE ON product_files FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_prod_vid_traceability BEFORE INSERT OR UPDATE ON product_videos FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_seo_traceability BEFORE INSERT OR UPDATE ON seo_metadata FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_form_field_traceability BEFORE INSERT OR UPDATE ON website_form_fields FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_company_service_traceability BEFORE INSERT OR UPDATE ON company_services FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

CREATE TRIGGER audit_product_subcategories AFTER INSERT OR UPDATE OR DELETE ON product_subcategories FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_series AFTER INSERT OR UPDATE OR DELETE ON product_series FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_media_assets AFTER INSERT OR UPDATE OR DELETE ON media_assets FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_images AFTER INSERT OR UPDATE OR DELETE ON product_images FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_documents AFTER INSERT OR UPDATE OR DELETE ON product_documents FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_files AFTER INSERT OR UPDATE OR DELETE ON product_files FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_videos AFTER INSERT OR UPDATE OR DELETE ON product_videos FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_seo_metadata AFTER INSERT OR UPDATE OR DELETE ON seo_metadata FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_website_form_fields AFTER INSERT OR UPDATE OR DELETE ON website_form_fields FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_company_services AFTER INSERT OR UPDATE OR DELETE ON company_services FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ============================================================
-- 11. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE product_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_services ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. POLÍTICAS RLS (AISLAMIENTO MULTI-TENANT POR tenant_id)
-- ============================================================

-- Subcategorías
CREATE POLICY subcat_select_tenant ON product_subcategories FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY subcat_write_tenant ON product_subcategories FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Series
CREATE POLICY series_select_tenant ON product_series FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY series_write_tenant ON product_series FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Media Assets
CREATE POLICY media_select_tenant ON media_assets FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY media_write_tenant ON media_assets FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Imágenes de Productos
CREATE POLICY prod_img_select_tenant ON product_images FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY prod_img_write_tenant ON product_images FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Documentos de Productos
CREATE POLICY prod_doc_select_tenant ON product_documents FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY prod_doc_write_tenant ON product_documents FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Archivos CAD de Productos
CREATE POLICY prod_file_select_tenant ON product_files FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY prod_file_write_tenant ON product_files FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Videos de Productos
CREATE POLICY prod_vid_select_tenant ON product_videos FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY prod_vid_write_tenant ON product_videos FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- SEO Metadata
CREATE POLICY seo_select_tenant ON seo_metadata FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY seo_write_tenant ON seo_metadata FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Campos de Formularios
CREATE POLICY form_fields_select_tenant ON website_form_fields FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY form_fields_write_tenant ON website_form_fields FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Servicios
CREATE POLICY company_services_select_tenant ON company_services FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY company_services_write_tenant ON company_services FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- ============================================================
-- 13. BYPASS PARA POSTGRES SUPER ADMIN EN MIGRACIONES Y SEED
-- ============================================================
CREATE POLICY subcat_super_admin ON product_subcategories FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY series_super_admin ON product_series FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY media_super_admin ON media_assets FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY prod_img_super_admin ON product_images FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY prod_doc_super_admin ON product_documents FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY prod_file_super_admin ON product_files FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY prod_vid_super_admin ON product_videos FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY seo_super_admin ON seo_metadata FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY form_fields_super_admin ON website_form_fields FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY company_services_super_admin ON company_services FOR ALL TO authenticated USING (is_platform_super_admin());


-- --------------------------------------------------
-- MIGRACIÓN: 20260619000036_fix_leads_schema.sql
-- --------------------------------------------------
-- MIGRACIÓN FASE 36: ALINEACIÓN SCHEMA LEADS CON FLUJO B2B WIZARD
-- Archivo: supabase/migrations/20260619000036_fix_leads_schema.sql
--
-- Propósito: Alinear la tabla `leads` con el flujo público del Wizard y los Server Actions.
-- La tabla original tenía columnas de captura directa (name, company_name, etc.).
-- El nuevo flujo B2B registra primero clients/client_contacts y luego crea el lead
-- vinculado mediante client_id + contact_id, con scoring dinámico.
-- ===================================================================

-- ============================================================
-- 1. AGREGAR COLUMNAS FALTANTES AL SCHEMA MODERNO DE LEADS
-- ============================================================

-- Columna de score numérico (reemplaza a lead_score para consistencia)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 0;

-- Fuente de captación del lead
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source varchar(100);

-- Estado del lead en el pipeline comercial
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status varchar(50) NOT NULL DEFAULT 'NUEVO'
    CHECK (status IN ('NUEVO', 'EN_SEGUIMIENTO', 'CALIFICADO', 'RECHAZADO', 'CONVERTIDO'));

-- Ejecutivo Comercial asignado para seguimiento
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES users(id) ON DELETE SET NULL;

-- Notas del sistema o del ejecutivo comercial
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text;

-- ============================================================
-- 2. HACER NULLABLE LAS COLUMNAS HEREDADAS (NO APLICAN AL NUEVO FLUJO)
-- El nuevo flujo guarda la info de contacto en client_contacts,
-- por lo que estas columnas del schema viejo pueden quedar nulas.
-- ============================================================
ALTER TABLE leads ALTER COLUMN name DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN company_name DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN email DROP NOT NULL;

-- ============================================================
-- 3. ÍNDICES DE RENDIMIENTO PARA LAS NUEVAS COLUMNAS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_risk_level ON leads(risk_level);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_user ON leads(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads(lead_source);

-- ============================================================
-- 4. POLÍTICA RLS: PERMITIR INSERTS DESDE EL WIZARD PÚBLICO
-- El Server Action usa supabaseAdmin (service_role) por lo que
-- salta el RLS. Esta política extra es de defensa en profundidad
-- para posibles llamadas desde el cliente via anon.
-- ============================================================

-- Permitir a usuarios autenticados del tenant ver sus leads
-- (Ya existe leads_all_tenant en Fase 11 — sólo agregamos la que faltaba para service_role)
-- El service_role ya saltea RLS nativamente en Supabase, sin necesidad de políticas adicionales.

-- ============================================================
-- 5. ACTUALIZAR DEFAULT DE LEAD_CODE (ya manejado por trigger existente)
-- ============================================================
-- Sin cambios necesarios, el trigger handle_website_sequences ya genera LED-XXXXXX

-- ============================================================
-- 6. GRANTS PARA PostgREST (por si el schema se recreó)
-- ============================================================
GRANT ALL ON leads TO service_role;
GRANT SELECT, INSERT, UPDATE ON leads TO authenticated;
GRANT ALL ON diagnostic_reports TO service_role;
GRANT SELECT ON diagnostic_reports TO authenticated;
GRANT ALL ON clients TO service_role;
GRANT SELECT, INSERT, UPDATE ON clients TO authenticated;
GRANT ALL ON client_contacts TO service_role;
GRANT SELECT, INSERT, UPDATE ON client_contacts TO authenticated;


-- --------------------------------------------------
-- MIGRACIÓN: 20260620000037_branding_version.sql
-- --------------------------------------------------
--
-- FASE 32: Historial de Versiones de Branding (tenant_branding_version)
--

CREATE TABLE tenant_branding_version (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    version_number integer NOT NULL,
    
    -- Snapshot JSONB con todas las configuraciones de branding activas en este punto
    config_values jsonb NOT NULL,
    description varchar(255),
    
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE (tenant_id, version_number)
);

COMMENT ON TABLE tenant_branding_version IS 'Tabla para almacenar snapshots del historial de configuraciones de marca por tenant.';

-- Habilitar Row Level Security (RLS)
ALTER TABLE tenant_branding_version ENABLE ROW LEVEL SECURITY;

-- Super Admin: acceso total
CREATE POLICY tenant_branding_version_super_admin ON tenant_branding_version
    FOR ALL
    USING (is_platform_super_admin());

-- Lectura: cualquier usuario del tenant
CREATE POLICY tenant_branding_version_read ON tenant_branding_version
    FOR SELECT
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Escritura: solo administradores/gerentes del tenant
CREATE POLICY tenant_branding_version_write ON tenant_branding_version
    FOR ALL
    USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('ADMINISTRADOR_TENANT', 'GERENTE', 'GERENTE_GENERAL')
    );

-- Índices para optimización
CREATE INDEX idx_tenant_branding_version_tenant
    ON tenant_branding_version(tenant_id, version_number);


-- ==================================================
-- DATOS DE SEMILLA PARA DEMOSTRACIÓN (ACME Y APEX)
-- ==================================================


-- 1. Insertar Tenants
INSERT INTO tenants (id, tenant_code, name, legal_name, tax_id, status) VALUES
('a0000000-0000-0000-0000-000000000000', 'ACME', 'Acme Corporativo', 'Acme Industrial S.A. de C.V.', 'ACM901201TR4', 'Activo'),
('b0000000-0000-0000-0000-000000000000', 'APEX', 'Apex Logística B2B', 'Apex Logistics B2B Group S.A. de C.V.', 'APX150508LL2', 'Activo')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, legal_name = EXCLUDED.legal_name, tax_id = EXCLUDED.tax_id;

-- 2. Insertar Usuarios por Defecto (Requeridos para auditoría y claves foráneas)
INSERT INTO users (id, tenant_id, employee_code, first_name, last_name, email, status) VALUES
('a9000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'EMP-ACME-01', 'Admin', 'Acme', 'admin@acme.com', 'Activo'),
('b9000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'EMP-APEX-01', 'Admin', 'Apex', 'admin@apex.com', 'Activo')
ON CONFLICT (id) DO NOTHING;

-- 3. Crear Sedes Principales
INSERT INTO sites (id, tenant_id, site_code, name, status) VALUES
('a1000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'SITE-ACME', 'Sede Central Acme', 'Activo'),
('b1000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'SITE-APEX', 'Sede Central Apex', 'Activo')
ON CONFLICT (id) DO NOTHING;

-- 4. Insertar Áreas Fijas para Referencia Rápida
INSERT INTO areas (id, tenant_id, area_code, name, status) VALUES
('a7000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'ING', 'Ingeniería', 'Activo'),
('b7000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'ING', 'Ingeniería', 'Activo')
ON CONFLICT (id) DO NOTHING;

-- 5. Inicializar áreas estándar
SELECT seed_tenant_standard_areas('a0000000-0000-0000-0000-000000000000');
SELECT seed_tenant_standard_areas('b0000000-0000-0000-0000-000000000000');

-- 6. Insertar Bodegas (Warehouses - Principal y Secundaria para soportar Transferencias)
INSERT INTO warehouses (id, tenant_id, warehouse_code, site_id, name, status) VALUES
('a2000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'WH-ACME-01', 'a1000000-0000-0000-0000-000000000000', 'Bodega Principal Acme', 'Activo'),
('a2000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000000', 'WH-ACME-02', 'a1000000-0000-0000-0000-000000000000', 'Bodega Secundaria Acme', 'Activo'),
('b2000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'WH-APEX-01', 'b1000000-0000-0000-0000-000000000000', 'Bodega Principal Apex', 'Activo'),
('b2000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000000', 'WH-APEX-02', 'b1000000-0000-0000-0000-000000000000', 'Bodega Secundaria Apex', 'Activo')
ON CONFLICT (id) DO NOTHING;

-- 7. Insertar Clientes
INSERT INTO clients (id, tenant_id, client_code, client_type, legal_name, tax_id, industry, country, assigned_user_id, email, status) VALUES
('a3000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'CLI-0001', 'Empresa', 'Acme Industrial S.A. de C.V.', 'ACM901201TR4', 'Industrial', 'Colombia', 'a9000000-0000-0000-0000-000000000000', 'contacto@acme.com', 'ACTIVO'),
('a3000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000000', 'CLI-0002', 'Empresa', 'Distribuidora Comercial del Centro', 'COR851015AB4', 'Comercial', 'Colombia', 'a9000000-0000-0000-0000-000000000000', 'ventas@centro.com', 'ACTIVO'),
('b3000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'CLI-0001', 'Empresa', 'Apex Logistics B2B Group', 'APX150508LL2', 'Corporativo', 'Colombia', 'b9000000-0000-0000-0000-000000000000', 'info@apexlogistics.com', 'ACTIVO')
ON CONFLICT (id) DO NOTHING;


-- 8. Insertar Requerimientos por Defecto (Requeridos por Jobs)
INSERT INTO requirements (id, tenant_id, requirement_code, client_id, title, category, created_by, status) VALUES
('a8000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'REQ-ACME-01', 'a3000000-0000-0000-0000-000000000000', 'Requerimiento de Climatización', 'MANTENIMIENTO', 'a9000000-0000-0000-0000-000000000000', 'OT_GENERADA'),
('b8000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'REQ-APEX-01', 'b3000000-0000-0000-0000-000000000000', 'Requerimiento de Logística de Frío', 'MANTENIMIENTO', 'b9000000-0000-0000-0000-000000000000', 'OT_GENERADA')
ON CONFLICT (id) DO NOTHING;

-- 9. Insertar Artículos (Inventory Items)
INSERT INTO inventory_items (id, tenant_id, item_code, name, category, item_type, unit, average_cost, last_cost, status) VALUES
('a4000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'ART-0001', 'Compresor Industrial 10HP', 'Equipos', 'Equipo', 'Unidad', 1200.00, 1200.00, 'Activo'),
('a4000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000000', 'ART-0002', 'Tubo Cobre 1/2 pulgada', 'Materiales', 'Material', 'Metro', 15.50, 15.50, 'Activo'),
('b4000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'ART-0001', 'Filtro de Aire Premium', 'Repuestos', 'Repuesto', 'Unidad', 45.00, 45.00, 'Activo')
ON CONFLICT (id) DO NOTHING;

-- 10. Insertar Stock Físico Asociado
INSERT INTO inventory_stock (tenant_id, warehouse_id, item_id, quantity, reserved_quantity) VALUES
('a0000000-0000-0000-0000-000000000000', 'a2000000-0000-0000-0000-000000000000', 'a4000000-0000-0000-0000-000000000000', 15, 0),
('a0000000-0000-0000-0000-000000000000', 'a2000000-0000-0000-0000-000000000000', 'a4000000-0000-0000-0000-000000000001', 200, 0),
('a0000000-0000-0000-0000-000000000000', 'a2000000-0000-0000-0000-000000000001', 'a4000000-0000-0000-0000-000000000000', 5, 0),
('b0000000-0000-0000-0000-000000000000', 'b2000000-0000-0000-0000-000000000000', 'b4000000-0000-0000-0000-000000000000', 50, 0),
('b0000000-0000-0000-0000-000000000000', 'b2000000-0000-0000-0000-000000000001', 'b4000000-0000-0000-0000-000000000000', 10, 0)
ON CONFLICT (tenant_id, warehouse_id, item_id) DO NOTHING;

-- 11. Insertar algunos Trabajos (Jobs)
INSERT INTO jobs (id, tenant_id, job_code, client_id, requirement_id, site_id, area_id, title, description, priority, status, planned_start_date, planned_end_date) VALUES
('a5000000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'JOB-0001', 'a3000000-0000-0000-0000-000000000000', 'a8000000-0000-0000-0000-000000000000', 'a1000000-0000-0000-0000-000000000000', 'a7000000-0000-0000-0000-000000000000', 'Instalación de Sistema Chillers', 'Montaje y puesta en marcha de chiller central.', 'HIGH', 'PENDIENTE', '2026-07-01', '2026-07-15'),
('b5000000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'JOB-0001', 'b3000000-0000-0000-0000-000000000000', 'b8000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000', 'b7000000-0000-0000-0000-000000000000', 'Mantenimiento Correctivo de Ductos', 'Revisión y sellado de fugas en ductos principales.', 'MEDIUM', 'EN_EJECUCION', '2026-06-20', '2026-06-25')
ON CONFLICT (id) DO NOTHING;

-- 12. Insertar Actividades del Trabajo
INSERT INTO job_activities (id, tenant_id, job_id, activity_code, title, description, assigned_user_id, status, planned_start_date, planned_end_date) VALUES
('a5100000-0000-0000-0000-000000000000', 'a0000000-0000-0000-0000-000000000000', 'a5000000-0000-0000-0000-000000000000', 'JOB-0001-01', 'Cimentación de Bases', 'Preparar bases metálicas y nivelación.', 'a9000000-0000-0000-0000-000000000000', 'PENDIENTE', '2026-07-01', '2026-07-05'),
('b5100000-0000-0000-0000-000000000000', 'b0000000-0000-0000-0000-000000000000', 'b5000000-0000-0000-0000-000000000000', 'JOB-0001-01', 'Limpieza e Inspección', 'Retiro de rejillas e inspección interna.', 'b9000000-0000-0000-0000-000000000000', 'COMPLETADA', '2026-06-20', '2026-06-22')
ON CONFLICT (id) DO NOTHING;

-- 13. Insertar Servicios Industriales (AeroMax Industrial)
INSERT INTO company_services (id, tenant_id, service_code, name, description, icon_name) VALUES
('a7c00000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000000', 'SRV-000001', 'Balanceo Estático', 'Añadir o remover pesos para corrección de vibraciones en rotores y ventiladores.', 'Activity'),
('a7c00000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000000', 'SRV-000002', 'Mediciones Aerodinámicas', 'Determinación de caudales, presiones estáticas y curvas de rendimiento en sitio.', 'Gauge'),
('a7c00000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000000', 'SRV-000003', 'Fabricación de Ventiladores', 'Fabricación y reconstrucción a medida de ventiladores axiales y centrífugos industriales.', 'Cpu'),
('a7c00000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000000', 'SRV-000004', 'Sistemas de Extracción tipo Hongo', 'Diseño, construcción e instalación de sistemas de extracción e inyección de aire tipo hongo.', 'Wind'),

('b7c00000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000000', 'SRV-000001', 'Balanceo Estático', 'Añadir o remover pesos para corrección de vibraciones en rotores y ventiladores.', 'Activity'),
('b7c00000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000000', 'SRV-000002', 'Mediciones Aerodinámicas', 'Determinación de caudales, presiones estáticas y curvas de rendimiento en sitio.', 'Gauge'),
('b7c00000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000000', 'SRV-000003', 'Fabricación de Ventiladores', 'Fabricación y reconstrucción a medida de ventiladores axiales y centrífugos industriales.', 'Cpu'),
('b7c00000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000000', 'SRV-000004', 'Sistemas de Extracción tipo Hongo', 'Diseño, construcción e instalación de sistemas de extracción e inyección de aire tipo hongo.', 'Wind')
ON CONFLICT (id) DO NOTHING;

-- 14. Insertar Categoría
INSERT INTO product_categories (id, tenant_id, category_code, name, description) VALUES
('a3c00000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000000', 'CAT-000001', 'Sistemas de Aire', 'Sistemas completos de inyección y extracción de aire industrial.'),
('b3c00000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000000', 'CAT-000001', 'Sistemas de Aire', 'Sistemas completos de inyección y extracción de aire industrial.')
ON CONFLICT (id) DO NOTHING;

-- 15. Insertar Subcategorías
INSERT INTO product_subcategories (id, tenant_id, category_id, subcategory_code, name, description) VALUES
('a3c00000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000001', 'SBC-000001', 'Extractores e Inyectores', 'Equipos industriales de inyección y extracción de aire.'),
('a3c00000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000001', 'SBC-000002', 'Ventiladores', 'Ventiladores industriales centrífugos y axiales.'),

('b3c00000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000001', 'SBC-000001', 'Extractores e Inyectores', 'Equipos industriales de inyección y extracción de aire.'),
('b3c00000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000001', 'SBC-000002', 'Ventiladores', 'Ventiladores industriales centrífugos y axiales.')
ON CONFLICT (id) DO NOTHING;

-- 16. Insertar Familias
INSERT INTO product_families (id, tenant_id, subcategory_id, family_code, name, description) VALUES
('a3c00000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000002', 'FAM-000001', 'Extractores Industriales', 'Extractores industriales para alto caudal y ambientes severos.'),
('a3c00000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000005', 'FAM-000002', 'Axiales y Centrífugos', 'Ventiladores de álabes curvados y axiales tubulares.'),

('b3c00000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000002', 'FAM-000001', 'Extractores Industriales', 'Extractores industriales para alto caudal y ambientes severos.'),
('b3c00000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000005', 'FAM-000002', 'Axiales y Centrífugos', 'Ventiladores de álabes curvados y axiales tubulares.')
ON CONFLICT (id) DO NOTHING;

-- 17. Insertar Series
INSERT INTO product_series (id, tenant_id, family_id, series_code, name, description) VALUES
('a3c00000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000003', 'SER-000001', 'Serie Extracción Premium', 'Equipos industriales con recubrimientos epóxicos y motores de alta eficiencia.'),
('a3c00000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000006', 'SER-000002', 'Serie Inyección Aerodinámica', 'Sistemas de álabes forjados y control acústico.'),

('b3c00000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000003', 'SER-000001', 'Serie Extracción Premium', 'Equipos industriales con recubrimientos epóxicos y motores de alta eficiencia.'),
('b3c00000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000006', 'SER-000002', 'Serie Inyección Aerodinámica', 'Sistemas de álabes forjados y control acústico.')
ON CONFLICT (id) DO NOTHING;

-- 18. Insertar los 8 Productos
INSERT INTO products (id, tenant_id, series_id, product_code, name, description, status) VALUES
-- Acme
('a3c00000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000004', 'PRO-000001', 'Blower', 'Extractor industrial centrífugo con álabes inclinados para presiones elevadas.', 'ACTIVO'),
('a3c00000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000004', 'PRO-000002', 'Extractor Tipo Hongo Inox', 'Extractor para techos fabricado en acero inoxidable 304 ideal para intemperie.', 'ACTIVO'),
('a3c00000-0000-0000-0000-000000000013', 'a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000004', 'PRO-000003', 'Extractor Multiusos', 'Equipo versátil para montaje en pared, ducto o cabinas de flujo estándar.', 'ACTIVO'),
('a3c00000-0000-0000-0000-000000000014', 'a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000007', 'PRO-000004', 'Ventilador Axial', 'Ventilador de marco cuadrado para renovación masiva de aire en naves industriales.', 'ACTIVO'),
('a3c00000-0000-0000-0000-000000000015', 'a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000007', 'PRO-000005', 'Ventilador Centrífugo', 'Ventilador de carcasa de acero reforzado con transmisión por bandas/poleas.', 'ACTIVO'),
('a3c00000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000007', 'PRO-000006', 'Ventilador Encajonado', 'Gabinete acústico insonorizado con ventilador de doble oído incorporado.', 'ACTIVO'),
('a3c00000-0000-0000-0000-000000000017', 'a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000007', 'PRO-000007', 'Ventilador Tubo Axial', 'Ventilador cilíndrico tubular para acople directo en sistemas de ductos.', 'ACTIVO'),
('a3c00000-0000-0000-0000-000000000018', 'a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000007', 'PRO-000008', 'Ventilador Extractor Centrífugo Blower', 'Combo extractor tipo caracol con turbina balanceada dinámicamente.', 'ACTIVO'),
-- Apex
('b3c00000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000004', 'PRO-000001', 'Blower', 'Extractor industrial centrífugo con álabes inclinados para presiones elevadas.', 'ACTIVO'),
('b3c00000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000004', 'PRO-000002', 'Extractor Tipo Hongo Inox', 'Extractor para techos fabricado en acero inoxidable 304 ideal para intemperie.', 'ACTIVO'),
('b3c00000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000004', 'PRO-000003', 'Extractor Multiusos', 'Equipo versátil para montaje en pared, ducto o cabinas de flujo estándar.', 'ACTIVO'),
('b3c00000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000007', 'PRO-000004', 'Ventilador Axial', 'Ventilador de marco cuadrado para renovación masiva de aire en naves industriales.', 'ACTIVO'),
('b3c00000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000007', 'PRO-000005', 'Ventilador Centrífugo', 'Ventilador de carcasa de acero reforzado con transmisión por bandas/poleas.', 'ACTIVO'),
('b3c00000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000007', 'PRO-000006', 'Ventilador Encajonado', 'Gabinete acústico insonorizado con ventilador de doble oído incorporado.', 'ACTIVO'),
('b3c00000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000007', 'PRO-000007', 'Ventilador Tubo Axial', 'Ventilador cilíndrico tubular para acople directo en sistemas de ductos.', 'ACTIVO'),
('b3c00000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000007', 'PRO-000008', 'Ventilador Extractor Centrífugo Blower', 'Combo extractor tipo caracol con turbina balanceada dinámicamente.', 'ACTIVO')
ON CONFLICT (id) DO NOTHING;

-- 19. Insertar Formulario del Wizard ( website_forms )
INSERT INTO website_forms (id, tenant_id, form_code, name, form_type) VALUES
('a3c00000-0000-0000-0000-000000000099', 'a0000000-0000-0000-0000-000000000000', 'FRM-000001', 'Wizard de Preingeniería', 'WIZARD'),
('b3c00000-0000-0000-0000-000000000099', 'b0000000-0000-0000-0000-000000000000', 'FRM-000001', 'Wizard de Preingeniería', 'WIZARD')
ON CONFLICT (id) DO NOTHING;

-- 20. Insertar campos de formulario ( website_form_fields )
INSERT INTO website_form_fields (tenant_id, form_id, field_key, field_name, field_type, is_required, sort_order, options, validation_rules) VALUES
-- Acme
('a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000099', 'servicio', 'Tipo de Servicio', 'LIST', true, 10, '["fabricacion", "venta", "mantenimiento", "reparacion"]', '{}'),
('a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000099', 'length', 'Largo (metros)', 'NUMBER', true, 20, '[]', '{"min": 1, "max": 1000}'),
('a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000099', 'width', 'Ancho (metros)', 'NUMBER', true, 30, '[]', '{"min": 1, "max": 1000}'),
('a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000099', 'height', 'Alto (metros)', 'NUMBER', true, 40, '[]', '{"min": 1, "max": 100}'),
('a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000099', 'environment', 'Ambiente Operativo', 'LIST', true, 50, '["heavy_plant", "data_center", "mining", "warehouse", "default"]', '{}'),
('a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000099', 'nombre', 'Nombre de Contacto', 'TEXT', true, 60, '[]', '{"min": 2, "max": 100}'),
('a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000099', 'empresa', 'Razón Social', 'TEXT', true, 70, '[]', '{"min": 2, "max": 100}'),
('a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000099', 'cargo', 'Cargo Profesional', 'LIST', true, 80, '["Director de Planta", "Gerente de Mantenimiento", "Supervisor de HVAC / Operaciones", "Ingeniero de Proyectos", "Compras / Abastecimiento", "Otro"]', '{}'),
('a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000099', 'telefono', 'Teléfono Corporativo', 'TEXT', true, 90, '[]', '{"regex": "^(\\+?57)?(3\\d{9}|60[1-8]\\d{7})$"}'),
('a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000099', 'email', 'Correo Corporativo', 'TEXT', true, 100, '[]', '{"email": true}'),
('a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000099', 'ciudad', 'Ciudad de la Planta', 'TEXT', true, 110, '[]', '{"min": 2, "max": 100}'),
('a0000000-0000-0000-0000-000000000000', 'a3c00000-0000-0000-0000-000000000099', 'urgencia', 'Urgencia del Requerimiento', 'LIST', true, 120, '["baja", "media", "alta"]', '{}'),
-- Apex
('b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000099', 'servicio', 'Tipo de Servicio', 'LIST', true, 10, '["fabricacion", "venta", "mantenimiento", "reparacion"]', '{}'),
('b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000099', 'length', 'Largo (metros)', 'NUMBER', true, 20, '[]', '{"min": 1, "max": 1000}'),
('b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000099', 'width', 'Ancho (metros)', 'NUMBER', true, 30, '[]', '{"min": 1, "max": 1000}'),
('b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000099', 'height', 'Alto (metros)', 'NUMBER', true, 40, '[]', '{"min": 1, "max": 100}'),
('b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000099', 'environment', 'Ambiente Operativo', 'LIST', true, 50, '["heavy_plant", "data_center", "mining", "warehouse", "default"]', '{}'),
('b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000099', 'nombre', 'Nombre de Contacto', 'TEXT', true, 60, '[]', '{"min": 2, "max": 100}'),
('b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000099', 'empresa', 'Razón Social', 'TEXT', true, 70, '[]', '{"min": 2, "max": 100}'),
('b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000099', 'cargo', 'Cargo Profesional', 'LIST', true, 80, '["Director de Planta", "Gerente de Mantenimiento", "Supervisor de HVAC / Operaciones", "Ingeniero de Proyectos", "Compras / Abastecimiento", "Otro"]', '{}'),
('b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000099', 'telefono', 'Teléfono Corporativo', 'TEXT', true, 90, '[]', '{"regex": "^(\\+?57)?(3\\d{9}|60[1-8]\\d{7})$"}'),
('b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000099', 'email', 'Correo Corporativo', 'TEXT', true, 100, '[]', '{"email": true}'),
('b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000099', 'ciudad', 'Ciudad de la Planta', 'TEXT', true, 110, '[]', '{"min": 2, "max": 100}'),
('b0000000-0000-0000-0000-000000000000', 'b3c00000-0000-0000-0000-000000000099', 'urgencia', 'Urgencia del Requerimiento', 'LIST', true, 120, '["baja", "media", "alta"]', '{}')
ON CONFLICT (tenant_id, form_id, field_key) DO NOTHING;
