# Blueprint — Compras y Abastecimiento

---

# Filosofía

Compras NO consiste en emitir Órdenes de Compra.

Compras administra el abastecimiento completo de la empresa.

Debe responder inmediatamente:

• ¿Qué necesitamos comprar?
• ¿Por qué debemos comprarlo?
• ¿Quién lo solicitó?
• ¿Quién lo aprobó?
• ¿Quién cotizó?
• ¿Qué proveedor ganó?
• ¿Cuándo llega?
• ¿Qué está retrasado?
• ¿Qué factura falta?
• ¿Qué impacto tiene en producción?

Todo debe estar conectado.

Nunca existirán compras aisladas.

---

# Objetivos

Controlar completamente

• Solicitudes

• Cotizaciones

• Comparativos

• Órdenes

• Recepciones

• Facturas

• Proveedores

• Pagos

• Costos

• Inventario

Todo desde un mismo módulo.

---

# Layout General

```

HEADER

↓

KPIs

↓

Solicitudes

↓

Cotizaciones

↓

Comparador

↓

Órdenes

↓

Recepción

↓

Facturación

↓

Proveedores

↓

Panel Derecho

```

---

# HEADER

Mostrar

Solicitudes Pendientes

Compras del Mes

OC Pendientes

Recepciones

Facturas

Pagos

Ahorro Compras

Proveedores

Botones

Nueva Solicitud

Nueva OC

Nueva Cotización

Recepción

Factura

Proveedor

Exportar

---

# KPIs

Cards pequeñas

Mostrar

Solicitudes

Órdenes

Compras Mes

Valor Comprado

Pendientes

En Tránsito

Recepciones

Facturas

Ahorro

Proveedores Activos

Tiempo Promedio Compra

---

Nunca usar tarjetas enormes.

---

# Dashboard Principal

```

70%

Proceso Compras

↓

30%

Alertas Inteligentes

```

---

# Flujo Completo

```

Solicitud

↓

Aprobación

↓

Cotización

↓

Comparativo

↓

Proveedor

↓

Orden Compra

↓

Recepción

↓

Factura

↓

Pago

↓

Inventario

```

Cada paso debe estar conectado.

Nunca romper el flujo.

---

# Solicitudes de Compra

Tabla empresarial.

Columnas

Código

Solicitante

Área

Proyecto

Prioridad

Fecha

Estado

Valor Estimado

Proveedor sugerido

Acciones

---

Filtros

Área

Proyecto

Estado

Solicitante

Prioridad

Proveedor

Fecha

---

Acciones

Abrir

Editar

Aprobar

Rechazar

Cotizar

Duplicar

Cancelar

---

Detalle Solicitud

Información General

Justificación

Productos

Cantidades

Urgencia

Proyecto

Responsable

Centro Costos

Observaciones

Adjuntos

Historial

---

Nunca permitir solicitudes sin justificación.

---

# Cotizaciones

Cada solicitud puede tener múltiples cotizaciones.

Mostrar

Proveedor

Valor

Entrega

Garantía

Condiciones

Moneda

Observaciones

Estado

---

Acciones

Comparar

Aceptar

Descartar

Solicitar nueva

Enviar correo

---

Nunca limitar a una sola cotización.

---

# Comparador de Proveedores

Vista horizontal.

```

Proveedor A

||

Proveedor B

||

Proveedor C

```

Comparar

Precio

Entrega

Garantía

Experiencia

Calidad

Tiempo

Historial

Incumplimientos

Calificación

---

Colores

Verde

Mejor opción

Amarillo

Aceptable

Rojo

Riesgo

---

Debe existir un ganador recomendado.

No decidido manualmente.

---

# Órdenes de Compra

Tabla principal.

Columnas

OC

Proveedor

Proyecto

Estado

Valor

Entrega

Comprador

Facturada

Recepcionada

Acciones

---

Estados

Borrador

Enviada

Aceptada

Parcial

Recibida

Facturada

Pagada

Cancelada

---

Acciones

Abrir

Editar

Duplicar

PDF

Enviar

Cancelar

Cerrar

---

# Vista Detalle OC

Debe parecer un documento empresarial.

Mostrar

Proveedor

Proyecto

Productos

Cantidades

Precios

Impuestos

Entrega

Condiciones

Observaciones

Historial

Documentos

---

Siempre mostrar

Subtotal

IVA

Retenciones

Descuentos

Total

---

# Recepción

Centro logístico.

Registrar

Recepción total

Recepción parcial

Rechazo

Devolución

Control calidad

---

Cada recepción

Producto

Cantidad

Estado

Inspector

Fecha

Hora

Ubicación

Lote

Serie

Observaciones

---

Si hay diferencias

Mostrar alerta.

Nunca ocultarlas.

---

# Facturas

Tabla empresarial.

Columnas

Factura

Proveedor

OC

Fecha

Valor

Estado

Vencimiento

Pagada

Acciones

---

Estados

Pendiente

Validación

Aprobada

Pagada

Vencida

Anulada

---

Relacionar siempre

Factura

↓

Orden Compra

↓

Recepción

↓

Inventario

Nunca permitir facturas huérfanas.

---

# Proveedores

Vista tipo CRM.

Mostrar

Código

Empresa

NIT

Ciudad

Contacto

Teléfono

Correo

Categoría

Estado

Calificación

Compras

---

Detalle

Información

Contactos

Productos

Historial

Compras

Facturas

Pagos

Indicadores

---

KPIs proveedor

Tiempo entrega

Cumplimiento

Precio promedio

Reclamos

Garantías

Calificación

---

# Panel Derecho

Sticky

Mostrar

Solicitudes urgentes

Recepciones hoy

Facturas vencidas

OC retrasadas

Proveedor crítico

Alertas

Compras pendientes

---

# Alertas Inteligentes

Proveedor atrasado

Factura vencida

Orden sin recepción

Solicitud urgente

Cotización expirada

Precio fuera rango

Proveedor bloqueado

Stock crítico

Entrega retrasada

Incumplimiento SLA

---

Todas accionables.

Nunca decorativas.

---

# Dashboard Ejecutivo Compras

Widgets

Compras por mes

Compras por proveedor

Top proveedores

Ahorro generado

Tiempo aprobación

Tiempo entrega

Facturas pendientes

Órdenes abiertas

Gasto por proyecto

Gasto por categoría

Comparativo proveedores

---

Cada widget debe responder preguntas reales como

¿Dónde gastamos más?

¿Qué proveedor incumple?

¿Cuánto estamos ahorrando?

¿Qué compras están retrasadas?

---

# Reglas Absolutas

Nunca comprar sin solicitud.

Nunca aprobar sin trazabilidad.

Nunca emitir OC sin proveedor.

Nunca recibir sin OC.

Nunca facturar sin recepción.

Nunca pagar sin factura válida.

Nunca perder historial.

Nunca eliminar órdenes.

Nunca modificar costos históricos.

Nunca romper relación con Inventario.

Nunca romper relación con Producción.

Toda compra debe quedar auditada.

Toda recepción genera movimiento de inventario.

Toda factura debe relacionarse con la Orden de Compra correspondiente.

Todo cambio debe poder reconstruirse años después.