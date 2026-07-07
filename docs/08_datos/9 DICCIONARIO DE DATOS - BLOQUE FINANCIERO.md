Perfecto.

# CAPÍTULO 9

# DICCIONARIO DE DATOS

## BLOQUE FINANCIERO

---

# INVOICES

## Tabla

```text
invoices
```

## Campos

| Campo           | Tipo          | Obligatorio |
| --------------- | ------------- | ----------- |
| id              | uuid          | Sí          |
| tenant_id       | uuid          | Sí          |
| invoice_code    | varchar(50)   | Sí          |
| client_id       | uuid          | Sí          |
| job_id          | uuid          | No          |
| quote_id        | uuid          | No          |
| invoice_date    | date          | Sí          |
| due_date        | date          | Sí          |
| currency_code   | varchar(10)   | Sí          |
| subtotal        | decimal(18,2) | Sí          |
| discount_amount | decimal(18,2) | Sí          |
| tax_amount      | decimal(18,2) | Sí          |
| total_amount    | decimal(18,2) | Sí          |
| paid_amount     | decimal(18,2) | Sí          |
| balance_amount  | decimal(18,2) | Sí          |
| notes           | text          | No          |
| status          | enum          | Sí          |
| created_at      | timestamp     | Sí          |
| created_by      | uuid          | Sí          |

---

## status

```text
Pendiente
ParcialmentePagada
Pagada
Vencida
Anulada
```

---

## Validaciones

```text
client_id obligatorio

invoice_date obligatorio

due_date obligatorio

due_date >= invoice_date

total_amount >= 0

balance_amount calculado
```

---

## Fórmulas

```text
balance_amount =
total_amount - paid_amount
```

---

# INVOICE_TAXES

## Tabla

```text
invoice_taxes
```

## Campos

| Campo          | Tipo          |
| -------------- | ------------- |
| id             | uuid          |
| tenant_id      | uuid          |
| invoice_id     | uuid          |
| tax_code       | varchar(50)   |
| tax_name       | varchar(150)  |
| tax_rate       | decimal(10,4) |
| taxable_amount | decimal(18,2) |
| tax_amount     | decimal(18,2) |

---

## Validaciones

```text
invoice_id obligatorio

tax_rate >= 0
```

---

# PAYMENTS

## Tabla

```text
payments
```

## Campos

| Campo            | Tipo          |
| ---------------- | ------------- |
| id               | uuid          |
| tenant_id        | uuid          |
| payment_code     | varchar(50)   |
| client_id        | uuid          |
| invoice_id       | uuid          |
| payment_date     | date          |
| payment_method   | enum          |
| reference_number | varchar(150)  |
| amount           | decimal(18,2) |
| notes            | text          |
| status           | enum          |
| created_at       | timestamp     |

---

## payment_method

```text
Transferencia

Efectivo

Cheque

Tarjeta

PSE

Otro
```

---

## status

```text
Registrado

Confirmado

Anulado
```

---

## Validaciones

```text
client_id obligatorio

amount > 0

payment_date obligatorio
```

---

# CUSTOMER_ADVANCES

## Tabla

```text
customer_advances
```

## Campos

| Campo            | Tipo          |
| ---------------- | ------------- |
| id               | uuid          |
| tenant_id        | uuid          |
| advance_code     | varchar(50)   |
| client_id        | uuid          |
| payment_id       | uuid          |
| amount           | decimal(18,2) |
| available_amount | decimal(18,2) |
| applied_amount   | decimal(18,2) |
| created_at       | timestamp     |

---

## Fórmulas

```text
available_amount =
amount - applied_amount
```

---

## Validaciones

```text
client_id obligatorio

amount > 0

available_amount >= 0
```

---

# ADVANCE_APPLICATIONS

## Tabla

```text
advance_applications
```

## Campos

| Campo          | Tipo          |
| -------------- | ------------- |
| id             | uuid          |
| tenant_id      | uuid          |
| advance_id     | uuid          |
| invoice_id     | uuid          |
| applied_amount | decimal(18,2) |
| applied_at     | timestamp     |

---

## Validaciones

```text
applied_amount > 0

No superar saldo disponible
```

---

# COSTS

## Tabla

```text
costs
```

## Campos

| Campo       | Tipo          |
| ----------- | ------------- |
| id          | uuid          |
| tenant_id   | uuid          |
| cost_code   | varchar(50)   |
| job_id      | uuid          |
| cost_type   | enum          |
| description | text          |
| quantity    | decimal(18,4) |
| unit        | varchar(50)   |
| unit_cost   | decimal(18,2) |
| total_cost  | decimal(18,2) |
| document_id | uuid          |
| cost_date   | date          |
| status      | enum          |
| created_at  | timestamp     |

---

## cost_type

```text
Material

ManoObra

Equipo

ServicioTercero

Transporte

Viatico

Otro
```

---

## status

```text
Registrado

Aprobado

Rechazado
```

---

## Fórmulas

```text
total_cost =
quantity × unit_cost
```

---

## Validaciones

```text
job_id obligatorio

quantity > 0

unit_cost >= 0
```

---

# JOB_BUDGETS

## Tabla

```text
job_budgets
```

## Campos

| Campo           | Tipo          |
| --------------- | ------------- |
| id              | uuid          |
| tenant_id       | uuid          |
| job_id          | uuid          |
| budget_type     | enum          |
| planned_amount  | decimal(18,2) |
| approved_amount | decimal(18,2) |
| created_at      | timestamp     |

---

## budget_type

```text
Material

ManoObra

Equipo

ServicioTercero

Transporte

Viatico

Otro
```

---

# KPI FINANCIEROS OBLIGATORIOS

## Facturación Total

```text
SUM(invoices.total_amount)
```

---

## Pagos Recibidos

```text
SUM(payments.amount)
WHERE status='Confirmado'
```

---

## Cartera Pendiente

```text
SUM(invoices.balance_amount)
```

---

## Facturas Vencidas

```text
COUNT(invoices)
WHERE status='Vencida'
```

---

## Costo Total

```text
SUM(costs.total_cost)
WHERE status='Aprobado'
```

---

## Margen Bruto

```text
Ingresos - Costos
```

---

## Rentabilidad %

```text
((Ingresos - Costos)
 / Ingresos) * 100
```

---

# REGLAS FINANCIERAS

```text
Toda factura pertenece a un cliente.

Toda factura puede tener múltiples pagos.

Todo pago debe quedar auditado.

Toda aplicación de anticipo debe quedar auditada.

Todo costo debe pertenecer a un trabajo.

Todo costo requiere aprobación.

No puede existir saldo negativo.

No puede aplicarse un anticipo superior al disponible.
```

---

# RELACIONES

```text
Invoice
 ├── Taxes
 ├── Payments
 └── Advance Applications

Advance
 └── Advance Applications

Job
 ├── Costs
 └── Budgets
```

---

# BLOQUE FINANCIERO

```text
100% Congelado
```

---

# SIGUIENTE BLOQUE

```text
INVENTARIO

BODEGAS

STOCK

MOVIMIENTOS

GARANTÍAS

INTERVENCIONES

KPIs

AUDITORÍA

CONFIGURACIONES
```

Este siguiente bloque cerrará prácticamente el **100% del Diccionario de Datos del ERP**.
