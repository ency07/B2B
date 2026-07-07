# POLÍTICAS DE RLS DE CLIENTES (CLIENTS RLS MODEL)

Este documento detalla la implementación de Row-Level Security (RLS) para proteger las tablas de clientes, contactos y sedes de clientes frente a accesos indebidos e intrusiones cruzadas de tenants.

---

## 1. Políticas RLS para la Tabla `clients`

La tabla `clients` requiere un aislamiento estricto por tenant y el ocultamiento por defecto de los registros eliminados de forma lógica (soft delete).

### 1.1 Políticas SQL de Acceso

```sql
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Política de Control Total para SUPER_ADMIN (Bypass global de plataforma)
CREATE POLICY clients_super_admin ON clients
    FOR ALL
    TO authenticated
    USING (is_platform_super_admin());

-- Política de Selección (Lectura) para Usuarios del Tenant
CREATE POLICY clients_select_tenant ON clients
    FOR SELECT
    TO authenticated
    USING (
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
        AND (
            -- Los auditores pueden ver clientes eliminados logicamente (en caso de archivado/soft delete)
            (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
            OR
            -- Los demas roles solo ven registros activos (soft delete filter)
            deleted_at IS NULL
        )
    );

-- Política de Inserción (Escritura) para Usuarios del Tenant
CREATE POLICY clients_insert_tenant ON clients
    FOR INSERT
    TO authenticated
    WITH CHECK (
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    );

-- Política de Actualización (Edición/Soft Delete) para Usuarios del Tenant
CREATE POLICY clients_update_tenant ON clients
    FOR UPDATE
    TO authenticated
    USING (
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
        AND deleted_at IS NULL -- No se permite editar clientes ya borrados logicamente
    )
    WITH CHECK (
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    );
```

---

## 2. Políticas RLS para la Tabla `client_contacts`

```sql
ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

-- Política de Control Total para SUPER_ADMIN
CREATE POLICY contacts_super_admin ON client_contacts
    FOR ALL
    TO authenticated
    USING (is_platform_super_admin());

-- Política de Selección (Lectura) para Usuarios del Tenant
CREATE POLICY contacts_select_tenant ON client_contacts
    FOR SELECT
    TO authenticated
    USING (
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
        AND (
            -- Los auditores ven registros borrados logicamente
            (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
            OR
            deleted_at IS NULL
        )
    );

-- Política de Inserción
CREATE POLICY contacts_insert_tenant ON client_contacts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
        -- Impedir insertar contactos en clientes eliminados logicamente
        AND (SELECT deleted_at FROM clients WHERE id = client_id) IS NULL
    );

-- Política de Actualización
CREATE POLICY contacts_update_tenant ON client_contacts
    FOR UPDATE
    TO authenticated
    USING (
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
        AND deleted_at IS NULL
    )
    WITH CHECK (
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    );
```

---

## 3. Políticas RLS para la Tabla `client_sites` (Nueva)

La tabla de sedes de clientes se rige bajo las mismas normas que la de contactos para su respectivo aislamiento.

```sql
ALTER TABLE client_sites ENABLE ROW LEVEL SECURITY;

-- Política de Control Total para SUPER_ADMIN
CREATE POLICY client_sites_super_admin ON client_sites
    FOR ALL
    TO authenticated
    USING (is_platform_super_admin());

-- Política de Selección (Lectura) para Usuarios del Tenant
CREATE POLICY client_sites_select_tenant ON client_sites
    FOR SELECT
    TO authenticated
    USING (
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
        AND (
            -- Los auditores ven sedes borradas logicamente
            (SELECT COUNT(*) FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) AND r.role_code = 'AUDITOR') > 0
            OR
            deleted_at IS NULL
        )
    );

-- Política de Inserción
CREATE POLICY client_sites_insert_tenant ON client_sites
    FOR INSERT
    TO authenticated
    WITH CHECK (
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
        -- Impedir insertar sedes en clientes eliminados logicamente
        AND (SELECT deleted_at FROM clients WHERE id = client_id) IS NULL
    );

-- Política de Actualización
CREATE POLICY client_sites_update_tenant ON client_sites
    FOR UPDATE
    TO authenticated
    USING (
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
        AND deleted_at IS NULL
    )
    WITH CHECK (
        tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    );
```

---

## 4. Omisión Intencional de Políticas de Borrado Físico (`DELETE`)

> [!WARNING]
> No se definen políticas `FOR DELETE` en RLS para las tablas `clients`, `client_contacts` y `client_sites`. 
> 
> Bajo el estándar de Postgres, si RLS está habilitado y no se otorga explícitamente una política para una acción (`DELETE`), dicha acción es denegada por defecto. Esto garantiza por hardware lógico que **ningún usuario o rol de tenant pueda borrar físicamente** un cliente, un contacto o una sede, forzando el uso exclusivo del flujo de borrado lógico (`deleted_at`).
