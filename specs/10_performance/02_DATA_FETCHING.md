# DATA FETCHING — Joins, Caching, Pagination

## 1. Eliminar N+1 queries

### ANTES (N+1)

```typescript
// ❌ N+1: 1 query para leads + N queries para comerciales
const { data: leads } = await supabase.from('leads').select('*')
for (const lead of leads) {
  const { data: comercial } = await supabase
    .from('users_profiles')
    .select('nombre, avatar_url')
    .eq('id', lead.comercial_id)
    .single()
  lead.comercial = comercial
}
```

### DESPUÉS (JOIN)

```typescript
// ✅ 1 query con JOIN incluido
const { data: leads } = await supabase
  .from('leads')
  .select('*, comercial:comercial_id(nombre, avatar_url)')
  .eq('tenant_id', tenantId)
```

### JOINS comunes

```typescript
// Lead con comercial
.select('*, comercial:comercial_id(nombre, avatar_url)')

// Cotización con cliente y empresa
.select('*, cliente:cliente_id(codigo, empresa:empresa_id(razon_social))')

// Cotización con items
.select('*, items:cotizacion_items(*)')

// OT con tareas, checklist y materiales
.select('*, tareas:job_tareas(*), checklist:job_checklist(*), materiales:job_materiales(*, producto:producto_id(nombre, codigo))')

// Factura con cliente y pagos
.select('*, cliente:cliente_id(codigo, empresa:empresa_id(razon_social)), pagos:pago_facturas(*, pago:pago_id(*))')
```

---

## 2. Paginación server-side

```typescript
// Repository toujours con paginación
async function findByTenant(tenantId: string, params: PaginationParams) {
  const { page = 1, limit = 25 } = params
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('leads')
    .select('*', { count: 'exact' })  // ← count para total
    .eq('tenant_id', tenantId)
    .eq('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)                  // ← paginación

  return {
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  }
}
```

---

## 3. Caching con Next.js

```typescript
// 3 niveles de caching

// Nivel 1: Cache de React (memo, useMemo, useCallback)
// Solo en Client Components

// Nivel 2: Cache de datos (fetch)
const getCachedData = unstable_cache(
  async () => { /* query */ },
  ['key'],
  { revalidate: 60 }  // ISR: revalidar cada 60s
)

// Nivel 3: Cache de página completa
export const revalidate = 3600  // ISR: regenerar cada hora

// Nivel 4: Static generation
export const dynamic = 'force-static'  // Prerenderizar en build
```

---

## 4. Evitar fetching innecesario

```typescript
// ❌ Fetch en cada navegación
'use client'
export function LeadsPage() {
  useEffect(() => {
    fetchLeads()  // ← Fetch en cada visita
  }, [])

// ✅ Fetch en servidor + layout persistente
export default async function LeadsLayout({ children }) {
  // Layout no re-fetch cuando navegas entre subpáginas
  const data = await getCachedLeads()
  return <>{children}</>
}
```

---

## 5. Queries específicas por vista

```typescript
// ❌ SELECT * para listas
.select('*')

// ✅ SELECT solo columnas necesarias
.select('id, codigo, nombre_contacto, estado, score, created_at')

// DTO para listas con columnas reducidas
interface LeadListItem {
  id: string
  codigo: string
  nombre_contacto: string
  estado: string
  score: number
  creado: string
}
```

---

## 6. Vistas materializadas

```sql
-- Para queries agregadas costosas (dashboard)
CREATE MATERIALIZED VIEW vw_dashboard_kpis AS
SELECT
  tenant_id,
  COUNT(*) FILTER (WHERE estado NOT IN ('LEAD_CONVERTIDO', 'LEAD_DESCARTADO')) AS leads_activos,
  COUNT(*) FILTER (WHERE estado = 'COTIZACION_ENVIADA') AS cotizaciones_pendientes,
  SUM(total) FILTER (WHERE estado = 'FACTURA_EMITIDA') AS facturacion_pendiente
FROM leads  -- ... joins necesarios
GROUP BY tenant_id;

-- Refresh manual o programado
REFRESH MATERIALIZED VIEW vw_dashboard_kpis;
```

---

## 7. Query limits

```typescript
// Siempre limitar resultados
.limit(25)  // Default para tablas
.limit(100) // Máximo absoluto

// Nunca select * sin límite en producción
// Siempre paginar
```

---

## 8. Reglas de data fetching

1. **Fetch en Server Components.** No en `useEffect`.
2. **Fetch en paralelo.** `Promise.all()` para queries independientes.
3. **JOIN en BD.** No hacer N queries en serie.
4. **SELECT columnas necesarias.** No `*` para listas.
5. **Paginación siempre.** `.range()` + `.limit()`.
6. **Vistas materializadas** para dashboards.
7. **Cache estratégico.** `unstable_cache` para datos que cambian poco.
8. **Suspense granular.** Cada sección con su propio fallback.
