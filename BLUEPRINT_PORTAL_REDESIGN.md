# BLUEPRINT — REDISEÑO PORTAL CLIENTE (AeroMax)

> **Estado:** Borrador para aprobación.
> **Alcance:** Rediseño completo del Portal Cliente. Cubre shell, sistema visual, tono de voz, módulo Overview + los 6 módulos (Órdenes, Proyectos, Cotizaciones, Facturas, Documentos, Soporte), patrones transversales y criterios de aceptación.
> **Complementa:** `BLUEPRINT_ERP_REDESIGN.md` (el portal y el ERP comparten el sistema de tokens pero tienen gramáticas y tonos diferenciados).
> **Política:** No se implementa nada hasta la aprobación explícita de este documento.

---

## 0. Manifiesto

El Portal Cliente actual fue construido como "el ERP con menos funciones y un sidebar blanco". Esa decisión lo condena: el cliente entra y siente que está en una versión de segunda clase del sistema de los operadores.

Este rediseño parte de una tesis opuesta:

> **El Portal Cliente no es un panel con menos poder. Es una experiencia de marca donde el cliente entra a sentirse tomado en serio.**

El cliente de AeroMax no es un usuario técnico. Es un gerente de planta, un director de operaciones, un comprador de una empresa industrial. Tiene un presupuesto de 30 segundos de atención. Abre el portal entre dos reuniones, desde el celular, para responder una sola pregunta: **"¿en qué estado está lo mío?"**.

Cinco valores rigen cada decisión:

| Valor | Significado operativo |
|---|---|
| **Confianza** | La información es exacta, fechada, atribuida. Nunca "actualizado recientemente". Siempre "actualizado hace 14 minutos por Carlos". |
| **Ingeniería** | La interfaz comunica dominio técnico. Tipografía mono para datos, terminología precisa, diagramas cuando corresponde. Sin pop-science visual. |
| **Estatus** | El estado de cada ítem es legible en <1 segundo. Color, icono, etiqueta, posición. Sin ambigüedad. |
| **Seguimiento** | Cada entidad con tiempo tiene una línea de tiempo visible. El cliente puede rastrear su trabajo como rastrea un envío. |
| **Transparencia** | El cliente ve TODO lo relevante: precios, plazos, quién hace qué, documentos firmados, pagos, disputas. Nada oculto detrás de un "contáctanos". |

Las referencias no son ERPs ni paneles administrativos. Son productos donde el cliente se siente **tratado como alguien importante**:

- **Stripe Customer Portal** — claridad financiera, recibos impecables, pagos sin fricción.
- **Notion** — bloque como unidad, sidebar workspace, jerarquía por peso.
- **Vercel** — estatus ambiental, real-time, "tu deploy está vivo".
- **Apple** — restraint tipográfico, espacios enormes, el producto es el héroe.

---

## 1. Modelo de Audiencia

| Dimensión | Realidad | Implicación de diseño |
|---|---|---|
| **Frecuencia** | 2–6 veces al mes, no diario. | La primera visita debe **reorientar**, no asumir memoria. Onboarding contextual cada vez que vuelve con cambios. |
| **Dispositivo** | ~60% móvil, ~40% desktop. | Mobile-first extremo. Bottom nav en móvil, top nav en desktop. |
| **Motivación** | Resolver 1 pregunta concreta, rápido. | Overview = dashboard de "lo que necesita tu atención hoy". No un panel de métricas. |
| **Contexto** | Entre dos reuniones, con prisa. | Lenguaje escaneable, números grandes, CTAs únicos, cero pasos innecesarios. |
| **Conocimiento técnico** | Bajo a medio. No sabe qué es un "OT" ni un "SKU". | Lenguaje natural: "Tu instalación", "Tu cotización", "Tu factura", nunca jerga interna. |
| **Idioma** | Español neutro por default, multilenguaje ready. | Todo el copy en español, sin anglicismos ("pipeline", "deploy"). Donde el término inglés es la norma ("PDF", "WhatsApp"), se conserva. |
| **Relación con la marca** | Quiere confiar, no quiere que le vendan más. | Cero upsell. Cero "tip". Cero sugerencia no solicitada. |

### 1.1 Identidad del cliente dentro del portal

- **Nombre** real, sin abreviaturas. "Carlos Pérez", no "c.perez".
- **Empresa** y rol visibles, no como dato secundario sino como afirmación ("Carlos · Director de Operaciones en AeroMax").
- **Avatar** real (no iniciales sobre fondo gris) — el cliente debe ver que es un espacio personal.
- **Saludo personalizado** en cada visita. No "Hola usuario", sino "Hola, Carlos".

---

## 2. Sistema Visual del Portal (diferenciado del ERP)

El portal **comparte el sistema de tokens base** con el ERP (color, tipografía, espaciado, motion) pero **diverge en su aplicación** para producir una sensación editorial, no operativa.

### 2.1 Modo: claro permanente, con opción dark

- **Default:** tema claro (`bg.canvas = #FAFAF9`, warm-neutral, no `bg-white` puro).
- **Opción dark** disponible en el selector (toggle en Mi Cuenta), con `bg.canvas = #0A0A0A` warm-neutral.
- **Nunca** se fuerza dark al cliente. La elección es personal y persistente.

### 2.2 Color

- **Acento:** color del tenant (mismo `--accent` que el ERP). Aplicado con la misma parsimonia: 1 botón primario por pantalla, links, foco.
- **Neutrales:** escala zinc o stone warm. **Nunca** `slate` frío (los azules-grises transmiten "oficina gubernamental", no "marca premium").
- **Estados:** los mismos del ERP, pero con fondos al 6–8% (no 10–12%) para mayor sutileza.
- **Diferenciación con el ERP:** el portal usa **fondos con tinte warm** (stone-50, amber-50 muy suave), el ERP usa **fondos neutros puros** (zinc, slate). Esto crea una sensación distinta sin cambiar la paleta.

### 2.3 Tipografía

- **Sans:** Inter Variable (default) o la fuente display del tenant si está configurada (e.g. Söhne, GT America, Instrument Serif para titulares editoriales).
- **Mono:** JetBrains Mono Variable.
- **Escala (portal):** más amplia que el ERP — `12 / 14 / 15 / 16 / 18 / 20 / 24 / 30 / 36 / 48 / 64 / 80`.
- **Hero number (outstanding, totales):** `64–80px`, mono, semibold. Una cifra por pantalla, dominante.
- **Titulares de sección:** `30–36px`, semibold, tracking `-0.02em`.
- **Cuerpo:** `16–18px`, regular, line-height `1.6` (más que el ERP, porque el portal se lee como editorial).
- **Mono en datos:** montos, IDs, fechas, SKUs, números de factura, plazos.

### 2.4 Espaciado (más generoso que el ERP)

- **Padding de página:** `px-6 py-10` móvil, `px-12 py-16` desktop.
- **Padding de tarjeta:** `p-8` default, `p-10` destacadas.
- **Gap entre secciones:** `gap-12` a `gap-16` (el ERP usa `gap-6` a `gap-8`).
- **Max-width contenido:** `max-w-4xl` (768px) para narrativa, `max-w-6xl` (1152px) para listas y dashboards. **Nunca** `max-w-7xl` — el portal no se siente "ancho".

### 2.5 Profundidad (más suave que el ERP)

```
shadow-portal-1 (tarjeta en página):
  0 1px 0 0 rgb(0 0 0 / 0.02),
  0 1px 2px -1px rgb(0 0 0 / 0.04),
  0 2px 8px -2px rgb(0 0 0 / 0.04)

shadow-portal-2 (popover / dropdown):
  0 1px 0 0 rgb(0 0 0 / 0.03),
  0 4px 8px -2px rgb(0 0 0 / 0.06),
  0 12px 24px -8px rgb(0 0 0 / 0.06)

shadow-portal-3 (modal):
  0 1px 0 0 rgb(0 0 0 / 0.04),
  0 8px 16px -4px rgb(0 0 0 / 0.10),
  0 24px 48px -12px rgb(0 0 0 / 0.12)
```

Más `ring-1 ring-black/[0.03]` en cada nivel. **Más sutil que el ERP** — el portal no necesita profundidad alta porque su valor está en la lectura, no en la jerarquía visual densa.

### 2.6 Motion (más calmado que el ERP)

| Token | Duración | Easing |
|---|---|---|
| `motion.portal.instant` | 80ms | `cubic-bezier(0.2, 0, 0, 1)` |
| `motion.portal.fast` | 160ms | mismo |
| `motion.portal.base` | 240ms | mismo |
| `motion.portal.slow` | 360ms | mismo |

**Reglas adicionales:**
- **Page transitions:** fade + `translateY 8px`, 320ms. Más lento que el ERP. El cliente debe sentir que "llegó" a una pantalla.
- **List item enter:** stagger 40ms, fade + `translateY 4px`. Sensación de cascade editorial.
- **Hover en cards:** cambio de border + sombra, 200ms. Sin translate.
- **Reduced motion:** todas las transiciones se reducen a `opacity` o se anulan.

