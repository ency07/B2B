--
-- FASE 33: Integraciones y Canales
--
-- DECISIONES HEREDADAS:
-- D30-01: Almacenamiento centralizado en DB
-- D30-02: Esquema JSONB con validación de esquema
-- D30-03: Cero hardcoding de identidades, logotipos, colores, teléfonos
-- D30-06: RLS en configuraciones

-- Habilitar extensión pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. ACTUALIZAR RESTRICCIÓN DE MÓDULOS EN tenant_settings
-- ============================================================
ALTER TABLE tenant_settings DROP CONSTRAINT IF EXISTS tenant_settings_module_check;
ALTER TABLE tenant_settings ADD CONSTRAINT tenant_settings_module_check
    CHECK (module IN ('EMPRESA', 'LOCALIZACION', 'IDENTIDAD', 'DOCUMENTOS', 'ERP', 'INTEGRACIONES', 'TELEFONIA'));

-- ============================================================
-- 2. TRIGGER FUNCTION: handle_tenant_settings_encryption
--    Cifra transparentemente los valores si is_encrypted = true
-- ============================================================
CREATE OR REPLACE FUNCTION handle_tenant_settings_encryption()
RETURNS trigger AS $$
DECLARE
    v_passphrase text;
    v_encrypted_bytea bytea;
    v_base64 text;
BEGIN
    -- Solo cifrar si is_encrypted es verdadero y el valor no es nulo/vacío
    IF NEW.is_encrypted = true AND jsonb_typeof(NEW.config_value) <> 'null' THEN
        -- Solo cifrar en inserciones o si el valor ha cambiado realmente
        IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.config_value IS DISTINCT FROM OLD.config_value) THEN
            -- Resolver frase secreta del sistema
            v_passphrase := coalesce(current_setting('app.settings_secret_key', true), 'b2b-erp-default-secret-passphrase');
            
            -- Cifrar la representación textual del valor JSONB
            v_encrypted_bytea := pgp_sym_encrypt(NEW.config_value::text, v_passphrase);
            v_base64 := encode(v_encrypted_bytea, 'base64');
            
            -- Guardar como string JSONB
            NEW.config_value := to_jsonb(v_base64);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger con prefijo 'trg_z_' para ejecutarse AL FINAL del flujo BEFORE UPDATE/INSERT
-- (después de las validaciones de tipos de datos en texto plano)
DROP TRIGGER IF EXISTS trg_z_tenant_settings_encryption ON tenant_settings;
CREATE TRIGGER trg_z_tenant_settings_encryption
    BEFORE INSERT OR UPDATE ON tenant_settings
    FOR EACH ROW EXECUTE FUNCTION handle_tenant_settings_encryption();

-- ============================================================
-- 3. FUNCIÓN DE UTILIDAD ACTUALIZADA: get_tenant_setting
--    Soporta descifrado automático en tiempo de lectura
-- ============================================================
CREATE OR REPLACE FUNCTION get_tenant_setting(
    p_tenant_id uuid,
    p_module varchar,
    p_key varchar
)
RETURNS jsonb AS $$
DECLARE
    v_value jsonb;
    v_is_encrypted boolean;
    v_passphrase text;
    v_decrypted_text text;
