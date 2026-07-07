-- MIGRACIÓN FASE 11: WEB PÚBLICA Y CATÁLOGO TÉCNICO (WEBSITE)
-- Archivo: supabase/migrations/20260617000011_website_core.sql

-- ==========================================
-- 1. Tablas del Módulo Web y Captación
-- ==========================================

-- A. Páginas del Sitio Web (website_pages)
CREATE TABLE website_pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    page_code varchar(50) NOT NULL,
    url_path varchar(250) NOT NULL,
    title varchar(200) NOT NULL,
    meta_description varchar(250),
    status varchar(50) NOT NULL DEFAULT 'ACTIVA' CHECK (status IN ('ACTIVA', 'INACTIVA')),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_page_code UNIQUE (tenant_id, page_code),
    CONSTRAINT unique_tenant_url_path UNIQUE (tenant_id, url_path)
);

-- B. Formularios de Captación (website_forms)
CREATE TABLE website_forms (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    form_code varchar(50) NOT NULL,
    name varchar(150) NOT NULL,
    form_type varchar(50) NOT NULL CHECK (form_type IN ('CONTACTO', 'WIZARD', 'DESCARGA', 'OTRO')),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_form_code UNIQUE (tenant_id, form_code)
);

-- C. Tabla de Leads (leads)
CREATE TABLE leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    lead_code varchar(50) NOT NULL,
    name varchar(100) NOT NULL,
    company_name varchar(100) NOT NULL,
    position varchar(150),
    phone varchar(50),
    email varchar(200) NOT NULL,
    city varchar(100),
    urgency varchar(50) NOT NULL DEFAULT 'media' CHECK (urgency IN ('baja', 'media', 'alta')),
    lead_score integer NOT NULL DEFAULT 0,
    risk_level varchar(50) NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('HOT', 'WARM', 'LOW', 'SPAM')),
    is_verified boolean NOT NULL DEFAULT false,

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_lead_code UNIQUE (tenant_id, lead_code)
);

-- D. Trazabilidad de Origen de Lead (lead_sources)
CREATE TABLE lead_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    utm_source varchar(100),
    utm_medium varchar(100),
    utm_campaign varchar(100),
    utm_content varchar(100),
    utm_term varchar(100),
    referrer_url text,
    ip_address varchar(100),
    created_at timestamp NOT NULL DEFAULT NOW()
);

-- E. Sesiones de Web Pública (website_sessions)
CREATE TABLE website_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    session_token varchar(250) NOT NULL,
    ip_address varchar(100),
    user_agent text,
    started_at timestamp NOT NULL DEFAULT NOW(),
    last_activity_at timestamp NOT NULL DEFAULT NOW(),

    CONSTRAINT unique_tenant_session_token UNIQUE (tenant_id, session_token)
);

-- F. Eventos Trackeados (website_events)
CREATE TABLE website_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    session_id uuid NOT NULL REFERENCES website_sessions(id) ON DELETE CASCADE,
    event_type varchar(100) NOT NULL CHECK (event_type IN ('PAGE_VIEW', 'FORM_SUBMIT', 'FILE_DOWNLOAD', 'CLICK', 'CUSTOM')),
    page_url text NOT NULL,
    event_data jsonb,
    created_at timestamp NOT NULL DEFAULT NOW()
);

-- G. Descargas de Fichas/PDFs (website_downloads)
CREATE TABLE website_downloads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    session_id uuid REFERENCES website_sessions(id) ON DELETE SET NULL,
    lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
    file_path text NOT NULL,
    downloaded_at timestamp NOT NULL DEFAULT NOW()
);

-- ==========================================
-- 2. Tablas del Módulo Catálogo Técnico
-- ==========================================

-- H. Categorías de Productos (product_categories)
CREATE TABLE product_categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    category_code varchar(50) NOT NULL,
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

    CONSTRAINT unique_tenant_category_code UNIQUE (tenant_id, category_code)
);

