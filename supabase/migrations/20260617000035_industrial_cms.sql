-- MIGRACIÓN FASE 35: CMS INDUSTRIAL, CATÁLOGO Y CONFIGURADOR INTERACTIVO
-- Archivo: supabase/migrations/20260617000035_industrial_cms.sql

-- ============================================================
-- 1. TRADUCCIÓN DE ESTADOS DE RIESGO DE LEADS A ESPAÑOL
-- ============================================================
-- Eliminar la restricción de validación original en inglés
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_risk_level_check;

-- Actualizar filas existentes si hubiere (por consistencia)
UPDATE leads SET risk_level = 'FRIO' WHERE risk_level IN ('LOW', 'WARM', 'HOT');

-- Cambiar el default a español
ALTER TABLE leads ALTER COLUMN risk_level SET DEFAULT 'FRIO';

-- Agregar la nueva restricción con los términos en español
ALTER TABLE leads ADD CONSTRAINT check_risk_level CHECK (risk_level IN ('CALIENTE', 'TIBIO', 'FRIO', 'SPAM'));

-- ============================================================
-- 2. JERARQUÍA DE CATÁLOGO INDUSTRIAL DE PRODUCTOS
-- ============================================================

-- A. Subcategorías (product_subcategories)
CREATE TABLE product_subcategories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    category_id uuid NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
    subcategory_code varchar(50) NOT NULL,
    name varchar(150) NOT NULL,
    description text,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_subcategory_code UNIQUE (tenant_id, subcategory_code)
);

-- Alterar Familias de Productos para apuntar a Subcategorías
ALTER TABLE product_families ADD COLUMN subcategory_id uuid REFERENCES product_subcategories(id) ON DELETE RESTRICT;
ALTER TABLE product_families ALTER COLUMN category_id DROP NOT NULL;

-- B. Series de Productos (product_series)
CREATE TABLE product_series (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    family_id uuid NOT NULL REFERENCES product_families(id) ON DELETE RESTRICT,
    series_code varchar(50) NOT NULL,
    name varchar(150) NOT NULL,
    description text,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_series_code UNIQUE (tenant_id, series_code)
);

-- Alterar Productos para apuntar a Series en lugar de Familias
ALTER TABLE products ADD COLUMN series_id uuid REFERENCES product_series(id) ON DELETE RESTRICT;
ALTER TABLE products ALTER COLUMN family_id DROP NOT NULL;

-- ============================================================
-- 3. MEDIA MANAGER (GESTOR CENTRALIZADO DE MULTIMEDIA Y ARCHIVOS)
-- ============================================================

-- C. Media Assets (media_assets)
CREATE TABLE media_assets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    file_name varchar(250) NOT NULL,
    file_path varchar(500) NOT NULL,
    file_size integer NOT NULL,
    mime_type varchar(100) NOT NULL,
    alt_text varchar(250),
    usage_count integer NOT NULL DEFAULT 0,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_file_path UNIQUE (tenant_id, file_path)
);

-- D. Relación de Imágenes de Productos (product_images)
CREATE TABLE product_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
    sort_order integer NOT NULL DEFAULT 0,
    is_cover boolean NOT NULL DEFAULT false,
    image_type varchar(50) NOT NULL DEFAULT 'FOTO' CHECK (image_type IN ('FOTO', 'RENDER', 'PLANO')),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

-- E. Relación de Documentos Técnicos (product_documents)
CREATE TABLE product_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
    document_type varchar(50) NOT NULL DEFAULT 'FICHA_TECNICA' CHECK (document_type IN ('FICHA_TECNICA', 'MANUAL', 'CERTIFICADO', 'CATALOGO')),
    language varchar(10) NOT NULL DEFAULT 'es',
    version varchar(20) NOT NULL DEFAULT '1.0',

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

-- F. Relación de Archivos de Ingeniería y CAD (product_files)
CREATE TABLE product_files (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    media_asset_id uuid NOT NULL REFERENCES media_assets(id) ON DELETE RESTRICT,
    file_type varchar(50) NOT NULL DEFAULT 'CAD' CHECK (file_type IN ('CAD', 'DWG', 'DXF', 'STEP', 'IGES')),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

-- G. Relación de Videos de Productos (product_videos)
CREATE TABLE product_videos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    video_url varchar(500) NOT NULL,
    video_type varchar(50) NOT NULL DEFAULT 'YOUTUBE' CHECK (video_type IN ('YOUTUBE', 'VIMEO', 'STORAGE')),
    sort_order integer NOT NULL DEFAULT 0,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text
);

-- ============================================================
-- 4. SEO MANAGER (GESTOR CENTRALIZADO DE METADATOS)
-- ============================================================

