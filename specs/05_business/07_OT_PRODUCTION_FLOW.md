# OT & PRODUCTION FLOW — Órdenes de Trabajo y Producción

## 1. Flujo Maestro de OT

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      PLANIFICACIÓN                                        │
│                                                                          │
│  Fuente: COTIZACION_ACEPTADA                                             │
│       ↓                                                                  │
│  OT_PROGRAMADA                                                            │
│       │                                                                  │
│       ├── Asignación de responsable (supervisor + técnicos)             │
│       ├── Asignación de fechas (inicio + entrega estimada)              │
│       ├── Asignación de materiales (reserva en inventario)              │
│       ├── Definición de checklist técnica                                │
│       └── Definición de hitos (milestones)                               │
└─────────────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      EJECUCIÓN                                            │
│                                                                          │
│  OT_EN_EJECUCION                                                          │
│       │                                                                  │
│       ├── Tareas diarias (checklist)                                    │
│       ├── Consumo de materiales (registro en inventario)                │
│       ├── Registro de horas-hombre                                      │
│       ├── Registro de horas-máquina                                     │
│       ├── Fotografías / evidencias                                      │
│       └── Actualización de progreso (%)                                  │
│                                                                          │
│  Puede pausarse: OT_PAUSADA (razón requerida)                            │
│  Puede reanudarse: vuelve a OT_EN_EJECUCION                              │
└─────────────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      VERIFICACIÓN                                         │
│                                                                          │
│  OT_EN_VERIFICACION                                                       │
│       │                                                                  │
│       ├── Checklist final completado                                     │
│       ├── Verificación de calidad                                        │
│       ├── Pruebas de funcionamiento                                      │
│       ├── Aprobación del supervisor                                      │
│       └── Acta de entrega firmada                                        │
└─────────────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                      CIERRE                                               │
│                                                                          │
│  OT_FINALIZADA                                                            │
│       │                                                                  │
│       ├── Generación automática de FACTURA                               │
│       ├── Activación de GARANTÍA (12 meses)                              │
│       ├── Cálculo de rentabilidad real                                   │
│       ├── Encuesta de satisfacción                                       │
│       └── Cierre del expediente (archivo)                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Checklist Técnico

### Estructura del Checklist

Cada OT tiene un checklist definido según el tipo de servicio y los equipos involucrados.

```
Grupo: INSTALACIÓN MECÁNICA
  □ 1.1  Verificar cimentación y anclajes
  □ 1.2  Montaje de extractor en posición
  □ 1.3  Alineación de ejes
  □ 1.4  Torque de pernos (según especificación)
  □ 1.5  Instalación de ductos y dampers

Grupo: CONEXIÓN ELÉCTRICA
  □ 2.1  Verificar voltaje de alimentación
  □ 2.2  Conexión de motor (delta/estrella)
  □ 2.3  Instalación de variador de frecuencia
  □ 2.4  Configuración de protecciones
  □ 2.5  Prueba de arranque sin carga

Grupo: PRUEBAS DE RENDIMIENTO
  □ 3.1  Medición de CFM (anemómetro)
  □ 3.2  Medición de presión estática
  □ 3.3  Medición de consumo (amperaje)
  □ 3.4  Medición de vibración
  □ 3.5  Análisis de curva de rendimiento

Grupo: SEGURIDAD
  □ 4.1  Verificar guardas de seguridad
  □ 4.2  Verificar parada de emergencia
  □ 4.3  Señalización de área
  □ 4.4  Entrega de manuales al cliente
  □ 4.5  Capacitación básica a operadores
```

### Estados de checklist

| Estado | Significado |
|---|---|
| Pendiente | No iniciado |
| En progreso | Parcialmente completado |
| Completado | Todo conforme |
| No aplica | No requerido para esta OT |
| Observación | Completado con observaciones |

---

## 3. Gestión de Materiales en OT

### Flujo de Materiales

```
1. Planificación
   → Sistema verifica disponibilidad en inventario
   → Si no hay stock: genera alerta → sugiere solicitud de compra

2. Reserva
   → Materiales necesarios se RESERVAN en inventario
   → Stock: 100 → Disponible: 80 (Reservado: 20)

3. Consumo
   → Técnico registra consumo real en la OT
   → Sistema genera: MOVIMIENTO DE SALIDA en inventario
   → Stock: 80 → Disponible: 60 (Reservado: 0)

4. Devolución
   → Material no utilizado se devuelve a inventario
   → Stock: 60 → Disponible: 65
```

### Tabla de Materiales de OT

| Material | Cant. Plan | Cant. Real | Unidad | Costo Unit. | Costo Total |
|---|---|---|---|---|---|
| Extractor AX-HD-48 | 2 | 2 | un | $12,500,000 | $25,000,000 |
| Ducto Galvanizado Ø48" | 12 | 14 | m | $300,000 | $4,200,000 |
| Damper Motorizado | 2 | 2 | un | $2,400,000 | $4,800,000 |
| Perno Anclaje M20 | 16 | 16 | un | $25,000 | $400,000 |

