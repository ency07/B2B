# ERP BLUEPRINT — Layout Maestro y Arquitectura de Navegación

## Filosofía

El ERP NO es un CRUD. Es un **centro de operaciones industriales**.

Cada pantalla debe responder en menos de 5 segundos:
- ¿Qué está pasando?
- ¿Qué necesita atención?
- ¿Qué acción debo tomar?

El usuario nunca debe preguntarse: "¿Dónde estaba esa información?"

---

## Arquitectura de Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ SIDEBAR  │  HEADER (sticky, blur, react-headroom)                   │
│          │──────────────────────────────────────────────────────────│
│ 256px    │  BREADCRUMB                                                │
│ fijo     │──────────────────────────────────────────────────────────│
│          │                                                            │
│ Desktop  │  PAGE HEADER (título + descripción + acciones)             │
│          │──────────────────────────────────────────────────────────│
│ 80px     │                                                            │
│ colapsado│  WORKSPACE PRINCIPAL                                       │
│          │  (KPIs + Toolbar + Contenido + Panel lateral)              │
│          │                                                            │
│          │──────────────────────────────────────────────────────────│
│          │  STATUS BAR (footer operativo)                             │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Sidebar — Navegación de Módulos

### Estructura

```
<aside class="fixed inset-y-0 left-0 z-30 flex flex-col w-64 border-r border-zinc-800/40 bg-zinc-900/80 backdrop-blur-sm transition-all duration-300">
  <!-- Logo -->
  <div class="h-16 flex items-center px-6 border-b border-zinc-800/40">
    <img src="{tenant.logo}" alt="{tenant.name}" class="h-8" />
  </div>

  <!-- Navegación principal -->
  <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
    <!-- Grupo: Operaciones -->
    <div class="mb-6">
      <p class="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
        Operaciones
      </p>
      {navItems}
    </div>
  </nav>

  <!-- User section -->
  <div class="p-4 border-t border-zinc-800/40">
    <div class="flex items-center gap-3">
      <Avatar size="sm" />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-zinc-100 truncate">{user.name}</p>
        <p class="text-xs text-zinc-500 truncate">{user.role}</p>
      </div>
      <Button variant="ghost" size="icon-sm">
        <Settings class="w-4 h-4 text-zinc-500" />
      </Button>
    </div>
  </div>
</aside>
```

### Módulos de navegación

| Grupo | Módulo | Icono | Ruta |
|---|---|---|---|
| **Operaciones** | Dashboard | LayoutDashboard | /dashboard |
| | CRM | Users | /dashboard/crm |
| | Requerimientos | ClipboardList | /dashboard/requirements |
| | Cotizaciones | FileText | /dashboard/quotes |
| | Órdenes de Trabajo | Wrench | /dashboard/jobs |
| **Operaciones** | Producción | Factory | /dashboard/production |
| | Inventario | Package | /dashboard/inventory |
| | Compras | ShoppingCart | /dashboard/purchases |
| **Finanzas** | Facturación | Receipt | /dashboard/invoices |
| | Pagos | CreditCard | /dashboard/payments |
| **Contenido** | CMS | Globe | /dashboard/cms |
| **Sistema** | Configuración | Settings | /dashboard/settings |

### Estado activo

```
<a class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary border-l-2 border-primary">
  <Icon class="w-5 h-5 shrink-0" />
  <span>{label}</span>
  <span class="ml-auto inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
    {count}
  </span>
</a>
```

### Estado hover

```
<a class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-colors">
  ...
</a>
```

### Colapsado (80px)

- Solo iconos visibles, centrados (`w-5 h-5`).
- Tooltip al hover con nombre del módulo.
- Logo se reduce a favicon.
- User section se reduce a avatar.

---

## Header Inteligente

### Estructura

