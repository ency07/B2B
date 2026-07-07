-- MIGRACIÓN FASE 19: SISTEMA DE NOTIFICACIONES Y ALERTAS
-- Archivo: supabase/migrations/20260617000019_notifications_core.sql
--
-- REUSE_ANALYSIS_FASE19 cumplido (9 repos evaluados):
--   IN_APP      → nativo (tabla notifications)
--   EMAIL       → Resend SDK     (MIT, 5.8k stars)
--   WHATSAPP    → Twilio SDK     (MIT, 3.6k stars)  — clientes externos
--   TELEGRAM    → grammY         (MIT, 4.8k stars)  — usuarios internos (GRATIS)
--   Cola/retry  → BullMQ         (MIT, 16k stars)
--
-- DECISIONES CONGELADAS:
--   D19-01: Clientes externos    → WhatsApp
--   D19-02: Usuarios internos ERP → Telegram (90%+ ahorro vs WhatsApp)
--   D19-03: Clientes corporativos → Email
--   D19-04: Todos los usuarios   → IN_APP
--   D19-09: telegram_chat_id + telegram_username añadidos a users

-- ============================================================
-- 1. EXTENSIÓN DE TABLA users
--    Añadir campos de Telegram para routing de notificaciones
-- ============================================================
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS telegram_chat_id   varchar(100),
    ADD COLUMN IF NOT EXISTS telegram_username   varchar(100);

COMMENT ON COLUMN users.telegram_chat_id  IS 'Chat ID único de Telegram del usuario. Requerido para enviar notificaciones vía grammY Bot API (D19-02).';
COMMENT ON COLUMN users.telegram_username IS 'Username de Telegram (@handle) del usuario. Facilita vinculación manual.';

CREATE INDEX IF NOT EXISTS idx_users_telegram_chat_id ON users(telegram_chat_id) WHERE telegram_chat_id IS NOT NULL;

-- ============================================================
-- 2. TABLA: notification_templates
--    Plantillas Handlebars por canal y tipo de evento
-- ============================================================
CREATE TABLE notification_templates (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,

    -- Identificación
    template_code   varchar(50) NOT NULL,   -- NTP-000001

    -- Canal y evento al que aplica
    channel         varchar(20) NOT NULL CHECK (channel IN (
        'IN_APP',       -- Bandeja interna del ERP
        'EMAIL',        -- Email corporativo vía Resend SDK
        'WHATSAPP',     -- WhatsApp Business vía Twilio (clientes externos)
        'TELEGRAM'      -- Telegram Bot API vía grammY (usuarios internos — GRATIS)
    )),
    event_type      varchar(100) NOT NULL,  -- Ej: 'INVOICE_EMITTED', 'LEAD_SLA_BREACHED'

    -- Contenido de la plantilla (sintaxis Handlebars — reutiliza Handlebars.js de FASE 18)
    -- Ej: "Factura {{invoice_code}} emitida por {{amount}} COP"
    subject_template    text,       -- Asunto (Email) o título (IN_APP / Telegram)
    body_template       text NOT NULL,  -- Cuerpo del mensaje

    -- Versión y estado
    version     integer NOT NULL DEFAULT 1,
    active      boolean NOT NULL DEFAULT true,  -- Una sola activa por (channel, event_type)

    -- Trazabilidad y Soft Delete
    created_at  timestamp NOT NULL DEFAULT NOW(),
    created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at  timestamp,
    updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at  timestamp,
    deleted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_notif_template_code UNIQUE (tenant_id, template_code)
);

-- ============================================================
-- 3. TABLA: notifications
--    Historial completo de notificaciones (enviadas / en cola / fallidas)
-- ============================================================
CREATE TABLE notifications (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,

    -- Identificación
    notification_code   varchar(50) NOT NULL,   -- NOT-000001

    -- Canal utilizado
    channel     varchar(20) NOT NULL CHECK (channel IN (
        'IN_APP', 'EMAIL', 'WHATSAPP', 'TELEGRAM'
    )),

    -- Destinatario
    recipient_user_id   uuid REFERENCES users(id) ON DELETE SET NULL,
    recipient_contact   varchar(300),   -- Email, teléfono (+57...) o telegram_chat_id

    -- Origen: evento de negocio que la generó
    event_id    uuid,   -- Referencia a business_events (no FK estricta: puede pre-existir)
    event_type  varchar(100),   -- Snapshot del tipo de evento

    -- Plantilla usada
    template_id uuid REFERENCES notification_templates(id) ON DELETE SET NULL,

    -- Contenido renderizado (snapshot inmutable en el momento del envío)
    subject     varchar(500),
    body        text NOT NULL,

    -- Ciclo de vida
    status      varchar(30) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN (
        'PENDIENTE',    -- En cola, aún no procesada
        'ENVIANDO',     -- BullMQ procesando (Resend / Twilio / grammY / IN_APP)
        'ENTREGADA',    -- Confirmación de entrega recibida del proveedor
        'FALLIDA',      -- Falló después de todos los reintentos
        'ANULADA'       -- Anulada manualmente antes del envío
    )),

    -- Control de reintentos (BullMQ)
    retry_count     integer NOT NULL DEFAULT 0,
    max_retries     integer NOT NULL DEFAULT 3,
    next_retry_at   timestamp,

    -- Timestamps de ciclo de vida
    sent_at         timestamp,  -- Cuando se confirmó el envío exitoso
    failed_at       timestamp,  -- Cuando falló definitivamente
    read_at         timestamp,  -- Para IN_APP: cuando el usuario la leyó

    -- Confirmación del proveedor externo
    provider_message_id varchar(300),   -- ID de Resend, Twilio SID, Telegram message_id

    -- Mensaje de error (si status = 'FALLIDA')
    error_message   text,

    -- Trazabilidad y Soft Delete
    created_at  timestamp NOT NULL DEFAULT NOW(),
    created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at  timestamp,
    updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at  timestamp,
    deleted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_notification_code UNIQUE (tenant_id, notification_code)
);

