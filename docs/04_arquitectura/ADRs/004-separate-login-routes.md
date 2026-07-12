# ADR 004: Separate Login Routes for ERP and Portal

**Status:** Accepted
**Date:** 2026-07-12
**Decision Maker:** Architecture Team

## Context

The platform serves two user bases with different access patterns:

1. **ERP Users** (internal to companies): Sales executives, admins, inventory managers
   - Login at `/login`
   - Access to `/dashboard/*`
   - Company/tenant information is internal

2. **Portal Users** (external, client contacts): Clients interacting with their orders, invoices, requirements
   - Login at `/portal/login`
   - Access to `/portal`
   - Should not see or need to know about tenant information

### Problem with Unified Routes

A single login route introduces security and usability risks:

- **Tenant exposure**: Passing `?tenant=acme` in the URL exposes company names to unauthenticated users
- **Confusion**: Portal users seeing a "tenant" dropdown confuses the UX
- **Enumeration attacks**: Attackers could enumerate valid tenant IDs via login page
- **Cache poisoning**: Public login page with tenant-specific content creates complex caching rules

## Decision

Maintain **two separate login routes**:

1. **`/login`** → ERP dashboard
   - Intended for company employees
   - No tenant parameter required (resolved server-side from user role)
   - Redirects to `/dashboard` on success

2. **`/portal/login`** → Portal
   - Intended for client contacts
   - No tenant parameter visible to users
   - Redirects to `/portal` on success
   - Tenant resolved server-side from client_contact association

### Implementation

**ERP Login** (`src/app/(auth)/login/page.tsx`):
```typescript
export default function LoginPage() {
  // No tenant parameter in the UI
  const handleLogin = async (email, password) => {
    const result = await loginErp({ email, password });
    if (result.success) {
      redirect('/dashboard');
    }
  };
}
```

**Portal Login** (`src/app/portal/login/page.tsx`):
```typescript
export default function PortalLoginPage() {
  // No tenant parameter in the UI
  const handleLogin = async (email, password) => {
    const result = await loginPortal({ email, password });
    if (result.success) {
      redirect('/portal');
    }
  };
}
```

**Server Actions** resolve the tenant server-side:

```typescript
// src/erp/actions/auth.ts
export async function loginErp(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };

  // Fetch user roles (which include tenant_id)
  const roles = await fetchUserRolesForTenant(data.user.id);
  if (!roles.length) return { success: false, error: 'No access' };

  // Set JWT with tenant_id
  return { success: true, redirect: '/dashboard' };
}
```

## Consequences

### Positive
- **Security**: Tenant names/IDs are not visible in URLs or error messages
- **UX clarity**: Each user group has a focused login experience
- **Tenant resolution**: Server-side logic prevents accidental multi-tenant confusion
- **Phishing resistance**: No tenant selector means fewer social engineering vectors
- **Caching**: Login pages can be cached globally without tenant-specific variations

### Negative
- **Two codebases**: Portal and ERP login logic must be maintained separately
  - Mitigation: Share validation logic in a common library (zod schemas, etc.)
- **User confusion**: Users must remember which login to use
  - Mitigation: Clear navigation and onboarding; email invites direct to correct login
- **Support complexity**: Support staff must understand two login flows
  - Mitigation: Comprehensive documentation and playbooks

## Related Decisions

- ADR 001: Multi-Tenancy via RLS (tenant resolved server-side, not in URL)
- ADR 003: Auth Hook Subquery (tenant context set via JWT, not URL parameter)

## Migration Path

If a unified login ever becomes necessary, it must:
1. Detect the user's account type (ERP vs. Portal) on the backend
2. Auto-redirect to the appropriate dashboard without exposing tenant IDs
3. Maintain all security properties of separate routes
