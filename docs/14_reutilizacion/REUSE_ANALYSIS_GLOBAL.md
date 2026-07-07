# ANÁLISIS GLOBAL DE REUTILIZACIÓN (REUSE ANALYSIS GLOBAL)

De acuerdo con el **Capítulo 19: Política de Reutilización y Adquisición de Activos**, se presenta el análisis comparativo para cada uno de los 13 componentes del sistema. El objetivo es maximizar el uso de tecnologías maduras y minimizar el desarrollo desde cero ("no reinventar la rueda").

---

## 1. Frontend
*   **Repositorios/Tecnologías Evaluados:**
    1.  *Next.js (Vercel):* Framework de React para producción con soporte para App Router, Server Actions y SSR.
    2.  *Vite + React SPA:* Alternativa ligera para renderizado del lado del cliente.
*   **Licencia:** Next.js (MIT) | Vite (MIT).
*   **Pros:**
    - Next.js: Excelente soporte para SEO (requerido para la Web Pública), Server Actions (simplifica la arquitectura al evitar controladores API redundantes), carga diferida y optimización de imágenes.
    - Vite: Compilación rápida y desarrollo ágil para SPAs.
*   **Contras / Riesgos:**
    - Next.js: Mayor complejidad en el despliegue autohospedado comparado con un servidor estático.
*   **Recomendación:** Next.js para la Web Pública (por SEO y Server Actions) y el ERP/Portal Cliente (por consistencia de tecnologías).
*   **Decisión:** **Next.js (App Router)**.

---

## 2. ERP (Núcleo Operativo B2B)
*   **Repositorios/Tecnologías Evaluados:**
    1.  *Odoo Community Edition (Python):* ERP modular open source muy maduro.
    2.  *ERPNext (Python/Frappe):* ERP en la nube open source basado en metadatos.
    3.  *Desarrollo Propio Modular (Next.js + Supabase + Shadcn/UI):* Construcción de la lógica de negocio a medida sobre componentes de UI preconstruidos.
*   **Licencia:** Odoo (LGPLv3) | ERPNext (GPLv3) | Shadcn/UI (MIT).
*   **Pros:**
    - Odoo/ERPNext: Funcionalidades completas de CRM, compras, inventario y finanzas listas para usar.
    - Desarrollo a Medida: Control total del flujo de preingeniería, separación estricta de branding y multitenancy desde el diseño.
*   **Contras / Riesgos:**
    - Odoo/ERPNext: Extremadamente complejos de personalizar para el flujo técnico B2B del sistema (ej. el calculador de caudal y el wizard de preingeniería). El licenciamiento AGPL/GPL puede imponer restricciones de distribución.
    - Desarrollo a Medida: Mayor tiempo de desarrollo inicial en backend y persistencia.
*   **Recomendación:** Debido a la especificidad del modelo de preingeniería y la regla estricta de separación visual absoluta de experiencias, se recomienda construir la lógica a medida usando la base de datos Supabase, pero reutilizando librerías de UI como Shadcn/UI para las vistas operacionales.
*   **Decisión:** **Desarrollo modular propio sobre Supabase + Shadcn/UI (MIT)**.
*   *Nota:* Se genera [BUILD_JUSTIFICATION.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/14_reutilizacion/BUILD_JUSTIFICATION.md) para justificar la construcción de este núcleo modular a medida.

---

## 3. CRM
*   **Repositorios/Tecnologías Evaluados:**
    1.  *Supabase CRM Template (Next.js):* Repositorio base de CRM integrado a Supabase.
    2.  *Decoupled CRM Service (HubSpot/Salesforce API):* Integración mediante APIs externas.
*   **Licencia:** Supabase CRM (MIT).
*   **Pros:**
    - Supabase CRM Template: Aislamiento nativo a nivel de base de datos Postgres (RLS) y workflows predefinidos de embudos.
    - APIs Externas: Cero mantenimiento de base de datos.
*   **Contras / Riesgos:**
    - HubSpot/Salesforce: Costos prohibitivos por usuario en un modelo multiempresa B2B y pérdida de control sobre la trazabilidad de UTMs requerida.
*   **Recomendación:** Reutilizar y extender el esquema relacional del CRM de Supabase para integrarlo directamente al pipeline de Leads del Wizard.
*   **Decisión:** **Extensión del Template CRM de Supabase (MIT)**.

