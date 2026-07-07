-- MIGRACIÓN FASE 3: REQUERIMIENTOS Y DOCUMENTOS
-- Archivo: supabase/migrations/20260617000003_requirements_core.sql

-- 1. Helper: Obtener el ID del Usuario en Sesión Operativa
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS uuid AS $$
DECLARE
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id 
    FROM users 
    WHERE auth_user_id = auth.uid() 
    LIMIT 1;
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Helper: Sumar Horas Hábiles (Business Hours SLA)
CREATE OR REPLACE FUNCTION add_business_hours(p_start timestamptz, p_hours integer)
RETURNS timestamp AS $$
DECLARE
    v_result timestamp := p_start;
    v_added integer := 0;
BEGIN
    WHILE v_added < p_hours LOOP
        v_result := v_result + interval '1 hour';
        -- extract(isodow from timestamp) -> 1=Lunes, 6=Sábado, 7=Domingo (omite fines de semana)
        IF extract(isodow from v_result) < 6 THEN
            v_added := v_added + 1;
        END IF;
    END LOOP;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear Tabla de Secuencias por Tenant (Control de Concurrencia de Códigos)
CREATE TABLE tenant_sequences (
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sequence_type varchar(50) NOT NULL, -- 'REQUIREMENT', 'DOCUMENT'
    current_value integer NOT NULL DEFAULT 0,
    updated_at timestamp NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, sequence_type)
);

-- Función para obtener secuencial transaccional por tenant sin MAX()+1
CREATE OR REPLACE FUNCTION get_next_tenant_sequence(p_tenant_id uuid, p_sequence_type varchar)
RETURNS integer AS $$
DECLARE
    v_next_val integer;
BEGIN
    INSERT INTO tenant_sequences (tenant_id, sequence_type, current_value, updated_at)
    VALUES (p_tenant_id, p_sequence_type, 1, NOW())
    ON CONFLICT (tenant_id, sequence_type)
    DO UPDATE SET current_value = tenant_sequences.current_value + 1, updated_at = NOW()
    RETURNING current_value INTO v_next_val;
    
    RETURN v_next_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear Tabla de Requerimientos (requirements)
CREATE TABLE requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    requirement_code varchar(50) NOT NULL,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    contact_id uuid REFERENCES client_contacts(id) ON DELETE SET NULL,
    title varchar(250) NOT NULL,
    description text,
    category varchar(50) NOT NULL CHECK (category IN (
        'FABRICACION', 'VENTA', 'MANTENIMIENTO', 'REPARACION', 'OTRO'
    )),
    source varchar(100),
    
    -- Responsables Específicos
    created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    sales_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    engineering_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    
    estimated_value numeric(18,2),
    priority varchar(50) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN (
        'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    )),
    status varchar(50) NOT NULL DEFAULT 'BORRADOR' CHECK (status IN (
        'BORRADOR', 'NUEVO', 'EN_REVISION', 'DIAGNOSTICO', 'COTIZACION', 'APROBACION', 'OT_GENERADA', 'EJECUCION', 'CERRADO', 'CANCELADO'
    )),
    
    -- Matriz de Cancelación
    cancel_code varchar(50) CHECK (cancel_code IN (
        'CLIENTE_DESISTE', 'SIN_PRESUPUESTO', 'FUERA_ALCANCE', 'DUPLICADO', 'ERROR_REGISTRO', 'OTRO'
    )),
    cancel_reason text,
    cancelled_by uuid REFERENCES users(id) ON DELETE SET NULL,
    cancelled_at timestamp,
    
    -- SLAs Físicos
    sla_response_due_at timestamp,
    sla_diagnostic_due_at timestamp,
    sla_quote_due_at timestamp,
    sla_close_due_at timestamp,

    -- Trazabilidad general
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,
    status_changed_at timestamp,
    status_changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
    assigned_by uuid REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT unique_tenant_requirement_code UNIQUE (tenant_id, requirement_code)
);

