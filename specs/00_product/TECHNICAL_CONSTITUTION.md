# TECHNICAL CONSTITUTION — Constitución Técnica

## Supremacía

Esta constitución técnica deriva su autoridad de la **PRODUCT CONSTITUTION**.

Ninguna decisión técnica puede violar los 20 pilares aquí definidos. Si un pilar es violado, la implementación debe ser rechazada y rediseñada.

---

## Los 20 Pilares de la Constitución Técnica

### Pilar I — Multiempresa (Multi-Tenancy)

**Obligatorio.** Toda entidad operacional pertenece a un tenant.

| Regla | Implementación |
|---|---|
| `tenant_id` en toda tabla operacional | `uuid not null references tenants(id)` |
| RLS (Row Level Security) habilitado | Políticas por tenant en toda tabla crítica |
| Aislamiento total de datos | Prohibido cross-tenant queries |
| Códigos secuenciales por tenant | `tenant_sequences` con bloqueo a nivel fila |
| Sin excepciones | No existe tabla operacional sin tenant_id |

### Pilar II — Soft Delete (Borrado Lógico)

**Obligatorio.** Nada se borra físicamente.

| Regla | Implementación |
|---|---|
| `deleted_at timestamptz` | En toda tabla operacional |
| `deleted_by uuid references auth.users` | En toda tabla operacional |
| `delete_reason text` | En toda tabla operacional |
| Trigger bloquea DELETE físico | `before delete` raise exception |
| Consultas excluyen borrados | `where deleted_at is null` por defecto |

### Pilar III — Auditoría Dual

**Obligatorio.** Toda mutación registrada en dos sistemas paralelos.

| Sistema | Formato | Propósito |
|---|---|---|
| `audit_log` | diff JSONB + actor + timestamp | Forense técnico |
| `business_events` | entidad + acción + metadata | Trazabilidad de negocio |

### Pilar IV — UI Defensiva

**Obligatorio.** La interfaz nunca se rompe.

| Regla | Implementación |
|---|---|
| Valores nulos/undefined | Nunca mostrar al usuario. Mostrar fallback |
| Errores | Registrar. Mostrar mensaje amigable |
| Loading/Skeleton | Siempre presente en componentes de datos |
| Timeout/Offline | Mensaje claro + opción de reintentar |
| RSC por defecto | Client Component solo con interacción real |

### Pilar V — Reutilización

**Obligatorio.** REUTILIZAR > EXTENDER > ADAPTAR > CREAR.

| Regla | Implementación |
|---|---|
| REUSE_ANALYSIS obligatorio | Antes de crear cualquier nueva entidad |
| Prohibido duplicar | Tablas, catálogos, estados, secuencias, roles |
| Prohibido crear UI desde cero | Si existe repositorio reutilizable |

### Pilar VI — Tipado Estricto

**Obligatorio.** TypeScript estricto. Zod para validación de entrada.

| Regla | Implementación |
|---|---|
| `strict: true` en tsconfig | Sin excepciones |
| Prohibido `any` | Sin justificación documentada |
| Zod schemas | Validación en Server Actions y APIs |
| Tipos centralizados | `types/` compartidos entre frontend y backend |

### Pilar VII — Backend Puro (Server Actions)

**Obligatorio.** Lógica de negocio exclusivamente en Server Actions.

| Regla | Implementación |
|---|---|
| No mezclar UI con lógica | Server Actions puras, sin responsabilidad de presentación |
| `'use server'` | Toda acción que muta datos |
| Validación Zod | En cada action antes de procesar |
| Auditoría | Cada action registra en audit_log + business_events |

### Pilar VIII — Responsive Industrial

**Obligatorio.** Funcional en cualquier dispositivo.

| Regla | Implementación |
|---|---|
| `min-h-screen` | En lugar de `h-screen` |
| `overflow-auto` | En lugar de `overflow-hidden` |
| Mobile-first | Media queries `min-width` |
| Sidebar colapsable | Desktop 256px, mobile drawer |

### Pilar IX — RSC por Defecto

**Obligatorio.** React Server Components como norma.

| Regla | Implementación |
|---|---|
| Server Component | Por defecto para toda página y componente |
| Client Component | Solo con `'use client'` si usa hooks, eventos, efectos |
| Fetch en servidor | Datos obtenidos en RSC. Cliente solo revalida. |

### Pilar X — Consistencia Horizontal

**Obligatorio.** Mismos patrones en todos los módulos.

| Regla | Implementación |
|---|---|
| Server Actions | `create*`, `update*`, `delete*`, `get*` |
| Estados | Mismos nombres, mismas transiciones |
| Componentes | Mismos patrones de layout y composición |
| Tipos | Mismas convenciones y ubicación |

### Pilar XI — Nomenclatura Limpia

**Obligatorio.** Nombres descriptivos y en español.

| Elemento | Estilo | Ejemplo |
|---|---|---|
| Tablas | `snake_case` español | `cotizaciones`, `ordenes_trabajo` |
| Estados | MAYÚSCULAS sostenidas | `EN_REVISION`, `APROBADA` |
| Componentes | PascalCase | `WizardLead`, `TablaCotizaciones` |
| Funciones | camelCase | `crearLead`, `actualizarEstado` |
| Archivos | `snake_case` | `lead_wizard.tsx` |

