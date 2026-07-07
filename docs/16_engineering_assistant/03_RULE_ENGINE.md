# FASE 35: Asistente de Preingeniería Industrial
# 03_RULE_ENGINE: Motor de Reglas de Negocio

Este documento detalla la estructura lógica, evaluación de expresiones compuestas y el procesamiento del **Rule Engine** (Motor de Reglas) encargado de evaluar la lógica técnica y comercial del asistente.

---

## 1. Objetivo y Alcance

El **Rule Engine** es el cerebro lógico determinista del asistente. Su objetivo es evaluar si se cumplen las condiciones de bifurcación del árbol o activar reglas que alteren métricas operativas (Scoring) y sugieran productos o servicios específicos en base a los datos de la planta industrial.

---

## 2. Estructura de las Expresiones Lógicas (JSONB)

Las expresiones de las reglas se almacenan en `assistant_conditions.rule_expression` en formato estructurado JSONB. Esto permite definir condiciones simples y compuestas (AND / OR) anidadas de forma infinita.

### Ejemplo de Expresión Compuesta (AND / OR)
```json
{
  "logical_operator": "AND",
  "conditions": [
    {
      "field": "sector",
      "operator": "equals",
      "value": "mineria"
    },
    {
      "logical_operator": "OR",
      "conditions": [
        {
          "field": "temperatura",
          "operator": "greater_than",
          "value": 45
        },
        {
          "field": "presencia_gases",
          "operator": "equals",
          "value": true
        }
      ]
    }
  ]
}
```

---

## 3. Operadores de Comparación Soportados

El motor implementa estrictamente los siguientes evaluadores lógicos:

| Operador | Aplicabilidad | Descripción |
| :--- | :--- | :--- |
| `equals` | Texto, Booleanos, Números | Igualdad exacta. |
| `not_equals` | Texto, Booleanos, Números | Diferencia exacta. |
| `greater_than` | Números | Mayor estricto. |
| `less_than` | Números | Menor estricto. |
| `contains` | Arrays, Listas de Checkbox | Valida si un array contiene un elemento. |
| `starts_with` | Texto | Comparación de prefijo de texto. |

---

## 4. Algoritmo de Evaluación del Motor

El motor evalúa recursivamente el nodo de condición del JSONB:

1.  **Evaluación de Nodo Simple**:
    *   Extrae el valor del campo `field` desde `session.answers.variables`.
    *   Aplica el operador contra el `value` configurado en la regla.
    *   Retorna `true` o `false`.
2.  **Evaluación de Nodo Compuesto (AND / OR)**:
    *   Si es `AND`: Recorre todas las subcondiciones. Retorna `false` inmediatamente al encontrar el primer fallo (corto circuito). Si todas son verdaderas, retorna `true`.
    *   Si es `OR`: Recorre todas las subcondiciones. Retorna `true` inmediatamente al encontrar la primera coincidencia (corto circuito). Si todas fallan, retorna `false`.

---

## 5. Casos de Uso Empresarial

*   **Bifurcación de Caminos**: En el árbol de decisiones, el Flow Engine llama al Rule Engine para decidir si el usuario debe ir a preguntas de extracción pesada o a preguntas de ventilación comercial ligera.
*   **Activación de Reglas de Impacto**: Al finalizar la sesión, se evalúan todas las reglas asociadas al árbol. Las que resulten verdaderas inyectan modificadores de score o recomendaciones de catálogo en el informe final.
