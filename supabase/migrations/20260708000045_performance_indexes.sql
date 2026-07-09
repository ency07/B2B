-- MIGRACIÓN: Índices de rendimiento para columnas de filtrado frecuente
-- Archivo: supabase/migrations/20260708000045_performance_indexes.sql
--
-- requirements.status: usado en SLA bar, queue y filtros de listado
-- audit_log.created_at: usado en reportes de auditoría ordenados por tiempo
-- quotes.status: filtros de pipeline comercial
-- jobs.status: cola de operaciones y filtros de taller

CREATE INDEX IF NOT EXISTS idx_requirements_tenant_status
  ON requirements(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_created
  ON audit_log(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_quotes_tenant_status
  ON quotes(tenant_id, status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_tenant_status
  ON jobs(tenant_id, status)
  WHERE deleted_at IS NULL;
