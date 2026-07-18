# Adversarial Review — Alcance de Auditoría

**Proyecto:** ERP B2B Premium (AeroMax Industrial)
**Fecha:** 2026-07-18
**Tipo:** Revisión adversarial del scope propuesto vs. código real
**Objetivo:** Identificar qué omitió o inventó la IA que redactó el alcance por no leer el código fuente.

---

## Resultado General

El scope fue escrito **sin leer el código del proyecto**. Nombra tecnologías, servicios y funcionalidades que **no existen**, mientras ignora los hallazgos de seguridad reales.

| Problema | Frecuencia | Impacto |
|----------|-----------|---------|
| Funcionalidades inexistentes auditadas | 4 | Invalida 2/3 del análisis web |
| APIs externas inventadas | 3 | Filtra que el scope no corresponde al proyecto |
| Patrones de frontend asumidos incorrectos | 2 | Respuestas serán teoría, no hallazgos reales |
| Hallazgos críticos reales omitidos | 5 | Riesgo de seguridad no identificado |

---

## 1. WEB — Fallas de contexto

| Lo que pide el scope | Realidad en el código | Problema |
|---|---|---|
| "Carga y validación de archivos CSV (click/drag)" | **No existe procesamiento CSV en todo el código.** No hay drag/drop, no hay parseo, no hay upload masivo de archivos. | El scope describe una funcionalidad que no está implementada. Cualquier auditor que busque CSV reportará "no aplica" y el resto del análisis web queda invalidado. |
| "Error 429 / Rate Limit de Printful/Google Trends" | **No existe integración con Printful ni Google Trends.** Hay integración DIAN (Alegra), Resend (email) y WhatsApp API. | El scope nombra APIs externas que no existen, mientras ignora las que sí están (DIAN, Resend, WhatsApp). Demuestra que el scope fue escrito sin revisar el código. |
| "Persistencia con Zustand / sessionStorage" | **No se usa Zustand en todo el proyecto.** El estado se maneja con Server Actions, cookies de sesión, y `useState` local en componentes cliente. | El scope asume un patrón de frontend (Zustand) que el proyecto explícitamente no usa. Un agente que busque stores de Zustand perderá tiempo. |
| "Mapeo documental: botón → requisito → componente → API" | No existe un traceability matrix automatizado. `specs/` tiene 80+ documentos pero no hay linking ejecutable specs ↔ código. | El scope pide algo que requeriría instrumentación ad-hoc (OpenTelemetry spans con metadatos de requisitos). Sin eso, la respuesta será "no existe" o "se recomienda implementar". |

### Omitido por el scope (presente en el proyecto)

| Funcionalidad real | Ubicación | Qué debería auditarse |
|---|---|---|
| Honeypot anti-bot | `wizard.ts:87-90` | Campo oculto `website` que solo llenan bots. ¿Se puede evadir? ¿Hay logging de detecciones? |
| Persistencia de wizard en BD | `wizard.ts:245-298` | `wizard_sessions` con upsert atómico + TTL de 24h. Auditoría de sesiones huérfanas, limpieza, inyección en `wizard_data`. |
| Transacción atómica RPC | `wizard.ts:151-184` | `wizard_submit_atomic` — única operación transaccional real. ¿Hay otras operaciones que deberían ser RPC y no lo son? |
| Rate limiting granular | `wizard.ts:97`, `leads.ts:124`, `catalog.ts:321` | Límites por IP (wizard 5/60s, catálogo 10/60s, branding 3/60s). ¿Son adecuados? ¿Hay bypass por IP rotada? |

---

## 2. ERP — Fallas de contexto

