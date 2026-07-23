-- create_credit_note_bridged (migración anterior) usó 'APLICADA' como status
-- inicial, copiado tal cual del INSERT original en TypeScript (core.ts,
-- createCreditNote). 'APLICADA' NUNCA fue un valor válido para
-- credit_notes.status (CHECK constraint solo permite 'EMITIDA'/'ANULADA',
-- y 'EMITIDA' es además el DEFAULT de la columna) — esto significa que
-- createCreditNote() ha estado rota en producción desde su creación,
-- independientemente del bug de identidad: todo intento de crear una nota
-- crédito fallaría con una violación de constraint, no con "Permiso
-- Denegado". Encontrado al probar el RPC nuevo con datos reales antes de
-- tocar TypeScript.
CREATE OR REPLACE FUNCTION public.create_credit_note_bridged(
  p_tenant_id uuid,
  p_invoice_id uuid,
  p_client_id uuid,
  p_reason varchar,
  p_description text,
  p_subtotal numeric,
  p_tax_amount numeric,
  p_total_amount numeric,
  p_actor_user_id uuid
)
RETURNS public.credit_notes
LANGUAGE plpgsql SECURITY DEFINER
AS $function$
DECLARE
  v_cn public.credit_notes;
BEGIN
  PERFORM set_erp_actor_context(p_actor_user_id);

  INSERT INTO public.credit_notes (
    tenant_id, invoice_id, client_id, reason, description, subtotal, tax_amount, total_amount, status, created_by
  ) VALUES (
    p_tenant_id, p_invoice_id, p_client_id, p_reason, p_description, p_subtotal, p_tax_amount, p_total_amount, 'EMITIDA', p_actor_user_id
  )
  RETURNING * INTO v_cn;

  RETURN v_cn;
END;
$function$;