### 2.7 Iconografía

**Prohibido:** Heroicons como default. **Prohibido:** emojis (🏠 📦 💼) en cualquier contexto.

**Sistema de iconos del portal:**

- **Opción primaria recomendada:** **Phosphor Icons** (`@phosphor-icons/react`). Tres pesos disponibles: thin, regular, bold. Permite la misma familia en pesos distintos (thin para decorativos, regular para UI, bold para énfasis). Mejor estética que Heroicons para una experiencia premium.
- **Opción secundaria:** **Lucide** con tratamiento custom (stroke-width 1.25 en lugar de 2 — más refinado).
- **Opción premium:** iconografía custom SVG por el equipo de diseño para los iconos críticos (logo, empty states, ilustraciones de módulos). Mantener Phosphor/Lucide para iconos utilitarios.

**Estilo:**
- Stroke 1.5 en iconos utilitarios.
- Tamaño estándar 18px en UI, 20px en listas, 24px en empty states.
- Color: heredar de `text.secondary` por default, `text.primary` en hover, `accent` en estados activos.
- **Sin fill sólido** salvo en iconos de estado (check, x) que sí van en bold.

### 2.8 Ilustraciones

- **Estilo:** line-art técnico, estilo VENTITECH adaptado (curvas vectoriales suaves, paleta de 2–3 colores como máximo, sin relleno plano).
- **Uso:** solo en empty states, onboarding y pantallas de éxito. **Nunca** decorativas.
- **Formato:** SVG, animables con Framer Motion (entrada con `pathLength` de 0 a 1, 600ms).

---

## 3. Shell del Portal

El shell es completamente distinto al del ERP. Mientras el ERP es un "workspace de herramientas", el portal es un "espacio personal" — más como una app de banca privada que como un panel.

### 3.1 Estructura desktop

```
┌──────────────────────────────────────────────────────────────────────┐
│ AEROMAX  │  Resumen  Proyectos  Cotizaciones  Facturas  Docs  Soporte│
│ Portal   │                                                            │
│ Cliente  │                                              🔔  ⓘ  ⌘K  ⓜ │  ← Top Nav (64px, sticky, blur)
├──────────┴────────────────────────────────────────────────────────────┤
│                                                                      │
│                                                                      │
│   CONTENT (max-w-4xl o max-w-6xl, px-12 py-16)                       │
│                                                                      │
│                                                                      │
│                                                                      │
│                                                                      │
│                                                                      │
│   Hola, Carlos.                                                      │  ← Saludo (36–48px)
│   Hoy es martes 28 de mayo.                                          │
│                                                                      │
│   ──────────────────────────────────────                              │
│                                                                      │
│   ...contenido del módulo...                                         │
│                                                                      │
│                                                                      │
│                                                                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
   top nav 64px
```

- **Top nav (64px, sticky, `bg.canvas/80 backdrop-blur`):**
  - **Izquierda:** logo del tenant (24–32px de alto) + separador `|` mono + label "Portal Cliente" en `text.secondary` 14px.
  - **Centro:** navegación principal horizontal. Items: `Resumen · Proyectos · Cotizaciones · Facturas · Documentos · Soporte`. Items activos con underline animado de 2px `accent` (entrada 200ms). Hover: `text.primary` con transition 120ms.
  - **Derecha:** búsqueda `⌘K` (icono + chip `⌘K`/`Ctrl K` OS-aware, mismo patrón del ERP), notificaciones, ayuda (`?`), avatar (con dropdown a Mi Cuenta / Notificaciones / Cerrar sesión).
- **Sin sidebar.** El sidebar del ERP es la decisión más "panel administrativo" del portal actual. Se elimina.
- **Sin header de página redundante.** El saludo y la fecha contextualizan la pantalla. El título del módulo se inserta en el contenido.

### 3.2 Estructura mobile (bottom nav)

```
┌────────────────────────────┐
│  AEROMAX Portal      🔔 ⓜ  │  ← Top bar móvil (56px, sticky)
├────────────────────────────┤
│                            │
│  CONTENT (px-6 py-8)       │
│                            │
│  Hola, Carlos.             │
│  ...contenido...           │
│                            │
│                            │
├────────────────────────────┤
│ ⌂ Resumen  ▣ Proyectos  ⌕  │  ← Bottom nav (64px, safe-area)
│ ▦ Cotizac.  ▤ Facturas  ⓜ  │
└────────────────────────────┘
```

- **Top bar móvil (56px):** logo + acciones compactas.
- **Bottom nav (64px + safe-area):** 5–6 íconos + label corto. Activo: ícono + label `accent`, dot arriba del ícono. Inactivo: `text.secondary`.
- **Sin drawers laterales** en móvil. Toda la navegación es bottom nav + command bar.

### 3.3 Command bar en el portal

**Diferencias con el ERP:**
- Solo **busca** dentro del espacio del cliente (no acciones de "Crear cotización", porque el cliente no crea cotizaciones).
- Las "acciones" del command bar del cliente son: **Ir a [módulo]**, **Pagar factura #XXXX**, **Descargar documento**, **Contactar a [persona]**.
- Etiquetas en lenguaje natural, no en jerga.

```
┌────────────────────────────────────────────────────────────┐
│  ⌕  Buscar proyectos, facturas, documentos…               │
├────────────────────────────────────────────────────────────┤
│  PROYECTOS                                                 │
│  ▦  Instalación de ventilación · Zona Norte   Activo      │
│  ▦  Mantenimiento trimestral Q2              En curso     │
│                                                            │
│  FACTURAS                                                  │
│  ▦  FAC-2026-0421  $12,400  Vencida · May 14   ⌘↩ Pagar   │
│                                                            │
│  DOCUMENTOS                                                │
│  ▦  Contrato marco 2026.pdf            Firmado · 2.1 MB   │
│                                                            │
│  IR A                                                      │
│  → Resumen                                                 │
│  → Mis proyectos                                           │
│  → Contactar a tu ejecutivo                               │
└────────────────────────────────────────────────────────────┘
  ↑↓ Navegar   ⌘↩ Abrir   esc Cerrar
```

### 3.4 Onboarding contextual del cliente

- **Primera visita:** tour de 2 pantallas, skippable:
  1. *"Este es tu Portal. Acá encontrás el estado de todo lo que estamos haciendo para tu empresa."* — resalta la top nav.
  2. *"Buscá con ⌘K (o Ctrl K) o usá el buscador arriba. Funciona con y sin teclado."*
- **Visita de retorno con cambios:** badge discreto en el item de nav correspondiente (e.g. punto `accent` junto a "Facturas" si hay una factura nueva) + indicación en el Overview.
- **Onboarding específico por módulo** (lightweight): la primera vez que el cliente entra a un módulo, un solo dot pulsante sobre el elemento más importante de esa vista, con tooltip corto. No tour completo, solo una pista.

---

## 4. Tono de Voz y Microcopy

El portal no habla como un sistema. Habla como el **equipo de AeroMax** le hablaría al cliente en una llamada.

| Situación | NO | SÍ |
|---|---|---|
| Saludo | "Bienvenido" | "Hola, Carlos." |
| Estado de proyecto | "PROYECTO_ACTIVO" | "En curso. Próxima visita: martes 9am." |
| Factura vencida | "FACTURA_VENCIDA" | "Vencida hace 2 días. ¿Necesitás ayuda para pagar?" |
| Sin órdenes | "No hay registros" | "Todavía no tenés órdenes con nosotros. Cuando hagas tu primera, aparecerá acá." |
| Error | "Error 500" | "Algo falló. Ya lo estamos revisando." |
| Soporte | "Abrir ticket" | "Escribinos. Te respondemos hoy." |
| Documento firmado | "DOCUMENTO_FIRMADO" | "Firmado el 14 de mayo. Listo para descargar." |
| Persona responsable | "Asignado a usuario ID 47" | "Tu ejecutivo: Ana Rodríguez. Contactar." |
| Carga | "Loading..." | (skeleton, sin texto) |
| Confirmación de pago | "PAGO_PROCESADO" | "Listo. Tu pago de $12,400 se aplicó a FAC-0421." |

**Reglas:**
- **Vos** en lugar de "tú" paraArgentina/Latam neutro. Si el tenant configura otro registro, se respeta.
- **Sin anglicismos:** "pipeline" → "flujo", "deploy" → "publicado", "onboarding" → "primera vez", "tracking" → "seguimiento".
- **Una pregunta = una acción.** Nunca dos CTAs compitiendo.
- **Confirmaciones siempre con monto y referencia.** "Listo" sin contexto no vale.

---

## 5. Patrones Transversales

Patrones que se usan en múltiples módulos del portal.

### 5.1 Cards de módulo (estilo editorial, no admin)

**NO** son tarjetas de "card padding 6, shadow-md, border rounded-xl". Son **bloques editoriales** con jerarquía tipográfica fuerte.

