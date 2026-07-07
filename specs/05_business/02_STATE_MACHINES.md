# STATE MACHINES — Máquinas de Estado

## Regla suprema

Toda entidad del sistema tiene un **conjunto finito y definido de estados**. Ninguna transición puede ocurrir si no está documentada aquí.

---

## 1. Lead

```
                    ┌─────────────────┐
                    │   LEAD_NUEVO    │ ← Entrada web / wizard
                    └────────┬────────┘
                             │ contacto
                             ↓
                    ┌──────────────────┐
                ┌───│ LEAD_CONTACTADO │
                │   └────────┬─────────┘
                │            │ calificación
                │            ↓
                │   ┌──────────────────┐
                │   │ LEAD_CALIFICADO  │
                │   └────────┬─────────┘
                │            │ scoring < 35
                ↓            ↓ scoring ≥ 35
      ┌─────────────────┐   ┌────────────────────┐
      │ LEAD_NO_CALIFICA│   │   LEAD_ASIGNADO    │
      └────────┬────────┘   └──────────┬─────────┘
               │                       │ conversión
               ↓                       ↓
      ┌──────────────────┐   ┌───────────────────┐
      │ LEAD_DESCARTADO  │   │  LEAD_CONVERTIDO  │ → Genera CLIENTE
      └──────────────────┘   └───────────────────┘
```

### Definición de transiciones

| Origen | Destino | Disparador | Actor | Condiciones |
|---|---|---|---|---|
| LEAD_NUEVO | LEAD_CONTACTADO | Primer contacto registrado | COMERCIAL | Contacto no vacío |
| LEAD_CONTACTADO | LEAD_CALIFICADO | Score supera 35 | Sistema | Score > 35 |
| LEAD_CONTACTADO | LEAD_NO_CALIFICA | Score insuficiente | Sistema | Score < 35 |
| LEAD_CALIFICADO | LEAD_ASIGNADO | Asignación manual/automática | Sistema | Comercial asignado |
| LEAD_ASIGNADO | LEAD_CONVERTIDO | Conversión manual | COMERCIAL | Cliente creado |
| LEAD_CALIFICADO | LEAD_DESCARTADO | Descarte manual | COMERCIAL | Motivo > 10 chars |
| LEAD_NO_CALIFICA | LEAD_DESCARTADO | Descarte manual | COMERCIAL | Motivo > 10 chars |

### Scoring de Lead

| Criterio | Puntos posibles |
|---|---|
| Empresa con NIT | +10 |
| Industria prioritaria (minería, siderurgia) | +15 |
| Cargo: Gerente/Director | +10 |
| Proyecto urgente | +20 |
| Cotización solicitada | +15 |
| Descargó catálogo | +5 |
| Completó calculadora CFM | +10 |
| Teléfono válido | +5 |
| Correo corporativo | +5 |

| Score | Clasificación | SLA |
|---|---|---|
| 0-34 | Frío | 24 horas |
| 35-59 | Caliente | 2 horas |
| 60+ | Muy caliente | 30 minutos |

---

## 2. Cliente

```
                    ┌──────────────────┐
                    │  CLIENTE_ACTIVO  │
                    └────┬─────────┬───┘
                         │         │
              suspensión │         │ inactividad
                         ↓         │
              ┌──────────────────┐ │
              │CLIENTE_SUSPENDIDO│ │
              └────┬─────────────┘ │
                   │ reactivación  │
                   ↓               ↓
              ┌──────────────────┐ │
              │  CLIENTE_ACTIVO  │←┘
              └──────────────────┘
                         │
                         │ abandono
                         ↓
              ┌───────────────────┐
              │ CLIENTE_INACTIVO  │
              └───────────────────┘
```

| Origen | Destino | Disparador | Actor |
|---|---|---|---|
| CLIENTE_ACTIVO | CLIENTE_SUSPENDIDO | Suspensión administrativa | ADMIN |
| CLIENTE_SUSPENDIDO | CLIENTE_ACTIVO | Reactivación | ADMIN |
| CLIENTE_ACTIVO | CLIENTE_INACTIVO | Inactividad o baja | ADMIN |
| CLIENTE_SUSPENDIDO | CLIENTE_INACTIVO | Baja definitiva | ADMIN |

---

## 3. Requerimiento

