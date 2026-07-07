# MISIÓN DEL PRODUCTO

## Propósito

Proveer una plataforma SaaS multiempresa que permita a empresas de ingeniería industrial gestionar todo su ciclo de negocio —desde la adquisición digital de clientes hasta la garantía post-venta— con trazabilidad total, cero pérdida de información y una experiencia corporativa premium.

---

## Promesa de valor

Unificar en un solo sistema lo que normalmente requiere 4-5 herramientas desconectadas:

| Área | Herramienta típica | En este sistema |
|---|---|---|
| Adquisición web | WordPress + plugins | Landing + Wizard + Catálogo integrado |
| CRM / Leads | Salesforce, HubSpot | Scoring automático + SLA + pipeline |
| Cotización | Excel, PDFs manuales | Cotizador con items, descuentos, IVA, versionado |
| Operaciones | Hojas de ruta en papel | Jobs + actividades + checklist digitales |
| Inventario | Tarjetas de bodega | Stock multi-bodega + movimientos + alertas |
| Facturación | Contabilidad externa | Facturas + pagos parciales + anticipos |
| Post-venta | Correos y llamadas | Garantías automáticas + portal de autoservicio |

---

## Principios operativos

| Principio | Significado |
|---|---|
| **Eficiencia operativa** | Reducir tiempos entre lead → cotización → ejecución → cobro |
| **Trazabilidad total** | Cada acción en el sistema tiene responsable, timestamp y registro histórico |
| **Experiencia B2B premium** | Interfaz profesional, clara, rápida — no un "dashboard genérico" |
| **Aislamiento por empresa** | Cada tenant opera con datos completamente separados via RLS |
| **Cero pérdida de datos** | Soft delete universal. Nada se borra físicamente. Nada se pierde. |

---

## Usuarios objetivo

### Primarios (usuarios del ERP)

- **Gerentes y Directores** — toman decisiones basadas en KPIs y reportes
- **Ejecutivos Comerciales** — capturan leads, crean cotizaciones, cierran ventas
- **Ingenieros de Proyectos** — diseñan soluciones técnicas, gestionan requerimientos
- **Técnicos de Campo** — ejecutan trabajos, registran horas y materiales
- **Jefes de Inventario** — controlan stock, aprueban movimientos
- **Personal de Finanzas** — emiten facturas, registran pagos, gestionan cartera
- **Administradores** — configuran el sistema, gestionan usuarios y white label

### Secundarios (usuarios del portal)

- **Clientes externos** — ven cotizaciones, pagan facturas, abren casos de garantía, descargan documentos

---

## Non-negotiables

Ninguna fase, módulo, migración, componente o refactorización podrá violar estos principios:

1. **Multiempresa obligatorio.** `tenant_id` en toda tabla operacional. RLS desde el día uno.
2. **Soft delete obligatorio.** DELETE físico prohibido en toda tabla comercial/operacional.
3. **Auditoría doble obligatoria.** `audit_log` (técnico, diff JSONB) + `business_events` (semántico, inmutable).
4. **Códigos secuenciales por tenant.** `tenant_sequences` con bloqueo a nivel fila. Prohibido `MAX(id) + 1`.
5. **Estados en mayúsculas sostenidas.** `EN_REVISION`, `APROBADA`, `CANCELADO`. Sin excepciones.
6. **Cancelación requiere motivo.** Mínimo 10 caracteres. Validado por trigger.
7. **White Label total.** Todo logo, color, texto, configuración debe ser administrable desde el ERP sin recompilar.
8. **Cero hardcoding.** Prohibido codificar colores, logos, teléfonos, textos, URLs en el código fuente.
9. **Tipado estricto.** Prohibido `any` sin justificación documentada. Zod para validación de entrada.
10. **RSC por defecto.** React Server Components como norma. Client Components solo con interacción real.

---

## Medición de éxito

| Indicador | Métrica objetivo |
|---|---|
| Tiempo lead → cotización | < 4 horas hábiles (SLA media) |
| Tiempo cotización → trabajo | < 72 horas hábiles (SLA alta) |
| Cumplimiento SLA de leads | > 95% dentro del tiempo asignado |
| Disponibilidad del sistema | > 99.5% |
| Tiempo de carga landing page | < 3 segundos con 200 productos |
| Cobertura de pruebas | > 60% en servicios y utilidades |
| Tiempo de onboarding nuevo tenant | < 1 hora sin intervención de desarrollo |
