# VISIÓN DEL PRODUCTO

## Identidad

Este **NO** es un CRUD.
Este **NO** es una aplicación de órdenes de trabajo.
Este **NO** es un MVP desechable.

Este sistema es una **plataforma B2B Premium de gestión empresarial** para empresas de ingeniería industrial.

---

## Qué resuelve

Cubre el ciclo de vida completo del negocio:

```
Visitante anónimo → Lead → MQL → SQL → Cliente → Cotización → Trabajo → Factura → Pago → Garantía
```

Unifica en un solo sistema: adquisición web, CRM, cotización, operaciones, inventario, facturación y post-venta.

---

## Vertical de negocio

Empresas de **ingeniería HVAC / ventilación industrial** que fabrican, venden, instalan, mantienen y reparan sistemas de extracción y climatización.

**Mercado objetivo**: Colombia y LATAM. Clientes finales: plantas industriales, minería, data centers, bodegas, talleres metalmecánicos.

---

## Prioridades de diseño

| Prioridad | Significado |
|---|---|
| **Trazabilidad** | Cada acción tiene actor, fecha, valores anteriores y nuevos |
| **Auditoría** | Doble registro: técnico (diff JSONB) + semántico (eventos de negocio) |
| **Escalabilidad** | Funciona con 1 o 1000 empresas, 1 o 10000 usuarios |
| **Mantenibilidad** | Código modular, tipos centralizados, sin deuda técnica consciente |
| **Multiempresa** | Aislamiento total por tenant desde el día uno |
| **Consistencia** | Mismos patrones en CRM, operaciones, finanzas y post-venta |
| **Experiencia corporativa** | Clara, profesional, rápida, confiable. Inspiración: Siemens, ABB, SAP Fiori |

---

## Reglas fundacionales

Estas reglas no se negocian. Gobiernan toda decisión de producto:

| # | Regla |
|---|---|
| 1 | **NO CONSTRUIR NADA SIN TRAZABILIDAD.** Toda tabla, campo, API, pantalla, acción, estado debe responder: ¿Por qué existe? ¿Qué requisito lo originó? ¿Qué proceso soporta? |
| 2 | **NO INVENTAR.** Si algo no está definido: DETENERSE. Generar preguntas. Esperar respuesta. Nunca asumir. |
| 3 | **CONSTRUIR POR CAPAS.** Orden obligatorio: 1. Reglas de negocio, 2. Modelo funcional, 3. Modelo de datos, 4. Seguridad, 5. Backend, 6. Frontend, 7. Automatización, 8. KPIs. Nunca al revés. |
| 4 | **CONSTRUIR POR VERTICALES CERRADAS.** Completar Cliente → validar → completar Requerimiento → validar → completar Cotización → validar. |
| 5 | **TODO DEBE SER AUDITABLE.** Registrar: creación, edición, borrado lógico, cambios de estado, aprobaciones, rechazos, comentarios. |
| 6 | **TODO DEBE SER MULTIEMPRESA.** Antes de crear cualquier entidad preguntar: ¿Pertenece a un tenant? Si sí: aislar desde el inicio. Nunca agregarlo después. |
| 7 | **NO CREAR CAMPOS FUTUROS.** No crear `estimated_cost`, `internal_code`, `project_type` porque parecen útiles. Si no está definido: no existe. |
| 8 | **NO HACER TESTS GLOBALES.** Cada módulo debe tener su propio test, su propio seed, su propia validación. Prohibido ejecutar suite de 45 minutos. |
| 9 | **ENTREGAR DESPUÉS DE CADA FASE:** Construido, Validado, Pendiente, Riesgos, Preguntas. Luego detenerse. |
| 10 | **NO REFACTORIZAR POR GUSTO.** Solo modificar: lo solicitado, lo directamente impactado. Prohibido reestructurar módulos estables. |
| 11 | **EXPERIENCIA B2B PREMIUM.** Toda pantalla debe transmitir: Claridad, Profesionalismo, Velocidad, Confianza. Evitar: interfaces infantiles, componentes innecesarios, efectos visuales excesivos. |
| 12 | **DOCUMENTAR MIENTRAS SE CONSTRUYE.** Cada módulo debe generar: docs funcionales, docs técnicos, casos de uso, dependencias. No al final. Durante la construcción. |
| 13 | **NINGUNA FASE TERMINA SIN VALIDACIÓN.** Debe tener: migración validada, seguridad validada, tipos validados, permisos validados, flujo validado. |
| 14 | **PENSAR COMO ERP.** Antes de cualquier decisión: ¿Esto funcionará con 10/100/1000 usuarios? ¿10/100 empresas? Si no: Rediseñar. |

---

## No objetivos

El producto explícitamente **no es** ni será:

- Un CRM genérico (ventas B2C, retail, e-commerce)
- Un sistema contable completo
- Un WMS (warehouse management system) especializado
- Una plataforma de e-commerce transaccional
- Un sistema de nómina o RRHH
- Un reemplazo de SAP u Oracle ERP

---

## Filosofía

> "Es mejor detener el proyecto 20 veces para hacer preguntas que avanzar una sola vez inventando requisitos."

> "Si una implementación incumple un solo pilar de la Constitución Técnica deberá ser rechazada y rediseñada."

> "Es preferible hacer 50 fases pequeñas correctamente que 5 fases grandes incorrectamente."
