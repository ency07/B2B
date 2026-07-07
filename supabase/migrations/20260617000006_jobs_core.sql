-- MIGRACIÓN FASE 6: TRABAJOS Y ACTIVIDADES (ORDEN DE TRABAJO)
-- Archivo: supabase/migrations/20260617000006_jobs_core.sql

-- 1. Crear Tabla de Trabajos (jobs)
CREATE TABLE jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    job_code varchar(50) NOT NULL,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE RESTRICT,
    quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
    site_id uuid NOT NULL REFERENCES sites(id) ON DELETE RESTRICT,
    area_id uuid NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
    title varchar(250) NOT NULL,
    description text,
    assigned_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    
    -- Planificación y Tiempos
    planned_start_date timestamp,
    planned_end_date timestamp,
    actual_start_date timestamp,
    actual_end_date timestamp,
    estimated_hours numeric(10,2),
    actual_hours numeric(10,2),
    
    priority varchar(50) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status varchar(50) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN (
        'PENDIENTE', 'PROGRAMADO', 'EN_EJECUCION', 'SUSPENDIDO', 'FINALIZADO', 'ENTREGADO', 'CERRADO', 'CANCELADO'
    )),

    -- Motivos de Cancelación
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

    CONSTRAINT unique_tenant_job_code UNIQUE (tenant_id, job_code),
    CONSTRAINT chk_job_planned_dates CHECK (planned_end_date IS NULL OR planned_start_date IS NULL OR planned_end_date >= planned_start_date),
    CONSTRAINT chk_job_actual_dates CHECK (actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date)
);

-- 2. Crear Tabla de Actividades de Trabajo (job_activities)
CREATE TABLE job_activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    job_id uuid NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    activity_code varchar(100) NOT NULL,
    title varchar(250) NOT NULL,
    description text,
    assigned_user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Planificación y Tiempos (Obligatorios en actividades)
    planned_start_date timestamp NOT NULL,
    planned_end_date timestamp NOT NULL,
    actual_start_date timestamp,
    actual_end_date timestamp,
    estimated_hours numeric(10,2),
    actual_hours numeric(10,2),
    
    status varchar(50) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN (
        'PENDIENTE', 'PROGRAMADA', 'EN_EJECUCION', 'SUSPENDIDA', 'COMPLETADA', 'CANCELADA'
    )),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_activity_code UNIQUE (tenant_id, activity_code),
    CONSTRAINT chk_activity_planned_dates CHECK (planned_end_date >= planned_start_date),
    CONSTRAINT chk_activity_actual_dates CHECK (actual_end_date IS NULL OR actual_start_date IS NULL OR actual_end_date >= actual_start_date)
);

