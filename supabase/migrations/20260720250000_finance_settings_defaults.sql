-- Migration: Seed default finance settings for all tenants
-- tax_rate: 0.19 (19% IVA Colombia)
-- payment_methods: Transferencia,Efectivo,Cheque,Tarjeta,PSE,Otro

-- Insert defaults only if they don't exist for each active tenant
INSERT INTO tenant_settings (tenant_id, module, config_key, config_value, is_encrypted, created_by)
SELECT
  t.id,
  'finance',
  'tax_rate',
  '0.19',
  false,
  (SELECT id FROM users WHERE tenant_id = t.id LIMIT 1)
FROM tenants t
WHERE t.status = 'Activo'
  AND NOT EXISTS (
    SELECT 1 FROM tenant_settings ts
    WHERE ts.tenant_id = t.id
      AND ts.module = 'finance'
      AND ts.config_key = 'tax_rate'
      AND ts.deleted_at IS NULL
  );

INSERT INTO tenant_settings (tenant_id, module, config_key, config_value, is_encrypted, created_by)
SELECT
  t.id,
  'finance',
  'payment_methods',
  'Transferencia,Efectivo,Cheque,Tarjeta,PSE,Otro',
  false,
  (SELECT id FROM users WHERE tenant_id = t.id LIMIT 1)
FROM tenants t
WHERE t.status = 'Activo'
  AND NOT EXISTS (
    SELECT 1 FROM tenant_settings ts
    WHERE ts.tenant_id = t.id
      AND ts.module = 'finance'
      AND ts.config_key = 'payment_methods'
      AND ts.deleted_at IS NULL
  );
