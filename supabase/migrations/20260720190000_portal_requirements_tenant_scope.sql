-- ============================================================================
-- Portal · Fix de aislamiento (auditoría Portal · Fase 2 — RLS/aislamiento)
--
-- Brecha: portal_get_client_requirements era el ÚNICO de los 9 RPC del portal
-- que NO acotaba al admin-reviewer a su propio tenant. Los otros 8 filtran
--   AND (NOT v_is_admin OR v_admin_tenant_id IS NULL OR c.tenant_id = v_admin_tenant_id)
-- de modo que un SUPER_ADMIN/ADMIN_DEV solo ve clientes de SU tenant. Aquí
-- faltaba, permitiendo a un admin leer requerimientos de un cliente de OTRO
-- tenant vía p_client_id.
--
-- Los clientes reales NUNCA se vieron afectados: para no-admin, v_client_id se
-- deriva de auth.uid() (se ignora p_client_id). Este fix es de consistencia
-- cross-tenant para el path de admin-reviewer.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.portal_get_client_requirements(p_client_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  id uuid,
  requirement_code character varying,
  title character varying,
  description text,
  category character varying,
  priority character varying,
  status character varying,
  created_at timestamp without time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_client_id       uuid;
  v_is_admin        boolean;
  v_admin_tenant_id uuid;
BEGIN
  v_is_admin := is_admin_reviewer();

  -- Admin: puede indicar el cliente; cliente real: se deriva de auth.uid().
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
    r.id,
    r.requirement_code,
    r.title,
    r.description,
    r.category,
    r.priority,
    r.status,
    r.created_at
  FROM requirements r
  JOIN clients c ON c.id = r.client_id
  WHERE r.client_id = v_client_id
    AND r.deleted_at IS NULL
    -- Aislamiento de tenant para admin-reviewer (igual que los otros 8 RPC).
    AND (NOT v_is_admin OR v_admin_tenant_id IS NULL OR c.tenant_id = v_admin_tenant_id)
  ORDER BY r.created_at DESC
  LIMIT 50;
END;
$function$;
