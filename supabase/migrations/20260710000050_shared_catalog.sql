-- =============================================================================
-- MIGRACIÓN 50: Convertir catálogo de productos a catálogo compartido
-- =============================================================================
--
-- CONTEXTO: products.tenant_id NOT NULL → Opción A (catálogo global compartido).
-- Todos los tenants ven los mismos productos; precios por tenant via tenant_prices.
--
-- ESTADO ACTUAL: 16 products (8 códigos × 2 tenants), datos seed idénticos.
--
-- NOTAS:
--   - Trigger block_physical_website_delete() bloquea hard DELETE → soft delete.
--   - Las policies RLS referencian tenant_id → DROP ALL POLICIES antes del DROP COLUMN.
--     Se usa un DO block dinámico sobre pg_policies para no depender de nombres.
--   - Unique en product_code: partial index WHERE deleted_at IS NULL.
-- =============================================================================

-- =============================================================================
-- PASO 1: Crear tabla tenant_prices
-- =============================================================================

CREATE TABLE public.tenant_prices (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID          NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tenant_id   UUID          NOT NULL REFERENCES public.tenants(id)  ON DELETE CASCADE,
  price_cop   NUMERIC(18,2) NOT NULL DEFAULT 0,
  currency    CHAR(3)       NOT NULL DEFAULT 'COP',
  valid_from  DATE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_tenant_product_price UNIQUE (product_id, tenant_id)
);

ALTER TABLE public.tenant_prices ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PASO 2: Soft-delete de product_families duplicados
-- =============================================================================

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    WITH ranked AS (
      SELECT id, name,
             ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at, id) AS rn
      FROM public.product_families WHERE deleted_at IS NULL
    ),
    canonical AS (SELECT name, id AS keep_id FROM ranked WHERE rn = 1),
    duplicates AS (
      SELECT rk.id AS drop_id, c.keep_id
      FROM ranked rk JOIN canonical c ON c.name = rk.name WHERE rk.rn > 1
    )
    SELECT * FROM duplicates
  LOOP
    UPDATE public.products
      SET family_id = r.keep_id
    WHERE family_id = r.drop_id AND deleted_at IS NULL;
    UPDATE public.product_families SET deleted_at = NOW() WHERE id = r.drop_id;
  END LOOP;
END;
$$;

-- =============================================================================
-- PASO 3: Soft-delete de product_series duplicados
-- =============================================================================

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    WITH ranked AS (
      SELECT id, name,
             ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at, id) AS rn
      FROM public.product_series WHERE deleted_at IS NULL
    ),
    canonical AS (SELECT name, id AS keep_id FROM ranked WHERE rn = 1),
    duplicates AS (
      SELECT rk.id AS drop_id, c.keep_id
      FROM ranked rk JOIN canonical c ON c.name = rk.name WHERE rk.rn > 1
    )
    SELECT * FROM duplicates
  LOOP
    UPDATE public.products
      SET series_id = r.keep_id
    WHERE series_id = r.drop_id AND deleted_at IS NULL;
    UPDATE public.product_series SET deleted_at = NOW() WHERE id = r.drop_id;
  END LOOP;
END;
$$;

-- =============================================================================
-- PASO 4: Soft-delete de product_categories duplicados
-- =============================================================================

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    WITH ranked AS (
      SELECT id, name,
             ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at, id) AS rn
      FROM public.product_categories WHERE deleted_at IS NULL
    ),
    canonical AS (SELECT name, id AS keep_id FROM ranked WHERE rn = 1),
    duplicates AS (
      SELECT rk.id AS drop_id, c.keep_id
      FROM ranked rk JOIN canonical c ON c.name = rk.name WHERE rk.rn > 1
    )
    SELECT * FROM duplicates
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'product_subcategories') THEN
      EXECUTE format(
        'UPDATE public.product_subcategories SET category_id = %L WHERE category_id = %L AND deleted_at IS NULL',
        r.keep_id, r.drop_id
      );
    END IF;
    UPDATE public.product_categories SET deleted_at = NOW() WHERE id = r.drop_id;
  END LOOP;
END;
$$;

-- =============================================================================
-- PASO 5: Soft-delete de products duplicados (conservar el más antiguo por código)
-- =============================================================================

UPDATE public.products
SET deleted_at = NOW()
WHERE deleted_at IS NULL
  AND id NOT IN (
    SELECT DISTINCT ON (product_code) id
    FROM public.products
    WHERE deleted_at IS NULL
    ORDER BY product_code, created_at, id
  );

-- =============================================================================
-- PASO 6: DROP de TODAS las policies en tablas del catálogo
--   (Leemos pg_policies dinámicamente para no depender de nombres específicos)
-- =============================================================================

DO $$
DECLARE
  r RECORD;
  catalog_tables TEXT[] := ARRAY[
    'products', 'product_images', 'product_families', 'product_series',
    'product_categories', 'product_subcategories', 'product_specifications',
    'product_documents', 'product_files'
  ];
BEGIN
  FOR r IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY(catalog_tables)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END;
