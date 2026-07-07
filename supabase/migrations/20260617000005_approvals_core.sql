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
