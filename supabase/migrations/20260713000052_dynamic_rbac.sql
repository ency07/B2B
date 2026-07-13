-- MIGRACIÓN: RBAC DINÁMICO POR TENANT
-- Archivo: supabase/migrations/20260713000052_dynamic_rbac.sql
--
-- Extiende el esquema core (init_core.sql) para soportar roles personalizados
-- por tenant con permisos granulares, manteniendo compatibilidad con los roles
-- legacy de sistema (tenant_id IS NULL en la tabla `roles`).
--
-- ADR de referencia: docs/04_arquitectura/ADRs/005-dynamic-rbac.md

-- =============================================================================
-- 1. AMPLIAR CATÁLOGO DE PERMISOS
-- =============================================================================
-- Se añaden permisos para módulos que no estaban cubiertos en el seed inicial.
-- Los códigos siguen la convención existente: `módulo.acción`.

INSERT INTO permissions (permission_code, name, module, description) VALUES
-- Módulo Leads (CRM)
('leads.view',      'Ver Leads',         'CRM', 'Permite consultar el listado y detalle de leads.'),
('leads.create',    'Crear Leads',       'CRM', 'Permite registrar nuevos leads en el embudo comercial.'),
('leads.edit',      'Editar Leads',      'CRM', 'Permite actualizar información de leads existentes.'),
('leads.delete',    'Eliminar Leads',    'CRM', 'Permite archivar o borrar leads del sistema.'),
-- Módulo Requerimientos
('requirements.view',   'Ver Requerimientos',    'Operaciones', 'Permite consultar requerimientos de clientes.'),
('requirements.create', 'Crear Requerimientos',  'Operaciones', 'Permite registrar nuevos requerimientos.'),
('requirements.edit',   'Editar Requerimientos', 'Operaciones', 'Permite actualizar el estado de requerimientos.'),
-- Módulo Cotizaciones (complemento)
('quotes.edit',     'Editar Cotizaciones',   'Comercial', 'Permite modificar cotizaciones en borrador.'),
('quotes.delete',   'Eliminar Cotizaciones', 'Comercial', 'Permite archivar cotizaciones.'),
-- Módulo Facturas (complemento)
('invoices.view',   'Ver Facturas',      'Finanzas', 'Permite consultar el historial de facturas.'),
('invoices.edit',   'Editar Facturas',   'Finanzas', 'Permite modificar facturas en estado borrador.'),
('invoices.delete', 'Eliminar Facturas', 'Finanzas', 'Permite anular facturas emitidas.'),
-- Módulo Settings
('settings.view',   'Ver Configuración',        'Plataforma', 'Permite acceder a la sección de configuración.'),
('settings.manage', 'Gestionar Configuración',  'Plataforma', 'Permite modificar parámetros del tenant.'),
-- Módulo RBAC (gestión de roles)
('roles.view',   'Ver Roles y Permisos',      'Seguridad', 'Permite consultar roles personalizados del tenant.'),
('roles.manage', 'Gestionar Roles Personalizados', 'Seguridad', 'Permite crear, editar y asignar roles del tenant.')
ON CONFLICT (permission_code) DO NOTHING;

-- =============================================================================
-- 2. TABLA role_permissions (PIVOTE ROL ↔ PERMISO)
-- =============================================================================
-- Aplica tanto a roles del sistema (tenant_id IS NULL en roles)
-- como a roles personalizados (tenant_id NOT NULL en roles).

