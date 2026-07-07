-- FASE 31: Centro de Configuración Empresarial (Settings)
-- Archivo: supabase/migrations/20260617000031_settings_core.sql
--
-- DECISIONES HEREDADAS (docs/30_configuracion_global/0.1 DECISIONES CONFIGURACION.md):
-- D30-01: Almacenamiento en DB — nunca en .env
-- D30-02: Esquema JSONB con validación
-- D30-03: Cero hardcoding de teléfonos, logos, colores, correos
-- D30-06: RLS estricto en tablas de configuración

-- ============================================================
-- 1. TABLA PRINCIPAL: tenant_settings
--    Configuración central por módulo usando JSONB
-- ============================================================
CREATE TABLE tenant_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Módulo de configuración (agrupación lógica)
    module varchar(100) NOT NULL CHECK (module IN (
        'EMPRESA',
        'LOCALIZACION',
        'IDENTIDAD',
        'DOCUMENTOS',
        'ERP'
    )),

    -- Clave de la configuración (ej: 'nombre_comercial', 'logo_claro_url')
    config_key varchar(150) NOT NULL,

    -- Valor en JSONB (string, número, boolean, array u objeto anidado)
    config_value jsonb NOT NULL DEFAULT 'null',

    -- Descripción interna de la configuración
    description text,

    -- ¿Es visible en la UI del administrador?
    is_public boolean NOT NULL DEFAULT true,

    -- ¿Requiere cifrado? (para claves de API en FASE 33)
    is_encrypted boolean NOT NULL DEFAULT false,

    -- Trazabilidad
    created_at  timestamp NOT NULL DEFAULT NOW(),
    updated_at  timestamp NOT NULL DEFAULT NOW(),
    updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at  timestamp,
    deleted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    UNIQUE (tenant_id, module, config_key)
);

COMMENT ON TABLE tenant_settings IS 'Repositorio central de configuración de cada inquilino. Cero hardcoding. D30-01/D30-02/D30-03.';

-- ============================================================
-- 2. FUNCIÓN DE UTILIDAD: get_tenant_setting
--    Lee un valor de configuración específico por tenant
-- ============================================================
CREATE OR REPLACE FUNCTION get_tenant_setting(
    p_tenant_id uuid,
    p_module varchar,
    p_key varchar
)
RETURNS jsonb AS $$
DECLARE
    v_value jsonb;
BEGIN
    SELECT config_value
    INTO v_value
    FROM tenant_settings
    WHERE tenant_id = p_tenant_id
      AND module = p_module
      AND config_key = p_key
      AND deleted_at IS NULL;

    RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 3. FUNCIÓN DE UTILIDAD: set_tenant_setting
--    Inserta o actualiza una configuración (UPSERT)
-- ============================================================
CREATE OR REPLACE FUNCTION set_tenant_setting(
    p_tenant_id uuid,
    p_module varchar,
    p_key varchar,
    p_value jsonb,
    p_updated_by uuid DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO tenant_settings (tenant_id, module, config_key, config_value, updated_by, updated_at)
    VALUES (p_tenant_id, p_module, p_key, p_value, p_updated_by, NOW())
    ON CONFLICT (tenant_id, module, config_key)
    DO UPDATE SET
        config_value = EXCLUDED.config_value,
        updated_by   = EXCLUDED.updated_by,
        updated_at   = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 4. TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION handle_tenant_settings_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenant_settings_updated_at
    BEFORE UPDATE ON tenant_settings
    FOR EACH ROW EXECUTE FUNCTION handle_tenant_settings_updated_at();

-- ============================================================
-- 5. TRIGGER: Bloqueo de borrado físico (Soft Delete obligatorio)
-- ============================================================
CREATE OR REPLACE FUNCTION block_physical_settings_delete()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'El borrado físico de configuraciones está prohibido. Use deleted_at para desactivar.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_physical_settings_delete
    BEFORE DELETE ON tenant_settings
    FOR EACH ROW EXECUTE FUNCTION block_physical_settings_delete();

-- ============================================================
-- 6. TRIGGER: Auditoría en audit_log
-- ============================================================
CREATE TRIGGER trg_tenant_settings_audit
    AFTER INSERT OR UPDATE ON tenant_settings
    FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ============================================================
-- 7. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;

-- Super Admin: acceso total cross-tenant
CREATE POLICY tenant_settings_super_admin ON tenant_settings
    FOR ALL
    USING (is_platform_super_admin());

-- Lectura: cualquier usuario del tenant puede leer su configuración pública
CREATE POLICY tenant_settings_read ON tenant_settings
    FOR SELECT
    USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND is_public = true
    );

-- Escritura: solo ADMINISTRADOR_TENANT y GERENTE pueden actualizar configuración
CREATE POLICY tenant_settings_write ON tenant_settings
    FOR ALL
    USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('ADMINISTRADOR_TENANT', 'GERENTE', 'GERENTE_GENERAL')
    );

-- ============================================================
-- 8. ÍNDICES DE RENDIMIENTO
-- ============================================================
CREATE INDEX idx_tenant_settings_tenant_module
    ON tenant_settings(tenant_id, module)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_tenant_settings_key
    ON tenant_settings(tenant_id, config_key)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_tenant_settings_updated_by
    ON tenant_settings(updated_by)
    WHERE deleted_at IS NULL;

-- ============================================================
-- 9. DATOS SEMILLA: Configuración por defecto para módulo EMPRESA
--    (Solo estructura — valores se configuran en el wizard de onboarding)
-- ============================================================
-- Nota: No se insertan datos hardcoded. La función set_tenant_setting
-- se usa desde el wizard de onboarding del tenant para configurar estos valores.
-- Claves predefinidas del módulo EMPRESA:
--   nombre_comercial, razon_social, nit, regimen, direccion,
--   ciudad, departamento, pais, codigo_postal, web,
--   email_corporativo, telefono_principal, telefono_secundario,
--   whatsapp_principal, whatsapp_soporte, whatsapp_ventas,
--   telegram_chat_id, horario_laboral_inicio, horario_laboral_fin
--
-- Claves predefinidas del módulo LOCALIZACION:
--   zona_horaria, idioma, moneda, formato_fecha,
--   formato_hora, separador_decimal, separador_miles
--
-- Claves predefinidas del módulo IDENTIDAD:
--   logo_claro_url, logo_oscuro_url, logo_pdf_url,
--   logo_login_url, favicon_url, splash_url, loader_url,
--   icono_movil_url, color_primario, color_secundario,
--   color_exito, color_warning, color_danger, color_info,
--   tipografia_principal, border_radius, sombras, animaciones
--
-- Claves predefinidas del módulo DOCUMENTOS:
--   pie_pagina, encabezado, firma_url, sello_url,
--   qr_habilitado, margen_superior, margen_inferior,
--   margen_izquierdo, margen_derecho, numeracion_formato,
--   formato_pdf, formato_impresion
--
-- Claves predefinidas del módulo ERP:
--   nombre_sistema, version_visible, url_soporte,
--   email_soporte, url_centro_ayuda, url_manual_usuario,
--   url_politica_privacidad, url_terminos, url_cookies
