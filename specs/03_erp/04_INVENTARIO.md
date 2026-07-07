# INVENTARIO — Sistema Nervioso de la Operación

## Filosofía

Inventario NO es una tabla de productos. Es el **sistema nervioso de toda la operación**.

Debe responder en segundos:
- ¿Qué tenemos?
- ¿Dónde está?
- ¿Quién lo movió?
- ¿Cuánto vale?
- ¿Qué está reservado?
- ¿Qué está por agotarse?
- ¿Qué debe comprarse?

Cada movimiento debe ser completamente trazable. Nunca un movimiento sin origen. Nunca un movimiento sin destino.

---

## Layout

```
HEADER (título + acciones: Nuevo Producto, Entrada, Salida, Transferencia)
↓
KPI ROW (8 cards)
↓
TOOLBAR (Buscar + Filtros: Categoría, Bodega, Estado, Stock)
↓
TABLA + PANEL LATERAL (70/30)
↓
TABS (Productos, Series, Lotes, Kardex, Movimientos, Bodegas)
```

---

## KPIs

| KPI | Icono |
|---|---|
| Productos (SKUs) | Package |
| Valor Inventario | DollarSign |
| Stock Crítico | AlertTriangle |
| Productos Sin Movimiento | Clock |
| Entradas Hoy | ArrowDownCircle |
| Salidas Hoy | ArrowUpCircle |
| Transferencias | ArrowLeftRight |
| Bodegas | Warehouse |

---

## Tab de Productos

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Código | Izquierda | font-mono |
| SKU | Izquierda | font-mono |
| Producto | Izquierda | Texto + imagen mini |
| Categoría | Centro | Badge |
| Familia | Centro | Texto |
| Stock | Derecha | font-mono |
| Reservado | Derecha | font-mono |
| Disponible | Derecha | font-mono (verde si > 0, rojo si = 0) |
| Costo | Derecha | font-mono + moneda |
| Precio | Derecha | font-mono + moneda |
| Estado | Centro | Badge |
| Acciones | Derecha | Icon buttons |

### Vista Detalle Producto (Sheet)

Tabs: Información General, Inventario, Series, Lotes, Movimientos, Documentos, Proveedores, Costos, Historial.

#### Información General

```
<div class="grid grid-cols-2 gap-4">
  <div class="flex items-center justify-between py-2 border-b border-zinc-800/30">
    <span class="text-xs text-zinc-500">Código</span>
    <span class="font-mono text-xs text-zinc-100">{code}</span>
  </div>
  <div class="flex items-center justify-between py-2 border-b border-zinc-800/30">
    <span class="text-xs text-zinc-500">SKU</span>
    <span class="font-mono text-xs text-zinc-100">{sku}</span>
  </div>
  <div class="flex items-center justify-between py-2 border-b border-zinc-800/30">
    <span class="text-xs text-zinc-500">Marca</span>
    <span class="text-xs text-zinc-100">{brand}</span>
  </div>
  <div class="flex items-center justify-between py-2 border-b border-zinc-800/30">
    <span class="text-xs text-zinc-500">Categoría</span>
    <Badge variant="neutral">{category}</Badge>
  </div>
  <div class="flex items-center justify-between py-2 border-b border-zinc-800/30">
    <span class="text-xs text-zinc-500">Peso</span>
    <span class="font-mono text-xs text-zinc-100">{weight} kg</span>
  </div>
  <div class="flex items-center justify-between py-2 border-b border-zinc-800/30">
    <span class="text-xs text-zinc-500">Dimensiones</span>
    <span class="font-mono text-xs text-zinc-100">{dimensions}</span>
  </div>
</div>
```

---

## Tab de Series

Cada serie representa una unidad única.

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Serie | Izquierda | font-mono |
| Producto | Izquierda | Texto |
| Estado | Centro | Badge |
| Ubicación | Centro | Texto |
| Fecha Ingreso | Centro | Fecha |
| Garantía | Centro | Fecha (rojo si vencida) |
| Responsable | Izquierda | Avatar |
| Cliente | Izquierda | Texto |
| Acciones | Derecha | Icon buttons |

### Estados de Serie

| Estado | Color | Badge |
|---|---|---|
| Disponible | `bg-green-950/50 text-green-400` | success |
| Reservado | `bg-blue-950/50 text-blue-400` | info |
| Instalado | `bg-purple-950/50 text-purple-400` | neutral |
| En Reparación | `bg-amber-950/50 text-amber-400` | warning |
| Prestado | `bg-cyan-950/50 text-cyan-400` | info |
| Baja | `bg-red-950/50 text-red-400` | danger |

---

## Tab de Lotes

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Número Lote | Izquierda | font-mono |
| Producto | Izquierda | Texto |
| Cantidad | Derecha | font-mono |
| Fecha Fabricación | Centro | Fecha |
| Fecha Ingreso | Centro | Fecha |
| Fecha Vencimiento | Centro | Fecha (rojo si próximo) |
| Proveedor | Izquierda | Texto |
| Estado | Centro | Badge |
| Ubicación | Centro | Texto |
| Acciones | Derecha | Icon buttons |

### Estados de Lote

