# CRM — Gestión Comercial

## Filosofía

El CRM NO es una agenda. NO es una tabla. NO es un Excel bonito.

El CRM es un sistema para mover prospectos hasta convertirlos en clientes.

Preguntas que debe responder:
- ¿Qué oportunidades existen?
- ¿Cuál debo atender primero?
- ¿Qué comercial está vendiendo más?
- ¿Qué negocios están detenidos?
- ¿Qué acciones debo hacer hoy?

---

## Sub-módulos

```
CRM
├── Leads
├── Clientes
├── Empresas
├── Contactos
├── Pipeline (Kanban)
└── Oportunidades
```

---

## LEADS — Administración de Prospectos

### Layout

```
HEADER (título + acciones: Crear, Importar, Exportar)
↓
KPI ROW (6 cards)
↓
TOOLBAR (Buscar + Filtros: Estado, Origen, Responsable, Industria, Score)
↓
TABLA + PANEL LATERAL (70/30)
```

### KPIs

| KPI | Icono |
|---|---|
| Leads Nuevos (hoy) | UserPlus |
| Leads Calientes (score > 60) | Flame |
| Sin Contactar | Clock |
| Convertidos (mes) | UserCheck |
| Perdidos | UserX |
| Tasa Conversión | TrendingUp |

### Tabla de Leads

| Columna | Alineación | Tipo |
|---|---|---|
| Código | Izquierda | font-mono |
| Empresa | Izquierda | Texto |
| Contacto | Izquierda | Texto + Avatar |
| Cargo | Izquierda | Texto |
| Ciudad | Centro | Texto |
| Origen | Centro | Badge |
| Estado | Centro | Badge semántico |
| Score | Derecha | font-mono + barra progreso |
| Riesgo | Centro | Badge (Alto/Medio/Bajo) |
| Comercial | Izquierda | Avatar + nombre |
| Última actividad | Centro | Fecha relativa |
| Acciones | Derecha | Icon buttons |

### Acciones rápidas (por fila)

| Acción | Icono |
|---|---|
| Llamar | Phone |
| WhatsApp | MessageCircle |
| Correo | Mail |
| Programar | Calendar |
| Editar | Pencil |
| Convertir | ArrowRight |

### Panel Lateral (Drill-down)

Al hacer clic en un lead → Sheet lateral derecho con tabs:

| Tab | Contenido |
|---|---|
| Resumen | Info general, empresa, contacto, score, riesgo |
| Timeline | Historial de interacciones (llamadas, correos, visitas) |
| Notas | Notas del comercial |
| Archivos | Documentos adjuntos |
| Actividades | Tareas programadas |
| Cotizaciones | Cotizaciones relacionadas |
| Requerimientos | Requerimientos asociados |
| Historial | Auditoría completa |

---

## CLIENTES — Empresas Activas

### KPIs

| KPI | Icono |
|---|---|
| Clientes Activos | Users |
| Clientes Inactivos | UserX |
| Facturación (mes) | DollarSign |
| Contratos Activos | FileCheck |
| Proyectos en Curso | FolderKanban |
| Servicios Activos | Wrench |

### Tabla de Clientes

| Columna | Alineación | Tipo |
|---|---|---|
| Código | Izquierda | font-mono |
| Empresa | Izquierda | Texto + logo |
| NIT | Izquierda | font-mono |
| Ciudad | Centro | Texto |
| Sector | Centro | Badge |
| Responsable | Izquierda | Avatar + nombre |
| Facturación | Derecha | font-mono + moneda |
| Última compra | Centro | Fecha |
| Estado | Centro | Badge |
| Acciones | Derecha | Icon buttons |

### Panel Lateral (Drill-down)

Tabs: Información, Contactos, Cotizaciones, Facturas, Pagos, Proyectos, Requerimientos, Equipos Instalados, Documentos, Historial.

---

## PIPELINE — Vista Kanban de Ventas

### Layout

```
HEADER (título + acciones: Nueva Oportunidad, Filtros)
↓
KPI ROW (4 cards: Pipeline total, En negociación, Ganados, Perdidos)
↓
KANBAN BOARD
```

### Kanban Board