CREATE TABLE IF NOT EXISTS role_permissions (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id       uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at    timestamp NOT NULL DEFAULT NOW(),
    granted_by    uuid REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT unique_role_permission UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role    ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_perm    ON role_permissions(permission_id);

-- =============================================================================
-- 3. SEED: PERMISOS DE ROLES DE SISTEMA
-- =============================================================================
-- Mapea los roles globales (tenant_id IS NULL) a los permisos de la BD.
-- SUPER_ADMIN y ADMIN_EMPRESA obtienen todos los permisos vía lógica en la
-- función get_user_permissions (optimización: evitar N filas por permiso).
-- Los demás roles reciben solo sus permisos correspondientes.

DO $$
DECLARE
    -- IDs de roles de sistema
    r_director_comercial   uuid;
    r_ejecutivo_comercial  uuid;
    r_director_operaciones uuid;
    r_tecnico_campo        uuid;
    r_almacenista          uuid;
    r_auditor              uuid;
    -- IDs de permisos clave
    p_leads_view            uuid;
    p_leads_create          uuid;
    p_leads_edit            uuid;
    p_clients_view          uuid;
    p_clients_create        uuid;
    p_clients_edit          uuid;
    p_quotes_view           uuid;
    p_quotes_create         uuid;
    p_quotes_edit           uuid;
    p_quotes_approve        uuid;
    p_requirements_view     uuid;
    p_requirements_create   uuid;
    p_requirements_edit     uuid;
    p_jobs_create           uuid;
    p_jobs_manage           uuid;
    p_jobs_close            uuid;
    p_documents_view        uuid;
    p_documents_upload      uuid;
    p_inventory_view        uuid;
    p_inventory_movement    uuid;
    p_items_manage          uuid;
    p_invoices_view         uuid;
    p_invoices_create       uuid;
    p_payments_view         uuid;
    p_audit_view_tenant     uuid;
    p_audit_view_global     uuid;
    p_settings_view         uuid;
    p_settings_manage       uuid;
    p_users_create          uuid;
    p_users_edit            uuid;
    p_users_permissions     uuid;
    p_roles_view            uuid;
    p_roles_manage          uuid;
BEGIN
    -- Roles
    SELECT id INTO r_director_comercial   FROM roles WHERE role_code = 'DIRECTOR_COMERCIAL'   AND tenant_id IS NULL;
    SELECT id INTO r_ejecutivo_comercial  FROM roles WHERE role_code = 'EJECUTIVO_COMERCIAL'  AND tenant_id IS NULL;
    SELECT id INTO r_director_operaciones FROM roles WHERE role_code = 'DIRECTOR_OPERACIONES' AND tenant_id IS NULL;
    SELECT id INTO r_tecnico_campo        FROM roles WHERE role_code = 'TECNICO_CAMPO'        AND tenant_id IS NULL;
    SELECT id INTO r_almacenista          FROM roles WHERE role_code = 'ALMACENISTA'          AND tenant_id IS NULL;
    SELECT id INTO r_auditor              FROM roles WHERE role_code = 'AUDITOR'              AND tenant_id IS NULL;

    -- Permisos
    SELECT id INTO p_leads_view            FROM permissions WHERE permission_code = 'leads.view';
    SELECT id INTO p_leads_create          FROM permissions WHERE permission_code = 'leads.create';
    SELECT id INTO p_leads_edit            FROM permissions WHERE permission_code = 'leads.edit';
    SELECT id INTO p_clients_view          FROM permissions WHERE permission_code = 'clients.view';
    SELECT id INTO p_clients_create        FROM permissions WHERE permission_code = 'clients.create';
    SELECT id INTO p_clients_edit          FROM permissions WHERE permission_code = 'clients.edit';
    SELECT id INTO p_quotes_view           FROM permissions WHERE permission_code = 'quotes.view';
    SELECT id INTO p_quotes_create         FROM permissions WHERE permission_code = 'quotes.create';
    SELECT id INTO p_quotes_edit           FROM permissions WHERE permission_code = 'quotes.edit';
    SELECT id INTO p_quotes_approve        FROM permissions WHERE permission_code = 'quotes.approve';
    SELECT id INTO p_requirements_view     FROM permissions WHERE permission_code = 'requirements.view';
    SELECT id INTO p_requirements_create   FROM permissions WHERE permission_code = 'requirements.create';
    SELECT id INTO p_requirements_edit     FROM permissions WHERE permission_code = 'requirements.edit';
    SELECT id INTO p_jobs_create           FROM permissions WHERE permission_code = 'jobs.create';
    SELECT id INTO p_jobs_manage           FROM permissions WHERE permission_code = 'jobs.manage';
    SELECT id INTO p_jobs_close            FROM permissions WHERE permission_code = 'jobs.close';
    SELECT id INTO p_documents_view        FROM permissions WHERE permission_code = 'documents.view';
    SELECT id INTO p_documents_upload      FROM permissions WHERE permission_code = 'documents.upload';
    SELECT id INTO p_inventory_view        FROM permissions WHERE permission_code = 'inventory.view';
    SELECT id INTO p_inventory_movement    FROM permissions WHERE permission_code = 'inventory.movement';
    SELECT id INTO p_items_manage          FROM permissions WHERE permission_code = 'items.manage';
    SELECT id INTO p_invoices_view         FROM permissions WHERE permission_code = 'invoices.view';
    SELECT id INTO p_invoices_create       FROM permissions WHERE permission_code = 'invoices.create';
    SELECT id INTO p_payments_view         FROM permissions WHERE permission_code = 'payments.view';
    SELECT id INTO p_audit_view_tenant     FROM permissions WHERE permission_code = 'audit.view_tenant';
    SELECT id INTO p_audit_view_global     FROM permissions WHERE permission_code = 'audit.view_global';
    SELECT id INTO p_settings_view         FROM permissions WHERE permission_code = 'settings.view';
    SELECT id INTO p_settings_manage       FROM permissions WHERE permission_code = 'settings.manage';
    SELECT id INTO p_users_create          FROM permissions WHERE permission_code = 'users.create';
    SELECT id INTO p_users_edit            FROM permissions WHERE permission_code = 'users.edit';
    SELECT id INTO p_users_permissions     FROM permissions WHERE permission_code = 'users.permissions';
    SELECT id INTO p_roles_view            FROM permissions WHERE permission_code = 'roles.view';
    SELECT id INTO p_roles_manage          FROM permissions WHERE permission_code = 'roles.manage';

    -- DIRECTOR_COMERCIAL
    IF r_director_comercial IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id) VALUES
        (r_director_comercial, p_leads_view),
        (r_director_comercial, p_leads_create),
        (r_director_comercial, p_leads_edit),
        (r_director_comercial, p_clients_view),
        (r_director_comercial, p_clients_create),
        (r_director_comercial, p_clients_edit),
        (r_director_comercial, p_quotes_view),
        (r_director_comercial, p_quotes_create),
        (r_director_comercial, p_quotes_edit),
        (r_director_comercial, p_quotes_approve),
        (r_director_comercial, p_requirements_view),
        (r_director_comercial, p_requirements_create),
        (r_director_comercial, p_requirements_edit),
        (r_director_comercial, p_settings_view),
        (r_director_comercial, p_users_create),
        (r_director_comercial, p_users_edit),
        (r_director_comercial, p_roles_view)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- EJECUTIVO_COMERCIAL
    IF r_ejecutivo_comercial IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id) VALUES
        (r_ejecutivo_comercial, p_leads_view),
        (r_ejecutivo_comercial, p_leads_create),
        (r_ejecutivo_comercial, p_leads_edit),
        (r_ejecutivo_comercial, p_clients_view),
        (r_ejecutivo_comercial, p_clients_create),
        (r_ejecutivo_comercial, p_quotes_view),
        (r_ejecutivo_comercial, p_quotes_create),
        (r_ejecutivo_comercial, p_quotes_edit),
        (r_ejecutivo_comercial, p_requirements_view),
        (r_ejecutivo_comercial, p_requirements_create),
        (r_ejecutivo_comercial, p_settings_view)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- DIRECTOR_OPERACIONES
    IF r_director_operaciones IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id) VALUES
        (r_director_operaciones, p_jobs_create),
        (r_director_operaciones, p_jobs_manage),
        (r_director_operaciones, p_jobs_close),
        (r_director_operaciones, p_documents_view),
        (r_director_operaciones, p_documents_upload),
        (r_director_operaciones, p_inventory_view),
        (r_director_operaciones, p_requirements_view),
        (r_director_operaciones, p_requirements_edit),
        (r_director_operaciones, p_settings_view)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- TECNICO_CAMPO
    IF r_tecnico_campo IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id) VALUES
        (r_tecnico_campo, p_jobs_manage),
        (r_tecnico_campo, p_documents_view),
        (r_tecnico_campo, p_documents_upload),
        (r_tecnico_campo, p_inventory_view)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- ALMACENISTA
    IF r_almacenista IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id) VALUES
        (r_almacenista, p_inventory_view),
        (r_almacenista, p_inventory_movement),
        (r_almacenista, p_items_manage),
        (r_almacenista, p_documents_view)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;

    -- AUDITOR
    IF r_auditor IS NOT NULL THEN
        INSERT INTO role_permissions (role_id, permission_id) VALUES
        (r_auditor, p_audit_view_tenant),
        (r_auditor, p_audit_view_global),
        (r_auditor, p_settings_view)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
    END IF;
