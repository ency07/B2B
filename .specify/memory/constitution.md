<!--
  ======================================================================
  SYNC IMPACT REPORT — v1.0.0 → v1.1.0
  ======================================================================
  Version change: 1.0.0 → 1.1.0 (MINOR — adición de principio y sección,
    sin redefinir ni remover contenido existente)
  Modified principles: ninguno renombrado ni renumerado
  Added sections:
    - Core Principles → IX. Trazabilidad End-to-End & Remediación Antes
      de Expansión (NON-NEGOTIABLE)
    - Architecture & Security Constraints → Contratos Externos (congelados)
    - Governance → Artefactos de auditoría vigentes (GAP_ANALYSIS.md)
  Removed sections: ninguna
  Templates requiring updates:
    - .specify/templates/plan-template.md: ✅ sin cambios (gate genérico
      "[Gates determined based on constitution file]")
    - .specify/templates/spec-template.md: ✅ sin cambios (sin referencias
      a principios específicos)
    - .specify/templates/tasks-template.md: ✅ sin cambios (sin referencias
      a principios específicos)
    - .claude/skills/speckit-*/SKILL.md: ✅ verificado por grep, ninguno
      hardcodea conteo o nombres de principios
  Follow-up TODOs: ninguno
  ======================================================================
-->

<!--
  ======================================================================
  CONSTITUCIÓN DEL PROYECTO — AeroMax Industrial ERP
  ======================================================================
  Fuentes:
    - specs/00_product/PRODUCT_CONSTITUTION.md (25 Decisiones Congeladas)
    - specs/00_product/TECHNICAL_CONSTITUTION.md (20 Pilares Técnicos)
    - docs/00_GOVERNANCE/AI_CONSTITUTION.md
    - specs/00_product/DESIGN_PRINCIPLES.md
    - specs/00_product/UX_PRINCIPLES.md
    - GAP_ANALYSIS.md (auditoría retrospectiva, 2026-07-20)
  ======================================================================
-->

# Constitución del Proyecto — AeroMax Industrial ERP

## Supremacía

Este documento tiene **prioridad absoluta** sobre cualquier otro documento del proyecto.
Ninguna IA, desarrollador o herramienta podrá generar código sin haber leído y aceptado
esta constitución primero.

> "Si una implementación incumple un solo pilar deberá ser rechazada y rediseñada."
> "Es mejor hacer 100 preguntas que inventar 1 requisito."

---

## Core Principles

### I. No Inventar — Protocolo de Incertidumbre (NON-NEGOTIABLE)

**Prohibido inventar campos, tablas, relaciones, estados, permisos, procesos, pantallas,
APIs, cálculos o reglas de negocio no documentados.**

Protocolo:
1. **DETENERSE** inmediatamente ante una duda
2. **DOCUMENTAR** la duda (qué falta, por qué, impacto)
3. **AUDITAR** las 8 fuentes documentales (`specs/`, `docs/`, `supabase/migrations/`)
4. Si la respuesta existe: **APLICARLA** — prohibido preguntar al usuario
5. Si no existe: **PREGUNTAR** al usuario en un solo bloque consolidado
6. **ESPERAR** respuesta antes de continuar

Matriz de decisión:
| Estado | Acción |
|--------|--------|
| **DEFINIDO** | Se puede implementar. Sin preguntas. |
| **PARCIALMENTE DEFINIDO** | Generar preguntas. No implementar hasta respuesta. |
| **NO DEFINIDO** | **Prohibido implementar.** Detenerse. Preguntar. |

### II. Multi-Tenancy & RLS (NON-NEGOTIABLE)

Toda entidad operacional pertenece a un tenant con aislamiento total.

| Regla | Implementación |
|-------|---------------|
| `tenant_id` en toda tabla operacional | `uuid not null references tenants(id)` |
| RLS obligatorio en toda tabla crítica | Políticas por tenant |
| Aislamiento total | Prohibido cross-tenant queries |
| Códigos secuenciales por tenant | `tenant_sequences` con bloqueo a nivel fila |

### III. Soft Delete & Auditoría Dual (NON-NEGOTIABLE)

Nada se borra físicamente. Toda mutación se registra en dos sistemas paralelos.

| Sistema | Formato | Propósito |
|---------|---------|-----------|
| Soft Delete | `deleted_at`, `deleted_by`, `delete_reason` en toda tabla | Borrado lógico |
| `audit_logs` | diff JSONB + actor + timestamp | Forense técnico |
| `business_events` | entidad + acción + metadata | Trazabilidad de negocio |

Trigger bloquea DELETE físico en tablas operacionales (`before delete` raise exception).

### IV. UI Defensiva & Server Components First

La interfaz nunca se rompe. RSC por defecto, Client Component solo con interacción real.

