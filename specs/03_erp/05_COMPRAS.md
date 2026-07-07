# COMPRAS Y ABASTECIMIENTO

## Filosofía

Compras NO consiste en emitir Órdenes de Compra. Compras administra el **abastecimiento completo** de la empresa.

Debe responder:
- ¿Qué necesitamos comprar?
- ¿Por qué?
- ¿Quién lo solicitó?
- ¿Quién lo aprobó?
- ¿Quién cotizó?
- ¿Qué proveedor ganó?
- ¿Cuándo llega?
- ¿Qué está retrasado?
- ¿Qué factura falta?
- ¿Qué impacto tiene en producción?

Todo debe estar conectado. Nunca compras aisladas.

---

## Layout

```
HEADER (título + acciones: Nueva Solicitud, Nueva OC, Nueva Cotización)
↓
KPI ROW (8 cards)
↓
FLUJO COMPLETO (tabs: Solicitudes, Cotizaciones, Comparador, OC, Recepción, Facturas)
↓
TABLA + PANEL LATERAL (70/30)
```

---

## KPIs

| KPI | Icono |
|---|---|
| Solicitudes Pendientes | ClipboardList |
| Órdenes Abiertas | ShoppingCart |
| Compras del Mes | DollarSign |
| Valor Comprado | Receipt |
| En Tránsito | Truck |
| Recepciones Hoy | PackageCheck |
| Facturas Pendientes | FileWarning |
| Ahorro Compras | TrendingDown |

---

## Flujo Completo

```
Solicitud → Aprobación → Cotización → Comparativo → Proveedor → Orden Compra → Recepción → Factura → Pago → Inventario
```

Cada paso conectado. Nunca romper el flujo.

---

## Solicitudes de Compra

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Código | Izquierda | font-mono |
| Solicitante | Izquierda | Avatar + nombre |
| Área | Centro | Badge |
| Proyecto | Izquierda | Texto |
| Prioridad | Centro | Badge (Urgente/Alta/Media/Baja) |
| Fecha | Centro | Fecha |
| Estado | Centro | Badge |
| Valor Estimado | Derecha | font-mono + moneda |
| Proveedor Sugerido | Izquierda | Texto |
| Acciones | Derecha | Icon buttons |

### Detalle Solicitud

Tabs: Información General, Justificación, Productos, Cantidades, Urgencia, Proyecto, Responsable, Centro Costos, Observaciones, Adjuntos, Historial.

### Reglas

- Nunca permitir solicitudes sin justificación.
- Toda solicitud vinculada a un proyecto o centro de costos.

---

## Cotizaciones de Proveedores

Cada solicitud puede tener múltiples cotizaciones.

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Proveedor | Izquierda | Texto + logo |
| Valor | Derecha | font-mono + moneda |
| Entrega | Centro | Fecha |
| Garantía | Centro | Texto |
| Condiciones | Izquierda | Texto truncado |
| Moneda | Centro | Badge |
| Observaciones | Izquierda | Texto truncado |
| Estado | Centro | Badge |
| Acciones | Derecha | Icon buttons |

### Acciones

Comparar, Aceptar, Descartar, Solicitar nueva, Enviar correo.

### Reglas

- Nunca limitar a una sola cotización.
- Mínimo 3 cotizaciones para compras > $5M COP.

---

## Comparador de Proveedores

### Layout horizontal

