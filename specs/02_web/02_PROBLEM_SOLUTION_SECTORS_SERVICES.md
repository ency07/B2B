# PROBLEMA + SOLUCIÓN + SECTORES + SERVICIOS

---

## 03. PROBLEMA — Pain Points Industriales

### Filosofía

Antes de vender, **conectar**. El visitante debe sentir: "Estos entienden exactamente lo que me pasa."

### Estructura

```
<section class="py-20 md:py-28 lg:py-32 bg-zinc-950 relative">
  <!-- Grid de fondo -->
  <div class="absolute inset-0 opacity-[0.015]" style="background-image: url('/grid-pattern.svg')" />

  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="max-w-3xl mb-16">
      <p class="text-xs font-medium uppercase tracking-wider text-primary mb-4">El problema</p>
      <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-100 tracking-tight leading-tight">
        Su planta pierde dinero cada hora
        <span class="text-zinc-500">sin ventilación adecuada</span>
      </h2>
      <p class="mt-6 text-lg text-zinc-400 leading-relaxed">
        El 73% de las plantas industriales en LATAM operan con sistemas de ventilación
        subdimensionados, obsoletos o mal instalados. Las consecuencias son medibles.
      </p>
    </div>

    <!-- Pain points grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {painPoints}
    </div>
  </div>
</section>
```

### Pain Point Card

```
<div class="group relative rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm p-8 hover:border-red-900/40 transition-all duration-300">
  <!-- Indicador de severidad -->
  <div class="absolute top-0 left-8 w-12 h-0.5 bg-red-500/60 rounded-full" />

  <!-- Icono -->
  <div class="w-12 h-12 rounded-xl bg-red-950/30 border border-red-900/20 flex items-center justify-center mb-6">
    <Icon class="w-6 h-6 text-red-400" />
  </div>

  <!-- Contenido -->
  <h3 class="text-lg font-semibold text-zinc-100 mb-3">{painPoint.title}</h3>
  <p class="text-sm text-zinc-400 leading-relaxed mb-4">{painPoint.description}</p>

  <!-- Métrica de impacto -->
  <div class="flex items-center gap-2 pt-4 border-t border-zinc-800/40">
    <TrendingDown class="w-4 h-4 text-red-400 shrink-0" />
    <span class="font-mono text-sm text-red-400">{painPoint.impact}</span>
  </div>
</div>
```

### Pain Points definidos

| # | Título | Descripción | Impacto | Icono |
|---|---|---|---|---|
| 1 | Temperatura incontrolable | Plantas que superan 45°C en verano, afectando productividad y salud laboral | -30% productividad | Thermometer |
| 2 | Polvo y contaminantes | Material particulado sin control que daña equipos y pulmones | +40% enfermedades | Wind |
| 3 | Consumo energético excesivo | Sistemas sobredimensionados que gastan energía sin ventilar eficientemente | +25% costo eléctrico | Zap |
| 4 | Paradas no programadas | Fallas en equipos por sobrecalentamiento que detienen producción | $200M COP/año pérdidas | AlertTriangle |
| 5 | Incumplimiento normativo | Plantas que no cumplen RETIE, RAS, OSHA ni normas locales | Multas + clausuras | ShieldAlert |
| 6 | Mantenimiento reactivo | Reparaciones de emergencia en lugar de mantenimiento preventivo | 3x costo de mantenimiento | Wrench |

### Reglas

- Indicador de severidad: línea roja en el borde superior (`w-12 h-0.5 bg-red-500/60`).
- Icono: fondo `bg-red-950/30`, borde `border-red-900/20`, icono `text-red-400`.
- Métrica de impacto: `font-mono text-red-400`.
- Hover: borde cambia a `border-red-900/40`.
- Prohibido cards sin métrica de impacto.

---

## 04. SOLUCIÓN — Cómo AeroMax Resuelve

### Filosofía

Después del dolor, la **respuesta**. No features genéricas. Soluciones específicas para cada pain point.

### Estructura

```
<section class="py-20 md:py-28 lg:py-32 bg-zinc-950 relative">
  <div class="absolute inset-0 opacity-[0.015]" style="background-image: url('/grid-pattern.svg')" />

  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="max-w-3xl mb-16">
      <p class="text-xs font-medium uppercase tracking-wider text-primary mb-4">La solución</p>
      <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-100 tracking-tight leading-tight">
        Ingeniería de precisión
        <span class="text-primary"> para cada desafío</span>
      </h2>
    </div>

    <!-- Bloque ancla: Split 60/40 -->
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
      <!-- Columna principal (60%) -->
      <div class="lg:col-span-3 space-y-8">
        {solutionBlocks}
      </div>

      <!-- Columna lateral (40%): Visual técnico -->
      <div class="lg:col-span-2 sticky top-24">
        <div class="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm p-6">
          <!-- SVG de flujo de aire -->
          <img src="/airflow-diagram.svg" alt="Diagrama de flujo" class="w-full" />
          <div class="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p class="font-mono text-xs text-zinc-500">Reducción temperatura</p>
              <p class="font-mono text-lg text-green-400 font-bold">-18°C</p>
            </div>
            <div>
              <p class="font-mono text-xs text-zinc-500">Ahorro energético</p>
              <p class="font-mono text-lg text-green-400 font-bold">-35%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>
```

