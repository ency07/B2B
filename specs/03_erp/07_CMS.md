# CMS — Gestión de Contenido Web

## Filosofía

El CMS NO es un blog genérico. Es el **motor de contenido** que alimenta la landing page y el portal público del tenant.

Todo editable. Nada hardcodeado.

Debe permitir al administrador del tenant gestionar:
- Home (hero, secciones, banners)
- Productos (catálogo, fichas técnicas)
- Servicios (descripciones, imágenes)
- Blog (artículos, categorías)
- Casos de éxito (métricas, imágenes)
- Páginas estáticas (nosotros, FAQ, términos)
- Testimonios
- Logos de clientes

---

## Sub-módulos

```
CMS
├── Páginas (Home, Nosotros, FAQ, Términos)
├── Productos
├── Servicios
├── Blog (Artículos + Categorías)
├── Casos de Éxito
├── Testimonios
├── Clientes (Logos)
├── Banners
└── Menú de Navegación
```

---

## Layout

```
HEADER (título + acciones: Nueva Página, Publicar)
↓
SIDEBAR CMS (navegación interna del CMS)
↓
ÁREA PRINCIPAL (editor + preview)
```

### Sidebar CMS

```
<div class="w-56 border-r border-zinc-800/40 bg-zinc-900/40 p-3 space-y-1">
  <p class="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Contenido</p>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100">
    <Home class="w-4 h-4" /> Páginas
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100">
    <Package class="w-4 h-4" /> Productos
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100">
    <Wrench class="w-4 h-4" /> Servicios
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100">
    <FileText class="w-4 h-4" /> Blog
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100">
    <Award class="w-4 h-4" /> Casos de Éxito
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100">
    <MessageSquare class="w-4 h-4" /> Testimonios
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100">
    <Users class="w-4 h-4" /> Clientes
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100">
    <Image class="w-4 h-4" /> Banners
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-100">
    <Menu class="w-4 h-4" /> Navegación
  </a>
</div>
```

---

## Editor de Páginas

### Layout (split view)

```
<div class="flex h-[calc(100vh-128px)]">
  <!-- Editor (60%) -->
  <div class="w-3/5 border-r border-zinc-800/40 overflow-y-auto p-6">
    {editorContent}
  </div>

  <!-- Preview (40%) -->
  <div class="w-2/5 bg-zinc-900/40 overflow-y-auto">
    <div class="sticky top-0 px-4 py-2 border-b border-zinc-800/40 flex items-center justify-between">
      <span class="text-xs text-zinc-500">Vista previa</span>
      <div class="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm"><Monitor class="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon-sm"><Tablet class="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon-sm"><Smartphone class="w-4 h-4" /></Button>
      </div>
    </div>
    <div class="p-4">
      <PagePreview content={editorContent} />
    </div>
  </div>
</div>
```

### Campos editables por página

#### Home

| Sección | Campos Editables |
|---|---|
| Hero | Título, subtítulo, imagen/video, CTA primario, CTA secundario, stats |
| Trust Bar | Logos de clientes (array) |
| Problema | Título, descripción, pain points (array de título+descripción+métrica+icono) |
| Solución | Título, descripción, soluciones (array de título+descripción) |
| Sectores | Título, sectores (array de nombre+descripción+imagen+icono) |
| Servicios | Título, servicios (array de título+descripción+imagen+features) |
| Productos Destacados | Productos seleccionados del catálogo |
| Casos de Éxito | Casos seleccionados |
| Proceso | Pasos (array de título+descripción+duración+icono) |
| CTA Final | Título, subtítulo, texto del botón |
| Footer | Texto legal, links, redes sociales |

#### Blog

| Campo | Tipo |
|---|---|
| Título | Text |
| Slug | Auto-generated |
| Categoría | Select |
| Autor | Select (usuarios) |
| Imagen destacada | Upload |
| Resumen | Textarea |
| Contenido | Rich text editor |
| Productos relacionados | Multi-select |
| Servicios relacionados | Multi-select |
| SEO Title | Text |
| Meta Description | Textarea |
| Estado | Draft / Published |
| Fecha publicación | Date |

---

## Productos (CMS)

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Imagen | Izquierda | Thumbnail 40x40 |
| Nombre | Izquierda | Texto |
| Categoría | Centro | Badge |
| Serie | Centro | Texto |
| Estado | Centro | Badge (Publicado/Borrador/Oculto) |
| Última edición | Centro | Fecha |
| Acciones | Derecha | Icon buttons |

### Editor de Producto

