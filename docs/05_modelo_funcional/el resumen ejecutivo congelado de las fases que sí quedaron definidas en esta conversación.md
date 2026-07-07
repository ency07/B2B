# FASE 1 - MULTIEMPRESA Y SEGURIDAD BASE

Objetivo:
Crear la base del sistema.

Incluye:

* Tenant
* Usuarios
* Roles
* Permisos
* Sedes
* Áreas

Reglas:

* Todo pertenece a un tenant.
* No existe información global.
* RLS obligatorio.

Validación:

* Un tenant no puede ver datos de otro tenant.

---

# FASE 2 - CLIENTES

Objetivo:
Administrar clientes.

Incluye:

* CRUD clientes
* Historial
* Auditoría

Reglas:

* Todo cambio auditado.
* Cliente asociado a tenant.

Validación:

* Crear
* Editar
* Consultar

---

# FASE 3 - REQUERIMIENTOS

Objetivo:
Gestionar solicitudes iniciales.

Incluye:

* Registro
* Seguimiento
* Estados
* Evidencias

Reglas:

* Todo requerimiento tiene trazabilidad.

Validación:

* Flujo completo.

---

# FASE 4 - COTIZACIONES

Objetivo:
Gestionar propuestas comerciales.

Incluye:

* Cotizaciones
* Versionado
* Historial

Reglas:

* Nunca sobrescribir versiones.

Validación:

* Crear versión
* Consultar historial

---

# FASE 5 - TRABAJOS

Objetivo:
Gestionar ejecución operativa.

Incluye:

* Orden de trabajo
* Estados
* Bitácora

Reglas:

* Toda transición registrada.

Validación:

* Flujo completo de trabajo.

---

# FASE 6 - DOCUMENTOS

Documentos definidos:

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

Reglas:

* Versionado obligatorio.
* No reemplazar archivos.

Validación:

* Carga
* Descarga
* Historial

---

# FASE 7 - ALERTAS

Incluye:

* Alertas
* Recordatorios
* Eventos

Reglas:

* Motor independiente.

Validación:

* Generación
* Lectura

---

# FASE 8 - APROBACIONES

Tipos:

* Secuencial
* Paralela
* Mixta

Acciones:

* Aprobar
* Rechazar
* Solicitar ajustes

Reglas:

* Auditoría completa.

Validación:

* Todos los flujos.

---

# FASE 9 - FACTURACIÓN

Incluye:

* Facturas
* Estados
* Cartera

Reglas:

* Trazabilidad total.

Validación:

* Emisión
* Consulta

---

# FASE 10 - PAGOS

Incluye:

* Registro pagos
* Comprobantes

Validación:

* Aplicación pago

---

# FASE 11 - GARANTÍAS

Incluye:

* Garantías
* Seguimiento
* Cierre

Validación:

* Apertura
* Cierre

---

# FASE 12 - COSTOS

Incluye:

* Materiales
* Mano de obra
* Servicios terceros
* Equipos
* Transporte
* Viáticos
* Otros gastos

Validación:

* Cálculo costo total

---

# FASE 13 - RENTABILIDAD

Indicadores:

* Por trabajo
* Por cliente
* Por proyecto
* Por empresa
* Por sede

Validación:

* Margen calculado correctamente

---

# FASE 14 - INVENTARIO

Incluye:

* Existencias
* Movimientos
* Entradas
* Salidas
* Ajustes

Relación:

* Consumo materiales
* Reserva materiales
* Solicitud materiales

Validación:

* Kardex correcto

---

# FASE 15 - PLANTILLAS

Generación automática:

* Cotización
* Orden Trabajo
* Acta Entrega
* Garantía
* Informe Servicio

Reglas:

* Variables dinámicas
* Versionado

---

# FASE 16 - KPIs

Categorías:

* Comercial
* Operacional
* Financiero
* Rentabilidad

Validación:

* Fórmulas correctas

---

# FASE 17 - DASHBOARDS

Tipos:

* Ejecutivo
* Operacional
* Financiero

Validación:

* Datos consistentes

---

# FASE 18 - INTEGRACIONES

Preparado para:

* Correo
* WhatsApp
* APIs externas
* ERP externos
* Facturación electrónica

Regla:

* Siempre mediante Integration Layer.

---

# FASE 19 - AUDITORÍA

Registrar:

* Crear
* Editar
* Eliminar lógico
* Cambio estado
* Aprobar
* Rechazar
* Login

Validación:

* Trazabilidad completa

---

# FASE 20 - SEGURIDAD

Incluye:

* RLS
* Roles
* Permisos
* Auditoría acceso

Validación:

* Pruebas de acceso indebido

---

# FASE 21 - HARDENING

Incluye:

* Índices
* Optimización consultas
* Performance

Validación:

* Carga
* Rendimiento

---

# FASE 22 - UAT

Incluye:

* Casos de negocio reales
* Validación funcional

Regla:

* No corregir inventando requisitos.

---

# FASE 23 - PRODUCCIÓN

Incluye:

* Despliegue
* Backups
* Monitoreo

Validación:

* Checklist Go Live

---

# FASE 24 - OPERACIÓN CONTINUA

Incluye:

* Soporte
* Métricas
* Mejora continua
* Nuevos requerimientos

Regla:

* Toda nueva funcionalidad inicia nuevamente por descubrimiento y aprobación.
