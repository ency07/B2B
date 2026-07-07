DICCIONARIO DE DATOS
BLOQUE OPERACIONAL
JOBS
Tabla
jobs
Campos
Campo	Tipo	Obligatorio
id	uuid	Sí
tenant_id	uuid	Sí
job_code	varchar(50)	Sí
client_id	uuid	Sí
requirement_id	uuid	Sí
quote_id	uuid	No
site_id	uuid	Sí
area_id	uuid	Sí
title	varchar(250)	Sí
description	text	No
assigned_user_id	uuid	Sí
planned_start_date	datetime	No
planned_end_date	datetime	No
actual_start_date	datetime	No
actual_end_date	datetime	No
estimated_hours	decimal(10,2)	No
actual_hours	decimal(10,2)	No
priority	enum	Sí
status	enum	Sí
created_at	timestamp	Sí
created_by	uuid	Sí
updated_at	timestamp	No
updated_by	uuid	No
priority
Baja
Media
Alta
Crítica
status
Pendiente
Programado
En Ejecución
Suspendido
Finalizado
Entregado
Cerrado
Cancelado
Validaciones
client_id obligatorio

requirement_id obligatorio

assigned_user_id obligatorio

planned_end_date >= planned_start_date

actual_end_date >= actual_start_date
JOB_ACTIVITIES
Tabla
job_activities
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
job_id	uuid
activity_code	varchar(50)
title	varchar(250)
description	text
assigned_user_id	uuid
planned_start_date	datetime
planned_end_date	datetime
actual_start_date	datetime
actual_end_date	datetime
estimated_hours	decimal(10,2)
actual_hours	decimal(10,2)
status	enum
created_at	timestamp
status
Pendiente
Programada
En Ejecución
Suspendida
Completada
Cancelada
Validaciones
job_id obligatorio

title obligatorio

assigned_user_id obligatorio
DOCUMENTS
Tabla
documents
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
document_code	varchar(50)
document_type	enum
entity_type	varchar(100)
entity_id	uuid
version	integer
file_name	varchar(250)
file_path	text
file_size	bigint
mime_type	varchar(100)
uploaded_by	uuid
status	enum
uploaded_at	timestamp
document_type
Solicitud Cliente
Diagnóstico
Visita Técnica
Cotización
Contrato
Orden Trabajo
Plano
Memoria Técnica
Acta Entrega
Factura
Comprobante Pago
Garantía
Informe Servicio
Fotografías
status
Borrador
Publicado
Obsoleto
Archivado
Validaciones
document_type obligatorio

entity_type obligatorio

entity_id obligatorio

version >= 1
ALERTS
Tabla
alerts
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
alert_code	varchar(50)
title	varchar(250)
message	text
alert_type	varchar(100)
priority	enum
status	enum
created_at	timestamp
expires_at	timestamp
priority
Baja
Media
Alta
Crítica
status
Pendiente
Leída
Archivada
ALERT_RECIPIENTS
Tabla
alert_recipients
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
alert_id	uuid
user_id	uuid
status	enum
read_at	timestamp
status
Pendiente
Leída
Validaciones
alert_id obligatorio

user_id obligatorio
APPROVAL_FLOWS
Tabla
approval_flows
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
flow_code	varchar(50)
name	varchar(150)
description	text
flow_type	enum
status	enum
flow_type
Secuencial
Paralela
Mixta
status
Activo
Inactivo
APPROVAL_STEPS
Tabla
approval_steps
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
flow_id	uuid
step_order	integer
role_id	uuid
user_id	uuid
required	boolean
Validaciones
flow_id obligatorio

step_order obligatorio

role_id o user_id obligatorio
APPROVAL_RULES
Tabla
approval_rules
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
entity_type	varchar(100)
min_amount	decimal(18,2)
max_amount	decimal(18,2)
flow_id	uuid
active	boolean
Ejemplo
Cotización

0 - 5.000.000

Sin aprobación
Cotización

5.000.001 - 20.000.000

Jefe Área
Cotización

20.000.001+

Gerencia
APPROVAL_REQUESTS
Tabla
approval_requests
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
request_code	varchar(50)
entity_type	varchar(100)
entity_id	uuid
flow_id	uuid
requested_by	uuid
resolved_by	uuid
requested_at	timestamp
resolved_at	timestamp
comments	text
status	enum
status
Pendiente
Aprobada
Rechazada
AjustesSolicitados
Cancelada
REGLAS CRÍTICAS OPERACIONALES
No puede existir Job sin Cliente.

No puede existir Job sin Requerimiento.

No puede existir Actividad sin Job.

No puede existir Documento sin Entidad asociada.

No puede existir Aprobación sin Flujo.

No puede existir Alerta sin Destinatario.
RELACIONES
Job
 ├── Activities
 ├── Documents
 ├── Costs
 ├── Inventory Movements
 └── Warranties

Approval Flow
 ├── Approval Steps
 ├── Approval Rules
 └── Approval Requests

Alert
 └── Alert Recipients
BLOQUE OPERACIONAL
100% Congelado