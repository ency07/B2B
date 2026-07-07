# CLIENT PORTAL BLUEPRINT — Filosofía y Arquitectura

## Filosofía

El Portal del Cliente NO es el ERP con menos funciones.

Es una **experiencia de autoservicio premium** donde el cliente encuentra todo lo que necesita sin llamar, sin escribir correos, sin esperar.

Debe sentirse como:
- **Stripe** — Claridad absoluta, datos financieros impecables
- **Notion** — Espacio, tipografía, jerarquía visual
- **Linear** — Velocidad, elegancia, cero fricción
- **Vercel** — Modernidad, minimalismo, confianza
- **Apple** — Obsesión por el detalle, premium

---

## Diferencias con el ERP

| Aspecto | ERP (Operadores) | Portal (Clientes) |
|---|---|---|
| Modo | Dark (zinc-950) | Light (white/slate-50) |
| Densidad | Alta (información máxima) | Media (espacio para respirar) |
| Navegación | 12 módulos | 6 secciones |
| Sombras | `shadow-sm` | `shadow-md` (más suaves) |
| Bordes | `border-zinc-800/60` | `border-slate-200` |
| Tipografía | JetBrains Mono para datos | Inter para todo, mono solo para montos |
| Tono | Técnico, operativo | Claro, tranquilizador, profesional |
| Acciones | Crear, editar, aprobar, rechazar | Ver, pagar, descargar, contactar |
| Inspiración | Siemens, SAP Fiori | Stripe, Linear, Vercel |

---

## Identidad Visual del Portal

### Modo: SIEMPRE CLARO

El portal usa exclusivamente el tema claro. Nunca dark mode.

### Paleta

| Token | Valor | Uso |
|---|---|---|
| `--background` | `#ffffff` | Fondo principal |
| `--background-secondary` | `#f8fafc` | Fondos de sección alternos |
| `--foreground` | `#0f172a` | Texto principal |
| `--foreground-secondary` | `#475569` | Texto secundario |
| `--foreground-muted` | `#94a3b8` | Texto deshabilitado |
| `--card` | `#ffffff` | Tarjetas |
| `--border` | `#e2e8f0` | Bordes suaves |
| `--border-strong` | `#cbd5e1` | Bordes de énfasis |
| `--primary` | **Dinámico** | Color del tenant (botones, links) |
| `--primary-default` | `#1e40af` | Fallback primario |
| `--ring` | **Dinámico** | Anillo de foco |
| `--success` | `#16a34a` | Pagado, completado |
| `--warning` | `#d97706` | Pendiente, atención |
| `--danger` | `#dc2626` | Vencido, error |
| `--info` | `#2563eb` | Información |

### Sombras

| Token | Valor | Uso |
|---|---|---|
| `shadow-card` | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)` | Cards base |
| `shadow-card-hover` | `0 4px 12px rgba(0,0,0,0.08)` | Cards en hover |
| `shadow-modal` | `0 20px 60px rgba(0,0,0,0.12)` | Modales |
| `shadow-dropdown` | `0 8px 24px rgba(0,0,0,0.1)` | Dropdowns |

### Bordes

| Contexto | Valor |
|---|---|
| Cards | `border border-slate-200 rounded-xl` |
| Inputs | `border border-slate-300 rounded-lg` |
| Divisores | `border-t border-slate-100` |
| Focus | `ring-2 ring-primary ring-offset-2` |

### Espaciado

| Contexto | Valor |
|---|---|
| Padding card | `p-6 md:p-8` |
| Gap entre secciones | `gap-8 md:gap-12` |
| Padding página | `p-6 md:p-8 lg:p-12` |
| Max-width contenido | `max-w-6xl` |

---

## Layout del Portal

```
┌──────────────────────────────────────────────────────────────────────┐
│ NAVBAR (sticky, blur, border-bottom sutil)                           │
├──────────────────────┬───────────────────────────────────────────────┤
│                      │                                               │
│ SIDEBAR              │ MAIN CONTENT                                  │
│                      │                                               │
│ 220px                │ max-w-6xl                                     │
│ fijo                 │                                               │
│                      │ [Page Header]                                 │
│ Dashboard            │                                               │
│ Proyectos            │ [Content Area]                                │
│ Cotizaciones         │                                               │
│ Facturas             │                                               │
│ Soporte              │                                               │
│ Documentos           │                                               │
│                      │                                               │
│ ─────────            │                                               │
│ Mi Perfil            │                                               │
│ Cerrar Sesión        │                                               │
│                      │                                               │
└──────────────────────┴───────────────────────────────────────────────┘
```

### Navbar

```
<header class="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md">
  <div class="flex items-center justify-between h-full px-6 lg:px-8">
    <!-- Logo del tenant -->
    <div class="flex items-center gap-3">
      <img src="{tenant.logo}" alt="{tenant.name}" class="h-8" />
      <span class="text-slate-300">|</span>
      <span class="text-sm font-medium text-slate-500">Portal Cliente</span>
    </div>

    <!-- Right side -->
    <div class="flex items-center gap-4">
      <!-- Notificaciones -->
      <button class="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
        <Bell class="w-5 h-5 text-slate-500" />
        <span class="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
      </button>

      <!-- Avatar + nombre -->
      <div class="flex items-center gap-3">
        <Avatar size="sm" name={user.name} />
        <div class="hidden md:block">
          <p class="text-sm font-medium text-slate-900">{user.name}</p>
          <p class="text-xs text-slate-500">{user.company}</p>
        </div>
      </div>
    </div>
  </div>
