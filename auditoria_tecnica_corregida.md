# 1. Resumen Ejecutivo

Tras una exhaustiva revisión de la base de código, los esquemas de bases de datos de Supabase, las Server Actions y la configuración de los pipelines de CI/CD, el equipo de auditoría ha identificado **7 hallazgos críticos transversales** que ponen en riesgo la integridad de los datos, la seguridad de la información y la usabilidad operativa del sistema:

---

## Hallazgo 1 — Destrucción de la Trazabilidad de Auditoría (Crítico)

**Severidad:** Crítico

En múltiples Server Actions (`core.ts`, `leads.ts`, `wizard.ts`), el sistema reemplaza el ID del usuario autenticado real por el ID del dueño del tenant (`resolveTenantOwnerUserIdAsync`) para el campo `created_by`. Esto atribuye todas las operaciones —movimientos de stock, facturas, asignaciones— a una sola cuenta administradora, imposibilitando auditorías legales.

**Impacto:**
- Incumplimiento normativo en contextos regulados.
- Imposibilidad de rastrear la autoría de cambios en un entorno multi-tenant.
- Riesgo legal ante auditorías externas o internas.

**Recomendación:**
Reemplazar `resolveTenantOwnerUserIdAsync` por el `userId` real extraído del contexto de autenticación (`getAuthContext`). Si se requiere mantener un propietario del tenant, almacenarlo en un campo separado (`tenant_owner_id`) y preservar `created_by` como el usuario que realizó la acción.

---

## Hallazgo 2 — Gaps Funcionales con Persistencia Volátil en el Cliente (Crítico)

**Severidad:** Crítico

La bitácora de control de calidad, la calibración aerodinámica de ventiladores y las firmas de liberación de las órdenes de trabajo (`jobs/page.tsx`), así como las transiciones de estado del pipeline Kanban comercial (`leads/page.tsx`), se almacenan exclusivamente en el estado local de React (`useState`). Al recargar la página, el avance operativo y las firmas se pierden, y el backend no registra nada de esta información.

**Impacto:**
- Pérdida irreversible de datos operativos ante cualquier recarga o caída del navegador.
- Imposibilidad de auditar estados intermedios del flujo.
- Experiencia de usuario degradada en dispositivos con conexión inestable.

**Recomendación:**
Migrar el almacenamiento a Server Actions con persistencia en Supabase. Cada transición de estado o firma debe generar un registro en una tabla de historial (`job_state_log`, `lead_state_log`) inmediatamente, no al completar el formulario.

---

## Hallazgo 3 — Exposición de Datos Sensibles por Omisión de Guards (Alto)

**Severidad:** Alto

Las Server Actions `listUsers` y `listRoles` en `src/erp/actions/users.ts` carecen de guards de autorización (`requireAction` / `getAuthContext`) y consumen `supabaseAdmin` directamente. Cualquier usuario o cliente externo del portal B2B podría extraer la base de datos de empleados del ERP —nombres, correos, teléfonos y roles asignados— sin autenticación ni verificación de permisos.

**Impacto:**
- Exposición pública de información confidencial de empleados.
- Escalación de privilegios: un atacante con acceso al portal público podría enumerar usuarios y roles del ERP.
- Incumplimiento de regulaciones de protección de datos (GDPR, LGPD, etc.).

**Recomendación:**
Implementar guards de autenticación y autorización en ambas funciones. Limitar el acceso a roles privilegiados (admin, rh) y auditar cada consulta con logs estructurados.

---

## Hallazgo 4 — Vulnerabilidad de Rendimiento por Sobrecarga de Memoria en KPIs (Alto)

**Severidad:** Alto

La Server Action `getKpisForRole` realiza consultas no paginadas ni limitadas a 7 tablas transaccionales masivas (`invoices`, `leads`, `jobs`, etc.) y descarga miles de filas en memoria de Node.js para filtrarlas mediante funciones de JavaScript en cada carga del dashboard. Esto causará una degradación severa del rendimiento y caídas por Out-Of-Memory (OOM) a medida que crezca el negocio.

**Impacto:**
- Degradación progresiva del rendimiento del dashboard.
- Caídas del servicio por agotamiento de memoria (OOM).
- Tiempo de respuesta inaceptable bajo carga real.

