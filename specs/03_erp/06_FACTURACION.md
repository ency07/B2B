# FACTURACIÓN — Facturas, Pagos, NC, Cartera, Anticipos

## Filosofía

Facturación NO es solo emitir documentos. Es el **centro financiero** del ERP.

Debe responder:
- ¿Cuánto se ha facturado?
- ¿Cuánto se ha cobrado?
- ¿Cuánto está pendiente?
- ¿Qué facturas están vencidas?
- ¿Qué anticipos faltan por aplicar?
- ¿Cuál es el flujo de caja proyectado?

---

## Sub-módulos

```
Facturación
├── Facturas
├── Notas de Crédito
├── Pagos
├── Cartera (Cuentas por Cobrar)
├── Anticipos
└── Reportes Financieros
```

---

## Layout

```
HEADER (título + acciones: Nueva Factura, Registrar Pago, Reportes)
↓
KPI ROW (8 cards)
↓
TABS (Facturas, NC, Pagos, Cartera, Anticipos)
↓
TABLA + PANEL LATERAL (70/30)
```

---

## KPIs

| KPI | Icono |
|---|---|
| Facturado (mes) | Receipt |
| Cobrado (mes) | DollarSign |
| Pendiente por Cobrar | Clock |
| Facturas Vencidas | AlertTriangle |
| Días Promedio Cobro | Calendar |
| Anticipos Aplicados | ArrowDownCircle |
| Anticipos Pendientes | ArrowUpCircle |
| Flujo Proyectado | TrendingUp |

---

## Tab de Facturas

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Factura | Izquierda | font-mono |
| Cliente | Izquierda | Texto + logo |
| Proyecto | Izquierda | Texto |
| Fecha | Centro | Fecha |
| Vencimiento | Centro | Fecha (rojo si vencida) |
| Subtotal | Derecha | font-mono + moneda |
| IVA | Derecha | font-mono + moneda |
| Total | Derecha | font-mono + moneda (bold) |
| Pagado | Derecha | font-mono + barra progreso |
| Saldo | Derecha | font-mono (rojo si > 0) |
| Estado | Centro | Badge |
| Acciones | Derecha | Icon buttons |

### Estados de Factura

| Estado | Color | Badge |
|---|---|---|
| FACTURA_BORRADOR | `bg-zinc-800/50 text-zinc-400` | neutral |
| FACTURA_EMITIDA | `bg-blue-950/50 text-blue-400` | info |
| FACTURA_PAGADA_PARCIAL | `bg-amber-950/50 text-amber-400` | warning |
| FACTURA_PAGADA_TOTAL | `bg-green-950/50 text-green-400` | success |
| FACTURA_VENCIDA | `bg-red-950/50 text-red-400` | danger |
| FACTURA_ANULADA | `bg-red-950/50 text-red-400` | danger |

### Vista Detalle Factura (Sheet)

