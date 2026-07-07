# PROJECT MEMORY (Memoria Histórica del Proyecto)

Este documento registra de forma histórica y cronológica el estado de avance del desarrollo, los módulos construidos y las especificaciones consolidadas del sistema.

---

## 1. Historial de Fases Completadas

### 1.1 FASE 1: Core Multiempresa y Seguridad Base
*   **Fecha de Aprobación:** 2026-06-16
*   **Módulos Construidos:**
    *   `tenants` (Empresas/Organizaciones aisladas).
    *   `users` (Catálogo de usuarios del sistema).
    *   `roles` / `permissions` / `user_roles` / `user_permissions` (Esquema RBAC de control de acceso).
    *   `sites` / `areas` (Catálogo corporativo inicial).
    *   `audit_log` (Tabla técnica y trigger para registrar auditoría de inserción, actualización y borrado).
*   **Entregables:** Migraciones `init_core.sql` y `seed_master_data.sql` con el catálogo de roles y áreas por defecto por tenant.

### 1.2 FASE 2: Clientes, Contactos y Sedes Comerciales
*   **Fecha de Aprobación:** 2026-06-16
*   **Módulos Construidos:**
    *   `clients` (Catálogo de clientes corporativos).
    *   `client_contacts` (Múltiples contactos por cliente, control automático de único contacto principal `is_primary = true` sin errores en base de datos).
    *   `client_sites` (Sedes múltiples por cliente).
    *   `business_events` (Catálogo inmutable de eventos operacionales).
*   **Entregables:** Migración `clients_core.sql` y script de pruebas automáticas `test-clients.ts`.

### 1.3 FASE 3: Requerimientos e Integración Documental Transversal (Fase 7)
*   **Fecha de Aprobación:** 2026-06-17
*   **Módulos Construidos:**
    *   `tenant_sequences` (Bloqueo transaccional por fila para generar códigos únicos concurrentes por tenant: formato `REQ-` y `DOC-`).
    *   `requirements` (Trazabilidad lineal de estados comerciales, asignación de responsables comerciales/técnicos, SLAs calculados físicamente en base a horas hábiles y matriz de cancelación estructurada).
    *   `documents` (Repositorio documental global transversal, con versionado automático a estado `'OBSOLETO'`, e independencia de storage mediante metadatos `file_size`, `checksum`, `storage_provider`, `storage_path`).
*   **Entregables:** Migración `requirements_core.sql`, script de verificación `test-requirements.ts` e informe de cierre `FASE3_IMPLEMENTATION_REPORT.md`.

### 1.4 FASE 4: Cotizaciones (Propuestas Comerciales)
*   **Fecha de Aprobación:** 2026-06-17
*   **Módulos Construidos:**
    *   `quotes` (Cabeceras de presupuestos con versionado y cálculos automáticos de totales globales).
    *   `quote_items` (Detalles de partidas presupuestarias con autocalculo de impuestos y totales de línea por trigger).
*   **Entregables:** Migración `quotes_core.sql`, script de verificación `test-quotes.ts` e informe de cierre `FASE4_IMPLEMENTATION_REPORT.md`.

### 1.5 FASE 5: Motor de Aprobaciones
*   **Fecha de Aprobación de Diseño:** 2026-06-17
*   **Módulos / Tablas definidos:**
    *   `approval_flows` (Flujos de aprobación por tenant).
    *   `approval_steps` (Pasos individuales de los flujos, exclusividad de rol o usuario).
    *   `approval_rules` (Reglas de montos vinculadas a flujos o auto-aprobación).
    *   `approval_requests` (Solicitudes de aprobación instanciadas).
    *   `approval_request_steps` (Firmas, estados y comentarios individuales de cada paso de la solicitud).
*   **Decisiones Funcionales Aprobadas:**
    *   **Generación de códigos:** Códigos `FLW-000001` y `APR-000001` incremental por tenant a través de `tenant_sequences`.
    *   **Creación de solicitud:** Automática cuando la cotización (`quote.status`) pasa a `EN_REVISION` evaluando `approval_rules`.
    *   **Exclusión de responsables:** Los pasos de flujo solo pueden tener asignados `role_id` o `user_id`, nunca ambos.
    *   **Impacto en Cotizaciones:** Solicitud `APROBADA` -> `quote APROBADA`; `RECHAZADA` -> `quote RECHAZADA`; `AJUSTES_SOLICITADOS` -> `quote EN_REVISION`; `CANCELADA` -> `quote CANCELADA`.
    *   **Sin Aprobación:** Si no se requiere flujo (flow_id NULL), pasa directamente a `APROBADA` y se registra `business_event`.
    *   **Sin Regla Coincidente:** Escalar automáticamente a Gerencia General (nunca autoaprobar).
    *   **Bloqueo de Modificación:** Cotizaciones e ítems quedan congelados y no modificables mientras exista aprobación en `PENDIENTE` o `EN_PROCESO`.
    *   **Trazabilidad Avanzada:** Registro en `business_events` e historial de firmas en `approval_request_steps`. Una cotización aprobada no se puede modificar o re-aprobar; requiere nueva versión.
    *   **Estados Oficiales:** `PENDIENTE`, `EN_PROCESO`, `APROBADA`, `RECHAZADA`, `AJUSTES_SOLICITADOS`, `CANCELADA` (en mayúsculas sostenidas).