$$;

-- =============================================================================
-- PASO 7: DROP tenant_id de las 9 tablas del catálogo
-- =============================================================================

ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS unique_tenant_product_code,
  DROP CONSTRAINT IF EXISTS products_tenant_id_fkey;
ALTER TABLE public.products DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE public.product_images
  DROP CONSTRAINT IF EXISTS product_images_tenant_id_fkey;
ALTER TABLE public.product_images DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE public.product_families
  DROP CONSTRAINT IF EXISTS product_families_tenant_id_fkey;
ALTER TABLE public.product_families DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE public.product_series
  DROP CONSTRAINT IF EXISTS product_series_tenant_id_fkey;
ALTER TABLE public.product_series DROP COLUMN IF EXISTS tenant_id;

ALTER TABLE public.product_categories
  DROP CONSTRAINT IF EXISTS product_categories_tenant_id_fkey;
ALTER TABLE public.product_categories DROP COLUMN IF EXISTS tenant_id;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'product_subcategories'
               AND column_name = 'tenant_id') THEN
    ALTER TABLE public.product_subcategories
      DROP CONSTRAINT IF EXISTS product_subcategories_tenant_id_fkey;
    ALTER TABLE public.product_subcategories DROP COLUMN tenant_id;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'product_specifications'
               AND column_name = 'tenant_id') THEN
    ALTER TABLE public.product_specifications
      DROP CONSTRAINT IF EXISTS product_specifications_tenant_id_fkey;
    ALTER TABLE public.product_specifications DROP COLUMN tenant_id;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'product_documents'
               AND column_name = 'tenant_id') THEN
    ALTER TABLE public.product_documents
      DROP CONSTRAINT IF EXISTS product_documents_tenant_id_fkey;
    ALTER TABLE public.product_documents DROP COLUMN tenant_id;
  END IF;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema = 'public' AND table_name = 'product_files'
               AND column_name = 'tenant_id') THEN
    ALTER TABLE public.product_files
      DROP CONSTRAINT IF EXISTS product_files_tenant_id_fkey;
    ALTER TABLE public.product_files DROP COLUMN tenant_id;
  END IF;
END;
$$;

-- =============================================================================
-- PASO 8: Partial unique index en products.product_code (excluye soft-deleted)
-- =============================================================================

CREATE UNIQUE INDEX uq_product_code_active
  ON public.products(product_code)
  WHERE deleted_at IS NULL;

-- =============================================================================
-- PASO 9: Nuevas policies RLS — catálogo compartido
--   SELECT: abierto a todos los autenticados (sin filtro de tenant)
--   ALL:    restringido a super_admin
-- =============================================================================

CREATE POLICY products_select_all ON public.products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY products_write_super_admin ON public.products
  FOR ALL TO authenticated
  USING (public.is_platform_super_admin())
  WITH CHECK (public.is_platform_super_admin());

CREATE POLICY product_images_select_all ON public.product_images
  FOR SELECT TO authenticated USING (true);

CREATE POLICY product_images_write_super_admin ON public.product_images
  FOR ALL TO authenticated
  USING (public.is_platform_super_admin())
  WITH CHECK (public.is_platform_super_admin());

DO $$
DECLARE
  t TEXT;
  hierarchy TEXT[] := ARRAY[
    'product_families', 'product_series', 'product_categories',
    'product_subcategories', 'product_specifications',
    'product_documents', 'product_files'
  ];
BEGIN
  FOREACH t IN ARRAY hierarchy LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = t) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
        t || '_select_all', t
      );
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
           USING (public.is_platform_super_admin())
           WITH CHECK (public.is_platform_super_admin())',
        t || '_write_super_admin', t
      );
    END IF;
  END LOOP;
END;
$$;

-- =============================================================================
-- PASO 10: RLS en tenant_prices (aislamiento por tenant, patrón estándar)
-- =============================================================================

CREATE POLICY tenant_prices_select_tenant ON public.tenant_prices
  FOR SELECT TO authenticated
  USING (
    tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
    OR public.is_platform_super_admin()
  );

CREATE POLICY tenant_prices_modify_tenant ON public.tenant_prices
  FOR ALL TO authenticated
  USING (
    tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
    OR public.is_platform_super_admin()
  )
  WITH CHECK (
    tenant_id = (SELECT u.tenant_id FROM public.users u WHERE u.auth_user_id = auth.uid() LIMIT 1)
    OR public.is_platform_super_admin()
  );

-- =============================================================================
-- VERIFICACIÓN:
--   SELECT product_code, count(*) FROM public.products WHERE deleted_at IS NULL
--   GROUP BY product_code HAVING count(*) > 1;  → 0 filas
--
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'tenant_id';
--   → 0 filas
--
--   SELECT policyname, cmd FROM pg_policies
--   WHERE schemaname = 'public' AND tablename = 'products';
--   → products_select_all (SELECT), products_write_super_admin (ALL)
--
--   SELECT count(*) FROM public.tenant_prices;  → 0 (vacía, lista para datos)
