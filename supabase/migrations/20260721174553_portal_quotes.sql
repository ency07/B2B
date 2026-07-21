-- ============================================================================
-- Portal · Cotizaciones (gap P-001 / P1-04)
--
-- Contexto: quotes ya tiene un motor de aprobación interno en producción
-- (enforce_quote_permissions, validate_quote_state_transitions,
-- route_quote_approvals) que exige rol GERENTE_GENERAL/DIRECTOR_COMERCIAL
-- para mover status a APROBADA/RECHAZADA. Un client_contact del portal no
-- tiene rol en ese sistema — la BD rechazaría cualquier intento de tocar
-- status directo desde el portal. Por eso la respuesta del cliente se
-- registra en columnas nuevas y separadas (client_response*), sin tocar
-- status ni ninguno de los triggers/funciones existentes. Decisión
-- confirmada con el usuario — ver specs/002-portal-client-quotes/spec.md
-- ("Contexto y decisión de diseño") y research.md (Decisión 2).
-- ============================================================================

-- ── 1. Columnas nuevas en quotes (nullable, aditivas) ────────────────────────

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS client_response         varchar(20),
  ADD COLUMN IF NOT EXISTS client_response_at       timestamptz,
  ADD COLUMN IF NOT EXISTS client_response_reason   text,
  ADD COLUMN IF NOT EXISTS client_response_by       uuid REFERENCES client_contacts(id) ON DELETE SET NULL;

ALTER TABLE quotes
  ADD CONSTRAINT quotes_client_response_check
  CHECK (client_response IS NULL OR client_response IN ('ACEPTADA', 'RECHAZADA'));

COMMENT ON COLUMN quotes.client_response IS
  'Respuesta del cliente vía portal — independiente de status (motor de aprobación interno). NULL = sin responder.';

-- ── 2. portal_get_client_quotes ───────────────────────────────────────────────
-- Lista para el cliente: solo estados ya "cerrados" hacia afuera, nunca
-- BORRADOR/EN_REVISION (trabajo interno). Sigue el patrón de
-- portal_get_client_requirements (versión con tenant-scoping ya corregida).