END $$;

-- =============================================================================
-- 4. FUNCIÓN get_user_permissions(p_user_id, p_tenant_id)
-- =============================================================================
-- Retorna el conjunto de permission_codes efectivos del usuario, considerando:
--   a) Roles de sistema (tenant_id IS NULL) → acceso total si es SUPER_ADMIN/ADMIN
--   b) Roles personalizados del tenant → permisos de role_permissions
--   c) Excepciones individuales en user_permissions (granted=true/false)
--
-- SECURITY DEFINER para evitar recursión de RLS al llamarse desde el middleware.

CREATE OR REPLACE FUNCTION get_user_permissions(
    p_user_id  uuid,
    p_tenant_id uuid
)
RETURNS TABLE(permission_code text, source text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_superuser boolean := false;
    v_system_role_code text;
BEGIN
    -- Verificar si el usuario tiene un rol de sistema que otorga acceso total
    SELECT r.role_code INTO v_system_role_code
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = p_user_id
      AND r.tenant_id IS NULL
      AND r.role_code IN ('SUPER_ADMIN', 'ADMIN_EMPRESA', 'ADMIN_DEV', 'GERENTE_GENERAL')
    LIMIT 1;

    IF v_system_role_code IS NOT NULL THEN
        v_is_superuser := true;
    END IF;

    -- Si es superusuario, retornar todos los permisos disponibles
    IF v_is_superuser THEN
        RETURN QUERY
        SELECT p.permission_code::text, 'system_superuser'::text
        FROM permissions p
        WHERE NOT EXISTS (
            -- Respetar revocaciones individuales explícitas
            SELECT 1 FROM user_permissions up
            WHERE up.user_id = p_user_id
              AND up.permission_id = p.id
              AND up.granted = false
        );
        RETURN;
    END IF;

    -- Permisos concedidos por roles (sistema + personalizados del tenant)
    RETURN QUERY
    SELECT DISTINCT p.permission_code::text, 'role'::text
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    JOIN role_permissions rp ON rp.role_id = r.id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND (r.tenant_id IS NULL OR r.tenant_id = p_tenant_id)
      -- Excluir permisos revocados individualmente
      AND NOT EXISTS (
          SELECT 1 FROM user_permissions up
          WHERE up.user_id = p_user_id
            AND up.permission_id = p.id
            AND up.granted = false
      );

    -- Permisos adicionales concedidos individualmente (excepciones positivas)
    RETURN QUERY
    SELECT p.permission_code::text, 'individual_grant'::text
    FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = p_user_id
      AND up.granted = true
      AND (up.tenant_id IS NULL OR up.tenant_id = p_tenant_id);
END;
$$;

-- =============================================================================
-- 5. FUNCIÓN check_user_permission(p_user_id, p_tenant_id, p_permission_code)
-- =============================================================================
-- Verificación puntual de un permiso. Optimizada para uso en middleware.

CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id        uuid,
    p_tenant_id      uuid,
    p_permission_code text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_has_permission boolean := false;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM get_user_permissions(p_user_id, p_tenant_id) gup
        WHERE gup.permission_code = p_permission_code
    ) INTO v_has_permission;

    RETURN v_has_permission;
