# Blueprint — Producción

---

# Filosofía

Producción NO es una lista de órdenes.

Es un Centro de Control Industrial.

Debe permitir responder inmediatamente:

• ¿Qué se está fabricando?
• ¿Qué está atrasado?
• ¿Quién trabaja en ello?
• ¿Qué falta?
• ¿Qué materiales faltan?
• ¿Qué máquina está ocupada?
• ¿Qué orden está detenida?
• ¿Qué riesgo existe?

Toda la información debe ser operacional.

Nunca decorativa.

---

# Objetivos

Permitir controlar en tiempo real:

• Órdenes
• Fabricación
• Recursos
• Operarios
• Máquinas
• Materiales
• Calidad
• Entregas

Todo desde un único centro.

---

# Layout General

```

HEADER

↓

KPIs

↓

Calendario Producción

↓

Gantt

↓

Órdenes

↓

Recursos

↓

Máquinas

↓

Calidad

↓

Actividad

```

---

# HEADER

Debe mostrar

Planta

Área

Supervisor

Turno

Fecha

Producción del día

Estado General

Botones

Nueva Orden

Programar

Replanificar

Asignar Recursos

Reporte

Exportar

---

# KPIs

Cards compactas.

Nunca gigantes.

Mostrar

Órdenes Activas

Órdenes Terminadas

Órdenes Atrasadas

Producción del Día

Horas Hombre

Máquinas Activas

Máquinas Detenidas

Eficiencia

Cumplimiento SLA

Calidad

Retrabajos

Incidentes

---

Cada KPI

Valor

Variación

Meta

Indicador

---

# Dashboard Principal

Distribución

```

70%

Órdenes + Gantt

30%

Panel Inteligente

```

---

# Lista de Órdenes

Tabla empresarial.

Columnas

Orden

Cliente

Proyecto

Producto

Cantidad

Responsable

Inicio

Entrega

Estado

Prioridad

Avance

Acciones

---

Acciones

Abrir

Editar

Asignar

Programar

Detener

Reanudar

Cerrar

Duplicar

Imprimir

---

Filtros

Estado

Supervisor

Operario

Proyecto

Cliente

Prioridad

Máquina

Fecha

---

Agrupaciones

Por máquina

Por supervisor

Por prioridad

Por estado

Por proyecto

Por cliente

---

# Vista Detalle de Orden

Debe parecer una hoja de producción.

---

Resumen

↓

Productos

↓

Materiales

↓

Operaciones

↓

Recursos

↓

Calidad

↓

Historial

---

Mostrar

Cliente

Proyecto

Cotización

Ingeniería

Plano

Versión

Prioridad

Responsable

Tiempo

Costo

Estado

---

# Planeación

Vista calendario.

Mostrar

Día

Semana

Mes

---

Cada bloque

Color por estado

Responsable

Máquina

Duración

Prioridad

---

Acciones

Mover

Redimensionar

Duplicar

Asignar

Cancelar

---

Drag & Drop.

---

# Gantt

Uno de los módulos principales.

Debe ocupar gran parte de la pantalla.

---

Mostrar

Orden

↓

Diseño

↓

Compras

↓

Corte

↓

Soldadura

↓

Pintura

↓

Ensamble

↓

Pruebas

↓

Entrega

---

Cada tarea

Inicio

Fin

Duración

Responsable

Estado

Dependencias

---

Colores

Verde

Completado

Azul

En proceso

Gris

Pendiente

Rojo

Retraso

Amarillo

Bloqueado

---

Nunca un Gantt estático.

---

# Recursos

Vista tipo tablero.

Mostrar

Operarios

Ingenieros

Máquinas

Herramientas

Vehículos

Equipos

---

Cada recurso

Disponibilidad

Carga

Turno

Especialidad

Estado

Horas asignadas

---

Semáforo

Disponible

Ocupado

Mantenimiento

Ausente

---

# Máquinas

Panel específico.

Mostrar

Nombre

Código

Área

Estado

Horas uso

Próximo mantenimiento

Operario

Eficiencia

---

Indicadores

OEE

Disponibilidad

Rendimiento

Calidad

Paradas

---

# Materiales

Tabla integrada.

Columnas

Material

Cantidad requerida

Cantidad disponible

Reservado

Proveedor

Estado

Entrega estimada

---

Alertas

Sin stock

Stock crítico

Entrega retrasada

Proveedor pendiente

---

Nunca esperar hasta producción.

Todo preventivo.

---

# Calidad

Panel independiente.

Debe registrar

Inspecciones

No conformidades

Retrabajos

Aprobaciones

Rechazos

Observaciones

---

Checklist

Dimensiones

Soldadura

Pintura

Balanceo

Acabado

Funcionamiento

Seguridad

---

Resultado

Aprobado

Condicional

Rechazado

---

# Evidencias

Cada orden puede contener

Fotos

Videos

PDF

DWG

DXF

STEP

Firmas

Audios

---

Vista

Galería

Lista

Timeline

---

# Costos Producción

Panel financiero.

Mostrar

Material

Mano de obra

Maquinaria

Indirectos

Desperdicio

Retrabajo

Costo total

Margen esperado

Margen real

---

Actualizar en tiempo real.

---

# Estado de Producción

Flujo

```

Pendiente

↓

Planificada

↓

Liberada

↓

En Producción

↓

Control Calidad

↓

Empaque

↓

Despacho

↓

Finalizada

```

Cada cambio

usuario

fecha

comentario

auditoría

---

# Panel Derecho

Sticky.

Mostrar

Supervisor

Operario

Máquina

Material crítico

Siguiente tarea

Riesgos

Alertas

Checklist

Observaciones

Tiempo restante

---

# Alertas Inteligentes

Material insuficiente

Máquina detenida

Orden atrasada

Operario ausente

Proveedor retrasado

Calidad rechazada

Costo excedido

Entrega comprometida

---

Todas accionables.

Nunca informativas solamente.

---

# Dashboard Ejecutivo Producción

Widgets

Producción por día

Órdenes por estado

Carga por máquina

Carga por operario

OEE

Cumplimiento

Retrabajos

Paradas

Calidad

Entregas

Rentabilidad

Tiempo promedio

---

Cada widget debe responder una pregunta operativa.

Nunca usar gráficas por estética.

---

# Reglas Absolutas

Nunca perder trazabilidad.

Nunca permitir órdenes sin responsable.

Nunca fabricar sin ingeniería aprobada.

Nunca fabricar sin materiales disponibles.

Nunca ocultar retrasos.

Nunca recalcular tiempos manualmente.

Nunca romper relación con cotización.

Nunca romper relación con requerimiento.

Nunca eliminar historial.

Toda modificación debe quedar auditada.

Toda orden debe poder reconstruirse completamente incluso años después.

Toda producción debe estar ligada al expediente técnico del cliente.