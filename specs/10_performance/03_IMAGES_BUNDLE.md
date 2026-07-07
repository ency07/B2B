# IMAGES & BUNDLE — Imágenes, Dynamic Imports, Lazy Loading

## 1. Imágenes (next/image)

### Componente Image optimizado

```typescript
import Image from 'next/image'

// ✅ Siempre usar next/image (nunca <img>)
<Image
  src={productImage}
  alt={productName}
  width={400}
  height={300}
  className="object-cover rounded-xl"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={isAboveFold}           // Solo para imágenes above-the-fold
  loading={isAboveFold ? undefined : 'lazy'}
  placeholder="blur"               // Efecto blur mientras carga
  blurDataURL={productImageBlur}   // Base64 pequeño
/>
```

### Imágenes del catálogo (Supabase Storage)

```typescript
// Componente wrapper para imágenes de Supabase
export function SupabaseImage({
  bucket,
  path,
  alt,
  width,
  height,
  className,
  priority = false,
}: {
  bucket: string
  path: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
}) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
  return (
    <Image
      src={url}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes="(max-width: 768px) 100vw, 50vw"
    />
  )
}
```

### Optimización de imágenes de Supabase

```
// URL con transformación on-the-fly:
{SUPABASE_URL}/storage/v1/render/image/public/productos/{path}?width=400&format=webp&quality=80
```

---

## 2. Reducción de bundle

### Dynamic Imports

```typescript
// Componentes pesados: cargar solo cuando se usan
const WompiCheckout = dynamic(() => import('@/components/payments/wompi-checkout'), {
  ssr: false,
})

const ReactEmailEditor = dynamic(() => import('@/components/cms/email-editor'), {
  loading: () => <div className="h-96 animate-pulse bg-zinc-800/40 rounded-xl" />,
})
```

### Tree shaking

```typescript
// ✅ CORRECTO: Import específico
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

// ❌ INCORRECTO: Import todo
import * as dateFns from 'date-fns'   // ← Todo el bundle de date-fns
```

### Análisis de bundle

```bash
# Generar reporte de bundle
ANALYZE=true npm run build

# next.config.js con @next/bundle-analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})
```

---

## 3. Lazy Loading

### Componentes bajo el fold

```typescript
// Componentes que no están en el viewport inicial
import dynamic from 'next/dynamic'

const CaseStudies = dynamic(() => import('@/components/landing/case-studies'))
const ContactForm = dynamic(() => import('@/components/landing/contact-form'))
const Footer = dynamic(() => import('@/components/landing/footer'))
```

### Intersection Observer para secciones

```typescript
// Solo cargar cuando la sección está visible
'use client'
import { useInView } from 'react-intersection-observer'

export function LazySection() {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px' })

  return (
    <div ref={ref}>
      {inView ? <HeavyComponent /> : <div className="h-96" />}
    </div>
  )
}
```

---

## 4. Fonts optimization

```typescript
// app/layout.tsx
import { Inter, Outfit, JetBrains_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',          // Mostrar fallback mientras carga
  variable: '--font-inter',
})

const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
})

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
})

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${outfit.variable} ${jetbrains.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

---

## 5. Configuración de Next.js

```javascript
// next.config.js
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/webp', 'image/avif'],  // Formatos modernos
    deviceSizes: [640, 768, 1024, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'recharts',
    ],
  },

  // Compresión
  compress: true,

  // Powered by header
  poweredByHeader: false,
}
```

---

## 6. Checklist de performance

- [ ] Imágenes usan `<Image>` con `width/height/sizes`
- [ ] Imágenes tienen `priority` solo above-the-fold
- [ ] Fuentes usan `next/font` con `display: swap`
- [ ] Componentes pesados con `dynamic(() => import(...))`
- [ ] No hay N+1 queries (usar joins)
- [ ] Paginación en todas las listas
- [ ] Suspense granular por sección
- [ ] Fetch en paralelo (`Promise.all`)
- [ ] RSC por defecto, `'use client'` mínimo
- [ ] Bundle < 200KB JS (desktop)
- [ ] Lighthouse > 90 (desktop)
