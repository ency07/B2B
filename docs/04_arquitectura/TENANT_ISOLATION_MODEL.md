# MODELO DE AISLAMIENTO MULTITENANT (TENANT ISOLATION MODEL)

Este documento detalla la estrategia de diseño y la implementación técnica para asegurar la segregación absoluta de información entre empresas (tenants).

---

## 1. Estrategia de Datos: Base de Datos Compartida, Esquema Compartido

El sistema utiliza un enfoque de **Base de Datos Compartida con Aislamiento Lógico** (Shared Database, Shared Schema). 

### 1.1 Columna `tenant_id`
Todas las tablas del sistema (con excepción de `permissions`) incluyen obligatoriamente el campo:
```sql
tenant_id uuid NOT NULL
```
Este campo hace referencia a la tabla `tenants(id)` y actúa como la clave de segregación en todas las transacciones de lectura, inserción, actualización y borrado lógico.

---

## 2. Row-Level Security (RLS) en PostgreSQL

Para evitar fugas de información y asegurar que un tenant jamás acceda a los datos de otro, la segregación se delega al motor de base de datos a través de **Políticas RLS**.

### 2.1 Principio de Operación
Cuando el backend realiza una consulta a la base de datos:
1.  Supabase expone el ID del usuario autenticado a través del JWT utilizando la función `auth.uid()`.
2.  PostgreSQL intercepta la consulta y evalúa la política de RLS definida para la tabla.
3.  El motor añade implícitamente el filtro de aislamiento a la cláusula `WHERE` física.

### 2.2 Política de RLS Estándar para Entidades de Tenant
```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY clients_isolation_policy ON clients
    FOR ALL
    TO authenticated
    USING (
        -- Permitir acceso si el usuario es un administrador de plataforma (SUPER_ADMIN)
        (SELECT is_platform_user FROM users WHERE auth_user_id = auth.uid()) = true
        OR
        -- Permitir acceso si el tenant_id del registro coincide con el tenant_id del usuario
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
    )
    WITH CHECK (
        -- Validar en inserciones o actualizaciones
        (SELECT is_platform_user FROM users WHERE auth_user_id = auth.uid()) = true
        OR
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
    );
```

---

## 3. Reglas de RLS por Tabla en FASE 1

### 3.1 Tabla `tenants`
*   **Usuarios de Tenant:** Únicamente pueden leer la fila de su propio tenant (`id = user.tenant_id`).
*   **SUPER_ADMIN:** Tiene privilegios de lectura, creación y actualización sobre todas las filas.

### 3.2 Tabla `users`
*   **Usuarios de Tenant:** Pueden leer información de usuarios de su misma empresa (`tenant_id = user.tenant_id`). Solo pueden editar su propio registro de usuario.
*   **ADMIN_EMPRESA:** Puede leer y editar todos los usuarios de su tenant.
*   **SUPER_ADMIN:** Bypass total.

### 3.3 Tabla `roles` y `permissions`
*   `permissions` es una tabla global. Es de lectura pública (`USING (true)`) para todos los usuarios autenticados, pero sólo modificable por el `SUPER_ADMIN`.
*   `roles` filtra por tenant. Cada tenant sólo ve y gestiona sus roles personalizados o los roles globales (donde `tenant_id IS NULL`).

### 3.4 Tablas `sites` y `areas`
*   Filtradas estrictamente por `tenant_id = user.tenant_id`.

---

## 4. Prevención de Fugas de Información

*   **Sin Bypass en Conexiones de la Aplicación:** El pool de conexiones del backend utiliza el rol de autenticación estándar de Supabase, el cual respeta obligatoriamente las políticas RLS. El rol `service_role` (que se salta RLS) queda estrictamente restringido para tareas del sistema en segundo plano.
*   **Validaciones en Triggers:** Se implementan triggers `BEFORE INSERT OR UPDATE` que aseguran que el `tenant_id` inyectado en el registro coincida con el `tenant_id` de la sesión del usuario, bloqueando cualquier intento de suplantación desde el frontend.
