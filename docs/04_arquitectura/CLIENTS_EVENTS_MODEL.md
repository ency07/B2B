# MODELO DE EVENTOS DE NEGOCIO (CLIENTS EVENTS MODEL)

Este documento especifica el diseño, los esquemas de carga útil (payloads) y los mecanismos de disparo automático para los eventos de negocio del bloque de clientes, incluyendo contactos y sedes de clientes (Pregunta 4 y Pregunta 5).

---

## 1. Tabla de Eventos de Negocio (`business_events`)

Para habilitar una arquitectura desacoplada basada en eventos, se define una tabla centralizada para persistir y auditar de forma inmutable cada hito operativo del cliente.

```sql
CREATE TABLE business_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_code varchar(100) NOT NULL, -- e.g., 'CLIENT_CREATED', 'CONTACT_PRIMARY_CHANGED', 'CLIENT_SITE_CREATED'
    entity_type varchar(100) NOT NULL, -- 'clients', 'client_contacts' o 'client_sites'
    entity_id uuid NOT NULL,
    payload jsonb NOT NULL, -- Datos estructurados semánticamente del evento
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamp NOT NULL DEFAULT NOW()
);

-- Índices de optimización
CREATE INDEX idx_business_events_tenant ON business_events(tenant_id);
CREATE INDEX idx_business_events_composite ON business_events(entity_type, entity_id);
CREATE INDEX idx_business_events_code ON business_events(event_code);
```

---

## 2. Catálogo de Eventos Mínimos Obligatorios

| Código de Evento (`event_code`) | Descripción del Evento | Datos en Payload |
| :--- | :--- | :--- |
| `CLIENT_CREATED` | Nuevo cliente registrado en el sistema. | `client_code`, `legal_name`, `tax_id`, `status`, `assigned_user_id` |
| `CLIENT_UPDATED` | Actualización de datos comerciales o generales del cliente. | Lista de campos modificados con sus valores `old` y `new` |
| `CLIENT_STATUS_CHANGED` | Cambio general del estado del cliente. | `old_status`, `new_status` |
| `CLIENT_ARCHIVED` | El cliente pasa a estado ARCHIVADO. | `client_code`, `legal_name`, `archived_at` |
| `CLIENT_ASSIGNED` | Se asigna o reasigna un responsable comercial. | `old_assigned_user_id`, `new_assigned_user_id` |
| `CLIENT_BLOCKED` | El cliente pasa a estado BLOQUEADO. | `block_reason`, `blocked_at` |
| `CLIENT_UNBLOCKED` | El cliente se desbloquea. | `unblock_reason`, `unblocked_at` |
| `CONTACT_CREATED` | Registro de un nuevo contacto de cliente. | `contact_id`, `first_name`, `last_name`, `email`, `is_primary` |
| `CONTACT_UPDATED` | Actualización de datos del contacto. | Lista de campos modificados con sus valores `old` y `new` |
| `CONTACT_DELETED` | Borrado lógico (soft delete) del contacto. | `contact_id`, `delete_reason`, `deleted_at` |
| `CONTACT_PRIMARY_CHANGED`| Cambio o reemplazo del contacto principal. | `old_primary_contact_id`, `new_primary_contact_id` |
| `CLIENT_SITE_CREATED` | Se crea una nueva sucursal o sede física del cliente. | `client_id`, `site_name`, `city`, `address` |
| `CLIENT_SITE_UPDATED` | Modificación de dirección o teléfono de una sede. | Lista de campos modificados con sus valores `old` y `new` |
| `CLIENT_SITE_DELETED` | Borrado lógico (clausura) de una sede de cliente. | `client_id`, `site_name`, `delete_reason`, `deleted_at` |

---

## 3. Estructura de Payloads (Ejemplos JSONB)

### 3.1 `CLIENT_SITE_CREATED`
```json
{
  "client_id": "a90f1111-e29b-41d4-a716-446655440222",
  "site_name": "Bodega Principal Medellín",
  "city": "Medellín",
  "address": "Calle 10 # 50-60"
}
```

