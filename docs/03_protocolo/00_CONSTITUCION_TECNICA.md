# CONSTITUCIÓN TÉCNICA 
## Versión 2.0
### Norma Suprema de Arquitectura, Desarrollo y Operación

---

# OBJETIVO

Esta Constitución define las reglas técnicas supremas del ERP.

Ninguna fase, módulo, migración, componente, pantalla, API, Server Action, Trigger, función SQL, integración o refactorización podrá violar alguno de estos principios.

Si una implementación incumple un solo pilar deberá ser rechazada y rediseñada.

---

# PILAR I
# React Server Components (RSC)

## Principio

Toda la plataforma deberá aprovechar al máximo la arquitectura nativa de Next.js.

## Obligatorio

- React Server Components por defecto.
- Client Components únicamente cuando exista interacción real.
- Prohibido cargar datos críticos mediante useEffect().
- Toda lectura debe hacerse desde el servidor.
- Persistir vistas mediante Query Parameters.

Ejemplo

```
/erp/leads?view=table

/dashboard/jobs?status=open
```

Nunca

```
const data = useEffect(...)
```

cuando pueda obtenerse desde el servidor.

---

# PILAR II
# Integridad Relacional

Toda relación empresarial debe existir mediante:

- UUID
- Foreign Keys
- Relaciones explícitas

Prohibido

- buscar por nombres
- relacionar mediante texto
- company_name
- customer_name
- email como identificador

Siempre

```
lead.client_id

client.id
```

Nunca

```
lead.company_name ==
customer.company_name
```

---

# PILAR III
# UX basada en Roles

Cada usuario visualizará únicamente aquello que necesita.

Ejemplo

Cliente

- pedidos
- facturas
- soporte

Técnico

- órdenes
- planos
- mantenimientos

Comercial

- erp
- Leads
- Cotizaciones

Director

- KPIs
- Reportes
- Finanzas

Administrador

- configuración
- usuarios
- auditoría

Este principio es únicamente visual.

Nunca reemplaza

- RBAC
- RLS
- Seguridad Backend

---

# PILAR IV
# UI Defensiva

La interfaz nunca puede romperse.

Valores nulos

mostrar

```
Sin información

No disponible

0

0 COP

0 CFM
```

Nunca mostrar

```
undefined

null

NaN
```

Los errores reales deben registrarse.

Nunca ocultarlos.

---

# PILAR V
# Tipado Estricto

Prohibido

```
any
```

salvo justificación documentada.

Toda entrada externa debe validarse mediante

- Zod
- TypeScript
- Drizzle

Toda Server Action debe inferir tipos desde Drizzle.

---

# PILAR VI
# Transacciones

Toda operación crítica debe ejecutarse dentro de

```
db.transaction()
```

Ejemplos

- aprobar cotización
- crear cliente
- convertir lead
- generar factura
- cerrar orden

Después de toda mutación

```
revalidatePath()
```

debe actualizar todas las vistas afectadas.

---

# PILAR VII
# Diseño Empresarial

Inspiración

- Siemens
- ABB
- Schneider
- SAP Fiori

Obligatorio

- alta densidad de información
- tipografía limpia
- fondos neutros
- bordes discretos
- consistencia
- productividad

Prohibido

- sombras exageradas
- gradientes innecesarios
- animaciones decorativas
- dashboards de juguete
- tarjetas gigantes
- gráficos sin utilidad

Toda gráfica deberá responder una pregunta de negocio.

Ejemplo

✔ Ventas por región

✔ Rentabilidad

✔ SLA

✔ Productividad

Nunca

❌ gráficos decorativos

❌ tarjetas sin información

❌ widgets vacíos

❌ números sin contexto

---

# PILAR VIII
# Responsive Industrial

Prohibido

```
h-screen

overflow-hidden
```

cuando impidan operar.

Preferir

```
min-h-screen

overflow-auto
```

Los teclados móviles nunca podrán ocultar

- botones
- formularios
- acciones

---

# PILAR IX
# Zero Trust

La seguridad vive en PostgreSQL.

Toda tabla crítica deberá tener

- RLS
- Tenant
- Usuario
- Rol
- Ownership

Aunque Next.js falle