| Lo que pide el scope | Realidad en el código | Problema |
|---|---|---|
| "API Keys de Printful, Gemini" | **No existen.** El proyecto usa `GOOGLE_API_KEY`, `DIAN_API_KEY`, `RESEND_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. | El scope nombra servicios que no existen y omite los que sí: DIAN (facturación electrónica colombiana), Resend (email transaccional), Supabase service role. |
| "Google Trends timeout / fallback" | No hay integración Google Trends. | Especulación. Cualquier respuesta será genérica. |
| "Procesamiento CSV con transacciones ACID / dead letter queue" | No hay procesamiento CSV. Pero SÍ existe `wizard_submit_atomic` que usa RPC transaccional con PostgREST. | Omite el patrón RPC real que es el único mecanismo transaccional del proyecto. |
| "Mapeo: regla de negocio → controlador → excepción → log" | Solo parcialmente trazable. Los triggers SQL en migraciones enforcean reglas de negocio a nivel BD, pero no hay un documento linking specs → Server Action → trigger. | Pide algo que no existe. Las Server Actions ofician de controlador + servicio + repositorio simultáneamente. No hay separación en capas. |

### Omitido por el scope (hallazgos críticos reales)

| Hallazgo | Ubicación | Severidad |
|---|---|---|
| **`.env` con credenciales reales trackeado por git** | Raíz del proyecto | 🔴 CRÍTICO — Service role key, DB password, Google API key, DIAN API key en texto plano en el repositorio |
| **supabaseAdmin bypass en TODAS las Server Actions** | `src/platform/auth/clients.ts:98` | 🔴 CRÍTICO — Seguridad depende 100% de la capa de aplicación; RLS no protege nada |
| **Cache de permisos en memoria con TTL 5 min** | `auth-utils.ts:21-43` | 🟡 ALTA — Escalada de privilegios temporal: si un admin cambia el rol, el token antiguo sigue siendo válido 5 min |
| **Catch silenciosos sin logging** | `auth-utils.ts:71,123,175`, `guard.ts:41`, `portal-auth.ts:211` | 🟡 ALTA — Errores de autenticación/auth se tragan completamente, imposible diagnosticar |
| **console.error() en lugar de logger estructurado** | ~50 lugares en `compras.ts`, `portal.ts`, `notifications.ts`, `rate-limiter.ts` | 🟡 MEDIA — Rompe la estrategia de logging centralizado, imposible redirigir a Sentry/Datadog |

### Mapa real de APIs externas (no Printful, no Google Trends)

| API Externa | Provider DIAN | Resend (Email) | WhatsApp API | Google (Maps/Geocoding?) |
|---|---|---|---|---|
| Archivo | `alegra.ts`, `facture.ts`, `siigo.ts`, `wisp.ts` | `RESEND_API_KEY` en env | `connect-src` en CSP | `GOOGLE_API_KEY` en env |
| Props: Retry/Timeout | Sin retry. Timeout configurable `DIAN_API_TIMEOUT_MS=15000` | Sin retry | Via WhatsApp Web | No determinable |
| Props: Logging | **CRÍTICO**: Loggea payloads completos con `JSON.stringify(body)` en todos los providers | No determinado | No determinado | No determinable |

---

## 3. PORTAL — Fallas de contexto

| Lo que pide el scope | Realidad en el código | Problema |
|---|---|---|
| "Trazabilidad IDOR: todas las queries con tenant_id" | **Correcto parcialmente.** Las políticas RLS en migraciones filtran por tenant. Pero las Server Actions del portal usan `supabaseAdmin` (service_role_key) que **bypassea RLS completamente**. | El scope asume que RLS protege, pero el portal usa service_role key. Cualquier error de programación en una Server Action expone datos cross-tenant. El scope no audita ESTO. |
| "Máquina de estados: impedir transiciones ilegales" | **Existe parcialmente.** `state-machine.ts` tiene `validateTransition()` pero solo se usa en ~3 lugares del ERP. `compras.ts` y `portal.ts` no la usan. | El scope no pide verificar DÓNDE NO SE USA la state machine. Ahí está el vector real (ej: aprobación de compras sin validación de máquina de estados). |
| "Rate limiting en portal" | **Existe:** `portal.ts:217` (tickets 5/60s), `portal.ts:355` (requirements 3/60s). | Correcto, pero el scope omite preguntar: ¿qué muestra la UI del portal cuando se dispara el rate limit? No hay estado visual para 429. |

### Omitido por el scope (Portal)

| Vector real | Ubicación | Detalle |
|---|---|---|
| **Auth sin MFA** | `portal-auth.ts`, migraciones de auth | Portal usa Supabase Auth con magic link. No hay WebAuthn, TOTP, ni bloqueo por IP tras N intentos fallidos. |
| **Cliente ve facturas/pagos** | `role-permissions.ts:546` | `CLIENTE` tiene permisos `payments.view` e `invoices.view`. ¿Hay IDOR entre clientes del mismo tenant? |
| **Invite flow sin validación cross-tenant** | `portal/actions/invite.ts` | ¿Un usuario del portal puede invitar a alguien que pertenece a otro tenant? |
| **Portal usa service_role key en Server Actions** | `portal/actions/*.ts` | Igual que ERP: `supabaseAdmin` bypassa RLS. Si un `portal.ts` query no filtra `tenant_id` explícitamente, datos de todos los tenants son accesibles. |

---

## 4. Resumen: por qué la IA dio respuestas genéricas

| # | Carencia del scope | Consecuencia |
|---|--------------------|--------------|
| 1 | **Escrito sin leer el código fuente** | Pide auditar CSV, Printful, Gemini, Google Trends, Zustand — **nada de eso existe**. La IA responde con teoría genérica. |
| 2 | **Omite el hallazgo crítico real** | `.env` con credenciales reales trackeado por git + `supabaseAdmin` bypass. Esto pesa 10x más que cualquier CSV imaginario. |
| 3 | **Omite vectores de escalada reales** | Cache de permisos TTL 5 min, catch silenciosos, console.error residual, service role key en middleware ERP. |
| 4 | **Pide trazabilidad documental inexistente** | No hay linking automatizado specs → código. Las ~80 files en `specs/` son documentos planos, no ejecutables. Cualquier pregunta sobre "mapeo documental" produce "se recomienda implementar". |
| 5 | **Confunde frontend con backend** | "Zustand/sessionStorage para persistencia" cuando el proyecto persiste estado en BD vía Server Actions. La IA teoriza sobre Zustand sin saber que no se usa. |
| 6 | **No prioriza por riesgo real** | Pone al mismo nivel "CSV que no existe" y "IDOR que es crítico". Un red-team real prioriza por severidad, no por checklist. |

---

## 5. Lo que debería incluir el scope (correcciones)

### Reemplazar (lo que pide pero no existe)
| Eliminar | Reemplazar por |
|----------|----------------|
| CSV ingestion (drag/drop, validación) | **Branding asset upload**: `branding.ts` tiene upload de logos, validación MIME, tamaño. Vector real: path traversal, MIME spoofing, DoS por upload masivo. |
| Printful / Google Trends | **APIs reales**: DIAN (Alegra), Resend, WhatsApp. Auditar manejo de timeouts, retry policies, logging de credenciales. |
| Zustand / sessionStorage | **Persistencia real**: cookies de sesión (`sb-erp-*`) + BD (`wizard_sessions`, `website_sessions`) + TTL. |
| Mapeo documental specs→código | **Trigger SQL coverage**: el enforcement real está en triggers SQL (migraciones). Auditar que cubren todos los estados y roles. |

### Agregar (omitido por completo)

| # | Ítem | Justificación |
|---|------|---------------|
| 1 | Auditoría de supply chain | `zod v4.4.3` (inestable), `@tailwindcss/postcss v4.3.1` (alpha). Una CVE en zod afecta TODAS las validaciones. |
| 2 | Race conditions sin transacción | ~11/14 Server Actions del ERP no usan RPC transaccional. Dos requests concurrentes pueden corromper estado. |
| 3 | Sanitización de logs | `logger.ts` serializa objetos completos con `JSON.stringify`. Datos PII (nombres, emails, direcciones, precios) en logs planos. |
| 4 | Portal session hardening | Magic links sin MFA, sin rate limit por email (solo por IP), sin bloqueo temporal tras N fallos. |
| 5 | Secretos en logs DIAN | `alegra.ts:162,256`, `facture.ts:65`, `siigo.ts:87`, `wisp.ts:61` loggean `JSON.stringify(body)` con payloads completos. |
| 6 | Storage hardening | Supabase Storage para logos/docus. Sin escaneo de malware, sin verificación MIME real (solo extensión), sin límite de tamaño por tenant. |

---

## 6. Conclusión

El scope original fue redactado por una IA que **no leyó el código**. Describe un proyecto imaginario con CSV, Printful, Google Trends y Zustand, mientras ignora:

- 🔴 El hallazgo más crítico (`.env` en git con service role key)
- 🔴 El patrón arquitectónico que anula RLS (supabaseAdmin en Server Actions)
- 🟡 Los vectores de escalada reales (cache permisos TTL, catch silenciosos)
- 🟡 Las APIs que realmente existen (DIAN, Resend, WhatsApp)

Un scope de auditoría efectivo debe:
1. **Leer el código primero**, después redactar
2. **Nombrar archivos y líneas exactas**, no funcionalidades genéricas
3. **Priorizar por riesgo**, no por categoría (Web/ERP/Portal)
4. **Auditar lo que existe**, no lo que suena bien en un checklist
