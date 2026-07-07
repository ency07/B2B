# CURRENT_PROJECT_STATE (Estado Actual del Proyecto y Auditoría Documental)

Este documento consolida la auditoría documental del proyecto **ERP B2B Premium** (AeroMax Industrial) realizada por **Antigravity** antes de proceder con el rediseño y optimización de la Landing Page y el Wizard.

---

## 1. Documentos Nuevos Encontrados

Se ha realizado una indexación completa y relectura de los siguientes documentos clave de gobernanza y especificaciones técnicas:

*   **Constitución Técnica (Versión 2.0)**: [docs/03_protocolo/00_CONSTITUCION_TECNICA.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/03_protocolo/00_CONSTITUCION_TECNICA.md).
*   **Decisiones Globales Congeladas**: [docs/03_protocolo/0.2 DECISIONES GLOBALES CONGELADAS.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/03_protocolo/0.2%20DECISIONES%20GLOBALES%20CONGELADAS.md).
*   **Modo Auditor de Decisiones Congeladas**: [docs/03_protocolo/0.3 MODO AUDITOR DE DECISIONES CONGELADAS.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/03_protocolo/0.3%20MODO%20AUDITOR%20DE%20DECISIONES%20CONGELADAS.md).
*   **Instrucciones de Lectura Obligatoria**: [docs/03_protocolo/00.1_OBLIGATORIO_LEER_PRIMERO.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/03_protocolo/00.1_OBLIGATORIO_LEER_PRIMERO.md).
*   **Matriz de Orden de Implementación**: [docs/03_protocolo/21_IMPLEMENTATION_ORDER.txt](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/03_protocolo/21_IMPLEMENTATION_ORDER.txt).
*   **Políticas de Gobernanza Frontend**: [docs/15_frontend/00_FRONTEND_POLICY.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/15_frontend/00_FRONTEND_POLICY.md).
*   **Sistema de Diseño**: [docs/15_frontend/01_DESIGN_SYSTEM.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/15_frontend/01_DESIGN_SYSTEM.md).
*   **Guía de Personalización White Label**: [docs/15_frontend/08_WHITE_LABEL_GUIDE.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/15_frontend/08_WHITE_LABEL_GUIDE.md).
*   **Memoria Histórica del Proyecto**: [docs/00_GOVERNANCE/PROJECT_MEMORY.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/00_GOVERNANCE/PROJECT_MEMORY.md).
*   **Política de Reutilización de Activos**: [docs/14_reutilizacion/0 POLÍTICA DE REUTILIZACIÓN Y ADQUISICIÓN DE ACTIVOS.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/14_reutilizacion/0%20POL%C3%8DTICA%20DE%20REUTILIZACI%C3%93N%20Y%20ADQUISICI%C3%93N%20DE%20ACTIVOS.md).
*   **Roadmap Maestro**: [docs/03_protocolo/5 ROADMAP MAESTRO DE CONSTRUCCIÓN.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/03_protocolo/5%20ROADMAP%20MAESTRO%20DE%20CONSTRUCCI%C3%93N.md).
*   **Plan de Implementación en curso**: [implementation_plan.md](file:///C:/Users/Administrator/.gemini/antigravity/brain/82fcc79e-7779-43bd-b574-6c1571683c3f/implementation_plan.md).

---

## 2. Cambios Respecto al Contexto Anterior

*   **Integración de Base de Datos**: Las migraciones hasta la Fase 36 (`20260619000036_fix_leads_schema.sql`) han sido aplicadas correctamente. Las tablas operacionales (`clients`, `client_contacts`, `leads`, `diagnostic_reports`, `wizard_sessions`, `products`) están listas para producción.
*   **Aislamiento de Permisos del Wizard**: Se ha solucionado el error de permisos RLS (`permission denied for table clients`) mediante el desacoplamiento de flujos. El visitante no crea requerimientos internos directamente; en su lugar, se invoca una Server Action segura (`submitWizardData` en `src/app/actions/wizard.ts`) ejecutada con `supabaseAdmin` (Service Role), registrando al cliente como prospecto, agregando un contacto y creando un Lead para posterior aprobación manual.
*   **Auditoría de VENTITECH**: Se analizaron los archivos locales de `VENTITECH` y se identificaron patrones visuales y técnicos premium (layout SCADA, curvas vectoriales SVG dinámicas, contador animado a 60fps en CFM, HUDS de severidad de aspas y descargas de PDFs multipágina con jsPDF) que se adaptarán de manera superior para AeroMax.

---

## 3. Decisiones de Arquitectura Nuevas (Obligatorias)

1.  **Cero Hardcoding Visual (Pilares XV y XVI)**: Todos los componentes visuales (Landing, Wizard, Catálogo) deben consultar las variables CSS de marca (`var(--color-primary)`, `var(--color-secondary)`) e imágenes inyectadas dinámicamente desde `tenant_settings`. Queda prohibido hardcodear colores fijos (por ejemplo, `#0284c7`) directamente en las clases de los componentes.
2.  **Integración Radix / Shadcn / Framer Motion**: El estilado debe ser 100% Tailwind CSS v4. Se prohíbe el uso de librerías externas de UI como NextUI (HeroUI) o Headless UI. Las animaciones deben ser sutiles (duración menor a 200ms) utilizando Framer Motion sin rebotes exagerados.
3.  **Client Components Autorizados**: El Wizard (`WizardStepper.tsx`) y el Catálogo interactivo (`CatalogView.tsx`) utilizarán `"use client"` debido a la interacción en tiempo real (cálculos matemáticos de caudal, contador 60fps, autocompletado y renderizado dinámico de PDF en cliente).
4.  **jsPDF dinámico en Cliente**: La librería jsPDF se debe importar dinámicamente (`const { jsPDF } = await import("jspdf")`) dentro de la lógica del cliente para evitar romper el renderizado de servidor (SSR) de Next.js.
5.  **Formato de Scoring en Español**: Los niveles de scoring de prospectos asignados al crear leads son estrictamente: `'CALIENTE'`, `'TIBIO'`, `'FRIO'`, y `'SPAM'`.

---

## 4. Posibles Conflictos

*   **Conflicto de Personalización Dinámica vs. Estética Avanzada**: 
    La Constitución Técnica exige inyectar todos los estilos e identidad desde `tenant_settings` para mantener White Label. Sin embargo, al emular la interfaz interactiva de VENTITECH (que incluye animaciones oscuras y gradientes complejos), existe el riesgo de introducir estilos hardcodeados de fondo y bordes brillantes. Para resolver esto sin violar la Constitución, la landing y el wizard deben estructurarse usando variables CSS dinámicas y clases utilitarias de Tailwind que hereden del tema del inquilino.
*   **Conflicto de Carga y SSR**:
    La generación de PDFs con jsPDF y los contadores en tiempo real requieren la manipulación de APIs del navegador. Si estos scripts se cargan sin lazy loading o fuera de directivas `"use client"`, se producirán fallos de compilación o deshidratación en Turbopack.
*   **Conflicto de Ubicación de Archivos de Configuración**:
    El prompt del usuario menciona `docs/16_constitucion_tecnica/` como directorio a re-indexar; sin embargo, no existe esa carpeta en la estructura del proyecto. El documento oficial de la Constitución Técnica se encuentra en `docs/03_protocolo/00_CONSTITUCION_TECNICA.md`. Se adopta este último como la norma suprema.

---

## 5. Roadmap Actualizado

*   **Fase Actual**: **Fases 11 y 12: Website Pública, Catálogo Técnico y Wizard**.
*   **Fases Completadas**: Fases 1 a 10 (Core SaaS, Clientes, Requerimientos, Cotizaciones, Aprobaciones, Trabajos, Inventarios, Facturación, Pagos, Garantías) y Fases 31 a 34 (Configuraciones, White Label, Integraciones y Administración Avanzada).
*   **Fase Siguiente**: **Fase 13: CRM, Oportunidades y Pipeline**.
*   **Documentos que Gobiernan la Fase Actual**:
    *   [Módulo Website.txt](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/11_marketing/M%C3%B3dulo%20Website.txt)
    *   [doc_web_wizard.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/11_marketing/doc_web_wizard.md)
    *   [00_FRONTEND_POLICY.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/15_frontend/00_FRONTEND_POLICY.md)
    *   [01_DESIGN_SYSTEM.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/15_frontend/01_DESIGN_SYSTEM.md)
    *   [08_WHITE_LABEL_GUIDE.md](file:///c:/Users/Administrator/Desktop/ERP-B2B-Premium/docs/15_frontend/08_WHITE_LABEL_GUIDE.md)

---

## 6. Reglas Obligatorias y Confirmación de Cumplimiento

Antigravity confirma explícitamente el cumplimiento riguroso de las siguientes directrices en esta y todas las futuras tareas:

*   **Constitución Técnica**: Respetada como norma suprema sobre cualquier otra especificación.
*   **Arquitectura SaaS**: Aislamiento total de inquilinos, seguridad controlada a nivel base de datos y Server Actions.
*   **Protocolos de Ejecución**: Cumplimiento del Flujo Obligatorio (Paso 0 a Paso 7).
*   **Reuse Analysis**: Priorización de reutilización (`REUSE > EXTEND > ADAPT > CREATE`) para evitar duplicidad de entidades.
*   **Frontend Governance**: Uso exclusivo del stack aprobado, prohibición de librerías baneadas (HeroUI, Tabler Icons, Tremor, etc.) y código limpio TypeScript.
*   **White Label**: Estilado adaptable por variables CSS inyectadas.
*   **Roadmap**: Ningún paso a fases siguientes antes de validar la compilación y pruebas de la fase actual.
