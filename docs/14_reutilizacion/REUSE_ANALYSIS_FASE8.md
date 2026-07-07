# ANÁLISIS DE REUTILIZACIÓN - FASE 8: Facturación

Este documento detalla el análisis de reutilización y adquisición de activos para el componente de **Facturación (Invoicing)** del sistema ERP B2B Premium, conforme a las directivas de reutilización del proyecto.

---

## 1. Análisis del Módulo

El módulo de Facturación se encarga de emitir comprobantes de cobro a clientes asociados a sus Trabajos/OTs finalizadas o Cotizaciones aprobadas, aplicar los impuestos del tenant correspondiente, calcular saldos pendientes de cartera y controlar estados (Pendiente, Parcialmente Pagada, Pagada, Vencida, Anulada).

---

## 2. Repositorios y Librerías Evaluados

### 2.1 Motor de Facturación y Persistencia
*   **Opción A: Invoicing Module de ERPNext / Odoo Community**
    *   **Licencia:** GPLv3 / LGPLv3.
    *   **Descripción:** Motores de facturación robustos con soporte multimoneda y localización de impuestos.
    *   **Pros:** Funcionalidades avanzadas de conciliación bancaria preconstruidas.
    *   **Contras:** Requiere adaptar una base de datos externa gigante y choca con el requisito de aislamiento multiempresa por RLS nativo en Postgres.
*   **Opción B: Desarrollo Propio sobre PostgreSQL (StateMachine en DB + Server Actions)**
    *   **Licencia:** MIT (propietaria del proyecto).
    *   **Descripción:** Creación del esquema relacional `invoices` e `invoice_taxes` acoplado nativamente a la estructura de `tenants`, `clients` y `jobs` existente, controlando transiciones por triggers.
    *   **Pros:** Integración perfecta con RLS, trazabilidad total con OTs, control absoluto de estados, cero dependencias de infraestructura y máximo rendimiento de tokens.
    *   **Decisión:** **Opción B (Desarrollo Propio)**.

### 2.2 Generación de PDFs de Facturas
*   **Opción A: React-pdf (MIT)**
    *   **Descripción:** Generación declarativa de PDFs en el servidor/cliente mediante componentes de React.
    *   **Pros:** Rápido, no requiere levantar instancias de navegadores Chromium en backend, ideal para despliegues ligeros.
*   **Opción B: Puppeteer / Chrome Headless (Apache 2.0)**
    *   **Descripción:** Levantar un navegador para renderizar una vista HTML a PDF.
    *   **Contras:** Alto consumo de memoria y CPU.
    *   **Decisión:** **Opción A (React-pdf)** para el pintado dinámico y descarga del documento.

---

## 3. Costo de Adaptación e Integración

*   **Esquema de Datos y Triggers:** $0 USD (Desarrollo directo en Supabase/PostgreSQL usando triggers PL/pgSQL).
*   **Librerías Frontend:** Reutilización de componentes Shadcn/UI (MIT) para la visualización del listado y detalle de facturas en el ERP del tenant.
*   **Coste de Integración Técnica:** Bajo-Medio. Consiste en enlazar la transición de OTs a Facturas y el control de cartera.

---

## 4. Recomendación Final

Alinear la construcción de la FASE 8 utilizando:
1.  **Tablas Relacionales Propias** (`invoices`, `invoice_taxes`) en PostgreSQL con triggers que automaticen el cálculo de totales (`balance_amount := total_amount - paid_amount`) e inmutabilidad física.
2.  **Políticas RLS Multiempresa** heredadas de Supabase Auth.
3.  **Librería React-pdf** para la descarga visual de la factura por el cliente y el administrador.
