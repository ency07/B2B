# DASHBOARD EJECUTIVO

## Filosofía

El Dashboard NO es una pantalla bonita. Es una **pantalla para tomar decisiones**.

Debe responder en menos de 5 segundos:
- ¿Qué está pasando?
- ¿Qué necesita atención?
- ¿Qué genera dinero?
- ¿Qué está atrasado?
- ¿Qué está en riesgo?

Si un widget no cambia ninguna decisión: **no existe**.

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ HEADER                                                       USER    │
├───────────────┬──────────────────────────────────────────────┬────────┤
│               │                                              │        │
│               │ KPI ROW (6 cards)                            │ ALERTS │
│               │                                              │ PANEL  │
│               ├──────────────────────────────────────────────┤        │
│               │                                              │        │
│ SIDEBAR       │ DASHBOARD GRID                              │        │
│               │                                              │        │
│               │ [Ventas]              [Pipeline]             │        │
│               │ [OTs Activas]         [Inventario]           │        │
│               │ [Facturación]         [Producción]           │        │
│               │                                              │        │
│               ├──────────────────────────────────────────────┤        │
│               │ ACTIVIDAD RECIENTE + QUICK ACTIONS           │        │
├───────────────┴──────────────────────────────────────────────┴────────┤
│ STATUS BAR                                                          │
└──────────────────────────────────────────────────────────────────────┘
```

**Distribución:** Sidebar 20% | Dashboard 60% | Panel derecho 20%

---

## KPI Row

6 cards compactas, siempre visibles:

| KPI | Valor | Trend | Icono |
|---|---|---|---|
| Ventas del Mes | $385.000.000 | ▲ +12% | DollarSign |
| Cotizaciones Activas | 24 | ▲ +3 | FileText |
| OTs en Ejecución | 18 | ● 0% | Wrench |
| Facturación Pendiente | $120.000.000 | ▼ -5% | Receipt |
| Requerimientos Urgentes | 7 | ▲ +2 | AlertTriangle |
| Cumplimiento SLA | 94% | ▲ +3% | Target |

```
<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
  {kpiCards}
</div>
```

---

## Widgets del Dashboard

### Widget de Ventas

**Pregunta:** ¿Cómo venden mis comerciales?

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
  <div class="flex items-center justify-between p-4 pb-3 border-b border-zinc-800/40">
    <div>
      <h3 class="text-sm font-semibold text-zinc-100">Ventas por Comercial</h3>
      <p class="text-xs text-zinc-500">Últimos 30 días</p>
    </div>
    <Button variant="ghost" size="icon-sm">
      <MoreHorizontal class="w-4 h-4" />
    </Button>
  </div>
  <div class="p-4">
    <BarChart data={salesData} />
  </div>
  <div class="px-4 py-3 border-t border-zinc-800/40 flex items-center justify-between">
    <span class="text-xs text-zinc-500">Meta: $500M</span>
    <a class="text-xs text-primary hover:underline">Ver detalle →</a>
  </div>
</div>
```

### Widget Pipeline

**Pregunta:** ¿Dónde se atascan las oportunidades?

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
  <div class="flex items-center justify-between p-4 pb-3 border-b border-zinc-800/40">
    <div>
      <h3 class="text-sm font-semibold text-zinc-100">Pipeline Comercial</h3>
      <p class="text-xs text-zinc-500">Embudo de conversión</p>
    </div>
  </div>
  <div class="p-4 space-y-3">
    {pipelineStages.map(stage => (
      <div class="flex items-center gap-3">
        <span class="text-xs text-zinc-400 w-24">{stage.name}</span>
        <div class="flex-1 h-6 rounded bg-zinc-800/40 overflow-hidden">
          <div class="h-full bg-primary/60 rounded" style={{ width: `${stage.percentage}%` }} />
        </div>
        <span class="font-mono text-xs text-zinc-300 w-16 text-right">{stage.count}</span>
        <span class="font-mono text-xs text-zinc-500 w-20 text-right">{stage.value}</span>
      </div>
    ))}
  </div>
