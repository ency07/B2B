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
| W-001 | ✅ **CERRADO (2026-07-21, `feat/001-web-catalog-category-filter`)** — ~~Catálogo sin filtro por categoría~~. Filtro por subcategoría agregado (ver `specs/001-web-catalog-category-filter/`); de paso se corrigió un leak de productos soft-eliminados duplicados en `fetchRawCatalogFromDB`. | `EngineeringCapabilities.tsx`, `catalog.ts` | FR-003 |
| W-002 | ✅ **CERRADO (2026-07-23, `feat/006-web-criticos-w002-w003-w004`)** — ~~Chatbot no captura leads~~. La acción "Contactar a un ingeniero" (`go_contact`) ahora abre un formulario inline (email + teléfono opcional) que crea un lead real (`lead_source: "Chatbot Web"`, nuevo valor agregado al CHECK constraint junto a "Cotizador Web"). De paso: `go_catalog` ahora navega de verdad (antes era un botón muerto que solo cerraba el chat sin hacer nada), y se encontró y corrigió que `submitContactForm()` (formulario de contacto general) insertaba `lead_source: "WEBSITE"`, un valor que **nunca fue válido** — todo envío de ese formulario fallaba con una violación de constraint desde su creación. | `ChatbotWidget.tsx`, `leads.ts` | FR-009 |
| W-003 | ✅ **CERRADO (2026-07-23, `feat/006-web-criticos-w002-w003-w004`)** — ~~290 líneas de datos hardcodeados como fallback~~. Eliminadas (specs técnicos, certificaciones y referencias de proyecto fabricados, no reales). Si el catálogo real no devuelve productos, se muestra un estado honesto ("Catálogo temporalmente no disponible. Contáctenos...") en vez de fichas de producto inventadas — mismo patrón ya usado para el filtro sin resultados. | `EngineeringCapabilities.tsx` | FR-003 |
| W-004 | ✅ **CERRADO (2026-07-23, `feat/006-web-criticos-w002-w003-w004`)** — ~~ACH hardcodeados en SummaryStep~~. Confirmado que el riesgo de desincronización ya era real, no hipotético: `heavy_plant` mostraba 35 ACH pero el CFM en la misma pantalla se calculaba con 45; `data_center` mostraba 25 vs. 30 real; `warehouse` 12 vs. 8 real. Ambos puntos (`SummaryStep.tsx` y el PDF descargable en `WizardStepper.tsx`, que tenía la misma duplicación) ahora leen `getAchForEnvironment()` de `engineering.ts`. | `SummaryStep.tsx`, `WizardStepper.tsx` | FR-005 |

### 🟡 Altos

| ID | Hallazgo | Archivos | FR violado |
|----|----------|----------|------------|
| W-005 | ✅ **CERRADO (2026-07-23, `feat/007-web-portal-altos`)** — ~~Orden de pasos del Wizard no coincide con spec~~. Decisión del usuario: actualizar la spec para reflejar el código real (Service → Technical → Corporate) en vez de reordenar código probado en producción — preguntar la necesidad antes que los datos de contacto es un patrón de conversión establecido, y reordenar habría afectado validación por paso + las asociaciones `forWizardStep` del chatbot sin evidencia de que el orden anterior fuera la decisión correcta. Ver nota en `specs/web-existing/spec.md`. | `specs/web-existing/spec.md` | FR-005 |
| W-006 | ✅ **CERRADO (2026-07-23, `feat/007-web-portal-altos`)** — ~~No existe `tax_id` (RUC)~~. Campo opcional agregado a `CorporateInfoStep.tsx` (la columna `clients.tax_id` ya era nullable). De paso: la búsqueda de cliente existente en `submitWizardData()` ahora busca por `tax_id` primero cuando viene provisto — antes solo buscaba por `legal_name`, y como `clients` tiene `UNIQUE (tenant_id, tax_id)`, un envío con el mismo NIT bajo una razón social distinta habría chocado con un error crudo de constraint. | `CorporateInfoStep.tsx`, `wizard.ts` | FR-005 |
| W-007 | ✅ **YA CERRADO (sin cambios de código)** — `src/app/(marketing)/page.tsx` sí renderiza en `/`: los route groups de Next.js (carpetas entre paréntesis) no forman parte de la URL. Confirmado en cada `next build` de esta sesión (`┌ ƒ /` aparece consistentemente en la lista de rutas). El hallazgo original describía correctamente que `src/app/page.tsx` no existe, pero eso no significa que la ruta raíz esté vacía. | `src/app/(marketing)/page.tsx` | FR-001 |
| W-008 | ✅ **CERRADO (2026-07-23, `feat/007-web-portal-altos`)** — ~~Footer con links deshabilitados~~. Se crearon `/terminos`, `/cookies`, `/retie`. Cookies tiene contenido real (ya sabíamos, por `/privacidad`, que este sitio no usa cookies de rastreo). Términos y RETIE son páginas honestas de "contenido en preparación" con contacto — no se fabricó texto legal ni una certificación RETIE que no está confirmada, solo se cerró el link muerto. | `Footer.tsx`, `terminos/page.tsx`, `cookies/page.tsx`, `retie/page.tsx` | FR-010 |