```
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <!-- Columna izquierda: Campos -->
  <div class="space-y-6">
    <div>
      <label class="text-sm font-medium text-zinc-300 mb-2 block">Nombre</label>
      <Input />
    </div>
    <div>
      <label class="text-sm font-medium text-zinc-300 mb-2 block">Código</label>
      <Input class="font-mono" />
    </div>
    <div>
      <label class="text-sm font-medium text-zinc-300 mb-2 block">Categoría</label>
      <Select />
    </div>
    <div>
      <label class="text-sm font-medium text-zinc-300 mb-2 block">Descripción</label>
      <Textarea rows={4} />
    </div>
    <div>
      <label class="text-sm font-medium text-zinc-300 mb-2 block">Especificaciones</label>
      <div class="space-y-2">
        {specs.map(spec => (
          <div class="flex items-center gap-2">
            <Input placeholder="Etiqueta" class="flex-1" value={spec.label} />
            <Input placeholder="Valor" class="flex-1 font-mono" value={spec.value} />
            <Button variant="ghost" size="icon-sm"><X class="w-4 h-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm"><Plus class="w-4 h-4 mr-2" /> Agregar spec</Button>
      </div>
    </div>
  </div>

  <!-- Columna derecha: Media + SEO -->
  <div class="space-y-6">
    <div>
      <label class="text-sm font-medium text-zinc-300 mb-2 block">Imágenes</label>
      <ImageUpload multiple maxImages={6} />
    </div>
    <div>
      <label class="text-sm font-medium text-zinc-300 mb-2 block">Documentos</label>
      <FileUpload accept=".pdf,.dwg,.step,.dxf" />
    </div>
    <div>
      <label class="text-sm font-medium text-zinc-300 mb-2 block">SEO</label>
      <div class="space-y-3">
        <Input placeholder="SEO Title" />
        <Textarea placeholder="Meta Description" rows={2} />
      </div>
    </div>
    <div>
      <label class="text-sm font-medium text-zinc-300 mb-2 block">Estado</label>
      <Select>
        <option>Publicado</option>
        <option>Borrador</option>
        <option>Oculto</option>
      </Select>
    </div>
  </div>
</div>
```

---

## Blog

### Tabla de Artículos

| Columna | Alineación | Tipo |
|---|---|---|
| Imagen | Izquierda | Thumbnail 60x40 |
| Título | Izquierda | Texto |
| Categoría | Centro | Badge |
| Autor | Izquierda | Avatar + nombre |
| Fecha | Centro | Fecha |
| Estado | Centro | Badge (Publicado/Borrador/Programado) |
| Vistas | Derecha | font-mono |
| Acciones | Derecha | Icon buttons |

### Editor de Artículo

Layout: 2 columnas. Izquierda: editor de contenido. Derecha: metadata (categoría, autor, imagen, SEO, estado).

---

## Casos de Éxito

### Editor

| Campo | Tipo |
|---|---|
| Título | Text |
| Sector | Select |
| Cliente | Text |
| Logo Cliente | Upload |
| Imagen Principal | Upload |
| Descripción | Textarea |
| Métrica 1 (valor + label) | 2 inputs |
| Métrica 2 (valor + label) | 2 inputs |
| Métrica 3 (valor + label) | 2 inputs |
| Galería | Multi-upload |
| Estado | Select (Publicado/Borrador) |

---

## Testimonios

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Avatar | Izquierda | Thumbnail 40x40 |
| Nombre | Izquierda | Texto |
| Cargo | Izquierda | Texto |
| Empresa | Centro | Texto |
| Testimonio | Izquierda | Texto truncado |
| Estado | Centro | Badge |
| Acciones | Derecha | Icon buttons |

---

## Banners

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Preview | Izquierda | Thumbnail 120x40 |
| Título | Izquierda | Texto |
| Ubicación | Centro | Badge (Home/Servicios/Productos) |
| Fecha Inicio | Centro | Fecha |
| Fecha Fin | Centro | Fecha |
| Estado | Centro | Badge (Activo/Inactivo/Expirado) |
| Acciones | Derecha | Icon buttons |

---

## Menú de Navegación

### Editor

```
<div class="space-y-3">
  {menuItems.map((item, i) => (
    <div class="flex items-center gap-3 px-3 py-2 rounded-lg border border-zinc-800/40 bg-zinc-900/20">
      <GripVertical class="w-4 h-4 text-zinc-500 cursor-grab" />
      <Input value={item.label} class="flex-1" />
      <Input value={item.url} class="flex-1 font-mono" />
      <Select value={item.target} class="w-32">
        <option>_self</option>
        <option>_blank</option>
      </Select>
      <div class="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => moveUp(i)}><ChevronUp class="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => moveDown(i)}><ChevronDown class="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon-sm" onClick={() => remove(i)}><Trash2 class="w-4 h-4 text-red-400" /></Button>
      </div>
    </div>
  ))}
  <Button variant="outline" size="sm"><Plus class="w-4 h-4 mr-2" /> Agregar item</Button>
</div>
```

---

## Reglas del CMS

1. Todo contenido editable desde el CMS. Prohibido hardcodear.
2. Productos del CMS vinculados a productos del Inventario.
3. Imágenes optimizadas (WebP, lazy loading).
4. SEO: title, meta description, OpenGraph por página.
5. Versionado de contenido (historial de cambios).
6. Preview antes de publicar.
7. Programación de publicación por fecha.
8. Multi-idioma preparado (estructura i18n).
9. Todo cambio queda auditado.
10. Banners con fecha de inicio y fin.
