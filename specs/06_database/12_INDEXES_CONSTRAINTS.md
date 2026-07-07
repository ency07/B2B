# INDEXES & CONSTRAINTS — Índices y Restricciones

## 1. Índices obligatorios (toda tabla operacional)

```sql
-- Índice compuesto para filtrado por tenant
CREATE INDEX idx_{tabla}_tenant_id ON {tabla}(tenant_id);

-- Índice para soft delete
CREATE INDEX idx_{tabla}_deleted_at ON {tabla}(deleted_at) WHERE deleted_at IS NULL;

-- Índice para estado (si tiene columna estado)
CREATE INDEX idx_{tabla}_estado ON {tabla}(estado);

-- Índice para búsqueda temporal
CREATE INDEX idx_{tabla}_created_at ON {tabla}(created_at DESC);

-- Índice compuesto tenant + estado (filtro más común)
CREATE INDEX idx_{tabla}_tenant_estado ON {tabla}(tenant_id, estado);
```

---

## 2. Índices por módulo

### CRM

```sql
-- Leads
CREATE INDEX idx_leads_tenant_score ON leads(tenant_id, score DESC);
CREATE INDEX idx_leads_comercial ON leads(comercial_id);
CREATE INDEX idx_leads_origen ON leads(origen);
CREATE INDEX idx_leads_sla ON leads(sla_vencimiento) WHERE estado IN ('LEAD_NUEVO', 'LEAD_CONTACTADO');

-- Clientes
CREATE INDEX idx_clientes_empresa ON clientes(empresa_id);
CREATE INDEX idx_clientes_comercial ON clientes(comercial_id);

-- Contactos
CREATE INDEX idx_contactos_empresa ON contactos(empresa_id);

-- Oportunidades
CREATE INDEX idx_oportunidades_fase ON oportunidades(tenant_id, fase);
CREATE INDEX idx_oportunidades_probabilidad ON oportunidades(tenant_id, probabilidad DESC);
```

### Cotizaciones

```sql
CREATE INDEX idx_cotizaciones_cliente ON cotizaciones(cliente_id);
CREATE INDEX idx_cotizaciones_requerimiento ON cotizaciones(requerimiento_id);
CREATE INDEX idx_cotizaciones_tenant_fecha ON cotizaciones(tenant_id, created_at DESC);

CREATE INDEX idx_cotizacion_items_cotizacion ON cotizacion_items(cotizacion_id);

CREATE INDEX idx_cotizacion_versiones_cotizacion ON cotizacion_versiones(cotizacion_id);
```

### Órdenes de Trabajo

```sql
CREATE INDEX idx_ordenes_trabajo_cliente ON ordenes_trabajo(cliente_id);
CREATE INDEX idx_ordenes_trabajo_responsable ON ordenes_trabajo(responsable_id);
CREATE INDEX idx_ordenes_trabajo_fechas ON ordenes_trabajo(fecha_inicio, fecha_entrega);
CREATE INDEX idx_ordenes_trabajo_tenant_prioridad ON ordenes_trabajo(tenant_id, prioridad);

CREATE INDEX idx_job_tareas_job ON job_tareas(job_id);
CREATE INDEX idx_job_checklist_job ON job_checklist(job_id);
CREATE INDEX idx_job_materiales_job ON job_materiales(job_id);
CREATE INDEX idx_job_horas_job ON job_horas(job_id);
```

### Inventario

