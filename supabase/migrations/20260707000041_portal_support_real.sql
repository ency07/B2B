-- MIGRACIÓN: Tickets y mensajes de soporte REALES del Portal
-- Archivo: supabase/migrations/20260707000041_portal_support_real.sql
--
-- Contexto: el Portal (src/app/portal/client-page.tsx) simulaba tickets y
-- chat enteramente en el estado de React del navegador — se perdían al
-- recargar la página, y el "chat" respondía con texto inventado por
-- coincidencia de palabras clave, fingiendo ser un ingeniero real.
--
-- Dado que hoy el Portal es una herramienta de revisión para
-- SUPER_ADMIN/ADMIN_DEV (no hay login real de cliente externo, ver
-- migración 20260707000040), esto NO es un chat bidireccional con el
-- cliente todavía — es una bitácora real de casos de soporte que el admin
-- registra al revisar el caso de un cliente. Cuando exista login real de
-- cliente (client_contacts), sender_type CLIENT empieza a usarse de verdad.

CREATE TABLE client_support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    job_id uuid REFERENCES jobs(id) ON DELETE SET NULL,
    ticket_code varchar(50) NOT NULL,
    subject varchar(250) NOT NULL,
    description text NOT NULL,
    severity varchar(20) NOT NULL DEFAULT 'MEDIO' CHECK (severity IN ('BAJO','MEDIO','ALTO')),
    status varchar(30) NOT NULL DEFAULT 'ABIERTO' CHECK (status IN ('ABIERTO','EN_TRAMITE','RESUELTO','CERRADO')),
    created_by uuid REFERENCES users(id) ON DELETE SET NULL,
    created_at timestamp NOT NULL DEFAULT NOW(),
    updated_at timestamp NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_tenant_ticket_code UNIQUE (tenant_id, ticket_code)
);

CREATE TABLE client_support_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    ticket_id uuid REFERENCES client_support_tickets(id) ON DELETE SET NULL,
    sender_type varchar(20) NOT NULL CHECK (sender_type IN ('CLIENT','STAFF')),
    sender_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    sender_label varchar(150),
    body text NOT NULL,
    created_at timestamp NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_client ON client_support_tickets(client_id);
CREATE INDEX idx_support_messages_client ON client_support_messages(client_id, created_at DESC);

ALTER TABLE client_support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_support_messages ENABLE ROW LEVEL SECURITY;

-- RLS tenant-wide normal para el ERP (staff interno del tenant puede ver/gestionar).
CREATE POLICY support_tickets_select_tenant ON client_support_tickets FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) OR is_platform_super_admin()
);
CREATE POLICY support_tickets_write_tenant ON client_support_tickets FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) OR is_platform_super_admin()
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) OR is_platform_super_admin()
);

CREATE POLICY support_messages_select_tenant ON client_support_messages FOR SELECT TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) OR is_platform_super_admin()
);
CREATE POLICY support_messages_write_tenant ON client_support_messages FOR ALL TO authenticated USING (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) OR is_platform_super_admin()
) WITH CHECK (
    tenant_id = (SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1) OR is_platform_super_admin()
);

-- RPC del Portal: mismo patrón de la migración 40 (SECURITY DEFINER,
-- re-valida is_admin_reviewer() + tenant del cliente en SQL).

CREATE FUNCTION portal_get_client_tickets(p_client_id uuid)
RETURNS SETOF client_support_tickets AS $$
DECLARE
  v_admin_tenant_id uuid;
BEGIN
  IF NOT is_admin_reviewer() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol SUPER_ADMIN o ADMIN_DEV';
  END IF;
  v_admin_tenant_id := admin_reviewer_tenant_id();

  RETURN QUERY
  SELECT t.* FROM client_support_tickets t
  JOIN clients c ON c.id = t.client_id
  WHERE t.client_id = p_client_id
    AND (v_admin_tenant_id IS NULL OR c.tenant_id = v_admin_tenant_id)
  ORDER BY t.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

