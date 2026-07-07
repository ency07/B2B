# REUSE ANALYSIS - FASE 32: WHITE LABEL (BRANDING DINÁMICO)

**Fecha de Análisis:** 2026-06-18
**Fase:** 32 — White Label (Branding Dinámico)
**Estado:** APROBADO — 5 herramientas/estrategias evaluadas (mínimo requerido: 5)
**Clasificacón:** OBLIGATORIO antes de escribir cualquier línea de código custom

---

## 1. Repositorios e Infraestructuras Evaluadas

Este análisis hereda y complementa el análisis global consolidado en [REUSE_ANALYSIS_GLOBAL_SETTINGS.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/30_configuracion_global/REUSE_ANALYSIS_GLOBAL_SETTINGS.md), evaluando específicamente la capacidad de personalización visual extrema.

### REPO-01 — CSS Custom Properties (Variables CSS Nativas)

| Atributo | Valor |
|---|---|
| Repositorio | Estándar W3C (Nativo en navegadores modernos) |
| URL | N/A |
| Licencia | Dominio Público |
| Tiempo de Integración | Inmediato |
| Complejidad | Muy Baja |
| Caso de Uso | Aplicación dinámica de colores primario/secundario/estado y fuentes leídos desde la base de datos |
| Veredicto | REUTILIZAR COMO PILAR DE BRANDING |

Justificación: En lugar de compilar o regenerar archivos CSS/Tailwind para cada tenant (lo que requeriría redespliegue de código), utilizaremos variables CSS nativas inyectadas dinámicamente desde el backend (ej: `:root { --primary-color: #XXXXXX }`). Esto permite cambiar instantáneamente la interfaz visual sin recargar código.

---

### REPO-02 — react-json-schema-form (RJSF)

| Atributo | Valor |
|---|---|
| Repositorio | rjsf-team/react-json-schema-form |
| URL | https://github.com/rjsf-team/react-json-schema-form |
| Licencia | Apache 2.0 |
| Stars | ~13,000 estrellas |
| Caso de Uso | Renderizado de formularios de diseño en el panel de control del administrador |
| Veredicto | REUTILIZAR PARA FORMULARIOS DE BRANDING |

Justificación: RJSF permite definir formularios de configuración de branding (colores, sombras, radios de borde) estructurados mediante JSON Schemas. Evita programar pantallas de configuración ad-hoc.

---

### REPO-03 — Web App Manifest (PWA) Generator

| Atributo | Valor |
|---|---|
| Repositorio | w3c/manifest |
| URL | https://w3c.github.io/manifest/ |
| Licencia | W3C Software License |
| Tiempo de Integración | 1 día |
| Complejidad | Baja |
| Caso de Uso | Generación al vuelo de `manifest.json` para cada tenant |
| Veredicto | REUTILIZAR PARA PWA PERSONALIZADOS |

Justificación: Para cumplir el soporte PWA con White Label, la URL `/manifest.json` del tenant devolverá dinámicamente un objeto JSON generado desde las claves de `tenant_settings` (ej: `nombre_sistema`, `favicon_url`, `color_primario`) resolviendo el soporte multiempresa en accesos móviles.

---

### REPO-04 — postgres-json-schema (PL/pgSQL Validator)

| Atributo | Valor |
|---|---|
| Repositorio | gavinwahl/postgres-json-schema |
| URL | https://github.com/gavinwahl/postgres-json-schema |
| Licencia | MIT |
| Tiempo de Integración | Bajo |
| Caso de Uso | Validación de formato JSON de layouts y temas en base de datos |
| Veredicto | REUTILIZAR PARA VALIDACIÓN DE SCHEMAS |

Justificación: Usaremos funciones PL/pgSQL inspiradas en este validator para asegurar que las configuraciones de menús (`layout_menus`), sidebars (`layout_sidebar`) y widgets (`layout_widgets`) mantengan una estructura correcta, evitando que layouts incorrectos rompan la UI de los inquilinos.

---

### REPO-05 — Next.js Dynamic Routes & Middelwares

| Atributo | Valor |
|---|---|
| Repositorio | vercel/next.js |
| URL | https://github.com/vercel/next.js |
| Licencia | MIT |
| Stars | ~120,000 estrellas |
| Complejidad | Media |
| Caso de Uso | Enrutamiento por subdominio/dominio personalizado para Login y pantallas de carga |
| Veredicto | REUTILIZAR EN EL FUTURO FRONTEND |

Justificación: Aunque el ERP es actualmente 100% backend de base de datos, el diseño de la base de datos para White Label de pantallas (Login, 404, 500) debe estar estructurado para que el Middleware de Next.js pueda consultar eficientemente en una única query la configuración visual basándose en el host/tenant_id.

---

## 2. Métricas de Gobernanza (Regla 8 de Modo Auditor 0.3)

| Métrica | Valor |
|---|---|
| **Repositorios/Estrategias evaluados** | 5 (mínimo requerido: 5) — CUMPLIDO |
| **Repositorios seleccionados** | 4 (CSS Custom Properties, RJSF, W3C Manifest, postgres-json-schema) |
| **Repositorios descartados con justificación** | 1 (Next.js - diferido para la etapa de desarrollo frontend) |
| **Deuda técnica introducida** | 0 |
