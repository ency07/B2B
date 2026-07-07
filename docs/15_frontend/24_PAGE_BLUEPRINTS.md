# 24_PAGE_BLUEPRINTS: Planos de Pantalla y Narrativas de Negocio

Este documento detalla la estructura lógica sección por sección de las páginas principales del ecosistema **AeroMax Industrial**: la Landing Page Comercial, la Ficha Técnica de Producto y el Dashboard Operativo del ERP.

---

## 1. Landing Page Comercial: La Narrativa de Confianza B2B

La landing page no es un escaparate de comercio electrónico común; es un recorrido técnico estructurado para vender grandes proyectos de ingeniería e inyectar confianza.

```
+-----------------------------------------------------------+
| SECCIÓN 1: Hero Técnico (Outfit + Inter, Trust Badges)   |
+-----------------------------------------------------------+
| SECCIÓN 2: Empresas que Confían (Logos mineros/siderúrgicos)|
+-----------------------------------------------------------+
| SECCIÓN 3: Problemas que Resolvemos (Pain Points vs Sol)  |
+-----------------------------------------------------------+
| SECCIÓN 4: Mapa de Procesos / Planta Industrial (SVG)     |
+-----------------------------------------------------------+
| SECCIÓN 5: Sectores Industriales Atendidos                |
+-----------------------------------------------------------+
| SECCIÓN 6: Servicios de Preingeniería (CFD, Balanceo, ...)  |
+-----------------------------------------------------------+
| SECCIÓN 7: Calculadora Aerodinámica (Cálculo CFM en vivo) |
+-----------------------------------------------------------+
| SECCIÓN 8: Catálogo Técnico (Productos como Fichas)       |
+-----------------------------------------------------------+
| SECCIÓN 9: Casos de Éxito Reales (CFM, ACH, ROI térmico)  |
+-----------------------------------------------------------+
| SECCIÓN 10: CTA Final de Ingeniería hacia el Wizard       |
+-----------------------------------------------------------+
```

### Detalle de Secciones Clave
*   **Sección 4: Mapa de Procesos (Planta Industrial Esquemática)**: Un plano vectorial SVG inline de una nave industrial típica. Muestra los puntos de instalación de extractores de aire axiales, inyectores, ciclones y dampers, permitiendo al usuario hacer clic para ver el rol de cada equipo.
*   **Sección 7: Calculadora Aerodinámica Directa**: Un widget interactivo integrado directamente en la landing para que el usuario calcule instantáneamente el volumen y CFM recomendados, enganchándolo de inmediato con datos de ingeniería antes de invitarlo al Wizard.

---

## 2. Ficha Técnica del Producto (Autodesk & Siemens Style)

El catálogo no se estructura como una tienda de compras; se presenta como una biblioteca de especificaciones de ingeniería.

```
+-----------------------------------------------------------------+
|                       CABECERA: Nombre y Código de Serie        |
+-----------------------------------------------------------------+
|                                                                 |
|   [COLUMNA 1 - 65% - VISUAL ANCLA]     | [COLUMNA 2 - 35% - DATA] |
|                                        |                          |
|   - Render Técnico / Plano Esquemático  | - Tabla de Especificaciones|
|   - Modelo CAD Interactivo (SVG/Viewer)|   (Caudal, RPM, Motor,   |
|                                        |    Material, Peso) en Mono|
|   - Curva Aerodinámica Vectorial SVG  |                          |
|     (Presión vs Caudal, Grid, Óptimo)  | - Botones de Acción:     |
|                                        |   * Descargar CAD (.step)|
|                                        |   * Descargar PDF Manual |
|                                        |   * Solicitar Cotización |
+-----------------------------------------------------------------+
| ACCESORIOS Y COMPATIBILIDAD: Repuestos, Motores, Acoples, Ductos|
+-----------------------------------------------------------------+
```

---

## 3. Dashboard del ERP Operativo (Siemens & SAP Fiori Style)

El panel del ERP no es una colección pasiva de cajas de números; es una consola de mando de transacciones vivas.

```
+-----------------------------------------------------------------+
|  HEADER: Tenant Branding, Buscador Técnico Global y Notificaciones|
+-----------------------------------------------------------------+
|  PANEL DE ALERTA DE SLA: Requerimientos en riesgo (ProgressBar) |
+-----------------------------------------------------------------+
|                                                                 |
|   [COLUMNA 1 - 70% - WORKSPACE VIVO]    | [COLUMNA 2 - 30% - FEED] |
|                                         |                          |
|   - Grid de Vistas Especializadas:      | - Feed de Actividad      |
|     * Órdenes de Trabajo Críticas       |   Operacional (Real-time)|
|     * Tabla de Inventario de Bodegas    |   (Entradas, Salidas,    |
|     * Facturas en Mora / Por cobrar     |    Aprobaciones, Alertas)|
|                                         |                          |
|   - Detalle Rápido (Panel Dividido)    | - KPIs de Margen por OT  |
|                                         |   (Sparklines de cost)   |
+-----------------------------------------------------------------+
```
