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
