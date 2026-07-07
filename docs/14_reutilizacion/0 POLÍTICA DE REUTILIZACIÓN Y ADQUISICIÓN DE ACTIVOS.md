# CAPÍTULO 19

# POLÍTICA DE REUTILIZACIÓN Y ADQUISICIÓN DE ACTIVOS

## OBJETIVO

Reducir:

Tiempo

Costo

Tokens

Errores

Refactorización

---

# REGLA 1

NO construir desde cero
si existe una solución madura.

---

# ORDEN DE DECISIÓN

Antes de desarrollar cualquier componente:

1 Buscar solución existente.

2 Evaluar compatibilidad.

3 Evaluar licencia.

4 Evaluar mantenimiento.

5 Evaluar adaptación.

6 Decidir reutilizar o construir.

---

# PRIORIDAD

## Nivel 1

Repositorio interno de la empresa.

Si existe:

Usarlo.

---

## Nivel 2

Repositorio aprobado.

Adaptarlo.

---

## Nivel 3

Template comercial.

Adaptarlo.

---

## Nivel 4

Open Source maduro.

Adaptarlo.

---

## Nivel 5

Construcción propia.

Última opción.

---

# PROHIBIDO

Crear:

Tablas

Layouts

Dashboards

Wizards

Formularios

Sistemas RBAC

Motores Workflow

si existe solución aprobada.

---

# PARA CADA MÓDULO

Antigravity debe entregar:

Repositorio evaluado

Licencia

Pros

Contras

Riesgos

Recomendación

Decisión

antes de programar.

---

# EVIDENCIA OBLIGATORIA

Ejemplo:

Módulo:

Dashboard

Repositorios evaluados:

Repo A

Repo B

Repo C

Decisión:

Repo B

Motivo:

Mejor compatibilidad.

---

# SI NO EXISTE SOLUCIÓN ADECUADA

Generar:

BUILD_JUSTIFICATION.md

explicando por qué se construirá desde cero.
