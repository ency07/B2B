# FASE 35: Asistente de Preingeniería Industrial
# 07_FORM_BUILDER: Generador de Formularios y Tipos de Entrada Dinámicos

Este documento define la especificación técnica del **Form Builder** (Generador de Formularios), el cual interpreta la metadata de los nodos para renderizar dinámicamente los controles en la interfaz del Wizard.

---

## 1. Objetivo y Alcance

El **Form Builder** lee la estructura almacenada en `assistant_nodes.metadata` para pintar de forma dinámica los campos del Wizard. Su objetivo es evitar cualquier maquetación hardcodeada de inputs, permitiendo agregar, renombrar o eliminar preguntas directamente desde base de datos.

---

## 2. Tipos de Campos Soportados

El motor de renderizado del cliente (`WizardStepper.tsx`) debe dar soporte nativo a los siguientes tipos de entrada estructurada:

| Tipo de Campo | Elemento UI | Metadata Requerida | Uso en Ingeniería |
| :--- | :--- | :--- | :--- |
| `number` | Input numérico | `min`, `max`, `step`, `unit` | Dimensiones físicas (Largo, Ancho, Alto). |
| `slider` | Barra deslizadora | `min`, `max`, `step`, `unit` | Ajuste rápido de rangos térmicos o caudales. |
| `radio` | Selección única | `options: [{label, value}]` | Tipo de servicio, nivel de urgencia. |
| `checkbox` | Selección múltiple | `options: [{label, value}]` | Checklist de síntomas o polución de planta. |
| `select` | Menú desplegable | `options: [{label, value}]` | Cargo profesional, sector industrial. |
| `file` | Selector de archivos | `accept: ["pdf", "dwg"]` | Carga de planos de planta o especificaciones. |
| `gps` | Captura geográfica | `required: boolean` | Ubicación exacta de la planta para clima local. |
| `signature`| Panel de firma táctil | `required: boolean` | Aceptación de términos o disclaimer técnico. |
| `matrix` | Tabla interactiva | `rows: [], cols: []` | Registro de múltiples áreas y sus síntomas. |

---

## 3. Campos Condicionales y Visibilidad Dinámica

La metadata del nodo puede incluir una clave `visibility_rule` que determina si el campo debe mostrarse u ocultarse basándose en respuestas previas del usuario.

### Ejemplo de Metadata con Regla de Visibilidad
```json
{
  "field_name": "porcentaje_polvo",
  "field_type": "slider",
  "min": 0,
  "max": 100,
  "unit": "%",
  "visibility_rule": {
    "field": "symptoms_dust",
    "operator": "equals",
    "value": true
  }
}
```
*   **Procesamiento**: El Form Builder en el cliente evalúa `visibility_rule` contra `session.answers.variables`. Si evalúa a `false`, el input se desmonta del DOM y su valor se limpia para evitar contaminar los cálculos.

---

## 4. Validaciones Estrictas por Tipo

*   **Zod dinámico**: El Form Builder compila dinámicamente un esquema de validación de Zod en base a la lista de campos del nodo actual antes de permitir el paso al siguiente nodo.
*   **Mensajes de Error**: Los mensajes de validación (ej: "El largo debe ser mayor a 0 m") se configuran en el JSON de metadata, evitando textos genéricos del navegador.
