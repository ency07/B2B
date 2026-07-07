# CAPÍTULO 12

# MATRIZ DE TRAZABILIDAD

## OBJETIVO

Garantizar que toda funcionalidad tenga trazabilidad completa.

Ningún componente puede existir aislado.

Todo debe poder rastrearse desde:

Necesidad de negocio
↓
Módulo
↓
Pantalla
↓
API
↓
Tabla
↓
Regla
↓
Prueba

---

# REGLA SUPREMA

Si una funcionalidad no puede trazarse:

No está terminada.

---

# CLIENTES

## Necesidad

Administrar clientes.

## Módulo

Clientes

## Pantallas

* Listado Clientes
* Crear Cliente
* Editar Cliente
* Detalle Cliente

## APIs

```text
GET /clients

GET /clients/{id}

POST /clients

PUT /clients/{id}
```

## Tablas

```text
clients
client_contacts
```

## Reglas

```text
RN-006

RN-007
```

## Pruebas

```text
CLIENT-001

CLIENT-002

CLIENT-003
```

---

# CONTACTOS

## Necesidad

Administrar contactos.

## Pantallas

```text
Contactos Cliente
```

## APIs

```text
GET /contacts

POST /contacts

PUT /contacts/{id}
```

## Tablas

```text
client_contacts
```

---

# REQUERIMIENTOS

## Necesidad

Gestionar oportunidades.

## Pantallas

```text
Listado Requerimientos

Detalle Requerimiento
```

## APIs

```text
GET /requirements

POST /requirements

PUT /requirements/{id}
```

## Tablas

```text
requirements
```

## Reglas

```text
RN-008
```

---

# COTIZACIONES

## Necesidad

Generar propuestas.

## Pantallas

```text
Listado Cotizaciones

Crear Cotización

Detalle Cotización
```

## APIs

```text
GET /quotes

POST /quotes

PUT /quotes/{id}

POST /quotes/{id}/submit

POST /quotes/{id}/approve
```

## Tablas

```text
quotes

quote_items
```

## Reglas

```text
RN-009

RN-010

RN-011
```

---

# APROBACIONES

## Necesidad

Control de autorizaciones.

## Pantallas

```text
Bandeja Aprobaciones
```

## APIs

```text
POST /approvals

POST /approvals/{id}/approve

POST /approvals/{id}/reject
```

## Tablas

```text
approval_flows

approval_steps

approval_rules

approval_requests
```

---

# TRABAJOS

## Necesidad

Gestionar ejecución.

## Pantallas

```text
Listado Trabajos

Detalle Trabajo

Programación
```

## APIs

```text
GET /jobs

POST /jobs

PUT /jobs/{id}

POST /jobs/{id}/start

POST /jobs/{id}/close
```

## Tablas

```text
jobs
```

## Reglas

```text
RN-013

RN-014

RN-015

RN-016

RN-017

RN-018
```

---

# ACTIVIDADES

## APIs

```text
GET /activities

POST /activities

PUT /activities/{id}
```

## Tablas

```text
job_activities
```

---

# DOCUMENTOS

## APIs

```text
POST /documents

GET /documents

GET /documents/{id}
```

## Tablas

```text
documents
```

## Reglas

```text
RN-019

RN-020
```

---

# FACTURACIÓN

## APIs

```text
GET /invoices

POST /invoices

PUT /invoices/{id}
```

## Tablas

```text
invoices

invoice_taxes
```

## Reglas

```text
RN-021

RN-022

RN-023
```

---

# PAGOS

## APIs

```text
GET /payments

POST /payments

POST /payments/{id}/confirm
```

## Tablas

```text
payments

customer_advances
```

## Reglas

```text
RN-024

RN-025
```

---

# COSTOS

## APIs

```text
GET /costs

POST /costs

POST /costs/{id}/approve
```

## Tablas

```text
costs

job_budgets
```

## Reglas

```text
RN-026

RN-027

RN-028
```

---

# INVENTARIO

## APIs

```text
GET /inventory/items

POST /inventory/items

POST /inventory/movements
```

## Tablas

```text
inventory_items

inventory_stock

inventory_movements

warehouses
```

## Reglas

```text
RN-029

RN-030

RN-031
```

---

# GARANTÍAS

## APIs

```text
GET /warranties

POST /warranties

POST /interventions
```

## Tablas

```text
warranties

warranty_interventions
```

## Reglas

```text
RN-032

RN-033
```

---

# ALERTAS

## APIs

```text
GET /alerts

POST /alerts
```

## Tablas

```text
alerts

alert_recipients
```

## Reglas

```text
RN-034
```

---

# AUDITORÍA

## APIs

```text
GET /audit
```

## Tablas

```text
audit_log
```

## Reglas

```text
RN-035

RN-043
```

---

# KPI

## APIs

```text
GET /kpis

POST /kpis/calculate
```

## Tablas

```text
kpi_definitions

kpi_formulas

kpi_history
```

## Reglas

```text
RN-039

RN-040
```

---

# DASHBOARD

## APIs

```text
GET /dashboards

GET /widgets
```

## Tablas

```text
dashboards

dashboard_widgets

dashboard_preferences
```

---

# VALIDACIÓN OBLIGATORIA

Antes de cerrar cualquier módulo verificar:

Existe Pantalla

Existe API

Existe Tabla

Existe Regla

Existe Prueba

Existe Auditoría

Existe Permiso

Si falta uno:

Módulo incompleto.