| Regla | Implementación |
|-------|---------------|
| Valores nulos/undefined | Nunca mostrar al usuario. Mostrar fallback |
| Errores | Registrar con `logger.ts`. Mostrar mensaje amigable |
| Loading/Skeleton | Siempre presente en componentes de datos |
| Timeout/Offline | Mensaje claro + opción de reintentar |
| RSC por defecto | Minimizar `"use client"`. Solo cuando hay交互 real |

### V. Tipado Estricto & Validación

TypeScript estricto. Zod para validación de entrada.

| Regla | Implementación |
|-------|---------------|
| `strict: true` en tsconfig | Sin excepciones |
| Prohibido `any` | Sin justificación documentada |
| Zod schemas | Validación en Server Actions y APIs |
| Tipos centralizados | `types/` compartidos entre frontend y backend |

### VI. Pruebas & Calidad

Todo cambio debe estar respaldado por pruebas automatizadas.

| Tipo | Cobertura mínima |
|------|-----------------|
| Unit tests (vitest) | 40% statements, 30% branches |
| Integration tests | Flujos críticos (catalogo, wizard) |
| Security tests | RLS, RBAC, concurrencia |
| E2E (Playwright) | Flujos multi-paso |

Pre-commit: `tsc --noEmit` + `lint` + `vitest run` + `npm audit --audit-level=high`.

### VII. Reutilización (REUTILIZAR > EXTENDER > ADAPTAR > CREAR)

Antes de crear cualquier nueva entidad, auditoría de reutilización obligatoria.

| Regla | Implementación |
|-------|---------------|
| REUSE_ANALYSIS obligatorio | Antes de crear cualquier nueva entidad |
| Prohibido duplicar | Tablas, catálogos, estados, secuencias, roles |
| Prohibido crear UI desde cero | Si existe repositorio reutilizable |
| Auditar `docs/14_reutilizacion/` | Antes de toda decisión de construir |

### VIII. Backend Puro — Server Actions

Toda la lógica de negocio en Server Actions (`"use server"`). Sin API Routes tradicionales.

| Regla | Implementación |
|-------|---------------|
| Mutaciones vía Server Action | Prohibido fetch POST/PUT/DELETE desde cliente |
| Validación con Zod | Antes de cualquier operación de BD |
| Sanitización con `sanitizeObject` | Antes de responder al cliente |
| Logger estructurado | `logger.ts` — prohibido `console.*` |
| Timing en operaciones lentas | `startTimer()` — warning si >300ms |

### IX. Trazabilidad End-to-End & Remediación Antes de Expansión (NON-NEGOTIABLE)

El sistema opera como tres superficies conectadas por un flujo único: **Web pública → Portal de clientes → ERP interno**. Un lead capturado en la web debe poder rastrearse hasta convertirse en cliente, cotización, orden de trabajo, movimiento de inventario y factura en el ERP.

| Regla | Implementación |
|-------|---------------|
| Trazabilidad end-to-end obligatoria | Lead (web) → Cliente/Cotización (portal) → OT/Inventario/Factura (ERP) sin saltos ni datos huérfanos |
| Gaps 🔴 críticos bloquean features nuevas | Ningún módulo con gaps críticos abiertos (ver `GAP_ANALYSIS.md`) puede recibir funcionalidad nueva hasta cerrarlos |
| Consistencia funcional > velocidad de entrega | Ante conflicto entre "entregar rápido" y "mantener el flujo consistente", gana la consistencia |
| Toda corrección requiere artefactos | Mapa de módulos afectados + lista de flujos críticos impactados + tareas concretas (`/speckit.specify` → `/speckit.tasks`) antes de implementar |
| Excepción documentada | Si una feature nueva es indispensable pese a gaps abiertos, debe justificarse en Complexity Tracking del plan y aprobarse explícitamente |
| Compatibilidad arquitectónica | No cambiar el stack (Next.js + Supabase/Postgres) ni romper contratos externos existentes al corregir un gap |

**Rationale**: La auditoría retrospectiva (`GAP_ANALYSIS.md`, 2026-07-20) identificó 41 gaps — 12 críticos — que rompen la trazabilidad entre las 3 superficies (p. ej. P-001 cotizaciones ausentes en el portal, P-002 Wompi sin integrar, E-001 `registerPayment()` inexistente). Sin este principio, nuevas features seguirían apilándose sobre una base con fugas de datos y estados inconsistentes, contradiciendo la regla ya establecida en `specs/00_product/VISION.md`: "NO CONSTRUIR NADA SIN TRAZABILIDAD".

---

## SDD Workflow Constitution

### Feature Lifecycle

Toda nueva funcionalidad sigue el ciclo SDD:

```
/speckit.specify → spec.md (user stories + acceptance criteria)
/speckit.plan    → plan.md (tech stack + constitution check)
/speckit.tasks   → tasks.md (tareas ejecutables por fase)
/speckit.implement
/speckit.converge (validación contra spec/plan/tasks)
```

### Spec Format Requirements

