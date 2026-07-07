# RLS POLICIES — Row Level Security

## Principios

1. **Toda tabla operacional tiene RLS habilitado.**
2. **Por defecto DENEGAR todo.** Solo permitir lo explícito.
3. **Aislamiento por `tenant_id`.**
4. **Respetar roles del ERP (no solo auth).**

---

## Configuración por tabla

```sql
-- Habilitar RLS en la tabla
ALTER TABLE {tabla} ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso
CREATE POLICY "{nombre}" ON {tabla} FOR {accion} USING ({condicion});
```

---

## 1. tenants

```sql
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Solo SUPER_ADMIN puede ver todos los tenants
CREATE POLICY "tenants_select_admin" ON tenants
  FOR SELECT USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');

-- Cada tenant puede ver su propio registro
CREATE POLICY "tenants_select_own" ON tenants
  FOR SELECT USING (id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Solo SUPER_ADMIN puede crear/modificar
CREATE POLICY "tenants_insert_admin" ON tenants
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'SUPER_ADMIN');
CREATE POLICY "tenants_update_admin" ON tenants
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'SUPER_ADMIN');
```

---

## 2. Tablas operacionales (patrón universal)

Toda tabla con `tenant_id` usa este patrón:

```sql
-- SELECT: ver solo registros del tenant propio
CREATE POLICY "{tabla}_select" ON {tabla}
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- INSERT: crear solo en tenant propio
CREATE POLICY "{tabla}_insert" ON {tabla}
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- UPDATE: modificar solo registros del tenant propio
CREATE POLICY "{tabla}_update" ON {tabla}
  FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- DELETE: NO PERMITIDO. Se usa soft delete.
-- SIN POLÍTICA DELETE → denegado por defecto.
```

### Tablas que siguen este patrón

Todas las tablas del ERP excepto las del sistema global:
- `users_profiles`, `roles`, `role_permissions`, `usuario_roles`
- `leads`, `lead_interacciones`, `empresas`, `contactos`, `clientes`
- `oportunidades`, `oportunidad_actividades`
- `requerimientos`, `requerimiento_diagnosticos`, `requerimiento_ingenieria`
- `cotizaciones`, `cotizacion_items`, `cotizacion_versiones`, `cotizacion_aprobaciones`
- `ordenes_trabajo`, `job_tareas`, `job_checklist`, `job_materiales`, `job_horas`, `job_evidencias`, `job_hitos`
- `categorias_producto`, `productos`, `bodegas`, `ubicaciones`, `stock`
- `series`, `lotes`, `movimientos`, `inventario_fisico`, `inventario_fisico_items`
- `proveedores`, `solicitudes_compra`, `solicitud_compra_items`
- `cotizaciones_proveedor`, `cotizacion_proveedor_items`
- `ordenes_compra`, `oc_items`, `recepciones`, `recepcion_items`
- `facturas`, `factura_items`, `factura_versiones`, `pagos`, `pago_facturas`
- `notas_credito`, `anticipos`
- `garantias`, `tickets`, `ticket_mensajes`, `documentos`
- `cms_paginas`, `cms_blog`, `cms_productos`, `cms_servicios`
- `cms_casos_exito`, `cms_testimonios`, `cms_banners`, `cms_menu`

---

## 3. Tablas del sistema (solo ADMIN)

```sql
-- tenant_settings
CREATE POLICY "tenant_settings_admin" ON tenant_settings
  FOR ALL USING (auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN'));

-- integraciones
CREATE POLICY "integraciones_admin" ON integraciones
  FOR ALL USING (auth.jwt() ->> 'role' IN ('SUPER_ADMIN', 'ADMIN'));

-- plantillas_notificacion
CREATE POLICY "plantillas_admin" ON plantillas_notificacion
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

---

## 4. Tablas inmutables (solo lectura / solo insert)

```sql
-- audit_log: solo INSERT, nunca SELECT para usuarios normales
CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
-- Sin política SELECT → solo ADMIN/GERENTE puede ver

-- business_events: solo INSERT
CREATE POLICY "business_events_insert" ON business_events
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- cotizacion_versiones: solo INSERT
CREATE POLICY "cotizacion_versiones_insert" ON cotizacion_versiones
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "cotizacion_versiones_select" ON cotizacion_versiones
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- movimientos (inventario): solo INSERT, SELECT
CREATE POLICY "movimientos_insert" ON movimientos
  FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
CREATE POLICY "movimientos_select" ON movimientos
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
-- Sin UPDATE ni DELETE
```

---

## 5. Portal Cliente

```sql
-- Clientes solo ven sus propios datos
CREATE POLICY "clientes_select_own" ON clientes
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND id = (auth.jwt() ->> 'cliente_id')::uuid
  );

-- Facturas visibles solo para el cliente
CREATE POLICY "facturas_select_client" ON facturas
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND cliente_id = (auth.jwt() ->> 'cliente_id')::uuid
  );

-- Tickets visibles solo para el cliente
CREATE POLICY "tickets_select_client" ON tickets
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND cliente_id = (auth.jwt() ->> 'cliente_id')::uuid
  );
```

---

## 6. Helper function

```sql
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS uuid
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid
  );
$$;
```

---

## 7. Plantilla de política (template)

```sql
-- Para cada tabla operacional nueva:
ALTER TABLE {tabla} ENABLE ROW LEVEL SECURITY;

CREATE POLICY "{tabla}_select" ON {tabla}
  FOR SELECT USING (tenant_id = current_tenant_id());

CREATE POLICY "{tabla}_insert" ON {tabla}
  FOR INSERT WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY "{tabla}_update" ON {tabla}
  FOR UPDATE USING (tenant_id = current_tenant_id());
```
