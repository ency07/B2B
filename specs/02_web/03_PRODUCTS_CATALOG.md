# PRODUCTOS — Catálogo Técnico

## Filosofía

El catálogo NO es una tienda de compras. Es una **biblioteca de especificaciones de ingeniería**.

Cada producto se presenta como una ficha técnica, no como un producto de e-commerce. El visitante debe sentir que está consultando un catálogo de Siemens o Autodesk.

---

## Estructura de la sección

```
<section class="py-20 md:py-28 lg:py-32 bg-zinc-950 relative">
  <div class="absolute inset-0 opacity-[0.015]" style="background-image: url('/grid-pattern.svg')" />

  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="max-w-3xl mb-16">
      <p class="text-xs font-medium uppercase tracking-wider text-primary mb-4">Catálogo</p>
      <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-100 tracking-tight leading-tight">
        Equipos diseñados
        <span class="text-zinc-500"> para trabajo pesado</span>
      </h2>
      <p class="mt-6 text-lg text-zinc-400 leading-relaxed">
        Fabricación propia con acero de grado industrial. Cada equipo se diseña
        para las condiciones exactas de su operación.
      </p>
    </div>

    <!-- Filtros de categoría -->
    <div class="flex flex-wrap items-center gap-3 mb-12">
      <button class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium">Todos</button>
      <button class="px-4 py-2 rounded-lg border border-zinc-800/60 text-zinc-400 text-sm font-medium hover:bg-zinc-800/40 hover:text-zinc-100 transition-colors">
        Extractores Axiales
      </button>
      <button class="px-4 py-2 rounded-lg border border-zinc-800/60 text-zinc-400 text-sm font-medium hover:bg-zinc-800/40 hover:text-zinc-100 transition-colors">
        Extractores Centrífugos
      </button>
      <button class="px-4 py-2 rounded-lg border border-zinc-800/60 text-zinc-400 text-sm font-medium hover:bg-zinc-800/40 hover:text-zinc-100 transition-colors">
        Inyectores
      </button>
      <button class="px-4 py-2 rounded-lg border border-zinc-800/60 text-zinc-400 text-sm font-medium hover:bg-zinc-800/40 hover:text-zinc-100 transition-colors">
        Ciclones
      </button>
      <button class="px-4 py-2 rounded-lg border border-zinc-800/60 text-zinc-400 text-sm font-medium hover:bg-zinc-800/40 hover:text-zinc-100 transition-colors">
        Dampers
      </button>
    </div>

    <!-- Grid de productos -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {productCards}
    </div>

    <!-- CTA -->
    <div class="mt-12 text-center">
      <Button variant="outline" size="lg">
        Ver catálogo completo
        <ArrowRight class="w-5 h-5 ml-2" />
      </Button>
    </div>
  </div>
</section>
```

---

## Product Card

```
<div class="group relative rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden hover:border-zinc-700 hover:shadow-md transition-all duration-300">

  <!-- Imagen técnica -->
  <div class="aspect-[4/3] bg-zinc-900/60 relative overflow-hidden">
    <img src={product.image} alt={product.name}
         class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />

    <!-- Badge de categoría -->
    <div class="absolute top-3 left-3">
      <span class="inline-flex items-center rounded-sm bg-blue-950/50 px-2 py-0.5 text-xs font-medium text-blue-400">
        {product.category}
      </span>
    </div>

    <!-- Serie badge -->
    <div class="absolute top-3 right-3">
      <span class="font-mono text-xs text-zinc-500 bg-zinc-900/80 backdrop-blur-sm px-2 py-1 rounded">
        {product.series}
      </span>
    </div>
  </div>

  <!-- Contenido -->
  <div class="p-5">
    <!-- Nombre y código -->
    <div class="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 class="text-base font-semibold text-zinc-100">{product.name}</h3>
        <p class="font-mono text-xs text-zinc-500 mt-0.5">{product.code}</p>
      </div>
    </div>

    <!-- Specs técnicas (grid de 2x2) -->
    <div class="grid grid-cols-2 gap-3 mb-5">
      <div class="flex items-center gap-2">
        <Wind class="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <div>
          <p class="text-[10px] text-zinc-500 uppercase tracking-wider">Caudal</p>
          <p class="font-mono text-xs text-zinc-300">{product.cfm} CFM</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Gauge class="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <div>
          <p class="text-[10px] text-zinc-500 uppercase tracking-wider">Presión</p>
          <p class="font-mono text-xs text-zinc-300">{product.pressure}" WG</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Zap class="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <div>
          <p class="text-[10px] text-zinc-500 uppercase tracking-wider">Potencia</p>
          <p class="font-mono text-xs text-zinc-300">{product.hp} HP</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Ruler class="w-3.5 h-3.5 text-zinc-500 shrink-0" />
        <div>
          <p class="text-[10px] text-zinc-500 uppercase tracking-wider">Diámetro</p>
          <p class="font-mono text-xs text-zinc-300">{product.diameter}"</p>
        </div>
      </div>
    </div>

    <!-- Acciones -->
    <div class="flex items-center gap-2 pt-4 border-t border-zinc-800/40">
      <Button variant="outline" size="sm" class="flex-1">
        Ficha técnica
      </Button>
      <Button size="sm" class="flex-1">
        Cotizar
      </Button>
    </div>
  </div>
</div>
```

---

## Productos destacados (datos de ejemplo)

