# COMPONENTES CORE

## 1. Button

### Estructura

```
<button class="inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
  {icon} {label}
</button>
```

### Variantes

| Variante | Clases Dark | Clases Light | Uso |
|---|---|---|---|
| `default` | `bg-primary text-white hover:bg-primary-hover` | `bg-primary text-white hover:bg-primary-hover` | Acción principal de la pantalla (único por vista) |
| `secondary` | `bg-zinc-800 text-zinc-100 hover:bg-zinc-700` | `bg-white text-slate-900 border border-slate-300 hover:bg-slate-50` | Acción secundaria |
| `destructive` | `bg-red-600 text-white hover:bg-red-700` | `bg-red-600 text-white hover:bg-red-700` | Eliminar, cancelar, peligro |
| `outline` | `border border-zinc-700 bg-transparent text-zinc-100 hover:bg-zinc-800` | `border border-slate-300 bg-transparent text-slate-900 hover:bg-slate-50` | Acción terciaria, filtros |
| `ghost` | `text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800` | `text-slate-600 hover:text-slate-900 hover:bg-slate-100` | Icon-only, acciones mínimas |
| `link` | `text-primary underline-offset-4 hover:underline` | `text-primary underline-offset-4 hover:underline` | Navegación inline |

### Tamaños

| Tamaño | Clases | Altura | Padding | Icono |
|---|---|---|---|---|
| `sm` | `h-8 px-3 text-xs` | 32px | 12px | `w-3.5 h-3.5` |
| `default` | `h-10 px-4 py-2 text-sm` | 40px | 16px/8px | `w-4 h-4` |
| `lg` | `h-12 px-6 text-base` | 48px | 24px | `w-5 h-5` |
| `icon` | `h-10 w-10` | 40px | — | `w-4 h-4` |
| `icon-sm` | `h-8 w-8` | 32px | — | `w-3.5 h-3.5` |

### Estados

| Estado | Comportamiento |
|---|---|
| **Default** | Color base de la variante |
| **Hover** | Escala `1.01` + cambio de color (200ms ease-out) |
| **Focus** | `ring-2 ring-ring ring-offset-2` (offset: 2px) |
| **Pressed** | Escala `0.98` (100ms ease-out) |
| **Disabled** | `opacity-50 pointer-events-none` |
| **Loading** | Spinner `animate-spin` reemplaza icono, texto se mantiene, `pointer-events-none` |

### Reglas

- **Un único botón primario por vista**. Reservado para la confirmación de la transacción clave.
- Prohibido crear variantes ad-hoc (`MainButton.tsx`, `BlueButton.tsx`). Todo botón es instancia de `Button.tsx`.
- Iconos siempre `shrink-0` para evitar deformaciones en flex layouts.
- Loading state bloquea clics repetitivos.

---

## 2. Input

### Estructura

```
<div class="relative">
  <input class="flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
  {icon-start} {icon-end}
</div>
```

### Variantes

| Variante | Clases | Uso |
|---|---|---|
| `default` | Borde `zinc-800`, fondo `zinc-900/50` | Input estándar |
| `search` | Con icono de lupa a la izquierda | Búsqueda |
| `error` | Borde `red-500`, icono de advertencia | Validación fallida |
| `success` | Borde `green-500`, icono de check | Validación exitosa |
| `disabled` | `opacity-50 cursor-not-allowed` | Solo lectura |

### Tamaños

| Tamaño | Clases | Altura |
|---|---|---|
| `sm` | `h-8 text-xs px-2.5` | 32px |
| `default` | `h-10 text-sm px-3 py-2` | 40px |
| `lg` | `h-12 text-base px-4` | 48px |

### Estados

| Estado | Visual |
|---|---|
| **Default** | Borde `zinc-800/60`, fondo `zinc-900/50` |
| **Focus** | `ring-2 ring-ring ring-offset-2` |
| **Error** | Borde `red-500`, icono `AlertCircle`, mensaje debajo en `text-red-400 text-xs` |
| **Success** | Borde `green-500`, icono `Check` |
| **Disabled** | `opacity-50 cursor-not-allowed` |
| **Loading** | Spinner `animate-spin` a la derecha |

