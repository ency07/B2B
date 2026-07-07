# 23_VISUAL_HIERARCHY: Jerarquía Visual, Distribución Espacial y Contraste

Este documento define las reglas operativas de distribución espacial, contrastes y jerarquía de la información para el **ERP B2B Premium** (AeroMax Industrial). Su objetivo es eliminar la uniformidad visual y garantizar que el operador identifique los focos críticos de decisión de forma instantánea.

---

## 1. El Principio del Bloque Ancla (Anchor Block)

Queda prohibido maquetar pantallas mediante secuencias repetitivas de tarjetas del mismo tamaño y peso visual. Cada página o sección importante debe estructurarse en torno a un **Bloque Ancla** dominante que guíe la lectura.

*   **Definición**: El Bloque Ancla es un elemento que ocupa al menos el 50% de la superficie visual útil y posee un peso de contraste superior.
*   **Ejemplos**:
    *   *En el Catálogo*: Una ilustración técnica del extractor o un visor interactivo de planos CAD en lugar de una pequeña foto miniatura.
    *   *En el Dashboard*: Una vista dividida con el listado completo de OTs activas a la izquierda y el detalle detallado del trabajo seleccionado a la derecha, en lugar de 10 tarjetas KPI pequeñas.
    *   *En la Landing Page*: Una infografía interactiva del flujo de aire de una planta en lugar de un grid de 4 tarjetas de servicios.

---

## 2. Composición Asimétrica de Nivel Industrial

Para evitar que la plataforma parezca una plantilla de Bootstrap genérica, la distribución espacial debe alternar entre composiciones asimétricas y bloques de escala variable:

*   **Composición 60/40 y 70/30**: Layouts divididos horizontalmente donde la columna dominante presenta información técnica compleja (gráficos vectoriales, curvas aerodinámicas, planos mecánicos) y la secundaria presenta metadatos, controles de filtrado o descargas asociadas.
*   **Uso del Espacio en Blanco (White Space)**: Se deben aplicar márgenes y paddings verticales amplios (`py-20` a `py-32` en secciones públicas; `gap-8` a `gap-12` en el ERP) para separar visualmente los módulos de información. El espacio vacío no es desperdicio; es un canal de descanso cognitivo para el operador.

---

## 3. Jerarquía y Contraste de Componentes

### A. Botones e Interactores
*   **Acción Primaria**: Un único botón por vista con color de marca sólido (`bg-primary text-white`), reservado para la confirmación de la transacción clave (ej: "Aprobar Cotización", "Confirmar Despacho").
*   **Acciones Secundarias**: Estilos con borde fino (`outline`) o sin borde (`ghost`), reduciendo el ruido visual para no competir con la acción principal.

### B. Badges e Indicadores de Estado
*   Los badges de estado no deben tener colores de alta saturación generalizados. El fondo debe ser semi-translúcido (`opacity-10%` del color correspondiente) y únicamente el texto o un pequeño círculo indicador interno debe portar el color sólido. Esto previene que una tabla con muchos estados parezca un carnaval de colores.

---

## 4. Auditoría de Elementos no Productivos (Zero-Noise)

Todo elemento visual inyectado en el DOM debe justificar su existencia según una métrica operativa o comercial:

1.  **¿Aporta datos para una decisión?**: Si una tarjeta solo dice "Total de Clientes" sin un enlace para administrarlos o un sparkline de tendencia, debe eliminarse.
2.  **¿Permite una acción inmediata?**: Toda tarjeta analítica o indicador debe portar un interactor para profundizar en los datos (Drill-Down) o realizar la transacción.
3.  **¿Explica un proceso de ingeniería?**: En la web pública, cada sección debe contar un paso de la narrativa de ingeniería de AeroMax, eliminando decoraciones genéricas o bloques de relleno de texto de marketing sin especificaciones.
