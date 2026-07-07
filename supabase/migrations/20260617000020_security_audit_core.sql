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