### 1.6 FASE 6: Trabajos y Actividades (Orden de Trabajo)
*   **Fecha de Aprobación de Diseño:** 2026-06-17
*   **Módulos / Tablas definidos:**
    *   `jobs` (Orden de trabajo operativa vinculada a requerimientos).
    *   `job_activities` (Tareas desglosadas asignadas dentro de un trabajo).
*   **Decisiones Funcionales Aprobadas:**
    *   **Creación Automática:** Disparada cuando `requirements.status` cambia a `'OT_GENERADA'`. Hereda responsable, prioridad, cliente e información básica de la cotización aprobada.
    *   **Creación Manual:** Permitida solo a los roles `'GERENTE'`, `'GERENTE_GENERAL'`, `'JEFE_PROYECTOS'` y `'COORDINADOR_OPERACIONES'` (o super admin).
    *   **Códigos Correlativos:** Código de trabajo format `JOB-` incremental por tenant. Código de actividad jerárquico relativo al trabajo (ej: `JOB-000001-01`).
    *   **Estados y Prioridades:** Todo en mayúsculas sostenidas.
    *   **Propagación de Estados:**
        *   Actividad a `'EN_EJECUCION'` $\rightarrow$ Job pasa a `'EN_EJECUCION'`.
        *   Todas las actividades `'COMPLETADA'` $\rightarrow$ Job pasa a `'FINALIZADO'`.
        *   Job `'CANCELADO'` $\rightarrow$ Actividades abiertas pasan a `'CANCELADA'`.
    *   **Validaciones de Entrega:** Paso a `'ENTREGADO'` requiere Acta de Entrega cargada en `documents` (`document_type = 'DELIVERY_NOTE'`, estado `'PUBLICADO'`) asociada al ID del Job.
    *   **Fechas Planificadas:** Las fechas planificadas de las actividades deben quedar estrictamente dentro del rango de fechas planificadas del Trabajo padre.
    *   **Motivo de Cancelación:** Requiere obligatorio `cancel_reason` (mínimo 10 caracteres) y auditoría al pasar a `'CANCELADO'`.
    *   **Reglas de Flujo:**
        *   Job `'CERRADO'`: No editable, no eliminable, no reabrible.
        *   Job `'ENTREGADO'`: Solo puede transicionar a `'CERRADO'`.
        *   Job `'FINALIZADO'`: No puede regresar a `'PENDIENTE'` o `'PROGRAMADO'`.

---

## 2. Estado del Ecosistema de Datos (Esquema de Base de Datos Congelado)

El sistema cuenta actualmente con las siguientes tablas operacionales en base de datos:
1.  `tenants`
2.  `users`
3.  `roles`
4.  `permissions`
5.  `user_roles`
6.  `user_permissions`
7.  `sites`
8.  `areas`
9.  `audit_log`
10. `clients`
11. `client_contacts`
12. `client_sites`
13. `business_events`
14. `tenant_sequences`
15. `requirements`
16. `documents`
17. `quotes`
18. `quote_items`
19. `approval_flows`
20. `approval_steps`
21. `approval_rules`
22. `approval_requests`
23. `approval_request_steps`
24. `jobs`
25. `job_activities`
26. `warehouses`
27. `inventory_items`
28. `inventory_stock`
29. `inventory_movements`
30. `invoices`
31. `invoice_items`
32. `invoice_taxes`
33. `payments`
34. `customer_advances`
35. `warranties`
36. `warranty_interventions`
37. `website_pages`
38. `website_forms`
39. `leads`
40. `lead_sources`
41. `website_sessions`
42. `website_events`
43. `website_downloads`
44. `product_categories`
45. `product_families`
46. `products`
47. `product_specifications`
48. `diagnostic_reports`
49. `wizard_sessions`
50. `crm_activity_logs`
51. `kpi_definitions`
52. `kpi_formulas`
53. `kpi_history`
54. `dashboards`
55. `dashboard_widgets`
56. `dashboard_preferences`
57. `advance_applications`
58. `costs`
59. `job_budgets`
60. `document_templates`
61. `document_outputs`
62. `notification_templates`
63. `notifications`
64. `notification_preferences`
65. `user_access_logs`
66. `tenant_settings`
67. `custom_field_definitions`
68. `automation_rules`


### 1.7 FASE 7: Inventarios (Bodegas, Artículos y Movimientos)
*   **Fecha de Aprobación:** 2026-06-17
*   **Módulos / Tablas definidos:**
    *   `warehouses` (Bodegas de almacenamiento vinculadas a sedes).
    *   `inventory_items` (Catálogo de artículos/materiales/equipos por tenant).
    *   `inventory_stock` (Control de existencias físicas y reservadas por bodega y artículo).
    *   `inventory_movements` (Registro e historial de transacciones: Entrada, Salida, Reserva, Transferencia, Ajuste).