### 🔵 Medios

| ID | Hallazgo |
|----|----------|
| W-009 | ✅ **CERRADO (2026-07-23, `feat/008-medios-observabilidad`)** — ~~`console.error()` en vez de `logger.error()`~~. Las 4 Server Actions (`wizard.ts`, `leads.ts`, `catalog.ts`, `branding.ts`) ahora usan `createLogger("web:<módulo>")` con contexto estructurado (`{data, error}`) en cada punto que antes era `console.error`. |
| W-010 | ✅ **CERRADO (2026-07-23, `feat/009-w010-tipado-web`)** — ~~`any` types extensivos en 9+ archivos del web~~. Revertida la decisión de diferir (ver historial: se había marcado ⏸️ en la ronda anterior; el usuario pidió retomarlo). En vez de generar tipos completos de Supabase (`Database`, alto riesgo por el volumen del cambio), se tiparon a mano las formas concretas realmente usadas — mismo enfoque que ya probó funcionar en E-016/E-017. Cadena del Wizard: nuevo `wizard/types.ts` (`WizardFormState`, `WizardSymptomsState`, `WizardFormChangeHandler`) reemplaza 5 declaraciones de `form: any` duplicadas/divergentes entre `WizardStepper.tsx` y sus 5 sub-componentes de paso; **bug real encontrado**: `WizardFormState` ya existía en `CorporateInfoStep.tsx` pero le faltaba el campo `altitude`, que `TechnicalAnalysisStep.tsx` sí usaba — nadie lo había notado porque `any` lo ocultaba. Cadena de branding: `Hero.tsx`/`Footer.tsx`/`EngineeringCapabilities.tsx`/`MarketingShell.tsx` ahora tipan `branding` como `BrandingConfig` (ya existía, nadie lo usaba) en vez de `any`/`Record<string,unknown>`, eliminando 8 casts `as {...}` ad-hoc en `MarketingShell.tsx` y un doble-cast (`as unknown as Record<string,unknown>`) en `(marketing)/page.tsx`. **Bug real encontrado**: `src/app/wizard/page.tsx` usaba `{}` (objeto vacío) como fallback si fallaba la carga de branding, no `getBrandingDefaults()` como sí hace la landing — un fallback silencioso que dejaba `WizardStepper` con un branding "vacío" disfrazado. `catalog.ts`: la jerarquía anidada de Supabase (categoría→subcategoría→familia→serie→producto→specs/imágenes) ahora tiene interfaces `Raw*` explícitas que documentan el `.select()` exacto, con un único cast justificado en el punto de entrada en vez de `any` disperso en cada `.map()`/`.filter()`. `branding.ts`: fila de `tenant_settings` tipada (`TenantSettingRow`), catch blocks migrados a `unknown` + `instanceof Error` (patrón ya usado en el resto del proyecto). También: iconos de `Disciplines.tsx`/`Sectors.tsx`/`ServiceSelectionStep.tsx` tipados como `LucideIcon` en vez de `React.ComponentType<any>`; interfaz `WizardStepperProps` muerta (nunca usada, confirmada por warning de eslint) eliminada. Verificado: tsc/eslint/vitest/build limpios contra el mismo baseline de siempre, más verificación en navegador (server logs 200 OK en `/` y `/wizard`, todos los chunks JS cargando, cero errores de consola — el Browser pane de este proyecto no permite interacción real, limitación ya documentada en rondas anteriores). Ver C-002. |
| W-011 | ✅ **CERRADO (2026-07-23, `feat/008-medios-observabilidad`)** — ~~Sin `startTimer()` en Server Actions~~. Agregado a las mismas 4 Server Actions de W-009: `getTenantBranding`, `getIndustrialCatalog` (interno, `fetchRawCatalogFromDB`), `createLeadWithScore`, `submitContactForm`, `submitChatbotLead`, `submitWizardData` — cada una mide su duración y loggea "Slow operation" si supera 300ms. |
| W-012 | ✅ **CERRADO (2026-07-23, `feat/010-w012-productos-refactor`)** — ~~Sección "Productos" embebida dentro de `EngineeringCapabilities.tsx` (484 líneas) en vez de componente separado~~. Revertida la decisión de diferir (el usuario pidió retomarlo). `ProductCard` y `TechnicalDetailModal` — antes funciones internas no exportadas de 55 y 220 líneas respectivamente — ahora son archivos propios (`ProductCard.tsx`, `TechnicalDetailModal.tsx`), siguiendo la misma convención de un-componente-por-archivo ya usada por el resto de `marketing-v2/` (`Hero.tsx`, `Footer.tsx`, etc.) y por la carpeta `primitives/` existente. `CapacityItem` y `statusColor`, compartidos por los 3, se movieron a un nuevo `product-types.ts` — **necesario, no cosmético**: exportarlos desde `EngineeringCapabilities.tsx` (que a su vez importa `ProductCard`/`TechnicalDetailModal`) habría creado un import circular de verdad (`statusColor` es un valor en runtime, no solo un tipo), con riesgo real de quedar `undefined` según el orden de evaluación de módulos de Turbopack. `EngineeringCapabilities.tsx` queda en ~200 líneas (antes 484), solo con la lógica de extracción del catálogo y el grid/filtro. Cero cambio de comportamiento: mismo JSX, mismos estilos, mismas props — código movido, no reescrito. Verificado: tsc/eslint/vitest/build limpios contra el baseline de siempre, y en navegador (chunk de `EngineeringCapabilities` con 200 OK junto al resto de secciones, cero errores de consola). |

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
| P-002 | ✅ **CERRADO en código (2026-07-22, `feat/003-portal-wompi-payments`)** — ~~Pasarela Wompi no integrada~~. Widget de checkout + webhook con verificación de firma + aplicación de pago implementados y probados de extremo a extremo con credenciales de prueba locales (firma, checksum, idempotencia, rechazo de firma inválida, camino DECLINED — todo verificado con peticiones HTTP reales, no solo revisión de código). **Pendiente**: cobro real de tarjeta contra los servidores de Wompi — requiere que el usuario registre una cuenta en `comercios.wompi.co` y agregue las llaves reales a `.env` (ver `specs/003-portal-wompi-payments/quickstart.md`). No marcar como 100% verificado hasta esa prueba. | FR-004 |

