# COMPONENTES DE MARKETING

## 1. Hero

### Estructura

```
<section class="relative min-h-screen flex items-center justify-center overflow-hidden bg-zinc-950">
  <!-- Grid de fondo técnico -->
  <div class="absolute inset-0 opacity-[0.02]" style="background-image: url('/grid-pattern.svg')" />

  <!-- Gradiente difuso de iluminación -->
  <div class="absolute inset-0 bg-gradient-to-b from-blue-950/20 via-transparent to-transparent" />

  <!-- Contenido -->
  <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
    <!-- Trust badges -->
    <div class="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm px-4 py-1.5 text-xs text-zinc-400 mb-8">
      <Shield class="w-3.5 h-3.5 text-primary" />
      <span>+500 proyectos industriales completados</span>
    </div>

    <!-- Headline -->
    <h1 class="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-100 tracking-tight leading-tight">
      {headline}
    </h1>

    <!-- Subheadline -->
    <p class="mt-6 text-lg sm:text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed">
      {subheadline}
    </p>

    <!-- CTAs -->
    <div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
      <Button size="lg">{primaryCTA}</Button>
      <Button variant="outline" size="lg">{secondaryCTA}</Button>
    </div>

    <!-- Stats -->
    <div class="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mx-auto">
      {statCards}
    </div>
  </div>

  <!-- Ilustración técnica (SVG) -->
  <div class="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-zinc-950 to-transparent" />
</section>
```

### Reglas

- Debe parecer una **portada**, no una sección.
- Debe vender, emocionar, transmitir capacidad tecnológica.
- Grid de fondo: patrón milimétrico SVG inline, opacidad 1.5-3%.
- Gradiente de iluminación sutil (radial-gradient).
- Trust badges arriba del headline.
- Stats debajo de los CTAs.
- Tipografía: Outfit para headline, Inter para subheadline.
- Test Apple/Siemens/Stripe obligatorio.

---

## 2. Product Card (Ficha Técnica)

### Estructura

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden group hover:shadow-md transition-all">
  <!-- Imagen técnica -->
  <div class="aspect-[4/3] bg-zinc-900/60 relative overflow-hidden">
    <img src={product.image} alt={product.name} class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
    <!-- Badge de categoría -->
    <div class="absolute top-3 left-3">
      <Badge variant="info">{category}</Badge>
    </div>
  </div>

  <!-- Contenido -->
  <div class="p-5">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold text-zinc-100">{product.name}</h3>
        <p class="font-mono text-xs text-zinc-500 mt-0.5">{product.code}</p>
      </div>
    </div>

    <!-- Specs rápidas -->
    <div class="mt-4 grid grid-cols-2 gap-2">
      <div class="flex items-center gap-1.5 text-xs text-zinc-400">
        <Wind class="w-3.5 h-3.5 shrink-0" />
        <span class="font-mono">{cfm} CFM</span>
      </div>
      <div class="flex items-center gap-1.5 text-xs text-zinc-400">
        <Gauge class="w-3.5 h-3.5 shrink-0" />
        <span class="font-mono">{rpm} RPM</span>
      </div>
    </div>

    <!-- Acción -->
    <div class="mt-4 pt-4 border-t border-zinc-800/40">
      <Button variant="outline" size="sm" class="w-full">Ver ficha técnica</Button>
    </div>
  </div>
</div>
```

### Reglas

- Aspect ratio de imagen: `4/3`.
- Specs técnicas en `font-mono`.
- Iconos de spec: `w-3.5 h-3.5` (`shrink-0`).
- Hover: imagen escala `1.05`, card `shadow-md`.
- No es una tienda. Es una biblioteca de especificaciones.

---

## 3. Case Study Card

### Estructura

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden group hover:shadow-md transition-all">
  <!-- Imagen del caso -->
  <div class="aspect-[16/9] bg-zinc-900/60 relative">
    <img src={caseStudy.image} alt={caseStudy.title} class="w-full h-full object-cover" />
    <!-- Sector badge -->
    <div class="absolute top-3 left-3">
      <Badge variant="primary">{sector}</Badge>
    </div>
  </div>

  <!-- Contenido -->
  <div class="p-6">
    <h3 class="text-lg font-semibold text-zinc-100">{caseStudy.title}</h3>
    <p class="text-sm text-zinc-400 mt-2 line-clamp-2">{caseStudy.description}</p>

    <!-- Métricas de resultado -->
    <div class="mt-4 grid grid-cols-3 gap-4">
      <div>
        <p class="font-display text-2xl font-bold text-primary tracking-tighter">{metric1.value}</p>
        <p class="text-xs text-zinc-500 mt-0.5">{metric1.label}</p>
      </div>
      <div>
        <p class="font-display text-2xl font-bold text-primary tracking-tighter">{metric2.value}</p>
        <p class="text-xs text-zinc-500 mt-0.5">{metric2.label}</p>
      </div>
      <div>
        <p class="font-display text-2xl font-bold text-primary tracking-tighter">{metric3.value}</p>
        <p class="text-xs text-zinc-500 mt-0.5">{metric3.label}</p>
      </div>
    </div>

    <!-- CTA -->
    <div class="mt-5">
      <a class="text-sm text-primary hover:underline inline-flex items-center gap-1">
        Ver caso completo <ArrowRight class="w-4 h-4" />
      </a>
    </div>
  </div>
</div>
```

