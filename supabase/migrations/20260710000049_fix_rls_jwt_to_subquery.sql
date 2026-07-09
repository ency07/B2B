-- =============================================================================
-- MIGRACIÓN 49: Reemplazar patrón JWT por subquery en todas las RLS policies
-- =============================================================================
--
-- PROBLEMA:
--   [auth.hook.custom_access_token] NO está configurado en config.toml.
--   Las policies de migración 39 (y otras) usan:
--     tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
--   Sin el hook, ese claim es siempre NULL → NULL::uuid ≠ cualquier UUID →
--   la condición es siempre FALSE → los usuarios autenticados son bloqueados
--   por las policies (solo se salvan via is_platform_super_admin()).
--
-- SOLUCIÓN:
--   Reemplazar el patrón JWT con la subquery ya usada en migración 42:
--     tenant_id = (SELECT u.tenant_id FROM public.users u
--                  WHERE u.auth_user_id = auth.uid() LIMIT 1)
--
--   Funciona sin ningún Auth Hook. Resuelve tenant_id en tiempo de ejecución
--   leyendo la tabla public.users donde están registrados los usuarios ERP.
--   (Los contactos de portal no están en public.users y no deben tener
--    acceso directo a estas tablas — usan SECURITY DEFINER functions.)
--
-- TABLAS AFECTADAS: 48 de migración 39 + tenant_settings (mig 31)
--                   + tenant_branding_version (mig 37)
-- CASOS ESPECIALES:
--   - client_contacts: solo se eliminan las policies JWT; migración 42 ya
--     tiene cc_tenant_read/cc_tenant_write/cc_own_read correctas.
--   - audit_logs: write policy queda como INSERT-only (no ALL) para que el
--     trigger trg_block_audit_logs_mutation pueda seguir bloqueando DELETE/UPDATE.
-- =============================================================================

-- ── HELPER: subquery reutilizable (como texto) ─────────────────────────────
-- tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
-- OR public.is_platform_super_admin()

-- =============================================================================
-- BLOQUE 1: 46 tablas estándar de migración 39
--           (excluye client_contacts y audit_logs que tienen manejo especial)
-- =============================================================================

DO $$
DECLARE
  t TEXT;
  standard_tables TEXT[] := ARRAY[
    'clients',
    'leads',
    'diagnostic_reports',
    'wizard_sessions',
    'requirements',
    'quotes',
    'quote_items',
    'approvals',
    'approval_items',
    'tasks',
    'jobs_gantt_tasks',
    'jobs',
    'job_tasks',
    'inventory_items',
    'inventory_transactions',
    'invoices',
    'invoice_items',
    'purchase_orders',
    'purchase_order_items',
    'warranty_registrations',
    'documents',
    'notifications',
    'marketing_campaigns',
    'contact_form_submissions',
    'costs',
    'profitability_records',
    'sync_logs',
    'custom_field_definitions',
    'custom_field_values',
    'automation_rules',
    'tenant_sequences',
    'branding_versions',
    'product_categories',
    'product_subcategories',
    'product_families',
    'product_series',
    'products',
    'product_specifications',
    'product_images',
    'product_documents',
    'product_files',
    'website_pages',
    'seo_metadata',
    'media_assets',
    'user_roles',
    'user_sessions'
  ];
BEGIN
  FOREACH t IN ARRAY standard_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      -- Eliminar policies JWT de migración 39
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_select_tenant', t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_modify_tenant', t);

      -- SELECT: subquery sin JWT
      EXECUTE format(
        'CREATE POLICY %I ON public.%I
           FOR SELECT TO authenticated
           USING (
             tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
             OR public.is_platform_super_admin()
           )',
        t || '_select_tenant', t
      );

      -- ALL (INSERT/UPDATE/DELETE): subquery sin JWT
      EXECUTE format(
        'CREATE POLICY %I ON public.%I
           FOR ALL TO authenticated
           USING (
             tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
             OR public.is_platform_super_admin()
           )
           WITH CHECK (
             tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
             OR public.is_platform_super_admin()
           )',
        t || '_modify_tenant', t
      );
    END IF;
  END LOOP;
END;
$$;

-- =============================================================================
-- BLOQUE 2: client_contacts — solo eliminar policies JWT de migración 39
--           (migración 42 ya tiene cc_tenant_read/cc_tenant_write/cc_own_read)
-- =============================================================================

DROP POLICY IF EXISTS client_contacts_select_tenant ON public.client_contacts;
DROP POLICY IF EXISTS client_contacts_modify_tenant ON public.client_contacts;

