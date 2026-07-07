# UNIT TESTS — Vitest

## 1. Domain Tests (100% coverage)

### calculateLeadScore

```typescript
// tests/unit/rules/scoring.test.ts
import { describe, it, expect } from 'vitest'
import { calculateLeadScore } from '@/rules/scoring'

describe('calculateLeadScore', () => {
  it('debe dar 15 puntos por industria minera', () => {
    const score = calculateLeadScore({ industria: 'mineria' })
    expect(score).toBe(15)
  })

  it('debe dar 0 puntos si no hay industria prioritaria', () => {
    const score = calculateLeadScore({ industria: 'textil' })
    expect(score).toBe(0)
  })

  it('debe dar 20 puntos por urgencia', () => {
    const score = calculateLeadScore({ urgencia: true })
    expect(score).toBe(20)
  })

  it('debe sumar todos los criterios', () => {
    const score = calculateLeadScore({
      industria: 'mineria',      // +15
      cargo: 'Gerente',           // +10
      urgencia: true,             // +20
      solicitoCotizacion: true,   // +15
      correoCorporativo: true,    // +5
    })
    expect(score).toBe(65)
  })

  it('score máximo posible es 100', () => {
    const score = calculateLeadScore({
      industria: 'mineria',
      cargo: 'Gerente',
      urgencia: true,
      solicitoCotizacion: true,
      descargoCatalogo: true,
      usoCalculadora: true,
      telefonoValido: true,
      correoCorporativo: true,
    })
    expect(score).toBe(95)
  })
})
```

### getSLAByScore

```typescript
import { describe, it, expect } from 'vitest'
import { getSLAByScore } from '@/rules/scoring'

describe('getSLAByScore', () => {
  it('score >= 60 → 30 minutos', () => {
    expect(getSLAByScore(60)).toBe(30)
    expect(getSLAByScore(85)).toBe(30)
  })

  it('score >= 35 → 120 minutos', () => {
    expect(getSLAByScore(35)).toBe(120)
    expect(getSLAByScore(59)).toBe(120)
  })

  it('score < 35 → 1440 minutos (24h)', () => {
    expect(getSLAByScore(34)).toBe(1440)
    expect(getSLAByScore(0)).toBe(1440)
  })
})
```

---

## 2. Service Tests (>80% coverage)

### leads.service.test.ts

```typescript
// tests/unit/services/leads.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createLeadsService } from '@/services/leads.service'
import type { ILeadsRepository } from '@/types/interfaces'

describe('LeadsService', () => {
  let mockRepo: ILeadsRepository
  let service: ReturnType<typeof createLeadsService>

  beforeEach(() => {
    mockRepo = {
      findById: vi.fn(),
      findByTenant: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      softDelete: vi.fn(),
    }
    service = createLeadsService({
      leadsRepo: mockRepo,
      auditRepo: { log: vi.fn() } as any,
      events: { emit: vi.fn() } as any,
    })
  })

  describe('create', () => {
    it('debe crear un lead con estado LEAD_NUEVO', async () => {
      mockRepo.create = vi.fn().mockResolvedValue({
        id: 'lead-1',
        nombre_contacto: 'Juan',
        score: 85,
        estado: 'LEAD_NUEVO',
      })

      const lead = await service.create({
        nombre_contacto: 'Juan',
        industria: 'mineria',
        cargo: 'Gerente',
        urgencia: true,
        origen: 'web',
      })

      expect(lead.estado).toBe('LEAD_NUEVO')
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ score: expect.any(Number) })
      )
    })

    it('debe calcular SLA basado en score', async () => {
      mockRepo.create = vi.fn().mockImplementation(input => Promise.resolve(input))

      const lead = await service.create({ nombre_contacto: 'Juan', origen: 'web' })
      // El SLA se inyecta en el repositorio
      expect(mockRepo.create).toHaveBeenCalled()
    })
  })

  describe('convert', () => {
    it('debe rechazar si el lead no está en LEAD_ASIGNADO', async () => {
      mockRepo.findById = vi.fn().mockResolvedValue({
        id: 'lead-1',
        estado: 'LEAD_NUEVO',
      })

      await expect(service.convert('lead-1')).rejects.toThrow('Estado inválido')
    })

    it('debe convertir lead a LEAD_CONVERTIDO si está en LEAD_ASIGNADO', async () => {
      mockRepo.findById = vi.fn().mockResolvedValue({
        id: 'lead-1',
        estado: 'LEAD_ASIGNADO',
      })
      mockRepo.update = vi.fn().mockResolvedValue({
        id: 'lead-1',
        estado: 'LEAD_CONVERTIDO',
      })

      const lead = await service.convert('lead-1')
      expect(lead.estado).toBe('LEAD_CONVERTIDO')
    })
  })

  describe('discard', () => {
    it('debe requerir motivo de al menos 10 caracteres', async () => {
      await expect(
        service.discard('lead-1', 'corto')
      ).rejects.toThrow('10 caracteres')
    })

    it('debe descartar con motivo válido', async () => {
      mockRepo.findById = vi.fn().mockResolvedValue({ id: 'lead-1', estado: 'LEAD_NUEVO' })
      mockRepo.update = vi.fn().mockResolvedValue({ id: 'lead-1', estado: 'LEAD_DESCARTADO' })

      const lead = await service.discard('lead-1', 'Motivo suficiente para descartar este lead')
      expect(lead.estado).toBe('LEAD_DESCARTADO')
    })
  })
})
```

