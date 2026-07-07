# PORTAL SOPORTE, DOCUMENTOS Y PERFIL

## Filosofía

El cliente debe poder:
- Abrir tickets de soporte sin llamar
- Ver el estado de sus tickets
- Descargar documentos (planos, manuales, certificados)
- Actualizar su perfil y preferencias
- Gestionar notificaciones

---

## SOPORTE — Tickets

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Soporte                                                              │
│ ¿Necesitas ayuda? Estamos aquí para asistirte                        │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ [+ Nueva Solicitud]                                          │    │
│ └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ TK-0042 · Problema con extractor instalado          Abierto  │    │
│ │                                                              │    │
│ │ Proyecto: OT-0018 · Prioridad: Alta                          │    │
│ │ Última respuesta: Hace 2 horas                               │    │
│ │                                                              │    │
│ │ [Ver conversación →]                                         │    │
│ └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ TK-0038 · Solicitud de mantenimiento preventivo     Resuelto │    │
│ │                                                              │    │
│ │ Proyecto: OT-0012 · Resuelto el 10 Ene 2025                 │    │
│ │                                                              │    │
│ │ [Ver conversación →]                                         │    │
│ └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### Lista de Tickets

```
<div class="space-y-4">
  {tickets.map(ticket => (
    <div class="bg-white border border-slate-200 rounded-xl shadow-card hover:shadow-card-hover transition-all cursor-pointer">
      <div class="p-5">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-3">
            <span class="font-mono text-sm text-slate-500">{ticket.code}</span>
            <Badge variant={ticket.statusVariant}>{ticket.status}</Badge>
          </div>
          <span class="text-xs text-slate-400">{ticket.lastResponse}</span>
        </div>
        <h3 class="text-base font-semibold text-slate-900 mb-2">{ticket.subject}</h3>
        <div class="flex items-center gap-4 text-sm text-slate-500">
          <span>{ticket.project}</span>
          <span class="text-slate-300">·</span>
          <span>Prioridad: {ticket.priority}</span>
        </div>
      </div>
    </div>
  ))}
</div>
```

### Nueva Solicitud (Dialog)

```
<Dialog>
  <DialogContent class="max-w-lg">
    <DialogHeader>
      <DialogTitle>Nueva Solicitud de Soporte</DialogTitle>
      <DialogDescription>
        Describe tu solicitud y te responderemos lo antes posible.
      </DialogDescription>
    </DialogHeader>
    <div class="py-4 space-y-4">
      <div>
        <label class="text-sm font-medium text-slate-700 mb-2 block">Asunto</label>
        <Input placeholder="Describe brevemente tu solicitud" />
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700 mb-2 block">Proyecto relacionado</label>
        <Select>
          <option>OT-0018 · Instalación Extractor Industrial</option>
          <option>OT-0012 · Mantenimiento Preventivo</option>
          <option>Otro / Sin proyecto</option>
        </Select>
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700 mb-2 block">Prioridad</label>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="priority" value="baja" defaultChecked />
            <span class="text-sm text-slate-700">Baja</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="priority" value="media" />
            <span class="text-sm text-slate-700">Media</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="priority" value="alta" />
            <span class="text-sm text-slate-700">Alta</span>
          </label>
        </div>
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700 mb-2 block">Descripción</label>
        <Textarea placeholder="Describe tu solicitud con detalle..." rows={5} />
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700 mb-2 block">Adjuntar archivos</label>
        <FileUpload accept=".jpg,.png,.pdf" maxFiles={3} />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      <Button onClick={onSubmit}>Enviar Solicitud</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Detalle de Ticket (página)

```
<div class="max-w-3xl mx-auto">
  <!-- Back -->
  <a class="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
    <ArrowLeft class="w-4 h-4" />
    Volver a Soporte
  </a>

  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <div>
      <div class="flex items-center gap-3 mb-1">
        <span class="font-mono text-sm text-slate-500">{code}</span>
        <Badge variant={statusVariant}>{status}</Badge>
      </div>
      <h1 class="text-xl font-semibold text-slate-900">{subject}</h1>
    </div>
  </div>

  <!-- Conversación -->
  <div class="space-y-4 mb-8">
    {messages.map(message => (
      <div class={`flex gap-3 ${message.fromClient ? 'flex-row-reverse' : ''}`}>
        <Avatar size="sm" name={message.author} />
        <div class={`flex-1 max-w-[80%] ${message.fromClient ? 'text-right' : ''}`}>
          <div class={`inline-block p-4 rounded-xl ${
            message.fromClient
              ? 'bg-primary text-white'
              : 'bg-white border border-slate-200'
          }`}>
            <p class={`text-sm ${message.fromClient ? 'text-white' : 'text-slate-700'}`}>
              {message.content}
            </p>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <span class="text-xs text-slate-400">{message.author}</span>
            <span class="text-xs text-slate-300">·</span>
            <span class="text-xs text-slate-400">{message.time}</span>
          </div>
        </div>
      </div>
    ))}
  </div>

  <!-- Responder -->
  <div class="bg-white border border-slate-200 rounded-xl p-4">
    <Textarea placeholder="Escribe tu respuesta..." rows={3} />
    <div class="flex items-center justify-between mt-3">
      <FileUpload inline accept=".jpg,.png,.pdf" />
      <Button>Enviar Respuesta</Button>
    </div>
  </div>
