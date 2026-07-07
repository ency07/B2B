# ANÁLISIS DE REUTILIZACIÓN - FASE 23: RELEASE / PRODUCCIÓN (GO-LIVE)

Este documento realiza la auditoría de reutilización obligatoria para la **FASE 23: Release / Producción (Go-Live)**, de acuerdo con el **MODO AUDITOR 0.3** del ERP B2B Premium.

---

## 1. Tabla de Auditoría de Reutilización

| Componente Requerido | Alternativa Evaluada | Reutilizable | Justificación / Coste de Adaptación |
|---|---|---|---|
| **Gestión de Despliegue** | Supabase CLI (MIT) | **Sí** | Herramienta oficial y nativa integrada con el sistema de migraciones. Coste de adaptación: 0. |
| **Gestión de Despliegue** | Flyway / Liquibase (Apache-2.0) | **No** | Complejo, requiere JVM e infraestructura adicional. Coste de adaptación: Alto. |
| **Monitoreo Base** | Supabase Metrics & Logs (Nativo) | **Sí** | Dashboard nativo para monitorear CPU, RAM, conexiones y lecturas de disco. Coste de adaptación: 0. |
| **Monitoreo de Consultas** | pg_stat_statements (Core Postgres) | **Sí** | Extensión core de PostgreSQL activa por defecto en Supabase. Coste de adaptación: 0. |
| **Monitoreo Avanzado** | Prometheus + Grafana (Apache-2.0) | **No** | Sobrecarga de infraestructura innecesaria para la etapa actual de la startup. Coste de adaptación: Alto. |
| **Backups Programados** | Supabase Auto Backups (SaaS) | **Sí** | Sistema automatizado nativo de backups diarios con retención variable. Coste de adaptación: 0. |
| **Backups Manuales** | pg_dump / pg_restore (Postgres Core) | **Sí** | Herramienta estándar de exportación de esquemas y datos a nivel físico/lógico. Coste de adaptación: Bajo. |

---

## 2. Decisión de Arquitectura Adoptada

1. **Despliegue de Esquema y Datos**:
   * Se reutiliza el flujo nativo de migraciones de **Supabase CLI** para aplicar secuencialmente los scripts desde `20260617000000_init_core.sql` hasta `20260617000022_uat_validation.sql` en producción.
   * Se creará una plantilla de script PowerShell de despliegue (`scripts/deploy.ps1`) para automatizar este comando.

2. **Monitoreo y Diagnóstico**:
   * Se crea una vista de monitoreo en la base de datos `performance_queries_summary` basada en `pg_stat_statements` para detectar consultas lentas o de alto consumo sin necesidad de instalar agentes externos de monitoreo.

3. **Respaldos de Datos (Backups)**:
   * Se creará un script de respaldo lógico bajo demanda (`scripts/backup-db.ps1`) que utiliza `pg_dump` para generar backups rápidos del esquema y catálogo maestro por tenant.

4. **Validación (Go-Live Checklist)**:
   * Se creará una suite de pruebas sintácticas `scripts/test-go-live.ts` para verificar la preparación de producción de la base de datos antes del lanzamiento.