-- ============================================================
-- 4. TABLA: notification_preferences
--    Preferencias por usuario: qué canales y eventos recibir
-- ============================================================
CREATE TABLE notification_preferences (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Canal al que aplica esta preferencia
    channel     varchar(20) NOT NULL CHECK (channel IN (
        'IN_APP', 'EMAIL', 'WHATSAPP', 'TELEGRAM'
    )),

    -- Tipo de evento (NULL = aplica a todos los eventos de este canal)
    event_type  varchar(100),

    -- Estado de la preferencia
    enabled     boolean NOT NULL DEFAULT true,

    -- Horario de silencio (no molestar)
    -- Ej: quiet_hours_start = '22:00', quiet_hours_end = '07:00'
    quiet_hours_start   time,
    quiet_hours_end     time,

    -- Trazabilidad (sin soft delete — preferencias se actualizan, no borran)
    created_at  timestamp NOT NULL DEFAULT NOW(),
    updated_at  timestamp,

    -- Una preferencia única por usuario + canal + event_type
    CONSTRAINT unique_user_channel_event UNIQUE (tenant_id, user_id, channel, event_type)
);

-- ============================================================
-- 5. ÍNDICES DE RENDIMIENTO
-- ============================================================
-- notification_templates
CREATE INDEX idx_notif_templates_tenant      ON notification_templates(tenant_id);
CREATE INDEX idx_notif_templates_channel     ON notification_templates(channel);
CREATE INDEX idx_notif_templates_event_type  ON notification_templates(event_type);
CREATE INDEX idx_notif_templates_active      ON notification_templates(active);
-- Índice compuesto para lookup rápido de plantilla activa
CREATE INDEX idx_notif_templates_lookup      ON notification_templates(tenant_id, channel, event_type, active);

-- notifications
CREATE INDEX idx_notifications_tenant        ON notifications(tenant_id);
CREATE INDEX idx_notifications_recipient     ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_channel       ON notifications(channel);
CREATE INDEX idx_notifications_status        ON notifications(status);
CREATE INDEX idx_notifications_event_id      ON notifications(event_id);
CREATE INDEX idx_notifications_template      ON notifications(template_id);
CREATE INDEX idx_notifications_created_at    ON notifications(created_at DESC);
-- Índice para bandeja IN_APP (usuario + no leídas)
CREATE INDEX idx_notifications_inbox         ON notifications(recipient_user_id, read_at, status)
    WHERE channel = 'IN_APP' AND deleted_at IS NULL;

-- notification_preferences
CREATE INDEX idx_notif_prefs_tenant          ON notification_preferences(tenant_id);
CREATE INDEX idx_notif_prefs_user            ON notification_preferences(user_id);
CREATE INDEX idx_notif_prefs_channel         ON notification_preferences(channel);

