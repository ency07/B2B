# TOKENS — Sistema de Diseño Visual

## 1. Color

### 1.1 Modo Oscuro (Default — ERP)

| Token | Valor Hex | Tailwind | Uso |
|---|---|---|---|
| `--background` | `#0b0f19` | `zinc-950` | Fondo general de alta absorción |
| `--background-secondary` | `#0f1423` | `zinc-900/60` | Fondos de sección alternos |
| `--foreground` | `#f4f4f5` | `zinc-100` | Texto principal |
| `--foreground-secondary` | `#a1a1aa` | `zinc-400` | Texto secundario, unidades técnicas |
| `--foreground-muted` | `#71717a` | `zinc-500` | Texto deshabilitado, placeholders |
| `--card` | `#111827` | `zinc-900/40` | Paneles con glassmorphism |
| `--card-foreground` | `#f4f4f5` | `zinc-100` | Texto dentro de tarjetas |
| `--popover` | `#111827` | `zinc-900` | Popovers, dropdowns |
| `--popover-foreground` | `#f4f4f5` | `zinc-100` | Texto en popovers |
| `--primary` | **Dinámico** | `tenant.branding.color_primario` | Acción principal (white label) |
| `--primary-default` | `#3b82f6` | `blue-500` | Fallback primario si tenant no define |
| `--primary-foreground` | `#ffffff` | `white` | Texto sobre primario |
| `--primary-hover` | `#2563eb` | `blue-600` | Hover de primario |
| `--primary-muted` | `#1e3a5f` | `blue-950/50` | Fondo sutil de primario |
| `--secondary` | `#1f2937` | `zinc-800` | Acción secundaria |
| `--secondary-foreground` | `#f4f4f5` | `zinc-100` | Texto sobre secundario |
| `--muted` | `#1f2937` | `zinc-800/60` | Fondos de controles inactivos |
| `--muted-foreground` | `#a1a1aa` | `zinc-400` | Texto de controles inactivos |
| `--accent` | `#1e293b` | `slate-800` | Acento hover |
| `--accent-foreground` | `#f4f4f5` | `zinc-100` | Texto sobre acento |
| `--border` | `#1f2937` | `zinc-800/60` | Bordes técnicos (líneas de dibujo) |
| `--border-strong` | `#374151` | `zinc-700` | Bordes de énfasis |
| `--input` | `#1f2937` | `zinc-800` | Fondo de inputs |
| `--ring` | **Dinámico** | `tenant.branding.color_primario` | Anillo de foco (white label) |
| `--ring-default` | `#3b82f6` | `blue-500` | Fallback anillo de foco |
| `--success` | `#22c55e` | `green-500` | Estados positivos |
| `--success-bg` | `#052e16` | `green-950/50` | Fondo de badge éxito |
| `--warning` | `#f59e0b` | `amber-500` | Estados de atención |
| `--warning-bg` | `#451a03` | `amber-950/50` | Fondo de badge warning |
| `--danger` | `#ef4444` | `red-500` | Errores, cancelaciones |
| `--danger-bg` | `#450a0a` | `red-950/50` | Fondo de badge error |
| `--info` | `#3b82f6` | `blue-500` | Información general |
| `--info-bg` | `#1e3a5f` | `blue-950/50` | Fondo de badge info |
| `--neutral` | `#71717a` | `zinc-500` | Estados neutrales |
| `--neutral-bg` | `#18181b` | `zinc-900/50` | Fondo de badge neutral |
| `--sidebar` | `#0f1423` | `zinc-900/80` | Fondo del sidebar |
| `--sidebar-border` | `#1f2937` | `zinc-800/40` | Borde del sidebar |
| `--header` | `#0b0f19/80` | `zinc-950/80` | Fondo del header (con blur) |
| `--grid-line` | `#ffffff` | `white` | Líneas de grilla técnica (1.5-3% opacidad) |

### 1.2 Modo Claro (Portal / Landing)

