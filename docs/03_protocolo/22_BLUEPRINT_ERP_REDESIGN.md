# BLUEPRINT — REDISEÑO ERP B2B PREMIUM (AeroMax)

> **Estado:** Borrador para aprobación.
> **Alcance:** Rediseño completo del producto (no de la landing). Cubre los 8 módulos solicitados más el shell, el sistema de tokens, la gramática de componentes, el motion system y los patrones transversales.
> **Política:** No se implementa nada hasta la aprobación explícita de este documento.

---

## 0. Manifiesto

El ERP actual fue construido como una colección de pantallas con el lenguaje de "panel administrativo": tablas anchas, formularios verticales largos, tarjetas KPI en cajas grises, pestañas con subrayados, modales pesados. Funciona, pero se siente como software de back-office de 2014.

Este rediseño parte de una tesis distinta:

> **Un ERP B2B premium no es una base de datos con UI. Es un sistema de operación en vivo que un equipo profesional abre a las 7am y deja abierto hasta las 7pm.**

Las referencias no son ERPs. Son productos donde el usuario pasa todo el día y el software desaparece:

- **Linear** — la densidad sin ruido, el command bar como nav, el color como sémantica.
- **Stripe Dashboard** — la profundidad física por capas, los datos visualizados con elegancia, el whitespace como lujo.
- **Vercel Dashboard** — el estatus ambiental, el real-time, el "sentir" del sistema vivo.
- **Notion** — el bloque como unidad, la jerarquía por peso tipográfico, la organización por árbol.
- **Figma** — el canvas como workspace, el inspector contextual, las herramientas que aparecen cuando las necesitás.

Cinco valores rigen cada decisión:

| Valor | Significado operativo |
|---|---|
| **Control** | El usuario siempre sabe qué pasa, qué pasó, qué sigue. Estatus visible, sin ambigüedad. |
| **Precisión** | Densidad de información con jerarquía. Cada píxel gana su lugar. |
| **Claridad** | El lenguaje visual nunca compite con el dato. Tipografía, color y espacio están al servicio de la lectura. |
| **Estatus** | El sistema comunica su propio estado de salud sin pedirlo. El usuario nunca tiene que preguntar "¿está al día?". |
| **Velocidad** | Toda interacción es <100ms percibida. Sin spinners para acciones locales. Optimistic UI por defecto. |

---

## 1. Sistema de Tokens (Foundation)

El rediseño se sostiene sobre un sistema de tokens que produce profundidad, jerarquía y consistencia **sin hardcodear valores**. Todos los tokens se exponen como variables CSS alimentadas por `tenant_settings` (Pilar XV/XVI), de modo que la marca blanca sigue intacta.

### 1.1 Color (semánticos, no cromáticos)

Nunca se usa un color "bonito". Se usa un rol semántico. La marca define **un solo** color (`--accent`), todo lo demás es una escala neutra más colores de estado.

| Rol | Uso |
|---|---|
| `bg.canvas` | Fondo de página. El más neutro. |
| `bg.surface` | Tarjetas, paneles, sheets. |
| `bg.elevated` | Popovers, menús flotantes, command bar. |
| `bg.inset` | Inputs, code blocks, áreas "hundidas". |
| `border.subtle` | Hairlines que solo se ven si buscás. |
| `border.default` | Bordes de tarjetas y separadores. |
| `border.strong` | Foco, hover de borde. |
| `text.primary` | Titulares, valores numéricos destacados. |
| `text.secondary` | Cuerpo, descripciones. |
| `text.muted` | Labels, meta-info, timestamps. |
| `text.disabled` | Estado deshabilitado. |
| `accent.fg` / `accent.bg` / `accent.border` | El color del tenant. Una sola familia. |
| `state.success` | Operativo, pagado, entregado. |
| `state.warning` | Atención, próximo a vencer. |
| `state.danger` | Vencido, error, bloqueante. |
| `state.info` | Neutral informativo. |
| `state.neutral` | Borrador, archivado. |

Cada `state.*` tiene tres variantes: `fg` (texto/icono), `bg` (fondo de pill o dot), `border` (anillo fino). Los fondos son siempre versiones al 8–12% del color puro, nunca saturados.

**Escala neutra** (zinc pura, sin tinte):
- `50 → 950` en pasos perceptualmente parejos.
- El modo dark **no es inversión del light**: es un tema propio con la misma jerarquía (no usar `bg-zinc-900` como "dark mode" de un surface claro).

### 1.2 Tipografía

- **Sans:** Inter Variable (UI general).
- **Mono:** JetBrains Mono Variable (IDs, SKUs, códigos, timestamps, números de factura, paths).
- **Escala (rem):** `11 / 12 / 13 / 14 / 15 / 16 / 18 / 20 / 24 / 30 / 36 / 48`.
- **Pesos:** 400 (cuerpo), 500 (énfasis), 600 (subtitulares), 700 (titulares). Nada de extrabold/black.
- **Tracking:** `-0.02em` en titulares `30+`, `0` en cuerpo, `+0.04em uppercase` en labels mono.
- **Line-height:** `1.15` (titulares), `1.4` (UI), `1.6` (prose largo).
- **Jerarquía por peso y tamaño, nunca solo por color.**

### 1.3 Espaciado

Escala de 4px: `0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32`. Pero la regla operativa es:

- **Entre elementos del mismo grupo:** `gap-1` o `gap-2` (densidad Linear).
- **Entre grupos de una misma sección:** `gap-6` a `gap-8`.
- **Entre secciones:** `py-10` a `py-16` (whitespace Stripe).
- **Padding de tarjetas:** `p-5` (default), `p-6` (destacadas), `p-4` (densas).
- **Padding de página:** `px-8 py-8` desktop, `px-4` móvil.

### 1.4 Radio

- `--radius-xs: 4px` — pills, tags.
- `--radius-sm: 6px` — inputs, botones pequeños.
- `--radius-md: 8px` — botones, tarjetas estándar.
- `--radius-lg: 12px` — tarjetas destacadas, sheets.
- `--radius-xl: 16px` — modales, command bar.
- **Prohibido:** radios de `9999px` (pill) en cualquier cosa que no sea tag o status. Los botones son `radius-md`.

### 1.5 Profundidad (Depth System)

La profundidad es **multicapa**, nunca plana. Cada nivel tiene 3 componentes de sombra:

```
shadow-1 (tarjeta en página):
  0 1px 0 0 rgb(0 0 0 / 0.04),         /* top highlight */
  0 1px 2px -1px rgb(0 0 0 / 0.08),    /* close shadow */
  0 4px 12px -4px rgb(0 0 0 / 0.06)    /* far shadow */

shadow-2 (popover / dropdown):
  0 1px 0 0 rgb(0 0 0 / 0.05),
  0 4px 8px -2px rgb(0 0 0 / 0.10),
  0 16px 32px -8px rgb(0 0 0 / 0.10)

shadow-3 (modal / command bar):
  0 1px 0 0 rgb(0 0 0 / 0.06),
  0 8px 16px -4px rgb(0 0 0 / 0.12),
  0 32px 64px -16px rgb(0 0 0 / 0.18)
```

Más un **`ring-1 ring-black/[0.04]`** (o `white/[0.06]` en dark) en cada nivel. Ese anillo es lo que da el "filo" limpio estilo Apple.

**Nunca** se usa sombra sin el anillo. **Nunca** se usa un fondo gris como sustituto de sombra.

### 1.6 Motion

| Token | Duración | Easing | Uso |
|---|---|---|---|
| `motion.instant` | 60ms | linear | Hover, focus ring. |
| `motion.fast` | 120ms | `cubic-bezier(0.2, 0, 0, 1)` | Cambio de estado, toggle. |
| `motion.base` | 180ms | mismo | Entrada/salida de popovers, sheets. |
| `motion.slow` | 240ms | mismo | Transición de página, modal open. |

**Reglas:**

- **Prohibido:** spring, rebote, overshoot. Todo es ease-out.
- **Prohibido:** animaciones >300ms. La velocidad es un feature.
- **Hover:** cambio de sombra (de `shadow-1` a `shadow-1-hover`) y/o cambio de border. Sin scale.
- **Active:** `scale(0.985)` en botones primarios solamente, 80ms.
- **Page transition:** `opacity 0→1` + `translateY 4px→0`, 200ms.
- **Skeleton:** shimmer linear 1.2s, sin gradiente animado circular.
- **Reduced motion:** todas las transiciones se reducen a `opacity` o se anulan.

---

## 2. Shell de Aplicación (App Chrome)

El shell es el "marco" persistente. Es lo primero que el usuario ve cada mañana y lo que nunca debe estorbar.

### 2.1 Estructura

```
┌───────────────────────────────────────────────────────────────────────┐
│ [WS▾] AeroMax  │ [🔍 Buscar… ⌘K]  ⌕ │           │  ●3  ?  🔔  ⓜ │  ← Top Bar (44px)
├──────────┬────────────────────────────────────────────────────────────┤
│ ▸ Buscar │                                                            │
│          │                                                            │
│ OPERACIÓN│                                                            │
│ ⌘1 Inicio│                  MAIN CONTENT                              │
│ ⌘2 Invent│                  (max-w 1280, px-8 py-8)                    │
│ ⌘3 Compras                                                            │
│ ⌘4 Factur │                                                            │
│          │                                                            │
│ COMERCIAL│                                                            │
│ ⌘5 CRM   │                                                            │
│ ⌘6 Client│                                                            │
│          │                                                            │
│ SISTEMA  │                                                            │
│ ⌘7 CMS   │                                                            │
│ ⌘8 Config                                                            │
│          │                                                            │
└──────────┴────────────────────────────────────────────────────────────┘
   220px                  flexible
```

- **Top bar (44px):** fondo `bg.surface` con `border-b border.subtle`. Cinco elementos, de izquierda a derecha:
  1. **Workspace switcher** (chip con avatar de marca + chevron). Click = menú con los 8 módulos + cambiar de workspace. Es la nav "obvia" para el usuario nuevo.
  2. **Command Bar siempre visible** (input + chip de atajo a la derecha). Click en el input = abre el command bar modal. El chip muestra el atajo del OS del usuario (ver §2.4).
  3. **Status indicator** (punto LED con badge numérico).
  4. **Botón `?`** — abre panel de ayuda con atajos del módulo actual.
  5. **Notificaciones + Usuario**.
- **Left rail (220px colapsable a 56px):** icon-only cuando colapsado. **Secciones con headers uppercase mono de 11px** (no títulos grandes, no separadores decorativos). Atajos de teclado visibles a la derecha de cada item (`⌘1`, `⌘2`…). **Primer item del rail: "Buscar"** con icono ⌕, abre el command bar. Es la red de seguridad para quien no mira la top bar.
- **Main content:** `max-w 1280px` desktop, `px-8 py-8`, scroll independiente.
- **No header de página redundante.** El título de la página vive en el contenido, no en un banderín superior.