### Solution Block

```
<div class="flex gap-6 group">
  <!-- Número -->
  <div class="shrink-0 w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
    <span class="font-mono text-sm font-bold text-primary">{number}</span>
  </div>

  <!-- Contenido -->
  <div>
    <h3 class="text-lg font-semibold text-zinc-100 mb-2">{solution.title}</h3>
    <p class="text-sm text-zinc-400 leading-relaxed">{solution.description}</p>
  </div>
</div>
```

### Soluciones definidas

| # | Título | Descripción |
|---|---|---|
| 01 | Diagnóstico aerodinámico | Análisis CFD del flujo de aire en su planta. Identificamos zonas muertas, turbulencias y puntos de calor antes de diseñar cualquier solución. |
| 02 | Diseño a medida | Cada extractor, ducto y damper se diseña para las condiciones exactas de su operación: altitud, temperatura, contaminantes, volumen. |
| 03 | Fabricación industrial | Manufactura propia con acero de grado industrial, balanceo dinámico y pruebas de rendimiento antes del despacho. |
| 04 | Instalación certificada | Equipos técnicos certificados con experiencia en plantas mineras, siderúrgicas, data centers y manufactura. |
| 05 | Monitoreo post-instalación | Mediciones de CFM, presión y temperatura después de la instalación para verificar cumplimiento del diseño. |

### Reglas

- Composición asimétrica 60/40.
- Columna lateral `sticky top-24` (se mantiene visible al hacer scroll).
- Números en `font-mono` con fondo `bg-primary/10`.
- Visual técnico: SVG de flujo de aire, no imagen genérica.
- Métricas de resultado en `font-mono text-green-400`.

---

## 05. SECTORES — Industrias que Atendemos

### Filosofía

El visitante debe ver su industria y pensar: "Estos saben de lo mío."

### Estructura

```
<section class="py-20 md:py-28 lg:py-32 bg-zinc-950 relative">
  <div class="absolute inset-0 opacity-[0.015]" style="background-image: url('/grid-pattern.svg')" />

  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="max-w-3xl mb-16">
      <p class="text-xs font-medium uppercase tracking-wider text-primary mb-4">Sectores</p>
      <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-100 tracking-tight leading-tight">
        Donde la ventilación
        <span class="text-zinc-500"> es crítica</span>
      </h2>
    </div>

    <!-- Grid de sectores -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {sectorCards}
    </div>
  </div>
</section>
```

### Sector Card

```
<div class="group relative rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden cursor-pointer hover:border-zinc-700 hover:shadow-md transition-all duration-300">
  <!-- Imagen de fondo con overlay -->
  <div class="aspect-[16/10] relative">
    <img src={sector.image} alt={sector.name}
         class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
    <div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />

    <!-- Contenido overlay -->
    <div class="absolute inset-0 flex flex-col justify-end p-6">
      <!-- Icono con backdrop blur -->
      <div class="w-10 h-10 rounded-lg bg-primary/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center mb-3">
        <Icon class="w-5 h-5 text-primary" />
      </div>

      <h3 class="text-xl font-semibold text-zinc-100">{sector.name}</h3>
      <p class="text-sm text-zinc-400 mt-1 line-clamp-2">{sector.description}</p>

      <!-- Métricas del sector -->
      <div class="mt-3 flex items-center gap-4">
        <span class="font-mono text-xs text-zinc-500">{sector.projects} proyectos</span>
        <span class="font-mono text-xs text-zinc-500">{sector.avgCFM} CFM promedio</span>
      </div>
    </div>
  </div>
</div>
```

### Sectores definidos

| Sector | Icono | Proyectos | CFM promedio | Descripción |
|---|---|---|---|---|
| Minería | Mountain | 45+ | 80,000 | Ventilación de túneles, socavones y plantas de procesamiento minero |
| Siderurgia | Flame | 30+ | 120,000 | Extracción de humos, gases y calor en hornos y líneas de producción |
| Data Centers | Server | 25+ | 50,000 | Climatización de precisión para salas de servidores y racks |
| Manufactura | Factory | 80+ | 35,000 | Ventilación general y extracción localizada para líneas de producción |
| Alimentos | UtensilsCrossed | 35+ | 25,000 | Control de temperatura, humedad y contaminantes en procesamiento |
| Química | FlaskConical | 20+ | 60,000 | Extracción de vapores químicos y ventilación de áreas clasificadas |