### Pilar XII — Resiliencia

**Obligatorio.** El sistema tolera fallos y se recupera.

| Requisito | Implementación |
|---|---|
| Retry | Reintentar con backoff |
| Loading | Indicador discreto |
| Skeleton | Placeholder animado |
| Timeout | Límite con mensaje claro |
| Offline | Degradación controlada |

### Pilar XIII — Documentación Viva

**Obligatorio.** Documentar mientras se construye.

| Regla | Implementación |
|---|---|
| Por módulo | docs funcionales + técnicos + casos de uso + dependencias |
| No al final | Durante la construcción |
| En español | Lenguaje del negocio |

### Pilar XIV — Datos Semilla

**Obligatorio.** 25 tenants, 106 usuarios de prueba.

| Regla | Implementación |
|---|---|
| Seed multiempresa | Datos representativos por tenant |
| Roles variados | Cubriendo todos los perfiles |
| Estados diversos | Leads, OTs, facturas en distintos estados |

### Pilar XV — Seguridad por Capas

**Obligatorio.** Auth + RLS + Roles + Auditoría.

| Capa | Implementación |
|---|---|
| Autenticación | Supabase Auth (email + magic link) |
| RLS | Políticas por tenant |
| Roles | 26 roles con matriz de permisos |
| Auditoría | audit_log + business_events |
| Secretos | Solo en variables de entorno |

### Pilar XVI — White Label

**Obligatorio.** Todo configurable sin recompilar.

| Regla | Implementación |
|---|---|
| Logos | Configurables desde ERP |
| Colores | CSS custom properties por tenant |
| Textos | Variables de contenido |
| Sin hardcoding | Prohibido codificar URLs, textos, colores |

### Pilar XVII — UX Funcional

**Obligatorio.** Cada pantalla responde: ¿Qué decisión ayuda a tomar?

| Regla | Implementación |
|---|---|
| Toda pantalla con propósito | No existen pantallas decorativas |
| KPIs con contexto | No solo números, también significado |
| Acciones visibles | El usuario sabe qué puede hacer |

### Pilar XVIII — Versiones Inmutables

**Obligatorio.** Cotizaciones, facturas y documentos versionados. Historial preservado.

| Regla | Implementación |
|---|---|
| Tabla `cotizacion_versiones` | Historial completo de cambios |
| Tabla `factura_versiones` | Historial completo de cambios |
| Documentos versionados | Sistema polimórfico de documentos |

### Pilar XIX — Auto-descubrimiento

**Obligatorio.** El sistema expone su propia documentación.

| Regla | Implementación |
|---|---|
| Endpoint /api/health | Estado del sistema |
| Documentación técnica | En `/docs/` del repositorio |

### Pilar XX — Aprobación Interna

**Obligatorio.** Antes de aprobar, responder 10 preguntas de control.

Ver lista completa en `PRODUCT_CONSTITUTION.md` — Criterios de aprobación.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | 20.x LTS |
| Framework | Next.js | 14/15 App Router |
| Lenguaje | TypeScript | 5.x (strict) |
| Base de datos | PostgreSQL | 15+ (via Supabase) |
| ORM / Queries | Supabase JS SDK | v2 |
| Auth | Supabase Auth | Email + Magic Link |
| Estilos | Tailwind CSS | v3 |
| Componentes base | Radix UI | Última |
| Formularios | React Hook Form + Zod | Última |
| Pagos | Wompi API | Colombia |
| Testing | Playwright (E2E) | Última |

---

## Convenciones de código

### Server Actions

```typescript
'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const schema = z.object({ ... })

export async function crearLead(data: FormData) {
  const validated = schema.parse(Object.fromEntries(data))
  const supabase = createClient()
  // ... lógica de negocio
  revalidatePath('/leads')
}
```

### Componentes

- RSC por defecto (sin `'use client'`)
- Props tipadas explícitamente
- Fragmentos (`<>`) en lugar de divs wrapper
- Sin lógica de negocio en componentes

### Fetching en Server Components

```typescript
// app/leads/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function LeadsPage() {
  const supabase = createClient()
  const { data: leads } = await supabase.from('leads').select('*')
  return <LeadsTable leads={leads} />
}
```

---

## Prohibiciones técnicas explícitas

| Prohibido | Alternativa |
|---|---|
| `any` | Tipo explícito o `unknown` + guard |
| `!` (non-null assertion) | Validación con `if` o optional chaining |
| `useEffect` para fetch | Server Components o Server Actions |
| `useState` para formularios | React Hook Form |
| `any` en Supabase queries | Tipos generados de BD |
| CSS modules / CSS-in-JS | Tailwind utility classes |
| try/catch sin logging | Registrar error + mensaje usuario |
| Importaciones relativas largas | Path aliases (`@/`) |
| Nombres en inglés para entidades | Español (`leads`, no `leads` es excepción aprobada) |
| Fechas en string | `date-fns` + formato estándar |
| Console.log en producción | Logger estructurado |
| useEffect + useState responsive | Tailwind breakpoints |
| Fragment `<></>` con key | `<div>` o `<Fragment key={...}>` |