### 🟡 Altos

| ID | Hallazgo | FR violado |
|----|----------|------------|
| P-003 | ✅ **CERRADO (2026-07-23, `feat/007-web-portal-altos`)** — ~~Dark mode disponible en portal~~. Se quitó el tab "Apariencia" de `ClientProfileModal.tsx`, y se encontró que el gap era más amplio que el modal: `DesignSystemProvider` en `portal/page.tsx` no fijaba tema, así que cualquier visitante con `prefers-color-scheme: dark` en su sistema ya veía el portal en oscuro desde la primera visita, sin haber tocado ningún toggle. Ahora `initialThemeId="minimal-white"` fuerza modo claro sin importar localStorage o preferencia del sistema. | `ClientProfileModal.tsx`, `portal/page.tsx` | FR-007 |
| P-004 | ✅ **CERRADO — alcance reducido, decisión del usuario (2026-07-23, `feat/007-web-portal-altos`)** — ~~Perfil de contacto solo lectura~~. Se agregó edición del nombre del CONTACTO (persona) — distinto del nombre de la empresa/NIT, que el modal usaba antes por error para los 3 campos y quedan de solo lectura a propósito (son datos legales/de facturación de la empresa). Email tampoco es editable: es también la credencial de login de Supabase Auth y cambiarlo sin un flujo de reverificación abriría un hueco de seguridad — decisión explícita de no implementarlo esta ronda. Hallazgo al implementar: no existía ninguna política RLS que permitiera a un contacto de portal actualizar su propia fila en `client_contacts` — se agregó una nueva (`cc_self_update`), acompañada de un trigger que hace `auth_user_id`/`tenant_id` inmutables sin importar quién escriba, para que la política nueva no abra una vía para que un contacto cambie de tenant o de cuenta de login vía una llamada cruda a la API. | `ClientProfileModal.tsx`, `profile.ts` | FR-006 |
| P-005 | ✅ **CERRADO (2026-07-23, `feat/007-web-portal-altos`)** — ~~Sin plan de contingencia para Wompi caído~~. El mensaje ahora da pasos concretos y numerados (contactar por email/teléfono, mencionar el número de factura y saldo ya visibles en pantalla, esperar confirmación) en vez de la frase genérica "coordina con tu ejecutivo". No se inventaron canales de pago alternativos (transferencia, link manual) que no están confirmados como reales. | `InvoicesSection.tsx` | FR-004 |

