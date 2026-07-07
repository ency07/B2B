# 04_THEME_SYSTEM: Sistema de Temas y Branding Dinámico

> [!NOTE]
> Define la arquitectura de colores y variables CSS para el soporte nativo de modos Claro/Oscuro y la inyección dinámica de temas de marca (White Label).

## 1. Arquitectura de Variables CSS

El sistema utiliza variables CSS semánticas tanto para temas predeterminados como para marcas personalizadas. La configuración en el archivo global de estilos (`index.css`) se estructura de la siguiente manera:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  
  /* Colores de marca y estado (Modificables dinámicamente) */
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
}

.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 3.9%;
  --popover-foreground: 0 0% 98%;
  
  --primary: 0 0% 98%;
  --primary-foreground: 240 5.9% 10%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 240 4.9% 83.9%;
}
```

---

## 2. Proveedor de Temas (`ThemeProvider`)

*   Utilizamos `next-themes` para gestionar el cambio de modo Claro/Oscuro y la persistencia de la preferencia del usuario en local storage.
*   El componente `ThemeProvider` envuelve el Root Layout de Next.js, habilitando la clase `.dark` en la etiqueta `<html>`.

---

## 3. Arquitectura Desacoplada para White Label

El ERP permite a cada cliente (tenant) personalizar la paleta de colores corporativos sin necesidad de recompilar la aplicación. Esto se logra desacoplando el CSS del código JavaScript:

1.  **Inyección por Inlining CSS**:
    *   Al cargar la aplicación, un componente de servidor lee la configuración del tenant (`tenant_settings` en la base de datos).
    *   Inyecta en la cabecera HTML un bloque `<style>` que sobrescribe las variables CSS de color del elemento `:root`:
    ```html
    <style>
      :root {
        --primary: 215 80% 50%; /* Color corporativo del tenant */
        --ring: 215 80% 50%;
      }
    </style>
    ```
2.  **Mecanismo de Salvaguarda (Fallback)**:
    *   Si un cliente no define colores personalizados, la aplicación utiliza los colores neutros oscuros estándar del ERP.
3.  **Independencia de Código**:
    *   Los componentes React y clases Tailwind no conocen los colores específicos de la empresa; simplemente consumen clases utilitarias como `bg-primary` y `text-primary-foreground`.
