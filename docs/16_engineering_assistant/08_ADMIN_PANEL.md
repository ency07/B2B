# FASE 35: Asistente de Preingeniería Industrial
# 08_ADMIN_PANEL: Panel de Administración del Árbol de Decisiones (ERP)

Este documento define la estructura y funcionalidad del **Panel del Administrador** del Asistente dentro de las pantallas protegidas del ERP, permitiendo la configuración completa de la lógica de decisiones sin tocar código.

---

## 1. Objetivo y Alcance

El **Panel del Administrador** permite a los ingenieros jefes y directores comerciales de AeroMax gestionar y actualizar el comportamiento del Wizard:
*   Creación y edición visual de Árboles de Decisión.
*   Gestión de Nodos (Preguntas, Reglas, Diagnósticos).
*   Configuración de Conexiones condicionales (Aristas).
*   Definición de modificadores de Scoring y Recomendaciones de productos reales del inventario.

---

## 2. Editor de Árboles de Decisión (Grafo Visual)

El ERP incorporará un lienzo interactivo de grafos (basado en React Flow copiado localmente o componentes de rejilla fina) que permite:
*   **Crear Nodos**: Arrastrar y soltar tipos de nodos (Pregunta, Regla de Impacto, Diagnóstico).
*   **Conectar Nodos**: Dibujar aristas entre nodos. Al hacer clic en una conexión, se abre un Popover para asociar una condición de `assistant_conditions` (ej: "Conectar si Respuesta = Minería").
*   **Visualizar Flujos**: Resaltar los caminos críticos y detectar nodos huérfanos o ciclos infinitos antes de publicar.

---

## 3. Editor de Reglas de Impacto y Scoring B2B

Para cada nodo o respuesta, el administrador puede definir modificadores en un formulario estructurado:

### Interfaz del Editor de Reglas de Impacto
```
[ SI ]
  Campo: [ sector       ] [ equals     ] Valor: [ Minería      ]
  Y
  Campo: [ temperatura  ] [ greater    ] Valor: [ 40           ]

[ ENTONCES ]
  Modificador: [ Criticidad  ] [ + ] [ 40 ]
  Sugerir Producto: [ Blower Centrífugo ER-B1 ] Cantidad: [ 1 ]
  Sugerir Servicio: [ Simulación de Flujos CFD ]
  Establecer Riesgo Lead: [ CALIENTE ]
```

---

## 4. Validaciones de Integridad y Versionado

Para evitar que un cambio en caliente rompa la experiencia del Wizard público:
*   **Versionado**: Al guardar cambios, se crea una nueva versión inactiva del árbol. Las sesiones activas de los usuarios continúan ejecutándose sobre la versión previa.
*   **Triggers de Validación de Ciclos**: Un trigger BEFORE UPDATE en `assistant_connections` recorre el grafo mediante búsqueda en profundidad (DFS) para verificar que no se introduzcan bucles infinitos.
*   **Validación de SKUs**: Si se elimina un artículo de la tabla `inventory_items` o `products`, un trigger de integridad advierte al administrador si dicho producto está referenciado como recomendación activa en el Asistente, impidiendo la rotura de referencias.
*   **Soft Delete**: Los árboles y conexiones antiguas se marcan con soft delete (`deleted_at`) para mantener el historial de reportes previos consistentes.
