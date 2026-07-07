# MODELO DE ENTIDADES DE REQUERIMIENTOS Y DOCUMENTOS (REQUIREMENTS & DOCUMENTS ENTITY MODEL)

Este documento especifica el diseño relacional y las restricciones físicas para las tablas `requirements` y `documents`, la tabla `tenant_sequences` para manejo de concurrencia y el cálculo de SLAs.

---

## 1. Control de Concurrencia: `tenant_sequences` (Observación 2)

Para evitar colisiones en entornos de alta concurrencia con `SELECT MAX(...) + 1`, se define una tabla centralizada de secuencias por tenant con bloqueo transaccional por fila:

```sql
CREATE TABLE tenant_sequences (
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sequence_type varchar(50) NOT NULL, -- 'REQUIREMENT', 'DOCUMENT'
    current_value integer NOT NULL DEFAULT 0,
    updated_at timestamp NOT NULL DEFAULT NOW(),
    PRIMARY KEY (tenant_id, sequence_type)
);

CREATE OR REPLACE FUNCTION get_next_tenant_sequence(p_tenant_id uuid, p_sequence_type varchar)
RETURNS integer AS $$
DECLARE
    v_next_val integer;
BEGIN
    INSERT INTO tenant_sequences (tenant_id, sequence_type, current_value, updated_at)
    VALUES (p_tenant_id, p_sequence_type, 1, NOW())
    ON CONFLICT (tenant_id, sequence_type)
    DO UPDATE SET current_value = tenant_sequences.current_value + 1, updated_at = NOW()
    RETURNING current_value INTO v_next_val;
    
    RETURN v_next_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 2. Esquema DDL de Requerimientos

```sql
-- Catálogos en Base de Datos:
-- Prioridades (priority): 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
-- Categorías (category): 'FABRICACION', 'VENTA', 'MANTENIMIENTO', 'REPARACION', 'OTRO'
-- Estados (status): 'BORRADOR', 'NUEVO', 'EN_REVISION', 'DIAGNOSTICO', 'COTIZACION', 'APROBACION', 'OT_GENERADA', 'EJECUCION', 'CERRADO', 'CANCELADO'
-- Catálogo de Cancelación (cancel_code): 'CLIENTE_DESISTE', 'SIN_PRESUPUESTO', 'FUERA_ALCANCE', 'DUPLICADO', 'ERROR_REGISTRO', 'OTRO'

CREATE TABLE requirements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    requirement_code varchar(50) NOT NULL,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    contact_id uuid REFERENCES client_contacts(id) ON DELETE SET NULL,
    title varchar(250) NOT NULL,
    description text,
    category varchar(50) NOT NULL CHECK (category IN (
        'FABRICACION', 'VENTA', 'MANTENIMIENTO', 'REPARACION', 'OTRO'
    )),
    source varchar(100),
    
    -- Responsables Específicos (Observación 3)
    created_by uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    sales_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    engineering_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    
    estimated_value numeric(18,2),
    priority varchar(50) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN (
        'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    )),
    status varchar(50) NOT NULL DEFAULT 'BORRADOR' CHECK (status IN (
        'BORRADOR', 'NUEVO', 'EN_REVISION', 'DIAGNOSTICO', 'COTIZACION', 'APROBACION', 'OT_GENERADA', 'EJECUCION', 'CERRADO', 'CANCELADO'
    )),
    
    -- Matriz de Cancelación (Observación 4)
    cancel_code varchar(50) CHECK (cancel_code IN (
        'CLIENTE_DESISTE', 'SIN_PRESUPUESTO', 'FUERA_ALCANCE', 'DUPLICADO', 'ERROR_REGISTRO', 'OTRO'
    )),
    cancel_reason text,
    cancelled_by uuid REFERENCES users(id) ON DELETE SET NULL,
    cancelled_at timestamp,
    
    -- SLAs Guardados Físicamente (Observación 5)
    sla_response_due_at timestamp,
    sla_diagnostic_due_at timestamp,
    sla_quote_due_at timestamp,
    sla_close_due_at timestamp,

    -- Trazabilidad general
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp,
    updated_by uuid REFERENCES users(id) ON DELETE SET NULL,
    deleted_at timestamp,
    deleted_by uuid REFERENCES users(id) ON DELETE SET NULL,
    delete_reason text,
    status_changed_at timestamp,
    status_changed_by uuid REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT unique_tenant_requirement_code UNIQUE (tenant_id, requirement_code)
);
```

---

## 3. Esquema DDL de Documentos (Observación 1 y 6)

*Nota: Módulo transversal corporativo global. El módulo de requerimientos actúa como consumidor de esta tabla.*

```sql
-- Catálogos de Documentos:
-- Tipos (document_type): 'CLIENT_REQUEST', 'DIAGNOSTIC', 'TECHNICAL_VISIT', 'QUOTE', 'CONTRACT', 'WORK_ORDER', 'BLUEPRINT', 'TECHNICAL_MEMO', 'DELIVERY_NOTE', 'INVOICE', 'PAYMENT_VOUCHER', 'WARRANTY', 'SERVICE_REPORT', 'PHOTOS', 'APPROVAL'
-- Estados de Documento (status): 'BORRADOR', 'PUBLICADO', 'OBSOLETO', 'ARCHIVADO'
-- Entidades Transversales (entity_type): 'CLIENT', 'REQUIREMENT', 'DIAGNOSTIC', 'QUOTE', 'JOB', 'INVOICE', 'PAYMENT', 'WARRANTY', 'PROJECT', 'AUDIT', 'USER', 'ASSET', 'INVENTORY', 'PURCHASE', 'QUALITY'

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
    
    -- Storage Independiente y Metadatos (Observación 6)
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
```

---

## 4. Triggers de Asignación de Códigos

```sql
CREATE OR REPLACE FUNCTION handle_requirement_code()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.requirement_code := 'REQ-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'REQUIREMENT')::text, 6, '0');
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.requirement_code <> OLD.requirement_code THEN
            NEW.requirement_code := OLD.requirement_code;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

```sql
CREATE OR REPLACE FUNCTION handle_document_code()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND (NEW.document_code IS NULL OR NEW.document_code = '') THEN
        NEW.document_code := 'DOC-' || LPAD(get_next_tenant_sequence(NEW.tenant_id, 'DOCUMENT')::text, 6, '0');
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.document_code <> OLD.document_code THEN
            NEW.document_code := OLD.document_code;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```
