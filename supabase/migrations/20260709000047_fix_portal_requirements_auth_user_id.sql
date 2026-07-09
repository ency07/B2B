-- =============================================================================
-- FIX: portal_get_client_requirements y portal_create_client_requirement
-- Bug: cc.user_id no existe; la columna correcta es cc.auth_user_id
-- (agregada en migración 42_portal_client_access)
-- Impacto: clientes reales del portal no podían listar ni crear requerimientos
-- =============================================================================

CREATE OR REPLACE FUNCTION portal_get_client_requirements(
  p_client_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id               UUID,
  requirement_code VARCHAR,
  title            VARCHAR,
  description      TEXT,
  category         VARCHAR,
  priority         VARCHAR,
  status           VARCHAR,
  created_at       TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id UUID;
BEGIN
  -- Resolver client_id: admin puede ver cualquier cliente, el cliente real solo el suyo
  IF p_client_id IS NOT NULL AND is_admin_reviewer() THEN
    v_client_id := p_client_id;
  ELSE
    SELECT cc.client_id INTO v_client_id
    FROM client_contacts cc
    WHERE cc.auth_user_id = auth.uid() AND cc.deleted_at IS NULL
    LIMIT 1;
  END IF;

  -- Sin acceso si no hay cliente resuelto
  IF v_client_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT (is_admin_reviewer() OR is_portal_client_for(v_client_id)) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    r.id,
    r.requirement_code,
    r.title,
    r.description,
    r.category,
    r.priority,
    r.status,
    r.created_at
  FROM requirements r
  WHERE r.client_id = v_client_id
    AND r.deleted_at IS NULL
  ORDER BY r.created_at DESC
  LIMIT 50;
END;
$$;

CREATE OR REPLACE FUNCTION portal_create_client_requirement(
  p_title       TEXT,
  p_description TEXT,
  p_category    TEXT,
  p_priority    TEXT,
  p_client_id   UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id      UUID;
  v_tenant_id      UUID;
  v_contact_id     UUID;
  v_system_user_id UUID;
  v_req_id         UUID;
  v_req_code       VARCHAR;
BEGIN
  -- Resolver client_id y contact_id
  IF p_client_id IS NOT NULL AND is_admin_reviewer() THEN
    v_client_id := p_client_id;
    -- En modo admin preview no hay contact_id real
  ELSE
    SELECT cc.client_id, cc.id
      INTO v_client_id, v_contact_id
    FROM client_contacts cc
    WHERE cc.auth_user_id = auth.uid() AND cc.deleted_at IS NULL
    LIMIT 1;
  END IF;

  IF v_client_id IS NULL THEN
    RAISE EXCEPTION 'CLIENT_NOT_FOUND';
  END IF;

  IF NOT (is_admin_reviewer() OR is_portal_client_for(v_client_id)) THEN
    RAISE EXCEPTION 'ACCESS_DENIED';
  END IF;

  -- Resolver tenant_id del cliente
  SELECT tenant_id INTO v_tenant_id
  FROM clients
  WHERE id = v_client_id AND deleted_at IS NULL;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'TENANT_NOT_FOUND';
  END IF;

  -- Usar el primer usuario del tenant como created_by (source='PORTAL' identifica el origen)
  SELECT id INTO v_system_user_id
  FROM users
  WHERE tenant_id = v_tenant_id AND deleted_at IS NULL
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_system_user_id IS NULL THEN
    RAISE EXCEPTION 'NO_TENANT_USER';
  END IF;

  -- Insertar el requerimiento con status='NUEVO' directo (el cliente ya confirmó)
  INSERT INTO requirements (
    tenant_id,
    client_id,
    contact_id,
    title,
    description,
    category,
    priority,
    status,
    source,
    created_by
  ) VALUES (
    v_tenant_id,
    v_client_id,
    v_contact_id,
    p_title,
    p_description,
    p_category,
    p_priority,
    'NUEVO',
    'PORTAL',
    v_system_user_id
  )
  RETURNING id, requirement_code INTO v_req_id, v_req_code;

  RETURN json_build_object(
    'id',               v_req_id,
    'requirement_code', v_req_code,
    'title',            p_title,
    'description',      p_description,
    'category',         p_category,
    'priority',         p_priority,
    'status',           'NUEVO',
    'created_at',       NOW()
  );
END;
$$;

COMMENT ON FUNCTION portal_get_client_requirements IS
  'Lista los requerimientos de un cliente accediendo desde el portal. SECURITY DEFINER.';

COMMENT ON FUNCTION portal_create_client_requirement IS
  'Crea un requerimiento desde el portal con source=PORTAL y status=NUEVO. SECURITY DEFINER.';
