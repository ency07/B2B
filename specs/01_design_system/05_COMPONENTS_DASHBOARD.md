# COMPONENTES DE DASHBOARD

## 1. Metric Card

### Estructura

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm p-6 hover:shadow-md transition-shadow">
  <div class="flex items-center justify-between">
    <div>
      <p class="text-sm text-zinc-400">{label}</p>
      <p class="font-display text-3xl font-bold text-zinc-100 tracking-tighter mt-1">{value}</p>
      {trend}
    </div>
    <div class="w-12 h-12 rounded-xl bg-primary-muted flex items-center justify-center">
      <Icon class="w-6 h-6 text-primary" />
    </div>
  </div>
</div>
```

### Trend indicator

```
<div class="flex items-center gap-1 mt-2">
  <TrendingUp class="w-4 h-4 text-green-500" />
  <span class="text-xs font-medium text-green-500">+12.5%</span>
  <span class="text-xs text-zinc-500">vs mes anterior</span>
</div>
```

### Variantes de trend

| Estado | Color | Icono |
|---|---|---|
| Positivo | `text-green-500` | `TrendingUp` |
| Negativo | `text-red-500` | `TrendingDown` |
| Neutral | `text-zinc-500` | `Minus` |

### Reglas

- Valor: Outfit, `text-3xl font-bold`, `tracking-tighter`.
- Icono: `w-12 h-12`, `rounded-xl`, fondo `bg-primary-muted`.
- Sparkline opcional debajo del valor.
- Prohibido metric cards sin enlace drill-down o sparkline.

---

## 2. Dashboard Card

### Estructura

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm overflow-hidden">
  <!-- Header -->
  <div class="flex items-center justify-between p-6 pb-4 border-b border-zinc-800/40">
    <div>
      <h3 class="text-base font-semibold text-zinc-100">{title}</h3>
      <p class="text-sm text-zinc-400 mt-0.5">{description}</p>
    </div>
    <div class="flex items-center gap-2">{actions}</div>
  </div>

  <!-- Content -->
  <div class="p-6">{content}</div>

  <!-- Footer (optional) -->
  <div class="px-6 py-3 border-t border-zinc-800/40 flex items-center justify-between">
    <span class="text-xs text-zinc-500">{footerText}</span>
    <a class="text-xs text-primary hover:underline inline-flex items-center gap-1">
      Ver todo <ArrowRight class="w-3.5 h-3.5" />
    </a>
  </div>
</div>
```

### Variantes de contenido

| Contenido | Estructura |
|---|---|
| Tabla | `Table` compacta dentro de `CardContent` |
| Gráfico | `Recharts` con `aspect-[4/3]` o `aspect-[16/9]` |
| Lista | Items con icono, texto, badge, timestamp |
| Timeline | `ActivityTimeline` vertical |
| Formulario | Campos compactos con validación |

### Reglas

- Prohibido tarjetas KPI huérfanas sin contexto.
- Cada card debe tener: título, contenido, acción (drill-down o "Ver todo").
- Header separado del contenido con `border-b`.
- Footer opcional con enlace "Ver todo".

---

## 3. Charts (Recharts)

### Configuración base

```
<ResponsiveContainer width="100%" aspect={4/3}>
  <LineChart data={data}>
    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.3} />
    <XAxis dataKey="name" stroke="var(--foreground-secondary)" fontSize={12} tickLine={false} axisLine={false} />
    <YAxis stroke="var(--foreground-secondary)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
    <Tooltip
      contentStyle={{
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        color: 'var(--foreground)',
      }}
    />
    <Legend />
    <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
  </LineChart>
</ResponsiveContainer>
```

### Tipos de gráfico

| Tipo | Componente | Uso |
|---|---|---|
| Línea | `LineChart` | Tendencia temporal |
| Barras | `BarChart` | Comparación categórica |
| Área | `AreaChart` | Tendencia con volumen |
| Donut | `PieChart` | Distribución (máximo 5 categorías) |
| Sparkline | `LineChart` (mini) | Tendencia en metric card |

### Paleta de datos

| Serie | Color Dark | Color Light |
|---|---|---|
| Principal | `var(--primary)` | `var(--primary)` |
| Secundaria | `#22c55e` (green-500) | `#16a34a` (green-600) |
| Terciaria | `#f59e0b` (amber-500) | `#d97706` (amber-600) |
| Cuaternaria | `#ef4444` (red-500) | `#dc2626` (red-600) |
| Quinta | `#8b5cf6` (violet-500) | `#7c3aed` (violet-600) |

### Reglas

- Color primario de marca para datos principales.
- Paletas secuenciales legibles y de alto contraste (daltonismo).
- Dimensiones estables con aspect ratio controlado.
- Grid: `strokeDasharray="3 3"`, opacidad 30%.
- Sin tick lines, sin axis lines (minimal).
- Tooltip con estilo del tema (card background, border).
- Prohibido gráficos de dona con > 5 categorías.

---

## 4. Activity Timeline

### Estructura

