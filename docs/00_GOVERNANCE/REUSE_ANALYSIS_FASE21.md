# REUSE_ANALYSIS_FASE21 — Hardening / Rendimiento de Base de Datos

**Fecha de Análisis:** 2026-06-18
**Fase:** 21 — Hardening / Rendimiento
**Estado:** APROBADO — 6 herramientas/extensiones evaluadas (mínimo requerido: 5)
**Clasificación:** OBLIGATORIO antes de escribir cualquier línea de código custom o añadir índices

> DIRECTIVA CERO-DUPLICACIÓN (Modo Auditor 0.3):
> Prohibido diseñar analizadores de rendimiento complejos, scripts de reindexación redundantes
> o frameworks de optimización de consultas sin demostrar que no existe repositorio/extensión reutilizable.
> Este análisis evalúa las herramientas líderes de rendimiento para PostgreSQL/Supabase.

---

## 1. Repositorios y Herramientas Evaluados

### REPO-01 — pg_stat_statements (PostgreSQL Core Extension)

| Atributo | Valor |
|---|---|
| Repositorio | postgres/postgres (contrib/pg_stat_statements) |
| URL | Habilitado nativamente en PostgreSQL/Supabase |
| Licencia | PostgreSQL License |
| Stars | N/A (Core Postgres) |
| Actividad | Muy activo — mantenido como extensión del núcleo de PostgreSQL |
| Tiempo de Integración | 0 horas (ya preinstalado) |
| Complejidad | Baja — se accede a través de vistas SQL estándar |
| Caso de Uso | Registrar estadísticas de ejecución de todas las sentencias SQL (tiempo medio, llamadas, filas devueltas, buffer cache) |
| Veredicto | REUTILIZAR NATIVAMENTE |

Justificación: Es la fuente de verdad definitiva para identificar qué consultas consumen más CPU/memoria en la base de datos. Supabase expone esta extensión directamente en el panel de rendimiento, por lo que su reutilización es directa, sin coste y sin dependencias adicionales.

---

### REPO-02 — PgHero (PostgreSQL Performance Dashboard)

| Atributo | Valor |
|---|---|
| Repositorio | ankane/pghero |
| URL | https://github.com/ankane/pghero |
| Licencia | MIT |
| Stars | ~8,100 estrellas |
| Actividad | Activo — desarrollo constante |
| Tiempo de Integración | 2-4 horas (deploy vía Docker o gema Ruby) |
| Complejidad | Baja-Media — requiere exponer puerto de base de datos a un contenedor sidecar |
| Caso de Uso | Dashboard visual para ver índices faltantes, consultas lentas, bloqueos y uso de espacio de tablas |
| Veredicto | REUTILIZAR COMO HERRAMIENTA DE DIAGNÓSTICO EXTERNO |

Justificación: PgHero es excelente para el diagnóstico de rendimiento en producción. No obstante, para las optimizaciones y hardening dentro del alcance del desarrollo, la base de datos puede beneficiarse directamente de la creación de índices y optimizaciones de consultas mediante código SQL puro en las migraciones, sin necesidad de desplegar el contenedor de PgHero en esta fase del desarrollo local.

---

### REPO-03 — pg_repack (Reorganización de tablas sin bloqueos)

| Atributo | Valor |
|---|---|
| Repositorio | reorg/pg_repack |
| URL | https://github.com/reorg/pg_repack |
| Licencia | BSD-3-Clause |
| Stars | ~1,200 estrellas |
| Actividad | Activo — soporte para las últimas versiones de PostgreSQL |
| Tiempo de Integración | Medio (requiere instalar la extensión en el motor de base de datos) |
| Complejidad | Media-Alta — requiere ejecución vía CLI externa |
| Caso de Uso | Reconstruir índices y eliminar bloat (espacio muerto) de tablas grandes sin bloquear lecturas/escrituras |
| Veredicto | EVALUADO — DESCARTADO para esta fase |

Justificación: pg_repack es una herramienta avanzada para bases de datos de producción con alta carga transaccional que sufren de fragmentación grave. Para la fase de desarrollo actual, la base de datos no tiene fragmentación ni datos masivos que justifiquen pg_repack. Se considerará para la FASE 30 (Release) en la preparación para producción.

---

