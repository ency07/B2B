DICCIONARIO DE DATOS
BLOQUE INVENTARIO + POSTVENTA + ANALÍTICA
WAREHOUSES
Tabla
warehouses
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
warehouse_code	varchar(50)
site_id	uuid
name	varchar(150)
description	text
status	enum
created_at	timestamp
status
Activo
Inactivo
Validaciones
warehouse_code único por tenant

name obligatorio

site_id obligatorio
INVENTORY_ITEMS
Tabla
inventory_items
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
item_code	varchar(50)
name	varchar(250)
description	text
category	varchar(100)
item_type	enum
unit	varchar(20)
minimum_stock	decimal(18,4)
maximum_stock	decimal(18,4)
average_cost	decimal(18,2)
last_cost	decimal(18,2)
status	enum
item_type
Material
Herramienta
Equipo
Consumible
Repuesto
status
Activo
Inactivo
Validaciones
item_code único

name obligatorio

unit obligatoria
INVENTORY_STOCK
Tabla
inventory_stock
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
warehouse_id	uuid
item_id	uuid
quantity	decimal(18,4)
reserved_quantity	decimal(18,4)
available_quantity	decimal(18,4)
Fórmula
available_quantity =
quantity - reserved_quantity
Validaciones
quantity >= 0

reserved_quantity >= 0

No permitir stock negativo
INVENTORY_MOVEMENTS
Tabla
inventory_movements
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
movement_code	varchar(50)
warehouse_id	uuid
item_id	uuid
job_id	uuid
movement_type	enum
quantity	decimal(18,4)
unit_cost	decimal(18,2)
total_cost	decimal(18,2)
notes	text
movement_date	timestamp
status	enum
movement_type
Entrada
Salida
Ajuste
Reserva
status
Registrado
Aplicado
Anulado
Fórmula
total_cost =
quantity × unit_cost
Regla
Si movement_type = Salida

Generar automáticamente costo asociado al Job.
WARRANTIES
Tabla
warranties
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
warranty_code	varchar(50)
client_id	uuid
job_id	uuid
start_date	date
end_date	date
warranty_type	varchar(100)
coverage_description	text
status	enum
status
Activa
Vencida
Ejecutada
Cerrada
Anulada
Validaciones
job_id obligatorio

end_date >= start_date
WARRANTY_INTERVENTIONS
Tabla
warranty_interventions
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
warranty_id	uuid
intervention_code	varchar(50)
description	text
assigned_user_id	uuid
intervention_date	date
resolution	text
status	enum
status
Registrada
En Proceso
Resuelta
Cerrada
Validaciones
warranty_id obligatorio

description obligatoria
KPI_DEFINITIONS
Tabla
kpi_definitions
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
kpi_code	varchar(50)
name	varchar(150)
category	varchar(100)
description	text
unit	varchar(50)
active	boolean
KPI_FORMULAS
Tabla
kpi_formulas
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
kpi_id	uuid
formula_expression	text
version	integer
active	boolean
Regla
Solo una versión activa.
KPI_HISTORY
Tabla
kpi_history
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
kpi_id	uuid
period	varchar(20)
value	decimal(18,4)
calculated_at	timestamp
AUDIT_LOG
Tabla
audit_log
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
event_code	varchar(50)
entity_type	varchar(100)
entity_id	uuid
action	varchar(50)
old_values	jsonb
new_values	jsonb
user_id	uuid
ip_address	varchar(100)
user_agent	text
created_at	timestamp
Acciones
CREATE
UPDATE
DELETE_SOFT
STATUS_CHANGE
APPROVE
REJECT
LOGIN
LOGOUT
EXPORT
IMPORT
SYSTEM_SETTINGS
Tabla
system_settings
Campos
Campo	Tipo
id	uuid
tenant_id	uuid
setting_key	varchar(100)
setting_value	text
setting_type	varchar(50)
description	text
is_editable	boolean
CONFIG_CATEGORIES
Tabla
config_categories
Campos
id
tenant_id
category_code
name
description
CONFIG_VALUES
Tabla
config_values
Campos
id
tenant_id
category_id
value_code
value_name
sort_order
active
DASHBOARDS
Tabla
dashboards
Campos
id
tenant_id
dashboard_code
name
description
role_id
active
DASHBOARD_WIDGETS
Tabla
dashboard_widgets
Campos
id
tenant_id
dashboard_id
widget_code
widget_type
position_x
position_y
width
height
configuration_json
DASHBOARD_PREFERENCES
Tabla
dashboard_preferences
Campos
id
tenant_id
user_id
dashboard_id
preferences_json
DICCIONARIO DE DATOS
ESTADO
100% Definido a nivel funcional.