END;
$$;

-- =============================================================================
-- 6. ROW LEVEL SECURITY para role_permissions y roles personalizados
-- =============================================================================

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- Los usuarios autenticados ven los role_permissions de su propio tenant
-- (roles personalizados) y los de sistema (tenant_id IS NULL en roles).
CREATE POLICY "rp_select_own_tenant" ON role_permissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM roles r
            JOIN users u ON u.auth_user_id = auth.uid()
            WHERE r.id = role_permissions.role_id
              AND (r.tenant_id IS NULL OR r.tenant_id = u.tenant_id)
        )
    );

-- Solo administradores del tenant pueden crear/modificar role_permissions
-- de roles personalizados (tenant_id NOT NULL). Los de sistema son inmutables
-- desde la aplicación (solo via migraciones).
CREATE POLICY "rp_insert_tenant_admin" ON role_permissions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM roles r
            JOIN users u ON u.auth_user_id = auth.uid()
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles ur_role ON ur_role.id = ur.role_id
            WHERE r.id = role_permissions.role_id
              AND r.tenant_id = u.tenant_id   -- solo roles del propio tenant
              AND ur_role.role_code IN ('ADMIN_EMPRESA', 'SUPER_ADMIN', 'ADMIN_DEV')
        )
    );

CREATE POLICY "rp_delete_tenant_admin" ON role_permissions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM roles r
            JOIN users u ON u.auth_user_id = auth.uid()
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles ur_role ON ur_role.id = ur.role_id
            WHERE r.id = role_permissions.role_id
              AND r.tenant_id = u.tenant_id
              AND ur_role.role_code IN ('ADMIN_EMPRESA', 'SUPER_ADMIN', 'ADMIN_DEV')
        )
    );