*   **Decisiones Funcionales Aprobadas:**
    *   **Códigos Secuenciales:** Generación automática por tenant usando `tenant_sequences` con formatos: `WH-000001`, `ART-000001`, `MOV-000001`.
    *   **Mapeo de Costos:** Cálculo automático de `average_cost` en artículos al aplicar una entrada, y actualización de `last_cost` con el costo de la última entrada aplicada.
    *   **Control de Stock Negativo:** Prohibido stock negativo físico o disponible (`available_quantity >= 0`, `quantity >= 0`, `reserved_quantity >= 0`). Las transacciones se bloquean si no hay saldo suficiente.
    *   **Flujo de Movimientos:** Estado inicial `Registrado` (no afecta stock). Al transicionar a `Aplicado`, se impacta el stock físico o reservado. Un movimiento aplicado es inmutable y no se puede anular; los errores se corrigen con movimientos compensatorios.
    *   **Gestión de Reservas:** Al aplicar una Reserva, aumenta `reserved_quantity`. Al consumirse, se emite una Salida asociada disminuyendo tanto `quantity` como `reserved_quantity`. Las anulaciones solo se permiten en estado `Registrado`.
    *   **Asociación de Jobs:** Todo material consumido en un trabajo debe registrar `job_id` obligatorio y opcionalmente `activity_id` para trazabilidad de quién lo consumió, en qué actividad, costo y fecha. Dispara el evento `JOB_MATERIAL_CONSUMED`.
    *   **Transferencias de Inventario:** Tipo de movimiento `Transferencia` que procesa la salida de la bodega origen y la entrada en la bodega destino dentro de la misma transacción de forma atómica.
    *   **Roles y Permisos:**
        *   `ALMACENISTA`: Registra movimientos y consulta inventario.
        *   `JEFE_INVENTARIO`: Aprueba movimientos, crea artículos y bodegas, registra ajustes y transferencias.
        *   `GERENTE`: Control total del módulo de inventario.
    *   **Auditoría y Soft Delete:** Habilitado soft delete (`deleted_at`, `deleted_by`, `delete_reason`) con triggers que previenen borrados físicos.

### 1.8 FASE 8: Facturación y Pagos
*   **Fecha de Aprobación:** 2026-06-17
*   **Módulos / Tablas definidos:**
    *   `invoices` (Cabeceras de facturas asociadas a clientes, OTs o cotizaciones).
    *   `invoice_items` (Partidas desglosadas e históricas de facturas).
    *   `invoice_taxes` (Impuestos aplicados históricos de facturas).
    *   `payments` (Registro e historial de cobros/abonos de clientes).
    *   `customer_advances` (Control de anticipos no aplicados de clientes).
