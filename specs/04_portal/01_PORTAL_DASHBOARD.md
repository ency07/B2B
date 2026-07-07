# PORTAL DASHBOARD — Resumen Ejecutivo del Cliente

## Filosofía

El dashboard del cliente NO muestra todo. Muestra **lo que importa para él**.

Debe responder en 3 segundos:
- ¿Tengo algo pendiente de pagar?
- ¿En qué estado está mi proyecto?
- ¿Tengo una cotización esperando mi aprobación?
- ¿Hay algo nuevo?

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ [Greeting]                                                           │
│ Buenos días, Juan.                                                    │
│                                                                      │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                    │
│ │Proyecto │ │Cotiza-  │ │Factura  │ │Tickets  │                    │
│ │Activo   │ │ción     │ │Pendiente│ │Abiertos │                    │
│ │    1    │ │Pendiente│ │$45.000k │ │    0    │                    │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘                    │
│                                                                      │
│ ┌─────────────────────────────┐ ┌─────────────────────────────┐     │
│ │ Proyecto en Curso           │ │ Acción Requerida            │     │
│ │                             │ │                             │     │
│ │ [Progress bar]              │ │ ⚡ Cotización COT-0042      │     │
│ │ OT-0018 — Instalación       │ │   esperando tu aprobación   │     │
│ │ 65% completado              │ │                             │     │
│ │                             │ │ 💰 Factura FAC-0089         │     │
│ │ Próximo hito: Pruebas       │ │   $45.000.000 — Vence hoy  │     │
│ │ 15 Feb 2025                 │ │                             │     │
│ └─────────────────────────────┘ └─────────────────────────────┘     │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ Actividad Reciente                                            │    │
│ │                                                               │    │
│ │ ● Hoy     Ingeniero asignado a tu proyecto      Ver →        │    │
│ │ ● Ayer    Cotización COT-0042 enviada           Ver →        │    │
│ │ ● 3 días  Factura FAC-0088 pagada               Ver →        │    │
│ └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Greeting

```
<div class="mb-8">
  <h1 class="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">
    Buenos días, {user.firstName}
  </h1>
  <p class="text-slate-500 mt-1">
    Aquí tienes un resumen de tu cuenta
  </p>
</div>
```

---

## Summary Cards (4 cards)

```
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <!-- Proyecto Activo -->
  <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
    <div class="flex items-center justify-between mb-3">
      <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
        <FolderKanban class="w-5 h-5 text-blue-600" />
      </div>
      {activeProjects > 0 && (
        <span class="w-2 h-2 rounded-full bg-blue-500" />
      )}
    </div>
    <p class="text-2xl font-semibold text-slate-900">{activeProjects}</p>
    <p class="text-sm text-slate-500 mt-0.5">
      {activeProjects === 1 ? 'Proyecto activo' : 'Proyectos activos'}
    </p>
  </div>

  <!-- Cotización Pendiente -->
  <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
    <div class="flex items-center justify-between mb-3">
      <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
        <FileText class="w-5 h-5 text-amber-600" />
      </div>
      {pendingQuotes > 0 && (
        <span class="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold flex items-center justify-center">
          {pendingQuotes}
        </span>
      )}
    </div>
    <p class="text-2xl font-semibold text-slate-900">{pendingQuotes}</p>
    <p class="text-sm text-slate-500 mt-0.5">
      {pendingQuotes === 1 ? 'Cotización pendiente' : 'Cotizaciones pendientes'}
    </p>
  </div>

  <!-- Factura Pendiente -->
  <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
    <div class="flex items-center justify-between mb-3">
      <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
        <Receipt class="w-5 h-5 text-red-600" />
      </div>
      {pendingInvoices > 0 && (
        <span class="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-semibold flex items-center justify-center">
          {pendingInvoices}
        </span>
      )}
    </div>
    <p class="text-2xl font-semibold text-slate-900">{pendingAmount}</p>
    <p class="text-sm text-slate-500 mt-0.5">Por pagar</p>
  </div>

  <!-- Tickets Abiertos -->
  <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
    <div class="flex items-center justify-between mb-3">
      <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
        <MessageSquare class="w-5 h-5 text-slate-600" />
      </div>
    </div>
    <p class="text-2xl font-semibold text-slate-900">{openTickets}</p>
    <p class="text-sm text-slate-500 mt-0.5">
      {openTickets === 1 ? 'Ticket abierto' : 'Tickets abiertos'}
    </p>
  </div>
</div>
```