```
┌────────────────────────────────────────────────────────────┐
│                                                             │
│  Instalación de ventilación industrial                      │  ← Título (20–24px, semibold)
│  Zona Norte · Cotización COT-0091                           │  ← Subtítulo (14px, secondary)
│                                                             │
│  ●  En curso · próxima visita: martes 9am                   │  ← Status line (14px)
│                                                             │
│  ─────────────────────────────────────────                  │
│                                                             │
│  Avance del proyecto                                        │
│  ████████████████░░░░  72%                                  │  ← Barra de progreso grande
│  Etapa 4 de 6 · Instalación mecánica                        │  ← Etapa actual
│                                                             │
│  ─────────────────────────────────────────                  │
│                                                             │
│  Carlos Pérez, tu ejecutivo de proyecto                     │  ← Persona con avatar
│  [Contactar por WhatsApp]   [Ver más]                       │  ← Acciones
│                                                             │
└────────────────────────────────────────────────────────────┘
   bg.surface · border.subtle · radius-lg · shadow-portal-1
   ring-1 ring-black/[0.03]
   padding: p-8 desktop, p-6 mobile
```

- **Sin "elevación decorativa".** Las cards tienen sombra y ring, pero no "flotan" agresivamente.
- **Estructura:** título + meta + status + divisor + contenido + acciones. **Siempre** en este orden.
- **Hover:** border se oscurece, sombra aumenta. Sin scale ni translate.
- **Click:** abre el detalle del módulo (no modal — vista dedicada).

### 5.2 Timelines (seguimiento = corazón del portal)

Cada entidad con tiempo (proyecto, orden, garantía) tiene una **línea de tiempo** visible. Es el patrón más importante del portal.

```
●─────●─────●─────◉─────○─────○─────○
Recibido  Cotización  Aprobado  En curso   Entrega  Garantía
 May 12   May 14      May 20    May 28 ─►  Jun 15   Jun 16
                                       ▲
                              Estás acá
```

- **Línea horizontal** (`h-1 bg.subtle`) con dots en cada hito.
- **Hitos pasados:** dot `bg.success` (10px) con label arriba y fecha abajo.
- **Hito actual:** dot `bg.accent` (12px) con anillo pulsante (1.5s ease-in-out), label arriba en `text.primary` semibold, fecha en mono. Indicador "Estás acá" debajo.
- **Hitos futuros:** dot `bg.subtle` con border `border.strong` (10px), label en `text.muted`, fecha en mono muted.
- **Vertical en mobile** (mismo patrón, rotado).

### 5.3 Receipts (facturas, cotizaciones, pagos)

Inspirado en recibos de Apple, Stripe y apps de banking. **Cada factura es un documento** que merece ser leído como tal.

```
┌──────────────────────────────────────────────────────────┐
│                                                           │
│            AEROMAX INDUSTRIAL                             │  ← Logo (centrado)
│            NIT 900.123.456-7                              │
│                                                           │
│            ─────────────────────                         │
│                                                           │
│                       Factura                             │
│                  FAC-2026-0421                            │  ← Mono, 30px
│                                                           │
│            ─────────────────────                         │
│                                                           │
│  Emitida          1 de mayo de 2026                       │
│  Vence            14 de mayo de 2026                      │
│  Estado           ●  Pagada                               │
│                                                           │
│  ────────────────────────────────────                    │
│                                                           │
│  1  Ventilador axial 450mm                $ 1,200.00     │
│  5  Motor trifásico 5HP                   $ 4,250.00     │
│  2  Transformador 220V                    $ 2,800.00     │
│                                                           │
│  ────────────────────────────────────                    │
│                                                           │
│  Subtotal                                $ 8,250.00     │
│  IVA (19%)                                $ 1,567.50     │
│                                                           │
│  Total                                   $ 9,817.50     │  ← Mono, 24px, semibold
│                                                           │
│  Pagado el 14 de mayo vía Wompi          $ 9,817.50     │
│                                                           │
│  ────────────────────────────────────                    │
│                                                           │
│              [Descargar PDF]   [Imprimir]                │
│                                                           │
└──────────────────────────────────────────────────────────┘
   max-w 480px · bg.surface · radius-lg · border.subtle
   padding p-12 · tipografía centrada
```

- **No** es un PDF estático embebido. Es un componente React que renderiza el mismo contenido con la gramática visual del portal.
- **Mono** para todos los números y fechas.
- **Centrado** en la pantalla, con el detalle comercial alrededor (cliente, ejecutivo, botón de pago si está pendiente).

### 5.4 Activity Feed (qué está pasando con lo mío)

Cada módulo tiene un feed cronológico inverso de eventos relevantes para el cliente.

```
●  Hoy  10:42     Carlos (tu ejecutivo) actualizó el cronograma
                  "Visita reprogramada para el martes 9am."
●  Ayer  16:08    Ana adjuntó el acta de la visita técnica
                  📄  Acta_visita_14may.pdf · 320 KB
●  Hace 3 días    Se emitió la factura FAC-2026-0421
                  Por $12,400. Vence el 14 de mayo.
●  Hace 5 días    Proyecto "Instalación ventilación" pasó a
                  la etapa "Instalación mecánica"
```

- **Un item por línea**, con dot de tipo (estado, comunicación, archivo, pago).
- **Timestamp** en mono muted (`12px`).
- **Actor** con nombre real + rol ("Carlos · tu ejecutivo").
- **Adjuntos** inline (icono + nombre + tamaño).
- **Filtros** arriba: "Mostrar: Todo · Comunicaciones · Pagos · Documentos · Cambios de estado".
- **Sin infinite scroll agresivo:** muestra los últimos 20 con botón "Ver historial completo" abajo.

### 5.5 Estados de pago (visualización de deuda)

Una sola pieza visual que muestra el estado financiero del cliente en el Overview.

```
                    Pendiente de pago
                ┌─────────────────────┐
                │                     │
                │    $ 9,817.50       │  ← Hero mono 64px
                │                     │
                │    FAC-2026-0421    │  ← Mono 14px muted
                │    Vence en 3 días  │
                │                     │
                └─────────────────────┘
                    [Pagar ahora]
```

- **Sin pagar:** fondo `state.warning.bg` con borde `state.warning.border`, acento visual pero no agresivo.
- **Pagado:** fondo neutro con badge `Pagado` `state.success`.
- **Vencido:** fondo `state.danger.bg` con borde `state.danger.border`, mensaje "Vencida hace X días".
- **CTA único:** "Pagar ahora" (con modal de pago) o "Descargar recibo" según el estado.

### 5.6 Foto + persona (equipo de AeroMax)

Cuando se muestra un miembro del equipo, **siempre con foto real**, nombre completo, rol, y un CTA de contacto. Nunca un avatar genérico.

```
┌─────────────────────────────────────────┐
│  ┌────┐                                 │
│  │ 📷 │  Ana Rodríguez                  │
│  └────┘  Ejecutiva de cuenta            │
│          ana.r@aeromax.co · +57 311 ... │
│          [WhatsApp]  [Email]  [Llamar]  │
└─────────────────────────────────────────┘
```

- **Foto:** `64px` redonda, `border 1px ring-black/5`. Sin fallback a iniciales en gris: si no hay foto, una ilustración de silueta con el color del tenant.
- **Acciones de contacto:** WhatsApp, email, llamar. Teléfonos clickeables en móvil (deep-link).
- **Nunca** "Contactar a soporte" genérico. Siempre la persona con su canal.

### 5.7 Empty states editoriales

No son "No hay datos" tristes. Son invitaciones a entender el módulo.

- **Mis Órdenes vacío:** ilustración de un plano técnico desenrollándose, headline "Todavía no tenés órdenes con nosotros", sub "Cuando hagas tu primera, vas a poder seguirla paso a paso acá.", sin CTA.
- **Mis Cotizaciones vacío:** ilustración de un sobre, headline "Aún no recibimos una cotización tuya", sub "Cuando te enviemos una, la vas a encontrar acá con toda la información para decidir."
- **Mis Facturas vacío:** ilustración de un recibo, headline "Sin facturas por ahora", sub "Cuando emitamos la primera, aparecerá acá."
- **Mis Documentos vacío:** ilustración de una carpeta, headline "Tu bóveda está vacía", sub "Acá vas a encontrar contratos, certificados, planos y más."
- **Mi Soporte vacío:** ilustración de una conversación, headline "Sin tickets abiertos", sub "Si necesitás algo, escribinos. Te respondemos hoy."

**Reglas de empty states:**
- **Sin botón de acción** (no hay nada que el cliente pueda hacer para "llenar" el módulo).
- **Sin icono en caja gris.** Ilustración real, editorial, con movimiento sutil al entrar (pathLength animation).
- **Sub-headline en lenguaje del cliente**, no en jerga.

### 5.8 Estado de error diseñado

- **Red:** banner superior sutil con dot ámbar + "Sin conexión. Cuando vuelvas, todo lo que hagas se va a guardar."
- **Error de carga:** dentro de la sección afectada (no pantalla completa), con ilustración pequeña + headline "No pudimos cargar esto" + "Reintentar".
- **Error 500:** pantalla completa con ilustración técnica, headline "Algo se rompió de nuestro lado", sub "Ya estamos revisando. Intentá de nuevo en unos minutos, o escribinos.", botones "Reintentar" y "Contactar".

