# PORTAL FACTURAS Y PAGOS — Gestión Financiera del Cliente

## Filosofía

El cliente debe poder:
- Ver todas sus facturas en un vistazo
- Pagar directamente desde el portal (Wompi)
- Descargar PDFs de facturas y recibos
- Ver su historial completo
- Entender su saldo pendiente sin confusión

---

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ Facturas                                                             │
│ Historial de facturación y pagos                                     │
│                                                                      │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│ │ Total    │ │ Pendiente│ │ Pagado   │ │ Vencido  │               │
│ │ Facturado│ │ por Pagar│ │ (año)    │ │          │               │
│ │ $850M    │ │ $120M    │ │ $730M    │ │ $45M     │               │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘               │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐    │
│ │ FAC-0089 · $45.000.000 · Vence hoy                  [Pagar] │    │
│ │ FAC-0088 · $125.000.000 · Pagada el 10 Ene                  │    │
│ │ FAC-0085 · $80.000.000 · Pagada el 15 Dic                   │    │
│ │ FAC-0082 · $200.000.000 · Vencida (30 días)         [Pagar] │    │
│ └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Summary Cards (4 cards)

```
<div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
  <!-- Total Facturado -->
  <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
    <div class="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
      <Receipt class="w-5 h-5 text-slate-600" />
    </div>
    <p class="text-2xl font-semibold text-slate-900 font-mono">{totalBilled}</p>
    <p class="text-sm text-slate-500 mt-0.5">Total facturado</p>
  </div>

  <!-- Pendiente -->
  <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
    <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center mb-3">
      <Clock class="w-5 h-5 text-amber-600" />
    </div>
    <p class="text-2xl font-semibold text-amber-600 font-mono">{pending}</p>
    <p class="text-sm text-slate-500 mt-0.5">Por pagar</p>
  </div>

  <!-- Pagado -->
  <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
    <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-3">
      <CheckCircle class="w-5 h-5 text-green-600" />
    </div>
    <p class="text-2xl font-semibold text-green-600 font-mono">{paid}</p>
    <p class="text-sm text-slate-500 mt-0.5">Pagado (año)</p>
  </div>

  <!-- Vencido -->
  <div class="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
    <div class="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center mb-3">
      <AlertTriangle class="w-5 h-5 text-red-600" />
    </div>
    <p class="text-2xl font-semibold text-red-600 font-mono">{overdue}</p>
    <p class="text-sm text-slate-500 mt-0.5">Vencido</p>
  </div>
</div>
```

---

## Lista de Facturas

