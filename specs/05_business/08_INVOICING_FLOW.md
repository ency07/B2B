# INVOICING FLOW — Facturación, Pagos y Cartera

## 1. Flujo Maestro de Facturación

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      GENERACIÓN DE FACTURA                               │
│                                                                          │
│  Disparadores:                                                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │ OT_FINALIZADA    │  │ COTIZACION_      │  │ Factura Manual   │      │
│  │ (automático)     │  │ ACEPTADA         │  │ (servicios)      │      │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘      │
│           └─────────────────────┴──────────────────────┘                 │
│                          ↓                                               │
│                   ┌──────────────┐                                       │
│                   │   BORRADOR   │                                       │
│                   └──────┬───────┘                                       │
└──────────────────────────┼──────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      EMISIÓN Y ENVÍO                                     │
│                                                                          │
│  BORRADOR → revisión → EMITIDA                                          │
│       ↓                                                                  │
│  Envío al cliente (email + disponible en portal)                        │
│       ↓                                                                  │
│  Plazo de pago: 30 días (configurable por tenant)                       │
└──────────────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      PAGOS                                                │
│                                                                          │
│  Cliente puede pagar:                                                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌─────────────┐         │
│  │ Tarjeta  │  │   PSE    │  │ Transferencia │  │  Efectivo   │         │
│  │ (Wompi)  │  │  (Wompi) │  │  (Manual)     │  │  (Manual)   │         │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘  └──────┬──────┘         │
│       └──────────────┴───────────────┴──────────────────┘                │
│                          ↓                                               │
│                   ┌──────────────┐                                       │
│                   │ PAGO_PENDIENTE│                                      │
│                   └──────┬───────┘                                       │
│                          │ procesamiento                                 │
│                          ↓                                               │
│                   ┌──────────────┐                                       │
│                   │PAGO_PROCESANDO│  ← callback Wompi                   │
│                   └──────┬───────┘                                       │
│                          │ confirmación / rechazo                        │
│                ┌─────────┴─────────┐                                     │
│                ↓                   ↓                                    │
│       ┌──────────────┐    ┌──────────────┐                              │
│       │PAGO_CONFIRMADO│    │PAGO_RECHAZADO│                              │
│       └──────────────┘    └──────────────┘                              │
└──────────────────────────────────────────────────────────────────────────┘
                           ↓ (si confirmado)
┌─────────────────────────────────────────────────────────────────────────┐
│                      CONCILIACIÓN                                        │
│                                                                          │
│  PAGO_CONFIRMADO                                                         │
│       │                                                                  │
│       ├── Actualiza factura: PAGO_PARCIAL o PAGO_TOTAL                  │
│       ├── Genera recibo de pago (PDF)                                   │
│       ├── Envía recibo al cliente (email)                                │
│       └── Actualiza dashboard financiero                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Tipos de Facturación

### Facturación por OT

La más común. Al finalizar una OT, el sistema genera automáticamente la factura con:
- Items de la cotización aceptada
- Descuentos aplicados
- Impuestos calculados
- Datos del cliente
- Condiciones de pago

### Facturación Manual

Para servicios sin OT asociada:
- Consultoría
- Visitas técnicas
- Servicios menores
- Repuestos vendidos por mostrador

### Facturación por Anticipo

```
Cliente paga anticipo (50%)
    ↓
Se emite factura de anticipo
    ↓
Se ejecuta la OT
    ↓
Al finalizar, se emite factura final
    ↓
Se aplica el anticipo como pago
    ↓
Saldo = Total - Anticipo
```

### Facturación Recurrente (contratos de mantenimiento)

```
Contrato de mantenimiento (12 meses)
    ↓
Cada mes, sistema genera automáticamente:
  • Factura mensual por el valor del contrato
  • Envío al cliente
  • Seguimiento de pago
```

---

## 3. Notas de Crédito (NC)

### Cuándo se emite una NC

