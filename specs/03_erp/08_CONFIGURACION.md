# CONFIGURACIÓN — Centro de Administración del Tenant

## Filosofía

Configuración NO es una página con formularios. Es el **Centro de Administración completo** del Tenant.

Desde aquí el administrador personaliza completamente el ERP sin tocar código. Toda modificación se refleja inmediatamente en toda la plataforma.

Equivalente a: Microsoft Admin Center, Salesforce Setup, Google Workspace Admin, AWS Console, Stripe Dashboard.

---

## Sub-módulos

```
Configuración
├── Empresa (datos fiscales, logos)
├── White Label (colores, logos, favicons, temas)
├── Usuarios
├── Roles
├── Permisos (matriz)
├── Notificaciones (email, push, SMS, WhatsApp)
├── Correos (SMTP, proveedores)
├── WhatsApp (Meta, Twilio)
├── SMS (Twilio, MessageBird)
├── Telefonía (Twilio, Asterisk)
├── API Keys
├── Integraciones
├── Storage (buckets)
├── Seguridad (MFA, sesiones, políticas)
├── Backups
├── Auditoría
├── Licencia
└── Tenant (info técnica)
```

---

## Layout

```
HEADER (empresa + plan + estado + licencia + botones: Guardar, Publicar, Restaurar)
↓
SIDEBAR CONFIGURACIÓN (navegación interna)
↓
ÁREA PRINCIPAL (formulario + panel derecho)
```

### Sidebar Configuración

```
<div class="w-56 border-r border-zinc-800/40 bg-zinc-900/40 p-3 space-y-1 overflow-y-auto">
  <p class="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">General</p>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <Building class="w-4 h-4" /> Empresa
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <Palette class="w-4 h-4" /> White Label
  </a>

  <p class="px-3 mt-4 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Acceso</p>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <Users class="w-4 h-4" /> Usuarios
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <Shield class="w-4 h-4" /> Roles
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <Lock class="w-4 h-4" /> Permisos
  </a>

  <p class="px-3 mt-4 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Comunicaciones</p>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <Bell class="w-4 h-4" /> Notificaciones
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <Mail class="w-4 h-4" /> Correos
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <MessageCircle class="w-4 h-4" /> WhatsApp
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <MessageSquare class="w-4 h-4" /> SMS
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <Phone class="w-4 h-4" /> Telefonía
  </a>

  <p class="px-3 mt-4 mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">Sistema</p>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <Key class="w-4 h-4" /> API Keys
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <Plug class="w-4 h-4" /> Integraciones
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <HardDrive class="w-4 h-4" /> Storage
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <ShieldCheck class="w-4 h-4" /> Seguridad
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <Database class="w-4 h-4" /> Backups
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <FileSearch class="w-4 h-4" /> Auditoría
  </a>
  <a class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/40">
    <CreditCard class="w-4 h-4" /> Licencia
  </a>
</div>
```

---

## Empresa

### Formulario

```
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <!-- Datos fiscales -->
  <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6 space-y-4">
    <h3 class="text-sm font-semibold text-zinc-100">Datos Fiscales</h3>
    <Input label="Razón Social" />
    <Input label="Nombre Comercial" />
    <Input label="NIT" class="font-mono" />
    <Input label="Dirección" />
    <div class="grid grid-cols-2 gap-4">
      <Input label="Ciudad" />
      <Input label="País" />
    </div>
    <Input label="Teléfono" />
    <Input label="Correo" type="email" />
    <Input label="Sitio Web" />
    <Select label="Zona Horaria" />
    <Select label="Moneda" />
  </div>

  <!-- Logos -->
  <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6 space-y-4">
    <h3 class="text-sm font-semibold text-zinc-100">Identidad Visual</h3>
    <ImageUpload label="Logo Principal" preview />
    <ImageUpload label="Logo Fondo Oscuro" preview />
    <ImageUpload label="Logo Fondo Claro" preview />
    <ImageUpload label="Logo Impresión" preview />
    <ImageUpload label="Favicon" preview />
    <ImageUpload label="Default Avatar" preview />
  </div>
</div>
```

