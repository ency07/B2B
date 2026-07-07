# HERO + VIDEO

## Filosofía

El Hero debe parecer una **portada de revista de ingeniería**, no una sección de Tailwind.

Debe vender. Debe emocionar. Debe transmitir capacidad tecnológica en 5 segundos.

Si parece "otro Hero de Tailwind": **rediseñar**.

---

## Estructura del Hero

```
<section class="relative min-h-screen flex items-center overflow-hidden bg-zinc-950">

  <!-- Capa 1: Grid milimétrica de fondo -->
  <div class="absolute inset-0 opacity-[0.02]"
       style="background-image: url('/grid-pattern.svg'); background-size: 40px 40px;" />

  <!-- Capa 2: Gradiente difuso de iluminación -->
  <div class="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-transparent to-transparent" />
  <div class="absolute top-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

  <!-- Capa 3: Video de fondo (opcional, muted, loop) -->
  <div class="absolute inset-0 z-0">
    <video autoPlay muted loop playsInline class="w-full h-full object-cover opacity-20">
      <source src="/hero-industrial.mp4" type="video/mp4" />
    </video>
    <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/60" />
  </div>

  <!-- Capa 4: Contenido -->
  <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

      <!-- Columna izquierda: Texto -->
      <div class="max-w-2xl">
        <!-- Trust badge -->
        <div class="inline-flex items-center gap-2 rounded-full border border-zinc-800/60 bg-zinc-900/60 backdrop-blur-sm px-4 py-1.5 mb-8">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span class="text-xs font-medium text-zinc-400">+500 proyectos industriales completados</span>
        </div>

        <!-- Headline -->
        <h1 class="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-100 tracking-tight leading-[1.1]">
          Ingeniería de ventilación
          <span class="text-primary"> industrial</span>
          <br />
          de clase mundial
        </h1>

        <!-- Subheadline -->
        <p class="mt-6 text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-xl">
          Diseñamos, fabricamos e instalamos sistemas de extracción y climatización
          industrial para las operaciones más exigentes de LATAM.
        </p>

        <!-- CTAs -->
        <div class="mt-10 flex flex-col sm:flex-row items-start gap-4">
          <Button size="lg" class="px-8 py-4 text-base">
            Solicitar cotización
            <ArrowRight class="w-5 h-5 ml-2" />
          </Button>
          <Button variant="outline" size="lg" class="px-8 py-4 text-base">
            <Play class="w-5 h-5 mr-2" />
            Ver cómo trabajamos
          </Button>
        </div>

        <!-- Stats inline -->
        <div class="mt-12 flex items-center gap-8">
          <div>
            <p class="font-display text-3xl font-bold text-zinc-100 tracking-tighter">15+</p>
            <p class="text-xs text-zinc-500 mt-1">Años de experiencia</p>
          </div>
          <div class="w-px h-12 bg-zinc-800" />
          <div>
            <p class="font-display text-3xl font-bold text-zinc-100 tracking-tighter">200+</p>
            <p class="text-xs text-zinc-500 mt-1">Plantas equipadas</p>
          </div>
          <div class="w-px h-12 bg-zinc-800" />
          <div>
            <p class="font-display text-3xl font-bold text-zinc-100 tracking-tighter">98%</p>
            <p class="text-xs text-zinc-500 mt-1">Satisfacción cliente</p>
          </div>
        </div>
      </div>

      <!-- Columna derecha: Visual ancla -->
      <div class="relative hidden lg:block">
        <!-- Render técnico / Plano esquemático interactivo -->
        <div class="relative aspect-square rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
          <!-- SVG técnico del extractor -->
          <img src="/hero-extractor-3d.svg" alt="Extractor industrial" class="w-full h-full object-contain p-8" />

          <!-- Overlay de specs técnicas -->
          <div class="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 to-transparent">
            <div class="grid grid-cols-3 gap-4">
              <div>
                <p class="font-mono text-xs text-zinc-500">Caudal</p>
                <p class="font-mono text-sm text-zinc-100">45,000 CFM</p>
              </div>
              <div>
                <p class="font-mono text-xs text-zinc-500">Presión</p>
                <p class="font-mono text-sm text-zinc-100">12" WG</p>
              </div>
              <div>
                <p class="font-mono text-xs text-zinc-500">Potencia</p>
                <p class="font-mono text-sm text-zinc-100">150 HP</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Floating badge -->
        <div class="absolute -top-4 -right-4 rounded-xl border border-zinc-800/60 bg-zinc-900/80 backdrop-blur-sm p-4 shadow-lg">
          <p class="text-xs text-zinc-500">Certificación</p>
          <p class="text-sm font-semibold text-zinc-100 mt-1">ISO 9001:2015</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Scroll indicator -->
  <div class="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
    <span class="text-xs text-zinc-500">Descubre más</span>
    <ChevronDown class="w-5 h-5 text-zinc-500 animate-bounce" />
  </div>
</section>
```

