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
