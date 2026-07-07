--
-- FASE 34: Administración Avanzada
--
-- DECISIONES HEREDADAS:
-- D30-01: Almacenamiento centralizado en DB
-- D30-02: Esquema JSONB con validación de esquema
-- D30-03: Cero hardcoding de identidades, logotipos, colores, teléfonos
-- D30-04: Estructura de Campos Personalizados (Custom Fields)
-- D30-06: RLS en configuraciones

-- ============================================================
-- 1. AMPLIAR TABLA users CON COLUMNAS DE PERFIL
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language varchar(10) DEFAULT 'es';
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_theme varchar(20) DEFAULT 'dark';
ALTER TABLE users ADD COLUMN IF NOT EXISTS signature_url text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone varchar(100) DEFAULT 'America/Bogota';
ALTER TABLE users ADD COLUMN IF NOT EXISTS home_page varchar(250) DEFAULT '/dashboard';

COMMENT ON COLUMN users.avatar_url IS 'URL o Base64 de la imagen de perfil del usuario.';
COMMENT ON COLUMN users.preferred_language IS 'Código de idioma de preferencia del usuario (es, en, pt).';
COMMENT ON COLUMN users.preferred_theme IS 'Tema de interfaz de preferencia del usuario (light, dark, system).';
COMMENT ON COLUMN users.signature_url IS 'URL o Base64 de la firma digitalizada del usuario.';
COMMENT ON COLUMN users.timezone IS 'Zona horaria preferida para el cálculo de SLAs e informes.';
COMMENT ON COLUMN users.home_page IS 'Ruta de la pantalla inicial tras el login de este usuario.';

-- ============================================================
-- 2. AGREGAR COLUMNA custom_fields A TABLAS PRINCIPALES
-- ============================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE warranties ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb NOT NULL;

-- ============================================================
-- 3. CREAR TABLA: custom_field_definitions
-- ============================================================
CREATE TABLE custom_field_definitions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Entidad sobre la que actúa
    entity_type varchar(50) NOT NULL CHECK (entity_type IN (
        'CLIENT', 
        'REQUIREMENT', 
        'QUOTE', 
        'JOB', 
        'INVOICE', 
        'WARRANTY', 
        'USER'
    )),

    -- Clave técnica del campo (ej: 'fecha_nacimiento')
    field_key   varchar(50) NOT NULL,
    -- Nombre visible en la UI (ej: 'Fecha de Nacimiento')
    field_name  varchar(100) NOT NULL,

    -- Tipo de dato admitido
    field_type  varchar(30) NOT NULL CHECK (field_type IN (
        'TEXT', 
        'NUMBER', 
        'DATE', 
        'LIST', 
        'FILE', 
        'BOOLEAN', 
        'JSON'
    )),

    -- Requerido obligatorio en el payload
    is_required boolean NOT NULL DEFAULT false,
    
    -- Opciones permitidas (solo para tipo LIST, array JSON de strings)
    options     jsonb,
    
    -- Trazabilidad y Soft Delete
    created_at  timestamp NOT NULL DEFAULT NOW(),
    created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at  timestamp,
    updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at  timestamp,
    deleted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    UNIQUE (tenant_id, entity_type, field_key)
);

COMMENT ON TABLE custom_field_definitions IS 'Definición de campos personalizados dinámicos por tenant y tipo de entidad. D30-04.';

-- ============================================================
-- 4. TRIGGER FUNCTION: validate_entity_custom_fields
--    Valida que el campo custom_fields cumpla con las definiciones
-- ============================================================
CREATE OR REPLACE FUNCTION validate_entity_custom_fields()
RETURNS trigger AS $$
DECLARE
    v_entity_type varchar;
    v_def record;
    v_val jsonb;
    v_val_type varchar;
    v_val_str text;
    v_options_count integer;
