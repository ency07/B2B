-- MIGRACIÓN: Acceso real de clientes al Portal
-- Archivo: supabase/migrations/20260708000042_portal_client_access.sql
--
-- Contexto: el Portal era solo de revisión para SUPER_ADMIN/ADMIN_DEV.
-- Esta migración añade soporte para que client_contacts (personas reales de
-- la empresa del cliente) puedan tener login propio y ver únicamente sus
-- propios datos.
--
-- El flujo es:
--   1. Admin ERP selecciona un contacto y hace click en "Invitar al Portal"
--   2. La Server Action llama a supabase.auth.admin.inviteUserByEmail()
--   3. Supabase crea un auth.users y envía email con link de registro
--   4. La SA actualiza client_contacts.auth_user_id con el nuevo user_id
--   5. El cliente establece contraseña y accede al portal
--   6. getCurrentClient() en portal-auth.ts detecta el auth.uid() en
--      client_contacts.auth_user_id y devuelve solo la empresa de ese contacto
--
-- Aislamiento garantizado en dos capas:
--   Layer 1: getCurrentClient() devuelve SOLO el client_id del contacto,
--             ignorando cualquier previewClientId aunque llegue en la URL.
--   Layer 2: is_portal_client_for(p_client_id) verifica en SQL que
--             auth.uid() corresponde a un contacto de ese client_id exacto.

-- ── 1. SCHEMA: columnas nuevas en client_contacts ────────────────────────────

ALTER TABLE client_contacts
  ADD COLUMN IF NOT EXISTS auth_user_id    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS portal_invited_at    timestamptz,
  ADD COLUMN IF NOT EXISTS portal_registered_at timestamptz;

-- Garantiza que un auth_user solo puede ser contacto de una empresa.
CREATE UNIQUE INDEX IF NOT EXISTS ux_client_contacts_auth_user
  ON client_contacts(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- ── 2. RLS en client_contacts ─────────────────────────────────────────────────

ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;

-- Staff del tenant puede leer todos los contactos de su tenant.
DROP POLICY IF EXISTS cc_tenant_read ON client_contacts;
CREATE POLICY cc_tenant_read ON client_contacts
  FOR SELECT TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    OR is_platform_super_admin()
  );

-- Staff del tenant puede escribir contactos de su tenant.
DROP POLICY IF EXISTS cc_tenant_write ON client_contacts;
CREATE POLICY cc_tenant_write ON client_contacts
  FOR ALL TO authenticated
  USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    OR is_platform_super_admin()
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
    OR is_platform_super_admin()
  );

-- Un client contact puede leer su propia fila (necesario para lookups de
-- perfil en el portal; las lecturas de datos de negocio van por RPC).
DROP POLICY IF EXISTS cc_own_read ON client_contacts;
CREATE POLICY cc_own_read ON client_contacts
  FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

-- ── 3. HELPER: ¿es el usuario autenticado un contacto de este cliente? ────────

