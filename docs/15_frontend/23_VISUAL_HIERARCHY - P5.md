# PARTE 5
# Responsive, Adaptabilidad, Escalado y Densidad Visual

---

# 21. Responsive NO significa esconder cosas

## Regla

Nunca solucionar Mobile haciendo desaparecer información.

Incorrecto

Desktop
Muestra 20 KPIs

↓

Mobile
Muestra solo 3 KPIs

Eso destruye productividad.

Debe reorganizarse, nunca ocultarse.

---

# 22. Mobile First Empresarial

El sistema debe diseñarse desde Mobile.

Pero optimizarse para Desktop.

Porque:

usuarios ERP trabajan en escritorio

pero técnicos trabajan desde tablet

y clientes desde móvil.

Los tres deben tener la misma capacidad.

---

# 23. Breakpoints oficiales

Prohibido inventar breakpoints.

Usar únicamente.

xs
480

sm
640

md
768

lg
1024

xl
1280

2xl
1536

Nada adicional.

---

# 24. Layout Desktop

Desktop debe aprovechar el espacio.

Nunca centrar contenido en una columna de 700 px.

Incorrecto

□□□□□□□□□□□□□□□□□□

□□□□□□Contenido□□□□□□

□□□□□□□□□□□□□□□□□□

Correcto

Sidebar

Workspace amplio

Panel derecho

La pantalla debe sentirse utilizada.

---

# 25. Laptop

Reducir espacios.

Mantener jerarquía.

No reducir información.

Solo densidad.

---

# 26. Tablet

Sidebar

↓

Drawer

Panel derecho

↓

Tabs

Acciones

↓

Bottom Sheet

Todo sigue existiendo.

Solo cambia la disposición.

---

# 27. Mobile

Una columna.

Cards.

Stepper.

Bottom Actions.

Nada de tablas enormes.

---

# 28. Scroll Vertical

Siempre preferido.

Nunca obligar al usuario a desplazarse horizontalmente.

Horizontal scroll

Solo

Data Grid

Calendarios

Gantt

Timeline

Planos

CAD

Nada más.

---

# 29. Sticky Header

Toda pantalla con scroll largo debe mantener.

Título

Breadcrumb

Acciones

Siempre visibles.

---

# 30. Sticky Footer

Formularios largos.

Wizard.

Cotizadores.

Siempre deben mantener

Guardar

Continuar

Cancelar

visibles.

Nunca obligar al usuario a subir 2.000 px.

---

# 31. Scroll Independiente

Incorrecto

body scroll

↓

panel scroll

↓

tabla scroll

↓

modal scroll

↓

div scroll

Cinco barras.

Nunca.

Máximo

dos niveles.

---

# 32. Altura

Nunca

height:100vh

si rompe formularios.

Preferir

min-height

porque teclados móviles cambian viewport.

---

# 33. Espacios en Mobile

Desktop

32 px

↓

Tablet

24 px

↓

Mobile

16 px

Nunca usar 40 px en móvil.

---

# 34. Grid Responsive

Desktop

4 columnas

↓

Tablet

2 columnas

↓

Mobile

1 columna

No inventar medidas.

---

# 35. Cards

Desktop

Hasta 4 por fila.

Tablet

2.

Mobile

1.

Siempre.

---

# 36. KPI Cards

Desktop

4-8 KPIs.

Tablet

2 por fila.

Mobile

scroll horizontal controlado

o

2 columnas.

Nunca texto diminuto.

---

# 37. Formularios Responsive

Desktop

2-3 columnas.

Tablet

2 columnas.

Mobile

1 columna.

Jamás mantener 3 columnas en móvil.

---

# 38. Tablas Responsive

Nunca ocultar columnas críticas.

Opciones:

expandir fila

drawer

detalle lateral

column selector

Nunca borrar datos.

---

# 39. Sidebar Responsive

Desktop

Expandida.

Laptop

Colapsable.

Tablet

Drawer.

Mobile

Overlay.

El usuario siempre sabe dónde está.

---

# 40. Dashboard Responsive

No reducir widgets.

Reordenarlos.

Desktop

KPI

Charts

Maps

Tables

↓

Tablet

KPIs

Charts

Tables

↓

Mobile

KPIs

Charts

Cards

---

# 41. Touch Targets

Todo botón.

Todo icono.

Todo checkbox.

Mínimo

44x44 px.

Nunca menos.

---

# 42. Hover

No depender exclusivamente de Hover.

Mobile no tiene Hover.

Debe existir Click.

---

# 43. Zoom

Toda pantalla debe funcionar

125%

150%

175%

sin romper layout.

---

# 44. Resoluciones UltraWide

3440 px

5120 px

No dejar enormes espacios vacíos.

Usar:

max-width inteligentes

paneles laterales

widgets adicionales

mayor densidad.

---

# 45. Resoluciones Pequeñas

1366x768

Debe funcionar perfectamente.

Es la resolución más común en empresas.

---

# 46. Modo Pantalla Completa

Dashboards.

Mapas.

CAD.

Gantt.

Reportes.

Deben soportar Full Screen.

---

# 47. Impresión

Toda vista importante debe poder imprimirse.

PDF

A4

Carta

sin romper.

---

# 48. Accesibilidad Responsive

No romper:

Zoom navegador

Lectores pantalla

Alto contraste

Modo oscuro

Navegación teclado

---

# 49. Performance Visual

No renderizar:

300 cards

500 filas

200 gráficos

Todo debe virtualizarse.

Lazy Loading obligatorio.

---

# 50. Principio Supremo de Adaptabilidad

El Responsive jamás debe sacrificar:

Información.

Productividad.

Jerarquía.

Velocidad.

Consistencia.

Solo cambia la distribución.

Nunca el valor entregado al usuario.