### 2.2 Command Bar (⌘K / Ctrl K) — capa de poder

Es la **capa de poder** del sistema: existe sobre la navegación explícita (logo, left rail, menús contextuales), no en lugar de ella. El usuario que no sabe que existe puede usar el ERP perfectamente con mouse. El usuario que lo descubre, multiplica su velocidad.

```
┌────────────────────────────────────────────────────────────┐
│  ⌕  Buscar clientes, facturas, productos o acciones…      │
├────────────────────────────────────────────────────────────┤
│  CLIENTES                                                   │
│  ◉  AeroMax Industrial          INV-2026-0142   ⌘↩ Abrir  │
│  ◉  Aceros del Valle S.A.       COT-2026-0091   ⌘↩ Abrir  │
│                                                            │
│  FACTURAS                                                   │
│  ▦  FAC-2026-0421  $12,400.00  Vencida   May 14    ⌘D Ver │
│  ▦  FAC-2026-0420  $ 3,250.00  Pagada    May 13    ⌘D Ver │
│                                                            │
│  PRODUCTOS                                                  │
│  ▦  SKU-AX-104  Ventilador axial 450mm  Stock: 23  ⌘↩ Abr │
│                                                            │
│  ACCIONES                                                   │
│  +  Crear nuevo cliente                       ⌘N          │
│  +  Crear nueva factura                       ⌘⇧F        │
│  +  Crear orden de compra                     ⌘⇧P        │
└────────────────────────────────────────────────────────────┘
  ↑↓ Navegar   ⌘↩ Abrir   ⌘P Acciones   ⌘/ Ayuda   esc Cerrar
```

- Modal centrado, `max-w 640px`, `radius-xl`, `shadow-3`, `ring-1`.
- Input grande (18px), sin border, sin label, con placeholder instructivo.
- Resultados agrupados por entidad con headers uppercase mono.
- Cada fila: **icono 14px** + **título semibold** + **subtítulo mono muted** + **acción por defecto** alineada a la derecha.
- **Búsqueda fuzzy con tolerancia a typos.**
- Resultados en <16ms (búsqueda local sobre índice precargado, no roundtrip a Supabase).
- Footer con shortcuts. Atajos contextuales: si estás en CRM, las acciones sugeridas son del CRM.

### 2.3 Discoverability del Command Bar (8 patrones)

**Principio:** el command bar nunca debe ser la única puerta de entrada. Todo lo siguiente coexiste.

1. **Input siempre visible en la top bar.** El usuario que solo usa mouse ve un input prominente con icono y label "Buscar…". Click = command bar. Sin necesidad de saber el atajo.
2. **Chip de atajo OS-aware.** El chip a la derecha del input muestra `⌘K` en macOS, `Ctrl K` en Windows/Linux. Detección vía `navigator.platform` o `userAgent`. Texto del chip grande y legible, no en la esquina.
3. **Item "Buscar" en el left rail.** Primer ítem de la navegación lateral, con icono ⌕, abre el command bar. Red de seguridad para quien mira la izquierda, no arriba.
4. **Workspace switcher como nav obvia.** El logo del workspace en top-left es clickeable y abre un menú con los 8 módulos. Es la nav tradicional que el usuario nuevo entiende sin instrucciones.
5. **Right-click como atajo universal.** Click derecho en cualquier fila de lista abre un menú contextual con las mismas acciones que el command bar expone. Quien no usa el teclado sigue siendo eficiente.
6. **Onboarding contextual en el primer login.** Tour corto (3 pasos, skippable) que muestra: (a) el input de búsqueda, (b) click vs. atajo, (c) que también ejecuta acciones. Se muestra una sola vez por usuario. Estado persistido en `user_preferences.onboarding_seen`.
7. **Empty states con "Buscá con ⌘K".** Cada módulo vacío tiene un hint: *"¿No encontrás X? Probá `⌘K` para buscar en todo el sistema."* El command bar se posiciona como red universal.
8. **Botón `?` en la top bar.** Abre un panel de ayuda con todos los atajos del módulo actual. Discoverable, sin requerir conocer el atajo `⌘/`.

### 2.4 Adaptación por Sistema Operativo

Todos los chips y labels de atajos se renderizan según el OS del usuario:

| OS | Símbolo | Texto |
|---|---|---|
| macOS | `⌘` | `⌘K` |
| Windows | `Ctrl` | `Ctrl K` |
| Linux | `Ctrl` | `Ctrl K` |

La implementación usa un hook `usePlatform()` que retorna `{ modifier: '⌘' \| 'Ctrl', label: '⌘K' \| 'Ctrl K' }` y se aplica en todos los lugares que muestren el atajo (top bar, command bar footer, panel `?`, tooltips de botones, empty states).

### 2.5 Status Ambient (estatus siempre visible)

- El **punto LED en la top bar** es la salud del sistema. Verde = todo OK. Ámbar = atención. Rojo = acción requerida. Pulsa suavemente (1s ease-in-out) si hay items sin leer.
- **Badge numérico** al lado: items que requieren acción del usuario logueado.
- En cada módulo, una **strip superior delgada** (h-32px) muestra contadores clave con micro-sparklines: "12 facturas por vencer (próx. 7 días)", "3 cotizaciones esperando aprobación", "1 orden de compra con discrepancia".
- **Nunca** se pregunta "¿cuánto falta para…?" — el sistema lo muestra.

---

## 3. Gramática de Componentes (Building Blocks)

Cada componente se construye con los tokens anteriores. Ningún componente del ERP queda fuera de esta gramática.

### 3.1 Botones Premium

Cuatro variantes, todas con la misma estructura física.

| Variante | Estructura |
|---|---|
| **Primary** | Fondo `accent.bg`, texto `accent.fg` (calculado para contraste AA), `ring-1 ring-inset` con `accent` al 20%, `shadow-sm` + glow `0 0 0 4px accent/10` en hover, `active:scale-[0.985]`. |
| **Secondary** | Fondo `bg.surface`, `border-default`, texto `text.primary`. Hover: `border-strong` + `bg.elevated`. |
| **Ghost** | Sin fondo, sin border. Hover: `bg.surface`. |
| **Danger** | Mismo shape que primary pero `state.danger.bg` + `state.danger.fg`. |

**Anatomía fija:**
- Padding: `h-9 px-3.5` (sm) / `h-10 px-4` (md) / `h-11 px-5` (lg). Tres tamaños, no seis.
- Icono a la izquierda (14px en sm/md, 16px en lg), texto `font-medium 14px`, opcional counterbadge a la derecha.
- Loading: el texto se reemplaza por un spinner de 14px; el botón no cambia de tamaño.
- **Prohibido:** botones de ancho completo ("100% width") salvo en modales con acción única.
- **Prohibido:** "Save" como label. Usar verbos específicos: "Crear factura", "Aprobar requerimiento".

### 3.2 Inputs (campos de formulario)

- **Altura:** 36px (sm) / 40px (md). Label arriba (12px medium), helper text abajo (12px regular muted).
- **Estado:** default / hover / focus / disabled / error. Focus = `ring-2 ring-accent/30` + `border-accent`.
- **Sin labels dentro del input.** Labels siempre arriba.
- **Búsqueda:** input con icono lupa a la izquierda y `⌘K` chip a la derecha (estilo Linear).
- **Select:** nativo reemplazado por popover con búsqueda, agrupado, mono en los códigos. No se usa `<select>` estilado.
- **Date picker:** popover con mes dual, atajos "Hoy / Mañana / +7d / +30d", input de typing directo.
- **Money input:** alineado a la derecha, mono, con símbolo de moneda prefijo, separadores de miles automáticos.

### 3.3 Status Dot + Pill

**Dot (8px, fixed):** el átomo de estatus. Una sola fuente de verdad. Cuatro colores semánticos (success / warning / danger / info / neutral). Usado en:
- Listas, como primera columna visual.
- Cards, junto al título.
- Top bar (status global).

**Pill:** `h-6 px-2 rounded-xs` (¡no pill!), fondo del estado al 10%, texto del estado, icono opcional 12px, **dot de 6px a la izquierda**. **No se usa texto uppercase para estados** — el dot y el color ya comunican; el texto es sentence case.

### 3.4 Card

```
┌─────────────────────────────────────────────────────┐
│ ●  Título                              ⌘ acciones ▾ │  ← header (h-44px)
├─────────────────────────────────────────────────────┤
│                                                     │
│  Contenido                                          │
│                                                     │
└─────────────────────────────────────────────────────┘
   bg.surface · border.default · radius-lg
   shadow-1 · ring-1 ring-black/[0.04]
```

- Header opcional con dot de estado, título, menú de acciones.
- **Sin "elevación decorativa"**: solo sombra cuando se separa visualmente del fondo.
- Hover en cards interactivas: `border-strong` + `shadow-1-hover`. Sin translate.

### 3.5 Tabla (Data Grid)

**No** es una tabla HTML con bordes. Es un **inventario scannable**:

- Fila de 36–44px, padding interno generoso.
- Header: 11px uppercase mono, color `text.muted`, sin background, con `border-b border.default`.
- **Cero zebra striping.** Hover: `bg.surface` (una capa más oscura que `bg.canvas`).
- Selección: `bg.accent/5` + `ring-inset ring-1 ring-accent/30` (no azul chillón).
- **Primera columna:** dot de estado + nombre principal semibold.
- **Última columna:** acción inline (botón ghost 24px) o menú kebab.
- Columnas con datos técnicos: mono, alineadas a la derecha.
- Sticky header. Sticky filter bar arriba (chips removibles).
- **Empty state:** ilustración mono-line del producto, una línea que diga qué falta, y un solo botón de acción. No "No hay datos" en gris triste.
- **Loading:** skeleton de filas con shimmer, no spinner central.

### 3.6 Sheet (panel lateral)

- Drawer desde la derecha, `width 480–640px`, `bg.elevated`, `shadow-3`, `radius-l` solo a la izquierda.
- Header sticky con back button (←), título, close (esc).
- Footer sticky con acciones primarias. **El usuario nunca pierde lo que escribió si navega.**
- Se cierra con `esc`, click fuera, o swipe-back.

### 3.7 Modal

- Reservado para **acciones destructivas o de bifurcación irreversible** (confirmar borrado, seleccionar workspace).
- Nunca para crear entidades (eso va en sheet o en línea).
- Centrado, `max-w 440px`, `shadow-3`, `radius-xl`.
- Header con título 18px semibold. Body con descripción 14px secondary. Footer con dos botones: ghost (cancelar) + primary (confirmar, verb).

### 3.8 Toast