| Token | Valor Hex | Tailwind | Uso |
|---|---|---|---|
| `--background` | `#ffffff` | `white` | Fondo general |
| `--background-secondary` | `#f8fafc` | `slate-50` | Fondos de sección alternos |
| `--foreground` | `#0f172a` | `slate-900` | Texto principal |
| `--foreground-secondary` | `#475569` | `slate-600` | Texto secundario |
| `--foreground-muted` | `#94a3b8` | `slate-400` | Texto deshabilitado |
| `--card` | `#ffffff` | `white` | Tarjetas |
| `--card-foreground` | `#0f172a` | `slate-900` | Texto en tarjetas |
| `--popover` | `#ffffff` | `white` | Popovers |
| `--popover-foreground` | `#0f172a` | `slate-900` | Texto en popovers |
| `--primary` | **Dinámico** | `tenant.branding.color_primario` | Acción principal |
| `--primary-default` | `#1e40af` | `blue-800` | Fallback primario |
| `--primary-foreground` | `#ffffff` | `white` | Texto sobre primario |
| `--primary-hover` | `#1e3a8a` | `blue-900` | Hover de primario |
| `--primary-muted` | `#dbeafe` | `blue-100` | Fondo sutil de primario |
| `--secondary` | `#f1f5f9` | `slate-100` | Acción secundaria |
| `--secondary-foreground` | `#0f172a` | `slate-900` | Texto sobre secundario |
| `--muted` | `#f1f5f9` | `slate-100` | Fondos de controles inactivos |
| `--muted-foreground` | `#64748b` | `slate-500` | Texto de controles inactivos |
| `--accent` | `#f1f5f9` | `slate-100` | Acento hover |
| `--accent-foreground` | `#0f172a` | `slate-900` | Texto sobre acento |
| `--border` | `#e2e8f0` | `slate-200` | Bordes suaves |
| `--border-strong` | `#cbd5e1` | `slate-300` | Bordes de énfasis |
| `--input` | `#ffffff` | `white` | Fondo de inputs |
| `--ring` | **Dinámico** | `tenant.branding.color_primario` | Anillo de foco |
| `--ring-default` | `#1e40af` | `blue-800` | Fallback anillo de foco |
| `--success` | `#16a34a` | `green-600` | Estados positivos |
| `--success-bg` | `#dcfce7` | `green-100` | Fondo de badge éxito |
| `--warning` | `#d97706` | `amber-600` | Estados de atención |
| `--warning-bg` | `#fef3c7` | `amber-100` | Fondo de badge warning |
| `--danger` | `#dc2626` | `red-600` | Errores, cancelaciones |
| `--danger-bg` | `#fee2e2` | `red-100` | Fondo de badge error |
| `--info` | `#2563eb` | `blue-600` | Información general |
| `--info-bg` | `#dbeafe` | `blue-100` | Fondo de badge info |
| `--neutral` | `#64748b` | `slate-500` | Estados neutrales |
| `--neutral-bg` | `#f1f5f9` | `slate-100` | Fondo de badge neutral |
| `--sidebar` | `#ffffff` | `white` | Fondo del sidebar |
| `--sidebar-border` | `#e2e8f0` | `slate-200` | Borde del sidebar |
| `--header` | `#ffffff/80` | `white/80` | Fondo del header (con blur) |
| `--grid-line` | `#0f172a` | `slate-900` | Líneas de grilla técnica (1.5-3% opacidad) |

### 1.3 Reglas de color

- **Badges translúcidos**: Fondo con `opacity-10%` del color correspondiente. Solo el texto o círculo indicador porta el color sólido. Prohibido fondos de alta saturación.
- **Bordes técnicos**: Líneas finas que imitan dibujo técnico. Nunca bordes gruesos.
- **Primario dinámico**: Siempre consume `var(--primary)`, nunca hardcodea un color.
- **Prohibido**: Neón fluorescente, halos de glow exagerados, rejillas de escaneo tipo radar.

---

## 2. Typography

### 2.1 Familias tipográficas

| Familia | Fuente | Uso |
|---|---|---|
| `font-display` | **Outfit** | Headers principales, KPIs, títulos de sección, marca |
| `font-sans` | **Inter** | Textos de lectura, tablas, formularios, interfaz general |
| `font-mono` | **JetBrains Mono** | Unidades físicas (CFM, m³, RPM, voltios), códigos secuenciales (FAC-0001, OT-0023), importes comerciales |