| Motivo | Descripción |
|---|---|
| Devolución | Cliente devuelve producto |
| Error en factura | Monto incorrecto, item duplicado |
| Descuento post-venta | Descuento retroactivo |
| Anulación | Factura emitida por error |
| Garantía | Reposición sin costo |

### Flujo de NC

```
Factura EMITIDA → Se detecta necesidad de NC
    ↓
Usuario autorizado crea NC
    ↓
NC vinculada a factura original
    ↓
Factura original → ANULADA (o saldo ajustado)
    ↓
NC disponible en portal del cliente
```

---

## 4. Impuestos y Retenciones

### IVA

| Concepto | Tarifa | Aplica a |
|---|---|---|
| IVA General | 19% | Todos los productos y servicios |
| IVA Diferencial | 5% | Algunos servicios de instalación |

### Retenciones (para proveedores)

| Concepto | Tarifa |
|---|---|
| Retefuente | 2.5% - 3.5% |
| ReteIVA | 15% del IVA |
| ReteICA | Según municipio |

---

## 5. Cartera (Cuentas por Cobrar)

### Aging de Cartera

```
┌──────────────────────────────────────────────────────────────┐
│ Cuentas por Cobrar                                           │
│                                                              │
│ ┌──────────────────────┐  $280M (66.7%)  ████████████████░  │
│ │ Corriente (0-30 días)│                              verde  │
│ └──────────────────────┘                                     │
│ ┌──────────────────────┐  $80M (19%)    ██████████░░░░░░░░  │
│ │ 31-60 días           │                              ámbar  │
│ └──────────────────────┘                                     │
│ ┌──────────────────────┐  $40M (9.5%)   ███████░░░░░░░░░░░  │
│ │ 61-90 días           │                              naranja│
│ └──────────────────────┘                                     │
│ ┌──────────────────────┐  $20M (4.8%)   ████░░░░░░░░░░░░░░  │
│ │ > 90 días            │                              rojo   │
│ └──────────────────────┘                                     │
└──────────────────────────────────────────────────────────────┘
```

### Acciones de Cobranza

| Días de mora | Acción |
|---|---|
| 0 (antes de vencer) | Recordatorio amable (email) |
| 1-7 días | Segundo recordatorio (email) |
| 8-15 días | Llamada telefónica |
| 16-30 días | Carta de cobro (PDF) |
| 31-60 días | Gestión de cobranza formal |
| > 60 días | Escalar a gerencia / legal |

---

## 6. KPIs Financieros

### KPIs Diarios

| KPI | Métrica |
|---|---|
| Facturas emitidas hoy | X |
| Pagos recibidos hoy | X |
| Total cobrado hoy | $XXX COP |
| Facturas vencidas | X |

### KPIs Mensuales

| KPI | Métrica |
|---|---|
| Facturación total | $XXX COP |
| Cobranza total | $XXX COP |
| Días promedio de cobro | X días |
| Cartera vencida (%) | < 5% |
| NC emitidas (%) | < 1% |
| Flujo de caja proyectado | $XXX COP |

---

## 7. Reglas de Facturación

1. **Factura mínima: $50,000 COP** (configurable por tenant).
2. **Toda factura requiere:** cotización aceptada + OT finalizada (si aplica).
3. **Pagos parciales:** permitidos. Múltiples abonos a una misma factura.
4. **Anticipos:** porcentaje del total definido por tenant.
5. **Plazo de pago:** 30 días por defecto. Configurable por cliente.
6. **Mora:** 1.5% mensual después del vencimiento (configurable).
7. **Nunca eliminar facturas.** Solo anular con NC.
8. **NC siempre vinculada a una factura origen.**
9. **Todo pago registrado en auditoría.**
10. **Toda factura incluye desglose de impuestos.**
11. **Numeración consecutiva por tenant** (tenant_sequences).
12. **Facturación electrónica:** compatible con DIAN (Colombia).
