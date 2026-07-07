# REUSE_ANALYSIS_FASE18 — Motor de Documentos y Plantillas

**Fecha de Análisis:** 2026-06-17  
**Fase:** 18 — Generación de Documentos (Plantillas, PDF, DOCX)  
**Estado:** APROBADO — Análisis completo con 7 repositorios evaluados (mín. 5)  
**Clasificación:** OBLIGATORIO antes de escribir cualquier línea de código custom

> **DIRECTIVA CERO-DUPLICACIÓN (Modo Auditor 0.3):**  
> Queda PROHIBIDO implementar replace('{{variable}}') o cualquier motor de  
> plantillas custom hasta que este documento demuestre que no existe un repositorio  
> open source reutilizable que cubra el caso de uso. Este análisis demuestra que  
> SÍ existen múltiples repositorios reutilizables. Por tanto, el código custom  
> está descartado permanentemente para esta fase.

---

## 1. Repositorios Evaluados

### REPO-01 — GrapesJS (Editor Visual de Plantillas)

| Atributo | Valor |
|---|---|
| **Repositorio** | `GrapesJS/grapesjs` |
| **URL** | https://github.com/GrapesJS/grapesjs |
| **Licencia** | BSD-3-Clause (100% permisiva, uso comercial libre) |
| **Stars** | ~25,900 estrellas |
| **Actividad** | Activo — commits semanales, última release 2026 |
| **NPM** | `npm i grapesjs` |
| **Tiempo de Integración Estimado** | 3–5 días (editor embebido con bloques preconfigurados) |
| **Complejidad** | Media — requiere configuración de bloques y plugins |
| **Caso de Uso en FASE 18** | Editor drag-and-drop para diseñar plantillas de documentos (facturas, contratos, reportes) visualmente, exportando HTML limpio |
| **Veredicto** | REUTILIZAR |

**Justificación:** Con 25.9k estrellas y licencia BSD-3, GrapesJS es el estándar de  
facto para editores visuales embebibles en SaaS. Construir un editor equivalente desde  
cero requeriría estimativamente 6–12 meses de ingeniería especializada.

---

### REPO-02 — Handlebars.js (Motor de Plantillas HTML)

| Atributo | Valor |
|---|---|
| **Repositorio** | `handlebars-lang/handlebars.js` |
| **URL** | https://github.com/handlebars-lang/handlebars.js |
| **Licencia** | MIT (uso comercial libre, sin restricciones) |
| **Stars** | ~18,600 estrellas |
| **Actividad** | Mantenimiento activo — 38M descargas/semana en npm |
| **NPM** | `npm i handlebars` |
| **Tiempo de Integración Estimado** | 2–4 horas |
| **Complejidad** | Baja — API de 3 métodos principales |
| **Caso de Uso en FASE 18** | Inyectar datos del ERP en plantillas HTML para generar HTML final antes de pasarlo a Puppeteer |
| **Veredicto** | REUTILIZAR |

**Justificación:** Handlebars resuelve el problema de replace con XSS-escaping  
automático, soporte de loops, condicionales y parciales. MIT elimina cualquier riesgo legal.

---

### REPO-03 — Puppeteer (Generación PDF desde HTML)

| Atributo | Valor |
|---|---|
| **Repositorio** | `puppeteer/puppeteer` |
| **URL** | https://github.com/puppeteer/puppeteer |
| **Licencia** | Apache 2.0 (uso comercial libre) |
| **Stars** | ~95,000 estrellas |
| **Actividad** | Activo — mantenido por Google Chrome Team |
| **NPM** | `npm i puppeteer-core` |
| **Tiempo de Integración Estimado** | 4–8 horas |
| **Complejidad** | Media — gestión de instancias de browser en producción |
| **Caso de Uso en FASE 18** | Renderizar HTML final (generado por Handlebars) en Chromium headless y exportar PDF de alta fidelidad |
| **Veredicto** | REUTILIZAR |

**Justificación:** Puppeteer con 95k estrellas es el estándar de la industria.  
Con puppeteer-core y browser pooling se optimiza rendimiento en producción.

---

### REPO-04 — Docxtemplater (Generación DOCX Word)

