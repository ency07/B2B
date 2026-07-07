# EVENTS & AUTOMATIONS — Eventos de Negocio y Automatizaciones

## 1. Business Events (Eventos de Negocio)

Todo hito crítico del negocio genera un evento inmutable en `business_events`.

### Estructura de un Business Event

```typescript
interface BusinessEvent {
  id: uuid
  tenant_id: uuid
  entity_type: string      // 'lead', 'quote', 'invoice', 'job', etc.
  entity_id: uuid
  action: string           // 'created', 'updated', 'status_changed', 'approved', etc.
  actor_id: uuid
  actor_role: string
  old_status?: string
  new_status?: string
  metadata: JSONB          // payload contextual
  ip_address: string
  user_agent: string
  created_at: timestamptz  // inmutable
}
```

---

## 2. Catálogo de Eventos

### CRM Events

| Evento | Disparador | Payload |
|---|---|---|
| `lead.created` | Nuevo lead registrado | `{ source, score, contact_info }` |
| `lead.contacted` | Primer contacto | `{ method, outcome }` |
| `lead.qualified` | Score supera 35 | `{ score, assigned_to }` |
| `lead.assigned` | Asignación a comercial | `{ from, to, reason }` |
| `lead.converted` | Lead → Cliente | `{ client_id, opportunity_id }` |
| `lead.discarded` | Lead descartado | `{ reason }` |
| `client.created` | Nuevo cliente | `{ lead_id, company_data }` |
| `client.suspended` | Cliente suspendido | `{ reason }` |
| `client.reactivated` | Cliente reactivado | `{}` |

### Quote Events

| Evento | Disparador | Payload |
|---|---|---|
| `quote.created` | Nueva cotización | `{ total, items_count }` |
| `quote.updated` | Cotización modificada | `{ changed_fields, new_total }` |
| `quote.sent` | Envío al cliente | `{ sent_via, sent_to }` |
| `quote.accepted` | Cliente acepta | `{ accepted_at, by }` |
| `quote.rejected` | Cliente rechaza | `{ reason, comment }` |
| `quote.converted` | Cotización → OT | `{ job_id }` |
| `quote.cancelled` | Cotización cancelada | `{ reason }` |
| `quote.version_created` | Nueva versión | `{ from_version, to_version, changes }` |

### Job Events

| Evento | Disparador | Payload |
|---|---|---|
| `job.created` | Nueva OT | `{ quote_id, scheduled_date }` |
| `job.started` | OT inicia ejecución | `{ started_at, team }` |
| `job.paused` | OT pausada | `{ reason }` |
| `job.resumed` | OT reanudada | `{ paused_duration }` |
| `job.completed` | OT finalizada | `{ completed_at, actual_hours }` |
| `job.checked` | Checklist completada | `{ checklist_id, result }` |
| `job.material_used` | Material consumido | `{ product_id, quantity }` |
| `job.cancelled` | OT cancelada | `{ reason }` |
| `job.warranty_activated` | Garantía activada | `{ warranty_id, duration }` |

### Invoice Events

| Evento | Disparador | Payload |
|---|---|---|
| `invoice.created` | Nueva factura | `{ total, items_count }` |
| `invoice.emitted` | Factura emitida | `{ sent_to, due_date }` |
| `invoice.paid_partial` | Pago parcial | `{ payment_id, amount }` |
| `invoice.paid_full` | Pago total | `{ final_payment_id }` |
| `invoice.overdue` | Factura vencida (automático) | `{ days_overdue }` |
| `invoice.annulled` | Factura anulada (NC) | `{ nc_id, reason }` |

### Payment Events

| Evento | Disparador | Payload |
|---|---|---|
| `payment.initiated` | Inicio de pago | `{ method, amount }` |
| `payment.processing` | Wompi callback | `{ transaction_id, status }` |
| `payment.confirmed` | Pago confirmado | `{ receipt_url }` |
| `payment.rejected` | Pago rechazado | `{ reason }` |
| `payment.reversed` | Contracargo | `{ reason }` |

### Inventory Events

| Evento | Disparador | Payload |
|---|---|---|
| `inventory.entry` | Entrada a inventario | `{ product_id, quantity, source }` |
| `inventory.exit` | Salida de inventario | `{ product_id, quantity, destination }` |
| `inventory.transfer` | Transferencia entre bodegas | `{ from, to, quantity }` |
| `inventory.adjustment` | Ajuste manual | `{ reason, previous, new }` |
| `inventory.low_stock` | Stock bajo (automático) | `{ product_id, current_stock, min_stock }` |
| `inventory.out_of_stock` | Stock agotado (automático) | `{ product_id }` |

### Purchase Events

| Evento | Disparador | Payload |
|---|---|---|
| `purchase.request_created` | Nueva solicitud | `{ products, estimated_cost }` |
| `purchase.request_approved` | Solicitud aprobada | `{ approved_by }` |
| `purchase.quote_received` | Cotización de proveedor | `{ supplier_id, amount }` |
| `purchase.supplier_selected` | Proveedor seleccionado | `{ supplier_id, reason }` |
| `purchase.oc_emitted` | Orden de compra emitida | `{ total, due_date }` |
| `purchase.received_partial` | Recepción parcial | `{ items, pending }` |
| `purchase.received_full` | Recepción total | `{ all_items }` |

---

## 3. Automatizaciones

### 3.1 Temporizadores y Cron Jobs

