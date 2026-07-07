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
