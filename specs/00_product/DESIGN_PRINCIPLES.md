# DESIGN PRINCIPLES — Principios de Diseño

## Filosofía de diseño

El diseño de este ERP se inspira en **Siemens, ABB, Schneider Electric y SAP Fiori**.

No es un dashboard genérico. No es una plantilla Bootstrap. Es una **herramienta de ingeniería** que debe transmitir precisión, capacidad técnica y calidad enterprise desde el primer vistazo.

---

## Principios rectores

| Principio | Significado |
|---|---|
| **Claridad** | El usuario entiende lo que ve en menos de 5 segundos |
| **Profesionalismo** | Parece software costoso, enterprise, internacional |
| **Velocidad** | La interfaz responde sin fricción, sin esperas innecesarias |
| **Confianza** | Los datos se muestran con precisión, sin errores, sin ambigüedad |
| **Ingeniería** | La estética transmite capacidad técnica y precisión industrial |

---

## Protocolo de diseño UI (obligatorio)

Cada vez que se modifique cualquier interfaz visual (Landing, ERP o Portal Cliente), queda **prohibido diseñar por intuición**.

### 8 pasos obligatorios

**PASO 1 — Identificar** qué se está construyendo (Hero, CTA, Cards, Dashboard, Wizard, Modal, Pricing, Catálogo, etc.)

**PASO 2 — Ejecutar UI UX Pro Max** para ese componente. Nunca omitirlo.

**PASO 3 — Mostrar el resultado completo** obtenido por la Skill. No resumir. No interpretar.

**PASO 4 — Analizar el resultado.** Explicar: estilo recomendado, paleta, tipografía, sistema visual, patrones UX.

**PASO 5 — Comparar contra el Blueprint.** Archivos de referencia:
- `docs/15_frontend/01_DESIGN_SYSTEM.md`
- `docs/15_frontend/21_UI_ART_DIRECTION.md`
- `docs/15_frontend/22_UX_PATTERNS.md`
- `docs/15_frontend/23_VISUAL_HIERARCHY.md`

**PASO 6 — Si existe conflicto: GANA EL BLUEPRINT.** Nunca la Skill.

**PASO 7 — Antes de escribir código,** generar un mini documento `DECISIÓN DE DISEÑO` con: componente, estilo elegido, por qué, referencias usadas, reglas del Blueprint aplicadas, reglas de la Skill aplicadas, qué se descartó.

**PASO 8 — Ahora sí se puede escribir código.**

---

## Enterprise Visual Quality Gate (EVQG)

Este protocolo existe porque una interfaz puede cumplir el Design System y seguir viéndose antigua. Cumplir el Blueprint **NO** significa que el resultado sea visualmente excelente.

### Test de 5 segundos

Observar la pantalla durante 5 segundos. Debe transmitir inmediatamente:

✔ Ingeniería ✔ Innovación ✔ Precisión ✔ Calidad ✔ Tecnología ✔ Confianza ✔ Empresa internacional

Si transmite: ✘ Dashboard genérico ✘ Bootstrap ✘ Panel administrativo ✘ Software barato ✘ Proyecto universitario → **Debe rediseñarse.**

### Test Apple

¿Apple publicaría este nivel de acabado?
No preguntar si usarían el mismo diseño. Preguntar únicamente por la **calidad**.

### Test Siemens

¿Esta pantalla podría aparecer en una presentación oficial de Siemens Digital Industries?

### Test Stripe

¿Stripe aceptaría este nivel de refinamiento?

### Test Rivian

¿La estética transmite innovación industrial? ¿O parece solamente otra aplicación administrativa?

### Test Porsche

¿Existe obsesión por el detalle? ¿O simplemente todo funciona?

---

## Criterios de evaluación visual

Cada pantalla debe evaluarse (1-10, sin decimales) contra estos criterios:

| Criterio | Qué evalúa |
|---|---|
| **Jerarquía Visual** | Título, subtítulo, contenido, acciones, espaciado, escaneo visual |
| **Calidad Percibida** | ¿Parece software costoso? ¿Enterprise? ¿Internacional? |
| **Profundidad** | ¿Existen planos, capas, iluminación, separación? ¿O todo parece pegado al fondo? |
| **Ritmo** | ¿Todo tiene el mismo tamaño/peso/espacio? ¿Existe ritmo visual? |
| **Tipografía** | ¿Existe jerarquía? ¿Respiración? ¿Elegancia? |
| **Botones** | ¿Parecen Bootstrap? ¿Premium? ¿Dan ganas de hacer clic? |
| **Tarjetas** | ¿Parecen cajas con texto? ¿O piezas de producto? |
| **Iconografía** | ¿Los iconos aportan información? ¿O simplemente decoran? |
| **Color** | ¿Todo es gris? ¿Existe profundidad cromática? ¿Materialidad? |
| **Espaciado** | ¿Respira? ¿O está todo comprimido? |
| **Hero** | ¿Es memorable? ¿O parece otro Hero de Tailwind? |
| **Landing** | ¿Genera deseo? ¿O solamente informa? |
| **Conversión** | ¿Invita a continuar? ¿O simplemente muestra contenido? |

---

## Definición de terminado visual

| Criterio | Puntaje mínimo |
|---|---|
| Jerarquía Visual | 9/10 |
| Calidad Percibida | 9/10 |
| Profundidad | 9/10 |
| Tipografía | 9/10 |
| Hero | 9/10 |
| Tarjetas | 9/10 |
| Botones | 9/10 |
| Conversión | 9/10 |

**Si cualquiera obtiene menos de 9, el diseño NO está terminado.**

---

## Reglas visuales (anti-patrones)

**Prohibido** construir componentes únicamente usando:
- `bg-white`
- `border`
- `rounded-lg`
- `shadow-sm`
- `text-zinc-400`

Eso genera interfaces planas. Cada componente debe tener:
- Jerarquía
- Profundidad
- Ritmo
- Iluminación
- Materiales
- Microinteracciones
- Personalidad

---

## Microinteracciones

- Toda interacción debe responder. Nada puede sentirse muerto.
- Todo debe sentirse vivo. Pero elegante. Nunca exagerado.
- Duración máxima: **200ms**.
- Page transitions: opacity fade + translateY (10px → 0).
- Hover: escala leve (1.01-1.02), no rebotes.
- Skeletons: pulse 1.5s.

---

## Preguntas obligatorias antes de finalizar

Antes de marcar cualquier pantalla como completada, responder:

1. ¿Eliminaría algo?
2. ¿Agregaría más aire?
3. ¿Existe suficiente contraste?
4. ¿Existe suficiente profundidad?
5. ¿El usuario sabe dónde mirar primero?
6. ¿El Hero podría aparecer en la web de Apple?
7. ¿Las tarjetas parecen premium?
8. ¿Los botones parecen diseñados?
9. ¿El producto transmite innovación?
10. ¿La empresa parece líder mundial?

**Pregunta final obligatoria:**

> "Si un director de ingeniería de Siemens visitara esta web durante 15 segundos, ¿pensaría que la empresa es de clase mundial?"

Si la respuesta no es un **"Sí"** rotundo: continuar iterando antes de dar el trabajo por terminado.
