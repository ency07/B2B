# Blueprint — CRM

---

# Filosofía

El CRM NO es una agenda.

NO es una tabla.

NO es un Excel bonito.

El CRM es un sistema para mover prospectos hasta convertirlos en clientes.

Toda la interfaz debe ayudar a responder únicamente estas preguntas:

• ¿Qué oportunidades existen?
• ¿Cuál debo atender primero?
• ¿Qué comercial está vendiendo más?
• ¿Qué negocios están detenidos?
• ¿Qué acciones debo hacer hoy?

Todo lo demás sobra.

---

# Estructura General

```

┌──────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
├──────────────────────────────────────────────────────────────┤
│ FILTROS GLOBALES                                            │
├──────────────────────────────────────────────────────────────┤
│ KPIs                                                        │
├──────────────────────────────────────────────────────────────┤
│ PIPELINE + TABLAS + PANEL DERECHO                           │
├──────────────────────────────────────────────────────────────┤
│ ACTIVIDAD                                                   │
└──────────────────────────────────────────────────────────────┘

```

---

# Barra Superior

Siempre contiene

Buscar

Filtros

Exportar

Crear

Importar

Configuración de vista

Nunca más de una fila.

---

# Buscador

Debe buscar:

Lead

Empresa

Cliente

Contacto

Correo

Teléfono

Código

NIT

Proyecto

Cotización

Todo desde un único buscador.

---

# KPIs

Primera fila.

Nunca más de ocho.

Ejemplos

Lead nuevos

Pipeline

Cotizaciones

Ventas

Conversión

Ingresos

Tiempo promedio

Negocios perdidos

---

# CRM dividido por módulos

CRM

├── Leads
├── Clientes
├── Empresas
├── Contactos
├── Pipeline
└── Oportunidades

Cada uno tiene blueprint propio.

---

# LEADS

Objetivo

Administrar prospectos.

No clientes.

No oportunidades.

Prospectos.

---

Layout

```

HEADER

↓

KPIs

↓

Filtros

↓

Tabla

↓

Panel lateral

```

---

KPIs

Leads nuevos

Leads calientes

Sin contactar

Convertidos

Perdidos

Spam

---

Filtros

Estado

Origen

Responsable

Industria

Ciudad

Fecha

Valor

Servicio

Prioridad

Riesgo

---

Tabla

Columnas

Código

Empresa

Contacto

Cargo

Ciudad

Origen

Estado

Score

Riesgo

Comercial

Última actividad

Próxima actividad

Acciones

---

Acciones rápidas

Llamar

WhatsApp

Correo

Programar

Editar

Convertir

Eliminar

---

Click sobre Lead

Abre panel derecho.

Nunca otra página.

---

Panel Derecho

Información general

Empresa

Contacto

Timeline

Notas

Archivos

Actividades

Cotizaciones

Requerimientos

Diagnósticos

Historial

Todo sin salir.

---

# CLIENTES

Objetivo

Gestionar empresas activas.

---

KPIs

Clientes activos

Clientes inactivos

Facturación

Contratos

Proyectos

Servicios activos

---

Tabla

Código

Empresa

NIT

Ciudad

Sector

Responsable

Facturación

Última compra

Estado

Acciones

---

Panel derecho

Información

Contactos

Cotizaciones

Facturas

Pagos

Proyectos

Requerimientos

Equipos instalados

Documentos

Historial

---

# EMPRESAS

No son clientes necesariamente.

Pueden ser:

Proveedor

Prospecto

Aliado

Distribuidor

Cliente

Competidor

---

Vista

Mapa

Tabla

Cards

Todas reutilizan mismo datasource.

---

Información

Logo

Razón social

NIT

Sector

Tamaño

Sitio web

Ubicación

Contactos

Estado

---

# CONTACTOS

Nunca duplicar personas.

Un contacto pertenece a una empresa.

---

Tabla

Nombre

Cargo

Empresa

Correo

Teléfono

WhatsApp

Ciudad

Estado

Último contacto

Responsable

---

Ficha

Datos

Historial

Notas

Correos

Llamadas

WhatsApp

Archivos

Cotizaciones

---

# PIPELINE

Objetivo

Visualizar ventas.

No administrar clientes.

---

Vista Kanban

```

Nuevo

↓

Contactado

↓

Diagnóstico

↓

Cotización

↓

Negociación

↓

Ganado

↓

Perdido

```

Cada tarjeta contiene

Empresa

Monto

Probabilidad

Responsable

Fecha

Última actividad

---

Mover tarjeta

Drag & Drop

Debe actualizar automáticamente

Pipeline

Dashboard

KPIs

Actividad

Auditoría

Sin refrescar.

---

Color

Nunca por estética.

Sólo semántica.

Verde

Ganado

Rojo

Perdido

Amarillo

En riesgo

Azul

Activo

Gris

Pendiente

---

# OPORTUNIDADES

Una oportunidad es una venta posible.

No un cliente.

---

Tabla

Código

Empresa

Monto

Probabilidad

Fase

Responsable

Fecha cierre

Prioridad

Estado

---

Detalle

Información

Productos

Cotización

Archivos

Notas

Timeline

Correos

Llamadas

Actividades

Tareas

---

Timeline

Debe verse tipo CRM moderno.

Ejemplo

```

09:00

Correo enviado

↓

10:15

Cliente respondió

↓

11:00

Se creó cotización

↓

14:30

Llamada realizada

↓

16:00

Se agenda visita

```

Nunca como texto plano.

---

# Panel Derecho Universal

Todos los módulos CRM comparten el mismo patrón.

Tabs

Resumen

Actividad

Archivos

Comentarios

Historial

Auditoría

No inventar layouts distintos.

---

# Estados Vacíos

Nunca dejar tablas vacías.

Debe aparecer

Ilustración

Título

Descripción

Acción principal

Ejemplo

"No existen oportunidades."

[Crear oportunidad]

---

# Estados Loading

Skeleton.

Nunca spinner gigante.

---

# Error

Debe indicar

Qué ocurrió

Cómo solucionarlo

Botón Reintentar

Nunca mostrar stacktrace.

---

# Acciones Masivas

Seleccionar varios registros.

Acciones

Asignar comercial

Cambiar estado

Exportar

Eliminar lógico

Etiquetar

Enviar correo

Nunca abrir pantalla distinta.

---

# Reglas Siemens / ABB

Muchísima información visible.

Pocos clics.

Máximo contexto.

Todo conectado.

El usuario nunca debe preguntarse:

"¿Dónde estaba esa información?"

Debe verla en la misma pantalla.