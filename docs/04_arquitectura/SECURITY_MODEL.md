# MODELO DE SEGURIDAD (SECURITY MODEL)

Este documento describe la arquitectura de seguridad física y lógica aplicada en el sistema para la **FASE 1: Fundación y Core Multiempresa / Seguridad**.

---

## 1. Arquitectura de Autenticación (Supabase Auth)

El sistema delega la autenticación a **Supabase Auth** (basado en GoTrue), garantizando el almacenamiento inmutable de credenciales mediante algoritmos de hash robustos (bcrypt/argon2).

### 1.1 Configuración por Entorno

#### Producción:
*   **Confirmación de Correo Obligatoria:** Supabase Auth requiere verificación por email de doble opt-in para habilitar la cuenta del usuario.
*   **Recuperación:** Enlaces seguros de recuperación de contraseña con expiración de 1 hora.
*   **MFA (Autenticación Multifactor):** Preparado a nivel de base de datos para habilitar autenticación por códigos TOTP (ej. Google Authenticator).

#### Pruebas (Entorno de Testing):
*   **Usuarios Demo Precargados:** 106 cuentas creadas mediante scripts.
*   **Autoconfirmación Habilitada:** El script de inicialización marca las cuentas como verificadas directamente en el esquema `auth.users` (`email_confirmed_at = NOW()`), evitando la necesidad de confirmación por correo manual durante el testing.

---

## 2. Token JWT y Autorización

Al iniciar sesión, Supabase genera un token de acceso JWT firmado digitalmente. 
El token contiene claims estándar y metadatos personalizados del usuario:
- `sub`: Identificador de autenticación (`auth_user_id`).
- `user_metadata`: Incluye el `user_id` del esquema operativo, el `tenant_id` y el estado del rol del usuario.

El backend (Server Actions) y la base de datos (PostgreSQL policies) validan la firma del JWT en cada petición.

---

## 3. Modelo de Super Administrador de la Plataforma

Para cumplir con el requerimiento de que el `SUPER_ADMIN` no pertenezca a ninguna empresa y administre la plataforma de manera global:

### 3.1 Estructura en la Tabla `users`
*   `tenant_id` $\rightarrow$ `NULL`.
*   `is_platform_user` $\rightarrow$ `true`.
*   `site_id`, `area_id`, `manager_id` $\rightarrow$ `NULL`.

### 3.2 Lógica de Bypass en Consultas y RLS
PostgreSQL RLS implementa políticas condicionales:
```sql
CREATE POLICY tenant_isolation_policy ON target_table
    FOR ALL
    USING (
        -- Regla 1: Bypass para SUPER_ADMIN (Usuario de Plataforma)
        (SELECT is_platform_user FROM users WHERE auth_user_id = auth.uid()) = true
        OR
        -- Regla 2: Aislamiento estricto por tenant
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid())
    );
```

---

## 4. Estrategia de Auditoría y Logs

Toda acción crítica a nivel de base de datos genera un registro de auditoría en la tabla `audit_log`.

### 4.1 Captura Automática mediante Triggers
Se implementa un trigger genérico en PostgreSQL que se ejecuta `AFTER INSERT OR UPDATE OR DELETE` en las tablas operativas:

1.  **Inserción (CREATE):** Captura el registro insertado y guarda los datos en `new_values` de tipo JSONB.
2.  **Edición (UPDATE):** Captura los cambios de campos y guarda el estado anterior en `old_values` y el nuevo en `new_values`.
3.  **Eliminación (DELETE_SOFT):** Cuando se actualiza el campo `deleted_at`, el trigger registra la acción de borrado lógico.

### 4.2 Datos de Contexto Registrados
*   `user_id`: ID del usuario que ejecuta la acción (resuelto desde `auth.uid()`).
*   `tenant_id`: ID del tenant del usuario.
*   `ip_address`: Dirección IP obtenida desde el contexto de la transacción.
*   `user_agent`: Cabecera HTTP del navegador del cliente.