---

## 4. Portal Cliente
*   **Repositorios/Tecnologías Evaluados:**
    1.  *Tailwind UI Customer Portal Templates:* Plantillas comerciales de interfaz de usuario listas para Next.js.
    2.  *Out-of-the-box Portal (Odoo Portal):* Portal del cliente de Odoo integrado.
*   **Licencia:** Tailwind UI (Comercial / Reutilizable en la empresa) | Odoo (LGPLv3).
*   **Pros:**
    - Tailwind UI: Diseño extremadamente premium y limpio (B2B Premium), responsivo y fácil de desacoplar del layout del ERP.
*   **Contras / Riesgos:**
    - Requiere desarrollo del backend para conectar la UI con Supabase.
*   **Recomendación:** Reutilizar la plantilla premium de portal cliente de Tailwind UI para acelerar el maquetado frontend, garantizando la separación total de layouts con la web y el ERP.
*   **Decisión:** **Reutilización de Plantilla Tailwind UI (Comercial)**.

---

## 5. Dashboard (Visualización B2B)
*   **Repositorios/Tecnologías Evaluados:**
    1.  *Tremor (React/Tailwind):* Librería open source de componentes para dashboards y analíticas.
    2.  *Recharts:* Biblioteca de gráficos basados en SVG React.
*   **Licencia:** Tremor (MIT) | Recharts (MIT).
*   **Pros:**
    - Tremor: Tarjetas de KPI, barras de progreso y componentes interactivos diseñados específicamente para analítica empresarial.
    - Recharts: Gráficos dinámicos altamente personalizables para el rendimiento de caudal y el embudo de ventas.
*   **Contras / Riesgos:**
    - Curva de aprendizaje inicial en la estructura de datos de Tremor.
*   **Recomendación:** Utilizar Tremor y Recharts juntos para construir dashboards interactivos y profesionales en el ERP, Portal de Clientes y Marketing.
*   **Decisión:** **Tremor + Recharts (MIT)**.

---

## 6. Wizard (Cotizador / Formulario)
*   **Repositorios/Tecnologías Evaluados:**
    1.  *React Hook Form + Zod:* Combinación estándar para manejo de estados de formularios complejos y validación de esquemas.
    2.  *Formik + Yup:* Alternativa clásica de validación.
*   **Licencia:** React Hook Form (MIT) | Zod (MIT).
*   **Pros:**
    - React Hook Form: Excelente rendimiento sin re-renderizados innecesarios del stepper.
    - Zod: Permite definir validaciones estrictas (ej. regex de teléfonos colombianos, listas negras de email temporal) que se ejecutan de manera idéntica en frontend y backend (Server Actions).
*   **Recomendación:** Implementar el cotizador con un stepper controlado por Zustand en el cliente y validación de datos estricta con Zod.
*   **Decisión:** **React Hook Form + Zod + Zustand (MIT)**.

---

## 7. RBAC (Control de Acceso)
*   **Repositorios/Tecnologías Evaluados:**
    1.  *Supabase Auth + PostgreSQL RLS:* Sistema nativo de políticas de seguridad a nivel de base de datos.
    2.  *Casbin (Node.js):* Motor de autorización potente.
*   **Licencia:** Supabase/PostgreSQL (MIT/PostgreSQL License) | Casbin (Apache 2.0).
*   **Pros:**
    - Supabase/RLS: Permite aislar los datos multiempresa (`WHERE tenant_id = ?`) a nivel de base de datos. Si una consulta del backend olvida filtrar, Postgres rechaza la transacción por RLS.
*   **Contras / Riesgos:**
    - Requiere un diseño de base de datos libre de redundancias en las tablas de relación de roles.
*   **Recomendación:** Implementar el control de acceso en la capa PostgreSQL mediante políticas RLS y tablas de relación `user_roles` y `user_permissions`.
*   **Decisión:** **Supabase Auth + PostgreSQL RLS**.

---

## 8. Inventario
*   **Repositorios/Tecnologías Evaluados:**
    1.  *TanStack Table (React Table):* Utilidad para crear tablas y cuadrículas de datos interactivas y rápidas.
    2.  *PostgreSQL Inventory Schemas:* Modelos de base de datos relacionales estándar para control de kardex.
