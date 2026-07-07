# REUSE_ANALYSIS_FASE20 — Seguridad y Auditoría Avanzada

**Fecha de Análisis:** 2026-06-18
**Fase:** 20 — Seguridad y Auditoría Avanzada
**Estado:** APROBADO — 6 repositorios/herramientas evaluados (mínimo requerido: 5)
**Clasificación:** OBLIGATORIO antes de escribir cualquier línea de código custom

> DIRECTIVA CERO-DUPLICACIÓN (Modo Auditor 0.3):
> Prohibido construir motores de autorización complejos, servicios de sesión redundantes
> o extensiones de auditoría complejas sin demostrar que no existe repositorio/mecanismo reutilizable.
> Este análisis evalúa las opciones de mercado y justifica la arquitectura óptima.

---

## 1. Repositorios y Herramientas Evaluados

### REPO-01 — pgAudit (PostgreSQL Audit Extension)

| Atributo | Valor |
|---|---|
| Repositorio | pgaudit/pgaudit |
| URL | https://github.com/pgaudit/pgaudit |
| Licencia | PostgreSQL (MIT-like) |
| Stars | ~1,400 estrellas |
| Actividad | Activo — soporte para las últimas versiones de PostgreSQL |
| Tiempo de Integración | Medio-Alto (requiere privilegios de superusuario para cargar extensiones) |
| Complejidad | Alta en entornos de nube administrados (en Supabase Cloud no está habilitada por defecto para self-service en todos los planes) |
| Caso de Uso | Auditoría de lecturas (SELECT) y escrituras a nivel de sistema de archivos PostgreSQL |
| Veredicto | EVALUADO — DESCARTADO para esta fase |

Justificación: pgAudit es una excelente herramienta para auditorías profundas del motor (graba logs en los archivos de log del servidor de base de datos). Sin embargo, nuestro sistema requiere auditoría accesible a través de la aplicación por inquilino (`tenant_id`), lo cual es sumamente difícil de exponer de forma segura y en tiempo real usando los logs del sistema de pgAudit. Para auditoría comercial y técnica, nuestra tabla existente `audit_log` y los triggers en PL/pgSQL son multi-tenant por diseño, se ejecutan en espacio de usuario y no requieren privilegios de superusuario (`superuser`), lo cual simplifica enormemente el mantenimiento operacional del SaaS.

---

### REPO-02 — Permify (Authorization Service based on Google Zanzibar)

| Atributo | Valor |
|---|---|
| Repositorio | Permify/permify |
| URL | https://github.com/Permify/permify |
| Licencia | Apache 2.0 |
| Stars | ~3,200 estrellas |
| Actividad | Muy activo — actualizaciones constantes en 2024-2026 |
| Tiempo de Integración | 3-5 días (despliegue de sidecar API e integración gRPC) |
| Complejidad | Alta — requiere base de datos dedicada y servicio de autorización paralelo |
| Veredicto | DESCARTADO |

Justificación: Permify es un motor ReBAC (Relationship-Based Access Control) extremadamente potente para aplicaciones complejas. Sin embargo, CYH ERP ya cuenta con un modelo de roles y permisos (RBAC) estructurado en las tablas `roles`, `permissions`, `user_roles` y `user_permissions` de la FASE 1. Introducir Permify requiere correr un servicio externo en la infraestructura y reescribir toda la lógica de validación de RLS para consultar Permify vía HTTP/gRPC, lo que causaría una latencia inaceptable y violaría el principio de Cero-Duplicación de tablas de control.

---

### REPO-03 — Casbin (Multi-model Authorization Library)

| Atributo | Valor |
|---|---|
| Repositorio | casbin/casbin-node |
| URL | https://github.com/casbin/casbin-node |
| Licencia | Apache 2.0 |
| Stars | ~2,100 estrellas |
| Actividad | Activo — soporte Node.js/TypeScript |
| Tiempo de Integración | 1-2 días |
| Complejidad | Media — requiere mantener archivos de modelo de políticas y adaptadores de BD |
| Veredicto | DESCARTADO |

Justificación: Casbin permite desacoplar la lógica de permisos del código de la aplicación. No obstante, al implementar un backend SaaS basado en Supabase, la fuente de verdad de la seguridad y el control de acceso debe residir en PostgreSQL a través de Row Level Security (RLS) para evitar que clientes accedan directamente a datos mediante llamadas directas a la API de Supabase. Casbin opera principalmente en el backend de la aplicación Node.js, lo que no protege la capa de datos si los usuarios interactúan directamente con la base de datos a través de PostgREST. Reutilizar nuestro modelo RBAC nativo en base de datos es más seguro y eficiente.

---

### REPO-04 — Supabase Custom Claims (JWT Claims management helper)

