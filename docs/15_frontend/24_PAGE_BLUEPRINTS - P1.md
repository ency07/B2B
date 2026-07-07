# 24_PAGE_BLUEPRINTS.md

# Blueprint Maestro de Páginas
## ERP B2B Premium

Versión 1.0

---

# Objetivo

Este documento define el plano arquitectónico (Blueprint) de todas las páginas del ERP.

Antes de construir una sola pantalla, Antigravity deberá consultar este documento para conocer exactamente:

• Qué debe contener.

• Qué información debe mostrar.

• Qué acciones debe permitir.

• Qué componentes utilizar.

• Cómo distribuir el espacio.

• Qué comportamiento debe tener.

• Qué información es prioritaria.

• Qué está prohibido construir.

El objetivo es eliminar completamente la improvisación durante el desarrollo.

---

# Filosofía

Una pantalla NO es un conjunto de componentes.

Una pantalla representa un proceso de negocio.

Cada página debe ayudar al usuario a tomar decisiones, ejecutar acciones y comprender el estado del negocio con el menor número posible de clics.

El usuario nunca debe preguntarse:

"¿Qué hago aquí?"

La interfaz debe responder esa pregunta automáticamente.

---

# Principios del Blueprint

Cada pantalla deberá cumplir obligatoriamente los siguientes principios.

## 1. Propósito Único

Cada página tiene un objetivo principal.

Ejemplos:

CRM
Administrar clientes.

Inventario
Controlar existencias.

Producción
Gestionar órdenes.

Configuración
Administrar el sistema.

Nunca mezclar procesos completamente distintos.

---

## 2. Información antes que decoración

Todo espacio ocupado debe entregar información útil.

No existen componentes decorativos.

No existen gráficos únicamente porque "se ven bonitos".

Todo elemento debe responder:

¿Por qué existe?

¿Qué decisión ayuda a tomar?

---

## 3. Las acciones son más importantes que las estadísticas

Los usuarios trabajan.

No observan dashboards durante ocho horas.

La pantalla debe facilitar:

crear

editar

aprobar

rechazar

buscar

filtrar

comparar

exportar

compartir

automatizar

---

## 4. Contexto permanente

El usuario nunca debe perder el contexto.

Siempre debe saber:

Dónde está.

Qué está viendo.

Qué puede hacer.

Qué sucederá después.

---

## 5. Jerarquía Visual

Toda página debe tener una lectura natural.

La prioridad siempre será:

Título

↓

Resumen

↓

Acciones

↓

Filtros

↓

Información

↓

Detalle

↓

Historial

Nunca al contrario.

---

# Cómo leer un Blueprint

Cada página del ERP estará documentada utilizando exactamente la misma estructura.

Esto permite que cualquier IA pueda construirla sin inventar absolutamente nada.

La estructura será la siguiente.

---

# 1. Objetivo

Describe el propósito empresarial.

Ejemplo:

Administrar los clientes de la empresa.

Nunca:

"Página bonita para clientes."

---

# 2. Usuarios

Define quién puede utilizar la pantalla.

Ejemplo

Administrador

Director Comercial

Ejecutivo Comercial

Cliente

Proveedor

Técnico

---

# 3. Información Principal

Lista toda la información que debe visualizarse.

Ejemplo

Nombre

Estado

Responsable

Fecha

Monto

Prioridad

Historial

---

# 4. Acciones

Define todas las operaciones permitidas.

Ejemplo

Crear

Editar

Eliminar

Duplicar

Exportar

Enviar

Aprobar

Cancelar

Cerrar

---

# 5. Componentes

Lista únicamente componentes aprobados.

Ejemplo

DataTable

Button

Dialog

Drawer

Tabs

Accordion

Combobox

Chart

Badge

Timeline

---

# 6. Layout

Describe la distribución espacial.

Ejemplo

Header

↓

KPIs

↓

Toolbar

↓

Tabla

↓

Panel lateral

↓

Footer

---

# 7. Estados

Toda pantalla debe documentar sus estados.

Loading

Skeleton

Vacía

Error

Offline

Permisos insuficientes

Sin resultados

Datos parciales

---

# 8. Responsive

Describe cómo cambia la interfaz.

Desktop

Laptop

Tablet

Mobile