CREATE OR REPLACE FUNCTION is_portal_client_for(p_client_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM client_contacts
    WHERE client_id = p_client_id
      AND auth_user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

REVOKE ALL ON FUNCTION is_portal_client_for(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_portal_client_for(uuid) TO authenticated;

-- ── 4. UPDATE: portal_get_client_jobs (lectura, acepta admin O cliente) ───────

CREATE OR REPLACE FUNCTION portal_get_client_jobs(p_client_id uuid)
RETURNS SETOF jobs AS $$
DECLARE
  v_is_admin        boolean;
  v_admin_tenant_id uuid;
BEGIN
  v_is_admin := is_admin_reviewer();
  IF NOT (v_is_admin OR is_portal_client_for(p_client_id)) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  v_admin_tenant_id := CASE WHEN v_is_admin THEN admin_reviewer_tenant_id() ELSE NULL END;

  RETURN QUERY
  SELECT j.* FROM jobs j
  JOIN clients c ON c.id = j.client_id
  WHERE j.client_id = p_client_id
    AND j.deleted_at IS NULL
    AND (NOT v_is_admin OR v_admin_tenant_id IS NULL OR c.tenant_id = v_admin_tenant_id)
  ORDER BY j.created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── 5. UPDATE: portal_get_client_invoices ────────────────────────────────────

CREATE OR REPLACE FUNCTION portal_get_client_invoices(p_client_id uuid)
RETURNS SETOF invoices AS $$
DECLARE
  v_is_admin        boolean;
  v_admin_tenant_id uuid;
BEGIN
  v_is_admin := is_admin_reviewer();
  IF NOT (v_is_admin OR is_portal_client_for(p_client_id)) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  v_admin_tenant_id := CASE WHEN v_is_admin THEN admin_reviewer_tenant_id() ELSE NULL END;

  RETURN QUERY
  SELECT i.* FROM invoices i
  JOIN clients c ON c.id = i.client_id
  WHERE i.client_id = p_client_id
    AND i.deleted_at IS NULL
    AND (NOT v_is_admin OR v_admin_tenant_id IS NULL OR c.tenant_id = v_admin_tenant_id)
  ORDER BY i.invoice_date DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── 6. UPDATE: portal_get_client_payments ────────────────────────────────────
-- DROP requerido: Postgres no permite CREATE OR REPLACE si no coincide la firma
-- exacta del tipo de retorno (RETURNS TABLE vs SETOF).

DROP FUNCTION IF EXISTS portal_get_client_payments(uuid);
CREATE FUNCTION portal_get_client_payments(p_client_id uuid)
RETURNS TABLE (
  id             uuid,
  invoice_id     uuid,
  invoice_code   varchar,
  amount         numeric,
  payment_date   date,
  payment_method varchar
) AS $$
DECLARE
  v_is_admin        boolean;
  v_admin_tenant_id uuid;
BEGIN
  v_is_admin := is_admin_reviewer();
  IF NOT (v_is_admin OR is_portal_client_for(p_client_id)) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  v_admin_tenant_id := CASE WHEN v_is_admin THEN admin_reviewer_tenant_id() ELSE NULL END;

  RETURN QUERY
  SELECT p.id, p.invoice_id, i.invoice_code, p.amount, p.payment_date, p.payment_method
  FROM payments p
  JOIN clients c ON c.id = p.client_id
  LEFT JOIN invoices i ON i.id = p.invoice_id
  WHERE p.client_id = p_client_id
    AND p.deleted_at IS NULL
    AND (NOT v_is_admin OR v_admin_tenant_id IS NULL OR c.tenant_id = v_admin_tenant_id)
  ORDER BY p.payment_date DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

REVOKE ALL ON FUNCTION portal_get_client_payments(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION portal_get_client_payments(uuid) TO authenticated;

-- ── 7. UPDATE: portal_get_client_tickets ─────────────────────────────────────

CREATE OR REPLACE FUNCTION portal_get_client_tickets(p_client_id uuid)
RETURNS SETOF client_support_tickets AS $$
DECLARE
  v_is_admin        boolean;
  v_admin_tenant_id uuid;
BEGIN
  v_is_admin := is_admin_reviewer();
  IF NOT (v_is_admin OR is_portal_client_for(p_client_id)) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  v_admin_tenant_id := CASE WHEN v_is_admin THEN admin_reviewer_tenant_id() ELSE NULL END;

  RETURN QUERY
  SELECT t.* FROM client_support_tickets t
  JOIN clients c ON c.id = t.client_id
  WHERE t.client_id = p_client_id
    AND (NOT v_is_admin OR v_admin_tenant_id IS NULL OR c.tenant_id = v_admin_tenant_id)
  ORDER BY t.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── 8. UPDATE: portal_get_client_messages ────────────────────────────────────

CREATE OR REPLACE FUNCTION portal_get_client_messages(p_client_id uuid)
RETURNS SETOF client_support_messages AS $$
DECLARE
  v_is_admin        boolean;
  v_admin_tenant_id uuid;
BEGIN
  v_is_admin := is_admin_reviewer();
  IF NOT (v_is_admin OR is_portal_client_for(p_client_id)) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;
  v_admin_tenant_id := CASE WHEN v_is_admin THEN admin_reviewer_tenant_id() ELSE NULL END;

  RETURN QUERY
  SELECT m.* FROM client_support_messages m
  JOIN clients c ON c.id = m.client_id
  WHERE m.client_id = p_client_id
    AND (NOT v_is_admin OR v_admin_tenant_id IS NULL OR c.tenant_id = v_admin_tenant_id)
  ORDER BY m.created_at ASC
  LIMIT 200;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ── 9. UPDATE: portal_create_client_ticket ───────────────────────────────────
-- Ahora client contacts también pueden abrir tickets (sender_type = 'CLIENT').

CREATE OR REPLACE FUNCTION portal_create_client_ticket(
  p_client_id   uuid,
  p_subject     varchar,
  p_description text,
  p_severity    varchar,
  p_job_id      uuid DEFAULT NULL
)
RETURNS client_support_tickets AS $$
DECLARE
  v_is_admin         boolean;
  v_admin_tenant_id  uuid;
  v_client_tenant_id uuid;
  v_sender_type      varchar(20);
  v_creator_user_id  uuid;
  v_ticket           client_support_tickets;
BEGIN
  v_is_admin := is_admin_reviewer();
  IF NOT (v_is_admin OR is_portal_client_for(p_client_id)) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT tenant_id INTO v_client_tenant_id FROM clients WHERE id = p_client_id;
  IF v_client_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cliente no encontrado';
  END IF;

  IF v_is_admin THEN
    v_admin_tenant_id := admin_reviewer_tenant_id();
    IF v_admin_tenant_id IS NOT NULL AND v_admin_tenant_id <> v_client_tenant_id THEN
      RAISE EXCEPTION 'Acceso cruzado denegado: el cliente no pertenece a tu tenant';
    END IF;
    v_sender_type := 'STAFF';
    SELECT id INTO v_creator_user_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
  ELSE
    v_sender_type := 'CLIENT';
    v_creator_user_id := NULL;
  END IF;

  INSERT INTO client_support_tickets (
    tenant_id, client_id, job_id, ticket_code,
    subject, description, severity, created_by
  ) VALUES (
    v_client_tenant_id, p_client_id, p_job_id,
    'TCK-' || to_char(now(), 'YYYY') || '-' || upper(substr(gen_random_uuid()::text, 1, 6)),
    p_subject, p_description, p_severity, v_creator_user_id
  )
  RETURNING * INTO v_ticket;

  RETURN v_ticket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 10. UPDATE: portal_send_client_message ───────────────────────────────────
-- Client contacts envían con sender_type = 'CLIENT' y su nombre como label.

CREATE OR REPLACE FUNCTION portal_send_client_message(p_client_id uuid, p_body text)
RETURNS client_support_messages AS $$
DECLARE
  v_is_admin         boolean;
  v_admin_tenant_id  uuid;
  v_client_tenant_id uuid;
  v_sender_type      varchar(20);
  v_sender_user_id   uuid;
  v_sender_label     text;
  v_message          client_support_messages;
BEGIN
  v_is_admin := is_admin_reviewer();
  IF NOT (v_is_admin OR is_portal_client_for(p_client_id)) THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT tenant_id INTO v_client_tenant_id FROM clients WHERE id = p_client_id;
  IF v_client_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cliente no encontrado';
  END IF;

  IF v_is_admin THEN
    v_admin_tenant_id := admin_reviewer_tenant_id();
    IF v_admin_tenant_id IS NOT NULL AND v_admin_tenant_id <> v_client_tenant_id THEN
      RAISE EXCEPTION 'Acceso cruzado denegado: el cliente no pertenece a tu tenant';
    END IF;
    v_sender_type := 'STAFF';
    SELECT id, (first_name || ' ' || last_name)
    INTO v_sender_user_id, v_sender_label
    FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
  ELSE
    v_sender_type := 'CLIENT';
    v_sender_user_id := NULL;
    SELECT (first_name || COALESCE(' ' || last_name, ''))
    INTO v_sender_label
    FROM client_contacts WHERE auth_user_id = auth.uid() LIMIT 1;
  END IF;

  INSERT INTO client_support_messages (
    tenant_id, client_id, sender_type, sender_user_id, sender_label, body
  ) VALUES (
    v_client_tenant_id, p_client_id, v_sender_type, v_sender_user_id, v_sender_label, p_body
  )
  RETURNING * INTO v_message;

  RETURN v_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