BEGIN
    -- Determinar el tipo de entidad según la tabla del trigger
    IF TG_TABLE_NAME = 'clients' THEN
        v_entity_type := 'CLIENT';
    ELSIF TG_TABLE_NAME = 'requirements' THEN
        v_entity_type := 'REQUIREMENT';
    ELSIF TG_TABLE_NAME = 'quotes' THEN
        v_entity_type := 'QUOTE';
    ELSIF TG_TABLE_NAME = 'jobs' THEN
        v_entity_type := 'JOB';
    ELSIF TG_TABLE_NAME = 'invoices' THEN
        v_entity_type := 'INVOICE';
    ELSIF TG_TABLE_NAME = 'warranties' THEN
        v_entity_type := 'WARRANTY';
    ELSIF TG_TABLE_NAME = 'users' THEN
        v_entity_type := 'USER';
    ELSE
        RAISE EXCEPTION 'Tabla no soportada para validación de campos personalizados: %', TG_TABLE_NAME;
    END IF;

    -- 1. Validar campos requeridos y tipos de datos definidos
    FOR v_def IN
        SELECT field_key, field_type, is_required, options
        FROM custom_field_definitions
        WHERE tenant_id = NEW.tenant_id
          AND entity_type = v_entity_type
          AND deleted_at IS NULL
    LOOP
        -- Verificar presencia
        IF NOT (NEW.custom_fields ? v_def.field_key) THEN
            IF v_def.is_required = true THEN
                RAISE EXCEPTION 'El campo personalizado % es requerido.', v_def.field_key;
            END IF;
            CONTINUE;
        END IF;

        v_val := NEW.custom_fields -> v_def.field_key;
        v_val_type := jsonb_typeof(v_val);

        -- Verificar si es nulo
        IF v_val_type = 'null' THEN
            IF v_def.is_required = true THEN
                RAISE EXCEPTION 'El campo personalizado % es requerido y no puede ser nulo.', v_def.field_key;
            END IF;
            CONTINUE;
        END IF;

        -- Validar tipos de datos permitidos
        IF v_def.field_type = 'TEXT' THEN
            IF v_val_type <> 'string' THEN
                RAISE EXCEPTION 'El campo personalizado % debe ser de tipo TEXT (string).', v_def.field_key;
            END IF;
        ELSIF v_def.field_type = 'NUMBER' THEN
            IF v_val_type <> 'number' THEN
                RAISE EXCEPTION 'El campo personalizado % debe ser de tipo NUMBER (número).', v_def.field_key;
            END IF;
        ELSIF v_def.field_type = 'BOOLEAN' THEN
            IF v_val_type <> 'boolean' THEN
                RAISE EXCEPTION 'El campo personalizado % debe ser de tipo BOOLEAN (true/false).', v_def.field_key;
            END IF;
        ELSIF v_def.field_type = 'DATE' THEN
            IF v_val_type <> 'string' THEN
                RAISE EXCEPTION 'El campo personalizado % debe ser de tipo DATE (string con formato YYYY-MM-DD).', v_def.field_key;
            END IF;
            v_val_str := v_val#>>'{}';
            IF NOT (v_val_str ~ '^\d{4}-\d{2}-\d{2}$') THEN
                RAISE EXCEPTION 'El campo personalizado % tiene un formato de fecha inválido: %. Debe ser YYYY-MM-DD.', v_def.field_key, v_val_str;
            END IF;
        ELSIF v_def.field_type = 'FILE' THEN
            IF v_val_type <> 'string' THEN
                RAISE EXCEPTION 'El campo personalizado % debe ser de tipo FILE (string de ruta o URL).', v_def.field_key;
            END IF;
            v_val_str := v_val#>>'{}';
            IF NOT (v_val_str ~* '^https?:\/\/.*' OR v_val_str ~* '^\/.*' OR v_val_str = '') THEN
                RAISE EXCEPTION 'El campo de archivo % tiene un formato de ruta inválido: %.', v_def.field_key, v_val_str;
            END IF;
        ELSIF v_def.field_type = 'LIST' THEN
            IF v_val_type <> 'string' THEN
                RAISE EXCEPTION 'El campo personalizado % debe ser de tipo LIST (string de opción seleccionada).', v_def.field_key;
            END IF;
            v_val_str := v_val#>>'{}';
            -- Verificar que pertenezca a la lista de opciones
            SELECT count(*) INTO v_options_count
            FROM jsonb_array_elements_text(v_def.options) AS opt
            WHERE opt = v_val_str;
            
            IF v_options_count = 0 THEN
                RAISE EXCEPTION 'La opción % no es válida para el campo personalizado %. Opciones permitidas: %.', v_val_str, v_def.field_key, v_def.options::text;
            END IF;
        END IF;
    END LOOP;

    -- 2. Validar que no se pasen campos no definidos en el payload (prevención de contaminación de esquema)
    FOR v_val_str IN SELECT jsonb_object_keys(NEW.custom_fields) LOOP
        IF NOT EXISTS (
            SELECT 1 
            FROM custom_field_definitions 
            WHERE tenant_id = NEW.tenant_id 
              AND entity_type = v_entity_type 
              AND field_key = v_val_str
              AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'El campo personalizado % no está definido para el tipo de entidad %.', v_val_str, v_entity_type;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asignar triggers BEFORE INSERT OR UPDATE a las 7 tablas clave
CREATE TRIGGER trg_validate_custom_fields BEFORE INSERT OR UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION validate_entity_custom_fields();
CREATE TRIGGER trg_validate_custom_fields BEFORE INSERT OR UPDATE ON requirements FOR EACH ROW EXECUTE FUNCTION validate_entity_custom_fields();
CREATE TRIGGER trg_validate_custom_fields BEFORE INSERT OR UPDATE ON quotes FOR EACH ROW EXECUTE FUNCTION validate_entity_custom_fields();
CREATE TRIGGER trg_validate_custom_fields BEFORE INSERT OR UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION validate_entity_custom_fields();
CREATE TRIGGER trg_validate_custom_fields BEFORE INSERT OR UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION validate_entity_custom_fields();
CREATE TRIGGER trg_validate_custom_fields BEFORE INSERT OR UPDATE ON warranties FOR EACH ROW EXECUTE FUNCTION validate_entity_custom_fields();
CREATE TRIGGER trg_validate_custom_fields BEFORE INSERT OR UPDATE ON users FOR EACH ROW EXECUTE FUNCTION validate_entity_custom_fields();

-- ============================================================
-- 5. CREAR TABLA: automation_rules
-- ============================================================
CREATE TABLE automation_rules (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_type  varchar(100) NOT NULL, -- Ej: 'INVOICE_OVERDUE', 'JOB_COMPLETED'
    action_type varchar(50) NOT NULL CHECK (action_type IN ('DISPATCH_NOTIFICATION', 'CREATE_TASK', 'WRITE_LOG')),
    action_payload jsonb NOT NULL,
    active      boolean NOT NULL DEFAULT true,

    -- Trazabilidad y Soft Delete
    created_at  timestamp NOT NULL DEFAULT NOW(),
    created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at  timestamp,
    updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at  timestamp,
    deleted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

COMMENT ON TABLE automation_rules IS 'Reglas de automatización dinámica del sistema (IF Event -> DO Action).';

-- ============================================================
-- 6. FUNCIÓN DE MOTOR DE AUTOMATIZACIÓN
-- ============================================================
CREATE OR REPLACE FUNCTION execute_automation_rules(
    p_tenant_id uuid,
    p_event_type varchar,
    p_event_id uuid,
    p_subject varchar,
    p_body text
)
RETURNS void AS $$
DECLARE
    v_rule record;
    v_title varchar;
    v_msg text;
BEGIN
    -- 1. Ejecutar enrutamiento dinámico de notificaciones estándar
    PERFORM dispatch_notification_to_route(p_tenant_id, p_event_type, p_event_id, p_subject, p_body);

    -- 2. Buscar y ejecutar reglas avanzadas dinámicas configuradas
    FOR v_rule IN
        SELECT action_type, action_payload
        FROM automation_rules
        WHERE tenant_id = p_tenant_id
          AND event_type = p_event_type
          AND active = true
          AND deleted_at IS NULL
    LOOP
        IF v_rule.action_type = 'DISPATCH_NOTIFICATION' THEN
            v_title := coalesce(v_rule.action_payload->>'subject', p_subject);
            v_msg := coalesce(v_rule.action_payload->>'body', p_body);
            PERFORM dispatch_notification_to_route(p_tenant_id, p_event_type, p_event_id, v_title, v_msg);
            
        ELSIF v_rule.action_type = 'WRITE_LOG' THEN
            -- Inserción en log de auditoría técnica
            INSERT INTO audit_log (
                tenant_id,
                action,
                table_name,
                record_id,
                old_data,
                new_data,
                performed_by
            ) VALUES (
                p_tenant_id,
                'AUTOMATION_TRIGGERED',
                'automation_rules',
                p_event_id,
                NULL,
                to_jsonb(v_rule.action_payload),
                NULL
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. ROW LEVEL SECURITY (RLS) Y POLÍTICAS
-- ============================================================
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- Políticas: custom_field_definitions
CREATE POLICY custom_field_defs_super_admin ON custom_field_definitions
    FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY custom_field_defs_select ON custom_field_definitions
    FOR SELECT TO authenticated USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND deleted_at IS NULL
    );

CREATE POLICY custom_field_defs_write ON custom_field_definitions
    FOR ALL TO authenticated USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('ADMINISTRADOR_TENANT', 'GERENTE', 'GERENTE_GENERAL')
    );

-- Políticas: automation_rules
CREATE POLICY automation_rules_super_admin ON automation_rules
    FOR ALL TO authenticated USING (is_platform_super_admin());

CREATE POLICY automation_rules_select ON automation_rules
    FOR SELECT TO authenticated USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND deleted_at IS NULL
    );

CREATE POLICY automation_rules_write ON automation_rules
    FOR ALL TO authenticated USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('ADMINISTRADOR_TENANT', 'GERENTE', 'GERENTE_GENERAL')
    );

-- ============================================================
-- 8. ÍNDICES DE RENDIMIENTO Y HARDENING (WHERE deleted_at IS NULL)
-- ============================================================
CREATE INDEX idx_custom_field_defs_tenant_entity ON custom_field_definitions(tenant_id, entity_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_custom_field_defs_key ON custom_field_definitions(tenant_id, field_key) WHERE deleted_at IS NULL;
CREATE INDEX idx_automation_rules_tenant_event ON automation_rules(tenant_id, event_type) WHERE deleted_at IS NULL;

-- Trigger para bloquear deletes físicos (Soft delete obligatorio)
CREATE TRIGGER trg_block_custom_field_defs_delete
    BEFORE DELETE ON custom_field_definitions
    FOR EACH ROW EXECUTE FUNCTION block_physical_settings_delete();

CREATE TRIGGER trg_block_automation_rules_delete
    BEFORE DELETE ON automation_rules
    FOR EACH ROW EXECUTE FUNCTION block_physical_settings_delete();
