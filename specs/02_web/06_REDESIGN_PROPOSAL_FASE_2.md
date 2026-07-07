# AEROMAX INDUSTRIAL — REDISEÑO WEB PÚBLICA
## Fase 2 · Master Architecture Roadmap

### Comité de Diseño
*Senior Enterprise Product Designer · UI Director · UX Director · Creative Director · Brand Designer · Art Director · Industrial Marketing Strategist · Apple Human Interface Designer*

---

## 0. AUDITORÍA DE LA EXPERIENCIA ACTUAL

### 0.1 Qué comunica hoy la web pública

Tras revisar `src/app/page.tsx`, `src/components/CatalogView.tsx` y los 9 archivos de `src/components/marketing/`, identificamos que la implementación actual transmite:

| Atributo percibido | Evidencia actual |
|---|---|
| "Folleto técnico escaneable" | Hero con `min-h-[85vh]`, fondo crema `#FAF9F5`, tipografía todo uppercase font-mono. |
| "Estética de SCADA/DAQ" | Insignias `// TELEMETRÍA Y CONTROL FLUIDODINÁMICO B2B`, `// SHOWCASE: CENTRIFUGAL SYSTEM`, `// STANDARDS Y HOMOLOGACIÓN`. |
| "Mockup de manual impreso" | Líneas vectoriales con coordenadas `X: 142.5 mm`, `Y: 980.2 mm`, retícula milimétrica visible, cards con `rounded-3xl` excesivo. |
| "Tienda-técnica-clonada-de-VENTITECH" | Las cards de producto (`/axial_duct_fan.png`, `/extractor_hongo_inox.png`) replican un patrón externo. |
| "Botón bootstrap-fancy" | CTAs `rounded-full px-8 py-4` estilo SaaS genérico con `hover:brightness-110`. |
| "Confianza declarada, no demostrada" | Insignias ISO 9001 / AMCA / ATEX como pills estáticas sin contexto ni prueba visual. |

### 0.2 Lo que DEBE transmitir una plataforma industrial premium

Una plataforma que compita con Apple, Stripe, Linear, Vercel, Notion, Framer e Intercom debe transmitir:

1. **Calma ejecutiva** — fondo profundo, no claro, no crema. El industrial opera desde una oficina oscura con tres monitores. El industrial moderno es **dark-mode-first** (ver Linear, Vercel, Framer).
2. **Densidad legible** — información técnica rica pero aireada. No "folleto", sino "dashboard de cockpit".
3. **Profundidad manufacturada** — capas, sombras reales, glassmorphism controlado, no flat.
4. **Tipografía con jerarquía dramática** — un solo titular en `display` Outfit 7xl-8xl tracking negativo, micro-labels en `mono` 9-10px, cuerpo Inter 14-16px.
5. **Pruebas visuales, no afirmaciones** — cada métrica se demuestra con un componente vivo (curva SVG animada, contador CFM 60fps, terminal con telemetría, scanner de partículas).
6. **Identidad industrial reconocible** — paleta de taller de ingeniería: negro carbón, gris ceniza, blanco humo, un acento en azul acero (NO neón, NO gamer).

### 0.3 Las 7 prohibiciones explícitas (recordatorio)

1. ❌ No más fondos crema / claros. La web es **dark-first premium** (zinc-950, con un solo "acto claro" intencional donde aplique).
2. ❌ No más `// SHOWCASE` ni estética "telemetría retro". Vamos a "telemetría premium moderna" estilo Linear/Vercel.
3. ❌ No más `rounded-3xl` en cards masivas. Usar `rounded-xl` con bordes técnicos y sombras reales.
4. ❌ No más pills de certificaciones decorativas. Cada certificación debe tener un mini-holograma SVG o chip verificado.
5. ❌ No más cards con 3 párrafos de texto. Cada card = 1 idea + 1 número + 1 acción.
6. ❌ No más SVGs decorativos. Cada SVG cuenta una historia técnica (curva, plano, terminal, HUD).
7. ❌ No más copy genérico. Headlines con peso de decisión ejecutiva.

---

## 1. DIRECCIÓN CREATIVA

### 1.1 Concepto
> **"Engineering Cockpit"** — La web se siente como el panel de control desde el cual un director de planta comanda una operación crítica. No es un brochure. Es una consola.

### 1.2 Tagline maestro
> **"Diseñamos el aire que mueve su industria."**

### 1.3 Paleta cromática (white-label dinámica)

