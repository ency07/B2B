# THEME & WHITE LABEL

## 1. Arquitectura de variables CSS

### 1.1 Estructura base

```css
:root {
  /* Modo claro (default para portal/landing) */
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
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
  /* Modo oscuro (default para ERP) */
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

### 1.2 Formato HSL

Todas las variables CSS usan formato HSL sin `hsl()` wrapper para compatibilidad con Tailwind:

```
--primary: 215 80% 50%;
/* Uso en Tailwind: bg-primary, text-primary, border-primary */
```

---

## 2. White Label por Tenant

### 2.1 Configurable por tenant

| Elemento | Fuente de datos | Inyección |
|---|---|---|
| Nombre comercial | `tenants.brand_name` | `<title>`, header, emails, PDFs |
| Logo principal | `tenants.logo_url` | Sidebar, login, emails, PDFs |
| Favicon | `tenants.favicon_url` | `<link rel="icon">` |
| Default avatar | `tenants.default_avatar_url` | Avatares de usuarios sin foto |
| Color primario | `tenants.branding.color_primario` | `--primary`, `--ring` |
| Color secundario | `tenants.branding.color_secundario` | `--secondary`, `--accent` |
| Loader personalizado | `tenants.branding.loader_url` | Pantalla de carga |

### 2.2 Flujo de inyección

```
[Base de Datos: supabase.tenant_settings]
                    ↓
[Middleware de Next.js / Layout de Servidor]
                    ↓
[Inyección en <head> HTML]
 ├── Logos e Iconos: Meta-tags e imagen de carga dinámica
 └── Colores: <style> inyectando variables CSS en :root
                    ↓
[Renderizado de Interfaz del ERP]
 Consumo uniforme de variables CSS (bg-primary, text-primary-foreground)
```

### 2.3 Inyección de CSS

```html
<style>
  :root {
    --primary: 215 80% 50%; /* Color corporativo del tenant */
    --ring: 215 80% 50%;
  }
</style>
```

### 2.4 Fallback

Si un tenant no define colores personalizados:
- ERP: usa colores neutros oscuros estándar (`zinc-950` background).
- Portal/Landing: usa colores neutros claros estándar (`white` background).

---

## 3. ThemeProvider

### 3.1 Implementación

```
import { ThemeProvider } from 'next-themes'

<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem={false}
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

### 3.2 Reglas

- Default: `dark` (ERP).
- `enableSystem={false}`: No sigue preferencia del sistema.
- `disableTransitionOnChange`: Evita flash de transición al cargar.
- Envuelve el Root Layout de Next.js.

### 3.3 Cambio de tema

- ERP: siempre dark.
- Portal: siempre light.
- Landing: siempre light.
- Prohibido toggle de tema dentro del ERP.

---

## 4. Componentes críticos white label

### 4.1 Pantalla de Login

```
<div class="grid min-h-screen lg:grid-cols-2">
  <!-- Panel izquierdo: Marca del tenant -->
  <div class="hidden lg:flex flex-col justify-center p-12 bg-zinc-900">
    <img src="{tenant.logo}" alt="{tenant.name}" class="h-12 mb-8" />
    <h1 class="text-3xl font-display font-bold text-zinc-100">{tenant.brand_name}</h1>
    <p class="text-zinc-400 mt-2">{tenant.tagline}</p>
  </div>

  <!-- Panel derecho: Formulario -->
  <div class="flex items-center justify-center p-8">
    <div class="w-full max-w-sm space-y-6">
      <div class="lg:hidden">
        <img src="{tenant.logo}" alt="{tenant.name}" class="h-8 mb-6" />
      </div>
      <LoginForm />
    </div>
  </div>
</div>
```

### 4.2 Sidebar

- Logo de cabecera: cambia dinámicamente según el tenant activo.
- Color de indicador activo: `border-l-2 border-primary` (color del tenant).
- Fondo de enlace activo: `bg-primary/10` (color del tenant con opacidad).

### 4.3 Avatar sin foto

```
<div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-medium text-sm">
  {initials}
</div>
```

---

## 5. Emails y PDFs

### 5.1 Plantillas de correo

- Logo del tenant en la parte superior.
- Color primario del tenant en botones y bordes.
- Footer: nombre comercial + razón social del tenant.
- Enviados vía Resend.

### 5.2 Plantillas de factura/OT en PDF

- Logo del tenant en encabezado.
- Colores corporativos en bordes de tablas y cabeceras.
- Datos fiscales del tenant.
- Generados dinámicamente.

---

## 6. Reglas de white label

1. **Prohibido hardcoding**. Todo logo, color, texto, URL debe venir de `tenant_settings`.
2. **Independencia de código**. Componentes React no conocen colores específicos. Consumen `bg-primary`, `text-primary-foreground`.
3. **Sin recompilar**. Cambios de marca se aplican sin rebuild del frontend.
4. **Fallback seguro**. Si el tenant no tiene configuración, usa defaults del sistema.
5. **Validación de assets**. Logos deben ser PNG/SVG optimizados para fondo claro y oscuro.
