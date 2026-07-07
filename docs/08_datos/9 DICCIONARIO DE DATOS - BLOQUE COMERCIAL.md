DICCIONARIO DE DATOS
BLOQUE COMERCIAL
CLIENTS
Tabla
clients
Campos
Campo	Tipo	Obligatorio	Único
id	uuid	Sí	Sí
tenant_id	uuid	Sí	No
client_code	varchar(50)	Sí	Sí
client_type	enum	Sí	No
legal_name	varchar(250)	Sí	No
commercial_name	varchar(250)	No	No
tax_id	varchar(100)	Sí	Sí
industry	varchar(150)	No	No
website	varchar(250)	No	No
email	varchar(200)	No	No
phone	varchar(50)	No	No
country	varchar(100)	Sí	No
state	varchar(100)	No	No
city	varchar(100)	No	No
address	text	No	No
assigned_user_id	uuid	No	No
status	enum	Sí	No
created_at	timestamp	Sí	No
created_by	uuid	Sí	No
updated_at	timestamp	No	No
updated_by	uuid	No	No
deleted_at	timestamp	No	No
deleted_by	uuid	No	No
client_type
Empresa

Persona
status
Prospecto

Activo

Inactivo

Bloqueado

Archivado
Validaciones
client_code único por tenant

tax_id único por tenant

legal_name obligatorio

country obligatorio
CLIENT_CONTACTS
Tabla
client_contacts
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
client_id	uuid
first_name	varchar(100)
last_name	varchar(100)
position	varchar(150)
email	varchar(200)
phone	varchar(50)
mobile	varchar(50)
is_primary	boolean
status	enum
created_at	timestamp
status
Activo

Inactivo
Validaciones
client_id obligatorio

first_name obligatorio

email opcional

Solo un contacto principal por cliente
REQUIREMENTS
Tabla
requirements
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
requirement_code	varchar(50)
client_id	uuid
contact_id	uuid
title	varchar(250)
description	text
source	varchar(100)
assigned_user_id	uuid
estimated_value	numeric(18,2)
priority	enum
status	enum
registered_at	timestamp
created_at	timestamp
priority
Baja

Media

Alta

Crítica
status
Registrado

Diagnóstico

Visita Técnica

Cotización

Aprobado

En Ejecución

Cerrado

Cancelado
Validaciones
client_id obligatorio

title obligatorio

status obligatorio

priority obligatoria
QUOTES
Tabla
quotes
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
quote_code	varchar(50)
version	integer
client_id	uuid
requirement_id	uuid
assigned_user_id	uuid
quote_date	date
valid_until	date
subtotal	numeric(18,2)
discount_amount	numeric(18,2)
tax_amount	numeric(18,2)
total_amount	numeric(18,2)
notes	text
status	enum
created_at	timestamp
status
Borrador

En Revisión

Enviada

Aprobada

Rechazada

Vencida

Cancelada
Validaciones
client_id obligatorio

requirement_id obligatorio

quote_date obligatorio

valid_until obligatorio

valid_until >= quote_date

Debe existir al menos un item
QUOTE_ITEMS
Tabla
quote_items
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
quote_id	uuid
item_order	integer
item_type	enum
description	text
quantity	numeric(18,4)
unit	varchar(50)
unit_price	numeric(18,2)
discount_amount	numeric(18,2)
tax_amount	numeric(18,2)
line_total	numeric(18,2)
item_type
Material

Servicio

Equipo

ManoObra

Otro
Validaciones
quote_id obligatorio

description obligatoria

quantity > 0

unit_price >= 0

line_total calculado
FÓRMULAS OBLIGATORIAS
Quote Item
subtotal_linea =
cantidad × precio_unitario
line_total =
subtotal_linea
- descuento
+ impuesto
Cotización
subtotal =
SUM(items.line_total)
total =
subtotal
- descuento_global
+ impuestos_globales
RELACIONES
Client
 ├── Contacts
 ├── Requirements
 │
 └── Quotes

Requirement
 └── Quotes

Quote
 └── QuoteItems
BLOQUE COMERCIAL
100% Congelado