| Token | Valor default | Significado |
|---|---|---|
| `--bg-base` | `#07090C` | Carbón absoluto (más profundo que zinc-950) |
| `--bg-elevated-1` | `#0D1117` | Paneles de fondo |
| `--bg-elevated-2` | `#161B22` | Tarjetas |
| `--bg-elevated-3` | `#1F2630` | Hover / pressed |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Bordes hairline |
| `--border-strong` | `rgba(255,255,255,0.10)` | Bordes de énfasis |
| `--fg-primary` | `#F0F6FC` | Texto principal |
| `--fg-secondary` | `#9DA7B3` | Texto secundario |
| `--fg-muted` | `#6E7681` | Metadatos / labels mono |
| `--accent` | `#4C8DFF` | Azul aero (default tenant) — **dinámico** |
| `--accent-glow` | `rgba(76,141,255,0.18)` | Glow del acento |
| `--severity-cold` | `#79C0FF` | Telemetría fría |
| `--severity-warm` | `#F0883E` | Telemetría cálida |
| `--severity-hot` | `#FF7B72` | Telemetría caliente / alertas |
| `--signal-success` | `#3FB950` | Operativo |

### 1.4 Sistema tipográfico

| Rol | Fuente | Tamaño | Caso de uso |
|---|---|---|---|
| Display XL | Outfit 800 | `clamp(56px, 8vw, 128px)` | Titular del Hero (UNA sola línea dramática) |
| Display L | Outfit 700 | 48-64px | Headlines de sección |
| Display M | Outfit 600 | 32-40px | Títulos de card destacados |
| Body L | Inter 400 | 18-20px | Subtítulos |
| Body M | Inter 400 | 15-16px | Párrafos |
| Caption | Inter 500 | 13-14px | Meta-labels |
| Mono micro | JetBrains Mono 500 | 10-11px | Insignias técnicas, coordenadas, IDs |
| Mono data | JetBrains Mono 600 | 12-14px | Especificaciones, métricas numéricas |
| Mono display | JetBrains Mono 700 | 24-48px | KPIs en HUD |

### 1.5 Regla de oro tipográfica
En cada viewport solo puede haber **UN** titular en `Display XL` (Hero) y **máximo DOS** headlines en `Display L` (uno por sección principal). Todo lo demás es cuerpo o mono. La sobriedad es lo que separa a Linear de un template de Framer gratuito.

---

## 2. ARQUITECTURA DE NAVEGACIÓN

### 2.1 Nueva top-bar (reemplaza la actual `HeroSection` sticky)

```
┌──────────────────────────────────────────────────────────────────┐
│  [LOGO]  PRODUCTOS · SERVICIOS · SECTORES · CASOS · NOSOTROS  [⌘K] [PORTAL] [COTIZAR →] │
└──────────────────────────────────────────────────────────────────┘
```

**Cambios vs. actual:**
- Logo: 32px altura, monochrome, alineado a 24px del borde.
- Links: Inter 13px medium, `text-fg-secondary`, hover `text-fg-primary` con underline animado izquierda→derecha de 1px en `--accent`.
- Separador vertical hairline entre links.
- Buscador global `⌘K` centrado (no en el header) — abre command palette estilo Linear.
- CTA `Cotizar →` con flecha animada (translate-x 4px on hover).
- Altura: **56px** (no 64), más denso.
- Background: `rgba(7,9,12,0.72)` con `backdrop-filter: blur(20px) saturate(180%)`.
- Border-bottom: `1px solid var(--border-subtle)`.

### 2.2 Command Palette (nuevo)
Modal central (no esquina) estilo `⌘K`:
- Input mono `>` como prefijo.
- 6 secciones: Navegación, Productos, Servicios, Sectores, Casos, Documentos.
- Cada item: ícono 14px + label + shortcut secundario mono (`/sectores`).
- Búsqueda fuzzy con `fzf` algorithm.

---

## 3. SECCIONES DE LA LANDING — REPLANTEAMIENTO TOTAL

A continuación, **cada sección se replantea desde cero**. Nada se copia de la implementación actual.

### 3.1 SECCIÓN 00 — HERO

**Concepto:** "Cockpit abierto sobre una planta industrial". La pantalla es un panel de control, no un banner.

**Estructura (full-bleed 100vh, dark absoluto):**

