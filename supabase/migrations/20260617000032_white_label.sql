--
-- FASE 32: White Label (Branding Dinámico)
--
-- DECISIONES HEREDADAS:
-- D30-01: Almacenamiento centralizado en DB
-- D30-02: Esquema JSONB con validación de esquema
-- D30-03: Cero hardcoding de identidades, logotipos, colores
-- D30-06: RLS en configuraciones

-- ============================================================
-- 1. TRIGGER FUNCTION: validate_tenant_settings_white_label
--    Valida sintaxis y formato de variables de White Label
-- ============================================================
CREATE OR REPLACE FUNCTION validate_tenant_settings_white_label()
RETURNS trigger AS $$
DECLARE
    v_val_type varchar;
    v_val_str text;
BEGIN
    -- Solo validar configuraciones en módulos visuales/de identidad
    IF NEW.module IN ('IDENTIDAD', 'ERP', 'DOCUMENTOS') THEN
        v_val_type := jsonb_typeof(NEW.config_value);

        -- 1. Validar colores primario, secundario, estado
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

        -- 2. Validar URLs y rutas de logotipos, favicons e iconos
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

        -- 3. Validar layouts (deben ser objetos o arrays JSON estructurados)
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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asignar trigger a la tabla tenant_settings
CREATE TRIGGER trg_validate_tenant_settings_white_label
    BEFORE INSERT OR UPDATE ON tenant_settings
    FOR EACH ROW EXECUTE FUNCTION validate_tenant_settings_white_label();


-- ============================================================
-- 2. FUNCIÓN DE UTILIDAD: get_white_label_config
--    Obtiene la configuración visual consolidada de un tenant
-- ============================================================
CREATE OR REPLACE FUNCTION get_white_label_config(p_tenant_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
BEGIN
    SELECT jsonb_object_agg(config_key, config_value)
    INTO v_result
    FROM tenant_settings
    WHERE tenant_id = p_tenant_id
      AND module IN ('IDENTIDAD', 'ERP', 'DOCUMENTOS')
      AND deleted_at IS NULL;

    IF v_result IS NULL THEN
        RETURN '{}'::jsonb;
    END IF;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. FUNCIÓN DE UTILIDAD: get_my_white_label_config
--    Obtiene el branding del tenant actual a partir del token JWT
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_white_label_config()
RETURNS jsonb AS $$
DECLARE
    v_tenant_id uuid;
BEGIN
    v_tenant_id := (auth.jwt() ->> 'tenant_id')::uuid;
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado o JWT inválido.';
    END IF;

    RETURN get_white_label_config(v_tenant_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
