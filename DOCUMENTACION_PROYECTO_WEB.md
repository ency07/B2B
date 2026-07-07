# Documentación del Proyecto: ERP B2B Modular con Multi-tenencia (Sitio Web Público)

## 1. Introducción

Este documento detalla el diseño y la implementación del módulo del sitio web público (`src/web/`) dentro de un sistema ERP B2B modular con multi-tenencia. El sitio web está diseñado para marketing, generación de leads a través de un asistente interactivo, y presentación de un catálogo de productos. Se excluye de este alcance el panel de control autenticado del ERP (`src/app/(dashboard)/`).

El objetivo principal del módulo web es:
-   Proporcionar una presencia pública con información de marketing (servicios, sectores, casos de estudio).
-   Ofrecer un "Wizard" (asistente) para la generación de leads cualificados, incluyendo cálculos técnicos y estimaciones de precios.
-   Mostrar un catálogo de productos industrial personalizable por inquilino (tenant).
-   Permitir la personalización de la marca (white-label branding) para cada inquilino.

## 2. Arquitectura del Proyecto

### 2.1. Estructura de Carpetas y Módulos Principales

El proyecto sigue una estructura de directorios modular y organizada, común en aplicaciones Next.js con el App Router:

-   **`src/web/`**: Contiene todo el código específico para el sitio web público.
    -   **`src/web/actions/`**: Server Actions de Next.js. Estas funciones se ejecutan en el servidor y manejan la lógica de negocio crítica, la interacción con la base de datos y los cálculos complejos, exponiendo una API para el frontend.
        -   `branding.ts`: Lógica para la gestión de la marca (white-label), incluyendo obtención, guardado, historial y restauración de configuraciones de branding, así como subida de logos a Supabase Storage.
        -   `catalog.ts`: Lógica para la obtención y gestión del catálogo de productos industrial. Incluye la recuperación de la jerarquía completa del catálogo con consultas paralelas y caché.
        -   `catalog-cache.ts`: Implementa un sistema de caché en memoria para el catálogo, mejorando el rendimiento.
        -   `leads.ts`: Funciones relacionadas con la creación y puntuación de leads.
        -   `wizard.ts`: Lógica central del asistente de generación de leads, incluyendo cálculos de CFM, estimaciones de precios, upsert de clientes/contactos y registro de leads/reportes de diagnóstico.
    -   **`src/web/components/`**: Componentes React reutilizables para el sitio web.
        -   `marketing/`: Componentes específicos para las secciones de marketing (Hero, Services, About, etc.).
        -   `marketing-v2/`: Una versión más reciente de componentes de marketing con un enfoque en UI/UX mejorado.
        -   `wizard/`: Componentes que representan cada paso del asistente (CorporateInfoStep, ServiceSelectionStep, TechnicalAnalysisStep, SummaryStep, SuccessStep).
        -   `CatalogView.tsx`: Componente principal para la visualización del catálogo de productos.
        -   `LandingCfmCalculator.tsx` / `CfmCalculator.tsx`: Widgets de calculadora CFM para las páginas de aterrizaje.
        -   `WizardStepper.tsx`: Orquestador del flujo del asistente.

-   **`src/app/`**: Rutas y configuraciones globales de la aplicación Next.js (App Router).
    -   `page.tsx`: La página de aterrizaje (root landing page) principal del sitio web público.
    -   `wizard/page.tsx`: La página que aloja el asistente multi-paso.
    -   `portal/page.tsx`, `portal/client-page.tsx`: Páginas del portal público.
    -   `(landing)/`: Carpeta para rutas de marketing (ej. `/servicios`, `/sectores`).
    -   `layout.tsx`: Layout principal de la aplicación.
    -   `globals.css`: Estilos globales de Tailwind CSS.
    -   `loading.tsx`, `error.tsx`: Manejo de estados de carga y errores.
    -   `api/auth/signout/route.ts`: Endpoint de la API para cerrar sesión.
    -   `(auth)/`: Rutas relacionadas con la autenticación (login, reset-password, recovery).
    -   `(dashboard)/`: Carpeta para las rutas del panel de control del ERP (fuera del alcance de esta documentación del sitio web público).

