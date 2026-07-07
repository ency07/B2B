# LANDING PAGE BLUEPRINT — AeroMax Industrial

## Pregunta central

> **¿Por qué comprarle a AeroMax y no a la competencia?**

Cada sección de esta landing responde una parte de esa pregunta.

---

## Narrativa de conversión

La landing NO es un folleto. Es una **máquina de generar confianza y oportunidades comerciales**.

El visitante recorre un arco emocional:

```
ATRAER → CONECTAR → CONVENCER → DEMOSTRAR → CONVERTIR
```

| Fase | Sección | Emoción | Pregunta que responde |
|---|---|---|---|
| ATRAER | Hero + Video | Asombro, curiosidad | ¿Qué hacen? ¿Son serios? |
| CONECTAR | Problema | Empatía, identificación | ¿Entienden mi dolor? |
| CONVENCER | Solución + Sectores + Servicios | Confianza, autoridad | ¿Pueden resolverlo? |
| DEMOSTRAR | Productos + Casos + Proceso | Seguridad, evidencia | ¿Lo han hecho antes? ¿Con qué resultados? |
| CONVERTIR | Calculadora + CTA + Formulario | Urgencia, acción | ¿Cuánto me cuesta? ¿Cómo empiezo? |

---

## Estructura de secciones

```
┌─────────────────────────────────────────────────────────────┐
│ NAVBAR (sticky, blur, react-headroom)                       │
├─────────────────────────────────────────────────────────────┤
│ 01. HERO — Impacto inmediato + Video                        │
├─────────────────────────────────────────────────────────────┤
│ 02. TRUST BAR — Logos de clientes                           │
├─────────────────────────────────────────────────────────────┤
│ 03. PROBLEMA — Pain points industriales                     │
├─────────────────────────────────────────────────────────────┤
│ 04. SOLUCIÓN — Cómo AeroMax resuelve                        │
├─────────────────────────────────────────────────────────────┤
│ 05. SECTORES — Industrias que atendemos                     │
├─────────────────────────────────────────────────────────────┤
│ 06. SERVICIOS — Preingeniería y servicios técnicos          │
├─────────────────────────────────────────────────────────────┤
│ 07. PRODUCTOS — Catálogo técnico (fichas, no tienda)        │
├─────────────────────────────────────────────────────────────┤
│ 08. CASOS DE ÉXITO — Resultados reales con métricas         │
├─────────────────────────────────────────────────────────────┤
│ 09. PROCESO — Cómo trabajamos (timeline visual)             │
├─────────────────────────────────────────────────────────────┤
│ 10. CALCULADORA — Cálculo CFM en vivo                       │
├─────────────────────────────────────────────────────────────┤
│ 11. CTA FINAL — Llamada a la acción                         │
├─────────────────────────────────────────────────────────────┤
│ 12. FORMULARIO — Captación de lead                          │
├─────────────────────────────────────────────────────────────┤
│ 13. FOOTER — Información legal, contacto, navegación        │
└─────────────────────────────────────────────────────────────┘
```

---

## Navbar

### Estructura

```
<header class="fixed top-0 left-0 right-0 z-40 backdrop-blur-md bg-zinc-950/80 border-b border-zinc-800/40 h-16">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full">
    <!-- Logo -->
    <a href="/" class="flex items-center gap-3">
      <img src="/logo.svg" alt="AeroMax" class="h-8" />
    </a>

    <!-- Nav links (desktop) -->
    <nav class="hidden lg:flex items-center gap-8">
      <a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Productos</a>
      <a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Servicios</a>
      <a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Sectores</a>
      <a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Casos</a>
      <a class="text-sm text-zinc-400 hover:text-zinc-100 transition-colors">Nosotros</a>
    </nav>

    <!-- CTA -->
    <div class="hidden lg:flex items-center gap-4">
      <a href="/portal" class="text-sm text-zinc-400 hover:text-zinc-100">Portal Cliente</a>
      <Button size="sm">Cotizar ahora</Button>
    </div>

    <!-- Mobile hamburger -->
    <Button variant="ghost" size="icon" class="lg:hidden">
      <Menu class="w-5 h-5" />
    </Button>
  </div>
</header>
```