BEGIN
    SELECT config_value, is_encrypted
    INTO v_value, v_is_encrypted
    FROM tenant_settings
    WHERE tenant_id = p_tenant_id
      AND module = p_module
      AND config_key = p_key
      AND deleted_at IS NULL;

    IF v_value IS NULL THEN
        RETURN NULL;
    END IF;

    -- Descifrar transparentemente si el campo se marcó como cifrado
    IF v_is_encrypted = true AND jsonb_typeof(v_value) = 'string' THEN
        v_passphrase := coalesce(current_setting('app.settings_secret_key', true), 'b2b-erp-default-secret-passphrase');
        BEGIN
            v_decrypted_text := pgp_sym_decrypt(decode(v_value#>>'{}', 'base64'), v_passphrase);
            RETURN v_decrypted_text::jsonb;
        EXCEPTION WHEN OTHERS THEN
            -- En caso de fallo (ej: mala clave secreta), retornar NULL
            RETURN NULL;
        END;
    END IF;

    RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. VALIDACIÓN DE PANTALLAS Y TELEFONÍA (MÓDULOS ADICIONALES)
-- ============================================================
CREATE OR REPLACE FUNCTION validate_tenant_settings_white_label()
RETURNS trigger AS $$
DECLARE
    v_val_type varchar;
    v_val_str text;
BEGIN
    v_val_type := jsonb_typeof(NEW.config_value);

    -- 1. Validaciones para IDENTIDAD, ERP, DOCUMENTOS (Branding / White Label)
    IF NEW.module IN ('IDENTIDAD', 'ERP', 'DOCUMENTOS') THEN
        -- Validar colores
        IF NEW.config_key IN (
            'color_primario', 
            'color_secundario', 
            'color_exito', 
            'color_warning', 
            'color_danger', 
            'color_info'
        ) THEN
            IF v_val_type <> 'string' THEN
                RAISE EXCEPTION 'El valor para la clave de color % debe ser un string.', NEW.config_key;
            END IF;
            
            v_val_str := NEW.config_value#>>'{}';
            IF NOT (
                v_val_str ~* '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$' OR 
                v_val_str ~* '^rgba?\(\s*[0-9\s.%]+\s*,\s*[0-9\s.%]+\s*,\s*[0-9\s.%]+\s*(,\s*[0-9\s.%]+\s*)?\)$' OR 
                v_val_str ~* '^hsla?\(\s*[0-9\s.%degrad]+\s*,\s*[0-9\s.%]+\s*,\s*[0-9\s.%]+\s*(,\s*[0-9\s.%]+\s*)?\)$' OR
                v_val_str ~* '^[a-z]+$'
            ) THEN
                RAISE EXCEPTION 'El color % tiene un formato inválido: %. Debe ser Hex, RGB, RGBA, HSL, HSLA o un nombre de color estándar.', NEW.config_key, v_val_str;
            END IF;
        END IF;

        -- Validar URLs
        IF NEW.config_key IN (
            'logo_claro_url', 
            'logo_oscuro_url', 
            'logo_login_url', 
            'logo_pdf_url', 
            'favicon_url', 
            'splash_url', 
            'loader_url', 
            'icono_movil_url', 
            'firma_url', 
            'sello_url'
        ) THEN
            IF v_val_type <> 'string' THEN
                RAISE EXCEPTION 'El valor para la clave de URL % debe ser un string.', NEW.config_key;
            END IF;
            
            v_val_str := NEW.config_value#>>'{}';
            IF NOT (
                v_val_str ~* '^https?:\/\/.*' OR 
                v_val_str ~* '^\/.*' OR 
                v_val_str ~* '^data:image\/[a-zA-Z+-]+;base64,.*' OR 
                v_val_str = ''
            ) THEN
                RAISE EXCEPTION 'La URL % tiene un formato de ruta inválido: %. Debe ser URL absoluta, ruta relativa o Base64.', NEW.config_key, v_val_str;
            END IF;
        END IF;

        -- Validar layouts
        IF NEW.config_key IN (
            'layout_sidebar', 
            'layout_dashboard', 
            'layout_menus', 
            'layout_widgets'
        ) THEN
            IF v_val_type NOT IN ('object', 'array') THEN
                RAISE EXCEPTION 'El layout de % debe ser un objeto o un array JSON válido.', NEW.config_key;
            END IF;
        END IF;
    END IF;

    -- 2. Validaciones para TELEFONIA (Números de contacto)
    IF NEW.module = 'TELEFONIA' THEN
        IF v_val_type <> 'string' THEN
            RAISE EXCEPTION 'El valor para la clave de teléfono % debe ser un string.', NEW.config_key;
        END IF;
        
        v_val_str := NEW.config_value#>>'{}';
        IF NOT (v_val_str ~* '^\+[1-9]\d{5,14}$' OR v_val_str = '') THEN
            RAISE EXCEPTION 'El número telefónico % tiene un formato inválido: %. Debe cumplir el formato internacional E.164 (ej: +573001112233).', NEW.config_key, v_val_str;
        END IF;
    END IF;

    -- 3. Validaciones para INTEGRACIONES
    IF NEW.module = 'INTEGRACIONES' THEN
        IF NEW.config_key = 'notification_routes' THEN
            IF v_val_type <> 'object' THEN
                RAISE EXCEPTION 'La configuración de rutas de notificaciones notification_routes debe ser un objeto JSON.';
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. ENRUTAMIENTO DINÁMICO DE NOTIFICACIONES
-- ============================================================

-- Obtener la ruta configurada para un tipo de evento
CREATE OR REPLACE FUNCTION get_notification_route(
    p_tenant_id uuid,
    p_event_type varchar
)
RETURNS jsonb AS $$
DECLARE
    v_routes jsonb;
BEGIN
    v_routes := get_tenant_setting(p_tenant_id, 'INTEGRACIONES', 'notification_routes');
    IF v_routes IS NULL THEN
        -- Ruta por defecto si no hay configuración: notificar a administradores por IN_APP
        RETURN '{"roles": ["ADMINISTRADOR_TENANT"], "channels": ["IN_APP"]}'::jsonb;
    END IF;
    
    RETURN coalesce(v_routes->p_event_type, '{"roles": ["ADMINISTRADOR_TENANT"], "channels": ["IN_APP"]}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Despachar notificaciones de forma dinámica basadas en las rutas
CREATE OR REPLACE FUNCTION dispatch_notification_to_route(
    p_tenant_id uuid,
    p_event_type varchar,
    p_event_id uuid,
    p_subject varchar,
    p_body text
)
RETURNS void AS $$
DECLARE
    v_route jsonb;
    v_user_id uuid;
    v_email varchar;
    v_phone varchar;
    v_telegram_chat_id varchar;
    v_channel varchar;
    v_pref_enabled boolean;
    v_recipient varchar;
BEGIN
    -- Resolver la ruta configurada
    v_route := get_notification_route(p_tenant_id, p_event_type);

    -- Buscar todos los usuarios del tenant que posean alguno de los roles destinatarios
    FOR v_user_id, v_email, v_phone, v_telegram_chat_id IN
        SELECT DISTINCT u.id, u.email, u.phone, u.telegram_chat_id
        FROM users u
        JOIN user_roles ur ON ur.user_id = u.id
        JOIN roles r ON r.id = ur.role_id
        WHERE u.tenant_id = p_tenant_id
          AND r.name = ANY (SELECT jsonb_array_elements_text(v_route->'roles'))
          AND u.deleted_at IS NULL
    LOOP
        -- Para cada canal de la ruta
        FOR v_channel IN SELECT jsonb_array_elements_text(v_route->'channels') LOOP
            -- Verificar si el usuario ha deshabilitado el canal en sus preferencias
            SELECT enabled INTO v_pref_enabled
            FROM notification_preferences
            WHERE tenant_id = p_tenant_id
              AND user_id = v_user_id
              AND channel = v_channel
              AND (event_type = p_event_type OR event_type IS NULL);

            IF v_pref_enabled IS NULL OR v_pref_enabled = true THEN
                -- Resolver información de contacto por canal
                IF v_channel = 'IN_APP' THEN
                    v_recipient := v_user_id::text;
                ELSIF v_channel = 'EMAIL' THEN
                    v_recipient := v_email;
                ELSIF v_channel = 'WHATSAPP' OR v_channel = 'SMS' THEN
                    v_recipient := v_phone;
                ELSIF v_channel = 'TELEGRAM' THEN
                    v_recipient := v_telegram_chat_id;
                ELSE
                    v_recipient := NULL;
                END IF;

                -- Insertar notificación en cola de envío (BullMQ resolverá la cola real)
                IF v_recipient IS NOT NULL AND v_recipient <> '' THEN
                    INSERT INTO notifications (
                        tenant_id,
                        channel,
                        recipient_user_id,
                        recipient_contact,
                        event_id,
                        event_type,
                        subject,
                        body,
                        status
                    ) VALUES (
                        p_tenant_id,
                        v_channel,
                        v_user_id,
                        v_recipient,
                        p_event_id,
                        p_event_type,
                        p_subject,
                        p_body,
                        'PENDIENTE'
                    );
                END IF;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
