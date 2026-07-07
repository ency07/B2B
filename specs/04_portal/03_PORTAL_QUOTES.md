# PORTAL COTIZACIONES — Revisión y Aprobación

## Filosofía

El cliente recibe una cotización y debe poder:
- Verla completa (no un PDF críptico)
- Entender cada item
- Comparar versiones
- Aprobar o rechazar con un clic
- Descargar el PDF oficial

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Cotizaciones                                                         │
│ Propuestas comerciales enviadas para tu revisión                     │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ COT-0042 · Sistema de Extracción Planta Bogotá    Pendiente │    │
│ │                                                              │    │
│ │ $125.000.000 COP · Válida hasta 15 Feb 2025                 │    │
│ │                                                              │    │
│ │ [Revisar] [Descargar PDF]                                    │    │
│ └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ COT-0038 · Mantenimiento Extractores                 Aceptada│    │
│ │                                                              │    │
│ │ $45.000.000 COP · Aceptada el 10 Ene 2025                   │    │
│ │                                                              │    │
│ │ [Ver detalle] [Descargar PDF]                                │    │
│ └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Lista de Cotizaciones

```
<div class="space-y-4">
  {quotes.map(quote => (
    <QuoteCard quote={quote} />
  ))}
</div>
```

### Quote Card

```
<div class="bg-white border border-slate-200 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200">
  <div class="p-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-3">
        <span class="font-mono text-sm text-slate-500">{quote.code}</span>
        <span class="text-slate-300">·</span>
        <h3 class="text-lg font-semibold text-slate-900">{quote.title}</h3>
      </div>
      <Badge variant={quote.statusVariant}>{quote.status}</Badge>
    </div>

    <!-- Meta -->
    <div class="flex items-center gap-4 text-sm text-slate-500 mb-4">
      <span class="font-mono font-semibold text-slate-900">{quote.total}</span>
      <span class="text-slate-300">·</span>
      <span>Válida hasta {quote.validUntil}</span>
      {quote.version > 1 && (
        <>
          <span class="text-slate-300">·</span>
          <span class="text-xs bg-slate-100 px-2 py-0.5 rounded">v{quote.version}</span>
        </>
      )}
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3">
      {quote.status === 'PENDIENTE' && (
        <>
          <Button size="sm">Revisar y responder</Button>
          <Button size="sm" variant="outline">Descargar PDF</Button>
        </>
      )}
      {quote.status === 'ACEPTADA' && (
        <>
          <Button size="sm" variant="outline">Ver detalle</Button>
          <Button size="sm" variant="outline">Descargar PDF</Button>
        </>
      )}
      {quote.status === 'RECHAZADA' && (
        <Button size="sm" variant="outline">Ver detalle</Button>
      )}
    </div>
  </div>
</div>
```

---

## Detalle de Cotización (página completa)

Al hacer clic en "Revisar" → Navega a página completa.

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Volver a Cotizaciones                                              │
│                                                                      │
│ COT-0042                                                  Pendiente  │
│ Sistema de Extracción Planta Bogotá                                  │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Información General                                            │  │
│ │                                                                │  │
│ │ Cliente: Nutresa S.A.              Fecha: 15 Ene 2025          │  │
│ │ Proyecto: Extractor Industrial     Validez: 30 días            │  │
│ │ Ingeniero: Carlos Méndez           Versión: 2                  │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Items                                                          │  │
│ │                                                                │  │
│ │ 1  Extractor Axial AX-HD-48         2 un   $45.000.000        │  │
│ │ 2  Ducto Galvanizado Ø48"          12 m    $3.600.000        │  │
│ │ 3  Damper Motorizado                 2 un    $4.800.000        │  │
│ │ 4  Instalación y puesta en marcha    1 gl   $12.000.000        │  │
│ │                                                                │  │
│ │                                          Subtotal  $65.400.000 │  │
│ │                                              IVA    $12.426.000│  │
│ │                                             Total  $125.000.000│  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Condiciones Comerciales                                        │  │
│ │                                                                │  │
│ │ • Forma de pago: 50% anticipo, 50% contra entrega             │  │
│ │ • Tiempo de entrega: 30 días calendario                        │  │
│ │ • Garantía: 12 meses                                           │  │
│ │ • Validez: 30 días                                             │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │ Historial de Versiones                                         │  │
│ │                                                                │  │
│ │ v2  15 Ene 2025  Cambios en cantidad de ductos        Actual  │  │
│ │ v1  10 Ene 2025  Versión inicial                               │  │
│ └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│ ┌────────────────────────────────────────────────────────────────┐  │
│ │                                                                │  │
│ │    [Rechazar]                              [Aceptar Cotización]│  │
│ │                                                                │  │
│ └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

