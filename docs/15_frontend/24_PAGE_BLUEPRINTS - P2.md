# Dashboard Ejecutivo

---

# Objetivo

El Dashboard Ejecutivo es el centro de operaciones del ERP.

No es una pantalla bonita.

Es una pantalla para tomar decisiones.

Debe responder en menos de 5 segundos preguntas como:

• ¿Qué está pasando?
• ¿Qué necesita atención?
• ¿Qué genera dinero?
• ¿Qué está atrasado?
• ¿Qué está en riesgo?

Todo lo demás es secundario.

---

# Filosofía

El dashboard NO cuenta una historia.

El dashboard responde preguntas.

Cada widget debe existir porque alguien toma una decisión usando esa información.

Si un widget no cambia ninguna decisión:

NO EXISTE.

---

# Layout General

```

┌──────────────────────────────────────────────────────────────────────┐
│ HEADER                                                       USER    │
├───────────────┬──────────────────────────────────────────────┬────────┤
│               │                                              │        │
│               │ KPI ROW                                      │ ALERTS │
│               │                                              │ PANEL  │
│               ├──────────────────────────────────────────────┤        │
│               │                                              │        │
│ SIDEBAR       │ DASHBOARD GRID                              │        │
│               │                                              │        │
│               │                                              │        │
│               │                                              │        │
│               ├──────────────────────────────────────────────┤        │
│               │ QUICK ACTIONS                               │        │
├───────────────┴──────────────────────────────────────────────┴────────┤
│ STATUS BAR                                                          │
└──────────────────────────────────────────────────────────────────────┘

```

---

# Distribución

Sidebar

20%

Dashboard

60%

Panel derecho

20%

Nunca:

10 / 80 / 10

Porque desperdicia espacio.

---

# Header

Altura:

64px

Contiene:

Logo

Empresa

Buscador

Breadcrumb

Notificaciones

Usuario

No contiene:

Cards

Banners

Texto gigante

Marketing

---

# KPI Row

Primera fila.

Siempre visible.

Altura aproximada:

120px

Debe responder inmediatamente:

Ventas

Cotizaciones

Proyectos

Facturación

Rentabilidad

Requerimientos

Tickets

Producción

---

# Cantidad

Entre

4

y

8 KPIs

Nunca:

15 KPIs

Nunca:

2 KPIs gigantes.

---

# KPI Card

Debe contener:

Título

Valor

Comparación

Tendencia

Mini indicador

Ejemplo

```

Ventas del Mes

$ 385.000.000

▲ +12%

vs mes anterior

```

No:

```

VENTAS

385

```

---

# Información secundaria

Debe ocupar máximo

20%

del espacio.

Nunca competir con el valor principal.

---

# Indicadores

Usar

▲

▼

●

Nunca emojis.

---

# Dashboard Grid

Después de KPIs.

Compuesto por widgets.

Cada widget responde una pregunta.

---

# Grid

2 columnas

o

3 columnas

dependiendo del ancho.

Nunca una columna enorme.

---

# Widget

Debe tener:

Título

Descripción corta

Acciones

Contenido

Estado

---

# Encabezado del Widget

Ejemplo

```

Ventas por Región

Últimos 30 días

[Exportar]

```

---

# Acciones

Siempre arriba derecha.

Nunca abajo.

---

# Tamaños

Pequeño

Mediano

Grande

XL

No tamaños arbitrarios.

---

# Widgets obligatorios

Ventas

Cotizaciones

Pipeline

Clientes

Facturación

Proyectos

Requerimientos

Producción

Inventario

Alertas

Calendario

Actividad

---

# Widgets prohibidos

Frases motivacionales.

Imagen gigante.

Banner.

Hero.

Texto de bienvenida enorme.

Avatar gigante.

"Bienvenido Juan."

No aporta valor.

---

# Widget de Ventas

Pregunta:

¿Cómo venden mis comerciales?

Debe mostrar:

Ventas

Meta

Cumplimiento

Ranking

Variación

---

# Widget Pipeline

Pregunta:

¿Dónde se atascan las oportunidades?

Debe mostrar:

Embudo

Conversión

Monto

Tiempo promedio

---

# Widget Producción

Pregunta:

¿Qué está fabricándose?

Debe mostrar:

Orden

Estado

Responsable

Fecha

Retraso

---

# Widget Requerimientos

Pregunta:

¿Qué necesita atención?

Debe mostrar:

Urgentes

En progreso

Pendientes

Vencidos

---

# Widget Inventario

Pregunta:

¿Qué falta?

Debe mostrar:

Stock bajo

Reservado

Disponible

Compras pendientes

---

# Widget Facturación

Pregunta:

¿Cuánto se ha facturado?

Debe mostrar:

COP

USD

Cobrado

Pendiente

---

# Widget Actividad

Pregunta:

¿Qué ocurrió recientemente?

Debe mostrar:

Últimas acciones

Usuario

Hora

Entidad

No más de 20 registros.

---

# Widget Calendario

Pregunta:

¿Qué vence hoy?

Debe mostrar:

Reuniones

Mantenimientos

Entregas

Recordatorios