```sql
-- Productos
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_tenant_codigo ON productos(tenant_id, codigo);
CREATE INDEX idx_productos_sku ON productos(tenant_id, sku) WHERE sku IS NOT NULL;

-- Stock
CREATE INDEX idx_stock_producto ON stock(producto_id);
CREATE INDEX idx_stock_bodega ON stock(bodega_id);
CREATE INDEX idx_stock_bajo ON stock(tenant_id, disponible) WHERE disponible <= 0;

-- Movimientos (tabla de alto volumen)
CREATE INDEX idx_movimientos_producto ON movimientos(tenant_id, producto_id, created_at DESC);
CREATE INDEX idx_movimientos_documento ON movimientos(documento_tipo, documento_id);
CREATE INDEX idx_movimientos_fecha ON movimientos(tenant_id, created_at DESC);

-- Series
CREATE INDEX idx_series_producto ON series(producto_id);
CREATE INDEX idx_series_tenant_numero ON series(tenant_id, numero_serie);

-- Lotes
CREATE INDEX idx_lotes_producto ON lotes(producto_id);
CREATE INDEX idx_lotes_vencimiento ON lotes(fecha_vencimiento) WHERE estado = 'DISPONIBLE';
```

### Compras

```sql
CREATE INDEX idx_proveedores_tenant ON proveedores(tenant_id, razon_social);
CREATE INDEX idx_proveedores_score ON proveedores(tenant_id, score DESC);

CREATE INDEX idx_solicitudes_compra_solicitante ON solicitudes_compra(solicitante_id);

CREATE INDEX idx_cotizaciones_proveedor_solicitud ON cotizaciones_proveedor(solicitud_id);
CREATE INDEX idx_cotizaciones_proveedor_proveedor ON cotizaciones_proveedor(proveedor_id);

CREATE INDEX idx_ordenes_compra_proveedor ON ordenes_compra(proveedor_id);
CREATE INDEX idx_ordenes_compra_estado ON ordenes_compra(tenant_id, estado);

CREATE INDEX idx_oc_items_oc ON oc_items(oc_id);
CREATE INDEX idx_recepciones_oc ON recepciones(oc_id);
```

### Facturación

```sql
CREATE INDEX idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX idx_facturas_estado ON facturas(tenant_id, estado);
CREATE INDEX idx_facturas_vencimiento ON facturas(fecha_vencimiento)
  WHERE estado IN ('FACTURA_EMITIDA', 'FACTURA_PAGADA_PARCIAL', 'FACTURA_VENCIDA');
CREATE INDEX idx_facturas_tenant_fecha ON facturas(tenant_id, created_at DESC);

CREATE INDEX idx_pagos_cliente ON pagos(cliente_id);
CREATE INDEX idx_pagos_estado ON pagos(tenant_id, estado);

CREATE INDEX idx_pago_facturas_pago ON pago_facturas(pago_id);
CREATE INDEX idx_pago_facturas_factura ON pago_facturas(factura_id);
```

### CMS y Portal

```sql
CREATE INDEX idx_cms_paginas_tenant_slug ON cms_paginas(tenant_id, slug);
CREATE INDEX idx_cms_blog_tenant_slug ON cms_blog(tenant_id, slug);
CREATE INDEX idx_cms_blog_publicado ON cms_blog(tenant_id, publicado_en DESC) WHERE estado = 'PUBLICADO';

CREATE INDEX idx_tickets_cliente ON tickets(cliente_id);

CREATE INDEX idx_garantias_cliente ON garantias(cliente_id);
CREATE INDEX idx_garantias_estado ON garantias(tenant_id, estado);
```

---

## 3. Constraints CHECK

### Estados