```
<div class="grid grid-cols-3 gap-4">
  {suppliers.map(supplier => (
    <div class={`rounded-xl border ${supplier.winner ? 'border-green-500/40 bg-green-950/10' : 'border-zinc-800/60 bg-zinc-900/40'} p-4`}>
      {supplier.winner && (
        <div class="flex items-center gap-2 mb-3">
          <Award class="w-4 h-4 text-green-400" />
          <span class="text-xs font-semibold text-green-400">RECOMENDADO</span>
        </div>
      )}

      <div class="flex items-center gap-3 mb-4">
        <img src={supplier.logo} class="h-8" />
        <div>
          <p class="text-sm font-semibold text-zinc-100">{supplier.name}</p>
          <p class="text-xs text-zinc-500">{supplier.rating} ★</p>
        </div>
      </div>

      <div class="space-y-2">
        <div class="flex items-center justify-between py-1.5 border-b border-zinc-800/30">
          <span class="text-xs text-zinc-500">Precio</span>
          <span class={`font-mono text-xs ${supplier.bestPrice ? 'text-green-400 font-bold' : 'text-zinc-100'}`}>
            {supplier.price}
          </span>
        </div>
        <div class="flex items-center justify-between py-1.5 border-b border-zinc-800/30">
          <span class="text-xs text-zinc-500">Entrega</span>
          <span class={`font-mono text-xs ${supplier.bestDelivery ? 'text-green-400 font-bold' : 'text-zinc-100'}`}>
            {supplier.delivery}
          </span>
        </div>
        <div class="flex items-center justify-between py-1.5 border-b border-zinc-800/30">
          <span class="text-xs text-zinc-500">Garantía</span>
          <span class="font-mono text-xs text-zinc-100">{supplier.warranty}</span>
        </div>
        <div class="flex items-center justify-between py-1.5 border-b border-zinc-800/30">
          <span class="text-xs text-zinc-500">Calificación</span>
          <span class="font-mono text-xs text-zinc-100">{supplier.score}/100</span>
        </div>
        <div class="flex items-center justify-between py-1.5">
          <span class="text-xs text-zinc-500">Incumplimientos</span>
          <span class={`font-mono text-xs ${supplier.complaints > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {supplier.complaints}
          </span>
        </div>
      </div>

      <div class="mt-4 flex items-center gap-2">
        <Button size="sm" class="flex-1" variant={supplier.winner ? 'default' : 'outline'}>
          Seleccionar
        </Button>
      </div>
    </div>
  ))}
</div>
```

### Reglas

- Colores: Verde = mejor opción, Amarillo = aceptable, Rojo = riesgo.
- Debe existir un ganador recomendado (no decidido manualmente).
- Comparar: Precio, Entrega, Garantía, Experiencia, Calidad, Tiempo, Historial, Incumplimientos, Calificación.

---

## Órdenes de Compra

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| OC | Izquierda | font-mono |
| Proveedor | Izquierda | Texto + logo |
| Proyecto | Izquierda | Texto |
| Estado | Centro | Badge |
| Valor | Derecha | font-mono + moneda |
| Entrega | Centro | Fecha |
| Comprador | Izquierda | Avatar |
| Facturada | Centro | Badge (Sí/No/Parcial) |
| Recepcionada | Centro | Badge (Sí/No/Parcial) |
| Acciones | Derecha | Icon buttons |

### Estados de OC

| Estado | Color | Badge |
|---|---|---|
| Borrador | `bg-zinc-800/50 text-zinc-400` | neutral |
| Enviada | `bg-blue-950/50 text-blue-400` | info |
| Aceptada | `bg-green-950/50 text-green-400` | success |
| Parcial | `bg-amber-950/50 text-amber-400` | warning |
| Recibida | `bg-green-950/50 text-green-400` | success |
| Facturada | `bg-purple-950/50 text-purple-400` | neutral |
| Pagada | `bg-green-950/50 text-green-400` | success |
| Cancelada | `bg-red-950/50 text-red-400` | danger |

### Vista Detalle OC

Tabs: Información, Productos, Cantidades, Precios, Impuestos, Entrega, Condiciones, Observaciones, Historial, Documentos.

### Siempre mostrar

```
Subtotal           $XXX.XXX
Descuentos         - $X.XXX
IVA                  $XX.XXX
Retenciones        - $X.XXX
─────────────────────────
Total              $XXX.XXX
```

---

## Recepción

### Layout

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6">
  <h3 class="text-sm font-semibold text-zinc-100 mb-4">Registrar Recepción</h3>

  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs text-zinc-500 mb-1 block">OC Relacionada</label>
        <Combobox placeholder="Buscar OC..." />
      </div>
      <div>
        <label class="text-xs text-zinc-500 mb-1 block">Tipo de Recepción</label>
        <Select>
          <option>Total</option>
          <option>Parcial</option>
          <option>Rechazo</option>
          <option>Devolución</option>
        </Select>
      </div>
    </div>

    <!-- Productos a recibir -->
    <div class="rounded-lg border border-zinc-800/40 overflow-hidden">
      <table class="w-full">
        <thead class="bg-zinc-900/60">
          <tr>
            <th class="text-left text-xs font-medium text-zinc-400 px-3 py-2">Producto</th>
            <th class="text-right text-xs font-medium text-zinc-400 px-3 py-2">Solicitado</th>
            <th class="text-right text-xs font-medium text-zinc-400 px-3 py-2">Recibido</th>
            <th class="text-center text-xs font-medium text-zinc-400 px-3 py-2">Estado</th>
            <th class="text-left text-xs font-medium text-zinc-400 px-3 py-2">Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr class="border-t border-zinc-800/40">
              <td class="px-3 py-2 text-sm text-zinc-300">{item.product}</td>
              <td class="px-3 py-2 text-sm text-zinc-300 text-right font-mono">{item.requested}</td>
              <td class="px-3 py-2">
                <Input type="number" defaultValue={item.requested} class="w-20 text-right font-mono" />
              </td>
              <td class="px-3 py-2 text-center">
                <Select class="w-28">
                  <option>Aceptado</option>
                  <option>Condicional</option>
                  <option>Rechazado</option>
                </Select>
              </td>
              <td class="px-3 py-2">
                <Input placeholder="Notas..." class="w-full" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <!-- Si hay diferencias -->
    {hasDifferences && (
      <Alert variant="warning">
        <AlertTriangle class="w-4 h-4" />
        <div>
          <h5 class="text-sm font-semibold">Diferencias detectadas</h5>
          <p class="text-sm text-zinc-400 mt-1">
            Se encontraron diferencias entre lo solicitado y lo recibido.
            Se requiere aprobación del supervisor.
          </p>
        </div>
      </Alert>
    )}

    <div class="flex items-center justify-end gap-3">
      <Button variant="outline">Cancelar</Button>
      <Button>Confirmar Recepción</Button>
    </div>
  </div>
</div>
```