-   **`platform/`**: Módulos transversales de la plataforma.
    -   `auth/clients.ts`: Clientes Supabase para administración.
    -   `auth/server-guards.ts`: Guards de seguridad para Server Actions.
    -   `branding/branding-defaults.ts`: Valores por defecto para la configuración de branding.
    -   `tenant/tenant-resolver.ts`: Resolución del ID de usuario del propietario del tenant.

-   **`erp/`**: Módulos relacionados con la lógica de negocio central del ERP.
    -   `actions/core.ts`: Acciones core del ERP, como `getTenantId` y `getPublicTenantSettings`.

-   **`utils/`**: Funciones de utilidad generales.
    -   `engineering.ts`: Cálculos de ingeniería (ej. `calculateRequiredCfm`).
    -   `pricing.ts`: Lógica de estimación de precios (ej. `estimatePrice`).

### 2.2. Flujo de Datos Principal y Dependencias

El flujo de datos se centra en la interacción entre los componentes de React (frontend), las Server Actions (backend), la base de datos (Supabase) y las utilidades auxiliares.

**Ejemplo - Flujo del Asistente (Wizard):**
1.  **Usuario interactúa con el `WizardStepper` (frontend):** Introduce datos en los pasos (`CorporateInfoStep`, `ServiceSelectionStep`, etc.).
2.  **`WizardStepper` invoca `submitWizardData()` (Server Action):** Cuando el usuario finaliza el asistente, los datos se envían a la Server Action.
3.  **`submitWizardData()` procesa los datos (backend):**
    *   Utiliza `calculateRequiredCfm` (de `utils/engineering.ts`) y `estimatePrice` (de `utils/pricing.ts`) para realizar cálculos técnicos y de precios.
    *   Interactúa con **Supabase** a través de `supabaseAdmin` (de `platform/auth/clients.ts`) para:
        *   Buscar o crear un cliente en la tabla `clients`.
        *   Buscar o crear un contacto en la tabla `client_contacts`.
        *   Crear un `Lead` con puntuación en la tabla `leads` (a través de `createLeadWithScore` de `src/web/actions/leads.ts`).
        *   Registrar un `Reporte de Diagnóstico` en la tabla `diagnostic_reports`.
    *   Retorna un `WizardResult` al frontend.
4.  **`WizardStepper` muestra el `SuccessStep` (frontend):** Presenta los resultados del diagnóstico al usuario.

**Ejemplo - Flujo del Catálogo:**
1.  **`Home` o `CatalogView` (frontend) invoca `getIndustrialCatalog()` (Server Action):** Solicita el catálogo de productos.
2.  **`getIndustrialCatalog()` procesa la solicitud (backend):**
    *   Primero, verifica la caché (`catalog-cache.ts`). Si está disponible y es válida, la retorna.
    *   Si no está en caché, realiza múltiples consultas paralelas a **Supabase** para obtener categorías, subcategorías, familias, series, productos, especificaciones, y medios (imágenes, documentos, archivos CAD) de las tablas correspondientes (`product_categories`, `product_subcategories`, `product_families`, `product_series`, `products`, `product_specifications`, `product_images`, `product_documents`, `product_files`, `seo_metadata`).
    *   Ensambla la jerarquía completa del catálogo y la guarda en caché.
    *   Retorna los datos del catálogo al frontend.
3.  **`CatalogView` renderiza el catálogo (frontend):** Muestra la información de los productos al usuario.

## 3. Detalles Técnicos

### 3.1. Dependencias del Proyecto (package.json)

El proyecto utiliza una pila de tecnologías moderna basada en React, Next.js y Supabase, con un enfoque en la experiencia de desarrollador y usuario.

**Dependencias de Producción (`dependencies`):**

