# DOCUMENTO MAESTRO DE DESCUBRIMIENTO (DMD)

## OBJETIVO

Este documento constituye la única fuente oficial de verdad del proyecto.

Toda funcionalidad, regla, pantalla, API, base de datos, automatización, dashboard, reporte, integración o proceso debe derivarse exclusivamente de este documento.

---

# REGLA SUPREMA

Si algo no está definido en este documento:

NO IMPLEMENTAR.

NO SUPONER.

NO INFERIR.

NO INVENTAR.

DETENERSE.

SOLICITAR DEFINICIÓN.

## REGLA DE DESCUBRIMIENTO (MODO AUDITOR 0.3)

Antes de iniciar cualquier proceso de Discovery o diseño de arquitectura, la IA debe ejecutar obligatoriamente el protocolo 'docs/03_protocolo/0.3 MODO AUDITOR DE DECISIONES CONGELADAS.md':

1. **Auditoría de Reutilización:** Validar si existen tablas o estructuras equivalentes en la base de datos (como clients, requirements, quotes, etc.).
2. **Auditoría de Preguntas:** Mapear todas las dudas propuestas contra las decisiones congeladas ('0.2 DECISIONES GLOBALES CONGELADAS.md'), el histórico de la memoria y la especificación funcional.
3. **Gate de Bloqueo (Regla 5):** Si más del 20% de las preguntas formuladas en el Discovery ya se encuentran documentadas o decididas, se debe abortar el Discovery inmediatamente marcándolo como `DISCOVERY RECHAZADO`.

Cualquier pregunta cuya respuesta exista en la documentación debe ser heredada de forma automática y eliminada del cuestionario.

---

# VISIÓN DEL SISTEMA

Sistema ERP B2B Premium para empresas de ingeniería y servicios técnicos.

El sistema debe administrar:

* Clientes
* Requerimientos
* Diagnósticos
* Visitas Técnicas
* Cotizaciones
* Aprobaciones
* Trabajos
* Actividades
* Documentos
* Costos
* Inventario
* Facturación
* Pagos
* Garantías
* Indicadores
* Auditoría

Con trazabilidad completa de extremo a extremo.

---

# ALCANCE FUNCIONAL

## Comercial

* Gestión de clientes
* Gestión de contactos
* Gestión de requerimientos
* Gestión de cotizaciones

## Operaciones

* Gestión de trabajos
* Gestión de actividades
* Gestión documental
* Gestión de alertas

## Financiero

* Facturación
* Pagos
* Anticipos
* Costos

## Postventa

* Garantías
* Intervenciones

## Inventario

* Materiales
* Equipos
* Herramientas
* Movimientos

## Analítica

* KPIs
* Dashboards
* Indicadores históricos

---

# ENTIDADES APROBADAS

* Clients
* ClientContacts
* Requirements
* Quotes
* QuoteItems
* Jobs
* JobActivities
* Documents
* Alerts
* AlertRecipients
* ApprovalFlows
* ApprovalSteps
* ApprovalRequests
* ApprovalRules
* Invoices
* InvoiceTaxes
* Payments
* CustomerAdvances
* Warranties
* WarrantyInterventions
* Costs
* JobBudgets
* InventoryItems
* InventoryMovements
* Warehouses
* InventoryStock
* KPIDefinitions
* KPIFormulas
* KPIHistory
* Users
* Roles
* Permissions
* UserRoles
* UserPermissions
* SitePermissions

---

# DOCUMENTOS OFICIALES

* Solicitud Cliente
* Diagnóstico
* Visita Técnica
* Cotización
* Contrato
* Orden Trabajo
* Plano
* Memoria Técnica
* Acta Entrega
* Factura
* Comprobante Pago
* Garantía
* Informe Servicio
* Fotografías

---

# MATRIZ DE ESTADOS

La matriz oficial de estados y transiciones definida durante el descubrimiento constituye parte integral de este documento.

No pueden existir estados adicionales sin aprobación explícita.

---

# APROBACIONES

Tipos permitidos:

* Secuencial
* Paralela
* Mixta

Las reglas deben ser configurables.

Las reglas pueden depender de montos.

---

# MULTITENANCY

Todo registro debe pertenecer a un tenant.

Todo acceso debe filtrarse por tenant.

No se permite acceso cruzado entre tenants.

---

# AUDITORÍA

Toda acción crítica debe generar auditoría.

Mínimo:

* Crear
* Editar
* Eliminar lógico
* Cambio de estado
* Aprobar
* Rechazar
* Login

---

# ELIMINACIÓN

Prohibido eliminar físicamente información operativa.

Usar exclusivamente soft delete.

---

# VERSIONADO

Debe existir versionado para:

* Documentos
* Cotizaciones
* Fórmulas KPI

---

# INTEGRACIONES FUTURAS

* Correo
* WhatsApp
* ERP Externo
* Facturación Electrónica
* APIs de terceros

---

# CRITERIO DE ACEPTACIÓN

Una funcionalidad se considera terminada únicamente cuando:

* Cumple reglas de negocio
* Tiene trazabilidad
* Tiene auditoría
* Tiene validaciones
* Tiene pruebas
* Está documentada

---

# FUENTE DE VERDAD

Este Documento Maestro de Descubrimiento es la única fuente oficial de verdad del proyecto.

Si existe contradicción entre:

* Código
* Base de datos
* Diseño UI
* Documento técnico
* Conversación

Prevalece siempre este documento.
