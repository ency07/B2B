# ADR 002: Global Product Catalog with Per-Tenant Pricing

**Status:** Accepted
**Date:** 2026-07-12
**Decision Maker:** Architecture Team

## Context

The ERP platform needs to manage a product catalog used across multiple tenants. Each tenant may have different prices, taxes, and discounts for the same product.

### Options Considered

1. **Per-tenant catalogs**: Duplicate the product list for each tenant
   - Pro: Complete tenant isolation
   - Con: Data redundancy, inventory sync complexity

2. **Shared catalog with per-tenant pricing** (CHOSEN)
   - Pro: Single source of truth for products, efficient pricing overrides
   - Con: Requires two-table pattern (products + pricing)

3. **Shared catalog in separate schema**
   - Pro: Clear separation
   - Con: Added operational complexity, schema-level access control overhead

## Decision

Implement a **global products catalog** (`products` table without tenant_id) with **per-tenant pricing rules** (`product_prices` table with tenant_id).

### Schema Pattern

```sql
-- Global catalog (no tenant_id)
CREATE TABLE products (
  id UUID PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cost_per_unit DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Per-tenant pricing (with tenant_id and RLS)
CREATE TABLE product_prices (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products,
  tenant_id UUID NOT NULL,
  price_per_unit DECIMAL NOT NULL,
  tax_rate DECIMAL DEFAULT 0.19,
  discount_percent DECIMAL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE product_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_pricing_isolation ON product_prices
  USING (tenant_id = auth.jwt()->>'tenant_id');
```

### Query Pattern

```typescript
// Fetch products with pricing for current tenant
const { data } = await supabase
  .from('products')
  .select(`
    id, sku, name,
    product_prices!inner (
      id, price_per_unit, tax_rate, discount_percent
    )
  `)
  .eq('product_prices.tenant_id', currentTenantId);
```

## Consequences

### Positive
- **Data consistency**: Product master data is maintained once
- **Flexible pricing**: Each tenant can have custom pricing without duplicating products
- **Scalability**: Thousands of products, thousands of tenants, efficient queries
- **Audit trail**: Pricing changes are tracked per tenant, per product
- **Simplicity**: No complex sync logic for product updates

### Negative
- **RLS on child table only**: Product reads are unrestricted; pricing is tenant-filtered
  - Mitigation: Document that product listing is public (intended design)
- **Performance**: Joins between products and pricing add query overhead
  - Mitigation: Indexes on (product_id, tenant_id) in product_prices
- **Denormalization temptation**: Teams may be tempted to denormalize pricing into orders/invoices
  - Mitigation: Clear documentation and code examples showing the pattern

## Related Decisions

- ADR 001: Multi-Tenancy via RLS (products don't have tenant_id because they're global)
- ADR 003: Auth Hook Subquery (for complex tenant resolution)
