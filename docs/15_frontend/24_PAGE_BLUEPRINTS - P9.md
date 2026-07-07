# Blueprint — Centro de Configuración Empresarial (Settings)

---

# Filosofía

Configuración NO es una página con formularios.

Es el Centro de Administración completo del Tenant.

Desde aquí el administrador debe poder personalizar completamente el ERP sin tocar código.

Toda modificación debe reflejarse inmediatamente en toda la plataforma.

Debe ser el equivalente a:

Microsoft Admin Center

Salesforce Setup

Google Workspace Admin

AWS Console

Stripe Dashboard

---

# Objetivos

Administrar

Empresa

Sucursales

Usuarios

Roles

Permisos

White Label

Branding

Temas

Logos

Favicons

Correos

SMS

WhatsApp

Telefonía

API Keys

Integraciones

Storage

Backups

Seguridad

Licencias

Auditoría

Tenant

Todo desde un único módulo.

---

# Layout General

```

HEADER

↓

Sidebar Configuración

↓

Área Principal

↓

Panel Derecho

```

---

# HEADER

Mostrar

Empresa

Tenant

Plan

Estado

Licencia

Usuarios activos

Almacenamiento

Versión ERP

Botones

Guardar

Publicar Cambios

Restaurar

Exportar

Importar

Auditoría

---

Nunca ocultar acciones importantes.

---

# Sidebar

Debe ser fijo.

Nunca colapsar automáticamente.

Secciones

Empresa

↓

White Label

↓

Usuarios

↓

Roles

↓

Permisos

↓

Notificaciones

↓

Correos

↓

WhatsApp

↓

SMS

↓

Telefonía

↓

API Keys

↓

Integraciones

↓

Storage

↓

Seguridad

↓

Backups

↓

Auditoría

↓

Licencia

↓

Tenant

---

Nunca más de dos clics para llegar a cualquier configuración.

---

# Empresa

Información

Razón Social

Nombre Comercial

NIT

Dirección

Ciudad

País

Teléfono

Correo

Sitio Web

Zona Horaria

Idioma

Moneda

Formato Fecha

Formato Hora

Formato Moneda

---

Adjuntos

Logo

Logo oscuro

Logo claro

Logo impresión

Sello

Firma

---

Vista previa inmediata.

---

# White Label

Debe controlar TODO.

Nunca depender del desarrollador.

---

Logos

Principal

Horizontal

Vertical

Oscuro

Claro

Login

Sidebar

PDF

Emails

Loader

Login Background

---

Favicons

16x16

32x32

48x48

180x180

512x512

Safari

Android

Apple

PWA

---

Colores

Primario

Secundario

Terciario

Éxito

Advertencia

Error

Información

Sidebar

Header

Botones

Links

Fondos

Tablas

Badges

Charts

---

Tipografía

Principal

Secundaria

Peso

Escala

---

Border Radius

Sombras

Espaciado

Animaciones

Modo Claro

Modo Oscuro

Modo Automático

---

Vista previa

Desktop

Tablet

Mobile

---

Nunca modificar CSS manualmente.

Todo mediante variables.

---

# Usuarios

Tabla

Nombre

Correo

Rol

Estado

Último acceso

Sucursal

MFA

Acciones

---

Crear

Editar

Bloquear

Restablecer contraseña

Cerrar sesiones

Asignar empresa

Asignar permisos

---

# Roles

Lista

Administrador

Director

Comercial

Ingeniería

Producción

Compras

Inventario

Finanzas

Cliente

Personalizado

---

Cada rol muestra

Usuarios

Permisos

Restricciones

Herencia

---

Nunca editar roles del sistema directamente.

---

# Permisos

Vista tipo matriz.

```

              Crear Leer Editar Eliminar Exportar Aprobar

CRM

Inventario

Compras

Producción

Finanzas

Configuración

```

---

Filtros

Rol

Usuario

Módulo

Permiso

---

Nunca listas interminables.

---

# Correos

Configurar

SMTP

Microsoft 365

Google Workspace

Resend

SendGrid

Mailgun

Amazon SES

---

Campos

Servidor

Puerto

Usuario

Password