### REPO-04 — pg_qualstats (Index Advisor / Plan Query Stats)

| Atributo | Valor |
|---|---|
| Repositorio | pganalyze/pg_qualstats |
| URL | https://github.com/pganalyze/pg_qualstats |
| Licencia | PostgreSQL License |
| Stars | ~300 estrellas |
| Actividad | Activo |
| Tiempo de Integración | Medio (requiere configuración en postgresql.conf) |
| Complejidad | Media |
| Caso de Uso | Recopilar estadísticas sobre las cláusulas WHERE y JOIN de las consultas para sugerir índices |
| Veredicto | EVALUADO — DESCARTADO |

Justificación: Requiere instalar extensiones binarias compiladas en el servidor PostgreSQL, lo cual no es viable de configurar en entornos gestionados SaaS estándar sin privilegios de superusuario root en el sistema operativo. En su lugar, el análisis manual de consultas mediante `EXPLAIN ANALYZE` es suficiente y universal.

---

### REPO-05 — pg_partman (PostgreSQL Partition Management)

| Atributo | Valor |
|---|---|
| Repositorio | pgpartman/pg_partman |
| URL | https://github.com/pgpartman/pg_partman |
| Licencia | PostgreSQL License |
| Stars | ~1,600 estrellas |
| Actividad | Muy activo |
| Tiempo de Integración | 1-2 días |
| Complejidad | Alta — requiere configurar particionado físico de tablas por rango o fecha |
| Caso de Uso | Dividir automáticamente tablas masivas (como `audit_log` o `business_events`) por meses o años |
| Veredicto | EVALUADO — DESCARTADO en esta fase |

Justificación: El particionado físico de tablas es útil cuando el volumen supera las decenas de millones de registros. En el estado actual del ERP, el particionado físico introduce una complejidad innecesaria en las relaciones de claves foráneas y RLS. Optimizaremos mediante índices parciales y compuestos en lugar de particionamiento físico duro.

---

### REPO-06 — EXPLAIN ANALYZE (Nativo de PostgreSQL)

| Atributo | Valor |
|---|---|
| Tecnología | Motor nativo de PostgreSQL |
| URL | https://www.postgresql.org/docs/current/sql-explain.html |
| Licencia | N/A (Core) |
| Tiempo de Integración | 0 horas |
| Complejidad | Baja (análisis técnico de planes de ejecución) |
| Caso de Uso | Obtener el plan de ejecución real del Query Planner (Sequential Scan vs Index Scan) y tiempos de ejecución |
| Veredicto | REUTILIZAR NATIVAMENTE |

Justificación: Es la herramienta fundamental de PostgreSQL para evaluar el costo y rendimiento de cualquier consulta. Se utilizará para probar que los nuevos índices reduzcan el costo del plan de ejecución a cero secuenciales.

---

## 2. Decisiones de Hardening Congeladas (D21-01 a D21-04)

| ID | Decisión | Justificación |
|---|---|---|
| **D21-01** | **Indexación de Claves Foráneas (FKs)** | Todos los campos que actúen como Foreign Key (FK) en el ERP deben poseer un índice explícito (`CREATE INDEX`) para optimizar los JOINs. |
| **D21-02** | **Índices Parciales para Soft Delete** | Los índices de consultas ordinarias del ERP filtrarán registros descartados añadiendo la cláusula `WHERE deleted_at IS NULL`. |
| **D21-03** | **Evitar Sequential Scans** | Optimizar las consultas del bus de eventos y de las bandejas analíticas agregando índices compuestos. |
| **D21-04** | **Inmutabilidad de Tablas Técnicas** | Asegurar la salud del almacenamiento aplicando soft-deletes a todas las tablas y previniendo crecimientos exponenciales no controlados en `audit_log`. |

---

## 3. Métricas de Gobernanza (Regla 8 de Modo Auditor 0.3)

| Métrica | Valor |
|---|---|
| **Repositorios evaluados** | 6 (mínimo requerido: 5) — CUMPLIDO |
| **Repositorios seleccionados** | 2 (pg_stat_statements, EXPLAIN ANALYZE) |
| **Repositorios descartados con justificación** | 4 (PgHero, pg_repack, pg_qualstats, pg_partman) |
| **Código custom prohibido justificado** | 0 |
| **Deuda técnica introducida** | 0 |
