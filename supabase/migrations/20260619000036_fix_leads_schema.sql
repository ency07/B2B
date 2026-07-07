-- MIGRACIÓN FASE 36: ALINEACIÓN SCHEMA LEADS CON FLUJO B2B WIZARD
-- Archivo: supabase/migrations/20260619000036_fix_leads_schema.sql
--
-- Propósito: Alinear la tabla `leads` con el flujo público del Wizard y los Server Actions.
-- La tabla original tenía columnas de captura directa (name, company_name, etc.).
-- El nuevo flujo B2B registra primero clients/client_contacts y luego crea el lead
-- vinculado mediante client_id + contact_id, con scoring dinámico.
-- ===================================================================

-- ============================================================
-- 1. AGREGAR COLUMNAS FALTANTES AL SCHEMA MODERNO DE LEADS
-- ============================================================

-- Columna de score numérico (reemplaza a lead_score para consistencia)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS score integer NOT NULL DEFAULT 0;

-- Fuente de captación del lead
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_source varchar(100);

-- Estado del lead en el pipeline comercial
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status varchar(50) NOT NULL DEFAULT 'NUEVO'
    CHECK (status IN ('NUEVO', 'EN_SEGUIMIENTO', 'CALIFICADO', 'RECHAZADO', 'CONVERTIDO'));

-- Ejecutivo Comercial asignado para seguimiento
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES users(id) ON DELETE SET NULL;

-- Notas del sistema o del ejecutivo comercial
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes text;

-- ============================================================
-- 2. HACER NULLABLE LAS COLUMNAS HEREDADAS (NO APLICAN AL NUEVO FLUJO)
-- El nuevo flujo guarda la info de contacto en client_contacts,
-- por lo que estas columnas del schema viejo pueden quedar nulas.
-- ============================================================
ALTER TABLE leads ALTER COLUMN name DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN company_name DROP NOT NULL;
ALTER TABLE leads ALTER COLUMN email DROP NOT NULL;

-- ============================================================
-- 3. ÍNDICES DE RENDIMIENTO PARA LAS NUEVAS COLUMNAS
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_risk_level ON leads(risk_level);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_user ON leads(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads(lead_source);

-- ============================================================
-- 4. POLÍTICA RLS: PERMITIR INSERTS DESDE EL WIZARD PÚBLICO
-- El Server Action usa supabaseAdmin (service_role) por lo que
-- salta el RLS. Esta política extra es de defensa en profundidad
-- para posibles llamadas desde el cliente via anon.
-- ============================================================

-- Permitir a usuarios autenticados del tenant ver sus leads
-- (Ya existe leads_all_tenant en Fase 11 — sólo agregamos la que faltaba para service_role)
-- El service_role ya saltea RLS nativamente en Supabase, sin necesidad de políticas adicionales.

-- ============================================================
-- 5. ACTUALIZAR DEFAULT DE LEAD_CODE (ya manejado por trigger existente)
-- ============================================================
-- Sin cambios necesarios, el trigger handle_website_sequences ya genera LED-XXXXXX

-- ============================================================
-- 6. GRANTS PARA PostgREST (por si el schema se recreó)
-- ============================================================
GRANT ALL ON leads TO service_role;
GRANT SELECT, INSERT, UPDATE ON leads TO authenticated;
GRANT ALL ON diagnostic_reports TO service_role;
GRANT SELECT ON diagnostic_reports TO authenticated;
GRANT ALL ON clients TO service_role;
GRANT SELECT, INSERT, UPDATE ON clients TO authenticated;
GRANT ALL ON client_contacts TO service_role;
GRANT SELECT, INSERT, UPDATE ON client_contacts TO authenticated;
