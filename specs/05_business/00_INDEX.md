# BUSINESS ARCHITECTURE — Arquitectura de Negocio

## Supremacía

Este documento es la **fuente única de verdad** para todos los procesos, estados, eventos, roles y automatizaciones del ERP-B2B Premium.

Ninguna implementación técnica puede desviarse de lo aquí documentado sin aprobación explícita.

> "Aquí se documenta. No se programa."

---

## Estructura de archivos

| Archivo | Contenido |
|---|---|
| `00_INDEX.md` | Índice maestro y visión general |
| `01_PROCESS_MAP.md` | Mapa completo de procesos, relaciones entre entidades |
| `02_STATE_MACHINES.md` | Máquinas de estado de todas las entidades |
| `03_ROLES_PERMISSIONS.md` | 26 roles, matriz de permisos, RBAC |
| `04_EVENTS_AUTOMATIONS.md` | Eventos de negocio, automatizaciones, notificaciones |
| `05_CRM_SALES_FLOW.md` | Proceso CRM: lead scoring, pipeline, wizard, cotizaciones |
| `06_PURCHASING_FLOW.md` | Proceso de compras: solicitudes, OC, recepción, proveedores |
| `07_OT_PRODUCTION_FLOW.md` | Órdenes de trabajo: planificación, ejecución, checklist |
| `08_INVOICING_FLOW.md` | Facturación, pagos, NC, cartera, anticipos |
| `09_PORTAL_CMS_BRANDING.md` | Portal cliente, CMS, white label, branding |

---

## Visión general del negocio

### Ciclo de vida completo

```
Visitante anónimo → Lead → MQL → SQL → Cliente → Cotización → Trabajo → Factura → Pago → Garantía
```

### Módulos del sistema

| Módulo | Descripción | Entidades principales |
|---|---|---|
| Landing Page | Adquisición web | Secciones, banners, formularios |
| Wizard | Captación de leads | Pasos, preguntas, cálculo CFM |
| CRM | Gestión comercial | Leads, Clientes, Pipeline, Oportunidades |
| Cotizaciones | Propuestas comerciales | Cotizaciones, Items, Versiones |
| Requerimientos | Diagnóstico técnico | Requerimientos, Diagnósticos, Ingeniería |
| Órdenes de Trabajo | Ejecución operativa | OT, Tareas, Checklist, Materiales |
| Producción | Fabricación | Órdenes, Gantt, Recursos, Calidad |
| Inventario | Control de stock | Productos, Series, Lotes, Kardex |
| Compras | Abastecimiento | Solicitudes, OC, Proveedores, Recepción |
| Facturación | Gestión financiera | Facturas, NC, Pagos, Cartera |
| Garantías | Post-venta | Garantías, Reclamos, Evaluaciones |
| Portal Cliente | Autoservicio | Dashboard, Proyectos, Cotizaciones, Pagos |
| CMS | Contenido web | Páginas, Blog, Productos, Banners |
| Configuración | Administración | Tenant, White Label, Usuarios, Roles |

---

## Principios de negocio

1. **Trazabilidad total.** Cada acción tiene actor, fecha, valores anteriores y nuevos.
2. **Soft delete universal.** Nada se borra físicamente.
3. **Auditoría dual.** Técnica (diff JSONB) + Semántica (business_events).
4. **Multiempresa.** Aislamiento total por tenant desde el día uno.
5. **Códigos secuenciales por tenant.** `tenant_sequences` con bloqueo.
6. **Estados en MAYÚSCULAS.** `EN_REVISION`, `APROBADA`, `CANCELADO`.
7. **Cancelación requiere motivo.** Mínimo 10 caracteres.
8. **Cero hardcoding.** Toda regla de negocio parametrizable por tenant.
9. **Consistencia horizontal.** Mismos patrones en todos los módulos.
10. **Versiones inmutables.** Cotizaciones, facturas, documentos.
