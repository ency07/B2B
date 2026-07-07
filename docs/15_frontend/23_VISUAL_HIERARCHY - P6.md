# PARTE 6
# Anti Patrones Visuales
# Todo lo que está PROHIBIDO construir

---

# Objetivo

Esta sección define todos los errores de diseño que NO podrán volver a aparecer dentro del ERP.

Si un componente incumple cualquiera de estas reglas, deberá ser rediseñado antes de ser aprobado.

Estos anti patrones tienen prioridad sobre cualquier preferencia estética.

---

# 1. Tarjetas gigantes sin información

PROHIBIDO

┌───────────────────────────────┐
│                               │
│      1.245                    │
│                               │
│                               │
└───────────────────────────────┘

Una tarjeta enorme mostrando únicamente un número.

Debe contener contexto.

•

Título

•

Valor

•

Variación

•

Comparación

•

Acción

•

Última actualización

---

# 2. Gráficas decorativas

Toda gráfica debe responder una pregunta de negocio.

Incorrecto

Ventas por Mes

(Gráfico bonito)

Sin utilidad.

Correcto

Ventas

Comparación

Meta

Variación

Pronóstico

Acciones disponibles

---

# 3. Espacios vacíos enormes

Prohibido construir interfaces donde el 60% de la pantalla sea aire.

Toda área debe aportar valor.

---

# 4. Dashboards tipo plantilla

Nunca copiar dashboards genéricos de internet.

Ejemplo

4 KPIs

↓

2 gráficos

↓

Tabla

↓

Nada más.

Cada dashboard debe representar un flujo operativo real.

---

# 5. KPIs repetidos

Incorrecto

Ventas

Ventas Totales

Valor de Ventas

Facturación

Ingresos

Cinco tarjetas mostrando exactamente lo mismo.

Cada KPI debe representar un indicador diferente.

---

# 6. Botones sin prioridad

Incorrecto

Guardar

Cancelar

Eliminar

Exportar

Duplicar

Editar

Todos iguales.

Debe existir jerarquía.

Primary

Secondary

Ghost

Danger

Link

---

# 7. Más de un Primary Button

Cada pantalla tiene

UNA

acción principal.

Nunca cuatro botones azules.

---

# 8. Colores aleatorios

Prohibido utilizar colores porque "se ven bonitos".

Cada color debe representar un significado.

Azul

Acción

Verde

Éxito

Rojo

Error

Amarillo

Advertencia

Gris

Información

Nada más.

---

# 9. Tres colores de acento diferentes

Incorrecto

Botón azul

Card verde

Header morado

Sidebar naranja

Todo parece cuatro sistemas distintos.

---

# 10. Iconografía inconsistente

Nunca mezclar

Lucide

Heroicons

Tabler

Material

FontAwesome

Todo el ERP utiliza un único sistema.

---

# 11. Cards enormes con dos líneas

Incorrecto

────────────────────

Cliente

Pedro

────────────────────

Debe aprovechar el espacio.

Agregar

estado

acciones

última actividad

indicadores

tags

responsable

---

# 12. Hero gigantes dentro del ERP

Los Hero pertenecen a Landing Pages.

Nunca al Dashboard.

El usuario entra a trabajar.

No a leer publicidad.

---

# 13. Menús enormes

Sidebar con

Inicio

↓

Clientes

↓

CRM

↓

Ventas

↓

Producción

↓

Compras

↓

Inventario

↓

RRHH

↓

etc

Todo abierto.

Debe existir agrupación.

---

# 14. Menús sin jerarquía

Nunca

20 opciones iguales.

Debe existir

Categoría

↓

Módulo

↓

Página

↓

Acción

---

# 15. Acciones escondidas

Guardar

↓

Dentro de un menú

↓

Dentro de otro menú

↓

Dentro de un modal

Nunca.

Las acciones principales siempre visibles.

---

# 16. Formularios kilométricos

Incorrecto

60 campos

en una sola pantalla.

Debe dividirse.

Stepper

Tabs

Secciones

Wizard

---

# 17. Campos sin agrupar

No mezclar

Datos empresa

↓

Dirección

