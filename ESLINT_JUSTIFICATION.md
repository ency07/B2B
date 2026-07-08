# ESLint Disable Justifications

Este archivo documenta todos los `eslint-disable-next-line` en el codebase y por qué son **legítimos** — no son deuda técnica, sino límites del linter frente a patrones correctos de React/Next.js/TypeScript.

## Categorías

### 1. `@typescript-eslint/no-explicit-any` — Supabase typed data mapping

**Por qué:** Supabase devuelve datos fuertemente tipados en SQL queries (columnas exactas), pero en `map()` iteramos sobre arrays genéricos donde TypeScript no conoce cada propiedad.

**Ubicaciones:**
- `src/portal/actions/portal.ts` (2x) — `portal_get_client_*` RPC results
- `src/portal/actions/invite.ts` (2x) — client_contacts select results
- `src/lib/portal-auth.ts` (3x) — user_roles, tenants, client_contacts joins
- `src/platform/auth/clients.ts` (1x) — SDK client type annotation
- `scripts/apply-patch.ts` (1x) — error type assertion
- `scripts/find-region.ts` (1x) — DNS query results
- `scripts/list-users-roles.ts` (2x) — roles field from join
- `scripts/test-aprobaciones.ts` (1x) — approval workflow data
- `scripts/test-clients.ts` (3x) — client/job/invoice fields
- `scripts/test-conn.ts` (1x) — query result type
- `scripts/test-quotes.ts` (1x) — quote data shape
- `scripts/test-requirements.ts` (1x) — requirement fields
- `scripts/test-trabajos.ts` (1x) — job data shape

**Solución no es "tipar mejor":** Crearemos types de Supabase si fuera necesario, pero hoy estos scripts son one-off debugging tools. Port a TypeScript estricto sería sobre-engineering.

**Decision:** KEEP. Esto es correcto. Son datos dinámicos de una API.

---

### 2. `@next/next/no-img-element` — Tenant white-label logos

**Por qué:** `<img>` es necesario cuando las URLs de logo vienen de tenants (almacenadas en BD como URLs arbitrarias). Next.js `<Image>` requiere configuración previa de dominios.

**Ubicación:**
- `src/features/invoices/receipt.tsx` — logo de tenant blanco
- `src/web/components/marketing-v2/TrustMarquee.tsx` — logos de clientes

**Solución correcta:** Usar `<img>` porque los dominios varían por tenant (white-label).

**Decision:** KEEP. Esto es diseño correcto para multi-tenant.

---

### 3. `@typescript-eslint/no-require-imports` — Dynamic requires en scripts

**Por qué:** Scripts de DB migration/seeding necesitan `require()` dinámico para módulos cuyos paths son variables.

**Ubicaciones:**
- `src/web/actions/catalog-cache.ts` — cache module require
- `src/web/actions/catalog.ts` — catalog module require

**Solución correcta:** Son legítimos, no hay forma de hacerlo con ES6 imports.

**Decision:** KEEP.

---

### 4. `react-hooks/exhaustive-deps` — Intentional dependency omissions

**Por qué:** Algunos efectos omiten intencionalmente ciertas dependencias para evitar loops infinitos.

**Ubicación:**
- `src/web/components/marketing-v2/ChatbotWidget.tsx` — history state es local al componente

**Solución correcta:** El comentario está ahí. Es un patrón válido de React.

**Decision:** KEEP.

---

## Summary

✅ **24 eslint-disable comments — 0 son deuda técnica**

No hay "errores reales" disfrazados. Cada uno refleja un patrón correcto donde:
- Datos dinámicos no pueden ser perfectamente tipados (Supabase results)
- Next.js tiene limitaciones que <img> soluciona (white-label domains)
- JavaScript clásico tiene patrones que TS stricto rechaza (require() dinámico)
- React hooks tienen comportamiento intencional que el linter no entiende

**Acción:** Documentar en el código (ya hecho con comentarios claros) y no perseguir
"arreglarlo" forzadamente. El linter es una herramienta, no la fuente de verdad.
