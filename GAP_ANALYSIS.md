# Gap Analysis — AeroMax Industrial ERP

**Fecha**: 2026-07-20 (última verificación de estado: 2026-07-21)
**Metodología**: Spec-Driven Development (SDD) vía spec-kit
**Alcance**: Web, ERP, Portal, Seguridad, Base de Datos — análisis retrospectivo spec vs. código

> **Actualización 2026-07-21**: se re-auditó el estado real del código contra este documento antes
> de iniciar la remediación (Principio IX de la constitución — no duplicar trabajo ya hecho). Todos
> los gaps **E-001 a E-015** (módulo ERP) ya estaban cerrados por commits posteriores a este análisis
> (`registerPayment`, `updateJobStatus`/FACTURADA-CERRADO, `createCreditNote`, `approvePurchaseOrder`,
> emisión de `business_events`, dunning, CRM pipeline, quote-to-job, Client 360, alertas de reorden
> reales, `deleteEntity()` genérico, IVA/método de pago configurables, mirror a `audit_log`). Ver
> `git log --oneline -- src/erp/actions/core.ts` para el detalle. La sección ERP se deja abajo como
> registro histórico pero **no representa el estado actual** — no relanzar `/speckit.specify` sobre
> estos IDs sin re-verificar primero. Los gaps de **Web** (W-001 a W-012) y **Portal** (P-001 a P-008)
> siguen abiertos salvo que se indique lo contrario.

---

## Leyenda

| Símbolo | Significado |
|---------|-------------|
| 🔴 **Crítico** | Bloquea funcionalidad core. Sin workaround. |
| 🟡 **Alto** | Funcionalidad parcial o incorrecta. Afecta experiencia. |
| 🔵 **Medio** | Mejora necesaria. No bloquea pero reduce calidad. |
| ⚪ **Bajo** | Cosmético o nice-to-have. |

---

## 1. Módulo Web Público

### 🔴 Críticos

| ID | Hallazgo | Archivos | FR violado |
|----|----------|----------|------------|
| W-001 | **Catálogo sin filtro por categoría**. Los 9 productos se muestran en grilla estática sin selector de tipo de ventilador. | `EngineeringCapabilities.tsx` | FR-003 |
| W-002 | **Chatbot no captura leads**. Solo es ayuda contextual. No persiste datos ni crea entradas en BD. | `ChatbotWidget.tsx` | FR-009 |
| W-003 | **290 líneas de datos hardcodeados como fallback** en catálogo. Si la BD falla, se usan datos estáticos inconsistentes. | `EngineeringCapabilities.tsx` | FR-003 |
| W-004 | **ACH hardcodeados en SummaryStep** en vez de leer de `ACH_BY_ENVIRONMENT` en `engineering.ts`. Riesgo de desincronización. | `SummaryStep.tsx:26-34` | FR-005 |

### 🟡 Altos

| ID | Hallazgo | Archivos | FR violado |
|----|----------|----------|------------|
| W-005 | **Orden de pasos del Wizard no coincide con spec**. Spec dice: Corporate → Service → Technical. Código: Service → Technical → Corporate. | `wizard/page.tsx`, spec.md | FR-005 |
| W-006 | **No existe `tax_id` (RUC)** en formulario del wizard a pesar de que el spec lo menciona. | `CorporateInfoStep.tsx` | FR-005 |
| W-007 | **Landing page no está en la raíz**. `src/app/page.tsx` no existe. La ruta raíz no renderiza contenido. | `src/app/(marketing)/page.tsx` | FR-001 |
| W-008 | **Footer con links deshabilitados**: "Términos", "Cookies", "RETIE" con `cursor-not-allowed`. No redirigen. | `Footer.tsx` | FR-010 |

### 🔵 Medios

| ID | Hallazgo |
|----|----------|
| W-009 | `console.error()` en vez de `logger.error()` en `wizard.ts`, `leads.ts`, `catalog.ts`, `branding.ts` (viola Constitution Pilar VIII) |
| W-010 | `any` types extensivos con `eslint-disable @typescript-eslint/no-explicit-any` en 9+ archivos del web |
| W-011 | Sin `startTimer()` de timing.ts en Server Actions (viola Constitution) |
| W-012 | Sección "Productos" embebida dentro de EngineeringCapabilities en vez de componente separado |