*   **Licencia:** TanStack Table (MIT).
*   **Pros:**
    - TanStack Table: Soporta ordenación, paginación, filtros por columnas y modo virtualizado para manejar miles de items de inventario.
*   **Recomendación:** Utilizar el modelo de datos congelado para la base de datos (inventario, movimientos, bodegas y existencias) y TanStack Table para las pantallas de visualización.
*   **Decisión:** **TanStack Table (MIT) para la UI de Inventario**.

---

## 9. Workflow (Motor de Aprobaciones y Estados)
*   **Repositorios/Tecnologías Evaluados:**
    1.  *Temporal.io:* Plataforma de orquestación de workflows complejos y tolerantes a fallos.
    2.  *StateMachine a nivel de Base de Datos:* Lógica de estados y transiciones en PostgreSQL implementada a través de Server Actions y triggers.
*   **Licencia:** Temporal (MIT).
*   **Pros:**
    - Temporal: Excelente para procesos de larga duración e integraciones robustas.
    - StateMachine DB: Máxima simplicidad, velocidad de consulta y concordancia exacta con la `MATRIZ MAESTRA DE ESTADOS Y TRANSICIONES.md`.
*   **Contras / Riesgos:**
    - Temporal añade una sobrecarga considerable de infraestructura al proyecto.
*   **Recomendación:** Debido a la simplicidad del flujo secuencial/paralelo requerido, se recomienda una máquina de estados controlada desde la capa de persistencia Postgres con triggers y APIs de dominio específicas, evitando dependencias externas complejas.
*   **Decisión:** **StateMachine en PostgreSQL + Server Actions**.

---

## 10. Reporting (Generación de PDFs)
*   **Repositorios/Tecnologías Evaluados:**
    1.  *React-pdf:* Biblioteca para generar documentos PDF directamente desde componentes React en cliente o servidor.
    2.  *Puppeteer / Chrome Headless:* Renderiza una página HTML y la exporta como PDF.
*   **Licencia:** React-pdf (MIT) | Puppeteer (Apache 2.0).
*   **Pros:**
    - React-pdf: Generación extremadamente rápida y bajo consumo de recursos (no requiere levantar una instancia de Chromium). Genera PDFs profesionales listos para descargar desde el wizard de preingeniería.
*   **Contras / Riesgos:**
    - React-pdf tiene un subconjunto limitado de estilos CSS soportados.
*   **Recomendación:** Usar React-pdf por velocidad de renderizado y eficiencia de tokens.
*   **Decisión:** **React-pdf (MIT)**.

---

## 11. Document Management
*   **Repositorios/Tecnologías Evaluados:**
    1.  *Supabase Storage API:* Permite crear buckets privados y públicos para subir, versionar e indexar archivos.
    2.  *AWS S3 SDK:* Servicio estándar de almacenamiento de objetos.
*   **Licencia:** Supabase Storage (Apache 2.0).
*   **Pros:**
    - Supabase: Se integra nativamente con la base de datos PostgreSQL, permitiendo asociar las políticas RLS al bucket para que solo usuarios con permisos accedan a los documentos de su respectivo tenant.
*   **Recomendación:** Utilizar los buckets de almacenamiento de Supabase.
*   **Decisión:** **Supabase Storage**.

---

## 12. File Storage
*   *Nota: Se comparte e integra con el sistema de Document Management.*
*   **Decisión:** **Supabase Storage Buckets (Público para reportes de preingeniería / Privado para facturas y evidencias de obra)**.

---

## 13. Payment Gateway (Pasarela de Pagos)
*   **Repositorios/Tecnologías Evaluados:**
    1.  *Wompi SDK / API (Colombia):* Pasarela oficial requerida por el negocio.
    2.  *Stripe API:* Alternativa internacional estándar.
*   **Licencia:** API propietaria del proveedor (Wompi).
*   **Pros:**
    - Wompi: Soporte nativo para PSE (cuentas de ahorro colombianas), tarjetas locales y corresponsales bancarios (Bancolombia).
*   **Contras / Riesgos:**
    - Requiere control estricto de webhooks para evitar dobles registros de transacciones.
*   **Recomendación:** Integrar Wompi API directamente a través de una capa de servicios financieros en el backend, controlando estados de transacción transitorios.
*   **Decisión:** **Wompi API (Sandbox en pruebas, producción posterior)**.
