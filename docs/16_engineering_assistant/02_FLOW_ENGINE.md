# FASE 35: Asistente de Preingeniería Industrial
# 02_FLOW_ENGINE: Motor de Transición de Nodos y Control de Flujo

Este documento describe las responsabilidades, algoritmos y casos de uso del **Flow Engine** (Motor de Flujos), el componente encargado de guiar al usuario a través del árbol de decisiones.

---

## 1. Objetivo y Alcance

El **Flow Engine** es el responsable de:
*   Determinar cuál es el siguiente paso (nodo) del asistente en base al estado de la sesión y a la respuesta recibida.
*   Resolver las conexiones condicionales evaluando reglas y ramificaciones del árbol.
*   Mantener el estado de la navegación de forma que el usuario pueda retroceder (`Atrás`) u omitir pasos opcionales sin perder la coherencia.

---

## 2. Definición del Estado de la Sesión

El estado de la sesión del asistente se mantiene en la tabla `assistant_sessions` mediante el campo `answers` (`JSONB`). La estructura de este JSON almacena:
*   `current_node_id`: Identificador del nodo actual en el que se encuentra el usuario.
*   `history`: Array ordenado de IDs de nodos visitados para habilitar navegación fluida hacia atrás (`[node_id_1, node_id_2, ...]`).
*   `variables`: Paquete llave-valor de los datos recopilados (ej: `{"length": 15, "environment": "mining"}`).

---

## 3. Algoritmo de Transición (Siguiente Nodo)

Cuando el usuario envía una respuesta, el Flow Engine procesa el cambio de estado según los siguientes pasos lógicos:

```
[Usuario responde en Nodo A]
             │
             ▼
[Guardar valor en answers.variables]
             │
             ▼
[Recuperar assistant_connections donde source_node_id = A]
             │
             ▼
[¿Tiene conexiones salientes?]
    ├── NO ──> [Establecer sesión en status = COMPLETED y disparar Diagnóstico]
    └── SÍ ── [Recorrer conexiones ordenadas por prioridad]
                 │
                 ▼
     [Para cada conexión: ¿Tiene condition_id?]
         ├── NO ──> [Es conexión directa. Seleccionar target_node_id]
         └── SÍ ──> [Invocar Rule Engine para evaluar condition_id]
                       ├── Evalúa TRUE ──> [Seleccionar target_node_id y detener bucle]
                       └── Evalúa FALSE ──> [Continuar al siguiente elemento de la lista]
```

---

## 4. Gestión del Flujo hacia Atrás (History Stack)

Para garantizar una UX fluida y evitar la pérdida de consistencia de los datos analíticos:
1.  **Pila de Navegación**: Al avanzar a un nuevo nodo, el ID del nodo de origen se apila en `answers.history`.
2.  **Operación "Atrás"**: Al retroceder, el Flow Engine:
    *   Desapila el último elemento de `answers.history`.
    *   Establece `current_node_id` con dicho valor.
    *   *No elimina* las variables del JSON para mantener campos pre-poblados, pero recalcula las dependencias si el usuario cambia su respuesta previa.

---

## 5. Excepciones y Validaciones Operativas

*   **Bucle Infinito**: El panel administrativo del ERP valida en base de datos mediante triggers que no existan ciclos cerrados en el grafo de conexiones (grafo acíclico dirigido - DAG).
*   **Campos Huérfanos**: Si una condición hace referencia a una variable que no ha sido respondida aún por falta de paso previo, el Flow Engine captura el error, detiene la transición y reporta una alerta técnica en la sesión, forzando la redirección al último punto consistente.
