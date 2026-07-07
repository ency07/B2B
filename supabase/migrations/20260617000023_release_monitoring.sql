-- FASE 23: Release / Producción (Go-Live)
-- Archivo: supabase/migrations/20260617000023_release_monitoring.sql

-- 1. Habilitación de RLS para tenant_sequences (Mitigación de seguridad pendiente)
ALTER TABLE tenant_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_sequences_super_admin ON tenant_sequences
    FOR ALL
    USING (is_platform_super_admin());

CREATE POLICY tenant_sequences_tenant_isolation ON tenant_sequences
    FOR ALL
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);


-- 2. Creación de la vista para monitoreo de consultas lentas (pg_stat_statements)
-- Esta vista ayuda a los administradores a identificar cuellos de botella de rendimiento
CREATE OR REPLACE VIEW public.performance_queries_summary WITH (security_invoker = true) AS
SELECT 
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    rows
FROM 
    extensions.pg_stat_statements;