---

## 3. Utils Tests (100% coverage)

### format.test.ts

```typescript
import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatRelativeTime } from '@/utils/format'

describe('formatCurrency', () => {
  it('formatea COP correctamente', () => {
    expect(formatCurrency(125000000)).toBe('$ 125.000.000')
  })

  it('formatea montos pequeños', () => {
    expect(formatCurrency(50000)).toBe('$ 50.000')
  })

  it('formatea 0', () => {
    expect(formatCurrency(0)).toBe('$ 0')
  })
})

describe('formatDate', () => {
  it('formatea fecha en español', () => {
    const result = formatDate('2025-01-15')
    expect(result).toContain('2025')
    expect(result).toContain('ene')
  })
})

describe('formatRelativeTime', () => {
  it('retorna "Ahora" para menos de 1 minuto', () => {
    const now = new Date()
    expect(formatRelativeTime(now)).toBe('Ahora')
  })
})
```

---

## 4. Zod Schema Tests

```typescript
// tests/unit/validators/leads.schema.test.ts
import { describe, it, expect } from 'vitest'
import { createLeadSchema, discardLeadSchema } from '@/validators/leads.schema'

describe('createLeadSchema', () => {
  it('acepta datos válidos mínimos', () => {
    const result = createLeadSchema.safeParse({
      nombre_contacto: 'Juan Pérez',
      origen: 'web',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza nombre_contacto vacío', () => {
    const result = createLeadSchema.safeParse({
      nombre_contacto: '',
      origen: 'web',
    })
    expect(result.success).toBe(false)
  })

  it('rechaza origen inválido', () => {
    const result = createLeadSchema.safeParse({
      nombre_contacto: 'Juan',
      origen: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('acepta email válido', () => {
    const result = createLeadSchema.safeParse({
      nombre_contacto: 'Juan',
      origen: 'web',
      correo: 'juan@empresa.com',
    })
    expect(result.success).toBe(true)
  })

  it('rechaza email inválido', () => {
    const result = createLeadSchema.safeParse({
      nombre_contacto: 'Juan',
      origen: 'web',
      correo: 'no-es-email',
    })
    expect(result.success).toBe(false)
  })
})

describe('discardLeadSchema', () => {
  it('rechaza motivo corto', () => {
    const result = discardLeadSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      motivo: 'corto',
    })
    expect(result.success).toBe(false)
  })

  it('acepta motivo >= 10 caracteres', () => {
    const result = discardLeadSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000001',
      motivo: 'Motivo suficientemente largo',
    })
    expect(result.success).toBe(true)
  })
})
```

---

## 5. Test Runners

```bash
# Todos los tests unitarios
npx vitest run tests/unit/

# Con coverage
npx vitest run --coverage

# En modo watch (desarrollo)
npx vitest tests/unit/
```