### 🔵 Medios

| ID | Hallazgo |
|----|----------|
| P-006 | ✅ **CERRADO (2026-07-23, `feat/008-medios-observabilidad`)** — ~~Login del portal no es ruta independiente~~. Se creó `/portal/login` (renderiza `PortalLoginFeature` directo, sin pasar por la detección de contexto de `/login`). `ROUTES.PORTAL_LOGIN` existía solo como referencia en un comentario que decía explícitamente "no es una ruta real" — ahora es una constante real. El redirect interno de `/portal` (sin sesión) se deja apuntando a `/login?redirect=/portal`, que ya funcionaba correctamente vía `detectLoginContext()`; la ruta nueva es para enlaces externos/marketing que quieran ir directo al login del portal. |
| P-007 | ✅ **CERRADO (2026-07-23, `feat/008-medios-observabilidad`)** — ~~PDF de factura no es recibo oficial del gateway~~. El PDF client-side (`usePortalClientState.ts`) ahora se titula "Resumen de Factura" (antes "Factura:", fácil de confundir con la factura electrónica) y agrega un disclaimer explícito: no lleva CUFE/QR/resolución DIAN, no es la factura electrónica oficial, y remite al ejecutivo comercial para el documento fiscal real. No se implementó facturación electrónica DIAN real — fuera de alcance de este gap, que era de honestidad en el etiquetado, no de funcionalidad nueva. |
| P-008 | ✅ **VERIFICADO — sin cambios de código (2026-07-23)** — Notificaciones vía Resend/Slack/Discord dependen de configuración externa. Revisado `notifications.ts` a fondo: cuando falta la config, cada función loggea la razón exacta y retorna `{ok:true}` (la notificación es un canal secundario; el ticket/mensaje/respuesta ya se guardó en BD antes de intentar notificar). Los 4 call sites (`quotes.ts`, `portal.ts`) invocan estas funciones de forma fire-and-forget con `.catch()`, después de que la escritura principal ya tuvo éxito — un fallo o ausencia de notificación nunca bloquea ni revierte la acción del usuario. Es degradación controlada correcta, igual que P-005 (Wompi caído); solo necesitaba configurarse `RESEND_API_KEY`/`SLACK_WEBHOOK_URL`/`DISCORD_WEBHOOK_URL` en producción para activarse, lo cual es una tarea operativa, no un defecto de código. |

---

## 4. Constitution Violations

### NON-NEGOTIABLE