- Bottom-right, stack vertical, `max-w 360px`, `bg.elevated`, `radius-md`, `shadow-2`, `ring-1`.
- Dot de estado a la izquierda + título semibold + descripción muted + acción opcional.
- Auto-dismiss 4s para info, persistente para errores hasta que el usuario lo cierre.
- Acciones se pueden deshacer durante 5s (Undo): "Factura eliminada · Deshacer".

### 3.9 Empty / Error / Loading States

Los tres estados son **diseñados con la misma jerarquía que el estado normal**. No se degradan a feos.

- **Empty:** ilustración técnica (line-art del producto, no imágenes stock) + headline 18px + helper 14px + acción única.
- **Error:** icono de estado + headline + descripción técnica (incluye el error code en mono) + acciones (reintentar / soporte).
- **Loading:** skeleton exacto de la forma final. Mismas dimensiones, misma jerarquía.

### 3.10 Inspector (panel derecho contextual)

Como Figma, abre un panel a la derecha del contenido cuando el usuario selecciona algo. **No es un modal**. Es una **columna**.

- Ancho default 360px, redimensionable a 280–520px.
- `border-l border.subtle`, sin sombra.
- Secciones con header uppercase mono + chevron colapsable.
- Cambios auto-save. Indicador: "Saved · 2s ago" en mono muted al pie.

---

## 4. Patrones Transversales

Patrones que se usan en múltiples módulos. Una vez diseñados, se replican con coherencia.

### 4.1 Filtros como Pills (no sidebar de filtros)

- Una sola fila de pills arriba de la lista: cada filtro es un pill removible.
- Click en "Add filter" abre un popover con búsqueda de campos.
- Cada pill muestra: campo + operador + valor, con dot de color si el filtro es "activo" vs "guardado".
- **Vistas guardadas:** "Mi vista", "Por vencer", "Este mes" — visibles como tabs arriba de los filtros (estilo Linear issues).

### 4.2 Bulk Actions (acciones en lote)

- Al seleccionar 1+ items, una **action bar flotante** aparece arriba de la lista (no un footer sticky).
- `bg.elevated`, `shadow-2`, `radius-lg`, contador grande a la izquierda ("3 seleccionados") + acciones + "Esc" para limpiar.
- Las acciones disponibles cambian según el tipo de entidad y el estado de los items (no todas se pueden aplicar a todos).

### 4.3 Command Bar Inline (en listas)

- En cada lista, la primera fila visible es un input "Quick add" o "Quick find" integrado al estilo Notion.
- Escribir y `↩` crea un item nuevo con los valores por defecto. Sin modal.
- Para filtros, el input es "Filter…" y filtra la lista al instante (cliente).

### 4.4 Vista Lista ↔ Vista Tarjetas ↔ Vista Mapa

- En módulos donde aplica (Clientes, Inventario, Compras), toggle de tres vistas con iconos en la esquina superior derecha de la lista.
- La vista por defecto es Lista (más densa). Las otras son explícitas.
- La elección persiste por usuario.

### 4.5 Notificaciones In-App

- Centro de notificaciones en la campana de la top bar.
- Drawer desde la derecha con la misma gramática de Sheets.
- Items agrupados por día, con origen (módulo), timestamp mono, snippet de la acción, y acciones inline ("Marcar como hecho", "Abrir").
- Estado leído/no-leído con dot sutil (no fondo gris).

---

## 5. Módulo 1 — Dashboard (Command Center / HQ)

### 5.1 Concepto

**No** es "4 KPIs + 2 gráficos + 1 tabla". Es un **centro de comando personal** que un director de operaciones abre cada mañana para entender el estado del negocio en 30 segundos y actuar en consecuencia.

### 5.2 Layout (desktop)

```
┌─────────────────────────────────────────────────────────────────────┐
│  ⌘K Buscar…                                              ●3  ◐  🔔  ⓜ │  Top Bar
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Buenos días, Mateo.                                                │  ← Saludo (24px)
│  Martes 28 de mayo · 7:42 AM · Bogotá                               │  ← Contexto (mono 12px muted)
│                                                                     │
│  ───────────────────────────────────────────────────────────────    │
│                                                                     │
│  CASH PULSE                                          ⌘D Ver detalle │
│  $284,560.00                                                         │  ← Hero number (48px, mono)
│  ▲ +12.4% vs mes anterior                                           │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │        ╱╲      ╱╲     ╱──╲                                   │  │  ← Sparkline 30d
│  │  ╱╲  ╱  ╲  ╱╲╱  ╲   ╱    ╲  ╱╲                              │  │
│  │ ╱  ╲╱    ╲╱        ╲╱      ╲╱  ╲────                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ───────────────────────────────────────────────────────────────    │
│                                                                     │
│  PULSE  ─────  tiempo real ─────                       12 eventos/h │  ← Feed header
│                                                                     │
│  ● 09:14   Nuevo lead: Aceros del Valle S.A.       Luis M.    ·2m   │
│  ● 09:11   Factura FAC-0421 vencida hace 2 días     AeroMax   ·5m   │
│  ● 09:08   Cotización COT-0091 aprobada              Cliente   ·8m   │
│  ● 09:02   Stock bajo: SKU-AX-104 (12 unidades)      Sistema   ·14m  │
│  ● 08:55   Pago recibido: $3,250.00                  Wompi     ·21m  │
│  …                                                                 │
│                                                                     │
│  ───────────────────────────────────────────────────────────────    │
│                                                                     │
│  OPERATIONS HEALTH                                                  │
│                                                                     │
│  Inventario          Compras            Facturación       CRM      │
│  ┌────────┐         ┌────────┐         ┌────────┐        ┌──────┐ │
│  │  ◐ 84% │         │  ◐ 67% │         │  ● 92% │        │ ◐ 73%│ │
│  │  Salud │         │  Flujo │         │  Cobro │        │ Pipe │ │
│  └────────┘         └────────┘         └────────┘        └──────┘ │
│   4 alertas            2 alertas           5 alertas       1 alerta │
│                                                                     │
│  ───────────────────────────────────────────────────────────────    │
│                                                                     │
│  HOY EN TU COLA                                  7 items · 3 vencidos│
│                                                                     │
│  ☐  Aprobar cotización COT-0091                    $12,400  · 2h   │
│  ☐  Responder a AeroMax sobre FAC-0421 vencida     —         · 3h   │
│  ☐  Confirmar recepción orden OC-0142              3 items   · 5h   │
│  …                                                                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.3 Componentes específicos

- **Hero Cash Pulse:** un único número grande, mono, 48px, semibold. Debajo, delta vs período anterior con flecha y color semántico. Sparkline de 30d con gradient `accent/40 → transparent` debajo de la curva. **Sin "KPI cards"** — un número, contexto, tendencia.
- **Pulse Feed:** stream cronológico inverso, no una tabla. Cada item: dot de tipo (lead, factura, orden, alerta), timestamp mono 12px muted, actor con avatar 20px, descripción de una línea, tiempo relativo. Carga incremental con infinite scroll. **No** un feed de "actividad reciente" genérico: cada item es accionable (click → abre la entidad).
- **Operations Health:** 4 anillos pequeños (no gauges de 270° estilo dashboard de IoT barato). Cada anillo tiene debajo: nombre, score, contador de alertas. Click → módulo correspondiente filtrado por la alerta.
- **Tu Cola de Hoy:** lista de tareas con checkbox, descripción, valor, deadline. Las vencidas tienen dot rojo y quedan arriba. **No** "mis tareas" como un módulo aparte: vive en el dashboard.

### 5.4 Personalización

- Cada usuario reordena las 4 secciones (drag handle visible en hover, cursor-grab).
- Las secciones son "tarjetas" del mismo grammar; se pueden colapsar, ocultar o reordenar.
- La configuración se guarda por usuario (no por tenant).

### 5.5 Lo que **NO** tiene el Dashboard

- ❌ Cards de "Total ventas / Total clientes / Total productos" en una grilla de 4.
- ❌ Gráfico de torta para "distribución de clientes por sector".
- ❌ Tabla "Últimas 10 facturas" repetida del módulo de facturación.
- ❌ Mapa del mundo con pins de clientes.

---

## 6. Módulo 2 — CRM (Pipeline)

### 6.1 Concepto

El CRM **no es un Kanban** (aunque el modo Kanban exista). El CRM es la vista de **oportunidades activas** con foco en el siguiente paso y la salud del pipeline. El objeto central es el **Deal**.

### 6.2 Layout — Modo Pipeline (default)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Pipeline                                                            │
│  ▾  Vista: Pipeline Q2 (guardada)              [≡ Lista] [▦ Kanban] [📊 Métricas]
│                                                                      │
│  ┌─● Prospecto ─┐  ┌─● Calificado ─┐  ┌─● Propuesta ─┐  ┌─● Negociación ─┐
│  │  12 · $84K   │  │  8 · $142K    │  │  5 · $96K    │  │  3 · $48K      │
│  │              │  │               │  │              │  │                │
│  │ + Nuevo deal │  │ + Nuevo deal  │  │ + Nuevo deal │  │ + Nuevo deal   │
│  │              │  │               │  │              │  │                │
│  │ ┌──────────┐ │  │ ┌──────────┐  │  │ ┌──────────┐ │  │ ┌──────────┐  │
│  │ │Aceros V. │ │  │ │AeroMax   │  │  │ │MetalPlus │ │  │ │Inducor   │  │
│  │ │$12,400   │ │  │ │$48,000   │  │  │ │$22,100   │ │  │ │$18,300   │  │
│  │ │● 78%     │ │  │ │● 92%     │  │  │ │● 64%     │ │  │ │● 41%     │  │
│  │ │Mateo ·3d │ │  │ │Ana ·1d   │  │  │ │Luis ·5d  │ │  │ │Caro ·8d  │  │
│  │ └──────────┘ │  │ └──────────┘  │  │ └──────────┘ │  │ └──────────┘  │
│  │ ┌──────────┐ │  │ ┌──────────┐  │  │ ┌──────────┐ │  │ ┌──────────┐  │
│  │ │Inducor   │ │  │ │…         │  │  │ │…         │ │  │ │…         │  │
│  │ └──────────┘ │  │            │  │  │            │  │ │            │  │
│  └──────────────┘  └────────────┘  └────────────┘  └────────────────┘
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

- **Header de columna:** dot de estado + nombre del stage + count + suma total. Hover: menú para renombrar, reordenar, ver métricas.
- **Tarjeta de deal:** `bg.surface`, `border-default`, `radius-md`, `shadow-1`. Contenido:
  - Línea 1: nombre de la cuenta (14px semibold)
  - Línea 2: valor en mono, alineado derecha (14px)
  - Línea 3: **deal score** (anillo de 24px con porcentaje + color: verde >70, ámbar 40–70, rojo <40)
  - Línea 4: owner (avatar 20px) + días en el stage (mono 12px muted)
- **Sin drag visual exagerado.** Drag: la tarjeta se eleva 1 nivel, sombra aumenta, drop target es un outline dashed de 2px con color accent.
- **Quick add:** la última fila de cada columna es un input inline "+ Nuevo deal" (estilo Trello/Linear Issues). Escribir nombre + `↩` = crear.
- **Scroll horizontal** suave con inercia si hay más columnas de las que caben.

### 6.3 Layout — Modo Lista

Tabla densa con la misma gramática global. Columnas: dot de stage + nombre deal + cuenta (link) + valor (mono) · probabilidad · **próximo paso** (truncado, italic muted) · score (anillo mini) · owner · días en stage · última actividad.

- **Filter bar arriba:** pills. Filtros frecuentes preconfigurados como tabs: "Mis deals", "Por cerrar este mes", "Estancados >7d", "Alta probabilidad".
- **Sort:** click en header. Indicador de sort con flecha mono sutil.
- **Selección múltiple** abre la action bar flotante.

### 6.4 Layout — Modo Métricas

- **No** son gráficos gigantes con ejes Y rotados.
- **Conversión por stage:** un funnel horizontal con % entre stages, números discretos, ancho proporcional al valor.
- **Velocidad del pipeline:** sparklines por stage (deals entrando/saliendo últimos 14d).
- **Forecast:** un número grande "Q2 forecast: $XXX,XXX" con tres líneas debajo (best/likely/worst case), cada una con un dot de color.
- **Top deals:** 5 deals con mayor valor, en una lista minimal.

### 6.5 Deal Detail (split view)

Al hacer click en un deal, **no se abre una página nueva**. Se abre un split view (panel derecho 480–640px) con:

```
┌─────────────────────────────────┬──────────────────────────────┐
│  PIPELINE                        │  ◀ DEAL-2026-0142                    │
│  …                               │  ─────────────────────                │
│                                  │                                    │
│                                  │  ●  Calificado · 92%                 │
│                                  │                                    │
│                                  │  AeroMax Industrial                 │
│                                  │  Implementación ERP industrial       │
│                                  │                                    │
│                                  │  $48,000.00    Prob: 65%            │
│                                  │  Owner: Ana    Cierre: 2026-06-15   │
│                                  │                                    │
│                                  │  ─────────                         │
│                                  │                                    │
│                                  │  Actividad                         │
│                                  │  ● Hoy  10:42  Ana llamó · 12m     │
│                                  │  ● Ayer 16:08  Email enviado        │
│                                  │  ● 2d           Reunión programada   │
│                                  │                                    │
│                                  │  ─────────                         │
│                                  │                                    │
│                                  │  Próximo paso                      │
│                                  │  ☐ Enviar propuesta v2   · 15 Jun   │
│                                  │  + Agregar paso                       │
│                                  │                                    │
│                                  │  ─────────                         │
│                                  │                                    │
│                                  │  Archivos (3)                      │
│                                  │  📄 Propuesta_v2.pdf       2.1 MB  │
│                                  │  📄 Cotización_v1.pdf      1.8 MB  │
│                                  │                                    │
│                                  │  [Mover a Propuesta ▾]              │
│                                  │  [Crear cotización]                 │
└─────────────────────────────────┴──────────────────────────────┘
```

- **El contenido principal de la lista sigue visible a la izquierda** (split, no modal).
- El deal detail se cierra con `esc` o back.
- Inline edit en todos los campos (sin doble click). Auto-save.
- Acciones de transición de stage abajo del todo, accesibles también con shortcuts de teclado (`1` Prospecto, `2` Calificado, `3` Propuesta, `4` Negociación, `5` Ganado, `0` Perdido).

### 6.6 Lead Inbox (entrada de prospectos)

- Pestaña del CRM: `Inbox` (a la izquierda de Pipeline).
- Lista de leads entrantes (del wizard, formulario web, importación).
- Cada lead: nombre, origen, **score** (CALIENTE / TIBIO / FRÍO) con dot, **acción sugerida** ("Calificar", "Asignar a owner", "Archivar").
- Acciones en lote: calificar, asignar, crear deal, archivar.
- Click en lead abre split con timeline de origen (qué completó en el wizard, qué descargó, etc.).

### 6.7 Anti-patrones explícitos del CRM

- ❌ Kanban con tarjetas de 6 líneas de información cada una.
- ❌ Modal "Crear nuevo deal" con 12 campos.
- ❌ Pestañas "General / Productos / Cotizaciones / Facturas" dentro del deal.
- ❌ Botón "Exportar a Excel" en la esquina superior.

---

## 7. Módulo 3 — Clientes (Customer 360)

### 7.1 Concepto

Clientes no es un "directorio". Es la vista de **todas las cuentas con las que la empresa tiene relación comercial**, con foco en la salud de la cuenta y la historia completa. Una cuenta, una pantalla con todo.

### 7.2 Layout — Lista

```
┌──────────────────────────────────────────────────────────────────────┐
│  Clientes                              [≡ Lista] [▦ Tarjetas] [🗺 Mapa]│
│                                                                      │
│  [🔍 Filtrar… ⌘F]   [+ Cliente]   ●Salud  ●Sector  ●Owner  + Filtro│
│                                                                      │
│  ●  Cliente                       Sector       Salud   MRR     Owner │
│  ─────────────────────────────────────────────────────────────────── │
│  ●  AeroMax Industrial            Manufactura  ◐ 92% $48K    Ana    │
│  ●  Aceros del Valle S.A.         Siderúrgica  ◐ 78% $24K    Luis   │
│  ●  MetalPlus Colombia            Manufactura  ● 64% $18K    Mateo  │
│  ●  Inducor del Caribe            Energía      ● 41% $12K    Caro   │
│  ●  TecnoRefacciones S.A.         Repuestos    ◐ 88% $9K     Ana    │
│  …                                                                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

