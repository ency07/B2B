# AUTHENTICATION — JWT, Sesiones, MFA

## 1. Supabase Auth (GoTrue)

### Arquitectura

```
Browser
    │ POST /auth/v1/token?grant_type=password
    ↓
Supabase Auth (GoTrue)
    │ bcrypt(password) ✓
    │ genera JWT (access_token + refresh_token)
    ↓
Browser
    │ almacena en cookie (httpOnly, secure, sameSite)
    │
    │ GET /dashboard/crm/leads
    ↓
Next.js Middleware
    │ verify JWT via Supabase
    │ si inválido → redirect /login
    ↓
Server Component / Action
    │ supabase.auth.getUser() → user + JWT claims
    │ RLS: tenant_id = current_tenant_id()
    ↓
PostgreSQL
    │ Row Level Security aplicado
```

---

## 2. JWT Claims personalizados

```sql
-- Supabase Auth Hook: agregar claims personalizados al JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  claims jsonb;
  user_profile record;
BEGIN
  -- Obtener perfil del usuario
  SELECT tenant_id, role_code INTO user_profile
  FROM users_profiles up
  JOIN usuario_roles ur ON up.id = ur.usuario_id AND ur.es_principal = true
  JOIN roles r ON ur.role_id = r.id
  WHERE up.id = (event ->> 'user_id')::uuid;

  -- Agregar claims al JWT
  claims := event -> 'claims';

  IF user_profile.tenant_id IS NOT NULL THEN
    claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_profile.tenant_id));
  END IF;

  IF user_profile.role_code IS NOT NULL THEN
    claims := jsonb_set(claims, '{role}', to_jsonb(user_profile.role_code));
  END IF;

  -- Actualizar claims en el evento
  event := jsonb_set(event, '{claims}', claims);
  RETURN event;
END;
$$;

-- Configurar el hook en Supabase
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
```

### Claims resultantes en el JWT

```json
{
  "sub": "user-uuid",
  "email": "carlos@aeromax.com",
  "tenant_id": "tenant-uuid",
  "role": "ADMIN",
  "aud": "authenticated",
  "exp": 1712345678,
  "iat": 1712341678
}
```

---

## 3. Tipos de sesión

### Server-side (Server Components / Actions)

```typescript
// lib/auth.ts
import { createClient } from '@/lib/supabase/server'
import { UnauthorizedError } from '@/types/errors'

export async function auth() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new UnauthorizedError('Sesión inválida o expirada')
  }

  // Los claims personalizados viajan en el JWT
  const tenantId = user.app_metadata?.tenant_id
  const role = user.app_metadata?.role

  return {
    userId: user.id,
    email: user.email,
    tenantId,
    role,
    isAuthenticated: true,
  }
}
```

### Browser-side (Client Components)

```typescript
// Solo para UI (nunca para datos sensibles)
// hooks/use-auth.ts
'use client'
export function useAuth() {
  // ...
  const supabase = createClient()
  // Solo para mostrar UI condicional
  // Los datos siempre se obtienen en Server Components
}
```

---

## 4. MFA (Multi-Factor Authentication)

```typescript
// actions/auth.ts
'use server'

import { createClient } from '@/lib/supabase/server'

// Paso 1: Enroll MFA
export async function enrollMFA() {
  const supabase = createClient()
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })

  // data.totp.qr_code → mostrar al usuario
  // data.totp.secret → guardar para verificación
  return { data }
}

// Paso 2: Verify enrollment
export async function verifyMFA(factorId: string, code: string) {
  const supabase = createClient()
  const { data } = await supabase.auth.mfa.challenge({ factorId })
  const { data: verify } = await supabase.auth.mfa.verify({ factorId, code })
  return { success: true }
}

// Paso 3: Challenge (al hacer login)
export async function challengeMFA(factorId: string) {
  const supabase = createClient()
  const { data } = await supabase.auth.mfa.challenge({ factorId })
  return { challengeId: data.id }
}

// Paso 4: Verify challenge
export async function verifyMFAChallenge(factorId: string, code: string) {
  const supabase = createClient()
  const { data } = await supabase.auth.mfa.verify({ factorId, code })
  return { success: true }
}
```

### MFA Flow

```
Login → Email + Password ✓
    ↓
¿Tiene MFA?
    ├── NO → Access granted
    └── SÍ → Mostrar MFA challenge
              ↓
           Ingresa código TOTP
              ↓
           Verify ✓ → Access granted
```

---

## 5. Configuración de cookies

```typescript
// En el cliente Supabase (middleware)
{
  cookies: {
    name: 'sb-aeromax-auth-token',  // Nombre único
    lifetime: 60 * 60 * 8,          // 8 horas
    domain: '',                     // Solo este dominio
    path: '/',
    sameSite: 'lax',               // Protección CSRF
    secure: process.env.NODE_ENV === 'production',  // HTTPS
    httpOnly: true,                 // No accesible via JS
  }
}
```

---

## 6. Recuperación de contraseña

```typescript
export async function recoverPassword(email: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  })
  // Siempre retornar éxito (no revelar si el email existe)
  return { success: true }
}

export async function resetPassword(newPassword: string) {
  const supabase = createClient()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }
  return { success: true }
}
```

---

## 7. Rate limiting en auth

```typescript
// actions/auth.ts
const MAX_LOGIN_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000  // 15 minutos

export async function login(email: string, password: string) {
  // Verificar rate limit
  const attempts = await checkLoginAttempts(email)
  if (attempts >= MAX_LOGIN_ATTEMPTS) {
    return { error: 'Demasiados intentos. Espere 15 minutos.' }
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    await recordLoginAttempt(email, false)
    // Mensaje genérico para no revelar qué falló
    return { error: 'Credenciales inválidas' }
  }

  await recordLoginAttempt(email, true)
  return { success: true }
}
```

---

## 8. Server Actions Auth (patrón)

```typescript
// Todas las actions siguen este patrón
'use server'

import { auth } from '@/lib/auth'

export async function protectedAction(...args: unknown[]) {
  try {
    const session = await auth()  // ← Verifica JWT + obtiene claims
    // session.userId, session.tenantId, session.role
    // ... lógica protegida
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return { error: 'No autorizado. Inicie sesión.' }
    }
    return { error: 'Error inesperado' }
  }
}
```