| ID | Principio | Violación | Módulo |
|----|-----------|-----------|--------|
| C-001 | Pilar VIII — Logger estructurado | 🟡 **PARCIAL (2026-07-23)** — ~~`console.error()` en vez de `logger.error()`~~. Cerrado para **Web** (ver W-009: `wizard.ts`, `leads.ts`, `catalog.ts`, `branding.ts`). **ERP sigue abierto**: 9 archivos en `src/erp` todavía usan `console.*` directo, 0 usan `createLogger` (confirmado por grep). No estaba nombrado por ningún gap específico de la sección ERP — se documenta aquí en vez de asumirlo cerrado. | Web ✅ / ERP ❌ |
| C-002 | Pilar VI — Tipado estricto | ✅ **CERRADO (2026-07-23, `feat/009-w010-tipado-web`)** — ver W-010 arriba para el detalle completo. Los 10 archivos originalmente marcados con `eslint-disable @typescript-eslint/no-explicit-any` ya no lo tienen; la cadena completa (wizard + marketing/branding + las 2 Server Actions) type-checkea sin `any`. | Web |
| C-003 | Pilar IV — UI Defensiva | ✅ **CERRADO (2026-07-23, `feat/008-medios-observabilidad`)** — ~~Sin timeout handling en wizard~~. `handleSubmit` en `WizardStepper.tsx` envuelve `submitWizardData()` en un `Promise.race` con timeout de 20s: si el servidor no responde, el usuario ve un error claro en vez de un botón deshabilitado indefinidamente. | Web |
| C-004 | Pilar VII — Reutilización | ✅ **YA CERRADO (2026-07-23, `feat/006-web-criticos-w002-w003-w004`)** — ~~ACH hardcodeados~~. Mismo hallazgo que W-004 (ver arriba): `SummaryStep.tsx` y el PDF de `WizardStepper.tsx` ya leen `getAchForEnvironment()`. No requirió trabajo nuevo esta ronda, solo faltaba reflejarlo aquí. | Web |
| C-005 | Pilar VIII — Timing | 🟡 **PARCIAL (2026-07-23)** — ~~Sin `startTimer()` en Server Actions lentas~~. Cerrado para **Web** (ver W-011). **ERP sigue sin instrumentar** (mismos 9 archivos de C-001). | Web ✅ / ERP ❌ |
| C-006 | Portal FR-007 — Modo claro | ✅ **YA CERRADO (2026-07-23, `feat/007-web-portal-altos`)** — ~~Dark mode toggle pese a spec~~. Mismo hallazgo que P-003 (ver arriba): tab "Apariencia" eliminado + `initialThemeId="minimal-white"` fuerza modo claro real. No requirió trabajo nuevo esta ronda. | Portal |

### Recomendaciones

| ID | Recomendación |
|----|---------------|
| C-007 | 🟡 Migrar todos los `console.error` a `logger.error` con tag de módulo — hecho en Web (C-001), pendiente en ERP (9 archivos) |
| C-008 | ✅ Eliminar `eslint-disable any` y tipar correctamente — hecho (C-002/W-010) |
| C-009 | ✅ Centralizar ACH en `ACH_BY_ENVIRONMENT` y eliminar hardcode — hecho (C-004/W-004) |
| C-010 | 🟡 Agregar `startTimer()` en Server Actions con warning >300ms — hecho en Web (C-005), pendiente en ERP |
| C-011 | ✅ Remover toggle dark mode del portal o actualizar spec — se removió el toggle (C-006/P-003) |

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
P1-06: ✅ CERRADO EN CÓDIGO (2026-07-22, `feat/003-portal-wompi-payments`) — Widget + webhook Wompi, probado con credenciales de prueba locales; falta prueba de cobro real (ver detalle arriba en P-002)
```

**Estado tras la fusión de `feat/001`, `feat/002`, `feat/003` y `fix/004` a `main` (2026-07-23)**: de
los 6 gaps P1 originales, los 6 están cerrados en código. P1-06 (Wompi/PSE) es el único con una
verificación pendiente que no depende de código: cobro real contra `comercios.wompi.co` con
credenciales reales (ver P-002 arriba). Ver además **E-016** abajo — un gap crítico de seguridad
encontrado durante la remediación, no parte del análisis original de 41 gaps, ya cerrado por
completo (rama `fix/005-erp-remaining-write-paths`).

### Gap crítico adicional encontrado en remediación (no estaba en el análisis original)

```
E-016: ✅ CERRADO (2026-07-23, ramas fix/004 y fix/005-erp-remaining-write-paths) — Puente de
       identidad roto entre Server Actions (requireAction/getAuthContext) y las
       escrituras vía supabaseAdmin (service_role sin auth.uid()). Los triggers
       enforce_*_permissions rechazan (o rechazarían, si is_platform_super_admin()
       no cortocircuitara con session_user='postgres' en pruebas) toda escritura
       real. Mecanismo genérico (get_current_user_id() + set_erp_actor_context())
       corrige las 16 tablas de un solo golpe a nivel de resolución de identidad.
       Confirmado por grep exhaustivo de src/ (no solo core.ts) que solo 5 tablas
       tenían escritura real fuera de payments/invoices/inventory_items: jobs,
       credit_notes, requirements, quotes, inventory_movements (2º insert). Las
       otras 6 originalmente listadas como pendientes (warehouses,
       inventory_batches, inventory_serials, approval_flows, approval_rules,
       approval_steps) NO tienen ningún punto de escritura en toda la app — no
       hay código que romper ni que arreglar para ellas hoy (warehouses solo
       tiene 4 filas de seed; las otras 5 están vacías). Los 9 call sites reales
       quedaron envueltos en 8 RPCs bridged (create_job_bridged,
       update_job_status_bridged, create_inventory_movement_bridged,
       create_credit_note_bridged, create_requirement_bridged,
       update_requirement_status_bridged — compartido por updateRequirementStatus()
       y convertQuoteToJob(), create_quote_bridged, update_quote_status_bridged),
       cada uno verificado con datos reales antes de tocar TypeScript.

       Dos bugs reales, preexistentes y ajenos a la identidad, encontrados durante
       esa verificación (ninguno hipotético — ambos reproducidos):
       (a) createCreditNote() insertaba status='APLICADA', que NUNCA fue un valor
           válido para credit_notes.status (CHECK solo permite EMITIDA/ANULADA) —
           toda nota crédito fallaba con violación de constraint, no con "Permiso
           Denegado". Corregido a 'EMITIDA'.
       (b) createInventoryMovement() leía la columna inventory_items.purchase_price,
           que no existe (las reales son average_cost/last_cost) — todo registro
           de movimiento de inventario fallaba de entrada. Corregido a average_cost.
       (c) createQuote() marcaba requirementId como opcional (TS y Zod) pese a que
           quotes.requirement_id es NOT NULL en la base, y convertQuoteToJob() ya
           exige que exista — un envío sin requerimiento seleccionado llegaba
           hasta el INSERT y fallaba con un error crudo de Postgres. Corregido:
           requirementId ahora requerido en el schema Zod (servidor y formulario).
