# PLAN DE PRUEBAS DE REQUERIMIENTOS Y DOCUMENTOS (REQUIREMENTS & DOCUMENTS TEST PLAN)

Este documento define la estrategia de pruebas manuales y automatizadas, incluyendo los escenarios de aislamiento multitenant masivo con 25 tenants y 106 usuarios.

---

## 1. Pruebas de Aislamiento RLS Masivo (Observación 8)

El sistema debe garantizar la confidencialidad y separación de datos en un entorno empresarial denso de 25 tenants corporativos y 106 usuarios registrados.

### 1.1 Escenario de Prueba de Aislamiento Tenant RLS
1.  **Objetivo:** Verificar que las políticas de seguridad RLS bloqueen de forma definitiva el acceso de lectura o escritura a cualquier usuario fuera de su tenant.
2.  **Paso a Paso (Manual / Script de Simulación):**
    *   **Paso 1:** Registrar a los 106 usuarios y distribuirlos en los 25 tenants.
    *   **Paso 2:** Crear requerimientos y documentos de prueba en el Tenant A (ej: `Tenant_A_User_1` crea un requerimiento `REQ-000001` y sube un diagnóstico PDF `DOC-000001`).
    *   **Paso 3:** Simular el inicio de sesión y autenticación secuencial de cada uno de los usuarios del resto de los tenants (Tenants B al Y).
    *   **Paso 4:** Intentar ejecutar la consulta:
        ```sql
        SELECT * FROM requirements WHERE requirement_code = 'REQ-000001';
        SELECT * FROM documents WHERE document_code = 'DOC-000001';
        ```
    *   **Paso 5:** Intentar modificar el requerimiento o el documento de Tenant A desde otra sesión de Tenant B.
3.  **Criterio de Aceptación:**
    *   Para todos los usuarios fuera del Tenant A, las consultas `SELECT` deben retornar **0 registros** (vacío).
    *   Cualquier intento de `UPDATE` o `INSERT` cruzado debe lanzar un error RLS o modificar 0 registros.

---

## 2. Escenarios de Pruebas Manuales Operativas

### 2.1 Prueba de Control de Concurrencia (Secuencias)
*   **Paso a Paso:** Iniciar dos navegadores o dos conexiones concurrentes de usuarios del Tenant A e intentar registrar un requerimiento al mismo tiempo.
*   **Criterio de Aceptación:** Ambos obtienen códigos únicos consecutivos (por ejemplo, `REQ-000001` y `REQ-000002`) sin lanzar errores de llave duplicada, debido al bloqueo transaccional por tenant en la tabla `tenant_sequences`.

### 2.2 Prueba de Matriz de Cancelación
*   **Paso a Paso:** Intentar actualizar el requerimiento a estado `CANCELADO` sin enviar motivo o enviando un código no catalogado.
*   **Criterio de Aceptación:** El trigger rechaza la transacción. Al ingresar un código correcto de la lista (`CLIENTE_DESISTE`, etc.) y justificación textual $\ge 10$ caracteres, la transacción se completa y se registran automáticamente `cancelled_by` y `cancelled_at`.

### 2.3 Prueba de SLAs y Vencimientos Físicos
*   **Paso a Paso:** Registrar un requerimiento de prioridad `HIGH` y verificar los valores de `sla_response_due_at` y `sla_close_due_at` guardados en la tabla.
*   **Criterio de Aceptación:** Los campos guardan la fecha exacta de vencimiento considerando únicamente horas hábiles y omitiendo fines de semana.

---

## 3. Matriz de Casos de Prueba Automatizados

| ID Caso | Componente | Descripción | Acción Esperada |
| :--- | :--- | :--- | :--- |
| **TC-RLS-01** | `requirements`/`documents` | Consulta cruzada RLS | Consultas del Tenant B sobre Tenant A retornan vacío. |
| **TC-SEQ-01** | `tenant_sequences` | Concurrencia de secuencias | La inserción en paralelo de requerimientos asigna códigos incrementales correctos sin colisión. |
| **TC-SLA-01** | `requirements` | Cálculo y guardado de SLAs | La fecha calculada por `add_business_hours` se almacena físicamente en la fila. |
| **TC-AUD-01** | `audit_log` / `business_events` | Doble nivel de auditoría | Se escribe el diff completo en `audit_log` y se emite el hito comercial en `business_events`. |