CREATE OR REPLACE FUNCTION portal_get_client_quotes(
  p_client_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id                      UUID,
  quote_code              VARCHAR,
  title                   VARCHAR,
  valid_until             DATE,
  total_amount            NUMERIC,
  status                  VARCHAR,
  client_response         VARCHAR,
  client_response_at      TIMESTAMPTZ,
  client_response_reason  TEXT,
  created_at              TIMESTAMP
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id       UUID;
  v_is_admin        boolean;
  v_admin_tenant_id UUID;
BEGIN
  v_is_admin := is_admin_reviewer();

  IF p_client_id IS NOT NULL AND v_is_admin THEN
    v_client_id := p_client_id;
  ELSE
    SELECT cc.client_id INTO v_client_id
    FROM client_contacts cc
    WHERE cc.auth_user_id = auth.uid() AND cc.deleted_at IS NULL
    LIMIT 1;
  END IF;

  IF v_client_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT (v_is_admin OR is_portal_client_for(v_client_id)) THEN
    RETURN;
  END IF;

  v_admin_tenant_id := CASE WHEN v_is_admin THEN admin_reviewer_tenant_id() ELSE NULL END;

  RETURN QUERY
  SELECT
    q.id,
    q.quote_code,
    COALESCE(r.title, q.quote_code)::varchar AS title,
    q.valid_until,
    q.total_amount,
    q.status,
    q.client_response,
    q.client_response_at,
    q.client_response_reason,
    q.created_at
  FROM quotes q
  JOIN clients c ON c.id = q.client_id
  LEFT JOIN requirements r ON r.id = q.requirement_id
  WHERE q.client_id = v_client_id
    AND q.deleted_at IS NULL
    AND q.status IN ('ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA', 'CANCELADA')
    AND (NOT v_is_admin OR v_admin_tenant_id IS NULL OR c.tenant_id = v_admin_tenant_id)
  ORDER BY q.created_at DESC
  LIMIT 50;
END;
$$;

REVOKE ALL ON FUNCTION portal_get_client_quotes(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION portal_get_client_quotes(uuid) TO authenticated;

COMMENT ON FUNCTION portal_get_client_quotes IS
  'Lista las cotizaciones "cerradas hacia afuera" de un cliente (nunca BORRADOR/EN_REVISION). SECURITY DEFINER.';

-- ── 3. portal_get_client_quote_items ──────────────────────────────────────────
-- Detalle bajo demanda: cabecera + items en un solo JSON. Reverifica
-- pertenencia al cliente aunque el quoteId ya venga de una lista que el
-- propio cliente vio (defensa en profundidad).

CREATE OR REPLACE FUNCTION portal_get_client_quote_detail(
  p_quote_id UUID,
  p_client_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id       UUID;
  v_is_admin        boolean;
  v_admin_tenant_id UUID;
  v_quote           record;
  v_items           json;
BEGIN
  v_is_admin := is_admin_reviewer();

  IF p_client_id IS NOT NULL AND v_is_admin THEN
    v_client_id := p_client_id;
  ELSE
    SELECT cc.client_id INTO v_client_id
    FROM client_contacts cc
    WHERE cc.auth_user_id = auth.uid() AND cc.deleted_at IS NULL
    LIMIT 1;
  END IF;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'CLIENT_NOT_FOUND';
  END IF;

  IF NOT (v_is_admin OR is_portal_client_for(v_client_id)) THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  v_admin_tenant_id := CASE WHEN v_is_admin THEN admin_reviewer_tenant_id() ELSE NULL END;

  SELECT q.id, q.quote_code, COALESCE(r.title, q.quote_code) AS title, q.valid_until,
         q.subtotal, q.discount_amount, q.tax_amount, q.total_amount, q.status,
         q.client_response, q.client_response_at, q.client_response_reason, q.created_at
  INTO v_quote
  FROM quotes q
  JOIN clients c ON c.id = q.client_id
  LEFT JOIN requirements r ON r.id = q.requirement_id
  WHERE q.id = p_quote_id
    AND q.client_id = v_client_id
    AND q.deleted_at IS NULL
    AND q.status IN ('ENVIADA', 'APROBADA', 'RECHAZADA', 'VENCIDA', 'CANCELADA')
    AND (NOT v_is_admin OR v_admin_tenant_id IS NULL OR c.tenant_id = v_admin_tenant_id);

  IF v_quote.id IS NULL THEN
    RAISE EXCEPTION 'QUOTE_NOT_FOUND';
  END IF;

  SELECT json_agg(
    json_build_object(
      'description', qi.description,
      'quantity', qi.quantity,
      'unit', qi.unit,
      'unitPrice', qi.unit_price,
      'lineTotal', qi.line_total
    ) ORDER BY qi.item_order ASC
  ) INTO v_items
  FROM quote_items qi
  WHERE qi.quote_id = v_quote.id;

  RETURN json_build_object(
    'quote', json_build_object(
      'id', v_quote.id,
      'code', v_quote.quote_code,
      'title', v_quote.title,
      'validUntil', v_quote.valid_until,
      'totalAmount', v_quote.total_amount,
      'status', v_quote.status,
      'clientResponse', v_quote.client_response,
      'clientResponseAt', v_quote.client_response_at,
      'clientResponseReason', v_quote.client_response_reason,
      'createdAt', v_quote.created_at
    ),
    'items', COALESCE(v_items, '[]'::json),
    'subtotal', v_quote.subtotal,
    'discountAmount', v_quote.discount_amount,
    'taxAmount', v_quote.tax_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION portal_get_client_quote_detail(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION portal_get_client_quote_detail(uuid, uuid) TO authenticated;

COMMENT ON FUNCTION portal_get_client_quote_detail IS
  'Detalle de una cotización (cabecera + items) para el portal, con re-chequeo de pertenencia al cliente. SECURITY DEFINER.';

-- ── 4. portal_respond_to_quote ────────────────────────────────────────────────
-- Mutación: SOLO escribe client_response* — nunca status. Solo aplica sobre
-- cotizaciones ENVIADA sin respuesta previa.

CREATE OR REPLACE FUNCTION portal_respond_to_quote(
  p_quote_id  UUID,
  p_response  VARCHAR,
  p_reason    TEXT DEFAULT NULL,
  p_client_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id       UUID;
  v_contact_id      UUID;
  v_is_admin        boolean;
  v_admin_tenant_id UUID;
  v_quote           record;
BEGIN
  v_is_admin := is_admin_reviewer();

  IF p_client_id IS NOT NULL AND v_is_admin THEN
    v_client_id := p_client_id;
    v_contact_id := NULL; -- modo admin-preview: no hay contacto real que atribuir
  ELSE
    SELECT cc.client_id, cc.id INTO v_client_id, v_contact_id
    FROM client_contacts cc
    WHERE cc.auth_user_id = auth.uid() AND cc.deleted_at IS NULL
    LIMIT 1;
  END IF;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'CLIENT_NOT_FOUND';
  END IF;

  IF NOT (v_is_admin OR is_portal_client_for(v_client_id)) THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  IF p_response NOT IN ('ACEPTADA', 'RECHAZADA') THEN
    RAISE EXCEPTION 'INVALID_RESPONSE';
  END IF;

  IF p_response = 'RECHAZADA' AND (p_reason IS NULL OR length(trim(p_reason)) < 10) THEN
    RAISE EXCEPTION 'Para rechazar una cotización se debe ingresar un motivo de al menos 10 caracteres.';
  END IF;

  v_admin_tenant_id := CASE WHEN v_is_admin THEN admin_reviewer_tenant_id() ELSE NULL END;

  UPDATE quotes q
  SET client_response = p_response,
      client_response_at = NOW(),
      client_response_reason = p_reason,
      client_response_by = v_contact_id
  FROM clients c
  WHERE q.id = p_quote_id
    AND c.id = q.client_id
    AND q.client_id = v_client_id
    AND q.deleted_at IS NULL
    AND q.status = 'ENVIADA'
    AND q.client_response IS NULL
    AND (NOT v_is_admin OR v_admin_tenant_id IS NULL OR c.tenant_id = v_admin_tenant_id)
  RETURNING q.* INTO v_quote;

  IF v_quote.id IS NULL THEN
    RAISE EXCEPTION 'No se pudo registrar la respuesta: la cotización no existe, no está en estado ENVIADA, o ya fue respondida.';
  END IF;

  -- Trazabilidad de negocio: dispatch_quote_events() solo reacciona a cambios
  -- de status, y esta acción deliberadamente no toca status (ver cabecera).
  INSERT INTO business_events (tenant_id, event_code, entity_type, entity_id, payload, created_by)
  VALUES (
    v_quote.tenant_id,
    'QUOTE_CLIENT_RESPONSE',
    'QUOTE',
    v_quote.id,
    jsonb_build_object(
      'quote_code', v_quote.quote_code,
      'client_response', p_response,
      'reason', p_reason
    ),
    NULL -- actor es un client_contact, no un users.id (created_by referencia users)
  );

  RETURN json_build_object(
    'id', v_quote.id,
    'code', v_quote.quote_code,
    'status', v_quote.status,
    'clientResponse', v_quote.client_response,
    'clientResponseAt', v_quote.client_response_at,
    'clientResponseReason', v_quote.client_response_reason
  );
END;
$$;

REVOKE ALL ON FUNCTION portal_respond_to_quote(uuid, varchar, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION portal_respond_to_quote(uuid, varchar, text, uuid) TO authenticated;

COMMENT ON FUNCTION portal_respond_to_quote IS
  'Registra la respuesta (ACEPTADA/RECHAZADA) del cliente a una cotización ENVIADA. NO modifica quotes.status — el motor de aprobación interno (enforce_quote_permissions, validate_quote_state_transitions) queda intacto. SECURITY DEFINER.';
