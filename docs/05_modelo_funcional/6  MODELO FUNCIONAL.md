# CAPÍTULO 6

# MODELO FUNCIONAL

## OBJETIVO

Administrar el ciclo completo comercial, operativo, financiero y postventa de una empresa B2B de ingeniería y servicios técnicos.

---

# MÓDULO TENANT

Responsable del aislamiento de información entre empresas.

Funciones:

* Crear tenant
* Administrar tenant
* Configurar tenant
* Aislar datos

---

# MÓDULO USUARIOS

Responsable de la autenticación y acceso.

Funciones:

* Crear usuario
* Editar usuario
* Desactivar usuario
* Asignar roles
* Asignar permisos

---

# MÓDULO ROLES Y PERMISOS

Responsable del control de acceso.

Funciones:

* Crear rol
* Crear permiso
* Asignar permisos
* Excepciones por usuario
* Restricciones por sede

---

# MÓDULO CLIENTES

Responsable de administrar clientes.

Funciones:

* Crear cliente
* Editar cliente
* Consultar cliente
* Desactivar cliente
* Gestionar contactos

Documentos relacionados:

* Solicitud Cliente

---

# MÓDULO CONTACTOS

Responsable de administrar personas de contacto.

Funciones:

* Crear contacto
* Editar contacto
* Asociar contacto
* Marcar contacto principal

---

# MÓDULO REQUERIMIENTOS

Responsable de registrar necesidades del cliente.

Funciones:

* Registrar requerimiento
* Diagnosticar requerimiento
* Programar visita
* Generar cotización
* Convertir en trabajo

Documentos:

* Diagnóstico
* Visita Técnica

---

# MÓDULO COTIZACIONES

Responsable de elaborar propuestas comerciales.

Funciones:

* Crear cotización
* Gestionar ítems
* Enviar cotización
* Aprobar cotización
* Rechazar cotización
* Versionar cotización

Documentos:

* Cotización

---

# MÓDULO APROBACIONES

Responsable de controlar autorizaciones.

Funciones:

* Crear flujo
* Solicitar aprobación
* Aprobar
* Rechazar
* Solicitar ajustes

Objetos:

* Cotizaciones
* Facturas
* Contratos
* Otros configurables

---

# MÓDULO TRABAJOS

Responsable de ejecutar servicios.

Funciones:

* Crear trabajo
* Programar trabajo
* Ejecutar trabajo
* Finalizar trabajo
* Entregar trabajo
* Cerrar trabajo

Documentos:

* Orden Trabajo
* Plano
* Memoria Técnica
* Acta Entrega

---

# MÓDULO ACTIVIDADES

Responsable de controlar tareas.

Funciones:

* Crear actividad
* Asignar actividad
* Iniciar actividad
* Completar actividad
* Cancelar actividad

---

# MÓDULO DOCUMENTAL

Responsable de administrar archivos.

Funciones:

* Cargar documento
* Descargar documento
* Versionar documento
* Archivar documento

Tipos:

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

# MÓDULO FACTURACIÓN

Responsable de la facturación.

Funciones:

* Crear factura
* Emitir factura
* Anular factura
* Gestionar impuestos

---

# MÓDULO PAGOS

Responsable del recaudo.

Funciones:

* Registrar pago
* Confirmar pago
* Gestionar anticipos

---

# MÓDULO COSTOS

Responsable del control económico.

Funciones:

* Registrar costo
* Aprobar costo
* Comparar presupuesto vs real
* Calcular desviaciones

---

# MÓDULO INVENTARIO

Responsable de materiales y equipos.

Funciones:

* Crear item
* Gestionar stock
* Registrar movimientos
* Gestionar bodegas
* Reservar materiales

---

# MÓDULO GARANTÍAS

Responsable de postventa.

Funciones:

* Crear garantía
* Ejecutar garantía
* Registrar intervención
* Cerrar garantía

---

# MÓDULO ALERTAS

Responsable de notificaciones.

Funciones:

* Crear alerta
* Distribuir alerta
* Leer alerta
* Archivar alerta

Canales futuros:

* Correo
* WhatsApp

---

# MÓDULO KPI

Responsable de indicadores.

Funciones:

* Definir KPI
* Calcular KPI
* Versionar fórmulas
* Generar históricos

---

# MÓDULO DASHBOARD

Responsable de visualización.

Funciones:

* Dashboard por rol
* Dashboard configurable
* Widgets configurables

---

# MÓDULO AUDITORÍA

Responsable de trazabilidad.

Funciones:

* Registrar eventos
* Registrar cambios
* Registrar estados
* Registrar aprobaciones

---

# MÓDULO CONFIGURACIÓN

Responsable de parametrización.

Funciones:

* Catálogos
* Estados
* Flujos
* Aprobaciones
* Impuestos
* Monedas

Todo configurable por tenant.
