# NAMING CONVENTIONS — Convenciones de Nomenclatura

## 1. Tablas

### Regla

Todas las tablas en **`snake_case`**, en **español**, en **plural**.

| Ejemplo | Significado |
|---|---|
| `leads` | Prospectos comerciales |
| `clientes` | Clientes activos |
| `cotizaciones` | Cotizaciones comerciales |
| `ordenes_trabajo` | Órdenes de trabajo |
| `facturas` | Facturas emitidas |
| `pagos` | Pagos registrados |
| `productos` | Productos del inventario |
| `proveedores` | Proveedores |
| `ordenes_compra` | Órdenes de compra |
| `garantias` | Garantías activas |

### Excepciones aprobadas

| Tabla | Razón |
|---|---|
| `leads` | Término universal en CRM (no se traduce) |
| `audit_log` | Término técnico universal |
| `business_events` | Término de arquitectura empresarial |

### Tablas de relación (many-to-many)

Nombradas con las dos entidades en orden alfabético:

| Ejemplo |
|---|
| `cotizacion_productos` |
| `job_materiales` |
| `role_permissions` |
| `usuario_roles` |

---

## 2. Columnas

### Regla

Todas las columnas en **`snake_case`**, en **español** (excepto IDs y metadatos técnicos).

### Columnas estándar (toda tabla operacional)

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador único |
| `tenant_id` | `uuid NOT NULL REFERENCES tenants(id)` | Tenant propietario |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | Fecha de creación |
| `created_by` | `uuid NOT NULL REFERENCES auth.users(id)` | Usuario creador |
| `updated_at` | `timestamptz NOT NULL DEFAULT now()` | Última modificación |
| `updated_by` | `uuid NOT NULL REFERENCES auth.users(id)` | Usuario modificador |
| `deleted_at` | `timestamptz` | Soft delete: fecha de borrado |
| `deleted_by` | `uuid REFERENCES auth.users(id)` | Soft delete: usuario que borró |
| `delete_reason` | `text` | Soft delete: motivo del borrado |

### Columnas de estado

| Columna | Tipo | Ejemplo |
|---|---|---|
| `estado` | `text NOT NULL` | `'LEAD_NUEVO'`, `'APROBADA'`, `'EN_EJECUCION'` |
| `motivo_cancelacion` | `text` | Requerido si estado incluye `CANCELADO` |

### Columnas de auditoría

| Columna | Tipo | Descripción |
|---|---|---|
| `version` | `integer DEFAULT 1` | Control de versiones |
| `metadata` | `jsonb DEFAULT '{}'` | Datos extensibles |

---

## 3. Primary Keys

| Regla | Ejemplo |
|---|---|
| Siempre `uuid` | `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` |
| Columna siempre `id` | No `lead_id`, `client_id` |
| FK siempre `{tabla}_id` | `lead_id`, `cliente_id`, `cotizacion_id` |

---

## 4. Foreign Keys

```
{tabla_referenciada}_id → references {tabla_referenciada}(id)
```

| FK | Referencia |
|---|---|
| `tenant_id` | `tenants(id)` |
| `lead_id` | `leads(id)` |
| `cliente_id` | `clientes(id)` |
| `cotizacion_id` | `cotizaciones(id)` |
| `factura_id` | `facturas(id)` |
| `created_by` | `auth.users(id)` |
| `updated_by` | `auth.users(id)` |

---

## 5. Índices

```
idx_{tabla}_{columna(s)}
```

| Ejemplo |
|---|
| `idx_leads_tenant_id` |
| `idx_leads_estado` |
| `idx_leads_tenant_estado` |
| `idx_cotizaciones_tenant_fecha` |

---

## 6. Constraints

```
{tabla}_{tipo}_{detalle}
```

| Tipo | Formato | Ejemplo |
|---|---|---|
| PK | `{tabla}_pkey` | `leads_pkey` |
| FK | `fk_{tabla}_{ref}` | `fk_leads_tenant` |
| UNIQUE | `uq_{tabla}_{col}` | `uq_usuarios_email` |
| CHECK | `ck_{tabla}_{regla}` | `ck_facturas_monto_minimo` |
| DEFAULT | — | `DEFAULT now()` |

---

## 7. Triggers

```
trg_{accion}_{tabla}
```

| Ejemplo | Descripción |
|---|---|
| `trg_audit_leads` | Auditoría en tabla leads |
| `trg_block_delete_facturas` | Bloquear DELETE en facturas |
| `trg_generate_code_cotizaciones` | Generar código secuencial |
| `trg_validate_cancel_reason` | Validar motivo de cancelación |
| `trg_update_inventory_on_reception` | Actualizar inventario al recibir |

---

## 8. Funciones / RPC

```
fn_{verbo}_{objeto}
```

| Ejemplo | Descripción |
|---|---|
| `fn_calcular_score_lead` | Calcular scoring de lead |
| `fn_generar_codigo` | Generar código secuencial |
| `fn_calcular_cfm` | Calcular CFM estimado |
| `fn_obtener_kardex` | Obtener kardex de producto |
| `fn_verificar_stock` | Verificar disponibilidad de stock |
| `fn_calcular_rentabilidad_ot` | Calcular rentabilidad de OT |

---

## 9. Secuencias

```
seq_{proposito}
```

Todas las secuencias se gestionan via `tenant_sequences`, no con `MAX(id) + 1`.

| Ejemplo | Formato de código |
|---|---|
| `seq_cotizaciones` | `COT-0001` |
| `seq_ordenes_trabajo` | `OT-0001` |
| `seq_facturas` | `FAC-0001` |
| `seq_ordenes_compra` | `OC-0001` |
| `seq_pagos` | `REC-0001` |
| `seq_clientes` | `CLI-0001` |
| `seq_leads` | `LD-0001` |
| `seq_productos` | `PROD-0001` |
| `seq_tickets` | `TK-0001` |

---

## 10. Views

```
vw_{proposito}
```

| Ejemplo | Descripción |
|---|---|
| `vw_leads_activos` | Leads no eliminados ni convertidos |
| `vw_facturas_pendientes` | Facturas con saldo > 0 |
| `vw_cartera_por_cliente` | Resumen de cartera por cliente |
| `vw_stock_actual` | Stock actual por producto y bodega |
| `vw_kpis_comerciales` | KPIs del dashboard comercial |
| `vw_kpis_operaciones` | KPIs del dashboard de operaciones |

---

## 11. Tipos de datos estándar

| Propósito | Tipo SQL | Ejemplo |
|---|---|---|
| ID primario | `uuid` | `gen_random_uuid()` |
| ID foráneo | `uuid` | Referencia a otra tabla |
| Texto corto | `text` | Nombres, descripciones |
| Texto largo | `text` | Comentarios, contenido rich text |
| Números enteros | `integer` | Cantidades, contadores |
| Números decimales | `numeric(15,2)` | Montos, precios, costos |
| Porcentajes | `numeric(5,2)` | 0.00 - 100.00 |
| Fechas | `date` | Fecha sin hora |
| Timestamps | `timestamptz` | Siempre con zona horaria UTC |
| Booleanos | `boolean` | Flags |
| JSON | `jsonb` | Metadatos, configuración, diffs |
| Arrays | `text[]`, `uuid[]` | Listas de valores |
| Enumeraciones | `text` + CHECK | Estados (no usar ENUM de PG) |

---

## 12. Estados

Nunca usar ENUM de PostgreSQL. Siempre `text` con CHECK constraint.

```
estado text NOT NULL CHECK (estado IN (
  'LEAD_NUEVO', 'LEAD_CONTACTADO', 'LEAD_CALIFICADO', ...
))
```
