# RATE LIMITING, HEADERS & CSP

## 1. Rate Limiting

### Estrategia multi-nivel

```
Nivel 1: IP-based (edge/Vercel)
Nivel 2: User-based (auth actions)
Nivel 3: Action-based (Server Actions específicas)
```

### 1.1 IP-based (vercel.json o middleware)

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

// Rate limiter general por IP
export const ipRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1m'),  // 100 requests/min
  analytics: true,
  prefix: 'ratelimit:ip',
})

// Rate limiter para auth (login)
export const authRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15m'),  // 5 intentos/15min
  analytics: true,
  prefix: 'ratelimit:auth',
})

// Rate limiter para acciones específicas
export const actionRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1m'),  // 30 acciones/min
  analytics: true,
  prefix: 'ratelimit:action',
})
```

### 1.2 Rate limiting en middleware

```typescript
// middleware.ts
import { ipRateLimit } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  // Rate limit por IP
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success, limit, reset, remaining } = await ipRateLimit.limit(ip)

  if (!success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
        'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
      },
    })
  }

  // Continuar
}
```

### 1.3 Rate limiting en acciones

```typescript
// actions/leads.ts
import { actionRateLimit } from '@/lib/rate-limit'

export async function crearLead(formData: FormData) {
  const session = await auth()

  // Rate limit por usuario
  const { success } = await actionRateLimit.limit(`leads:create:${session.userId}`)
  if (!success) {
    return { error: 'Demasiadas solicitudes. Intente de nuevo en un momento.' }
  }

  // ... crear lead
}
```

### 1.4 Rate limiting en auth

```typescript
// actions/auth.ts
export async function login(email: string, password: string) {
  // Rate limit por email + IP
  const ip = getCurrentIP()
  const { success } = await authRateLimit.limit(`login:${email}`)
  if (!success) {
    return { error: 'Demasiados intentos. Espere 15 minutos.' }
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Consumir rate limit en fallo
    await authRateLimit.limit(`login:${email}:fail`)
    return { error: 'Credenciales inválidas' }
  }

  return { success: true }
}
```

---

## 2. Security Headers

### next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent MIME type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Prevent clickjacking
          { key: 'X-Frame-Options', value: 'DENY' },
          // XSS protection (legacy, pero no hace daño)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Referrer policy
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Permissions policy
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=(self)' },
          // HSTS (solo en producción con HTTPS)
          ...(process.env.NODE_ENV === 'production' ? [
            { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          ] : []),
        ],
      },
    ]
  },
}
```

---

## 3. Content Security Policy (CSP)

### CSP Configuration

```typescript
// lib/csp.ts
const isDev = process.env.NODE_ENV === 'development'

export function getCSPHeader(nonce: string): string {
  const policies = [
    // Default
    "default-src 'self'",

    // Scripts
    `script-src 'self' 'nonce-${nonce}' ${isDev ? "'unsafe-eval'" : ''}`,

    // Styles
    `style-src 'self' 'unsafe-inline'`,

    // Images
    "img-src 'self' data: blob: https://*.supabase.co",

    // Fonts
    "font-src 'self' https://fonts.gstatic.com",

    // Conectar
    "connect-src 'self' https://*.supabase.co https://sandbox.wompi.co wss://*.supabase.co",

    // Media
    "media-src 'self' blob:",

    // Frame
    "frame-src 'self' https://checkout.wompi.co",

    // Frame ancestors
    "frame-ancestors 'none'",

    // Base URI
    "base-uri 'self'",

    // Form action
    "form-action 'self' https://checkout.wompi.co",
  ]

  return policies.join('; ')
}
```

### Inyectar CSP en el layout

```typescript
// app/layout.tsx
import { headers } from 'next/headers'
import { getCSPHeader } from '@/lib/csp'

export default async function RootLayout({ children }) {
  const nonce = crypto.randomUUID()  // Generar nonce único por request

  return (
    <html>
      <head>
        {/* CSP vía header */}
        {/* Se configura en middleware o next.config */}
      </head>
      <body>{children}</body>
    </html>
  )
}
```

### CSP en middleware

```typescript
// middleware.ts (adicional)
import { getCSPHeader } from '@/lib/csp'

export async function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const response = NextResponse.next()

  // Content Security Policy
  response.headers.set('Content-Security-Policy', getCSPHeader(nonce))

  // Report-Only en desarrollo
  if (process.env.NODE_ENV === 'development') {
    response.headers.set(
      'Content-Security-Policy-Report-Only',
      getCSPHeader(nonce)
    )
  }

  return response
}
```

---

## 4. CORS Configuration

```typescript
// app/api/**/route.ts
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL!,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}
```

---

## 5. Subresource Integrity (SRI)

Para scripts externos (solo si se usan):

```html
<script
  src="https://cdn.example.com/lib.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8wC"
  crossorigin="anonymous"
></script>
```

---

## 6. Trusted Types

```typescript
// Solo si se requiere enforcement adicional
// Configurar en CSP:
// "require-trusted-types-for 'script'"
```

---

## 7. Resumen de Headers

| Header | Valor | Protege contra |
|---|---|---|
| `Content-Security-Policy` | Ver CSP arriba | XSS, data injection |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Information leakage |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | MITM downgrade |
| `Permissions-Policy` | `camera=(), microphone=()` | Feature abuse |
| `X-RateLimit-Limit` | `100` | DoS |
| `X-RateLimit-Remaining` | `99` | DoS |
