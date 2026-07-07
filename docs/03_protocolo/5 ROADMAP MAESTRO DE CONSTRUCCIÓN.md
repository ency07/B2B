# ROADMAP MAESTRO DE CONSTRUCCIÓN

## OBJETIVO

Construir el sistema completo desde cero de forma incremental, verificable y sin refactorizaciones masivas.

---

# FASE 0 - DESCUBRIMIENTO

Objetivo:

Congelar reglas de negocio.

Entregables:

* Documento maestro de descubrimiento
* Alcance
* Restricciones
* Catálogo de decisiones aprobadas
* Catálogo de preguntas abiertas

Criterio de salida:

No existen contradicciones funcionales.

---

# FASE 1 - MODELO FUNCIONAL

Objetivo:

Definir completamente cada entidad.

Entregables:

## Cliente

* Campos
* Validaciones
* Relaciones

## Requerimiento

* Campos
* Estados
* Validaciones

## Cotización

* Campos
* Versiones
* Estados

## Trabajo

* Campos
* Estados
* Transiciones

## Documento

* Campos
* Versionado

## Factura

* Campos
* Validaciones

## Pago

* Campos

## Garantía

* Campos

Criterio de salida:

No existe ningún campo pendiente de definición.

---

# FASE 2 - MODELO DE DATOS

Objetivo:

Diseñar la base de datos.

Entregables:

* ERD
* Relaciones
* Índices
* Restricciones
* Auditoría
* Multiempresa

Criterio:

ERD aprobado.

---

# FASE 3 - ARQUITECTURA

Objetivo:

Definir arquitectura técnica.

Entregables:

* Frontend
* Backend
* Supabase
* Storage
* Notificaciones
* Auditoría

Criterio:

Arquitectura congelada.

---

# FASE 4 - FUNDACIÓN

Construir:

* Repositorio
* Configuración
* CI/CD
* Entornos
* Variables
* Linter
* TypeScript

Prueba:

validate-foundation

---

# FASE 5 - MULTITENANT

Construir:

* Tenant
* Usuarios
* Roles
* Permisos
* Sedes
* Áreas

Prueba:

test-multitenant

---

# FASE 6 - AUTENTICACIÓN

Construir:

* Login
* Logout
* Recuperación
* Sesiones
* RLS

Prueba:

test-auth

---

# FASE 7 - CLIENTES

Construir:

* CRUD
* Historial
* Auditoría

Prueba:

test-clientes

---

# FASE 8 - REQUERIMIENTOS

Construir:

* Registro
* Estados
* Seguimiento
* Evidencias

Prueba:

test-requerimientos

---

# FASE 9 - COTIZACIONES

Construir:

* Cotizaciones
* Versionado
* Historial

Prueba:

test-cotizaciones

---

# FASE 10 - APROBACIONES BÁSICAS

Construir:

* Flujo aprobación
* Rechazo
* Ajustes

Prueba:

test-aprobaciones

---

# FASE 11 - TRABAJOS

Construir:

* Orden trabajo
* Estados
* Bitácora

Prueba:

test-trabajos

---

# FASE 12 - DOCUMENTOS

Construir:

* Documentos
* Versiones
* Adjuntos
* Fotografías

Prueba:

test-documentos

---

# FASE 13 - ALERTAS

Construir:

* Eventos
* Notificaciones
* Bandeja

Prueba:

test-alertas

---

# FASE 14 - ESCALAMIENTO

Construir:

* Recordatorios
* Escalamiento automático

Prueba:

test-escalamiento

---

# FASE 15 - APROBACIONES AVANZADAS

Construir:

* Paralelas
* Secuenciales
* Mixtas

Prueba:

test-aprobaciones-avanzadas

---

# FASE 16 - FACTURACIÓN

Construir:

* Facturas
* Estados
* Historial

Prueba:

test-facturas

---

# FASE 17 - PAGOS

Construir:

* Pagos
* Comprobantes
* Aplicación pagos

Prueba:

test-pagos

---

# FASE 18 - GARANTÍAS

Construir:

* Garantías
* Seguimiento
* Cierre

Prueba:

test-garantias

---

# FASE 19 - KPIs

Construir:

* Comercial
* Operacional
* Financiero
* Rentabilidad

Prueba:

test-kpis

---

# FASE 20 - DASHBOARDS

Construir:

* Ejecutivo
* Operacional
* Financiero

Prueba:

test-dashboard

---

# FASE 21 - COSTOS

Construir:

* Materiales
* Mano de obra
* Terceros
* Gastos

Prueba:

test-costos

---

# FASE 22 - RENTABILIDAD

Construir:

* Por trabajo
* Por cliente

Prueba:

test-rentabilidad

---

# FASE 23 - INVENTARIO

Construir:

* Existencias
* Movimientos
* Consumos

Prueba:

test-inventario

---

# FASE 24 - PLANTILLAS

Construir:

* Cotización
* Orden trabajo
* Acta
* Garantía
* Informe

Prueba:

test-plantillas

---

# FASE 25 - INTEGRACIONES

Construir:

* Correo
* WhatsApp
* API

Prueba:

test-integraciones

---

# FASE 26 - SEGURIDAD

Construir:

* RLS
* Permisos
* Auditoría

Prueba:

test-security

---

# FASE 27 - AUDITORÍA

Construir:

* Log cambios
* Log accesos
* Log aprobaciones

Prueba:

test-auditoria

---

# FASE 28 - HARDENING

Construir:

* Optimización
* Índices
* Rendimiento

Prueba:

test-performance

---

# FASE 29 - UAT

Construir:

* Casos negocio
* Validación funcional

Prueba:

test-uat

---

# FASE 30 - RELEASE

Construir:

* Producción
* Backups
* Monitoreo

Prueba:

go-live-checklist

---

# FASE 31 - CENTRO DE CONFIGURACIÓN EMPRESARIAL

Construir:

* Información legal de la empresa
* Localización, moneda, zona horaria y formatos
* Logotipos (Claro, Oscuro, PDF, Login, Favicon)
* Configuración visual y legal del ERP

Prueba:

test-settings

---

# FASE 32 - WHITE LABEL

Construir:

* Interfaz dinámica y colores según tenant
* Personalización de pantallas (Login, Error 404/500, Carga)
* Soporte multiempresa visual sin cambios de código

Prueba:

test-white-label

---

# FASE 33 - INTEGRACIONES Y CANALES

Construir:

* Email (SMTP, Resend, Sendgrid, Mailgun)
* Mensajería (WhatsApp, Telegram)
* Pasarelas de Pago (Stripe, MercadoPago, PayPal, Wompi)
* Enrutamiento dinámico de telefonía

Prueba:

test-integraciones-canales

---

# FASE 34 - ADMINISTRACIÓN AVANZADA

Construir:

* Mapeo y renombrado dinámico de módulos
* Campos personalizados (Custom Fields JSONB)
* Motor de reglas de automatización visual

Prueba:

test-administracion-avanzada

---

# REGLA OBLIGATORIA

Nunca avanzar a la siguiente fase si:

* Hay errores TypeScript.
* Hay migraciones pendientes.
* Hay pruebas fallidas.
* Hay decisiones sin definir.

Si falta información:

DETENERSE.

PREGUNTAR.

NO INVENTAR.
