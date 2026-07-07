# CASOS DE ÉXITO + PROCESO + CALCULADORA

---

## 08. CASOS DE ÉXITO — Resultados Reales con Métricas

### Filosofía

No testimonios genéricos. **Resultados medibles**. Cada caso debe mostrar datos duros: CFM instalados, reducción de temperatura, ROI, tiempo de ejecución.

El visitante debe pensar: "Si lo hicieron por ellos, lo pueden hacer por mí."

### Estructura

```
<section class="py-20 md:py-28 lg:py-32 bg-zinc-950 relative">
  <div class="absolute inset-0 opacity-[0.015]" style="background-image: url('/grid-pattern.svg')" />

  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="max-w-3xl mb-16">
      <p class="text-xs font-medium uppercase tracking-wider text-primary mb-4">Casos de éxito</p>
      <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-100 tracking-tight leading-tight">
        Resultados que hablan
        <span class="text-primary"> por sí solos</span>
      </h2>
    </div>

    <!-- Bloque ancla: Caso destacado (grande) -->
    <div class="mb-12">
      {featuredCase}
    </div>

    <!-- Grid de casos secundarios -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {secondaryCases}
    </div>
  </div>
</section>
```

### Caso Destacado (Bloque Ancla)

```
<div class="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
  <!-- Imagen -->
  <div class="aspect-[4/3] lg:aspect-auto relative">
    <img src={caseStudy.image} alt={caseStudy.title} class="w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/60 hidden lg:block" />
    <!-- Sector badge -->
    <div class="absolute top-4 left-4">
      <span class="inline-flex items-center gap-1.5 rounded-sm bg-primary/20 backdrop-blur-sm border border-primary/30 px-2.5 py-1 text-xs font-medium text-primary">
        <span class="w-1.5 h-1.5 rounded-full bg-primary" />
        {caseStudy.sector}
      </span>
    </div>
  </div>

  <!-- Contenido -->
  <div class="p-8 lg:p-12 flex flex-col justify-center">
    <h3 class="font-display text-2xl lg:text-3xl font-bold text-zinc-100 tracking-tight mb-4">
      {caseStudy.title}
    </h3>
    <p class="text-base text-zinc-400 leading-relaxed mb-8">
      {caseStudy.description}
    </p>

    <!-- Métricas de resultado (3 columnas) -->
    <div class="grid grid-cols-3 gap-6 mb-8">
      <div>
        <p class="font-display text-3xl lg:text-4xl font-bold text-primary tracking-tighter">{caseStudy.metric1.value}</p>
        <p class="text-xs text-zinc-500 mt-1">{caseStudy.metric1.label}</p>
      </div>
      <div>
        <p class="font-display text-3xl lg:text-4xl font-bold text-primary tracking-tighter">{caseStudy.metric2.value}</p>
        <p class="text-xs text-zinc-500 mt-1">{caseStudy.metric2.label}</p>
      </div>
      <div>
        <p class="font-display text-3xl lg:text-4xl font-bold text-primary tracking-tighter">{caseStudy.metric3.value}</p>
        <p class="text-xs text-zinc-500 mt-1">{caseStudy.metric3.label}</p>
      </div>
    </div>

    <!-- Cliente -->
    <div class="flex items-center gap-3 pt-6 border-t border-zinc-800/40">
      <img src={caseStudy.clientLogo} alt="" class="h-8 grayscale" />
      <div>
        <p class="text-sm font-medium text-zinc-100">{caseStudy.client}</p>
        <p class="text-xs text-zinc-500">{caseStudy.location}</p>
      </div>
    </div>

    <Button variant="outline" size="sm" class="mt-6 w-fit">
      Ver caso completo <ArrowRight class="w-4 h-4 ml-2" />
    </Button>
  </div>
</div>
```

### Caso Secundario (Card)

