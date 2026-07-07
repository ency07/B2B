-- MIGRACIÓN FASE 14: MARKETING Y SLA (EXTENSIÓN DE LEADS)
-- Archivo: supabase/migrations/20260617000014_marketing_core.sql

-- ==========================================
-- 1. Modificaciones a la Tabla leads
-- ==========================================
ALTER TABLE leads 
    ADD COLUMN lead_source varchar(100) CHECK (lead_source IN ('Google Ads', 'SEO', 'LinkedIn', 'WhatsApp', 'Facebook', 'Instagram', 'Email Marketing', 'Directo', 'Referido', 'Distribuidor', 'Otro')),
    ADD COLUMN owner_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN assigned_at timestamp,
    ADD COLUMN first_contact_at timestamp,
    ADD COLUMN last_contact_at timestamp,
    ADD COLUMN next_follow_up_at timestamp,
    ADD COLUMN sla_due_at timestamp,
    ADD COLUMN sla_status varchar(50) NOT NULL DEFAULT 'PENDIENTE' CHECK (sla_status IN ('PENDIENTE', 'CUMPLIDO', 'INCUMPLIDO')),
    ADD COLUMN status varchar(50) NOT NULL DEFAULT 'NUEVO' CHECK (status IN ('NUEVO', 'MQL', 'SQL', 'OPORTUNIDAD', 'CERRADO_CONVERTIDO', 'RECHAZADO'));

-- ==========================================
-- 2. Trigger: Cálculo y Evaluación de SLA
-- ==========================================
CREATE OR REPLACE FUNCTION handle_lead_sla_calculation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Calcular sla_due_at según la urgencia al insertar el lead
        IF NEW.urgency = 'alta' THEN
            NEW.sla_due_at := COALESCE(NEW.created_at, NOW()) + INTERVAL '15 minutes';
        ELSIF NEW.urgency = 'media' THEN
            NEW.sla_due_at := COALESCE(NEW.created_at, NOW()) + INTERVAL '4 hours';
        ELSE
            NEW.sla_due_at := COALESCE(NEW.created_at, NOW()) + INTERVAL '24 hours';
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Recalcular sla_due_at si cambia la urgencia y aún no se ha hecho primer contacto
        IF NEW.urgency <> OLD.urgency AND NEW.first_contact_at IS NULL THEN
            IF NEW.urgency = 'alta' THEN
                NEW.sla_due_at := COALESCE(NEW.created_at, NOW()) + INTERVAL '15 minutes';
            ELSIF NEW.urgency = 'media' THEN
                NEW.sla_due_at := COALESCE(NEW.created_at, NOW()) + INTERVAL '4 hours';
            ELSE
                NEW.sla_due_at := COALESCE(NEW.created_at, NOW()) + INTERVAL '24 hours';
            END IF;
        END IF;

        -- Evaluar SLA al registrar el primer contacto
        IF NEW.first_contact_at IS NOT NULL AND OLD.first_contact_at IS NULL THEN
            IF NEW.first_contact_at <= NEW.sla_due_at THEN
                NEW.sla_status := 'CUMPLIDO';
            ELSE
                NEW.sla_status := 'INCUMPLIDO';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_handle_lead_sla BEFORE INSERT OR UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION handle_lead_sla_calculation();

-- ==========================================
-- 3. Trigger: Registro de Incumplimiento de SLA (Eventos)
-- ==========================================
CREATE OR REPLACE FUNCTION validate_lead_sla_breach()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sla_status = 'INCUMPLIDO' AND OLD.sla_status = 'PENDIENTE' THEN
        INSERT INTO business_events (
            tenant_id,
            event_code,
            entity_type,
            entity_id,
            payload,
            created_by
        ) VALUES (
            NEW.tenant_id,
            'LEAD_SLA_BREACHED',
            'LEAD',
            NEW.id,
            jsonb_build_object(
                'lead_id', NEW.id,
                'lead_code', NEW.lead_code,
                'urgency', NEW.urgency,
                'sla_due_at', NEW.sla_due_at,
                'first_contact_at', NEW.first_contact_at,
                'breach_delay_minutes', ROUND(EXTRACT(EPOCH FROM (NEW.first_contact_at - NEW.sla_due_at)) / 60)
            ),
            NEW.updated_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_lead_sla_breach AFTER UPDATE ON leads
FOR EACH ROW EXECUTE FUNCTION validate_lead_sla_breach();
