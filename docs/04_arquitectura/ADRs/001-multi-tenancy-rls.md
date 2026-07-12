# ADR 001: Multi-Tenancy Implementation via Row Level Security (RLS)

**Status:** Accepted
**Date:** 2026-07-12
**Decision Maker:** Architecture Team

## Context

The ERP B2B Premium platform must serve multiple independent tenants (companies) within a single application instance. Data isolation is critical for security and compliance. The platform needs to:

1. Ensure complete data isolation between tenants
2. Prevent accidental or intentional cross-tenant data access
3. Minimize performance overhead of isolation checks
4. Simplify authorization logic at the application layer

Traditional approaches like database-per-tenant add operational complexity. Application-layer filtering is error-prone and requires diligent review on every query.

## Decision

We implement multi-tenancy using **Supabase Row Level Security (RLS)** with a JWT-based tenant context, enforced at the database level.

### Implementation Details

- **Tenant Context**: The tenant_id is embedded in the JWT token's custom claims (auth.jwt()) or resolved via a subquery against the auth_user_id
- **RLS Policies**: Every data table includes a `tenant_id` column and RLS policies that enforce tenant isolation:
  ```sql
  ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
  CREATE POLICY tenant_isolation ON clients
    USING (tenant_id = auth.jwt()->>'tenant_id');
  ```
- **Subquery Fallback**: For complex tenant resolution (e.g., resolving client_contacts.auth_user_id → clients.tenant_id), use subqueries in RLS:
  ```sql
  CREATE POLICY client_contact_isolation ON client_contacts
    USING (tenant_id IN (SELECT tenant_id FROM clients WHERE id = client_id));
  ```

### Why Not JWT Claims Alone?

Direct JWT claims work well for simple cases but create circular dependencies when tenant resolution requires data lookups (e.g., "which tenant does this contact belong to?"). Subquery-based RLS resolves this by making the database the source of truth for tenant relationships.

## Consequences

### Positive
- **Database-level enforcement**: Isolation is guaranteed regardless of application code
- **No circular dependencies**: Subqueries allow complex tenant resolution without infinite recursion
- **Single source of truth**: Tenant relationships are defined once in the schema
- **Scalability**: Works efficiently for thousands of tenants in one database
- **Audit trail**: Row-level policies log which rows are accessed by which tenant

### Negative
- **Performance**: Subqueries in RLS policies add query overhead; requires indexes on tenant_id and related columns
- **Debugging complexity**: RLS silently filters rows; bugs manifest as "missing data" rather than errors
- **Third-party integrations**: Tools and ORMs must support RLS policies
- **Testing difficulty**: Test data must respect RLS constraints; fixtures must include tenant context

## Related Decisions

- ADR 002: Shared Catalog (products are global, prices are per-tenant)
- ADR 003: Auth Hook Subquery (RLS policy to resolve auth_user_id → tenant_id)
