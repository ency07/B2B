# Blueprint — Inventario

---

# Filosofía

Inventario NO es una tabla de productos.

Es el sistema nervioso de toda la operación.

Debe responder en segundos:

• ¿Qué tenemos?
• ¿Dónde está?
• ¿Quién lo movió?
• ¿Cuánto vale?
• ¿Qué está reservado?
• ¿Qué está comprometido?
• ¿Qué está por agotarse?
• ¿Qué debe comprarse?

Cada movimiento debe ser completamente trazable.

Nunca debe existir un movimiento sin origen.

Nunca debe existir un movimiento sin destino.

---

# Objetivos

Permitir administrar

• Productos

• Materias primas

• Insumos

• Repuestos

• Herramientas

• Equipos

• Consumibles

• Productos terminados

• Kits

• Activos

Todo desde un único módulo.

---

# Layout General

```

HEADER

↓

KPIs

↓

Inventario General

↓

Productos

↓

Series

↓

Lotes

↓

Kardex

↓

Movimientos

↓

Bodegas

↓

Panel Derecho

```

---

# HEADER

Debe contener

Inventario Total

Costo Total

Valor Comercial

Productos

Stock Bajo

Órdenes Pendientes

Compras Pendientes

Fecha

Botones

Nuevo Producto

Entrada

Salida

Transferencia

Inventario Físico

Importar

Exportar

---

# KPIs

Cards compactas

Mostrar

Productos

SKU

Series

Lotes

Bodegas

Valor Inventario

Costo Promedio

Stock Crítico

Productos Sin Movimiento

Entradas Hoy

Salidas Hoy

Transferencias

---

Nunca tarjetas gigantes.

---

# Dashboard Principal

```

70%

Inventario

↓

30%

Alertas Inteligentes

```

---

# Productos

Tabla empresarial

Columnas

Código

SKU

Producto

Categoría

Familia

Serie

Unidad

Stock

Reservado

Disponible

Costo

Precio

Estado

Acciones

---

Filtros

Categoría

Familia

Serie

Proveedor

Marca

Estado

Stock

Bodega

---

Agrupar

Categoría

Familia

Proveedor

Marca

Ubicación

---

Acciones

Editar

Duplicar

Mover

Reservar

Ajustar

Imprimir Etiqueta

Historial

---

# Vista Detalle Producto

Debe verse como una ficha industrial.

---

Información General

↓

Inventario

↓

Series

↓

Lotes

↓

Movimientos

↓

Documentos

↓

Proveedores

↓

Costos

↓

Historial

---

Mostrar

Código

SKU

Código barras

QR

Descripción

Marca

Modelo

Categoría

Familia

Serie

Unidad

Peso

Dimensiones

Costo

Precio

Proveedor

Garantía

---

# Series

Vista independiente

Cada serie representa una unidad única.

Mostrar

Serie

Producto

Estado

Ubicación

Fecha ingreso

Garantía

Responsable

Cliente

---

Estados

Disponible

Reservado

Instalado

En reparación

Prestado

Baja

---

Acciones

Consultar

Mover

Asignar

Imprimir

Historial

---

Nunca perder una serie.

---

# Lotes

Panel especializado.

Mostrar

Número lote

Producto

Cantidad

Fecha fabricación

Fecha ingreso

Fecha vencimiento

Proveedor

Estado

Ubicación

---

Estados

Disponible

Consumido

Reservado

Bloqueado

Vencido

---

Acciones

Transferir

Bloquear

Liberar

Historial

---

# Movimientos

Centro de movimientos.

Tipos

Entrada

Salida

Transferencia

Ajuste

Reserva

Consumo

Producción

Compra

Venta

Devolución

---

Cada movimiento muestra

Código

Producto

Cantidad

Origen

Destino

Usuario

Fecha

Hora

Documento

Costo

Observaciones

---

Nunca movimientos sin documento.

---

# Kardex

Debe ser una auditoría completa.

---

Columnas

Fecha

Hora

Movimiento

Documento

Entrada

Salida

Saldo

Costo Unitario

Costo Promedio

Usuario

---

Filtros

Producto

Serie

Lote

Bodega

Usuario

Fecha

Documento

---

Exportar

Excel

PDF

CSV

---

Nunca recalcular manualmente.

---

# Bodegas

Vista tipo mapa.

Mostrar

Bodega

Zona

Capacidad

Ocupación

Supervisor

Estado

Productos

Valor

---

Entrar a una bodega

↓

Pasillos

↓

Estanterías

↓

Niveles

↓

Ubicaciones

---

Jerarquía

Bodega

↓

Zona

↓

Pasillo

↓

Estante

↓

Nivel

↓

Posición

---

Toda ubicación debe ser única.

---

# Transferencias

Flujo

```

Bodega A

↓

Validación

↓

Transporte

↓

Recepción

↓

Bodega B

```

Cada paso

Usuario

Fecha

Hora

Estado

Firma

---

# Inventario Físico

Debe permitir

Conteo

Reconteo

Diferencias

Ajustes

Validación

---

Resultado

Sistema

Conteo

Diferencia

Motivo

Aprobación

---

Nunca ajustar automáticamente.

Siempre requerir aprobación.

---

# Costos

Panel financiero

Mostrar

Costo Promedio

Última Compra

Costo Máximo

Costo Mínimo

Valor Total

Valor Comercial

Valor Reservado

Valor Comprometido

---

Actualizar automáticamente.

---

# Panel Derecho

Sticky

Mostrar

Stock crítico

Últimos movimientos

Órdenes relacionadas

Compras pendientes

Producción

Alertas

Proveedores

Productos similares

---

# Alertas Inteligentes

Stock bajo

Stock crítico

Producto agotado

Lote vencido

Serie perdida

Ubicación inválida

Transferencia pendiente

Inventario negativo

Costo anómalo

Movimiento sospechoso

---

Todas accionables.

---

# Dashboard Ejecutivo

Widgets

Valor inventario

Rotación

Stock crítico

Top productos

Consumo mensual

Entradas

Salidas

Transferencias

Compras

Producción

Valor por bodega

Ocupación

---

Cada gráfica debe responder preguntas como

¿Qué debo comprar?

¿Qué está inmovilizado?

¿Qué rota más?

¿Qué rota menos?

¿Qué está por agotarse?

---

# Reglas Absolutas

Nunca permitir inventario negativo.

Nunca perder trazabilidad.

Nunca eliminar movimientos.

Nunca modificar Kardex.

Nunca duplicar Series.

Nunca duplicar Lotes.

Nunca mover inventario sin documento.

Nunca mover inventario sin auditoría.

Nunca permitir productos sin ubicación.

Nunca perder el costo histórico.

Toda entrada debe tener origen.

Toda salida debe tener destino.

Toda transferencia debe tener aprobación.

Todo ajuste debe quedar auditado.

Todo movimiento debe poder reconstruirse años después.