-- ============================================================
-- 6. TRIGGER: Autogeneración de Códigos Correlativos
-- ============================================================
CREATE OR REPLACE FUNCTION handle_notification_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'notification_templates' THEN
        IF NEW.template_code IS NULL OR NEW.template_code = '' THEN
            NEW.template_code := 'NTP-' || LPAD(
                get_next_tenant_sequence(NEW.tenant_id, 'NOTIFICATION_TEMPLATE')::text, 6, '0'
            );
        END IF;

    ELSIF TG_TABLE_NAME = 'notifications' THEN
        IF NEW.notification_code IS NULL OR NEW.notification_code = '' THEN
            NEW.notification_code := 'NOT-' || LPAD(
                get_next_tenant_sequence(NEW.tenant_id, 'NOTIFICATION')::text, 6, '0'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_notif_template_code
BEFORE INSERT ON notification_templates
FOR EACH ROW EXECUTE FUNCTION handle_notification_sequences();

CREATE TRIGGER trg_handle_notification_code
BEFORE INSERT ON notifications
FOR EACH ROW EXECUTE FUNCTION handle_notification_sequences();

-- ============================================================
-- 7. TRIGGER: Una sola plantilla activa por (tenant, channel, event_type)
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_single_active_notification_template()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.active = true THEN
        UPDATE notification_templates
        SET active     = false,
            updated_at = NOW()
        WHERE tenant_id  = NEW.tenant_id
          AND channel    = NEW.channel
          AND event_type = NEW.event_type
          AND id         <> NEW.id
          AND active     = true
          AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_single_active_notif_template
BEFORE INSERT OR UPDATE OF active ON notification_templates
FOR EACH ROW
EXECUTE FUNCTION enforce_single_active_notification_template();

-- ============================================================
-- 8. TRIGGER: Gestión de timestamps de ciclo de vida
-- ============================================================
CREATE OR REPLACE FUNCTION handle_notification_lifecycle()
RETURNS TRIGGER AS $$
BEGIN
    -- Al pasar a ENTREGADA: registrar sent_at
    IF NEW.status = 'ENTREGADA' AND (OLD IS NULL OR OLD.status <> 'ENTREGADA') THEN
        IF NEW.sent_at IS NULL THEN
            NEW.sent_at := NOW();
        END IF;
    END IF;

    -- Al pasar a FALLIDA: registrar failed_at y limpiar next_retry_at
    IF NEW.status = 'FALLIDA' AND (OLD IS NULL OR OLD.status <> 'FALLIDA') THEN
        IF NEW.failed_at IS NULL THEN
            NEW.failed_at := NOW();
        END IF;
        NEW.next_retry_at := NULL;
    END IF;

    -- Al leer una notificación IN_APP: registrar read_at
    IF NEW.channel = 'IN_APP' AND NEW.read_at IS NOT NULL AND (OLD IS NULL OR OLD.read_at IS NULL) THEN
        -- read_at ya fue seteado externamente — solo validar consistencia
        IF NEW.status = 'ENTREGADA' THEN
            NULL; -- OK
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_notification_lifecycle
BEFORE INSERT OR UPDATE OF status, read_at ON notifications
FOR EACH ROW
EXECUTE FUNCTION handle_notification_lifecycle();

-- ============================================================
-- 9. TRIGGER: Bloqueo de Borrado Físico (Soft Delete Obligatorio)
-- ============================================================
CREATE OR REPLACE FUNCTION block_physical_notification_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada en módulo de notificaciones. Use soft delete (deleted_at).';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_notif_template_delete
BEFORE DELETE ON notification_templates
FOR EACH ROW EXECUTE FUNCTION block_physical_notification_delete();

CREATE TRIGGER trg_block_notification_delete
BEFORE DELETE ON notifications
FOR EACH ROW EXECUTE FUNCTION block_physical_notification_delete();

-- ============================================================
-- 10. TRIGGER: Trazabilidad General
-- ============================================================
CREATE TRIGGER trg_notif_template_traceability
BEFORE INSERT OR UPDATE ON notification_templates
FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

CREATE TRIGGER trg_notification_traceability
BEFORE INSERT OR UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- ============================================================
-- 11. TRIGGER: Auditoría General
-- ============================================================
CREATE TRIGGER audit_notification_templates
AFTER INSERT OR UPDATE OR DELETE ON notification_templates
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

CREATE TRIGGER audit_notifications
AFTER INSERT OR UPDATE OR DELETE ON notifications
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ============================================================
-- 12. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 13. POLÍTICAS RLS — notification_templates
-- ============================================================
CREATE POLICY notif_templates_super_admin ON notification_templates
FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY notif_templates_select_tenant ON notification_templates
FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND deleted_at IS NULL
);

CREATE POLICY notif_templates_write_tenant ON notification_templates
FOR ALL TO authenticated
USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1))
WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1));

-- ============================================================
-- 14. POLÍTICAS RLS — notifications
--     Un usuario solo ve SUS PROPIAS notificaciones
-- ============================================================
CREATE POLICY notifications_super_admin ON notifications
FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY notifications_own_records ON notifications
FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND recipient_user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND deleted_at IS NULL
);

CREATE POLICY notifications_write_tenant ON notifications
FOR ALL TO authenticated
USING (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1))
WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1));

-- ============================================================
-- 15. POLÍTICAS RLS — notification_preferences
--     Un usuario solo gestiona SUS PROPIAS preferencias
-- ============================================================
CREATE POLICY notif_prefs_super_admin ON notification_preferences
FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY notif_prefs_own_records ON notification_preferences
FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY notif_prefs_write_own ON notification_preferences
FOR ALL TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
)
WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);