- Tabla densa, scroll virtual, sticky header.
- **Columnas inteligentes** (no las mismas para todos): el usuario las puede mostrar/ocultar y reordenar desde un menú.
- **Salud de la cuenta** es un anillo con score (combina pagos a tiempo, frecuencia de compra, tickets abiertos, último contacto).
- **MRR** en mono, alineado derecha.
- **Owner** con avatar + nombre.
- **Selección múltiple** abre la action bar flotante con acciones: reasignar, etiquetar, archivar, fusionar duplicados.

### 7.3 Cliente Detail — Vista 360

Al hacer click, split view 3-pane (como Figma: layers · canvas · inspector):

```
┌──────────────┬─────────────────────────────────────┬────────────────┐
│ CLIENTES     │  AeroMax Industrial        ●Salud 92%│  Inspector     │
│              │  ─────────────────────────            │  ──────────    │
│ ◉ AeroMax    │                                      │  Owner: Ana    │
│   Industrial │  CONTEXTO                            │  Creado:       │
│ ◉ Aceros     │  NIT: 900.123.456-7   Sector: Manuf. │   2024-03-12   │
│   del Valle  │  Dirección: Calle 100 #15-20, Bogotá │                │
│ ◉ MetalPlus  │  Web: aeromax.co                    │  Etiquetas     │
│ ◉ Inducor    │                                      │  ● VIP         │
│ ◉ TecnoRef.  │  CONTACTOS (3)                       │  ● Enterprise  │
│              │  ◉  Carlos Pérez    CEO   · principal │  + Agregar     │
│ + Cliente    │  ◉  Diana Ríos      CTO   · técnico  │                │
│              │  ◉  Andrés Gómez    Compras            │  Campos custom │
│              │  + Agregar contacto                  │  …             │
│              │                                      │                │
│              │  ─────────                            │  PELIGRO       │
│              │                                      │  Archivar      │
│              │  TIMELINE — todo en orden cronológico│  Eliminar      │
│              │                                      │                │
│              │  ●  Hoy  10:42  Cotización COT-91   │                │
│              │     aprobada · $48,000               │                │
│              │  ●  Ayer 16:08  Email: "Avance      │                │
│              │     implementación" — Ana            │                │
│              │  ●  2d atrás  Llamada de seguimiento │                │
│              │     — Ana · 18 min                    │                │
│              │  ●  12 may  Factura FAC-0421 emitida │                │
│              │     · $12,400 · pagada 14 may        │                │
│              │  ●  03 may  Orden OC-0142 recibida   │                │
│              │     · 3 items                         │                │
│              │  ●  28 abr  Reunión de kickoff        │                │
│              │     · acta adjunta                    │                │
│              │  …                                    │                │
└──────────────┴─────────────────────────────────────┴────────────────┘
   240px           flexible                              320px
```

- **Pane izquierdo (240px):** lista de clientes, search arriba, sigue visible mientras se navega el cliente.
- **Pane central (flexible):** tabs internas en una **pill bar** (no pestañas con subrayados): `Contexto · Contactos · Cotizaciones · Facturas · Órdenes · Archivos · Relaciones`. Cada tab muestra su contenido en el mismo pane, sin recargar.
- **Pane derecho (320px):** inspector. Edita owner, etiquetas, campos custom, notas internas, **zona de peligro** abajo con border-top `state.danger/20`.
- **Timeline** es **el feature más importante de este módulo**: una cronología unificada de TODO lo que pasó con la cuenta. Cada item tiene: dot del tipo de evento, fecha, descripción de una línea, link a la entidad relacionada. Filtrable por tipo (toggle pills arriba).
- **Filtros de timeline:** "Mostrar: Todo · Cotizaciones · Facturas · Comunicaciones · Notas". El contador al lado de cada filtro dice cuántos hay.

### 7.4 Vista Tarjetas (alternativa)

- Grid de 3 columnas desktop, 2 tablet, 1 móvil.
- Card de cliente: logo (48px, radius-sm, bg.inset), nombre, sector, **anillo de salud** prominente (40px), MRR mono, owner avatar, "Última actividad: hace 2 días".
- Hover: `border-strong` + `shadow-1-hover`.
- Click = split view.

### 7.5 Vista Mapa (opcional)

- Mapa real (Mapbox/Leaflet) con clusters de clientes geolocalizados.
- Cluster = número de clientes, color por sector.
- Click en cluster = zoom + lista lateral.
- **No** es la vista default. Es para casos específicos ("¿qué clientes tenemos en Antioquia?").

### 7.6 Anti-patrones explícitos

- ❌ Lista de clientes como tabla de 12 columnas hardcoded.
- ❌ "Editar cliente" como modal con 25 campos.
- ❌ Sub-pestañas dentro del cliente con iconos emojis.
- ❌ "Ver más" que abre otra página para mostrar el resto del timeline.

---

## 8. Módulo 4 — Inventario (Stock como Sistema)

### 8.1 Concepto

Inventario no es una hoja de cálculo. Es la **posición física y financiera del stock** con foco en movimientos, salud y reposición. El objeto central es el **Producto/SKU** con su **posición en bodegas**.

### 8.2 Layout — Lista

