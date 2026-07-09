-- ==========================================================================
-- Security Fixes — 2026-07-09
-- Hallazgos: C-01, C-02, C-03 (CRÍTICO), H-02, H-03, H-04 (ALTO)
-- ==========================================================================

-- ── C-01: Eliminar SELECT anon sin filtro de tenant en clients ──────────────
DROP POLICY IF EXISTS clients_select_anon ON public.clients;

-- ── C-02: Eliminar SELECT anon sin filtro de tenant en client_contacts ──────
DROP POLICY IF EXISTS client_contacts_select_anon ON public.client_contacts;

-- ── C-03: Eliminar SELECT anon irrestricto en diagnostic_reports ────────────
DROP POLICY IF EXISTS diagnostic_reports_select_anon ON public.diagnostic_reports;

-- ── H-04: Eliminar enumeración pública de tenants activos ───────────────────
DROP POLICY IF EXISTS tenants_select_anon ON public.tenants;

-- ── H-03: Reemplazar INSERT anon WITH CHECK (true) con validación de tenant ──
-- Función SECURITY DEFINER para que el anon role pueda validar un tenant
-- sin necesitar SELECT directo sobre la tabla tenants.
CREATE OR REPLACE FUNCTION public.is_active_tenant(p_tenant_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.tenants
    WHERE id = p_tenant_id
      AND status = 'Activo'
      AND deleted_at IS NULL
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

REVOKE ALL ON FUNCTION public.is_active_tenant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_tenant(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_active_tenant(uuid) TO authenticated;

-- Mejorar INSERT anon en clients
DROP POLICY IF EXISTS clients_insert_anon ON public.clients;
CREATE POLICY clients_insert_anon ON public.clients
    FOR INSERT TO anon
    WITH CHECK (public.is_active_tenant(tenant_id));

-- Mejorar INSERT anon en client_contacts
DROP POLICY IF EXISTS client_contacts_insert_anon ON public.client_contacts;
CREATE POLICY client_contacts_insert_anon ON public.client_contacts
    FOR INSERT TO anon
    WITH CHECK (public.is_active_tenant(tenant_id));

-- Mejorar INSERT anon en leads
DROP POLICY IF EXISTS leads_insert_anon ON public.leads;
CREATE POLICY leads_insert_anon ON public.leads
    FOR INSERT TO anon
    WITH CHECK (public.is_active_tenant(tenant_id));

-- Mejorar INSERT anon en diagnostic_reports
DROP POLICY IF EXISTS diagnostic_reports_insert_anon ON public.diagnostic_reports;
CREATE POLICY diagnostic_reports_insert_anon ON public.diagnostic_reports
    FOR INSERT TO anon
    WITH CHECK (public.is_active_tenant(tenant_id));

-- Mejorar INSERT anon en wizard_sessions (si existe)
DROP POLICY IF EXISTS wizard_sessions_insert_anon ON public.wizard_sessions;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'wizard_sessions'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY wizard_sessions_insert_anon ON public.wizard_sessions
          FOR INSERT TO anon
          WITH CHECK (public.is_active_tenant(tenant_id))
    $pol$;
  END IF;
END;
$$;

-- ── H-02: Proteger audit_logs contra DELETE/UPDATE (si la tabla existe) ─────
CREATE OR REPLACE FUNCTION public.block_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Los registros de auditoría son inmutables. Operación no permitida.';
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
  ) THEN
    -- Reemplazar la política FOR ALL (que incluye DELETE) con INSERT-only
    DROP POLICY IF EXISTS audit_logs_modify_tenant ON public.audit_logs;

    EXECUTE $pol$
      CREATE POLICY audit_logs_insert_tenant ON public.audit_logs
        FOR INSERT TO authenticated
        WITH CHECK (
          tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
          OR (SELECT public.is_platform_super_admin())
        )
    $pol$;

    -- Trigger que bloquea DELETE y UPDATE físico sobre audit_logs
    IF NOT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'trg_block_audit_logs_mutation'
        AND tgrelid = 'public.audit_logs'::regclass
    ) THEN
      EXECUTE $trig$
        CREATE TRIGGER trg_block_audit_logs_mutation
          BEFORE DELETE OR UPDATE ON public.audit_logs
          FOR EACH ROW EXECUTE FUNCTION public.block_audit_log_mutation()
      $trig$;
    END IF;
  END IF;
END;
$$;