```
┌─────────────────────────────────────────────────────────────────┐
│ TOP BAR (56px, blur, hairline bottom)                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [grilla técnica animada de fondo, opacidad 3%]                 │
│  [línea de horizonte sutil a 60% con glow accent]               │
│                                                                 │
│  ┌─Eyebrow mono: "AEROMAX // INDUSTRIAL VENTILATION OS"─┐       │
│                                                                 │
│  Diseñamos                            [VIDEO LOOP 16:9]         │
│  el aire que                                ┌──────────┐         │
│  mueve su industria.                        │ ▶  0:42  │         │
│                                             │ Live HUD │         │
│  ─────                                      └──────────┘         │
│  Sistemas de extracción, inyección y climatización para         │
│  plantas que no pueden detenerse. AMCA · ISO 1940 · ATEX.       │
│                                                                 │
│  [→ Configurar mi sistema]  [▷ Ver planta en operación]         │
│                                                                 │
│  ──────────────────────────────────────────────                 │
│  3,847,200 CFM instalados · 312 plantas operativas · 0 paradas │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Elementos únicos del Hero:**

1. **Eyebrow técnico** en `JetBrains Mono 11px tracking-widest` color `--fg-muted`, con prefijo `//`.
2. **Titular** Outfit 800 en 3 líneas, tamaño `clamp(56px, 8vw, 128px)`, `tracking-tighter`, color `--fg-primary`. Solo la palabra **"aire"** lleva tilde y color `--accent` (es el "producto" vendido).
3. **Línea de horizonte animada** — un SVG path de 1px de alto, con un punto brillante que se desplaza de izquierda a derecha en 8 segundos loop, simulando telemetría. Color `var(--accent)`.
4. **Visual ancla** — NO foto de ventilador. Es un **mini-cockpit en vivo**:
   - Frame 16:9, bordes hairline, fondo `--bg-elevated-1`.
   - Loop de video industrial (max 6MB) en autoplay muted.
   - HUD overlay arriba-derecha con: timestamp mono, contador de RPM animando (60fps), label "LIVE TELEMETRY".
   - Mini-botón play superpuesto (cuando no está autoplay).
5. **Trust strip en bottom** — 3 cifras grandes en `mono` 32px weight 700 separadas por hairline vertical, con label micro 10px debajo. Las cifras NO son logos. Son números auditables.

**Reglas:**
- Sin grid de fondo "obvio". Grilla con `mask-image: radial-gradient` que se desvanece en los bordes.
- Sin gradiente azuloso genérico. Solo el `accent-glow` en la línea de horizonte.
- Sin íconos flotantes ni badges de "+500 proyectos" con puntos pulsantes. La credibilidad se demuestra con números, no con animación.
- Sin ChevronDown animado al fondo. Reemplazado por un mini-command "Explorar sistema ↓" mono 10px en la esquina inferior derecha.

---

### 3.2 SECCIÓN 01 — TICKER DE COMPETENCIAS (reemplaza Trust Bar)

**Problema actual:** Logos grises estáticos = decorativos.
**Solución:** Un ticker técnico infinito de **capacidades verificables**.

```
┌─────────────────────────────────────────────────────────────────┐
│ AMCA · ISO 1940 G2.5 · ATEX ZONE 1 · RETIE · NFPA 68 · ASHRAE 62.1 · NEMA 4X · IEEE 841 · API 673 ... │
└─────────────────────────────────────────────────────────────────┘
```

- Ticker infinito horizontal, 40s loop, sin pausa.
- Cada item: `MONO 12px medium uppercase` color `--fg-muted`, separado por un punto `·` accent.
- Hover pausa el ticker y resalta el item en `--fg-primary` con underline accent.
- Background: `--bg-elevated-1` con hairline top/bottom.
- Sin logos. Sin imágenes. **Solo texto verificado.**

---

### 3.3 SECCIÓN 02 — "EL PROBLEMA OPERATIVO" (reemplaza Problema con 6 cards)

**Concepto:** 3 problemas, no 6. Cada uno con un **termómetro vivo** que se anima al entrar en viewport.

**Estructura:**

```
┌─────────────────────────────────────────────────────────────────┐
│ // 01 — EL PROBLEMA                                            │
│                                                                 │
│ Su planta está perdiendo                                        │
│ capacidad operativa.                                            │
│ Y probablemente no lo sabe.                                     │
│                                                                 │
│ Tres puntos ciegos que ningún proveedor tradicional             │
│ está resolviendo en LATAM.                                      │
│                                                                 │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐                        │
│ │  PROB 1  │  │  PROB 2  │  │  PROB 3  │                        │
│ │ +28°C    │  │ 4.7x     │  │ 47%      │                        │
│ │ calor    │  │ fallos   │  │ energía  │                        │
│ │ residual │  │/año      │  │ desperd. │                        │
│ └──────────┘  └──────────┘  └──────────┘                        │
└─────────────────────────────────────────────────────────────────┘
```

**Cada card-problema tiene:**
- Número micro `// 01` mono 11px en la esquina superior izquierda.
- **Un solo número dominante** en `Mono Display 56px` weight 700 con sufijo de unidad (`°C`, `x`, `%`).
- Título corto 2-3 palabras en `Display M` (Outfit 600, 28px).
- UNA línea de contexto (Inter 14px, `--fg-secondary`).
- Sin icono decorativo. Sin "Ver más". Solo un hairline inferior con un label mono de "impacto medido".

**Animación:** Al entrar en viewport, el número cuenta de 0 a su valor final en 1.2s con easing `cubic-bezier(0.16, 1, 0.3, 1)`.

---

### 3.4 SECCIÓN 03 — "CÓMO TRABAJAMOS" (reemplaza Solución)

**Concepto:** Un proceso, no 5 features. Mostrar el **ciclo de vida de un proyecto** como una línea de tiempo vertical interactiva estilo Stripe Sessions.

