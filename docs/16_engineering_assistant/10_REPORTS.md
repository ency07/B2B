# FASE 35: Asistente de Preingeniería Industrial
# 10_REPORTS: Generador de Reportes PDF Técnicos y Comerciales

Este documento define las especificaciones técnicas y diagramación vectorial del generador de reportes PDF en el cliente (`jsPDF`) y la estructura del informe de preingeniería.

---

## 1. Objetivo y Alcance

El módulo de reportes compila de forma atómica los resultados de los motores de caudal, precios, recomendación y diagnóstico en un documento PDF multipágina descargable y de aspecto altamente corporativo.
*   **Generación en Cliente**: Se ejecuta del lado del navegador para ahorrar recursos de servidor y permitir descargas instantáneas incluso con baja conectividad.
*   **Importación Dinámica**: La librería `jsPDF` se carga bajo demanda (`import("jspdf")`) únicamente cuando el usuario presiona el botón de descarga, reduciendo el bundle inicial del Wizard.

---

## 2. Estructura y Diagramación del Reporte (3 Páginas)

El documento PDF se formatea en tamaño A4 con un diseño sobrio y técnico:

### Página 1: Portada de Ingeniería
*   **Encabezado**: Logotipo del tenant inyectado dinámicamente y barra decorativa de color de la marca.
*   **Título**: "INFORME DE PREINGENIERÍA INDUSTRIAL - SISTEMA HVAC" (en Outfit bold).
*   **Cuerpo Central**: Cuadro gris técnico (`bg-zinc-950/20`) con metadatos del reporte: Código (ej: `DIA-000045`), fecha de emisión, nombre del lead, razón social y ciudad de la planta.
*   **Pie de Página**: Disclaimer de confidencialidad de AeroMax Industrial.

### Página 2: Parámetros Técnicos y Diagnóstico Operativo
*   **Cálculo Dimensional**: Tabla con dimensiones ingresadas (largo, ancho, alto), volumen total en m³ y en pies cúbicos, y tipo de entorno con su tasa de renovación (ACH).
*   **Resultados de Caudal**: Caudal calculado en CFM destacado en color de marca.
*   **Síntomas & Severidad**: Gráfico esquemático del índice de severidad de desgaste y listado de fallas reportadas.
*   **Pre-Diagnóstico Técnico**: Síntesis del texto explicativo generado por el Diagnostic Engine.

### Página 3: Propuesta Comercial y Recomendaciones de Equipos
*   **Catálogo Recomendado**: Tabla listando SKUs de ventiladores o extractores compatibles, cantidad sugerida, accesorios requeridos y servicios asociados.
*   **Rango de Inversión Estimado**: Rangos presupuestarios expresados paralelamente en Pesos Colombianos (COP) y Dólares Estadounidenses (USD) con desviación de ±15%.
*   **Cláusula de Garantía**: Nota de garantía de fábrica estándar de 12 meses.
*   **Disclaimer Legal de Ingeniería**: Advertencia obligatoria indicando que el informe es preliminar y requiere inspección física en sitio.

---

## 3. Estilos Vectoriales y Fuentes en jsPDF

Para evitar un PDF plano de texto plano y garantizar la estética de Siemens:
*   **Líneas de Trazado**: Uso de `doc.setLineWidth(0.5)` y `doc.setDrawColor()` en grises claros para dibujar tablas y divisiones limpias de celdas.
*   **Contenedores Rellenos**: Uso de `doc.setFillColor(244, 244, 245)` para pintar fondos de tablas y destacar celdas críticas.
*   **Fuentes del Sistema**: Configuración de `doc.setFont("Helvetica", "bold" | "normal")` y control preciso de coordenadas de texto (`doc.text()`) para evitar solapamientos.
