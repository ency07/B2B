-- MIGRACIÓN FASE 38: POLÍTICAS RLS PARA ACCESO ANÓNIMO (SITIO PÚBLICO)
-- Archivo: supabase/migrations/20260621000038_public_rls_policies.sql
--
-- Propósito: Agregar políticas de Row Level Security para usuarios anónimos
-- en las tablas que necesita el sitio web público (landing, wizard, catálogo).
-- Esto permite que el código pueda migrar de service_role a anon key,
-- proporcionando defensa en profundidad.
--
-- Las políticas existentes solo cubren usuarios autenticados (ERP dashboard).
-- Estas nuevas políticas cubren el acceso anónimo requerido por:
--   - Landing page (branding público, catálogo)
--   - Wizard de preingeniería (leads, diagnostic_reports, clients)
--   - Catálogo industrial público (productos, categorías, familias, series)

-- ==========================================
-- 1. Políticas para Catálogo Industrial Público
-- ==========================================

-- Categorías: lectura anónima
DROP POLICY IF EXISTS categories_select_anon ON product_categories;
CREATE POLICY categories_select_anon ON product_categories
    FOR SELECT TO anon
    USING (deleted_at IS NULL);

-- Subcategorías: lectura anónima
DROP POLICY IF EXISTS subcategories_select_anon ON product_subcategories;
CREATE POLICY subcategories_select_anon ON product_subcategories
    FOR SELECT TO anon
    USING (deleted_at IS NULL);

-- Familias: lectura anónima
DROP POLICY IF EXISTS families_select_anon ON product_families;
CREATE POLICY families_select_anon ON product_families
    FOR SELECT TO anon
    USING (deleted_at IS NULL);

-- Series: lectura anónima
DROP POLICY IF EXISTS series_select_anon ON product_series;
CREATE POLICY series_select_anon ON product_series
    FOR SELECT TO anon
    USING (deleted_at IS NULL);

-- Productos: lectura anónima
DROP POLICY IF EXISTS products_select_anon ON products;
CREATE POLICY products_select_anon ON products
    FOR SELECT TO anon
    USING (status = 'ACTIVO' AND deleted_at IS NULL);

-- Especificaciones: lectura anónima
DROP POLICY IF EXISTS specifications_select_anon ON product_specifications;
CREATE POLICY specifications_select_anon ON product_specifications
    FOR SELECT TO anon
    USING (true);

-- Imágenes de producto: lectura anónima
DROP POLICY IF EXISTS product_images_select_anon ON product_images;
CREATE POLICY product_images_select_anon ON product_images
    FOR SELECT TO anon
    USING (true);

-- Documentos de producto: lectura anónima
DROP POLICY IF EXISTS product_documents_select_anon ON product_documents;
CREATE POLICY product_documents_select_anon ON product_documents
    FOR SELECT TO anon
    USING (true);

-- Archivos CAD: lectura anónima
DROP POLICY IF EXISTS product_files_select_anon ON product_files;
CREATE POLICY product_files_select_anon ON product_files
    FOR SELECT TO anon
    USING (true);

-- Media assets: lectura anónima
DROP POLICY IF EXISTS media_assets_select_anon ON media_assets;
CREATE POLICY media_assets_select_anon ON media_assets
    FOR SELECT TO anon
    USING (true);

-- SEO metadata: lectura anónima
DROP POLICY IF EXISTS seo_metadata_select_anon ON seo_metadata;
CREATE POLICY seo_metadata_select_anon ON seo_metadata
    FOR SELECT TO anon
    USING (entity_type = 'PRODUCT' AND deleted_at IS NULL);

-- ==========================================
-- 2. Políticas para Branding Público (tenant_settings)
-- ==========================================

-- Las configuraciones públicas del tenant son legibles por anónimos
DROP POLICY IF EXISTS tenant_settings_read_anon ON tenant_settings;
CREATE POLICY tenant_settings_read_anon ON tenant_settings
    FOR SELECT TO anon
    USING (is_public = true);

-- ==========================================
-- 3. Políticas para Wizard y Captación de Leads
-- ==========================================

-- Leads: inserción anónima desde el wizard/contacto
DROP POLICY IF EXISTS leads_insert_anon ON leads;
CREATE POLICY leads_insert_anon ON leads
    FOR INSERT TO anon
    WITH CHECK (true);

-- Reportes de diagnóstico: inserción anónima desde el wizard
DROP POLICY IF EXISTS diagnostic_reports_insert_anon ON diagnostic_reports;
CREATE POLICY diagnostic_reports_insert_anon ON diagnostic_reports
    FOR INSERT TO anon
    WITH CHECK (true);

-- Sesiones de wizard: inserción anónima
DROP POLICY IF EXISTS wizard_sessions_insert_anon ON wizard_sessions;
CREATE POLICY wizard_sessions_insert_anon ON wizard_sessions
    FOR INSERT TO anon
    WITH CHECK (true);

-- Contactos de formularios: inserción anónima
DROP POLICY IF EXISTS lead_sources_insert_anon ON lead_sources;
CREATE POLICY lead_sources_insert_anon ON lead_sources
    FOR INSERT TO anon
    WITH CHECK (true);

-- ==========================================
-- 4. Políticas para Website Pages Públicas
-- ==========================================

DROP POLICY IF EXISTS pages_select_anon ON website_pages;
CREATE POLICY pages_select_anon ON website_pages
    FOR SELECT TO anon
    USING (status = 'ACTIVA' AND deleted_at IS NULL);

-- ==========================================
-- 5. Políticas para Clientes y Contactos (Wizard)
-- ==========================================

-- Clientes: inserción anónima desde el wizard
DROP POLICY IF EXISTS clients_insert_anon ON clients;
CREATE POLICY clients_insert_anon ON clients
    FOR INSERT TO anon
    WITH CHECK (true);

-- Clientes: lectura anónima limitada (solo wizard upsert)
DROP POLICY IF EXISTS clients_select_anon ON clients;
CREATE POLICY clients_select_anon ON clients
    FOR SELECT TO anon
    USING (deleted_at IS NULL);

-- Contactos de clientes: inserción anónima desde el wizard
DROP POLICY IF EXISTS client_contacts_insert_anon ON client_contacts;
CREATE POLICY client_contacts_insert_anon ON client_contacts
    FOR INSERT TO anon
    WITH CHECK (true);

-- Contactos de clientes: lectura anónima limitada
DROP POLICY IF EXISTS client_contacts_select_anon ON client_contacts;
CREATE POLICY client_contacts_select_anon ON client_contacts
    FOR SELECT TO anon
    USING (deleted_at IS NULL);

-- ==========================================
-- 6. Políticas para Tenants y Diagnósticos
-- ==========================================

-- Tenants: lectura anónima limitada (solo status para validación del wizard)
DROP POLICY IF EXISTS tenants_select_anon ON tenants;
CREATE POLICY tenants_select_anon ON tenants
    FOR SELECT TO anon
    USING (status = 'Activo' AND deleted_at IS NULL);

-- Reportes de diagnóstico: lectura anónima (para leer el insert recién creado)
DROP POLICY IF EXISTS diagnostic_reports_select_anon ON diagnostic_reports;
CREATE POLICY diagnostic_reports_select_anon ON diagnostic_reports
    FOR SELECT TO anon
    USING (true);