### Estructura del código

```
<div class="max-w-4xl mx-auto">
  <!-- Back link -->
  <a class="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
    <ArrowLeft class="w-4 h-4" />
    Volver a Cotizaciones
  </a>

  <!-- Header -->
  <div class="flex items-center justify-between mb-8">
    <div>
      <div class="flex items-center gap-3 mb-1">
        <span class="font-mono text-sm text-slate-500">{code}</span>
        <Badge variant={statusVariant}>{status}</Badge>
      </div>
      <h1 class="text-2xl font-semibold text-slate-900">{title}</h1>
    </div>
  </div>

  <!-- Info Card -->
  <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6">
    <h3 class="text-sm font-semibold text-slate-900 mb-4">Información General</h3>
    <div class="grid grid-cols-2 gap-4">
      <InfoRow label="Cliente" value={client} />
      <InfoRow label="Fecha" value={date} mono />
      <InfoRow label="Proyecto" value={project} />
      <InfoRow label="Validez" value={validity} />
      <InfoRow label="Ingeniero" value={engineer} />
      <InfoRow label="Versión" value={`v${version}`} mono />
    </div>
  </div>

  <!-- Items Table -->
  <div class="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
    <div class="px-6 py-4 border-b border-slate-100">
      <h3 class="text-sm font-semibold text-slate-900">Items</h3>
    </div>
    <table class="w-full">
      <thead>
        <tr class="border-b border-slate-100 bg-slate-50/50">
          <th class="text-left text-xs font-medium text-slate-500 px-4 py-3">Concepto</th>
          <th class="text-right text-xs font-medium text-slate-500 px-4 py-3">Cant.</th>
          <th class="text-right text-xs font-medium text-slate-500 px-4 py-3">Valor</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {items.map(item => (
          <tr>
            <td class="px-4 py-3.5 text-sm text-slate-700">{item.description}</td>
            <td class="px-4 py-3.5 text-sm text-slate-500 text-right">{item.quantity}</td>
            <td class="px-4 py-3.5 text-sm font-mono text-slate-900 text-right">{item.value}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr class="border-t border-slate-200 bg-slate-50/50">
          <td colspan="2" class="px-4 py-3 text-sm text-slate-500 text-right">Subtotal</td>
          <td class="px-4 py-3 text-sm font-mono text-slate-700 text-right">{subtotal}</td>
        </tr>
        <tr class="border-t border-slate-100">
          <td colspan="2" class="px-4 py-3 text-sm text-slate-500 text-right">IVA ({ivaRate}%)</td>
          <td class="px-4 py-3 text-sm font-mono text-slate-700 text-right">{iva}</td>
        </tr>
        <tr class="border-t-2 border-slate-200 bg-slate-50">
          <td colspan="2" class="px-4 py-4 text-sm font-semibold text-slate-900 text-right">Total</td>
          <td class="px-4 py-4 text-lg font-mono font-semibold text-slate-900 text-right">{total}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  <!-- Conditions -->
  <div class="bg-white border border-slate-200 rounded-xl p-6 mb-6">
    <h3 class="text-sm font-semibold text-slate-900 mb-4">Condiciones Comerciales</h3>
    <ul class="space-y-2">
      {conditions.map(condition => (
        <li class="flex items-start gap-2 text-sm text-slate-600">
          <span class="text-slate-400 mt-0.5">•</span>
          {condition}
        </li>
      ))}
    </ul>
  </div>

  <!-- Version History -->
  <div class="bg-white border border-slate-200 rounded-xl p-6 mb-8">
    <h3 class="text-sm font-semibold text-slate-900 mb-4">Historial de Versiones</h3>
    <div class="space-y-2">
      {versions.map((version, i) => (
        <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
          <span class="text-xs font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
            v{version.number}
          </span>
          <span class="text-xs text-slate-500 font-mono">{version.date}</span>
          <span class="text-sm text-slate-700 flex-1">{version.changes}</span>
          {i === 0 && <span class="text-xs text-primary font-medium">Actual</span>}
        </div>
      ))}
    </div>
  </div>

  <!-- Actions -->
  {status === 'PENDIENTE' && (
    <div class="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-xl">
      <Button variant="outline" onClick={onReject}>
        Rechazar
      </Button>
      <Button onClick={onAccept}>
        <Check class="w-4 h-4 mr-2" />
        Aceptar Cotización
      </Button>
    </div>
  )}
</div>
```