```
<div class="flex gap-4 overflow-x-auto pb-4">
  {stages.map(stage => (
    <div class="min-w-[300px] max-w-[350px] flex-shrink-0">
      <!-- Stage header -->
      <div class="flex items-center justify-between mb-3 px-2">
        <div class="flex items-center gap-2">
          <span class="w-3 h-3 rounded-full bg-{stage.color}" />
          <h3 class="text-sm font-semibold text-zinc-100">{stage.name}</h3>
          <span class="font-mono text-xs text-zinc-500">{stage.count}</span>
        </div>
        <span class="font-mono text-xs text-zinc-400">{stage.totalValue}</span>
      </div>

      <!-- Cards -->
      <div class="space-y-2">
        {stage.opportunities.map(opp => (
          <PipelineCard opportunity={opp} />
        ))}
      </div>
    </div>
  ))}
</div>
```

### Pipeline Card

```
<div class="rounded-lg border border-zinc-800/60 bg-zinc-900/40 p-3 cursor-grab hover:border-zinc-700 hover:shadow-md transition-all">
  <div class="flex items-center justify-between mb-2">
    <span class="text-sm font-medium text-zinc-100">{opp.company}</span>
    <Badge variant={opp.riskVariant}>{opp.risk}</Badge>
  </div>
  <p class="font-mono text-sm text-zinc-300 mb-2">{opp.value}</p>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-1.5">
      <Avatar size="xs" name={opp.owner} />
      <span class="text-xs text-zinc-500">{opp.owner}</span>
    </div>
    <span class="text-xs text-zinc-500">{opp.lastActivity}</span>
  </div>
  <!-- Probability bar -->
  <div class="mt-2 h-1 rounded-full bg-zinc-800">
    <div class="h-full rounded-full bg-primary" style={{ width: `${opp.probability}%` }} />
  </div>
</div>
```

### Etapas del Pipeline

| Etapa | Color | Probabilidad |
|---|---|---|
| Nuevo | `bg-zinc-500` | 10% |
| Contactado | `bg-blue-500` | 20% |
| Diagnóstico | `bg-cyan-500` | 40% |
| Cotización | `bg-amber-500` | 60% |
| Negociación | `bg-orange-500` | 80% |
| Ganado | `bg-green-500` | 100% |
| Perdido | `bg-red-500` | 0% |

### Reglas

- Drag & Drop para mover entre etapas.
- Al mover: actualizar pipeline, dashboard, KPIs, actividad, auditoría.
- Sin refrescar página.
- Color solo por semántica, nunca por estética.

---

## OPORTUNIDADES — Ventas Posibles

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Código | Izquierda | font-mono |
| Empresa | Izquierda | Texto |
| Monto | Derecha | font-mono + moneda |
| Probabilidad | Derecha | font-mono + % |
| Fase | Centro | Badge |
| Responsable | Izquierda | Avatar |
| Fecha Cierre | Centro | Fecha |
| Prioridad | Centro | Badge (Alta/Media/Baja) |
| Estado | Centro | Badge |
| Acciones | Derecha | Icon buttons |

### Detalle (Sheet)

Tabs: Información, Productos, Cotización, Archivos, Notas, Timeline, Correos, Llamadas, Actividades, Tareas.

---

## Timeline de Oportunidad

```
09:00  ●  Correo enviado              Juan P.  IP: 192.168.1.1
       │  "Propuesta técnica COT-0042"
       │
10:15  ●  Cliente respondió            María G.
       │  "Interesados en avanzar"
       │
11:00  ●  Se creó cotización           Juan P.
       │  COT-0042 → $45.000.000
       │
14:30  ●  Llamada realizada            Juan P.
       │  Duración: 15 min
       │
16:00  ●  Visita agendada              Sistema
          Fecha: 2024-01-15
```

Cada evento muestra: hora (font-mono), acción, responsable, IP, comentario.

---

## Estados vacíos

Nunca tablas vacías. Siempre:

```
<div class="flex flex-col items-center justify-center py-16 text-center">
  <div class="w-16 h-16 rounded-2xl bg-zinc-800/40 flex items-center justify-center mb-4">
    <Users class="w-8 h-8 text-zinc-500" />
  </div>
  <h3 class="text-lg font-semibold text-zinc-100">No existen leads</h3>
  <p class="text-sm text-zinc-400 mt-2 max-w-sm">
    Comienza a captar prospectos para tu pipeline comercial.
  </p>
  <Button class="mt-6">
    <Plus class="w-4 h-4 mr-2" />
    Crear primer lead
  </Button>
</div>
```

---

## Acciones masivas

Seleccionar varios registros → barra superior con acciones:

| Acción | Icono |
|---|---|
| Asignar comercial | UserPlus |
| Cambiar estado | RefreshCw |
| Exportar | Download |
| Eliminar lógico | Trash2 |
| Etiquetar | Tag |
| Enviar correo | Mail |

Nunca abrir pantalla distinta. Todo inline.
