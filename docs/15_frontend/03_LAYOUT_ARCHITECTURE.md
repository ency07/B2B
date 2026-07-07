# 03_LAYOUT_ARCHITECTURE: Estructura de Layouts y Navegación

> [!NOTE]
> Especifica la jerarquía visual de contenedores, la lógica de paneles deslizantes, el menú lateral persistente y la integración del header inteligente.

## 1. Jerarquía de Layouts Anidados (Next.js App Router)

La aplicación web estructura sus layouts de la siguiente manera:

*   `/app/layout.tsx` (Root Layout): Carga de proveedores globales (`ThemeProvider`, `SupabaseProvider`), fuentes y estilos base.
*   `/app/(auth)/layout.tsx` (Auth Layout): Centrado simple, sin menús, fondo neutro/gradiente.
*   `/app/(dashboard)/layout.tsx` (Dashboard Layout): Menú lateral persistente, Header interactivo y el área de contenido principal (Workspace).

---

## 2. Estructura de Paneles en Pantalla (Workspace)

El layout del Dashboard se compone de tres paneles lógicos:

```
+-----------------------------------------------------------+
|  [Sidebar]  |  [Header inteligente (react-headroom)]      |
|             |---------------------------------------------|
|  Persistente|                                             |
|  y          |  [Workspace Principal]                      |
|  Colapsable |  Área de trabajo dinámica y responsiva      |
|  (sm:icons) |                                             |
|             |                                             |
+-----------------------------------------------------------+
```

---

## 3. Sidebar (Panel de Navegación Lateral)
*   **Comportamiento Desktop**: Ancho fijo de `16rem` (256px) para evitar saltos bruscos. Cuenta con un botón de colapso rápido que reduce el ancho a `5rem` (80px), mostrando únicamente los iconos de navegación con tooltips aclaratorios.
*   **Comportamiento Mobile**: El Sidebar se oculta por defecto en pantallas móviles y se despliega como un menú flotante tipo Drawer (Sheet de Radix UI) al hacer clic en el botón de hamburguesa del Header.
*   **Estado Activo**: Los enlaces correspondientes a la ruta actual deben resaltarse visualmente aplicando un fondo de contraste ligero (`bg-primary/10 text-primary font-medium`) y un indicador de barra vertical de color de marca.

---

## 4. Header Inteligente (Integración con react-headroom)

Para maximizar el espacio de lectura vertical disponible para las tablas y formularios del ERP, el Header principal de la aplicación integra la lógica de ocultamiento dinámico:

*   **Lógica de scroll**:
    *   Al hacer scroll hacia **abajo**, el Header se desliza hacia arriba ocultándose de la pantalla.
    *   Al hacer scroll hacia **arriba**, el Header reaparece inmediatamente de forma suave.
*   **Implementación**:
    *   Se utiliza el wrapper `<Headroom>` de la biblioteca autorizada `react-headroom`.
    *   Se le aplican clases Tailwind para desenfoque de fondo y translucidez (`backdrop-blur-md bg-background/80 border-b border-border`).
    *   Debe mantenerse en un índice Z controlado (`z-40`) para evitar solapamientos con diálogos de modales (`z-50`).
