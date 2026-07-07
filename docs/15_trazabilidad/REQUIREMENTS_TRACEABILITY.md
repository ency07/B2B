# MODELO DE TRAZABILIDAD DE REQUERIMIENTOS Y DOCUMENTOS (REQUIREMENTS & DOCUMENTS TRACEABILITY)

Este documento especifica la trazabilidad inmutable y el doble nivel de auditoría del módulo de requerimientos y del repositorio de documentos.

---

## 1. Doble Nivel de Auditoría (Observación 7)

Para garantizar la rendición de cuentas operativa y técnica, el sistema utiliza dos tablas de registro:

### 1.1 Auditoría Técnica (`audit_log`)
*   **Propósito:** Registrar todos los cambios a nivel físico de la base de datos (INSERT, UPDATE, DELETE).
*   **Mecanismo:** El trigger genérico `process_audit_log` captura de manera transparente:
    *   `old_values` (JSONB): El estado anterior de la fila completa.
    *   `new_values` (JSONB): El estado posterior de la fila completa.
    *   `user_id`: El UUID del operador autenticado en la sesión (`auth.uid()`).
    *   `action`: La operación ejecutada (`CREATE`, `UPDATE`, `DELETE`).
    *   `ip_address` / `user_agent`: Metadatos de red del cliente.
*   **Integración:** En la Fase 3, se añade el trigger `audit_requirements` sobre `requirements` y `audit_documents` sobre `documents` invocando la función `process_audit_log()`.

### 1.2 Auditoría Funcional o Semántica (`business_events`)
*   **Propósito:** Capturar hitos comerciales significativos para consumo en dashboards, portales de cliente o notificaciones.
*   **Mecanismo:** Triggers de eventos específicos que formatean un payload descriptivo para hitos como `REQUIREMENT_STATUS_CHANGED`, `REQUIREMENT_CANCELLED`, `DOCUMENT_VERSION_CREATED` y los inserta en `business_events`.

---

## 2. Trazabilidad de Cancelaciones y Reasignación

### 2.1 Reasignación
*   Al modificar `sales_user_id` o `engineering_user_id`, el trigger de trazabilidad `handle_requirement_traceability` detecta el cambio e inyecta en `assigned_by` el ID del usuario en sesión.
*   Concurrente a la auditoría técnica en `audit_log`, se inserta un evento `REQUIREMENT_ASSIGNED` en `business_events` detallando el responsable anterior y posterior.

### 2.2 Cancelación Estructurada
*   Al pasar un requerimiento a estado `CANCELADO`, la base de datos exige un código descriptivo (`cancel_code`) y una justificación textual (`cancel_reason`).
*   El trigger inyecta automáticamente `cancelled_by` (el usuario en sesión) y `cancelled_at` (`NOW()`).
*   Se genera e inserta en la tabla `business_events` el evento `REQUIREMENT_CANCELLED`.

---

## 3. Trigger de Trazabilidad en la Base de Datos

```sql
CREATE OR REPLACE FUNCTION handle_requirement_traceability()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
BEGIN
    v_user_id := get_current_user_id();

    IF TG_OP = 'INSERT' THEN
        NEW.created_at := NOW();
        IF NEW.created_by IS NULL THEN
            NEW.created_by := v_user_id;
        END IF;
        NEW.status_changed_at := NOW();
        NEW.status_changed_by := NEW.created_by;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_at := NOW();
        NEW.updated_by := v_user_id;

        -- Trazabilidad de transición de estado
        IF NEW.status <> OLD.status THEN
            NEW.status_changed_at := NOW();
            NEW.status_changed_by := v_user_id;
        END IF;

        -- Trazabilidad de reasignación
        IF NEW.sales_user_id IS DISTINCT FROM OLD.sales_user_id OR NEW.engineering_user_id IS DISTINCT FROM OLD.engineering_user_id THEN
            NEW.assigned_by := v_user_id;
        END IF;

        -- Trazabilidad de soft delete
        IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
            NEW.deleted_by := v_user_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