```
┌────────────────────────────────────────────────────────────────────────┐
│  Inventario                                                             │
│  [🔍 Buscar SKU, nombre… ⌘F]   [+ Producto]                            │
│                                                                          │
│  Bodega: [Todas ▾]  Categoría: [Todas ▾]  Estado: [Todos ▾]  + Filtro  │
│                                                                          │
│  ●  SKU              Producto              Stock        Velocidad  Valor│
│  ──────────────────────────────────────────────────────────────────────│
│  ●  SKU-AX-104      Ventilador axial 450   ████████░░  8  ∿∿∿∿  $1.2K│
│     WH-BOG-01       12 u. (mín 5, máx 30)                            │
│                                                                          │
│  ●  SKU-MT-220      Motor trifásico 5HP    ████░░░░░░  3  ∿∿     $850│
│     WH-BOG-01       4 u. (mín 8, máx 25) ⚠ bajo                      │
│                                                                          │
│  ●  SKU-TR-091      Transformador 220V     ██░░░░░░░░  0  ─      $0  │ ← agotado
│     WH-MED-01       0 u.                                            │
│                                                                          │
└────────────────────────────────────────────────────────────────────────┘
```

- **Columna "Stock"** es una **barra horizontal** que muestra la posición actual entre el mínimo y el máximo. No un número plano. El color de la barra:
  - Verde: entre 50% y 100% del rango.
  - Ámbar: < 50% o cerca del mínimo.
  - Rojo: por debajo del mínimo o en cero.
- Debajo de la barra, en mono 12px muted: número actual + "(mín X, máx Y)".
- **Columna "Velocidad"** = unidades vendidas últimos 30d, mono. Una sparkline de 14d al lado (mini, sin ejes).
- **Sin "Editar" en cada fila.** Las acciones se hacen en el inspector o en bulk.

### 8.3 Producto Detail — Split View

Al click, split con el producto a la izquierda y un panel de detalle a la derecha:

```
┌─────────────────────────────────┬──────────────────────────────┐
│ INVENTARIO                       │  ◀ SKU-AX-104                          │
│                                  │  ────────────                          │
│  ● SKU-AX-104  Ventilador       │                                      │
│  ● SKU-MT-220  Motor trifásico   │  Ventilador axial 450mm               │
│  ● SKU-TR-091  Transformador    │  Categoría: Ventilación               │
│  …                              │                                      │
│                                  │  ─ POSICIÓN ─                        │
│                                  │  WH-BOG-01  12 / 30                   │
│                                  │  WH-MED-01  4 / 25                    │
│                                  │                                      │
│                                  │  ─ VELOCIDAD ─                       │
│                                  │  30d: 24 u.   90d: 68 u.              │
│                                  │  ┌──────────────────────────┐         │
│                                  │  │       ╱╲   ╱╲  ╱╲        │         │
│                                  │  │  ╱╲╱╲╱  ╲╱  ╲╱  ╲╱       │         │
│                                  │  └──────────────────────────┘         │
│                                  │                                      │
│                                  │  ─ MOVIMIENTOS ─                     │
│                                  │  ● Hoy  09:30  Salida  -2   Fac 0421 │
│                                  │  ● Ayer 14:12  Entrada +10  OC-0142  │
│                                  │  ● 2d    11:05  Salida  -1   Fac 0420│
│                                  │  …                                    │
│                                  │                                      │
│                                  │  ── Acciones ──                      │
│                                  │  [Ajustar stock]  [Crear OC]         │
└─────────────────────────────────┴──────────────────────────────┘
```

- **Panel "Ajustar stock"** se abre como **modal pequeño** (no página): cantidad, motivo (select con búsqueda: "Conteo físico", "Merma", "Devolución", "Otro"), nota opcional. **Auto-save con confirmación inline**, no "Guardar" button.
- **"Crear OC"** abre el sheet de Compras con el producto pre-cargado.
- **Movimientos** = timeline cronológico del SKU. Cada movimiento: tipo (entrada/salida/ajuste/transferencia), cantidad (+/-), referencia, usuario, timestamp.

### 8.4 Bodegas (vista alternativa)

- Pestaña arriba de la lista: `Productos · Bodegas · Movimientos · Ajustes`.
- **Bodegas** vista: grid de cards por bodega. Cada card: nombre, ubicación, #SKUs, valor total, % de ocupación (anillo), alertas activas.
- Click en bodega = split con la lista de productos filtrada a esa bodega.

### 8.5 Movimientos (vista global)

- Tabla cronológica de **todos** los movimientos del sistema.
- Filtros: rango de fechas, bodega, tipo, producto, usuario.
- Exportable a CSV (botón en la esquina, no escondido).

### 8.6 Anti-patrones

- ❌ Spreadsheet de 30 columnas (código, nombre, descripción, precio1, precio2, precio3, costo, stock, …).
- ❌ "Stock actual: 12" como única información visual.
- ❌ Modal "Editar producto" con 20 campos.
- ❌ Botones de "+" y "-" en cada fila de stock.

---

## 9. Módulo 5 — Compras (Procurement Workflow)

### 9.1 Concepto

Compras no es una lista de órdenes de compra. Es un **flujo de adquisición** que va desde la sugerencia de reposición hasta la recepción y el pago. El objeto central es la **Orden de Compra (OC)** con sus estados: borrador, enviada, parcialmente recibida, recibida, con discrepancia, pagada.

### 9.2 Layout — Inbox de OC (default)

```
┌────────────────────────────────────────────────────────────────────────┐
│  Compras                                                               │
│                                                                          │
│  [Borrador 4]  [Enviadas 12]  [Parciales 3]  [Recibidas 28]  [Discrep. 1]│  ← Tabs (pill style)
│                                                                          │
│  ●  OC                Proveedor        Items   Total    Estado   Edad   │
│  ────────────────────────────────────────────────────────────────────── │
│  ●  OC-2026-0142     Aceros del V.    3       $4,820   ●Enviada 2d    │
│  ●  OC-2026-0141     MetalPlus        8       $2,140   ●Parcial 4d    │
│  ●  OC-2026-0140     TecnoRefacc.     1       $850     ●Recibida 6d   │
│  ●  OC-2026-0139     Aceros del V.    12      $9,200   ●Discrep. 1d   │
│  ●  OC-2026-0138     Inducor          2       $1,400   ●Enviada 9d    │
│  …                                                                       │
└────────────────────────────────────────────────────────────────────────┘
```

- **Tabs como pill bar** (no pestañas con subrayados). El tab activo tiene fondo `bg.surface`, los demás son ghost. El contador al lado de cada tab es el número de items en ese estado.
- **Filtros arriba:** proveedor, fecha, monto, responsable.
- **Selección múltiple** abre la action bar flotante con acciones contextuales al estado:
  - Borrador: Enviar a proveedor, Duplicar, Eliminar.
  - Enviada: Marcar como recibida, Reportar discrepancia, Cancelar.
  - Parcial: Registrar más recepciones.
  - Recepcionada: Programar pago.

### 9.3 OC Detail — 3 Pane

```
┌──────────────┬─────────────────────────────────────┬────────────────┐
│ COMPRAS      │  OC-2026-0142                          │  Inspector     │
│              │  ─────────────                          │  ──────────    │
│ 12 Enviadas  │                                      │  Estado:       │
│ …            │  ● Enviada · 2d atrás                │  Enviada       │
│              │  Proveedor: Aceros del Valle S.A.    │                │
│              │  Fecha emisión: 2026-05-26           │  Recepción     │
│              │  Entrega esperada: 2026-05-30        │  ████░░ 67%    │
│              │  Responsable: Mateo                  │  2/3 items     │
│              │                                      │                │
│              │  ITEMS                              │  Pagos         │
│              │  ●  SKU-AX-104  Ventilador 450       │  Sin pago      │
│              │     Pedido: 5   Recibido: 5   ✅     │  programado    │
│              │  ●  SKU-MT-220  Motor trifásico     │                │
│              │     Pedido: 3   Recibido: 1   ⚠     │  Total         │
│              │  ●  SKU-TR-091  Transformador       │  $4,820.00     │
│              │     Pedido: 2   Recibido: 0   ⏳    │                │
│              │                                      │  ── Acciones ──│
│              │  ───────                             │  [Recibir]     │
│              │                                      │  [Discrepancia]│
│              │  HISTORIAL                           │  [Cancelar]    │
│              │  ● Hoy  09:30  Enviada al proveedor │                │
│              │     vía email · 2 adjuntos          │                │
│              │  ● 26 may  Creada por Mateo         │                │
│              │  ● 26 may  Sugerencia automática    │                │
│              │     desde Inventario (reorder)      │                │
│              │                                      │                │
└──────────────┴─────────────────────────────────────┴────────────────┘
```

- **Items:** tabla compacta con badges de estado de recepción (recibido, parcial, pendiente). **Click en un item abre un popover** para registrar recepción de unidades (no modal).
- **"Recibir"** abre un sheet de recepción: por cada item, cantidad recibida (input numérico), comentario si hay diferencia. Al confirmar, se actualizan los stocks y el estado de la OC automáticamente.
- **"Discrepancia"** marca la OC en estado `Con discrepancia` y abre un campo de nota obligatorio. El item queda en rojo en la lista de items.
- **"Sugerencia automática desde Inventario"**: cuando un SKU cae bajo su mínimo, el sistema sugiere crear una OC. Aparece como item en el Inbox de Compras con un dot accent y un botón "Crear OC" inline.

### 9.4 Sugerencias de Reorden (nuevo)

- Vista dedicada `Sugerencias` en Compras.
- Lista de SKUs bajo mínimo, con cantidad sugerida de reposición (calculada en base a velocidad + lead time del proveedor histórico).
- Selección múltiple → "Crear OC agrupada" (consolida varios SKUs del mismo proveedor en una sola OC).

### 9.5 Anti-patrones

- ❌ "Órdenes de Compra" como tabla plana con 8 columnas hardcoded.
- ❌ Modal de "Crear OC" con 15 campos.
- ❌ Tres pestañas "Borrador / Activas / Cerradas" con borde inferior.
- ❌ Botón "Exportar PDF" en cada fila.

---

## 10. Módulo 6 — Facturación (Money / Finance)

### 10.1 Concepto

Facturación no es una lista de facturas. Es el **centro de control del dinero**: lo que se emitió, lo que se cobró, lo que está vencido, lo que está en disputa. El objeto central es la **Factura** con su ciclo de vida: borrador → emitida → enviada → vencida → pagada (o anulada).

### 10.2 Layout — Vista principal