*   `@hookform/resolvers`: Integración de validación de esquemas (ej. Zod) con React Hook Form.
*   `@radix-ui/*`: Colección de primitivas UI de alto rendimiento y accesibles para construir interfaces de usuario. Se utilizan varios componentes como `react-avatar`, `react-checkbox`, `react-dialog`, `react-label`, `react-select`, `react-slot`, `react-tooltip`.
*   `@supabase/supabase-js`: Cliente JavaScript para interactuar con la plataforma Supabase (base de datos, autenticación, almacenamiento).
*   `@tanstack/react-table`: Herramienta para construir tablas potentes y flexibles en React.
*   `class-variance-authority`: Utilidad para crear variantes de componentes basadas en clases CSS, facilitando la implementación de sistemas de diseño con Tailwind CSS.
*   `clsx`: Utilidad ligera para construir strings de `className` de forma condicional.
*   `dotenv`: Carga variables de entorno desde un archivo `.env` al `process.env`.
*   `framer-motion`: Librería para animaciones de producción de React.
*   `jspdf`: Generación de PDFs del lado del cliente.
*   `lucide-react`: Librería de iconos vectoriales (SVG) para React.
*   `next`: El framework de React para producción (App Router).
*   `next-themes`: Soporte para temas (claro/oscuro) en aplicaciones Next.js.
*   `react`, `react-dom`: Librerías principales de React para construir interfaces de usuario.
*   `react-headroom`: Oculta/muestra inteligentemente el encabezado de la página al hacer scroll.
*   `react-hook-form`: Librería para la gestión de formularios con validación robusta y rendimiento optimizado.
*   `recharts`: Librería de gráficos composables construida con React y D3.
*   `sonner`: Componente de notificación de tipo "toast" accesible y personalizable.
*   `tailwind-merge`: Combina inteligentemente clases de Tailwind CSS para evitar conflictos.
*   `zod`: Librería de declaración y validación de esquemas TypeScript-first.

**Dependencias de Desarrollo (`devDependencies`):**

*   `@tailwindcss/postcss`: Plugin de PostCSS para Tailwind CSS v4.
*   `@types/node`, `@types/pg`, `@types/react`, `@types/react-dom`: Tipos de TypeScript para Node.js, PostgreSQL, React y ReactDOM.
*   `eslint`, `eslint-config-next`: Herramientas de linting para mantener la calidad del código.
*   `pg`: Cliente PostgreSQL para Node.js (probablemente utilizado en scripts de desarrollo/pruebas).
*   `tailwindcss`: Framework CSS utility-first.
*   `ts-node`: Ejecuta archivos TypeScript directamente en Node.js, útil para scripts.
*   `typescript`: El lenguaje de programación utilizado en el proyecto.

### 3.2. Endpoints Principales y Server Actions

Las Server Actions son la columna vertebral de la interacción del frontend con la lógica de negocio del backend.

-   **`submitWizardData(tenantCode, data)` (en `src/web/actions/wizard.ts`):**
    -   **Propósito:** Procesa la información del asistente de generación de leads.
    -   **Funcionalidad:**
        1.  Realiza cálculos de ingeniería (CFM, volumen) y estimaciones de precios.
        2.  Realiza un "upsert" (actualiza o inserta) de información de clientes y contactos en la base de datos.
        3.  Crea un lead con una puntuación dinámica.
        4.  Genera y guarda un reporte de diagnóstico.
    -   **Retorna:** Un objeto `WizardResult` con el código de diagnóstico, CFM requerido, categoría de CFM, volumen, precios estimados y recomendaciones de materiales.

-   **`getIndustrialCatalog(tenantCode)` (en `src/web/actions/catalog.ts`):**
    -   **Propósito:** Recupera la jerarquía completa del catálogo de productos.
    -   **Funcionalidad:**
        1.  Consulta la caché.
        2.  Si no está en caché, realiza múltiples consultas paralelas a Supabase para construir una estructura jerárquica de categorías, subcategorías, familias, series y productos, incluyendo especificaciones, imágenes y documentos.
        3.  Almacena el resultado en caché.
    -   **Retorna:** Un array de objetos `CatalogCategory`.

-   **`addProductImage(tenantCode, productId, image)` (en `src/web/actions/catalog.ts`):**
    -   **Propósito:** Registra un activo multimedia (imagen) en el Media Manager y lo asocia a un producto.
    -   **Funcionalidad:** Inserta el activo en `media_assets` y luego lo vincula al producto en `product_images`. Invalida la caché del catálogo.

-   **`saveProduct(tenantCode, product)` (en `src/web/actions/catalog.ts`):**
    -   **Propósito:** Guarda o actualiza un producto en el catálogo, incluyendo sus especificaciones técnicas.
    -   **Funcionalidad:** Realiza un upsert en la tabla `products` y gestiona las especificaciones en `product_specifications`. Invalida la caché del catálogo.

-   **`deleteProduct(tenantCode, productId)` (en `src/web/actions/catalog.ts`):**
    -   **Propósito:** Realiza un soft-delete de un producto.
    -   **Funcionalidad:** Marca el producto como `deleted_at`. Invalida la caché del catálogo.

