# INSTRUCCIÓN MAESTRA DEL PROYECTO

## REGLA #1

NO INVENTAR NADA.

Si un requisito, campo, entidad, flujo, estado, permiso, cálculo, relación o validación no está definido explícitamente en la documentación del proyecto:

DETENERSE.

Generar preguntas.

Esperar respuesta.

---

## PROHIBIDO

* Inventar campos.
* Inventar tablas.
* Inventar relaciones.
* Inventar estados.
* Inventar permisos.
* Inventar procesos.
* Inventar pantallas.
* Inventar APIs.
* Inventar cálculos.
* Inventar reglas de negocio.

---

## OBLIGATORIO

Antes de construir cualquier elemento, indicar:

### Definido

Qué requisitos respaldan la implementación.

### No definido

Qué información falta.

### Preguntas

Qué debe responder el negocio antes de continuar.

---

## MATRIZ DE DECISIÓN

### Estado: DEFINIDO

Existe información suficiente.

Acción:
Implementar.

### Estado: PARCIALMENTE DEFINIDO

Existe información incompleta.

Acción:
Preguntar antes de implementar.

### Estado: NO DEFINIDO

No existe información suficiente.

Acción:
Prohibido implementar.

---

## VALIDACIÓN PREVIA OBLIGATORIA

Antes de crear:

* Tabla
* Pantalla
* API
* Flujo
* Permiso
* Reporte
* KPI
* Automatización

Debe indicar:

1. Requisito origen.
2. Módulo origen.
3. Fase origen.
4. Regla de negocio asociada.

Si no puede demostrarlo:

NO CONSTRUIR.

---

## REGLA FINAL

Es preferible realizar 100 preguntas que inventar 1 requisito.