---

## Diálogo de Aceptación

```
<Dialog>
  <DialogContent class="max-w-md">
    <DialogHeader>
      <DialogTitle>Aceptar Cotización</DialogTitle>
      <DialogDescription>
        Al aceptar esta cotización, confirmas tu acuerdo con los términos y condiciones.
        Se generará una orden de trabajo automáticamente.
      </DialogDescription>
    </DialogHeader>
    <div class="py-4">
      <div class="p-4 bg-slate-50 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-slate-500">Total</span>
          <span class="font-mono text-lg font-semibold text-slate-900">{total}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-500">Anticipo requerido</span>
          <span class="font-mono text-sm text-slate-700">{advance}</span>
        </div>
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      <Button onClick={onConfirm}>
        Confirmar Aceptación
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Diálogo de Rechazo

```
<Dialog>
  <DialogContent class="max-w-md">
    <DialogHeader>
      <DialogTitle>Rechazar Cotización</DialogTitle>
      <DialogDescription>
        Cuéntanos el motivo del rechazo. Tu comentario ayudará a mejorar la propuesta.
      </DialogDescription>
    </DialogHeader>
    <div class="py-4 space-y-4">
      <div>
        <label class="text-sm font-medium text-slate-700 mb-2 block">Motivo</label>
        <Select>
          <option>Precio muy alto</option>
          <option>No se ajusta a necesidades</option>
          <option>Tiempo de entrega muy largo</option>
          <option>Condiciones de pago</option>
          <option>Otro</option>
        </Select>
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700 mb-2 block">Comentario (opcional)</label>
        <Textarea placeholder="Cuéntanos más..." rows={3} />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      <Button variant="destructive" onClick={onConfirm}>
        Confirmar Rechazo
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Estados

| Estado | Color | Badge |
|---|---|---|
| PENDIENTE | `bg-amber-50 text-amber-700 border-amber-200` | warning |
| ACEPTADA | `bg-green-50 text-green-700 border-green-200` | success |
| RECHAZADA | `bg-red-50 text-red-700 border-red-200` | danger |
| VENCIDA | `bg-slate-50 text-slate-500 border-slate-200` | neutral |
| CONVERTIDA | `bg-blue-50 text-blue-700 border-blue-200` | info |

---

## Empty State

```
<div class="flex flex-col items-center justify-center py-20 text-center">
  <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
    <FileText class="w-8 h-8 text-slate-400" />
  </div>
  <h3 class="text-lg font-semibold text-slate-900">No tienes cotizaciones</h3>
  <p class="text-sm text-slate-500 mt-2 max-w-sm">
    Cuando un comercial te envíe una propuesta, aparecerá aquí para tu revisión.
  </p>
  <Button class="mt-6" variant="outline">
    Solicitar cotización
  </Button>
</div>
```
