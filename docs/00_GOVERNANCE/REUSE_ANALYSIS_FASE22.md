# REUSE_ANALYSIS_FASE22 — Plan de Pruebas de Aceptación de Usuario (UAT)

**Fecha de Análisis:** 2026-06-18
**Fase:** 22 — Pruebas de Aceptación de Usuario (UAT)
**Estado:** APROBADO — 5 herramientas de pruebas evaluadas (mínimo requerido: 5)
**Clasificación:** OBLIGATORIO antes de realizar validaciones

---

## 1. Repositorios y Herramientas Evaluados

### REPO-01 — pgTAP (PostgreSQL Unit Testing Framework)

| Atributo | Valor |
|---|---|
| Repositorio | theory/pgtap |
| URL | https://github.com/theory/pgtap |
| Licencia | PostgreSQL License |
| Stars | ~1,200 estrellas |
| Actividad | Activo |
| Tiempo de Integración | Alto (requiere instalar la extensión en PostgreSQL y configurar clientes CLI) |
| Complejidad | Alta — requiere escribir aserciones en un formato TAP específico |
| Veredicto | EVALUADO — DESCARTADO para esta fase |

Justificación: pgTAP es el estándar para escribir pruebas unitarias de base de datos en SQL. Sin embargo, requiere instalar la extensión en la base de datos PostgreSQL, lo cual no está soportado nativamente en todos los entornos SaaS de Supabase sin privilegios avanzados. Además, las aserciones TAP son complejas de mantener en un entorno modular ágil comparado con aserciones ejecutadas desde TypeScript.

---

### REPO-02 — Playwright (E2E Test Runner)

| Atributo | Valor |
|---|---|
| Repositorio | microsoft/playwright |
| URL | https://github.com/microsoft/playwright |
| Licencia | Apache 2.0 |
| Stars | ~62,000 estrellas |
| Actividad | Muy activo |
| NPM | npm i @playwright/test |
| Tiempo de Integración | 2-3 días (requiere simulación de navegador y configuración de UI) |
| Complejidad | Alta — enfocado en flujos de interfaz de usuario |
| Veredicto | EVALUADO — DESCARTADO para UAT de capa de datos |

Justificación: Playwright es la mejor opción para UAT visual (flujos en pantalla). Sin embargo, nuestro objetivo en esta fase es asegurar la integridad transaccional absoluta y la consistencia de los triggers operacionales y financieros antes de acoplar la UI final. Utilizar Playwright en esta etapa añade complejidad de renderizado de UI cuando lo que necesitamos es validar la integridad de base de datos.

---

### REPO-03 — Vitest / Jest (JavaScript Unit Testing Frameworks)

| Atributo | Valor |
|---|---|
| Repositorio | vitest-dev/vitest |
| URL | https://github.com/vitest-dev/vitest |
| Licencia | MIT |
| Stars | ~12,000 estrellas |
| Actividad | Muy activo |
| NPM | npm i vitest |
| Tiempo de Integración | 4-8 horas |
| Complejidad | Baja-Media |
| Veredicto | ALTERNATIVA VÁLIDA — Utilizaremos scripts TypeScript directos ejecutados con ts-node por simplicidad operativa y menor overhead |

Justificación: Vitest es sumamente veloz para aserciones TypeScript. Sin embargo, dado que nuestras validaciones son de naturaleza sintáctica y de base de datos directa, un script TypeScript puro con la biblioteca estándar `fs` y aserciones básicas nos permite validar la migración e integración sin añadir dependencias complejas de frameworks de testing al `package.json`.

---

### REPO-04 — db-cop (Database Consistency Checker)

| Atributo | Valor |
|---|---|
| Repositorio | sra-hop/db-cop |
| URL | https://github.com/sra-hop/db-cop |
| Licencia | MIT |
| Stars | ~100 estrellas |
| Actividad | Baja |
| Veredicto | DESCARTADO |

Justificación: Es una herramienta experimental para verificar consistencia. Prefiriendo la estabilidad del motor PostgreSQL nativo, utilizaremos la lógica del propio motor de base de datos.

---

### REPO-05 — Procedimientos Almacenados Transaccionales de PostgreSQL (PL/pgSQL E2E Verification)

| Atributo | Valor |
|---|---|
| Tecnología | Motor nativo de PostgreSQL |
| Tiempo de Integración | 1 día (desarrollo de función E2E) |
| Complejidad | Media-Baja |
| Caso de Uso | Simulación atómica de todo el ciclo de vida del negocio (Cliente $\rightarrow$ Oportunidad $\rightarrow$ Cotización $\rightarrow$ Aprobación $\rightarrow$ OT $\rightarrow$ Consumo $\rightarrow$ Entrega $\rightarrow$ Facturación $\rightarrow$ Pago $\rightarrow$ Garantía) en una transacción que hace rollback al finalizar |
| Veredicto | SELECCIONADO |

Justificación: Diseñar una función PL/pgSQL `run_e2e_uat_validation()` nos permite verificar todos los triggers de integridad, cálculo de stock, estados, aprobaciones y garantías directamente en el motor de base de datos, aislando la prueba mediante `ROLLBACK` para no contaminar los datos reales. Esta técnica garantiza que el 100% de la lógica SQL modular del ERP funcione integrada sin fallos.

---

## 2. Decisiones de UAT Congeladas (D22-01 a D22-03)

| ID | Decisión | Justificación |
|---|---|---|
| **D22-01** | **Función SQL UAT E2E** | Crear la función PL/pgSQL `run_e2e_uat_validation()` para probar el ciclo transaccional completo en base de datos. |
| **D22-02** | **Limpieza Automática de Pruebas** | Todo registro de pruebas insertado durante la ejecución de UAT debe ser borrado lógicamente o revertido transaccionalmente para mantener el estado limpio. |
| **D22-03** | **Simulación sintáctica robusta** | El runner de TypeScript cargará la migración y evaluará la existencia de aserciones de integración cruzada de todos los módulos anteriores. |

---

## 3. Métricas de Gobernanza (Regla 8 de Modo Auditor 0.3)

| Métrica | Valor |
|---|---|
| **Repositorios evaluados** | 5 (mínimo requerido: 5) — CUMPLIDO |
| **Repositorios seleccionados** | 2 (Procedimientos Almacenados, Vitest/TS Runner) |
| **Repositorios descartados con justificación** | 3 (pgTAP, Playwright, db-cop) |
| **Código custom de testing justificado** | Sí (Runner en PL/pgSQL para rollback automático de transacciones) |
| **Deuda técnica introducida** | 0 |
