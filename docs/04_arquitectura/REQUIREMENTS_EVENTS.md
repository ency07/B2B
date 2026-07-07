# MODELO DE EVENTOS DE NEGOCIO DE REQUERIMIENTOS Y DOCUMENTOS (REQUIREMENTS & DOCUMENTS EVENTS)

Este documento especifica los códigos y payloads JSONB de los eventos comerciales inmutables para el módulo de requerimientos y documentos (FASE 3 y FASE 7).

---

## 1. Catálogo de Eventos Oficiales

| Código de Evento (`event_code`) | Evento Relacionado | Datos Incluidos en Payload |
| :--- | :--- | :--- |
| `REQUIREMENT_CREATED` | Creación de requerimiento | `requirement_code`, `title`, `client_id`, `category`, `status`, `priority` |
| `REQUIREMENT_UPDATED` | Actualización de datos básicos | Lista de campos alterados (`title`, `priority`, `estimated_value`) |
| `REQUIREMENT_ASSIGNED` | Asignación o reasignación | `old_sales_user_id`, `new_sales_user_id`, `old_engineering_user_id`, `new_engineering_user_id`, `assigned_by` |
| `REQUIREMENT_STATUS_CHANGED` | Transición de estado | `old_status`, `new_status` |
| `REQUIREMENT_CANCELLED` | Cancelación del requerimiento | `requirement_code`, `cancel_code`, `cancel_reason`, `cancelled_at` |
| `DOCUMENT_UPLOADED` | Registro inicial de un documento | `document_code`, `document_type`, `entity_type`, `entity_id`, `uploaded_by` |
| `DOCUMENT_UPDATED` | Modificación de metadatos o estado | Cambios de estado (ej. de PUBLICADO a OBSOLETO) |
| `DOCUMENT_DELETED` | Eliminación lógica de documento | `document_code`, `delete_reason`, `deleted_by` |
| `DOCUMENT_VERSION_CREATED` | Carga de nueva versión documental | `document_code`, `new_version`, `previous_version_obsoleted` |

---

## 2. Estructura de Payloads (Ejemplos JSONB)

### 2.1 `REQUIREMENT_CANCELLED`
```json
{
  "requirement_code": "REQ-000001",
  "cancel_code": "CLIENTE_DESISTE",
  "cancel_reason": "El cliente canceló el proyecto por presupuesto.",
  "cancelled_at": "2026-06-17T03:45:00Z"
}
```

### 2.2 `DOCUMENT_VERSION_CREATED`
```json
{
  "document_code": "DOC-000001",
  "new_version": 2,
  "previous_version_obsoleted": 1,
  "uploaded_by": "880f9411-e29b-41d4-a716-446655440111"
}
```

---

## 3. Triggers de Emisión de Eventos (SQL)

### 3.1 Requerimientos
El trigger `trg_dispatch_requirement_events` registra los hitos en `business_events`. Detecta cambios de estado, cancelaciones y reasignación de responsables (comerciales o técnicos) para generar sus respectivos payloads.

### 3.2 Documentos
El trigger `trg_dispatch_document_events` se ejecuta en `AFTER INSERT OR UPDATE` sobre `documents` y registra las inserciones y cambios de versión o soft delete del archivo.
