# RLS & TENANT ISOLATION — Aislamiento de Datos

## 1. Row Level Security (RLS)

### Principio

**Todo acceso a datos pasa por RLS. El frontend nunca debe confiar en que el backend ya filtró.**

---

## 2. Patrón universal de RLS

```sql
-- Para TODA tabla operacional:

-- 1. Habilitar RLS
ALTER TABLE {tabla} ENABLE ROW LEVEL SECURITY;

-- 2. Política SELECT: solo ver registros de tu tenant
CREATE POLICY "{tabla}_select_policy" ON {tabla}
  FOR SELECT
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 3. Política INSERT: solo insertar en tu tenant
CREATE POLICY "{tabla}_insert_policy" ON {tabla}
  FOR INSERT
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 4. Política UPDATE: solo modificar registros de tu tenant
CREATE POLICY "{tabla}_update_policy" ON {tabla}
  FOR UPDATE
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- 5. DELETE: NO PERMITIDO
-- Sin política de DELETE = denegado por defecto
-- El soft delete se hace con UPDATE (deleted_at)
```

---

## 3. Helper function para RLS

```sql
-- Función auxiliar para obtener tenant_id del JWT
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT (auth.jwt() ->> 'tenant_id')::uuid
$$;

-- Función auxiliar para verificar rol
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT auth.jwt() ->> 'role'
$$;
```

### Uso en políticas

```sql
CREATE POLICY "admin_full_access" ON {tabla}
  FOR ALL
  USING (current_user_role() IN ('SUPER_ADMIN', 'ADMIN'))
  WITH CHECK (current_user_role() IN ('SUPER_ADMIN', 'ADMIN'));
```

---

## 4. Tenant Isolation Patterns

### 4.1 Aislamiento fuerte (default)

```sql
-- Cada tenant solo ve sus datos. Cross-tenant imposible.
CREATE POLICY "tenant_isolation" ON leads
  FOR ALL
  USING (tenant_id = current_tenant_id());
```

### 4.2 Aislamiento con roles

```sql
-- ADMIN y SUPER_ADMIN tienen acceso total a su tenant
-- Otros roles tienen acceso restringido (solo propios)

CREATE POLICY "leads_admin_access" ON leads
  FOR ALL
  USING (
    tenant_id = current_tenant_id()
    AND current_user_role() IN ('SUPER_ADMIN', 'ADMIN', 'GERENTE')
  );

CREATE POLICY "leads_own_access" ON leads
  FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND comercial_id = auth.uid()
  );

CREATE POLICY "leads_client_access" ON leads
  FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND convertido_a_cliente IN (
      SELECT cliente_id FROM clientes
      WHERE tenant_id = current_tenant_id()
    )
    AND current_user_role() = 'CLIENTE'
  );
```

### 4.3 Portal Client — Solo sus datos

```sql
-- El cliente solo ve sus propias OTs
CREATE POLICY "jobs_client_access" ON ordenes_trabajo
  FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND cliente_id = (auth.jwt() ->> 'cliente_id')::uuid
    AND current_user_role() = 'CLIENTE'
  );

-- El cliente solo ve sus facturas
CREATE POLICY "invoices_client_access" ON facturas
  FOR SELECT
  USING (
    tenant_id = current_tenant_id()
    AND cliente_id = (auth.jwt() ->> 'cliente_id')::uuid
    AND current_user_role() = 'CLIENTE'
  );
```

---

## 5. Verificación de tenant en aplicación

### En repositories (doble verificación)

```typescript
// repositories/leads.repository.ts
async function findById(id: string): Promise<Lead | null> {
  // RLS ya filtra por tenant, pero el repository debe pasar tenant_id
  // para evitar errores de "no rows returned" en Supabase
  // NOTA: No podemos obtener tenant_id del JWT en repositories
  // porque los repositories reciben el cliente Supabase ya autenticado.
  // La confianza está en RLS.

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  // RLS garantiza que solo se retorna si pertenece al tenant
  return data
}
```

### En acciones (validación explícita)

