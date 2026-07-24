-- Cierra 3 gaps que quedaron en el código local (supabase/migrations/
-- 20260720230000_dunning_check.sql, 20260720240000_job_status_facturada.sql,
-- 20260720250000_finance_settings_defaults.sql) pero NUNCA se aplicaron
-- contra la BD real, pese a que las 3 quedaron marcadas como si ya
-- estuvieran cubiertas.
--
-- El archivo local job_status_facturada.sql está desactualizado respecto
-- a la función real en producción — la versión real valida la nota de
-- entrega contra `documents`/`document_type='DELIVERY_NOTE'`, no contra
-- `job_documents`/`doc_type='ENTREGA'`. Esta migración parte de la
-- versión REAL (confirmada por pg_get_functiondef) y solo agrega lo que
-- falta para FACTURADA.
--
-- finance_settings_defaults.sql asumía tenant_settings.created_by (no
-- existe, la tabla real solo tiene updated_by), config_value como texto
-- plano (la columna real es jsonb), y module='finance' (no es un valor
-- válido de tenant_settings_module_check — el CHECK real solo permite
-- EMPRESA/LOCALIZACION/IDENTIDAD/DOCUMENTOS/ERP/INTEGRACIONES/TELEFONIA).
-- Se corrige a module='ERP' acá Y en getTaxRate()/getPaymentMethods()
-- (src/erp/actions/core.ts), que hasta ahora consultaban un module que
-- nunca pudo existir.

-- 1. Gap E-006: estado VENCIDA nunca se auto-asigna (dunning check).
CREATE OR REPLACE FUNCTION run_dunning_check(p_tenant_id uuid DEFAULT NULL)
RETURNS TABLE(
    affected_count bigint,
    total_amount decimal(18,2)
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_tenant_id uuid;
    v_count bigint := 0;
    v_total decimal(18,2) := 0;
BEGIN
    FOR v_tenant_id IN
        SELECT id FROM tenants
        WHERE (p_tenant_id IS NULL OR id = p_tenant_id)
    LOOP
        WITH overdue AS (
            UPDATE invoices
            SET status = 'VENCIDA',
                updated_at = NOW()
            WHERE tenant_id = v_tenant_id
              AND status IN ('EMITIDA', 'PARCIALMENTE_PAGADA')
              AND due_date < CURRENT_DATE
              AND deleted_at IS NULL
            RETURNING total_amount
        )
        SELECT COUNT(*), COALESCE(SUM(total_amount), 0) INTO v_count, v_total
        FROM overdue;

        affected_count := v_count;
        total_amount := v_total;
        RETURN NEXT;
    END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION run_dunning_check(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION run_dunning_check(uuid) TO service_role;

-- 2. Agregar FACTURADA al CHECK de jobs.status.
ALTER TABLE public.jobs DROP CONSTRAINT jobs_status_check;
ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check
  CHECK (((status)::text = ANY ((ARRAY[
    'PENDIENTE'::character varying, 'PROGRAMADO'::character varying,
    'EN_EJECUCION'::character varying, 'SUSPENDIDO'::character varying,
    'FINALIZADO'::character varying, 'ENTREGADO'::character varying,
    'FACTURADA'::character varying, 'CERRADO'::character varying,
    'CANCELADO'::character varying
  ])::text[])));

-- 3. validate_job_state_transitions(): partir de la versión REAL en
-- producción y solo agregar ENTREGADO→FACTURADA→CERRADO.
CREATE OR REPLACE FUNCTION public.validate_job_state_transitions()
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

    ELSIF NEW.status = 'FACTURADA' THEN
        -- Requiere que la OT esté en ENTREGADO
        IF OLD.status <> 'ENTREGADO' THEN
            RAISE EXCEPTION 'Solo se puede facturar un trabajo en estado ENTREGADO.';
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
$$ LANGUAGE plpgsql;

-- 4. dispatch_job_events(): agregar JOB_INVOICED para FACTURADA. Se parte
-- de la versión REAL (nombres de evento JOB_ACTIVITY_* vigentes).
CREATE OR REPLACE FUNCTION public.dispatch_job_events()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_event_code varchar(100);
    v_payload jsonb;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_TABLE_NAME = 'jobs' THEN
        IF TG_OP = 'INSERT' THEN
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
$$ LANGUAGE plpgsql;

-- 5. Seed de configuración financiera por defecto (tax_rate / payment_methods)
-- para tenants activos que no la tengan aún, bajo module='ERP' (único
-- valor válido disponible para esto en tenant_settings_module_check).
INSERT INTO tenant_settings (tenant_id, module, config_key, config_value, is_encrypted, updated_by)
SELECT
  t.id,
  'ERP',
  'tax_rate',
  to_jsonb('0.19'::text),
  false,
  (SELECT id FROM users WHERE tenant_id = t.id LIMIT 1)
FROM tenants t
WHERE t.status = 'Activo'
  AND NOT EXISTS (
    SELECT 1 FROM tenant_settings ts
    WHERE ts.tenant_id = t.id
      AND ts.module = 'ERP'
      AND ts.config_key = 'tax_rate'
      AND ts.deleted_at IS NULL
  );

INSERT INTO tenant_settings (tenant_id, module, config_key, config_value, is_encrypted, updated_by)
SELECT
  t.id,
  'ERP',
  'payment_methods',
  to_jsonb('Transferencia,Efectivo,Cheque,Tarjeta,PSE,Otro'::text),
  false,
  (SELECT id FROM users WHERE tenant_id = t.id LIMIT 1)
FROM tenants t
WHERE t.status = 'Activo'
  AND NOT EXISTS (
    SELECT 1 FROM tenant_settings ts
    WHERE ts.tenant_id = t.id
      AND ts.module = 'ERP'
      AND ts.config_key = 'payment_methods'
      AND ts.deleted_at IS NULL
  );
