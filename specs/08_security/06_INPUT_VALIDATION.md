# SANITIZATION & FILE UPLOAD — Validación de Entrada

## 1. Sanitización de Strings (XSS Prevention)

### Estrategia

React por defecto escapa todo output JSX (previene XSS). Pero necesitamos sanitizar:
- Contenido HTML del CMS (rich text)
- Datos que se renderizan en `dangerouslySetInnerHTML`
- Datos que se envían a APIs externas
- Datos que se insertan en atributos HTML

### DOMPurify (server-side)

```typescript
// lib/sanitize.ts
import { JSDOM } from 'jsdom'
import DOMPurify from 'dompurify'

const window = new JSDOM('').window
const purify = DOMPurify(window as any)

export function sanitizeHTML(html: string): string {
  return purify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'img', 'figure', 'figcaption',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  })
}

export function sanitizeText(text: string): string {
  // Eliminar tags HTML (para campos de texto plano)
  return text.replace(/<[^>]*>/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
```

### Uso en CMS

```typescript
// actions/cms.ts
import { sanitizeHTML } from '@/lib/sanitize'

export async function guardarPagina(id: string, contenido: object) {
  const session = await auth()

  // Sanitizar contenido HTML antes de guardar
  const sanitized = sanitizeContent(contenido)

  const app = createApp()
  await app.cmsRepo.updatePage(id, sanitized, session.userId)
}

function sanitizeContent(content: any): any {
  if (typeof content === 'string') {
    return sanitizeHTML(content)
  }
  if (Array.isArray(content)) {
    return content.map(sanitizeContent)
  }
  if (typeof content === 'object' && content !== null) {
    return Object.fromEntries(
      Object.entries(content).map(([key, value]) => [key, sanitizeContent(value)])
    )
  }
  return content
}
```

### Uso en componentes (dangerouslySetInnerHTML)

```typescript
// components/shared/safe-html.tsx
import { sanitizeHTML } from '@/lib/sanitize'

export function SafeHTML({ html }: { html: string }) {
  // Siempre sanitizar antes de renderizar
  const clean = sanitizeHTML(html)
  return <div dangerouslySetInnerHTML={{ __html: clean }} />
}
```

---

## 2. SQL Injection Prevention

### Supabase SDK lo previene automáticamente

```typescript
// ✅ SEGURO: Supabase usa parámetros preparados
const { data } = await supabase
  .from('leads')
  .select('*')
  .eq('nombre_contacto', userInput)  // ← Parámetro, no concatenado
  .ilike('empresa', `%${userInput}%`) // ← Parámetro

// ❌ PELIGROSO: NUNCA concatenar SQL
const query = `SELECT * FROM leads WHERE nombre = '${userInput}'` // ⚠️
```

### En RPC functions (si usas SQL nativo)

```sql
-- ✅ SEGURO: Usar parámetros
CREATE OR REPLACE FUNCTION buscar_leads(p_nombre text)
RETURNS SETOF leads
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM leads
  WHERE nombre_contacto ILIKE '%' || p_nombre || '%';
  -- Los parámetros de funciones son seguros (no inyectables)
END;
$$;
```

---

## 3. File Upload Validation

### Validación de archivos

```typescript
// lib/upload-validator.ts
import { AppError } from '@/types/errors'

const ALLOWED_MIMES: Record<string, string[]> = {
  'image': ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  'document': ['application/pdf', 'application/vnd.dwg', 'application/vnd.dxf', 'application/step'],
  'any': ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
}

const MAX_SIZES: Record<string, number> = {
  'avatar': 1 * 1024 * 1024,     // 1 MB
  'producto': 5 * 1024 * 1024,   // 5 MB
  'documento': 25 * 1024 * 1024, // 25 MB
  'evidencia': 50 * 1024 * 1024, // 50 MB
  'logo': 2 * 1024 * 1024,       // 2 MB
}

export function validateFile(file: File, type: keyof typeof MAX_SIZES) {
  const errors: string[] = []

  // 1. Validar tamaño
  const maxSize = MAX_SIZES[type]
  if (maxSize && file.size > maxSize) {
    errors.push(`El archivo excede el tamaño máximo de ${maxSize / 1024 / 1024}MB`)
  }

  // 2. Validar tipo MIME
  const allowedMimes = ALLOWED_MIMES[type === 'avatar' ? 'image' : 'any']
  if (!allowedMimes.includes(file.type)) {
    errors.push(`Tipo de archivo no permitido: ${file.type}`)
  }

  // 3. Validar extensión
  const ext = file.name.split('.').pop()?.toLowerCase()
  const allowedExts = getExtensionsForType(type)
  if (ext && !allowedExts.includes(ext)) {
    errors.push(`Extensión no permitida: .${ext}`)
  }

  // 4. Magic Bytes (verificar contenido real del archivo)
  if (errors.length === 0) {
    return verifyMagicBytes(file, type)
  }

  return { valid: false, errors }
}

function getExtensionsForType(type: string): string[] {
  switch (type) {
    case 'avatar': case 'producto': case 'logo':
      return ['jpg', 'jpeg', 'png', 'webp', 'svg']
    case 'documento':
      return ['pdf', 'dwg', 'dxf', 'step', 'igs']
    case 'evidencia':
      return ['jpg', 'jpeg', 'png', 'webp', 'mp4']
    default:
      return ['jpg', 'jpeg', 'png', 'pdf']
  }
}
```