---

## Reglas del Hero

| Regla | Detalle |
|---|---|
| Altura | `min-h-screen` (100vh mínimo) |
| Composición | Asimétrica 50/50 en desktop, stacked en mobile |
| Headline | Outfit, `text-5xl lg:text-7xl`, `tracking-tight`, `leading-[1.1]` |
| Subheadline | Inter, `text-lg lg:text-xl`, `leading-relaxed`, `text-zinc-400` |
| CTA primario | `px-8 py-4 text-base`, con icono `ArrowRight` |
| CTA secundario | `variant="outline"`, con icono `Play` |
| Stats | Outfit `text-3xl font-bold`, separadores `w-px h-12 bg-zinc-800` |
| Trust badge | `rounded-full`, `border-zinc-800/60`, `backdrop-blur-sm` |
| Visual ancla | Render 3D o plano SVG técnico, no foto genérica |
| Specs overlay | JetBrains Mono, gradiente de fondo |
| Grid de fondo | SVG milimétrico, opacidad 2% |
| Gradiente | `from-blue-950/20 via-transparent to-transparent` |

---

## Video Component

### Video de fondo (Hero)

```
<video
  autoPlay
  muted
  loop
  playsInline
  preload="metadata"
  class="w-full h-full object-cover opacity-20"
  poster="/hero-poster.jpg"
>
  <source src="/hero-industrial.mp4" type="video/mp4" />
</video>
```

### Reglas

- `autoPlay muted loop playsInline` obligatorio.
- `opacity-20` para no competir con el contenido.
- `poster` obligatorio para fallback.
- Overlay gradiente encima del video.
- Formato: MP4 H.264, máximo 5MB.
- Duración: 15-30 segundos en loop.
- Contenido: footage industrial real (fabricación, instalación, planta).

### Video embebido (sección dedicated)

Si se usa un video dedicado (no background):

```
<div class="relative aspect-video rounded-2xl border border-zinc-800/60 overflow-hidden shadow-2xl">
  <video
    controls
    preload="metadata"
    poster="/video-poster.jpg"
    class="w-full h-full object-cover"
  >
    <source src="/aeromax-process.mp4" type="video/mp4" />
  </video>

  <!-- Play overlay (cuando paused) -->
  <button class="absolute inset-0 flex items-center justify-center bg-zinc-950/40 group">
    <div class="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-200">
      <Play class="w-8 h-8 text-white ml-1" />
    </div>
  </button>
</div>
```

### Reglas del video dedicado

- Aspect ratio: `16/9`.
- Borde: `rounded-2xl border-zinc-800/60`.
- Shadow: `shadow-2xl`.
- Play button: `w-20 h-20`, `rounded-full`, `bg-primary/90`.
- Hover en play: `scale-110` (200ms).
- Poster obligatorio.

---

## Responsive

| Breakpoint | Comportamiento |
|---|---|
| Mobile (< 640px) | Hero stacked, visual oculto, stats en columna, CTAs en columna |
| Tablet (640-1024px) | Hero stacked, visual visible más pequeño, stats en fila |
| Desktop (≥ 1024px) | Hero 50/50, visual ancla completo, stats en fila |

---

## Animaciones de entrada

```
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
>
  {trustBadge}
</motion.div>

<motion.h1
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
>
  {headline}
</motion.h1>

<motion.p
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.3 }}
>
  {subheadline}
</motion.p>

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
>
  {ctas}
</motion.div>
```

### Reglas

- Stagger de 100ms entre elementos.
- Duración: 600ms.
- Easing: `easeOut`.
- Traslación: `y: 20 → 0`.
- Prohibido rebotes o oscilaciones.
