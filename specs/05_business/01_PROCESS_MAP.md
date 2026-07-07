# PROCESS MAP — Mapa Completo de Procesos

## 1. Proceso Global

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        LANDING PAGE PÚBLICA                              │
│                                                                          │
│  Visitante → Navega catálogo → Usa calculadora → Se interesa            │
│                                          ↓                               │
│                                   ┌──────────────┐                       │
│                                   │    WIZARD     │                       │
│                                   │ Lead Capture  │                       │
│                                   │ 5-7 preguntas │                       │
│                                   └──────┬───────┘                       │
└──────────────────────────────────────────┼──────────────────────────────┘
                                           ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                              CRM                                          │
│                                                                           │
│  LEAD_NUEVO → LEAD_CONTACTADO → LEAD_CALIFICADO → LEAD_CONVERTIDO        │
│       ↓              ↓                                                ↓  │
│  LEAD_DESCARTADO  LEAD_NO_CALIFICA                    ┌──────────────┐  │
│                                                       │   CLIENTE    │  │
│                                                       └──────┬───────┘  │
└──────────────────────────────────────────────────────────────┼──────────┘
                                                               ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                         REQUERIMIENTO                                     │
│                                                                           │
│  REQUERIMIENTO_ABIERTO → EN_EVALUACION → PRESUPUESTADO → APROBADO        │
│                                                                           │
│                          ↓ Ingeniería                                     │
│                     (CFD, planos, cálculos)                              │
│                                           ↓                               │
│                                  ┌──────────────┐                         │
│                                  │  COTIZACIÓN   │                         │
│                                  │ BORRADOR →    │                         │
│                                  │ ENVIADA →     │                         │
│                                  │ ACEPTADA →    │                         │
│                                  │ CONVERTIDA    │                         │
│                                  └──────┬───────┘                         │
└─────────────────────────────────────────┼───────────────────────────────┘
                                          ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                        ORDEN DE TRABAJO                                   │
│                                                                           │
│  OT_PROGRAMADA → OT_EN_EJECUCION → EN_VERIFICACION → OT_FINALIZADA       │
│       ↓                ↓                                                  │
│  OT_CANCELADA     OT_PAUSADA                                             │
│                                                                           │
│       ┌──────────┬──────────┬──────────┐                                  │
│       │ Checkl.  │ Material │ Mano de  │                                  │
│       │ Técnico  │ (Invent) │ Obra     │                                  │
│       └──────────┴──────────┴──────────┘                                  │
└──────────────────────────────────────────────────────────────────────────┘
                                          ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                          FACTURACIÓN                                      │
│                                                                           │
│  FACTURA_BORRADOR → EMITIDA → PAGO_PARCIAL → PAGO_TOTAL                 │
│                                ↑               ↑                          │
│                           ┌──────────────┐     │                          │
│                           │    PAGOS     │     │                          │
│                           │ (Wompi/PSE/  │─────┘                          │
│                           │  Transfer.)  │                                │
│                           └──────────────┘                               │
│                                                                           │
│  FACTURA_BORRADOR → ANULADA (NC)                                         │
└──────────────────────────────────────────────────────────────────────────┘
                                          ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                          GARANTÍA                                         │
│                                                                           │
│  GARANTIA_ACTIVA (12 meses) → EN_RECLAMO → EN_EVALUACION                │
│                                    ↓                ↓                     │
│                              APROBADA ←      RECHAZADA                   │
│                                    ↓                ↓                     │
│                              GARANTIA_CERRADA    GARANTIA_CERRADA        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Relaciones entre Entidades

