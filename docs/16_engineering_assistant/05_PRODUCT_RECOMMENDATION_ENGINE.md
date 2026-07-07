# FASE 35: Asistente de Preingeniería Industrial
# 05_PRODUCT_RECOMMENDATION_ENGINE: Motor de Recomendación de Catálogo

Este documento describe el funcionamiento, lógica de asociación y compatibilidad del **Product Recommendation Engine** (Motor de Recomendación de Productos), encargado de sugerir equipos, accesorios y servicios del catálogo del ERP.

---

## 1. Objetivo y Alcance

El **Product Recommendation Engine** asocia dinámicamente las necesidades identificadas en la entrevista técnica con registros reales del catálogo del ERP:
*   **Sugerencia de Productos**: Selección de familias de ventiladores, blowers o extractores que satisfacen el caudal (CFM) requerido.
*   **Asociación de Accesorios y Repuestos**: Recomendación de ductería, persianas de gravedad, dampers o filtros.
*   **Asociación de Servicios**: Propuesta de servicios complementarios como balanceo in-situ, planos CAD detallados o inspecciones de seguridad eléctrica.

Todo esto se calcula de forma estructurada mediante reglas lógicas explícitas, sin utilizar lógica difusa o inteligencia artificial.

---

## 2. Lógica de Mapeo de Caudales (CFM Mapping)

El motor evalúa el caudal requerido en CFM contra los rangos nominales de los productos registrados en Supabase (`products` y `product_specifications`):

```
[CFM Requerido]
     │
     ├─ [CFM < 2,000] ────────> Sugerir: Extractores Axiales Comerciales (Serie LX)
     ├─ [2,000 <= CFM < 8,000] ──> Sugerir: Extractores Tipo Hongo de Techo (Serie ER-H)
     ├─ [8,000 <= CFM < 15,000] ─> Sugerir: Ventiladores Centrifugos de Media Presión (Serie ER-C)
     └─ [CFM >= 15,000] ───────> Sugerir: Sopladores Industriales Blower (Serie ER-B)
```

---

## 3. Matriz de Recomendación de Accesorios y Servicios

Las reglas del motor de diagnóstico inyectan sugerencias adicionales en base a variables ambientales:

| Condición Técnica | Elemento Recomendado | Tipo | Justificación de Ingeniería |
| :--- | :--- | :--- | :--- |
| `symptoms.humidity = true` | Álabes con recubrimiento epóxico | Accesorio | Previene la corrosión química y salina en la hélice. |
| `symptoms.dust = true` | Filtros de material particulado | Accesorio | Captura polución y aserrín protegiendo el motor. |
| `environment = 'data_center'`| Amortiguadores de vibración | Accesorio | Evita resonancias estructurales sobre el suelo técnico. |
| `environment = 'mining'` | Servicio de Diseño y Simulación CFD| Servicio | Modelado de presiones para túneles mineros profundos. |
| `urgencia = 'alta'` | Servicio de Instalación Express | Servicio | Ejecución técnica prioritaria por cese de operación. |

---

## 4. Estructura de Salida en Base de Datos

Las recomendaciones se guardan en `assistant_diagnostics.recommendations` como un array de objetos con el siguiente esquema JSONB:
```json
[
  {
    "item_type": "PRODUCT",
    "product_code": "PRO-000001",
    "name": "Blower Centrifugo ER-B1",
    "required_quantity": 2,
    "justification": "Satisface el caudal de 16,500 CFM con balanceo redundante en planta."
  },
  {
    "item_type": "SERVICE",
    "service_name": "Balanceo Dinámico In-Situ",
    "justification": "Recomendado para asegurar cero vibraciones tras la instalación."
  }
]
```

Esto permite al ERP cargar directamente las cotizaciones agregando estos ítems de forma automática al pipeline comercial de forma atómica.