**Estructura:**

```
01 ─── 02 ─── 03 ─── 04 ─── 05 ─── 06 ─── 07
│     │     │     │     │     │     │
↓     ↓     ↓     ↓     ↓     ↓     ↓
Telemetría   CFD    Diseño  Fab.  Inst.  Monit.
in-situ      3D     a       CNC   cert.  24/7
             sim.   medida
```

- **7 pasos** (no 5) con duración explícita en mono a la derecha.
- Steps en círculos de 48px con hairline border y número mono centrado.
- Conector: 1px hairline vertical o horizontal según viewport.
- Cada step tiene:
  - Label corto (2 palabras).
  - Duración estimada en mono (`5-7 días`).
  - Hover: círculo se ilumina con accent, label se expande mostrando 1-2 deliverables.
- Click en step → abre un **panel lateral derecho (Sheet)** con la explicación completa de la fase. Eso es el "drill-down" tipo Linear.

---

### 3.5 SECCIÓN 04 — "PRODUCTOS" (reemplaza Catálogo)

**Concepto:** Una consola de selección, no una tienda.

**Estructura:**

```
┌─────────────────────────────────────────────────────────────────┐
│ // 04 — EQUIPOS                                                │
│                                                                 │
│ 7 familias. 64 modelos.                                         │
│ 1 plataforma de selección.                                     │
│                                                                 │
│ [Chips: AXIAL | CENTRÍFUGO | INYECTOR | CICLÓN | DAMPER | ...] │
│                                                                 │
│ ┌──────┬──────┬──────┐                                          │
│ │ Prod │ Prod │ Prod │   ← Card compacta con:                  │
│ │  01  │  02  │  03  │     - número de serie grande             │
│ └──────┴──────┴──────┘     - nombre técnico                     │
│                            - 3 specs (CFM / ΔP / HP)           │
│ ┌──────┬──────┬──────┐     - botón "▷" (abre drawer)          │
│ │ Prod │ Prod │ Prod │                                          │
│ │  04  │  05  │  06  │                                          │
│ └──────┴──────┴──────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

**Product Card compacta (revolucionaria vs. actual):**

```
┌──────────────────────────┐
│ AX-HD-48    // SERIE 03 │  ← Mono 10px
│                          │
│ Extractor axial          │  ← Display M
│ industrial 48"           │
│                          │
│ 45,000 CFM               │  ← Mono Display 24px
│ 8.0 in w.g.              │  ← Mono data 12px
│ 75 HP · 1,775 RPM        │  ← Mono data 12px
│                          │
│ ──────────────────────── │
│ ▷ Configurar →           │  ← Mono 11px con flecha
└──────────────────────────┘
```

- Aspect ratio: `5/4` (no 4/3, más denso).
- Sin imagen de producto en la card. Solo en el drawer de detalle. Esto es radical: las cards parecen **fichas técnicas de Siemens**, no productos de Amazon.
- Background: `--bg-elevated-2` con hairline border.
- Hover: border `var(--accent)`, sombra `0 8px 24px rgba(0,0,0,0.4)`, y el `▷` se desplaza 4px a la derecha.

**Drawer de producto (nuevo, reemplaza la actual navegación a ficha):**
- Sheet lateral derecho, ancho 50% desktop.
- 3 secciones en tabs:
  1. **Curva** — SVG vectorial real de la curva CFM vs Presión del modelo, ejes con labels mono, hover muestra el punto de operación.
  2. **Specs** — Tabla de 2 columnas, label mono 11px, valor mono data 13px. Sin descripciones largas.
  3. **Documentos** — Links a PDF técnico, STEP CAD, manual. Cada link con peso de archivo en mono.

---

### 3.6 SECCIÓN 05 — "SECTORES" (reemplaza Industrial Cards)

**Concepto:** 6 sectores, no como cards, sino como un **grid de 6 con un sector destacado en grande** (estilo bento de Apple).

**Estructura:**

```
┌────────────────────────┬──────────┐
│                        │ MINERÍA  │
│      siderurgia        │          │
│      (destacado)       ├──────────┤
│      60% width         │ DATA CTR │
│      imagen real       │          │
│                        ├──────────┤
│                        │ ALIMENTOS│
│                        │          │
├──────────┬─────────────┴──────────┤
│ MANUF.   │    QUÍMICA             │
│          │                        │
└──────────┴────────────────────────┘
```

- **Un sector "featured"** ocupa 2x2 del bento, con imagen real, título grande, 1 métrica destacada, 1 CTA.
- **5 sectores secundarios** ocupan 1x1 cada uno, con label y 1 micro-stat.
- Sin íconos decorativos. Sin descripciones largas. Solo sector + 1 stat + (opcional) imagen.
- Hover sobre sector secundario: reveal de la métrica principal con animación slide-up.
- Click → Sheet lateral con detalle del sector (aplicaciones, normativas, proyectos destacados).

---

### 3.7 SECCIÓN 06 — "SERVICIOS" (reemplaza bloques alternantes)

**Concepto:** Una grilla de 6 servicios, pero con un **timeline horizontal** que muestra en qué fase del proyecto se entrega cada servicio.

**Estructura:**

```
[CONSULTA]  [CFD]  [BALANCEO]  [DISEÑO]  [INSTAL.]  [AUDITORÍA]
    ●────────●───────●──────────●─────────●──────────●
    día 0    día 3   día 7      día 12    día 30     día 60
