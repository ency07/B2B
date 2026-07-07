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
