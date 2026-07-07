-- MIGRACIÓN FASE 21: HARDENING / RENDIMIENTO DE BASE DE DATOS
-- Archivo: supabase/migrations/20260617000021_performance_hardening.sql

-- 1. Capa Core y Usuarios
CREATE INDEX idx_users_site_id ON users(site_id);
CREATE INDEX idx_users_area_id ON users(area_id);
CREATE INDEX idx_users_manager_id ON users(manager_id);

-- 2. Capa de Requerimientos y Documentos
CREATE INDEX idx_requirements_contact_id ON requirements(contact_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_requirements_created_by ON requirements(created_by) WHERE deleted_at IS NULL;

-- 3. Capa de Cotizaciones
CREATE INDEX idx_quotes_created_by ON quotes(created_by) WHERE deleted_at IS NULL;

-- 4. Capa de Trabajos (Jobs)
CREATE INDEX idx_jobs_assigned_user_id ON jobs(assigned_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_created_by ON jobs(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_quote_id ON jobs(quote_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_activities_assigned ON job_activities(assigned_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_job_activities_created_by ON job_activities(created_by) WHERE deleted_at IS NULL;

-- 5. Capa de Inventarios
CREATE INDEX idx_inventory_movements_item ON inventory_movements(item_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_movements_warehouse ON inventory_movements(warehouse_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_movements_source ON inventory_movements(source_warehouse_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_movements_destination ON inventory_movements(destination_warehouse_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_inventory_movements_created_by ON inventory_movements(created_by) WHERE deleted_at IS NULL;

-- 6. Capa de Facturación y Pagos
CREATE INDEX idx_invoices_quote_id ON invoices(quote_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_job_id ON invoices(job_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_created_by ON invoices(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_created_by ON payments(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_customer_advances_created_by ON customer_advances(created_by) WHERE deleted_at IS NULL;

-- 7. Capa de Garantías (Garantías e Intervenciones)
CREATE INDEX idx_warranties_created_by ON warranties(created_by) WHERE deleted_at IS NULL;
CREATE INDEX idx_warranty_interventions_assigned ON warranty_interventions(assigned_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_warranty_interventions_created_by ON warranty_interventions(created_by) WHERE deleted_at IS NULL;

-- 8. Capa de Configuración, Notificaciones y Logs
CREATE INDEX idx_notifications_template_partial ON notifications(template_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notifications_created_by ON notifications(created_by) WHERE deleted_at IS NULL;

