# FASE 35: Asistente de Preingeniería Industrial
# 04_SCORING_ENGINE: Motor de Calificación Operativa y Comercial (Scoring)

Este documento define la arquitectura y el funcionamiento del **Scoring Engine** (Motor de Puntuación), el cual calcula las métricas de criticidad, riesgo, urgencia comercial y valor estimado de los leads captados.

---

## 1. Objetivo y Alcance

El **Scoring Engine** traduce las variables recolectadas en la entrevista técnica en indicadores clave para la fuerza comercial del ERP. Su objetivo es clasificar los prospectos y oportunidades sin recurrir a IA, asegurando un algoritmo matemático consistente basado en la acumulación de pesos de respuestas y reglas de negocio activas.

---

## 2. Indicadores Calculados por el Motor

| Indicador | Tipo de Dato | Rango / Valores | Descripción |
| :--- | :--- | :--- | :--- |
| **Criticidad Técnica** | Numérico (Puntos) | `0` a `100` | Gravedad de la falla o demanda operativa del entorno. |
| **Riesgo Operativo** | Categórico | `CALIENTE`, `TIBIO`, `FRIO`, `SPAM` | Nivel de urgencia de atención del lead en el ERP. |
| **Urgencia del Cliente** | Categórico | `BAJA`, `MEDIA`, `ALTA` | Tiempo estimado de compra manifestado por el usuario. |
| **Probabilidad Comercial**| Porcentaje | `0%` a `100%` | Viabilidad de cierre basado en cargo y email corporativo. |
| **Valor Estimado** | Rango Monetario | COP / USD | Estimación financiera de la cotización preliminar. |

---

## 3. Algoritmo de Acumulación y Reglas de Puntuación

El cálculo se ejecuta al finalizar las preguntas mediante dos capas de evaluación:

### Capa 1: Modificadores por Respuesta Directa
Cada opción de respuesta (almacenada en la metadata del nodo de pregunta) puede contener un objeto de score asociado.
*   *Ejemplo*: Pregunta: "Sector de la planta". Opción: "Minería Subterránea" $\rightarrow$ `{ "criticidad": +40, "urgencia": +10 }`.
*   *Ejemplo*: Pregunta: "Email". Opción: `*@gmail.com` $\rightarrow$ `{ "probabilidad": -30, "riesgo_status": "SPAM" }`.

### Capa 2: Evaluación del Motor de Reglas
Se evalúan las reglas lógicas complejas que pueden sobrescribir o acumular puntaje adicional.
*   *Ejemplo de Regla*:
    ```text
    SI sector = minería Y presencia_gases = true
    ENTONCES criticidad = 100 Y riesgo = 'CALIENTE'
    ```

---

## 4. Fórmula del Valor Estimado de Inversión

El valor estimado del proyecto se calcula dinámicamente según el volumen del área y los coeficientes del servicio:

$$\text{Precio Base} = \text{Volumen}(m^3) \times \text{Factor de Complejidad Servicio}$$

$$\text{Monto Mínimo} = \text{Precio Base} \times 0.85 \times \text{Multiplicador de Urgencia}$$

$$\text{Monto Máximo} = \text{Precio Base} \times 1.15 \times \text{Multiplicador de Urgencia}$$

*   **Multiplicador de Urgencia**: `baja` = 1.00; `media` = 1.10; `alta` = 1.35 (urgencia alta incrementa costo de comisionamiento rápido).
*   **Desviación estándar**: $\pm 15\%$ para protección de estimaciones preliminares de ingeniería.

---

## 5. Salidas del Motor y Trazabilidad

Los resultados computados se persisten en la tabla `assistant_diagnostics` dentro de la columna `score_results` (`JSONB`). Esto permite que el Ejecutivo Comercial visualice en su panel del ERP exactamente qué respuestas y reglas acumularon el score final, garantizando transparencia absoluta del proceso comercial.