-- RLS en roles: los custom roles (tenant_id NOT NULL) son visibles solo
-- para usuarios del mismo tenant. Los roles de sistema (tenant_id IS NULL)
-- son visibles para todos los usuarios autenticados.

-- La política heredada de init_core.sql ("roles_isolation" FOR ALL) es demasiado
-- permisiva: permite INSERT/UPDATE/DELETE a cualquier usuario del tenant sin
-- requerir rol de administrador. Se elimina y se reemplaza con políticas
-- granulares por verbo.
DROP POLICY IF EXISTS roles_isolation ON roles;

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_select_policy" ON roles;
CREATE POLICY "roles_select_policy" ON roles
    FOR SELECT
    USING (
        tenant_id IS NULL -- roles de sistema: visibles para todos
        OR EXISTS (
            SELECT 1 FROM users u
            WHERE u.auth_user_id = auth.uid()
              AND u.tenant_id = roles.tenant_id
        )
    );

DROP POLICY IF EXISTS "roles_insert_tenant_admin" ON roles;
CREATE POLICY "roles_insert_tenant_admin" ON roles
    FOR INSERT
    WITH CHECK (
        tenant_id IS NOT NULL -- no se pueden crear roles de sistema desde la app
        AND EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles ur_role ON ur_role.id = ur.role_id
            WHERE u.auth_user_id = auth.uid()
              AND u.tenant_id = roles.tenant_id
              AND ur_role.role_code IN ('ADMIN_EMPRESA', 'SUPER_ADMIN', 'ADMIN_DEV')
        )
    );

