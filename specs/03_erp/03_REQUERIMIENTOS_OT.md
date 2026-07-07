# REQUERIMIENTOS + ÓRDENES DE TRABAJO

## REQUERIMIENTOS — El Corazón Operativo

### Filosofía

Los Requerimientos son el corazón operativo del ERP. Todo inicia aquí.

Desde un requerimiento pueden nacer: Diagnósticos, Visitas técnicas, Ingeniería, Cotizaciones, Órdenes de trabajo, Producción, Compras, Instalaciones, Facturación.

Nunca debe verse como una simple tabla. Debe verse como un **expediente técnico**.

---

### Layout

```
HEADER (código + estado + prioridad + cliente + botones rápidos)
↓
RESUMEN EJECUTIVO (cards compactas)
↓
TIMELINE SUPERIOR (flujo de estados visual)
↓
VISTA PRINCIPAL (70% info + 30% panel inteligente)
↓
TABS (Detalles, Ingeniería, Archivos, Historial)
```

### Header del Requerimiento

```
<div class="flex flex-col gap-4 mb-6">
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <h1 class="text-2xl font-bold text-zinc-100 font-mono">{code}</h1>
      <Badge variant={statusVariant}>{status}</Badge>
      <Badge variant={priorityVariant}>{priority}</Badge>
    </div>
    <div class="flex items-center gap-2">
      <Button variant="outline" size="sm">Editar</Button>
      <Button variant="outline" size="sm">Asignar</Button>
      <Button variant="outline" size="sm">Generar Diagnóstico</Button>
      <Button variant="outline" size="sm">Crear Cotización</Button>
      <Button variant="outline" size="sm">Programar Visita</Button>
      <Button variant="outline" size="sm">Adjuntar</Button>
      <Button variant="outline" size="sm">Imprimir</Button>
      <DropdownMenu>
        <Button variant="ghost" size="icon-sm"><MoreHorizontal /></Button>
      </DropdownMenu>
    </div>
  </div>
</div>
```

### Resumen Ejecutivo

```
<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
  <div class="rounded-lg border border-zinc-800/40 bg-zinc-900/20 p-3">
    <p class="text-[10px] text-zinc-500 uppercase">Cliente</p>
    <p class="text-sm font-medium text-zinc-100 truncate">{client}</p>
  </div>
  <div class="rounded-lg border border-zinc-800/40 bg-zinc-900/20 p-3">
    <p class="text-[10px] text-zinc-500 uppercase">Servicio</p>
    <p class="text-sm font-medium text-zinc-100 truncate">{service}</p>
  </div>
  <div class="rounded-lg border border-zinc-800/40 bg-zinc-900/20 p-3">
    <p class="text-[10px] text-zinc-500 uppercase">Responsable</p>
    <p class="text-sm font-medium text-zinc-100 truncate">{owner}</p>
  </div>
  <div class="rounded-lg border border-zinc-800/40 bg-zinc-900/20 p-3">
    <p class="text-[10px] text-zinc-500 uppercase">SLA Restante</p>
    <p class="font-mono text-sm font-bold text-{slaColor}">{slaTime}</p>
  </div>
  <div class="rounded-lg border border-zinc-800/40 bg-zinc-900/20 p-3">
    <p class="text-[10px] text-zinc-500 uppercase">Costo Estimado</p>
    <p class="font-mono text-sm font-medium text-zinc-100">{estimatedCost}</p>
  </div>
  <div class="rounded-lg border border-zinc-800/40 bg-zinc-900/20 p-3">
    <p class="text-[10px] text-zinc-500 uppercase">Progreso</p>
    <div class="flex items-center gap-2">
      <div class="flex-1 h-1.5 rounded-full bg-zinc-800">
        <div class="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
      </div>
      <span class="font-mono text-xs text-zinc-300">{progress}%</span>
    </div>
  </div>
</div>
```

### Timeline Superior (Flujo de Estados)

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 mb-6">
  <div class="flex items-center gap-0 overflow-x-auto">
    {steps.map((step, i) => (
      <React.Fragment key={step.id}>
        <div class="flex flex-col items-center min-w-[100px]">
          <div class={`w-8 h-8 rounded-full flex items-center justify-center ${
            step.status === 'completed' ? 'bg-primary text-white' :
            step.status === 'active' ? 'bg-primary text-white ring-4 ring-primary/20' :
            'bg-zinc-800 text-zinc-500'
          }`}>
            {step.status === 'completed' ? <Check class="w-4 h-4" /> : step.number}
          </div>
          <span class={`text-[10px] mt-1 text-center ${
            step.status === 'completed' ? 'text-zinc-100' :
            step.status === 'active' ? 'text-primary font-semibold' :
            'text-zinc-500'
          }`}>{step.label}</span>
          {step.date && (
            <span class="font-mono text-[9px] text-zinc-600 mt-0.5">{step.date}</span>
          )}
        </div>
        {i < steps.length - 1 && (
          <div class={`flex-1 h-px mx-2 ${
            step.status === 'completed' ? 'bg-primary' : 'bg-zinc-800'
          }`} />
        )}
      </React.Fragment>
    ))}
  </div>