-   **`saveCategory(tenantCode, category)` y `deleteCategory(tenantCode, categoryId)` (en `src/web/actions/catalog.ts`):**
    -   **Propósito:** Guardar/actualizar y soft-delete de categorías de productos.
    -   **Funcionalidad:** Similar a `saveProduct` y `deleteProduct` pero para `product_categories`.

-   **`getTenantBranding(tenantCode)` (en `src/web/actions/branding.ts`):**
    -   **Propósito:** Retorna la configuración visual de branding consolidada para un inquilino.
    -   **Funcionalidad:** Fusiona las configuraciones por defecto con las configuraciones almacenadas en `tenant_settings` en Supabase.
    -   **Retorna:** Un objeto `BrandingConfig`.

-   **`saveTenantBranding(tenantCode, data, versionDescription)` (en `src/web/actions/branding.ts`):**
    -   **Propósito:** Guarda las configuraciones visuales de branding y crea una nueva versión histórica.
    -   **Funcionalidad:** Realiza un upsert en `tenant_settings` y luego guarda un snapshot de la configuración completa en `tenant_branding_version`.

-   **`getBrandingHistory(tenantCode)` (en `src/web/actions/branding.ts`):**
    -   **Propósito:** Lista el historial de versiones de branding.
    -   **Funcionalidad:** Consulta `tenant_branding_version`.

-   **`restoreBrandingVersion(tenantCode, versionId)` (en `src/web/actions/branding.ts`):**
    -   **Propósito:** Restaura una versión específica de branding histórico.
    -   **Funcionalidad:** Recupera la configuración de una versión histórica y la aplica a las configuraciones activas.

-   **`uploadBrandingLogo(tenantCode, fileType, base64Data, fileName, mimeType)` (en `src/web/actions/branding.ts`):**
    -   **Propósito:** Sube una imagen a Supabase Storage y retorna la URL pública.
    -   **Funcionalidad:** Convierte base64 a buffer, asegura la existencia del bucket `tenant-logos` (público), sube el archivo y obtiene su URL pública.

-   **`src/app/api/auth/signout/route.ts`:**
    -   **Propósito:** Endpoint de la API para manejar el cierre de sesión del usuario.

### 3.3. Componentes de Interfaz Clave

Los componentes React están diseñados para ser modulares y reutilizables, muchos de ellos utilizando `class-variance-authority` para la gestión de variantes de estilos.

-   **`WizardStepper` (en `src/web/components/WizardStepper.tsx`):**
    -   El componente contenedor y orquestador del flujo del asistente multi-paso.
    -   Gestiona el estado entre los pasos y envía los datos finales a `submitWizardData`.
    -   Incluye `CorporateInfoStep`, `ServiceSelectionStep`, `TechnicalAnalysisStep`, `SummaryStep`, `SuccessStep` como sus sub-componentes.

-   **`LandingCfmCalculator` y `CfmCalculator` (en `src/web/components/LandingCfmCalculator.tsx` y `src/web/components/marketing-v2/CfmCalculator.tsx`):**
    -   Widgets interactivos para calcular el Caudal de Aire (CFM) requerido, a menudo utilizados en páginas de marketing para captar la atención del usuario.

-   **`CatalogView` (en `src/web/components/CatalogView.tsx`):**
    -   Muestra la jerarquía completa del catálogo de productos.
    -   Permite la navegación y visualización de categorías, subcategorías, familias, series y productos con sus detalles (especificaciones, imágenes, documentos).

-   **Componentes de Marketing (`MarketingShell`, `Hero`, `Services`, `Sectors`, `ContactSection`, `FloatingCta`, etc.):**
    -   **`MarketingShell` (en `src/web/components/marketing-v2/MarketingShell.tsx`):** El layout principal para las páginas de marketing, incluyendo la navegación y el pie de página.
    -   **`Hero` (en `src/web/components/marketing-v2/Hero.tsx`):** La sección principal de la página de aterrizaje, a menudo con un llamado a la acción (CTA).
    -   **`Services`, `Sectors`, `Disciplines` (en `src/web/components/marketing-v2/Services.tsx`, `Sectors.tsx`, `Disciplines.tsx`):** Secciones que detallan los servicios, sectores atendidos y disciplinas de ingeniería.
    -   **`TrustMarquee` (en `src/web/components/marketing-v2/TrustMarquee.tsx`):** Un componente de marquesina para mostrar logos de clientes o certificaciones, generando confianza.
    -   **`FloatingCta` (en `src/web/components/marketing-v2/FloatingCta.tsx`):** Un botón de llamado a la acción flotante que permanece visible mientras el usuario se desplaza.
    -   **`ContactSection` (en `src/web/components/marketing-v2/ContactSection.tsx`):** Un formulario de contacto para la generación de leads.