```
                    ┌─────────────┐
                    │   TENANT    │
                    │ (Empresa)   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ↓            ↓            ↓
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ USUARIO  │ │  ROLES   │ │ SETTINGS │
        └─────┬────┘ └──────────┘ └──────────┘
              │
    ┌─────────┼─────────┬──────────┬──────────┐
    ↓         ↓         ↓          ↓          ↓
┌──────┐ ┌──────┐ ┌──────┐ ┌─────────┐ ┌──────────┐
│ LEAD │←│EMPRESA│→│CLIENTE│→│CONTACTO │ │OPORTUNIDAD│
└──┬───┘ └──────┘ └──┬───┘ └─────────┘ └──────────┘
   │                  │
   │     ┌────────────┘
   │     ↓
   │  ┌──────────────┐
   │  │ REQUERIMIENTO│← DIAGNÓSTICO
   │  └──────┬───────┘
   │         ↓
   │  ┌──────────────┐     ┌────────────────┐
   │  │  COTIZACIÓN  │────→│ COTIZACION_VER │
   │  └──────┬───────┘     └────────────────┘
   │         ↓
   │  ┌──────────────┐
   │  │ ORDEN_TRABAJO│→ TAREAS → CHECKLIST
   │  └──────┬───────┘→ MATERIALES (de INVENTARIO)
   │         ↓
   │  ┌──────────────┐
   │  │   FACTURA    │→ → → → ┌──────────┐
   │  └──────┬───────┘        │   PAGO   │
   │         ↓                └──────────┘
   │  ┌──────────────┐
   │  │   GARANTIA   │
   │  └──────────────┘
   │
   ↓
┌──────────────┐
│   INVENTARIO │← ← ← ← PRODUCTOS ← ← SERIES, LOTES
│   KARDEX     │← ← ← ← MOVIMIENTOS
└──────┬───────┘
       ↓
┌──────────────┐     ┌──────────────┐
│   COMPRAS    │────→│  PROVEEDOR   │
│  SOLICITUD → │     └──────────────┘
│  OC → RECEP  │
└──────────────┘
```

---

## 3. Flujos por módulo

### 3.1 CRM

```
Lead entra (web)
  → Scoring automático (35+ = calificado, 60+ = inmediato)
  → Asignación a comercial
  → Contacto (call, WhatsApp, email)
  → Calificación
  → Conversión a Cliente + Oportunidad
```

### 3.2 Ventas (Cotización)

```
Requerimiento activo
  → Diagnóstico técnico
  → Cotización BORRADOR
  → Aprobación interna (según monto)
  → Envío al cliente
  → Negociación
  → Aceptación → Convertir en OT
```

### 3.3 Compras

```
Producción/Inventario detecta necesidad
  → Solicitud de compra (justificación)
  → Aprobación interno
  → Cotización a proveedores (mín. 3 para > $5M)
  → Comparador → Selección
  → OC emitida
  → Recepción (total/parcial)
  → Factura proveedor → Pago
  → Actualización de inventario
```

### 3.4 Órdenes de Trabajo

```
Cotización aceptada
  → OT_PROGRAMADA (planificación)
  → Asignación de equipo y materiales
  → OT_EN_EJECUCION
  → Checklist técnico
  → OT_EN_VERIFICACION
  → Entrega al cliente
  → OT_FINALIZADA
  → Generación de factura
  → Activación de garantía (12 meses)
```

### 3.5 Facturación

```
OT_FINALIZADA
  → FACTURA_BORRADOR
  → FACTURA_EMITIDA (envío al cliente)
  → Pago parcial o total (Wompi/PSE/Transferencia)
  → FACTURA_PAGADA_TOTAL
  → Si vence sin pago: FACTURA_VENCIDA
```

### 3.6 Inventario

```
OC Recepcionada → Entrada a inventario
  → Producto con: Stock, Reservado, Disponible
  → Movimientos registrados en Kardex
  → Salidas: por OT, por venta, por ajuste
  → Alertas: stock bajo, stock crítico, lote vencido
```

---

## 4. SLA y tiempos

| Proceso | SLA | Condición |
|---|---|---|
| Lead score > 60 | 30 min | Contacto inmediato |
| Lead score > 35 | 2 horas | Contacto preferente |
| Lead score < 35 | 24 horas | Contacto estándar |
| Cotización | 72 horas | Desde solicitud |
| OT Urgente | 24 horas | Desde asignación |
| Factura pago | 30 días | Plazo estándar |
| Garantía | 48 horas | Desde apertura de reclamo |

---

## 5. Convenciones de nomenclatura

| Elemento | Formato | Ejemplo |
|---|---|---|
| Estados | `MAYUSCULAS_SOSTENIDAS` | `LEAD_CONTACTADO`, `EN_EJECUCION` |
| Códigos | `PREFIJO-0000` | `COT-0042`, `OT-0018`, `FAC-0089` |
| Eventos | `verbo_pasado` | `lead.created`, `invoice.paid` |
| Permisos | `modulo.accion` | `leads.create`, `invoices.delete` |
| Roles | `MAYUSCULAS` | `ADMIN`, `EJECUTIVO_COMERCIAL` |
