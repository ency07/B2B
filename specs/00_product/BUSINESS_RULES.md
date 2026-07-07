# BUSINESS RULES — Reglas de Negocio

## Regla suprema

> Toda regla de negocio debe implementarse **exactamente como está documentada**. No se permite simplificar, extender, corregir o reinterpretar reglas de negocio sin consultar con el usuario.

---

## Estados maestros

### Estados de Lead

```
LEAD_NUEVO → LEAD_CONTACTADO → LEAD_CALIFICADO → LEAD_CONVERTIDO
LEAD_NUEVO → LEAD_CONTACTADO → LEAD_NO_CALIFICA → LEAD_DESCARTADO
LEAD_NUEVO → LEAD_CONTACTADO → LEAD_CALIFICADO → LEAD_ASIGNADO
```

### Estados de Cliente

```
CLIENTE_ACTIVO → CLIENTE_SUSPENDIDO → CLIENTE_INACTIVO
CLIENTE_ACTIVO → CLIENTE_INACTIVO
CLIENTE_SUSPENDIDO → CLIENTE_ACTIVO
```

### Estados de Requerimiento

```
REQUERIMIENTO_ABIERTO → REQUERIMIENTO_EN_EVALUACION → REQUERIMIENTO_PRESUPUESTADO → REQUERIMIENTO_APROBADO → REQUERIMIENTO_EN_PROYECTO → REQUERIMIENTO_FACTURADO → REQUERIMIENTO_CERRADO
Cualquier estado → REQUERIMIENTO_CANCELADO
```

### Estados de Cotización

```
COTIZACION_BORRADOR → COTIZACION_ENVIADA → COTIZACION_ACEPTADA → COTIZACION_CONVERTIDA_EN_OT
COTIZACION_ENVIADA → COTIZACION_RECHAZADA
Cualquier estado → COTIZACION_CANCELADA
COTIZACION_CANCELADA → COTIZACION_BORRADOR (solo si motivo_cancelación se elimina)
```

### Estados de OT (Orden de Trabajo)

```
OT_PROGRAMADA → OT_EN_EJECUCION → OT_EN_VERIFICACION → OT_FINALIZADA
OT_PROGRAMADA → OT_CANCELADA
OT_EN_EJECUCION → OT_PAUSADA → OT_EN_EJECUCION
```

### Estados de Factura

```
FACTURA_BORRADOR → FACTURA_EMITIDA → FACTURA_PAGADA_PARCIAL → FACTURA_PAGADA_TOTAL → FACTURA_ANULADA
FACTURA_BORRADOR → FACTURA_ANULADA
```

### Estados de Pago

```
PAGO_PENDIENTE → PAGO_PROCESANDO → PAGO_CONFIRMADO → PAGO_RECHAZADO
PAGO_CONFIRMADO → PAGO_REVERSADO
```

### Estados de Garantía

```
GARANTIA_ACTIVA → GARANTIA_EN_RECLAMO → GARANTIA_EN_EVALUACION → GARANTIA_APROBADA → GARANTIA_CERRADA
GARANTIA_EN_EVALUACION → GARANTIA_RECHAZADA → GARANTIA_CERRADA
GARANTIA_ACTIVA → GARANTIA_VENCIDA
```

### Estados de Plantilla de Contrato

```
BORRADOR → ACTIVO → ARCHIVADO
```

---

## Convenciones de nomenclatura

| Elemento | Estilo | Ejemplo |
|---|---|---|
| Tablas migraciones | `snake_case` | `customer_types` |
| Tablas en BD | `snake_case` | `cotizaciones` |
| Estados | `MAYUSCULAS_SOSTENIDAS` | `LEAD_CONTACTADO` |
| Tipos TypeScript | `PascalCase` | `EstadoLead` |
| Componentes | `PascalCase` | `WizardLead` |
| Funciones | `camelCase` | `createLead` |
| Archivos | `snake_case` | `lead_wizard.tsx` |
| Columnas BD | `snake_case` | `tenant_id` |
| Constantes | `MAYUSCULAS` | `MAX_INTENTOS` |
| Env vars | `MAYUSCULAS` | `NEXT_PUBLIC_APP_URL` |
| Roles | `MAYUSCULAS` | `ADMIN`, `TECNICO` |
| Permisos | `snake_case` | `leads.create`, `leads.edit` |