DROP POLICY IF EXISTS "roles_update_tenant_admin" ON roles;
CREATE POLICY "roles_update_tenant_admin" ON roles
    FOR UPDATE
    USING (
        tenant_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles ur_role ON ur_role.id = ur.role_id
            WHERE u.auth_user_id = auth.uid()
              AND u.tenant_id = roles.tenant_id
              AND ur_role.role_code IN ('ADMIN_EMPRESA', 'SUPER_ADMIN', 'ADMIN_DEV')
        )
    );

-- Política DELETE para roles (faltaba en la definición original)
DROP POLICY IF EXISTS "roles_delete_tenant_admin" ON roles;
CREATE POLICY "roles_delete_tenant_admin" ON roles
    FOR DELETE
    USING (
        tenant_id IS NOT NULL -- nunca borrar roles de sistema desde la app
        AND EXISTS (
            SELECT 1 FROM users u
            JOIN user_roles ur ON ur.user_id = u.id
            JOIN roles ur_role ON ur_role.id = ur.role_id
            WHERE u.auth_user_id = auth.uid()
              AND u.tenant_id = roles.tenant_id
              AND ur_role.role_code IN ('ADMIN_EMPRESA', 'SUPER_ADMIN', 'ADMIN_DEV')
        )
    );

-- =============================================================================
-- 6b. TIGHTEN user_roles — prevenir auto-asignación de roles elevados
-- =============================================================================
-- La política "user_roles_isolation" de init_core.sql (FOR ALL) permite a
-- cualquier usuario del tenant insertar en user_roles, habilitando escalada
-- de privilegios (auto-asignarse SUPER_ADMIN). Se reemplaza con políticas
-- que restringen INSERT/UPDATE/DELETE a administradores del tenant.

DROP POLICY IF EXISTS user_roles_isolation ON user_roles;

-- SELECT: cualquier usuario ve los user_roles de su propio tenant
CREATE POLICY "ur_select_own_tenant" ON user_roles
    FOR SELECT
    USING (
        is_platform_super_admin()
        OR tenant_id = (SELECT u.tenant_id FROM users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
    );

-- INSERT/UPDATE/DELETE: solo admins pueden gestionar asignaciones de roles
CREATE POLICY "ur_write_tenant_admin" ON user_roles
    FOR INSERT
    WITH CHECK (
        is_platform_super_admin()
        OR EXISTS (
            SELECT 1
            FROM users u
            JOIN user_roles existing_ur ON existing_ur.user_id = u.id
            JOIN roles ur_role ON ur_role.id = existing_ur.role_id
            WHERE u.auth_user_id = auth.uid()
              AND u.tenant_id = user_roles.tenant_id
              AND ur_role.role_code IN ('ADMIN_EMPRESA', 'SUPER_ADMIN', 'ADMIN_DEV')
        )
    );

CREATE POLICY "ur_delete_tenant_admin" ON user_roles
    FOR DELETE
    USING (
        is_platform_super_admin()
        OR EXISTS (
            SELECT 1
            FROM users u
            JOIN user_roles existing_ur ON existing_ur.user_id = u.id
            JOIN roles ur_role ON ur_role.id = existing_ur.role_id
            WHERE u.auth_user_id = auth.uid()
              AND u.tenant_id = user_roles.tenant_id
              AND ur_role.role_code IN ('ADMIN_EMPRESA', 'SUPER_ADMIN', 'ADMIN_DEV')
        )
    );

-- =============================================================================
-- 7. GRANT de ejecución en funciones (service_role las puede llamar siempre)
-- =============================================================================
GRANT EXECUTE ON FUNCTION get_user_permissions(uuid, uuid)    TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission(uuid, uuid, text) TO authenticated;

-- =============================================================================
-- 8. ÍNDICES ADICIONALES para optimización de consultas RBAC
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_tenant
    ON user_roles(user_id, tenant_id);

CREATE INDEX IF NOT EXISTS idx_roles_tenant_null
    ON roles(tenant_id) WHERE tenant_id IS NULL;