### Reglas

- Si hay diferencias: mostrar alerta. Nunca ocultarlas.
- Toda recepción genera movimiento de inventario.
- Nunca recibir sin OC.

---

## Facturas de Proveedores

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Factura | Izquierda | font-mono |
| Proveedor | Izquierda | Texto |
| OC | Izquierda | font-mono (link) |
| Fecha | Centro | Fecha |
| Valor | Derecha | font-mono + moneda |
| Estado | Centro | Badge |
| Vencimiento | Centro | Fecha (rojo si vencida) |
| Pagada | Centro | Badge |
| Acciones | Derecha | Icon buttons |

### Reglas

- Relacionar siempre: Factura → OC → Recepción → Inventario.
- Nunca permitir facturas huérfanas.
- Nunca pagar sin factura válida.

---

## Proveedores

### Vista tipo CRM

#### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Código | Izquierda | font-mono |
| Empresa | Izquierda | Texto + logo |
| NIT | Izquierda | font-mono |
| Ciudad | Centro | Texto |
| Contacto | Izquierda | Texto |
| Categoría | Centro | Badge |
| Estado | Centro | Badge |
| Calificación | Derecha | Stars (1-5) |
| Compras (mes) | Derecha | font-mono + moneda |
| Acciones | Derecha | Icon buttons |

#### Detalle (Sheet)

Tabs: Información, Contactos, Productos, Historial, Compras, Facturas, Pagos, Indicadores.

#### KPIs del Proveedor

| KPI | Descripción |
|---|---|
| Tiempo Entrega | Promedio de días |
| Cumplimiento | % entregas a tiempo |
| Precio Promedio | Tendencia de precios |
| Reclamos | Cantidad de reclamos |
| Garantías | Garantías activas |
| Calificación | Score 1-100 |

---

## Panel Derecho (Alertas)

Sticky. Contiene:

| Sección | Contenido |
|---|---|
| Solicitudes Urgentes | Con countdown de SLA |
| Recepciones Hoy | Lista de recepciones programadas |
| Facturas Vencidas | Con monto y días de mora |
| OC Retrasadas | Con proveedor y fecha esperada |
| Proveedor Crítico | Alertas de incumplimiento |
| Compras Pendientes | Aprobaciones pendientes |

---

## Reglas absolutas

1. Nunca comprar sin solicitud.
2. Nunca aprobar sin trazabilidad.
3. Nunca emitir OC sin proveedor.
4. Nunca recibir sin OC.
5. Nunca facturar sin recepción.
6. Nunca pagar sin factura válida.
7. Nunca perder historial.
8. Nunca eliminar órdenes.
9. Nunca modificar costos históricos.
10. Nunca romper relación con Inventario ni Producción.
11. Toda compra queda auditada.
12. Toda recepción genera movimiento de inventario.
13. Toda factura se relaciona con la OC correspondiente.
14. Todo cambio se puede reconstruir años después.