*   **Decisiones Funcionales Aprobadas (RESPUESTAS OFICIALES FASE 8):**
    *   **Generación de Facturas (Manual):** La generación de facturas es estrictamente manual por un usuario autorizado (no automática), debido a la existencia de entregas parciales, facturaciones parciales, anticipos y ajustes. Origen permitido: `JOB`, `QUOTE` (aprobada), o `CLIENT`. Debe quedar trazabilidad obligatoria con campos `source_type` (valores: `QUOTE`, `JOB`, `CLIENT`) y `source_id`.
    *   **Códigos y Secuencias:** Códigos `FAC-000001` para facturas (`INVOICE`) y `PAG-000001` para pagos (`PAYMENT`) y `ANT-000001` para anticipos (`ADVANCE`), administrados por tenant mediante `tenant_sequences`. Nunca globales.
    *   **Detalle e Impuestos Históricos:** Es obligatorio crear partidas en `invoice_items` (no facturar solo cabecera). Columnas mínimas en `invoice_items`: `id`, `tenant_id`, `invoice_id`, `line_number`, `description`, `quantity`, `unit_price`, `discount_amount`, `tax_amount`, `line_total`, `created_at`, `updated_at`, `deleted_at`, `deleted_by`, `delete_reason`. La factura emitida conserva una fotografía histórica independiente de `quote_items` o `job_activities` (si cambian en el futuro, la factura no se altera).
    *   **Impuestos Congelados:** Los impuestos se consolidan en `invoice_taxes` al emitir y no se recalculan posteriormente.
    *   **Vencimiento por Defecto:** Plazo de 30 días calendario por defecto si el usuario no especifica `due_date` (`due_date = invoice_date + 30`).
    *   **Estados Oficiales (Mayúsculas Sostenidas):**
        *   `BORRADOR` (Editable)
        *   `EMITIDA` (Inmutable)
        *   `PARCIALMENTE_PAGADA` (Pago parcial mayor a cero pero menor a total)
        *   `PAGADA` (Saldo cero)
        *   `VENCIDA` (Fecha actual posterior a due_date con saldo pendiente)
        *   `ANULADA` (Anulada mediante `cancel_reason` obligatorio de mínimo 10 caracteres, `cancelled_by` y `cancelled_at`).
    *   **Inmutabilidad y Ajustes:** Tras la transición a `EMITIDA`, la factura es 100% inmutable. Los cambios posteriores se deben registrar mediante Notas de Crédito, Notas de Débito o Ajustes. Nunca se edita el histórico.
    *   **Anulación de Facturas con Pagos:** Los pagos existentes NO se eliminan al anular; se registran eventos de reversión para mantener trazabilidad total.
    *   **Roles y Permisos (RBAC):**
        *   `AUXILIAR_FINANZAS`: Crear borradores, registrar pagos, consultar.
        *   `JEFE_FINANZAS`: Emitir, anular, aprobar, notas de crédito, notas de débito.
        *   `GERENTE`: Control total en el tenant.
        *   `SUPER_ADMIN`: Control global.
    *   **Módulo de Pagos (`payments`):** Tabla con columnas mínimas: `id`, `tenant_id`, `payment_code`, `client_id`, `invoice_id`, `payment_date`, `amount`, `payment_method`, `reference_number`, `status` (`REGISTRADO`, `APLICADO`, `ANULADO`), `created_by`, `created_at`, `updated_at`, `deleted_at`, `deleted_by`, `delete_reason`. Al aplicar un pago se recalcula el saldo e invoice status de forma automática.
    *   **Anticipos y Abonos:** Soporte obligatorio desde Fase 8 para anticipos, abonos, pagos parciales y finales. Los pagos sin factura se gestionan como anticipos (`customer_advances`).
    *   **Pasarela de Pagos (Estructura Wompi):** Soporte en base de datos para pasarelas de pago (`payment_link`, `payment_token`, `payment_status`, `payment_provider`, `payment_url`). No se requiere implementación del proveedor real en esta fase.
    *   **Eventos de Negocio:** Registro obligatorio en `business_events` para: `INVOICE_CREATED`, `INVOICE_EMITTED`, `INVOICE_PAID`, `INVOICE_PARTIALLY_PAID`, `INVOICE_OVERDUE`, `INVOICE_CANCELLED`, `PAYMENT_REGISTERED`, `PAYMENT_APPLIED`, `PAYMENT_CANCELLED`, `PAYMENT_LINK_CREATED`.
    *   **Soft Delete y Borrado Físico:** Habilitado soft delete (`deleted_at`, `deleted_by`, `delete_reason`) en `invoices`, `invoice_items`, `invoice_taxes`, `payments` y `customer_advances`. El borrado físico está estrictamente prohibido a nivel trigger.
    *   **Trazabilidad 100% Obligatoria:** Toda factura debe poder responder a: quién la creó, quién la emitió, quién la anuló, quién registró el pago, origen (`source_type`/`source_id`), cotización origen, trabajo origen, cliente origen, pagos asociados, eventos asociados y documentos asociados.
    *   **Reutilización Transversal:** Estas decisiones y estructuras de estados, trazabilidad, y flujos se deben reutilizar automáticamente en los módulos de Cartera, Pagos, Cobranza, Reportes Financieros y Portal Cliente, sin volver a formular preguntas equivalentes sobre facturación, pagos, anticipos, estados o trazabilidad financiera.
    *   **Auditoría y Soft Delete:** Habilitado en todas las tablas con RLS multiempresa.
176: 
177: ### 1.9 FASE 10: Garantías (Postventa)
178: *   **Fecha de Aprobación:** 2026-06-17
179: *   **Módulos / Tablas definidos:**
180:     *   `warranties` (Garantías asociadas a clientes y trabajos finalizados/cerrados).
181:     *   `warranty_interventions` (Intervenciones de servicio técnico asignadas para resolver reclamos de garantía).
182: *   **Decisiones Funcionales Aprobadas (RESPUESTAS OFICIALES FASE 10):**
183:     *   **Generación de Garantías (Automática):** La garantía se genera automáticamente al cambiar el Trabajo (`jobs.status`) a `'CERRADO'`.
184:     *   **Vigencia por Defecto:** 12 meses calendario calculados automáticamente (`start_date = CURRENT_DATE`, `end_date = CURRENT_DATE + INTERVAL '12 months'`).
185:     *   **Códigos y Secuencias:** Códigos `GAR-000001` para garantías (`WARRANTY`) y `INT-000001` para intervenciones (`WARRANTY_INTERVENTION`), administrados por tenant mediante `tenant_sequences`.
186:     *   **Flujo de Estados y Triggers de Garantía:**
187:         *   Estados: `ACTIVA`, `EJECUTADA`, `CERRADA`, `VENCIDA`, `ANULADA` (mayúsculas sostenidas).
188:         *   Al registrar o iniciar una intervención asociada en estado `REGISTRADA` o `EN_PROCESO`, la garantía pasa automáticamente a `EJECUTADA`.
189:         *   Al resolverse o cerrarse todas las intervenciones asociadas, la garantía retorna automáticamente a `ACTIVA`.
190:         *   El estado `VENCIDA` se calcula dinámicamente o actualiza por base de datos cuando `CURRENT_DATE > end_date` (y el estado no es `CERRADA` o `ANULADA`).
191:     *   **Bloqueo de Intervenciones:** Se bloquea estrictamente la creación o actualización de intervenciones en garantías que no estén en estado `'ACTIVA'` o `'EJECUTADA'` (ej. si están vencidas, anuladas o cerradas).
192:     *   **Integración con Bodega (Inventario):** Se añade la columna `warranty_intervention_id` en la tabla `inventory_movements` para imputar salidas de bodega (consumos de repuestos/materiales) a la garantía.
193:     *   **Vinculación Operativa (Jobs):** Se añade la columna `job_id` en la tabla `warranty_interventions` para vincular trabajos técnicos de campo creados para resolver la intervención.
194:     *   **Anulación:** Requiere obligatorio `cancel_reason` (mínimo 10 caracteres), `cancelled_by` y `cancelled_at`.
195:     *   **Políticas Generales:** Aislamiento multi-tenant RLS, soft delete obligatorio (bloqueo de delete físico por trigger) e integración con log de auditoría (`audit_log`) y trazabilidad estándar (`created_by`, `updated_by`, etc.).