```
<div class="group rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden hover:border-zinc-700 hover:shadow-md transition-all duration-300">
  <!-- Imagen -->
  <div class="aspect-[16/9] relative">
    <img src={caseStudy.image} alt={caseStudy.title} class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
    <div class="absolute top-3 left-3">
      <span class="inline-flex items-center rounded-sm bg-zinc-900/80 backdrop-blur-sm px-2 py-0.5 text-xs font-medium text-zinc-300">
        {caseStudy.sector}
      </span>
    </div>
  </div>

  <!-- Contenido -->
  <div class="p-6">
    <h3 class="text-lg font-semibold text-zinc-100 mb-2">{caseStudy.title}</h3>
    <p class="text-sm text-zinc-400 line-clamp-2 mb-4">{caseStudy.description}</p>

    <!-- Métricas compactas -->
    <div class="grid grid-cols-3 gap-3">
      <div>
        <p class="font-display text-xl font-bold text-primary tracking-tighter">{metric1.value}</p>
        <p class="text-[10px] text-zinc-500 mt-0.5">{metric1.label}</p>
      </div>
      <div>
        <p class="font-display text-xl font-bold text-primary tracking-tighter">{metric2.value}</p>
        <p class="text-[10px] text-zinc-500 mt-0.5">{metric2.label}</p>
      </div>
      <div>
        <p class="font-display text-xl font-bold text-primary tracking-tighter">{metric3.value}</p>
        <p class="text-[10px] text-zinc-500 mt-0.5">{metric3.label}</p>
      </div>
    </div>
  </div>
</div>
```

### Casos de ejemplo

| Caso | Sector | Métrica 1 | Métrica 2 | Métrica 3 |
|---|---|---|---|---|
| Planta siderúrgica Paz de Río | Minería/Siderurgia | -22°C temperatura | 120,000 CFM | ROI 8 meses |
| Data Center Bogotá DC-04 | Data Centers | 99.99% uptime | 50,000 CFM | -40% energía |
| Planta procesadora Nutresa | Alimentos | -18°C temperatura | 35,000 CFM | Cumplimiento INVIMA |

### Reglas

- Caso destacado: layout 50/50, métricas `text-3xl lg:text-4xl`.
- Casos secundarios: grid de 3, métricas `text-xl`.
- Métricas siempre en Outfit (`font-display`), color primario, `tracking-tighter`.
- Labels de métricas: `text-xs text-zinc-500`.
- Logo del cliente: `grayscale`, `h-8`.
- Prohibido testimonios sin métricas.

---

## 09. PROCESO — Cómo Trabajamos

### Filosofía

El visitante debe entender el flujo completo en un vistazo. De la consulta inicial a la instalación final.

### Estructura

```
<section class="py-20 md:py-28 lg:py-32 bg-zinc-950 relative">
  <div class="absolute inset-0 opacity-[0.015]" style="background-image: url('/grid-pattern.svg')" />

  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="max-w-3xl mb-16">
      <p class="text-xs font-medium uppercase tracking-wider text-primary mb-4">Proceso</p>
      <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-100 tracking-tight leading-tight">
        De la consulta a la instalación
        <span class="text-zinc-500"> en 6 pasos</span>
      </h2>
    </div>

    <!-- Timeline horizontal (desktop) / vertical (mobile) -->
    <div class="relative">
      <!-- Línea conectora -->
      <div class="hidden lg:block absolute top-12 left-0 right-0 h-px bg-zinc-800/60" />

      <!-- Steps -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-4">
        {processSteps}
      </div>
    </div>
  </div>
</section>
```

### Process Step

