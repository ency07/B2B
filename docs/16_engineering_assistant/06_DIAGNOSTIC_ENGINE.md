# FASE 35: Asistente de Preingeniería Industrial
# 06_DIAGNOSTIC_ENGINE: Motor de Síntesis y Diagnóstico Técnico

Este documento detalla la lógica de procesamiento, estructura y reglas de redacción del **Diagnostic Engine** (Motor de Diagnóstico), encargado de formular el informe de preingeniería preliminar para el cliente.

---

## 1. Objetivo y Alcance

El **Diagnostic Engine** actúa como el transcriptor técnico del asistente. Su objetivo es estructurar un diagnóstico preliminar coherente basado en las respuestas recogidas durante la entrevista, sin recurrir a IA.
*   **Enfoque de Preventa Consultiva**: El informe debe ayudar al cliente a entender la raíz de sus síntomas operativos (temperatura, polución, ruidos).
*   **Aviso de Validación Física**: El documento debe enfatizar de forma obligatoria que el pre-diagnóstico es consultivo y requiere validación en sitio por un ingeniero de AeroMax mediante visita técnica.

---

## 2. Componentes del Informe Técnico de Salida

Cada diagnóstico generado se guarda en la tabla `assistant_diagnostics` y se divide en las siguientes secciones configurables:

1.  **Resumen Ejecutivo**: Explicación de la planta y el volumen de aire analizado.
2.  **Problemas Detectados**: Listado de patologías térmicas o dinámicas en base a síntomas seleccionados.
3.  **Posibles Causas**: Explicación física del problema (ej: "Baja tasa de renovación provoca saturación de calor por radiación de hornos").
4.  **Recomendaciones Técnicas**: Medidas correctivas inmediatas (materiales, ductos, filtros).
5.  **Nivel de Confianza del Reporte**:
    *   *ALTO*: Si el usuario ingresó todas las dimensiones, seleccionó una ciudad válida y detalló síntomas.
    *   *MEDIO*: Si faltan datos de síntomas o se usaron dimensiones aproximadas.
    *   *BAJO*: Si se omitieron parámetros o el email es de dominio público.

---

## 3. Plantillas de Texto Dinámicas (Decision Tree Mapping)

Para evitar el uso de IA y mantener un control estricto del lenguaje, el motor utiliza bloques de texto preestablecidos en base de datos asociados a los nodos del árbol y concatenados por reglas.

### Reglas de Construcción del Texto
*   *Bloque de Introducción*: "En base al análisis dimensional para la planta ubicada en `{ciudad}`, se calculó un volumen total de `{volumen} m³` con una tasa de renovación recomendada de `{ach} ACH` para entornos de tipo `{entorno}`..."
*   *Bloque de Síntoma (Calor)*: "Se identifica una carga térmica crítica. El diferencial de temperatura respecto al exterior puede verse afectado por la radiación de maquinaria, lo que exige álabes de perfil aerodinámico de alta eficiencia."
*   *Bloque de Cláusula de Salvaguarda (Disclaimer)*: "IMPORTANTE: Este reporte constituye un pre-diagnóstico preliminar elaborado de forma algorítmica. No sustituye un diseño ejecutivo detallado. El resultado final y los caudales definitivos deben ser validados en campo por un Ingeniero de Soporte de AeroMax Industrial."

---

## 4. Registro y Consistencia B2B

El pre-diagnóstico se genera en formato HTML/Markdown limpio y se persiste en `assistant_diagnostics.pre_diagnosis`. Esta consistencia textual se inyecta directamente tanto en el visualizador de la pantalla final del prospecto, en el PDF descargable y en la ficha del Lead dentro del CRM del ERP para el ejecutivo comercial.