-- 5. Crear Tabla de Documentos (documents - Repositorio Transversal Corporativo Global)
CREATE TABLE documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    document_code varchar(50) NOT NULL,
    document_type varchar(50) NOT NULL CHECK (document_type IN (
        'CLIENT_REQUEST', 'DIAGNOSTIC', 'TECHNICAL_VISIT', 'QUOTE', 'CONTRACT', 
        'WORK_ORDER', 'BLUEPRINT', 'TECHNICAL_MEMO', 'DELIVERY_NOTE', 'INVOICE', 
        'PAYMENT_VOUCHER', 'WARRANTY', 'SERVICE_REPORT', 'PHOTOS', 'APPROVAL'
    )),
    entity_type varchar(50) NOT NULL CHECK (entity_type IN (
        'CLIENT', 'REQUIREMENT', 'DIAGNOSTIC', 'QUOTE', 'JOB', 'INVOICE', 
        'PAYMENT', 'WARRANTY', 'PROJECT', 'AUDIT', 'USER', 'ASSET', 
        'INVENTORY', 'PURCHASE', 'QUALITY'
    )),
    entity_id uuid NOT NULL,
    version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
    file_name varchar(250) NOT NULL,
    file_path text NOT NULL,
    
    -- Metadatos y Desacoplamiento de Storage
    file_size bigint NOT NULL,
    checksum varchar(64),
    storage_provider varchar(50) NOT NULL DEFAULT 'SUPABASE' CHECK (storage_provider IN (
        'SUPABASE', 'S3', 'AZURE_BLOB', 'LOCAL'
    )),
    storage_path text NOT NULL,
    
    uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_at timestamp NOT NULL DEFAULT NOW(),
    status varchar(50) NOT NULL DEFAULT 'PUBLICADO' CHECK (status IN (
        'BORRADOR', 'PUBLICADO', 'OBSOLETO', 'ARCHIVADO'
    )),
    
    -- Soft Delete
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_document_code_version UNIQUE (tenant_id, document_code, version)
);

-- 6. Crear Índices de Rendimiento
CREATE INDEX idx_requirements_tenant ON requirements(tenant_id);
CREATE INDEX idx_requirements_client ON requirements(client_id);
CREATE INDEX idx_requirements_sales_user ON requirements(sales_user_id);
CREATE INDEX idx_requirements_engineering_user ON requirements(engineering_user_id);
CREATE INDEX idx_requirements_code ON requirements(tenant_id, requirement_code);

CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_code ON documents(tenant_id, document_code);

-- 7. Triggers de Autogeneración de Códigos

CREATE OR REPLACE FUNCTION handle_requirement_code()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.requirement_code := 'REQ-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'REQUIREMENT')::text, 6, '0');
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.requirement_code <> OLD.requirement_code THEN
            NEW.requirement_code := OLD.requirement_code;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_requirement_code
BEFORE INSERT OR UPDATE ON requirements
FOR EACH ROW
EXECUTE FUNCTION handle_requirement_code();

CREATE OR REPLACE FUNCTION handle_document_code()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND (NEW.document_code IS NULL OR NEW.document_code = '') THEN
        NEW.document_code := 'DOC-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'DOCUMENT')::text, 6, '0');
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.document_code <> OLD.document_code THEN
            NEW.document_code := OLD.document_code;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_document_code
BEFORE INSERT OR UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION handle_document_code();

-- 8. Trigger de Control de Versiones Documentales
CREATE OR REPLACE FUNCTION handle_document_versioning()
RETURNS TRIGGER AS $$
DECLARE
    v_max_version integer;
BEGIN
    IF NEW.document_code IS NULL OR NEW.document_code = '' THEN
        NEW.document_code := 'DOC-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'DOCUMENT')::text, 6, '0');
    END IF;

    SELECT COALESCE(MAX(version), 0)
    INTO v_max_version
    FROM documents
    WHERE tenant_id = NEW.tenant_id
      AND document_code = NEW.document_code;
      
    IF v_max_version > 0 THEN
        NEW.version := v_max_version + 1;
        
        -- Cambiar a OBSOLETO la versión anterior
        UPDATE documents
        SET status = 'OBSOLETO'
        WHERE tenant_id = NEW.tenant_id
          AND document_code = NEW.document_code
          AND version = v_max_version;
    ELSE
        NEW.version := 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_document_versioning
BEFORE INSERT ON documents
FOR EACH ROW
EXECUTE FUNCTION handle_document_versioning();