---

## White Label

### Secciones

#### Colores

```
<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
  <ColorPicker label="Primario" value={primary} />
  <ColorPicker label="Secundario" value={secondary} />
  <ColorPicker label="Terciario" value={tertiary} />
  <ColorPicker label="Éxito" value={success} />
  <ColorPicker label="Advertencia" value={warning} />
  <ColorPicker label="Error" value={danger} />
  <ColorPicker label="Información" value={info} />
  <ColorPicker label="Sidebar" value={sidebar} />
  <ColorPicker label="Header" value={header} />
  <ColorPicker label="Botones" value={buttons} />
  <ColorPicker label="Links" value={links} />
  <ColorPicker label="Fondos" value={backgrounds} />
</div>
```

#### Vista Previa

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6">
  <h3 class="text-sm font-semibold text-zinc-100 mb-4">Vista Previa</h3>
  <div class="flex items-center gap-4 mb-4">
    <Button variant="ghost" size="icon-sm"><Monitor class="w-4 h-4" /></Button>
    <Button variant="ghost" size="icon-sm"><Tablet class="w-4 h-4" /></Button>
    <Button variant="ghost" size="icon-sm"><Smartphone class="w-4 h-4" /></Button>
  </div>
  <div class="rounded-lg border border-zinc-800/40 overflow-hidden">
    <MiniPreview theme={currentTheme} device={selectedDevice} />
  </div>
</div>
```

### Reglas

- Nunca modificar CSS manualmente. Todo mediante variables.
- Vista previa inmediata al cambiar colores.
- Fallback seguro si no se definen colores.

---

## Usuarios

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Avatar | Izquierda | Thumbnail 32x32 |
| Nombre | Izquierda | Texto |
| Correo | Izquierda | Texto |
| Rol | Centro | Badge |
| Estado | Centro | Badge (Activo/Inactivo/Bloqueado) |
| Último Acceso | Centro | Fecha |
| Sucursal | Centro | Texto |
| MFA | Centro | Badge (Activo/Inactivo) |
| Acciones | Derecha | Dropdown (Editar, Bloquear, Reset Password, Cerrar Sesiones) |

---

## Roles

### Lista de Roles

| Rol | Usuarios | Permisos | Tipo |
|---|---|---|---|
| ADMIN | 2 | Todos | Sistema |
| GERENTE | 1 | Lectura + KPIs | Sistema |
| DIRECTOR_COMERCIAL | 1 | CRM + Cotizaciones | Sistema |
| EJECUTIVO_COMERCIAL | 5 | CRM limitado | Sistema |
| INGENIERO_PROYECTOS | 3 | Requerimientos + OT | Sistema |
| TECNICO_CAMPO | 8 | OT + Checklist | Sistema |
| JEFE_INVENTARIO | 1 | Inventario completo | Sistema |
| FINANZAS | 1 | Facturación + Pagos | Sistema |
| CLIENTE | 50 | Portal | Sistema |
| Personalizado | 3 | Custom | Custom |

### Editor de Rol

Tabs: Información, Permisos (matriz), Restricciones, Herencia.

---

## Permisos (Matriz)

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden">
  <table class="w-full">
    <thead class="bg-zinc-900/60">
      <tr>
        <th class="text-left text-xs font-medium text-zinc-400 px-3 py-2">Módulo</th>
        <th class="text-center text-xs font-medium text-zinc-400 px-3 py-2">Crear</th>
        <th class="text-center text-xs font-medium text-zinc-400 px-3 py-2">Leer</th>
        <th class="text-center text-xs font-medium text-zinc-400 px-3 py-2">Editar</th>
        <th class="text-center text-xs font-medium text-zinc-400 px-3 py-2">Eliminar</th>
        <th class="text-center text-xs font-medium text-zinc-400 px-3 py-2">Exportar</th>
        <th class="text-center text-xs font-medium text-zinc-400 px-3 py-2">Aprobar</th>
      </tr>
    </thead>
    <tbody>
      {modules.map(module => (
        <tr class="border-t border-zinc-800/40">
          <td class="px-3 py-2 text-sm text-zinc-300">{module.name}</td>
          <td class="px-3 py-2 text-center"><Checkbox checked={module.create} /></td>
          <td class="px-3 py-2 text-center"><Checkbox checked={module.read} /></td>
          <td class="px-3 py-2 text-center"><Checkbox checked={module.edit} /></td>
          <td class="px-3 py-2 text-center"><Checkbox checked={module.delete} /></td>
          <td class="px-3 py-2 text-center"><Checkbox checked={module.export} /></td>
          <td class="px-3 py-2 text-center"><Checkbox checked={module.approve} /></td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## Integraciones

### Cards de Integración

```
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {integrations.map(integration => (
    <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-3">
          <img src={integration.logo} class="h-8" />
          <div>
            <p class="text-sm font-semibold text-zinc-100">{integration.name}</p>
            <p class="text-xs text-zinc-500">{integration.category}</p>
          </div>
        </div>
        <Badge variant={integration.connected ? 'success' : 'neutral'}>
          {integration.connected ? 'Conectado' : 'Desconectado'}
        </Badge>
      </div>
      {integration.connected && (
        <div class="text-xs text-zinc-500 mb-3">
          Última sync: {integration.lastSync}
        </div>
      )}
      <Button variant="outline" size="sm" class="w-full">
        {integration.connected ? 'Configurar' : 'Conectar'}
      </Button>
    </div>
  ))}
