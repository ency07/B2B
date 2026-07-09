-- =============================================================================
-- FIX: lead_sources_insert_anon — policy WITH CHECK(true) sin restricción
-- La migración 46_security_fixes corrigió leads, clients, client_contacts,
-- diagnostic_reports y wizard_sessions, pero omitió lead_sources.
-- Cualquier usuario anónimo podía insertar lead_sources para cualquier tenant.
-- =============================================================================

-- Eliminar la policy peligrosa existente
DROP POLICY IF EXISTS lead_sources_insert_anon ON lead_sources;

-- Recrear con la misma restricción que las demás tablas públicas corregidas en mig.46
CREATE POLICY lead_sources_insert_anon ON lead_sources
    FOR INSERT
    TO anon
    WITH CHECK (public.is_active_tenant(tenant_id));
