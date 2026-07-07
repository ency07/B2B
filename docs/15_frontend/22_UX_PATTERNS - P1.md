# UX_PATTERNS.md

# Patrones Oficiales de Experiencia de Usuario (UX)

Versión 1.0

---

# OBJETIVO

Este documento define el comportamiento funcional obligatorio de toda la interfaz del ERP.

No define colores.

No define estilos.

Define comportamiento.

Todo componente deberá cumplir estas reglas.

Si una pantalla no cumple estos patrones deberá rediseñarse.

---

# PRINCIPIO SUPREMO

El usuario nunca debe preguntarse:

¿Qué hago ahora?

¿Dónde está?

¿Ya guardó?

¿Se dañó?

¿Qué significa esto?

La interfaz debe responder esas preguntas automáticamente.

---

# PILAR 1

LA INTERFAZ DEBE GUIAR

Nunca obligar al usuario a descubrir.

Siempre indicar.

Qué hacer.

Qué ocurre.

Qué ocurrirá.

Qué falta.

---

# PILAR 2

UNA ACCIÓN = UNA RESPUESTA

Toda acción debe generar feedback inmediato.

Ejemplos.

Guardar

↓

Guardando...

↓

Éxito

↓

Actualizar pantalla

Nunca:

clic

silencio

---

# PILAR 3

NO EXISTEN BOTONES DECORATIVOS

Todo botón debe ejecutar algo.

Todo botón debe tener utilidad.

Quedan prohibidos:

Botones de prueba.

Botones sin backend.

Botones simulados.

Botones "Próximamente".

---

# PILAR 4

NO EXISTEN GRÁFICAS DECORATIVAS

Toda gráfica responde una pregunta.

Ejemplos.

¿Cómo evolucionaron las ventas?

¿Qué cliente compra más?

¿Qué proyecto consume más horas?

¿Qué equipo presenta más fallas?

Si la gráfica no responde ninguna pregunta...

no debe existir.

---

# PILAR 5

NO EXISTEN KPIs DECORATIVOS

Todo KPI debe generar una decisión.

Ejemplo.

OT vencidas

↓

Abrir listado

↓

Ver responsables

↓

Reasignar

↓

Resolver

No solamente mostrar un número.

---

# PILAR 6

LA INFORMACIÓN SIEMPRE DEBE SER ACCIONABLE

Cada dato importante debe permitir actuar.

Ejemplo.

Correo

↓

Enviar correo

Teléfono

↓

Llamar

Proyecto

↓

Abrir proyecto

Factura

↓

Descargar

Cliente

↓

Abrir expediente

---

# PILAR 7

NUNCA TERMINAR EN UN CALLEJÓN

Después de cualquier acción importante debe existir una siguiente acción lógica.

Ejemplo.

Crear Cliente

↓

Crear Contacto

↓

Crear Oportunidad

↓

Crear Cotización

↓

Crear Proyecto

Nunca dejar al usuario sin continuidad.

---

# PILAR 8

LOS FLUJOS DEBEN SENTIRSE NATURALES

No obligar al usuario a volver atrás.

El sistema debe continuar automáticamente.

---

# PILAR 9

SIEMPRE MOSTRAR CONTEXTO

Toda pantalla debe responder:

¿Dónde estoy?

¿Qué estoy viendo?

¿De quién es?

¿Qué puedo hacer?

---

# PILAR 10

LOS FORMULARIOS DEBEN REDUCIR EL ESFUERZO

Autocompletar.

Recordar datos.

Reutilizar información.

Detectar duplicados.

Sugerir opciones.

Nunca obligar al usuario a escribir lo mismo dos veces.

---

# PILAR 11

LOS ERRORES DEBEN AYUDAR

Incorrecto

Error.

Correcto

El correo ya pertenece al cliente "Metalúrgica ABC".

¿Desea abrir el expediente?

---

# PILAR 12

LA CARGA DEBE SER INTELIGENTE

Nunca mostrar pantalla blanca.

Siempre utilizar:

Skeleton

Placeholder

Progress

Estado parcial

El usuario nunca debe sentir que el sistema está congelado.

---

# PILAR 13

LA NAVEGACIÓN DEBE RECORDAR

Filtros.

Orden.

Paginación.

Vista.

Scroll.

Paneles abiertos.

Sidebar.

Todo debe persistirse.

El usuario nunca debe perder su contexto de trabajo.

---

# PILAR 14

LAS ACCIONES CRÍTICAS SIEMPRE PIDEN CONFIRMACIÓN

Eliminar.

Cancelar.

Cerrar proyecto.

Anular factura.

Eliminar archivo.

Cambiar permisos.

Nunca ejecutar inmediatamente.

---

# PILAR 15

LOS CAMBIOS IMPORTANTES DEBEN PODER DESHACERSE

Siempre que sea posible.

Mostrar:

"Deshacer"

durante algunos segundos.

Cuando técnicamente sea viable.

---

# PILAR 16

EL SISTEMA DEBE ANTICIPARSE

No esperar errores.

Detectarlos antes.

Ejemplo.

Correo repetido.

Cliente existente.

Producto agotado.

Fecha inválida.

Documento vencido.

Detectar antes de guardar.

---

# PILAR 17

NUNCA BLOQUEAR EL TRABAJO

Si una consulta tarda.

Permitir continuar.

Si una integración falla.

Aislarla.

Nunca detener toda la aplicación.

---

# PILAR 18

LAS PANTALLAS DEBEN RESPONDER EN MENOS DE 5 SEGUNDOS

Si no es posible.

Mostrar progreso.

Nunca dejar incertidumbre.

---

# PILAR 19

TODO CAMBIO DEBE SER VISIBLE

Guardar.

↓

Toast.

↓

Actualizar.

↓

Resaltar cambio.

El usuario debe ver inmediatamente el resultado.

---

# PILAR 20

NINGUNA INTERACCIÓN PUEDE EXISTIR SI NO APORTA VALOR

Toda interacción debe ahorrar tiempo.

Reducir errores.

Facilitar decisiones.

Aumentar productividad.

Si no cumple alguno de estos objetivos...

debe eliminarse.

# FIN PARTE 1