---

## 2. Módulo ERP Core

### 🔴 Críticos

| ID | Hallazgo | Archivos | FR violado |
|----|----------|----------|------------|
| E-001 | **No existe `registerPayment()`**. El flujo de facturación no puede completarse (pago no se registra). | `src/erp/actions/core.ts` | FR-006 |
| E-002 | **No existe `completeJob()` / `closeJob()`**. El ciclo de vida de OT está incompleto. | `src/erp/actions/core.ts` | FR-003 |
| E-003 | **No existe `createCreditNote()`**. Notas de crédito no implementadas. | — | FR-006 |
| E-004 | **Flujo de aprobación de compras no implementado**. El módulo de compras carece de su funcionalidad core. | `src/erp/actions/` | FR-005 |
| E-005 | **`business_events` solo lectura**. El Pulse Feed del dashboard lee eventos pero ninguna Server Action escribe. | `dashboard.ts`, `core.ts` | FR-008 |
| E-006 | **Dunning no implementado**. Estado VENCIDA nunca se auto-asigna. No hay cobranza automática. | — | FR-006 |

### 🟡 Altos

| ID | Hallazgo | Archivos | FR violado |
|----|----------|----------|------------|
| E-007 | **CRM pipeline no automatizado**: Lead → CALIFICADO no crea oportunidad automática ni notifica. | `leads-erp.ts` | FR-002 |
| E-008 | **Quote-to-Job no implementado**: No hay acción para convertir cotización aprobada en OT. | `quotes.ts`, `core.ts` | FR-003 |
| E-009 | **Client 360 con placeholders**: tabs de Cotizaciones, Facturas, Órdenes son placeholders. | `client-detail.tsx` | FR-002 |
| E-010 | **Alertas de reorden con threshold hardcodeado (10 unidades)** en vez de usar `minimum_stock` por producto. | `kpis.ts` | FR-004 |
| E-011 | **Estado FACTURADA en OT no existe**. Solo PENDIENTE, EN_EJECUCION, COMPLETADA. | `core.ts` | FR-003 |

### 🔵 Medios

| ID | Hallazgo |
|----|----------|
| E-012 | Sin Server Action centralizada de soft-delete (`deleteEntity()`) |
| E-013 | 19% IVA hardcodeado en componente Receipt, no configurable por tenant |
| E-014 | `audit_logs` solo escribe eventos de auth, no de negocio |
| E-015 | Sin método de pago configurable (hardcodeado en receipt) |

---

## 3. Módulo Portal de Clientes

### 🔴 Críticos

| ID | Hallazgo | FR violado |
|----|----------|------------|
| P-001 | ✅ **CERRADO (2026-07-21, `feat/002-portal-client-quotes`)** — ~~Cotizaciones completamente ausentes~~. Lista, detalle, respuesta (aceptar/rechazar) y PDF agregados (ver `specs/002-portal-client-quotes/`). Reutiliza `quotes`/`quote_items` ya existentes en el ERP — no se creó una entidad `ClientQuote` nueva. La respuesta del cliente se registra por separado de `status` (motor de aprobación interno ya en producción exige rol Gerencia/Dirección Comercial para aprobar/rechazar — decisión confirmada con el usuario, ver spec.md). | FR-003 |
| P-002 | **Pasarela Wompi no integrada**. Código comenta explícitamente "sin gateway conectado". Clientes no pueden pagar en línea. | FR-004 |

### 🟡 Altos

| ID | Hallazgo | FR violado |
|----|----------|------------|
| P-003 | **FR-007 violado**: Dark mode disponible en portal. Spec dice "modo claro SIEMPRE". `ClientProfileModal.tsx` incluye toggle light/dark. | FR-007 |
| P-004 | **Perfil de contacto solo lectura**. Clientes no pueden editar nombre/email desde el portal. | FR-006 |
| P-005 | **Sin plan de contingencia para Wompi caído**. Mensaje actual "coordina con ejecutivo" no es un plan formal. | FR-004 |

### 🔵 Medios

