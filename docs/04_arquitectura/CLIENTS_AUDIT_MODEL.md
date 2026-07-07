# MODELO DE AUDITORÍA DE CLIENTES (CLIENTS AUDIT MODEL)

Este documento especifica cómo el sistema registra de manera inmutable las acciones y modificaciones técnicas sobre las tablas `clients`, `client_contacts` y `client_sites`, utilizando el motor de auditoría unificado establecido en la FASE 1.

---

## 1. Relación entre Auditoría Técnica y Eventos de Negocio

El sistema separa la trazabilidad en dos capas independientes para maximizar el rendimiento y la legibilidad:

1.  **Auditoría Técnica (`audit_log`):** Registra cambios físicos a nivel de base de datos (`CREATE`, `UPDATE` y `DELETE` físico bloqueado) con diferencias estructurales completas en formato JSONB. Se alimenta de forma genérica mediante el trigger centralizado `process_audit_log()`.
2.  **Eventos de Negocio (`business_events`):** Registra hitos funcionales y semánticos (ej. `CLIENT_ARCHIVED`, `CONTACT_PRIMARY_CHANGED`) con payloads simplificados y específicos para auditorías comerciales, integraciones y lógica reactiva.

---

## 2. Eventos Registrados en la Auditoría Técnica (`audit_log`)

Dado que la auditoría técnica utiliza el trigger unificado `process_audit_log()`, los registros se clasifican según el nombre de la tabla y la operación SQL física:

| Tabla Afectada | Acción SQL | Código de Evento (`event_code`) | Cómo identificar cambios de negocio en `new_values` |
| :--- | :--- | :--- | :--- |
| `clients` | `INSERT` | `CLIENTS_CREATE` | Registro inicial completo del cliente. |
| `clients` | `UPDATE` | `CLIENTS_UPDATE` | Cambio de datos generales, reasignación de responsable, actualización de estado o soft delete (indicado por `deleted_at IS NOT NULL`). |
| `client_contacts` | `INSERT` | `CLIENT_CONTACTS_CREATE` | Registro inicial completo del contacto. |
| `client_contacts` | `UPDATE` | `CLIENT_CONTACTS_UPDATE` | Edición de datos del contacto, cambio en `is_primary` o soft delete (indicado por `deleted_at IS NOT NULL`). |
| `client_sites` | `INSERT` | `CLIENT_SITES_CREATE` | Registro inicial completo de la sede del cliente. |
| `client_sites` | `UPDATE` | `CLIENT_SITES_UPDATE` | Edición de datos de la sede o soft delete (indicado por `deleted_at IS NOT NULL`). |

> [!IMPORTANT]
> Las operaciones físicas de eliminación (`DELETE`) sobre `clients`, `client_contacts` y `client_sites` no tienen políticas RLS asociadas. Por lo tanto, cualquier intento de eliminación física por usuarios del tenant será rechazado a nivel de motor de base de datos. Si un Super Admin realizara una purga física, el trigger registraría `CLIENTS_DELETE`, `CLIENT_CONTACTS_DELETE` o `CLIENT_SITES_DELETE` automáticamente.

---

## 3. Registro de Triggers de Auditoría

Los triggers de auditoría se ejecutan en el evento `AFTER` de cada mutación para asegurar que solo se registren transacciones confirmadas (committed):

```sql
-- Trigger de Auditoría Técnica para Clientes
CREATE TRIGGER audit_clients_trigger
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW
EXECUTE FUNCTION process_audit_log();

-- Trigger de Auditoría Técnica para Contactos
CREATE TRIGGER audit_contacts_trigger
AFTER INSERT OR UPDATE OR DELETE ON client_contacts
FOR EACH ROW
EXECUTE FUNCTION process_audit_log();

-- Trigger de Auditoría Técnica para Sedes de Clientes
CREATE TRIGGER audit_client_sites_trigger
AFTER INSERT OR UPDATE OR DELETE ON client_sites
FOR EACH ROW
EXECUTE FUNCTION process_audit_log();
```

---

## 4. Estructura de Datos en el Log (Diferencias JSONB)

El motor captura la fila completa del estado anterior (`old_values`) y del nuevo estado (`new_values`).

### Ejemplo de Auditoría para Soft Delete de Sede (`client_sites`)
Cuando un usuario ejecuta un borrado lógico en una sede:
*   `event_code`: `'CLIENT_SITES_UPDATE'`
*   `action`: `'UPDATE'`
*   `old_values`:
    ```json
    {
      "id": "f90f1111-e29b-41d4-a716-446655440222",
      "site_name": "Sucursal Medellín",
      "address": "Calle 10 #20-30",
      "deleted_at": null,
      "deleted_by": null,
      "delete_reason": null
    }
    ```
*   `new_values`:
    ```json
    {
      "id": "f90f1111-e29b-41d4-a716-446655440222",
      "site_name": "Sucursal Medellín",
      "address": "Calle 10 #20-30",
      "deleted_at": "2026-06-17T03:15:00Z",
      "deleted_by": "880f9411-e29b-41d4-a716-446655440111",
      "delete_reason": "Sede clausurada por mudanza"
    }
    ```
*   `user_id`: ID del usuario que realizó la petición.
