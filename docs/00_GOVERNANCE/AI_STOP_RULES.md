# AI STOP RULES (Reglas de Parada Absoluta de la IA)

Este documento detalla las condiciones bajo las cuales la IA debe **detener su ejecución de manera inmediata** y solicitar retroalimentación del usuario antes de proceder.

---

## 1. Condiciones de Parada Inmediata

La IA suspenderá el desarrollo del software ante cualquiera de los siguientes eventos:

1.  **Asunciones Funcionales:** Si el requerimiento del usuario presenta ambigüedades, omisiones, contradicciones o lagunas de lógica de negocio.
2.  **Campos o Tablas Fantasma:** Si se requiere un campo o una tabla de base de datos que no está descrita formalmente en los diccionarios de datos oficiales.
3.  **Transición de Estado no Declarada:** Si un flujo operativo requiere un cambio de estado que no está expresado explícitamente en la matriz maestra de estados y transiciones.
4.  **Bypass de Aprobación de Plan:** Si el usuario solicita generar código o ejecutar comandos de modificación física del repositorio sin antes haber aprobado por escrito el correspondiente plan de implementación (`implementation_plan.md`).

---

## 2. AI QUESTION PROTOCOL (Protocolo de Preguntas)

Antes de iniciar el diseño de cualquier fase, la IA debe aplicar de manera estricta el siguiente protocolo de preguntas agrupadas:

1.  **Identificación:** Identificar TODOS los vacíos funcionales o técnicos del módulo.
2.  **Consolidación:** Entregar TODAS las preguntas juntas en un único bloque de comunicación al usuario.
3.  **Confirmación de Cierre:** Declarar explícitamente la leyenda: *"No existen más preguntas pendientes para esta fase."*
4.  **Espera de Respuestas:** Bloquear la ejecución hasta recibir respuestas y congelar las decisiones tomadas.
5.  **Prohibición durante Ejecución:** No se formularán nuevas preguntas de negocio durante la fase de codificación.
6.  **Inconsistencia Documental:** Si surge una pregunta imprevista durante la codificación, la IA detendrá la implementación de inmediato y generará un **Reporte de Inconsistencia Documental** indicando con precisión qué especificación es insuficiente.

---

## 3. Protocolo de Bloqueo y Re-planificación

Cuando se activa una condición de parada, el procedimiento estándar es:
1.  **Abortar:** Cancelar la generación de migraciones, código de TypeScript, API o interfaces de usuario.
2.  **Identificar:** Localizar con precisión qué punto del diseño carece de definición o infringe la constitución del proyecto.
3.  **Documentar:** Presentar una lista de preguntas directas al usuario para resolver la incertidumbre sin proponer suposiciones.
4.  **Alineamiento:** Esperar a que el usuario responda en el canal antes de reanudar el trabajo o presentar una nueva propuesta de plan.
