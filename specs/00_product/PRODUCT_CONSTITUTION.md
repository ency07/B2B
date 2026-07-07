# PRODUCT CONSTITUTION — CONSTITUCIÓN DEL PRODUCTO

## Supremacía

Este documento tiene **prioridad absoluta** sobre cualquier otro documento del proyecto.

Ninguna IA, desarrollador o herramienta podrá generar código sin haber leído y aceptado este documento primero.

> "Si una implementación incumple un solo pilar deberá ser rechazada y rediseñada."

---

## Las 25 Decisiones Congeladas

**ESTAS REGLAS NO SE VUELVEN A PREGUNTAR.**

| # | Decisión |
|---|---|
| 1 | **Multiempresa obligatorio.** Toda entidad operacional pertenece a un tenant. |
| 2 | **`tenant_id` obligatorio.** En toda tabla operacional. Sin excepción. |
| 3 | **RLS obligatorio.** Row Level Security en toda tabla crítica. |
| 4 | **Soft delete obligatorio.** `deleted_at`, `deleted_by`, `delete_reason` en toda tabla. |
| 5 | **DELETE físico prohibido.** Trigger bloquea todo DELETE en tablas operacionales. |
| 6 | **`audit_logs` obligatorio.** Toda mutación registrada con diff JSONB. |
| 7 | **`business_events` obligatorio.** Eventos de negocio inmutables para todo hito crítico. |
| 8 | **`tenant_sequences` obligatorio.** Códigos correlativos por tenant. Prohibido MAX(id)+1. |
| 9 | **Códigos por tenant.** Cada empresa tiene su propia numeración secuencial. |
| 10 | **Estados en mayúsculas.** `APROBADA`, `EN_REVISION`, `CANCELADO`. |
| 11 | **Cancelación requiere motivo.** Mínimo 10 caracteres, validado por trigger. |
| 12 | **`created_by` obligatorio.** En toda tabla. |
| 13 | **`updated_by` obligatorio.** En toda tabla. |
| 14 | **`deleted_by` obligatorio.** En toda tabla con soft delete. |
| 15 | **Portal cliente integrado.** Autoservicio para cotizaciones, pagos, garantías. |
| 16 | **Pasarela de pagos integrada.** Wompi (Colombia). |
| 17 | **Documentos centralizados.** Repositorio único con versionado y polimorfismo. |
| 18 | **Trazabilidad total.** Cada elemento responde: quién, cuándo, qué hizo, por qué. |
| 19 | **Pruebas manuales obligatorias.** Cada módulo tiene script de validación. |
| 20 | **25 tenants de prueba.** Datos semilla para validación multiempresa. |
| 21 | **106 usuarios de prueba.** Distribuidos en los 25 tenants. |
| 22 | **Reutilización obligatoria.** Antes de construir, auditar si existe solución reutilizable. |
| 23 | **No construir UI desde cero.** Si existe repositorio reutilizable, usarlo. |
| 24 | **Arquitectura SaaS Multiempresa.** Aislamiento total. Sin cross-tenant queries. |
| 25 | **White Label obligatorio.** Todo configurable sin recompilar. |

---

## La Regla Suprema: NO INVENTAR

> "Es mejor hacer 100 preguntas que inventar 1 requisito."

### Protocolo de incertidumbre

Si durante cualquier fase surge una pregunta no documentada:

1. **DETENERSE** inmediatamente
2. **DOCUMENTAR** la duda (qué falta, por qué es necesaria, qué impacto tiene)
3. **AUDITAR** las 8 fuentes documentales para ver si la respuesta ya existe
4. Si la respuesta existe en docs: **APLICARLA** — prohibido preguntar al usuario
5. Si la respuesta no existe: **PREGUNTAR** al usuario en un solo bloque consolidado
6. **ESPERAR** respuesta antes de continuar

### Matriz de decisión

| Estado | Acción |
|---|---|
| **DEFINIDO** | Se puede implementar. Sin preguntas. |
| **PARCIALMENTE DEFINIDO** | Generar preguntas específicas. No implementar hasta respuesta. |
| **NO DEFINIDO** | **Prohibido implementar.** Detenerse. Documentar. Preguntar. |

### Prohibiciones explícitas

- Prohibido inventar campos, tablas, relaciones, estados, permisos, procesos, pantallas, APIs, cálculos o reglas de negocio no documentados.
- Prohibido crear `customer_type`, `priority_level`, `project_code`, `estimated_cost`, `approval_limit`, `department_id` si nunca fueron definidos.
- Prohibido crear tablas de inventario, proyectos, tareas, activos, proveedores, compras solo porque parecen lógicas.

---

## Jerarquía de prioridad

