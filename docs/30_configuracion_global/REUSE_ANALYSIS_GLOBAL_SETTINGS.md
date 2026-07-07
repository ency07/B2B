# REUSE_ANALYSIS — Centro de Configuración Global

**Fecha de Análisis:** 2026-06-18
**Fase:** 31-34 — Configuración Global, White Label, Integraciones y Administración
**Estado:** APROBADO — 5 herramientas evaluadas (mínimo requerido: 5)
**Clasificación:** OBLIGATORIO antes de escribir cualquier línea de código custom

---

## 1. Repositorios e Infraestructuras Evaluadas

### REPO-01 — Supabase Vault (Secrets Management)

| Atributo | Valor |
|---|---|
| Repositorio | supabase/vault |
| URL | Habilitado nativamente en Supabase (extensión pg_vault) |
| Licencia | Apache 2.0 |
| Stars | N/A (Extensión del Core) |
| Actividad | Activo — mantenido directamente por Supabase |
| Tiempo de Integración | Bajo (ya habilitado en la plataforma) |
| Complejidad | Baja |
| Caso de Uso | Encriptación y almacenamiento de claves de API externas (Stripe, Twilio, OpenAI) |
| Veredicto | REUTILIZAR PARA SECRETOS |

Justificación: Para almacenar las claves de API (de WhatsApp, Email, Pasarelas de Pago) configuradas dinámicamente por empresa en la FASE 33, debemos utilizar la extensión de encriptación y desencriptación nativa de Postgres/Supabase (`pg_vault` o funciones pgcrypto como `pgp_sym_encrypt`) para que las credenciales no se almacenen en texto plano en la base de datos.

---

### REPO-02 — Unleash (Feature Flags & Config Engine)

| Atributo | Valor |
|---|---|
| Repositorio | Unleash/unleash |
| URL | https://github.com/Unleash/unleash |
| Licencia | Apache 2.0 |
| Stars | ~10,000 estrellas |
| Actividad | Muy activo |
| Tiempo de Integración | 3-5 días (requiere servidor independiente y SDK de cliente) |
| Complejidad | Alta para integraciones directas con políticas de RLS en base de datos |
| Veredicto | EVALUADO — DESCARTADO |

Justificación: Unleash es una solución empresarial de Feature Flags y configuración dinámica en Node.js. Sin embargo, no se integra de forma nativa a nivel de Row Level Security (RLS) en PostgreSQL, lo cual requeriría hacer llamadas desde el cliente o la base de datos a un servidor Unleash externo, introduciendo problemas de latencia, costo y complejidad. Almacenar los ajustes dinámicos de los tenants en una tabla `tenant_settings` propia en la base de datos del ERP es mucho más eficiente y mantiene la cohesión de RLS.

---

### REPO-03 — JSON Schema Form (Form.io / react-json-schema-form)

| Atributo | Valor |
|---|---|
| Repositorio | rjsf-team/react-json-schema-form |
| URL | https://github.com/rjsf-team/react-json-schema-form |
| Licencia | Apache 2.0 |
| Stars | ~13,000 estrellas |
| Actividad | Activo |
| NPM | npm i @rjsf/core |
| Tiempo de Integración | 1-2 días |
| Complejidad | Media |
| Caso de Uso | Renderizado automático de formularios UI para configuraciones y campos personalizados |
| Veredicto | REUTILIZAR PARA CAPA VISUAL |

Justificación: Para la FASE 31 (Settings) y FASE 34 (Campos Personalizados), utilizaremos este estándar en la interfaz visual. Permite definir la configuración o el campo dinámico mediante un JSON Schema y el componente genera la UI automáticamente de forma reactiva, lo cual evita crear componentes de formulario específicos.

---

### REPO-04 — n8n (Workflow Automation — Node.js)

| Atributo | Valor |
|---|---|
| Repositorio | n8n-io/n8n |
| URL | https://github.com/n8n-io/n8n |
| Licencia | Faircode (n8n license) |
| Stars | ~45,000 estrellas |
| Actividad | Muy activo |
| Tiempo de Integración | 4-7 días (deploy como servicio sidecar) |
| Complejidad | Alta — requiere infraestructura de base de datos dedicada y colas de tareas |
| Veredicto | EVALUADO — DESCARTADO para el núcleo del ERP |

Justificación: Para las automatizaciones de la FASE 34 ("Si Factura Vence $\rightarrow$ Enviar Telegram"), n8n es la herramienta visual líder. Sin embargo, para integraciones internas de CYH ERP, usar n8n añade un overhead de infraestructura innecesario en esta etapa. En su lugar, el bus de eventos nativo (`business_events`) y los triggers en PL/pgSQL acoplados a nuestro servicio de colas existente (BullMQ/Notificaciones de FASE 19) permiten procesar las automatizaciones sin salir del ecosistema modular de la aplicación.

---

### REPO-05 — PostgreSQL JSON Schema Validator (postgres-json-schema)

| Atributo | Valor |
|---|---|
| Repositorio | gavinwahl/postgres-json-schema |
| URL | https://github.com/gavinwahl/postgres-json-schema |
| Licencia | PL/pgSQL nativo (MIT) |
| Stars | ~800 estrellas |
| Actividad | Estable |
| Tiempo de Integración | 2-4 horas |
| Complejidad | Baja — funciones puras SQL |
| Caso de Uso | Validar esquemas JSONB dinámicamente en triggers de base de datos |
| Veredicto | REUTILIZAR (Incorporar funciones a migraciones) |

Justificación: Para asegurar que el campo `custom_fields` de cualquier tabla o la configuración en `tenant_settings` mantenga consistencia tipográfica (ej: que un número no sea almacenado como texto), reutilizaremos las funciones de validación de este repositorio para validar esquemas JSON directamente en PostgreSQL mediante triggers `BEFORE INSERT OR UPDATE`.

---

## 2. Métricas de Gobernanza (Regla 8 de Modo Auditor 0.3)

| Métrica | Valor |
|---|---|
| **Repositorios evaluados** | 5 (mínimo requerido: 5) — CUMPLIDO |
| **Repositorios seleccionados** | 3 (Supabase Vault, react-json-schema-form, postgres-json-schema) |
| **Repositorios descartados con justificación** | 2 (Unleash, n8n) |
| **Código custom prohibido justificado** | 0 |
| **Deuda técnica introducida** | 0 |