-- 3. Índices de Rendimiento
CREATE INDEX idx_jobs_tenant ON jobs(tenant_id);
CREATE INDEX idx_jobs_client ON jobs(client_id);
CREATE INDEX idx_jobs_requirement ON jobs(requirement_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_job_activities_job ON job_activities(job_id);

-- 4. Registro de tipo de secuencia JOB en tenant_sequences (por si acaso no existe)
-- La secuencia se maneja dinámicamente, pero garantizamos que se use.

-- 5. Trigger: Autogeneración de Códigos Correlativos
CREATE OR REPLACE FUNCTION handle_job_sequences()
RETURNS TRIGGER AS $$
DECLARE
    v_job_code varchar(50);
    v_max_suffix integer;
BEGIN
    IF TG_TABLE_NAME = 'jobs' THEN
        IF NEW.job_code IS NULL OR NEW.job_code = '' THEN
            NEW.job_code := 'JOB-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'JOB')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'job_activities' THEN
        IF NEW.activity_code IS NULL OR NEW.activity_code = '' THEN
            -- Obtener código del Job padre
            SELECT job_code INTO v_job_code FROM jobs WHERE id = NEW.job_id;
            
            -- Obtener sufijo correlativo máximo
            SELECT COALESCE(MAX(SUBSTRING(activity_code FROM '[0-9]+$')::integer), 0) INTO v_max_suffix
            FROM job_activities
            WHERE job_id = NEW.job_id;
            
            NEW.activity_code := v_job_code || '-' || LPAD((v_max_suffix + 1)::text, 2, '0');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_job_code
BEFORE INSERT ON jobs
FOR EACH ROW
EXECUTE FUNCTION handle_job_sequences();

CREATE TRIGGER trg_handle_activity_code
BEFORE INSERT ON job_activities
FOR EACH ROW
EXECUTE FUNCTION handle_job_sequences();

-- 6. Trigger: Restricción de Fechas Planificadas de Actividades
CREATE OR REPLACE FUNCTION validate_activity_dates()
RETURNS TRIGGER AS $$
DECLARE
    v_job_start timestamp;
    v_job_end timestamp;
BEGIN
    SELECT planned_start_date, planned_end_date INTO v_job_start, v_job_end
    FROM jobs WHERE id = NEW.job_id;

    IF v_job_start IS NOT NULL AND NEW.planned_start_date < v_job_start THEN
        RAISE EXCEPTION 'La fecha de inicio de la actividad (%) no puede estar fuera del rango del Trabajo (%).', NEW.planned_start_date, v_job_start;
    END IF;

    IF v_job_end IS NOT NULL AND NEW.planned_end_date > v_job_end THEN
        RAISE EXCEPTION 'La fecha de fin de la actividad (%) no puede estar fuera del rango del Trabajo (%).', NEW.planned_end_date, v_job_end;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_activity_dates
BEFORE INSERT OR UPDATE OF planned_start_date, planned_end_date ON job_activities
FOR EACH ROW
EXECUTE FUNCTION validate_activity_dates();

-- Trigger & Función: Validación de fechas del Trabajo al actualizar
CREATE OR REPLACE FUNCTION validate_job_dates_update()
RETURNS TRIGGER AS $$
DECLARE
    v_out_of_range_activity varchar(100);
BEGIN
    IF (NEW.planned_start_date IS DISTINCT FROM OLD.planned_start_date) OR
       (NEW.planned_end_date IS DISTINCT FROM OLD.planned_end_date) THEN
       
        SELECT activity_code INTO v_out_of_range_activity
        FROM job_activities
        WHERE job_id = NEW.id
          AND deleted_at IS NULL
          AND (
              (NEW.planned_start_date IS NOT NULL AND planned_start_date < NEW.planned_start_date) OR
              (NEW.planned_end_date IS NOT NULL AND planned_end_date > NEW.planned_end_date)
          )
        LIMIT 1;
        
        IF v_out_of_range_activity IS NOT NULL THEN
            RAISE EXCEPTION 'No se pueden cambiar las fechas del Trabajo porque la actividad % quedaría fuera del nuevo rango planificado.', v_out_of_range_activity;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_job_dates_update
BEFORE UPDATE OF planned_start_date, planned_end_date ON jobs
FOR EACH ROW
EXECUTE FUNCTION validate_job_dates_update();

-- 7. Trigger: Permisos de Creación y Modificación de Trabajos
CREATE OR REPLACE FUNCTION enforce_job_permissions()
RETURNS TRIGGER AS $$
BEGIN
    IF is_platform_super_admin() THEN
        RETURN NEW;
    END IF;

    -- Creación manual restringida a roles específicos
    IF TG_OP = 'INSERT' THEN
        IF pg_trigger_depth() = 0 THEN
            IF NOT (
                current_user_has_role('GERENTE') OR 
                current_user_has_role('GERENTE_GENERAL') OR 
                current_user_has_role('JEFE_PROYECTOS') OR 
                current_user_has_role('COORDINADOR_OPERACIONES')
            ) THEN
                RAISE EXCEPTION 'Permiso Denegado: Su rol no está autorizado para crear trabajos de manera manual.';
            END IF;
        END IF;
    END IF;

    -- Job CERRADO es inmutable
    IF TG_OP = 'UPDATE' AND OLD.status = 'CERRADO' THEN
        RAISE EXCEPTION 'No se puede modificar un trabajo con estado final CERRADO.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_job_permissions
BEFORE INSERT OR UPDATE ON jobs
FOR EACH ROW
EXECUTE FUNCTION enforce_job_permissions();

-- 8. Trigger: Validación de Transición de Estados del Trabajo
CREATE OR REPLACE FUNCTION validate_job_state_transitions()
RETURNS TRIGGER AS $$
DECLARE
    v_has_incomplete boolean;
    v_has_delivery_note boolean;
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF NEW.status = OLD.status THEN
        RETURN NEW;
    END IF;

    -- Bloquear cambios en CERRADO (duplicado de seguridad)
    IF OLD.status = 'CERRADO' THEN
        RAISE EXCEPTION 'No se puede reabrir o editar un trabajo con estado final CERRADO.';
    END IF;

    -- Regla: JOB ENTREGADO solo puede pasar a CERRADO
    IF OLD.status = 'ENTREGADO' AND NEW.status <> 'CERRADO' THEN
        RAISE EXCEPTION 'Un trabajo ENTREGADO solo puede pasar a CERRADO.';
    END IF;

    -- Regla: JOB FINALIZADO no puede regresar a PROGRAMADO o PENDIENTE
    IF OLD.status = 'FINALIZADO' AND NEW.status IN ('PENDIENTE', 'PROGRAMADO') THEN
        RAISE EXCEPTION 'Un trabajo FINALIZADO no puede regresar a PENDIENTE o PROGRAMADO.';
    END IF;

    -- Transiciones específicas
    IF NEW.status = 'EN_REVISION' THEN
        -- No aplica a Jobs, pero controlamos en check
    ELSIF NEW.status = 'EN_EJECUCION' THEN
        -- Inicio real obligatorio para pasar a EN_EJECUCION
        IF NEW.actual_start_date IS NULL THEN
            RAISE EXCEPTION 'actual_start_date es obligatorio para pasar a EN_EJECUCION.';
        END IF;

    ELSIF NEW.status = 'FINALIZADO' THEN
        -- Todas las actividades no canceladas deben estar completadas (no puede haber pendientes o en proceso)
        SELECT EXISTS (
            SELECT 1 FROM job_activities 
            WHERE job_id = NEW.id 
              AND status NOT IN ('COMPLETADA', 'CANCELADA') 
              AND deleted_at IS NULL
        ) INTO v_has_incomplete;
        
        IF v_has_incomplete THEN
            RAISE EXCEPTION 'No se puede finalizar el trabajo porque existen actividades pendientes o en proceso.';
        END IF;

    ELSIF NEW.status = 'ENTREGADO' THEN
        -- Validación de Acta de Entrega cargada en documentos del Job
        SELECT EXISTS (
            SELECT 1 FROM documents 
            WHERE entity_type = 'JOB' 
              AND entity_id = NEW.id 
              AND document_type = 'DELIVERY_NOTE' 
              AND status = 'PUBLICADO'
              AND deleted_at IS NULL
        ) INTO v_has_delivery_note;

        IF NOT v_has_delivery_note THEN
            RAISE EXCEPTION 'No se puede marcar el trabajo como ENTREGADO sin registrar el Acta de Entrega (documento DELIVERY_NOTE en estado PUBLICADO) asociado al Job.';
        END IF;

    ELSIF NEW.status = 'CANCELADO' THEN
        -- Motivo de cancelación obligatorio
        IF NEW.cancel_reason IS NULL OR length(trim(NEW.cancel_reason)) < 10 THEN
            RAISE EXCEPTION 'Para cancelar un trabajo se debe ingresar un motivo detallado (cancel_reason, mínimo 10 caracteres).';
        END IF;
        
        NEW.cancelled_by := v_user_id;
        NEW.cancelled_at := NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_validate_job_state
BEFORE UPDATE OF status ON jobs
FOR EACH ROW
EXECUTE FUNCTION validate_job_state_transitions();

-- 9. Trigger: Propagación de Estados Actividad -> Trabajo y Automatizaciones
CREATE OR REPLACE FUNCTION handle_activity_status_propagation()
RETURNS TRIGGER AS $$
DECLARE
    v_total integer;
    v_completed integer;
BEGIN
    -- 1. Si actividad pasa a EN_EJECUCION, el Job pasa a EN_EJECUCION si estaba en PENDIENTE o PROGRAMADO
    IF NEW.status = 'EN_EJECUCION' AND (OLD.status IS NULL OR OLD.status <> 'EN_EJECUCION') THEN
        UPDATE jobs
        SET status = 'EN_EJECUCION',
            actual_start_date = COALESCE(actual_start_date, NOW()),
            updated_at = NOW()
        WHERE id = NEW.job_id
          AND status IN ('PENDIENTE', 'PROGRAMADO');
    END IF;

    -- 2. Si todas las actividades se completan, el Job pasa a FINALIZADO
    IF NEW.status = 'COMPLETADA' AND (OLD.status IS NULL OR OLD.status <> 'COMPLETADA') THEN
        -- Contar actividades no canceladas
        SELECT COUNT(*), COUNT(CASE WHEN status = 'COMPLETADA' THEN 1 END)
        INTO v_total, v_completed
        FROM job_activities
        WHERE job_id = NEW.job_id 
          AND status <> 'CANCELADA'
          AND deleted_at IS NULL;

        IF v_total > 0 AND v_total = v_completed THEN
            UPDATE jobs
            SET status = 'FINALIZADO',
                actual_end_date = COALESCE(actual_end_date, NOW()),
                updated_at = NOW()
            WHERE id = NEW.job_id
              AND status IN ('PENDIENTE', 'PROGRAMADO', 'EN_EJECUCION', 'SUSPENDIDO');
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_activity_status_propagation
AFTER INSERT OR UPDATE OF status ON job_activities
FOR EACH ROW
EXECUTE FUNCTION handle_activity_status_propagation();

-- 10. Trigger: Propagación de Estado Job Cancelado -> Actividades
CREATE OR REPLACE FUNCTION handle_job_cancellation_propagation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'CANCELADO' AND OLD.status <> 'CANCELADO' THEN
        UPDATE job_activities
        SET status = 'CANCELADA',
            updated_at = NOW()
        WHERE job_id = NEW.id
          AND status NOT IN ('COMPLETADA', 'CANCELADA')
          AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_job_cancellation_propagation
AFTER UPDATE OF status ON jobs
FOR EACH ROW
EXECUTE FUNCTION handle_job_cancellation_propagation();

-- 11. Trigger: Creación Automática de Trabajo al generar la OT
CREATE OR REPLACE FUNCTION create_job_on_ot_generation()
RETURNS TRIGGER AS $$
DECLARE
    v_quote record;
    v_site_id uuid;
    v_area_id uuid;
    v_job_id uuid;
BEGIN
    IF NEW.status = 'OT_GENERADA' AND OLD.status <> 'OT_GENERADA' THEN
        -- Obtener cotización aprobada asociada al requerimiento
        SELECT id INTO v_quote
        FROM quotes
        WHERE requirement_id = NEW.id
          AND status = 'APROBADA'
          AND deleted_at IS NULL
        LIMIT 1;

        -- Obtener sedes y áreas del ingeniero asignado
        IF NEW.engineering_user_id IS NOT NULL THEN
            SELECT site_id, area_id INTO v_site_id, v_area_id
            FROM users
            WHERE id = NEW.engineering_user_id;
        END IF;

        -- Fallbacks si no están definidos en el usuario
        IF v_site_id IS NULL THEN
            SELECT id INTO v_site_id FROM sites WHERE tenant_id = NEW.tenant_id AND status = 'Activo' LIMIT 1;
        END IF;

        IF v_area_id IS NULL THEN
            SELECT id INTO v_area_id FROM areas WHERE tenant_id = NEW.tenant_id AND status = 'Activo' LIMIT 1;
        END IF;

        -- Crear Trabajo PENDIENTE
        INSERT INTO jobs (
            tenant_id,
            job_code,
            client_id,
            requirement_id,
            quote_id,
            site_id,
            area_id,
            title,
            description,
            assigned_user_id,
            priority,
            status,
            created_by
        ) VALUES (
            NEW.tenant_id,
            'JOB-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'JOB')::text, 6, '0'),
            NEW.client_id,
            NEW.id,
            v_quote.id,
            v_site_id,
            v_area_id,
            NEW.title,
            NEW.description,
            NEW.engineering_user_id,
            CASE 
                WHEN NEW.priority = 'CRITICAL' THEN 'CRITICAL'
                WHEN NEW.priority = 'HIGH' THEN 'HIGH'
                WHEN NEW.priority = 'MEDIUM' THEN 'MEDIUM'
                ELSE 'LOW'
            END,
            'PENDIENTE',
            get_current_user_id()
        ) RETURNING id INTO v_job_id;

        -- Evento de negocio
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (
            NEW.tenant_id,
            'JOB_CREATED',
            'JOB',
            v_job_id,
            jsonb_build_object(
                'requirement_code', NEW.requirement_code,
                'client_id', NEW.client_id,
                'assigned_user_id', NEW.engineering_user_id
            ),
            get_current_user_id()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_create_job_on_ot
AFTER UPDATE OF status ON requirements
FOR EACH ROW
EXECUTE FUNCTION create_job_on_ot_generation();

-- 12. Trigger: Emisión de Eventos de Negocio de Trabajos y Actividades
CREATE OR REPLACE FUNCTION dispatch_job_events()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_event_code varchar(100);
    v_payload jsonb;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_TABLE_NAME = 'jobs' THEN
        IF TG_OP = 'INSERT' THEN
            -- Creación manual (la automática ya emite evento arriba)
            IF pg_trigger_depth() = 0 THEN
                v_payload := jsonb_build_object('job_code', NEW.job_code, 'title', NEW.title, 'status', NEW.status);
                INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
                VALUES (NEW.tenant_id, 'JOB_CREATED', 'JOB', NEW.id, v_payload, v_user_id);
            END IF;
        ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
            IF NEW.status = 'PROGRAMADO' THEN v_event_code := 'JOB_SCHEDULED';
            ELSIF NEW.status = 'EN_EJECUCION' THEN v_event_code := 'JOB_STARTED';
            ELSIF NEW.status = 'SUSPENDIDO' THEN v_event_code := 'JOB_SUSPENDED';
            ELSIF NEW.status = 'FINALIZADO' THEN v_event_code := 'JOB_COMPLETED';
            ELSIF NEW.status = 'ENTREGADO' THEN v_event_code := 'JOB_DELIVERED';
            ELSIF NEW.status = 'CERRADO' THEN v_event_code := 'JOB_CLOSED';
            ELSIF NEW.status = 'CANCELADO' THEN v_event_code := 'JOB_CANCELLED';
            ELSE v_event_code := 'JOB_STATUS_CHANGED';
            END IF;

            v_payload := jsonb_build_object('job_code', NEW.job_code, 'old_status', OLD.status, 'new_status', NEW.status);
            IF NEW.status = 'CANCELADO' THEN
                v_payload := v_payload || jsonb_build_object('cancel_reason', NEW.cancel_reason);
            END IF;

            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, v_event_code, 'JOB', NEW.id, v_payload, v_user_id);
        END IF;

    ELSIF TG_TABLE_NAME = 'job_activities' THEN
        IF TG_OP = 'INSERT' THEN
            v_payload := jsonb_build_object('activity_code', NEW.activity_code, 'title', NEW.title, 'status', NEW.status);
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'JOB_ACTIVITY_CREATED', 'JOB_ACTIVITY', NEW.id, v_payload, v_user_id);
        ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
            IF NEW.status = 'EN_EJECUCION' THEN v_event_code := 'JOB_ACTIVITY_STARTED';
            ELSIF NEW.status = 'COMPLETADA' THEN v_event_code := 'JOB_ACTIVITY_COMPLETED';
            ELSIF NEW.status = 'CANCELADA' THEN v_event_code := 'JOB_ACTIVITY_CANCELLED';
            ELSE v_event_code := 'JOB_ACTIVITY_STATUS_CHANGED';
            END IF;

            v_payload := jsonb_build_object('activity_code', NEW.activity_code, 'old_status', OLD.status, 'new_status', NEW.status);
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, v_event_code, 'JOB_ACTIVITY', NEW.id, v_payload, v_user_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_job_event AFTER INSERT OR UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION dispatch_job_events();
CREATE TRIGGER trg_dispatch_activity_event AFTER INSERT OR UPDATE ON job_activities FOR EACH ROW EXECUTE FUNCTION dispatch_job_events();

-- 13. Trazabilidad e Inmutabilidad de Deletes (Soft Delete Obligatorio)
CREATE OR REPLACE FUNCTION block_physical_job_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los Trabajos y Actividades son inmutables, utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_job_delete BEFORE DELETE ON jobs FOR EACH ROW EXECUTE FUNCTION block_physical_job_delete();
CREATE TRIGGER trg_block_activity_delete BEFORE DELETE ON job_activities FOR EACH ROW EXECUTE FUNCTION block_physical_job_delete();

CREATE TRIGGER trg_handle_job_traceability BEFORE INSERT OR UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_handle_activity_traceability BEFORE INSERT OR UPDATE ON job_activities FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- 14. Integración con Auditoría General (Fase 1)
CREATE TRIGGER audit_jobs AFTER INSERT OR UPDATE OR DELETE ON jobs FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_job_activities AFTER INSERT OR UPDATE OR DELETE ON job_activities FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- 15. Políticas RLS (Row Level Security)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY jobs_super_admin ON jobs FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY jobs_select_tenant ON jobs FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY jobs_write_tenant ON jobs FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY activities_super_admin ON job_activities FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY activities_select_tenant ON job_activities FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY activities_write_tenant ON job_activities FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);