| Atributo | Valor |
|---|---|
| **Repositorio** | `open-xml-templating/docxtemplater` |
| **URL** | https://github.com/open-xml-templating/docxtemplater |
| **Licencia** | MIT / GPLv3 (dual — el core MIT es gratuito) |
| **Stars** | ~3,600 estrellas |
| **Actividad** | Activo — actualizaciones regulares 2024–2026 |
| **NPM** | `npm i docxtemplater pizzip` |
| **Tiempo de Integración Estimado** | 4–8 horas |
| **Complejidad** | Baja-Media — modules avanzados son de pago |
| **Caso de Uso en FASE 18** | Generar documentos Word corporativos a partir de plantillas .docx diseñadas en Microsoft Word |
| **Módulos Pagos** | HTML module, Image module (~$200 USD/año) si se requieren |
| **Veredicto** | REUTILIZAR (core gratuito suficiente para MVP) |

**Justificación:** Manipular archivos .docx manualmente es extremadamente complejo.  
Docxtemplater abstrae el XML Open Office. El core MIT cubre texto, loops y condicionales.

---

### REPO-05 — Documenso (Firma Electrónica)

| Atributo | Valor |
|---|---|
| **Repositorio** | `documenso/documenso` |
| **URL** | https://github.com/documenso/documenso |
| **Licencia** | AGPL-3.0 (self-hosted libre; cloud SaaS disponible) |
| **Stars** | ~13,200 estrellas |
| **Actividad** | Activo — desarrollo continuo 2024–2026 |
| **Tecnología** | Next.js + PostgreSQL + Prisma |
| **Tiempo de Integración Estimado** | 1–3 semanas (deploy self-hosted + API webhook) |
| **Complejidad** | Alta — requiere instancia separada, base de datos propia |
| **Caso de Uso en FASE 18** | Firma electrónica de documentos con trazabilidad legal |
| **Veredicto** | RESERVAR PARA FASE POSTERIOR (complejidad justifica fase separada) |

---

### REPO-06 — Carbone.io (Alternativa a Docxtemplater)

| Atributo | Valor |
|---|---|
| **Repositorio** | `carboneio/carbone` |
| **URL** | https://github.com/carboneio/carbone |
| **Licencia** | CCL (Community Edition libre; Enterprise con pago) |
| **Stars** | ~3,600 estrellas |
| **Actividad** | Activo |
| **NPM** | `npm i carbone` |
| **Tiempo de Integración Estimado** | 4–8 horas |
| **Complejidad** | Media — depende de LibreOffice para conversiones de formato |
| **Veredicto** | DESCARTADO — dependencia LibreOffice en servidor es overhead injustificado |

---

### REPO-07 — Playwright (Alternativa a Puppeteer para PDF)

| Atributo | Valor |
|---|---|
| **Repositorio** | `microsoft/playwright` |
| **URL** | https://github.com/microsoft/playwright |
| **Licencia** | Apache 2.0 |
| **Stars** | ~70,000+ estrellas |
| **Actividad** | Muy activo — mantenido por Microsoft |
| **NPM** | `npm i playwright` |
| **Tiempo de Integración Estimado** | 4–8 horas (similar a Puppeteer) |
| **Complejidad** | Media — API más moderna con auto-waiting |
| **Veredicto** | ALTERNATIVA VÁLIDA — Puppeteer seleccionado por mayor madurez en PDF específico |

---

## 2. Comparación: Integración Open Source vs. Desarrollo Propio

### 2.1 Matriz de Costos

| Categoría | Desarrollo Custom | Open Source Seleccionado | Ahorro |
|---|---|---|---|
| **Editor Visual** | 6–12 meses / $80,000–$150,000 USD | GrapesJS — 3–5 días / ~$2,000 USD | ~97% ahorro |
| **Motor de Plantillas** | 3–6 semanas / $15,000 USD | Handlebars.js — 2–4 horas / $200 USD | ~99% ahorro |
| **Generación PDF** | 2–4 meses / $30,000 USD | Puppeteer — 4–8 horas / $500 USD | ~98% ahorro |
| **Generación DOCX** | 2–3 meses / $25,000 USD | Docxtemplater — 4–8 horas / $500 USD | ~98% ahorro |
| **TOTAL** | ~$150,000–$200,000 USD | ~$3,200 USD | ~97% ahorro |

*Costos de desarrollo propio basados en $60 USD/hora para desarrollador senior.*

### 2.2 Comparación de Riesgos