```
<Sheet side="right" class="w-[50%]">
  <SheetContent>
    <!-- Cabecera -->
    <div class="flex items-center justify-between pb-4 border-b border-zinc-800/40">
      <div>
        <div class="flex items-center gap-3">
          <h3 class="text-lg font-semibold text-zinc-100 font-mono">{invoice.code}</h3>
          <Badge variant={statusVariant}>{status}</Badge>
        </div>
        <p class="text-sm text-zinc-400 mt-1">{client.name}</p>
      </div>
    </div>

    <!-- Tabs -->
    <Tabs defaultValue="details" class="mt-4">
      <TabsList class="bg-zinc-800/40">
        <TabsTrigger value="details">Detalle</TabsTrigger>
        <TabsTrigger value="payments">Pagos</TabsTrigger>
        <TabsTrigger value="related">Relacionados</TabsTrigger>
        <TabsTrigger value="audit">Auditoría</TabsTrigger>
      </TabsList>

      <!-- Tab: Detalle -->
      <TabsContent value="details">
        <!-- Info del cliente -->
        <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4 mb-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-[10px] text-zinc-500 uppercase">Cliente</p>
              <p class="text-sm text-zinc-100">{client.name}</p>
              <p class="text-xs text-zinc-500">{client.nit}</p>
            </div>
            <div>
              <p class="text-[10px] text-zinc-500 uppercase">Proyecto</p>
              <p class="text-sm text-zinc-100">{project.name}</p>
              <p class="text-xs text-zinc-500">{project.code}</p>
            </div>
            <div>
              <p class="text-[10px] text-zinc-500 uppercase">Fecha Emisión</p>
              <p class="font-mono text-sm text-zinc-100">{issueDate}</p>
            </div>
            <div>
              <p class="text-[10px] text-zinc-500 uppercase">Vencimiento</p>
              <p class="font-mono text-sm text-{dueColor}">{dueDate}</p>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 overflow-hidden mb-4">
          <table class="w-full">
            <thead class="bg-zinc-900/60">
              <tr>
                <th class="text-left text-xs font-medium text-zinc-400 px-3 py-2">Concepto</th>
                <th class="text-right text-xs font-medium text-zinc-400 px-3 py-2">Cant.</th>
                <th class="text-right text-xs font-medium text-zinc-400 px-3 py-2">Vr. Unit.</th>
                <th class="text-right text-xs font-medium text-zinc-400 px-3 py-2">Desc.</th>
                <th class="text-right text-xs font-medium text-zinc-400 px-3 py-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr class="border-t border-zinc-800/40">
                  <td class="px-3 py-2 text-sm text-zinc-300">{item.description}</td>
                  <td class="px-3 py-2 text-sm text-zinc-300 text-right font-mono">{item.quantity}</td>
                  <td class="px-3 py-2 text-sm text-zinc-300 text-right font-mono">{item.unitPrice}</td>
                  <td class="px-3 py-2 text-sm text-zinc-300 text-right font-mono">{item.discount}</td>
                  <td class="px-3 py-2 text-sm text-zinc-300 text-right font-mono">{item.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <!-- Totales -->
        <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-sm text-zinc-400">Subtotal</span>
              <span class="font-mono text-sm text-zinc-100">{subtotal}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-zinc-400">IVA ({ivaRate}%)</span>
              <span class="font-mono text-sm text-zinc-100">{iva}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-zinc-400">Retención</span>
              <span class="font-mono text-sm text-zinc-100">- {retention}</span>
            </div>
            <div class="flex items-center justify-between py-2 border-t-2 border-zinc-700">
              <span class="text-sm font-semibold text-zinc-100">Total</span>
              <span class="font-mono text-lg font-bold text-zinc-100">{total}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-zinc-400">Pagado</span>
              <span class="font-mono text-sm text-green-400">{paid}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm text-zinc-400">Saldo</span>
              <span class={`font-mono text-sm font-bold ${balance > 0 ? 'text-red-400' : 'text-green-400'}`}>
                {balance}
              </span>
            </div>
          </div>
        </div>
      </TabsContent>

      <!-- Tab: Pagos -->
      <TabsContent value="payments">
        <div class="space-y-3">
          {payments.map(payment => (
            <div class="rounded-lg border border-zinc-800/40 bg-zinc-900/20 p-3">
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <Badge variant={payment.variant}>{payment.method}</Badge>
                  <span class="font-mono text-sm text-zinc-100">{payment.amount}</span>
                </div>
                <span class="font-mono text-xs text-zinc-500">{payment.date}</span>
              </div>
              <p class="text-xs text-zinc-500">{payment.reference}</p>
            </div>
          ))}
        </div>
      </TabsContent>

      <!-- Tab: Relacionados -->
      <TabsContent value="related">
        <div class="space-y-2">
          <a class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/40 transition-colors">
            <FileText class="w-4 h-4 text-blue-400" />
            <span class="text-sm text-zinc-300">Cotización COT-0042</span>
            <ArrowRight class="w-3 h-3 text-zinc-500 ml-auto" />
          </a>
          <a class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/40 transition-colors">
            <Wrench class="w-4 h-4 text-amber-400" />
            <span class="text-sm text-zinc-300">OT-0018</span>
            <ArrowRight class="w-3 h-3 text-zinc-500 ml-auto" />
          </a>
          <a class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/40 transition-colors">
            <ClipboardList class="w-4 h-4 text-purple-400" />
            <span class="text-sm text-zinc-300">Requerimiento REQ-0031</span>
            <ArrowRight class="w-3 h-3 text-zinc-500 ml-auto" />
          </a>
        </div>
      </TabsContent>
    </Tabs>
  </SheetContent>
</Sheet>
```

---

## Tab de Notas de Crédito

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| NC | Izquierda | font-mono |
| Factura Origen | Izquierda | font-mono (link) |
| Cliente | Izquierda | Texto |
| Fecha | Centro | Fecha |
| Motivo | Izquierda | Texto truncado |
| Valor | Derecha | font-mono + moneda |
| Estado | Centro | Badge |
| Acciones | Derecha | Icon buttons |

---

## Tab de Pagos

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Recibo | Izquierda | font-mono |
| Cliente | Izquierda | Texto |
| Factura(s) | Izquierda | font-mono (links) |
| Fecha | Centro | Fecha |
| Método | Centro | Badge (Transferencia/PSE/Wompi/Efectivo) |
| Valor | Derecha | font-mono + moneda |
| Estado | Centro | Badge (Pendiente/Confirmado/Rechazado) |
| Acciones | Derecha | Icon buttons |

### Registrar Pago