### 1.10 FASE 11: Web Pública y Catálogo Técnico (Website)
*   **Fecha de Aprobación:** 2026-06-17
*   **Módulos / Tablas definidos:**
    *   `website_pages` (Páginas del sitio web público de la empresa).
    *   `website_forms` (Formularios de contacto y captación técnica).
    *   `leads` (Registros de potenciales clientes captados, con scoring y verificación).
    *   `lead_sources` (Trazabilidad de origen y UTMs de cada lead).
    *   `website_sessions` (Sesiones de visitantes públicos).
    *   `website_events` (Registro de eventos/acciones como clics, vistas, etc.).
    *   `website_downloads` (Registro de descargas de fichas técnicas o PDFs por sesión y lead).
    *   `product_categories` (Categorías del catálogo de productos).
    *   `product_families` (Familias de productos asociadas a categorías).
    *   `products` (Catálogo de productos/equipos técnicos ofertados).
    *   `product_specifications` (Especificaciones técnicas de cada producto).
*   **Decisiones Funcionales Aprobadas (RESPUESTAS OFICIALES FASE 11):**
    *   **Autogeneración de Códigos por Inquilino:**
        *   Páginas: Códigos `PAG-` (secuencia `'WEBSITE_PAGE'`).
        *   Formularios: Códigos `FRM-` (secuencia `'WEBSITE_FORM'`).
        *   Leads: Códigos `LED-` (secuencia `'LEAD'`).
        *   Categorías: Códigos `CAT-` (secuencia `'PRODUCT_CATEGORY'`).
        *   Familias: Códigos `FAM-` (secuencia `'PRODUCT_FAMILY'`).
        *   Productos: Códigos `PRO-` (secuencia `'PRODUCT'`).
    *   **Políticas Generales Reutilizadas:** RLS por tenant, soft delete obligatorio (bloqueo de deletes físicos por trigger), logs de auditoría en la tabla `audit_log`, trazabilidad general (`created_by`, `updated_by`, etc.) y estados oficiales en mayúsculas sostenidas (`ACTIVA`, `INACTIVA`, `ACTIVO`).

### 1.11 FASE 12: Wizard / Cotizador
*   **Fecha de Aprobación:** 2026-06-17
*   **Módulos / Tablas definidos:**
    *   `diagnostic_reports` (Reportes de preingeniería y cálculo de caudal generados al completar el Wizard).
    *   `wizard_sessions` (Persistencia de pasos y datos parciales para remarketing de abandonos del Wizard).
*   **Decisiones Funcionales Aprobadas (RESPUESTAS OFICIALES FASE 12):**
    *   **Autocreación y Captura Obligatoria:** Los datos comerciales del lead (Nombre, Empresa, Cargo, Teléfono y Email Corporativo) se capturan en el Paso 3, de forma estrictamente obligatoria antes de mostrar el reporte en el Paso 4.
    *   **Moneda y Estimación de Precios:** Rango de inversión estimado de $\pm 15\%$ para protección de ingeniería, expresado en ambas monedas: Pesos Colombianos (COP) y Dólares Estadounidenses (USD) calculados automáticamente (tasa de referencia $4000 COP y redondeado a los USD 50 más cercanos). La urgencia alta incrementa el estimado en +35%.
    *   **Garantía:** El reporte destaca el respaldo de una Garantía Estándar de 12 meses.
    *   **Códigos y Secuencias:** Códigos `DIA-` para reportes de diagnóstico (secuencia `'DIAGNOSTIC_REPORT'`), administrados por tenant mediante `tenant_sequences`.
    *   **Remarketing de Abandonos (`wizard_sessions`):** Almacenamiento temporal de los pasos del Wizard en tiempo real (incluyendo IP, paso actual, porcentaje de completitud, fecha de última actividad y datos parciales de contacto) para posibilitar recuperación automática y remarketing.
    *   **Políticas Generales Reutilizadas:** RLS por tenant, soft delete obligatorio (bloqueo de deletes físicos por trigger), logs de auditoría en la tabla `audit_log`, trazabilidad general (`created_by`, `updated_by`, etc.).

### 1.12 FASE 13: CRM, Cotizaciones y Pipeline
*   **Fecha de Aprobación:** 2026-06-17
*   **Módulos / Tablas definidos/modificados:**
    *   `clients` (Modificado para hacer `tax_id` nullable para soportar prospectos web iniciales).
    *   `leads` (Modificado para agregar `client_id` y `contact_id` como claves foráneas).
    *   `crm_activity_logs` (Nueva tabla para registrar notas de llamadas, correos, reuniones y bitácoras asociadas a un requerimiento/oportunidad).