### 3.2 `CONTACT_PRIMARY_CHANGED`
```json
{
  "client_id": "a90f1111-e29b-41d4-a716-446655440222",
  "old_primary_contact_id": "b80f2222-e29b-41d4-a716-446655440333",
  "new_primary_contact_id": "c70f3333-e29b-41d4-a716-446655440444"
}
```

---

## 4. Implementación de Triggers de Eventos (SQL)

Para asegurar la emisión incondicional de los eventos desde cualquier canal (API, scripts de consola, o DB externa), se implementan triggers automáticos sobre las tablas `clients`, `client_contacts` y `client_sites`.

```sql
-- Trigger para Clientes (dispatch_client_events)
-- (Sin cambios, ver CLIENTS_ENTITY_MODEL para la función DDL)

-- Trigger para Contactos (dispatch_contact_events)
-- (Sin cambios, ver CLIENTS_ENTITY_MODEL para la función DDL)
```

### 4.1 Trigger para Sedes de Clientes (`client_sites`)

```sql
CREATE OR REPLACE FUNCTION dispatch_client_site_events()
RETURNS TRIGGER AS $$
DECLARE
    v_payload jsonb;
    v_user_id uuid;
BEGIN
    SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;

    -- EVENTO: CLIENT_SITE_CREATED
    IF TG_OP = 'INSERT' THEN
        v_payload := jsonb_build_object(
            'client_id', NEW.client_id,
            'site_name', NEW.site_name,
            'city', NEW.city,
            'address', NEW.address
        );
        INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
        VALUES (NEW.tenant_id, 'CLIENT_SITE_CREATED', 'client_sites', NEW.id, v_payload, v_user_id);

    -- EVENTO: UPDATE
    ELSIF TG_OP = 'UPDATE' THEN
        -- 1. CLIENT_SITE_DELETED (Soft delete)
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            v_payload := jsonb_build_object(
                'client_id', NEW.client_id,
                'site_name', NEW.site_name,
                'delete_reason', NEW.delete_reason,
                'deleted_at', NEW.deleted_at
            );
            INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
            VALUES (NEW.tenant_id, 'CLIENT_SITE_DELETED', 'client_sites', NEW.id, v_payload, v_user_id);
            
        -- 2. CLIENT_SITE_UPDATED
        ELSE
            DECLARE
                v_changes jsonb := '{}'::jsonb;
            BEGIN
                IF NEW.site_name <> OLD.site_name THEN v_changes := v_changes || jsonb_build_object('site_name', jsonb_build_object('old', OLD.site_name, 'new', NEW.site_name)); END IF;
                IF NEW.address <> OLD.address THEN v_changes := v_changes || jsonb_build_object('address', jsonb_build_object('old', OLD.address, 'new', NEW.address)); END IF;
                IF NEW.phone IS DISTINCT FROM OLD.phone THEN v_changes := v_changes || jsonb_build_object('phone', jsonb_build_object('old', OLD.phone, 'new', NEW.phone)); END IF;

                IF v_changes <> '{}'::jsonb THEN
                    INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
                    VALUES (NEW.tenant_id, 'CLIENT_SITE_UPDATED', 'client_sites', NEW.id, jsonb_build_object('changes', v_changes), v_user_id);
                END IF;
            END;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_dispatch_client_site_events
AFTER INSERT OR UPDATE ON client_sites
FOR EACH ROW
EXECUTE FUNCTION dispatch_client_site_events();
```

---

## 5. Seguridad de Eventos (RLS)

La tabla `business_events` hereda el esquema de seguridad RLS estricto de multitenancy definido en la FASE 1:

```sql
ALTER TABLE business_events ENABLE ROW LEVEL SECURITY;

-- Política de Control Total para SUPER_ADMIN
CREATE POLICY business_events_super_admin ON business_events
    FOR ALL TO authenticated USING (is_platform_super_admin());

-- Política de Lectura para Auditores y Usuarios del Tenant
CREATE POLICY business_events_select ON business_events
    FOR SELECT TO authenticated
    USING (
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    );
```