```
                    ┌───────────────────────┐
                    │  REQUERIMIENTO_ABIERTO │
                    └───────────┬───────────┘
                                │ evaluación
                                ↓
                    ┌──────────────────────────────┐
                    │  REQUERIMIENTO_EN_EVALUACION  │
                    └──────────────┬───────────────┘
                                   │ presupuestado
                                   ↓
                    ┌────────────────────────────────┐
                    │  REQUERIMIENTO_PRESUPUESTADO   │
                    └───────────────┬────────────────┘
                                    │ aprobación
                                    ↓
                    ┌───────────────────────────┐
                    │   REQUERIMIENTO_APROBADO  │
                    └─────────────┬─────────────┘
                                  │ ejecución
                                  ↓
                    ┌──────────────────────────────┐
                    │  REQUERIMIENTO_EN_PROYECTO   │
                    └──────────────┬───────────────┘
                                   │ facturación
                                   ↓
                    ┌───────────────────────────────┐
                    │  REQUERIMIENTO_FACTURADO      │
                    └───────────────┬───────────────┘
                                    │ cierre
                                    ↓
                    ┌───────────────────────────┐
                    │   REQUERIMIENTO_CERRADO   │
                    └───────────────────────────┘

            Cualquier estado → REQUERIMIENTO_CANCELADO (requiere motivo > 10 chars)
```

---

## 4. Cotización

```
                    ┌─────────────────────┐
                    │  COTIZACION_BORRADOR│ ← Creación
                    └──────────┬──────────┘
                               │ envío
                               ↓
                    ┌─────────────────────┐
            ┌──────│  COTIZACION_ENVIADA  │
            │      └──────────┬──────────┘
            │                 │ repuesta cliente
            ↓                 ↓
  ┌──────────────────┐  ┌───────────────────────┐
  │COTIZACION_RECHAZ │  │  COTIZACION_ACEPTADA  │
  └──┬───────────────┘  └───────────┬───────────┘
     │                              │ conversión
     │                              ↓
     │                    ┌──────────────────────────────┐
     │                    │ COTIZACION_CONVERTIDA_EN_OT  │
     │                    └──────────────────────────────┘
     │
     └──→ Cualquier estado → COTIZACION_CANCELADA (requiere motivo > 10 chars)
          COTIZACION_CANCELADA → COTIZACION_BORRADOR (si se elimina el motivo)
```

### Reglas de aprobación por monto

| Monto | Aprobaciones requeridas |
|---|---|
| < $10M COP | Comercial |
| $10M - $50M COP | Comercial + Director Comercial |
| > $50M COP | Comercial + Director + Gerente |

---

## 5. Orden de Trabajo

```
                    ┌─────────────────┐
                    │  OT_PROGRAMADA  │
                    └───────┬─────────┘
                            │ inicio
                            ↓
                    ┌───────────────────┐
            ┌──────│  OT_EN_EJECUCION  │──────┐
            │      └────────┬──────────┘      │
            │               │                  │
            │  pausa        ↓ finalización     │ pausa
            ↓        ┌──────────────┐          ↓
  ┌──────────────┐   │OT_EN_VERIFIC.│  ┌──────────────┐
  │  OT_PAUSADA  │   └──────┬───────┘  │  OT_PAUSADA  │
  └──────┬───────┘          │ aprob.   └──────────────┘
         │                  ↓
         │         ┌─────────────────┐
         └────────→│  OT_FINALIZADA  │ → genera FACTURA
                   └─────────────────┘ → activa GARANTIA (12 meses)

  Cualquier estado → OT_CANCELADA (requiere motivo > 10 chars)
```

---

## 6. Factura

```
                    ┌───────────────────┐
                    │ FACTURA_BORRADOR  │
                    └─────────┬─────────┘
                              │ emisión
                              ↓
                    ┌───────────────────┐
                    │  FACTURA_EMITIDA  │
                    └─────────┬─────────┘
                              │ pago parcial
                              ↓
                    ┌──────────────────────────┐
                    │  FACTURA_PAGADA_PARCIAL   │──────┐
                    └─────────┬────────────────┘      │
                              │ pago total              │ pago total
                              ↓                         │
                    ┌──────────────────────────┐       │
                    │  FACTURA_PAGADA_TOTAL    │←──────┘
                    └──────────────────────────┘

  FACTURA_EMITIDA → FACTURA_VENCIDA (si fecha vencimiento < hoy y no pagada)
  Cualquier estado → FACTURA_ANULADA (requiere NC)
```