```typescript
// actions/leads.ts
export async function actualizarLead(leadId: string, data: LeadUpdate) {
  const session = await auth()

  // 1. RLS en BD ya protege
  // 2. Verificación adicional en aplicación
  const app = createApp()
  const lead = await app.leadsRepo.findById(leadId)

  if (!lead) {
    return { error: 'Lead no encontrado' }
  }

  // 3. Verificar tenant manualmente (defense in depth)
  if (lead.tenant_id !== session.tenantId) {
    logger.error('Cross-tenant access attempt', {
      userId: session.userId,
      targetTenantId: lead.tenant_id,
      sessionTenantId: session.tenantId,
    })
    return { error: 'No autorizado' }
  }

  // ... continuar
}
```

---

## 6. Protección contra cross-tenant queries

### Anti-patrón (VULNERABLE)

```typescript
// ❌ NUNCA hacer esto
const { data } = await supabase
  .from('leads')
  .select('*')
// Sin tenant_id filter → RLS lo filtra PERO es mala práctica
```

### Patrón correcto

```typescript
// ✅ SIEMPRE incluir tenant_id
const { data } = await supabase
  .from('leads')
  .select('*')
  .eq('tenant_id', session.tenantId)

// RLS lo verificará de nuevo (defense in depth)
```

---

## 7. Auditoría de intentos cross-tenant

```sql
-- Trigger para detectar intentos de acceso cross-tenant
CREATE OR REPLACE FUNCTION fn_detect_cross_tenant_attempt()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_jwt_tenant_id uuid;
BEGIN
  v_jwt_tenant_id := current_tenant_id();

  IF NEW.tenant_id IS DISTINCT FROM v_jwt_tenant_id THEN
    -- Registrar intento
    INSERT INTO security_events (
      tenant_id,
      event_type,
      user_id,
      target_table,
      target_id,
      attempted_tenant_id,
      jwt_tenant_id
    ) VALUES (
      COALESCE(NEW.tenant_id, '00000000-0000-0000-0000-000000000000'),
      'CROSS_TENANT_ATTEMPT',
      auth.uid(),
      TG_TABLE_NAME,
      NEW.id,
      NEW.tenant_id,
      v_jwt_tenant_id
    );

    RAISE EXCEPTION 'Cross-tenant access denied';
  END IF;

  RETURN NEW;
END;
$$;
```

---

## 8. Testing de tenant isolation

```typescript
// tests/integration/tenant-isolation.test.ts
describe('Tenant Isolation', () => {
  it('tenant A no puede ver datos de tenant B', async () => {
    // Crear lead en tenant A
    const leadA = await createLead(tenantA)

    // Autenticar como tenant B
    const supabaseB = createClientAs(tenantB)

    // Intentar acceder al lead de tenant A
    const { data } = await supabaseB
      .from('leads')
      .select('*')
      .eq('id', leadA.id)
      .single()

    // RLS debe bloquear → data es null
    expect(data).toBeNull()
  })

  it('cliente solo ve sus propias facturas', async () => {
    const clienteA = await createClient(tenant)
    const clienteB = await createClient(tenant)

    // Crear factura para cliente A
    await createInvoice(tenant, clienteA)

    // Autenticar como cliente B
    const supabaseB = createClientAsClient(tenant, clienteB)

    // Intentar ver facturas
    const { data } = await supabaseB
      .from('facturas')
      .select('*')

    // Solo debe ver las suyas
    expect(data.every(f => f.cliente_id === clienteB.id)).toBe(true)
  })
})
```

---

## 9. Reglas de RLS y Tenant Isolation

1. **RLS habilitado en TODA tabla operacional.** Sin excepciones.
2. **Default DENY.** Sin política = acceso denegado.
3. **Sin política DELETE.** Delete físico prohibido.
4. **Defense in depth.** RLS + validación en aplicación.
5. **JWT como fuente de tenant_id.** Nunca confiar en el cliente.
6. **Auditar intentos cross-tenant.** Log + alerta.
7. **Testing.** Pruebas automatizadas de aislamiento.