**Recomendación:**
Refactorizar las consultas para aplicar filtros directamente en SQL (`WHERE`, `JOIN` con condiciones), agregar paginación (`LIMIT` / `OFFSET`), y crear índices compuestos en las columnas filtradas. Considerar el uso de vistas materializadas o consultas incrementales para métricas precalculadas.

---

## Hallazgo 5 — Ineficiencia Crítica N+1 en Desencriptación de Settings (Medio)

**Severidad:** Medio

En `getTenantSettings`, el backend recorre secuencialmente en un ciclo `for` las configuraciones del tenant, ejecutando llamadas RPC individuales (`get_tenant_setting`) a la base de datos para desencriptar cada parámetro. Esto incrementa linealmente el tiempo de respuesta del servidor y multiplica la latencia de red.

**Impacto:**
- Latencia excesiva por cada solicitud de configuración.
- Degradación del rendimiento en entornos con alta concurrencia.
- Mayor consumo de recursos de base de datos.

**Recomendación:**
Reemplazar las llamadas RPC individuales por una única consulta SQL que devuelva todas las configuraciones del tenant, y desencriptarlas en batch en el lado del servidor antes de devolver el resultado.

---

## Hallazgo 6 — Políticas de Seguridad Degradadas en CI/CD (Medio)

**Severidad:** Medio

El workflow del pipeline de GitHub Actions (`ci.yml`) tiene configurado `continue-on-error: true` en el paso de Security Audit (`npm audit`). Esto permite la integración y despliegue automático de paquetes de npm con vulnerabilidades críticas en producción.

**Impacto:**
- Acumulación silenciosa de dependencias vulnerables.
- Despliegue de vulnerabilidades conocidas al entorno de producción.
- Falsa sensación de seguridad durante las revisiones de código.

**Recomendación:**
Eliminar `continue-on-error: true` del paso de `npm audit` y configurarlo para que falle el pipeline ante vulnerabilidades de severidad `high` o superior. Si el equipo requiere excepciones temporales, documentarlas explícitamente con un ticket de seguimiento.

---

## Hallazgo 7 — Inconsistencia de Datos por Hardcodeo de Claves Foráneas (Medio)

**Severidad:** Medio

Al crear una orden de trabajo (`createJob`), si el tenant no tiene clientes o requerimientos creados, el backend inyecta UUIDs fijos directamente para evadir las restricciones de integridad relacional en Postgres. Esto genera datos huérfanos o referencias inválidas en la base de datos.

**Impacto:**
- Datos corruptos o incoherentes en el sistema.
- Fallos silenciosos en reportes y dashboards que asumen integridad referencial.
- Dificultad para depurar el origen de registros anomalos.

**Recomendación:**
Validar la existencia de `client_id` y `requirement_id` antes de crear la orden de trabajo. Si no existen, devolver un error descriptivo al usuario en lugar de injectar valores ficticios. Implementar constraints de integridad a nivel de base de datos como línea de defensa final.

---

## Resumen de Severidades

| # | Hallazgo | Severidad |
|---|----------|-----------|
| 1 | Destrucción de la trazabilidad de auditoría | Crítico |
| 2 | Gaps funcionales con persistencia volátil en el cliente | Crítico |
| 3 | Exposición de datos sensibles por omisión de guards | Alto |
| 4 | Vulnerabilidad de rendimiento por sobrecarga de memoria en KPIs | Alto |
| 5 | Ineficiencia crítica N+1 en desencriptación de settings | Medio |
| 6 | Políticas de seguridad degradadas en CI/CD | Medio |
| 7 | Inconsistencia de datos por hardcodeo de claves foráneas | Medio |

---

## Próximos Pasos Recomendados

1. **Inmediato (Críticos):** Corregir los hallazgos 1 y 2 antes del próximo despliegue. Representan un riesgo legal y de pérdida de datos operativos.
2. **Corto plazo (Altos):** Resolver los hallazgos 3 y 4 para blindar la seguridad y estabilizar el rendimiento del dashboard.
3. **Mediano plazo (Medios):** Abordar los hallazgos 5, 6 y 7 en sprints dedicados para mejorar la eficiencia y la calidad del pipeline.

---

*Documento generado por el equipo de auditoría — 2026-07-08*
