# SECRETS & ENVIRONMENT — Gestión de Secretos

## 1. Jerarquía de secretos

```
┌─────────────────────────────────────────────────────────┐
│ Variables de Entorno (Vercel / Supabase Dashboard)      │
│                                                         │
│ PRODUCTION: secrets en Vercel + Supabase vault          │
│ STAGING:    secrets en Vercel preview + Supabase staging│
│ LOCAL:      .env.local (gitignored)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Archivos de entorno

### .env.local (desarrollo local)

```bash
# NUNCA COMMITEADO (gitignored)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Wompi
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=pub_test_xxxxx
WOMPI_PRIVATE_KEY=prv_test_xxxxx
WOMPI_EVENTS_KEY=events_test_xxxxx
WOMPI_SANDBOX=true

# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@aeromax.com

# Upstash (Rate Limiting)
UPSTASH_REDIS_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_TOKEN=xxxxx

# Cron
CRON_SECRET=xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### .env.example (commiteado, sin secretos)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Wompi
NEXT_PUBLIC_WOMPI_PUBLIC_KEY=
WOMPI_PRIVATE_KEY=
WOMPI_EVENTS_KEY=
WOMPI_SANDBOX=true

# Email
RESEND_API_KEY=
EMAIL_FROM=

# Rate Limiting
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Cron
CRON_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 3. Reglas de secretos

### 3.1 Prefix rules

```
NEXT_PUBLIC_*  → Accesible desde el navegador (frontend)
                → SOLO para claves públicas (Supabase anon key, Wompi public key)

Sin prefijo     → Solo accesible desde el servidor
                → Service role keys, API keys privadas
```

### 3.2 Validación en build time

```typescript
// lib/config.ts
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variable de entorno requerida no definida: ${envVar}`)
  }
}

// Validar formato
if (!process.env.NEXT_PUBLIC_SUPABASE_URL!.startsWith('https://')) {
  throw new Error('SUPABASE_URL debe usar HTTPS')
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.startsWith('eyJ')) {
  throw new Error('SUPABASE_ANON_KEY debe ser un JWT válido')
}
```

---

## 4. Configuración tipada

```typescript
// lib/config.ts
import { z } from 'zod'

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().startsWith('https://'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),

  // Wompi
  NEXT_PUBLIC_WOMPI_PUBLIC_KEY: z.string().optional(),
  WOMPI_PRIVATE_KEY: z.string().optional(),
  WOMPI_EVENTS_KEY: z.string().optional(),
  WOMPI_SANDBOX: z.enum(['true', 'false']).default('true'),

  // Email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Rate Limiting
  UPSTASH_REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),

  // Cron
  CRON_SECRET: z.string().min(32).optional(),
})

export const config = envSchema.parse(process.env)

// Ahora config está tipado y validado
// config.NEXT_PUBLIC_SUPABASE_URL  → string (garantizado)
// config.WOMPI_SANDBOX             → 'true' | 'false'
```

---

## 5. Rotación de secretos

### Cuándo rotar

- Cada 90 días (automático)
- Cuando un empleado con acceso se va
- Si se sospecha de una fuga
- Después de un incidente de seguridad

### Procedimiento

```
1. Generar nueva clave en Supabase / Wompi / Resend
2. Agregar nueva clave como variable de entorno (con nuevo nombre)
3. Desplegar (la app usa la nueva clave)
4. Verificar que todo funciona
5. Revocar la clave antigua
6. Eliminar variable de entorno antigua
7. Actualizar .env.example si es necesario
```

---

## 6. Client-side exposure prevention

```typescript
// ❌ NUNCA: exponer secretos en el frontend
export default function Page() {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY  // ⚠️ UNDEFINED en browser
  // ...
}

// ✅ CORRECTO: solo usar NEXT_PUBLIC_ en frontend
export default function Page() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL  // ✅ Disponible
  // ...
}

// ✅ CORRECTO: usar secretos solo en Server Components / Actions
// app/page.tsx (Server Component)
export default async function Page() {
  const secretData = await fetchFromAPIWithSecret()  // ✅ Se ejecuta en servidor
  // ...
}
```

### Verificación de exposición

```bash
# Buscar secretos que puedan estar expuestos
grep -r "SUPABASE_SERVICE_ROLE_KEY" src/components/
grep -r "WOMPI_PRIVATE_KEY" src/components/
grep -r "RESEND_API_KEY" src/components/
# Si alguno aparece en components/ → ERROR

# Buscar NEXT_PUBLIC_ sin necesidad
grep -r "NEXT_PUBLIC_" src/actions/
# Si aparece en actions/ → posiblemente innecesario
```

---

## 7. Secrets en CI/CD

```yaml
# .github/workflows/deploy.yml
env:
  # Solo NEXT_PUBLIC_ se necesitan en build
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
  NEXT_PUBLIC_WOMPI_PUBLIC_KEY: ${{ secrets.NEXT_PUBLIC_WOMPI_PUBLIC_KEY }}

  # Los demás secretos se configuran en Vercel Dashboard
  # o se inyectan via Vercel CLI: vercel env add
```

---

## 8. Supabase Vault (para secretos en BD)

Para secretos que se necesitan en funciones PostgreSQL:

```sql
-- Almacenar secretos en Supabase Vault
SELECT vault.create_secret('wompi_api_key', 'prv_test_...');
SELECT vault.create_secret('twilio_auth_token', 'xxxxx');

-- Usar en funciones
DECLARE
  v_wompi_key text;
BEGIN
  SELECT decrypted_secret INTO v_wompi_key
  FROM vault.decrypted_secrets
  WHERE name = 'wompi_api_key';
  -- Usar v_wompi_key en HTTP request
END;
```

---

## 9. Checklist de secretos

- [ ] `.env.local` en `.gitignore`
- [ ] `.env.example` commiteado (sin valores reales)
- [ ] Valores de producción en Vercel Dashboard / Supabase Dashboard
- [ ] `NEXT_PUBLIC_*` solo para claves públicas
- [ ] `SUPABASE_SERVICE_ROLE_KEY` nunca en frontend
- [ ] `WOMPI_PRIVATE_KEY` nunca en frontend
- [ ] Validación de env vars en build time (Zod)
- [ ] Rotación programada cada 90 días
- [ ] Script de verificación de exposición en CI
- [ ] Secretos antiguos revocados (no acumulados)