</div>
```

### Widget OTs Activas

**Pregunta:** ¿Qué trabajos están en ejecución?

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
  <div class="flex items-center justify-between p-4 pb-3 border-b border-zinc-800/40">
    <h3 class="text-sm font-semibold text-zinc-100">Órdenes de Trabajo</h3>
    <Badge variant="info">18 activas</Badge>
  </div>
  <div class="divide-y divide-zinc-800/40">
    {jobs.slice(0, 5).map(job => (
      <div class="flex items-center justify-between px-4 py-2.5 hover:bg-zinc-800/20 transition-colors cursor-pointer">
        <div class="flex items-center gap-3">
          <span class="font-mono text-xs text-zinc-500">{job.code}</span>
          <span class="text-sm text-zinc-300">{job.client}</span>
        </div>
        <div class="flex items-center gap-3">
          <Badge variant={job.statusVariant}>{job.status}</Badge>
          <span class="text-xs text-zinc-500">{job.dueDate}</span>
        </div>
      </div>
    ))}
  </div>
  <div class="px-4 py-3 border-t border-zinc-800/40">
    <a class="text-xs text-primary hover:underline">Ver todas las OTs →</a>
  </div>
</div>
```

### Widget Facturación

**Pregunta:** ¿Cuánto se ha facturado y cuánto falta por cobrar?

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
  <div class="flex items-center justify-between p-4 pb-3 border-b border-zinc-800/40">
    <h3 class="text-sm font-semibold text-zinc-100">Facturación</h3>
  </div>
  <div class="p-4">
    <div class="grid grid-cols-3 gap-4 mb-4">
      <div>
        <p class="text-xs text-zinc-500">Emitida</p>
        <p class="font-display text-xl font-bold text-zinc-100 tracking-tighter">$420M</p>
      </div>
      <div>
        <p class="text-xs text-zinc-500">Cobrada</p>
        <p class="font-display text-xl font-bold text-green-400 tracking-tighter">$300M</p>
      </div>
      <div>
        <p class="text-xs text-zinc-500">Pendiente</p>
        <p class="font-display text-xl font-bold text-amber-400 tracking-tighter">$120M</p>
      </div>
    </div>
    <AreaChart data={billingData} />
  </div>
</div>
```

### Widget de Alertas SLA

**Pregunta:** ¿Qué está en riesgo?

```
<div class="rounded-xl border border-red-900/40 bg-red-950/10 overflow-hidden">
  <div class="flex items-center justify-between p-4 pb-3 border-b border-red-900/20">
    <div class="flex items-center gap-2">
      <AlertTriangle class="w-4 h-4 text-red-400" />
      <h3 class="text-sm font-semibold text-zinc-100">Alertas SLA</h3>
    </div>
    <Badge variant="danger">7 urgentes</Badge>
  </div>
  <div class="divide-y divide-red-900/20">
    {alerts.map(alert => (
      <div class="flex items-center justify-between px-4 py-2.5">
        <div class="flex items-center gap-3">
          <div class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span class="text-sm text-zinc-300">{alert.title}</span>
        </div>
        <span class="font-mono text-xs text-red-400">{alert.remaining}</span>
      </div>
    ))}
  </div>
</div>
```

### Widget Actividad Reciente

**Pregunta:** ¿Qué ocurrió recientemente?

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
  <div class="p-4 pb-3 border-b border-zinc-800/40">
    <h3 class="text-sm font-semibold text-zinc-100">Actividad Reciente</h3>
  </div>
  <div class="p-4">
    <ActivityTimeline events={recentEvents} maxItems={10} />
  </div>
</div>
```

---

## Panel Derecho (Alertas)

Sticky, siempre visible. Contiene:

| Sección | Contenido |
|---|---|
| Alertas SLA | Requerimientos/OTs en riesgo con countdown |
| Vencimientos | Facturas por vencer, garantías que expiran |
| Acciones pendientes | Aprobaciones, cotizaciones por enviar |
| Recordatorios | Reuniones, visitas técnicas programadas |

```
<div class="space-y-4">
  <!-- Alertas SLA -->
  <WidgetAlertasSLA />

  <!-- Vencimientos -->
  <WidgetVencimientos />

  <!-- Acciones Pendientes -->
  <WidgetAccionesPendientes />
</div>
```

---

## Dashboard Grid

```
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
  <!-- Row 1 -->
  <WidgetVentas />
  <WidgetPipeline />

  <!-- Row 2 -->
  <WidgetOTsActivas />
  <WidgetFacturacion />

  <!-- Row 3 -->
  <WidgetProduccion />
  <WidgetInventario />
</div>

<!-- Full width -->
<div class="mb-6">
  <WidgetActividadReciente />
</div>
```

---

## Widgets prohibidos

- Frases motivacionales ("¡Buen día, Juan!")
- Imágenes gigantes decorativas
- Banners de bienvenida
- Avatares gigantes
- Gráficos de dona sin contexto
- KPIs sin tendencia ni comparación
- Tarjetas sin acción drill-down
- Iconos decorativos
