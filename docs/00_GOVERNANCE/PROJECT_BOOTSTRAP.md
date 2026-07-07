# PROJECT BOOTSTRAP (Guía de Inicialización del Proyecto)

Este documento detalla el procedimiento técnico para iniciar el entorno local de desarrollo, aprovisionar el esquema de base de datos y ejecutar las validaciones del sistema.

---

## 2. Aprovisionamiento de la Base de Datos

Las migraciones de Supabase se ejecutan en el siguiente orden secuencial y obligatorio:

1.  **Fase 1 - Inicialización:**
    `supabase/migrations/20260617000000_init_core.sql`
    *Crea el esquema multi-tenant de base, tablas de roles, permisos, áreas, sedes y el motor de auditoría.*
2.  **Fase 1 - Datos Semilla:**
    `supabase/migrations/20260617000001_seed_master_data.sql`
    *Inserta los roles de plataforma, permisos de auditoría y función para inicializar áreas.*
3.  **Fase 2 - Clientes:**
    `supabase/migrations/20260617000002_clients_core.sql`
    *Aprovisiona las tablas de clientes, contactos principales automáticos, sedes y eventos.*
4.  **Fase 3 - Requerimientos:**
    `supabase/migrations/20260617000003_requirements_core.sql`
    *Aprovisiona secuencias de tenant concurrentes, requerimientos, y el repositorio de documentos transversal.*
5.  **Fase 4 - Cotizaciones:**
    `supabase/migrations/20260617000004_quotes_core.sql`
    *Aprovisiona las tablas de cotizaciones y sus detalles, con reglas de autocalculo de impuestos/descuentos.*

---

## 3. Ejecución de Pruebas de Verificación

El proyecto cuenta con scripts automáticos que comprueban la consistencia sintáctica y lógica de los datos.

### 3.2 Comandos de Prueba
*   **Prueba de Aislamiento Tenant (Fase 1):**
    ```bash
    npm run test:multitenant
    ```
*   **Prueba de Clientes y Sedes (Fase 2):**
    ```bash
    npm run test:clients
    ```
*   **Prueba de Requerimientos y Documentos (Fase 3):**
    ```bash
    npm run test:requirements
    ```
*   **Prueba de Cotizaciones y Precios (Fase 4):**
    ```bash
    npm run test:quotes
    ```