```
<div class="relative flex flex-col items-center text-center">
  <!-- Nodo -->
  <div class="relative z-10 w-24 h-24 rounded-2xl border border-zinc-800/60 bg-zinc-900/80 backdrop-blur-sm flex items-center justify-center mb-6 group-hover:border-primary/40 transition-colors duration-300">
    <Icon class="w-10 h-10 text-primary" />
    <!-- Número -->
    <div class="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center">
      {step.number}
    </div>
  </div>

  <!-- Contenido -->
  <h3 class="text-sm font-semibold text-zinc-100 mb-2">{step.title}</h3>
  <p class="text-xs text-zinc-400 leading-relaxed">{step.description}</p>

  <!-- Duración estimada -->
  <div class="mt-3 inline-flex items-center gap-1 rounded-full bg-zinc-800/40 px-2.5 py-1">
    <Clock class="w-3 h-3 text-zinc-500" />
    <span class="font-mono text-[10px] text-zinc-500">{step.duration}</span>
  </div>
</div>
```

### Pasos del proceso

| # | Título | Descripción | Duración | Icono |
|---|---|---|---|---|
| 1 | Consulta inicial | Recibimos su requerimiento y agendamos visita técnica sin costo | 1-2 días | MessageSquare |
| 2 | Diagnóstico en sitio | Medimos caudal, presión, temperatura y contaminantes en su planta | 2-3 días | ClipboardCheck |
| 3 | Ingeniería y diseño | Simulación CFD, selección de equipos y diseño de ductos | 5-10 días | PenTool |
| 4 | Cotización formal | Propuesta técnica y económica detallada con tiempos de entrega | 2-3 días | FileText |
| 5 | Fabricación | Manufactura propia con control de calidad en cada etapa | 15-30 días | Factory |
| 6 | Instalación y pruebas | Montaje, arranque, balanceo y verificación de rendimiento | 5-10 días | CheckCircle |

### Reglas

- Timeline horizontal en desktop (`lg:grid-cols-6`).
- Línea conectora: `h-px bg-zinc-800/60`, oculta en mobile.
- Nodo: `w-24 h-24`, `rounded-2xl`, icono `w-10 h-10`.
- Número: `w-6 h-6`, `rounded-full`, `bg-primary`, posición absoluta `-top-2 -right-2`.
- Duración: `font-mono text-[10px]`, pill con `rounded-full`.
- Mobile: timeline vertical, stacked.

---

## 10. CALCULADORA — Cálculo CFM en Vivo

### Filosofía

El widget más poderoso de la landing. **Engancha al visitante con datos de ingeniería** antes de invitarlo al wizard. Demuestra expertise técnico y genera un lead calificado.

### Estructura