| Automatización | Frecuencia | Acción |
|---|---|---|
| Verificar facturas vencidas | Diario (00:00 UTC) | Cambiar estado a `FACTURA_VENCIDA` si `due_date < today` y no pagada |
| Verificar garantías vencidas | Diario (00:00 UTC) | Cambiar estado a `GARANTIA_VENCIDA` si pasaron 12 meses |
| Verificar stock bajo | Cada hora | Si `stock <= min_stock`: generar alerta + evento `inventory.low_stock` |
| Verificar productos sin movimiento | Semanal | Si 0 movimientos en 90 días: marcar como inactivo |
| Verificar SLA de leads | Cada 15 minutos | Leads sin contacto en su ventana de SLA: generar alerta |
| Backup automático | Diario (03:00 UTC) | Backup de BD + storage |
| Limpieza de sesiones expiradas | Diario (02:00 UTC) | Eliminar sesiones > 30 días |

### 3.2 Triggers en Base de Datos

| Trigger | Tabla | Condición | Acción |
|---|---|---|---|
| `block_physical_delete` | Todas operacionales | `BEFORE DELETE` | Raise exception. Forzar soft delete. |
| `audit_on_mutation` | Todas operacionales | `AFTER INSERT/UPDATE/DELETE` | Insertar en `audit_log` con diff JSONB |
| `business_event_on_status_change` | Todas operacionales | `AFTER UPDATE OF status` | Insertar en `business_events` |
| `validate_cancel_reason` | Varias | `BEFORE UPDATE` cuando `status = *_CANCELADO` | Verificar `motivo_cancelacion` ≥ 10 chars |
| `generate_sequential_code` | Varias | `BEFORE INSERT` | Generar código via `tenant_sequences` |
| `update_inventory_on_reception` | Purchase items | `AFTER UPDATE` de recepción | Crear movimiento de inventario + actualizar stock |
| `deactivate_warranty_on_completion` | Garantías | `AFTER UPDATE` cuando `status = GARANTIA_CERRADA` | Marcar como inactiva |
| `set_tenant_id` | Todas operacionales | `BEFORE INSERT` | Forzar `tenant_id = auth.uid() → user.tenant_id` |

### 3.3 Automatizaciones de Negocio (Server Actions)

| Automatización | Disparador | Acción |
|---|---|---|
| Lead scoring | `lead.created` | Calcular score basado en datos del formulario |
| Lead assignment | `lead.qualified` | Asignar al comercial con menos leads activos (round-robin) |
| SLA breach notification | SLA vencido | Notificar al comercial y su supervisor |
| Quote approval routing | `quote.requested_approval` | Enrutar según monto ($10M, $50M, >$50M) |
| Invoice generation from job | `job.completed` | Generar factura automáticamente si el job tiene costo definido |
| Warranty activation | `job.completed` | Crear garantía de 12 meses |
| Low stock purchase suggestion | `inventory.low_stock` | Sugerir crear solicitud de compra |
| Payment reminder | 7 días antes del vencimiento | Email al cliente |
| Overdue reminder | Factura vencida | Email + alerta al responsable |

---

## 4. Notificaciones

### 4.1 Canales

| Canal | Uso | Configuración |
|---|---|---|
| In-app | Notificaciones dentro del ERP/Portal | Siempre activo |
| Email | Notificaciones importantes | Proveedor SMTP (tenant configurable) |
| SMS | Alertas urgentes (SLA breach) | Twilio / MessageBird |
| WhatsApp | Comunicación con clientes | Meta Business API |
| Push | Notificaciones en navegador | Service Worker |

### 4.2 Matriz de Notificaciones

| Evento | GERENTE | COMERCIAL | TECNICO | FINANZAS | CLIENTE |
|---|---|---|---|---|---|
| Lead urgente (score > 60) | ✗ | ✓ In-app + SMS | ✗ | ✗ | ✗ |
| Lead sin contactar (SLA breach) | ✓ In-app | ✓ In-app + SMS | ✗ | ✗ | ✗ |
| Cotización lista para aprobar | ✓ In-app | ✗ | ✗ | ✗ | ✗ |
| Cotización enviada | ✗ | ✓ In-app | ✗ | ✗ | ✓ Email |
| Cotización aceptada | ✓ In-app | ✓ In-app | ✗ | ✗ | ✗ |
| OT asignada | ✗ | ✗ | ✓ In-app + SMS | ✗ | ✗ |
| OT completada | ✓ In-app | ✓ In-app | ✗ | ✗ | ✓ Email |
| Factura emitida | ✗ | ✗ | ✗ | ✓ In-app | ✓ Email |
| Factura vencida | ✗ | ✗ | ✗ | ✓ In-app | ✓ Email + SMS |
| Pago confirmado | ✗ | ✗ | ✗ | ✓ In-app | ✓ In-app |
| Stock bajo | ✗ | ✗ | ✗ | ✗ | ✗ |
| Stock bajo → notificar | ✓ In-app | ✗ | ✗ | ✗ | ✗ |
| Ticket respondido | ✗ | ✗ | ✗ | ✗ | ✓ Email |
| Slots de soporte | ✗ | ✗ | ✗ | ✗ | ✗ |

Esto se debe notificar a ADMIN e INVENTARIO.

---

## 5. Reglas de Eventos y Automatizaciones

1. **Todo evento de negocio es inmutable.** No se puede modificar ni eliminar.
2. **Todo evento tiene actor.** Si el sistema genera el evento, actor = `SYSTEM`.
3. **Todo evento tiene IP y User Agent.** Para auditoría forense.
4. **Automatizaciones idempotentes.** Una misma entrada produce siempre el mismo resultado.
5. **Automatizaciones fallan graceful.** Si una automatización falla, no bloquea la operación principal.
6. **Notificaciones configurables.** El usuario puede gestionar sus preferencias de notificación.
7. **Rate limiting.** Máximo 10 SMS al mismo usuario por día.