-- 9. Trigger de Trazabilidad y SLAs en Requerimientos
CREATE OR REPLACE FUNCTION handle_requirement_traceability()
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
        
        -- Calcular SLA de Respuesta inicial si entra en estado NUEVO o BORRADOR
        IF NEW.status = 'NUEVO' THEN
            NEW.sla_response_due_at := add_business_hours(NOW(), 24);
        END IF;
        
        -- Calcular SLA de cierre inicial
        IF NEW.priority = 'LOW' THEN
            NEW.sla_close_due_at := add_business_hours(NOW(), 240);
        ELSIF NEW.priority = 'MEDIUM' THEN
            NEW.sla_close_due_at := add_business_hours(NOW(), 120);
        ELSIF NEW.priority = 'HIGH' THEN
            NEW.sla_close_due_at := add_business_hours(NOW(), 72);
        ELSIF NEW.priority = 'CRITICAL' THEN
            NEW.sla_close_due_at := add_business_hours(NOW(), 48);
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_at := NOW();
        NEW.updated_by := v_user_id;

        -- Trazabilidad de transición de estado
        IF NEW.status <> OLD.status THEN
            NEW.status_changed_at := NOW();
            NEW.status_changed_by := v_user_id;
            
            -- Calcular SLAs específicos por transición
            IF NEW.status = 'NUEVO' THEN
                NEW.sla_response_due_at := add_business_hours(NOW(), 24);
            ELSIF NEW.status = 'DIAGNOSTICO' THEN
                NEW.sla_diagnostic_due_at := add_business_hours(NOW(), 48);
            ELSIF NEW.status = 'COTIZACION' THEN
                NEW.sla_quote_due_at := add_business_hours(NOW(), 72);
            END IF;
        END IF;

        -- Recalcular SLA de cierre si cambia prioridad
        IF NEW.priority <> OLD.priority AND NEW.status NOT IN ('CERRADO', 'CANCELADO') THEN
            IF NEW.priority = 'LOW' THEN
                NEW.sla_close_due_at := add_business_hours(NEW.created_at, 240);
            ELSIF NEW.priority = 'MEDIUM' THEN
                NEW.sla_close_due_at := add_business_hours(NEW.created_at, 120);
            ELSIF NEW.priority = 'HIGH' THEN
                NEW.sla_close_due_at := add_business_hours(NEW.created_at, 72);
            ELSIF NEW.priority = 'CRITICAL' THEN
                NEW.sla_close_due_at := add_business_hours(NEW.created_at, 48);
            END IF;
        END IF;

        -- Trazabilidad de reasignación
        IF NEW.sales_user_id IS DISTINCT FROM OLD.sales_user_id OR NEW.engineering_user_id IS DISTINCT FROM OLD.engineering_user_id THEN
            NEW.assigned_by := v_user_id;
        END IF;

        -- Trazabilidad de soft delete
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            NEW.deleted_by := v_user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_requirement_traceability
BEFORE INSERT OR UPDATE ON requirements
FOR EACH ROW
EXECUTE FUNCTION handle_requirement_traceability();

-- 10. Trigger de Validación de Transición de Estados
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

CREATE TRIGGER trg_validate_requirement_state
BEFORE UPDATE OF status ON requirements
FOR EACH ROW
EXECUTE FUNCTION validate_requirement_state_transitions();

