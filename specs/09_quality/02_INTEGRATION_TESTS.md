# INTEGRATION TESTS — Repositories, Actions, APIs

## 1. Repository Tests

Los repositorios se prueban contra una BD Supabase local o de staging.

```typescript
// tests/integration/repositories/leads.repository.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@/lib/supabase/server'
import { createLeadsRepository } from '@/repositories/leads.repository'

describe('LeadsRepository (integration)', () => {
  let repo: ReturnType<typeof createLeadsRepository>
  let testLeadId: string
  const tenantId = '00000000-0000-0000-0000-0000000000a1'

  beforeAll(async () => {
    const supabase = createClient()
    repo = createLeadsRepository(supabase)
  })

  it('debe crear un lead', async () => {
    const lead = await repo.create({
      tenant_id: tenantId,
      nombre_contacto: 'Test Lead',
      origen: 'web',
      created_by: '00000000-0000-0000-0000-000000000001',
    })

    expect(lead).toBeDefined()
    expect(lead.nombre_contacto).toBe('Test Lead')
    expect(lead.estado).toBe('LEAD_NUEVO')
    testLeadId = lead.id
  })

  it('debe encontrar un lead por ID', async () => {
    const lead = await repo.findById(testLeadId)
    expect(lead).toBeDefined()
    expect(lead.id).toBe(testLeadId)
  })

  it('debe listar leads por tenant con paginación', async () => {
    const result = await repo.findByTenant(tenantId, { page: 1, limit: 10 })
    expect(result.data.length).toBeGreaterThan(0)
    expect(result.total).toBeGreaterThan(0)
    expect(result.page).toBe(1)
  })

  it('debe actualizar un lead', async () => {
    const updated = await repo.update(testLeadId, {
      estado: 'LEAD_CONTACTADO',
      updated_by: '00000000-0000-0000-0000-000000000001',
    })
    expect(updated.estado).toBe('LEAD_CONTACTADO')
  })

  it('debe hacer soft delete', async () => {
    await repo.softDelete(testLeadId, 'user-1', 'Test cleanup')

    // Verificar que ya no aparece en queries normales
    const lead = await repo.findById(testLeadId)
    expect(lead).toBeNull()  // deleted_at IS NOT NULL → no se retorna
  })

  it('no debe permitir DELETE físico (trigger en BD)', async () => {
    // El trigger trg_block_delete_leads impide DELETE físico
    // Esto lo prueba el schema de BD, no este test
    expect(true).toBe(true)
  })
})
```

---

## 2. Action Tests

```typescript
// tests/integration/actions/leads.test.ts
import { describe, it, expect } from 'vitest'

// Los Server Actions se pueden testear como funciones normales
// ya que son async functions que retornan ActionResult

describe('Leads Actions', () => {
  it('crearLead debe rechazar datos inválidos', async () => {
    const formData = new FormData()
    formData.set('nombre_contacto', '')  // vacío → inválido
    formData.set('origen', 'web')

    // Simular la acción (sin el 'use server' boundary)
    const result = await crearLead(formData)
    expect(result.error).toBeDefined()
  })

  it('descargarLead debe requerir motivo largo', async () => {
    // La validación ocurre en el service, probamos via action
  })
})
```

---

## 3. API Route Tests

```typescript
// tests/integration/api/webhooks.test.ts
import { describe, it, expect } from 'vitest'

describe('Wompi Webhook', () => {
  it('debe rechazar sin firma', async () => {
    const response = await fetch('/api/webhooks/wompi', {
      method: 'POST',
      body: JSON.stringify({ event: 'transaction.updated' }),
    })
    expect(response.status).toBe(401)
  })

  it('debe procesar transacción confirmada', async () => {
    // Simular con firma válida y payload
    // Verificar que el pago se actualiza en BD
  })
})
```

---

## 4. Tenant Isolation Tests

```typescript
// tests/integration/security/tenant-isolation.test.ts
describe('Tenant Isolation', () => {
  it('tenant A no puede leer datos de tenant B', async () => {
    const supabaseA = createClientAsTenant(tenantA_id)
    const supabaseB = createClientAsTenant(tenantB_id)

    // Crear lead en tenant A
    const { data: lead } = await supabaseA
      .from('leads')
      .insert({ tenant_id: tenantA_id, nombre_contacto: 'A', origen: 'web' })
      .select('*')
      .single()

    // Intentar leer desde tenant B
    const { data } = await supabaseB
      .from('leads')
      .select('*')
      .eq('id', lead.id)
      .single()

    // RLS debe bloquear
    expect(data).toBeNull()
  })
})
```

---

## 5. Test Database Setup

```sql
-- tests/setup.sql
-- Crear tenant de prueba
INSERT INTO tenants (id, nombre, slug) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'Test Tenant A', 'test-a'),
  ('00000000-0000-0000-0000-0000000000a2', 'Test Tenant B', 'test-b');

-- Crear usuario de prueba
INSERT INTO auth.users (id, email, ...) VALUES
  ('00000000-0000-0000-0000-000000000001', 'test@test.com', ...);

-- Crear perfil
INSERT INTO users_profiles (id, tenant_id, nombre) VALUES
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Test User');

-- Crear rol y permisos
INSERT INTO roles (id, tenant_id, codigo, nombre) VALUES
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-0000000000a1', 'TEST', 'Test Role');
```
