# Blueprint — Cotizaciones (Quotes)

---

# Filosofía

Una cotización NO es un formulario.

Es un documento comercial vivo.

Debe permitir al comercial construir propuestas complejas sin depender del área técnica para modificaciones simples.

Debe transmitir confianza.

Debe parecer un software de ingeniería profesional.

Nunca un formulario web.

---

# Objetivos

Permitir:

• construir propuestas
• reutilizar productos
• reutilizar servicios
• reutilizar plantillas
• reutilizar condiciones comerciales
• controlar versiones
• generar PDF profesional
• comparar versiones
• conocer márgenes
• calcular costos
• aprobar internamente

Todo desde una única pantalla.

---

# Layout General

```

HEADER

↓

Resumen Ejecutivo

↓

Wizard lateral

↓

Editor principal

↓

Panel financiero

↓

Productos

↓

Servicios

↓

Totales

↓

Versiones

↓

PDF

```

---

# HEADER

Debe contener

Número Cotización

Estado

Versión

Cliente

Empresa

Proyecto

Responsable

Fecha

Vigencia

Moneda

Botones

Guardar

Vista previa

Duplicar

Nueva versión

Enviar

Generar PDF

Aprobar

Rechazar

Más acciones

---

Nunca esconder acciones importantes.

---

# Resumen Ejecutivo

Cards pequeñas

Cliente

Proyecto

Tipo de Servicio

Valor Total

Margen

Rentabilidad

Tiempo entrega

Probabilidad cierre

Estado

---

Todo visible.

Nunca oculto.

---

# Wizard Comercial

Panel izquierdo.

Siempre visible.

Pasos

① Información General

↓

② Productos

↓

③ Servicios

↓

④ Ingeniería

↓

⑤ Costos

↓

⑥ Descuentos

↓

⑦ Condiciones

↓

⑧ Revisión

↓

⑨ PDF

↓

⑩ Enviar

---

Cada paso

icono

estado

avance

errores

completado

---

Nunca más de un clic para regresar.

---

# Editor Principal

Zona central.

Ocupa aproximadamente 70%.

Debe sentirse como un editor profesional.

---

Secciones

Información General

Productos

Servicios

Ingeniería

Condiciones

Notas

Observaciones

Anexos

---

Todo modular.

Cada bloque independiente.

---

# Información General

Campos

Cliente

Empresa

Proyecto

Contacto

Comercial

Moneda

Idioma

Forma de pago

Tiempo entrega

Garantía

Incoterm

Validez

Observaciones

---

Debe autocompletar información existente.

---

# Productos

Tabla empresarial.

Columnas

Código

Producto

Descripción

Cantidad

Unidad

Precio Unitario

Descuento

IVA

Subtotal

Margen

Estado

Acciones

---

Acciones

Editar

Duplicar

Eliminar

Cambiar posición

Relacionar ingeniería

Relacionar plano

---

Agregar

Productos

Servicios

Accesorios

Consumibles

Repuestos

---

Nunca abrir otra pantalla.

Todo mediante Dialog.

---

# Servicios

Misma filosofía.

Ejemplos

Balanceo

Instalación

Montaje

Puesta en marcha

Transporte

Capacitación

Mantenimiento

Visita técnica

---

Cada servicio

Horas

Cantidad

Costo

Responsable

Observaciones

---

# Ingeniería

Debe mostrar

Resumen técnico

↓

Parámetros

↓

Cálculos

↓

Materiales

↓

Planos

↓

Notas

---

Datos

CFM

RPM

Potencia

Presión

Temperatura

Voltaje

Frecuencia

Nivel sonoro

Peso

Dimensiones

---

Nunca escribir cálculos manualmente.

Siempre reutilizar el motor de ingeniería.

---

# Costos

Panel financiero.

Siempre visible.

Debe actualizarse en tiempo real.

---

Mostrar

Costo Materiales

Costo Mano de Obra

Costo Transporte

Costo Instalación

