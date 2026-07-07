-- MIGRACIÓN: Funciones de lectura del Portal para revisión admin
-- Archivo: supabase/migrations/20260707000040_portal_admin_review_functions.sql
--
-- Contexto: el Portal de clientes NO es self-service hoy — client_contacts
-- no tiene ningún mecanismo de login. El Portal es una herramienta de
-- soporte: SUPER_ADMIN / ADMIN_DEV entra en modo "vista como cliente" para
-- diagnosticar con exactitud el problema de un cliente puntual.
--
-- Problema que esto corrige: src/portal/actions/portal.ts leía jobs/invoices/
-- payments con supabaseAdmin (service_role), que bypassea RLS por completo.
-- La única barrera era el chequeo de rol en TypeScript (getCurrentClient()).
-- Si ese chequeo tuviera un bug, no había ninguna red de contención en la BD.
--
-- Por qué RPC y no una policy RLS adicional en jobs/invoices/payments:
-- esas tablas ya tienen políticas RLS tenant-wide para el ERP normal (todo el
-- staff del tenant puede leerlas). RLS no puede distinguir "esta consulta
-- viene del Portal" de "esta consulta viene del ERP" — es la misma sesión,
-- mismo rol de Postgres. Una policy restrictiva ahí bloquearía también al
-- staff normal del ERP. La solución idiomática de Supabase para un camino de
-- lectura con reglas distintas al resto de la tabla es una función
-- SECURITY DEFINER dedicada, invocada vía .rpc().

-- 1. Función auxiliar: ¿el usuario autenticado es SUPER_ADMIN o ADMIN_DEV?
-- Usa el mismo criterio que ya confía src/lib/portal-auth.ts (isPlatformAdmin)
-- y src/platform/auth/server-guards.ts, para que la autorización de BD
-- coincida con la autorización de aplicación (no son dos fuentes de verdad
-- distintas que puedan divergir).
CREATE OR REPLACE FUNCTION is_admin_reviewer()
RETURNS boolean AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = v_user_id
      AND r.role_code IN ('SUPER_ADMIN', 'ADMIN_DEV')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

REVOKE ALL ON FUNCTION is_admin_reviewer() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_admin_reviewer() TO authenticated;

-- 1b. Función auxiliar: tenant_id del admin autenticado, o NULL.
-- IMPORTANTE: scripts/seed-admin-dev.ts crea ADMIN_DEV con tenant_id = NULL
-- (admin de plataforma, sin tenant propio — igual que SUPER_ADMIN). Si
-- comparáramos "c.tenant_id = tenant_id_del_admin" directo, esa comparación
-- sería NULL = NULL en SQL, que nunca es verdadero, y el admin de plataforma
-- vería siempre una lista vacía sin ningún error. Por eso las funciones de
-- abajo tratan "tenant_id NULL" como "sin restricción de tenant".
CREATE OR REPLACE FUNCTION admin_reviewer_tenant_id()
RETURNS uuid AS $$
  SELECT tenant_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

REVOKE ALL ON FUNCTION admin_reviewer_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION admin_reviewer_tenant_id() TO authenticated;

-- 2. OTs (jobs) de un cliente específico, solo para admin reviewer, y solo
-- si el cliente pertenece al mismo tenant del admin (salvo que el admin sea
-- de plataforma, tenant_id NULL, en cuyo caso puede ver cualquier tenant).
CREATE OR REPLACE FUNCTION portal_get_client_jobs(p_client_id uuid)
RETURNS SETOF jobs AS $$
DECLARE
  v_admin_tenant_id uuid;
BEGIN
  IF NOT is_admin_reviewer() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol SUPER_ADMIN o ADMIN_DEV';
  END IF;
  v_admin_tenant_id := admin_reviewer_tenant_id();

  RETURN QUERY
  SELECT j.* FROM jobs j
  JOIN clients c ON c.id = j.client_id
  WHERE j.client_id = p_client_id
    AND j.deleted_at IS NULL
    AND (v_admin_tenant_id IS NULL OR c.tenant_id = v_admin_tenant_id)
  ORDER BY j.created_at DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

REVOKE ALL ON FUNCTION portal_get_client_jobs(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION portal_get_client_jobs(uuid) TO authenticated;

-- 3. Facturas de un cliente específico, mismas reglas.
CREATE OR REPLACE FUNCTION portal_get_client_invoices(p_client_id uuid)
RETURNS SETOF invoices AS $$
DECLARE
  v_admin_tenant_id uuid;
BEGIN
  IF NOT is_admin_reviewer() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol SUPER_ADMIN o ADMIN_DEV';
  END IF;
  v_admin_tenant_id := admin_reviewer_tenant_id();

  RETURN QUERY
  SELECT i.* FROM invoices i
  JOIN clients c ON c.id = i.client_id
  WHERE i.client_id = p_client_id
    AND i.deleted_at IS NULL
    AND (v_admin_tenant_id IS NULL OR c.tenant_id = v_admin_tenant_id)
  ORDER BY i.invoice_date DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

REVOKE ALL ON FUNCTION portal_get_client_invoices(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION portal_get_client_invoices(uuid) TO authenticated;

-- 4. Pagos de un cliente específico (payments ya tiene client_id propio,
-- no hace falta pasar por invoices). Se incluye invoice_code vía join para
-- no requerir una segunda consulta en la aplicación.
-- DROP explícito: Postgres no permite CREATE OR REPLACE cuando cambia el
-- tipo de retorno (columnas de la tabla), así que esto hace la migración
-- reproducible aunque cambie el shape de la función en el futuro.
DROP FUNCTION IF EXISTS portal_get_client_payments(uuid);
CREATE FUNCTION portal_get_client_payments(p_client_id uuid)
RETURNS TABLE (
  id uuid,
  invoice_id uuid,
  invoice_code varchar,
  amount numeric,
  payment_date date,
  payment_method varchar
) AS $$
DECLARE
  v_admin_tenant_id uuid;
BEGIN
  IF NOT is_admin_reviewer() THEN
    RAISE EXCEPTION 'No autorizado: se requiere rol SUPER_ADMIN o ADMIN_DEV';
  END IF;
  v_admin_tenant_id := admin_reviewer_tenant_id();

  RETURN QUERY
  SELECT p.id, p.invoice_id, i.invoice_code, p.amount, p.payment_date, p.payment_method
  FROM payments p
  JOIN clients c ON c.id = p.client_id
  LEFT JOIN invoices i ON i.id = p.invoice_id
  WHERE p.client_id = p_client_id
    AND p.deleted_at IS NULL
    AND (v_admin_tenant_id IS NULL OR c.tenant_id = v_admin_tenant_id)
  ORDER BY p.payment_date DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

REVOKE ALL ON FUNCTION portal_get_client_payments(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION portal_get_client_payments(uuid) TO authenticated;