</div>
```

### Integraciones disponibles

| Integración | Categoría |
|---|---|
| Supabase | Base de datos |
| Google Workspace | Productividad |
| Microsoft 365 | Productividad |
| Wompi | Pagos |
| DIAN | Facturación electrónica |
| Power BI | Analytics |
| Slack | Notificaciones |
| Zapier | Automatización |
| Webhook | Custom |

---

## Seguridad

### Secciones

| Sección | Contenido |
|---|---|
| MFA | Activar/desactivar, método (TOTP, SMS, Email) |
| Sesiones | Duración, límite concurrente, cierre forzado |
| Políticas | Longitud mínima, complejidad, expiración |
| IPs | Whitelist, blacklist |
| Dispositivos | Lista de dispositivos autorizados |
| Logs | Intentos fallidos, bloqueos, ubicaciones |

---

## Auditoría

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Fecha/Hora | Centro | font-mono |
| Usuario | Izquierda | Avatar + nombre |
| Acción | Centro | Badge (Crear/Editar/Eliminar/Login/Logout) |
| Módulo | Centro | Texto |
| Entidad | Izquierda | Texto |
| IP | Izquierda | font-mono |
| Dispositivo | Izquierda | Texto |
| Detalle | Izquierda | Expandible (diff JSONB) |

### Filtros

Fecha, Usuario, Entidad, Módulo, IP, Acción.

### Reglas

- Nunca permitir editar auditoría.
- Nunca eliminar auditoría.
- Exportar: PDF, Excel, JSON.

---

## Panel Derecho (Sticky)

| Sección | Contenido |
|---|---|
| Cambios Pendientes | Configuraciones sin publicar |
| Estado Servicios | API, SMTP, WhatsApp, SMS |
| Alertas | Licencia próxima a vencer, storage lleno |
| Últimos Cambios | Timeline de configuraciones recientes |

---

## Reglas absolutas

1. Nunca hardcodear ningún dato.
2. Nunca guardar logos en el código.
3. Nunca guardar colores en Tailwind.
4. Nunca guardar API Keys en el frontend.
5. Nunca permitir editar auditorías.
6. Nunca mostrar secretos completos.
7. Nunca reiniciar servicios sin confirmación.
8. Nunca perder historial de configuración.
9. Toda configuración es multi-tenant.
10. Todo cambio queda auditado.
11. Todo cambio tiene versión.
12. Todo cambio puede revertirse.
13. Toda modificación del White Label se refleja inmediatamente sin recompilar.
