# AI BUILD PROTOCOL (Protocolo de Construcción para la IA)

Este protocolo define las normas técnicas para generar código fuente, estructuras SQL, RLS y automatizaciones en el proyecto **ERP B2B Premium**.

---

## 1. Convenciones y Buenas Prácticas SQL

### 1.1 Estructura de Archivos de Migración
*   Las migraciones se almacenan en `supabase/migrations/` ordenadas cronológicamente utilizando la marca de tiempo de fecha como prefijo: `YYYYMMDDHHMMSS_nombre_fase.sql`.
*   Toda migración debe ser autocontenida y no depender de DDLs especulativos de fases futuras.

### 1.2 Reglas para Triggers y Funciones
*   **Seguridad:** Las funciones ejecutadas por triggers deben definirse con `SECURITY DEFINER` únicamente cuando requieran consultar metadatos del sistema (como roles o perfiles) que estén protegidos por RLS.
*   **Prevención de Errores Dinámicos:** Queda prohibida la interrogación dinámica a `information_schema.tables` para condicionales lógicos sobre tablas futuras. La lógica correspondiente se debe agregar en la migración de la fase en la cual la tabla es creada.
*   **Triggers BEFORE vs AFTER:**
    *   `BEFORE INSERT OR UPDATE`: Se utiliza para validación de restricciones, cálculos matemáticos automatizados (ej: subtotales e impuestos) y asignación automática de códigos secuenciales.
    *   `AFTER INSERT OR UPDATE`: Se utiliza para auditoría cruzada, inyección a la tabla `business_events` y envío de notificaciones.

---

## 2. Convención de Nombres de Objetos de Base de Datos

*   **Tablas:** Nombres en plural, minúsculas, con guion bajo (`client_contacts`).
*   **Triggers:** Prefijo `trg_` seguido de la acción (`trg_handle_requirement_code`, `trg_validate_requirement_state`).
*   **Funciones:** Nombres en minúsculas descriptivos en inglés o español (`add_business_hours`, `get_next_tenant_sequence`).
*   **Políticas RLS:** Prefijo `nombretabla_accion_rol` (`requirements_select_tenant`, `documents_update_tenant`).

---

## 3. Restricción de Compilación y TypeScript
Antes de dar por concluida una fase de construcción:
1.  Se debe ejecutar el compilador de TypeScript de manera local para asegurar la total ausencia de errores sintácticos.
2.  Queda prohibido ignorar errores de tipado o de compilación (`//@ts-ignore` o uso de `any` injustificado).
3.  Toda migración física debe contar con un script de prueba automatizado correspondiente en `scripts/` para validar el comportamiento sintáctico y lógico de los triggers y las políticas RLS.
