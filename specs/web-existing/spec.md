# Feature Specification: Web Public Site (Landing + Catalog + Wizard)

**Feature Branch**: `existing/web-public-site`

**Status**: Implemented (retrospective spec)

## User Scenarios & Testing

### User Story 1 - Landing Page Conversion Funnel (Priority: P1)

El visitante llega a la landing y recorre el arco: ATRAER → CONECTAR → CONVENCER → DEMOSTRAR → CONVERTIR.

**Acceptance Scenarios**:

1. **Given** un visitante nuevo, **When** carga la landing, **Then** ve Hero con video/imagen industrial impactante y navbar sticky
2. **Given** el visitante hace scroll, **When** pasa por las secciones, **Then** ve: TrustBar → Problema → Solución → Sectores → Servicios → Productos → Casos → Proceso → Calculadora CFM → CTA → Footer
3. **Given** el visitante en móvil, **When** navega, **Then** el layout es responsive con menú hamburguesa
4. **Given** cualquier sección con datos, **When** hay error/loading, **Then** muestra skeleton o estado vacío (UI Defensiva)

### User Story 2 - Catálogo de Productos Técnicos (Priority: P1)

El visitante explora productos industriales con fichas técnicas, no tienda.

**Acceptance Scenarios**:

1. **Given** un visitante en la sección de productos, **When** hace clic en una categoría, **Then** filtra productos por tipo (ventiladores axiales, centrifugos, extractores, etc.)
2. **Given** un visitante ve una ficha de producto, **When** hace clic en "Ver más", **Then** muestra detalles técnicos (CFM, RPM, dB, peso, dimensiones)
3. **Given** datos de catálogo, **When** se cargan desde Supabase, **Then** se renderizan con Server Components y caché

### User Story 3 - Wizard Multi-Step de Leads (Priority: P1)

El visitante completa un formulario multi-step para recibir diagnóstico y cotización.

**Acceptance Scenarios**:

> **Nota (2026-07-23, cierre de W-005)**: el orden de pasos de esta spec se
> actualizó para reflejar el código real (Service → Technical → Corporate),
> en vez de reordenar el código para que coincida con la versión anterior de
> esta spec (Corporate → Service → Technical). Decisión del usuario:
> preguntar por la necesidad del visitante ANTES de pedirle sus datos de
> contacto es un patrón de conversión establecido, y reordenar el código
> habría sido invasivo (afecta validación por paso y las asociaciones
> `forWizardStep` del chatbot) sin evidencia de que el orden anterior de la
> spec fuera la decisión correcta.

1. **Given** un visitante inicia el wizard, **When** completa Step 1 (Service Selection), **Then** valida el tipo de servicio y prioridad antes de avanzar
2. **Given** el Step 2 (Technical Analysis), **When** ingresa dimensiones y entorno, **Then** calcula CFM requerido en vivo usando `engineering.ts`
3. **Given** el Step 3 (Corporate Info), **When** completa sus datos, **Then** valida nombre, empresa, NIT (opcional), email y teléfono con Zod antes de avanzar
4. **Given** el Step 4 (Summary), **When** revisa y confirma, **Then** envía via `submitWizardData()` → crea Client + Contact + Lead + Diagnostic Report
5. **Given** el Step 5 (Success), **When** la cotización se envía, **Then** muestra confirmación con número de seguimiento

### User Story 4 - Calculadora CFM (Priority: P2)

El visitante calcula requerimientos de ventilación en vivo desde la landing.

**Acceptance Scenarios**:

1. **Given** un visitante en la calculadora, **When** ingresa dimensiones y tipo de ambiente, **Then** calcula CFM necesario en tiempo real
2. **Given** el cálculo completado, **When** el visitante hace clic en "Cotizar", **Then** redirige al wizard con datos precargados

### User Story 5 - Chatbot / CTA Flotante (Priority: P3)

**Acceptance Scenarios**:

1. **Given** un visitante en cualquier página, **When** hace clic en el CTA flotante, **Then** muestra opciones de contacto
2. **Given** el chatbot widget, **When** el visitante envía un mensaje, **Then** registra el lead

### Edge Cases

- ¿Qué pasa cuando Supabase está caído? → Server Components muestran error friendly
- ¿Qué pasa cuando el wizard expira? → Timeout con mensaje y opción de reintentar
- ¿Qué pasa con RUC inválido? → Validación Zod con mensaje específico
- ¿Qué pasa con archivos no soportados? → Validación de tipo y tamaño

## Requirements

### Functional Requirements

- **FR-001**: Landing debe tener 12 secciones: Navbar, Hero, TrustBar, Problema, Solución, Sectores, Servicios, Productos, Casos, Proceso, Calculadora, CTA/Form
- **FR-002**: Navbar sticky con blur effect y react-headroom
- **FR-003**: Catálogo de productos con filtros por categoría desde Supabase
- **FR-004**: Fichas técnicas de producto con: nombre, imagen, descripción, especificaciones (CFM, RPM, dB, peso)
- **FR-005**: Wizard multi-step con 5 pasos validados con Zod
- **FR-006**: Cálculo de CFM usando fórmula de ingeniería en `src/utils/engineering.ts`
- **FR-007**: Estimación de precio en `src/utils/pricing.ts`
- **FR-008**: Server Action `submitWizardData()` crea: Client → Contact → Lead (con scoring) → Diagnostic Report
- **FR-009**: CTA flotante y chatbot widget
- **FR-010**: Footer con datos de contacto, redes sociales, términos
- **FR-011**: SEO via `sitemap.ts` y `robots.ts`
- **FR-012**: UI Defensiva: skeletons, empty states, error boundaries en todas las secciones

### Key Entities

- **Client**: Empresa captada vía wizard (tabla `clients`)
- **ClientContact**: Persona de contacto (`client_contacts`)
- **Lead**: Oportunidad comercial con scoring (`leads`)
- **DiagnosticReport**: Reporte técnico generado por el wizard (`diagnostic_reports`)
- **Product**: Producto del catálogo técnico (`products`)
- **ProductCategory**: Categoría de producto (`product_categories`)

## Success Criteria

### Measurable Outcomes

- **SC-001**: Landing carga en <2s (Lighthouse)
- **SC-002**: Wizard completo en <5 minutos
- **SC-003**: Tasa de conversión wizard >3% de visitantes únicos
- **SC-004**: Catálogo responde en <500ms
- **SC-005**: 100% de formularios validados con Zod antes de enviar
- **SC-006**: Sin errores TypeScript (`tsc --noEmit` passes)
- **SC-007**: Sin fugas de memoria en animaciones framer-motion

## Assumptions

- Los visitantes tienen conexión a internet estable
- Los productos se sirven desde Supabase (no CMS externo)
- El wizard requiere datos mínimos: RUC, email, teléfono
- La calculadora CFM usa fórmula estándar de ingeniería HVAC
- El modo oscuro/claro sigue la preferencia del sistema