```
<div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
  <table class="w-full">
    <thead>
      <tr class="border-b border-slate-100 bg-slate-50/50">
        <th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Factura</th>
        <th class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Proyecto</th>
        <th class="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Total</th>
        <th class="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Estado</th>
        <th class="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Vencimiento</th>
        <th class="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">Acciones</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100">
      {invoices.map(invoice => (
        <tr class="hover:bg-slate-50/50 transition-colors">
          <td class="px-4 py-3.5">
            <span class="font-mono text-sm font-medium text-slate-900">{invoice.code}</span>
            <p class="text-xs text-slate-500 mt-0.5">{invoice.date}</p>
          </td>
          <td class="px-4 py-3.5 text-sm text-slate-700">{invoice.project}</td>
          <td class="px-4 py-3.5 text-right font-mono text-sm font-semibold text-slate-900">{invoice.total}</td>
          <td class="px-4 py-3.5 text-center">
            <Badge variant={invoice.statusVariant}>{invoice.status}</Badge>
          </td>
          <td class="px-4 py-3.5 text-center">
            <span class={`text-sm ${invoice.isOverdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
              {invoice.dueDate}
            </span>
            {invoice.isOverdue && (
              <p class="text-xs text-red-500 mt-0.5">{invoice.daysOverdue} días</p>
            )}
          </td>
          <td class="px-4 py-3.5 text-right">
            <div class="flex items-center justify-end gap-2">
              <Button variant="ghost" size="icon-sm" title="Descargar PDF">
                <Download class="w-4 h-4 text-slate-400" />
              </Button>
              {invoice.canPay && (
                <Button size="sm" onClick={() => openPayment(invoice)}>
                  Pagar
                </Button>
              )}
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

## Detalle de Factura (Sheet lateral)

```
<Sheet side="right" class="w-[45%]">
  <SheetContent>
    <!-- Header -->
    <div class="flex items-center justify-between pb-4 border-b border-slate-200">
      <div>
        <div class="flex items-center gap-3">
          <span class="font-mono text-sm text-slate-500">{code}</span>
          <Badge variant={statusVariant}>{status}</Badge>
        </div>
        <h3 class="text-lg font-semibold text-slate-900 mt-1">{project}</h3>
      </div>
    </div>

    <!-- Content -->
    <div class="py-6 space-y-6">
      <!-- Info -->
      <div class="grid grid-cols-2 gap-4">
        <div class="p-3 bg-slate-50 rounded-lg">
          <p class="text-xs text-slate-500">Fecha Emisión</p>
          <p class="text-sm font-medium text-slate-900 font-mono mt-0.5">{issueDate}</p>
        </div>
        <div class="p-3 bg-slate-50 rounded-lg">
          <p class="text-xs text-slate-500">Vencimiento</p>
          <p class={`text-sm font-medium font-mono mt-0.5 ${isOverdue ? 'text-red-600' : 'text-slate-900'}`}>
            {dueDate}
          </p>
        </div>
      </div>

      <!-- Items -->
      <div>
        <h4 class="text-sm font-semibold text-slate-900 mb-3">Detalle</h4>
        <div class="border border-slate-200 rounded-lg overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-slate-100 bg-slate-50/50">
                <th class="text-left text-xs font-medium text-slate-500 px-3 py-2">Concepto</th>
                <th class="text-right text-xs font-medium text-slate-500 px-3 py-2">Valor</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              {items.map(item => (
                <tr>
                  <td class="px-3 py-2.5 text-sm text-slate-700">{item.description}</td>
                  <td class="px-3 py-2.5 text-sm font-mono text-slate-900 text-right">{item.value}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr class="border-t border-slate-200 bg-slate-50/50">
                <td class="px-3 py-2 text-sm text-slate-500">Subtotal</td>
                <td class="px-3 py-2 text-sm font-mono text-slate-700 text-right">{subtotal}</td>
              </tr>
              <tr class="border-t border-slate-100">
                <td class="px-3 py-2 text-sm text-slate-500">IVA</td>
                <td class="px-3 py-2 text-sm font-mono text-slate-700 text-right">{iva}</td>
              </tr>
              <tr class="border-t-2 border-slate-200">
                <td class="px-3 py-3 text-sm font-semibold text-slate-900">Total</td>
                <td class="px-3 py-3 text-base font-mono font-semibold text-slate-900 text-right">{total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Pagos aplicados -->
      <div>
        <h4 class="text-sm font-semibold text-slate-900 mb-3">Pagos Aplicados</h4>
        <div class="space-y-2">
          {payments.map(payment => (
            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p class="text-sm text-slate-700">{payment.method}</p>
                <p class="text-xs text-slate-400">{payment.date}</p>
              </div>
              <span class="font-mono text-sm font-medium text-green-600">{payment.amount}</span>
            </div>
          ))}
        </div>
      </div>

      <!-- Saldo -->
      <div class="p-4 bg-slate-50 rounded-lg">
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-500">Saldo Pendiente</span>
          <span class={`font-mono text-lg font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {balance}
          </span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3 pt-4 border-t border-slate-200">
      <Button variant="outline" class="flex-1" onClick={downloadPDF}>
        <Download class="w-4 h-4 mr-2" />
        Descargar PDF
      </Button>
      {canPay && (
        <Button class="flex-1" onClick={openPayment}>
          Pagar Ahora
        </Button>
      )}
    </div>
  </SheetContent>
</Sheet>
```

---

## Diálogo de Pago (Wompi)

```
<Dialog>
  <DialogContent class="max-w-lg">
    <DialogHeader>
      <DialogTitle>Pagar Factura {code}</DialogTitle>
      <DialogDescription>
        Selecciona el método de pago y completa la transacción de forma segura.
      </DialogDescription>
    </DialogHeader>

    <div class="py-4 space-y-6">
      <!-- Resumen -->
      <div class="p-4 bg-slate-50 rounded-lg">
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-slate-500">Factura</span>
          <span class="font-mono text-sm text-slate-900">{code}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-500">Total a pagar</span>
          <span class="font-mono text-xl font-semibold text-slate-900">{total}</span>
        </div>
      </div>

      <!-- Métodos de pago -->
      <div>
        <label class="text-sm font-medium text-slate-700 mb-3 block">Método de pago</label>
        <div class="space-y-2">
          <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input type="radio" name="payment" value="card" defaultChecked />
            <CreditCard class="w-5 h-5 text-slate-400" />
            <span class="text-sm text-slate-700">Tarjeta de crédito o débito</span>
          </label>
          <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input type="radio" name="payment" value="pse" />
            <Building class="w-5 h-5 text-slate-400" />
            <span class="text-sm text-slate-700">PSE — Débito bancario</span>
          </label>
          <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <input type="radio" name="payment" value="transfer" />
            <ArrowRightLeft class="w-5 h-5 text-slate-400" />
            <span class="text-sm text-slate-700">Transferencia bancaria</span>
          </label>
        </div>
      </div>

      {/* Wompi Widget se renderiza aquí */}
      <div id="wompi-checkout" />
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={onCancel}>Cancelar</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Estados de Factura

| Estado | Color | Badge |
|---|---|---|
| EMITIDA | `bg-blue-50 text-blue-700 border-blue-200` | info |
| PAGADA_PARCIAL | `bg-amber-50 text-amber-700 border-amber-200` | warning |
| PAGADA_TOTAL | `bg-green-50 text-green-700 border-green-200` | success |
| VENCIDA | `bg-red-50 text-red-700 border-red-200` | danger |
| ANULADA | `bg-slate-50 text-slate-500 border-slate-200` | neutral |

---

## Filtros

```
<div class="flex items-center gap-3 mb-6">
  <div class="flex items-center rounded-lg border border-slate-200 bg-white">
    <button class="px-3 py-1.5 text-sm font-medium text-slate-900 bg-slate-100 rounded-l-lg">
      Todas
    </button>
    <button class="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
      Pendientes
    </button>
    <button class="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
      Pagadas
    </button>
    <button class="px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700 rounded-r-lg">
      Vencidas
    </button>
  </div>
</div>
```

---

## Empty State

```
<div class="flex flex-col items-center justify-center py-20 text-center">
  <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
    <Receipt class="w-8 h-8 text-slate-400" />
  </div>
  <h3 class="text-lg font-semibold text-slate-900">No tienes facturas</h3>
  <p class="text-sm text-slate-500 mt-2 max-w-sm">
    Aquí aparecerán tus facturas emitidas y su estado de pago.
  </p>
</div>
```
