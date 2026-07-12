# ADR 003: Auth Hook Subquery for Tenant Resolution

**Status:** Accepted
**Date:** 2026-07-12
**Decision Maker:** Architecture Team

## Context

When implementing RLS-based multi-tenancy, the database needs a way to know which tenant the current user belongs to. The auth.jwt()->>'tenant_id' claim works when tenant_id is embedded in the JWT at login time. However, this approach fails for **dynamic tenant resolution**:

- A user (identified by auth_user_id) may belong to multiple tenants
- Tenant membership is determined at query time, not login time
- Moving tenant membership to the JWT would require re-login when assignments change

Example problem: A `client_contact` (a user) belongs to a specific `client`, which belongs to a specific `tenant`. The database needs to resolve:
```
auth_user_id → client_contact → client → tenant_id
```

### Original Problem

A naive RLS policy using a subquery created **infinite recursion**:
```sql
-- ❌ WRONG: Infinite loop
CREATE POLICY client_contact_tenant_isolation ON client_contacts
  USING (tenant_id IN (
    SELECT tenant_id FROM client_contacts WHERE auth_user_id = auth.uid()
  ));
```

This policy references the same table (client_contacts) in both the WHERE clause and the subquery, causing Supabase to re-evaluate the RLS policy on the subquery, leading to infinite recursion.

## Decision

Use a **multi-table subquery chain** that resolves tenant membership through related tables instead of the same table:

```sql
CREATE POLICY client_contact_tenant_isolation ON client_contacts
  USING (
    client_id IN (
      SELECT id FROM clients WHERE tenant_id = auth.jwt()->>'tenant_id'
    )
  );
```

Or, for tables without a direct foreign key to clients:

```sql
CREATE POLICY job_tenant_isolation ON jobs
  USING (
    client_id IN (
      SELECT id FROM clients WHERE tenant_id = auth.jwt()->>'tenant_id'
    )
  );
```

### Key Principle

**Avoid self-referential subqueries in RLS policies.** Instead, chain through other tables (clients, tenants, org_memberships) to resolve the tenant context.

## Consequences

### Positive
- **Resolves infinite recursion**: No self-referential subqueries
- **Clear dependency chain**: Data model relationships are explicit in the policy
- **Maintainable**: Future developers see exactly how tenant membership is resolved
- **Flexible**: Can handle complex org structures (users → departments → business units → tenants)

### Negative
- **Query complexity**: Subqueries add JOIN operations, which can slow queries
  - Mitigation: Indexes on foreign keys and tenant_id
- **Policy maintenance**: When adding a new user-to-tenant mapping table, policies must be updated
  - Mitigation: Document the mapping chain in the schema
- **Debugging**: RLS silently filters rows; errors manifest as "missing data"
  - Mitigation: Test policies with `EXPLAIN` and row-level audit logs

## Related Decisions

- ADR 001: Multi-Tenancy via RLS (this ADR provides the subquery pattern)
- ADR 004: Separate Login Routes (keeps tenant out of the JWT payload)

## Example: User Roles Across Tenants

A user may have different roles in different tenants:

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users,
  tenant_id UUID REFERENCES tenants,
  role TEXT, -- SUPER_ADMIN, EJECUTIVO_COMERCIAL, etc.
  assigned_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(auth_user_id, tenant_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_roles_isolation ON user_roles
  USING (tenant_id = auth.jwt()->>'tenant_id');
```

Then, a query to fetch all roles for the current user in their tenant:

```sql
SELECT role FROM user_roles
WHERE auth_user_id = auth.uid()
  AND tenant_id = auth.jwt()->>'tenant_id';
```

This avoids recursion because the policy checks `tenant_id` directly (via JWT), not by querying user_roles again.