Nunca improvisar.

---

# 9. Integraciones

Toda página debe indicar:

Server Actions

Supabase

Storage

APIs

Servicios externos

Webhooks

---

# 10. Auditoría

Cada Blueprint finaliza con un checklist obligatorio.

Si un punto falla,

la pantalla no puede aprobarse.

---

# Reglas Generales

## Una pantalla = Un proceso

Nunca construir páginas que mezclen procesos distintos.

Incorrecto

Clientes

+

Inventario

+

Facturación

+

Producción

Todo junto.

Correcto

Cada proceso tiene su espacio.

---

## El usuario siempre debe saber dónde está

Toda página tendrá:

Título

Descripción

Breadcrumb

Ruta

Módulo

Nunca páginas "vacías".

---

## Toda página tiene acciones

No existen pantallas únicamente informativas.

Toda pantalla debe permitir realizar alguna acción.

---

## Los datos importantes siempre visibles

Nunca ocultar:

Estado

Prioridad

Responsable

Fecha

Cliente

Monto

---

## Acciones visibles

Las acciones principales nunca estarán escondidas.

Incorrecto

Menú

↓

Más

↓

Opciones

↓

Editar

Correcto

Editar visible.

---

## Todo listado tiene filtros

Si existe una tabla,

debe existir:

Buscar

Filtros

Orden

Exportar

Paginación

Columnas

---

## Todo detalle tiene historial

Toda entidad empresarial debe mostrar:

Creación

Cambios

Responsables

Eventos

Adjuntos

Auditoría

---

## Todo proceso tiene siguiente paso

El usuario nunca debe terminar una acción sin saber qué sigue.

Ejemplo

Cotización creada.

↓

Enviar al cliente.

↓

Generar requerimiento.

↓

Planificar producción.

Siempre existe continuidad.

---

# Anatomía de una Página

Todas las páginas del ERP utilizarán exactamente la siguiente estructura.

┌──────────────────────────────────────────────────────────────┐
│ Header Global                                                │
├──────────────────────────────────────────────────────────────┤
│ Breadcrumb                                                   │
├──────────────────────────────────────────────────────────────┤
│ Título + Descripción + Estado                               │
├──────────────────────────────────────────────────────────────┤
│ Barra de Acciones                                            │
├──────────────────────────────────────────────────────────────┤
│ KPIs / Resumen (cuando aplique)                              │
├──────────────────────────────────────────────────────────────┤
│ Toolbar (Buscar + Filtros + Exportar + Columnas)             │
├──────────────────────────────────────────────────────────────┤
│ Contenido Principal                                          │
│                                                              │
│ Tabla                                                       │
│ Grid                                                        │
│ Cards                                                       │
│ Timeline                                                    │
│ Wizard                                                      │
│ Editor                                                      │
│ Dashboard                                                   │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ Panel Lateral (Opcional)                                     │
├──────────────────────────────────────────────────────────────┤
│ Historial / Actividad / Auditoría                            │
├──────────────────────────────────────────────────────────────┤
│ Footer Operativo                                             │
└──────────────────────────────────────────────────────────────┘

---

# Distribución Recomendada

Desktop

20%

Sidebar

80%

Workspace

Dentro del Workspace

10%

Header

10%

KPIs

8%

Toolbar

60%

Contenido

12%

Historial

---

# Regla Fundamental

Nunca comenzar a construir una página creando componentes.

El proceso correcto siempre será:

Blueprint

↓

Wireframe

↓

Jerarquía

↓

Flujo

↓

Componentes

↓

Código

Nunca al revés.

---

# Principio Supremo

Antes de implementar cualquier pantalla, Antigravity deberá responder afirmativamente las siguientes preguntas:

✓ ¿Conozco el objetivo del negocio?

✓ ¿Conozco el usuario?

✓ ¿Conozco el flujo?

✓ ¿Conozco las acciones?

✓ ¿Conozco el layout?

✓ ¿Conozco los estados?

✓ ¿Conozco la jerarquía visual?

✓ ¿Conozco los componentes?

✓ ¿Conozco las restricciones?

✓ ¿Existe un Blueprint aprobado?

Si cualquiera de estas respuestas es NO, la implementación deberá detenerse hasta completar el Blueprint correspondiente.