la base de datos debe impedir el acceso.

---

# PILAR X
# Auditoría Inmutable

Toda acción crítica debe registrarse.

Registrar

- actor
- fecha
- IP
- navegador
- acción
- entidad
- valores anteriores
- valores nuevos

Si la auditoría falla

toda la transacción debe hacer

ROLLBACK

Prohibido

UPDATE

DELETE

sobre auditorías históricas.

---

# PILAR XI
# Protección Anti Abuso

Todo endpoint público debe asumir ataques.

Aplicar Rate Limiting a

- Login
- Wizard
- Cotizador
- Leads
- Contacto
- APIs públicas

Respuesta

```
429
```

cuando corresponda.

---

# PILAR XII
# Resiliencia

El sistema debe funcionar incluso con mala conexión.

Obligatorio

- Retry
- Loading
- Skeleton
- Timeout
- Mensajes claros

Nunca

- Pantalla blanca
- TypeError
- Aplicación congelada

---

# PILAR XIII
# Observabilidad

Toda excepción debe generar telemetría.

Registrar

- errores
- consultas lentas
- APIs
- autenticación
- Server Actions
- integraciones

Herramientas sugeridas

- Sentry
- OpenTelemetry
- Grafana
- PostHog

---

# PILAR XIV
# Reutilización Obligatoria

Antes de escribir código nuevo deberá realizarse

REUSE_ANALYSIS

en

- UI
- Backend
- Database
- Librerías
- APIs
- Open Source
- AI
- Infraestructura

Si existe una solución madura

queda prohibido reinventarla.

---

# PILAR XV
# Cero Hardcoding

Toda información empresarial deberá ser administrable.

Incluye

- logos
- favicon
- colores
- temas
- fuentes
- productos
- categorías
- imágenes
- PDFs
- banners
- textos
- FAQs
- formularios
- correos
- teléfonos
- WhatsApp
- Telegram
- redes sociales
- dominios
- SEO

Todo deberá cambiarse desde el ERP.

Nunca modificando código.

---

# PILAR XVI
# White Label Total

Cada tenant podrá modificar

- logo
- nombre comercial
- favicon
- loader
- login
- dashboard
- sidebar
- colores
- PDFs
- Emails
- Portal Cliente
- Landing
- Wizard
- Catálogo

Sin recompilar.

---

# PILAR XVII
# UX Funcional

Todo componente deberá tener una utilidad empresarial.

Prohibido

- gráficos vacíos
- KPIs decorativos
- botones sin acción
- pantallas de relleno
- tarjetas sin datos
- animaciones innecesarias

Cada pantalla deberá responder

¿Qué decisión ayuda a tomar?

¿Qué proceso acelera?

¿Qué problema resuelve?

Si no responde esas preguntas

no debe existir.

---

# PILAR XVIII
# Performance

Objetivo

Primera carga mínima.

Obligatorio

- Lazy Loading
- Dynamic Imports
- Server Components
- Streaming
- Suspense
- Cache inteligente

Evitar

- JS innecesario
- renders duplicados
- consultas repetidas

---

# PILAR XIX
# Escalabilidad

Toda nueva funcionalidad deberá soportar

- Multiempresa
- Multiusuario
- Multiidioma
- Multimoneda
- MultiSucursal
- MultiBodega

Sin rediseños futuros.

---

# PILAR XX
# Principio Supremo

Antes de aprobar cualquier cambio Antigravity deberá responder internamente:

1.

¿Viola alguno de los pilares?

2.

¿Existe una solución Open Source mejor?

3.

¿Esto puede administrarse desde el ERP?

4.

¿Genera deuda técnica?

5.

¿La UI aporta valor operativo?

6.

¿Escala a miles de empresas?

7.

¿Respeta Multi Tenant?

8.

¿Es reutilizable?

9.

¿Es auditable?

10.

¿Es consistente con toda la arquitectura?

Si cualquiera de las respuestas es NO

la implementación deberá detenerse y rediseñarse antes de escribir código.

---

# OBLIGATORIEDAD

Este documento tiene prioridad sobre cualquier otro documento del proyecto.

Toda fase futura deberá comenzar leyendo esta Constitución antes de generar código.

Ninguna excepción está permitida.