*   **Decisiones Funcionales Aprobadas (RESPUESTAS OFICIALES FASE 13):**
    *   **Reutilización Absoluta:** De acuerdo con el protocolo de gobernanza MODO AUDITOR 0.3, se prohíbe duplicar tablas. Se reutilizan `clients` (para empresas/prospectos), `client_contacts` (para contactos), `requirements` (para oportunidades y pipeline) y `quotes`/`quote_items` (para propuestas y cotizaciones).
    *   **Logs Comerciales:** Se crea la tabla `crm_activity_logs` para registrar interacciones comerciales del vendedor asociadas a un requerimiento/oportunidad.
    *   **Políticas Generales Reutilizadas:** RLS por tenant, soft delete obligatorio (bloqueo de deletes físicos por trigger), logs de auditoría en la tabla `audit_log`, trazabilidad general (`created_by`, `updated_by`, etc.).

### 1.13 FASE 14: Marketing y SLA (Extensión de Leads)
*   **Fecha de Aprobación:** 2026-06-17
*   **Módulos / Tablas definidos/modificados:**
    *   `leads` (Modificado para agregar columnas de procedencia comercial, propietarios comerciales, y control/tiempos de SLA).
*   **Decisiones Funcionales Aprobadas (RESPUESTAS OFICIALES FASE 14):**
    *   **Extensión y Reutilización (SLA):** En lugar de crear tablas redundantes para alertas de SLA, se extiende la tabla `leads`. Los incumplimientos se registran como eventos de negocio (`'LEAD_SLA_BREACHED'`) en `business_events`.
    *   **Tiempos de SLA Automáticos:** Trigger `handle_lead_sla_calculation()` calcula el vencimiento (`sla_due_at`) según la urgencia (HOT $\rightarrow$ 15 minutos; WARM $\rightarrow$ 4 horas; LOW $\rightarrow$ 24 horas). Al registrar el primer contacto (`first_contact_at`), evalúa si el SLA se cumplió o incumplió.
    *   **Breach Trigger:** Trigger `validate_lead_sla_breach()` que inserta un registro en la tabla `business_events` cuando el SLA expira sin haber realizado primer contacto.
    *   **Políticas Generales Reutilizadas:** RLS por tenant, soft delete obligatorio (bloqueo de deletes físicos por trigger), logs de auditoría en la tabla `audit_log`, trazabilidad general (`created_by`, `updated_by`, etc.).

### 1.14 FASE 15: Dashboards y KPIs
*   **Fecha de Aprobación:** 2026-06-17
*   **Módulos / Tablas definidos:**
    *   `kpi_definitions` (Definición e identificación de indicadores clave de rendimiento).
    *   `kpi_formulas` (Versionado de fórmulas matemáticas asociadas a KPIs, con validación de versión única activa).
    *   `kpi_history` (Registro de agregaciones analíticas calculadas por inquilino y periodo).
    *   `dashboards` (Estructura de tableros de control asignables a roles específicos).
    *   `dashboard_widgets` (Especificación de componentes visuales en cuadrícula x/y/width/height y configuración en JSON).
    *   `dashboard_preferences` (Preferencias de usuario individuales para tableros).
*   **Decisiones Funcionales Aprobadas (RESPUESTAS OFICIALES FASE 15):**
    *   **Autogeneración de Códigos:** Códigos automáticos correlativos por tenant (`KPI-`, `DSH-`, `WDG-`) administrados por trigger BEFORE INSERT usando `get_next_tenant_sequence`.
    *   **Fórmula Única Activa:** Restricción automatizada por trigger BEFORE INSERT OR UPDATE en `kpi_formulas` para desactivar de forma atómica otras fórmulas del mismo KPI al activar una nueva.
    *   **Motor de Agregación (`calculate_kpi`):** Función PL/pgSQL que calcula valores analíticos agregados (SLA incumplidos, facturación emitida, pagos aplicados) y los persiste en `kpi_history` junto con el despacho del evento `KPI_CALCULATED` en `business_events`.
    *   **Prevención de Borrado Físico:** Triggers de exclusión física que obligan a usar soft delete (`deleted_at`, `deleted_by`, `delete_reason`).
    *   **Políticas Generales Reutilizadas:** Aislamiento SaaS multiempresa mediante Row Level Security (RLS) en las 6 nuevas tablas y trazabilidad de auditoría general en `audit_log`.

### 1.15 FASE 16: Costos y Aplicaciones Financieras (Costos, Presupuestos y Anticipos)
*   **Fecha de Aprobación:** 2026-06-17
*   **Módulos / Tablas definidos:**
    *   `advance_applications` (Registro de la aplicación parcial o total de anticipos de clientes a facturas).
    *   `costs` (Registro de costos reales de proyectos unificando categorías y trazabilidad documental).
    *   `job_budgets` (Presupuestos planificados y aprobados por categoría de costo por OT).
