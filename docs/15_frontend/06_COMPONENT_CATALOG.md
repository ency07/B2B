# 06_COMPONENT_CATALOG: Catálogo Oficial de Componentes de UI

> [!NOTE]
> Este catálogo centraliza los componentes base autorizados para el desarrollo en el ERP. Previene la creación de componentes huérfanos o duplicados.

## 1. Componentes Base y de Retroalimentación

*   **`Button` (shadcn)**:
    *   *Variantes*: `default` (color primario), `secondary`, `destructive`, `outline`, `ghost`, `link`.
    *   *Propiedades clave*: `size` (`default`, `sm`, `lg`, `icon`), `isLoading` (muestra spinner y bloquea clics).
*   **`Badge` (shadcn)**:
    *   *Uso*: Estado de registros (ej. Factura `PAGADA`, `PENDIENTE`, Trabajo `EN_PROGRESO`).
    *   *Colores semánticos*: Éxito (verde), Peligro (rojo), Advertencia (ámbar), Información (azul), Neutral (gris).
*   **`Avatar` (shadcn)**:
    *   *Uso*: Fotos de perfil de usuario y avatar por defecto con las iniciales de su nombre.
*   **`Skeleton` (shadcn)**:
    *   *Uso*: Rectángulos o círculos grises animados (`animate-pulse`) para cargas de layouts y tarjetas.
*   **`Spinner` (Custom)**:
    *   *Uso*: Icono de carga circular animado (`animate-spin`), reusable dentro de botones o pantallas de espera completas.

---

## 2. Componentes de Formularios (Form Controls)

Integrados de forma nativa con **React Hook Form** + **Zod** mediante el envoltorio `<Form>` de shadcn:

*   **`Input` (shadcn)**:
    *   Cajas de texto plano con soporte para iconos de inicio/fin (ej. icono de búsqueda o lupa).
*   **`Textarea` (shadcn)**:
    *   Para comentarios, descripciones largas o notas con control de redimensionamiento vertical.
*   **`Checkbox` y `Switch` (shadcn / Radix)**:
    *   Selectores binarios (encendido/apagado, selección múltiple en listas).
*   **`Select` y `Combobox` (shadcn / Radix)**:
    *   *Select*: Para listas estáticas de pocas opciones.
    *   *Combobox*: Con soporte de autocompletado y búsqueda difusa para catálogos grandes (ej. selección de cliente).
*   **`FormItem`, `FormLabel`, `FormControl`, `FormMessage`**:
    *   Estructura estandarizada para pintar la etiqueta del campo, el input, el texto de ayuda y los mensajes de error de validación de Zod.

---

## 3. Visualización de Datos Tabulares (Table System)

Construido sobre los primitivos de tabla de shadcn y estructurado lógicamente con **TanStack Table**:

*   **`Table`**: Contenedor principal de la rejilla.
*   **`TableHeader` & `TableHead`**: Encabezados con soporte para iconos indicadores de ordenación (`SortAsc`, `SortDesc`).
*   **`TableBody` & `TableRow`**: Filas dinámicas con soporte de selección mediante checkbox de fila, y estados de `:hover` para interactividad.
*   **`TableCell`**: Celdas individuales. Deben estructurarse con alineaciones consistentes: texto a la izquierda, números/importes a la derecha, fechas al centro.
*   **`TablePagination`**: Panel inferior con selectores de registros por página (10, 25, 50), contador de totales de filas y botones de navegación de página.

---

## 4. Estructuras de Contenedores y Diálogos

*   **`Dialog` (Modals)**: Ventana de diálogo emergente centrada.
*   **`Sheet` (Drawers)**: Paneles laterales deslizantes de derecha a izquierda.
*   **`Popover`**: Ventana flotante posicionada respecto a un disparador.
*   **`Tooltip`**: Etiqueta explicativa discreta en hover.
*   **`Card`**: Contenedor estructurado con `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` y `CardFooter`.

---

## 5. Estados Reutilizables

*   **`LoadingState`**: Pantalla completa o contenedor con un Spinner centrado.
*   **`EmptyState`**: Contenedor centrado con icono de Lucide gris, título corto, descripción explicativa y un botón de acción principal para crear el recurso.
*   **`ErrorState`**: Banner o caja indicadora de fallo, con código de error imprimible y botón de reintento.