### Factura mínima

$50,000 COP (configurable por tenant).

---

## 7. Pago

```
                    ┌────────────────┐
                    │  PAGO_PENDIENTE │
                    └───────┬────────┘
                            │ Wompi callback
                            ↓
                    ┌──────────────────┐
                    │ PAGO_PROCESANDO  │
                    └───────┬──────────┘
                            │ confirmación
                            ↓
                    ┌────────────────┐
                    │ PAGO_CONFIRMADO│
                    └────────────────┘

          PAGO_PROCESANDO → PAGO_RECHAZADO
          PAGO_CONFIRMADO → PAGO_REVERSADO
```

---

## 8. Garantía

```
                    ┌────────────────────┐
                    │   GARANTIA_ACTIVA  │ ← Inicio: OT finalizada
                    └─────────┬──────────┘
                              │ reclamo
                              ↓
                    ┌────────────────────┐
                    │ GARANTIA_EN_RECLAMO│
                    └─────────┬──────────┘
                              │ evaluación
                              ↓
                    ┌──────────────────────┐
                    │ GARANTIA_EN_EVALUAC. │
                    └─────────┬────────────┘
                              │
                  ┌───────────┴───────────┐
                  ↓                       ↓
        ┌──────────────────┐   ┌────────────────────┐
        │ GARANTIA_APROBADA│   │ GARANTIA_RECHAZADA │
        └────────┬─────────┘   └──────────┬─────────┘
                 │                        │
                 └──────────┬─────────────┘
                            ↓
                  ┌────────────────────┐
                  │  GARANTIA_CERRADA  │
                  └────────────────────┘

        GARANTIA_ACTIVA → GARANTIA_VENCIDA (12 meses + sin reclamo)
```

---

## 9. Órdenes de Compra

```
                    ┌───────────┐
                    │  BORRADOR │
                    └─────┬─────┘
                          │ envío
                          ↓
                    ┌───────────┐
                    │  ENVIADA  │
                    └─────┬─────┘
                          │ aceptación
                          ↓
                    ┌───────────┐
                    │  ACEPTADA │
                    └─────┬─────┘
                          │ recepción
                          ↓
              ┌───────────┴───────────┐
              ↓                       ↓
        ┌───────────┐          ┌───────────┐
        │  PARCIAL  │          │  RECIBIDA │
        └─────┬─────┘          └─────┬─────┘
              │                      │ facturación
              │ recep total          ↓
              ↓               ┌────────────┐
        ┌───────────┐         │  FACTURADA │
        │  RECIBIDA │         └─────┬──────┘
        └───────────┘               │ pago
                                    ↓
                              ┌───────────┐
                              │  PAGADA   │
                              └───────────┘

  Cualquier estado → CANCELADA (requiere motivo > 10 chars)
```

---

## 10. Producto (Inventario)

```
                    ┌─────────────────┐
                    │     ACTIVO      │ ← Creación
                    └────────┬────────┘
                             │ baja
                             ↓
                    ┌─────────────────┐
                    │   INACTIVO      │
                    └─────────────────┘
                             │ reactivación
                             ↓
                    ┌─────────────────┐
                    │     ACTIVO      │
                    └─────────────────┘
```

### Estados de Serie

```
Disponible → Reservado → Instalado
                         → En Reparación → Disponible
                         → Prestado → Disponible
         → Baja
```

### Estados de Lote

```
Disponible → Consumido
          → Reservado → Disponible
          → Bloqueado
          → Vencido (automático por fecha)
```

---

## 11. Solicitud de Compra

```
                    ┌────────────┐
                    │  PENDIENTE │
                    └─────┬──────┘
                          │ revisión
                          ↓
              ┌───────────┴───────────┐
              ↓                       ↓
        ┌───────────┐           ┌───────────┐
        │  APROBADA │           │ RECHAZADA │
        └─────┬─────┘           └───────────┘
              │ cotización
              ↓
        ┌───────────┐
        │ COTIZANDO │
        └─────┬─────┘
              │ proveedor seleccionado
              ↓
        ┌───────────┐
        │ CONVERTIDA │ → genera OC
        └───────────┘

  Cualquier estado → CANCELADA (requiere motivo)
```

---

## 12. Plantilla de Contrato

```
BORRADOR → ACTIVO → ARCHIVADO
```