*   **Decisiones Funcionales Aprobadas (RESPUESTAS OFICIALES FASE 16):**
    *   **Consolidación de Cartera:** Creación de la función helper `refresh_invoice_paid_amount()` que integra la sumatoria de pagos directos aplicados y la sumatoria de aplicaciones de anticipos para actualizar de forma atómica `paid_amount` y `status` de la factura.
    *   **Validación de Cruces:** Trigger `validate_advance_application()` BEFORE INSERT OR UPDATE que bloquea aplicaciones si hay clientes cruzados, si la factura está en un estado no editable (BORRADOR, ANULADA, PAGADA) o si el monto supera el saldo disponible del anticipo o el saldo pendiente de la factura.
    *   **Impacto de Aplicación:** Trigger `handle_advance_application_impact()` AFTER INSERT OR UPDATE OR DELETE que actualiza la cartera de anticipos (`applied_amount`), actualiza la factura (vía helper) y despacha los eventos `ADVANCE_APPLIED`, `ADVANCE_APPLICATION_CANCELLED` y `ADVANCE_APPLICATION_UPDATED`.
    *   **Secuencias de Costos:** Generación de códigos por tenant con prefijo `COS-` administrados por trigger.
    *   **Políticas Generales Reutilizadas:** Aislamiento SaaS multiempresa por `tenant_id` mediante RLS en las 3 tablas, triggers de soft delete (exclusión de delete físico) y logs de auditoría general en `audit_log`.

### 1.16 FASE 17: Rentabilidad Comercial y Operativa (Márgenes por Trabajo y Cliente)
*   **Fecha de Aprobación:** 2026-06-17
*   **Módulos / Vistas definidos:**
    *   `job_profitability` (Vista SQL de márgenes por OT).
    *   `client_profitability` (Vista SQL de márgenes agregados por cliente).
*   **Decisiones Funcionales Aprobadas:**
    *   **Cálculo de Margen:** Margen calculado dinámicamente como `(revenue - cost) / NULLIF(revenue, 0) * 100`.
    *   **RLS Herencia Nativa:** En las vistas SQL se configuró `security_invoker = true` para heredar las políticas de seguridad RLS de las tablas base de forma atómica y evitar tenant crossing.

### 1.17 FASE 18: Motor de Documentos y Plantillas (GrapesJS + Handlebars + Puppeteer + Docxtemplater)
*   **Fecha de Aprobación:** 2026-06-17
*   **Módulos / Tablas definidos:**
    *   `document_templates` (Tabla de plantillas con almacenamiento de JSON visual GrapesJS y código Handlebars).
    *   `document_outputs` (Tabla de documentos generados: PDF/DOCX con ciclo de vida PENDIENTE -> GENERANDO -> COMPLETADO / ERROR).
*   **Decisiones Funcionales Aprobadas:**
    *   **Prohibición de Reemplazo Simple:** D18-07: Se prohíbe permanentemente el uso de `replace('{{variable}}')` básico, obligando al uso de Handlebars o plantillas estructuradas de Docxtemplater.
    *   **Plantilla Predeterminada Única:** Trigger `enforce_single_default_template` asegura que solo exista una plantilla predeterminada activa por tipo de documento por tenant.

### 1.18 FASE 19: Sistema de Notificaciones y Alertas (IN_APP + EMAIL + WHATSAPP + TELEGRAM)
*   **Fecha de Aprobación:** 2026-06-17
*   **Módulos / Tablas definidos/modificados:**
    *   `users` (Extensión de columnas `telegram_chat_id` y `telegram_username` para enrutamiento).
    *   `notification_templates` (Plantillas de notificaciones por canal y event_type).
    *   `notifications` (Bandeja e historial de entrega).
    *   `notification_preferences` (Preferencias de usuario y horario de silencio).
*   **Decisiones Funcionales Aprobadas:**
    *   **Canales por Audiencia (Routing):** Clientes externos -> WhatsApp (Twilio); Usuarios internos -> Telegram (grammY Bot API - gratuito y 90%+ ahorro); Clientes corporativos -> Email (Resend); Bandeja ERP -> IN_APP.
    *   **RLS estricto:** Los usuarios ordinarios del ERP solo pueden ver e interactuar con sus propias notificaciones (`recipient_user_id = auth.uid()`).

### 1.19 FASE 20: Seguridad y Auditoría Avanzada
*   **Fecha de Aprobación:** 2026-06-18
*   **Módulos / Tablas definidos/modificados:**
    *   `user_access_logs` (Tabla de auditoría de accesos inmutable).
*   **Decisiones Funcionales Aprobadas:**
    *   **Registro Inmutable:** Solo se permite inserción de accesos y actualización de `logout_at`. Se bloquean deletes físicos y cualquier otra actualización.
    *   **Roles y Permisos:** RLS permite lectura cruzada solo a Super Admins y Auditores del tenant. Usuarios comunes solo leen sus propios registros.

### 1.20 FASE 21: Hardening / Rendimiento
*   **Fecha de Aprobación:** 2026-06-18
*   **Módulos / Tablas definidos/modificados:**
    *   `supabase/migrations/20260617000021_performance_hardening.sql` (28 índices parciales).
*   **Decisiones Funcionales Aprobadas:**
    *   **Indexación Parcial de Soft Deletes:** Todos los índices creados sobre claves foráneas (FK) y columnas calientes usan la cláusula `WHERE deleted_at IS NULL` para evitar sequential scans.