```
<section class="py-20 md:py-28 lg:py-32 bg-zinc-950 relative">
  <div class="absolute inset-0 opacity-[0.015]" style="background-image: url('/grid-pattern.svg')" />

  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

      <!-- Columna izquierda: Info -->
      <div>
        <p class="text-xs font-medium uppercase tracking-wider text-primary mb-4">Calculadora</p>
        <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-100 tracking-tight leading-tight mb-6">
          Calcule el CFM
          <span class="text-primary"> que necesita</span>
        </h2>
        <p class="text-lg text-zinc-400 leading-relaxed mb-8">
          Ingrese las dimensiones de su espacio y el tipo de actividad.
          Nuestro motor de cálculo le dará una estimación técnica inmediata.
        </p>

        <!-- Beneficios -->
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Calculator class="w-4 h-4 text-primary" />
            </div>
            <div>
              <p class="text-sm font-medium text-zinc-100">Cálculo basado en normas</p>
              <p class="text-xs text-zinc-400 mt-1">ASHRAE, RAS, RETIE y normas locales</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Zap class="w-4 h-4 text-primary" />
            </div>
            <div>
              <p class="text-sm font-medium text-zinc-100">Resultado instantáneo</p>
              <p class="text-xs text-zinc-400 mt-1">CFM requerido, renovaciones por hora y equipo recomendado</p>
            </div>
          </div>
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <FileText class="w-4 h-4 text-primary" />
            </div>
            <div>
              <p class="text-sm font-medium text-zinc-100">Reporte descargable</p>
              <p class="text-xs text-zinc-400 mt-1">Reciba el cálculo detallado en PDF por correo</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Columna derecha: Calculadora -->
      <div class="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm p-6 md:p-8">
        <h3 class="text-lg font-semibold text-zinc-100 mb-6">Datos del espacio</h3>

        <form class="space-y-5">
          <!-- Largo -->
          <div>
            <label class="text-sm font-medium text-zinc-300 mb-2 block">Largo del espacio (m)</label>
            <Input type="number" placeholder="Ej: 50" class="font-mono" />
          </div>

          <!-- Ancho -->
          <div>
            <label class="text-sm font-medium text-zinc-300 mb-2 block">Ancho del espacio (m)</label>
            <Input type="number" placeholder="Ej: 30" class="font-mono" />
          </div>

          <!-- Alto -->
          <div>
            <label class="text-sm font-medium text-zinc-300 mb-2 block">Altura (m)</label>
            <Input type="number" placeholder="Ej: 8" class="font-mono" />
          </div>

          <!-- Tipo de actividad -->
          <div>
            <label class="text-sm font-medium text-zinc-300 mb-2 block">Tipo de actividad</label>
            <Select>
              <option>Manufactura general</option>
              <option>Soldadura y corte</option>
              <option>Procesamiento químico</option>
              <option>Almacenamiento</option>
              <option>Data center</option>
              <option>Procesamiento de alimentos</option>
            </Select>
          </div>

          <!-- Altitud -->
          <div>
            <label class="text-sm font-medium text-zinc-300 mb-2 block">Altitud de la planta (msnm)</label>
            <Input type="number" placeholder="Ej: 2640 (Bogotá)" class="font-mono" />
          </div>

          <!-- Botón calcular -->
          <Button size="lg" class="w-full mt-4">
            <Calculator class="w-5 h-5 mr-2" />
            Calcular CFM requerido
          </Button>
        </form>

        <!-- Resultado (aparece después de calcular) -->
        <div class="mt-8 p-6 rounded-xl border border-primary/20 bg-primary/5">
          <p class="text-xs font-medium uppercase tracking-wider text-primary mb-4">Resultado estimado</p>

          <div class="grid grid-cols-2 gap-6">
            <div>
              <p class="font-display text-4xl font-bold text-zinc-100 tracking-tighter">42,500</p>
              <p class="text-xs text-zinc-500 mt-1">CFM requeridos</p>
            </div>
            <div>
              <p class="font-display text-4xl font-bold text-zinc-100 tracking-tighter">12</p>
              <p class="text-xs text-zinc-500 mt-1">Renovaciones/hora</p>
            </div>
          </div>

          <div class="mt-6 pt-4 border-t border-zinc-800/40">
            <p class="text-xs text-zinc-500 mb-2">Equipo recomendado</p>
            <p class="text-sm font-semibold text-zinc-100">2x Extractor Axial AX-HD-48</p>
            <p class="font-mono text-xs text-zinc-400 mt-1">22,500 CFM c/u — 75 HP</p>
          </div>

          <div class="mt-6 flex items-center gap-3">
            <Button size="sm" class="flex-1">
              Solicitar cotización formal
            </Button>
            <Button variant="outline" size="sm">
              <Download class="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

### Reglas de la calculadora

| Regla | Detalle |
|---|---|
| Layout | 50/50 en desktop, stacked en mobile |
| Inputs | `font-mono` para valores numéricos |
| Resultado | `font-display text-4xl font-bold tracking-tighter` |
| Caja de resultado | `border-primary/20 bg-primary/5` |
| Equipo recomendado | Nombre en `font-semibold`, specs en `font-mono` |
| CTA post-cálculo | "Solicitar cotización formal" (primary) + "PDF" (outline) |
| Validación | Todos los campos obligatorios. Validación en tiempo real. |
| Fórmula | CFM = (Largo × Ancho × Alto × ACH) / 60 × factor altitud |
