# PURCHASING FLOW — Proceso de Compras y Abastecimiento

## 1. Flujo Maestro de Compras

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      DETECCIÓN DE NECESIDAD                              │
│                                                                          │
│  Fuentes:                                                                │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐                    │
│  │  OT        │  │  Inventario  │  │  Solicitud   │                    │
│  │ (Material) │  │ (Stock bajo) │  │  Manual      │                    │
│  └─────┬──────┘  └──────┬───────┘  └──────┬───────┘                    │
│        └────────────────┴──────────────────┘                             │
│                          ↓                                               │
│                   ┌─────────────┐                                        │
│                   │ SOLICITUD   │                                        │
│                   │ DE COMPRA   │                                        │
│                   └──────┬──────┘                                        │
└──────────────────────────┼──────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      APROBACIÓN DE SOLICITUD                              │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────┐       │
│  │ Reglas de aprobación por monto:                                │       │
│  │                                                                │       │
│  │ < $2M COP    → Auto-aprobado                                   │       │
│  │ $2M - $10M   → Jefe de Compras                                 │       │
│  │ $10M - $50M  → Jefe de Compras + Director de Operaciones       │       │
│  │ > $50M COP   → Jefe + Director + Gerente                       │       │
│  └───────────────────────────────────────────────────────────────┘       │
│                                                                           │
│  SOLICITUD PENDIENTE → APROBADA / RECHAZADA (requiere motivo)           │
└──────────────────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      COTIZACIÓN A PROVEEDORES                             │
│                                                                           │
│  Regla: Mínimo 3 cotizaciones para compras > $5M COP                     │
│                                                                           │
│  SOLICITUD APROBADA                                                       │
│        ↓                                                                  │
│  COTIZANDO (se solicitan cotizaciones a proveedores)                     │
│        ↓                                                                  │
│  Cotización 1  │  Cotización 2  │  Cotización 3                          │
│  $XXX.XXX      │  $XXX.XXX      │  $XXX.XXX                              │
│  Entrega: X    │  Entrega: X    │  Entrega: X                            │
│  Garantía: X   │  Garantía: X   │  Garantía: X                           │
│        └────────────┼────────────┘                                        │
│                     ↓                                                     │
│              ┌─────────────┐                                              │
│              │ COMPARADOR  │                                              │
│              └──────┬──────┘                                              │
└─────────────────────┼────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      SELECCIÓN DE PROVEEDOR                               │
│                                                                           │
│  COMPARADOR evalúa:                                                       │
│  ┌─────────────┬─────────────┬─────────────┐                             │
│  │ Precio (40%)│ Calidad(25%)│ Entrega(20%)│                             │
│  │ Historial   │ Garantía    │ Servicio    │                             │
│  │ (10%)       │ (5%)        │ Postventa   │                             │
│  └─────────────┴─────────────┴─────────────┘                             │
│                                                                           │
│  Sistema recomienda GANADOR (verde). Humano decide.                      │
│                                                                           │
│  PROVEEDOR SELECCIONADO → genera ORDEN DE COMPRA                         │
└──────────────────────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      ORDEN DE COMPRA (OC)                                 │
│                                                                           │
│  BORRADOR → ENVIADA → ACEPTADA (por proveedor)                           │
│                                                                           │
│  OC contiene:                                                             │
│  • Proveedor (datos completos)                                            │
│  • Productos/Servicios (cantidad, precio unitario)                        │
│  • Condiciones de pago (anticipo, crédito)                                │
│  • Fecha de entrega estimada                                              │
│  • Términos y condiciones                                                 │
│  • Impuestos y retenciones                                                │
└──────────────────────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      RECEPCIÓN                                            │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────┐       │
│  │ Tipos de recepción:                                            │       │
│  │                                                                │       │
│  │ • Total:    Todo coincide con la OC                           │       │
│  │ • Parcial:  Parte de los items recibidos                      │       │
│  │ • Rechazo:  Items no conformes                                │       │
│  │ • Devolución: Items devueltos al proveedor                     │       │
│  └───────────────────────────────────────────────────────────────┘       │
│                                                                           │
│  Al recibir:                                                              │
│  1. Se actualiza el estado de la OC (PARCIAL / RECIBIDA)                 │
│  2. Se generan movimientos de INVENTARIO (entrada)                       │
│  3. Se actualiza el Kardex                                                │
│  4. Si hay diferencias → ALERTA + aprobación requerida                   │
└──────────────────────────────────────────────────────────────────────────┘
                      ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      FACTURACIÓN DEL PROVEEDOR                            │
│                                                                           │
│  RECEPCIÓN COMPLETA → Proveedor emite factura                            │
│                     → Se registra en el sistema                           │
│                     → Se relaciona con la OC                              │
│                     → Se programa el pago según condiciones               │
│                     → OC pasa a FACTURADA → PAGADA                       │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Gestión de Proveedores

### Registro de Proveedor

Campos obligatorios:
- Razón Social
- NIT / RUT
- Dirección
- Ciudad
- Contacto principal (nombre, cargo, teléfono, correo)
- Categoría (Materiales, Servicios, Equipos, Consumibles)

Campos opcionales:
- Logo
- Sitio web
- Certificaciones (ISO, etc.)
- Condiciones de pago preferidas
- Cuentas bancarias

### Calificación de Proveedores

| Criterio | Peso | Método |
|---|---|---|
| Cumplimiento de entregas | 30% | % entregas a tiempo |
| Calidad de productos | 25% | Recepciones sin rechazo |
| Precio competitivo | 20% | Comparado con promedio |
| Tiempo de respuesta | 15% | Horas promedio en cotizar |
| Servicio postventa | 10% | Resolución de reclamos |

### Score total: 0-100

| Score | Clasificación |
|---|---|
| 90-100 | Excelente (preferido) |
| 70-89 | Bueno (confiable) |
| 50-69 | Regular (usar con precaución) |
| < 50 | Malo (evitar / bloquear) |

### Proveedor Bloqueado

Si el score baja de 50 o si tiene > 3 incumplimientos graves → BLOQUEO automático.
Proveedores bloqueados no reciben nuevas cotizaciones.

---

## 3. KPIs de Compras

### KPIs Diarios

| KPI | Métrica |
|---|---|
| Solicitudes nuevas | X / día |
| OC emitidas | X / día |
| Recepciones programadas para hoy | X |
| Recepciones realizadas | X |

### KPIs Mensuales

| KPI | Métrica |
|---|---|
| Compras del mes | $XXX COP |
| Ahorro vs presupuesto | X% |
| OC a tiempo | > 90% |
| Recepciones conformes | > 95% |
| Tiempo promedio solicitud → OC | < 5 días |
| Proveedores activos | X |

---

## 4. Reglas del Proceso de Compras

1. **Nunca comprar sin solicitud aprobada.**
2. **Mínimo 3 cotizaciones para compras > $5M COP.**
3. **Nunca emitir OC sin proveedor validado.**
4. **Nunca recibir sin OC.**
5. **Nunca facturar (proveedor) sin recepción.**
6. **Nunca pagar sin factura válida del proveedor.**
7. **Toda recepción genera movimiento de inventario.**
8. **Diferencias en recepción requieren aprobación del supervisor.**
9. **Proveedores bloqueados no reciben nuevas cotizaciones.**
10. **Toda compra queda auditada y puede reconstruirse años después.**
