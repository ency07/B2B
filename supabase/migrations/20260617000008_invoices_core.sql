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