</header>
```

### Sidebar

```
<aside class="fixed inset-y-0 left-0 z-30 w-[220px] border-r border-slate-200 bg-white pt-16">
  <nav class="flex flex-col h-full py-6 px-3">
    <!-- Navegación principal -->
    <div class="space-y-1 flex-1">
      <a class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary/5 text-primary">
        <LayoutDashboard class="w-5 h-5" />
        Dashboard
      </a>
      <a class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
        <FolderKanban class="w-5 h-5" />
        Proyectos
      </a>
      <a class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
        <FileText class="w-5 h-5" />
        Cotizaciones
      </a>
      <a class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
        <Receipt class="w-5 h-5" />
        Facturas
      </a>
      <a class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
        <MessageSquare class="w-5 h-5" />
        Soporte
      </a>
      <a class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
        <Files class="w-5 h-5" />
        Documentos
      </a>
    </div>

    <!-- Divider -->
    <div class="border-t border-slate-100 my-4" />

    <!-- Cuenta -->
    <div class="space-y-1">
      <a class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
        <User class="w-5 h-5" />
        Mi Perfil
      </a>
      <a class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors">
        <LogOut class="w-5 h-5" />
        Cerrar Sesión
      </a>
    </div>
  </nav>
</aside>
```

### Main Content Area

```
<main class="ml-[220px] min-h-[calc(100vh-64px)] bg-slate-50">
  <div class="max-w-6xl mx-auto p-6 md:p-8 lg:p-12">
    {content}
  </div>
</main>
```

---

## Responsive

| Breakpoint | Sidebar | Navbar | Content |
|---|---|---|---|
| Mobile (< 640px) | Drawer flotante | Logo + avatar | Full width, `p-4` |
| Tablet (640-1024px) | Drawer flotante | Completo | `p-6` |
| Desktop (≥ 1024px) | Fijo 220px | Completo | `max-w-6xl`, `p-8 lg:p-12` |

---

## Patrones de diseño del Portal

### Cards

```
<div class="bg-white border border-slate-200 rounded-xl shadow-card hover:shadow-card-hover transition-shadow duration-200">
  {content}
</div>
```

### Page Header

```
<div class="mb-8">
  <h1 class="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">{title}</h1>
  <p class="text-slate-500 mt-1">{description}</p>
</div>
```

### Empty State (premium)

```
<div class="flex flex-col items-center justify-center py-20 text-center">
  <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
    <Icon class="w-8 h-8 text-slate-400" />
  </div>
  <h3 class="text-lg font-semibold text-slate-900">{title}</h3>
  <p class="text-sm text-slate-500 mt-2 max-w-sm">{description}</p>
  <Button class="mt-6">{action}</Button>
</div>
```

### Status Badge (portal)

| Estado | Fondo | Texto | Borde |
|---|---|---|---|
| Pagado | `bg-green-50` | `text-green-700` | `border-green-200` |
| Pendiente | `bg-amber-50` | `text-amber-700` | `border-amber-200` |
| Vencido | `bg-red-50` | `text-red-700` | `border-red-200` |
| En Proceso | `bg-blue-50` | `text-blue-700` | `border-blue-200` |
| Completado | `bg-green-50` | `text-green-700` | `border-green-200` |
| Cancelado | `bg-slate-50` | `text-slate-500` | `border-slate-200` |

### Tabla (portal)

```
<div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
  <table class="w-full">
    <thead>
      <tr class="border-b border-slate-100 bg-slate-50/50">
        <th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">{header}</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100">
      <tr class="hover:bg-slate-50/50 transition-colors">
        <td class="px-4 py-3.5 text-sm text-slate-700">{cell}</td>
      </tr>
    </tbody>
  </table>
</div>
```

---

## Tono de comunicación

| Contexto | ERP | Portal |
|---|---|---|
| Error | "Error 500: Fallo en query" | "Algo salió mal. Intenta de nuevo." |
| Carga | "Consultando inventario..." | "Cargando..." |
| Acción | "Aprobar Cotización" | "Aceptar propuesta" |
| Estado | "FACTURA_PAGADA_TOTAL" | "Pagada" |
| Empty | "No existen registros" | "Aún no tienes facturas aquí" |

---

## Reglas del Portal

1. **Modo claro obligatorio.** Nunca dark mode.
2. **Espacio para respirar.** Padding generoso, gap amplio.
3. **Sombras suaves.** `shadow-card` base, nunca `shadow-sm` del ERP.
4. **Bordes sutiles.** `border-slate-200`, nunca `border-zinc-800/60`.
5. **Menos es más.** 6 secciones, no 12 módulos.
6. **Autoservicio.** El cliente no debe llamar para nada que el portal pueda resolver.
7. **Pagos integrados.** Pagar directamente desde el portal (Wompi).
8. **Documentos descargables.** PDFs, facturas, planos, siempre disponibles.
9. **Notificaciones claras.** Badge en navbar, no toast invasivo.
10. **Mobile-first.** El 60% de los clientes entran desde el celular.