```
<div class="space-y-0">
  {events.map((event, index) => (
    <div key={event.id} class="relative flex gap-4 pb-6 {index !== events.length - 1 ? 'border-l border-zinc-800/40 ml-3' : ''}">
      <!-- Node -->
      <div class="relative flex items-center justify-center -ml-1.5">
        <div class="w-3 h-3 rounded-full bg-primary ring-4 ring-zinc-950" />
      </div>

      <!-- Content -->
      <div class="flex-1 pb-2">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-zinc-100">{event.action}</p>
          <span class="font-mono text-xs text-zinc-500">{event.timestamp}</span>
        </div>
        <p class="text-sm text-zinc-400 mt-0.5">{event.description}</p>

        <!-- Responsable -->
        <div class="flex items-center gap-2 mt-2">
          <Avatar size="xs" name={event.user} />
          <span class="text-xs text-zinc-500">{event.user}</span>
          {event.ip && (
            <span class="font-mono text-xs text-zinc-600">{event.ip}</span>
          )}
        </div>

        <!-- Comentario/Evidencia -->
        {event.comment && (
          <div class="mt-2 p-3 rounded-lg bg-zinc-800/40 border border-zinc-800/40 text-sm text-zinc-300">
            {event.comment}
          </div>
        )}
      </div>
    </div>
  ))}
</div>
```

### Estados de nodo

| Estado | Color | Uso |
|---|---|---|
| Completado | `bg-primary` | Acción finalizada |
| En progreso | `bg-amber-500` | Acción en curso |
| Pendiente | `bg-zinc-600` | Acción futura |
| Error | `bg-red-500` | Acción fallida |

### Reglas

- Línea vertical: `border-l border-zinc-800/40`.
- Nodo: `w-3 h-3`, `rounded-full`, `ring-4 ring-zinc-950`.
- Timestamp en `font-mono`.
- IP y navegador en `font-mono text-zinc-600`.
- Comentario en caja con fondo `bg-zinc-800/40`.
- Usado para trazabilidad inmutable del negocio.

---

## 5. Stepper

### Estructura

```
<div class="flex items-center gap-0">
  {steps.map((step, index) => (
    <React.Fragment key={step.id}>
      <!-- Step -->
      <div class="flex items-center gap-3">
        <div class="flex items-center justify-center w-8 h-8 rounded-full {stepStatus(step)}">
          {stepIcon(step)}
        </div>
        <div class="hidden sm:block">
          <p class="text-sm font-medium {stepTextStatus(step)}">{step.label}</p>
          {step.description && (
            <p class="text-xs text-zinc-500">{step.description}</p>
          )}
        </div>
      </div>

      <!-- Connector -->
      {index < steps.length - 1 && (
        <div class="flex-1 h-px mx-4 {connectorStatus(step)}" />
      )}
    </React.Fragment>
  ))}
</div>
```

### Estados de paso

| Estado | Círculo | Texto | Conector |
|---|---|---|---|
| Completado | `bg-primary text-white` | `text-zinc-100` | `bg-primary` |
| Activo | `bg-primary text-white ring-4 ring-primary-muted` | `text-zinc-100 font-semibold` | `bg-zinc-700` |
| Pendiente | `bg-zinc-800 text-zinc-500` | `text-zinc-500` | `bg-zinc-800` |
| Error | `bg-red-500 text-white` | `text-red-400` | `bg-red-500` |

### Iconos por estado

| Estado | Icono |
|---|---|
| Completado | `Check` (`w-4 h-4`) |
| Activo | Número del paso (`text-sm font-bold`) |
| Pendiente | Número del paso (`text-sm`) |
| Error | `X` (`w-4 h-4`) |

### Reglas

- Círculo: `w-8 h-8`, `rounded-full`.
- Conector: `h-px` (1px), flex-1.
- Label oculto en mobile (`hidden sm:block`).
- Usado en wizards y flujos multi-paso.

---

## 6. Wizard

### Estructura

```
<div class="max-w-3xl mx-auto">
  <!-- Stepper -->
  <Stepper steps={steps} currentStep={currentStep} class="mb-8" />

  <!-- Step content -->
  <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm p-6 md:p-8">
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-zinc-100">{currentStep.title}</h2>
      <p class="text-sm text-zinc-400 mt-1">{currentStep.description}</p>
    </div>

    <form class="space-y-6">
      {stepFields}
    </form>
  </div>

  <!-- Navigation -->
  <div class="mt-6 flex items-center justify-between">
    <Button
      variant="outline"
      onClick={onPrevious}
      disabled={currentStep === 0}
    >
      <ArrowLeft class="w-4 h-4 mr-2" />
      Anterior
    </Button>

    <div class="flex items-center gap-3">
      <span class="text-sm text-zinc-500">
        Paso {currentStep + 1} de {steps.length}
      </span>
      <Button onClick={onNext}>
        {isLastStep ? 'Finalizar' : 'Siguiente'}
        <ArrowRight class="w-4 h-4 ml-2" />
      </Button>
    </div>
  </div>
</div>
```

### Reglas

- Máximo ancho: `max-w-3xl` (768px).
- Stepper arriba del contenido.
- Formulario con `space-y-6`.
- Navegación: "Anterior" a la izquierda, "Siguiente" a la derecha.
- Contador de pasos: "Paso X de Y".
- Validación por paso antes de avanzar.
- Prohibido avanzar si hay errores de validación.
- Usado para cotizador web (wizard de captación de leads).