-- =============================================================================
-- BLOQUE 3: audit_logs — caso especial (write = INSERT-only, no ALL)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
  ) THEN
    -- Eliminar todas las policies JWT sobre audit_logs
    DROP POLICY IF EXISTS audit_logs_select_tenant  ON public.audit_logs;
    DROP POLICY IF EXISTS audit_logs_modify_tenant  ON public.audit_logs;  -- mig 39 ALL
    DROP POLICY IF EXISTS audit_logs_insert_tenant  ON public.audit_logs;  -- mig 46 INSERT

    -- SELECT con subquery
    CREATE POLICY audit_logs_select_tenant ON public.audit_logs
      FOR SELECT TO authenticated
      USING (
        tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
        OR public.is_platform_super_admin()
      );

    -- INSERT-only (los triggers bloquean DELETE/UPDATE — no usar FOR ALL)
    CREATE POLICY audit_logs_insert_tenant ON public.audit_logs
      FOR INSERT TO authenticated
      WITH CHECK (
        tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
        OR public.is_platform_super_admin()
      );
  END IF;
END;
$$;

-- =============================================================================
-- BLOQUE 4: tenant_sequences — policy adicional JWT de migración 23
-- =============================================================================

-- El bloque 1 ya reemplazó _select_tenant/_modify_tenant de mig 39.
-- Esta policy de mig 23 quedó huérfana con el mismo problema JWT.
DROP POLICY IF EXISTS tenant_sequences_tenant_isolation ON public.tenant_sequences;

-- =============================================================================
-- BLOQUE 5: custom_field_definitions / automation_rules
--           — policies adicionales JWT de migración 34 (nombres distintos a mig 39)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'custom_field_definitions'
  ) THEN
    DROP POLICY IF EXISTS custom_field_defs_select ON public.custom_field_definitions;
    DROP POLICY IF EXISTS custom_field_defs_write  ON public.custom_field_definitions;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'automation_rules'
  ) THEN
    DROP POLICY IF EXISTS automation_rules_select ON public.automation_rules;
    DROP POLICY IF EXISTS automation_rules_write  ON public.automation_rules;
  END IF;
END;
$$;

-- =============================================================================
-- BLOQUE 6: tenant_settings — migración 31 (tabla NO incluida en mig 39)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tenant_settings'
  ) THEN
    DROP POLICY IF EXISTS tenant_settings_read  ON public.tenant_settings;
    DROP POLICY IF EXISTS tenant_settings_write ON public.tenant_settings;

    CREATE POLICY tenant_settings_read ON public.tenant_settings
      FOR SELECT TO authenticated
      USING (
        tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
        OR public.is_platform_super_admin()
      );

    -- Escritura restringida a usuarios del mismo tenant que tengan rol de admin/gerente.
    -- La verificación de rol fino se hace en la capa de aplicación (requireAction),
    -- pero agregamos un guard de tenant como mínimo.
    CREATE POLICY tenant_settings_write ON public.tenant_settings
      FOR ALL TO authenticated
      USING (
        tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
        OR public.is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
        OR public.is_platform_super_admin()
      );
  END IF;
END;
$$;

-- =============================================================================
-- BLOQUE 7: tenant_branding_version — migración 37 (tabla distinta a branding_versions)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tenant_branding_version'
  ) THEN
    DROP POLICY IF EXISTS tenant_branding_version_read  ON public.tenant_branding_version;
    DROP POLICY IF EXISTS tenant_branding_version_write ON public.tenant_branding_version;

    CREATE POLICY tenant_branding_version_read ON public.tenant_branding_version
      FOR SELECT TO authenticated
      USING (
        tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
        OR public.is_platform_super_admin()
      );

    CREATE POLICY tenant_branding_version_write ON public.tenant_branding_version
      FOR ALL TO authenticated
      USING (
        tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
        OR public.is_platform_super_admin()
      )
      WITH CHECK (
        tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
        OR public.is_platform_super_admin()
      );
  END IF;
END;
$$;

-- =============================================================================
-- VERIFICACIÓN (ejecutar manualmente para confirmar):
-- =============================================================================
--
-- 1. Policies que aún usan el claim JWT (debe retornar 0 filas):
--    SELECT schemaname, tablename, policyname, qual
--    FROM pg_policies
--    WHERE schemaname = 'public'
--      AND qual LIKE '%auth.jwt()%';
--
-- 2. Total de policies en el schema public:
--    SELECT count(*) FROM pg_policies WHERE schemaname = 'public';
--
-- 3. Policies de tenant isolation activas (todas deben usar subquery):
--    SELECT tablename, policyname
--    FROM pg_policies
--    WHERE schemaname = 'public'
--      AND (policyname LIKE '%_select_tenant' OR policyname LIKE '%_modify_tenant'
--           OR policyname LIKE '%_insert_tenant')
--    ORDER BY tablename;
