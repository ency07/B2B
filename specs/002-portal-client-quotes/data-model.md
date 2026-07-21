# Phase 1 Data Model: Cotizaciones en el Portal de Clientes

## Columnas nuevas en `quotes` (todas nullable, aditivas)

| Columna | Tipo | Nota |
|---------|------|------|
| `client_response` | `varchar(20)` | `'ACEPTADA' \| 'RECHAZADA'`, CHECK constraint. `NULL` = sin responder. |
| `client_response_at` | `timestamptz` | Cuándo respondió. |
| `client_response_reason` | `text` | Motivo (obligatorio si `client_response = 'RECHAZADA'`, mínimo 10 caracteres — mismo umbral que `reject_reason` interno). |
| `client_response_by` | `uuid REFERENCES client_contacts(id) ON DELETE SET NULL` | Quién de la empresa cliente respondió. `NULL` cuando el actor es un admin en modo preview (no hay contacto real). |

No se toca `status`, `approved_by`, `rejected_by`, `status_changed_by` ni ningún trigger existente.

## RPC 1: `portal_get_client_quotes(p_client_id uuid DEFAULT NULL)`

Sigue el patrón de `portal_get_client_requirements` (versión con tenant-scoping ya corregida).

**Retorna** (`TABLE`): `id, quote_code, title (derivado de requirements.title), valid_until,
total_amount, status, client_response, client_response_at, client_response_reason, created_at`

**Filtro**: `status IN ('ENVIADA','APROBADA','RECHAZADA','VENCIDA','CANCELADA')`,
`deleted_at IS NULL`, aislamiento cliente/tenant idéntico a los RPC existentes. `ORDER BY
created_at DESC LIMIT 50`.

## RPC 2: `portal_get_client_quote_items(p_quote_id uuid, p_client_id uuid DEFAULT NULL)`

Detalle bajo demanda. Verifica que la cotización pertenezca al `client_id` resuelto (mismo patrón
de resolución admin/cliente) antes de devolver items — doble chequeo aunque el `p_quote_id` ya
venga de una lista que el propio cliente vio.

**Retorna** (`TABLE`): `description, quantity, unit, unit_price, discount_amount, tax_percent,
line_total, item_order` + cabecera de la cotización (`subtotal, discount_amount, tax_amount,
total_amount`) en una segunda query o en un `json_build_object` combinado — implementación decide
la forma exacta, el contrato es "toda la info para renderizar el detalle en una sola llamada".

## RPC 3: `portal_respond_to_quote(p_client_id uuid, p_quote_id uuid, p_response varchar, p_reason text DEFAULT NULL)`

Mutación. Patrón de `portal_create_client_ticket` (resolver actor → validar acceso → mutar →
retornar fila actualizada).

**Reglas**:
1. Resolver `v_client_id` (admin explícito o `client_contacts.auth_user_id = auth.uid()`).
2. `is_admin_reviewer() OR is_portal_client_for(v_client_id)`, si no → excepción.
3. Cross-tenant guard igual que el resto (admin de tenant específico no puede tocar clientes de
   otro tenant).
4. `p_response` debe ser `'ACEPTADA'` o `'RECHAZADA'` (CHECK a nivel de columna cubre esto, pero
   validar antes con mensaje claro).
5. Si `p_response = 'RECHAZADA'`: `p_reason` obligatorio, mínimo 10 caracteres (mismo umbral que
   `validate_quote_state_transitions` usa para `reject_reason`).
6. `UPDATE quotes SET client_response = p_response, client_response_at = now(),
   client_response_reason = p_reason, client_response_by = v_contact_id_or_null WHERE id =
   p_quote_id AND client_id = v_client_id AND status = 'ENVIADA' AND client_response IS NULL`.
7. Si 0 filas afectadas → excepción genérica ("Cotización no encontrada, no está en estado ENVIADA,
   o ya fue respondida.") — no revela si el `quoteId` pertenece a otro cliente.
8. Insertar en `business_events` (`event_code = 'QUOTE_CLIENT_RESPONSE'`) — ver research.md
   Decisión 6.
9. Retornar la fila actualizada (o los campos relevantes) para que la UI actualice sin refetch.

## Contrato TypeScript (`src/portal/actions/quotes.ts`)

```ts
export interface ClientQuote {
  id: string;
  code: string;
  title: string;
  validUntil: string;
  totalAmount: number;
  status: string;
  clientResponse: "ACEPTADA" | "RECHAZADA" | null;
  clientResponseAt: string | null;
  clientResponseReason: string | null;
  createdAt: string;
}

export interface ClientQuoteItem {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface ClientQuoteDetail {
  quote: ClientQuote;
  items: ClientQuoteItem[];
  subtotal: number;
  taxAmount: number;
}

getClientQuotes(previewClientId?: string | null): Promise<ClientQuote[]>
getClientQuoteDetail(previewClientId: string | null | undefined, quoteId: string): Promise<ClientQuoteDetail>
respondToQuote(previewClientId: string | null | undefined, input: { quoteId: string; response: "ACEPTADA" | "RECHAZADA"; reason?: string }): Promise<ClientQuote>
```