↓

Teléfono

↓

Facturación

↓

Contacto

Todo mezclado.

Debe organizarse por contexto.

---

# 18. Tablas sin acciones

Cada tabla debe responder

¿qué puedo hacer con este registro?

Editar

Duplicar

Exportar

Eliminar

Historial

Abrir

Compartir

Siempre.

---

# 19. Tablas sin filtros

Toda tabla empresarial necesita

Buscar

Filtros

Orden

Exportar

Columnas

Paginación

---

# 20. Tablas sin resumen

Las tablas grandes deben indicar

Cantidad

Totales

Promedios

Resultados filtrados

---

# 21. Popups innecesarios

No abrir un Modal

para editar un campo.

Usar edición inline cuando sea posible.

---

# 22. Confirmaciones absurdas

Incorrecto

¿Seguro?

↓

¿Está realmente seguro?

↓

¿Desea continuar?

↓

Aceptar

Un solo diálogo.

Claro.

---

# 23. Sombras exageradas

Prohibido

box-shadow enormes

estilo Bootstrap 2015.

La profundidad debe ser mínima.

---

# 24. Bordes gruesos

Nunca

border:2px

border:3px

Todo debe ser sutil.

---

# 25. Gradientes agresivos

Incorrecto

Azul

↓

Morado

↓

Rojo

↓

Verde

↓

Naranja

El ERP no es una Landing.

---

# 26. Animaciones innecesarias

Todo movimiento debe comunicar.

Nunca decorar.

---

# 27. Componentes sin propósito

Antes de agregar un componente debe responderse

¿qué problema operativo resuelve?

Si la respuesta es

"Ninguno"

el componente no existe.

---

# 28. Información duplicada

Nunca mostrar el mismo dato

en

KPI

Card

Tabla

Header

Resumen

al mismo tiempo.

---

# 29. Widgets inútiles

Incorrecto

Reloj

Clima

Bienvenido Usuario

Frase Motivacional

No generan productividad.

---

# 30. Gráficas sin interacción

Toda gráfica debe permitir

Filtrar

Abrir detalle

Drill Down

Exportar

Comparar

Nunca una imagen estática.

---

# 31. Dashboards muertos

Si un widget no permite tomar decisiones

debe eliminarse.

---

# 32. Acciones sin contexto

Eliminar

↓

Sin saber qué elimina.

Toda acción debe mostrar claramente

qué afecta.

---

# 33. Layout desbalanceado

Nunca

Sidebar

↓

Gran espacio vacío

↓

Card enorme

↓

Más espacio vacío

El peso visual debe distribuirse.

---

# 34. Exceso de aire

Mucho espacio no significa elegancia.

Significa desperdicio de información.

---

# 35. Exceso de densidad

Lo contrario también está prohibido.

No convertir el ERP en Excel.

Debe existir equilibrio.

---

# 36. Copiar Dribbble

Las interfaces de Dribbble sirven para inspiración.

No para sistemas ERP.

---

# 37. Copiar Admin Templates

Queda prohibido construir

"otro dashboard genérico"

Todo debe responder al negocio.

---

# 38. Componentes sin reutilización

Si aparece un segundo componente parecido

debe reutilizarse.

Nunca duplicar.

---

# 39. Pantallas sin objetivo

Cada pantalla debe responder

¿Qué decisión ayuda a tomar?

Si no responde ninguna,

la pantalla sobra.

---

# 40. Principio Supremo

Toda interfaz deberá superar esta auditoría antes de aprobarse.

Preguntas obligatorias

✓ ¿Entrega información útil?

✓ ¿Permite tomar decisiones?

✓ ¿Permite ejecutar acciones?

✓ ¿Reduce clics?

✓ ¿Tiene jerarquía visual?

✓ ¿Respeta la identidad Siemens/ABB?

✓ ¿Aprovecha la pantalla?

✓ ¿No desperdicia espacio?

✓ ¿No contiene componentes decorativos?

✓ ¿Todo elemento tiene una razón de existir?

Si cualquiera de estas respuestas es NO,

la pantalla deberá rediseñarse antes de integrarse al ERP.