</div>
```

---

## DOCUMENTOS

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Documentos                                                           │
│ Planos, manuales, certificados y archivos de tus proyectos           │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ OT-0018 · Instalación Extractor Industrial                   │    │
│ │                                                              │    │
│ │ 📄 Plano As-Built.pdf              2.4 MB  [Descargar]       │    │
│ │ 📄 Manual de Operación.pdf         1.8 MB  [Descargar]       │    │
│ │ 📄 Certificado de Garantía.pdf     0.5 MB  [Descargar]       │    │
│ │ 📄 Fotos Instalación.zip          15.2 MB  [Descargar]       │    │
│ └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ OT-0012 · Mantenimiento Preventivo                           │    │
│ │                                                              │    │
│ │ 📄 Informe Mantenimiento.pdf       3.1 MB  [Descargar]       │    │
│ │ 📄 Certificado Balanceo.pdf        0.8 MB  [Descargar]       │    │
│ └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### Document List

```
<div class="space-y-6">
  {documentsByProject.map(project => (
    <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
        <div class="flex items-center gap-3">
          <span class="font-mono text-sm text-slate-500">{project.code}</span>
          <span class="text-slate-300">·</span>
          <span class="text-sm font-medium text-slate-900">{project.name}</span>
        </div>
      </div>
      <div class="divide-y divide-slate-100">
        {project.files.map(file => (
          <div class="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
            <FileIcon type={file.type} class="w-5 h-5 text-slate-400 shrink-0" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-700 truncate">{file.name}</p>
            </div>
            <span class="text-xs text-slate-400 font-mono">{file.size}</span>
            <Button variant="ghost" size="icon-sm">
              <Download class="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  ))}
</div>
```

---

## MI PERFIL

### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Mi Perfil                                                            │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ Información Personal                                         │    │
│ │                                                              │    │
│ │ Nombre: Juan Pérez                                           │    │
│ │ Correo: juan.perez@nutresa.com                               │    │
│ │ Teléfono: +57 310 234 5678                                   │    │
│ │ Cargo: Gerente de Planta                                     │    │
│ │                                                              │    │
│ │ [Editar]                                                     │    │
│ └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ Empresa                                                      │    │
│ │                                                              │    │
│ │ Empresa: Nutresa S.A.                                        │    │
│ │ NIT: 800.123.456-7                                           │    │
│ │ Dirección: Calle 123 #45-67, Bogotá                          │    │
│ │                                                              │    │
│ │ [Editar]                                                     │    │
│ └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ Seguridad                                                    │    │
│ │                                                              │    │
│ │ Contraseña: ••••••••                                         │    │
│ │                                                              │    │
│ │ [Cambiar Contraseña]                                         │    │
│ └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ Notificaciones                                               │    │
│ │                                                              │    │
│ │ ☑ Nuevas cotizaciones                                        │    │
│ │ ☑ Actualizaciones de proyectos                               │    │
│ │ ☑ Facturas emitidas                                          │    │
│ │ ☐ Mensajes de soporte                                        │    │
│ │                                                              │    │
│ │ [Guardar Preferencias]                                       │    │
│ └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### Profile Sections

```
<div class="max-w-2xl space-y-6">
  <!-- Información Personal -->
  <div class="bg-white border border-slate-200 rounded-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-slate-900">Información Personal</h3>
      <Button variant="ghost" size="sm">Editar</Button>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <ProfileField label="Nombre" value={user.name} />
      <ProfileField label="Correo" value={user.email} />
      <ProfileField label="Teléfono" value={user.phone} />
      <ProfileField label="Cargo" value={user.role} />
    </div>
  </div>

  <!-- Empresa -->
  <div class="bg-white border border-slate-200 rounded-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-slate-900">Empresa</h3>
      <Button variant="ghost" size="sm">Editar</Button>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <ProfileField label="Empresa" value={company.name} />
      <ProfileField label="NIT" value={company.nit} mono />
      <ProfileField label="Dirección" value={company.address} full />
    </div>
  </div>

  <!-- Seguridad -->
  <div class="bg-white border border-slate-200 rounded-xl p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-slate-900">Seguridad</h3>
    </div>
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-slate-700">Contraseña</p>
          <p class="text-xs text-slate-400">Último cambio: hace 30 días</p>
        </div>
        <Button variant="outline" size="sm">Cambiar</Button>
      </div>
    </div>
  </div>

  <!-- Notificaciones -->
  <div class="bg-white border border-slate-200 rounded-xl p-6">
    <h3 class="text-sm font-semibold text-slate-900 mb-4">Notificaciones</h3>
    <div class="space-y-3">
      <NotificationToggle label="Nuevas cotizaciones" checked={true} />
      <NotificationToggle label="Actualizaciones de proyectos" checked={true} />
      <NotificationToggle label="Facturas emitidas" checked={true} />
      <NotificationToggle label="Mensajes de soporte" checked={false} />
    </div>
    <Button class="mt-4" size="sm">Guardar Preferencias</Button>
  </div>
</div>
```

---

## Estados

### Sin tickets

```
<div class="flex flex-col items-center justify-center py-20 text-center">
  <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
    <MessageSquare class="w-8 h-8 text-slate-400" />
  </div>
  <h3 class="text-lg font-semibold text-slate-900">No tienes tickets abiertos</h3>
  <p class="text-sm text-slate-500 mt-2 max-w-sm">
    Si necesitas ayuda, abre una solicitud y te responderemos pronto.
  </p>
  <Button class="mt-6">Nueva Solicitud</Button>
</div>
```

### Sin documentos

```
<div class="flex flex-col items-center justify-center py-20 text-center">
  <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
    <Files class="w-8 h-8 text-slate-400" />
  </div>
  <h3 class="text-lg font-semibold text-slate-900">No hay documentos disponibles</h3>
  <p class="text-sm text-slate-500 mt-2 max-w-sm">
    Los planos, manuales y certificados de tus proyectos aparecerán aquí.
  </p>
</div>
```