REVOKE ALL ON FUNCTION portal_get_client_tickets(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION portal_get_client_tickets(uuid) TO authenticated;

CREATE FUNCTION portal_create_client_ticket(
  p_client_id uuid,
  p_subject varchar,
  p_description text,
  p_severity varchar,
  p_job_id uuid DEFAULT NULL
)
RETURNS client_support_tickets AS $$
DECLARE
  v_admin_tenant_id uuid;
  v_client_tenant_id uuid;
  v_admin_user_id uuid;
  v_ticket client_support_tickets;
BEGIN
  IF NOT is_admin_reviewer() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol SUPER_ADMIN o ADMIN_DEV';
  END IF;
  v_admin_tenant_id := admin_reviewer_tenant_id();
  SELECT tenant_id INTO v_client_tenant_id FROM clients WHERE id = p_client_id;
  IF v_client_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cliente no encontrado';
  END IF;
  IF v_admin_tenant_id IS NOT NULL AND v_admin_tenant_id <> v_client_tenant_id THEN
    RAISE EXCEPTION 'Acceso cruzado denegado: el cliente no pertenece a tu tenant';
  END IF;
  SELECT id INTO v_admin_user_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;

  INSERT INTO client_support_tickets (
    tenant_id, client_id, job_id, ticket_code, subject, description, severity, created_by
  ) VALUES (
    v_client_tenant_id, p_client_id, p_job_id,
    'TCK-' || to_char(now(), 'YYYY') || '-' || upper(substr(gen_random_uuid()::text, 1, 6)),
    p_subject, p_description, p_severity, v_admin_user_id
  )
  RETURNING * INTO v_ticket;

  RETURN v_ticket;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION portal_create_client_ticket(uuid, varchar, text, varchar, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION portal_create_client_ticket(uuid, varchar, text, varchar, uuid) TO authenticated;

CREATE FUNCTION portal_get_client_messages(p_client_id uuid)
RETURNS SETOF client_support_messages AS $$
DECLARE
  v_admin_tenant_id uuid;
BEGIN
  IF NOT is_admin_reviewer() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol SUPER_ADMIN o ADMIN_DEV';
  END IF;
  v_admin_tenant_id := admin_reviewer_tenant_id();

  RETURN QUERY
  SELECT m.* FROM client_support_messages m
  JOIN clients c ON c.id = m.client_id
  WHERE m.client_id = p_client_id
    AND (v_admin_tenant_id IS NULL OR c.tenant_id = v_admin_tenant_id)
  ORDER BY m.created_at ASC
  LIMIT 200;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

REVOKE ALL ON FUNCTION portal_get_client_messages(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION portal_get_client_messages(uuid) TO authenticated;

-- El sender SIEMPRE es STAFF hoy: quien usa el Portal es un admin en modo
-- revisión, no el cliente (no existe login real de cliente todavía). No se
-- genera ninguna respuesta automática — es una bitácora real, de una sola
-- vía, hasta que exista login real de client_contacts.
CREATE FUNCTION portal_send_client_message(p_client_id uuid, p_body text)
RETURNS client_support_messages AS $$
DECLARE
  v_admin_tenant_id uuid;
  v_client_tenant_id uuid;
  v_admin_user_id uuid;
  v_admin_label text;
  v_message client_support_messages;
BEGIN
  IF NOT is_admin_reviewer() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol SUPER_ADMIN o ADMIN_DEV';
  END IF;
  v_admin_tenant_id := admin_reviewer_tenant_id();
  SELECT tenant_id INTO v_client_tenant_id FROM clients WHERE id = p_client_id;
  IF v_client_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Cliente no encontrado';
  END IF;
  IF v_admin_tenant_id IS NOT NULL AND v_admin_tenant_id <> v_client_tenant_id THEN
    RAISE EXCEPTION 'Acceso cruzado denegado: el cliente no pertenece a tu tenant';
  END IF;

  SELECT id, (first_name || ' ' || last_name) INTO v_admin_user_id, v_admin_label
  FROM users WHERE auth_user_id = auth.uid() LIMIT 1;

  INSERT INTO client_support_messages (
    tenant_id, client_id, sender_type, sender_user_id, sender_label, body
  ) VALUES (
    v_client_tenant_id, p_client_id, 'STAFF', v_admin_user_id, v_admin_label, p_body
  )
  RETURNING * INTO v_message;

  RETURN v_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE ALL ON FUNCTION portal_send_client_message(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION portal_send_client_message(uuid, text) TO authenticated;