```
REUTILIZAR > EXTENDER > ADAPTAR > CREAR
```

Crear una nueva entidad, tabla, componente o dependencia será siempre la **última opción**.

Antes de crear, ejecutar **REUSE_ANALYSIS** obligatorio en: UI, Backend, Database, Librerías, APIs, Open Source, AI, Infraestructura.

---

## Modo Auditor — Decisiones Congeladas (0.3)

### Las 8 reglas del modo auditor

| # | Regla |
|---|---|
| 1 | Antes de preguntar, auditar 8 fuentes documentales. Si la respuesta existe: PROHIBIDO PREGUNTAR. Decisión heredada automáticamente. |
| 2 | Antes de diseñar nueva fase: ejecutar REUSE AUDIT. Demostrar qué tablas existentes se revisaron, cuáles son reutilizables, cuáles no. Si hay reusable: PROHIBIDO CREAR NUEVA TABLA. |
| 3 | Principio Cero Duplicación. Prohibido crear tablas, catálogos, estados, secuencias, eventos, roles si existe equivalente. |
| 4 | Tabla de preguntas obligatoria antes de DISCOVERY. Estados: HEREDADA, DOCUMENTADA, PENDIENTE. Solo PENDIENTE se presenta al usuario. |
| 5 | Gate Block: Si >20% de preguntas tienen respuesta en docs: ABORTAR DISCOVERY. |
| 6 | Decisiones congeladas nunca se preguntan de nuevo (ver lista completa arriba). |
| 7 | Error de gobernanza obligatorio cuando: pregunta ya respondida, tabla duplicada propuesta, entidad sin auditoría previa, decisión congelada ignorada. Mensaje: "ERROR DE GOBERNANZA". |
| 8 | Métricas obligatorias al final de cada fase: DECISIONES HEREDADAS, DECISIONES REUTILIZADAS, TABLAS EVITADAS, PREGUNTAS ELIMINADAS, PREGUNTAS REALES PENDIENTES. Si PREGUNTAS REALES PENDIENTES = 0: proceder directamente sin intervención del usuario. |

---

## Regla de congelamiento por fase

| Estado de fase | Regla |
|---|---|
| **DISCOVERY** | Preguntas permitidas. Se descubren y documentan requisitos. |
| **DESIGN** | No se aceptan preguntas nuevas. Solo se diseñan elementos ya definidos. |
| **BUILD** | No se aceptan preguntas nuevas. Solo se implementa lo diseñado. Si surge una pregunta: es fallo de análisis. Generar reporte. No preguntar al usuario. |
| **CLOSED** | Solo corrección de bugs. No se agrega funcionalidad nueva. |

---

## Criterios de aprobación (Pilar XX)

Antes de aprobar cualquier cambio, responder internamente:

1. ¿Viola alguno de los pilares de la Constitución Técnica?
2. ¿Existe una solución Open Source mejor?
3. ¿Esto puede administrarse desde el ERP?
4. ¿Genera deuda técnica?
5. ¿La UI aporta valor operativo?
6. ¿Escala a miles de empresas?
7. ¿Respeta Multi Tenant?
8. ¿Es reutilizable?
9. ¿Es auditable?
10. ¿Es consistente con toda la arquitectura?

**Si cualquiera de las respuestas es NO: la implementación debe detenerse y rediseñarse antes de escribir código.**

---

## Obligatoriedad de lectura

Antes de iniciar cualquier implementación, leer en este orden:

1. `specs/00_product/PRODUCT_CONSTITUTION.md` (este documento)
2. `specs/00_product/TECHNICAL_CONSTITUTION.md`
3. `specs/00_product/BUSINESS_RULES.md`
4. `docs/00_GOVERNANCE/PROJECT_MEMORY.md`
5. Toda la documentación relacionada con la fase a implementar

**No se podrá generar código sin haber realizado esa lectura.**

---

## Condiciones de STOP inmediato

El sistema y cualquier agente deben detenerse inmediatamente si:

1. Se detecta una ambigüedad, omisión, contradicción o vacío funcional no documentado
2. Se encuentra un campo o tabla "fantasma" no definido en los diccionarios de datos oficiales
3. Se propone una transición de estado no definida en la matriz maestra de estados
4. Se intenta escribir código sin un `implementation_plan.md` aprobado
5. Se detecta una violación a cualquiera de las 25 Decisiones Congeladas

---

## Actualización de esta Constitución

Este documento solo puede modificarse mediante:

1. Una solicitud explícita del usuario
2. Una fase de protocolo dedicada
3. Aprobación formal después de auditar el impacto en todas las fases activas

**Ninguna IA está autorizada a modificar este documento por iniciativa propia.**
