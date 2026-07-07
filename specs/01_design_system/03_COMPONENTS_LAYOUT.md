# COMPONENTES DE LAYOUT

## 1. Sidebar

### Estructura

```
<aside class="fixed inset-y-0 left-0 z-30 flex flex-col w-64 border-r border-zinc-800/40 bg-zinc-900/80 backdrop-blur-sm">
  <!-- Logo -->
  <div class="h-16 flex items-center px-6 border-b border-zinc-800/40">
    <img src="{tenant.logo}" alt="{tenant.name}" class="h-8" />
  </div>

  <!-- Navigation -->
  <nav class="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
    <a class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
      <Icon class="w-5 h-5 shrink-0" />
      <span>{label}</span>
    </a>
  </nav>

  <!-- User -->
  <div class="p-4 border-t border-zinc-800/40">
    <div class="flex items-center gap-3">
      <Avatar />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-zinc-100 truncate">{name}</p>
        <p class="text-xs text-zinc-500 truncate">{role}</p>
      </div>
    </div>
  </div>
</aside>
```

### Dimensiones

| Estado | Ancho | Breakpoint |
|---|---|---|
| Expandido | `w-64` (256px) | Desktop default |
| Colapsado | `w-20` (80px) | Desktop colapsado |
| Mobile | Drawer flotante | `< lg` (Sheet de Radix) |

### Estado activo

```
<a class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium bg-primary/10 text-primary border-l-2 border-primary">
  <Icon class="w-5 h-5 shrink-0" />
  <span>{label}</span>
</a>
```

### Estado hover

```
<a class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40 transition-colors">
  ...
</a>
```

### Colapsado (iconos)

- Solo iconos visibles, centrados.
- Tooltip al hover con nombre del módulo.
- Logo se reduce a favicon.
- User section se reduce a avatar.

### Mobile

- Sidebar oculto por defecto.
- Se despliega como Sheet (Radix) desde la izquierda al hacer clic en hamburguesa.
- Overlay oscuro (`bg-black/50 backdrop-blur-sm`).
- Cierre con Escape o clic fuera.

### Reglas

- Ancho fijo de 256px para evitar saltos bruscos.
- Botón de colapso rápido en la esquina superior.
- Scroll interno si hay muchos módulos (`overflow-y-auto`).
- Z-index: `z-30` desktop, `z-50` mobile.

---

## 2. Header Inteligente

### Estructura

```
<Headroom>
  <header class="sticky top-0 z-40 h-16 border-b border-zinc-800/40 bg-zinc-950/80 backdrop-blur-md flex items-center px-6">
    <!-- Mobile menu button -->
    <Button variant="ghost" size="icon" class="lg:hidden">
      <Menu class="w-5 h-5" />
    </Button>

    <!-- Breadcrumb -->
    <Breadcrumb class="hidden md:flex ml-4" />

    <!-- Spacer -->
    <div class="flex-1" />

    <!-- Global search -->
    <div class="hidden lg:flex items-center gap-2 mr-4">
      <Input placeholder="Buscar..." class="w-64" />
      <kbd class="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-1.5 text-xs text-zinc-500">⌘K</kbd>
    </div>

    <!-- Notifications -->
    <Button variant="ghost" size="icon">
      <Bell class="w-5 h-5" />
      {badge}
    </Button>

    <!-- User menu -->
    <DropdownMenu>
      <Avatar />
    </DropdownMenu>
  </header>
</Headroom>
```

### Lógica de scroll (react-headroom)

| Acción | Comportamiento |
|---|---|
| Scroll down | Header se desliza hacia arriba (oculto) |
| Scroll up | Header reaparece inmediatamente |
| Top de página | Header visible |

### Implementación

```
<Headroom
  disableInlineStyles
  className="z-40"
  style={{ willChange: 'transform' }}
>
  <header className="backdrop-blur-md bg-zinc-950/80 border-b border-zinc-800/40">
    ...
  </header>
</Headroom>
```

### Dimensiones

| Propiedad | Valor |
|---|---|
| Altura | `h-16` (64px) |
| Padding | `px-6` |
| Z-index | `z-40` |
| Fondo | `bg-zinc-950/80 backdrop-blur-md` |
| Borde | `border-b border-zinc-800/40` |

