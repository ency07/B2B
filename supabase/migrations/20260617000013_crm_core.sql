-- MIGRACIÓN FASE 13: CRM, COTIZACIONES Y PIPELINE (REUTILIZACIÓN Y EXTENSIÓN)
-- Archivo: supabase/migrations/20260617000013_crm_core.sql

-- ==========================================
-- 1. Modificaciones de Esquemas Existentes (Reutilización)
-- ==========================================

-- A. Hacer tax_id opcional en la tabla de clientes (clients)
-- Permite registrar prospectos (leads) desde el wizard web sin exigir identificación tributaria inicialmente
ALTER TABLE clients ALTER COLUMN tax_id DROP NOT NULL;

-- B. Agregar claves foráneas en la tabla de leads para enlazarlos con el CRM
-- Vincula el lead calificado con la cuenta (client_id) y el contacto (contact_id) resultantes del B2B Upsert
ALTER TABLE leads ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN contact_id uuid REFERENCES client_contacts(id) ON DELETE SET NULL;

-- ==========================================
-- 2. Nueva Tabla: Bitácora de Actividades Comerciales (crm_activity_logs)
-- ==========================================
CREATE TABLE crm_activity_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    requirement_id uuid NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    activity_type varchar(100) NOT NULL CHECK (activity_type IN ('NOTE', 'CALL', 'EMAIL', 'MEETING', 'SYSTEM')),
    description text NOT NULL,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

-- ==========================================
-- 3. Índices de Rendimiento
-- ==========================================
CREATE INDEX idx_crm_activity_logs_requirement ON crm_activity_logs(requirement_id);
CREATE INDEX idx_leads_client ON leads(client_id);
CREATE INDEX idx_leads_contact ON leads(contact_id);

-- ==========================================
-- 4. Trigger: Bloqueo de Borrado Físico (Soft Delete Obligatorio)
-- ==========================================
CREATE OR REPLACE FUNCTION block_physical_crm_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los logs de actividad del CRM son inmutables. Utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_crm_activity_delete BEFORE DELETE ON crm_activity_logs FOR EACH ROW EXECUTE FUNCTION block_physical_crm_delete();

-- ==========================================
-- 5. Triggers: Trazabilidad General
-- ==========================================
CREATE TRIGGER trg_crm_activity_traceability BEFORE INSERT OR UPDATE ON crm_activity_logs FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- ==========================================
-- 6. Triggers: Integración con Auditoría General
-- ==========================================
CREATE TRIGGER audit_crm_activity_logs AFTER INSERT OR UPDATE OR DELETE ON crm_activity_logs FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ==========================================
-- 7. Habilitar Row Level Security (RLS)
-- ==========================================
ALTER TABLE crm_activity_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 8. Políticas de Seguridad RLS
-- ==========================================
CREATE POLICY crm_activity_all_tenant ON crm_activity_logs FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);