```

- Eje horizontal = tiempo del proyecto (0 a 60 días).
- 6 nodos (servicios) posicionados en su día típico.
- Hover sobre nodo: card elevada con descripción + 1 entregable.
- Línea de tiempo con marcas de día en mono 10px color `--fg-muted`.
- Debajo: grilla 2x3 con los 6 servicios como cards técnicas (mismo formato que product cards: número + nombre + 1 stat + 1 entregable).

---

### 3.8 SECCIÓN 07 — "RESULTADOS" (reemplaza Casos de Éxito)

**Concepto:** Un solo caso destacado con la **curva de impacto animada** (antes/después), no 4 casos pequeños.

**Estructura:**

```
┌─────────────────────────────────────────────────────────────────┐
│ // 07 — RESULTADOS                                             │
│                                                                 │
│ Planta Paz del Río · Siderurgia                                 │
│ Antes y después, medido en sitio.                               │
│                                                                 │
│ ┌─────────────────────────┐  ┌──────────────────────────────┐  │
│ │   [imagen real          │  │  ANTES    ────►    DESPUÉS   │  │
│ │    dividida con slider  │  │  +47°C           25°C         │  │
│ │    vertical]            │  │  18 ACH         42 ACH        │  │
│ │                         │  │  $2.4M/año      $0.8M/año    │  │
│ └─────────────────────────┘  └──────────────────────────────┘  │
│                                                                 │
│ Ver 12 estudios de caso más →                                   │
└─────────────────────────────────────────────────────────────────┘
```

- **Comparador antes/después interactivo** con slider draggable vertical u horizontal. Estilo clásico pero hecho con precisión técnica: la imagen cambia, los números también, y se muestra un delta animado.
- **3 KPIs** lado a lado, cada uno con su delta: `+47°C → 25°C` (con flecha verde), `18 ACH → 42 ACH`, `$2.4M → $0.8M`.
- Sin testimonios textuales. Sin logos grises de clientes. Solo un caso destacado, hecho con maestría.
- Abajo: link a los otros 12 estudios como una **lista mono 13px** con numeración (estilo Linear changelog).

---

### 3.9 SECCIÓN 08 — "CALCULADORA DE INGENIERÍA" (reemplaza calculadora actual)

**Concepto:** Una **terminal de cálculo**, no un formulario.

**Estructura:**

```
┌─────────────────────────────────────────────────────────────────┐
│ // 08 — CÁLCULO EN VIVO                                        │
│                                                                 │
│ ┌─ INPUTS ──────────────┐  ┌─ OUTPUT ──────────────────────┐    │
│ │                       │  │                                │    │
│ │ Largo     [50.0] m    │  │   CAUDAL REQUERIDO             │    │
│ │ Ancho     [30.0] m    │  │                                │    │
│ │ Altura    [ 8.0] m    │  │      42,500                    │    │
│ │                       │  │      CFM                       │    │
│ │ Actividad             │  │                                │    │
│ │ [Soldadura ▾]         │  │   ──────────                   │    │
│ │                       │  │                                │    │
│ │ Altitud   [2640] msnm │  │   Renovaciones/h: 12           │    │
│ │                       │  │   Equipo: AX-HD-48 x2          │    │
│ │ [▷ Calcular]          │  │   Potencia total: 150 HP       │    │
│ │                       │  │                                │    │
│ └───────────────────────┘  │   [→ Cotizar] [↓ PDF]          │    │
│                            └────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

- **Inputs** en mono data, labels en mono 11px uppercase.
- **Outputs** en un panel elevado con sombra fuerte.
- El número **42,500** cuenta de 0 a su valor cuando se ejecuta el cálculo (60fps, requestAnimationFrame).
- Bajo el número, una **curva mini SVG** muestra el punto de operación del equipo recomendado.
- Botón `Cotizar` abre el wizard pre-llenado con los valores de la calculadora.
- Botón `↓ PDF` genera un PDF técnico en cliente con jsPDF (lazy import), manteniendo estética dark premium.

---

### 3.10 SECCIÓN 09 — "CTA FINAL" (reemplaza el actual)

**Concepto:** Una sola pantalla, casi vacía, con un mensaje ejecutivo.

**Estructura:**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│              312 plantas nos han confiado                       │
│              la operación que no puede parar.                    │
│                                                                 │
│              [→ Iniciar configuración]                          │
│                                                                 │
│              o llámenos: +57 (1) 234 5678                       │
│                                                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

