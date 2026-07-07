# PATTERNS — Patrones de UX

## 1. Form Patterns

### 1.1 Formulario estándar

```
<form class="space-y-6">
  <!-- Sección -->
  <div>
    <h3 class="text-base font-semibold text-zinc-100 mb-4">{sectionTitle}</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields}
    </div>
  </div>

  <!-- Acciones -->
  <div class="flex items-center justify-end gap-3 pt-6 border-t border-zinc-800/40">
    <Button variant="outline" type="button">Cancelar</Button>
    <Button type="submit" isLoading={isSubmitting}>Guardar</Button>
  </div>
</form>
```

### 1.2 Campo de formulario

```
<FormField control={control} name="fieldName" render={({ field }) => (
  <FormItem>
    <FormLabel>{label}</FormLabel>
    <FormControl>
      <Input {...field} />
    </FormControl>
    <FormDescription>{helperText}</FormDescription>
    <FormMessage />
  </FormItem>
)} />
```

### 1.3 Validación reactiva

- Validación en `onChange` y `onBlur` con Zod.
- Borde rojo + icono `AlertCircle` en error.
- Mensaje de error debajo del campo en `text-red-400 text-xs`.
- Prohibido enviar si hay errores.

### 1.4 Layout de formulario

| Tipo | Layout |
|---|---|
| Corto (< 5 campos) | 1 columna |
| Medio (5-10 campos) | 2 columnas en `md+` |
| Largo (> 10 campos) | Secciones con títulos, 2 columnas |
| Wizard | 1 columna, máximo 5 campos por paso |

### 1.5 Reglas

- Labels siempre visibles. Prohibido placeholder como único label.
- Campos obligatorios: label con `*` rojo.
- Helper text: `text-xs text-zinc-500` debajo del input.
- Botón de submit siempre a la derecha.
- Botón de cancelar a la izquierda del submit.

---

## 2. Data Display Patterns

### 2.1 Tabla inteligente

```
<div class="space-y-4">
  <!-- Filtros -->
  <div class="flex flex-col sm:flex-row gap-3">
    <Input placeholder="Buscar..." class="max-w-sm" />
    <Select>{statusFilter}</Select>
    <Select>{dateFilter}</Select>
    <Button variant="outline" size="sm">
      <Filter class="w-4 h-4 mr-2" />
      Más filtros
    </Button>
  </div>

  <!-- Tabla -->
  <Table>...</Table>

  <!-- Paginación -->
  <TablePagination />
</div>
```

### 2.2 Drill-down (Sheet)

- Al hacer clic en una fila → abrir Sheet lateral derecho.
- Sheet contiene: cabecera, tabs de información, acciones.
- Prohibido redirigir a otra página para ver detalles.

### 2.3 Vista maestra-detalle (split panel)

```
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <!-- Lista -->
  <div class="space-y-2">
    {items.map(item => (
      <div
        key={item.id}
        class={`p-4 rounded-lg border cursor-pointer transition-colors ${
          selectedId === item.id
            ? 'border-primary bg-primary-muted'
            : 'border-zinc-800/40 hover:bg-zinc-800/20'
        }`}
        onClick={() => setSelectedId(item.id)}
      >
        {item.preview}
      </div>
    ))}
  </div>

  <!-- Detalle -->
  <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6">
    {selectedItem ? <DetailView item={selectedItem} /> : <EmptyState />}
  </div>
</div>
```

### 2.4 Reglas

- Filtros persistentes como Query Parameters.
- Prohibido tablas sin paginación si > 25 registros.
- Prohibido tablas sin estado Empty.
- Alineación semántica rigurosa (texto izquierda, números derecha, fechas centro).

---

## 3. Navigation Patterns

### 3.1 Sidebar navigation

- Módulos agrupados por categoría.
- Estado activo: fondo `bg-primary/10`, texto `text-primary`, indicador `border-l-2 border-primary`.
- Colapsado: solo iconos con tooltips.

### 3.2 Breadcrumb navigation

- Máximo 4 niveles.
- Icono de home en primer nivel.
- Página actual sin enlace, con `aria-current="page"`.

### 3.3 Tab navigation

```
<Tabs defaultValue="details">
  <TabsList class="bg-zinc-800/40">
    <TabsTrigger value="details">Detalles</TabsTrigger>
    <TabsTrigger value="materials">Materiales</TabsTrigger>
    <TabsTrigger value="audit">Auditoría</TabsTrigger>
    <TabsTrigger value="timeline">Timeline</TabsTrigger>
  </TabsList>
  <TabsContent value="details">{content}</TabsContent>
  <TabsContent value="materials">{content}</TabsContent>
  <TabsContent value="audit">{content}</TabsContent>
  <TabsContent value="timeline">{content}</TabsContent>
</Tabs>
```

### 3.4 Query Parameter persistence

```
// URL: /dashboard/jobs?status=EN_EJECUCION&site=bogota&page=2
const searchParams = useSearchParams()
const status = searchParams.get('status')
const site = searchParams.get('site')
const page = searchParams.get('page')
```

### Reglas

- Compartir URLs con estado específico.
- Botón atrás del navegador funciona correctamente.
- Recargar sin perder contexto.

---

## 4. Feedback Patterns

### 4.1 Toast notifications

```
toast({
  title: 'Cotización creada',
  description: 'COT-0042 se ha creado exitosamente.',
  variant: 'success', // 'success' | 'error' | 'warning' | 'info'
  duration: 4000,
})
```

| Variante | Duración | Icono |
|---|---|---|
| `success` | 4000ms | `CheckCircle` |
| `error` | 6000ms | `AlertCircle` |
| `warning` | 5000ms | `AlertTriangle` |
| `info` | 4000ms | `Info` |

### 4.2 Inline alerts

- Usar `Alert` component para mensajes dentro del flujo.
- Prohibido toast para errores de formulario (usar inline validation).

### 4.3 Confirmation dialogs

```
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Eliminar</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
      <AlertDialogDescription>
        Esta acción no se puede deshacer. Se realizará un borrado lógico.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction variant="destructive">Confirmar</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### 4.4 Loading states

| Contexto | Patrón |
|---|---|
| Página completa | `loading.tsx` con skeleton del layout |
| Sección | Skeleton del contenido específico |
| Botón | Spinner inline + `pointer-events-none` |
| Tabla | Skeleton de 5 filas |
| Card | Skeleton de la card completa |
| Lista | Skeleton de items |

### 4.5 Offline banner

```
<div class="fixed top-0 left-0 right-0 z-60 bg-amber-600 text-white text-sm text-center py-2">
  Sin conexión. Algunas funciones pueden no estar disponibles.
</div>
```

### Reglas

- Toast: esquina superior derecha.
- Prohibido toast para errores de validación de formulario.
- Confirmation dialog para acciones destructivas.
- Offline banner: `z-60`, no intrusivo.