### Reglas

- Métricas de resultado: Outfit, `text-2xl font-bold`, color primario.
- Aspect ratio de imagen: `16/9`.
- Siempre mostrar ROI térmico, CFM, ACH o métrica relevante.
- CTA: "Ver caso completo" con flecha.

---

## 4. Solution Card

### Estructura

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm p-6 group hover:border-zinc-700 hover:shadow-md transition-all">
  <!-- Icono -->
  <div class="w-12 h-12 rounded-lg bg-primary-muted flex items-center justify-center mb-4">
    <Icon class="w-6 h-6 text-primary" />
  </div>

  <!-- Contenido -->
  <h3 class="text-lg font-semibold text-zinc-100">{solution.title}</h3>
  <p class="text-sm text-zinc-400 mt-2">{solution.description}</p>

  <!-- Features -->
  <ul class="mt-4 space-y-2">
    <li class="flex items-center gap-2 text-sm text-zinc-300">
      <Check class="w-4 h-4 text-primary shrink-0" />
      {feature}
    </li>
  </ul>

  <!-- CTA -->
  <div class="mt-5">
    <a class="text-sm text-primary hover:underline inline-flex items-center gap-1">
      Saber más <ArrowRight class="w-4 h-4" />
    </a>
  </div>
</div>
```

### Reglas

- Icono: `w-12 h-12`, fondo `bg-primary-muted`, icono `w-6 h-6`.
- Features con check de color primario.
- Hover: borde `zinc-700`, `shadow-md`.

---

## 5. Industrial Card

### Estructura

```
<div class="relative rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden group">
  <!-- Imagen de fondo con overlay -->
  <div class="aspect-[16/10] relative">
    <img src={industry.image} alt={industry.name} class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
    <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

    <!-- Contenido overlay -->
    <div class="absolute inset-0 flex flex-col justify-end p-6">
      <div class="w-10 h-10 rounded-lg bg-primary/20 backdrop-blur-sm flex items-center justify-center mb-3">
        <Icon class="w-5 h-5 text-primary" />
      </div>
      <h3 class="text-xl font-semibold text-zinc-100">{industry.name}</h3>
      <p class="text-sm text-zinc-400 mt-1">{industry.description}</p>
    </div>
  </div>
</div>
```

### Reglas

- Imagen de fondo con overlay gradiente.
- Icono con backdrop blur.
- Hover: imagen escala `1.10` (500ms).
- Usado para sectores industriales atendidos.

---

## 6. Portal Card

### Estructura

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm p-6 hover:shadow-md transition-shadow">
  <!-- Header -->
  <div class="flex items-center justify-between mb-4">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-lg bg-primary-muted flex items-center justify-center">
        <Icon class="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 class="text-sm font-semibold text-zinc-100">{title}</h3>
        <p class="text-xs text-zinc-500">{subtitle}</p>
      </div>
    </div>
    <Badge variant={statusVariant}>{status}</Badge>
  </div>

  <!-- Contenido -->
  <div class="space-y-3">
    {content}
  </div>

  <!-- Footer -->
  <div class="mt-5 pt-4 border-t border-zinc-800/40 flex items-center justify-between">
    <span class="text-xs text-zinc-500">{metadata}</span>
    <Button variant="ghost" size="sm">Ver detalle <ArrowRight class="w-3.5 h-3.5 ml-1" /></Button>
  </div>
</div>
```

### Uso

- Portal de cliente: resumen de trabajos, facturas pendientes, garantías activas.
- Cada card representa una entidad del portal (OT, factura, garantía).
- Badge de estado en la esquina superior derecha.

### Reglas

- Icono: `w-10 h-10`, `rounded-lg`, fondo `bg-primary-muted`.
- Metadata en `text-xs text-zinc-500`.
- Botón "Ver detalle" con flecha.
