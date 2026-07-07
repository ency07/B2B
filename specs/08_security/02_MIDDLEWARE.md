# MIDDLEWARE — Next.js Middleware, Route Guards

## 1. Arquitectura del Middleware

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return request.cookies.get(name)?.value },
        set(name, value, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value, ...options })
        },
        remove(name, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Refrescar sesión
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Rutas públicas
  const publicPaths = ['/', '/login', '/recovery', '/reset-password', '/wizard', '/api/webhooks']
  const isPublic = publicPaths.some(p => path.startsWith(p))

  // Rutas de portal (clientes)
  const isPortal = path.startsWith('/portal')

  // Rutas de dashboard (ERP)
  const isDashboard = path.startsWith('/dashboard')

  // Redirecciones
  if (user) {
    // Usuario autenticado
    const role = user.app_metadata?.role

    if (path === '/login') {
      // Si ya tiene sesión, redirigir
      if (role === 'CLIENTE') {
        return NextResponse.redirect(new URL('/portal', request.url))
      }
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (isPortal && role !== 'CLIENTE') {
      // No es cliente, no puede entrar al portal
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    if (isDashboard && role === 'CLIENTE') {
      // Es cliente, no puede entrar al ERP
      return NextResponse.redirect(new URL('/portal', request.url))
    }
  } else {
    // Usuario no autenticado
    if (!isPublic) {
      // Redirigir a login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', path)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## 2. Route Guards por rol (middleware)

```typescript
// lib/auth-guards.ts

export type UserRole =
  | 'SUPER_ADMIN' | 'ADMIN' | 'GERENTE'
  | 'DIRECTOR_COMERCIAL' | 'EJECUTIVO_COMERCIAL' | 'EJECUTIVO_COMERCIAL_SR' | 'ASISTENTE_COMERCIAL'
  | 'DIRECTOR_INGENIERIA' | 'INGENIERO_PROYECTOS' | 'INGENIERO_CAMPO'
  | 'TECNICO_CAMPO' | 'SUPERVISOR_CAMPO'
  | 'DIRECTOR_OPERACIONES' | 'JEFE_PRODUCCION' | 'OPERARIO_PRODUCCION'
  | 'JEFE_INVENTARIO' | 'AUXILIAR_INVENTARIO'
  | 'JEFE_COMPRAS' | 'COMPRADOR'
  | 'DIRECTOR_FINANCIERO' | 'ANALISTA_FINANCIERO' | 'AUXILIAR_FINANCIERO' | 'CONTADOR'
  | 'EDITOR_CONTENIDO' | 'SOPORTE_CLIENTE'
  | 'CLIENTE'

// Rutas que requieren roles específicos
const ROLE_ROUTES: Record<string, UserRole[]> = {
  '/dashboard/settings': ['ADMIN', 'SUPER_ADMIN'],
  '/dashboard/crm': ['ADMIN', 'GERENTE', 'DIRECTOR_COMERCIAL', 'EJECUTIVO_COMERCIAL', 'EJECUTIVO_COMERCIAL_SR', 'ASISTENTE_COMERCIAL'],
  '/dashboard/quotes': ['ADMIN', 'GERENTE', 'DIRECTOR_COMERCIAL', 'EJECUTIVO_COMERCIAL', 'EJECUTIVO_COMERCIAL_SR', 'INGENIERO_PROYECTOS'],
  '/dashboard/jobs': ['ADMIN', 'GERENTE', 'DIRECTOR_OPERACIONES', 'SUPERVISOR_CAMPO', 'TECNICO_CAMPO', 'JEFE_PRODUCCION'],
  '/dashboard/production': ['ADMIN', 'GERENTE', 'DIRECTOR_OPERACIONES', 'JEFE_PRODUCCION', 'OPERARIO_PRODUCCION'],
  '/dashboard/inventory': ['ADMIN', 'GERENTE', 'JEFE_INVENTARIO', 'AUXILIAR_INVENTARIO', 'DIRECTOR_OPERACIONES'],
  '/dashboard/purchases': ['ADMIN', 'GERENTE', 'JEFE_COMPRAS', 'COMPRADOR', 'DIRECTOR_OPERACIONES'],
  '/dashboard/invoices': ['ADMIN', 'GERENTE', 'DIRECTOR_FINANCIERO', 'ANALISTA_FINANCIERO', 'AUXILIAR_FINANCIERO', 'CONTADOR'],
  '/dashboard/payments': ['ADMIN', 'GERENTE', 'DIRECTOR_FINANCIERO', 'ANALISTA_FINANCIERO', 'AUXILIAR_FINANCIERO'],
  '/dashboard/cms': ['ADMIN', 'EDITOR_CONTENIDO'],
  '/portal': ['CLIENTE'],
}

export function checkRouteAccess(path: string, role: UserRole): boolean {
  // SUPER_ADMIN y ADMIN tienen acceso total
  if (role === 'SUPER_ADMIN') return true
  if (role === 'ADMIN' && path.startsWith('/dashboard')) return true

  // Verificar rutas específicas
  for (const [route, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (path.startsWith(route)) {
      return allowedRoles.includes(role)
    }
  }

  return false
}
```

---

## 3. Authentication wrapper (Server Components)

```typescript
// lib/require-auth.ts
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { checkRouteAccess } from '@/lib/auth-guards'

export async function requireAuth(allowedRoles?: string[]) {
  try {
    const session = await auth()
    if (!session) redirect('/login')
    return session
  } catch {
    redirect('/login')
  }
}

export async function requireRole(...roles: string[]) {
  const session = await requireAuth()
  if (!roles.includes(session.role)) {
    redirect('/dashboard?error=unauthorized')
  }
  return session
}
```

### Uso en páginas

```typescript
// app/(dashboard)/crm/leads/page.tsx
import { requireAuth } from '@/lib/require-auth'

export default async function LeadsPage() {
  const session = await requireAuth()  // ← Bloquea si no autenticado

  // El middleware ya verificó el rol, aquí verificamos permisos finos
  const canCreate = await checkPermission(session.userId, 'leads.create')

  return (
    <div>
      <PageHeader title="Leads" action={canCreate && <CreateButton />} />
      <LeadsContent tenantId={session.tenantId} />
    </div>
  )
}
```

---

## 4. API Route protection

```typescript
// app/api/webhooks/wompi/route.ts
export async function POST(request: Request) {
  // 1. Verificar firma de Wompi
  const signature = request.headers.get('x-signature')
  const body = await request.text()
  const isValid = verifyWompiSignature(signature, body)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // ... procesar webhook
}

function verifyWompiSignature(signature: string | null, body: string): boolean {
  if (!signature) return false
  const expected = crypto
    .createHash('sha256')
    .update(body + process.env.WOMPI_EVENTS_KEY)
    .digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
```

---

## 5. XSRF/CSRF Protection

```typescript
// middleware.ts (adicional)
// Next.js Server Actions ya incluyen CSRF protection automáticamente
// El header 'Origin' o 'Referer' debe coincidir con el host

// Para API routes manuales, agregar:
export async function csrfProtection(request: NextRequest) {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  // Solo verificar en POST/PUT/DELETE
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    if (!origin || !host) {
      return NextResponse.json({ error: 'CSRF' }, { status: 403 })
    }

    const originUrl = new URL(origin)
    if (originUrl.host !== host) {
      return NextResponse.json({ error: 'CSRF' }, { status: 403 })
    }
  }

  return null  // OK
}
```
