-- MIGRACIÓN: NOTAS DE CRÉDITO
-- Archivo: supabase/migrations/20260720210000_credit_notes.sql
-- Gap E-003: Crear entidad CreditNote con tabla, triggers, RLS y business events

-- 1. Tabla de Notas de Crédito (credit_notes)
CREATE TABLE credit_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    credit_note_code varchar(50) NOT NULL,
    invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    reason varchar(50) NOT NULL CHECK (reason IN ('DEVOLUCION', 'ERROR', 'DESCUENTO', 'ANULACION', 'GARANTIA')),
    description text,
    subtotal decimal(18,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount decimal(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    total_amount decimal(18,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    status varchar(50) NOT NULL DEFAULT 'EMITIDA' CHECK (status IN ('EMITIDA', 'APLICADA', 'ANULADA')),
    applied_at timestamp,
    cancel_reason text,
    cancelled_by uuid REFERENCES users(id) ON DELETE SET NULL,
    cancelled_at timestamp,
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,
    CONSTRAINT unique_tenant_credit_note_code UNIQUE (tenant_id, credit_note_code)
);

-- 2. Índices
CREATE INDEX idx_credit_notes_tenant ON credit_notes(tenant_id);
CREATE INDEX idx_credit_notes_invoice ON credit_notes(invoice_id);
CREATE INDEX idx_credit_notes_client ON credit_notes(client_id);
CREATE INDEX idx_credit_notes_status ON credit_notes(status);

-- 3. Trigger: Autogeneración de Código Correlativo (NC-000001)
CREATE OR REPLACE FUNCTION handle_credit_note_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.credit_note_code IS NULL OR NEW.credit_note_code = '' THEN
        NEW.credit_note_code := 'NC-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'CREDIT_NOTE')::text, 6, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_credit_note_code
BEFORE INSERT ON credit_notes
FOR EACH ROW
EXECUTE FUNCTION handle_credit_note_sequences();

-- 4. Trigger: Validación de Monto vs Factura
CREATE OR REPLACE FUNCTION validate_credit_note_amount()
RETURNS TRIGGER AS $$
DECLARE
    v_invoice_total decimal(18,2);
    v_existing_nc_total decimal(18,2);
BEGIN
    SELECT total_amount INTO v_invoice_total
    FROM invoices WHERE id = NEW.invoice_id;

    -- Sumar NCs previas aplicadas a la misma factura
    SELECT COALESCE(SUM(total_amount), 0) INTO v_existing_nc_total
    FROM credit_notes
    WHERE invoice_id = NEW.invoice_id
      AND status = 'APLICADA'
      AND deleted_at IS NULL;

    -- Validar que la NC no exceda el saldo de la factura
    IF NEW.total_amount > (v_invoice_total - v_existing_nc_total) THEN
        RAISE EXCEPTION 'El monto de la nota de crédito ($%) excede el saldo disponible de la factura ($%).',
            NEW.total_amount, (v_invoice_total - v_existing_nc_total);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_credit_note_amount
BEFORE INSERT ON credit_notes
FOR EACH ROW
EXECUTE FUNCTION validate_credit_note_amount();

-- 5. Trigger: Aplicación de NC a Factura (actualiza paid_amount y status)
CREATE OR REPLACE FUNCTION handle_credit_note_application()
RETURNS TRIGGER AS $$
DECLARE
    v_total_nc decimal(18,2) := 0;
    v_total_amount decimal(18,2) := 0;
BEGIN
    -- Si la NC pasa a APLICADA
    IF NEW.status = 'APLICADA' AND (OLD.status IS NULL OR OLD.status <> 'APLICADA') THEN
        -- Calcular total de NCs aplicadas a la factura (incluyendo esta)
        SELECT COALESCE(SUM(total_amount), 0) INTO v_total_nc
        FROM credit_notes
        WHERE invoice_id = NEW.invoice_id
          AND status = 'APLICADA'
          AND deleted_at IS NULL;

        SELECT total_amount INTO v_total_amount
        FROM invoices WHERE id = NEW.invoice_id;

        -- Aumentar paid_amount (la NCreduce el saldo pendiente)
        UPDATE invoices
        SET paid_amount = LEAST(paid_amount + NEW.total_amount, total_amount),
            status = CASE
                WHEN (paid_amount + NEW.total_amount) >= total_amount THEN 'PAGADA'
                WHEN (paid_amount + NEW.total_amount) > 0 THEN 'PARCIALMENTE_PAGADA'
                ELSE 'EMITIDA'
            END,
            updated_at = NOW()
        WHERE id = NEW.invoice_id;

        UPDATE credit_notes
        SET applied_at = NOW(),
            updated_at = NOW()
        WHERE id = NEW.id;

    -- Si una NC aplicada se ANULA
    ELSIF NEW.status = 'ANULADA' AND OLD.status = 'APLICADA' THEN
        -- Recalcular paid_amount excluyendo esta NC
        SELECT total_amount INTO v_total_amount
        FROM invoices WHERE id = NEW.invoice_id;

        UPDATE invoices
        SET paid_amount = GREATEST(paid_amount - NEW.total_amount, 0),
            status = CASE
                WHEN GREATEST(paid_amount - NEW.total_amount, 0) >= total_amount THEN 'PAGADA'
                WHEN GREATEST(paid_amount - NEW.total_amount, 0) > 0 THEN 'PARCIALMENTE_PAGADA'
                ELSE 'EMITIDA'
            END,
            updated_at = NOW()
        WHERE id = NEW.invoice_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_credit_note_application
AFTER INSERT OR UPDATE OF status ON credit_notes
FOR EACH ROW
EXECUTE FUNCTION handle_credit_note_application();

-- 6. Trigger: Emisión de Business Events
CREATE OR REPLACE FUNCTION dispatch_credit_note_events()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_event_code varchar(100);
    v_payload jsonb;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_OP = 'INSERT' THEN
        v_event_code := 'CREDIT_NOTE_CREATED';
        v_payload := jsonb_build_object(
            'credit_note_code', NEW.credit_note_code,
            'invoice_id', NEW.invoice_id,
            'reason', NEW.reason,
            'total', NEW.total_amount
        );
    ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
        IF NEW.status = 'APLICADA' THEN v_event_code := 'CREDIT_NOTE_APPLIED';
        ELSIF NEW.status = 'ANULADA' THEN v_event_code := 'CREDIT_NOTE_CANCELLED';
        END IF;
        v_payload := jsonb_build_object(
            'credit_note_code', NEW.credit_note_code,
            'old_status', OLD.status,
            'new_status', NEW.status
        );
    END IF;

    IF v_event_code IS NOT NULL THEN
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (NEW.tenant_id, v_event_code, 'CREDIT_NOTE', NEW.id, v_payload, v_user_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_credit_note_events
AFTER INSERT OR UPDATE ON credit_notes
FOR EACH ROW
EXECUTE FUNCTION dispatch_credit_note_events();

-- 7. Trigger: Bloqueo de Borrado Físico
CREATE OR REPLACE FUNCTION block_physical_credit_note_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Las notas de crédito son inmutables. Utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_credit_note_delete
BEFORE DELETE ON credit_notes
FOR EACH ROW
EXECUTE FUNCTION block_physical_credit_note_delete();

-- 8. Trazabilidad e Inmutabilidad
CREATE TRIGGER trg_credit_note_traceability
BEFORE INSERT OR UPDATE ON credit_notes
FOR EACH ROW
EXECUTE FUNCTION handle_approval_traceability();

-- 9. Integración con Auditoría
CREATE TRIGGER audit_credit_notes
AFTER INSERT OR UPDATE OR DELETE ON credit_notes
FOR EACH ROW
EXECUTE FUNCTION process_audit_log();

-- 10. Row Level Security
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY credit_notes_super_admin ON credit_notes FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY credit_notes_select_tenant ON credit_notes FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY credit_notes_write_tenant ON credit_notes FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- 11. Permiso RBAC (agregar a la matriz de permisos)
INSERT INTO permissions (permission_code, name, module, description)
VALUES ('credit_notes.create', 'Crear Notas de Crédito', 'Finanzas', 'Permite crear notas de crédito para ajustar facturas.')
ON CONFLICT (permission_code) DO NOTHING;
