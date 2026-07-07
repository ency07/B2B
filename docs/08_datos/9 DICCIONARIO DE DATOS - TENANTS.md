CAPÍTULO 9
DICCIONARIO DE DATOS
SECCIÓN 1
TENANTS
Tabla
tenants
Campos
Campo	Tipo	Obligatorio	Único
id	uuid	Sí	Sí
tenant_code	varchar(50)	Sí	Sí
name	varchar(200)	Sí	No
legal_name	varchar(250)	Sí	No
tax_id	varchar(100)	Sí	Sí
email	varchar(200)	No	No
phone	varchar(50)	No	No
status	enum	Sí	No
created_at	timestamp	Sí	No
updated_at	timestamp	Sí	No
Estados
Activo
Inactivo
Suspendido
Validaciones
tenant_code obligatorio

name obligatorio

tax_id obligatorio

tenant_code único

tax_id único
USERS
Tabla
users
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
employee_code	varchar(50)
first_name	varchar(100)
last_name	varchar(100)
email	varchar(200)
phone	varchar(50)
auth_user_id	uuid
site_id	uuid
area_id	uuid
manager_id	uuid
status	enum
created_at	timestamp
updated_at	timestamp
Estados
Activo
Inactivo
Bloqueado
Validaciones
tenant_id obligatorio

email obligatorio

site_id obligatorio

area_id obligatorio

email único por tenant
ROLES
Tabla
roles
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
role_code	varchar(50)
name	varchar(100)
description	text
status	enum
Validaciones
role_code único

name obligatorio
PERMISSIONS
Tabla
permissions
Campos
Campo	Tipo
id	uuid
permission_code	varchar(100)
name	varchar(150)
module	varchar(100)
description	text
Ejemplos
clients.view

clients.create

clients.edit

quotes.approve

jobs.close

payments.confirm
USER_ROLES
Tabla
user_roles
Campos
id

tenant_id

user_id

role_id

assigned_at

assigned_by
USER_PERMISSIONS
Tabla
user_permissions
Campos
id

tenant_id

user_id

permission_id

granted

assigned_at

assigned_by
SITES
Tabla
sites
Campos
id

tenant_id

site_code

name

description

country

state

city

address

phone

email

manager_user_id

status
Validaciones
site_code único

name obligatorio
AREAS
Tabla
areas
Campos
id

tenant_id

area_code

name

description

manager_user_id

status
Validaciones
area_code único

name obligatorio
RELACIONES MAESTRAS
Tenant
 ├── Users
 ├── Roles
 ├── Permissions
 ├── Sites
 ├── Areas
 ├── Clients
 ├── Jobs
 ├── Inventory
 ├── Finance
 └── KPIs