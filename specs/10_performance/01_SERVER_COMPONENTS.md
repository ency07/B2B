# SERVER COMPONENTS — RSC, Streaming, Suspense

## 1. RSC por defecto

```typescript
// ✅ CORRECTO: Server Component (default)
// app/(dashboard)/crm/leads/page.tsx
export default async function LeadsPage() {
  const data = await obtenerLeads()  // Fetch en servidor
  return <LeadsTable data={data} />    // HTML enviado al cliente
}
// → 0 KB de JS para esta página
```

```typescript
// ❌ INCORRECTO: Todo Client Component
'use client'
export default function LeadsPage() {
  const [leads, setLeads] = useState([])
  useEffect(() => {
    fetch('/api/leads').then(r => r.json()).then(setLeads)
  }, [])
  return <LeadsTable data={leads} />
}
// → JS bundle + cliente espera fetch
```

---

## 2. Streaming con Suspense

### Estructura de página con streaming

```typescript
// app/(dashboard)/dashboard/page.tsx
import { Suspense } from 'react'

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" />

      {/* Se renderiza INMEDIATAMENTE (estático) */}
      <Suspense fallback={<KPISkeleton />}>
        <KPISection />           {/* Se streamea cuando los datos llegan */}
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Múltiples streams paralelos */}
          <Suspense fallback={<WidgetSkeleton />}>
            <WidgetsSection />
          </Suspense>
        </div>
        <div>
          <Suspense fallback={<AlertsSkeleton />}>
            <AlertsSection />
          </Suspense>
        </div>
      </div>

      {/* Stream tardío (menos prioritario) */}
      <Suspense fallback={null}>
        <RecentActivitySection />
      </Suspense>
    </div>
  )
}
```

### Componentes de skeleton

```typescript
// components/features/dashboard/kpi-skeleton.tsx
export function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-zinc-800/60 p-4 animate-pulse">
          <div className="h-3 w-16 bg-zinc-800 rounded mb-3" />
          <div className="h-7 w-24 bg-zinc-800 rounded mb-2" />
          <div className="h-3 w-20 bg-zinc-800 rounded" />
        </div>
      ))}
    </div>
  )
}
```

---

## 3. Partial Prerendering (PPR)

```typescript
// next.config.js
const nextConfig = {
  experimental: {
    ppr: 'incremental',
  },
}

// En layout.tsx, marcar qué es estático:
export default function Layout({ children }) {
  return (
    <div>
      <Sidebar />           {/* ← estático (prerenderizado) */}
      <Suspense fallback={<Skeleton />}>
        {children}           {/* ← dinámico (streameado) */}
      </Suspense>
    </div>
  )
}
```

---

## 4. Data Fetching patterns

### Fetch en paralelo (no en cascada)

```typescript
// ✅ CORRECTO: Paralelo
export default async function Page() {
  const [leads, kpis, activity] = await Promise.all([
    obtenerLeads(),
    obtenerKPIs(),
    obtenerActividad(),
  ])
  return <Dashboard leads={leads} kpis={kpis} activity={activity} />
}

// ❌ INCORRECTO: Cascada (serial)
export default async function Page() {
  const leads = await obtenerLeads()      // Espera 1
  const kpis = await obtenerKPIs()        // Espera 2 (depende de leads?)
  const activity = await obtenerActividad() // Espera 3
}
```

### Fetch con Suspense (granular)

```typescript
// Más granularidad = mejor UX
// Cada sección se streamea independientemente
export default function Page() {
  return (
    <>
      <Suspense><LeadsSection /></Suspense>
      <Suspense><KPISection /></Suspense>
      <Suspense><ActivitySection /></Suspense>
    </>
  )
}
```

---

## 5. Client Components mínimos

```typescript
// ✅ CORRECTO: Separar parte interactiva
// search-bar.tsx (Client Component — solo esto tiene JS)
'use client'
export function SearchBar() {
  const [query, setQuery] = useState('')
  return <input value={query} onChange={...} />
}

// leads-page.tsx (Server Component — 0 KB JS)
export default async function LeadsPage() {
  const leads = await obtenerLeads()
  return (
    <>
      <SearchBar />          {/* Solo este componente lleva JS */}
      <LeadsTable data={leads} />
    </>
  )
}
```

---

## 6. `next/dynamic` para componentes pesados

```typescript
import dynamic from 'next/dynamic'

// Cargar solo cuando se necesita
const RichTextEditor = dynamic(() => import('@/components/cms/rich-text-editor'), {
  loading: () => <div className="h-64 animate-pulse bg-zinc-800/40 rounded-xl" />,
  ssr: false, // Este componente es solo cliente
})

const Chart = dynamic(() => import('@/components/shared/recharts-wrapper'), {
  loading: () => <div className="aspect-[4/3] animate-pulse bg-zinc-800/40 rounded-xl" />,
})
```

---

## 7. Caching con `unstable_cache`

```typescript
import { unstable_cache } from 'next/cache'

const getTenantBranding = unstable_cache(
  async (tenantId: string) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('tenant_settings')
      .select('branding, logos')
      .eq('tenant_id', tenantId)
      .single()
    return data
  },
  ['tenant-branding'],
  { revalidate: 3600, tags: ['branding'] }  // Revalidar cada hora
)

// Revalidar cuando cambia
import { revalidateTag } from 'next/cache'
revalidateTag('branding')
```