```
┌────────────────────────────────────────────────────────────────────────┐
│  Facturación                                                            │
│                                                                          │
│  [Todas 142]  [Borrador 4]  [Emitida 28]  [Vencida 12]  [Pagada 98]     │
│                                                                          │
│  CASH FLOW                                            ⌘D Ver detalle   │
│  $84,320.00  pendiente de cobro      ▲ +18% vs mes anterior           │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │     ╱╲         ╱╲                                                 │  │
│  │  ╱╲╱  ╲  ╱╲  ╱  ╲    ╱╲                                          │  │
│  │ ╱      ╲╱  ╲╱    ╲  ╱  ╲                                         │  │
│  │                   ╲╱    ╲────                                     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  Emitido  Cobrado  Vencido                                            │
│  $142K    $58K     $12K                                              │
│                                                                          │
│  ────                                                                   │
│                                                                          │
│  Facturas recientes                              [Filtros: ⌘F]         │
│  ●  Factura         Cliente           Monto      Vence     Estado       │
│  ──────────────────────────────────────────────────────────────────────│
│  ●  FAC-2026-0421  AeroMax Ind.     $12,400.00  May 14  ●Vencida       │
│  ●  FAC-2026-0420  Aceros del V.    $ 3,250.00  May 13  ●Pagada        │
│  ●  FAC-2026-0419  MetalPlus        $ 8,140.00  May 20  ●Por vencer    │
│  ●  FAC-2026-0418  Inducor          $ 1,400.00  May 25  ●Emitida       │
│  …                                                                       │
└────────────────────────────────────────────────────────────────────────┘
```

- **Hero "Cash Flow":** un número grande (outstanding AR), con delta vs mes anterior y sparkline. Tres números pequeños debajo: emitido, cobrado, vencido.
- **Tabs pill** con contadores por estado.
- **Filtros:** cliente, rango fechas, monto, estado, método de pago.
- **La fila de factura** muestra: dot de estado, número (mono), cliente, monto (mono right), fecha de vencimiento, status pill.
- **"Por vencer"** = ámbar, "Vencida" = rojo. La fila de vencida tiene `bg.danger/3` de fondo (sutil).

### 10.3 Factura Detail — Split View con Preview de PDF

```
┌──────────────────┬───────────────────────────────┬────────────────────┐
│ FACTURAS          │  FAC-2026-0421                       │  PDF PREVIEW       │
│                   │  ─────────────                       │                    │
│ ● FAC-0421  …     │                                      │  ┌──────────────┐ │
│                   │  ●  Vencida · 5d                    │  │ AEROMAX IND. │ │
│ ● FAC-0420  …     │                                      │  │              │ │
│                   │  Cliente                            │  │ Factura      │ │
│ ● FAC-0419  …     │  AeroMax Industrial                 │  │ FAC-2026-    │ │
│                   │  NIT 900.123.456-7                  │  │ 0421         │ │
│ ● FAC-0418  …     │  Carlos Pérez · CEO                 │  │              │ │
│                   │                                      │  │ Items:       │ │
│                   │  Emisión  May 01  Vence  May 14     │  │  …           │ │
│                   │  Total    $12,400.00                │  │              │ │
│                   │  Pagado   $0.00                     │  │ Total:       │ │
│                   │                                      │  │ $12,400.00   │ │
│                   │  Items                               │  │              │ │
│                   │  ● 1  Ventilador axial 450  $1,200  │  └──────────────┘ │
│                   │  ● 5  Motor trifásico 5HP  $850 ea  │                    │
│                   │  ● 2  Transformador 220V   $1,400ea │  [Descargar PDF]  │
│                   │                                      │  [Reenviar email]  │
│                   │  Historial                           │                    │
│                   │  ● May 14  Vencida (sist.)          │                    │
│                   │  ● May 01  Enviada al cliente       │                    │
│                   │  ● May 01  Emitida                   │                    │
│                   │                                      │                    │
│                   │  ── Acciones ──                     │                    │
│                   │  [Registrar pago] [Enviar recordat.] │                    │
└──────────────────┴───────────────────────────────┴────────────────────┘
   280px                flexible                          380px
```

- **PDF Preview en el inspector derecho** generado client-side (jsPDF lazy-loaded). Se ve la factura como realmente se va a imprimir/enviar.
- **"Registrar pago"** abre un **modal pequeño** (no sheet, no página): monto (default = total), fecha, método (select con búsqueda), referencia (opcional), nota. Auto-actualiza el estado de la factura.
- **"Enviar recordatorio"** es una acción de un click con toast: "Recordatorio enviado a carlos@aeromax.co · 3 recordatorios este mes".

### 10.4 Disputas y Anulaciones

- Una factura en disputa muestra un **dot adicional** y una sección "Disputa" en el detalle, con timeline de la disputa y notas.
- Anular factura es una acción reversible: requiere confirmación (modal) y queda en estado `Anulada` con el total tachado en la lista y badge rojo muted.

### 10.5 Conciliación (vista dedicada)

- Pestaña `Conciliación` arriba.
- Tabla cronológica de movimientos bancarios + facturas, emparejados automáticamente.
- Filas con diff = highlighted en ámbar, click para emparejar manualmente.
- Vista tipo ledger contable, con agrupado por día.

### 10.6 Anti-patrones

- ❌ Tabla de facturas con 14 columnas y sort por cada una.
- ❌ Modal "Crear factura" de pantalla completa con 4 pasos.
- ❌ "Ver PDF" como link que abre otra pestaña.
- ❌ Iconos de "papel" clip-art al lado de los items.

---

## 11. Módulo 7 — CMS (Content Workspace / Studio)

### 11.1 Concepto

El CMS no es "páginas web con un editor". Es un **workspace de contenido** donde un equipo de marketing/producto crea, organiza y publica documentación, páginas de aterrizaje, plantillas de email, etc. La referencia es **Notion + Figma + Sanity Studio**.

### 11.2 Layout — Shell del CMS

```
┌────────────┬─────────────────────────────────────────┬─────────────────┐
│ CONTENIDO   │  📄 Guía de implementación ERP           │  Inspector      │
│             │  ─────────────────────────                │  ──────────     │
│ 🔍 Buscar   │  ícono   Portada   Descripción   Estado  │  Estado:        │
│             │  📄       ▦          Acerca de la      │  ●Publicado     │
│ ▾ Workspace │           ▦          plataforma        │                 │
│   ● Páginas  │           ▦          para clientes     │  URL            │
│   ● Plantilla│                                       │  /guias/erp     │
│   ● Borrador │  CONTENIDO                             │  /implementac.  │
│              │                                         │                 │
│ ▾ Documentos│  /h1  Guía de implementación ERP        │  SEO            │
│   ● Guías   │                                         │  Título 60/70   │
│   ● Marketing│  Lorem ipsum dolor sit amet, consectet │  Descrip. 120/160│
│   ● Legal    │  adipiscing elit. Sed do eiusmod tempo │  OG image ✓     │
│              │  incididunt ut labore et dolore magna…  │                 │
│ ▾ Config    │                                         │  Visibilidad    │
│   ● Equipo  │  /h2  Requisitos                       │  ●Público       │
│   ● Roles   │                                         │  ○Solo equipo   │
│   ● Plantilla│  - Acceso a internet                   │  ○Borrador      │
│              │  - 50GB de almacenamiento              │                 │
│ + Nueva pág.│                                         │  ── Acciones ── │
│              │  /h2  Instalación                     │  [Publicar]     │
│              │                                         │  [Vista previa] │
│              │  /code  npm install @erp/cli          │                 │
│              │                                         │  [Duplicar]     │
│              │  /callout  ⚠ Aviso: la instalación   │  [Archivar]     │
│              │  requiere permisos de administrador    │                 │
│              │                                         │                 │
└────────────┴─────────────────────────────────────────┴─────────────────┘
   260px                flexible                          320px
```

### 11.3 Tres panes (estilo Figma Studio)

- **Pane izquierdo (260px):** árbol de contenido. Agrupado por tipo (Páginas, Plantillas, Borradores) y por workspace/equipo. Cada item: ícono (24px) + título + dot de estado (borrador, en revisión, publicado, archivado). Búsqueda arriba. Botón `+ Nueva página` al final.
- **Pane central (flexible):** el documento. Header con ícono (cambiable inline, como Notion), portada opcional (drag & drop, crop), título, descripción. Contenido en bloques.
- **Pane derecho (320px):** inspector. Estado, URL, SEO (título, descripción, OG image, con contadores live), visibilidad, program de publicación, tags, autor.

### 11.4 Editor de bloques

Cada bloque es una unidad semántica:

- **Slash command `/`** abre un menú con todos los bloques disponibles (estilo Notion):
  - `/h1`, `/h2`, `/h3` — encabezados.
  - `/p` — párrafo.
  - `/bullet`, `/numbered`, `/todo` — listas.
  - `/quote` — cita.
  - `/code` — bloque de código con selector de lenguaje.
  - `/callout` — caja destacada (info, warning, success, danger).
  - `/divider` — separador.
  - `/image`, `/video`, `/embed` — medios.
  - `/table` — tabla.
  - `/columns` — layout multi-columna.