-- H. Tabla de Metadatos SEO (seo_metadata)
CREATE TABLE seo_metadata (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    entity_type varchar(50) NOT NULL CHECK (entity_type IN ('PAGE', 'PRODUCT')),
    entity_id uuid NOT NULL,
    slug varchar(250) NOT NULL,
    meta_title varchar(250),
    meta_description text,
    meta_keywords varchar(250),
    canonical_url varchar(250),
    og_title varchar(250),
    og_description text,
    og_image_url varchar(500),
    robots_directives varchar(100) DEFAULT 'index, follow',
    schema_markup jsonb DEFAULT '{}'::jsonb,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_entity_seo UNIQUE (tenant_id, entity_type, entity_id),
    CONSTRAINT unique_tenant_slug UNIQUE (tenant_id, slug)
);

-- ============================================================
-- 5. FORM BUILDER (CONFIGURADOR DINÁMICO DE FORMULARIOS)
-- ============================================================

-- I. Campos de Formularios de Captación (website_form_fields)
CREATE TABLE website_form_fields (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    form_id uuid NOT NULL REFERENCES website_forms(id) ON DELETE CASCADE,
    field_key varchar(50) NOT NULL,
    field_name varchar(150) NOT NULL,
    field_type varchar(50) NOT NULL CHECK (field_type IN ('TEXT', 'NUMBER', 'DATE', 'LIST', 'FILE', 'BOOLEAN')),
    is_required boolean NOT NULL DEFAULT false,
    sort_order integer NOT NULL DEFAULT 0,
    options jsonb DEFAULT '[]'::jsonb,
    validation_rules jsonb DEFAULT '{}'::jsonb,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_form_field UNIQUE (tenant_id, form_id, field_key)
);

-- ============================================================
-- 6. SERVICIOS CORPORATIVOS
-- ============================================================

-- J. Servicios de la Compañía (company_services)
CREATE TABLE company_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    service_code varchar(50) NOT NULL,
    name varchar(150) NOT NULL,
    description text NOT NULL,
    icon_name varchar(50),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_service_code UNIQUE (tenant_id, service_code)
);

