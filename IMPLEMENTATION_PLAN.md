# PLAN DE IMPLEMENTACIÓN Y CONSOLIDACIÓN DE REFACTORIZACIÓN

Este documento consolida las recomendaciones de refactorización de los informes técnicos de **DeepSeek** y **Qwen**, resolviendo coincidencias y discrepancias, y justificando las decisiones en base a las reglas de la **Product Constitution**, **Technical Constitution**, **Design System** y **Business Architecture** del proyecto.

---

## 1. Mapeo de Recomendaciones de Origen

### Recomendaciones de DeepSeek
- **DS-0.1 a DS-0.6**: Seguridad crítica inicial (rotar keys, limpiar `.env`, middleware auth, filtro tenant, tipado en `updateRequirementStatus`, sanitizar uploads).
- **DS-1.1 a DS-1.13**: Tipos centralizados y modulares (`src/types/*.ts`).
- **DS-2.1 a DS-2.4**: Utilidades compartidas (`formatting.ts`, `tenant-resolution.ts`, `api-result.ts`).
- **DS-3.1 a DS-3.10**: Capa de acceso a datos pura (Repositories).
- **DS-4.1 a DS-4.8**: Descomposición del archivo monolítico `actions.ts`.
- **DS-5.1 a DS-5.7**: Servicios de dominio desacoplados de base de datos.
- **DS-6A a DS-6D**: Descomposición de "God Components" (Wizard, Portal, CMS, Settings).
- **DS-7.1 a DS-7.8**: Optimización de performance (catálogo con JOINs, Server Components, lazy loading, revalidatePath).
- **DS-8.1 a DS-8.5**: Conexión de módulos mock.
- **DS-9.1 a DS-9.9**: Implementación de Vitest, tests e2e, CI/CD pipeline.
- **DS-10.1 a DS-10.7**: Escalabilidad multi-tenant (eliminar `MOCK_TENANTS`, branching de defaults, tipos dinámicos).
- **DS-11.1 a DS-11.5**: Observabilidad (rate limiting, logging estructurado, sentry).
- **DS-12.1 a DS-12.5**: Transacciones y consistencia multitable.

### Recomendaciones de Qwen
- **QW-0**: Auditoría y línea base de compilación (`npm run build/lint`).
- **QW-1**: Extracción de tipos compartidos a un único archivo (`src/types/domain.ts`).
- **QW-2**: Extracción de `getTenantId` y utilidades de tenant.
- **QW-3**: Descomposición de `actions.ts`.
- **QW-4**: Unificación de Leads (`leads.ts` + `leads-erp.ts` -> `leads.service.ts`).
- **QW-5**: Extracción de hooks compartidos en frontend (`useTenantParam`, `useEntityData`, `useEntityForm`).
- **QW-6**: Eliminación de IDs hardcodeados usando `default_created_by_user_id` en `tenant_settings`.
- **QW-7 y QW-8**: Descomposición de God Components en subcarpetas de componentes y sheets.
- **QW-9**: Conexión de datos reales desde Server Actions.
- **QW-10**: Formularios CRUD de Inventario, Compras y Facturación.
- **QW-11**: Integración de pasarela de pagos Wompi y exportación de archivos reales (PDF/CSV).
- **QW-12**: Capa de validación Zod universal para Server Actions.
- **QW-13**: Testing automatizado (Vitest, Playwright, GitHub Actions).
- **QW-14**: Seguridad (rate limiting, CSP headers, RLS audit).
- **QW-15**: Optimización de performance y caching.

---

## 2. Consolidación y Resolución de Conflictos

### Coincidencias de Alta Prioridad
1. **Descomposición de `actions.ts`**: Ambos identifican este archivo monolítico de 539 líneas como un riesgo mayor de mantenimiento y conflictos de fusión.
2. **Descomposición de God Components**: Ambos coinciden en romper `WizardStepper`, `portal/page.tsx`, `cms/page.tsx` y `settings/page.tsx` en piezas modulares reutilizables.
3. **Validación de Entradas**: Ambos sugieren validar todas las Server Actions con esquemas Zod centralizados.
4. **Infraestructura de Testing**: Ambos proponen Vitest para tests unitarios y Playwright para e2e, junto con una CI en GitHub Actions.
5. **Eliminación de Mocking**: Coincidencia total en conectar base de datos real en el Dashboard de inicio y Portal de Clientes.

### Decisiones de Modificación o Descarte
* **Estructura de Tipos Centralizados (DS-1 vs QW-1)**:
  * *Qwen* propone agrupar todos los tipos en un único archivo `src/types/domain.ts`.
  * *DeepSeek* propone una estructura modular (`src/types/crm.ts`, `src/types/catalog.ts`, etc.).
  * *Decisión*: **Adoptar la propuesta modular de DeepSeek**. Un único archivo `domain.ts` volvería a crear un monolito difícil de mantener. La modularidad por dominio se alinea mejor con el *Pilar VI (Tipado Estricto)* y el *Pilar XI (Nomenclatura Limpia)*.
* **Capa de Repositorios (DS-3 vs QW-9)**:
  * *DeepSeek* propone crear una capa explícita de `src/repositories/` para desacoplar SQL/Supabase de las Server Actions.
  * *Qwen* propone inyectar las llamadas a base de datos directamente en las Server Actions.
  * *Decisión*: **Adoptar la propuesta de DeepSeek (Capa de Repositorios)**. Cumple rigurosamente con el *Pilar VII (Backend Puro)* y el *Pilar V (Reutilización)*, facilitando además la escritura de pruebas unitarias al poder mockear la base de datos de manera limpia.