- **Cada bloque tiene un handle `⋮⋮`** a la izquierda (visible en hover) para arrastrar/reordenar.
- **Menú flotante por bloque** (estilo Figma) en hover: convertir a otro tipo, duplicar, eliminar, mover a otra página.
- **Markdown shortcuts:** `# `, `## `, `- `, `1. `, `> `, ``` ``` ``` etc., convierten automáticamente al estilo de bloque correspondiente.
- **Selección múltiple** de bloques contiguos con shift+click → menú flotante con acciones batch (estilo Notion).

### 11.5 Bloque código premium

- Highlight de sintaxis con tema propio (no prism por defecto, tema custom con los tokens del sistema).
- Botón "Copiar" en la esquina superior derecha (icon-only, aparece en hover).
- Número de línea opcional.
- Lenguaje detectado o seleccionable desde un pill en la esquina superior izquierda.

### 11.6 Colaboración

- **Avatares de colaboradores activos** en la parte superior del documento (estilo Figma/Google Docs), con cursor remoto visible en el editor (color por usuario, label con nombre).
- **"Last edited by X · 2h ago"** debajo del título (mono 12px muted).
- **"Estás editando"** aparece sutilmente al lado del título cuando hay alguien más viendo.

### 11.7 Publicación

- **Botón "Publicar"** en la esquina superior derecha, **accent color**, con dot de estado de publicación.
- Publicar abre un modal con: confirmar URL, SEO final, programación opcional (publicar el…), visibilidad.
- Al publicar, toast: "Publicado · Visible en /guias/erp-implementacion".
- **"Vista previa"** abre en un panel lateral con el render público.

### 11.8 Plantillas

- Pestaña `Plantillas` en el árbol izquierdo.
- Una plantilla = una página con bloques pre-armados.
- Click en plantilla → "Usar plantilla" → crea nueva página con esos bloques.

### 11.9 Anti-patrones

- ❌ TinyMCE / CKEditor con 47 botones de toolbar.
- ❌ Lista de "páginas" como una tabla con fecha y autor.
- ❌ "Editor HTML" como modo avanzado.
- ❌ Sidebar derecha de "Propiedades de página" con 20 campos.

---

## 12. Módulo 8 — Configuración (Workspace Settings)

### 12.1 Concepto

Configuración no es "una página de formularios". Es el **panel de control del workspace** donde se ajusta la organización, el equipo, los roles, las integraciones, la facturación de la plataforma, y la personalización white label. La referencia es **Linear Settings + Stripe Settings + Notion Settings**.

### 12.2 Layout

```
┌────────────┬──────────────────────────────────────────┬────────────────┐
│ CONFIG.     │  General                                  │  AYUDA          │
│              │  ────────                                  │  ──────────     │
│ 🔍 Buscar   │                                            │  Documentación  │
│              │  Nombre del workspace                    │  › /settings    │
│ MIEMBROS    │  ┌────────────────────────────────────┐   │                 │
│ ● General   │  │ AeroMax Industrial                 │   │  Contactar      │
│ ● Equipo    │  └────────────────────────────────────┘   │  soporte        │
│ ● Roles     │                                            │  › soporte@…    │
│              │  Identificador URL                        │                 │
│ OPERACIÓN   │  ┌────────────────────────────────────┐   │  Atajos         │
│ ● Empresa   │  │ aeromax                            │   │  ⌘K Buscar     │
│ ● Impuestos │  └────────────────────────────────────┘   │  ⌘, Config     │
│ ● Plantillas│                                            │                 │
│              │  Logo                                     │                 │
│ FACTURACIÓN │  [Subir imagen]  512×512 máx · PNG/SVG    │                 │
│ ● Plan      │                                            │                 │
│ ● Métodos   │  Identidad visual                          │                 │
│ ● Historial │  Color primario                            │                 │
│              │  ┌────┐                                    │                 │
│ INTEGRACIÓN │  │ ████│  #0EA5E9                          │                 │
│ ● Email     │  └────┘                                    │                 │
│ ● Pagos     │                                            │                 │
│ ● Almacén   │  Zona horaria                              │                 │
│              │  [America/Bogota ▾]                       │                 │
│ WHITE LABEL │                                            │                 │
│ ● Marca     │  Moneda                                    │                 │
│ ● Dominio   │  [COP — Peso colombiano ▾]                │                 │
│              │                                            │                 │
│ AVANZADO    │                                            │                 │
│ ● API       │                                            │                 │
│ ● Webhooks  │                                            │                 │
│ ● Logs      │                                            │                 │
│              │                                            │                 │
│              │  ── ZONA DE PELIGRO ──                    │                 │
│              │                                            │                 │
│              │  Transferir ownership                     │                 │
│              │  [Transferir]                             │                 │
│              │                                            │                 │
│              │  Eliminar workspace                       │                 │
│              │  Esta acción es irreversible.            │                 │
│              │  [Eliminar workspace]                     │                 │
└────────────┴──────────────────────────────────────────┴────────────────┘
   240px                flexible (max-w 720px)                280px