### Reglas

- Z-index `z-40` (por debajo de modales `z-50`).
- Fondo blur translúcido.
- Breadcrumb oculto en mobile.
- Búsqueda global con atajo `⌘K` / `Ctrl+K`.

---

## 3. Breadcrumb

### Estructura

```
<nav aria-label="Breadcrumb">
  <ol class="flex items-center gap-2 text-sm">
    <li>
      <a class="text-zinc-500 hover:text-zinc-300 transition-colors">
        <Home class="w-4 h-4" />
      </a>
    </li>
    <li class="text-zinc-600">
      <ChevronRight class="w-4 h-4" />
    </li>
    <li>
      <a class="text-zinc-500 hover:text-zinc-300 transition-colors">{parent}</a>
    </li>
    <li class="text-zinc-600">
      <ChevronRight class="w-4 h-4" />
    </li>
    <li>
      <span class="text-zinc-100 font-medium" aria-current="page">{current}</span>
    </li>
  </ol>
</nav>
```

### Reglas

- Separador: `ChevronRight` (`w-4 h-4`, `text-zinc-600`).
- Página actual: `text-zinc-100 font-medium` con `aria-current="page"`.
- Links: `text-zinc-500 hover:text-zinc-300`.
- Icono de home en el primer nivel.
- Máximo 4 niveles de profundidad.

---

## 4. Footer

### Landing Page Footer

```
<footer class="border-t border-zinc-800/40 bg-zinc-950">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
      <!-- Brand -->
      <div class="col-span-2 md:col-span-1">
        <img src="{tenant.logo}" class="h-8 mb-4" />
        <p class="text-sm text-zinc-500">{tenant.description}</p>
      </div>
      <!-- Links columns -->
      {columns}
    </div>
    <div class="mt-12 pt-8 border-t border-zinc-800/40 flex flex-col sm:flex-row justify-between items-center gap-4">
      <p class="text-sm text-zinc-500">© {year} {tenant.name}. Todos los derechos reservados.</p>
      <div class="flex items-center gap-4">
        <a class="text-sm text-zinc-500 hover:text-zinc-300">Términos</a>
        <a class="text-sm text-zinc-500 hover:text-zinc-300">Privacidad</a>
      </div>
    </div>
  </div>
</footer>
```

### ERP Footer

```
<footer class="h-8 border-t border-zinc-800/40 bg-zinc-900/40 flex items-center px-6 justify-between text-xs text-zinc-500">
  <span>{tenant.name} v{version}</span>
  <span class="flex items-center gap-2">
    <span class="w-2 h-2 rounded-full bg-green-500"></span>
    Sistema operativo
  </span>
</footer>
```

### Reglas

- Landing: 4 columnas de links, branding, legal.
- ERP: Barra de estado minimal (versión, status).
- Footer ERP siempre visible al final del workspace.

---

## 5. Page Layout (Marco de página)

### Estructura

```
<div class="flex min-h-screen bg-zinc-950">
  <!-- Sidebar -->
  <Sidebar />

  <!-- Main area -->
  <div class="flex-1 flex flex-col lg:ml-64">
    <!-- Header -->
    <Header />

    <!-- Page content -->
    <main class="flex-1 p-4 md:p-6 lg:p-8">
      <!-- Page header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-zinc-100 tracking-tight">{pageTitle}</h1>
          <p class="text-sm text-zinc-400 mt-1">{pageDescription}</p>
        </div>
        <div class="flex items-center gap-2">{actions}</div>
      </div>

      <!-- Page body -->
      {content}
    </main>

    <!-- Footer (ERP) -->
    <Footer />
  </div>
</div>
```

### Page Header

| Elemento | Clases |
|---|---|
| Título | `text-2xl font-bold text-zinc-100 tracking-tight` |
| Descripción | `text-sm text-zinc-400 mt-1` |
| Acciones | `flex items-center gap-2` |
| Separación | `mb-8` |

### Reglas

- Un único `<h1>` por página.
- Botón primario de acción a la derecha del header.
- Breadcrumb arriba del page header.
- Padding responsivo: `p-4 md:p-6 lg:p-8`.