-- ============================================================
-- 7. ÍNDICES DE RENDIMIENTO Y HARDENING
-- ============================================================
CREATE INDEX idx_product_subcategories_cat ON product_subcategories(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_families_subcat ON product_families(subcategory_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_series_fam ON product_series(family_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_products_series ON products(series_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_media_assets_tenant ON media_assets(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_images_prod ON product_images(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_documents_prod ON product_documents(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_files_prod ON product_files(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_product_videos_prod ON product_videos(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_seo_metadata_entity ON seo_metadata(tenant_id, entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_seo_metadata_slug ON seo_metadata(tenant_id, slug) WHERE deleted_at IS NULL;
CREATE INDEX idx_website_form_fields_form ON website_form_fields(form_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_company_services_tenant ON company_services(tenant_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 8. TRIGGERS: SECUENCIAS CORRELATIVAS AUTOMÁTICAS
-- ============================================================
CREATE OR REPLACE FUNCTION handle_cms_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'product_subcategories' THEN
        IF NEW.subcategory_code IS NULL OR NEW.subcategory_code = '' THEN
            NEW.subcategory_code := 'SBC-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'PRODUCT_SUBCATEGORY')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'product_series' THEN
        IF NEW.series_code IS NULL OR NEW.series_code = '' THEN
            NEW.series_code := 'SER-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'PRODUCT_SERIES')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'media_assets' THEN
        -- No requiere código secuencial público, se maneja por UUID y path
    ELSIF TG_TABLE_NAME = 'company_services' THEN
        IF NEW.service_code IS NULL OR NEW.service_code = '' THEN
            NEW.service_code := 'SRV-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'COMPANY_SERVICE')::text, 6, '0');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_subcat_code BEFORE INSERT ON product_subcategories FOR EACH ROW EXECUTE FUNCTION handle_cms_sequences();
CREATE TRIGGER trg_handle_series_code BEFORE INSERT ON product_series FOR EACH ROW EXECUTE FUNCTION handle_cms_sequences();
CREATE TRIGGER trg_handle_company_service_code BEFORE INSERT ON company_services FOR EACH ROW EXECUTE FUNCTION handle_cms_sequences();

-- ============================================================
-- 9. TRIGGERS: PREVENCIÓN DE BORRADO FÍSICO (SOFT-DELETE)
-- ============================================================
CREATE TRIGGER trg_block_subcat_delete BEFORE DELETE ON product_subcategories FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_series_delete BEFORE DELETE ON product_series FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_media_delete BEFORE DELETE ON media_assets FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_prod_img_delete BEFORE DELETE ON product_images FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_prod_doc_delete BEFORE DELETE ON product_documents FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_prod_file_delete BEFORE DELETE ON product_files FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_prod_vid_delete BEFORE DELETE ON product_videos FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_seo_delete BEFORE DELETE ON seo_metadata FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_form_field_delete BEFORE DELETE ON website_form_fields FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_company_service_delete BEFORE DELETE ON company_services FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();

-- ============================================================
-- 10. TRIGGERS: TRAZABILIDAD Y AUDITORÍA GENERAL
-- ============================================================
CREATE TRIGGER trg_subcat_traceability BEFORE INSERT OR UPDATE ON product_subcategories FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_series_traceability BEFORE INSERT OR UPDATE ON product_series FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_media_traceability BEFORE INSERT OR UPDATE ON media_assets FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_prod_img_traceability BEFORE INSERT OR UPDATE ON product_images FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_prod_doc_traceability BEFORE INSERT OR UPDATE ON product_documents FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_prod_file_traceability BEFORE INSERT OR UPDATE ON product_files FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_prod_vid_traceability BEFORE INSERT OR UPDATE ON product_videos FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_seo_traceability BEFORE INSERT OR UPDATE ON seo_metadata FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_form_field_traceability BEFORE INSERT OR UPDATE ON website_form_fields FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_company_service_traceability BEFORE INSERT OR UPDATE ON company_services FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

CREATE TRIGGER audit_product_subcategories AFTER INSERT OR UPDATE OR DELETE ON product_subcategories FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_series AFTER INSERT OR UPDATE OR DELETE ON product_series FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_media_assets AFTER INSERT OR UPDATE OR DELETE ON media_assets FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_images AFTER INSERT OR UPDATE OR DELETE ON product_images FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_documents AFTER INSERT OR UPDATE OR DELETE ON product_documents FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_files AFTER INSERT OR UPDATE OR DELETE ON product_files FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_videos AFTER INSERT OR UPDATE OR DELETE ON product_videos FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_seo_metadata AFTER INSERT OR UPDATE OR DELETE ON seo_metadata FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_website_form_fields AFTER INSERT OR UPDATE OR DELETE ON website_form_fields FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_company_services AFTER INSERT OR UPDATE OR DELETE ON company_services FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ============================================================
-- 11. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE product_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_services ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. POLÍTICAS RLS (AISLAMIENTO MULTI-TENANT POR tenant_id)
-- ============================================================

-- Subcategorías
CREATE POLICY subcat_select_tenant ON product_subcategories FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY subcat_write_tenant ON product_subcategories FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Series
CREATE POLICY series_select_tenant ON product_series FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY series_write_tenant ON product_series FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Media Assets
CREATE POLICY media_select_tenant ON media_assets FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY media_write_tenant ON media_assets FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Imágenes de Productos
CREATE POLICY prod_img_select_tenant ON product_images FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY prod_img_write_tenant ON product_images FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Documentos de Productos
CREATE POLICY prod_doc_select_tenant ON product_documents FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY prod_doc_write_tenant ON product_documents FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Archivos CAD de Productos
CREATE POLICY prod_file_select_tenant ON product_files FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY prod_file_write_tenant ON product_files FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Videos de Productos
CREATE POLICY prod_vid_select_tenant ON product_videos FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY prod_vid_write_tenant ON product_videos FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- SEO Metadata
CREATE POLICY seo_select_tenant ON seo_metadata FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY seo_write_tenant ON seo_metadata FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Campos de Formularios
CREATE POLICY form_fields_select_tenant ON website_form_fields FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY form_fields_write_tenant ON website_form_fields FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Servicios
CREATE POLICY company_services_select_tenant ON company_services FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND deleted_at IS NULL
);
CREATE POLICY company_services_write_tenant ON company_services FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- ============================================================
-- 13. BYPASS PARA POSTGRES SUPER ADMIN EN MIGRACIONES Y SEED
-- ============================================================
CREATE POLICY subcat_super_admin ON product_subcategories FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY series_super_admin ON product_series FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY media_super_admin ON media_assets FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY prod_img_super_admin ON product_images FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY prod_doc_super_admin ON product_documents FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY prod_file_super_admin ON product_files FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY prod_vid_super_admin ON product_videos FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY seo_super_admin ON seo_metadata FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY form_fields_super_admin ON website_form_fields FOR ALL TO authenticated USING (is_platform_super_admin());
CREATE POLICY company_services_super_admin ON company_services FOR ALL TO authenticated USING (is_platform_super_admin());