### Comportamiento

- Sticky con `react-headroom`: scroll down → oculta, scroll up → reaparece.
- Fondo: `backdrop-blur-md bg-zinc-950/80`.
- Borde inferior: `border-b border-zinc-800/40`.
- Z-index: `z-40`.
- Mobile: Sheet lateral con navegación completa.

---

## Trust Bar (post-hero)

### Estructura

```
<section class="py-12 border-b border-zinc-800/40">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <p class="text-center text-xs font-medium uppercase tracking-wider text-zinc-500 mb-8">
      Empresas que confían en nuestra ingeniería
    </p>
    <div class="flex items-center justify-center gap-12 flex-wrap opacity-40">
      <img src="/logos/client-1.svg" alt="" class="h-8 grayscale" />
      <img src="/logos/client-2.svg" alt="" class="h-8 grayscale" />
      <img src="/logos/client-3.svg" alt="" class="h-8 grayscale" />
      <img src="/logos/client-4.svg" alt="" class="h-8 grayscale" />
      <img src="/logos/client-5.svg" alt="" class="h-8 grayscale" />
      <img src="/logos/client-6.svg" alt="" class="h-8 grayscale" />
    </div>
  </div>
</section>
```

### Reglas

- Logos en `grayscale` + `opacity-40`.
- Hover: `opacity-100 grayscale-0` (200ms).
- Label: `text-xs uppercase tracking-wider text-zinc-500`.
- Máximo 8 logos.
- Altura uniforme: `h-8`.

---

## Reglas globales de la landing

### Tipografía

| Elemento | Fuente |
|---|---|
| Headlines de sección | Outfit, `font-display` |
| Cuerpo de texto | Inter, `font-sans` |
| Datos técnicos (CFM, RPM, m³) | JetBrains Mono, `font-mono` |

### Espaciado entre secciones

- Padding vertical: `py-20 md:py-28 lg:py-32`.
- Gap entre elementos internos: `gap-8 md:gap-12`.

### Composición

- Alternar composiciones asimétricas 60/40 y 70/30.
- Prohibido grids uniformes de tarjetas idénticas.
- Cada sección debe tener un **Bloque Ancla** que ocupe ≥50% del espacio visual.

### Fondo

- Grid milimétrica SVG inline: opacidad 1.5-3%.
- Gradientes difusos: `radial-gradient` en tonos de marca.
- Prohibido fondos planos sin textura.

### Colores

- Fondo: `bg-zinc-950`.
- Paneles: `bg-zinc-900/40 backdrop-blur-sm`.
- Bordes: `border-zinc-800/60`.
- Texto principal: `text-zinc-100`.
- Texto secundario: `text-zinc-400`.
- Acento: `text-primary` (dinámico por tenant).

### Prohibiciones

- Prohibido `text-zinc-400` como color dominante (solo para metadata).
- Prohibido cards que sean solo: icono + título + texto + botón.
- Prohibido SVGs genéricos de unDraw, Storyset, etc.
- Prohibido Tailwind por defecto sin personalización.
- Prohibido fondos planos sin profundidad.
- Prohibido animaciones > 200ms en micro-interacciones.

---

## Checklist de aprobación

Antes de marcar la landing como completada:

- [ ] Test de 5 segundos: transmite ingeniería, innovación, precisión
- [ ] Test Apple: ¿Apple publicaría este nivel de acabado?
- [ ] Test Siemens: ¿Podría aparecer en una presentación de Siemens Digital Industries?
- [ ] Test Stripe: ¿Stripe aceptaría este nivel de refinamiento?
- [ ] Test Rivian: ¿Transmite innovación industrial?
- [ ] Test Porsche: ¿Existe obsesión por el detalle?
- [ ] Jerarquía Visual: 9/10
- [ ] Calidad Percibida: 9/10
- [ ] Profundidad: 9/10
- [ ] Tipografía: 9/10
- [ ] Hero: 9/10
- [ ] Tarjetas: 9/10
- [ ] Botones: 9/10
- [ ] Conversión: 9/10
- [ ] Pregunta final: "Si un director de Siemens visitara esta web 15 segundos, ¿pensaría que AeroMax es clase mundial?"