### 2.2 Escala de tamaños

| Token | Rem | Px | Uso |
|---|---|---|---|
| `text-xs` | 0.75rem | 12px | Etiquetas secundarias, metadatos, mini-tablas |
| `text-sm` | 0.875rem | 14px | Texto base, contenido de tablas, campos de formulario |
| `text-base` | 1rem | 16px | Párrafos, botones destacados |
| `text-lg` | 1.125rem | 18px | Títulos de cards, modales secundarios |
| `text-xl` | 1.25rem | 20px | Títulos de sección |
| `text-2xl` | 1.5rem | 24px | Títulos de página |
| `text-3xl` | 1.875rem | 30px | Títulos de dashboard |
| `text-4xl` | 2.25rem | 36px | KPIs principales de dashboard, títulos de landing |
| `text-5xl` | 3rem | 48px | Hero de landing |
| `text-6xl` | 3.75rem | 60px | Hero principal de landing |

### 2.3 Pesos tipográficos

| Peso | Valor | Uso |
|---|---|---|
| `font-normal` | 400 | Cuerpo de texto, descripciones |
| `font-medium` | 500 | Labels de formulario, badges |
| `font-semibold` | 600 | Títulos de cards, headers de tabla |
| `font-bold` | 700 | Títulos de página, KPIs |

### 2.4 Interlineado

| Token | Valor | Uso |
|---|---|---|
| `leading-tight` | 1.25 | Títulos, KPIs |
| `leading-snug` | 1.375 | Subtítulos |
| `leading-normal` | 1.5 | Cuerpo de texto |
| `leading-relaxed` | 1.625 | Párrafos de landing |

### 2.5 Tracking (letter-spacing)

| Token | Valor | Uso |
|---|---|---|
| `tracking-tighter` | -0.05em | KPIs grandes |
| `tracking-tight` | -0.025em | Títulos de página |
| `tracking-normal` | 0 | Cuerpo de texto |
| `tracking-wide` | 0.025em | Labels de formulario, uppercase |
| `tracking-wider` | 0.05em | Headers de tabla (uppercase) |

---

## 3. Spacing

### 3.1 Grid base

Rejilla de **4px** con equivalentes rem.

| Token | Valor | Tailwind | Uso |
|---|---|---|---|
| `space-1` | 0.25rem | 4px | Micro-espaciado interno |
| `space-2` | 0.5rem | 8px | Espaciado entre iconos y texto |
| `space-3` | 0.75rem | 12px | Espaciado entre elementos compactos |
| `space-4` | 1rem | 16px | Entre controles de formulario, gap estándar |
| `space-5` | 1.25rem | 20px | Espaciado intermedio |
| `space-6` | 1.5rem | 24px | Entre secciones de card |
| `space-8` | 2rem | 32px | Entre secciones principales, gap de grid |
| `space-10` | 2.5rem | 40px | Entre bloques de contenido |
| `space-12` | 3rem | 48px | Entre módulos del ERP |
| `space-16` | 4rem | 64px | Entre secciones de landing |
| `space-20` | 5rem | 80px | Padding vertical de secciones landing |
| `space-24` | 6rem | 96px | Padding vertical grande de landing |
| `space-32` | 8rem | 128px | Separación máxima entre secciones landing |

### 3.2 Padding estándar

| Contexto | Token | Valor |
|---|---|---|
| Card desktop | `p-6` | 24px |
| Card mobile | `p-4` | 16px |
| Página ERP | `p-4 md:p-6 lg:p-8` | 16/24/32px |
| Contenedor principal | `px-4 sm:px-6 lg:px-8` | 16/24/32px |
| Input/Select | `px-3 py-2` | 12px/8px |
| Botón | `px-4 py-2` | 16px/8px |

### 3.3 Gap estándar

| Contexto | Token |
|---|---|
| Controles de formulario | `gap-4` / `space-y-4` |
| Grid de tarjetas ERP | `gap-4` |
| Grid de tarjetas landing | `gap-6` |
| Secciones principales | `gap-8` |
| Módulos del ERP | `gap-12` |

---

## 4. Border Radius

