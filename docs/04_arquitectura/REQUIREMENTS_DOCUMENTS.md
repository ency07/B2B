# ARQUITECTURA DE DOCUMENTOS (GLOBAL DOCUMENT REPOSITORY)

Este documento especifica el diseño arquitectónico, el versionado, las políticas de seguridad RLS y el desacoplamiento de storage para la tabla transversal `documents`.

---

## 1. Repositorio Transversal Desacoplado (Observación 1 y 6)

*   **Modulo Global:** La entidad `documents` es un componente de la infraestructura transversal de la plataforma (Roadmap Fase 7). La Fase 3 (Requerimientos) utiliza esta entidad de manera referencial.
*   **Abstracción de Almacenamiento:** Para evitar depender de Supabase Storage de manera exclusiva y facilitar migraciones futuras a AWS S3 o Azure Blob Storage, se registran metadatos clave:
    *   `storage_provider`: Indica dónde se encuentra guardado el archivo (`'SUPABASE'`, `'S3'`, `'AZURE_BLOB'`, `'LOCAL'`).
    *   `storage_path`: La llave del archivo o ruta física interna en el bucket del proveedor de almacenamiento.
    *   `file_size`: Tamaño exacto del archivo en bytes (`bigint`).
    *   `checksum`: Hash SHA-256 (`varchar(64)`) generado al subir el archivo para validar la integridad e impedir modificaciones silenciosas.

---

## 2. DDL de la Tabla `documents`

```sql
CREATE TABLE documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    document_code varchar(50) NOT NULL,
    document_type varchar(50) NOT NULL CHECK (document_type IN (
        'CLIENT_REQUEST', 'DIAGNOSTIC', 'TECHNICAL_VISIT', 'QUOTE', 'CONTRACT', 
        'WORK_ORDER', 'BLUEPRINT', 'TECHNICAL_MEMO', 'DELIVERY_NOTE', 'INVOICE', 
        'PAYMENT_VOUCHER', 'WARRANTY', 'SERVICE_REPORT', 'PHOTOS', 'APPROVAL'
    )),
    entity_type varchar(50) NOT NULL CHECK (entity_type IN (
        'CLIENT', 'REQUIREMENT', 'DIAGNOSTIC', 'QUOTE', 'JOB', 'INVOICE', 
        'PAYMENT', 'WARRANTY', 'PROJECT', 'AUDIT', 'USER', 'ASSET', 
        'INVENTORY', 'PURCHASE', 'QUALITY'
    )),
    entity_id uuid NOT NULL,
    version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
    file_name varchar(250) NOT NULL,
    file_path text NOT NULL,
    file_size bigint NOT NULL,
    checksum varchar(64),
    storage_provider varchar(50) NOT NULL DEFAULT 'SUPABASE' CHECK (storage_provider IN (
        'SUPABASE', 'S3', 'AZURE_BLOB', 'LOCAL'
    )),
    storage_path text NOT NULL,
    
    uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_at timestamp NOT NULL DEFAULT NOW(),
    status varchar(50) NOT NULL DEFAULT 'PUBLICADO' CHECK (status IN (
        'BORRADOR', 'PUBLICADO', 'OBSOLETO', 'ARCHIVADO'
    )),
    
    -- Soft Delete
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,

    CONSTRAINT unique_tenant_document_code_version UNIQUE (tenant_id, document_code, version)
);

CREATE INDEX idx_documents_tenant ON documents(tenant_id);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
```

---

## 3. Lógica de Control de Versiones

Al insertar un documento para una entidad:
1.  Si el `document_code` ya existe para ese tenant, el trigger calcula `version := max_version + 1`.
2.  De forma automática, la fila con la versión previa se actualiza a `status = 'OBSOLETO'`.
3.  El nuevo registro entra en estado `'PUBLICADO'`.

```sql
CREATE OR REPLACE FUNCTION handle_document_versioning()
RETURNS TRIGGER AS $$
DECLARE
    v_max_version integer;
BEGIN
    IF NEW.document_code IS NOT NULL AND NEW.document_code <> '' THEN
        SELECT COALESCE(MAX(version), 0)
        INTO v_max_version
        FROM documents
        WHERE tenant_id = NEW.tenant_id
          AND document_code = NEW.document_code;
          
        IF v_max_version > 0 THEN
            NEW.version := v_max_version + 1;
            
            -- Version anterior pasa a OBSOLETO
            UPDATE documents
            SET status = 'OBSOLETO'
            WHERE tenant_id = NEW.tenant_id
              AND document_code = NEW.document_code
              AND version = v_max_version;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Políticas de Seguridad RLS y Soft Delete

```sql
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Super Admin Bypass
CREATE POLICY documents_super_admin ON documents 
    FOR ALL TO authenticated USING (is_platform_super_admin());

-- Lectura (Select)
CREATE POLICY documents_select_tenant ON documents FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND (
        (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
        OR
        deleted_at IS NULL
    )
);

-- Inserción (Insert)
CREATE POLICY documents_insert_tenant ON documents FOR INSERT TO authenticated WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Edición (Update)
CREATE POLICY documents_update_tenant ON documents FOR UPDATE TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    AND deleted_at IS NULL
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);
```

### Bloqueo Físico de Delete
Un trigger `BEFORE DELETE` lanza un error si se intenta eliminar físicamente cualquier fila de la tabla `documents`.

```sql
CREATE OR REPLACE FUNCTION block_physical_document_delete()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Eliminación física denegada. Utilice soft delete actualizando deleted_at.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```