</div>
```

### Vista Principal (70/30)

```
<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <!-- Columna Principal (70%) -->
  <div class="lg:col-span-2 space-y-6">
    <!-- Descripción -->
    <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6">
      <h3 class="text-sm font-semibold text-zinc-100 mb-3">Descripción</h3>
      <p class="text-sm text-zinc-300 leading-relaxed">{description}</p>
    </div>

    <!-- Datos Técnicos -->
    <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6">
      <h3 class="text-sm font-semibold text-zinc-100 mb-4">Datos Técnicos</h3>
      <div class="grid grid-cols-2 gap-4">
        {techData.map(item => (
          <div class="flex items-center justify-between py-2 border-b border-zinc-800/30">
            <span class="text-xs text-zinc-500">{item.label}</span>
            <span class="font-mono text-xs text-zinc-100">{item.value}</span>
          </div>
        ))}
      </div>
    </div>

    <!-- Tabs de detalle -->
    <Tabs defaultValue="engineering">
      <TabsList class="bg-zinc-800/40">
        <TabsTrigger value="engineering">Ingeniería</TabsTrigger>
        <TabsTrigger value="files">Archivos</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="audit">Auditoría</TabsTrigger>
      </TabsList>
      <TabsContent value="engineering">{engineeringContent}</TabsContent>
      <TabsContent value="files">{filesContent}</TabsContent>
      <TabsContent value="timeline">{timelineContent}</TabsContent>
      <TabsContent value="audit">{auditContent}</TabsContent>
    </Tabs>
  </div>

  <!-- Panel Derecho (30%) -->
  <div class="space-y-4">
    <!-- Cliente -->
    <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
      <h4 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Cliente</h4>
      <div class="flex items-center gap-3">
        <Avatar size="sm" />
        <div>
          <p class="text-sm font-medium text-zinc-100">{client.name}</p>
          <p class="text-xs text-zinc-500">{client.company}</p>
        </div>
      </div>
      <div class="mt-3 space-y-2">
        <a class="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-100">
          <Phone class="w-3 h-3" /> {client.phone}
        </a>
        <a class="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-100">
          <Mail class="w-3 h-3" /> {client.email}
        </a>
      </div>
    </div>

    <!-- Checklist -->
    <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
      <h4 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Próximas Actividades</h4>
      <div class="space-y-2">
        {checklist.map(item => (
          <div class="flex items-center gap-2">
            <Checkbox checked={item.done} />
            <span class={`text-xs ${item.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>

    <!-- Archivos recientes -->
    <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
      <h4 class="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Archivos</h4>
      <div class="space-y-2">
        {files.map(file => (
          <a class="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800/40 transition-colors">
            <FileIcon type={file.type} class="w-4 h-4" />
            <span class="text-xs text-zinc-300 truncate flex-1">{file.name}</span>
            <span class="font-mono text-[10px] text-zinc-500">{file.size}</span>
          </a>
        ))}
      </div>
    </div>
  </div>
</div>
```

### Lista de Requerimientos

| Columna | Alineación | Tipo |
|---|---|---|
| Código | Izquierda | font-mono |
| Cliente | Izquierda | Texto |
| Servicio | Centro | Badge |
| Estado | Centro | Badge semántico |
| Prioridad | Centro | Badge (Urgente/Alta/Media/Baja) |
| Responsable | Izquierda | Avatar |
| Fecha Creación | Centro | Fecha |
| Fecha Compromiso | Centro | Fecha |
| Progreso | Derecha | Barra + % |
| SLA | Centro | Countdown |
| Acciones | Derecha | Icon buttons |

### Vistas disponibles

| Vista | Icono | Uso |
|---|---|---|
| Tabla | Table | Vista principal, alta densidad |
| Kanban | Kanban | Agrupado por estado |
| Calendario | Calendar | Por fecha compromiso |
| Timeline | Gantt | Timeline de ejecución |
| Mapa | Map | Por ubicación del cliente |

---

## OT — ÓRDENES DE TRABAJO

### Filosofía

La OT NO es una lista de tareas. Es un **expediente de ejecución**.

Debe responder:
- ¿Qué se está ejecutando?
- ¿Quién es responsable?
- ¿Qué materiales se necesitan?
- ¿Cuánto cuesta?
- ¿Cuándo vence?
- ¿Qué falta?

---

### Layout

```
HEADER (código + estado + cliente + acciones)
↓
RESUMEN EJECUTIVO
↓
TIMELINE DE ESTADOS
↓
VISTA 70/30 (Info + Panel)
↓
TABS (Planificación, Materiales, Checklist, Costos, Timeline, Auditoría)
```

### Estados de OT

| Estado | Color | Badge |
|---|---|---|
| OT_PROGRAMADA | `bg-blue-950/50 text-blue-400` | info |
| OT_EN_EJECUCION | `bg-green-950/50 text-green-400` | success |
| OT_PAUSADA | `bg-amber-950/50 text-amber-400` | warning |
| OT_EN_VERIFICACION | `bg-purple-950/50 text-purple-400` | neutral |
| OT_FINALIZADA | `bg-green-950/50 text-green-400` | success |
| OT_CANCELADA | `bg-red-950/50 text-red-400` | danger |

### Tabla de OTs

| Columna | Alineación | Tipo |
|---|---|---|
| Código | Izquierda | font-mono |
| Cliente | Izquierda | Texto |
| Proyecto | Izquierda | Texto |
| Responsable | Izquierda | Avatar |
| Inicio | Centro | Fecha |
| Entrega | Centro | Fecha |
| Estado | Centro | Badge |
| Prioridad | Centro | Badge |
| Avance | Derecha | Barra + % |
| Costo | Derecha | font-mono |
| Acciones | Derecha | Icon buttons |

### Tab de Planificación

```
<div class="space-y-4">
  <!-- Gantt simplificado -->
  <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
    <h3 class="text-sm font-semibold text-zinc-100 mb-4">Planificación</h3>
    <div class="space-y-2">
      {tasks.map(task => (
        <div class="flex items-center gap-3">
          <span class="text-xs text-zinc-400 w-32">{task.name}</span>
          <div class="flex-1 h-6 bg-zinc-800/40 rounded relative">
            <div
              class="absolute h-full rounded bg-primary/60"
              style={{ left: `${task.start}%`, width: `${task.duration}%` }}
            />
          </div>
          <span class="font-mono text-xs text-zinc-500 w-20 text-right">{task.duration}d</span>
        </div>
      ))}
    </div>
  </div>
</div>
```

### Tab de Materiales

| Columna | Alineación | Tipo |
|---|---|---|
| Material | Izquierda | Texto |
| Cantidad Requerida | Derecha | font-mono |
| Cantidad Disponible | Derecha | font-mono |
| Unidad | Centro | Texto |
| Costo Unit. | Derecha | font-mono |
| Subtotal | Derecha | font-mono |
| Estado | Centro | Badge (Disponible/Reservado/Faltante) |
| Proveedor | Izquierda | Texto |

### Tab de Checklist

```
<div class="space-y-3">
  {checklistGroups.map(group => (
    <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
      <h4 class="text-sm font-semibold text-zinc-100 mb-3">{group.title}</h4>
      <div class="space-y-2">
        {group.items.map(item => (
          <div class="flex items-center gap-3 py-1">
            <Checkbox checked={item.done} />
            <span class={`text-sm flex-1 ${item.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>
              {item.label}
            </span>
            {item.responsible && (
              <Avatar size="xs" name={item.responsible} />
            )}
            {item.date && (
              <span class="font-mono text-xs text-zinc-500">{item.date}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
```

### Tab de Costos

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6">
  <h3 class="text-sm font-semibold text-zinc-100 mb-4">Panel Financiero</h3>
  <div class="space-y-3">
    {costItems.map(item => (
      <div class="flex items-center justify-between py-2 border-b border-zinc-800/30">
        <span class="text-sm text-zinc-400">{item.label}</span>
        <span class="font-mono text-sm text-zinc-100">{item.value}</span>
      </div>
    ))}
    <div class="flex items-center justify-between py-3 border-t-2 border-zinc-700">
      <span class="text-sm font-semibold text-zinc-100">Costo Total</span>
      <span class="font-mono text-lg font-bold text-zinc-100">{totalCost}</span>
    </div>
    <div class="flex items-center justify-between py-2">
      <span class="text-sm text-zinc-400">Margen</span>
      <span class={`font-mono text-sm font-bold ${marginColor}`}>{margin}</span>
    </div>
  </div>
</div>
```

### Reglas

- Toda OT vinculada a un Requerimiento.
- Toda OT vinculada a una Cotización.
- Nunca OT sin responsable.
- Nunca OT sin fecha compromiso.
- Nunca fabricar sin ingeniería aprobada.
- Nunca fabricar sin materiales disponibles.
- Toda modificación genera entrada en auditoría.
- Toda OT debe poder reconstruirse completamente años después.
