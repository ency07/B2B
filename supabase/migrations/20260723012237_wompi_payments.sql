-- ============================================================================
-- Portal · Pasarela de pagos Wompi/PSE (gap P-002 / P1-06)
--
-- Contexto: payments ya tiene un trigger de permisos (enforce_invoice_permissions)
-- que exige rol financiero interno (AUXILIAR_FINANZAS/JEFE_FINANZAS/GERENTE/
-- GERENTE_GENERAL) para insertar un pago. Un webhook de Wompi no tiene sesión
-- de usuario (auth.uid() es NULL). Se resuelve con una excepción estrecha y
-- auditable, activada SOLO dentro de wompi_confirm_payment() — una función
-- SECURITY DEFINER revocada de PUBLIC/authenticated y otorgada únicamente a
-- service_role (mismo patrón que las RPC transaccionales del ERP, ej.
-- create_invoice_with_item). Decisión documentada en
-- specs/003-portal-wompi-payments/spec.md ("Contexto y restricción conocida")
-- y research.md (Decisión 5).
--
-- NO se toca ninguna otra rama de enforce_invoice_permissions (ni invoices,
-- ni el UPDATE de payments) — solo se agrega una condición OR al INSERT de
-- payments. NO se toca refresh_invoice_paid_amount, handle_payment_application
-- ni dispatch_invoice_events — se reutilizan tal cual.
-- ============================================================================

-- ── 1. Helper: ¿esta transacción fue autorizada por wompi_confirm_payment? ───

CREATE OR REPLACE FUNCTION is_wompi_payment_context()
RETURNS boolean AS $$
  SELECT COALESCE(current_setting('app.wompi_payment_context', true), 'false') = 'true';
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION is_wompi_payment_context() IS
  'true solo dentro de la transacción de wompi_confirm_payment() — SET LOCAL, no puede filtrarse ni persistir entre llamadas.';

-- ── 2. Extensión de enforce_invoice_permissions: una condición OR añadida ────
-- Copia exacta de la función original (auditada antes de esta migración) con
-- UNA sola línea añadida en la rama payments/INSERT. Todo lo demás es
-- idéntico byte a byte.

CREATE OR REPLACE FUNCTION public.enforce_invoice_permissions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    IF is_platform_super_admin() THEN
        RETURN NEW;
    END IF;

    IF pg_trigger_depth() = 0 THEN
        -- Facturas (invoices)
        IF TG_TABLE_NAME = 'invoices' THEN
            IF TG_OP = 'INSERT' THEN
                IF NOT (
                    current_user_has_role('AUXILIAR_FINANZAS') OR
                    current_user_has_role('JEFE_FINANZAS') OR
                    current_user_has_role('GERENTE') OR
                    current_user_has_role('GERENTE_GENERAL')
                ) THEN
                    RAISE EXCEPTION 'Permiso Denegado: No cuenta con el rol financiero para crear facturas.';
                END IF;
            ELSIF TG_OP = 'UPDATE' THEN
                -- Emitir o Anular requiere Jefe de Finanzas o Gerencia
                IF (NEW.status IN ('EMITIDA', 'ANULADA') AND OLD.status = 'BORRADOR') OR (NEW.status = 'ANULADA' AND OLD.status <> 'ANULADA') THEN
                    IF NOT (
                        current_user_has_role('JEFE_FINANZAS') OR
                        current_user_has_role('GERENTE') OR
                        current_user_has_role('GERENTE_GENERAL')
                    ) THEN
                        RAISE EXCEPTION 'Permiso Denegado: Solo el Jefe de Finanzas o la Gerencia pueden Emitir o Anular facturas.';
                    END IF;
                END IF;
            END IF;

        -- Pagos (payments)
        ELSIF TG_TABLE_NAME = 'payments' THEN
            IF TG_OP = 'INSERT' THEN
                IF NOT (
                    current_user_has_role('AUXILIAR_FINANZAS') OR
                    current_user_has_role('JEFE_FINANZAS') OR
                    current_user_has_role('GERENTE') OR
                    current_user_has_role('GERENTE_GENERAL') OR
                    is_wompi_payment_context()
                ) THEN
                    RAISE EXCEPTION 'Permiso Denegado: Su rol no está autorizado para registrar pagos.';
                END IF;
            ELSIF TG_OP = 'UPDATE' THEN
                -- APLICAR o ANULAR requiere Jefe de Finanzas o Gerencia
                IF (NEW.status IN ('APLICADO', 'ANULADO') AND OLD.status = 'REGISTRADO') OR (NEW.status = 'ANULADO' AND OLD.status = 'APLICADO') THEN
                    IF NOT (
                        current_user_has_role('JEFE_FINANZAS') OR
                        current_user_has_role('GERENTE') OR
                        current_user_has_role('GERENTE_GENERAL')
                    ) THEN
                        RAISE EXCEPTION 'Permiso Denegado: Solo el Jefe de Finanzas o la Gerencia pueden Confirmar, Aplicar o Anular pagos.';
                    END IF;
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- ── 3. wompi_confirm_payment ──────────────────────────────────────────────────
-- Único punto de entrada que puede insertar un pago sin un usuario financiero
-- autenticado. Solo alcanzable por service_role (el webhook usa supabaseAdmin);
-- ni siquiera un usuario `authenticated` normal puede invocarla.

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
  -- Idempotencia: Wompi reintenta el webhook hasta 3 veces si no recibe 200
  -- en 24h. Si ya existe un pago con esta referencia, no duplicar.
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

  -- Acotado a esta transacción (tercer argumento true = SET LOCAL). No puede
  -- filtrarse a otras conexiones ni persistir tras el COMMIT/ROLLBACK.
  PERFORM set_config('app.wompi_payment_context', 'true', true);

  INSERT INTO payments (
    tenant_id, client_id, invoice_id, payment_date, payment_method,
    reference_number, amount, status, created_by
  ) VALUES (
    v_invoice.tenant_id, v_invoice.client_id, p_invoice_id, CURRENT_DATE, p_payment_method,
    p_wompi_transaction_id, p_amount, 'APLICADO', NULL
  )
  RETURNING * INTO v_payment;

  -- handle_payment_application (trigger AFTER INSERT ya existente) dispara
  -- refresh_invoice_paid_amount() automáticamente — no se toca invoices.status
  -- directamente aquí. Solo se actualiza el tracking de payment_status
  -- (columna sin ningún trigger de permisos ni de inmutabilidad vigilándola).
  UPDATE invoices
  SET payment_status = 'APPROVED'
  WHERE id = p_invoice_id;

  RETURN json_build_object('id', v_payment.id, 'payment_code', v_payment.payment_code, 'already_applied', false);
END;
$$;

REVOKE ALL ON FUNCTION wompi_confirm_payment(uuid, text, numeric, varchar) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION wompi_confirm_payment(uuid, text, numeric, varchar) TO service_role;

COMMENT ON FUNCTION wompi_confirm_payment IS
  'Aplica un pago confirmado por webhook de Wompi. Solo invocable por service_role (nunca por authenticated/anon). Idempotente por reference_number. SECURITY DEFINER.';