---

## 6. Módulo 0 — Resumen (Overview / Home)

### 6.1 Concepto

**No** es un dashboard con 4 KPI cards. Es el **momento de aterrizaje** del cliente. Una pantalla editorial que responde: "¿qué necesito mirar hoy?".

### 6.2 Layout desktop

```
┌──────────────────────────────────────────────────────────────────────┐
│ Top Nav                                                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   Hola, Carlos.                                                      │  ← 48px serif/semibold
│   Hoy es martes 28 de mayo. Tu semana se ve así:                    │  ← 18px secondary
│                                                                      │
│   ─────────────────────────────────────────────────────              │
│                                                                      │
│                                                                      │
│   ⚠  1 FACTURA POR VENCER                                            │  ← Alerta (si aplica)
│   FAC-2026-0421 · $9,817.50 · Vence en 3 días                        │
│   [Pagar ahora]                                                      │
│                                                                      │
│   ─────────────────────────────────────────────────────              │
│                                                                      │
│                                                                      │
│   TUS PROYECTOS                                                      │  ← Header sección
│                                                                      │
│   ┌────────────────────────────────────────────────────────┐        │
│   │ Instalación de ventilación industrial                  │        │
│   │ Zona Norte · Cotización COT-0091                       │        │
│   │                                                         │        │
│   │ ●  En curso · próxima visita martes 9am                │        │
│   │                                                         │        │
│   │ Avance  ████████████████░░░░  72%                       │        │
│   │ Etapa 4 de 6 · Instalación mecánica                    │        │
│   │                                                         │        │
│   │ Carlos Pérez, tu ejecutivo    [Contactar]  [Ver más]    │        │
│   └────────────────────────────────────────────────────────┘        │
│                                                                      │
│   ┌────────────────────────────────────────────────────────┐        │
│   │ Mantenimiento trimestral Q2                            │        │
│   │ ...                                                     │        │
│   └────────────────────────────────────────────────────────┘        │
│                                                                      │
│   ─────────────────────────────────────────────────────              │
│                                                                      │
│                                                                      │
│   ACTIVIDAD RECIENTE                                                │
│                                                                      │
│   ●  Hoy 10:42  Carlos actualizó el cronograma                      │
│   ●  Ayer        Ana adjuntó el acta de visita                       │
│   ●  Hace 3d     Se emitió la factura FAC-2026-0421                  │
│   ●  Hace 5d     Proyecto pasó a "Instalación mecánica"              │
│   …                                                                  │
│   [Ver toda la actividad]                                            │
│                                                                      │
│   ─────────────────────────────────────────────────────              │
│                                                                      │
│   ¿NECESITÁS ALGO?                                                   │
│                                                                      │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│   │ ✉ Escribinos │  │ 📞 Llamanos │  │ 📄 Pedí docs │              │
│   │ Te respondemos│  │ Lun-Vie 8-18 │  │ Te las mandamos│            │
│   │   hoy        │  │              │  │  por email     │            │
│   └──────────────┘  └──────────────┘  └──────────────┘              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### 6.3 Componentes específicos

- **Saludo + contexto:** "Hola, Carlos." en 48px semibold (Inter o serif del tenant). Debajo, fecha y un comentario contextual ("Tu semana se ve así", "Todo al día por ahora", "Tenés 1 factura por vencer").
- **Alerta prioritaria** (solo si aplica): una sola caja destacada al tope con la factura próxima a vencer o la acción que requiere el cliente. Sin caja si no hay nada urgente.
- **Tus proyectos:** máximo 2–3 proyectos en cards editoriales (ver §5.1). Si hay más, muestra los 2 más activos + link "Ver todos los proyectos".
- **Actividad reciente:** feed cronológico (ver §5.4) con los últimos 5 eventos del cliente en todos los módulos. Link a "Ver toda la actividad" abajo.
- **¿Necesitás algo?:** 3 CTAs grandes, editoriales, sin jerga. "Escribinos / Llamanos / Pedí documentos". Cada uno abre el canal correspondiente (WhatsApp deep-link, tel:, mailto: o un sheet).

### 6.4 Lo que **NO** tiene el Resumen

- ❌ 4 KPI cards con "Total facturado / Total pendiente / # proyectos / # documentos".
- ❌ Gráficos de barras con "Tu actividad este mes".
- ❌ Tabla "Últimas 5 facturas" repetida del módulo de Facturas.
- ❌ "Tips" o "Te puede interesar".

---

## 7. Módulo 1 — Mis Órdenes

### 7.1 Concepto

Una orden (de trabajo, de servicio, de compra) que el cliente quiere **rastrear**. El patrón mental del cliente es "paquete en camino": dónde está, cuándo llega, qué incluye, quién la entrega.

### 7.2 Layout — Lista de órdenes

```
┌──────────────────────────────────────────────────────────────────────┐
│  TUS ÓRDENES                                  [Todas ▾] [Activas ▾] │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ ●  ORD-2026-0142                                            │     │
│  │ Instalación eléctrica · Sede Norte                          │     │
│  │ ●  Programada · visita 2 de junio, 9am                       │     │
│  │ Carlos Pérez (técnico) · +57 311 ...                         │     │
│  │ [Confirmar visita]   [Reprogramar]                           │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ ●  ORD-2026-0138                                            │     │
│  │ Mantenimiento preventivo trimestral                         │     │
│  │ ●  En ejecución · inicio hoy 8:00                            │     │
│  │ Ana Ramírez (técnico)                                       │     │
│  │ [Ver en vivo]   [Contactar]                                 │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ ●  ORD-2026-0129                                            │     │
│  │ Entrega de equipos                                          │     │
│  │ ●  Entregada · 14 de mayo, 16:30                            │     │
│  │ [Ver acta de entrega]   [Descargar]                         │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

- **Cards editoriales** (no filas de tabla), una por orden.
- **Status pill** + descripción en lenguaje natural ("Programada · visita 2 de junio, 9am", no "ESTADO_PROGRAMADA").
- **Técnico responsable** con foto, nombre, y un canal de contacto.
- **CTAs contextuales al estado:**
  - Programada: "Confirmar visita" / "Reprogramar".
  - En ejecución: "Ver en vivo" (si hay tracking) / "Contactar".
  - Entregada: "Ver acta de entrega" / "Descargar".

### 7.3 Detalle de orden

```
┌──────────────────────────────────────────────────────────────────────┐
│  ◀  Tus órdenes                                                     │
│                                                                      │
│  ORD-2026-0142                                                       │  ← Mono 14px muted
│  Instalación eléctrica                                               │  ← 30px semibold
│  Sede Norte · Cotización COT-0091                                    │  ← Secondary
│                                                                      │
│  ●  Programada                                                       │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  SEGUIMIENTO                                                         │
│                                                                      │
│  ●─────●─────●─────◉─────○─────○                                    │
│  Creada  Asignada  Aprobada  Programada  En curso  Cerrada          │
│  May 12  May 14    May 20    May 28 ─►  Jun 2    Jun 5              │
│                                  ▲                                    │
│                            Estás acá                                 │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  FECHA Y EQUIPO                                                      │
│  Visita programada  Martes 2 de junio, 9:00 – 12:00                  │
│  Técnico asignado   Carlos Pérez · Electricista senior                │
│  Duración estimada  3 horas                                           │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  DIRECCIÓN                                                           │
│  📍  Calle 100 #15-20, Bogotá                                        │
│  [Cómo llegar] (abre Google Maps / Waze)                             │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  QUÉ SE VA A HACER                                                  │
│  • Instalación de tablero de distribución nuevo                      │
│  • Cambio de 12 breakers                                             │
│  • Pruebas de carga y certificación                                  │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  ADJUNTOS                                                            │
│  📄  Plano_eléctrico_sede_norte.pdf            2.1 MB   [↓]          │
│  📄  Cotización_COT-0091.pdf                  1.8 MB   [↓]          │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  ACTIVIDAD                                                           │
│  ●  Hoy 10:42  Carlos confirmó disponibilidad para el martes         │
│  ●  Ayer       Ana reprogramó la visita a pedido tuyo                │
│  ●  May 20     Se aprobó la cotización COT-0091                      │
│  ●  May 14     Se asignó técnico Carlos Pérez                        │
│  ●  May 12     Se creó la orden                                     │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  ¿CAMBIOS DE ÚLTIMA HORA?                                           │
│  [Reprogramar visita]  [Contactar a Carlos]  [Reportar un problema] │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

- **Timeline** prominente (ver §5.2) con los hitos de la orden.
- **Fecha y equipo:** bloque con toda la información logística. **Sin jerga**: "Visita programada", no "fecha de ejecución".
- **Dirección** con link a "Cómo llegar" (deep-link a Google Maps / Waze en móvil, abre web en desktop).
- **Qué se va a hacer:** lista de bullets, lenguaje claro, sin terminología interna.
- **Adjuntos** con download.
- **Actividad** cronológica (ver §5.4).
- **¿Cambios de última hora?** 3 CTAs de escape si algo no anda bien.

### 7.4 Lo que NUNCA tiene Mis Órdenes

- ❌ Tabla con 8 columnas (ID, fecha, estado, items, monto, técnico, acciones).
- ❌ "Pendiente / En proceso / Cerrada" como pestañas con borde inferior.
- ❌ Botón "Exportar a Excel".
- ❌ Modal "Ver detalles".

---

## 8. Módulo 2 — Mis Proyectos

### 8.1 Concepto

Un proyecto es un **trabajo de varios pasos** que se está haciendo para el cliente. La pregunta del cliente: "¿en qué van?". La interfaz debe responder en 3 segundos.

### 8.2 Layout — Lista de proyectos

```
┌──────────────────────────────────────────────────────────────────────┐
│  TUS PROYECTOS                                                       │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Instalación de ventilación industrial                       │     │
│  │ ●  En curso                                                  │     │
│  │ Inicio 14 de abril · Entrega estimada 15 de junio            │     │
│  │                                                              │     │
│  │ Avance   ████████████████░░░░  72%                           │     │
│  │ Etapa 4 de 6 · Instalación mecánica                          │     │
│  │                                                              │     │
│  │ Carlos Pérez, tu ejecutivo        [Contactar]  [Ver más]    │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Mantenimiento trimestral Q2                                 │     │
│  │ ●  En curso                                                  │     │
│  │ ...                                                          │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Diseño nueva planta de producción                           │     │
│  │ ●  Esperando tu decisión                                     │     │
│  │ Cotización COT-0095 recibida el 12 de mayo                   │     │
│  │ [Ver cotización]   [Hablar con tu ejecutivo]                │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Certificación RETIE 2026                                    │     │
│  │ ●  Cerrado · 20 de marzo                                     │     │
│  │ [Ver cierre]   [Descargar acta]                              │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

