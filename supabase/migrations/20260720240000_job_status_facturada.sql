-- OBSOLETO — este archivo NUNCA se aplicó contra la BD real (confirmado
-- 2026-07-24) y quedó desactualizado respecto a la función real en
-- producción (valida la nota de entrega contra job_documents/doc_type=
-- 'ENTREGA', pero la tabla real es documents/document_type='DELIVERY_NOTE'
-- — aplicar este archivo tal cual habría revertido esa validación). No
-- ejecutar. Ver 20260724180000_dunning_check_and_facturada_status.sql,
-- que parte de la versión real y sí está aplicada.
--
-- Migration: Add FACTURADA status to job lifecycle
-- Allows: ENTREGADO → FACTURADA → CERRADO
-- Also allows: ENTREGADO → CERRADO (unchanged)

-- 1. Update validate_job_state_transitions to allow ENTREGADO → FACTURADA
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

    -- Regla: JOB ENTREGADO solo puede pasar a FACTURADA o CERRADO
    IF OLD.status = 'ENTREGADO' AND NEW.status NOT IN ('FACTURADA', 'CERRADO') THEN
        RAISE EXCEPTION 'Un trabajo ENTREGADO solo puede pasar a FACTURADA o CERRADO.';
    END IF;

    -- Regla: JOB FACTURADA solo puede pasar a CERRADO
    IF OLD.status = 'FACTURADA' AND NEW.status <> 'CERRADO' THEN
        RAISE EXCEPTION 'Un trabajo FACTURADA solo puede pasar a CERRADO.';
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
        -- Requiere nota de entrega adjunta
        SELECT EXISTS (
            SELECT 1 FROM job_documents 
            WHERE job_id = NEW.id 
              AND doc_type = 'ENTREGA'
              AND deleted_at IS NULL
        ) INTO v_has_delivery_note;

        IF NOT v_has_delivery_note THEN
            RAISE EXCEPTION 'No se puede marcar como ENTREGADO sin una nota de entrega adjunta.';
        END IF;

    ELSIF NEW.status = 'FACTURADA' THEN
        -- Requiere que la OT este en ENTREGADO
        IF OLD.status <> 'ENTREGADO' THEN
            RAISE EXCEPTION 'Solo se puede facturar un trabajo en estado ENTREGADO.';
        END IF;

    ELSIF NEW.status = 'CERRADO' THEN
        -- Requiere factura asociada
        IF NOT EXISTS (
            SELECT 1 FROM invoices 
            WHERE job_id = NEW.id 
              AND tenant_id = NEW.tenant_id
              AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'No se puede cerrar un trabajo sin una factura asociada.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Update dispatch_job_events to emit JOB_INVOICED for FACTURADA
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
            ELSIF NEW.status = 'FACTURADA' THEN v_event_code := 'JOB_INVOICED';
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
            VALUES (NEW.tenant_id, 'ACTIVITY_CREATED', 'JOB_ACTIVITY', NEW.id, v_payload, v_user_id);
        ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status THEN
            IF NEW.status = 'COMPLETADA' THEN v_event_code := 'ACTIVITY_COMPLETED';
            ELSIF NEW.status = 'CANCELADA' THEN v_event_code := 'ACTIVITY_CANCELLED';
            ELSE v_event_code := 'ACTIVITY_STATUS_CHANGED';
            END IF;

            v_payload := jsonb_build_object('activity_code', NEW.activity_code, 'old_status', OLD.status, 'new_status', NEW.status);
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, v_event_code, 'JOB_ACTIVITY', NEW.id, v_payload, v_user_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Add JOB_INVOICED to EVENT_CODES (comments for documentation)
-- EVENT_CODES constant in TypeScript should include: JOB_INVOICED: 'JOB_INVOICED'