| Token | Valor | Tailwind | Uso |
|---|---|---|---|
| `radius-sm` | 4px | `rounded-sm` | Badges, tags pequeños |
| `radius-md` | 6px | `rounded-md` | Inputs, selects, checkboxes |
| `radius-lg` | 8px | `rounded-lg` | Botones, controles de formulario |
| `radius-xl` | 12px | `rounded-xl` | Tarjetas, contenedores, modales |
| `radius-2xl` | 16px | `rounded-2xl` | Imágenes, elementos grandes |
| `radius-3xl` | 24px | `rounded-3xl` | Hero elements, landing cards |
| `radius-full` | 9999px | `rounded-full` | Avatares, indicadores circulares |

### Reglas

- Prohibido bordes excesivamente redondeados en componentes del ERP (no `rounded-3xl` en cards del dashboard)
- Landing puede usar radios más grandes para sensación premium
- Botones e inputs siempre `rounded-lg`
- Cards del ERP siempre `rounded-xl`

---

## 5. Shadows (Elevation)

| Token | Valor Tailwind | Uso |
|---|---|---|
| `shadow-none` | `shadow-none` | Elementos planos, sin elevación |
| `shadow-xs` | `shadow-[0_1px_2px_0_rgba(0,0,0,0.05)]` | Micro-elevación, inputs hover |
| `shadow-sm` | `shadow-sm` | Cards base (evitar ruido visual en grids) |
| `shadow-md` | `shadow-md` | Cards en hover, dropdowns |
| `shadow-lg` | `shadow-lg` | Modales, menús desplegables, sheets |
| `shadow-xl` | `shadow-xl` | Modales críticos, dialogs de confirmación |
| `shadow-2xl` | `shadow-2xl` | Popovers de alta prioridad |
| `shadow-inner` | `shadow-inner` | Inputs focus, áreas de drop |

### Dark mode shadows

| Token | Valor | Uso |
|---|---|---|
| `shadow-card-dark` | `0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)` | Cards en modo oscuro |
| `shadow-modal-dark` | `0 20px 60px rgba(0,0,0,0.6)` | Modales en modo oscuro |
| `shadow-glow-primary` | `0 0 20px rgba(var(--primary), 0.15)` | Glow sutil de elementos primarios |

### Reglas

- Prohibido sombras paralelas pesadas en el ERP
- Cards base: `shadow-sm` únicamente
- Modales y desplegables: `shadow-lg` o `shadow-xl`
- Glow solo para elementos primarios en hover, nunca exagerado

---

## 6. Blur

| Token | Valor Tailwind | Uso |
|---|---|---|
| `blur-sm` | `blur(4px)` | Backdrop de tooltips |
| `blur-md` | `blur(8px)` | Backdrop de header inteligente |
| `blur-lg` | `blur(16px)` | Backdrop de modales |
| `blur-xl` | `blur(24px)` | Backdrop de sheets/drawers |

### Glassmorphism

| Propiedad | Valor | Uso |
|---|---|---|
| Fondo | `bg-zinc-900/40` (dark) / `bg-white/80` (light) | Paneles con transparencia |
| Blur | `backdrop-blur-md` | Desenfoque del fondo |
| Borde | `border border-zinc-800/60` (dark) / `border border-slate-200` (light) | Borde técnico sutil |

---

## 7. Grid

### 7.1 Contenedor principal

| Breakpoint | Max-width | Padding lateral |
|---|---|---|
| Default | `100%` | `px-4` |
| `sm` | `100%` | `px-6` |
| `lg` | `max-w-7xl` (1280px) | `px-8` |
| `xl` | `max-w-7xl` (1280px) | `px-8` |

### 7.2 Grid de columnas

