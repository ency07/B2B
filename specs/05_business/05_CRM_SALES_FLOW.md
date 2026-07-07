# CRM & SALES FLOW — Proceso Comercial Completo

## 1. Flujo Maestro de Ventas

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      ADQUISICIÓN (Top of Funnel)                         │
│                                                                          │
│  Canales:                                                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ Landing  │  │ Wizard   │  │ WhatsApp │  │ Llamada  │               │
│  │ Page     │  │ Web      │  │ Bot      │  │ Entrante │               │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘               │
│       └──────────────┴──────────────┴──────────────┘                     │
│                          ↓                                               │
│                   ┌─────────────┐                                        │
│                   │  LEAD NUEVO │                                        │
│                   └──────┬──────┘                                        │
└──────────────────────────┼──────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      CALIFICACIÓN                                         │
│                                                                           │
│  ┌───────────────────────────────────────────────────────────────┐       │
│  │ SCORING AUTOMÁTICO:                                           │       │
│  │  • Empresa con NIT (+10)    • Industria clave (+15)           │       │
│  │  • Cargo decisor (+10)      • Urgencia (+20)                  │       │
│  │  • Solicitó cotización (+15) • Descargó catálogo (+5)         │       │
│  │  • Calculadora CFM (+10)    • Correo corporativo (+5)         │       │
│  └───────────────────────────────────────────────────────────────┘       │
│                                                                           │
│  Score ≥ 60 → CONTACTO INMEDIATO (SLA 30 min)                            │
│  Score ≥ 35 → CONTACTO PREFERENTE (SLA 2 horas)                          │
│  Score < 35 → CONTACTO ESTÁNDAR (SLA 24 horas)                           │
└──────────────────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      CONTACTO Y CALIFICACIÓN                              │
│                                                                           │
│  Comercial contacta al lead vía:                                         │
│  ┌─────────┐  ┌──────────┐  ┌────────┐                                  │
│  │ Llamada │  │ WhatsApp │  │ Email  │                                  │
│  └────┬────┘  └────┬─────┘  └───┬────┘                                  │
│       └─────────────┴────────────┘                                       │
│                    ↓                                                      │
│  LEAD_CONTACTADO → {calificado, no_califica, descartado}                 │
└──────────────────────────────────────────────────────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────────────────────────┐
│                      NEGOCIACIÓN                                          │
│                                                                           │
│  LEAD_CALIFICADO → Visita técnica / Diagnóstico                          │
│                  ↓                                                        │
│                Cotización BORRADOR                                       │
│                  ↓                                                        │
│                Aprobación interna (según monto)                           │
│                  ↓                                                        │
│                COTIZACION_ENVIADA                                        │
│                  ↓                                                        │
│                Negociación (múltiples rounds)                             │
│                  ↓                                                        │
│         ┌───────┴───────┐                                                │
│         ↓               ↓                                                │
│   ACEPTADA         RECHAZADA                                             │
│         ↓                                                                 │
│   COTIZACION_CONVERTIDA_EN_OT                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Wizard de Captación (Landing Page)

### Objetivo

Convertir visitantes anónimos en leads calificados mediante un flujo guiado de 5-7 preguntas.

### Pasos del Wizard

```
┌──────────────────────────────────────────────────────────────┐
│ PASO 1: ¿Qué necesita?                                       │
│                                                              │
│ ○ Diseño e instalación nueva                                 │
│ ○ Reemplazo de equipo existente                              │
│ ○ Mantenimiento preventivo                                   │
│ ○ Auditoría energética                                       │
│ ○ Consultoría técnica                                        │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ PASO 2: ¿Qué tipo de espacio?                                │
│                                                              │
│ ○ Planta industrial (manufactura, bodega)                    │
│ ○ Data center / Sala de servidores                           │
│ ○ Planta de alimentos                                        │
│ ○ Planta química                                             │
│ ○ Minería / Túnel                                            │
│ ○ Otro: ___________                                          │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ PASO 3: Dimensiones aproximadas                              │
│                                                              │
│ Largo: _____ m   Ancho: _____ m   Alto: _____ m             │
│                                                              │
│ [Calculadora CFM integrada: muestra resultado estimado]      │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ PASO 4: Información de contacto                              │
│                                                              │
│ Nombre: ____________                                         │
│ Empresa: ____________                                        │
│ Cargo: ____________                                          │
│ Correo: ____________                                         │
│ Teléfono: ____________                                       │
│ Ciudad: ____________                                         │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│ RESULTADO:                                                   │
│                                                              │
│ ✅ Hemos recibido tu solicitud                               │
│                                                              │
│ CFM estimado: 42,500 CFM                                     │
│ Equipo sugerido: 2x Extractor Axial AX-HD-48                │
│                                                              │
│ Un ingeniero te contactará en menos de 24 horas.             │
│                                                              │
│ Mientras tanto, descarga nuestro catálogo técnico.           │
└──────────────────────────────────────────────────────────────┘
```

### Datos capturados del Wizard

