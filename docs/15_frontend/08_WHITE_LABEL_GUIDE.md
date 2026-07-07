# 08_WHITE_LABEL_GUIDE: Guía de Personalización Dinámica (White Label)

> [!NOTE]
> Especifica los alcances y directivas técnicas de la arquitectura White Label, permitiendo que cada tenant personalice la experiencia de la interfaz sin interferir con el núcleo del ERP.

## 1. Alcance de Personalización por Tenant

Cada cliente del ERP (identificado por su `tenant_id`) puede configurar los siguientes activos de marca:

1.  **Nombre Comercial**: Nombre de la empresa que se muestra en títulos de pestaña del navegador, correos electrónicos y PDFs.
2.  **Razón Social / Dominio**: Configuración de subdominios (`empresa.erp.com`) y dominios personalizados.
3.  **Identidad Visual**:
    *   *Logo Principal*: Para sidebar, facturas en PDF y cabecera de correos (formato PNG/SVG, optimizado para fondo claro y oscuro).
    *   *Favicon*: Icono miniatura de la pestaña del navegador.
    *   *Default Avatar*: Imagen por defecto para usuarios sin foto.
4.  **Esquema de Colores (CSS Variables)**:
    *   `Color Primario`: Botones destacados, enlaces activos e iconos de menú.
    *   `Color Secundario`: Fondos sutiles, bordes hover y badges neutros.
5.  **Loader de Carga**: Animación del loader personalizada con el logotipo de la empresa del tenant.

---

## 2. Flujo de Configuración de Estilos y Activos

```
[Base de Datos: supabase.tenant_settings]
                   ↓
[Carga de Middleware de Next.js / Layout de Servidor]
                   ↓
[Inyección en <head> HTML]
 ├── Logos e Iconos: Meta-tags e Imagen de carga dinámica.
 └── Colores: <style> inyectando variables CSS en :root.
                   ↓
[Renderizado de Interfaz del ERP]
 Consumo uniforme de variables CSS (bg-primary, text-primary-foreground).
```

---

## 3. Guía de Personalización de Componentes Críticos

*   **Pantalla de Login**:
    *   Se compone de un layout dividido: panel izquierdo con la marca del tenant (nombre comercial, logo inyectado dinámicamente) y panel derecho con el formulario.
    *   El botón de acción principal (`Entrar`) y los enlaces de recuperación de contraseña consumen el color primario personalizado del tenant.
*   **Sidebar y Header**:
    *   *Logo de Cabecera*: Ubicado en la esquina superior izquierda del Sidebar, cambia dinámicamente según el tenant activo.
    *   *Avatar del Perfil*: Si el usuario no cuenta con foto propia, el avatar muestra las iniciales del usuario coloreadas con el gradiente derivado del color secundario del tenant.

---

## 4. Canales e Impresión (Correos y PDFs)

*   **Plantillas de Correo (Email Templates)**:
    *   Las notificaciones enviadas por correo (vía Resend) cargan el logotipo e identidad visual del tenant en la parte superior.
    *   El footer del correo firma con el Nombre Comercial y la Razón Social configurados por el tenant.
*   **Plantillas de Factura / Órdenes en PDF**:
    *   Los PDFs generados dinámicamente cargan el logotipo, colores corporativos primario/secundario (usados para bordes de tablas y cabeceras de facturas) y datos fiscales en el encabezado.