- **Cards editoriales**, una por proyecto, ordenadas por estado (En curso primero, después Esperando tu decisión, después Cerrado).
- **Status de "Esperando tu decisión"** destacada con borde `state.warning` y CTA directa.
- **Status "Cerrado"** con el archivo del cierre accesible.

### 8.3 Detalle de proyecto

```
┌──────────────────────────────────────────────────────────────────────┐
│  ◀  Tus proyectos                                                   │
│                                                                      │
│  Instalación de ventilación industrial                               │  ← 36px semibold
│  Cotización COT-0091 · Inicio 14 de abril                            │  ← Secondary
│                                                                      │
│  ●  En curso · entrega estimada 15 de junio                          │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  AVANCE                                                              │
│                                                                      │
│  ●─────●─────●─────◉─────○─────○                                    │
│  Diseño  Compras  Logística  Instalación  Pruebas  Entrega           │
│  ✓       ✓        ✓          En curso     —        —                 │
│  Apr 14  Apr 28   May 12     May 28 ─►    Jun 10   Jun 15            │
│                                ▲                                        │
│                          Estás acá                                    │
│                                                                      │
│  72% completado · 18 días restantes                                   │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  PRÓXIMA VISITA                                                      │
│  Martes 2 de junio, 9:00 – 12:00                                     │
│  Carlos Pérez, Electricista senior                                    │
│  [Confirmar]  [Reprogramar]  [Contactar]                             │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  ENTREGABLES                                                         │
│  ✓  Diseño aprobado                                  Apr 20          │
│  ✓  Equipos comprados                                May 5           │
│  ✓  Equipos en bodega AeroMax                        May 12          │
│  ◉  Instalación mecánica (en curso)                  May 28 – Jun 5  │
│  ○  Pruebas y certificación                         Jun 10          │
│  ○  Entrega final y capacitación                     Jun 15          │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  TU EQUIPO DE PROYECTO                                               │
│  Carlos Pérez  Ejecutivo       [WhatsApp]  [Email]  [Llamar]        │
│  Ana Ramírez   Coordinadora    [WhatsApp]  [Email]                  │
│  Miguel Soto   Técnico senior  [WhatsApp]                            │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  DOCUMENTOS DEL PROYECTO                                             │
│  📄  Cotización firmada.pdf                1.8 MB   [↓]            │
│  📄  Plano ventilación v2.pdf              2.1 MB   [↓]            │
│  📄  Acta visita técnica May 14.pdf         320 KB   [↓]            │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  ACTIVIDAD                                                           │
│  ●  Hoy 10:42  Carlos confirmó visita del martes                     │
│  ●  Ayer       Ana subió el acta de la visita                        │
│  ●  May 26     Miguel subió foto del avance de obra                  │
│  📷  foto_obra_26may.jpg                                              │
│  ●  May 20     Se aprobó el diseño v2                                │
│  …                                                                  │
│  [Ver toda la actividad]                                             │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  ¿ALGO NO MARCHA BIEN?                                              │
│  [Reportar un problema]  [Hablar con tu ejecutivo]                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

- **Timeline principal** del proyecto con las 6 etapas (Diseño → Compras → Logística → Instalación → Pruebas → Entrega). Etapa actual destacada.
- **Próxima visita** destacada si hay una agendada, con CTAs claros.
- **Entregables** como lista con check (✓), en-curso (◉), y pendiente (○). Es la **columna vertebral** del proyecto.
- **Tu equipo de proyecto:** todas las personas con foto, nombre, rol, canales de contacto.
- **Documentos** con download.
- **Actividad** cronológica con fotos adjuntas inline.
- **¿Algo no marcha bien?** 2 CTAs de escape al pie.

### 8.4 Lo que NUNCA tiene Mis Proyectos

- ❌ "Estado: ACTIVO / PAUSADO / CANCELADO" como status genérico.
- ❌ Gantt chart complejo. El timeline es lineal y editorial, no una grilla de 30 filas.
- ❌ Tabla de "tareas" estilo Excel.
- ❌ Botón "Editar proyecto".

---

## 9. Módulo 3 — Mis Cotizaciones

### 9.1 Concepto

Una cotización es una **propuesta**. El cliente debe poder **leerla, entenderla, decidir** (aceptar, pedir cambios, rechazar) sin llamar. La interfaz debe sentirse como abrir un PDF bien diseñado, pero en la pantalla, con acciones vivas.

### 9.2 Layout — Lista

```
┌──────────────────────────────────────────────────────────────────────┐
│  TUS COTIZACIONES                                                    │
│                                                                      │
│  [Pendientes 2]  [Aceptadas 5]  [Vigentes 3]  [Vencidas 1]          │
│                                                                      │
│  ●  COTIZACIÓN              PROYECTO             MONTO    RECIBIDA   │
│  ─────────────────────────────────────────────────────────────────  │
│  ◉  COT-2026-0095          Diseño nueva planta  $28,400  May 12     │
│     Pendiente de tu decisión                                       │
│     Vence 26 de mayo · respondé antes                               │
│     [Ver]   [Aceptar]   [Pedir cambios]                             │
│                                                                      │
│  ◉  COT-2026-0091          Instalación ventil.  $18,300  May 1      │
│     ●  Aceptada · firmada May 8                                     │
│     [Ver]   [Descargar firmada]                                    │
│                                                                      │
│  ◉  COT-2026-0084          ...                                     │
│     ...                                                             │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

- **Tabs como pills** con contadores (mismo patrón que el ERP, pero más espaciado).
- **Fila destacada** para cotizaciones pendientes de decisión: estado `state.warning`, fondo sutil, CTAs de decisión visibles.
- **Cotizaciones aceptadas/firmadas** con badge `state.success` y link a la versión firmada.

### 9.3 Detalle de cotización (vista editorial)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ◀  Tus cotizaciones                                                │
│                                                                      │
│              COTIZACIÓN                                              │  ← Centrado, eyebrow
│              COT-2026-0095                                           │  ← Mono 36px
│                                                                      │
│         Diseño nueva planta de producción                           │  ← 24px semibold
│         Para AeroMax Industrial · Bogotá                            │  ← Secondary
│                                                                      │
│         ──────────────────────────────                              │
│                                                                      │
│              Recibida          12 de mayo de 2026                   │
│              Válida hasta      26 de mayo de 2026                   │
│              Estado            ●  Pendiente de tu decisión          │
│                                                                      │
│         ──────────────────────────────                              │
│                                                                      │
│  QUÉ INCLUYE                                                        │
│  • Diseño de planos eléctricos y mecánicos                          │
│  • Especificación de equipos (marca, modelo, capacidad)             │
│  • Cronograma de implementación (8 semanas)                          │
│  • Capacitación al personal de operación (8 horas)                  │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  INVERSIÓN                                                           │
│                                                                      │
│  Diseño de planos                            $ 8,000.00             │
│  Especificación técnica                      $ 4,200.00             │
│  Supervisión de obra (8 semanas)             $12,000.00             │
│  Capacitación                                $ 2,800.00             │
│                                                                  │
│  Subtotal                                    $27,000.00             │
│  IVA (19%)                                    $ 5,130.00             │
│                                                                  │
│  Total                                       $32,130.00             │  ← Mono 30px
│                                                                  │
│  Válida por 14 días desde la emisión                               │
│                                                                  │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  CONDICIONES DE PAGO                                                 │
│  • 50% contra aprobación de diseño                                  │
│  • 30% contra entrega de planos finales                              │
│  • 20% contra capacitación                                           │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  VERSIONES DE ESTA COTIZACIÓN                                        │
│  v1 · 12 de mayo · pendiente de decisión    $32,130                  │
│  [Ver v1]                                                           │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  PREGUNTAS O COMENTARIOS                                             │
│                                                                      │
│  [Escribí tu pregunta o pedido de cambio]                           │
│  [Enviar a tu ejecutivo]                                            │
│                                                                      │
│  ──────────────────────────────────────────────────────                              │
│                                                                      │
│  ¿QUÉ QUERÉS HACER?                                                 │
│                                                                      │
│  [✓ Aceptar cotización]   [↻ Pedir cambios]   [✕ Rechazar]          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

