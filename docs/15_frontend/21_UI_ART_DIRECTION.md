# 21_UI_ART_DIRECTION: Dirección de Arte y Estética de Ingeniería Industrial

Este documento establece la línea estética oficial para la plataforma **ERP B2B Premium** (AeroMax Industrial). Define los principios visuales necesarios para proyectar una imagen de ingeniería de precisión de clase mundial, inspirada en líderes globales como Siemens, Autodesk, ABB y SAP Fiori.

---

## 1. El Concepto Estético: Ingeniería de Precisión

La plataforma debe transmitir rigurosidad técnica, confiabilidad y robustez industrial. Queda prohibida cualquier decisión estética que recuerde a plantillas SaaS genéricas, plataformas de consumo masivo o estéticas de ocio.

### 🚫 Prohibición de Estéticas No Profesionales
*   **Estética "Gamer" o de "Hacker"**: Prohibido el uso de colores neón fluorescentes agresivos, halos de brillo (glow) exagerados en elementos de interfaz, rejillas de escaneo tipo radar o tipografías monoespaciadas para textos comunes.
*   **Dashboards de Juguete**: Prohibido el uso de tarjetas con bordes gruesos y esquinas excesivamente redondeadas, sombras paralelas pesadas o iconos decorativos gigantes sin función operativa.

---

## 2. Paleta de Colores y Contraste Técnico

La consistencia cromática refuerza la identidad corporativa y facilita la legibilidad en naves industriales u oficinas técnicas.

| Propiedad | Valor Base / Variable | Uso |
| :--- | :--- | :--- |
| **Fondo Oscuro** | `#0b0f19` / `bg-zinc-950` | Fondo general de alta absorción de luz, reduce la fatiga visual. |
| **Fondo de Panel** | `#111827` / `bg-zinc-900/40` | Paneles con glassmorphism sutil y bordes delgados. |
| **Bordes Técnicos** | `#1f2937` / `border-zinc-800/60` | Divisiones finas que imitan líneas de dibujo técnico. |
| **Color Primario** | Mapeado desde `branding.color_primario` | Resaltado de botones de acción crítica y puntos de control. |
| **Texto Principal** | `#f4f4f5` / `text-zinc-100` | Contenido base y etiquetas de datos. |
| **Texto Secundario**| `#a1a1aa` / `text-zinc-400` | Explicaciones y unidades técnicas (CFM, RPM). |

---

## 3. Tipografía Estructurada y Datos Duros

Se definen tres familias tipográficas con usos específicos para estructurar la información:

1.  **Títulos y Métricas Principales (Outfit)**: Usada para encabezados principales y valores KPI de gran escala para llamar la atención del operador de forma inmediata.
2.  **Interfaz y Lectura Base (Inter)**: Usada para formularios, tablas, menús y descripciones operativas. Ofrece alta legibilidad en pantallas de cualquier resolución.
3.  **Datos Técnicos y Monedas (JetBrains Mono / Monospace)**: Toda unidad física (Caudal `CFM`, volumen `m³`, RPM, voltios), códigos secuenciales (`FAC-0001`, `DIA-0023`) e importes comerciales se pintarán estrictamente en fuente monoespaciada para facilitar la comparación rápida de columnas de datos.

---

## 4. Grillas Técnicas e Iluminación Difusa

*   **Fondo de Grilla Estructural (Millimeter Grid)**: Las páginas y paneles de control utilizarán de fondo un patrón de grilla milimétrica esquemática (líneas finas de 0.5px con opacidad del 1.5% al 3%) imitando papel de dibujo técnico o planos de AutoCAD.
*   **Esquemas Vectoriales SVG**: Todo diagrama, curva de rendimiento aerodinámico o mapa de flujo se dibujará utilizando vectores SVG nativos con líneas de trazado finas (0.8px a 1px) en lugar de gráficos rasterizados (PNG/JPG).
*   **Iluminación de Fondo**: Se permite el uso de gradientes de fondo extremadamente tenues y difusos (`radial-gradient` en tonos grises o de la marca) para dar sensación de profundidad en el eje Z sin perturbar la legibilidad.
