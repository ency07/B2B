# 61. PRINCIPIO GENERAL DE LOS COMPONENTES

Un componente no existe porque pueda construirse.

Existe porque resuelve un problema del negocio.

Todo componente debe responder:

* ¿Qué problema resuelve?
* ¿Qué información comunica?
* ¿Qué acción permite ejecutar?
* ¿Qué decisión facilita?

Si no responde estas preguntas, no debe existir.

---

# 62. COMPONENTES REUTILIZABLES

Todo componente deberá ser reutilizable.

Queda prohibido crear componentes para una sola pantalla cuando puedan parametrizarse.

Ejemplos:

Correcto

DataTable

ChartCard

MetricCard

SectionHeader

StatusBadge

EntityCard

Timeline

AttachmentViewer

CommentPanel

Incorrecto

SalesTable

InventoryTable

ClientsTable

ProjectsTable

OrdersTable

Si el 90% del código es igual, el componente está mal diseñado.

---

# 63. LAS CARDS

Las cards nunca serán simples cajas.

Cada card debe tener una estructura uniforme.

Siempre:

Título

Descripción

Contenido

Acciones

Estado

Jamás mezclar estructuras distintas.

---

# 64. CARD KPI

Una KPI Card únicamente debe contener:

Valor principal

Indicador de tendencia

Comparación

Periodo

Acción relacionada

Nunca agregar:

cinco iconos

fotografías

sombras exageradas

fondos de colores

---

# 65. CARD DE ENTIDAD

Toda entidad del ERP debe compartir la misma estructura.

Ejemplo:

Cliente

Proveedor

Proyecto

Producto

Empleado

Activo

Siempre mostrar:

Nombre

Estado

Información principal

Última actualización

Acciones rápidas

---

# 66. TABLAS

Las tablas son el componente más importante del ERP.

Nunca deben ser listas simples.

Toda tabla debe soportar:

Ordenamiento

Filtrado

Búsqueda

Paginación

Columnas configurables

Acciones rápidas

Exportación

Estado vacío

Carga

Error

---

# 67. TABLAS INDUSTRIALES

Cada fila debe permitir trabajar.

No solamente leer.

Ejemplo.

Cliente

↓

Llamar

Correo

WhatsApp

Historial

Archivos

Cotizar

Proyecto

Editar

Todo desde la misma fila.

---

# 68. FILTROS

Los filtros nunca estarán ocultos sin razón.

Deben ser visibles.

Persistentes.

Recordar la selección del usuario.

Los filtros son herramientas de trabajo.

No decoración.

---

# 69. FORMULARIOS

Un formulario nunca debe sentirse pesado.

Debe dividirse en bloques.

Ejemplo.

Información General

↓

Datos Técnicos

↓

Adjuntos

↓

Observaciones

↓

Confirmación

Nunca mostrar 50 campos juntos.

---

# 70. VALIDACIONES

Toda validación debe aparecer inmediatamente.

Nunca al finalizar el formulario.

El usuario debe saber:

Qué ocurrió.

Cómo solucionarlo.

Dónde ocurrió.

---

# 71. BOTONES

Todo botón debe comunicar exactamente una acción.

Nunca utilizar:

Aceptar

Enviar

Continuar

cuando exista una acción específica.

Correcto:

Guardar Cliente

Crear Cotización

Enviar Diagnóstico

Registrar Equipo

Cerrar Orden

---

# 72. ICONOS

Los iconos nunca sustituyen texto.

Los iconos complementan.

Nunca depender únicamente del icono.

---

# 73. SIDEBAR

El Sidebar no es decoración.

Es una herramienta de navegación.

Debe mostrar únicamente módulos permitidos para el rol.

Debe poder colapsarse.

Debe recordar su estado.

Nunca debe contener veinte opciones visibles simultáneamente.

---

# 74. HEADER

El Header debe contener únicamente:

Breadcrumb

Buscador

Acciones rápidas

Notificaciones

Usuario

Nada más.

Nunca banners.

Nunca publicidad.

Nunca mensajes decorativos.

---

# 75. BREADCRUMB

Toda pantalla profunda debe tener breadcrumb.

El usuario nunca debe perder contexto.

---

# 76. MODALES

Los modales solo se permiten para acciones rápidas.

Nunca construir procesos completos dentro de un modal.

Si requiere más de dos pasos:

crear página.

---

# 77. DRAWERS

Los Drawers deben utilizarse para:

Ediciones rápidas.

Vista previa.

Detalles.

No para formularios gigantes.

---

# 78. TABS

Las Tabs deben separar información relacionada.

Nunca mezclar módulos diferentes.

---

# 79. ACORDEONES

Solo cuando exista mucha información secundaria.

Nunca ocultar información crítica dentro de un acordeón.

---

# 80. TIMELINE

Toda entidad importante debe poseer Timeline.

Clientes.

Proyectos.

OT.

Cotizaciones.

Equipos.

Leads.

Debe mostrar:

Fecha

Usuario

Acción

Resultado

---

# 81. PANEL DE ACTIVIDAD

El sistema debe sentirse vivo.

Siempre mostrar:

últimos cambios

últimos accesos

últimas modificaciones

últimos comentarios

últimos documentos

---

# 82. VISOR DE DOCUMENTOS

Todo PDF debe visualizarse sin descargarlo.

Todo plano debe tener preview.

Toda imagen debe ampliarse.

Nunca obligar al usuario a descargar archivos innecesariamente.

---

# 83. SUBIDA DE ARCHIVOS

La carga debe permitir:

Arrastrar

Seleccionar

Vista previa

Progreso

Cancelar

Reintentar

Nunca únicamente un input HTML.

---

# 84. DASHBOARD MODULAR

Todo dashboard debe construirse mediante widgets independientes.

Cada widget debe poder:

Moverse

Ocultarse

Actualizarse

Reutilizarse

Configurarse

---

# 85. PANEL DE DETALLE

Toda entidad debe tener una vista de detalle.

Nunca depender únicamente de tablas.

La vista detalle concentra:

Información

Historial

Archivos

Comentarios

Relaciones

Actividad

Indicadores

---

# 86. ESTADOS

Todos los componentes deben soportar:

Loading

Skeleton

Error

Vacío

Offline

Sin permisos

Sin resultados

Procesando

Éxito

Nunca mostrar pantallas en blanco.

---

# 87. MENSAJES

Todo mensaje debe explicar:

Qué ocurrió.

Por qué ocurrió.

Qué puede hacer el usuario.

Nunca únicamente:

Error.

Operación fallida.

Algo salió mal.

---

# 88. COMPONENTES PROHIBIDOS

Quedan prohibidos:

Cards gigantes sin contenido.

KPIs decorativos.

Widgets vacíos.

Gráficas falsas.

Carruseles innecesarios.

Marquees.

Contadores animados.

Fondos con partículas.

Elementos flotantes sin función.

Botones redundantes.

Información repetida.

---

# 89. CRITERIO DE ACEPTACIÓN

Antes de aprobar un componente deberán responderse estas preguntas:

¿Es reutilizable?

¿Tiene propósito?

¿Reduce trabajo?

¿Facilita decisiones?

¿Es consistente con el resto del ERP?

¿Respeta la dirección artística?

Si alguna respuesta es NO, el componente deberá rediseñarse.

---

# 90. REGLA SUPREMA DE COMPONENTES

Todo componente del ERP debe existir para aumentar la productividad del usuario.

Nunca para llenar espacio.

Nunca para decorar.

Nunca para impresionar.

Si un componente no mejora el trabajo del usuario, debe eliminarse.

# FIN DE LA PARTE 4
