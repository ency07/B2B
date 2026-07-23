-- Puente de identidad para Server Actions que escriben vía supabaseAdmin
-- (service_role). requireAction()/getAuthContext() ya validan al usuario real
-- en TypeScript, pero esa identidad se pierde antes de llegar a los triggers
-- de permisos porque supabaseAdmin no lleva auth.uid() (es un singleton
-- service_role sin sesión). Esto rompe TODOS los triggers enforce_*_permissions
-- que dependen de current_user_has_role() -> get_current_user_id() -> auth.uid().
--
-- Patrón: mismo "bypass estrecho" ya usado en wompi_confirm_payment
-- (is_wompi_payment_context()), pero implementado UNA sola vez en
-- get_current_user_id() en vez de repetirlo por trigger. set_erp_actor_context()
-- solo puede ser llamado por funciones SECURITY DEFINER con grant a
-- service_role (nunca directo desde el cliente), y set_config usa is_local=true
-- (SET LOCAL), por lo que el override desaparece al terminar la transacción/RPC.

CREATE OR REPLACE FUNCTION public.set_erp_actor_context(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM users WHERE id = p_user_id AND status = 'Activo'
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'ACTOR_NOT_FOUND_OR_INACTIVE';
  END IF;

  PERFORM set_config('app.verified_actor_id', p_user_id::text, true);
END;
$function$;

REVOKE ALL ON FUNCTION public.set_erp_actor_context(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_erp_actor_context(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_user_id uuid;
    v_override text;
BEGIN
    v_override := current_setting('app.verified_actor_id', true);
    IF v_override IS NOT NULL AND v_override <> '' THEN
        BEGIN
            SELECT id INTO v_user_id
            FROM users
            WHERE id = v_override::uuid AND status = 'Activo'
            LIMIT 1;
        EXCEPTION WHEN OTHERS THEN
            v_user_id := NULL;
        END;
        IF v_user_id IS NOT NULL THEN
            RETURN v_user_id;
        END IF;
    END IF;

    SELECT id INTO v_user_id
    FROM users
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
    RETURN v_user_id;
END;
$function$;

-- RPC dedicado para registerPayment(): valida el actor real (bridge) y hace el
-- INSERT dentro de la MISMA transacción que set_erp_actor_context (SET LOCAL no
-- sobrevive entre llamadas separadas de supabase-js). La validación de reglas de
-- negocio (estado de factura, saldo) se mantiene en TypeScript como hoy; este RPC
-- solo hace el escrito privilegiado con la identidad correcta adjunta.
CREATE OR REPLACE FUNCTION public.register_payment_for_invoice(
  p_tenant_id        uuid,
  p_client_id        uuid,
  p_invoice_id       uuid,
  p_amount           numeric,
  p_payment_method   varchar,
  p_payment_date     date,
  p_reference_number text,
  p_actor_user_id    uuid
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_payment public.payments;
BEGIN
  PERFORM set_erp_actor_context(p_actor_user_id);

  INSERT INTO public.payments (
    tenant_id, client_id, invoice_id, payment_date, payment_method,
    reference_number, amount, status, created_by
  ) VALUES (
    p_tenant_id, p_client_id, p_invoice_id, p_payment_date, p_payment_method,
    p_reference_number, p_amount, 'APLICADO', p_actor_user_id
  )
  RETURNING * INTO v_payment;

  RETURN v_payment;
END;
$function$;

REVOKE ALL ON FUNCTION public.register_payment_for_invoice(uuid,uuid,uuid,numeric,varchar,date,text,uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_payment_for_invoice(uuid,uuid,uuid,numeric,varchar,date,text,uuid) TO service_role;