### 3.4. Configuraciones Clave y Variables de Entorno

-   **`tsconfig.json`:**
    -   Configuración estricta de TypeScript (`strict: true`).
    -   Define el target de compilación (`es2020`), módulos (`NodeNext`), y rutas de alias (`@/*` para `src/*`).

-   **`tailwind.config.ts` y `postcss.config.js`:**
    -   **`tailwind.config.ts`:** Configuración de Tailwind CSS, incluyendo la personalización del tema, colores, fuentes, y la definición de las rutas de archivos donde se escanean las clases de Tailwind.
    -   **`postcss.config.js`:** Configuración de PostCSS, que incluye el plugin `@tailwindcss/postcss` para procesar los estilos de Tailwind.

-   **Variables de Entorno:**
    -   Aunque no se ha especificado un archivo `.env.example` en los archivos leídos, la presencia de la librería `dotenv` en `package.json` sugiere que el proyecto utiliza variables de entorno para configuraciones sensibles o específicas del entorno (ej. `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_TENANT_CODE`). Estas variables se cargarían en tiempo de ejecución.

## 4. Lógica de Negocio

### 4.1. Propósito de Módulos/Carpetas Principales

-   **`src/web/actions/`**: Encapsula la lógica de negocio del lado del servidor para el sitio web público. Esto asegura que las operaciones complejas (interacciones con la base de datos, cálculos, etc.) se realicen de forma segura y eficiente en el backend, separando la preocupación del frontend.
-   **`src/web/components/`**: Se enfoca en la presentación y la interactividad del usuario. Estos componentes consumen los datos y las funcionalidades expuestas por las Server Actions.
-   **`platform/`**: Contiene funcionalidades reutilizables y agnósticas a la lógica de negocio específica, como la gestión de autenticación, la resolución de inquilinos y la configuración de branding. Esto promueve la reutilización y consistencia en toda la aplicación.
-   **`erp/`**: Aloja las acciones core que son fundamentales para el funcionamiento del ERP, pero que también pueden ser utilizadas por el módulo web (ej. `getTenantId`).
-   **`utils/`**: Proporciona algoritmos y funciones auxiliares que realizan cálculos específicos o transformaciones de datos, manteniendo la lógica de negocio limpia y enfocada.

### 4.2. Casos de Uso Principales

-   **Proceso del Asistente (Lead Generation Funnel):**
    -   **Recopilación de Información:** El usuario ingresa detalles corporativos, selecciona servicios, proporciona dimensiones técnicas (longitud, ancho, alto), define el entorno de aplicación y especifica la urgencia.
    -   **Cálculos en Tiempo Real:** Basado en la entrada, se calculan el Caudal de Aire (CFM), el volumen en metros cúbicos, se clasifica la categoría de CFM y se genera una recomendación de materiales. También se estima un rango de precios en COP y USD.
    -   **Gestión de Clientes y Leads:** La información ingresada se utiliza para buscar o registrar un cliente (`clients`) y un contacto (`client_contacts`). Se crea un nuevo lead (`leads`) con una puntuación dinámica basada en la urgencia y otros factores, y se genera un reporte de diagnóstico (`diagnostic_reports`) detallado.
    -   **Implementación:** Se maneja a través del componente `WizardStepper` en el frontend, que interactúa con la Server Action `submitWizardData` para todo el procesamiento del backend.

-   **Visualización del Catálogo de Productos:**
    -   **Navegación Jerárquica:** Los usuarios pueden explorar productos organizados en categorías, subcategorías, familias y series.
    -   **Detalles del Producto:** Cada producto muestra su código, nombre, descripción, estado, especificaciones técnicas, y medios asociados (imágenes, documentos, archivos CAD).

