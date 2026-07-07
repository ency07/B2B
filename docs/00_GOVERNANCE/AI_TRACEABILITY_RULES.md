# AI TRACEABILITY RULES (Reglas de Trazabilidad y Auditoría)

Este documento especifica cómo la IA debe resguardar la inmutabilidad de los datos, el doble nivel de auditoría y el control de eliminaciones lógicas.

---

## 1. El Doble Nivel de Auditoría

Toda entidad operacional del ERP debe integrarse a los dos sistemas de log del motor de base de datos:

### 1.1 Auditoría Técnica (`audit_log`)
*   **Destinatario:** Auditores de sistemas e investigadores forenses.
*   **Estructura:** Registra el diff exacto (`old_values`, `new_values` en formato JSONB), la acción física ejecutada (`CREATE`, `UPDATE`, `DELETE`), la dirección IP del cliente (`ip_address`), y la fecha y hora de la transacción (`created_at`).
*   **Implementación:** Se asocia un trigger AFTER a cada tabla operacional invocando la función genérica `process_audit_log()`.

### 1.2 Auditoría Funcional/Comercial (`business_events`)
*   **Destinatario:** Usuarios finales, dashboards de KPI y gestores de notificaciones.
*   **Estructura:** Registra hitos semánticos inmutables (ej: `REQUIREMENT_STATUS_CHANGED`, `CLIENT_CREATED`, `DOCUMENT_VERSION_CREATED`) con payloads JSONB legibles que describen el evento del negocio.
*   **Implementación:** Triggers AFTER específicos formatean y registran el evento comercial correspondiente.

---

## 2. Inmutabilidad y Reglas de Soft Delete (Eliminación Lógica)

### 2.1 Bloqueo Físico Absoluto
*   Queda estrictamente prohibido realizar borrado físico (`DELETE` de SQL) sobre cualquier tabla comercial u operativa.
*   Cada tabla debe contar con un trigger `BEFORE DELETE` que lance un error (`RAISE EXCEPTION`) cancelando de forma definitiva la operación de borrado.

### 2.2 Estructura de Eliminación Lógica
Para descartar registros, se realiza una actualización (`UPDATE`) registrando de manera auditable:
*   `deleted_at`: Marca de tiempo (`NOW()`).
*   `deleted_by`: UUID del usuario que ejecuta el descarte.
*   `delete_reason`: Explicación detallada del motivo del borrado.

### 2.3 Filtrado de Seguridad
*   Las consultas ordinarias de lectura deben omitir automáticamente registros con `deleted_at IS NOT NULL` a nivel de políticas RLS o filtros del frontend.
*   Solo los usuarios con rol `AUDITOR` o privilegios de administrador de plataforma tendrán permitido consultar registros eliminados lógicamente.