### Reglas

- Imagen de fondo real del sector (no ilustración genérica).
- Overlay gradiente: `from-zinc-950 via-zinc-950/60 to-transparent`.
- Icono: `bg-primary/20 backdrop-blur-sm border-primary/30`.
- Métricas: `font-mono text-xs text-zinc-500`.
- Hover: imagen `scale-110` (500ms), borde `zinc-700`, `shadow-md`.

---

## 06. SERVICIOS — Preingeniería y Servicios Técnicos

### Filosofía

No vendemos productos. Vendemos **capacidad de ingeniería**. Cada servicio es una demostración de expertise.

### Estructura

```
<section class="py-20 md:py-28 lg:py-32 bg-zinc-950 relative">
  <div class="absolute inset-0 opacity-[0.015]" style="background-image: url('/grid-pattern.svg')" />

  <div class="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <!-- Header -->
    <div class="max-w-3xl mb-16">
      <p class="text-xs font-medium uppercase tracking-wider text-primary mb-4">Servicios</p>
      <h2 class="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-zinc-100 tracking-tight leading-tight">
        Ingeniería completa
        <span class="text-primary"> de principio a fin</span>
      </h2>
    </div>

    <!-- Services: alternating layout -->
    <div class="space-y-24">
      {serviceBlocks}
    </div>
  </div>
</section>
```

### Service Block (alternating)

```
<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center {isEven ? 'lg:direction-rtl' : ''}">
  <!-- Visual -->
  <div class="relative rounded-2xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden aspect-[4/3]">
    <img src={service.image} alt={service.title} class="w-full h-full object-cover" />
    <div class="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent" />

    <!-- Floating spec badge -->
    <div class="absolute bottom-4 left-4 rounded-lg bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/60 px-4 py-2">
      <p class="font-mono text-xs text-zinc-500">{service.specLabel}</p>
      <p class="font-mono text-sm text-primary font-bold">{service.specValue}</p>
    </div>
  </div>

  <!-- Content -->
  <div class="space-y-6 {isEven ? 'lg:direction-ltr' : ''}">
    <div class="inline-flex items-center gap-2 rounded-full border border-zinc-800/60 bg-zinc-900/60 px-3 py-1">
      <Icon class="w-4 h-4 text-primary" />
      <span class="text-xs font-medium text-zinc-400">{service.category}</span>
    </div>

    <h3 class="font-display text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">{service.title}</h3>
    <p class="text-base text-zinc-400 leading-relaxed">{service.description}</p>

    <!-- Features -->
    <ul class="space-y-3">
      {service.features.map(feature => (
        <li class="flex items-start gap-3">
          <Check class="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <span class="text-sm text-zinc-300">{feature}</span>
        </li>
      ))}
    </ul>

    <Button variant="outline" size="sm">
      Conocer más <ArrowRight class="w-4 h-4 ml-2" />
    </Button>
  </div>
</div>
```

### Servicios definidos

| # | Título | Categoría | Spec | Features |
|---|---|---|---|---|
| 1 | Simulación CFD | Preingeniería | Análisis 3D | Modelado del flujo de aire, Identificación de zonas muertas, Optimización de ductos, Reporte técnico completo |
| 2 | Balanceo dinámico | Mantenimiento | < 0.5 mm/s | Balanceo in-situ, Análisis de vibraciones, Corrección de desalineación, Certificado de balanceo |
| 3 | Diseño aerodinámico | Ingeniería | Custom | Selección de equipo óptimo, Cálculo de ductos y dampers, Curvas de rendimiento, Planos de fabricación |
| 4 | Instalación industrial | Ejecución | Certified | Montaje mecánico, Conexión eléctrica, Pruebas de arranque, Capacitación de operadores |
| 5 | Mantenimiento preventivo | Post-venta | Programado | Inspección periódica, Lubricación y ajuste, Reemplazo de componentes, Reporte de condición |
| 6 | Auditoría energética | Consultoría | ROI medible | Medición de consumo, Análisis de eficiencia, Propuesta de optimización, Cálculo de retorno |

### Reglas

- Layout alternante: imagen izquierda / contenido derecha, luego invertido.
- `space-y-24` entre bloques de servicio (96px).
- Floating spec badge: `bg-zinc-900/80 backdrop-blur-sm`.
- Features con `Check` de color primario.
- Prohibido grid uniforme de tarjetas idénticas.