**Si Cant. Real ≠ Cant. Plan → requiere justificación.**

---

## 4. Registro de Horas

### Horas-Hombre

| Técnico | Fecha | Horas | Actividad |
|---|---|---|---|
| Juan Pérez | 15 Ene | 8 | Montaje mecánico |
| Juan Pérez | 16 Ene | 8 | Conexión eléctrica |
| María Gómez | 15 Ene | 8 | Supervisión |
| María Gómez | 16 Ene | 8 | Pruebas |

### Horas-Máquina

| Máquina | Horas | Costo/Hora | Costo Total |
|---|---|---|---|
| Grúa 10T | 4 | $800,000 | $3,200,000 |
| Soldadora | 8 | $150,000 | $1,200,000 |
| Plataforma Elevadora | 8 | $400,000 | $3,200,000 |

---

## 5. Producción (Fabricación)

### Flujo de Producción

```
OT requiere fabricación
       ↓
ORDEN DE PRODUCCIÓN
       ↓
┌──────────────────────────────────────────────┐
│ DISEÑO → CORTE → SOLDADURA → PINTURA →       │
│ ENSAMBLE → PRUEBAS → EMPAQUE → DESPACHO      │
└──────────────────────────────────────────────┘
```

### Gantt de Producción

Cada paso tiene: inicio, fin, duración, responsable, estado, dependencias.

| Tarea | Inicio | Fin | Duración | Responsable | Estado |
|---|---|---|---|---|---|
| Diseño | 15 Ene | 17 Ene | 3d | Ing. Carlos | ✓ |
| Corte | 18 Ene | 20 Ene | 3d | Operario A | ✓ |
| Soldadura | 21 Ene | 25 Ene | 5d | Operario B | ◐ |
| Pintura | 26 Ene | 28 Ene | 3d | Operario C | ○ |
| Ensamble | 29 Ene | 02 Feb | 5d | Equipo A | ○ |
| Pruebas | 03 Feb | 05 Feb | 3d | Ing. Carlos | ○ |
| Empaque | 06 Feb | 07 Feb | 2d | Operario A | ○ |

**Leyenda:** ✓ Completado  ◐ En progreso  ○ Pendiente

### Control de Calidad (OEE)

| Indicador | Fórmula | Meta |
|---|---|---|
| Disponibilidad | Tiempo operativo / Tiempo planificado | > 90% |
| Rendimiento | Unidades producidas / Unidades teóricas | > 85% |
| Calidad | Unidades buenas / Total unidades | > 98% |
| OEE | Disponibilidad × Rendimiento × Calidad | > 75% |

---

## 6. Evidencias y Documentos de OT

| Tipo | Ejemplos |
|---|---|
| Fotografías | Antes/después, progreso, detalles técnicos |
| Planos | As-built, diagramas eléctricos |
| Mediciones | Reportes de CFM, presión, vibración |
| Firmas | Acta de entrega, aceptación del cliente |
| Certificados | Balanceo, calidad, garantía |
| Manuales | Operación, mantenimiento |

---

## 7. Rentabilidad de OT

### Panel de Costos

```
COSTOS DIRECTOS
  Materiales:           $34,400,000
  Mano de Obra:          $8,000,000
  Maquinaria:            $7,600,000
  Transporte:            $2,000,000
  Subcontratación:       $0
                         ───────────
  Subtotal Costos:      $52,000,000

COSTOS INDIRECTOS
  Ingeniería:            $4,000,000
  Administrativo:        $2,000,000
  Garantía (provisión):  $1,040,000
                         ───────────
  Subtotal Indirectos:   $7,040,000

COSTO TOTAL:            $59,040,000
PRECIO DE VENTA:       $125,000,000
MARGEN BRUTO:           $65,960,000 (52.8%)
```

---

## 8. KPIs de Operaciones

### KPIs Diarios

| KPI | Métrica |
|---|---|
| OTs activas | X |
| OTs completadas hoy | X |
| Técnicos en campo | X |
| Tareas pendientes | X |

### KPIs Mensuales

| KPI | Métrica |
|---|---|
| OTs completadas | X |
| Cumplimiento SLA | > 95% |
| Horas-hombre totales | X |
| Tiempo promedio por OT | X días |
| Margen promedio | > 30% |
| Satisfacción del cliente | > 4.5/5 |
| Re-trabajos (%) | < 2% |

---

## 9. Reglas de OT y Producción

1. **Nunca iniciar OT sin planificación aprobada.**
2. **Nunca ejecutar sin materiales disponibles.**
3. **Nunca cerrar OT sin checklist completo.**
4. **Nunca cerrar OT sin verificación de calidad.**
5. **Nunca cerrar OT sin visto bueno del supervisor.**
6. **Diferencias en consumo de materiales requieren justificación.**
7. **Toda OT finalizada genera garantía de 12 meses.**
8. **Toda OT finalizada genera factura (si aplica).**
9. **Toda tarea de checklist queda registrada con responsable, fecha y hora.**
10. **Toda OT se puede reconstruir completamente años después.**
