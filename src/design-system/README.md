# Design System — ERP Design Tokens

## Arquitectura en 3 niveles

```
Primitive Tokens (valores físicos, sin significado)
       ↑
Semantic Tokens (intención, referencias a primitives)
       ↑
Component Tokens (uno por componente, referencias a semantics)
       ↑
Componentes (consumen SOLO Component Tokens — prohibido hex directo)
```

## Estructura

```
src/design-system/
├── types/           # Interfaces y tipos TS
├── primitives/      # Valores físicos: colores, spacing, radius, etc.
├── semantic/        # (reservado para lógica de resolución por categoría)
├── components/      # (Fase 2) Mapeo Component Token por componente
├── themes/          # 8 temas: cada uno = valores semantic tokens
│   ├── light/       # minimal-white, modern-blue, corporate-emerald, executive-purple
│   └── dark/        # carbon, graphite, midnight-blue, neo-emerald
├── provider/        # DesignSystemProvider + useDesignSystem hook
└── utils/           # resolve-token, generate-css-variables, contrast
```

## Reglas estrictas

1. Ningún componente accede directamente a un valor hex ni a un Primitive Token
2. Los componentes SOLO consumen Component Tokens
3. Los Component Tokens dependen ÚNICAMENTE de Semantic Tokens
4. Los Semantic Tokens dependen ÚNICAMENTE de Primitive Tokens y nunca almacenan colores directamente
5. Agregar un nuevo tema requiere únicamente crear un nuevo archivo en `themes/light/` o `themes/dark/`

---

## Bridge Tokens (CMS / White-Label)

Estos Semantic Tokens son configurables por tenant desde el CMS de la web pública.
El resto de tokens son exclusivos del Theme Engine interno del ERP.

### Bridge Set

| Token | Categoría | Propósito | Conexión con BrandingConfig |
|-------|-----------|-----------|-----------------------------|
| `action.primary` | action | Color primario de marca | `colors.primary` |
| `action.secondary` | action | Color secundario / acento | `colors.secondary` |
| `action.hover` | action | Hover del primario | _(derivado)_ |
| `text.link` | text | Color de enlaces | — |
| `surface.background` | surface | Fondo de página | — |
| `surface.card` | surface | Fondo de tarjetas | — |
| `border.default` | border | Borde general | — |
| `border.focus` | border | Anillo de foco | `colors.primary` (reutilizado) |
| `typography.fontFamily.sans` | — | Fuente principal | `typography.heading` / `typography.body` |
| `typography.fontFamily.display` | — | Fuente de títulos | `typography.heading` |

### Cómo se usan en el CMS

1. El tenant configura estos valores en `BrandingConfig` desde el CMS
2. El bridge set se almacena en `tenant_settings` (tabla Supabase)
3. Al cargar la web pública, los bridge tokens se inyectan como CSS variables
4. La web pública del tenant usa estos tokens, no los del ERP

### Tokens EXCLUSIVOS del Theme Engine (NO bridge)

- `status.*` — indicadores visuales de estado (success, warning, error, info)
- `chart.*` — colores de gráficos
- `icon.*` — colores de iconografía
- `special.*` — focus ring, selection
- `elevation.*`, `blur.*` — efectos visuales
- Todos los **Component Tokens** — son internos del ERP

> ⚠️ No exponer estos tokens en el CMS. Son privados del sistema de diseño del ERP.

### Constante de referencia

```typescript
// src/design-system/bridge.ts (por crear cuando se implemente el CMS bridge)
export const BRIDGE_TOKENS = [
  'action.primary',
  'action.secondary',
  'action.hover',
  'text.link',
  'surface.background',
  'surface.card',
  'border.default',
  'border.focus',
] as const
```

---

## Cómo crear un nuevo tema

1. Crear archivo en `src/design-system/themes/light/mi-tema.ts` o `src/design-system/themes/dark/mi-tema.ts`
2. Exportar un objeto `Theme` con todos los campos tipados
3. Importarlo y agregarlo a los arrays `themes` y `themeMap` en `src/design-system/themes/index.ts`
4. **Cero cambios en componentes**

---

## Uso en componentes

```tsx
'use client'

import { useDesignSystem } from '@/design-system'

function MyButton() {
  const { resolved } = useDesignSystem()

  return (
    <button
      style={{
        backgroundColor: resolved('action.primary'),
        color: resolved('text.inverse'),
      }}
    >
      Click me
    </button>
  )
}
```

O usando las CSS variables generadas automáticamente:

```tsx
<button className="bg-[var(--ds-action-primary)] text-[var(--ds-text-inverse)]">
  Click me
</button>
```

---

## Contraste WCAG

```typescript
import { validateThemeContrast } from '@/design-system'
import { carbon } from '@/design-system/themes'

const results = validateThemeContrast(carbon)
// → [{ pair: 'text.primary on surface.background', ratio: 15.3, aa: true, aaa: true }, ...]
```
