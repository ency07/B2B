# ROLES & PERMISSIONS — Matriz de Control de Acceso

## 1. Catálogo de Roles (26)

### Roles de Administración

| # | Rol | Código | Descripción | Alcance |
|---|---|---|---|---|
| 1 | Super Administrador | SUPER_ADMIN | Control total del sistema | Global (todos los tenants) |
| 2 | Administrador | ADMIN | Configuración completa del tenant | Tenant |
| 3 | Gerente General | GERENTE | Dashboard, KPIs, reportes, aprobaciones | Tenant |

### Roles Comerciales

| # | Rol | Código | Descripción |
|---|---|---|---|
| 4 | Director Comercial | DIRECTOR_COMERCIAL | CRM completo, pipeline, cotizaciones, reportes |
| 5 | Ejecutivo Comercial | EJECUTIVO_COMERCIAL | Leads, clientes, contactos, cotizaciones |
| 6 | Ejecutivo Comercial Senior | EJECUTIVO_COMERCIAL_SR | Comercial + aprobación de descuentos |
| 7 | Asistente Comercial | ASISTENTE_COMERCIAL | Leads, tareas, agenda |

### Roles Técnicos

| # | Rol | Código | Descripción |
|---|---|---|---|
| 8 | Director de Ingeniería | DIRECTOR_INGENIERIA | Requerimientos, diseño, aprobación técnica |
| 9 | Ingeniero de Proyectos | INGENIERO_PROYECTOS | Requerimientos, cálculos, planos, cotizaciones técnicas |
| 10 | Ingeniero de Campo | INGENIERO_CAMPO | Visitas, diagnósticos, mediciones |
| 11 | Técnico de Campo | TECNICO_CAMPO | OT, checklist, materiales, horas |
| 12 | Supervisor de Campo | SUPERVISOR_CAMPO | Técnico + asignación + verificación |

### Roles de Operaciones

| # | Rol | Código | Descripción |
|---|---|---|---|
| 13 | Director de Operaciones | DIRECTOR_OPERACIONES | OT, producción, inventario, compras |
| 14 | Jefe de Producción | JEFE_PRODUCCION | Gantt, recursos, calidad, entregas |
| 15 | Operario de Producción | OPERARIO_PRODUCCION | Tareas, checklist, materiales |
| 16 | Jefe de Inventario | JEFE_INVENTARIO | Stock, movimientos, bodegas, series |
| 17 | Auxiliar de Inventario | AUXILIAR_INVENTARIO | Entradas, salidas, conteos |

### Roles de Compras

| # | Rol | Código | Descripción |
|---|---|---|---|
| 18 | Jefe de Compras | JEFE_COMPRAS | Solicitudes, cotizaciones, OC, proveedores |
| 19 | Comprador | COMPRADOR | Cotizaciones, OC, seguimiento |

### Roles Financieros

| # | Rol | Código | Descripción |
|---|---|---|---|
| 20 | Director Financiero | DIRECTOR_FINANCIERO | Facturación, pagos, reportes, aprobaciones |
| 21 | Analista Financiero | ANALISTA_FINANCIERO | Facturación, cartera, conciliaciones |
| 22 | Auxiliar Financiero | AUXILIAR_FINANCIERO | Registro de pagos, facturación asistida |
| 23 | Contador | CONTADOR | NC, retenciones, reportes fiscales |

### Roles de Soporte y Contenido

| # | Rol | Código | Descripción |
|---|---|---|---|
| 24 | Editor de Contenido | EDITOR_CONTENIDO | CMS: páginas, blog, productos, banners |
| 25 | Soporte al Cliente | SOPORTE_CLIENTE | Tickets, portal cliente, comunicaciones |
| 26 | Cliente | CLIENTE | Portal: proyectos, cotizaciones, facturas |

---

## 2. Sistema RBAC

### Arquitectura de permisos

```
USUARIO ─┬── ROL ──── PERMISOS ──── MÓDULOS ──── ACCIONES
         │
         └── PERMISOS DIRECTOS (override)
```

Un usuario puede tener:
- 1 rol principal (obligatorio)
- Múltiples roles adicionales
- Permisos directos de override

### Permisos heredan

```
ROL → todos los permisos del rol
ROL + ROL → unión de permisos
PERMISO_DIRECTO → override (añadir o quitar)
```

### Jerarquía de permisos

```
SUPER_ADMIN → bypass total (todos los tenants, todos los módulos)
ADMIN       → bypass del tenant (todos los módulos del tenant)
GERENTE     → lectura total + aprobaciones
RESTO       → permisos por módulo
CLIENTE     → solo portal y sus datos
```

