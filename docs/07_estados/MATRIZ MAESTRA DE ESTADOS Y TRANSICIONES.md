MATRIZ MAESTRA DE ESTADOS Y TRANSICIONES
REGLA GLOBAL
Ningún estado puede cambiarse directamente desde base de datos.

Todo cambio debe ejecutarse mediante servicios de dominio.

Todo cambio debe:

Validar permisos
Registrar auditoría
Generar evento
Generar alertas si aplica
Actualizar fechas relacionadas
CLIENTE
Estados
Prospecto
Activo
Inactivo
Bloqueado
Archivado
Transiciones
Prospecto → Activo

Activo → Inactivo

Activo → Bloqueado

Bloqueado → Activo

Inactivo → Activo

Inactivo → Archivado
No permitido
Prospecto → Archivado

Bloqueado → Archivado
REQUERIMIENTO
Estados
Registrado
Diagnóstico
Visita Técnica
Cotización
Aprobado
En Ejecución
Cerrado
Cancelado
Flujo
Registrado
↓
Diagnóstico
↓
Visita Técnica
↓
Cotización
↓
Aprobado
↓
En Ejecución
↓
Cerrado
Alternativa
Cualquier estado

↓

Cancelado
Validaciones
Diagnóstico
Debe existir responsable
Visita Técnica
Debe existir diagnóstico
Cotización
Debe existir información suficiente
Aprobado
Debe existir cotización aprobada
En Ejecución
Debe existir trabajo creado
COTIZACIÓN
Estados
Borrador
En Revisión
Enviada
Aprobada
Rechazada
Vencida
Cancelada
Flujo
Borrador
↓
En Revisión
↓
Enviada
Desde Enviada
Enviada → Aprobada

Enviada → Rechazada

Enviada → Vencida
Desde Borrador
Borrador → Cancelada
Restricciones
Aprobada = estado final

Rechazada = estado final

Cancelada = estado final
APROBACIÓN
Estados
Pendiente
Aprobada
Rechazada
AjustesSolicitados
Cancelada
Flujo
Pendiente

↓

Aprobada

o

Pendiente

↓

Rechazada

o

Pendiente

↓

AjustesSolicitados
Desde AjustesSolicitados
AjustesSolicitados

↓

Pendiente
TRABAJO
Estados
Pendiente
Programado
En Ejecución
Suspendido
Finalizado
Entregado
Cerrado
Cancelado
Flujo
Pendiente
↓
Programado
↓
En Ejecución
↓
Finalizado
↓
Entregado
↓
Cerrado
Alternativas
En Ejecución → Suspendido

Suspendido → En Ejecución

Pendiente → Cancelado

Programado → Cancelado
Validaciones
Programado
Debe existir responsable
Debe existir fecha
En Ejecución
Debe existir inicio real
Finalizado
Todas las actividades completadas
Entregado
Acta Entrega cargada
Cerrado
Sin actividades pendientes
ACTIVIDADES
Estados
Pendiente
Programada
En Ejecución
Suspendida
Completada
Cancelada
Flujo
Pendiente
↓
Programada
↓
En Ejecución
↓
Completada
Alternativas
En Ejecución → Suspendida

Suspendida → En Ejecución

Pendiente → Cancelada
DOCUMENTOS
Estados
Borrador
Publicado
Obsoleto
Archivado
Flujo
Borrador
↓
Publicado
↓
Obsoleto
↓
Archivado
Restricción
Nunca eliminar físicamente.
FACTURAS
Estados
Pendiente
ParcialmentePagada
Pagada
Vencida
Anulada
Flujo
Pendiente
↓
ParcialmentePagada
↓
Pagada
Alternativas
Pendiente → Vencida

ParcialmentePagada → Vencida

Pendiente → Anulada
Restricción
Pagada es estado final.
PAGOS
Estados
Registrado
Confirmado
Anulado
Flujo
Registrado
↓
Confirmado

o

Registrado
↓
Anulado
GARANTÍA
Estados
Activa
Vencida
Ejecutada
Cerrada
Anulada
Flujo
Activa
↓
Ejecutada
↓
Cerrada
Alternativas
Activa → Vencida

Activa → Anulada
INTERVENCIÓN GARANTÍA
Estados
Registrada
En Proceso
Resuelta
Cerrada
Flujo
Registrada
↓
En Proceso
↓
Resuelta
↓
Cerrada
COSTOS
Estados
Registrado
Aprobado
Rechazado
Flujo
Registrado
↓
Aprobado

o

Registrado
↓
Rechazado
ALERTAS
Estados
Pendiente
Leída
Archivada
Flujo
Pendiente
↓
Leída
↓
Archivada
INVENTARIO MOVIMIENTOS
Estados
Registrado
Aplicado
Anulado
Flujo
Registrado
↓
Aplicado

o

Registrado
↓
Anulado
REGLA FINAL PARA ANTIGRAVITY
Si una transición no está definida en esta matriz:

NO IMPLEMENTARLA.

NO INFERIRLA.

NO INVENTARLA.

DETENERSE.

SOLICITAR DEFINICIÓN.