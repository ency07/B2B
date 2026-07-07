# 22_UX_PATTERNS: Patrones de Interacción y Operación Industrial

Este documento define los patrones de UX/UI obligatorios para la navegación, gestión de información y flujos operativos del **ERP B2B Premium** (AeroMax Industrial). Sustituye permanentemente los esquemas de visualización genéricos de SaaS de consumo por interfaces de alta densidad e impacto operativo.

---

## 1. Adiós al Dashboard de Bloques Huérfanos

Se prohíbe el uso de cuadrículas saturadas de tarjetas KPI huérfanas o gráficos de dona decorativos. En su lugar, toda pantalla operativa debe estructurarse mediante patrones de acción y diagnóstico.

### A. Vista de Detalle Deslizable (Drill-Down / Sheet Panel)
*   **Patrón**: Al interactuar con un registro en cualquier tabla inteligente (por ejemplo, una orden de trabajo o una cotización), no se debe redirigir al usuario fuera del contexto ni abrir un modal centrado e intrusivo.
*   **Interacción**: Se debe deslizar un panel lateral derecho (Radix `Sheet`) que cubre el 40% o 50% de la pantalla. Este panel contiene:
    1.  *Sección Superior*: Cabecera inmutable con código del recurso, estado (Badge de color) y acciones inmediatas (Aprobar, Rechazar, Editar).
    2.  *Cuerpo Principal*: Tabs para segmentar la información: **Detalles**, **Materiales/Costos**, **Historial de Auditoría** y **Activity Timeline**.
    3.  *Pie de Panel*: Botones de cierre y guardado.

### B. Línea de Tiempo de Procesos (Activity & State Timeline)
*   **Patrón**: Para registrar el flujo y la trazabilidad inmutable del negocio (requerimientos, aprobaciones, OTs), se utilizará una línea de tiempo vertical de pasos completados e hitos.
*   **Visualización**: Cada nodo de la línea muestra:
    *   *Estado/Acción*: (Ej: "Aprobación de Cotización", "Despacho de Bodega").
    *   *Responsable*: Nombre de usuario e iniciales.
    *   *Auditoría*: Fecha, Hora exacta, IP y navegador de origen en formato monoespaciado técnico.
    *   *Comentario/Evidencia*: Notas o archivos adjuntos asociados.

---

## 2. Tablas Inteligentes de Alta Densidad de Datos

Las tablas son el núcleo de visualización operativa del ERP y deben priorizar la lectura eficiente sobre el espacio vacío.

*   **Densidad de Celda**: Padding vertical reducido (`py-2` o `py-2.5`) para maximizar la cantidad de filas visibles por pantalla sin obligar a scroll excesivo.
*   **Alineación Semántica Rigurosa**:
    *   *Texto e Identificadores*: Alineados a la izquierda.
    *   *Datos Numéricos y Financieros (m³, CFM, COP, USD)*: Alineados estrictamente a la derecha, acompañados de su unidad en gris medio y usando fuente monoespaciada.
    *   *Fechas y Estados (Badges)*: Centrados.
*   **Filtros Persistentes**: Todo control de ordenación o filtro por estado/fecha debe persistirse inmediatamente como un Query Parameter en la URL. Esto permite a los ingenieros compartir enlaces directos a vistas específicas del ERP (ej: `/dashboard/jobs?status=EN_EJECUCION&site=bogota`).

---

## 3. Form Builder Industrial Dinámico

*   **Campos Personalizados (Custom Fields)**: Los formularios deben consultar dinámicamente las especificaciones extendidas configuradas en `custom_field_definitions` e inyectarlas usando la sintaxis del motor de formularios.
*   **Validación Reactiva de Foco**: Todo control de formulario debe validar en tiempo de ejecución (`onChange` y `onBlur`) mediante esquemas Zod, impidiendo el envío de datos si existen discrepancias e indicando visualmente el campo afectado con un borde rojo e icono de advertencia.