---

## 3. Matriz de Permisos

### Leyenda

| Símbolo | Significado |
|---|---|
| ✓ | Permitido |
| ✗ | Denegado |
| ◐ | Solo propios (datos del usuario) |
| R | Solo lectura |
| A | Solo aprobaciones |

### Módulo: CRM

| Acción | GERENTE | DIR_COMERCIAL | EJEC_COMERCIAL | ASIST_COM |
|---|---|---|---|---|
| leads.create | ✓ | ✓ | ✓ | ✗ |
| leads.read | ✓ | ✓ | ◐ | R |
| leads.edit | ✓ | ✓ | ◐ | ✗ |
| leads.delete | ✓ | ✓ | ✗ | ✗ |
| leads.assign | ✓ | ✓ | ✗ | ✗ |
| leads.export | ✓ | ✓ | ◐ | ✗ |
| clients.create | ✓ | ✓ | ✓ | ✗ |
| clients.read | ✓ | ✓ | ✓ | R |
| clients.edit | ✓ | ✓ | ◐ | ✗ |
| pipeline.read | ✓ | ✓ | ◐ | R |
| pipeline.move | ✓ | ✓ | ◐ | ✗ |
| opportunities.create | ✓ | ✓ | ✓ | ✗ |
| opportunities.edit | ✓ | ✓ | ◐ | ✗ |

### Módulo: Requerimientos

| Acción | GERENTE | DIR_ING | ING_PROY | ING_CAMPO |
|---|---|---|---|---|
| requirements.create | ✓ | ✓ | ✓ | ✗ |
| requirements.read | ✓ | ✓ | ◐ | R |
| requirements.edit | ✓ | ✓ | ◐ | ✗ |
| requirements.assign | ✓ | ✓ | ✗ | ✗ |
| diagnosis.create | ✓ | ✓ | ✓ | ✓ |
| diagnosis.read | ✓ | ✓ | ◐ | ◐ |
| engineering.read | ✓ | ✓ | ✓ | R |
| engineering.edit | ✓ | ✓ | ✓ | ✗ |
| calculations.read | ✓ | ✓ | ✓ | ✗ |
| calculations.create | ✗ | ✓ | ✓ | ✗ |
| plans.upload | ✗ | ✓ | ✓ | ✓ |
| plans.download | ✓ | ✓ | ✓ | ✓ |

### Módulo: Cotizaciones

| Acción | GERENTE | DIR_COMERCIAL | EJEC_COMERCIAL | ING_PROY |
|---|---|---|---|---|
| quotes.create | ✓ | ✓ | ✓ | ✓ |
| quotes.read | ✓ | ✓ | ◐ | ◐ |
| quotes.edit | ✓ | ✓ | ◐ | ✗ |
| quotes.delete | ✓ | ✓ | ✗ | ✗ |
| quotes.version | ✓ | ✓ | ✓ | ✗ |
| quotes.send | ✓ | ✓ | ✓ | ✗ |
| quotes.approve | See monto | See monto | ✗ | ✗ |
| quotes.pdf | ✓ | ✓ | ✓ | ✓ |
| quotes.margin.view | ✓ | ✓ | ✗ | ✓ |

### Aprobación de cotizaciones por monto

| Monto | Puede aprobar |
|---|---|
| < $10M COP | EJECUTIVO_COMERCIAL |
| $10M - $50M COP | DIRECTOR_COMERCIAL |
| > $50M COP | GERENTE |

### Módulo: Órdenes de Trabajo

| Acción | DIR_OPER | JEFE_PRODUC | TECNICO | SUPERVISOR |
|---|---|---|---|---|
| jobs.create | ✓ | ✓ | ✗ | ✗ |
| jobs.read | ✓ | ✓ | ◐ | ✓ |
| jobs.edit | ✓ | ✓ | ✗ | ◐ |
| jobs.assign | ✓ | ✓ | ✗ | ✗ |
| jobs.checklist | ✓ | ✓ | ✓ | ✓ |
| jobs.materials | ✓ | ✓ | ✓ | ✓ |
| jobs.costs.view | ✓ | ✓ | ✗ | ✓ |
| jobs.costs.edit | ✓ | ✗ | ✗ | ✗ |
| jobs.close | ✓ | ✓ | ✗ | ✓ |

### Módulo: Inventario