### Reglas

- Validación reactiva en `onChange` y `onBlur` con Zod.
- Mensaje de error siempre visible debajo del input.
- Iconos siempre `shrink-0` y `absolute` posicionados.
- Prohibido usar `useState` para valores de input. Usar React Hook Form.

---

## 3. Textarea

### Estructura

```
<textarea class="flex min-h-[80px] w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y" />
```

### Reglas

- Redimensionamiento vertical únicamente (`resize-y`).
- Altura mínima: `min-h-[80px]`.
- Mismos estados que Input.

---

## 4. Select / Combobox

### Select (listas cortas)

```
<select class="flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring appearance-none">
  <option>...</option>
</select>
```

### Combobox (catálogos grandes)

- Radix `Popover` + `Command` (shadcn).
- Búsqueda difusa integrada.
- Placeholder: "Buscar..."
- Máximo 10 items visibles sin scroll.
- Icono `ChevronDown` a la derecha.

### Reglas

- Select para < 10 opciones estáticas.
- Combobox para > 10 opciones o catálogos dinámicos (clientes, productos).
- Siempre con label visible. Prohibido placeholder como único label.

---

## 5. Checkbox / Switch

### Checkbox

```
<label class="flex items-center gap-2 text-sm text-zinc-300">
  <input type="checkbox" class="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-primary focus:ring-primary focus:ring-offset-0" />
  {label}
</label>
```

### Switch

```
<label class="flex items-center gap-2 text-sm text-zinc-300">
  <Switch class="data-[state=checked]:bg-primary data-[state=unchecked]:bg-zinc-700" />
  {label}
</label>
```

### Reglas

- Checkbox para selección múltiple.
- Switch para toggles binarios (activo/inactivo, visible/oculto).
- Gap entre control y label: `gap-2` (8px).

---

## 6. Card

### Estructura

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 backdrop-blur-sm shadow-sm transition-shadow hover:shadow-md">
  <div class="p-6">
    <div class="mb-4">
      <h3 class="text-lg font-semibold text-zinc-100">{title}</h3>
      <p class="text-sm text-zinc-400">{description}</p>
    </div>
    <div class="text-zinc-300">{content}</div>
    <div class="mt-4 pt-4 border-t border-zinc-800/60">{footer}</div>
  </div>
</div>
```

### Variantes

| Variante | Clases adicionales | Uso |
|---|---|---|
| `default` | Estándar | Cards genéricas |
| `interactive` | `cursor-pointer hover:border-zinc-700` | Cards clickeables |
| `selected` | `border-primary bg-primary-muted` | Card seleccionada |
| `metric` | `p-6` con KPI grande | Metric cards de dashboard |
| `compact` | `p-4` | Cards de grid denso |

### Componentes estructurales

| Elemento | Clases |
|---|---|
| `CardHeader` | `p-6 pb-3` |
| `CardTitle` | `text-lg font-semibold text-zinc-100` |
| `CardDescription` | `text-sm text-zinc-400 mt-1` |
| `CardContent` | `p-6 pt-0` |
| `CardFooter` | `p-6 pt-0 mt-4 border-t border-zinc-800/60` |

### Reglas

- Prohibido cards que sean únicamente: icono + título + texto + botón.
- Cada card debe comunicar valor antes de leer.
- Hover: `shadow-md` + escala `1.01` (200ms).
- Nunca `rounded-3xl` en cards del ERP.

---

## 7. Dialog (Modal)

### Estructura

```
<Dialog>
  <DialogContent class="sm:max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
    <DialogHeader>
      <DialogTitle class="text-lg font-semibold text-zinc-100">{title}</DialogTitle>
      <DialogDescription class="text-sm text-zinc-400">{description}</DialogDescription>
    </DialogHeader>
    <div class="py-4">{content}</div>
    <DialogFooter>{actions}</DialogFooter>
  </DialogContent>