| Riesgo | Desarrollo Custom | Open Source |
|---|---|---|
| **XSS / Inyección en plantillas** | ALTO — escaping manual | MITIGADO — Handlebars auto-escaping |
| **Corrupción de archivos DOCX** | ALTO — XML Open Office complejo | MITIGADO — Docxtemplater abstrae XML |
| **Compatibilidad PDF** | ALTO — CSS print es no-trivial | MITIGADO — Puppeteer usa Chromium nativo |
| **Mantenimiento largo plazo** | ALTO — deuda técnica propia | BAJO — comunidad activa |
| **Time-to-market** | Meses | Días |

### 2.3 Por qué replace('{{variable}}') está prohibido

Implementar un motor de reemplazo de variables propio introduce:

1. **Vulnerabilidad XSS** — sin escaping de < > & "
2. **Sin soporte de loops** — imposible iterar sobre arrays de items o impuestos
3. **Sin soporte de condicionales** — no se puede mostrar/ocultar secciones
4. **Sin parciales** — cabeceras/pies repetidos manualmente
5. **Sin pre-compilación** — penalización de rendimiento en cada render
6. **Sin testing comunitario** — bugs propios sin ecosistema

Todo esto ya está resuelto en Handlebars.js con licencia MIT.

---

## 3. Arquitectura de FASE 18 Seleccionada

```
DISEÑO DE PLANTILLA
        |
  [GrapesJS Editor]          <- Editor visual drag-and-drop (REPO-01)
        |
  HTML Template               <- Output: template HTML con variables Handlebars
        |
  [Handlebars.js]            <- Motor de plantillas (REPO-02)
        |
  Datos ERP (PostgreSQL)     <- Reutiliza tablas existentes (clientes, facturas, jobs)
        |
  HTML Final Renderizado     <- HTML con datos reales del tenant
        |
    -------------------------------------------------------
    |                                                     |
[Puppeteer]                                     [Docxtemplater]
    |                                                     |
  PDF Corporativo                               DOCX Word Corporativo
(facturas, reportes)                         (contratos, ordenes de compra)
(REPO-03)                                        (REPO-04)
```

---

## 4. Decisiones Congeladas para FASE 18

| # | Decisión | Justificación |
|---|---|---|
| D18-01 | GrapesJS como editor visual de plantillas | BSD-3, 25.9k stars, sin alternativa comparable |
| D18-02 | Handlebars.js como motor de plantillas | MIT, 18.6k stars, XSS-safe, 38M descargas/semana |
| D18-03 | Puppeteer para HTML → PDF | Apache 2.0, 95k stars, estándar de industria |
| D18-04 | Docxtemplater para Word corporativo | MIT core, sin dependencias externas de sistema |
| D18-05 | Documenso reservado para Fase posterior | AGPL requiere deploy separado, complejidad justifica fase propia |
| D18-06 | Carbone.io descartado | Dependencia LibreOffice en servidor es overhead injustificado |
| D18-07 | replace('{{variable}}') PROHIBIDO permanentemente | Inseguro e innecesario dado Handlebars.js disponible |

---

## 5. Plan de Implementación Siguiente

### Prerrequisitos (npm packages a instalar)
```bash
npm install grapesjs handlebars puppeteer-core docxtemplater pizzip
```

### Migración SQL requerida
- Tabla document_templates — almacena plantillas HTML + metadatos por tenant
- Tabla document_outputs — historial de documentos generados (PDF/DOCX)
- RLS multitenancy en ambas tablas
- Soft delete estándar del proyecto

### Entregables de FASE 18
1. supabase/migrations/20260617000018_documents_core.sql
2. scripts/test-documentos.ts
3. FASE18_IMPLEMENTATION_REPORT.md

---

## 6. Métricas de Gobernanza (Regla 8 de Modo Auditor 0.3)

| Métrica | Valor |
|---|---|
| Repositorios evaluados | 7 (mínimo requerido: 5) — CUMPLIDO |
| Repositorios seleccionados para reutilizar | 4 (GrapesJS, Handlebars, Puppeteer, Docxtemplater) |
| Repositorios descartados con justificación | 2 (Carbone.io, Documenso para esta fase) |
| Código custom justificado sin repo existente | 0 |
| Ahorro estimado vs desarrollo propio | ~97% ($147,000+ USD) |
| Deuda técnica introducida | 0 |
| Vulnerabilidades de seguridad evitadas | 5 (XSS, inyección, corrupción DOCX, PDF rendering, mantenimiento) |
| Tiempo de integración total estimado | 2–3 semanas de desarrollo |

---

*Documento generado conforme al Modo Auditor de Decisiones Congeladas (0.3).*  
*Firmado: Antigravity AI — Análisis REUSE obligatorio completado el 2026-06-17.*