| Layout | Clases | Uso |
|---|---|---|
| 1 columna | `grid-cols-1` | Mobile, formularios simples |
| 2 columnas | `grid-cols-1 md:grid-cols-2` | Formularios, cards de métricas |
| 3 columnas | `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` | Cards de landing, soluciones |
| 4 columnas | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` | KPIs de dashboard |
| Asimétrico 60/40 | `grid-cols-1 lg:grid-cols-5 lg:[&>*:first-child]:col-span-3` | Dashboard con detalle |
| Asimétrico 70/30 | `grid-cols-1 lg:grid-cols-3 lg:[&>*:first-child]:col-span-2` | Ficha de producto |

---

## 8. Containers

| Token | Max-width | Uso |
|---|---|---|
| `container-sm` | 640px | Formularios de auth, modales |
| `container-md` | 768px | Sheets de edición |
| `container-lg` | 1024px | Páginas de contenido |
| `container-xl` | 1280px | Dashboard, tablas |
| `container-2xl` | 1536px | Landing page |
| `container-fluid` | 100% | Layouts de ancho completo |

---

## 9. Breakpoints

| Token | Ancho | Target | Comportamiento |
|---|---|---|---|
| `sm` | 640px | Móvil landscape | Sidebar colapsa a iconos, formularios 2 columnas |
| `md` | 768px | Tablet | Grids de 2 columnas, layouts horizontales |
| `lg` | 1024px | Desktop | Sidebar visible, grids multi-columna, tablas completas |
| `xl` | 1280px | Desktop estándar | Contenedor centrado, tablas sin estiramiento |
| `2xl` | 1536px | Desktop amplio | Máxima densidad de información |

---

## 10. Elevation (Z-Index)

| Nivel | Valor | Uso |
|---|---|---|
| `z-base` | 0 | Elementos base |
| `z-dropdown` | 10 | Dropdowns, menús |
| `z-sticky` | 20 | Headers sticky, sidebars |
| `z-overlay` | 30 | Overlays de fondo |
| `z-header` | 40 | Header inteligente (react-headroom) |
| `z-modal` | 50 | Modales, dialogs, sheets, popovers |
| `z-toast` | 60 | Notificaciones toast |
| `z-tooltip` | 70 | Tooltips |

### Reglas

- Header: `z-40` (por debajo de modales `z-50`)
- Sidebar: `z-30` (desktop), `z-50` (mobile drawer)
- Modales: `z-50`
- Toasts: `z-60` (por encima de modales)
- Tooltips: `z-70` (por encima de todo)

---

## 11. Opacity

| Token | Valor | Uso |
|---|---|---|
| `opacity-0` | 0% | Elementos ocultos, transiciones |
| `opacity-5` | 5% | Fondos ultra sutiles |
| `opacity-10` | 10% | Fondos de badges de estado |
| `opacity-20` | 20% | Fondos de hover sutiles |
| `opacity-30` | 30% | Elementos deshabilitados |
| `opacity-50` | 50% | Elementos disabled, loading overlays |
| `opacity-60` | 60% | Backdrop de modales |
| `opacity-70` | 70% | Texto secundario oscuro |
| `opacity-80` | 80% | Headers con blur |
| `opacity-100` | 100% | Elementos activos |

### Reglas de badge

- Fondo del badge: `opacity-10%` del color semántico
- Texto del badge: color sólido
- Indicador circular: color sólido con `w-2 h-2`

---

## 12. Border

| Token | Valor Tailwind | Uso |
|---|---|---|
| `border-0` | 0px | Sin borde |
| `border` | 1px | Bordes estándar, cards, inputs |
| `border-2` | 2px | Bordes de énfasis, focus ring |
| `border-4` | 4px | Indicadores de estado grandes |
| `border-t` | 1px top | Separadores de sección |
| `border-b` | 1px bottom | Filas de tabla, headers |
| `border-l-2` | 2px left | Indicador de sidebar activo |
| `border-r` | 1px right | Separador sidebar/content |

### Estilos de borde

| Token | Valor | Uso |
|---|---|---|
| `border-solid` | Sólido | Default, inputs, cards |
| `border-dashed` | Discontinuo | Áreas de drop, placeholders |
| `border-dotted` | Punteado | Guías técnicas, grillas |

### Colores de borde

| Contexto | Dark | Light |
|---|---|---|
| Default | `border-zinc-800/60` | `border-slate-200` |
| Strong | `border-zinc-700` | `border-slate-300` |
| Focus | `border-primary` | `border-primary` |
| Error | `border-red-500` | `border-red-500` |
| Success | `border-green-500` | `border-green-500` |
