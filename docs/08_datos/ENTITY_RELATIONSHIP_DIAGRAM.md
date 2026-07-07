# DIAGRAMA ENTIDAD-RELACIÓN (ENTITY RELATIONSHIP DIAGRAM)

Este documento detalla el diseño relacional para la **FASE 1: Fundación y Core Multiempresa / Seguridad** del sistema.

---

## 1. Diagrama de Clases / Relaciones (Mermaid)

```mermaid
erDiagram
    tenants {
        uuid id PK
        varchar tenant_code UK
        varchar name
        varchar legal_name
        varchar tax_id UK
        varchar email
        varchar phone
        enum status
        timestamp created_at
        timestamp updated_at
    }

    users {
        uuid id PK
        uuid tenant_id FK "null para super admin"
        varchar employee_code
        varchar first_name
        varchar last_name
        varchar email
        varchar phone
        uuid auth_user_id FK "supabase auth.users"
        uuid site_id FK "null para super admin"
        uuid area_id FK "null para super admin"
        uuid manager_id FK "autorreferencial"
        enum status
        timestamp created_at
        timestamp updated_at
    }

    roles {
        uuid id PK
        uuid tenant_id FK "null para roles globales/super admin"
        varchar role_code
        varchar name
        text description
        enum status
    }

    permissions {
        uuid id PK
        varchar permission_code UK
        varchar name
        varchar module
        text description
    }

    user_roles {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        uuid role_id FK
        timestamp assigned_at
        uuid assigned_by FK
    }

    user_permissions {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        uuid permission_id FK
        boolean granted
        timestamp assigned_at
        uuid assigned_by FK
    }

    sites {
        uuid id PK
        uuid tenant_id FK
        varchar site_code
        varchar name
        text description
        varchar country
        varchar state
        varchar city
        text address
        varchar phone
        varchar email
        uuid manager_user_id FK
        enum status
    }

    areas {
        uuid id PK
        uuid tenant_id FK
        varchar area_code
        name varchar
        text description
        uuid manager_user_id FK
        enum status
    }

    tenants ||--o{ users : "pertenece a"
    tenants ||--o{ roles : "posee"
    tenants ||--o{ sites : "opera en"
    tenants ||--o{ areas : "se organiza en"
    
    users ||--o{ user_roles : "tiene asignado"
    roles ||--o{ user_roles : "se asigna a"
    
    users ||--o{ user_permissions : "recibe excepcion"
    permissions ||--o{ user_permissions : "se exceptua a"
    
    sites ||--o{ users : "ubica a"
    areas ||--o{ users : "agrupa a"
    
    users ||--o{ users : "reporta a (manager_id)"
```

---

## 2. Especificación Técnica de Tablas e Índices

### 2.1 Tabla `tenants`
*   **Restricciones:**
    - `tenant_code` y `tax_id` son de tipo `NOT NULL` y obligatoriamente únicos globales (`UNIQUE`).
    - `status` toma valores del enum: `'Activo'`, `'Inactivo'`, `'Suspendido'`.
*   **Índices:**
    - `idx_tenants_code` (B-Tree en `tenant_code`) para resoluciones rápidas de login/dominio.
    - `idx_tenants_tax_id` (B-Tree en `tax_id`).

### 2.2 Tabla `users`
*   **Restricciones:**
    - `tenant_id` puede ser `NULL` únicamente si `is_platform_user` (definido en el modelo lógico) es verdadero, habilitando el bypass de RLS para el rol de `SUPER_ADMIN`.
    - La combinación `(tenant_id, email)` es única. Un mismo correo no puede repetirse en la misma empresa, pero sí podría existir en empresas distintas.
    - `auth_user_id` referencia obligatoriamente al ID de la tabla `auth.users` del esquema interno de Supabase Auth.
*   **Índices:**
    - `idx_users_tenant_email` (B-Tree en `(tenant_id, email)`).
    - `idx_users_auth_id` (B-Tree en `auth_user_id`).
    - `idx_users_tenant_id` (B-Tree en `tenant_id`) para consultas optimizadas bajo RLS.

### 2.3 Tabla `roles`
*   **Restricciones:**
    - La combinación `(tenant_id, role_code)` es única.
    - `tenant_id` es `NULL` para roles globales predefinidos del sistema.
*   **Índices:**
    - `idx_roles_tenant_code` (B-Tree en `(tenant_id, role_code)`).

### 2.4 Tabla `permissions`
*   **Restricciones:**
    - `permission_code` es de tipo `NOT NULL` y único global (ej. `clients.create`, `quotes.approve`).
*   **Índices:**
    - `idx_permissions_code` (B-Tree en `permission_code`).

### 2.5 Tabla `user_roles`
*   **Restricciones:**
    - Claves foráneas referenciando a `users(id)` y `roles(id)` con `ON DELETE CASCADE`.
*   **Índices:**
    - `idx_user_roles_composite` (B-Tree en `(user_id, role_id)`).
    - `idx_user_roles_tenant` (B-Tree en `tenant_id`) para RLS.

### 2.6 Tabla `user_permissions`
*   **Restricciones:**
    - `granted` es booleano. Permite inyectar excepciones de permisos (p. ej., habilitar a un usuario específico una acción (`granted = true`) o revocarle explícitamente un permiso heredado (`granted = false`)).
*   **Índices:**
    - `idx_user_permissions_composite` (B-Tree en `(user_id, permission_id)`).

### 2.7 Tabla `sites` (Sedes)
*   **Restricciones:**
    - La combinación `(tenant_id, site_code)` es única.
*   **Índices:**
    - `idx_sites_tenant_code` (B-Tree en `(tenant_id, site_code)`).

### 2.8 Tabla `areas`
*   **Restricciones:**
    - La combinación `(tenant_id, area_code)` es única.
*   **Índices:**
    - `idx_areas_tenant_code` (B-Tree en `(tenant_id, area_code)`).