- Fondo: `--bg-base` con un único `radial-gradient` desde el centro (15% del viewport) con `accent-glow` al 6%.
- Titular Outfit 700, 56-72px, centrado, 2 líneas máximo.
- CTA primario: sólido, blanco, ancho fijo 280px, centrado. Hover: leve scale 1.02 + glow.
- Teléfono: mono 14px color `--fg-secondary`, con hairline a la izquierda.
- Sin badges de "sin compromiso", "ISO 9001", "24h respuesta". Esas son distracciones.
- Altura: **60vh** solamente. Generoso en espacio. Premium = vacío bien usado.

---

### 3.11 SECCIÓN 10 — "FOOTER" (reemplaza FooterSection)

**Concepto:** Footer estilo terminal, no catálogo de links.

**Estructura:**

```
┌─────────────────────────────────────────────────────────────────┐
│ AEROMAX INDUSTRIAL                          // QUICK ACCESS     │
│ Ingeniería de ventilación    ·  Inicio                          │
│ industrial desde 2009.       ·  Productos                       │
│                              ·  Servicios                       │
│ Cra. 7 #71-21, Torre B       ·  Casos                           │
│ Bogotá, Colombia             ·  Contacto                        │
│                              ·  Portal cliente                  │
│ +57 (1) 234 5678                                               │
│ hola@aeromax.com                                               │
│                                                                 │
│ ──────────────────────────────────────────────                  │
│                                                                 │
│ © 2026 · NIT 900.123.456-7 · Todos los derechos reservados    │
│ Términos · Privacidad · Cookies · Compliance RETIE             │
│                                                                 │
│ // SYSTEM STATUS: OPERATIONAL · v2.4.1 · LAT 24ms              │
└─────────────────────────────────────────────────────────────────┘
```

- 3 columnas (no 5): Brand + Direccionamiento + Quick Access.
- **Status bar inferior** estilo Linear/Vercel: versión del sitio, latencia simulada, "operational" en verde.
- Sin íconos de redes sociales inflados. Solo texto mono 11px al final.
- Background: `--bg-base`, hairline top `var(--border-subtle)`.

---

## 4. SISTEMA DE COMPONENTES PREMIUM

### 4.1 Botones (nueva especificación)

| Tipo | Padding | Font | Background | Border | Shadow | Active |
|---|---|---|---|---|---|---|
| **Primary** | `12px 20px` | Inter 14px medium | `var(--fg-primary)` | 0 | `0 1px 0 rgba(255,255,255,0.1) inset, 0 8px 24px rgba(0,0,0,0.4)` | scale 0.98 |
| **Accent** | `12px 20px` | Inter 14px medium | `var(--accent)` | 0 | `0 0 0 1px rgba(255,255,255,0.1) inset, 0 0 24px var(--accent-glow)` | scale 0.98 |
| **Ghost** | `12px 20px` | Inter 14px medium | transparent | `1px solid var(--border-subtle)` | 0 | bg `var(--bg-elevated-2)` |
| **Mono** | `10px 16px` | Mono 12px medium | transparent | `1px solid var(--border-strong)` | 0 | bg `var(--bg-elevated-2)` |

**Reglas nuevas:**
- Todos los botones tienen **flecha derecha** `→` después del label, animada con `translate-x 4px` en hover (200ms ease-out).
- Ningún botón `rounded-full`. Todos `rounded-md` (6px) o `rounded-lg` (8px). Más ejecutivo.
- Altura mínima: 40px (primary), 36px (ghost/mono), 32px (small).

### 4.2 Cards

| Variante | Padding | Background | Border | Shadow base | Shadow hover |
|---|---|---|---|---|---|
| **Flat** | 24px | `var(--bg-elevated-1)` | `1px solid var(--border-subtle)` | none | `0 0 0 1px var(--border-strong)` |
| **Elevated** | 24px | `var(--bg-elevated-2)` | `1px solid var(--border-subtle)` | `0 1px 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.3)` | shadow + `0 0 0 1px var(--accent)` |
| **Glass** | 24px | `rgba(13,17,23,0.6)` + `backdrop-filter: blur(20px)` | `1px solid rgba(255,255,255,0.08)` | none | idem Elevated |

### 4.3 Drawer / Sheet (reemplaza modales en todos lados)

- Lado derecho, ancho 50% desktop / 100% mobile.
- Background: `--bg-elevated-1`.
- Border-left: `1px solid var(--border-strong)`.
- Animación: slide-in 350ms `cubic-bezier(0.16, 1, 0.3, 1)`.
- Header: sticky, con título, badge de estado, botón cerrar.
- Contenido: scroll interno, padding 32px.
- Footer: sticky, con acciones primaria/secundaria.

### 4.4 Modales (solo para Command Palette y Login)