---

## 4. Magic Bytes Verification

```typescript
// lib/magic-bytes.ts

const MAGIC_BYTES: Record<string, string[]> = {
  'jpg': ['ffd8ff'],
  'jpeg': ['ffd8ff'],
  'png': ['89504e47'],
  'webp': ['52494646'],  // RIFF
  'pdf': ['25504446'],    // %PDF
  'svg': ['3c737667', '3c3f786d6c'],  // <svg o <?xml
  'zip': ['504b0304'],    // PK
}

export async function verifyMagicBytes(
  file: File,
  type: string
): Promise<{ valid: boolean; errors: string[] }> {
  // Leer los primeros 4 bytes del archivo
  const buffer = await file.slice(0, 4).arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext) return { valid: false, errors: ['Extensión no detectada'] }

  const expectedBytes = MAGIC_BYTES[ext]
  if (!expectedBytes) return { valid: true, errors: [] }  // Tipo no verificado

  const valid = expectedBytes.some(sig => hex.startsWith(sig))

  if (!valid) {
    return {
      valid: false,
      errors: [`El contenido del archivo no coincide con la extensión .${ext}`],
    }
  }

  return { valid: true, errors: [] }
}
```

---

## 5. Upload Action (completo)

```typescript
// actions/upload.ts
'use server'

import { auth } from '@/lib/auth'
import { validateFile } from '@/lib/upload-validator'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadFile(
  formData: FormData,
  bucket: string,
  type: 'avatar' | 'producto' | 'documento' | 'evidencia' | 'logo'
) {
  const session = await auth()
  const file = formData.get('file') as File

  if (!file) return { error: 'No se proporcionó archivo' }

  // 1. Validar archivo
  const validation = await validateFile(file, type)
  if (!validation.valid) {
    return { error: validation.errors.join('. ') }
  }

  // 2. Generar nombre único
  const ext = file.name.split('.').pop()
  const fileName = `${session.tenantId}/${type}/${crypto.randomUUID()}.${ext}`

  // 3. Subir a Supabase Storage
  const supabase = createClient()
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

  if (error) return { error: 'Error al subir el archivo' }

  // 4. Retornar URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)

  return { data: { url: urlData.publicUrl, path: fileName } }
}
```

---

## 6. Zod como barrera de entrada

```typescript
// Toda entrada del usuario pasa por Zod antes de cualquier procesamiento

import { z } from 'zod'

// Ejemplo: formulario de contacto
export const contactSchema = z.object({
  nombre: z.string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Máximo 100 caracteres')
    .transform(v => v.trim()),
  email: z.string()
    .email('Correo inválido')
    .transform(v => v.toLowerCase().trim()),
  telefono: z.string()
    .regex(/^\+?[\d\s-]{7,15}$/, 'Teléfono inválido')
    .optional(),
  mensaje: z.string()
    .min(10, 'Mínimo 10 caracteres')
    .max(2000, 'Máximo 2000 caracteres')
    .transform(v => v.trim()),
})

// Ejemplo: número de cotización
export const quoteAmountSchema = z.number()
  .positive('Debe ser positivo')
  .max(999_999_999_999, 'Monto excede el máximo permitido')
```

---

## 7. Rate Limiting para Uploads

```typescript
// Máximo 50 uploads por hora por usuario
export async function uploadFile(...) {
  const session = await auth()

  const { success } = await uploadRateLimit.limit(`upload:${session.userId}`)
  if (!success) {
    return { error: 'Límite de subidas alcanzado. Intente más tarde.' }
  }
  // ...
}
```

---

## 8. Reglas de validación de entrada

1. **Validar en el borde.** Zod antes de cualquier procesamiento.
2. **Sanitizar HTML del CMS.** DOMPurify antes de guardar y antes de renderizar.
3. **Verificar Magic Bytes.** No confiar en extensión ni MIME type.
4. **Limitar tamaños de archivo.** Distintos límites por tipo.
5. **Rate limiting en uploads.** Prevenir abuso.
6. **Nombres de archivo con UUID.** No usar el nombre original.
7. **Nunca concatenar SQL.** Usar parámetros (Supabase SDK lo hace por defecto).
8. **Escapar output.** React lo hace automáticamente. Solo preocuparse por `dangerouslySetInnerHTML`.