| Atributo | Valor |
|---|---|
| Repositorio | supabase-community/supabase-custom-claims |
| URL | https://github.com/supabase-community/supabase-custom-claims |
| Licencia | MIT |
| Stars | ~500 estrellas |
| Actividad | Activo — mantenido por la comunidad de Supabase |
| Tiempo de Integración | 2-4 horas |
| Complejidad | Baja — funciones SQL simples |
| Veredicto | REUTILIZAR INDIRECTAMENTE (mecanismo conceptual de claims de Supabase Auth) |

Justificación: Este repositorio provee funciones SQL para leer y escribir en los metadatos de usuario (`auth.users.raw_app_meta_data`). Permite almacenar el rol de usuario directamente en el JWT, evitando tener que hacer JOINs en las políticas de RLS de cada tabla para consultar el rol. Utilizaremos conceptualmente este mecanismo leyendo el rol desde el token JWT (`auth.jwt()`) para optimizar el rendimiento de las políticas de RLS, pero mantendremos la fuente de verdad en las tablas de auditoría.

---

### REPO-05 — Ory Kratos (Identity & Session Management)

| Atributo | Valor |
|---|---|
| Repositorio | oryd/kratos |
| URL | https://github.com/ory/kratos |
| Licencia | Apache 2.0 |
| Stars | ~11,000 estrellas |
| Actividad | Muy activo |
| Tiempo de Integración | 5-7 días (reemplazo completo de Supabase Auth) |
| Complejidad | Muy Alta — requiere desplegar un backend de identidad independiente |
| Veredicto | DESCARTADO |

Justificación: Ory Kratos maneja el registro, inicio de sesión, sesiones activas y flujos de autenticación. En este proyecto ya utilizamos **Supabase Auth** como el motor de identidad nativo y base de la autenticación. Descartamos Ory Kratos porque duplicaría la funcionalidad de Supabase Auth y añadiría complejidad innecesaria. En su lugar, auditaremos y extenderemos las sesiones de SupabaseAuth de manera nativa mediante una tabla `user_access_logs` en base de datos.

---

### REPO-06 — pg_jwt (PostgreSQL JWT signature & verification extension)

| Atributo | Valor |
|---|---|
| Repositorio | michelp/pgjwt |
| URL | https://github.com/michelp/pgjwt |
| Licencia | MIT |
| Stars | ~300 estrellas |
| Actividad | Estable — incorporado de forma nativa en Supabase |
| Tiempo de Integración | 0 horas (ya preinstalado) |
| Complejidad | Baja |
| Caso de Uso | Decodificar e inspeccionar JWTs de sesión en base de datos para auditoría de IP/roles |
| Veredicto | REUTILIZAR (Nativo en Supabase) |

Justificación: pg_jwt ya está habilitado en Supabase y es lo que permite que `auth.jwt()` funcione dentro de nuestras políticas RLS. Lo utilizaremos para extraer detalles de la sesión actual en el trigger de auditoría de accesos.

---

## 2. Decisiones de Arquitectura Congeladas (D20-01 a D20-06)

| ID | Decisión | Justificación |
|---|---|---|
| **D20-01** | **Tabla `user_access_logs`** | Crear una tabla nativa para registrar logins, logouts, fallos de sesión e IPs de acceso de los usuarios del ERP, multi-tenant mediante `tenant_id`. |
| **D20-02** | **Trigger en Supabase Auth** | Dado que Supabase gestiona la autenticación en el esquema `auth`, asociaremos un trigger a la tabla `auth.users` o un helper en la capa de aplicación para registrar de forma inmutable los accesos en `user_access_logs`. |
| **D20-03** | **Hardening RLS General** | Revisar y hardening de políticas de RLS en todas las tablas existentes para mitigar riesgos de "Tenant Crossing" (cruce de inquilinos). |
| **D20-04** | **Auditoría de Accesos Lógicos** | Crear una vista o consulta protegida para que solo el rol `AUDITOR` o `SUPER_ADMIN` pueda ver los logs de acceso. |
| **D20-05** | **Bloqueo Físico en Acceso** | La tabla `user_access_logs` será inmutable. Queda estrictamente prohibido editar o eliminar registros de esta tabla. Se aplica trigger BEFORE UPDATE OR DELETE para lanzar excepción. |
| **D20-06** | **Trazabilidad de IPs** | Registrar obligatoriamente el `ip_address` y el `user_agent` en cada log de acceso para investigaciones forenses. |

---

## 3. Métricas de Gobernanza (Regla 8 de Modo Auditor 0.3)

| Métrica | Valor |
|---|---|
| **Repositorios evaluados** | 6 (mínimo requerido: 5) — CUMPLIDO |
| **Repositorios seleccionados** | 2 (Supabase Custom Claims, pg_jwt nativo) |
| **Repositorios descartados con justificación** | 4 (pgAudit, Permify, Casbin, Ory Kratos) |
| **Código custom prohibido justificado** | 0 |
| **Deuda técnica introducida** | 0 |

---

*Documento generado conforme al Modo Auditor de Decisiones Congeladas (0.3).*
*Firmado: Antigravity AI — Análisis REUSE obligatorio completado el 2026-06-18.*