- **Estilo "document"** centrado, máx 720px, tipografía editorial. El cliente lo lee como si fuera un PDF pero interactivo.
- **Mono** para todos los números, fechas, e IDs.
- **"Qué incluye"** en bullets, lenguaje claro, sin jerga.
- **Inversión** desglosada con subtotal/IVA/total destacado.
- **Condiciones de pago** explícitas, no escondidas.
- **Versiones** si las hay (v1, v2, v3) con link a la versión archivada.
- **Hilo de comentarios** para preguntas o pedidos de cambio, sin salir del contexto.
- **3 CTAs únicas** al pie, claras, con íconos.

### 9.4 Flujo de aceptación

- Click en "Aceptar" → modal centrado de confirmación: *"¿Aceptás la cotización COT-2026-0095 por $32,130? Te vamos a generar la factura inicial (50%) y avisarte cuando arranquemos."* + 2 botones: "Cancelar" / "Sí, aceptar".
- Al confirmar: toast persistente "Listo. Cotización aceptada. Recibirás la factura inicial en las próximas horas." + estado de la cotización cambia a `Aceptada` con badge `state.success`.

### 9.5 Lo que NUNCA tiene Mis Cotizaciones

- ❌ Tabla plana de cotizaciones con 7 columnas.
- ❌ PDF embebido estático sin interactividad.
- ❌ Botón "Descargar PDF" como única acción (es CTA secundario, no primario).
- ❌ Aceptar cotización navegando a otra pantalla.

---

## 10. Módulo 4 — Mis Facturas

### 10.1 Concepto

Una factura es un **documento financiero**. Debe verse como tal: limpio, preciso, sin ambigüedad. El cliente debe poder pagarla en 2 clicks.

### 10.2 Layout — Lista

```
┌──────────────────────────────────────────────────────────────────────┐
│  TUS FACTURAS                                                        │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ PENDIENTE DE PAGO                                            │     │
│  │                                                              │     │
│  │  $ 9,817.50  USD                                             │     │
│  │                                                              │     │
│  │  1 factura · vence en 3 días                                 │     │
│  │                                                              │     │
│  │  [Pagar ahora]                                               │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  HISTORIAL                                                           │
│                                                                      │
│  ●  Factura          Emisión    Vence      Monto      Estado        │
│  ─────────────────────────────────────────────────────────────────  │
│  ◉  FAC-2026-0421   May 1      May 14    $ 9,817.50  ● Pendiente   │
│     [Ver]   [Pagar]   [Descargar]                                    │
│                                                                      │
│  ◉  FAC-2026-0418   Abr 18     May 3     $ 4,200.00  ● Pagada      │
│     [Ver]   [Descargar recibo]                                       │
│                                                                      │
│  ◉  FAC-2026-0402   Mar 12     Mar 26    $12,400.00  ● Pagada      │
│     ...                                                              │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

- **Hero de deuda** (Outstanding): si hay facturas pendientes, una caja destacada al tope con el monto total y CTA de pago. Si no hay deuda, esa caja no aparece (no "Estás al día" — silencio editorial).
- **Historial:** lista editorial con status pill, fechas en mono, monto en mono.
- **CTAs contextuales:**
  - Pendiente: "Ver" / "Pagar" / "Descargar".
  - Pagada: "Ver" / "Descargar recibo".
  - Vencida: "Ver" / "Pagar ahora" (con urgency styling).

### 10.3 Detalle de factura — estilo receipt (ver §5.3)

Render editorial del mismo formato que en el módulo, con todo el desglose visible.

### 10.4 Flujo de pago

- Click en "Pagar" o "Pagar ahora" → abre **modal de pago** (no redirige):
  - **Método de pago:** tarjeta guardada (con últimos 4 dígitos) o nueva.
  - **Resumen:** monto a pagar, número de factura, fecha de vencimiento.
  - **Botón único:** "Pagar $9,817.50" (primary, accent).
- Integración con pasarela del tenant (Wompi / Stripe / otra configurada).
- Al confirmar: toast persistente "Listo. Pagaste $9,817.50 de FAC-2026-0421. Te enviamos el recibo por email." + estado de la factura cambia a `Pagada` con badge `state.success`.
- **Sin popups externos.** Todo el flujo de pago vive dentro del portal.

### 10.5 Lo que NUNCA tiene Mis Facturas

- ❌ Tabla con 8 columnas (ID, fecha, monto, IVA, estado, vencimiento, método, acciones).
- ❌ "Descargar PDF" como única acción.
- ❌ Link a pasarela externa (MercadoPago, Wompi, etc.) — el pago vive dentro del portal.
- ❌ Mostrar el saldo pendiente como número pequeño en una KPI card gris.

---

## 11. Módulo 5 — Mis Documentos

### 11.1 Concepto

Una bóveda personal donde el cliente encuentra **todo lo firmado, certificado, entregado, o compartido**. La pregunta del cliente: "¿dónde está el contrato que firmé en marzo?".

### 11.2 Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  TUS DOCUMENTOS                                                      │
│                                                                      │
│  [Todos 24]  [Contratos 6]  [Certificados 8]  [Técnicos 7]  [Otros 3]│
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ 📄  Contrato marco de servicios 2026.pdf           2.1 MB  │     │
│  │     Contrato · Firmado el 14 de marzo de 2026             │     │
│  │     [Ver]   [Descargar]                                    │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ 📄  Cotización COT-2026-0091 firmada.pdf         1.8 MB   │     │
│  │     Cotización · Firmada el 8 de mayo de 2026              │     │
│  │     [Ver]   [Descargar]                                    │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ 📦  Certificado RETIE sede norte.pdf              1.2 MB   │     │
│  │     Certificado · Vence el 20 de marzo de 2027            │     │
│  │     [Ver]   [Descargar]                                    │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ 📐  Plano ventilación sede norte v2.pdf          3.4 MB   │     │
│  │     Plano técnico · Versión actual                          │     │
│  │     [Ver]   [Descargar]                                    │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  ¿NECESITÁS UN DOCUMENTO QUE NO ESTÁ ACÁ?                           │
│  [Pedir por email]  [Escribir a tu ejecutivo]                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

- **Tabs como pills** con contadores por tipo.
- **Cards editoriales** por documento: icono (dependiendo del tipo), nombre, tipo, fecha, tamaño, acciones.
- **Certificados con vencimiento** muestran la fecha de expiración. Si vence en <60 días, badge `state.warning`. Si vencido, badge `state.danger`.
- **CTA de escape al pie** por si falta un documento.

### 11.3 Vista de documento individual

- **PDFs:** preview embebido in-browser (`<iframe>` o react-pdf), con botón "Descargar" y "Imprimir" flotantes.
- **Imágenes:** preview con lightbox.
- **No** se descargan automáticamente. El cliente decide.

### 11.4 Versiones

- Si un documento tiene versiones (e.g. plano v1, v2, v3), la card muestra "v3 (actual)" y un selector de versiones con las anteriores.

### 11.5 Lo que NUNCA tiene Mis Documentos

- ❌ Tabla con 6 columnas (nombre, tipo, fecha, tamaño, subido por, acciones).
- ❌ Iconos de "papel" emoji-style genéricos.
- ❌ Botón "Subir documento" (el cliente no sube documentos en este portal — los recibe).
- ❌ Carpetas anidadas estilo Explorer.

---

## 12. Módulo 6 — Mi Soporte

### 12.1 Concepto

El cliente necesita **contactar a alguien y obtener respuesta**. El portal debe ofrecer múltiples canales (escrito, llamada, WhatsApp) con la misma calidad de atención.

### 12.2 Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  TU SOPORTE                                                         │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Hola, Carlos. ¿En qué te ayudamos?                         │     │
│  │                                                              │     │
│  │  [✉ Escribinos]   [📞 Llamanos]   [💬 WhatsApp]            │     │
│  │   Te respondemos    Lun-Vie 8-18      +57 311 ...           │     │
│  │     hoy                                                │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  TUS CONVERSACIONES                                                 │
│                                                                      │
│  ●  #TKT-2026-0089   "Ruido en el tablero de la sede"               │
│     ●  Esperando tu respuesta · abierto hace 2 días                  │
│     Última respuesta: Carlos Pérez (técnico) · hace 1 día           │
│     [Abrir conversación]                                             │
│                                                                      │
│  ●  #TKT-2026-0072   "Reprogramar visita del martes"                │
│     ●  Resuelto · cerrado el 12 de mayo                              │
│     [Ver conversación]                                              │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  PREGUNTAS FRECUENTES                                                │
│                                                                      │
│  ▸  ¿Cómo puedo pagar una factura?                                  │
│  ▸  ¿Cómo reprogramo una visita?                                    │
│  ▸  ¿Dónde está el certificado RETIE?                               │
│  ▸  ¿Cómo acepto una cotización?                                    │
│  ▸  ¿Puedo hablar con mi ejecutivo?                                 │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  ¿NO ENCONTRÁS LO QUE BUSCÁS?                                       │
│  [Escribir a soporte]   [Llamar]   [Ver base de conocimiento]       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

- **Hero de contacto** con 3 canales: email, llamada, WhatsApp. Cada uno con su info de contacto (email real, tel: link, deep-link a WhatsApp).
- **Conversaciones** (tickets) con estado y última respuesta.
- **FAQ** acordeón.
- **CTA de escape** al pie.

### 12.3 Vista de conversación

```
┌──────────────────────────────────────────────────────────────────────┐
│  ◀  Tu soporte                                                      │
│                                                                      │
│  #TKT-2026-0089                                                      │
│  Ruido en el tablero de la sede                                      │
│  ●  Esperando tu respuesta                                           │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  Carlos Pérez (técnico)                       May 28 · 09:14          │
│  ────────────                                                        │
│  Hola Carlos, llegamos a la sede a las 8am. Cuando abrimos el        │
│  tablero principal, escuchamos un zumbido fuerte en el breaker        │
│  principal. Antes de hacer cualquier cambio, quería confirmar        │
│  con vos: ¿querés que revisemos y reemplacemos el breaker, o         │
│  preferís dejarlo así hasta la visita programada?                    │
│  📎  foto_tablero.jpg                                                │
│                                                                      │
│  Carlos (tú)                               May 28 · 10:42            │
│  ────────────                                                        │
│  Adelante con el reemplazo, gracias por avisar.                      │
│  ¿Pueden darme un estimado de tiempo?                                │
│                                                                      │
│  Carlos Pérez (técnico)                    May 28 · 11:15            │
│  ────────────                                                        │
│  1 hora aproximadamente. Ya tenemos el breaker en la camioneta.     │
│  Te aviso cuando esté listo.                                         │
│                                                                      │
│  ──────────────────────────────────────────────────────              │
│                                                                      │
│  Escribí tu respuesta                                                │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                                                              │     │
│  │  [Tu mensaje...]                                            │     │
│  │                                                              │     │
│  │  📎 Adjuntar   [↩ Enviar]                                  │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