| Campo | Fuente | Scoring |
|---|---|---|
| Necesidad | Paso 1 | Tipo de servicio |
| Sector | Paso 2 | Industria prioritaria? |
| Dimensiones | Paso 3 | Cálculo CFM |
| Nombre | Paso 4 | Identificación |
| Empresa | Paso 4 | ¿Tiene NIT? +10 |
| Cargo | Paso 4 | ¿Decisor? +10 |
| Correo | Paso 4 | ¿Corporativo? +5 |
| Teléfono | Paso 4 | ¿Válido? +5 |
| Ciudad | Paso 4 | Ubicación |

---

## 3. Pipeline de Ventas

### Etapas del Pipeline

```
NUEVO (10%) → CONTACTADO (20%) → DIAGNÓSTICO (40%) → COTIZACIÓN (60%)
→ NEGOCIACIÓN (80%) → GANADO (100%) / PERDIDO (0%)
```

### Embudo de Conversión (objetivos)

| Etapa | Oportunidades | Conversión |
|---|---|---|
| Nuevo | 100 | — |
| Contactado | 80 | 80% |
| Diagnóstico | 50 | 62.5% |
| Cotización | 30 | 60% |
| Negociación | 20 | 66.7% |
| Ganado | 12 | 60% |

**Tasa global: 12%** de leads a ventas.

---

## 4. Cotizaciones — Flujo de Aprobación

### Flujo de Aprobación por Monto

```
Cotización BORRADOR
    │
    ├── Monto < $10M COP
    │   └── Aprueba: Comercial (auto-aprobado)
    │
    ├── $10M ≤ Monto < $50M COP
    │   ├── 1. Comercial envía para aprobación
    │   ├── 2. Director Comercial revisa
    │   └── 3. Director Comercial APRUEBA / RECHAZA
    │
    └── Monto ≥ $50M COP
        ├── 1. Comercial envía
        ├── 2. Director Comercial revisa → aprueba técnicamente
        ├── 3. Gerente General revisa
        └── 4. Gerente APRUEBA / RECHAZA
```

### Margen mínimo por tipo de servicio

| Tipo | Margen mínimo |
|---|---|
| Venta de equipos | 25% |
| Instalación | 30% |
| Mantenimiento | 35% |
| Consultoría | 40% |
| Repuestos | 20% |

Si el margen está por debajo del mínimo → requiere aprobación adicional del Gerente.

---

## 5. Descuentos y Negociación

### Niveles de descuento autorizados

| Rol | Descuento máximo |
|---|---|
| EJECUTIVO_COMERCIAL | 5% |
| EJECUTIVO_COMERCIAL_SR | 10% |
| DIRECTOR_COMERCIAL | 15% |
| GERENTE | 20% |
| Descuentos > 20% | Requiere aprobación del dueño |

### Tipos de descuento

| Tipo | Aplicación |
|---|---|
| Porcentaje general (%) | Sobre el total de la cotización |
| Descuento por ítem | Sobre un producto/servicio específico |
| Descuento por pronto pago | Ej: 5% si paga en 7 días |
| Descuento por volumen | Ej: ≥ 3 unidades = 10% off |

---

## 6. Chat / WhatsApp Bot

### Flujo de Bot de WhatsApp

```
Cliente: "Hola"
Bot: "Bienvenido a AeroMax Industrial. ¿En qué podemos ayudarte?"
      "1️⃣  Cotizar equipo"
      "2️⃣  Estado de mi proyecto"
      "3️⃣  Hablar con un ingeniero"
      "4️⃣  Soporte técnico"

Cliente: "1"
Bot: "Perfecto. Cuéntame sobre tu necesidad:"
      "• ¿Qué tipo de espacio? (Planta, Data Center, Minería...)"
      "• ¿Dimensiones aproximadas?"
      "• ¿Urgencia?"

  [Sistema crea LEAD con la conversación]
  [Sistema notifica al comercial disponible]
```

---

## 7. Métricas y KPIs del Proceso Comercial

### KPIs Diarios

| KPI | Métrica |
|---|---|
| Leads nuevos | 15-30 / día |
| Tasa de contacto | > 80% en las primeras 2 horas |
| Tiempo promedio de contacto | < 1 hora |
| Cotizaciones enviadas | 5-10 / día |
| Tasa de aceptación | > 40% |

### KPIs Mensuales

| KPI | Métrica |
|---|---|
| Leads → Clientes | > 12% |
| Pipeline total | > $2,000M COP |
| Ingresos por ventas | Meta por comercial |
| Tiempo lead → cotización | < 4 horas hábiles |
| Tiempo cotización → cierre | < 7 días hábiles |

---

## 8. Reglas del Proceso Comercial

1. **Todo lead debe tener contacto en su ventana de SLA.**
2. **Toda cotización debe tener aprobación según monto.**
3. **Todo descuento debe estar autorizado por rol.**
4. **Ningún comercial puede aprobar sus propias cotizaciones si > $10M.**
5. **Toda interacción con el lead queda registrada en el timeline.**
6. **Todo lead descartado debe tener motivo.**
7. **Las cotizaciones tienen vigencia de 15-30 días (configurable).**
8. **Tres intentos de contacto sin respuesta → lead pasa a inactivo.**
