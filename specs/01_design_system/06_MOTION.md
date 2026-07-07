# MOTION — Sistema de Animación

## 1. Política de animación

1. Animaciones sutiles, informativas y rápidas.
2. Duración máxima: **200ms**.
3. Prohibido rebotes bruscos u oscilaciones excesivas.
4. Transición de páginas: desvanecimiento + traslación vertical leve.
5. Micro-interacciones: escala ligera (1.01-1.02), no rebotes.
6. Desplegables: acordeón vertical con `easeOut`.
7. Skeletons: pulso infinito de 1.5s.
8. `will-change` solo en elementos animados complejos.

---

## 2. Duraciones

| Token | Valor | Uso |
|---|---|---|
| `duration-instant` | 50ms | Feedback de clic, toggle |
| `duration-fast` | 100ms | Hover de botones, pressed |
| `duration-normal` | 200ms | Hover de cards, transiciones de estado |
| `duration-slow` | 300ms | Transiciones de página, sheets |
| `duration-slower` | 500ms | Entradas de hero, reveals |
| `duration-skeleton` | 1500ms | Pulso de skeleton (infinito) |

---

## 3. Easing

| Token | Valor | Uso |
|---|---|---|
| `ease-linear` | `linear` | Skeletons, spinners |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Entradas, aperturas |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Salidas, cierres |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Transiciones de estado |
| `ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Micro-interacciones premium |

---

## 4. Hover

### Botones

```
whileHover={{ scale: 1.01 }}
transition={{ duration: 0.1, ease: 'easeOut' }}
```

### Cards

```
whileHover={{ scale: 1.01, y: -2 }}
transition={{ duration: 0.2, ease: 'easeOut' }}
```

### Links

```
className="hover:text-zinc-100 transition-colors duration-200"
```

### Tabla filas

```
className="hover:bg-zinc-800/20 transition-colors duration-200"
```

### Reglas

- Escala máxima: `1.02`. Prohibido `1.05` o superior.
- Sin rebotes. Sin oscilaciones.
- Duración: 100-200ms.

---

## 5. Focus

### Inputs

```
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-shadow duration-200"
```

### Botones

```
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
```

### Reglas

- Ring: 2px, color `var(--ring)`.
- Offset: 2px, color `var(--background)`.
- Contraste mínimo 3:1 contra fondo.
- Prohibido `outline: none` sin alternativa visual.

---

## 6. Loading

### Spinner

```
<div class="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
```

| Tamaño | Clases | Uso |
|---|---|---|
| `xs` | `w-3 h-3` | Dentro de botones sm |
| `sm` | `w-4 h-4` | Dentro de botones default |
| `md` | `w-6 h-6` | Loading inline |
| `lg` | `w-8 h-8` | Loading de sección |
| `xl` | `w-12 h-12` | Loading de página |

### Button loading

```
<Button isLoading>
  <Loader2 class="w-4 h-4 animate-spin" />
  Guardando...
</Button>
```

### Reglas

- Spinner `animate-spin` con `border-2`.
- Botón en loading: `pointer-events-none` (bloquea doble clic).
- Texto se mantiene visible durante loading.

---

## 7. Skeleton

### Estructura

```
<div class="animate-pulse rounded-lg bg-zinc-800/60" />
```

### Variantes

| Elemento | Clases |
|---|---|
| Texto línea | `h-4 w-full rounded` |
| Título | `h-6 w-3/4 rounded` |
| Avatar | `w-10 h-10 rounded-full` |
| Card | `rounded-xl h-48` |
| Tabla fila | `h-10 w-full rounded` |
| Imagen | `aspect-[4/3] rounded-xl` |
| Botón | `h-10 w-24 rounded-lg` |

### Animación

```
animate={{ opacity: [0.4, 0.8, 0.4] }}
transition={{ duration: 1.5, ease: 'linear', repeat: Infinity }}
```

### Reglas

- Pulso: opacidad de 0.4 a 0.8.
- Duración: 1.5s, infinita.
- Color: `bg-zinc-800/60` (dark) / `bg-slate-200` (light).
- Radius coherente con el elemento que reemplaza.

---

## 8. Empty States

### Estructura

```
<div class="flex flex-col items-center justify-center py-16 text-center">
  <div class="w-16 h-16 rounded-2xl bg-zinc-800/40 flex items-center justify-center mb-4">
    <Icon class="w-8 h-8 text-zinc-500" />
  </div>
  <h3 class="text-lg font-semibold text-zinc-100">{title}</h3>
  <p class="text-sm text-zinc-400 mt-2 max-w-sm">{description}</p>
  <Button class="mt-6">{actionLabel}</Button>