- Centrado, ancho máximo 640px.
- Background: `--bg-elevated-2` con `backdrop-filter: blur(40px)`.
- Border: `1px solid var(--border-strong)`.
- Animación: scale 0.96 → 1 + opacity 0 → 1, 200ms.

### 4.5 Inputs (reemplaza estilo actual)

- Altura: 40px.
- Background: `var(--bg-base)`.
- Border: `1px solid var(--border-subtle)`, focus `var(--accent)` + glow.
- Label: mono 11px uppercase, color `--fg-muted`, encima del input.
- Tipografía del valor: Inter 14px, valores numéricos en mono data.
- Sin íconos decorativos. Solo el `→` al final cuando el input dispara una acción.

---

## 5. SISTEMA DE MOVIMIENTO

### 5.1 Reglas absolutas

1. **Duración máxima de micro-interacción: 200ms.**
2. **Curva preferida: `cubic-bezier(0.16, 1, 0.3, 1)`** (suave al final, sin rebote).
3. **Easing secundario: `cubic-bezier(0.4, 0, 0.2, 1)`** (transiciones de estado).
4. **Sin rebotes. Sin oscilaciones. Sin escalado >1.02.**
5. **Stagger de entrada: 60-100ms entre elementos** (no 200ms, demasiado lento).
6. **Transición de página: fade + translateY 8px, 250ms.**

### 5.2 Animaciones por componente

| Componente | Evento | Duración | Easing | Efecto |
|---|---|---|---|---|
| Botón primary | hover | 150ms | ease-out | bg fade a accent-glow overlay |
| Botón arrow | hover | 200ms | custom | translateX 0 → 4px |
| Card elevated | hover | 250ms | custom | border + shadow upgrade |
| Drawer | open | 350ms | custom | translateX 100% → 0 |
| Drawer | close | 250ms | ease-in | translateX 0 → 100% |
| Modal | open | 200ms | custom | scale 0.96 → 1 + opacity |
| Input | focus | 200ms | ease-out | border + glow |
| Counter | animate | 1200ms | custom | 0 → value (requestAnimationFrame) |
| Section reveal | in-view | 600ms | custom | opacity 0 → 1 + translateY 16px → 0 |

### 5.3 Lo que se PROHÍBE
- `animate-bounce` (salvo el indicador de "live" en el HUD del Hero, que es un pulse de opacidad).
- `animate-ping`.
- Cualquier `transition-duration-500` o superior.
- `scale-105` o superior en cards.
- `rotate-` o efectos 3D en hover.

---

## 6. TIPOGRAFÍA Y JERARQUÍA

### 6.1 Regla de los 3 niveles
Cada viewport solo debe tener:
- **1** titular en Display XL (Hero) o Display L (sección destacada).
- **2-3** titulares en Display M (subsecciones).
- **El resto** debe ser Body, Caption o Mono.

### 6.2 Lo que se PROHÍBE
- Párrafos mayores a 4 líneas (Inter 16px / 24-26px line-height). Si pasa, dividir.
- Todo en uppercase. Solo labels mono y eyebrows van en uppercase.
- Bold + italic simultáneo.
- Tamaños inferiores a 12px en cualquier texto visible (accesibilidad).
- Tamaños superiores a 80px fuera del Hero.

---

## 7. ARTE, GRÁFICOS E ICONOGRAFÍA

### 7.1 Iconografía
- **Sistema: Lucide React** (autorizado en design system).
- Stroke width: 1.5 (no 2, más elegante).
- Tamaño estándar: 16px (UI), 20px (énfasis), 24px (hero icons).
- Color: `--fg-secondary` por default, `--fg-primary` en hover, `--accent` en estado activo.
- **PROHIBIDO** iconos decorativos sin función. Cada ícono tiene una acción.

### 7.2 SVG vectoriales
- **Curvas de ventilador**: vectoriales, ejes con labels mono, grid hairline, color de la curva `var(--accent)`, área bajo la curva con `accent-glow` al 8%.
- **Planos esquemáticos**: líneas hairline 0.5px, sin relleno, con cotas en mono 10px.
- **HUD de telemetría**: 1px stroke, sin sombra, fondo transparente, labels mono.
- **Componentes decorativos**: líneas de horizonte, grilla con mask radial, dots animados. **Nunca ilustraciones planas tipo "vector graphic".**

### 7.3 Fotografía
- **Sin fotos stock.** Si se usan fotos, deben ser de operaciones reales de AeroMax (plantas, fabricaciones, instalaciones).
- Todas las fotos pasan por: `filter: contrast(1.05) saturate(0.85) brightness(0.95)`.
- Overlay: gradiente inferior 40% negro con `linear-gradient(180deg, transparent 0%, var(--bg-base) 100%)`.
- **PROHIBIDO** fotos de stock de tipo "factory workers smiling".