```
<Headroom>
  <header class="sticky top-0 z-40 h-16 border-b border-zinc-800/40 bg-zinc-950/80 backdrop-blur-md flex items-center px-6">
    <!-- Mobile hamburger -->
    <Button variant="ghost" size="icon" class="lg:hidden">
      <Menu class="w-5 h-5" />
    </Button>

    <!-- Breadcrumb -->
    <Breadcrumb class="hidden md:flex ml-4" />

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Buscador global -->
    <div class="hidden lg:flex items-center gap-2 mr-4">
      <Input placeholder="Buscar..." class="w-64" />
      <kbd class="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 text-xs text-zinc-500">⌘K</kbd>
    </div>

    <!-- Acciones rápidas -->
    <Button variant="outline" size="sm" class="hidden lg:flex">
      <Plus class="w-4 h-4 mr-2" />
      Nuevo
    </Button>

    <!-- Notificaciones -->
    <Button variant="ghost" size="icon" class="relative">
      <Bell class="w-5 h-5" />
      <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
        {count}
      </span>
    </Button>

    <!-- User menu -->
    <DropdownMenu>
      <Avatar />
    </DropdownMenu>
  </header>
</Headroom>
```

---

## Page Header (por módulo)

```
<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
  <div>
    <h1 class="text-2xl font-bold text-zinc-100 tracking-tight">{pageTitle}</h1>
    <p class="text-sm text-zinc-400 mt-1">{pageDescription}</p>
  </div>
  <div class="flex items-center gap-2">
    <Button variant="outline" size="sm">
      <Download class="w-4 h-4 mr-2" />
      Exportar
    </Button>
    <Button variant="outline" size="sm">
      <Filter class="w-4 h-4 mr-2" />
      Filtros
    </Button>
    <Button size="sm">
      <Plus class="w-4 h-4 mr-2" />
      {primaryAction}
    </Button>
  </div>
</div>
```

---

## Workspace Principal

### Distribución estándar

```
┌──────────────────────────────────────────────────────────────────────┐
│ KPI ROW (4-8 cards compactas)                                        │
├──────────────────────────────────────────────────────────────────────┤
│ TOOLBAR (Buscar + Filtros + Exportar + Columnas + Vistas)            │
├──────────────────────────────────────────────────────┬───────────────┤
│                                                      │               │
│ CONTENIDO PRINCIPAL                                  │ PANEL         │
│                                                      │ LATERAL       │
│ Tabla / Grid / Cards / Kanban / Gantt                │ (Drill-down)  │
│                                                      │               │
│ 70%                                                  │ 30%           │
│                                                      │               │
├──────────────────────────────────────────────────────┴───────────────┤
│ HISTORIAL / ACTIVIDAD / AUDITORÍA                                    │
└──────────────────────────────────────────────────────────────────────┘
```

### KPI Row

```
<div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
  {kpiCards}
</div>
```

Cada KPI card:

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm p-4 hover:shadow-md transition-shadow cursor-pointer">
  <div class="flex items-center justify-between mb-2">
    <p class="text-xs text-zinc-500">{label}</p>
    <Icon class="w-4 h-4 text-zinc-600" />
  </div>
  <p class="font-display text-2xl font-bold text-zinc-100 tracking-tighter">{value}</p>
  <div class="flex items-center gap-1 mt-1">
    <TrendingUp class="w-3 h-3 text-green-500" />
    <span class="text-[10px] font-medium text-green-500">+12%</span>
    <span class="text-[10px] text-zinc-600">vs mes anterior</span>
  </div>
</div>
```

### Toolbar

```
<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
  <div class="flex items-center gap-3">
    <Input placeholder="Buscar..." class="max-w-sm" />
    <Select>{statusFilter}</Select>
    <Select>{dateFilter}</Select>
  </div>
  <div class="flex items-center gap-2">
    <!-- View toggle -->
    <div class="flex items-center rounded-lg border border-zinc-800/60 bg-zinc-900/40">
      <Button variant="ghost" size="icon-sm" class="rounded-l-lg">
        <Table class="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon-sm">
        <Grid class="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" class="rounded-r-lg">
        <Kanban class="w-4 h-4" />
      </Button>
    </div>
    <Button variant="ghost" size="icon-sm">
      <Columns class="w-4 h-4" />
    </Button>
    <Button variant="ghost" size="icon-sm">
      <Download class="w-4 h-4" />
    </Button>
  </div>