</div>
```

### Reglas

- Icono: `w-16 h-16`, `rounded-2xl`, fondo `bg-zinc-800/40`, icono `w-8 h-8 text-zinc-500`.
- Título: `text-lg font-semibold`.
- Descripción: `text-sm text-zinc-400`, máximo `max-w-sm`.
- Acción: botón primario con label descriptivo.
- Padding: `py-16`.

---

## 9. Transiciones de página

### Estructura

```
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  {children}
</motion.div>
```

### Reglas

- Entrada: `opacity: 0 → 1`, `y: 10 → 0`.
- Salida: `opacity: 1 → 0`, `y: 0 → -10`.
- Duración: 300ms.
- Easing: `easeOut`.
- Prohibido transiciones con rotación o escala.

---

## 10. Microinteracciones

### Sheet (Drawer)

```
variants={{
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
}}
```

### Modal

```
variants={{
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.15, ease: 'easeIn' } },
}}
```

### Dropdown

```
variants={{
  hidden: { opacity: 0, y: -8, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, scale: 0.96, transition: { duration: 0.1, ease: 'easeIn' } },
}}
```

### Tooltip

```
variants={{
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.1, ease: 'easeOut' } },
  exit: { opacity: 0, y: 4, transition: { duration: 0.05, ease: 'easeIn' } },
}}
```

### Toast

```
variants={{
  hidden: { x: '100%', opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3, ease: 'ease-spring' } },
  exit: { x: '100%', opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
}}
```

### Accordion

```
variants={{
  collapsed: { height: 0, opacity: 0 },
  expanded: { height: 'auto', opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
}}
```

### Badge change

```
animate={{ scale: [1, 1.1, 1] }}
transition={{ duration: 0.3, ease: 'ease-spring' }}
```

### Reglas

- Toda interacción debe responder. Nada puede sentirse muerto.
- Todo debe sentirse vivo. Pero elegante. Nunca exagerado.
- Duración máxima: 200ms para micro-interacciones.
- `will-change` solo en elementos animados complejos.

---

## 11. Tabla de animaciones por componente

| Componente | Evento | Duración | Easing | Efecto |
|---|---|---|---|---|
| Button | Hover | 100ms | easeOut | scale 1.01 |
| Button | Pressed | 100ms | easeOut | scale 0.98 |
| Card | Hover | 200ms | easeOut | scale 1.01, y -2 |
| Card | Selected | 200ms | ease-spring | border-color change |
| Input | Focus | 200ms | easeOut | ring appearance |
| Modal | Open | 200ms | easeOut | scale 0.95→1, opacity 0→1 |
| Modal | Close | 150ms | easeIn | scale 1→0.95, opacity 1→0 |
| Sheet | Open | 300ms | easeOut | slide from right |
| Sheet | Close | 200ms | easeIn | slide to right |
| Dropdown | Open | 150ms | easeOut | fade + slide down |
| Dropdown | Close | 100ms | easeIn | fade + slide up |
| Tooltip | Show | 100ms | easeOut | fade + slide up |
| Tooltip | Hide | 50ms | easeIn | fade |
| Toast | Enter | 300ms | ease-spring | slide from right |
| Toast | Exit | 200ms | easeIn | slide to right |
| Page | Enter | 300ms | easeOut | fade + y 10→0 |
| Page | Exit | 200ms | easeIn | fade + y 0→-10 |
| Skeleton | Pulse | 1500ms | linear | opacity 0.4→0.8→0.4 |
| Spinner | Spin | infinite | linear | rotate 360° |
| Badge | Change | 300ms | ease-spring | scale 1→1.1→1 |
| Accordion | Expand | 200ms | easeOut | height 0→auto |
| Accordion | Collapse | 200ms | easeIn | height auto→0 |
