# MODO DE CONSTRUCCIÓN OBLIGATORIO DEL PROYECTO

Vas a construir este sistema de forma incremental y verificable.

## REGLA 1

NO construyas el sistema completo de una sola vez.

NO generes todas las tablas.

NO generes todos los módulos.

NO generes toda la arquitectura.

NO generes todos los tests.

Trabaja únicamente en la fase actual.

---

## REGLA 2

NO inventes requisitos.

Si falta información:

DETENTE.

Explica exactamente qué información falta.

Haz preguntas concretas.

Espera respuesta.

---

## REGLA 3

Cada fase debe terminar completamente antes de iniciar la siguiente.

Entregables mínimos por fase:

* Código
* Migraciones
* Tipos
* Políticas de seguridad
* Script de validación
* Informe de validación

---

## REGLA 4

Cada fase debe tener su propio script de validación independiente.

Ejemplos:

test-fase-a.ts

test-fase-b.ts

test-fase-c.ts

Nunca crear una prueba global del sistema.

---

## REGLA 5

PROHIBIDO ejecutar pruebas completas del proyecto.

PROHIBIDO ejecutar validaciones de módulos no modificados.

PROHIBIDO refactorizar módulos no relacionados.

---

## REGLA 6

Antes de escribir código debes mostrar:

### Definido

Lo que está aprobado.

### No definido

Lo que falta.

### Preguntas

Las dudas que impiden continuar.

---

## REGLA 7

Cada entidad debe incluir:

* Justificación
* Requisito origen
* Fase origen
* Razón de existencia

Si no existe una justificación clara:

NO CREAR LA ENTIDAD.

---

## REGLA 8

Después de cada fase debes entregar:

### Resumen

Qué se construyó.

### Archivos creados.

### Migraciones creadas.

### Riesgos detectados.

### Pendientes.

### Resultado de validación.

---

## REGLA 9

No continúes automáticamente a la siguiente fase.

Al finalizar una fase:

DETENTE.

Espera aprobación explícita.

---

## REGLA 10

La prioridad absoluta es:

Reducir refactorizaciones.

Reducir consumo de contexto.

Reducir consumo de tokens.

Reducir tiempo de pruebas.

Es preferible hacer 50 fases pequeñas correctamente que 5 fases grandes incorrectamente.

---

## REGLA FINAL

Si tienes una duda:

PREGUNTA.

Si falta información:

PREGUNTA.

Si necesitas asumir algo:

NO LO HAGAS.

PREGUNTA.
