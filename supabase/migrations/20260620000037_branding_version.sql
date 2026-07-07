--
-- FASE 32: Historial de Versiones de Branding (tenant_branding_version)
--

CREATE TABLE tenant_branding_version (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    version_number integer NOT NULL,
    
    -- Snapshot JSONB con todas las configuraciones de branding activas en este punto
    config_values jsonb NOT NULL,
    description varchar(255),
    
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    
    UNIQUE (tenant_id, version_number)
);

COMMENT ON TABLE tenant_branding_version IS 'Tabla para almacenar snapshots del historial de configuraciones de marca por tenant.';

-- Habilitar Row Level Security (RLS)
ALTER TABLE tenant_branding_version ENABLE ROW LEVEL SECURITY;

-- Super Admin: acceso total
CREATE POLICY tenant_branding_version_super_admin ON tenant_branding_version
    FOR ALL
    USING (is_platform_super_admin());

-- Lectura: cualquier usuario del tenant
CREATE POLICY tenant_branding_version_read ON tenant_branding_version
    FOR SELECT
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Escritura: solo administradores/gerentes del tenant
CREATE POLICY tenant_branding_version_write ON tenant_branding_version
    FOR ALL
    USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
        AND (auth.jwt() ->> 'role') IN ('ADMINISTRADOR_TENANT', 'GERENTE', 'GERENTE_GENERAL')
    );

-- Índices para optimización
CREATE INDEX idx_tenant_branding_version_tenant
    ON tenant_branding_version(tenant_id, version_number);