</div>
```

---

## Panel Lateral (Drill-down)

### Patrón universal

Al hacer clic en un registro de cualquier tabla, se abre un Sheet lateral derecho con:

```
<Sheet side="right" class="w-[40%] sm:w-[50%]">
  <SheetContent>
    <!-- Cabecera inmutable -->
    <div class="flex items-center justify-between pb-4 border-b border-zinc-800/40">
      <div>
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-semibold text-zinc-100">{code}</h3>
          <Badge variant={statusVariant}>{status}</Badge>
        </div>
        <p class="text-sm text-zinc-400 mt-1">{subtitle}</p>
      </div>
      <div class="flex items-center gap-2">
        <Button variant="outline" size="sm">Editar</Button>
        <Button variant="ghost" size="icon-sm">
          <X class="w-4 h-4" />
        </Button>
      </div>
    </div>

    <!-- Tabs -->
    <Tabs defaultValue="details" class="mt-4">
      <TabsList class="bg-zinc-800/40">
        <TabsTrigger value="details">Detalles</TabsTrigger>
        <TabsTrigger value="materials">Materiales</TabsTrigger>
        <TabsTrigger value="audit">Auditoría</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>
      <TabsContent value="details">{content}</TabsContent>
      <TabsContent value="materials">{content}</TabsContent>
      <TabsContent value="audit">{content}</TabsContent>
      <TabsContent value="timeline">{content}</TabsContent>
    </Tabs>
  </SheetContent>
</Sheet>
```

---

## Status Bar (Footer Operativo)

```
<footer class="h-8 border-t border-zinc-800/40 bg-zinc-900/40 flex items-center px-6 justify-between text-xs text-zinc-500">
  <div class="flex items-center gap-4">
    <span>{tenant.name} v{version}</span>
    <span class="text-zinc-700">|</span>
    <span>{module}</span>
  </div>
  <div class="flex items-center gap-4">
    <span class="flex items-center gap-1.5">
      <span class="w-2 h-2 rounded-full bg-green-500" />
      Sistema operativo
    </span>
    <span class="text-zinc-700">|</span>
    <span class="font-mono">{currentTime}</span>
  </div>
</footer>
```

---

## Responsive

| Breakpoint | Sidebar | Header | Workspace | Panel lateral |
|---|---|---|---|---|
| Mobile (< 640px) | Drawer flotante | Hamburger + breadcrumb | 1 columna | Sheet full-width |
| Tablet (640-1024px) | Drawer flotante | Breadcrumb + búsqueda | 2 columnas | Sheet 50% |
| Desktop (≥ 1024px) | Fijo 256px | Completo | 70/30 split | Sheet 40% |

---

## Reglas globales del ERP

1. **RSC por defecto.** `'use client'` solo con interacción real.
2. **Todo filtro persiste en URL.** Query parameters.
3. **Todo drill-down usa Sheet.** Nunca redirigir.
4. **Todo listado tiene:** Buscar + Filtros + Orden + Exportar + Paginación.
5. **Todo detalle tiene:** Información + Timeline + Auditoría + Adjuntos.
6. **Todo proceso tiene siguiente paso.** Continuidad visual.
7. **Acciones visibles.** Nunca escondidas en menús de 3 niveles.
8. **Estados siempre visibles.** Badge de estado en todo registro.
9. **Números a la derecha.** JetBrains Mono para importes, CFM, cantidades.
10. **Z-index estricto:** Sidebar `z-30`, Header `z-40`, Modals `z-50`, Toasts `z-60`.
