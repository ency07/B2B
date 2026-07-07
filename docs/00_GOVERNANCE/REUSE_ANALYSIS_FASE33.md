# REUSE ANALYSIS - FASE 33: INTEGRACIONES Y CANALES

**Fecha de Análisis:** 2026-06-18
**Fase:** 33 — Integraciones y Canales
**Estado:** APROBADO — 5 herramientas/estrategias evaluadas (mínimo requerido: 5)
**Clasificación:** OBLIGATORIO antes de escribir cualquier línea de código custom

---

## 1. Repositorios e Infraestructuras Evaluadas

Este análisis evalúa las capacidades nativas y de terceros para cifrar credenciales e integrar gateways y APIs de forma dinámica por inquilino.

### REPO-01 — Supabase Vault (pg_vault / extension)

| Atributo | Valor |
|---|---|
| Repositorio | supabase/vault |
| URL | Habilitado nativamente en Supabase (extensión pg_vault) |
| Licencia | Apache 2.0 |
| Complejidad | Media-Alta para entornos de desarrollo local sin la extensión compilada |
| Veredicto | EVALUADO — DESCARTADO para desarrollo local (Reemplazado por pgcrypto) |

Justificación: Aunque pg_vault es ideal para producción, su instalación e inicialización local en contenedores estándar de Postgres o entornos locales ligeros requiere dependencias compiladas C complejas. En su lugar, utilizaremos la extensión oficial de cifrado de PostgreSQL `pgcrypto` (`pgp_sym_encrypt`/`pgp_sym_decrypt`), la cual viene preinstalada en el 100% de las bases de datos de Supabase y Postgres estándar, reduciendo fricción y asegurando portabilidad de las migraciones sintácticas.

---

### REPO-02 — pgcrypto (PostgreSQL Native Cryptographic Extension)

| Atributo | Valor |
|---|---|
| Repositorio | postgres/postgres (contrib/pgcrypto) |
| URL | https://www.postgresql.org/docs/current/pgcrypto.html |
| Licencia | PostgreSQL License |
| Tiempo de Integración | 1 hora |
| Complejidad | Muy Baja |
| Caso de Uso | Cifrado simétrico de API keys y contraseñas de gateways de correo/mensajería antes de guardarse en `tenant_settings` |
| Veredicto | REUTILIZAR PARA CIFRADO DE SECRETOS |

Justificación: `pgcrypto` provee cifrado simétrico robusto utilizando algoritmos estándar de la industria (AES-256). Permite encriptar y desencriptar al vuelo mediante PL/pgSQL sin instalar binarios externos, cumpliendo la directiva de seguridad del proyecto.

---

### REPO-03 — Resend Node SDK (Email Gateway)

| Atributo | Valor |
|---|---|
| Repositorio | resend/resend-node |
| URL | https://github.com/resend/resend-node |
| Licencia | MIT |
| Stars | ~6k |
| Tiempo de Integración | 1-2 días |
| Caso de Uso | Integración del canal EMAIL. Se leen credenciales y claves de API de `tenant_settings` en tiempo de ejecución |
| Veredicto | REUTILIZAR EN EL CONTROLADOR DE ENVÍO |

Justificación: Permite despachar correos corporativos de forma modular. Al evitar el hardcoding, el backend de envío (BullMQ) instanciará el cliente de Resend extrayendo la API key usando `get_tenant_setting()`.

---

### REPO-04 — Twilio Node SDK (WhatsApp & SMS Gateway)

| Atributo | Valor |
|---|---|
| Repositorio | twilio/twilio-node |
| URL | https://github.com/twilio/twilio-node |
| Licencia | MIT |
| Stars | ~3.8k |
| Caso de Uso | Integración de canales de mensajería móvil (WhatsApp / SMS) configurables por tenant |
| Veredicto | REUTILIZAR EN EL CONTROLADOR DE ENVÍO |

Justificación: Twilio es el estándar de comunicación móvil en el ERP. El backend dinámico de envío resolverá las credenciales (`twilio_sid`, `twilio_auth_token`, `numero_whatsapp`) de forma dinámica por tenant desde `tenant_settings`.

---

### REPO-05 — grammY (Telegram Bot Framework)

| Atributo | Valor |
|---|---|
| Repositorio | grammyjs/grammY |
| URL | https://github.com/grammyjs/grammY |
| Licencia | MIT |
| Stars | ~4.8k |
| Caso de Uso | Envío de alertas internas sin costo a usuarios del ERP |
| Veredicto | REUTILIZAR EN EL CONTROLADOR DE ENVÍO |

Justificación: En lugar de usar servicios de pago de WhatsApp para alertas internas de operación, `grammY` despachará notificaciones gratuitas de Telegram leyendo el `telegram_bot_token` dinámicamente configurado por tenant.

---

## 2. Métricas de Gobernanza (Regla 8 de Modo Auditor 0.3)

| Métrica | Valor |
|---|---|
| **Repositorios/Estrategias evaluados** | 5 (mínimo requerido: 5) — CUMPLIDO |
| **Repositorios seleccionados** | 4 (pgcrypto, Resend SDK, Twilio SDK, grammY) |
| **Repositorios descartados con justificación** | 1 (Supabase Vault - reemplazado por pgcrypto para compatibilidad local) |
| **Deuda técnica introducida** | 0 |