```sql
-- Leads
ALTER TABLE leads ADD CONSTRAINT ck_leads_estado
  CHECK (estado IN ('LEAD_NUEVO', 'LEAD_CONTACTADO', 'LEAD_CALIFICADO',
    'LEAD_ASIGNADO', 'LEAD_NO_CALIFICA', 'LEAD_CONVERTIDO', 'LEAD_DESCARTADO'));

-- Clientes
ALTER TABLE clientes ADD CONSTRAINT ck_clientes_estado
  CHECK (estado IN ('CLIENTE_ACTIVO', 'CLIENTE_SUSPENDIDO', 'CLIENTE_INACTIVO'));

-- Requerimientos
ALTER TABLE requerimientos ADD CONSTRAINT ck_requerimientos_estado
  CHECK (estado IN ('REQUERIMIENTO_ABIERTO', 'REQUERIMIENTO_EN_EVALUACION',
    'REQUERIMIENTO_PRESUPUESTADO', 'REQUERIMIENTO_APROBADO',
    'REQUERIMIENTO_EN_PROYECTO', 'REQUERIMIENTO_FACTURADO',
    'REQUERIMIENTO_CERRADO', 'REQUERIMIENTO_CANCELADO'));

-- Cotizaciones
ALTER TABLE cotizaciones ADD CONSTRAINT ck_cotizaciones_estado
  CHECK (estado IN ('COTIZACION_BORRADOR', 'COTIZACION_ENVIADA',
    'COTIZACION_ACEPTADA', 'COTIZACION_RECHAZADA',
    'COTIZACION_CONVERTIDA_EN_OT', 'COTIZACION_CANCELADA'));

-- Órdenes de Trabajo
ALTER TABLE ordenes_trabajo ADD CONSTRAINT ck_ordenes_trabajo_estado
  CHECK (estado IN ('OT_PROGRAMADA', 'OT_EN_EJECUCION', 'OT_PAUSADA',
    'OT_EN_VERIFICACION', 'OT_FINALIZADA', 'OT_CANCELADA'));

-- Facturas
ALTER TABLE facturas ADD CONSTRAINT ck_facturas_estado
  CHECK (estado IN ('FACTURA_BORRADOR', 'FACTURA_EMITIDA',
    'FACTURA_PAGADA_PARCIAL', 'FACTURA_PAGADA_TOTAL',
    'FACTURA_VENCIDA', 'FACTURA_ANULADA'));

-- Pagos
ALTER TABLE pagos ADD CONSTRAINT ck_pagos_estado
  CHECK (estado IN ('PAGO_PENDIENTE', 'PAGO_PROCESANDO',
    'PAGO_CONFIRMADO', 'PAGO_RECHAZADO', 'PAGO_REVERSADO'));

-- Garantías
ALTER TABLE garantias ADD CONSTRAINT ck_garantias_estado
  CHECK (estado IN ('GARANTIA_ACTIVA', 'GARANTIA_EN_RECLAMO',
    'GARANTIA_EN_EVALUACION', 'GARANTIA_APROBADA',
    'GARANTIA_RECHAZADA', 'GARANTIA_CERRADA', 'GARANTIA_VENCIDA'));

-- OC
ALTER TABLE ordenes_compra ADD CONSTRAINT ck_ordenes_compra_estado
  CHECK (estado IN ('BORRADOR', 'ENVIADA', 'ACEPTADA', 'PARCIAL',
    'RECIBIDA', 'FACTURADA', 'PAGADA', 'CANCELADA'));

-- Solicitudes de Compra
ALTER TABLE solicitudes_compra ADD CONSTRAINT ck_solicitudes_compra_estado
  CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECHAZADA',
    'COTIZANDO', 'CONVERTIDA', 'CANCELADA'));
```

### Otros constraints

```sql
-- Monto mínimo de factura
ALTER TABLE facturas ADD CONSTRAINT ck_facturas_monto_minimo
  CHECK (total >= 50000);

-- Score de lead entre 0 y 100
ALTER TABLE leads ADD CONSTRAINT ck_leads_score
  CHECK (score >= 0 AND score <= 100);

-- Probabilidad entre 0 y 100
ALTER TABLE oportunidades ADD CONSTRAINT ck_oportunidades_prob
  CHECK (probabilidad >= 0 AND probabilidad <= 100);

-- Margen entre 0 y 100
ALTER TABLE cotizaciones ADD CONSTRAINT ck_cotizaciones_margen
  CHECK (margen >= 0 AND margen <= 100);

-- Cantidades no negativas
ALTER TABLE stock ADD CONSTRAINT ck_stock_cantidad_positiva
  CHECK (cantidad >= 0 AND reservado >= 0);
```

