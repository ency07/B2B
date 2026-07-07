# JUSTIFICACIÓN DE CONSTRUCCIÓN PROPIA (BUILD JUSTIFICATION)

De acuerdo con la política documental del proyecto, se justifica formalmente la decisión de construir un núcleo modular a medida para el ERP y CRM del sistema en lugar de instalar un sistema monolítico preexistente (como Odoo, ERPNext o SAP Business One).

---

## 1. Razones Técnicas y Funcionales

### A. Separación Absoluta de Experiencias (Regla Suprema #4)
La directiva exige una separación total de layouts, sidebars, headers, footers y branding entre:
1.  **Website Pública** (Comercial, captación, SEO y conversión).
2.  **Portal Cliente** (Autoservicio, pagos, visualización de garantías e intervenciones).
3.  **ERP Interno** (Operación interna, cotizador, inventario y facturación).

Los ERPs open-source monolíticos (ej. Odoo) comparten por defecto componentes de interfaz, assets y cookies de sesión entre el portal público, el portal de clientes y el backend. Forzar un desacoplamiento visual de este nivel en Odoo es costoso, ineficiente en rendimiento y propenso a errores de seguridad en actualizaciones.

### B. Motor de Preingeniería y Cálculos de Caudal (Wizard B2B)
El núcleo comercial del sistema se basa en un calculador de caudal industrial (CFM) a partir de las dimensiones físicas de la planta, asignando renovaciones de aire por hora (ACH) según la industria (HVAC, Minería, Metalmecánica, Data Centers). 
Los CRM/ERPs comerciales estructuran sus cotizaciones en torno a catálogos de productos simples. Integrar un motor matemático de preingeniería y recomendación de materiales (ej. sugerir Acero ASTM A514 o Inoxidable 316L según la potencia del caudal) en un software comercial estándar requiere una reestructuración invasiva de su base de código.

### C. Restricción Estricta de RLS (Row Level Security) y Multitenancy
El proyecto exige que el aislamiento multiempresa sea absoluto a nivel de persistencia (PostgreSQL RLS), de tal forma que ninguna consulta pueda accidentalmente filtrar datos cruzados entre tenants. 
Los ERPs tradicionales implementan el multi-tenant a nivel de aplicación (filtrado en el backend o bases de datos separadas físicamente). Al implementar RLS nativo en Supabase, garantizamos seguridad blindada de nivel bancario a nivel de motor de datos.

### D. Auditoría y Trazabilidad Transaccional Total
El sistema debe documentar de forma inmutable cada cambio de estado (Prospecto $\rightarrow$ Activo, Borrador $\rightarrow$ Enviada, etc.), registrando usuario, IP, navegador, valores anteriores y valores nuevos. 
Los logs de auditoría por defecto de los ERPs tradicionales son genéricos y difíciles de exportar a interfaces personalizadas para el rol de **Auditor**.

---

## 2. Decisión de Ingeniería

La alternativa óptima es construir el backend y frontend del sistema a medida utilizando:
-   **Next.js (App Router):** Asegura la independencia visual de las 3 plataformas mediante sub-carpetas de rutas independientes, optimizando el SEO comercial y la reactividad del ERP.
-   **Supabase (PostgreSQL):** Nos provee persistencia relacional estricta, políticas RLS nativas, y buckets de almacenamiento consistentes.
-   **Shadcn/UI & Tremor:** Nos permiten reutilizar componentes de diseño y analítica web preconstruidos, acelerando la UI operativa del ERP y Portal de Cliente sin tener que maquetar layouts básicos desde cero.