-   **Personalización de Marca (White-label Branding):**
    -   **Carga Dinámica de Branding:** La configuración visual del sitio (título del navegador, logos, colores, favicon, etc.) se carga dinámicamente según el inquilino (tenant).
    -   **Gestión de Configuraciones:** Los administradores pueden modificar las configuraciones de branding, las cuales se almacenan en la base de datos.
    -   **Historial y Restauración:** Se mantiene un historial de versiones de branding, permitiendo restaurar configuraciones previas.
    -   **Subida de Activos:** La capacidad de subir logos y otros activos visuales directamente al almacenamiento del sistema.
    -   **Implementación:** Las Server Actions en `src/web/actions/branding.ts` son responsables de toda la lógica de gestión de branding, interactuando con las tablas `tenant_settings` y `tenant_branding_version`.

-   **Página de Aterrizaje (Landing Page):**
    -   **Contenido de Marketing:** Presenta secciones como el héroe, servicios, sectores, disciplinas, casos de estudio y un formulario de contacto.
    -   **Widgets Interactivos:** Incluye un widget de calculadora CFM para involucrar al usuario.
    -   **Flujo de Contacto:** Proporciona un formulario de contacto y un CTA flotante para facilitar la interacción con los potenciales clientes.
    -   **Implementación:** La página `src/app/page.tsx` utiliza `MarketingShell` y otros componentes de marketing para construir la UI. Carga el branding y el catálogo de forma asíncrona.

### 4.3. Patrones de Diseño Utilizados

-   **Server Actions (Next.js):** Se utilizan extensivamente para encapsular la lógica de negocio del lado del servidor. Este patrón permite que las funciones del backend sean invocadas directamente desde los componentes del cliente, facilitando un modelo de programación full-stack sin la necesidad de construir APIs REST/GraphQL explícitas.
-   **Patrón Repositorio (Implícito):** Aunque no hay una capa de repositorio explícita con interfaces definidas, la forma en que las Server Actions interactúan con Supabase (`supabaseAdmin.from("table_name").select(...)`) es análoga al patrón Repositorio. Cada acción que interactúa con una tabla específica maneja las operaciones CRUD y la lógica de negocio asociada a esa entidad.
-   **Componentes Reutilizables (React):** La organización en `src/web/components/` demuestra un fuerte uso de componentes reutilizables, promoviendo la consistencia de la UI y la mantenibilidad.
-   **Almacenamiento en Caché (Caching):** Implementado en `src/web/actions/catalog-cache.ts` para optimizar el rendimiento de la recuperación del catálogo, reduciendo las llamadas redundantes a la base de datos.
-   **Inyección de Dependencias (Implícita):** La inyección de dependencias se maneja implícitamente a través de las importaciones de módulos (ej. `calculateRequiredCfm` de `utils/engineering`).

## 5. Pruebas

El proyecto incluye scripts de prueba definidos en `package.json` que utilizan `ts-node` para ejecutar archivos TypeScript.

-   **`npm run test:website`**: Ejecuta las pruebas específicas para el sitio web público (definidas en `scripts/test-website.ts`).
-   **`npm run test:wizard`**: Ejecuta las pruebas para el flujo del asistente (definidas en `scripts/test-wizard.ts`).
-   Otras pruebas para módulos específicos del ERP (ej. `test:clients`, `test:requirements`, `test:invoices`).

Estas pruebas aseguran que la funcionalidad del sitio web y el asistente funcione correctamente antes de la implementación.

## 6. Convenciones de Código

El proyecto adhiere a un conjunto de convenciones de código para garantizar la consistencia, legibilidad y mantenibilidad:

-   **React 19 + Next.js 16 (App Router):** Utiliza las últimas versiones de estas tecnologías, aprovechando características como Server Components y Server Actions.
-   **Tailwind CSS v4:** Para el estilizado, empleando un enfoque utility-first.
-   **TypeScript Strict Mode:** (`tsconfig.json: strict: true`) Garantiza una fuerte tipificación y reduce errores en tiempo de ejecución.
-   **Server Actions (`"use server"`):** Todas las acciones del lado del servidor se declaran con `"use server"`.
-   **Component Variants (`class-variance-authority`):** Para crear componentes con variantes de estilo controladas.
-   **Iconos (`lucide-react`):** Utilización de esta librería para los iconos.
-   **Animaciones (`framer-motion`):** Para animaciones fluidas y declarativas.
-   **Gráficos (`recharts`):** Para la visualización de datos.
-   **Notificaciones (`sonner`):** Para mostrar mensajes de notificación (toasts).
-   **ESLint:** Se utiliza para mantener la calidad y el estilo del código.