```

### 12.3 Tres panes

- **Pane izquierdo (240px):** navegación por secciones. Búsqueda arriba que filtra las secciones (Linear hace esto muy bien). Secciones agrupadas por categoría con headers uppercase mono.
- **Pane central (max-w 720px):** el contenido. **Una sola columna generosa.** No se divide en dos ni en tres. Cada setting es: título 14px medium + descripción 13px secondary + control. **Sin "Save" button**: auto-save con indicador "Saved · 2s ago" en mono muted al pie del pane.
- **Pane derecho (280px):** ayuda contextual. Cambia según la sección visible: documentación relevante, contacto de soporte, atajos de teclado relacionados.

### 12.4 Tipos de controles

- **Input de texto / número** — input estándar del sistema.
- **Color picker** — popover con campo hex + presets del tenant.
- **Select con búsqueda** — para zonas horarias, monedas, idiomas.
- **Toggle** — switch con animación de 160ms, label a la derecha, descripción debajo.
- **Multi-select de pills** — para integraciones, canales.
- **Upload** — drop zone con borde dashed, preview del archivo, opción de reemplazar/eliminar.
- **JSON editor** (solo API) — Monaco con tema del sistema, validación inline.

### 12.5 Zona de peligro

- Sección al final de cada categoría con `border-t border-danger/20`, header en `state.danger.fg`, descripción explícita de la irreversibilidad.
- Botón de acción en estilo "secondary danger" (border danger, texto danger, fondo transparente), confirmable con modal.

### 12.6 Roles y permisos (sección dedicada)

- Lista de roles en la izquierda.
- Click en rol → matriz de permisos: cada capacidad como fila, cada nivel (ninguno / ver / editar / admin) como columnas, **toggles inline**.
- Cambios se guardan al cambiar el toggle, con indicador "Saved · 1s ago".
- **No** un formulario con checkboxes agrupados por tabs. **Una matriz, una vista, edición inmediata.**

### 12.7 White Label

- Sección dedicada con preview en vivo: a la derecha, una **preview card** del workspace con el logo y color elegidos aplicados. Cambias un color → la preview se actualiza al instante.
- Configuración: logo, favicon, color primario, dominio custom, email "from" del sistema, copy de emails transaccionales.
- "Publicar cambios" para los que afectan a los usuarios (dominio, color); el resto es auto-save.

### 12.8 API & Webhooks

- Vista de API: lista de tokens con nombre, último uso, scopes. Crear nuevo token = modal con nombre + checkboxes de scopes + mostrar el token **una sola vez** con copy button.
- Vista de Webhooks: lista de endpoints, eventos suscritos, último delivery (con status: 200/4xx/5xx), botón "Reintentar" si falló.
- **Logs** = tabla cronológica de eventos con filtros (endpoint, evento, status, rango de fechas).

### 12.9 Anti-patrones

- ❌ "Configuración" como una página con tabs de 7 categorías.
- ❌ Formularios largos con "Save" button al fondo.
- ❌ "Roles y permisos" como matriz de 20×20 checkboxes.
- ❌ Settings sin agrupar (todo en una sola lista larga).

---

## 13. Patrones Comunes de Interacción

Patrones que se usan transversalmente en los 8 módulos.

### 13.1 Keyboard-first

Cada módulo expone sus atajos en el command bar y en el footer del módulo. **Todos los atajos son OS-aware** (ver §2.4): `⌘` se renderiza como `Ctrl` en Windows/Linux.

| Atajo | Acción | Disponibilidad |
|---|---|---|
| `⌘K` (o `Ctrl K`) | Abrir command bar | Global |
| `⌘1` … `⌘8` | Ir a módulo 1–8 | Global |
| `⌘N` | Crear entidad (contexto) | Global |
| `⌘F` | Filtrar lista | En listas |
| `⌘⇧P` | Crear orden de compra | Global |
| `⌘⇧F` | Crear factura | Global |
| `⌘/` | Mostrar atajos del módulo actual | Global |
| `↑` `↓` | Navegar selección en lista | En listas |
| `↩` | Abrir item seleccionado | En listas |
| `⌫` (con selección) | Acción contextual | En listas |
| `esc` | Cerrar sheet/modal/popover | Global |
| `1`…`0` | Cambiar stage (en CRM) | En Deal |
| `space` | Toggle (en checkbox lists) | En listas con checkboxes |

### 13.2 Real-time y Optimistic UI

- Toda acción local (marcar como hecho, cambiar estado, agregar item) se refleja **inmediatamente** con optimistic update.
- Si la mutación al servidor falla, rollback con toast de error y opción "Reintentar".
- Streams en vivo (Pulse, Status indicators) vía Supabase Realtime.

### 13.3 Búsqueda unificada

- El command bar indexa: clientes, contactos, facturas, cotizaciones, órdenes de compra, productos, SKUs, páginas CMS, miembros del equipo, **y acciones**.
- Búsqueda fuzzy con highlighting del término coincidente.
- Resultados en <16ms con índice local precargado (Fuse.js o similar).

### 13.4 Estados vacíos (Empty States) diseñados

Cada módulo tiene un empty state diseñado a medida (no un genérico):

- **CRM vacío:** ilustración de un pipeline minimal, headline "Empieza tu pipeline", sub "Crea tu primer deal o importa desde el wizard", botón `+ Crear primer deal`.
- **Inventario vacío:** ilustración de una bodega, headline "Tu bodega está lista", sub "Agrega productos o importa un CSV", botones `+ Producto` y `Importar CSV`.
- **Facturación vacío:** ilustración de una factura, headline "Aún no has emitido facturas", sub "Cuando emitas tu primera factura aparecerá aquí".
- **CMS vacío:** ilustración de un documento, headline "Crea tu primera página", sub "Empieza con una plantilla o desde cero".

### 13.5 Estados de error diseñados

- **Red:** banner superior sutil con dot ámbar + "Sin conexión. Los cambios se guardarán al reconectar." + indicador de items en cola.
- **500/persistente:** pantalla de error con ilustración técnica, headline "Algo falló", descripción, **error code mono** (ej `ERR-2026-05-28-0142`), botones "Reintentar" y "Reportar".

### 13.6 Onboarding contextual y discoverability

Capas progresivas para que el usuario descubra las capacidades del sistema sin sentirse abrumado.

- **Primer login:** tour de 3 pantallas, skippable desde la primera.
  1. Tooltip anclado a la top bar: *"Esta es tu búsqueda global. Buscá cualquier cliente, factura o producto."*
  2. Tooltip sobre el input: *"Funciona con o sin teclado. Hacé click o usá el atajo."* + chip OS-aware (`⌘K` o `Ctrl K`).
  3. Command bar abierto, escribiendo "crear": *"También ejecuta acciones. Escribí 'crear' para ver qué podés hacer."*
- **Trigger de tour:** `user_preferences.onboarding_seen = false`. Se persiste al cerrar (X, "Saltar" o completar el paso 3).
- **Reactivable:** desde `Configuración → General → "Repetir tour de bienvenida"`.
- **Coach marks por módulo** (lightweight): la primera vez que el usuario entra a un módulo, aparece un único dot pulsante sobre el elemento más importante de esa vista, con tooltip corto. No tour completo, solo una pista. Se descarta con click fuera.
- **Empty states activos** (ver §13.4): ya cubren discoverability funcional por módulo.
- **Panel `?`:** siempre disponible en la top bar. Lista todos los atajos del módulo actual + link a documentación. Sin requerir conocer el atajo `⌘/`.

---

## 14. Anti-Patrones Explícitos (lo que NUNCA se hace)

Consolidado de los rechazos explícitos. Estos patrones quedan **prohibidos** en el rediseño:

### 14.1 Tablas y datos
- ❌ Zebra striping.
- ❌ "Edit" / "Delete" como columna final en cada fila.
- ❌ "Actions" como columna desplegable con 6 opciones.
- ❌ Paginación numérica "1 2 3 ... 47" en listas grandes (preferir infinite scroll o "Load more").
- ❌ Headers de tabla con iconos de sort confusos.
- ❌ Más de 6 columnas visibles sin capacidad de hide/show.

### 14.2 Formularios
- ❌ Formularios de 20+ campos en una sola pantalla.
- ❌ Labels dentro del input (placeholder-as-label).
- ❌ "Save" / "Submit" como botón genérico.
- ❌ Validación que aparece solo al hacer submit.
- ❌ Inputs sin helper text cuando hay reglas no obvias.
- ❌ Selects nativos del navegador sin custom.

### 14.3 Modales y sheets
- ❌ Modales para crear entidades (usar sheet o inline).
- ❌ Modales anidados (modal dentro de modal).
- ❌ Sheets de ancho completo de la pantalla.
- ❌ Modales sin acción de "close" visible (solo la X).

### 14.4 Botones
- ❌ Botones con icon-only sin tooltip.
- ❌ Botones "100% width" fuera de modales.
- ❌ Múltiples botones primarios en la misma vista.
- ❌ Color como único indicador de estado (siempre acompañarlo de texto o icono).
- ❌ Botones con 2 palabras en uppercase tracking-wide estilo "ADMINISTRATIVO".

### 14.5 Métricas y KPIs
- ❌ "KPI cards" en grilla de 4 con número grande y label pequeño.
- ❌ Métricas dentro de cajas con fondo gris (`bg-zinc-100`).
- ❌ Gráficos de torta para más de 3 categorías.
- ❌ Gráficos de barras 3D, con efectos, con gradientes chillones.
- ❌ Porcentajes de cambio sin contexto temporal ("+12%" sin "vs mes anterior").

### 14.6 Navegación
- ❌ Tabs con subrayado estilo Bootstrap.
- ❌ Sidebars de 3 niveles de profundidad.
- ❌ Breadcrumbs en cada pantalla.
- ❌ "Home" como item de navegación.
- ❌ Iconos de emojis (🏠 📊 📦).

### 14.7 Tipografía
- ❌ Más de dos familias tipográficas (sans + mono, nada más).
- ❌ Texto en uppercase para body (solo labels mono).
- ❌ Texto en italic para emphasis (usar weight).
- ❌ Tamaños de fuente por debajo de 11px o por encima de 48px.
- ❌ Texto centrado en listas o datos.

### 14.8 Color
- ❌ Más de un color de marca en la misma vista.
- ❌ Uso de color rojo/verde para decoración.
- ❌ Hardcodear colores fuera de tokens semánticos.
- ❌ Fondos grises planos como "separadores visuales".

### 14.9 Motion
- ❌ Animaciones con spring o rebote.
- ❌ Transiciones >300ms.
- ❌ Animaciones que se ejecutan en cada render.
- ❌ Skeletons que parpadean.
- ❌ Animaciones decorativas (logo girando, etc.) fuera de empty/loading states.

---

## 15. Roadmap de Implementación Sugerido

Orden recomendado para construir el rediseño, agrupado en olas para validar progresivamente.

### Ola 0 — Foundation (1 sprint)
- Sistema de tokens completo (CSS vars, archivo `tokens.css`, integración con `tenant_settings`).
- Componentes base: Button, Input, Select, Pill, StatusDot, Card, Sheet, Modal, Toast, CommandBar.
- App shell mínimo: Top Bar (con search input + chip OS-aware + `?` + workspace switcher) + Left Rail (con item "Buscar" como primer ítem) + Main.
- **Hook `usePlatform()`** + renderizado OS-aware de atajos.
- Hook de **right-click contextual** sobre filas de lista.
- Scaffold de **onboarding tour** (3 pasos, persistente).
- Modo de densidad (compact/default/comfortable).
- Verificación: `npm run build && npm run lint` + smoke test de command bar (con y sin atajo, en macOS y Windows emulado).

### Ola 1 — Lista + Detalle genérico (1 sprint)
- Patrón "Lista con split-view de detalle" reutilizable.
- Patrón "Bulk actions" reutilizable.
- Patrón "Filtros como pills + tabs de vistas guardadas" reutilizable.
- Verificación: implementar un módulo dummy y validar ergonomía.

### Ola 2 — Módulos núcleo (2–3 sprints)
- Dashboard (Command Center).
- Clientes (Customer 360).
- Inventario (Stock como sistema).
- Cada uno con su split-view propio, timeline, y vistas alternativas.

### Ola 3 — Módulos transaccionales (2 sprints)
- Facturación (con PDF preview).
- Compras (con sugerencias de reorden).
- CRM (con pipeline + lead inbox).

### Ola 4 — Módulos de sistema (1–2 sprints)
- CMS (Content Workspace con editor de bloques).
- Configuración (Workspace Settings con matriz de roles).

### Ola 5 — Polish (1 sprint)
- Motion system refinado.
- Empty/Error/Loading states diseñados para los 8 módulos.
- Reduced motion + accesibilidad AA auditada.
- White label aplicado en preview (cambiar tokens y verificar que toda la UI reacciona).

---

## 16. Criterios de Aceptación del Rediseño

El rediseño se considera exitoso cuando se cumplen **todos** los siguientes criterios, verificables manualmente o con tests automatizados:

1. **Ningún módulo** tiene tablas con zebra striping ni botones "Edit" en cada fila.
2. **Ningún formulario** tiene más de 8 campos visibles sin stepper o sheet por pasos.
3. **Ningún modal** se usa para crear entidades (solo sheets, inline, o command bar).
4. **El command bar** está disponible globalmente y resuelve fuzzy search sobre todas las entidades indexadas en <50ms percibido.
5. **Los 8 módulos** tienen split-view de detalle con el contenido principal siempre visible.
6. **Cada módulo** tiene empty state, loading state y error state diseñados a medida (no genéricos).
7. **El Dashboard** no contiene "KPI cards en cajas grises". Tiene hero number + pulse + cola personal.
8. **El sistema de tokens** cubre 100% de los valores de color, espaciado, radio, sombra y motion. No hay valores hardcoded en componentes.
9. **La profundidad** se logra con sombras multicapa + ring, nunca con fondos grises planos.
10. **Las animaciones** son todas <300ms, sin spring, con `cubic-bezier(0.2, 0, 0, 1)`.
11. **El white label** funciona: cambiar el color primario en `tenant_settings` se refleja en toda la UI sin re-builds.
12. **El command bar** es accesible sin atajo: el input está siempre visible en la top bar, hay un item "Buscar" en el left rail, y funciona por click. El atajo `⌘K`/`Ctrl K` se muestra como chip OS-aware.
13. **El command bar** se invoca con `⌘K` o `Ctrl K` según el OS del usuario, y muestra acciones además de entidades.
14. **Las acciones de teclado** documentadas en cada módulo funcionan (`⌘1`–`⌘8`, `⌘K`, `⌘N`, `esc`, `⌘/`) y se renderizan con el modificador correcto según el OS.
15. **Los estados de las entidades** se comunican con dot de color + texto, no solo color.
16. **Las tablas** tienen sticky header, sticky filter bar, y bulk actions via action bar flotante.
17. **El CMS** tiene editor de bloques con slash command, sin toolbar tradicional.
18. **La Configuración** auto-guarda con indicador "Saved · Xs ago", sin botón "Save".
19. **El módulo de Facturación** incluye preview del PDF generado en el inspector.
20. **El módulo de Compras** incluye sugerencias automáticas de reorden basadas en velocidad de venta.
21. **El primer login** muestra el tour de discoverability (3 pasos) skippable, y el estado se persiste en `user_preferences.onboarding_seen`.
22. **El right-click en filas de lista** abre un menú contextual con las mismas acciones del command bar (red de seguridad para usuarios de mouse).
23. **El sistema** se siente como Linear + Stripe, no como un panel administrativo. Verificación: un usuario nuevo puede abrir la app, hacer 3 acciones críticas sin leer documentación, sin conocer ningún atajo de teclado.

---

## 17. Riesgos y Decisiones Pendientes

Decisiones que deben confirmarse antes de implementar:

1. **Editor del CMS: ¿construir o integrar?**
   - Opción A: editor propio con bloques (más control, más trabajo).
   - Opción B: integrar TipTap o Lexical con bloques custom (más rápido, dependencia externa).
   - Recomendación: **TipTap** con nodos custom para los bloques del sistema.

2. **PDF: ¿client-side o server-side?**
   - Client-side (jsPDF) es lo que ya se usa. Funciona, pero consume memoria del navegador.
   - Server-side (Puppeteer) genera mejor calidad pero requiere un servicio.
   - Recomendación: **client-side** para preview rápido, server-side opcional para factura final si se requiere.

3. **Mapas: ¿Mapbox o Leaflet?**
   - Mapbox: mejor look, requiere token.
   - Leaflet: OSS, más limitado estéticamente.
   - Recomendación: **Mapbox** con token del tenant (ya previsto en la white label).

4. **Real-time: ¿Supabase Realtime + canales por módulo?**
   - Confirmado en la Constitución Técnica. Definir los canales (uno por módulo o uno global) y la estrategia de fallback cuando no hay WS.

5. **Búsqueda: ¿índice local o búsqueda server-side?**
   - Índice local (Fuse.js) con precarga al login: <16ms percibido.
   - Búsqueda server-side con `tsvector` de Postgres: necesaria para >10K registros.
   - Recomendación: **índice local + RPC server-side** para >10K registros con paginación.

6. **Densidad: ¿compact por default?**
   - Compact (Linear-like) maximiza información por pantalla pero puede ser denso para usuarios nuevos.
   - Recomendación: **default** (Notion-like) con toggle a compact para power users.

7. **Onboarding tour: ¿build propio o driver externo?**
   - Opción A: tour custom con Framer Motion + steps definidos en código (más control, alineado al sistema).
   - Opción B: driver externo (Driver.js, Shepherd.js) para acelerar implementación.
   - Recomendación: **tour custom** con 3 pasos, ya que el look debe ser consistente con la gramática premium y solo son 3 pantallas.

8. **Detección de OS para atajos: ¿SSR + cookie, o client-side?**
   - Client-side (`navigator.platform`) es suficiente y evita roundtrip.
   - SSR + cookie permite atajos correctos en el primer render.
   - Recomendación: **client-side** con fallback de `Ctrl` por defecto, optimizado para evitar flash de `⌘K` → `Ctrl K` en el primer paint.

---

## 18. Próximo Paso

**Esperar aprobación del blueprint.** Una vez aprobado:

1. Congelar este documento en `docs/03_protocolo/22_BLUEPRINT_ERP_REDESIGN.md` como Constitución Visual.
2. Iniciar la **Ola 0 (Foundation)** según el roadmap.
3. Cada ola genera un build verificable (`npm run build && npm run lint`) antes de pasar a la siguiente.

**No se escribe código hasta que el blueprint sea aprobado explícitamente.**