---

## 4. Constraints UNIQUE

```sql
-- Códigos secuenciales únicos por tenant
ALTER TABLE cotizaciones ADD CONSTRAINT uq_cotizaciones_codigo UNIQUE (tenant_id, codigo);
ALTER TABLE ordenes_trabajo ADD CONSTRAINT uq_ordenes_trabajo_codigo UNIQUE (tenant_id, codigo);
ALTER TABLE facturas ADD CONSTRAINT uq_facturas_codigo UNIQUE (tenant_id, codigo);
ALTER TABLE pagos ADD CONSTRAINT uq_pagos_codigo UNIQUE (tenant_id, codigo);
ALTER TABLE leads ADD CONSTRAINT uq_leads_codigo UNIQUE (tenant_id, codigo);
ALTER TABLE clientes ADD CONSTRAINT uq_clientes_codigo UNIQUE (tenant_id, codigo);
ALTER TABLE productos ADD CONSTRAINT uq_productos_codigo UNIQUE (tenant_id, codigo);
ALTER TABLE proveedores ADD CONSTRAINT uq_proveedores_codigo UNIQUE (tenant_id, codigo);
ALTER TABLE ordenes_compra ADD CONSTRAINT uq_ordenes_compra_codigo UNIQUE (tenant_id, codigo);
ALTER TABLE tickets ADD CONSTRAINT uq_tickets_codigo UNIQUE (tenant_id, codigo);

-- Roles únicos por tenant
ALTER TABLE roles ADD CONSTRAINT uq_roles_codigo UNIQUE (tenant_id, codigo);

-- Secuencias por tenant y entidad
ALTER TABLE tenant_sequences ADD CONSTRAINT uq_tenant_sequences UNIQUE (tenant_id, entidad);

-- CMS slugs únicos
ALTER TABLE cms_paginas ADD CONSTRAINT uq_cms_paginas_slug UNIQUE (tenant_id, slug);
ALTER TABLE cms_blog ADD CONSTRAINT uq_cms_blog_slug UNIQUE (tenant_id, slug);
ALTER TABLE cms_servicios ADD CONSTRAINT uq_cms_servicios_slug UNIQUE (tenant_id, slug);

-- Stock único por producto-bodega
ALTER TABLE stock ADD CONSTRAINT uq_stock UNIQUE (tenant_id, producto_id, bodega_id);

-- Serie única
ALTER TABLE series ADD CONSTRAINT uq_series_numero UNIQUE (tenant_id, numero_serie);

-- Lote único
ALTER TABLE lotes ADD CONSTRAINT uq_lotes_numero UNIQUE (tenant_id, numero_lote);

-- Versiones únicas
ALTER TABLE cotizacion_versiones ADD CONSTRAINT uq_versiones UNIQUE (cotizacion_id, version);
ALTER TABLE factura_versiones ADD CONSTRAINT uq_factura_versiones UNIQUE (factura_id, version);
```

---

## 5. Estrategia de particionamiento

Para tablas de alto volumen (> 10M registros), considerar particionamiento:

```sql
-- Particionar por tenant_id + rango de fechas
-- audit_log: particionar por tenant_id + created_at (mensual)
-- business_events: particionar por tenant_id + created_at (mensual)
-- movimientos (inventario): particionar por tenant_id + created_at (trimestral)
-- notificaciones_enviadas: particionar por tenant_id + created_at (trimestral)
```

---

## 6. Mantenimiento

```sql
-- ANALYZE programado
-- VACUUM diario (03:00 UTC)
-- REINDEX semanal (domingo 04:00 UTC)

-- Refresh de vistas materializadas
REFRESH MATERIALIZED VIEW vw_kardex;      -- Cada 6 horas
REFRESH MATERIALIZED VIEW vw_cartera;     -- Cada hora
REFRESH MATERIALIZED VIEW vw_stock_actual; -- Cada hora
```