### 7.4 Paleta en uso por elemento
| Elemento | Color de fondo | Color de texto | Color de acento |
|---|---|---|---|
| Hero | `--bg-base` | `--fg-primary` | `--accent` (palabra "aire") |
| Secciones de contenido | `--bg-base` / `--bg-elevated-1` alternando | `--fg-primary` / `--fg-secondary` | `--accent` |
| Cards | `--bg-elevated-2` | `--fg-primary` | `--accent` (hover border) |
| Botones primary | `--fg-primary` | `--bg-base` | — |
| Botones accent | `--accent` | `--fg-primary` | — |
| Code/data | — | `--fg-muted` mono | — |

---

## 8. RESPONSIVE Y BREAKPOINTS

| Breakpoint | Comportamiento |
|---|---|
| `< 640px` | Layouts stacked. Hero display baja a 48px. Bento de sectores pasa a 1 columna. Drawer pasa a full-screen. |
| `640-1024px` | 2 columnas en cards de producto y servicios. Drawers a 80%. |
| `1024-1440px` | Layout completo. Bento de 6 en grid 3x2 con 1 destacado. |
| `> 1440px` | Max-width 1320px con padding generoso. Sin "estirar" cards. |

**Reglas:**
- Mobile NO muestra el HUD del Hero (reemplazado por un contador estático).
- Mobile NO muestra la calculadora en paralelo; la apila vertical.
- Mobile SÍ mantiene todas las animaciones de entrada.

---

## 9. CHECKLIST DE APROBACIÓN FINAL

Antes de considerar terminado el rediseño, **cada** elemento debe pasar:

- [ ] **Test de los 5 segundos**: ¿Un director de planta de Siemens entiende que AeroMax es ingeniería de clase mundial?
- [ ] **Test de densidad**: ¿Hay suficiente información técnica sin sentirse abrumador?
- [ ] **Test de oscuridad**: ¿Es dark-mode-first sin perder legibilidad?
- [ ] **Test de cursor**: ¿Todos los elementos interactivos tienen `cursor-pointer` y un feedback visual claro?
- [ ] **Test de números**: ¿Cada cifra tiene unidad y contexto? (No "98% satisfacción" sin explicar cómo se midió).
- [ ] **Test de tipografía**: ¿Solo hay 1 Display XL por viewport?
- [ ] **Test de movimiento**: ¿Ninguna animación dura más de 600ms (excepto contadores)?
- [ ] **Test de íconos**: ¿Cada ícono tiene una función, ninguno es decorativo?
- [ ] **Test de cards**: ¿Cada card se entiende en menos de 3 segundos?
- [ ] **Test de white-label**: ¿Cambiando `--accent` y el logo, la web sigue viéndose premium?
- [ ] **Test de rendimiento**: LCP < 2.5s en 4G. Videos con `preload="metadata"`. SVG inline, no imágenes.
- [ ] **Test de accesibilidad**: WCAG 2.1 AA. Contraste mínimo 4.5:1 en texto. Foco visible en todos los elementos interactivos.

---

## 10. ORDEN DE IMPLEMENTACIÓN SUGERIDO

Si esta propuesta se aprueba, sugiero ejecutar en este orden (Fase 2):

1. **Nuevo sistema de tokens CSS** (paleta dark, tipografía, motion).
2. **Top bar + Command Palette** (estructura global).
3. **Hero reinventado** con HUD en vivo.
4. **Ticker de competencias**.
5. **Sección de problemas con contadores animados**.
6. **Timeline de proceso con drawers por step**.
7. **Catálogo de productos con cards técnicas (sin imágenes) + drawer de detalle**.
8. **Bento de sectores**.
9. **Timeline de servicios**.
10. **Caso destacado con comparador antes/después**.
11. **Calculadora-terminal**.
12. **CTA minimalista**.
13. **Footer terminal**.
14. **QA + tests de los 12 puntos del checklist**.

Cada paso se entrega con: (a) captura de pantalla, (b) snippet de código, (c) test responsive, (d) test de accesibilidad.

---

## 11. LO QUE NO ESTÁ EN ESTA PROPUESTA

Para claridad:
- Esta propuesta **NO** incluye el Wizard, el Catálogo técnico navegable completo, ni el Portal Cliente. Esos son módulos independientes.
- Esta propuesta **NO** modifica componentes del ERP ni del Portal.
- Esta propuesta **NO** cambia la arquitectura técnica (Next.js 15, Tailwind v4, Radix, shadcn, Framer Motion, Lucide).
- Esta propuesta **SÍ** reemplaza completamente los siguientes archivos:
  - `src/app/page.tsx` (composición).
  - `src/components/CatalogView.tsx` (orquestador de secciones).
  - Los 9 archivos en `src/components/marketing/*` (cada sección se replantea).

---

**FIN DEL DOCUMENTO**

*Este documento espera aprobación del usuario antes de iniciar la Fase 2 de implementación.*