-- I. Familias de Productos (product_families)
CREATE TABLE product_families (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    category_id uuid NOT NULL REFERENCES product_categories(id) ON DELETE RESTRICT,
    family_code varchar(50) NOT NULL,
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

    CONSTRAINT unique_tenant_family_code UNIQUE (tenant_id, family_code)
);

-- J. Catálogo de Productos (products)
CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    family_id uuid NOT NULL REFERENCES product_families(id) ON DELETE RESTRICT,
    product_code varchar(50) NOT NULL,
    name varchar(250) NOT NULL,
    description text,
    status varchar(50) NOT NULL DEFAULT 'ACTIVO' CHECK (status IN ('ACTIVO', 'INACTIVO')),

    -- Trazabilidad y Soft Delete
    created_at timestamp NOT NULL DEFAULT NOW(),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_product_code UNIQUE (tenant_id, product_code)
);

-- K. Especificaciones Técnicas (product_specifications)
CREATE TABLE product_specifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    spec_name varchar(150) NOT NULL,
    spec_value text NOT NULL,

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
CREATE INDEX idx_website_pages_tenant ON website_pages(tenant_id);
CREATE INDEX idx_website_forms_tenant ON website_forms(tenant_id);
CREATE INDEX idx_leads_tenant ON leads(tenant_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_lead_sources_lead ON lead_sources(lead_id);
CREATE INDEX idx_website_sessions_token ON website_sessions(session_token);
CREATE INDEX idx_website_events_session ON website_events(session_id);
CREATE INDEX idx_website_downloads_lead ON website_downloads(lead_id);
CREATE INDEX idx_product_categories_tenant ON product_categories(tenant_id);
CREATE INDEX idx_product_families_category ON product_families(category_id);
CREATE INDEX idx_products_family ON products(family_id);
CREATE INDEX idx_product_specifications_product ON product_specifications(product_id);

-- ==========================================
-- 4. Trigger: Autogeneración de Códigos Correlativos
-- ==========================================
CREATE OR REPLACE FUNCTION handle_website_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'website_pages' THEN
        IF NEW.page_code IS NULL OR NEW.page_code = '' THEN
            NEW.page_code := 'PAG-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'WEBSITE_PAGE')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'website_forms' THEN
        IF NEW.form_code IS NULL OR NEW.form_code = '' THEN
            NEW.form_code := 'FRM-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'WEBSITE_FORM')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'leads' THEN
        IF NEW.lead_code IS NULL OR NEW.lead_code = '' THEN
            NEW.lead_code := 'LED-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'LEAD')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'product_categories' THEN
        IF NEW.category_code IS NULL OR NEW.category_code = '' THEN
            NEW.category_code := 'CAT-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'PRODUCT_CATEGORY')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'product_families' THEN
        IF NEW.family_code IS NULL OR NEW.family_code = '' THEN
            NEW.family_code := 'FAM-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'PRODUCT_FAMILY')::text, 6, '0');
        END IF;
    ELSIF TG_TABLE_NAME = 'products' THEN
        IF NEW.product_code IS NULL OR NEW.product_code = '' THEN
            NEW.product_code := 'PRO-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'PRODUCT')::text, 6, '0');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_page_code BEFORE INSERT ON website_pages FOR EACH ROW EXECUTE FUNCTION handle_website_sequences();
CREATE TRIGGER trg_handle_form_code BEFORE INSERT ON website_forms FOR EACH ROW EXECUTE FUNCTION handle_website_sequences();
CREATE TRIGGER trg_handle_lead_code BEFORE INSERT ON leads FOR EACH ROW EXECUTE FUNCTION handle_website_sequences();
CREATE TRIGGER trg_handle_category_code BEFORE INSERT ON product_categories FOR EACH ROW EXECUTE FUNCTION handle_website_sequences();
CREATE TRIGGER trg_handle_family_code BEFORE INSERT ON product_families FOR EACH ROW EXECUTE FUNCTION handle_website_sequences();
CREATE TRIGGER trg_handle_product_code BEFORE INSERT ON products FOR EACH ROW EXECUTE FUNCTION handle_website_sequences();

-- ==========================================
-- 5. Trigger: Bloqueo de Borrado Físico (Soft Delete Obligatorio)
-- ==========================================
CREATE OR REPLACE FUNCTION block_physical_website_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Los datos del sitio web y catálogo son inmutables. Utilice soft delete.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_page_delete BEFORE DELETE ON website_pages FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_form_delete BEFORE DELETE ON website_forms FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_lead_delete BEFORE DELETE ON leads FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_category_delete BEFORE DELETE ON product_categories FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_family_delete BEFORE DELETE ON product_families FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_product_delete BEFORE DELETE ON products FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();
CREATE TRIGGER trg_block_specification_delete BEFORE DELETE ON product_specifications FOR EACH ROW EXECUTE FUNCTION block_physical_website_delete();

-- ==========================================
-- 6. Triggers: Trazabilidad General
-- ==========================================
CREATE TRIGGER trg_page_traceability BEFORE INSERT OR UPDATE ON website_pages FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_form_traceability BEFORE INSERT OR UPDATE ON website_forms FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_lead_traceability BEFORE INSERT OR UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_category_traceability BEFORE INSERT OR UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_family_traceability BEFORE INSERT OR UPDATE ON product_families FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_product_traceability BEFORE INSERT OR UPDATE ON products FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();
CREATE TRIGGER trg_specification_traceability BEFORE INSERT OR UPDATE ON product_specifications FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- ==========================================
-- 7. Triggers: Integración con Auditoría General
-- ==========================================
CREATE TRIGGER audit_website_pages AFTER INSERT OR UPDATE OR DELETE ON website_pages FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_website_forms AFTER INSERT OR UPDATE OR DELETE ON website_forms FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_leads AFTER INSERT OR UPDATE OR DELETE ON leads FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_categories AFTER INSERT OR UPDATE OR DELETE ON product_categories FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_families AFTER INSERT OR UPDATE OR DELETE ON product_families FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE FUNCTION process_audit_log();
CREATE TRIGGER audit_product_specifications AFTER INSERT OR UPDATE OR DELETE ON product_specifications FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ==========================================
-- 8. Habilitar Row Level Security (RLS)
-- ==========================================
ALTER TABLE website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 9. Políticas de Seguridad RLS
-- ==========================================

-- Función auxiliar para obtener tenant_id del usuario autenticado
-- Reutilizable en todas las políticas

CREATE POLICY pages_select_tenant ON website_pages FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);
CREATE POLICY pages_write_tenant ON website_pages FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Formularios
CREATE POLICY forms_select_tenant ON website_forms FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (deleted_at IS NULL)
);
CREATE POLICY forms_write_tenant ON website_forms FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Leads
CREATE POLICY leads_select_tenant ON leads FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (deleted_at IS NULL)
);
CREATE POLICY leads_write_tenant ON leads FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Lead Sources
CREATE POLICY lead_sources_all_tenant ON lead_sources FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Sessions
CREATE POLICY sessions_all_tenant ON website_sessions FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Events
CREATE POLICY events_all_tenant ON website_events FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Downloads
CREATE POLICY downloads_all_tenant ON website_downloads FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Categorías
CREATE POLICY categories_select_tenant ON product_categories FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (deleted_at IS NULL)
);
CREATE POLICY categories_write_tenant ON product_categories FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Familias
CREATE POLICY families_select_tenant ON product_families FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (deleted_at IS NULL)
);
CREATE POLICY families_write_tenant ON product_families FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Productos
CREATE POLICY products_select_tenant ON products FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (deleted_at IS NULL)
);
CREATE POLICY products_write_tenant ON products FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Especificaciones
CREATE POLICY specifications_select_tenant ON product_specifications FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (deleted_at IS NULL)
);
CREATE POLICY specifications_write_tenant ON product_specifications FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);
