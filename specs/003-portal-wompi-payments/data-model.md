# Phase 1 Data Model: Pasarela de Pagos Wompi/PSE

## Columnas reutilizadas en `invoices` (ya existen, nunca usadas hasta ahora)

| Columna | Uso en este feature |
|---------|----------------------|
| `payment_provider` | `'WOMPI'` mientras haya un intento de pago en curso o resuelto por este medio |
| `payment_token` | La `reference` única generada al iniciar el checkout — así el webhook resuelve qué factura es |
| `payment_status` | `'PENDING'` (checkout creado) → `'APPROVED'` \| `'DECLINED'` \| `'ERROR'` (según el webhook) |
| `payment_url` | Reservada para un futuro flujo de redirect; no se usa con el Widget embebido |
| `payment_link` | Sin uso en este alcance |

## Migración SQL

### 1. Helper `is_wompi_payment_context()`

```sql
CREATE OR REPLACE FUNCTION is_wompi_payment_context()
RETURNS boolean AS $$
  SELECT COALESCE(current_setting('app.wompi_payment_context', true), 'false') = 'true';
$$ LANGUAGE sql STABLE;
```

### 2. Extensión de `enforce_invoice_permissions()` (una sola condición OR añadida)

En la rama `ELSIF TG_TABLE_NAME = 'payments' THEN IF TG_OP = 'INSERT' THEN`, el `IF NOT (...)` pasa
de:

```sql
IF NOT (
  current_user_has_role('AUXILIAR_FINANZAS') OR
  current_user_has_role('JEFE_FINANZAS') OR
  current_user_has_role('GERENTE') OR
  current_user_has_role('GERENTE_GENERAL')
) THEN
```

a:

```sql
IF NOT (
  current_user_has_role('AUXILIAR_FINANZAS') OR
  current_user_has_role('JEFE_FINANZAS') OR
  current_user_has_role('GERENTE') OR
  current_user_has_role('GERENTE_GENERAL') OR
  is_wompi_payment_context()
) THEN
```

Ninguna otra rama de la función (`invoices` INSERT/UPDATE, `payments` UPDATE) se toca.

### 3. RPC `wompi_confirm_payment`

```sql
CREATE OR REPLACE FUNCTION wompi_confirm_payment(
  p_invoice_id           uuid,
  p_wompi_transaction_id text,
  p_amount               numeric,
  p_payment_method       varchar DEFAULT 'Tarjeta'
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice   record;
  v_existing  record;
  v_payment   record;
BEGIN
  -- Idempotencia: si ya existe un pago con esta referencia, no duplicar.
  SELECT * INTO v_existing FROM payments
  WHERE invoice_id = p_invoice_id AND reference_number = p_wompi_transaction_id
  LIMIT 1;
  IF v_existing.id IS NOT NULL THEN
    RETURN json_build_object('id', v_existing.id, 'payment_code', v_existing.payment_code, 'already_applied', true);
  END IF;

  SELECT id, tenant_id, client_id, status, balance_amount INTO v_invoice
  FROM invoices WHERE id = p_invoice_id AND deleted_at IS NULL;

  IF v_invoice.id IS NULL THEN
    RAISE EXCEPTION 'INVOICE_NOT_FOUND';
  END IF;

  IF NOT (v_invoice.status IN ('EMITIDA', 'PARCIALMENTE_PAGADA', 'VENCIDA')) THEN
    RAISE EXCEPTION 'Factura en estado % no admite pagos.', v_invoice.status;
  END IF;

  IF p_amount > v_invoice.balance_amount THEN
    RAISE EXCEPTION 'El monto pagado (%) excede el saldo pendiente (%).', p_amount, v_invoice.balance_amount;
  END IF;

  PERFORM set_config('app.wompi_payment_context', 'true', true); -- true = solo esta transacción

  INSERT INTO payments (
    tenant_id, client_id, invoice_id, payment_date, payment_method,
    reference_number, amount, status, created_by
  ) VALUES (
    v_invoice.tenant_id, v_invoice.client_id, p_invoice_id, CURRENT_DATE, p_payment_method,
    p_wompi_transaction_id, p_amount, 'APLICADO', NULL
  )
  RETURNING * INTO v_payment;

  UPDATE invoices
  SET payment_status = 'APPROVED'
  WHERE id = p_invoice_id;

  RETURN json_build_object('id', v_payment.id, 'payment_code', v_payment.payment_code, 'already_applied', false);
END;
$$;

REVOKE ALL ON FUNCTION wompi_confirm_payment(uuid, text, numeric, varchar) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION wompi_confirm_payment(uuid, text, numeric, varchar) TO service_role;
```

`SET LOCAL`/`set_config(..., true)` está acotado a la transacción actual — termina solo al hacer
COMMIT/ROLLBACK, no puede filtrarse a otras conexiones ni a llamadas posteriores.

## Contratos de la aplicación (TypeScript)

### `src/lib/wompi.ts` (funciones puras, sin I/O)

```ts
computeIntegritySignature(reference: string, amountInCents: number, currency: string, integritySecret: string): string
verifyEventChecksum(properties: string[], propertyValues: (string|number)[], timestamp: number, checksum: string, eventsSecret: string): boolean
```

### `src/portal/actions/payments.ts`

```ts
createWompiCheckout(previewClientId: string | null | undefined, invoiceId: string): Promise<{
  publicKey: string; amountInCents: number; currency: "COP"; reference: string;
  signature: string; redirectUrl: string;
} | { unavailable: true }>
```
Retorna `{ unavailable: true }` si `WOMPI_PUBLIC_KEY`/`WOMPI_INTEGRITY_SECRET` no están en `.env`
— el componente muestra el mensaje honesto actual en ese caso (FR-006).

### `src/app/api/webhooks/wompi/route.ts`

`POST` — verifica firma, extrae `transaction.reference`/`status`/`amount_in_cents`/`id`, resuelve
la factura por `payment_token = reference`, y:
- `APPROVED` → llama `wompi_confirm_payment` vía `supabaseAdmin.rpc(...)`.
- cualquier otro estado → solo `UPDATE invoices SET payment_status = ...` (sin RPC, sin bypass).
Responde `200` en cualquier caso de evento reconocido (incluso declined) para que Wompi no
reintente; responde `401` solo si la firma no valida.