</Dialog>
```

### Tamaños

| Tamaño | Max-width | Uso |
|---|---|---|
| `sm` | `max-w-sm` (384px) | Confirmaciones simples |
| `md` | `max-w-lg` (512px) | Formularios cortos |
| `lg` | `max-w-2xl` (672px) | Formularios detallados |
| `xl` | `max-w-4xl` (896px) | Vistas complejas |
| `full` | `max-w-none` | Pantalla completa |

### Overlay

- `backdrop-blur-sm bg-black/50`
- Focus trap nativo (Radix).
- Cierre con Escape o clic fuera.

### Reglas

- Reservado para acciones críticas de confirmación o edición rápida.
- Centrado en pantalla.
- Fondo traslúcido oscuro.
- Z-index: `z-50`.

---

## 8. Sheet (Drawer)

### Estructura

```
<Sheet>
  <SheetContent side="right" class="w-[40%] sm:w-[50%] border-l border-zinc-800 bg-zinc-900">
    <SheetHeader>
      <SheetTitle>{title}</SheetTitle>
      <SheetDescription>{description}</SheetDescription>
    </SheetHeader>
    <div class="py-4">{content}</div>
    <SheetFooter>{actions}</SheetFooter>
  </SheetContent>
</Sheet>
```

### Tamaños

| Tamaño | Ancho | Uso |
|---|---|---|
| `sm` | `w-[30%]` | Detalles rápidos |
| `md` | `w-[40%]` | Estándar para edición de registros |
| `lg` | `w-[50%]` | Formularios detallados |
| `xl` | `w-[70%]` | Vistas complejas con contexto |

### Uso principal

- **Drill-down de registros**: Al interactuar con un registro en tabla, deslizar panel lateral derecho con:
  1. Cabecera inmutable: código, estado (badge), acciones inmediatas
  2. Cuerpo con tabs: Detalles, Materiales/Costos, Historial de Auditoría, Activity Timeline
  3. Pie: botones de cierre y guardado

### Reglas

- Prohibido redirigir fuera del contexto para ver detalles de un registro.
- Siempre desde la derecha (`side="right"`).
- Mantiene visible el contexto de la página principal.
- Z-index: `z-50`.

---

## 9. Table

### Estructura

```
<div class="rounded-xl border border-zinc-800/60 overflow-hidden">
  <table class="w-full">
    <thead class="bg-zinc-900/60">
      <tr>
        <th class="text-left text-xs font-medium text-zinc-400 uppercase tracking-wider px-4 py-2.5">{header}</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-zinc-800/40">
      <tr class="hover:bg-zinc-800/20 transition-colors">
        <td class="px-4 py-2.5 text-sm text-zinc-300">{cell}</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Alineación semántica

| Tipo de dato | Alineación | Fuente |
|---|---|---|
| Texto, identificadores | Izquierda | Inter |
| Números, financieros (m³, CFM, COP) | Derecha | JetBrains Mono |
| Fechas | Centro | Inter |
| Badges/estados | Centro | Inter |

### Densidad

| Densidad | Padding vertical | Uso |
|---|---|---|
| `compact` | `py-2` | Tablas operativas de alta densidad |
| `default` | `py-2.5` | Tablas estándar |
| `comfortable` | `py-3` | Tablas de reporte |

### Header

- Fondo: `bg-zinc-900/60`
- Texto: `text-xs font-medium text-zinc-400 uppercase tracking-wider`
- Iconos de ordenación: `SortAsc` / `SortDesc` (`w-4 h-4`)

### Fila

- Hover: `hover:bg-zinc-800/20`
- Separador: `border-b border-zinc-800/40`
- Selección: `bg-primary-muted`

### Paginación