| Producto | Categoría | Serie | Código | CFM | Presión | HP | Diámetro |
|---|---|---|---|---|---|---|---|
| Extractor Axial Industrial | Extractores Axiales | AX-HD | EXT-AX-001 | 45,000 | 8 | 75 | 48 |
| Extractor Centrífugo Alta Presión | Extractores Centrífugos | CP-PRO | EXT-CP-001 | 25,000 | 15 | 100 | 36 |
| Inyector de Aire Fresco | Inyectores | INJ-F | INY-001 | 30,000 | 4 | 25 | 30 |
| Ciclón Separador | Ciclones | CYC-IND | CIC-001 | 50,000 | 12 | 50 | 60 |
| Damper Motorizado | Dampers | DMP-AUTO | DAM-001 | — | — | 2 | 24 |
| Extractor Techo Industrial | Extractores Axiales | AX-ROOF | EXT-AX-002 | 20,000 | 3 | 15 | 36 |

---

## Ficha de producto (página dedicada)

### Layout

```
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  <!-- Breadcrumb -->
  <Breadcrumb class="mb-8" />

  <!-- Header del producto -->
  <div class="grid grid-cols-1 lg:grid-cols-5 gap-12">

    <!-- Columna visual (65%) -->
    <div class="lg:col-span-3 space-y-6">
      <!-- Imagen principal -->
      <div class="aspect-[4/3] rounded-2xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
        <img src={product.mainImage} alt={product.name} class="w-full h-full object-contain p-8" />
      </div>

      <!-- Miniaturas -->
      <div class="flex items-center gap-3">
        {product.images.map(img => (
          <button class="w-20 h-20 rounded-lg border border-zinc-800/60 overflow-hidden hover:border-primary transition-colors">
            <img src={img} class="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      <!-- Curva aerodinámica (SVG) -->
      <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6">
        <h4 class="text-sm font-semibold text-zinc-100 mb-4">Curva de rendimiento</h4>
        <img src="/curves/{product.code}.svg" alt="Curva aerodinámica" class="w-full" />
      </div>
    </div>

    <!-- Columna de datos (35%) -->
    <div class="lg:col-span-2 space-y-6">
      <!-- Info básica -->
      <div>
        <span class="inline-flex items-center rounded-sm bg-blue-950/50 px-2 py-0.5 text-xs font-medium text-blue-400 mb-3">
          {product.category}
        </span>
        <h1 class="font-display text-3xl font-bold text-zinc-100 tracking-tight">{product.name}</h1>
        <p class="font-mono text-sm text-zinc-500 mt-1">{product.code} — Serie {product.series}</p>
      </div>

      <!-- Tabla de especificaciones -->
      <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
        <div class="px-4 py-3 border-b border-zinc-800/40">
          <h4 class="text-sm font-semibold text-zinc-100">Especificaciones técnicas</h4>
        </div>
        <div class="divide-y divide-zinc-800/40">
          {specs.map(spec => (
            <div class="flex items-center justify-between px-4 py-2.5">
              <span class="text-sm text-zinc-400">{spec.label}</span>
              <span class="font-mono text-sm text-zinc-100">{spec.value}</span>
            </div>
          ))}
        </div>
      </div>

      <!-- Documentos descargables -->
      <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
        <h4 class="text-sm font-semibold text-zinc-100 mb-3">Documentos</h4>
        <div class="space-y-2">
          <a class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/40 transition-colors">
            <FileText class="w-4 h-4 text-red-400 shrink-0" />
            <span class="text-sm text-zinc-300">Ficha técnica PDF</span>
            <span class="ml-auto font-mono text-xs text-zinc-500">2.4 MB</span>
          </a>
          <a class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/40 transition-colors">
            <FileDown class="w-4 h-4 text-blue-400 shrink-0" />
            <span class="text-sm text-zinc-300">Plano CAD (.step)</span>
            <span class="ml-auto font-mono text-xs text-zinc-500">8.1 MB</span>
          </a>
          <a class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/40 transition-colors">
            <FileDown class="w-4 h-4 text-blue-400 shrink-0" />
            <span class="text-sm text-zinc-300">Manual de instalación</span>
            <span class="ml-auto font-mono text-xs text-zinc-500">1.8 MB</span>
          </a>
        </div>
      </div>

      <!-- CTAs -->
      <div class="space-y-3">
        <Button size="lg" class="w-full">
          Solicitar cotización
          <ArrowRight class="w-5 h-5 ml-2" />
        </Button>
        <Button variant="outline" size="lg" class="w-full">
          <Phone class="w-5 h-5 mr-2" />
          Hablar con ingeniería
        </Button>
      </div>
    </div>
  </div>
</div>
```

---

## Reglas del catálogo

| Regla | Detalle |
|---|---|
| Imagen | Aspecto `4/3`, fondo `bg-zinc-900/60`, hover `scale-105` |
| Specs | Grid 2x2, iconos `w-3.5 h-3.5`, valores en `font-mono` |
| Labels de spec | `text-[10px] uppercase tracking-wider text-zinc-500` |
| Valores de spec | `font-mono text-xs text-zinc-300` |
| Código de producto | `font-mono text-xs text-zinc-500` |
| Acciones | Dos botones: "Ficha técnica" (outline) + "Cotizar" (primary) |
| Filtros | Pills con `rounded-lg`, activo: `bg-primary text-white` |
| Curva aerodinámica | SVG vectorial, no imagen rasterizada |
| Documentos | Lista con icono por tipo, tamaño en `font-mono` |
| Prohibido | Precios visibles (se cotizan), carrito de compras, "Agregar al carrito" |