| Acción | JEFE_INVENTARIO | AUX_INVENTARIO | GERENTE | OTROS |
|---|---|---|---|---|
| products.create | ✓ | ✗ | ✓ | ✗ |
| products.read | ✓ | ✓ | ✓ | R |
| products.edit | ✓ | ✗ | ✓ | ✗ |
| products.delete | ✓ | ✗ | ✓ | ✗ |
| movements.create | ✓ | ✓ | ✓ | ✗ |
| movements.read | ✓ | ✓ | ✓ | R |
| kardex.read | ✓ | R | ✓ | ✗ |
| kardex.export | ✓ | ✗ | ✓ | ✗ |
| series.create | ✓ | ✓ | ✓ | ✗ |
| series.read | ✓ | ✓ | ✓ | R |
| lots.create | ✓ | ✓ | ✓ | ✗ |
| warehouses.manage | ✓ | ✗ | ✓ | ✗ |

### Módulo: Compras

| Acción | JEFE_COMPRAS | COMPRADOR | GERENTE |
|---|---|---|---|
| purchases.request.create | ✓ | ✓ | ✓ |
| purchases.request.approve | ✓ | ✗ | ✓ |
| purchases.quotes.manage | ✓ | ✓ | ✗ |
| purchases.oc.create | ✓ | ✗ | ✗ |
| purchases.oc.approve | ✗ | ✗ | ✓ |
| purchases.oc.send | ✓ | ✗ | ✗ |
| purchases.reception | ✓ | ✓ | ✗ |
| suppliers.create | ✓ | ✗ | ✓ |
| suppliers.edit | ✓ | ✗ | ✓ |
| suppliers.rating | ✓ | ✗ | ✓ |

### Módulo: Facturación

| Acción | DIR_FINAN | ANALISTA | AUX_FINAN | CONTADOR |
|---|---|---|---|---|
| invoices.create | ✓ | ✓ | ✗ | ✗ |
| invoices.read | ✓ | ✓ | ✓ | ✓ |
| invoices.edit | ✓ | ✗ | ✗ | ✗ |
| invoices.annul | ✓ | ✗ | ✗ | ✓ |
| invoices.send | ✓ | ✓ | ✗ | ✗ |
| payments.register | ✓ | ✓ | ✓ | ✗ |
| payments.confirm | ✓ | ✓ | ✗ | ✗ |
| nc.create | ✗ | ✗ | ✗ | ✓ |
| cartera.read | ✓ | ✓ | R | R |
| anticipos.manage | ✓ | ✓ | ✗ | ✗ |
| reports.read | ✓ | ✓ | ✗ | ✓ |

### Módulo: Configuración

| Acción | ADMIN | GERENTE | OTROS |
|---|---|---|---|
| settings.company | ✓ | ✗ | ✗ |
| settings.white_label | ✓ | ✗ | ✗ |
| settings.users | ✓ | ✗ | ✗ |
| settings.roles | ✓ | ✗ | ✗ |
| settings.permissions | ✓ | ✗ | ✗ |
| settings.integrations | ✓ | ✗ | ✗ |
| settings.backups | ✓ | ✗ | ✗ |
| settings.audit.read | ✓ | R | ✗ |

### Módulo: CMS

| Acción | ADMIN | EDITOR_CONTENIDO | GERENTE |
|---|---|---|---|
| cms.pages.edit | ✓ | ✓ | ✗ |
| cms.blog.create | ✓ | ✓ | ✗ |
| cms.blog.publish | ✓ | ✓ | ✗ |
| cms.products.edit | ✓ | ✓ | ✗ |
| cms.banners.manage | ✓ | ✓ | ✗ |
| cms.menu.edit | ✓ | ✓ | ✗ |

### Módulo: Portal Cliente

| Acción | CLIENTE | SOPORTE_CLIENTE |
|---|---|---|
| portal.projects.read | ◐ | ✓ |
| portal.quotes.read | ◐ | R |
| portal.quotes.accept | ◐ | ✗ |
| portal.quotes.reject | ◐ | ✗ |
| portal.invoices.read | ◐ | R |
| portal.invoices.pay | ◐ | ✗ |
| portal.support.create | ◐ | ✓ |
| portal.support.reply | ◐ | ✓ |
| portal.documents.download | ◐ | ✗ |
| portal.profile.edit | ◐ | ✗ |

---

## 4. Reglas RBAC

1. **Menor privilegio.** Todo usuario empieza sin permisos. Solo se otorga lo necesario.
2. **Separación de responsabilidades.** Quien aprueba no puede crear.
3. **Auditoría de permisos.** Todo cambio de rol/permiso queda auditado.
4. **Revisión periódica.** Cada 90 días se revisa la matriz de cada tenant.
5. **Override documentado.** Todo permiso directo requiere justificación.
6. **RLS en BD.** Permisos de backend no dependen de permisos de frontend.
