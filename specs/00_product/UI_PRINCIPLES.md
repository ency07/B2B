# UI PRINCIPLES — Principios de Interfaz de Usuario

## Stack tecnológico

| Elemento | Tecnología | Razón |
|---|---|---|
| Framework | Next.js 14/15 App Router | SSR, RSC, Server Actions nativas |
| Lenguaje | TypeScript estricto | Tipado obligatorio |
| Estilos | Tailwind CSS v3 | Utility-first, consistente, sin CSS suelto |
| Componentes base | Radix UI Primitives | Accesibilidad WCAG, headless, personalizables |
| Formularios | React Hook Form + Zod | Validación tipada en frontend y backend |
| Iconos | Lucide React | Ligeros, consistentes, premium look |
| Fechas | date-fns | Tree-shakeable, sin Moment.js |
| Tablas | TanStack Table (React Table v8) | Headless, sort, filter, paginación controlada |
| Estado global | Zustand | Solo para estado cross-componente real |
| Gráficos | Recharts | Ligeros, Reactivos, SVG nativo |
| Animaciones | Framer Motion / tailwindcss-animate | Microinteracciones premium |

### Librerías prohibidas

- ❌ Bootstrap, jQuery, Material UI, Chakra UI, Ant Design, shadcn/ui
- ❌ CSS-in-JS (styled-components, emotion, vanilla-extract)
- ❌ Chart.js (problemas de renderizado en React)

---

## Design System — Tokens

### Colores

| Token | Valor | Uso |
|---|---|---|
| `--primary` | `#1E40AF` (blue-800) | Acción principal, botones primarios |
| `--primary-light` | `#DBEAFE` (blue-100) | Fondos suaves de primario |
| `--primary-dark` | `#1E3A8A` (blue-900) | Hover de primario |
| `--secondary` | `#0F766E` (teal-700) | Acento secundario |
| `--success` | `#16A34A` (green-600) | Estados positivos, pagos, completado |
| `--warning` | `#D97706` (amber-600) | Estados de atención |
| `--danger` | `#DC2626` (red-600) | Errores, cancelaciones, bloqueos |
| `--info` | `#2563EB` (blue-600) | Información general |
| `--surface` | `#F8FAFC` (slate-50) | Fondo principal |
| `--surface-card` | `#FFFFFF` | Fondo de tarjetas |
| `--border` | `#E2E8F0` (slate-200) | Bordes suaves |
| `--text-primary` | `#0F172A` (slate-900) | Texto principal |
| `--text-secondary` | `#475569` (slate-600) | Texto secundario |
| `--text-muted` | `#94A3B8` (slate-400) | Texto deshabilitado |
| `--sidebar-width` | `256px` | Sidebar expandido |
| `--sidebar-collapsed` | `80px` | Sidebar colapsado |
| `--header-height` | `64px` | Altura del header |

### Tipografía

| Elemento | Font | Tamaño | Peso |
|---|---|---|---|
| Headings | `Inter` | `text-2xl/tight` | `font-semibold` |
| Body | `Inter` | `text-sm` | `font-normal` |
| Small | `Inter` | `text-xs` | `font-normal` |
| Mono | `JetBrains Mono` | `text-sm` | `font-normal` |
| Landing | `Plus Jakarta Sans` | variable | variable |

### Espaciado

| Espaciador | Valor |
|---|---|
| `gap-unit` | `1rem` (16px) base |
| `padding-card` | `p-6` |
| `gap-section` | `gap-6` |
| `gap-grid` | `gap-4` |
| `padding-page` | `p-4 md:p-6 lg:p-8` |

---

## Patrones de layout

### Responsive breakpoints

| Breakpoint | Ancho mínimo | Target |
|---|---|---|
| `sm` | 640px | Móvil landscape |
| `md` | 768px | Tablet |
| `lg` | 1024px | Desktop compacto |
| `xl` | 1280px | Desktop estándar |
| `2xl` | 1536px | Desktop amplio |

### Estructura de página

```
+-------------------------------------------------------------+
| [Breadcrumb]  [Page Title]  [Actions (dropdown/create/..)]  |
|-------------------------------------------------------------|
|                                                             |
|  [Main Content — Grid/Table/Cards/Form]                     |
|                                                             |
|  [Pagination if applicable]                                 |
+-------------------------------------------------------------+
```

---

## Componentes atómicos

Ver `docs/15_frontend/01_DESIGN_SYSTEM.md` para la especificación detallada y ejemplos de cada componente.

### Botones

| Variante | Clase | Uso |
|---|---|---|
| Primary | `bg-primary text-white hover:bg-primary-dark` | Acción principal de la pantalla |
| Secondary | `bg-white text-slate-900 border border-slate-300 hover:bg-slate-50` | Acción secundaria |
| Ghost | `text-slate-600 hover:bg-slate-100` | Acción terciaria |
| Destructive | `bg-red-600 text-white hover:bg-red-700` | Eliminar, cancelar, peligro |

### Tablas

| Elemento | Clase |
|---|---|
| Header | `bg-slate-50 text-slate-600 text-xs font-medium uppercase tracking-wider` |
| Cell | `text-slate-900 text-sm font-normal py-3` |
| Row | `border-b border-slate-200 hover:bg-slate-50` |
| Empty | `text-slate-400 text-sm italic` |

### Badges

| Propósito | Estados |
|---|---|
| Estados éxito | `bg-green-100 text-green-800` |
| Estados warning | `bg-amber-100 text-amber-800` |
| Estados error | `bg-red-100 text-red-800` |
| Estados info | `bg-blue-100 text-blue-800` |
| Estados neutral | `bg-slate-100 text-slate-700` |

### Tarjetas

```
< Card >
  < CardHeader >
    < CardTitle >   // text-lg font-semibold
    < CardDescription > // text-sm text-muted-foreground
  < CardContent >   // espacio principal
  < CardFooter >    // acciones, metadata
</ Card >
```

---

## Condiciones de parada visual

Detener inmediatamente cualquier desarrollo visual si:

| Condición | Acción |
|---|---|
| No existe especificación del componente | No crearlo. Buscar en docs. |
| El diseño viola el Design System | Rediseñar antes de escribir código |
| El componente no tiene estados definidos | No crearlo. Definir estados primero. |
| No se sabe qué UX Pattern aplicar | Consultar docs/15_frontend/ |
| La pantalla es > 500 líneas | Dividir en subcomponentes |

---

## Reglas de implementación

1. **RSC por defecto.** Server Components hasta que se requiera interactividad real.
2. **Client Components mínimos.** Marcar explícitamente `'use client'` solo si usan hooks, eventos, efectos.
3. **Layouts anidados.** Root layout → Auth layout → Dashboard layout → Module layout.
4. **Carpetas modulares.** `/(landing)/`, `/(erp)/`, `/(portal)/`. Sin mezclar rutas.
5. **Server Actions puras.** Los actions no deben mezclar responsabilidades de UI.
6. **Fetch en Server Components.** Los datos se obtienen en componentes del servidor.
7. **Zero reglas CSS globales.** Solo Tailwind `@apply` en componentes base compartidos.