### 1.21 FASE 22: Pruebas de Aceptación de Usuario (UAT)
*   **Fecha de Aprobación:** 2026-06-18
*   **Módulos / Tablas definidos/modificados:**
    *   `supabase/migrations/20260617000022_uat_validation.sql` (Metadatos del escenario UAT).
    *   `scripts/test-uat.ts` (Script runner de verificación sintáctica/trazabilidad).
*   **Decisiones Funcionales Aprobadas:**
    *   **Integridad E2E B2B:** Verificación automatizada de 12 pasos lógicos de negocio encadenados sin roturas del flujo financiero u operativo.
    *   **Seguridad de Vistas Analíticas:** Las vistas de rentabilidad heredan el aislamiento RLS nativo mediante `security_invoker = true`.

### 1.22 FASE 23: Release / Producción (Go-Live)
*   **Fecha de Aprobación:** 2026-06-18
*   **Módulos / Tablas definidos/modificados:**
    *   `tenant_sequences` (Gap de seguridad corregido con RLS activo).
    *   Vista `performance_queries_summary` (Monitoreo de queries lentas).
*   **Decisiones Funcionales Aprobadas:**
    *   **Monitoreo Nativo:** Monitoreo de queries lento usando pg_stat_statements expuesto mediante vista segura (`security_invoker = true`).
    *   **Políticas de Bypass Super Admin:** Verificación exhaustiva de que todas las tablas tengan la política de Super Admin para mantenimiento centralizado.

### 1.23 FASE 31: Centro de Configuración Empresarial (Settings)
*   **Fecha de Aprobación:** 2026-06-18
*   **Módulos / Tablas definidos/modificados:**
    *   `tenant_settings` (Repositorio central de configuraciones por tenant).
*   **Decisiones Funcionales Aprobadas:**
    *   **Cero Hardcoding (D30-03):** Se prohíbe explícitamente almacenar colores, logos, teléfonos y URLs en código. Todo debe configurarse en `tenant_settings` de forma dinámica.
    *   **Almacenamiento Modular JSONB (D30-02):** Uso de JSONB para almacenar valores flexibles de configuración agrupados en 5 módulos (`EMPRESA`, `LOCALIZACION`, `IDENTIDAD`, `DOCUMENTOS`, `ERP`).
    *   **Acceso Seguro RLS (D30-06):** Lectura para usuarios del tenant y escritura restringida a `ADMINISTRADOR_TENANT` y `GERENTE` para prevenir tenant crossing y brechas de seguridad.

### 1.24 FASE 32: White Label (Branding Dinámico)
*   **Fecha de Aprobación:** 2026-06-18
*   **Módulos / Tablas definidos/modificados:**
    *   `tenant_settings` (Trigger de validación visual de branding y layouts).
*   **Decisiones Funcionales Aprobadas:**
    *   **Validación de Formato en DB (D30-02):** Un trigger `BEFORE INSERT OR UPDATE` valida rigurosamente que los colores cumplan con estándares CSS, que las URLs tengan formatos correctos y que los layouts sean JSONs bien formados.
    *   **Funciones Seguras de Branding:** La configuración visual consolidada del tenant se expone mediante la función segura `get_my_white_label_config` (`SECURITY DEFINER` resolviendo el tenant desde el token JWT).

### 1.25 FASE 33: Integraciones y Canales
*   **Fecha de Aprobación:** 2026-06-18
*   **Módulos / Tablas definidos/modificados:**
    *   `tenant_settings` (Cifrado simétrico transparente).
    *   Módulos `INTEGRACIONES` y `TELEFONIA` (Añadidos a check constraint).
*   **Decisiones Funcionales Aprobadas:**
    *   **Cifrado Transparente de Secretos (D30-02):** Se utiliza la extensión `pgcrypto` para encriptar mediante AES-256 los valores cuando `is_encrypted = true`. La desencriptación ocurre automáticamente en la función de lectura.
    *   **Validación E.164 (D30-03):** El trigger de validación visual ahora verifica que los números telefónicos en el módulo `TELEFONIA` cumplan el formato internacional E.164.
    *   **Enrutamiento Dinámico (D30-05):** Las rutas de notificaciones configuradas por tenant en `notification_routes` se resuelven y ejecutan dinámicamente mediante `dispatch_notification_to_route`.

### 1.26 FASE 34: Administración Avanzada
*   **Fecha de Aprobación:** 2026-06-18
*   **Módulos / Tablas definidos/modificados:**
    *   `users` (Perfil de usuario ampliado).
    *   `custom_field_definitions` (Definición de campos personalizados).
    *   `automation_rules` (Motor de reglas de automatización).
*   **Decisiones Funcionales Aprobadas:**
    *   **Campos Personalizados Seguros (D30-04):** Columnas JSONB `custom_fields` en las tablas clave validadas en tiempo de ejecución por un trigger centralizado de tipos (`validate_entity_custom_fields`).
    *   **Motor de Reglas Relacionales:** Ejecución de lógica de negocio (notificaciones y logs de auditoría técnica) parametrizables en base de datos.

