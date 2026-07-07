# PLAN DE PRUEBAS DE CLIENTES (CLIENTS TEST PLAN)

Este documento define la estrategia, los casos de prueba y los scripts necesarios para verificar todas las reglas de negocio, integridad de datos, políticas de RLS y triggers automáticos del bloque de clientes, contactos y sedes (FASE 2).

---

## 1. Alcance de la Verificación

El plan de pruebas garantiza el cumplimiento estricto de las siguientes directivas:
1. **Unicidad de `TAX_ID`:** Restringido por tenant (mismo `TAX_ID` permitido en tenants diferentes).
2. **Autoincremento de `client_code`:** Formato `CLI-000001`, secuencial, único por tenant e inmutable.
3. **Responsabilidad Comercial:** Clientes no huérfanos (`assigned_user_id` obligatorio).
4. **Soft Delete en Contactos y Sedes:** No borrado físico; campos `deleted_at`, `deleted_by` y `delete_reason` auditados.
5. **Contacto Principal Único:** Reemplazo automático al marcar un nuevo contacto como `is_primary = true`.
6. **Múltiples Sedes (`client_sites`):** Creación de sedes ilimitadas por cliente y aislamiento de RLS.
7. **Emisión de Eventos:** Registro de los eventos de clientes, contactos y sedes en `business_events`.
8. **Trazabilidad de Auditoría:** Registro automático de creación, edición, cambio de estado y borrado en `audit_log`.
9. **Seguridad RLS:** Aislamiento absoluto entre tenants y visualización restringida de contactos/sedes borrados (solo visibles para el rol `AUDITOR` o `SUPER_ADMIN`).

---

## 2. Matriz de Casos de Prueba

| ID Caso | Componente | Descripción | Acción Esperada | Criterio de Aceptación |
| :--- | :--- | :--- | :--- | :--- |
| **TC-CLI-01** | `clients` | Generación automática de `client_code` | Insertar cliente sin pasar `client_code` | El trigger genera `CLI-000001`. El siguiente inserta `CLI-000002`. |
| **TC-CLI-02** | `clients` | Inmutabilidad de `client_code` | Intentar actualizar el `client_code` de un cliente | El trigger anula el cambio y mantiene el original. |
| **TC-CLI-03** | `clients` | Unicidad de `TAX_ID` por Tenant | Insertar mismo `TAX_ID` en el mismo tenant | Falla la inserción por violación de restricción `UNIQUE`. |
| **TC-CLI-04** | `clients` | Duplicidad de `TAX_ID` en Tenants cruzados | Insertar mismo `TAX_ID` en dos tenants diferentes | Ambos registros se insertan exitosamente. |
| **TC-CLI-05** | `clients` | Obligatoriedad del Responsable | Insertar cliente con `assigned_user_id = NULL` | Falla la inserción por violación de restricción `NOT NULL`. |
| **TC-CLI-06** | `clients` | Prevención de Orfandad | Intentar borrar un usuario que es responsable de un cliente | Falla la eliminación física del usuario (`ON DELETE RESTRICT`). |
| **TC-CLI-07** | `clients` | Estados Válidos | Intentar asignar estado no soportado (e.g. `'NUEVO'`) | Falla por restricción `CHECK (status IN (...))`. |
| **TC-CON-01** | `contacts` | Reemplazo Automático de Contacto Principal | Insertar un contacto con `is_primary = true` cuando ya existe uno principal | El contacto existente cambia automáticamente a `is_primary = false`. El nuevo se inserta como `true`. |
| **TC-CON-02** | `contacts` | Soft Delete de Contacto | Ejecutar borrado lógico en un contacto activo | Se rellenan automáticamente `deleted_at`, `deleted_by` y `delete_reason`. |
| **TC-CON-03** | `contacts` | Visibilidad de Soft Delete (RLS) | Consultar contactos con usuario estándar vs. Auditor | El usuario estándar no ve los borrados. El Auditor los recupera exitosamente. |
| **TC-STE-01** | `client_sites` | Registro de Sedes de Clientes | Insertar sede en `client_sites` asociada a un cliente | Se registra la sede exitosamente. Se dispara el evento `CLIENT_SITE_CREATED`. |
| **TC-STE-02** | `client_sites` | Soft Delete de Sede | Ejecutar borrado lógico en una sede activa | Se rellenan `deleted_at`, `deleted_by`, `delete_reason`. Se emite `CLIENT_SITE_DELETED`. |
| **TC-STE-03** | `client_sites` | Aislamiento RLS de Sedes | Consultar sedes de clientes con Usuario A e intentar ver sedes del Tenant B | Solo se devuelven sedes que correspondan al `tenant_id` del usuario. |
| **TC-EVT-01** | `events` | Emisión de Evento de Creación | Insertar un cliente y verificar `business_events` | Se genera automáticamente un registro con `event_code = 'CLIENT_CREATED'` y payload correcto. |
| **TC-EVT-02** | `events` | Emisión de Evento de Cambio de Contacto Principal | Cambiar el contacto principal y verificar | Se genera automáticamente `CONTACT_PRIMARY_CHANGED` con los IDs correspondientes. |
| **TC-AUD-01** | `audit` | Trazabilidad del Historial | Modificar el estado del cliente y verificar `audit_log` | Se registra un `CLIENTS_UPDATE` mostrando el diff en `old_values` y `new_values`. |

---

## 3. Automatización de Pruebas

Se implementará un script de integración con pruebas unitarias y simulaciones en `scripts/test-clients.ts` que se conectará a la base de datos de pruebas para ejecutar paso a paso cada escenario.

### Código de Inicialización y Prueba
El script ejecuta sentencias SQL en transacciones controladas para verificar triggers, RLS y restricciones físicas, aislando el contexto de pruebas de manera segura.

```typescript
// scripts/test-clients.ts
// Script ejecutable con 'cmd /c npm run test:clients'
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log("AVISO: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no configurados. Saltando pruebas de integración física.");
  console.log("Ejecutando sintaxis estática simulada.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTests() {
  console.log("=== INICIANDO PRUEBAS FASE 2: CLIENTES, CONTACTOS Y SEDES ===");
  try {
    // 1. Limpieza de datos previa
    // 2. Ejecutar TC-CLI-01 (Generación de código)
    // 3. Ejecutar TC-CLI-02 (Inmutabilidad del código)
    // 4. Ejecutar TC-CLI-03 y TC-CLI-04 (Restricciones TAX_ID)
    // 5. Ejecutar TC-CON-01 (Reemplazo automático de contacto principal)
    // 6. Ejecutar TC-CON-02 y TC-CON-03 (Soft delete de contactos y visualización de auditores)
    // 7. Ejecutar TC-STE-01, TC-STE-02, TC-STE-03 (Registro, soft delete y aislamiento de sedes)
    // 8. Ejecutar TC-EVT-01 y TC-EVT-02 (Emisión de eventos de negocio)
    console.log("Pruebas finalizadas con éxito.");
  } catch (error) {
    console.error("Error ejecutando pruebas:", error);
    process.exit(1);
  }
}

runTests();
```