- **Estilo messaging app** (como iMessage / WhatsApp Web), con burbujas alternadas.
- **Actor + timestamp** en cada mensaje.
- **Adjuntos inline** (fotos, PDFs).
- **Input de respuesta** con botón de adjuntar.
- **Estado del ticket** visible al tope.

### 12.4 Lo que NUNCA tiene Mi Soporte

- ❌ "Abrir ticket" como formulario con 8 campos.
- ❌ Categoría + subcategoría + prioridad + tipo de consulta + SLA esperado.
- ❌ Tabla de tickets con 9 columnas.
- ❌ "Su ticket ha sido creado. ID: TKT-2026-XXXXX" como confirmación seca.

---

## 13. Patrones Adicionales

### 13.1 Onboarding del cliente (primera vez)

- **Pantalla 1:** Saludo + foto del ejecutivo + "Hola, soy [Ana / Carlos], tu ejecutivo. Acá podés ver el estado de todo lo que estamos haciendo para vos. Cualquier duda, escribime."
- **Pantalla 2:** Tour corto de 3 puntos sobre el top nav (Resumen, Proyectos, Facturas) + cómo usar el buscador.
- **Pantalla 3:** Confirmación de datos de contacto + "¿Querés recibir notificaciones por email, WhatsApp, o ambos?" (configurable después en Mi Cuenta).

### 13.2 Notificaciones in-portal

- **Badge en la campana** de la top nav con dot `accent` y contador.
- **Drawer lateral** al clickear, con la misma gramática de Sheets del ERP.
- **Items agrupados por módulo** (no por fecha) con timestamp mono muted.
- **Estado leído/no-leído** con dot sutil (no fondo gris).

### 13.3 Notificaciones externas (email + WhatsApp)

- **Configurable por el cliente** en Mi Cuenta: por cada tipo de evento (factura emitida, proyecto actualizado, documento firmado, ticket respondido), puede elegir email, WhatsApp, ambos, o ninguno.
- **Default razonable:** email para todo + WhatsApp para items urgentes (facturas por vencer, reprogramaciones).
- **Frecuencia:** inmediata por defecto; opción de digest diario/semanal para eventos de baja urgencia.

### 13.4 Búsqueda global del portal

- El command bar (⌘K) indexa solo lo del cliente: proyectos, cotizaciones, facturas, documentos, tickets, ejecutivos.
- **Sin acciones de "crear"** (el cliente no crea entidades).
- **Atajos contextuales:** desde un proyecto, ⌘K sugiere "Ir a la factura vinculada", "Contactar al técnico", "Descargar acta".

### 13.5 Mi Cuenta (settings del cliente)

- **Datos personales** (nombre, email, teléfono, foto).
- **Notificaciones** (configuración por evento y canal).
- **Métodos de pago** (tarjetas guardadas para pago rápido).
- **Seguridad** (cambiar contraseña, 2FA, sesiones activas).
- **Preferencias** (idioma, tema light/dark, densidad).
- **Privacidad** (descargar mis datos, cerrar cuenta).
- Estilo: **Settings tipo Stripe/Linear** (no tabs Bootstrap).

### 13.6 Modo "Fuera de oficina" del cliente

- Si el cliente avisa que estará fuera por X días (e.g. vacaciones), el portal muestra un banner sutil: "Estás fuera hasta el [fecha]. Tu ejecutivo sabe y retomamos a tu regreso."
- Configurable en Mi Cuenta o avisando a soporte.

---

## 14. Lo que NUNCA se hace en el Portal

Consolidado de los rechazos explícitos. Estos patrones quedan **prohibidos**:

### 14.1 Layout y chrome
- ❌ Sidebar fijo 220px con 6 items de navegación (es admin-feel).
- ❌ Header de página redundante con breadcrumb.
- ❌ Drawer lateral en mobile con la misma nav del sidebar.
- ❌ Logo del tenant a 64px de alto.
- ❌ Navbar sticky sin blur (transparente que muestra el contenido al hacer scroll).

### 14.2 Cards y contenido
- ❌ Cards `bg-white border rounded-xl shadow-md` con padding `p-6` y 4 fields (estilo admin genérico).
- ❌ Icono de Heroicons de 24px en `text-slate-400` flotando en una esquina de la card.
- ❌ Cards con sombra `shadow-lg` o más fuerte (over-elevation en contenido editorial).
- ❌ Cards que "flotan" agresivamente sobre un fondo gris (`bg-slate-100`).

### 14.3 Datos y tablas
- ❌ Cualquier tabla con más de 4 columnas para mostrar contenido al cliente.
- ❌ "Pendiente / En proceso / Cerrada" como pestañas con borde inferior gris.
- ❌ Botones de acción (edit/delete) en cada fila.
- ❌ Paginación numérica en listas cortas.

### 14.4 Tipografía y color
- ❌ Texto en uppercase para labels (solo mono labels, y solo si aportan).
- ❌ Texto centrado en listas o datos tabulares.
- ❌ Color rojo para decoración.
- ❌ `text-slate-500` para todo el cuerpo (usar escala más rica: zinc, stone).
- ❌ Más de un color de marca en la misma vista.

### 14.5 Iconografía
- ❌ Heroicons (lucide) como sistema de iconos default.
- ❌ Emojis en cualquier contexto (🏠 📦 💼 ✉️).
- ❌ Iconos con stroke-width 2 (preferir 1.5 o 1.25 para aspecto más refinado).
- ❌ Avatares con iniciales sobre fondo gris como fallback.

### 14.6 Botones y CTAs
- ❌ Botones genéricos "Save", "Submit", "Continue".
- ❌ Botones con 2 palabras en uppercase tracking-wide estilo Bootstrap.
- ❌ Múltiples CTAs primarias en la misma pantalla.
- ❌ Botones de 100% width fuera de modales.
- ❌ Iconos de "papel clip" emoji para adjuntar archivos.

