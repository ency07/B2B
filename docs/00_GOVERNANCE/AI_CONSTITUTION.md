# AI CONSTITUTION (Constitución de la IA)

Este documento rige el comportamiento de la Inteligencia Artificial (IA) en el desarrollo del proyecto **ERP B2B Premium**. Su cumplimiento es obligatorio, incondicional y precede a cualquier consideración técnica.

---

## 1. La Regla Suprema: NO INVENTAR

La IA operará bajo la premisa inflexible de que **es mejor realizar 100 preguntas al usuario que inventar 1 solo requisito**.

### 1.1 Restricciones de Creación
*   **Requisitos:** Queda prohibido asumir, inferir, completar huecos o crear alternativas no definidas explícitamente en el canal de comunicación y discovery.
*   **Entidades y Tablas:** No se pueden crear tablas o relaciones basadas en "patrones comunes de la industria" (ej: `inventory`, `vendors`, `projects`, etc.) a menos que la fase correspondiente haya sido formalmente aprobada por el usuario.
*   **Campos Fantasma:** Prohibida la adición de campos especulativos que no aparezcan en los diccionarios de datos oficiales.

### 1.2 Protocolo de Incertidumbre
Cuando falte información o exista duda, la IA deberá:
1.  **DETENERSE** de inmediato.
2.  **DOCUMENTAR** la duda en el plan de implementación.
3.  **ESPERAR** la aprobación formal y respuestas del usuario antes de generar código o archivos.

---

## 2. Principios de Arquitectura e Integridad

### 2.1 Aislamiento Multiempresa Absoluto
*   Todos los datos sin excepción pertenecen a un tenant (`tenant_id`).
*   No existen consultas cruzadas globales. La seguridad a nivel de fila (**Row Level Security - RLS**) se implementará en todas las tablas operacionales para aislar los datos de los tenants.

### 2.2 Inmutabilidad y Auditoría
*   **Soft Delete Obligatorio:** Queda prohibido ejecutar eliminaciones físicas (`DELETE`) sobre registros comerciales u operativos. Toda eliminación lógica debe registrar obligatoriamente `deleted_at`, `deleted_by` y un motivo descriptivo `delete_reason`.
*   **Doble Auditoría:** Cada cambio técnico debe ser registrado de forma automática en la tabla `audit_log` (antes/después JSONB). Cada hito o evento comercial de alto nivel debe registrarse en `business_events` para consumo operativo y dashboards.

---

## 3. Control de Concurrencia
*   Queda estrictamente prohibido utilizar `MAX(id) + 1` o consultas especulativas para la generación de códigos correlativos de negocio. 
*   Se utilizará la tabla transaccional `tenant_sequences` con bloqueo por registro para garantizar unicidad y orden correlativo seguro por tenant.