| Estado | Color | Badge |
|---|---|---|
| Disponible | `bg-green-950/50 text-green-400` | success |
| Consumido | `bg-zinc-800/50 text-zinc-400` | neutral |
| Reservado | `bg-blue-950/50 text-blue-400` | info |
| Bloqueado | `bg-red-950/50 text-red-400` | danger |
| Vencido | `bg-red-950/50 text-red-400` | danger |

---

## Tab de Kardex

La auditoría completa de movimientos por producto.

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Fecha | Centro | Fecha |
| Hora | Centro | font-mono |
| Movimiento | Centro | Badge (Entrada/Salida/Transferencia/Ajuste) |
| Documento | Izquierda | font-mono (link) |
| Entrada | Derecha | font-mono (verde) |
| Salida | Derecha | font-mono (rojo) |
| Saldo | Derecha | font-mono (bold) |
| Costo Unit. | Derecha | font-mono |
| Costo Promedio | Derecha | font-mono |
| Usuario | Izquierda | Avatar + nombre |
| Bodega | Centro | Texto |

### Reglas del Kardex

- Nunca recalcular manualmente.
- Exportar: Excel, PDF, CSV.
- Filtros: Producto, Serie, Lote, Bodega, Usuario, Fecha, Documento.
- El Kardex nunca se edita. Nunca se elimina.

---

## Tab de Movimientos

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Código | Izquierda | font-mono |
| Tipo | Centro | Badge |
| Producto | Izquierda | Texto |
| Cantidad | Derecha | font-mono |
| Origen | Izquierda | Texto (bodega/ubicación) |
| Destino | Izquierda | Texto (bodega/ubicación) |
| Usuario | Izquierda | Avatar |
| Fecha | Centro | Fecha |
| Hora | Centro | font-mono |
| Documento | Izquierda | font-mono (link) |
| Costo | Derecha | font-mono |
| Observaciones | Izquierda | Texto truncado |

### Tipos de Movimiento

| Tipo | Color | Badge |
|---|---|---|
| Entrada | `bg-green-950/50 text-green-400` | success |
| Salida | `bg-red-950/50 text-red-400` | danger |
| Transferencia | `bg-blue-950/50 text-blue-400` | info |
| Ajuste | `bg-amber-950/50 text-amber-400` | warning |
| Reserva | `bg-purple-950/50 text-purple-400` | neutral |
| Consumo | `bg-orange-950/50 text-orange-400` | warning |
| Producción | `bg-cyan-950/50 text-cyan-400` | info |
| Compra | `bg-green-950/50 text-green-400` | success |
| Venta | `bg-red-950/50 text-red-400` | danger |
| Devolución | `bg-amber-950/50 text-amber-400` | warning |

### Reglas

- Nunca movimientos sin documento.
- Toda entrada tiene origen. Toda salida tiene destino.
- Toda transferencia tiene aprobación.
- Todo ajuste queda auditado.

---

## Tab de Bodegas

### Vista tipo mapa/grid

```
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {warehouses.map(warehouse => (
    <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-zinc-100">{warehouse.name}</h3>
        <Badge variant={warehouse.statusVariant}>{warehouse.status}</Badge>
      </div>
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs text-zinc-500">Ubicación</span>
          <span class="text-xs text-zinc-300">{warehouse.location}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-zinc-500">Capacidad</span>
          <span class="font-mono text-xs text-zinc-300">{warehouse.capacity}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-zinc-500">Ocupación</span>
          <div class="flex items-center gap-2">
            <div class="w-20 h-1.5 rounded-full bg-zinc-800">
              <div class="h-full rounded-full bg-primary" style={{ width: `${warehouse.occupancy}%` }} />
            </div>
            <span class="font-mono text-xs text-zinc-300">{warehouse.occupancy}%</span>
          </div>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-zinc-500">Productos</span>
          <span class="font-mono text-xs text-zinc-300">{warehouse.productCount}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-xs text-zinc-500">Valor</span>
          <span class="font-mono text-xs text-zinc-100">{warehouse.totalValue}</span>
        </div>
      </div>
    </div>
  ))}
</div>
```

### Jerarquía de ubicación

```
Bodega → Zona → Pasillo → Estante → Nivel → Posición
```

Toda ubicación debe ser única.

---

## Transferencias

### Flujo

```
Bodega A → Validación → Transporte → Recepción → Bodega B
```

Cada paso: Usuario, Fecha, Hora, Estado, Firma.

---

## Inventario Físico

### Flujo

```
Conteo → Reconteo → Diferencias → Ajustes → Validación → Aprobación
```

| Columna | Alineación | Tipo |
|---|---|---|
| Sistema | Derecha | font-mono |
| Conteo | Derecha | font-mono |
| Diferencia | Derecha | font-mono (rojo si ≠ 0) |
| Motivo | Izquierda | Texto |
| Aprobación | Centro | Badge |

### Reglas

- Nunca ajustar automáticamente.
- Siempre requerir aprobación.
- Toda diferencia debe quedar documentada.

---

## Reglas absolutas

1. Nunca permitir inventario negativo.
2. Nunca perder trazabilidad.
3. Nunca eliminar movimientos.
4. Nunca modificar Kardex.
5. Nunca duplicar Series ni Lotes.
6. Nunca mover inventario sin documento.
7. Nunca mover inventario sin auditoría.
8. Nunca permitir productos sin ubicación.
9. Nunca perder el costo histórico.
10. Todo movimiento debe poder reconstruirse años después.