```

### E-017: hardening de grants (encontrado y cerrado en la misma remediación)

```
E-017: ✅ CERRADO (2026-07-23, rama fix/004-server-action-identity-bridge) — REVOKE ALL FROM
       PUBLIC no quita los grants automáticos de Supabase a anon/authenticated en la creación de
       una función (mismo patrón detrás del hueco real de wompi_confirm_payment, ya cerrado en
       P-002). Barrido de las 41 funciones no-trigger del esquema public con
       information_schema.routine_privileges: 12 RPCs del portal + 8 helpers de identidad
       dejados solo en authenticated/service_role (defensa en profundidad, ya fallaban cerrado);
       15 helpers internos (calculate_kpi, get_tenant_setting, execute_automation_rules,
       dispatch_notification_to_route, update_item_costs, set_tenant_setting, etc.) confirmados
       sin llamador desde el browser y sin verificación de identidad interna — alcanzables antes
       vía PostgREST directo con la anon key pública — bloqueados a service_role. Hallazgo aparte:
       resolve_approval_step tenía un bug real de comparación con NULL
       (`v_step.user_id <> v_user_id` con v_user_id NULL da NULL, no TRUE, y `IF NULL THEN` no
       dispara en PL/pgSQL) que dejaba aprobar/rechazar cualquier paso de aprobación sin
       autorización real — arreglado. 4 RPCs sin llamador confirmado en todo el repo
       (wizard_submit_atomic, get_white_label_config, get_my_white_label_config,
       is_active_tenant) bloqueadas a service_role por precaución. Verificado: cero grants
       anon/PUBLIC restantes en funciones no-trigger. NOTA aparte no resuelta: get_tenant_setting
       descifra valores is_encrypted con una passphrase de respaldo hardcodeada en el código
       fuente cuando el GUC app.settings_secret_key no está configurado (no lo está hoy); sin
       datos en riesgo todavía (0 filas is_encrypted=true), pero antes de guardar cualquier
       secreto real ahí hace falta decidir de dónde sale la clave real.
```

---

### Ronda de los 13 medios (2026-07-23, rama `feat/008-medios-observabilidad`)

```
De los 13 gaps 🔵 medios abiertos tras cerrar los 12 críticos + 12 altos (W-009 a W-012,
P-006 a P-008, C-001 a C-006), el resultado de esta ronda:

CERRADOS con código nuevo (6): W-009, W-011, C-003, P-006, P-007 — más C-001/C-005
parcialmente (ver abajo).
VERIFICADOS sin cambios de código, ya correctos (1): P-008.
YA CERRADOS por rondas anteriores, solo faltaba documentarlo (2): C-004 (= W-004),
C-006 (= P-003).
PARCIALES, cerrados solo en Web (2): C-001, C-005 — ERP (9 archivos) queda pendiente,
no tenía un gap propio nombrado en la sección ERP y no se asumió su cierre sin evidencia.
DIFERIDOS a propósito, con razón documentada (2): W-010/C-002 (any-typing, refactor de
alto volumen y riesgo sin bug detrás), W-012 (reorganización de componente sin defecto
funcional).

De los 41 gaps originales del análisis: 12 críticos cerrados, 12 altos cerrados, y de los
17 medios (13 + 4 de ERP ya cerrados antes de esta remediación) quedan abiertos solo:
W-010/C-002, W-012, y la mitad ERP de C-001/C-005. Ninguno bloquea funcionalidad ni
representa un riesgo de datos — son deuda de tipado y de organización de código.
```

---

### W-010 retomado (2026-07-23, rama `feat/009-w010-tipado-web`)

```
El usuario pidió retomar W-010/C-002 (any-typing), diferido en la ronda anterior. Se tipó
a mano (no se generaron tipos completos de Supabase) la forma real de los datos en los 10
archivos originalmente señalados, más 4 archivos adicionales alcanzados por el efecto
cascada (MarketingShell.tsx, (marketing)/page.tsx, wizard/page.tsx, SuccessStep.tsx) — no
tenían `any` propio, pero tipar sus vecinos exigía tiparlos también para no romper el build.

Dos bugs reales encontrados por el camino, ambos ocultos hasta ahora por `any`:
(a) WizardFormState (ya existía en CorporateInfoStep.tsx) no incluía `altitude`, pese a que
    TechnicalAnalysisStep.tsx sí lee/escribe form.altitude — nadie lo había notado.
(b) wizard/page.tsx usaba `{}` como branding de respaldo si fallaba la carga (no
    getBrandingDefaults(), como sí hace la landing) — un fallback silencioso que dejaba
    WizardStepper con un branding vacío disfrazado de válido.

Verificado: tsc/eslint/vitest/build limpios contra el baseline de siempre (0 errores
nuevos), 0 usos de `any` restantes en los 14 archivos tocados (confirmado por grep), y
verificación en navegador — server logs 200 OK en `/` y `/wizard`, todos los chunks JS de
marketing-v2 y wizard cargando sin 404/500, cero errores de consola, timing/logger de la
ronda anterior funcionando en vivo con datos reales. El Browser pane de este proyecto no
permite interacción real (clicks, lectura de página) — limitación ya documentada en las
rondas W-001 y P-001, no un problema de esta ronda.

C-002 y W-010 pasan de ⏸️ DIFERIDO a ✅ CERRADO. De los 41 gaps originales, solo quedan
abiertos: W-012 (diferido a propósito, sin cambios) y la mitad ERP de C-001/C-005.
```

---

### W-012 retomado (2026-07-23, rama `feat/010-w012-productos-refactor`)

```
El usuario pidió retomar W-012, diferido dos rondas atrás. Refactor puro de organización
de código, sin cambio de comportamiento: ProductCard y TechnicalDetailModal (funciones
internas de EngineeringCapabilities.tsx, 55 y 220 líneas) pasan a ser archivos propios,
más un product-types.ts nuevo para CapacityItem/statusColor compartidos entre los 3.

La razón de mover los tipos a un archivo aparte no fue estética: exportarlos desde
EngineeringCapabilities.tsx (que importa ProductCard/TechnicalDetailModal) habría creado
un import circular real — statusColor es un valor de runtime, no solo un tipo, así que el
ciclo podía dejarlo undefined según el orden de evaluación de módulos de Turbopack. Se
detectó antes de verificar, no en producción.

EngineeringCapabilities.tsx queda en ~200 líneas (antes 484). Verificado: tsc/eslint/
vitest/build limpios contra el baseline de siempre, y en navegador (el chunk de
EngineeringCapabilities, que ahora empaqueta los 3 archivos vía Turbopack, carga 200 OK
junto al resto de secciones de la landing, cero errores de consola).

W-012 pasa de ⏸️ DIFERIDO a ✅ CERRADO. De los 41 gaps originales, solo queda abierta la
mitad ERP de C-001/C-005 (logger/timing en 9 archivos de src/erp, sin gap propio que los
nombrara en la sección ERP del análisis original).
```

---

*Generado con spec-kit (SDD) — Julio 2026*
