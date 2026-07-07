# UX_PATTERNS.md

# PARTE 3

## Formularios, Wizards, CRUD, Diálogos y Flujos de Trabajo

---

# PILAR 51

LOS FORMULARIOS DEBEN GUIAR

Nunca intimidar.

Dividir información.

Agrupar campos.

Reducir carga mental.

---

# PILAR 52

LOS FORMULARIOS LARGOS SE DIVIDEN

Nunca mostrar 60 campos.

Utilizar:

Stepper

Wizard

Tabs

Accordion

Secciones

---

# PILAR 53

LOS CAMPOS RELACIONADOS DEBEN ESTAR JUNTOS

Ejemplo

Información General

↓

Dirección

↓

Contactos

↓

Información Comercial

↓

Archivos

Nunca mezclarlos.

---

# PILAR 54

TODO CAMPO DEBE EXPLICAR SU PROPÓSITO

No basta con un label.

Cuando sea necesario utilizar:

Tooltip

Texto de ayuda

Placeholder útil

Ejemplo práctico

---

# PILAR 55

LAS VALIDACIONES DEBEN OCURRIR ANTES DE GUARDAR

Mientras escribe.

Al perder foco.

Antes del submit.

Nunca únicamente al final.

---

# PILAR 56

LOS ERRORES DEBEN INDICAR CÓMO RESOLVERSE

Incorrecto

Campo inválido.

Correcto

El NIT debe contener únicamente números.

---

# PILAR 57

LOS CAMPOS OBLIGATORIOS DEBEN SER EVIDENTES

No esconder esta información.

Mostrar claramente:

*

Obligatorio

Requerido

---

# PILAR 58

LOS CAMPOS DEPENDIENTES DEBEN CAMBIAR DINÁMICAMENTE

Ejemplo

País

↓

Departamento

↓

Ciudad

↓

Barrio

Nunca obligar a escribir información que puede deducirse.

---

# PILAR 59

LOS FORMULARIOS DEBEN AUTOGUARDAR CUANDO SEA APROPIADO

Borradores.

Notas.

Comentarios.

Descripciones largas.

Nunca perder información por accidente.

---

# PILAR 60

TODO FORMULARIO DEBE PODER CONTINUARSE

Especialmente Wizards.

Si el usuario sale.

Debe poder regresar.

---

# PILAR 61

LOS WIZARDS NO SON FORMULARIOS DIVIDIDOS

Son asistentes.

Cada paso debe enseñar.

Explicar.

Validar.

Preparar el siguiente.

---

# PILAR 62

EL WIZARD SIEMPRE MUESTRA PROGRESO

Paso 1 de 5

↓

Indicador visual

↓

Pasos restantes

Nunca dejar incertidumbre.

---

# PILAR 63

LOS PASOS DEL WIZARD DEBEN SER CORTOS

Máximo una tarea mental importante por paso.

---

# PILAR 64

EL WIZARD DEBE CALCULAR MIENTRAS EL USUARIO AVANZA

No esperar el último paso.

Ejemplos

CFM

Costo

Tiempo

Consumo

Recomendaciones

Todo debe actualizarse progresivamente.

---

# PILAR 65

LOS WIZARDS DEBEN PERMITIR REGRESAR

Sin perder datos.

---

# PILAR 66

LOS CRUD NO DEBEN SER CRUD

Cada pantalla debe resolver un proceso empresarial.

No solamente:

Crear

Editar

Eliminar

---

# PILAR 67

CREAR NO DEBE TERMINAR EL FLUJO

Ejemplo

Crear Cliente

↓

Crear Contacto

↓

Crear Lead

↓

Crear Cotización

↓

Crear Proyecto

---

# PILAR 68

EDITAR DEBE MOSTRAR HISTORIAL

Siempre que sea posible.

Qué cambió.

Quién cambió.

Cuándo cambió.

---

# PILAR 69

ELIMINAR ES LA ÚLTIMA OPCIÓN

Priorizar:

Archivar.

Desactivar.

Cerrar.

Cancelar.

Soft Delete.

---

# PILAR 70

LOS DIÁLOGOS NO DEBEN ROMPER EL CONTEXTO

Un modal debe resolver tareas rápidas.

No procesos completos.

---

# PILAR 71

LOS DRAWERS SON PREFERIBLES PARA EDICIÓN

Editar sin abandonar la pantalla principal.

---

# PILAR 72

LOS POPOVERS SOLO PARA ACCIONES PEQUEÑAS

Nunca formularios grandes.

---

# PILAR 73

LOS TOOLTIPS DEBEN APORTAR VALOR

Explicar.

No repetir el texto del botón.

---

# PILAR 74

LAS NOTIFICACIONES NO SON DECORACIÓN

Solo informar algo relevante.

---

# PILAR 75

LAS NOTIFICACIONES DEBEN CLASIFICARSE

Éxito

Información

Advertencia

Error

Acción requerida

---

# PILAR 76

LOS TOASTS DEBEN DESAPARECER

Los errores importantes no.

---

# PILAR 77

LAS ACCIONES PELIGROSAS SIEMPRE SON DIFERENTES

Eliminar.

Cancelar.

Cerrar.

Restablecer.

Nunca usar el mismo estilo que "Guardar".

---

# PILAR 78

LOS BOTONES PRINCIPALES DEBEN SER ÚNICOS

Solo debe existir un Primary Action por pantalla.

Nunca tres botones principales compitiendo.

---

# PILAR 79

LAS ACCIONES SECUNDARIAS NO DEBEN ROBAR ATENCIÓN

Cancelar.

Volver.

Cerrar.

Siempre menor jerarquía visual.

---

# PILAR 80

LA INTERFAZ DEBE PREVENIR ERRORES

Antes de permitir guardar debe advertir:

Duplicados

Conflictos

Dependencias

Restricciones

---

# PILAR 81

LOS ARCHIVOS DEBEN PREVISUALIZARSE

PDF

Imagen

Plano

Excel

Video

Nunca descargar para saber qué contiene.

---

# PILAR 82

LAS SUBIDAS DE ARCHIVOS DEBEN MOSTRAR PROGRESO

Nunca dejar un botón bloqueado.

---

# PILAR 83

LAS ACCIONES LARGAS DEBEN EJECUTARSE EN SEGUNDO PLANO

Importaciones.

Exportaciones.

Generación de PDF.

Procesos masivos.

Mientras el usuario continúa trabajando.

---

# PILAR 84

TODO PROCESO LARGO DEBE INFORMAR SU ESTADO

Pendiente

Procesando

Finalizado

Error

Nunca silencio.

---

# PILAR 85

LA UX SIEMPRE DEBE REDUCIR CLICS

Si un flujo requiere 10 clics y puede hacerse en 4...

Debe hacerse en 4.

---

# PILAR 86

TODO COMPONENTE DEBE RESPONDER A UNA NECESIDAD DEL NEGOCIO

No pueden existir componentes únicamente porque "se ven bien".

Cada componente debe ahorrar tiempo, reducir errores o aumentar productividad.

# FIN PARTE 3
