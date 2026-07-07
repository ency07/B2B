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