Costo Ingeniería

Costo Administrativo

Costo Garantías

Costo Riesgo

Costo Total

Precio Venta

Margen

Rentabilidad

Utilidad

IVA

Total

---

Cada valor

COP

USD

si aplica

---

Semáforos

Verde

Rentable

Amarillo

Margen bajo

Rojo

Pérdidas

---

Nunca ocultar márgenes.

---

# Editor de Condiciones

Bloques reutilizables.

Ejemplos

Garantías

Forma de pago

Tiempo entrega

Exclusiones

Incluye

No incluye

Validez

Responsabilidades

---

Seleccionables desde plantillas.

Nunca escribir desde cero.

---

# Versiones

Cada modificación importante genera versión.

Ejemplo

V1

↓

V2

↓

V3

↓

V4

---

Cada versión guarda

Fecha

Usuario

Cambios

Comentarios

Monto

Estado

---

Nunca sobrescribir.

Siempre versionar.

---

Vista

Timeline horizontal

```

V1 —— V2 —— V3 —— V4

```

---

Cada versión

abrir

comparar

duplicar

restaurar

PDF

---

# Comparador de Versiones

Pantalla dividida.

```

VERSIÓN A

||

VERSIÓN B

```

---

Comparar

Productos

Cantidades

Servicios

Condiciones

Costos

Descuentos

Tiempo

IVA

Margen

---

Cambios

Verde

Nuevo

Rojo

Eliminado

Azul

Modificado

---

Nunca comparar mediante texto plano.

Siempre visual.

---

# Generador PDF

Vista previa integrada.

No descargar inmediatamente.

---

Debe mostrar exactamente

Logo

Empresa

Cliente

Productos

Servicios

Tabla económica

Condiciones

Firmas

QR

Código

Versión

---

Botones

Vista previa

Descargar

Enviar correo

Enviar WhatsApp

Firmar

Guardar versión

---

Nunca generar PDFs diferentes entre usuarios.

Siempre misma plantilla.

---

# Panel Financiero Derecho

Sticky.

Siempre visible.

Indicadores

Subtotal

Descuentos

IVA

Costo

Margen

Rentabilidad

Utilidad

Tiempo entrega

Probabilidad cierre

Comisión comercial

---

Colores

Verde

Excelente

Amarillo

Advertencia

Rojo

Crítico

---

# Flujo Comercial

```

Nueva

↓

En edición

↓

Revisión Ingeniería

↓

Aprobación Comercial

↓

Enviada

↓

Negociación

↓

Aceptada

↓

Orden Trabajo

```

Cada transición

usuario

fecha

comentario

auditoría

---

# Acciones Inteligentes

Generar desde requerimiento

Generar desde diagnóstico

Duplicar cotización

Convertir en orden

Crear oportunidad

Enviar correo

Enviar WhatsApp

Solicitar aprobación

Exportar Excel

Exportar PDF

Crear nueva versión

---

# Dashboard de Cotizaciones

Vista inicial

KPIs

Cotizaciones activas

Monto total

Valor esperado

Probabilidad

Tasa cierre

Tiempo promedio

Pendientes aprobación

En negociación

Aceptadas

Rechazadas

---

Widgets

Embudo

Ventas

Estados

Top comerciales

Top clientes

Valor mensual

Rentabilidad

Tiempo de aprobación

---

Nunca usar gráficas decorativas.

Cada gráfica debe responder una pregunta de negocio.

---

# Reglas Absolutas

Nunca perder historial.

Nunca sobrescribir versiones.

Nunca recalcular costos manualmente.

Nunca romper relación con requerimientos.

Nunca duplicar productos.

Nunca duplicar clientes.

Nunca duplicar contactos.

Nunca generar PDFs inconsistentes.

Nunca esconder márgenes a usuarios autorizados.

Toda acción debe quedar auditada.

Toda modificación importante genera nueva versión.

Toda cotización debe poder reconstruirse exactamente años después.