* **Manejo de IDs de Usuario de Prueba (DS-10.4 vs QW-6)**:
  * *DeepSeek* propone eliminar directamente los IDs estáticos obteniéndolos de la sesión activa de JWT de Supabase.
  * *Qwen* propone una solución intermedia: guardar `default_created_by_user_id` en la tabla `tenant_settings` para mantener flujos simulados/demo funcionales de forma parametrizada antes de implementar auth completa.
  * *Decisión*: **Modificar y combinar ambas**. Primero implementaremos el almacenamiento dinámico en `tenant_settings` para asegurar marca blanca funcional, y posteriormente conectaremos la sesión real JWT obtenida desde Supabase Auth.

---

## 3. Asignación al Master Architecture Roadmap (Fases 1 a 7)

A continuación se organizan todas las mejoras en las 7 fases obligatorias solicitadas:

### FASE 1: Diseño (Marca Blanca e Identidad Visual)
* **Branding Multi-tenant (DS-10.2 / QW-8.5)**: Eliminar la bifurcación manual de inquilinos ("AeroMax" / "Apex") en `branding-defaults.ts` y centralizar los recursos del Design System en variables de CSS configuradas dinámicamente desde el ERP.
* **Componentes del Catálogo Técnico (DS-7.6)**: Optimizar el renderizado de portadas y logos de marca blanca utilizando el componente `next/image` y contenedores CSS adaptados del Design System.

### FASE 2: UX (Componentes y Usabilidad)
* **Descomposición de Componentes Monolíticos (DS-6 / QW-7 / QW-8)**:
  * Romper `WizardStepper` (1,305 líneas) en pasos independientes (`ServiceSelectionStep.tsx`, `TechnicalAnalysisStep.tsx`, etc.).
  * Modularizar el Portal de Clientes (`app/portal/page.tsx` - 1,364 líneas) y el CMS Admin (`cms/page.tsx` - 1,269 líneas) en pestañas autocontenidas.
* **Hooks de Interfaz Compartidos (QW-5)**: Crear hooks reutilizables en frontend (`useTenantParam`, `useEntityData`, `useEntityForm`) para erradicar el código boilerplate de carga de estados y validación de formularios.
* **Selector de Servicios por Tarjetas**: Implementar la selección visual del Wizard mediante cards dinámicas en vez de combos desplegables para guiar al usuario industrial.

### FASE 3: Arquitectura (Estructura de Código y API)
* **Tipado de Dominio Centralizado (DS-1 / QW-1)**: Reubicar todas las definiciones de interfaces de dominio de las acciones servidor a carpetas tipadas modulares (`src/types/*.ts`).
* **Capa de Repositorios de Acceso a Datos (DS-3)**: Crear el módulo `src/repositories/` para aislar las consultas Supabase (PostgreSQL) por dominio operacional.
* **Descomposición de Server Actions (DS-4 / QW-3)**: Dividir el monolito de `actions.ts` en ficheros modulares organizados por entidad (`actions/clients.ts`, `actions/invoices.ts`, etc.).
* **Capa de Servicios de Lógica de Negocio (DS-5 / QW-4)**: Separar la orquestación técnica de la lógica de negocio pura mediante `src/services/` (ej: calculadora de cotizaciones, máquina de estados de requerimientos).

### FASE 4: Datos (Integridad y Migración)
* **Conexión de Módulos Mock (DS-8 / QW-9)**: Reemplazar los datos duros del dashboard central y el portal de clientes por consultas reales a base de datos utilizando la capa de repositorios.
* **Formularios de Escritura CRUD (QW-10)**: Completar la funcionalidad CRUD en los módulos de Inventario, Facturación y Compras.
* **Esquemas de Entrada con Zod (QW-12)**: Crear schemas Zod por dominio (`src/schemas/`) y validar todas las mutaciones en Server Actions.
* **Transaccionalidad Multitable (DS-12)**: Envolver las operaciones complejas (como el guardado del Wizard o la facturación) en transacciones SQL o llamadas RPC para resguardar la consistencia de la base de datos.

### FASE 5: Performance (Eficiencia Operativa)
* **Paginación Servidor (DS-7.3 / QW-15.1)**: Añadir soporte de paginación server-side (`limit`, `offset`) en las consultas críticas de listas y componentes TanStack Table.
* **Carga Diferida de PDF y Multimedia (DS-15.3 / QW-15.3)**: Implementar importaciones dinámicas (`next/dynamic`) de librerías pesadas como `jsPDF` para acelerar el tiempo de interacción inicial.

### FASE 6: Seguridad (Protección e Inmunidad)
* **Aislamiento Multitenant con RLS (DS-0.4 / QW-6)**: Revisar y aplicar políticas de RLS (Row Level Security) en todas las tablas y Server Actions sensibles.
* **Middleware de Autenticación (DS-0.3 / QW-9.5)**: Crear el middleware de sesión `src/middleware.ts` para restringir el acceso a `/dashboard/*` y `/portal/*` a usuarios no autenticados en Supabase Auth.
* **Limpieza de Credenciales e Historial (DS-0.1 / DS-0.2 / QW-14.1)**: Eliminar contraseñas y claves de API de los scripts de test y limpiar `.env` del historial de Git.

### FASE 7: Escalabilidad (Crecimiento y Resiliencia)
* **Automatización de Onboarding de Tenants (DS-10.5)**: Crear procesos automáticos de inicialización de nuevos tenants con datos semilla de configuración, secuencias y roles.
* **Infraestructura de Tests Unitarios y CI/CD (DS-9 / QW-13)**: Configurar Vitest y Playwright, crear la suite de pruebas automatizadas y enlazar el pipeline de integración continua.