| ID | Hallazgo |
|----|----------|
| P-006 | Login del portal no es ruta independiente (`/portal/login` no existe). Usa `/login` genérico. |
| P-007 | PDF de factura se genera client-side con jsPDF. No es recibo oficial del gateway. |
| P-008 | Notificaciones vía Resend/Slack/Discord dependen de configuración externa. Sin configuración, solo `console.log`. |

---

## 4. Constitution Violations

### NON-NEGOTIABLE

| ID | Principio | Violación | Módulo |
|----|-----------|-----------|--------|
| C-001 | Pilar VIII — Logger estructurado | `console.error()` en vez de `logger.error()` | Web, ERP |
| C-002 | Pilar VI — Tipado estricto | `eslint-disable @typescript-eslint/no-explicit-any` en 9+ archivos | Web |
| C-003 | Pilar IV — UI Defensiva | Sin timeout handling en wizard | Web |
| C-004 | Pilar VII — Reutilización | ACH hardcodeados en vez de reutilizar `ACH_BY_ENVIRONMENT` | Web |
| C-005 | Pilar VIII — Timing | Sin `startTimer()` en Server Actions lentas | Web, ERP |
| C-006 | Portal FR-007 — Modo claro | Dark mode toggle implementado pese a spec explícito | Portal |

### Recomendaciones

| ID | Recomendación |
|----|---------------|
| C-007 | Migrar todos los `console.error` a `logger.error` con tag de módulo |
| C-008 | Eliminar `eslint-disable any` y tipar correctamente |
| C-009 | Centralizar ACH en `ACH_BY_ENVIRONMENT` y eliminar hardcode |
| C-010 | Agregar `startTimer()` en Server Actions con warning >300ms |
| C-011 | Remover toggle dark mode del portal o actualizar spec si se decide soportarlo |

---

## 5. Resumen Cuantitativo

| Módulo | 🔴 Críticos | 🟡 Altos | 🔵 Medios | ⚪ Bajos | Total |
|--------|-------------|----------|-----------|----------|-------|
| **Web** | 4 | 4 | 4 | 0 | **12** |
| **ERP** | 6 | 5 | 4 | 0 | **15** |
| **Portal** | 2 | 3 | 3 | 0 | **8** |
| **Constitution** | — | — | 6 | 0 | **6** |
| **TOTAL** | **12** | **12** | **17** | **0** | **41** |

### Prioridad de remediación

| Prioridad | Gaps | Esfuerzo estimado |
|-----------|------|-------------------|
| **P1 — Inmediata** (bloquea core) | 12 críticos | 15-20 días |
| **P2 — Corto plazo** (mejora significativa) | 12 altos | 10-15 días |
| **P3 — Medio plazo** (calidad) | 17 medios | 8-12 días |

---

## 6. Próximos Pasos con spec-kit

Cada gap identificado puede abordarse con el ciclo SDD:

```
Para cada uno de los 12 gaps críticos:

1. /speckit.specify "Corregir: [descripción del gap]"
2. /speckit.plan "Stack actual: Next.js 16 + Supabase + TypeScript"
3. /speckit.tasks
4. /speckit.implement
5. /speckit.converge  (validar que el gap se cerró)
```

### Gaps prioritarios para remediación inmediata:

```
P1-01: ✅ CERRADO (2026-07-21) — registerPayment() en ERP Core
P1-02: ✅ CERRADO (2026-07-21) — cierre de OT vía updateJobStatus (FACTURADA/CERRADO)
P1-03: ✅ CERRADO (2026-07-21) — filtro por subcategoría en catálogo web (feat/001-web-catalog-category-filter)
P1-04: ✅ CERRADO (2026-07-21) — cotizaciones en Portal Cliente: lista, detalle, respuesta, PDF (feat/002-portal-client-quotes; NO CRUD completo — ver nota de diseño en GAP P-001 arriba)
P1-05: ✅ CERRADO (2026-07-21) — approvePurchaseOrder() en ERP Core
P1-06: 🔴 ABIERTO — /speckit.specify "Integrar Wompi/PSE en Portal Cliente - Pasarela de pagos con webhook y actualización de estado"
```

**Estado tras esta sesión**: de los 6 gaps P1 originales, solo **P1-06 (Wompi/PSE)** sigue abierto.

---

*Generado con spec-kit (SDD) — Julio 2026*