Cada spec debe incluir:
- **User stories** con prioridad P1/P2/P3 y Given/When/Then
- **FR-001** numerados correlativamente
- **SC-001** Success Criteria medibles
- **Edge cases** documentados
- **Assumptions** explicitadas
- Sin `[NEEDS CLARIFICATION]` antes de implementar

### Plan Format Requirements

Cada plan debe incluir:
- **Constitution Check** — gates obligatorios antes de implementar
- **Technical Context** (lenguaje, dependencias, storage, testing)
- **Project Structure** específica
- **Complexity Tracking** — justificar desviaciones de la constitution

### Branch Naming Convention

```
<type>/<number>-<short-slug>
```

| Prefix | Uso |
|--------|-----|
| `feat/` | Nuevas funcionalidades |
| `fix/` | Corrección de bugs |
| `docs/` | Documentación |
| `chore/` | Mantenimiento, tooling, CI |

---

## Architecture & Security Constraints

### Stack Tecnológico (congelado)

| Capa | Tecnología |
|------|-----------|
| Runtime | Node.js 20+ |
| Framework | Next.js 16 (App Router) |
| Base de Datos | Supabase (PostgreSQL 14+) |
| Autenticación | Supabase Auth (JWT) |
| Estilos | Tailwind CSS v4 |
| Componentes | shadcn/ui + Radix UI |
| Formularios | React Hook Form + Zod |
| Tablas | TanStack React Table |
| PDF | jsPDF |
| Notificaciones | Sonner |
| Animación | Framer Motion |
| Testing | Vitest + Playwright |

### Contratos Externos (congelados)

| Integración | Uso | Regla |
|-------------|-----|-------|
| Wompi | Pasarela de pagos (portal) | Prohibido modificar payload/webhook sin plan de migración segura (versionado + rollback) |
| WhatsApp | Notificaciones / CRM | Prohibido cambiar formato de mensajes o endpoints sin plan de migración segura |
| Email (Resend/SMTP) | Notificaciones transaccionales | Prohibido cambiar proveedor o plantillas sin plan de migración segura |

Cambios al stack tecnológico congelado o a estos contratos externos requieren enmienda de esta constitución (`/speckit.constitution`), no solo aprobación de PR.

### White-Label

- Sistema de diseño propio con 3 niveles: primitives → semantic → component tokens
- 8 temas (4 light + 4 dark)
- Bridge tokens configurables desde CMS sin recompilar
- `useBranding()` hook para acceso en runtime

### Seguridad

- Autenticación: Supabase Auth con JWT + contexto de tenant
- RLS: Políticas obligatorias en todas las tablas operacionales
- RBAC: Roles y permisos dinámicos via `role_permissions`
- Rate limiting: Por IP y por ruta en middleware
- CSP: Headers de seguridad en `next.config.ts`
- Secretos: Solo en `.env.*` — prohibido hardcodear

---

## Testing Requirements

### Pre-commit Gates

```
1. npx tsc --noEmit          — Sin errores de tipo
2. npm run lint               — Sin errores de lint
3. npx vitest run             — Tests unitarios pasan
4. npm audit --audit-level=high — Sin vulnerabilidades
```

### Test Categories

| Categoría | FrameWork | Propósito |
|-----------|-----------|-----------|
| Unit (`src/tests/unit/`) | Vitest | Lógica de negocio, validación |
| Integration (`src/tests/integration/`) | Vitest | Flujos multi-paso |
| Security (`src/tests/security/`) | Vitest + Playwright | RLS, RBAC, concurrencia |
| E2E | Playwright | Flujos completos de usuario |

---

## Governance

**Jerarquía de autoridad documental:**

1. `specs/00_product/PRODUCT_CONSTITUTION.md` — 25 Decisiones Congeladas
2. `specs/00_product/TECHNICAL_CONSTITUTION.md` — 20 Pilares Técnicos
3. **Este documento** — Constitución SDD unificada
4. `docs/00_GOVERNANCE/AI_CONSTITUTION.md` — Reglas de IA
5. `specs/` — Documentos de especificación por módulo
6. `docs/` — Documentación de referencia

**Amendment process:**
- Cambios a principios NON-NEGOTIABLE requieren aprobación del equipo y actualización de todos los documentos dependientes
- Cambios menores requieren PR con justificación
- Todo cambio debe propagarse a templates y comandos SDD

**Compliance:**
- `/speckit.analyze` evalúa constitution compliance automáticamente
- Violaciones bloquean merge
- Desviaciones deben justificarse en Complexity Tracking del plan

**Artefactos de auditoría vigentes:**
- `GAP_ANALYSIS.md` (2026-07-20) es la fuente de verdad de gaps abiertos hasta que se cierren o se regenere el análisis. No sustituye la jerarquía documental anterior — es un artefacto operativo para priorizar remediación bajo el Principio IX.

**Version**: 1.1.0 | **Ratified**: 2026-07-20 | **Last Amended**: 2026-07-21