### 14.7 Microcopy y tono
- ❌ "No hay registros" / "No data" / "Empty".
- ❌ Códigos de error técnicos ("Error 500", "ERR-001").
- ❌ Jerga interna ("OT", "SKU", "RMA", "AP", "AR", "FAC", "COT").
- ❌ Lenguaje imperativo frío ("Aprobar", "Confirmar recepción", "Validar").
- ❌ Plural sin contexto ("Tienes 3 elementos").

### 14.8 Motion
- ❌ Animaciones de más de 360ms.
- ❌ Spring, rebote, overshoot.
- ❌ Skeletons pulsantes agresivos.
- ❌ Spinners centrales para cargar secciones chicas.

### 14.9 Pagos y finanzas
- ❌ Link externo a pasarela de pago (Wompi, MercadoPago, Stripe Checkout hospedado).
- ❌ Modal "Confirmar pago" con 4 campos.
- ❌ "Total facturado: $X" como KPI card pequeña en una grilla.
- ❌ Saldo pendiente en color rojo chillón.

### 14.10 Soporte
- ❌ "Abrir ticket" como formulario de 8 campos.
- ❌ Categoría/subcategoría/prioridad/tipo como selects.
- ❌ Respuestas automáticas que dicen "Su solicitud ha sido recibida. Le responderemos en 24-48 horas hábiles.".
- ❌ "Ticket #4521 updated" como notificación.

---

## 15. Roadmap de Implementación Sugerido

Orden recomendado. **Las Olas 0 y 1 del ERP y el Portal comparten foundation**, por lo que se sincronizan.

### Ola 0 — Foundation compartida (1 sprint)
- Sistema de tokens (extendido con escala "portal" más cálida y motion más lento).
- Hook `usePlatform()` para atajos OS-aware.
- Componentes base compartidos (Button, Input, Pill, StatusDot, Card) con variantes "ERP" y "Portal".
- Top nav con logo del tenant, nav horizontal, search, notificaciones, avatar.
- Bottom nav móvil.
- Command bar del portal (sin acciones de "crear").
- Verificación: `npm run build && npm run lint` + smoke test cross-browser.

### Ola 1 — Onboarding + Resumen (1 sprint)
- Pantalla de bienvenida del cliente (3 pasos, skippable).
- Módulo Resumen con saludo, alertas, proyectos destacados, actividad, ¿Necesitás algo?.
- Mi Cuenta básico (datos, notificaciones).
- Verificación: walkthrough del cliente con 3 personas fuera del equipo de desarrollo.

### Ola 2 — Módulos de seguimiento (1–2 sprints)
- Mis Órdenes (lista + detalle con timeline).
- Mis Proyectos (lista + detalle con timeline + entregables + equipo).
- Actividad cronológica unificada.

### Ola 3 — Módulos transaccionales (1–2 sprints)
- Mis Cotizaciones (lista + detalle editorial + flujo de aceptación).
- Mis Facturas (lista + receipt + flujo de pago con pasarela del tenant).

### Ola 4 — Módulos de sistema (1 sprint)
- Mis Documentos (bóveda con tabs por tipo + preview).
- Mi Soporte (hero de contacto + conversaciones + FAQ).

### Ola 5 — Polish (1 sprint)
- Empty/error/loading states para los 6 módulos + Overview.
- Notificaciones in-portal y externas configurables.
- Reduced motion + accesibilidad AA auditada.
- Mobile audit en 3 dispositivos (iPhone, Android, tablet).

---

## 16. Criterios de Aceptación del Rediseño

El rediseño del portal se considera exitoso cuando se cumplen **todos** los siguientes criterios:

1. **El portal no tiene sidebar** en ningún breakpoint. Top nav en desktop, bottom nav en móvil.
2. **El Resumen no tiene KPI cards en cajas grises.** Tiene saludo editorial + alertas + proyectos destacados + actividad + CTAs grandes.
3. **Ningún módulo usa tablas con más de 4 columnas visibles.** Para contenido denso, se usan cards editoriales.
4. **El Resumen transmite "todo al día" o "1 cosa por atender" en menos de 5 segundos** de escaneo.
5. **Cada módulo tiene un patrón de timeline visible** cuando aplica (órdenes, proyectos, cotizaciones, facturas relevantes).
6. **Las cotizaciones y facturas son documentos editoriales**, no PDFs embebidos estáticos. Se leen como PDFs bien diseñados pero son interactivos.
7. **El pago de una factura ocurre dentro del portal**, sin redirigir a pasarela externa.
8. **Las conversaciones de soporte son estilo messaging app**, no "ticket #4521".
9. **Cada persona del equipo AeroMax que aparece tiene foto real**, nombre completo, rol, y al menos un canal de contacto.
10. **El empty state de cada módulo es editorial**, con ilustración + headline + sub, sin botón de acción.
11. **El tono de voz es consistente**: "Hola, Carlos", "En curso", "Vence en 3 días", sin jerga interna, sin códigos de error.
12. **El icon system es Phosphor (o custom SVG), no Heroicons.** Stroke 1.5, no 2. Sin emojis en ningún contexto.
13. **El motion es más calmado que el ERP**: page transitions 320ms, list item enter con stagger 40ms, sin spring.
14. **El dark mode existe y es opcional**, con `bg.canvas = #0A0A0A` warm-neutral, nunca `bg-zinc-900` frío.
15. **El mobile-first es real**: bottom nav de 5–6 items, contenido a 1 columna, CTAs sticky-bottom en flujos.
16. **El command bar solo busca y navega**, no ejecuta acciones de "crear".
17. **Las notificaciones externas (email + WhatsApp) son configurables por el cliente** en Mi Cuenta.
18. **La accesibilidad AA se cumple** en los 6 módulos: contraste, focus ring, keyboard nav, ARIA, jerarquía de headings.
19. **El portal reduce a la mitad el tiempo** que un cliente necesita para responder "¿en qué va mi proyecto?" vs. el portal anterior.
20. **El cliente puede dar feedback en cualquier pantalla** (botón flotante "¿Cómo va tu experiencia?") que se envía al equipo.

---

## 17. Decisiones Pendientes (necesitan confirmación)

1. **Iconografía: Phosphor vs custom SVG**
   - Phosphor: 3 pesos (thin/regular/bold), consistente, listo.
   - Custom SVG: máxima diferenciación, más trabajo de diseño, requiere más tiempo.
   - Recomendación: **Phosphor regular** para UI, custom SVG solo para los 6 iconos de módulos y 3 ilustraciones de empty states.

2. **Pasarela de pago: ¿integrada o embedded?**
   - Opción A: pasarela embebida dentro del modal (Wompi Elements / Stripe Elements).
   - Opción B: pasarela hosted en iframe dentro del portal.
   - Recomendación: **embebida** (Opción A) para que el cliente nunca sienta que salió del portal.

3. **Conversaciones de soporte: ¿datos propios o integración con Intercom/Zendesk?**
   - Opción A: sistema propio de tickets dentro del portal.
   - Opción B: integración con Intercom (o similar) vía widget + sync.
   - Recomendación: **datos propios** (Opción A) porque la experiencia es parte del producto. Si en el futuro se necesita, se puede integrar después.

4. **Modo dark: ¿sí o no?**
   - A favor: el cliente técnico lo pide, modernidad, accesibilidad.
   - En contra: el tono editorial funciona mejor en claro.
   - Recomendación: **sí, opcional**, con estética warm-neutral (no zinc frío).

5. **Personalización del tenant: ¿cuánto llega al portal?**
   - El ERP permite cambiar logo, color, fuentes. ¿El portal también?
   - Recomendación: **logo sí, color sí, fuentes opcional**. Los demás tokens del portal son fijos (motion, espaciado, radius) para mantener la sensación premium.

6. **Idioma: ¿solo español o multi-idioma?**
   - El cliente puede ser colombiano, chileno, argentino, mexicano. La Constitución Técnica ya tiene multi-tenant.
   - Recomendación: **multi-idioma ready** (i18n con diccionarios), default español neutro. Configurable por tenant.

---

## 18. Prerequisite para Ola 0 Global

Este blueprint es **prerrequisito** para iniciar la Ola 0 global (ERP + Portal). El orden de aprobación:

1. ✅ Aprobación del `BLUEPRINT_ERP_REDESIGN.md` (previamente).
2. ⏳ **Aprobación de este `BLUEPRINT_PORTAL_REDESIGN.md`** (pendiente).
3. ⏳ Aprobación global unificada para iniciar Ola 0.
4. Ola 0 = Foundation compartida (tokens + componentes + shells) que sirve a ambos productos.

**No se escribe código hasta que ambos blueprints estén aprobados y la aprobación global esté dada.**

---

## 19. Próximo Paso

Esperando tu aprobación de este blueprint. Una vez aprobado:

1. Congelar este documento en `docs/03_protocolo/23_BLUEPRINT_PORTAL_REDESIGN.md` como Constitución Visual del Portal.
2. Confirmar la aprobación global para iniciar Ola 0 con foundation compartida.
3. Iniciar la **Ola 0 compartida** según el roadmap.
4. Cada ola genera un build verificable (`npm run build && npm run lint`) antes de pasar a la siguiente.

**No se escribe código hasta la aprobación explícita.**
