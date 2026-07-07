# PORTAL, CMS & BRANDING — Portal Cliente, Contenido y Marca

## 1. PORTAL DEL CLIENTE — Flujo de Autoservicio

### Objetivo

El portal elimina la dependencia del cliente con llamadas, correos y visitas para:
- Conocer el estado de sus proyectos
- Revisar y aceptar cotizaciones
- Ver y pagar facturas
- Descargar documentos
- Abrir tickets de soporte

### Flujo de Onboarding del Cliente

```
Cliente creado en el ERP
    ↓
Sistema envía invitación por email
    ↓
Email contiene:
  • URL del portal: portal.aeromax.com
  • Usuario: correo del cliente
  • Link para crear contraseña
    ↓
Cliente crea contraseña
    ↓
Cliente accede al portal
    ↓
Dashboard con resumen de su cuenta
```

### Secciones del Portal

```
PORTAL CLIENTE
├── Dashboard
│   └── Resumen: proyectos activos, cotizaciones, facturas, tickets
├── Proyectos
│   ├── Lista de proyectos (activos y completados)
│   └── Detalle: progreso, timeline, hitos, archivos
├── Cotizaciones
│   ├── Lista de cotizaciones (pendientes, aceptadas, rechazadas)
│   ├── Detalle: items, condiciones, versiones
│   ├── Aceptar (con confirmación)
│   └── Rechazar (con motivo)
├── Facturas
│   ├── Lista de facturas (todas, pendientes, pagadas, vencidas)
│   ├── Detalle: items, pagos aplicados, saldo
│   └── Pagar (integración Wompi)
├── Soporte
│   ├── Lista de tickets
│   ├── Crear nuevo ticket (asunto, proyecto, prioridad, descripción)
│   └── Conversación (chat)
├── Documentos
│   └── Archivos organizados por proyecto (planos, manuales, certificados)
└── Mi Perfil
    ├── Información personal
    ├── Empresa
    ├── Cambiar contraseña
    └── Preferencias de notificaciones
```

### Flujo de Pago en Portal

```
Cliente ve factura pendiente
    ↓
Clic en "Pagar"
    ↓
Selecciona método:
  ○ Tarjeta de crédito/débito → Wompi Widget
  ○ PSE → Redirige a banco
  ○ Transferencia → Muestra datos bancarios
    ↓
Sistema procesa pago (Wompi)
    ↓
Callback de Wompi → PAGO_PENDIENTE
    ↓
Confirmación → PAGO_CONFIRMADO
    ↓
Factura se actualiza (PAGO_PARCIAL o PAGO_TOTAL)
    ↓
Cliente recibe notificación + recibo PDF
```

---

## 2. CMS — Gestión de Contenido

### Flujo de Publicación

```
Editor crea/modifica contenido en el CMS
    ↓
Guarda como BORRADOR
    ↓
Vista previa (desktop/tablet/mobile)
    ↓
Solicita revisión (opcional)
    ↓
Publica (o programa fecha de publicación)
    ↓
Contenido disponible en la landing page pública
```

### Entidades del CMS

| Entidad | Descripción | Campos clave |
|---|---|---|
| Página | Home, Nosotros, FAQ, Términos | Título, slug, contenido (rich text), SEO |
| Blog Post | Artículo del blog | Título, categoría, autor, contenido, imagen, SEO |
| Producto CMS | Ficha de producto en web | Nombre, código, descripción, specs, imágenes, documentos |
| Servicio CMS | Servicio en web | Nombre, descripción, imagen, ícono, features |
| Caso de Éxito | Testimonial con métricas | Cliente, sector, métricas, imágenes |
| Banner | Banner promocional | Imagen, título, CTA, ubicación, fechas |
| Testimonio | Testimonio de cliente | Nombre, cargo, empresa, foto, texto |
| Menú | Navegación | Items (label, url, orden) |

### Estructura de Página Editable

Cada página de la landing es un conjunto de **secciones configurables**:

```
PÁGINA "HOME"
├── Hero (título, subtítulo, CTA, imagen/video, stats)
├── Trust Bar (logos de clientes)
├── Problema (título, pain points)
├── Solución (título, soluciones)
├── Sectores (título, sectores atendidos)
├── Servicios (título, servicios destacados)
├── Productos Destacados (selección del catálogo)
├── Casos de Éxito (selección)
├── Proceso (pasos del proceso)
├── CTA Final (título, subtítulo, botón)
└── Footer (links, contacto, legal)
```

Todas las secciones se pueden:
- Reordenar (drag & drop)
- Ocultar/Mostrar
- Editar contenido individual

---

## 3. WHITE LABEL — Branding por Tenant

### Flujo de Configuración

