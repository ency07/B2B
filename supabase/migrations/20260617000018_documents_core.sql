-- MIGRACIÓN FASE 18: MOTOR DE DOCUMENTOS Y PLANTILLAS
-- Archivo: supabase/migrations/20260617000018_documents_core.sql
--
-- REUSE_ANALYSIS_FASE18 cumplido:
--   Editor Visual  → GrapesJS    (BSD-3,   25.9k stars) — almacenado en template_html
--   Motor Plantilla → Handlebars.js (MIT, 18.6k stars) — sintaxis {{variable}}
--   PDF            → Puppeteer   (Apache 2.0, 95k stars)
--   DOCX           → Docxtemplater (MIT, 3.6k stars)
--   replace('{{variable}}') PROHIBIDO — D18-07 (REUSE_ANALYSIS_FASE18.md)

-- ============================================================
-- 1. TABLA: document_templates
--    Almacena plantillas HTML (output de GrapesJS) por tenant
-- ============================================================
CREATE TABLE document_templates (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,

    -- Identificación
    template_code   varchar(50) NOT NULL,           -- TPL-000001
    name            varchar(200) NOT NULL,
    description     text,

    -- Tipo de documento que genera esta plantilla
    document_type   varchar(100) NOT NULL CHECK (document_type IN (
        'FACTURA',          -- Factura de venta
        'COTIZACION',       -- Cotización / presupuesto
        'ORDEN_TRABAJO',    -- Orden de trabajo
        'CONTRATO',         -- Contrato de servicio
        'GARANTIA',         -- Certificado de garantía
        'RECIBO_PAGO',      -- Recibo de pago
        'INFORME',          -- Informe gerencial
        'OTRO'              -- Documento genérico
    )),

    -- Formato de salida que soporta esta plantilla
    output_format   varchar(20) NOT NULL DEFAULT 'PDF' CHECK (output_format IN (
        'PDF',              -- Puppeteer: HTML → PDF
        'DOCX',             -- Docxtemplater: .docx template → DOCX
        'AMBOS'             -- Puede generar PDF y DOCX
    )),

    -- Contenido HTML de la plantilla (output de GrapesJS)
    -- Variables en sintaxis Handlebars: {{cliente.nombre}}, {{#each items}}
    template_html   text,

    -- Referencia al archivo .docx base en storage (para Docxtemplater)
    docx_template_storage_path  varchar(500),

    -- Variables disponibles documentadas en JSON
    -- Ej: {"cliente.nombre":"string","total":"number","items":"array"}
    variables_schema    jsonb DEFAULT '{}',

    -- Versión y estado
    version     integer NOT NULL DEFAULT 1,
    is_default  boolean NOT NULL DEFAULT false,     -- Plantilla predeterminada para este tipo
    active      boolean NOT NULL DEFAULT true,

    -- Trazabilidad y Soft Delete
    created_at  timestamp NOT NULL DEFAULT NOW(),
    created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at  timestamp,
    updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at  timestamp,
    deleted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_template_code UNIQUE (tenant_id, template_code),
    CONSTRAINT chk_template_content CHECK (
        template_html IS NOT NULL OR docx_template_storage_path IS NOT NULL
    )
);

-- ============================================================
-- 2. TABLA: document_outputs
--    Historial de documentos generados por tenant
-- ============================================================
CREATE TABLE document_outputs (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,

    -- Identificación del output
    output_code     varchar(50) NOT NULL,           -- DOC-000001
    template_id     uuid NOT NULL REFERENCES document_templates(id) ON DELETE RESTRICT,

    -- Tipo y formato efectivo del documento generado
    document_type   varchar(100) NOT NULL,
    output_format   varchar(20) NOT NULL CHECK (output_format IN ('PDF', 'DOCX')),

    -- Referencia al registro fuente del ERP (polimórfico)
    source_entity   varchar(100),   -- 'invoice', 'job', 'lead', 'warranty', etc.
    source_id       uuid,           -- id del registro fuente

    -- Datos del ERP inyectados en la plantilla (snapshot en el momento de generación)
    -- Manejados por Handlebars.js en la capa de aplicación
    template_data   jsonb DEFAULT '{}',

    -- Resultado de la generación
    status          varchar(50) NOT NULL DEFAULT 'PENDIENTE' CHECK (status IN (
        'PENDIENTE',        -- En cola de generación
        'GENERANDO',        -- Puppeteer/Docxtemplater procesando
        'COMPLETADO',       -- Archivo generado exitosamente
        'ERROR',            -- Falló la generación
        'ANULADO'           -- Anulado manualmente
    )),

    -- Ubicación del archivo generado en storage
    storage_path        varchar(500),
    file_size_bytes     bigint,
    generation_ms       integer,    -- Tiempo de generación en milisegundos

    -- Metadatos del documento generado
    document_title      varchar(300),
    document_number     varchar(100),   -- Ej: FAC-000123, COT-000045
    generated_at        timestamp,

    -- Mensaje de error si status = 'ERROR'
    error_message       text,

    -- Trazabilidad y Soft Delete
    created_at  timestamp NOT NULL DEFAULT NOW(),
    created_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    updated_at  timestamp,
    updated_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at  timestamp,
    deleted_by  uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_output_code UNIQUE (tenant_id, output_code)
);

-- ============================================================
-- 3. ÍNDICES DE RENDIMIENTO
-- ============================================================
CREATE INDEX idx_doc_templates_tenant      ON document_templates(tenant_id);
CREATE INDEX idx_doc_templates_type        ON document_templates(document_type);
CREATE INDEX idx_doc_templates_active      ON document_templates(active);
CREATE INDEX idx_doc_templates_is_default  ON document_templates(is_default);

CREATE INDEX idx_doc_outputs_tenant        ON document_outputs(tenant_id);
CREATE INDEX idx_doc_outputs_template      ON document_outputs(template_id);
CREATE INDEX idx_doc_outputs_source        ON document_outputs(source_entity, source_id);
CREATE INDEX idx_doc_outputs_status        ON document_outputs(status);
CREATE INDEX idx_doc_outputs_type          ON document_outputs(document_type);
CREATE INDEX idx_doc_outputs_generated_at  ON document_outputs(generated_at DESC);

-- ============================================================
-- 4. TRIGGER: Autogeneración de Códigos Correlativos
-- ============================================================
CREATE OR REPLACE FUNCTION handle_document_sequences()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'document_templates' THEN
        IF NEW.template_code IS NULL OR NEW.template_code = '' THEN
            NEW.template_code := 'TPL-' || LPAD(
                get_next_tenant_sequence(NEW.tenant_id, 'DOCUMENT_TEMPLATE')::text, 6, '0'
            );
        END IF;

    ELSIF TG_TABLE_NAME = 'document_outputs' THEN
        IF NEW.output_code IS NULL OR NEW.output_code = '' THEN
            NEW.output_code := 'DOC-' || LPAD(
                get_next_tenant_sequence(NEW.tenant_id, 'DOCUMENT_OUTPUT')::text, 6, '0'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_template_code
BEFORE INSERT ON document_templates
FOR EACH ROW EXECUTE FUNCTION handle_document_sequences();

CREATE TRIGGER trg_handle_output_code
BEFORE INSERT ON document_outputs
FOR EACH ROW EXECUTE FUNCTION handle_document_sequences();

-- ============================================================
-- 5. TRIGGER: Garantizar una sola plantilla predeterminada por tipo
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_single_default_template()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE document_templates
        SET is_default = false,
            updated_at = NOW()
        WHERE tenant_id    = NEW.tenant_id
          AND document_type = NEW.document_type
          AND id            <> NEW.id
          AND is_default    = true
          AND deleted_at    IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_single_default_template
BEFORE INSERT OR UPDATE OF is_default ON document_templates
FOR EACH ROW
EXECUTE FUNCTION enforce_single_default_template();

-- ============================================================
-- 6. TRIGGER: Marcar timestamp de generación al completar
-- ============================================================
CREATE OR REPLACE FUNCTION handle_document_output_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Cuando pasa a COMPLETADO, registrar timestamp de generación
    IF NEW.status = 'COMPLETADO' AND (OLD.status IS NULL OR OLD.status <> 'COMPLETADO') THEN
        IF NEW.generated_at IS NULL THEN
            NEW.generated_at := NOW();
        END IF;
    END IF;

    -- Cuando pasa a ERROR, limpiar path de storage (no hay archivo válido)
    IF NEW.status = 'ERROR' AND (OLD.status IS NULL OR OLD.status <> 'ERROR') THEN
        NEW.storage_path := NULL;
        NEW.file_size_bytes := NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_handle_output_completion
BEFORE INSERT OR UPDATE OF status ON document_outputs
FOR EACH ROW
EXECUTE FUNCTION handle_document_output_completion();

-- ============================================================
-- 7. TRIGGER: Bloqueo de Borrado Físico (Soft Delete Obligatorio)
-- ============================================================
CREATE OR REPLACE FUNCTION block_physical_document_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada en módulo de documentos. Utilice soft delete (deleted_at).';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_block_template_delete
BEFORE DELETE ON document_templates
FOR EACH ROW EXECUTE FUNCTION block_physical_document_delete();

CREATE TRIGGER trg_block_output_delete
BEFORE DELETE ON document_outputs
FOR EACH ROW EXECUTE FUNCTION block_physical_document_delete();

-- ============================================================
-- 8. TRIGGER: Trazabilidad General (updated_at, updated_by)
-- ============================================================
CREATE TRIGGER trg_template_traceability
BEFORE INSERT OR UPDATE ON document_templates
FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

CREATE TRIGGER trg_output_traceability
BEFORE INSERT OR UPDATE ON document_outputs
FOR EACH ROW EXECUTE FUNCTION handle_approval_traceability();

-- ============================================================
-- 9. TRIGGER: Auditoría General
-- ============================================================
CREATE TRIGGER audit_document_templates
AFTER INSERT OR UPDATE OR DELETE ON document_templates
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

CREATE TRIGGER audit_document_outputs
AFTER INSERT OR UPDATE OR DELETE ON document_outputs
FOR EACH ROW EXECUTE FUNCTION process_audit_log();

-- ============================================================
-- 10. HABILITAR ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_outputs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 11. POLÍTICAS RLS — document_templates
-- ============================================================
-- Super Admin: acceso total cross-tenant
CREATE POLICY doc_templates_super_admin ON document_templates
FOR ALL TO authenticated
USING (is_platform_super_admin());

-- Lectura tenant: solo registros propios, no borrados (excepto AUDITOR)
CREATE POLICY doc_templates_select_tenant ON document_templates
FOR SELECT TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
           AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);

-- Escritura tenant: solo registros propios
CREATE POLICY doc_templates_write_tenant ON document_templates
FOR ALL TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
)
WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- ============================================================
-- 12. POLÍTICAS RLS — document_outputs
-- ============================================================
CREATE POLICY doc_outputs_super_admin ON document_outputs
FOR ALL TO authenticated
USING (is_platform_super_admin());

CREATE POLICY doc_outputs_select_tenant ON document_outputs
FOR SELECT TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
           AND r.role_code = 'AUDITOR') > 0
        OR deleted_at IS NULL
    )
);

CREATE POLICY doc_outputs_write_tenant ON document_outputs
FOR ALL TO authenticated
USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
)
WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);