TLS

SSL

Remitente

Nombre

Firma

---

Botón

Enviar prueba

---

# SMS

Proveedores

Twilio

MessageBird

Infobip

AWS SNS

---

Mostrar

Saldo

Estado

Logs

Plantillas

---

Enviar prueba.

---

# WhatsApp

Meta

Twilio

360Dialog

Evolution

---

Configurar

Token

Phone ID

Business ID

Webhook

Plantillas

---

Vista

Conversaciones

Estado

Logs

---

# Telefonía

Twilio Voice

Asterisk

3CX

FreePBX

---

Configurar

Troncales

Grabación

IVR

Colas

Extensiones

---

# API Keys

Vista segura.

Mostrar

Servicio

Estado

Fecha creación

Último uso

Caduca

---

Ejemplos

OpenAI

Google Maps

Stripe

MercadoPago

Supabase

Twilio

Meta

AWS

Azure

---

Nunca mostrar claves completas.

---

# Integraciones

Cards

Supabase

Google

Microsoft

Stripe

MercadoPago

DIAN

Power BI

Slack

Teams

Zapier

Make

Webhook

---

Cada integración

Estado

Conectada

Última sincronización

Errores

Logs

---

# Storage

Buckets

Productos

Documentos

Planos

Firmas

Usuarios

Marketing

Backups

---

Mostrar

Capacidad

Uso

Archivos

Costo

---

Botones

Limpiar

Mover

Reindexar

---

# Notificaciones

Centro completo.

Configurar

Email

Push

SMS

WhatsApp

Internas

Desktop

---

Eventos

Lead

Cotización

Pago

Compra

Producción

Inventario

Error

Backup

Login

---

Cada evento

Activar

Desactivar

Canal

Responsable

---

# Seguridad

Configurar

MFA

Sesiones

Políticas

Contraseñas

IPs

Dispositivos

Tiempo sesión

---

Logs

Intentos fallidos

Bloqueos

Ubicaciones

Navegadores

---

# Backups

Mostrar

Último Backup

Estado

Tamaño

Destino

Programación

---

Acciones

Crear

Descargar

Restaurar

Verificar

---

Nunca restaurar sin confirmación múltiple.

---

# Auditoría

Dashboard

Usuarios

Cambios

Configuraciones

Acciones

Errores

Seguridad

---

Filtros

Fecha

Usuario

Entidad

Módulo

IP

Acción

---

Nunca permitir editar auditoría.

---

# Licencia

Mostrar

Plan

Empresa

Usuarios

Módulos

Límite

Almacenamiento

Expiración

Renovación

Consumo

---

Semáforos

Verde

Normal

Amarillo

Próximo límite

Rojo

Bloqueo

---

# Tenant

Información técnica.

Mostrar

Tenant ID

Subdominio

Dominio

Región

Base Datos

Storage

Plan

Versión

Ambiente

---

Solo lectura excepto Super Admin.

---

# Panel Derecho

Sticky

Mostrar

Cambios pendientes

Estado sincronización

Servicios

API

Alertas

Licencia

Backups

Últimos cambios

---

# Dashboard Ejecutivo Configuración

Widgets

Usuarios activos

Roles

Permisos

Integraciones

Consumo Storage

Licencia

API

Errores

Notificaciones

Backups

Seguridad

---

Cada widget debe responder preguntas como

¿Todo está funcionando?

¿Qué integración falló?

¿Cuánta capacidad queda?

¿Qué usuarios tienen problemas?

¿Qué cambios se hicieron hoy?

---

# Reglas Absolutas

Nunca hardcodear ningún dato.

Nunca guardar logos en el código.

Nunca guardar colores en Tailwind.

Nunca guardar API Keys en el frontend.

Nunca permitir editar auditorías.

Nunca mostrar secretos completos.

Nunca reiniciar servicios sin confirmación.

Nunca perder historial de configuración.

Toda configuración debe ser multi-tenant.

Todo cambio debe quedar auditado.

Todo cambio debe tener versión.

Todo cambio debe poder revertirse.

Toda modificación del White Label debe reflejarse inmediatamente en toda la plataforma sin recompilar el sistema.