---

## Nomenclatura de códigos

| Entidad | Prefijo | Ejemplo |
|---|---|---|
| Cotización | COT | COT-0001 |
| Orden de Trabajo | OT | OT-0001 |
| Factura | FAC | FAC-0001 |
| Recibo de Pago | REC | REC-0001 |
| Cliente | CLI | CLI-0001 |
| Producto | PROD | PROD-0001 |

---

## Modelo funcional — Roles

26 roles definidos en docs/05_modelo_funcional/:

| Rol | Módulo |
|---|---|
| ADMIN | Configuración global |
| GERENTE | Dashboard, KPIs, reportes |
| DIRECTOR_COMERCIAL | CRM, cotizaciones |
| EJECUTIVO_COMERCIAL | Leads, cotizaciones |
| INGENIERO_PROYECTOS | Requerimientos, cotizaciones técnicas |
| TECNICO_CAMPO | OT, checklist, materiales |
| JEFE_INVENTARIO | Stock, movimientos |
| FINANZAS | Facturación, pagos, cartera |
| AUXILIAR_FINANZAS | Facturación asistida |
| CLIENTE | Portal (autoservicio) |
| ... (16 roles adicionales en docs/05_modelo_funcional/roles_catalogo.md) |

### Matriz de permisos

Cada rol tiene permisos CRUD explícitos por módulo. Ver matriz completa en `docs/05_modelo_funcional/matriz_permisos.md`.

---

## Reglas de scoring de leads

- **Lead nuevo** se asigna score inicial basado en formulario (fuente, industria, cargo, urgencia)
- Score mínimo para calificar: **35 puntos**
- Si supera 60: **contacto inmediato** (SLA: 30 minutos)
- Si supera 35: **contacto preferente** (SLA: 2 horas)

---

## SLAs

| Tipo | Tiempo | Condición |
|---|---|---|
| Lead score > 60 | 30 minutos | Contacto inmediato |
| Lead score > 35 | 2 horas | Contacto preferente |
| Lead score < 35 | 24 horas | Contacto estándar |
| Cotización | 72 horas | Desde solicitud |
| OT Urgente | 24 horas | Desde asignación |
| Garantía | 48 horas | Desde apertura de reclamo |

---

## Reglas de facturación

- **Factura mínima**: $50,000 COP (parámetro configurable por tenant)
- **Factura requiere**: cotización aceptada y OT finalizada
- **Pagos parciales permitidos** (múltiples abonos a una misma factura)
- **Anticipos**: porcentaje del total definido por tenant
- **Tipos de pago**: transferencia, PSE, Wompi, efectivo

---

## Reglas de garantía

- **Duración**: 12 meses desde entrega de OT
- **Cobertura**: mano de obra + materiales, excluye desgaste natural
- **Reclamo**: debe abrirse desde portal cliente
- **Aprobación**: requiere evaluación técnica (ingeniero asignado)
- **Reposición**: si se aprueba, genera nueva OT sin costo

---

## Reglas de cancelación

- Toda cancelación requiere `motivo_cancelacion` (mínimo 10 caracteres)
- Validado por trigger a nivel BD
- Registrado en audit_logs y business_events
- Si se elimina motivo → estado retrocede a borrador (solo cotizaciones)

---

## Módulos del sistema

| Módulo | Descripción |
|---|---|
| **Landing Page** | Sitio web corporativo con catálogo, wizard y blog |
| **CRM** | Leads, clientes, contactos, scoring, SLA |
| **Requerimientos** | Diagnóstico técnico, equipos, planos |
| **Cotizaciones** | Items, descuentos, IVA, vigencia, versión |
| **Órdenes de Trabajo** | Planificación, checklist, materiales, horas |
| **Inventario** | Stock, movimientos, alertas de stock mínimo |
| **Facturación** | Facturas, NC, pagos, cartera, anticipos |
| **Garantías** | Reclamos, evaluación, aprobación, cierre |
| **Dashboard** | KPIs por rol, reportes exportables |
| **Configuración** | White label, usuarios, roles, parámetros |
| **Portal Cliente** | Autoservicio, consultas, pagos, soporte |
| **Notificaciones** | Email, sistema, alertas internas |