-- 11. Trigger de Validación de Roles y Permisos en Transiciones
CREATE OR REPLACE FUNCTION enforce_requirement_permissions()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Validar permiso de Creación (INSERT)
    IF TG_OP = 'INSERT' THEN
        IF is_platform_super_admin() THEN
            RETURN NEW;
        END IF;
        
        IF NOT (current_user_has_role('EJECUTIVO_COMERCIAL') OR current_user_has_role('DIRECTOR_COMERCIAL') OR current_user_has_role('TECNICO_CAMPO')) THEN
            RAISE EXCEPTION 'Permiso Denegado: Su rol no está autorizado para crear requerimientos comerciales.';
        END IF;
        RETURN NEW;
    END IF;

    -- 2. Validar cambios de estado (UPDATE)
    IF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
        IF is_platform_super_admin() THEN
            RETURN NEW;
        END IF;

        -- Cancelación global
        IF NEW.status = 'CANCELADO' THEN
            IF NOT (current_user_has_role('EJECUTIVO_COMERCIAL') OR current_user_has_role('DIRECTOR_COMERCIAL') OR current_user_has_role('GERENTE_GENERAL')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Comerciales o Gerentes pueden cancelar un requerimiento.';
            END IF;
            RETURN NEW;
        END IF;

        -- Transiciones específicas
        IF OLD.status = 'BORRADOR' AND NEW.status = 'NUEVO' THEN
            IF NOT (current_user_has_role('EJECUTIVO_COMERCIAL') OR current_user_has_role('DIRECTOR_COMERCIAL') OR current_user_has_role('TECNICO_CAMPO')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Comerciales o Técnicos pueden registrar el requerimiento.';
            END IF;

        ELSIF OLD.status = 'NUEVO' AND NEW.status = 'EN_REVISION' THEN
            IF NOT (current_user_has_role('EJECUTIVO_COMERCIAL') OR current_user_has_role('DIRECTOR_COMERCIAL') OR current_user_has_role('TECNICO_CAMPO')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Comerciales o Técnicos pueden poner el requerimiento en revisión.';
            END IF;

        ELSIF OLD.status = 'EN_REVISION' AND NEW.status = 'DIAGNOSTICO' THEN
            IF NOT (current_user_has_role('TECNICO_CAMPO') OR current_user_has_role('GERENTE_GENERAL')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Ingenieros (Técnicos) o Gerentes pueden enviar a diagnóstico.';
            END IF;

        ELSIF OLD.status = 'DIAGNOSTICO' AND NEW.status = 'COTIZACION' THEN
            IF NOT (current_user_has_role('TECNICO_CAMPO') OR current_user_has_role('EJECUTIVO_COMERCIAL') OR current_user_has_role('DIRECTOR_COMERCIAL')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Técnicos o Comerciales pueden marcar el diagnóstico como terminado.';
            END IF;

        ELSIF OLD.status = 'COTIZACION' AND NEW.status = 'APROBACION' THEN
            IF NOT (current_user_has_role('EJECUTIVO_COMERCIAL') OR current_user_has_role('DIRECTOR_COMERCIAL')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo el rol Comercial puede enviar a aprobación.';
            END IF;

        ELSIF OLD.status = 'APROBACION' AND NEW.status = 'OT_GENERADA' THEN
            IF NOT current_user_has_role('GERENTE_GENERAL') THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo la Gerencia puede aprobar y liberar la orden de trabajo.';
            END IF;

        ELSIF OLD.status = 'OT_GENERADA' AND NEW.status = 'EJECUCION' THEN
            IF NOT (current_user_has_role('DIRECTOR_OPERACIONES') OR current_user_has_role('TECNICO_CAMPO')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo personal de Operaciones o Técnicos pueden pasar el requerimiento a ejecución.';
            END IF;

        ELSIF OLD.status = 'EJECUCION' AND NEW.status = 'CERRADO' THEN
            IF NOT (current_user_has_role('DIRECTOR_OPERACIONES') OR current_user_has_role('GERENTE_GENERAL')) THEN
                RAISE EXCEPTION 'Permiso Denegado: Solo Operaciones o la Gerencia pueden cerrar formalmente el requerimiento.';
            END IF;

        ELSE
            RAISE EXCEPTION 'Transición de estado no autorizada por la matriz de roles.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_requirement_permissions
BEFORE INSERT OR UPDATE OF status ON requirements
FOR EACH ROW
EXECUTE FUNCTION enforce_requirement_permissions();

-- 12. Triggers de Emisión de Eventos de Negocio

CREATE OR REPLACE FUNCTION dispatch_requirement_events()
RETURNS TRIGGER AS $$
DECLARE
    v_payload jsonb;
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_OP = 'INSERT' THEN
        v_payload := jsonb_build_object(
            'requirement_code', NEW.requirement_code,
            'title', NEW.title,
            'client_id', NEW.client_id,
            'category', NEW.category,
            'status', NEW.status,
            'priority', NEW.priority
        );
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (NEW.tenant_id, 'REQUIREMENT_CREATED', 'REQUIREMENT', NEW.id, v_payload, v_user_id);
        
        IF NEW.sales_user_id IS NOT NULL OR NEW.engineering_user_id IS NOT NULL THEN
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'REQUIREMENT_ASSIGNED', 'REQUIREMENT', NEW.id, 
                    jsonb_build_object('old_sales_user_id', null, 'new_sales_user_id', NEW.sales_user_id,
                                       'old_engineering_user_id', null, 'new_engineering_user_id', NEW.engineering_user_id,
                                       'assigned_by', v_user_id), v_user_id);
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        -- 1. Cambios de estado
        IF NEW.status <> OLD.status THEN
            v_payload := jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'sales_user_id', NEW.sales_user_id,
                'engineering_user_id', NEW.engineering_user_id
            );
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'REQUIREMENT_STATUS_CHANGED', 'REQUIREMENT', NEW.id, v_payload, v_user_id);
            
            IF NEW.status = 'CANCELADO' THEN
                INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
                VALUES (NEW.tenant_id, 'REQUIREMENT_CANCELLED', 'REQUIREMENT', NEW.id, 
                        jsonb_build_object('requirement_code', NEW.requirement_code, 
                                           'cancel_code', NEW.cancel_code,
                                           'cancel_reason', NEW.cancel_reason, 
                                           'cancelled_at', NOW()), v_user_id);
            END IF;
        END IF;

        -- 2. Cambios de asignado
        IF NEW.sales_user_id IS DISTINCT FROM OLD.sales_user_id OR NEW.engineering_user_id IS DISTINCT FROM OLD.engineering_user_id THEN
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'REQUIREMENT_ASSIGNED', 'REQUIREMENT', NEW.id, 
                    jsonb_build_object('old_sales_user_id', OLD.sales_user_id, 'new_sales_user_id', NEW.sales_user_id,
                                       'old_engineering_user_id', OLD.engineering_user_id, 'new_engineering_user_id', NEW.engineering_user_id,
                                       'assigned_by', v_user_id), v_user_id);
        END IF;

        -- 3. Modificaciones generales
        DECLARE
            v_changes jsonb := '{}'::jsonb;
        BEGIN
            IF NEW.title <> OLD.title THEN v_changes := v_changes || jsonb_build_object('title', jsonb_build_object('old', OLD.title, 'new', NEW.title)); END IF;
            IF NEW.estimated_value IS DISTINCT FROM OLD.estimated_value THEN v_changes := v_changes || jsonb_build_object('estimated_value', jsonb_build_object('old', OLD.estimated_value, 'new', NEW.estimated_value)); END IF;
            IF NEW.priority <> OLD.priority THEN v_changes := v_changes || jsonb_build_object('priority', jsonb_build_object('old', OLD.priority, 'new', NEW.priority)); END IF;

            IF v_changes <> '{}'::jsonb THEN
                INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
                VALUES (NEW.tenant_id, 'REQUIREMENT_UPDATED', 'REQUIREMENT', NEW.id, jsonb_build_object('changes', v_changes), v_user_id);
            END IF;
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_requirement_events
AFTER INSERT OR UPDATE ON requirements
FOR EACH ROW
EXECUTE FUNCTION dispatch_requirement_events();

CREATE OR REPLACE FUNCTION dispatch_document_events()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_OP = 'INSERT' THEN
        IF NEW.version = 1 THEN
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'DOCUMENT_UPLOADED', NEW.entity_type, NEW.entity_id, 
                    jsonb_build_object('document_code', NEW.document_code, 'document_type', NEW.document_type, 'uploaded_by', v_user_id), v_user_id);
        ELSE
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'DOCUMENT_VERSION_CREATED', NEW.entity_type, NEW.entity_id, 
                    jsonb_build_object('document_code', NEW.document_code, 'new_version', NEW.version, 'previous_version_obsoleted', NEW.version - 1, 'uploaded_by', v_user_id), v_user_id);
        END IF;

    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'DOCUMENT_DELETED', NEW.entity_type, NEW.entity_id, 
                    jsonb_build_object('document_code', NEW.document_code, 'delete_reason', NEW.delete_reason, 'deleted_by', v_user_id), v_user_id);
        ELSIF NEW.status <> OLD.status THEN
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'DOCUMENT_UPDATED', NEW.entity_type, NEW.entity_id, 
                    jsonb_build_object('document_code', NEW.document_code, 'old_status', OLD.status, 'new_status', NEW.status), v_user_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_document_events