```
<div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-6">
  <h3 class="text-sm font-semibold text-zinc-100 mb-4">Registrar Pago</h3>
  <div class="space-y-4">
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs text-zinc-500 mb-1 block">Cliente</label>
        <Combobox placeholder="Buscar cliente..." />
      </div>
      <div>
        <label class="text-xs text-zinc-500 mb-1 block">Método de Pago</label>
        <Select>
          <option>Transferencia</option>
          <option>PSE</option>
          <option>Wompi</option>
          <option>Efectivo</option>
        </Select>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="text-xs text-zinc-500 mb-1 block">Fecha</label>
        <Input type="date" />
      </div>
      <div>
        <label class="text-xs text-zinc-500 mb-1 block">Valor</label>
        <Input type="number" placeholder="$0" class="font-mono" />
      </div>
    </div>
    <div>
      <label class="text-xs text-zinc-500 mb-1 block">Referencia</label>
      <Input placeholder="Número de referencia..." />
    </div>
    <div>
      <label class="text-xs text-zinc-500 mb-1 block">Facturas a aplicar</label>
      <div class="space-y-2">
        {pendingInvoices.map(inv => (
          <div class="flex items-center gap-3 px-3 py-2 rounded-lg border border-zinc-800/40">
            <Checkbox />
            <span class="font-mono text-sm text-zinc-300">{inv.code}</span>
            <span class="text-sm text-zinc-400 flex-1">{inv.client}</span>
            <span class="font-mono text-sm text-zinc-100">{inv.balance}</span>
          </div>
        ))}
      </div>
    </div>
    <div class="flex items-center justify-end gap-3">
      <Button variant="outline">Cancelar</Button>
      <Button>Registrar Pago</Button>
    </div>
  </div>
</div>
```

---

## Tab de Cartera (Cuentas por Cobrar)

### Vista resumen

```
<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
  <div class="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-4">
    <p class="text-xs text-zinc-500">Por Cobrar Total</p>
    <p class="font-display text-2xl font-bold text-zinc-100 tracking-tighter mt-1">$420M</p>
  </div>
  <div class="rounded-xl border border-green-900/40 bg-green-950/10 p-4">
    <p class="text-xs text-zinc-500">Corriente (0-30 días)</p>
    <p class="font-display text-2xl font-bold text-green-400 tracking-tighter mt-1">$280M</p>
  </div>
  <div class="rounded-xl border border-amber-900/40 bg-amber-950/10 p-4">
    <p class="text-xs text-zinc-500">Próximo Vencimiento (31-60)</p>
    <p class="font-display text-2xl font-bold text-amber-400 tracking-tighter mt-1">$80M</p>
  </div>
  <div class="rounded-xl border border-red-900/40 bg-red-950/10 p-4">
    <p class="text-xs text-zinc-500">Vencido (>60 días)</p>
    <p class="font-display text-2xl font-bold text-red-400 tracking-tighter mt-1">$60M</p>
  </div>
</div>
```

### Tabla de cartera

| Columna | Alineación | Tipo |
|---|---|---|
| Cliente | Izquierda | Texto |
| Facturas | Derecha | font-mono (cantidad) |
| Corriente | Derecha | font-mono + verde |
| 31-60 días | Derecha | font-mono + amber |
| 61-90 días | Derecha | font-mono + orange |
| >90 días | Derecha | font-mono + rojo |
| Total | Derecha | font-mono (bold) |
| Acciones | Derecha | Icon buttons |

---

## Tab de Anticipos

### Tabla

| Columna | Alineación | Tipo |
|---|---|---|
| Código | Izquierda | font-mono |
| Cliente | Izquierda | Texto |
| Fecha | Centro | Fecha |
| Valor | Derecha | font-mono + moneda |
| Aplicado | Derecha | font-mono + barra progreso |
| Pendiente | Derecha | font-mono |
| Factura(s) | Izquierda | font-mono (links) |
| Estado | Centro | Badge |
| Acciones | Derecha | Icon buttons |

---

## Panel Derecho (Cobranza)

Sticky. Contiene:

| Sección | Contenido |
|---|---|
| Facturas Vencidas | Con monto y días de mora |
| Próximos Vencimientos | Próximos 7 días |
| Pagos Pendientes | Confirmaciones de pago |
| Anticipos por Aplicar | Anticipos sin factura |
| Clientes en Mora | Top 5 deudores |

---

## Reglas de facturación

1. Factura mínima: $50,000 COP (configurable por tenant).
2. Factura requiere: cotización aceptada y OT finalizada.
3. Pagos parciales permitidos (múltiples abonos).
4. Anticipos: porcentaje definido por tenant.
5. Tipos de pago: transferencia, PSE, Wompi, efectivo.
6. Toda factura versionada (historial inmutable).
7. Toda NC vinculada a una factura origen.
8. Todo pago registrado en auditoría.
9. Nunca facturar sin OC del cliente (si aplica).
10. Nunca eliminar facturas. Solo anular con NC.