```
<div class="flex items-center justify-between px-4 py-3 border-t border-zinc-800/60">
  <span class="text-sm text-zinc-400">{total} registros</span>
  <div class="flex items-center gap-2">
    <select class="h-8 text-xs">{10, 25, 50}</select>
    <Button variant="ghost" size="icon-sm">{ChevronLeft}</Button>
    <span class="text-sm text-zinc-300">{page} de {totalPages}</span>
    <Button variant="ghost" size="icon-sm">{ChevronRight}</Button>
  </div>
</div>
```

### Reglas

- Filtros persistentes como Query Parameters en URL.
- Prohibido tablas sin paginación si > 25 registros.
- Prohibido tablas sin estado Empty.
- Checkbox de fila para selección múltiple.

---

## 10. Badge

### Estructura

```
<span class="inline-flex items-center gap-1.5 rounded-sm px-2 py-0.5 text-xs font-medium">
  <span class="w-1.5 h-1.5 rounded-full bg-{color}"></span>
  {label}
</span>
```

### Variantes semánticas

| Variante | Fondo Dark | Texto Dark | Fondo Light | Texto Light | Uso |
|---|---|---|---|---|---|
| `success` | `bg-green-950/50` | `text-green-400` | `bg-green-100` | `text-green-800` | PAGADA, FINALIZADA, ACTIVA |
| `warning` | `bg-amber-950/50` | `text-amber-400` | `bg-amber-100` | `text-amber-800` | EN_REVISION, PENDIENTE |
| `danger` | `bg-red-950/50` | `text-red-400` | `bg-red-100` | `text-red-800` | CANCELADA, RECHAZADA, VENCIDA |
| `info` | `bg-blue-950/50` | `text-blue-400` | `bg-blue-100` | `text-blue-800` | EN_EJECUCION, PROCESANDO |
| `neutral` | `bg-zinc-800/50` | `text-zinc-400` | `bg-slate-100` | `text-slate-700` | BORRADOR, NUEVO |
| `primary` | `bg-primary-muted` | `text-primary` | `bg-primary-muted` | `text-primary` | Estado personalizado |

### Reglas

- Fondo translúcido (`opacity-10%` del color). Prohibido fondos de alta saturación.
- Indicador circular (`w-1.5 h-1.5`) con color sólido.
- Texto en `text-xs font-medium`.
- Radius: `rounded-sm` (4px).

---

## 11. Tag

### Estructura

```
<span class="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium border border-zinc-700 bg-zinc-800/40 text-zinc-300">
  {icon} {label} {close-button}
</span>
```

### Uso

- Filtros activos en tablas.
- Categorías de productos.
- Habilidades o especialidades.

### Variantes

| Variante | Clases | Uso |
|---|---|---|
| `default` | Borde `zinc-700`, fondo `zinc-800/40` | Tags genéricos |
| `removable` | Con botón `X` a la derecha | Filtros activos |
| `interactive` | `cursor-pointer hover:bg-zinc-700/40` | Tags seleccionables |

---

## 12. Alert

### Estructura

```
<div class="rounded-xl border p-4 flex gap-3">
  <div class="shrink-0">{icon}</div>
  <div>
    <h5 class="text-sm font-semibold text-zinc-100">{title}</h5>
    <p class="text-sm text-zinc-400 mt-1">{description}</p>
  </div>
</div>
```

### Variantes

| Variante | Borde | Fondo Dark | Icono | Uso |
|---|---|---|---|---|
| `info` | `border-blue-800` | `bg-blue-950/30` | `Info` | Información general |
| `success` | `border-green-800` | `bg-green-950/30` | `CheckCircle` | Operación exitosa |
| `warning` | `border-amber-800` | `bg-amber-950/30` | `AlertTriangle` | Advertencia |
| `danger` | `border-red-800` | `bg-red-950/30` | `AlertCircle` | Error crítico |
| `neutral` | `border-zinc-700` | `bg-zinc-800/30` | `Bell` | Notificación genérica |

### Reglas

- Icono siempre `w-5 h-5` y `shrink-0`.
- Título en `text-sm font-semibold`.
- Descripción en `text-sm text-zinc-400`.
- Prohibido alerts sin icono o sin título.
