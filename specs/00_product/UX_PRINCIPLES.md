# UX PRINCIPLES — Principios de Experiencia de Usuario

## Ciclo completo del usuario

```
Visitante anónimo
     │
     ▼
Lead (web / wizard / formulario)
     │
     ▼
Lead calificado (scoring automático + SLA)
     │
     ▼
Cliente (registrado con contactos y sitios)
     │
     ▼
Requerimiento activo (con ingeniero asignado)
     │
     ▼
Cotización enviada (con items, descuentos, IVA, vigencia)
     │
     ▼
Aprobación (flujo configurable por monto)
     │
     ▼
Trabajo / OT (planificado, ejecutado, entregado, cerrado)
     │
     ▼
Factura emitida → Pago recibido (total o parcial)
     │
     ▼
Garantía activa (12 meses automáticos)
```

---

## UX basada en Roles (Pilar III)

Cada usuario ve únicamente aquello que necesita para su trabajo:

| Rol | Lo que ve |
|---|---|
| **Cliente** | Pedidos, facturas, soporte, portal de autoservicio |
| **Técnico de Campo** | Órdenes de trabajo, planos, mantenimientos |
| **Ejecutivo Comercial** | Leads, cotizaciones, pipeline de ventas |
| **Director / Gerente** | KPIs, reportes, finanzas, dashboard ejecutivo |
| **Administrador** | Configuración, usuarios, auditoría, white label |

**Importante**: Este principio es únicamente visual. Nunca reemplaza RBAC, RLS ni seguridad backend.

---

## UI Defensiva (Pilar IV)

La interfaz nunca puede romperse.

| Situación | Comportamiento |
|---|---|
| Valor nulo | Mostrar "Sin información", "No disponible", "0", "0 COP", "0 CFM" |
| Valor undefined/null/NaN | **Nunca** mostrar al usuario. Siempre capturar y mostrar fallback. |
| Error real | **Registrarlo** (log, telemetría). Nunca ocultarlo. El usuario ve un mensaje amigable. |
| Carga de datos | Skeleton o spinner. Nunca pantalla en blanco. |
| Timeout | Mensaje claro + opción de reintentar. |
| Sin conexión | Banner no intrusivo indicando pérdida de conexión. La app no se congela. |

---

## Responsive Industrial (Pilar VIII)

| Regla | Prohibido | Preferir |
|---|---|---|
| Altura de pantalla | `h-screen` | `min-h-screen` |
| Overflow | `overflow-hidden` | `overflow-auto` |
| Teclados móviles | Que oculten botones/formularios/acciones | Scroll automático al campo activo |

---

## Resiliencia (Pilar XII)

| Requisito | Implementación |
|---|---|
| **Retry** | Reintentar operaciones fallidas con backoff |
| **Loading** | Indicador discreto de carga |
| **Skeleton** | Placeholder animado para datos estructurados |
| **Timeout** | Límite de espera con mensaje claro |
| **Mensajes claros** | Lenguaje del usuario, no códigos de error técnicos |
| **Offline** | Operación degradada cuando sea posible |

**Nunca**: Pantalla blanca, TypeError sin capturar, Aplicación congelada.

---

## UX Funcional (Pilar XVII)

Cada pantalla del sistema debe responder tres preguntas:

1. **¿Qué decisión ayuda a tomar?**
2. **¿Qué proceso acelera?**
3. **¿Qué problema resuelve?**

Si una pantalla no responde esas preguntas: **no debe existir.**

**Prohibido**: gráficos vacíos, KPIs decorativos, botones sin acción, pantallas de relleno, tarjetas sin datos, animaciones innecesarias.

---

## Estados estándar de componente

Todo componente interactivo debe soportar estos 9 estados:

| Estado | Comportamiento |
|---|---|
| **Loading** | Spinner discreto o deshabilitado (evitar doble clic) |
| **Skeleton** | Placeholder animado pulse gris para carga inicial |
| **Error** | Contenedor rojo claro (`bg-red-50 text-red-700`) con mensaje + botón reintentar |
| **Empty** | Icono gris + texto descriptivo + acción primaria (crear recurso) |
| **Success** | Feedback efímero (check verde) después de guardar |
| **Offline** | Banner no intrusivo superior |
| **Unauthorized** | Pantalla de bloqueo o redirect si no hay permisos RLS |
| **ReadOnly** | Interacción deshabilitada visualmente para roles de solo lectura |
| **Disabled** | `opacity-50 pointer-events-none` consistente |

---

## Accesibilidad (WCAG 2.1 Level AA)

| Requisito | Implementación |
|---|---|
| **Skip to content** | Enlace al inicio de `<main>` para teclado |
| **Focus traps** | En modales, dialogs y drawers (Radix UI nativo) |
| **Focus ring** | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |
| **Contraste mínimo** | Focus ring: 3:1 contra fondo circundante |
| **Icon-only buttons** | `aria-label` en español descriptivo |
| **Cambios dinámicos** | `aria-live="polite"` o `aria-live="assertive"` |
| **HTML5 semántico** | `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>` |
| **Jerarquía de encabezados** | Un solo `<h1>` por página. Coherencia `<h1>` → `<h6>`. |
| **Keyboard navigation** | Tab, Enter, Space, Escape estándar. Sin trampas de teclado. |

---

## Arquitectura de layout

```
+-----------------------------------------------------------+
|  [Sidebar]  |  [Smart Header (react-headroom)]            |
|             |---------------------------------------------|
|  Persistente|                                              |
|  y          |  [Main Workspace]                            |
|  Colapsable |  Área de trabajo dinámica y responsiva       |
|  (sm:iconos)|                                              |
|             |                                              |
+-----------------------------------------------------------+
```

| Elemento | Comportamiento |
|---|---|
| **Sidebar** | Desktop: 256px fijo, colapsable a 80px con tooltips. Mobile: Drawer flotante (Radix Sheet) |
| **Smart Header** | Scroll down: se oculta. Scroll up: reaparece. Fondo blur translúcido. Z-index: `z-40` |
| **Main** | `flex-grow`, overflow auto. Padding responsivo `p-4 md:p-6 lg:p-8` |
| **Modales** | Z-index: `z-50`. Backdrop blur. Centrados en pantalla |
| **Sheets** | Slide lateral derecho. Para creación/edición detallada |

---

## Navegación por teclado

| Tecla | Acción |
|---|---|
| `Tab` / `Shift + Tab` | Navegar entre controles en orden lógico |
| `Enter` / `Space` | Activar botón, link, checkbox |
| `Escape` | Cerrar dialog, popover, dropdown, tooltip |
| Flechas | Navegar en selects, tablas, menús |

---

## Persistencia de vistas

Las vistas deben persistirse mediante **Query Parameters**:

```
/erp/leads?view=table
/dashboard/jobs?status=open
/dashboard/clients?page=2&sort=name
```

Esto permite:
- Navegación con botón atrás del navegador
- Compartir URLs con estado específico
- Recargar sin perder contexto
