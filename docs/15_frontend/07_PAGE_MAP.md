# 07_PAGE_MAP: Mapeo de Rutas y Flujo de Navegación

> [!NOTE]
> Define la jerarquía física de archivos de rutas de Next.js (App Router), el flujo de control de sesiones y los estados de redirección por Middleware.

## 1. Estructura de Rutas del ERP-B2B

El enrutamiento está dividido en tres grupos lógicos principales:

### 1.1 Web Pública y Onboarding (Rutas Públicas)
*   `/` (Landing Page): Presentación comercial de la empresa.
*   `/wizard` (Cotizador dinámico): Flujo interactivo paso a paso para estimación de costos y captación de leads.

### 1.2 Autenticación
*   `/login`: Pantalla de inicio de sesión de usuarios (administradores y clientes).
*   `/recovery`: Solicitud de recuperación de contraseña.
*   `/reset-password`: Formulario de cambio de contraseña con token temporal.

### 1.3 Panel del Operador y Administrador (Rutas del ERP - Protegidas)
*   `/dashboard`: Vista analítica principal del ERP (KPIs, widgets, resúmenes).
*   `/dashboard/clients`: Catálogo y administración de clientes y contactos.
*   `/dashboard/jobs`: Órdenes de trabajo, actividades, materiales y asignaciones.
*   `/dashboard/inventory`: Movimientos de stock, bodegas e historial de inventarios.
*   `/dashboard/invoices`: Listado de facturas, emisión de cobros y pagos.
*   `/dashboard/settings`: Centro de configuración empresarial (Settings de tenant y White Label).

### 1.4 Portal de Clientes Externo (Rutas Protegidas de Clientes)
*   `/portal`: Vista de bienvenida para clientes, resumen de trabajos y facturas pendientes.
*   `/portal/jobs`: Listado y estado de las intervenciones del cliente.
*   `/portal/invoices`: Historial de facturas y pasarela de pagos.

---

## 2. Flujo de Control de Sesión y Middleware

El acceso a las rutas está regulado dinámicamente mediante el Middleware de Next.js conectado con Supabase Auth:

```
[Usuario accede a una ruta]
          ↓
[¿Es ruta bajo /dashboard o /portal?]
   ├── SÍ ── [¿Tiene sesión activa?]
   │             ├── NO ──> [Redirigir a /login]
   │             └── SÍ ──> [¿Tiene rol apropiado para el submódulo?]
   │                           ├── NO ──> [Mostrar pantalla 403 Sin Permiso]
   │                           └── SÍ ──> [Renderizar contenido]
   └── NO ── [¿Accede a /login y ya está logueado?]
                 ├── SÍ ──> [Redirigir a /dashboard o /portal según rol]
                 └── NO ──> [Renderizar vista pública]
```

---

## 3. Lógica de Loaders Globales y Redirecciones

*   **Next.js Navigation**:
    *   Utilizamos la API de `useRouter` y `<Link>` de Next.js para asegurar una SPA instantánea.
    *   Se implementa el archivo `/app/loading.tsx` en el raíz del Dashboard para pintar un Skeleton completo del Workspace mientras se resuelven las promesas de servidor (`Server Components`).
*   **Transición de Estados de Enrutamiento**:
    *   Al enviar formularios o disparar clics de navegación, el estado de carga (`useTransition`) bloquea clics repetitivos y pinta un Spinner sutil en la esquina superior de la pantalla.