AFTER INSERT OR UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION dispatch_document_events();

-- 13. Bloqueo de Eliminación Física (Soft Delete Requerido)

CREATE OR REPLACE FUNCTION block_physical_requirement_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los requerimientos en la plataforma son inmutables y audibles, utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_physical_requirement_delete
BEFORE DELETE ON requirements
FOR EACH ROW
EXECUTE FUNCTION block_physical_requirement_delete();

CREATE OR REPLACE FUNCTION block_physical_document_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los documentos en la plataforma son inmutables y audibles, utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_physical_document_delete
BEFORE DELETE ON documents
FOR EACH ROW
EXECUTE FUNCTION block_physical_document_delete();

-- 14. Integración con el Motor de Auditoría Técnica General (Fase 1)
CREATE TRIGGER audit_requirements AFTER INSERT OR UPDATE OR DELETE ON requirements FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_documents AFTER INSERT OR UPDATE OR DELETE ON documents FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 15. Políticas RLS (Row Level Security)

-- 15.1 Requerimientos
ALTER TABLE requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY requirements_super_admin ON requirements
    FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY requirements_select_tenant ON requirements FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);

CREATE POLICY requirements_insert_tenant ON requirements FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY requirements_update_tenant ON requirements FOR UPDATE TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND deleted_at IS NULL
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- 15.2 Documentos
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY documents_super_admin ON documents
    FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY documents_select_tenant ON documents FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);

CREATE POLICY documents_insert_tenant ON documents FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY documents_update_tenant ON documents FOR UPDATE TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND deleted_at IS NULL
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);
