-- Orden correcto: agregar tenant_id y backfillear ANTES de actualizar filas,
-- porque el trigger de auditoría process_audit_log() ya lee NEW.tenant_id en
-- estas tablas y falla si la columna todavía no existe.
--
-- El catálogo (product_categories -> product_subcategories -> product_families
-- -> product_series -> products) nunca tuvo tenant_id en ningún nivel: la
-- jerarquía completa estaba compartida entre todos los tenants a nivel de
-- base de datos, no solo por un filtro faltante en la query de lectura.
-- Los datos existentes (seed de desarrollo) se asignan a ACME; APEX arranca
-- con catálogo vacío, como correspondería a un tenant nuevo real.
--
-- De paso: la migración 050 (shared catalog, bug ya cerrado en W-001 a nivel
-- de código) había dejado 2 árboles fantasma ACTIVOS (no solo soft-deleted)
-- -- SBC-000001 y SBC-000002 cada una con una fila "b3c..." gemela vacía
-- (misma familia/serie code, 0 productos reales) junto a la fila "a3c..."
-- real y poblada. Se soft-eliminan los árboles fantasma completos antes de
-- poder agregar el constraint único por tenant.

DO $$
DECLARE
  v_acme_id uuid := 'a0000000-0000-0000-0000-000000000000';
  v_now timestamp := now();
BEGIN
  -- 1. Agregar tenant_id (nullable primero) a las 5 tablas.
  ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
  ALTER TABLE product_subcategories ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
  ALTER TABLE product_families ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
  ALTER TABLE product_series ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);
  ALTER TABLE products ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

  -- 2. Backfill: todo el catálogo existente (real y fantasma) pertenece a ACME.
  UPDATE product_categories SET tenant_id = v_acme_id WHERE tenant_id IS NULL;
  UPDATE product_subcategories SET tenant_id = v_acme_id WHERE tenant_id IS NULL;
  UPDATE product_families SET tenant_id = v_acme_id WHERE tenant_id IS NULL;
  UPDATE product_series SET tenant_id = v_acme_id WHERE tenant_id IS NULL;
  UPDATE products SET tenant_id = v_acme_id WHERE tenant_id IS NULL;

  ALTER TABLE product_categories ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE product_subcategories ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE product_families ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE product_series ALTER COLUMN tenant_id SET NOT NULL;
  ALTER TABLE products ALTER COLUMN tenant_id SET NOT NULL;

  -- 3. Ahora sí, soft-delete de los 2 árboles fantasma de migración 050
  -- (subcategoría+familia+serie "b3c...-000002" y "b3c...-000005", 0 productos reales).
  UPDATE product_series SET deleted_at = v_now
    WHERE family_id IN (
      SELECT id FROM product_families WHERE subcategory_id IN (
        'b3c00000-0000-0000-0000-000000000002', 'b3c00000-0000-0000-0000-000000000005'
      )
    ) AND deleted_at IS NULL;
  UPDATE product_families SET deleted_at = v_now
    WHERE subcategory_id IN (
      'b3c00000-0000-0000-0000-000000000002', 'b3c00000-0000-0000-0000-000000000005'
    ) AND deleted_at IS NULL;
  UPDATE product_subcategories SET deleted_at = v_now
    WHERE id IN (
      'b3c00000-0000-0000-0000-000000000002', 'b3c00000-0000-0000-0000-000000000005'
    ) AND deleted_at IS NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_product_categories_tenant ON product_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_subcategories_tenant ON product_subcategories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_families_tenant ON product_families(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_series_tenant ON product_series(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);

-- Únicos por tenant, pero solo entre filas activas: dos filas pueden compartir
-- código si una está soft-eliminada (mismo patrón que el resto del sistema).
-- Nunca hubo constraint único en estos códigos, ni global ni por tenant.
CREATE UNIQUE INDEX IF NOT EXISTS product_categories_tenant_code_unique
  ON product_categories(tenant_id, category_code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS product_subcategories_tenant_code_unique
  ON product_subcategories(tenant_id, subcategory_code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS product_families_tenant_code_unique
  ON product_families(tenant_id, family_code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS product_series_tenant_code_unique
  ON product_series(tenant_id, series_code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS products_tenant_code_unique
  ON products(tenant_id, product_code) WHERE deleted_at IS NULL;
