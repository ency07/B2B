# PORTAL PROYECTOS — Seguimiento de Proyectos del Cliente

## Filosofía

El cliente no necesita ver cada tarea. Necesita saber:
- ¿En qué va mi proyecto?
- ¿Cuándo termina?
- ¿Qué falta?
- ¿Puedo ver los documentos?

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Proyectos                                                            │
│ Seguimiento de tus proyectos activos y completados                   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ OT-0018 · Instalación Extractor Industrial          En Curso │    │
│ │                                                              │    │
│ │ ████████████████░░░░░░░░░░░░ 65%                             │    │
│ │                                                              │    │
│ │ Cliente: Nutresa S.A.                                        │    │
│ │ Ingeniero: Carlos Méndez                                     │    │
│ │ Inicio: 15 Ene 2025 — Entrega: 28 Feb 2025                  │    │
│ │                                                              │    │
│ │ [Ver detalle →]                                              │    │
│ └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ OT-0012 · Mantenimiento Preventivo                   Completado│   │
│ │                                                              │    │
│ │ ████████████████████████████ 100%                            │    │
│ │                                                              │    │
│ │ Cliente: Nutresa S.A.                                        │    │
│ │ Completado: 10 Dic 2024                                      │    │
│ │                                                              │    │
│ │ [Ver documentos →]                                           │    │
│ └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Lista de Proyectos

```
<div class="space-y-4">
  {projects.map(project => (
    <ProjectCard project={project} />
  ))}
</div>
```

### Project Card

```
<div class="bg-white border border-slate-200 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 cursor-pointer">
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-3">
        <span class="font-mono text-sm text-slate-500">{project.code}</span>
        <span class="text-slate-300">·</span>
        <h3 class="text-lg font-semibold text-slate-900">{project.name}</h3>
      </div>
      <Badge variant={project.statusVariant}>{project.status}</Badge>
    </div>

    <!-- Progress -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm text-slate-500">Progreso</span>
        <span class="text-sm font-semibold text-slate-900">{project.progress}%</span>
      </div>
      <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div class={`h-full rounded-full transition-all duration-500 ${
          project.progress === 100 ? 'bg-green-500' : 'bg-primary'
        }`} style={{ width: `${project.progress}%` }} />
      </div>
    </div>

    <!-- Meta -->
    <div class="flex items-center gap-6 text-sm text-slate-500">
      <div class="flex items-center gap-2">
        <User class="w-4 h-4" />
        <span>{project.engineer}</span>
      </div>
      <div class="flex items-center gap-2">
        <Calendar class="w-4 h-4" />
        <span>{project.startDate} — {project.endDate}</span>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
    <span class="text-xs text-slate-500">Última actualización: {project.lastUpdate}</span>
    <a class="text-sm text-primary font-medium hover:underline">
      {project.progress === 100 ? 'Ver documentos →' : 'Ver detalle →'}
    </a>
  </div>
</div>
```

---

## Detalle de Proyecto (Sheet lateral)

Al hacer clic en "Ver detalle" → Sheet lateral derecho (50% ancho).

```
<Sheet side="right" class="w-[50%]">
  <SheetContent>
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-slate-200">
      <div>
        <div class="flex items-center gap-3">
          <span class="font-mono text-sm text-slate-500">{code}</span>
          <Badge variant={statusVariant}>{status}</Badge>
        </div>
        <h3 class="text-lg font-semibold text-slate-900 mt-1">{name}</h3>
      </div>
    </div>

    <!-- Tabs -->
    <Tabs defaultValue="overview" class="mt-4">
      <TabsList class="bg-slate-100">
        <TabsTrigger value="overview">Resumen</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="files">Archivos</TabsTrigger>
      </TabsList>

      <!-- Tab: Resumen -->
      <TabsContent value="overview">
        <div class="space-y-6 mt-4">
          <!-- Info grid -->
          <div class="grid grid-cols-2 gap-4">
            <div class="p-3 bg-slate-50 rounded-lg">
              <p class="text-xs text-slate-500">Ingeniero</p>
              <p class="text-sm font-medium text-slate-900 mt-0.5">{engineer}</p>
            </div>
            <div class="p-3 bg-slate-50 rounded-lg">
              <p class="text-xs text-slate-500">Ubicación</p>
              <p class="text-sm font-medium text-slate-900 mt-0.5">{location}</p>
            </div>
            <div class="p-3 bg-slate-50 rounded-lg">
              <p class="text-xs text-slate-500">Fecha Inicio</p>
              <p class="text-sm font-medium text-slate-900 mt-0.5 font-mono">{startDate}</p>
            </div>
            <div class="p-3 bg-slate-50 rounded-lg">
              <p class="text-xs text-slate-500">Fecha Entrega</p>
              <p class="text-sm font-medium text-slate-900 mt-0.5 font-mono">{endDate}</p>
            </div>
          </div>

          <!-- Progress -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-slate-500">Progreso General</span>
              <span class="text-sm font-semibold text-slate-900">{progress}%</span>
            </div>
            <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div class="h-full bg-primary rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <!-- Próximos hitos -->
          <div>
            <h4 class="text-sm font-semibold text-slate-900 mb-3">Próximos Hitos</h4>
            <div class="space-y-2">
              {milestones.map(milestone => (
                <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div class={`w-2 h-2 rounded-full ${milestone.done ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <div class="flex-1">
                    <p class="text-sm text-slate-700">{milestone.title}</p>
                    <p class="text-xs text-slate-400">{milestone.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </TabsContent>

      <!-- Tab: Timeline -->
      <TabsContent value="timeline">
        <div class="mt-4">
          <ActivityTimeline events={projectEvents} />
        </div>
      </TabsContent>

      <!-- Tab: Archivos -->
      <TabsContent value="files">
        <div class="mt-4 space-y-2">
          {files.map(file => (
            <div class="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <FileIcon type={file.type} class="w-5 h-5 text-slate-400" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                <p class="text-xs text-slate-400">{file.size} · {file.date}</p>
              </div>
              <Button variant="ghost" size="icon-sm">
                <Download class="w-4 h-4 text-slate-400" />
              </Button>
            </div>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  </SheetContent>
</Sheet>
```

---

## Filtros

```
<div class="flex items-center gap-3 mb-6">
  <div class="flex items-center rounded-lg border border-slate-200 bg-white">
    <button class="px-3 py-1.5 text-sm font-medium text-slate-900 bg-slate-100 rounded-l-lg">
      Todos
    </button>
    <button class="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
      En Curso
    </button>
    <button class="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 rounded-r-lg">
      Completados
    </button>
  </div>
</div>
```

---

## Estados

### Sin proyectos

```
<div class="flex flex-col items-center justify-center py-20 text-center">
  <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
    <FolderKanban class="w-8 h-8 text-slate-400" />
  </div>
  <h3 class="text-lg font-semibold text-slate-900">No tienes proyectos aún</h3>
  <p class="text-sm text-slate-500 mt-2 max-w-sm">
    Cuando tengas un proyecto en curso, podrás seguir su avance desde aquí.
  </p>
</div>
```

### Sin archivos

```
<div class="flex flex-col items-center justify-center py-12 text-center">
  <Files class="w-8 h-8 text-slate-300 mb-3" />
  <p class="text-sm text-slate-500">Aún no hay documentos disponibles</p>
</div>
```
