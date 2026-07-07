# Blueprint — Requerimientos (Requirements)

---

# Filosofía

Los Requerimientos son el corazón operativo del ERP.

Todo inicia aquí.

Desde un requerimiento pueden nacer:

• Diagnósticos
• Visitas técnicas
• Ingeniería
• Cotizaciones
• Órdenes de trabajo
• Producción
• Compras
• Instalaciones
• Facturación

Nunca debe verse como una simple tabla.

Debe verse como un expediente técnico.

---

# Objetivo

Que cualquier usuario pueda entender en menos de 30 segundos:

• Qué necesita el cliente
• Qué se ha hecho
• Qué falta
• Quién es responsable
• Qué documentos existen
• Qué riesgos existen
• Qué costos existen
• Qué decisiones faltan

---

# Layout General

```

HEADER

↓

Resumen Ejecutivo

↓

Timeline

↓

Información Técnica

↓

Tabs

↓

Panel lateral

↓

Actividad

```

---

# HEADER

Debe contener

Código

Estado

Prioridad

Cliente

Empresa

Proyecto

Responsable

Fecha creación

Fecha compromiso

SLA

Botones rápidos

---

Botones

Editar

Asignar

Generar Diagnóstico

Crear Cotización

Programar Visita

Adjuntar Archivo

Imprimir

Más acciones

---

Nunca esconder acciones críticas.

---

# Resumen Ejecutivo

Cards pequeñas

Requerimiento

Cliente

Proyecto

Servicio

Prioridad

Estado

Tiempo transcurrido

Tiempo restante SLA

Costo estimado

Responsable

---

Todo visible.

---

# Timeline Superior

Debe ocupar todo el ancho.

Ejemplo

```

Creado

↓

Revisado

↓

Asignado

↓

Diagnóstico

↓

Ingeniería

↓

Cotización

↓

Aprobado

↓

Producción

↓

Entrega

↓

Finalizado

```

Cada paso

color

fecha

usuario

comentarios

---

Nunca como texto.

Siempre visual.

---

# Indicadores

En la parte superior

Prioridad

Urgencia

Riesgo

Complejidad

Costo

Tiempo

Progreso

Todos mediante Badges.

---

# Vista Principal

Dos columnas

```

70%

Información

↓

30%

Panel Inteligente

```

---

# Columna Principal

Contiene

Descripción

Necesidad

Problema

Objetivos

Datos técnicos

Archivos

Ingeniería

Historial

---

# Panel Derecho

Siempre visible

Cliente

Contacto

Empresa

Comercial

Ingeniero

Estado

SLA

Checklist

Próximas actividades

Archivos recientes

Observaciones

---

# Lista de Requerimientos

Vista principal

Tabla empresarial

---

Columnas

Código

Cliente

Empresa

Servicio

Proyecto

Estado

Prioridad

Responsable

Fecha creación

Fecha compromiso

Progreso

Acciones

---

Acciones rápidas

Abrir

Editar

Duplicar

Asignar

Cambiar estado

Generar cotización

Descargar PDF

---

Filtros

Estado

Prioridad

Responsable

Cliente

Empresa

Ciudad

Servicio

Proyecto

Fecha

Urgencia

SLA

---

Agrupaciones

Por estado

Por comercial

Por proyecto

Por empresa

Por prioridad

Por ingeniero

---

Vistas

Tabla

Kanban

Calendario

Timeline

Mapa

Nunca duplicar lógica.

---

# Vista Detalle

La pantalla más importante.

Debe parecer un expediente.

---

Orden

Resumen

↓

Descripción

↓

Información técnica

↓

Timeline

↓

Archivos

↓

Ingeniería

↓

Historial

---

Toda la información relacionada debe verse sin cambiar de pantalla.

---

# Timeline

Debe registrar absolutamente todo.

Ejemplo

```

08:20

Cliente crea requerimiento

↓

08:40

Comercial asignado

↓

09:10

Se agenda visita

↓

10:00

Ingeniería inicia análisis

↓

12:30

Se genera cotización

↓

15:40

Cliente aprueba

↓

16:00

Producción inicia

```

Cada evento muestra

Usuario

Hora

Tipo

Descripción

Entidad relacionada

---

Iconografía

Correo

Llamada

Documento

Visita

Cotización

Producción

Factura

Pago

Comentario

Adjunto

---

Nunca texto plano.

---

# Evidencias

Zona independiente.

Tipos

Fotografías

Videos

PDF

DWG

DXF

Excel

Word

Audio

Firmas

Ubicación GPS

---

Vista

```

Galería

Lista

```

Cambio instantáneo.

---

Cada archivo muestra

Miniatura

Nombre

Tipo

Peso

Autor

Fecha

Comentarios

Versión

---

Acciones

Ver

Descargar

Compartir

Versiones

Eliminar lógico

Relacionar

---

Nunca abrir otra página.

Todo mediante Drawer o Dialog.

---

# Adjuntos

No son sólo archivos.

Son documentos empresariales.

Ejemplos

Cotizaciones

Facturas

Planos

Informes

Contratos

Certificados

Manuales

Garantías

Correspondencia

---

Organizados por categorías.

Nunca en una lista caótica.

---

Búsqueda

Nombre

Tipo

Autor

Fecha

Versión

---

Filtros

PDF

CAD

Imagen

Video

Contrato

Manual

---

# Ingeniería

Uno de los módulos más importantes.

Debe verse como un expediente técnico.

---

Panel

Información técnica

↓

Cálculos

↓

Materiales

↓

Planos

↓

Versiones

↓

Observaciones

---

Datos técnicos

Caudal

CFM

Presión

Temperatura

RPM

Potencia

Voltaje

Frecuencia

Altitud

Ruido

Dimensiones

Peso

Norma aplicada

---

Todos organizados en Grid.

Nunca como párrafo.

---

Cálculos

Mostrar

Valor

Fórmula utilizada

Unidad

Resultado

Fecha

Autor

Versión

---

Nunca mostrar números sin contexto.

---

Planos

Vista previa

Zoom

Versiones

Descarga

Comparar versiones

---

Modelos

DWG

DXF

STEP

IGES

PDF

---

Materiales

Tabla

Material

Cantidad

Unidad

Costo

Proveedor

Estado

---

Observaciones técnicas

Caja amplia

Versionada

Firmada

Con historial

---

# Historial

Registro completo.

Nunca editable.

---

Cada evento contiene

Fecha

Hora

Usuario

Acción

Entidad

Valor anterior

Valor nuevo

IP

Dispositivo

Comentario

---

Debe parecer una auditoría.

No un chat.

---

Filtros

Usuario

Entidad

Tipo

Fecha

Acción

---

Exportar

PDF

Excel

JSON

---

Nunca permitir editar historial.

Nunca eliminar historial.

Nunca ocultar historial.

Es uno de los activos más importantes del ERP.