```
Admin accede a Configuración → White Label
    ↓
┌──────────────────────────────────────────────────────────┐
│ 1. LOGOS                                                │
│    Logo principal    [Subir PNG/SVG]                     │
│    Logo dark         [Subir PNG/SVG]                     │
│    Logo light        [Subir PNG/SVG]                     │
│    Logo impresión    [Subir PNG/SVG]                     │
│    Favicon           [Subir ICO/PNG]                     │
│                                                          │
│ 2. COLORES                                              │
│    Primario          ████████ [#1E40AF]                  │
│    Secundario        ████████ [#0F766E]                  │
│    Éxito             ████████ [#16A34A]                  │
│    Advertencia       ████████ [#D97706]                  │
│    Error             ████████ [#DC2626]                  │
│                                                          │
│ 3. TIPOGRAFÍA                                           │
│    Principal         Inter / Outfit / Custom             │
│    Tamaño base       14px / 16px / 18px                  │
│                                                          │
│ 4. LOADER                                               │
│    [Subir animación Lottie/GIF]                          │
│                                                          │
│ 5. EMAIL                                                │
│    Remitente         [nombre@empresa.com]                │
│    Firma             [HTML]                              │
│                                                          │
│  [Vista Previa] [Guardar] [Publicar Cambios]              │
└──────────────────────────────────────────────────────────┘
    ↓
Sistema inyecta CSS variables en <head>:
  :root {
    --primary: 215 80% 50%;
    --secondary: 175 70% 30%;
    ...
  }
    ↓
ERP, Landing y Portal reflejan los cambios
SIN recompilar el código.
```

### Inyección de White Label

```
[Base de Datos: tenant_settings]
    ↓
[Middleware de Next.js / Layout de Servidor]
    ↓
[Inyección en <head> HTML]
 ├── Logos: <link rel="icon">, <meta> tags
 ├── Colores: <style> con variables CSS en :root
 └── Fuentes: <link> a Google Fonts / local
    ↓
[Renderizado de la aplicación]
 Consume: bg-primary, text-primary, border-primary...
```

### Personalización por Tenant

| Elemento | Fuente de Datos | Inyección |
|---|---|---|
| Nombre comercial | `tenants.brand_name` | `<title>`, header, emails |
| Razón Social | `tenants.legal_name` | PDFs, contratos |
| Logo | `tenants.logo_url` | Sidebar, header, login |
| Favicon | `tenants.favicon_url` | `<link rel="icon">` |
| Colores | `tenant_settings.colors` | Variables CSS `:root` |
| Fuente | `tenant_settings.font` | Google Fonts link |
| Loader | `tenant_settings.loader_url` | Loading screen |
| Email remitente | `tenant_settings.email_from` | Emails transaccionales |
| Email firma | `tenant_settings.email_signature` | Footer de emails |
| Dominio | `tenants.custom_domain` | DNS / subdominio |

### Plantillas de Correo (White Label)

```
┌──────────────────────────────────────────┐
│ [LOGO EMPRESA]                           │
│                                          │
│ Estimado(a) Juan,                        │
│                                          │
│ Tu cotización COT-0042 está lista.      │
│                                          │
│ [VER COTIZACIÓN]                         │
│                                          │
│ ─────────────────────────────────────── │
│ [EMPRESA] - [TELÉFONO] - [CORREO]      │
│ [DIRECCIÓN] - [CIUDAD]                 │
└──────────────────────────────────────────┘
```

---

## 4. SEO y Metadatos

### Por Página (CMS)

| Meta Tag | Fuente |
|---|---|
| `<title>` | `page.seo_title` |
| `<meta name="description">` | `page.meta_description` |
| `<meta property="og:title">` | `page.seo_title` |
| `<meta property="og:description">` | `page.meta_description` |
| `<meta property="og:image">` | `page.social_image` |
| `<meta property="og:url">` | Canonical URL |
| `<link rel="canonical">` | Canonical URL |
| `<meta name="robots">` | `index, follow` (por defecto) |

### Sitemap

Generado automáticamente con todas las páginas, productos y artículos del blog.

---

## 5. Reglas del Portal, CMS y Branding

1. **Portal: modo claro siempre.** Consistente con la experiencia de autoservicio.
2. **Portal: cero hardcoding.** Todo contenido viene del backend.
3. **Portal: pagos encriptados.** Wompi maneja datos de tarjeta. El portal nunca los ve.
4. **CMS: editor con preview antes de publicar.**
5. **CMS: versionado de contenido.**
6. **CMS: programación de publicaciones.**
7. **Branding: sin recompilar.** Cambios de color/logo se reflejan al instante.
8. **Branding: fallback seguro.** Si el tenant no define color, usa defaults.
9. **SEO: meta tags dinámicos por página.**
10. **Todo contenido del CMS se sirve con ISR (Incremental Static Regeneration).**
