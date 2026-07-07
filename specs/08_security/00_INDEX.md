# SECURITY — Defensa en Profundidad

## Principio

La seguridad **no es una capa**. Es **todas las capas**. Cada capa debe asumir que las capas superiores pueden fallar.

---

## Capas de seguridad

```
┌─────────────────────────────────────────────────────────────┐
│ CAPA 7: SECRETS & CONFIG                                    │
│ Env vars, vault, key rotation, .env.gitignore               │
├─────────────────────────────────────────────────────────────┤
│ CAPA 6: CSP & HEADERS                                       │
│ Content-Security-Policy, HSTS, X-Frame-Options, CORS        │
├─────────────────────────────────────────────────────────────┤
│ CAPA 5: RATE LIMITING                                       │
│ IP-based, user-based, action-based                          │
├─────────────────────────────────────────────────────────────┤
│ CAPA 4: INPUT VALIDATION                                    │
│ Zod, sanitization, XSS, SQL injection, file uploads         │
├─────────────────────────────────────────────────────────────┤
│ CAPA 3: RLS & TENANT ISOLATION                              │
│ Row Level Security, tenant_id en toda query                 │
├─────────────────────────────────────────────────────────────┤
│ CAPA 2: RBAC & PERMISSIONS                                  │
│ Roles, matrix de permisos, middleware                       │
├─────────────────────────────────────────────────────────────┤
│ CAPA 1: AUTHENTICATION & MIDDLEWARE                         │
│ JWT, Supabase Auth, session validation, route guards        │
└─────────────────────────────────────────────────────────────┘
```

---

## Archivos

| Archivo | Contenido |
|---|---|
| `00_INDEX.md` | Defensa en profundidad, capas de seguridad |
| `01_AUTHENTICATION.md` | JWT, Supabase Auth, sesiones, MFA |
| `02_MIDDLEWARE.md` | Next.js middleware, guards, redirects |
| `03_RATE_LIMIT_HEADERS_CSP.md` | Rate limiting, headers, CSP |
| `04_PERMISSIONS_RBAC.md` | RBAC, permissions, enforcement |
| `05_RLS_TENANT_ISOLATION.md` | RLS, tenant isolation, cross-tenant protection |
| `06_INPUT_VALIDATION.md` | Sanitización, XSS, file upload, magic bytes |
| `07_SECRETS_ENV.md` | Secretos, env vars, key rotation |

---

## Reglas de seguridad

1. **Nunca confiar en el cliente.** Toda validación se repite en el servidor.
2. **Nunca exponer secretos al frontend.** Solo `NEXT_PUBLIC_*`.
3. **Nunca usar DELETE físico.** Solo soft delete.
4. **Nunca construir queries concatenando strings.** Usar Supabase SDK con parámetros.
5. **Nunca confiar en el tenant_id del cliente.** Derivarlo del JWT.
6. **Nunca exponer stack traces en producción.**
7. **Siempre validar entrada con Zod.** Antes de cualquier procesamiento.
8. **Siempre sanitizar salida.** Prevenir XSS.
9. **Siempre verificar permisos en el backend.** El frontend es solo UX.
10. **Siempre loguear eventos de seguridad.** Login fallido, acceso denegado, rate limit.

---

## Threat Model (STRIDE)

| Amenaza | Mitigación |
|---|---|
| **S**poofing | JWT + Supabase Auth + MFA |
| **T**ampering | Zod validation + RLS + checksums |
| **R**epudiation | audit_log inmutable + business_events |
| **I**nformation Disclosure | RLS + tenant isolation + CSP |
| **D**enial of Service | Rate limiting + CAPTCHA |
| **E**levation of Privilege | RBAC + middleware + RLS |

---

## Checklist de seguridad (OWASP Top 10)

| # | Vulnerabilidad | Status |
|---|---|---|
| 1 | Broken Access Control | → RLS + RBAC + Middleware |
| 2 | Cryptographic Failures | → Supabase Auth (bcrypt), HTTPS |
| 3 | Injection | → Zod + parameterized queries |
| 4 | Insecure Design | → Clean Architecture + threat model |
| 5 | Security Misconfiguration | → Security headers + CSP |
| 6 | Vulnerable Components | → Dependabot + audit |
| 7 | Auth Failures | → Supabase Auth + MFA + rate limit |
| 8 | Software & Data Integrity | → Checksums, signed URLs |
| 9 | Logging & Monitoring | → audit_log + business_events |
| 10 | SSRF | → Validate URLs, no user-supplied URLs |