---

## Grid Principal (2 columnas)

```
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  <!-- Proyecto en Curso -->
  <ProjectProgressCard />

  <!-- Acción Requerida -->
  <ActionRequiredCard />
</div>
```

### Project Progress Card

```
<div class="bg-white border border-slate-200 rounded-xl shadow-card">
  <div class="p-6 border-b border-slate-100">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-900">Proyecto en Curso</h3>
      <a class="text-sm text-primary hover:underline">Ver detalle →</a>
    </div>
  </div>
  <div class="p-6">
    <div class="flex items-center gap-3 mb-4">
      <span class="font-mono text-sm text-slate-500">{project.code}</span>
      <Badge variant="info">{project.status}</Badge>
    </div>
    <h4 class="text-lg font-semibold text-slate-900 mb-4">{project.name}</h4>

    <!-- Progress bar -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-slate-500">Progreso</span>
        <span class="text-sm font-semibold text-slate-900">{project.progress}%</span>
      </div>
      <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div class="h-full bg-primary rounded-full transition-all duration-500"
             style={{ width: `${project.progress}%` }} />
      </div>
    </div>

    <!-- Próximo hito -->
    <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
      <Calendar class="w-4 h-4 text-slate-400" />
      <div>
        <p class="text-xs text-slate-500">Próximo hito</p>
        <p class="text-sm font-medium text-slate-700">{nextMilestone}</p>
      </div>
      <span class="ml-auto text-xs text-slate-500">{milestoneDate}</span>
    </div>
  </div>
</div>
```

### Action Required Card

```
<div class="bg-white border border-slate-200 rounded-xl shadow-card">
  <div class="p-6 border-b border-slate-100">
    <h3 class="text-sm font-semibold text-slate-900">Acción Requerida</h3>
  </div>
  <div class="divide-y divide-slate-100">
    {actions.map(action => (
      <div class="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
        <div class={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${action.iconBg}`}>
          <action.icon class={`w-4 h-4 ${action.iconColor}`} />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-slate-900">{action.title}</p>
          <p class="text-xs text-slate-500 mt-0.5">{action.description}</p>
        </div>
        <Button size="sm" variant={action.variant}>{action.cta}</Button>
      </div>
    ))}
  </div>
</div>
```

### Acciones posibles

| Acción | Icono | Color | CTA |
|---|---|---|---|
| Cotización esperando aprobación | FileText | amber | "Revisar" |
| Factura vencida | Receipt | red | "Pagar ahora" |
| Factura por vencer | Receipt | amber | "Ver detalle" |
| Documento disponible | Download | blue | "Descargar" |
| Mensaje nuevo | MessageCircle | blue | "Ver" |

---

## Actividad Reciente

```
<div class="bg-white border border-slate-200 rounded-xl shadow-card">
  <div class="p-6 border-b border-slate-100">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold text-slate-900">Actividad Reciente</h3>
      <a class="text-sm text-primary hover:underline">Ver todo →</a>
    </div>
  </div>
  <div class="divide-y divide-slate-100">
    {activities.map(activity => (
      <div class="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
        <div class={`w-2 h-2 rounded-full shrink-0 ${activity.dotColor}`} />
        <div class="flex-1 min-w-0">
          <p class="text-sm text-slate-700">{activity.description}</p>
          <p class="text-xs text-slate-400 mt-0.5">{activity.relativeTime}</p>
        </div>
        <a class="text-sm text-primary hover:underline shrink-0">Ver →</a>
      </div>
    ))}
  </div>
</div>
```

---

## Estados del Dashboard

### Sin proyectos

```
<div class="flex flex-col items-center justify-center py-20 text-center">
  <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
    <FolderKanban class="w-8 h-8 text-slate-400" />
  </div>
  <h3 class="text-lg font-semibold text-slate-900">Bienvenido a tu portal</h3>
  <p class="text-sm text-slate-500 mt-2 max-w-sm">
    Aquí podrás seguir el estado de tus proyectos, revisar cotizaciones y pagar facturas.
  </p>
</div>
```

### Sin acciones pendientes

```
<div class="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
  <CheckCircle class="w-5 h-5 text-green-600" />
  <p class="text-sm text-green-700 font-medium">Todo al día</p>
  <p class="text-sm text-green-600">No tienes acciones pendientes</p>
</div>
```
