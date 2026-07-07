# MATRIZ DE ROLES Y PERMISOS (RBAC MATRIX)

Este documento especifica la matriz de control de acceso basada en roles (RBAC) para el sistema. Define el alcance de permisos funcionales asignados a cada rol principal.

---

## 1. Matriz de Permisos por Rol

| Módulo / Permiso | SUPER_ADMIN | ADMIN_EMPRESA | GERENTE_GENERAL | DIR_COMERCIAL | EJECUTIVO_COM | DIR_OPERACIONES | TECNICO_CAMPO | AUDITOR | CLIENTE |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Plataforma / Tenants** |
| `tenants.create` | Sí | No | No | No | No | No | No | No | No |
| `tenants.view` | Sí | No | No | No | No | No | No | No | No |
| `tenants.settings` | Sí | Sí | No | No | No | No | No | No | No |
| **Usuarios y Roles** |
| `users.create` | Sí | Sí | No | No | No | No | No | No | No |
| `users.edit` | Sí | Sí | No | No | No | No | No | No | No |
| `users.permissions` | Sí | Sí | No | No | No | No | No | No | No |
| **Comercial / CRM** |
| `clients.create` | No | Sí | Sí | Sí | Sí | No | No | No | No |
| `clients.edit` | No | Sí | Sí | Sí | Sí | No | No | No | No |
| `clients.view` | No | Sí | Sí | Sí | Sí | Sí | Sí | Sí | No |
| `quotes.create` | No | Sí | Sí | Sí | Sí | No | No | No | No |
| `quotes.approve` | No | No | Sí | Sí | No | No | No | No | No |
| `quotes.view` | No | Sí | Sí | Sí | Sí | Sí | No | Sí | Sí |
| **Operaciones** |
| `jobs.create` | No | Sí | Sí | No | No | Sí | No | No | No |
| `jobs.manage` | No | Sí | Sí | No | No | Sí | Sí | No | No |
| `jobs.close` | No | No | Sí | No | No | Sí | No | No | No |
| `documents.upload` | No | Sí | Sí | Sí | Sí | Sí | Sí | No | Sí |
| `documents.view` | No | Sí | Sí | Sí | Sí | Sí | Sí | Sí | Sí |
| **Inventario** |
| `items.manage` | No | Sí | No | No | No | Sí | No | No | No |
| `inventory.movement` | No | Sí | No | No | No | Sí | Sí | No | No |
| `inventory.view` | No | Sí | Sí | Sí | Sí | Sí | Sí | Sí | No |
| **Finanzas** |
| `invoices.create` | No | Sí | Sí | No | No | No | No | No | No |
| `payments.confirm` | No | Sí | Sí | No | No | No | No | No | No |
| `payments.view` | No | Sí | Sí | Sí | No | No | No | Sí | Sí |
| **Auditoría** |
| `audit.view_global` | Sí | No | No | No | No | No | No | No | No |
| `audit.view_tenant` | No | Sí | Sí | No | No | No | No | Sí | No |

---

## 2. Niveles de Resolución de Permisos

El sistema valida los privilegios en tiempo de ejecución siguiendo una jerarquía en cascada:

```text
       [1. Rol del Usuario]
                │
                ▼
  [2. Tabla 'user_permissions'] (Excepciones de inclusión/exclusión)
                │
                ▼
  [3. Restricción por Sede ('site_id')] (Determina si la sede es accesible)
                │
                ▼
         [Acceso Concedido]
```

1.  **Rol del Usuario:** Verifica si el rol tiene asignado el permiso de manera estándar.
2.  **Excepciones de Usuario:** Consulta si existe una fila en `user_permissions` para el usuario y permiso específico. Si `granted = false`, el acceso se deniega aunque su rol lo permita. Si `granted = true`, el acceso se concede.
3.  **Restricción por Sede (`site_id`):** Si el permiso es válido, el middleware filtra las filas operativas para asegurar que solo correspondan al `site_id` al cual el usuario pertenece, a menos que el usuario sea Gerente o Director, quienes tienen visibilidad multisede por defecto.
