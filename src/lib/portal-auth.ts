/**
 * Auth de cliente para el Portal.
 *
 * Dos identidades válidas para entrar al portal:
 *
 *  A) ADMIN en modo revisión (SUPER_ADMIN / ADMIN_DEV de public.users):
 *     - Puede elegir qué cliente ver vía previewClientId en la URL.
 *     - Puede cambiar de empresa con el switcher.
 *     - isPlatformAdmin = true, isClientContact = false.
 *
 *  B) CLIENTE REAL (client_contacts.auth_user_id = auth.uid()):
 *     - Ve solo su propia empresa, sin importar qué llegue en la URL.
 *     - No puede usar previewClientId para ver datos de otro cliente.
 *     - isPlatformAdmin = false, isClientContact = true.
 *
 * Aislamiento garantizado en dos capas:
 *  - Layer 1 (TypeScript): el path B ignora previewClientId totalmente.
 *  - Layer 2 (SQL): las funciones RPC SECURITY DEFINER llaman a
 *    is_portal_client_for(p_client_id) que verifica auth.uid() ↔ client_id
 *    en la base de datos — si Layer 1 tuviera un bug, Layer 2 bloquea igual.
 */

import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export interface CurrentClient {
  userId: string;
  clientId: string;
  legalName: string;
  taxId: string;
  email: string;
  status: string;
  isPlatformAdmin?: boolean;
  isClientContact?: boolean;
  tenantId?: string | null;
  tenantCode?: string | null;
}

/**
 * Cliente Supabase autenticado con la sesión real del usuario del portal
 * (anon key + JWT de la cookie). NO service_role — las RPC SECURITY DEFINER
 * re-validan el rol en SQL con el uid() real del invocador.
 */
export async function getPortalAuthenticatedClient() {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("sb-portal-access-token")?.value;
  if (!accessToken) return null;

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export async function getCurrentClient(previewClientId?: string | null): Promise<CurrentClient | null> {
  try {
    const cookieStore = await cookies();
    const accessToken =
      cookieStore.get("sb-portal-access-token")?.value;
    if (!accessToken) return null;

    const anon = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await anon.auth.getUser(accessToken);
    if (error || !data.user) return null;
    const authUser = data.user;

    const admin = createSupabaseClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ── Path A: usuario de staff / admin (en public.users) ──────────────────
    const { data: userRow, error: userErr } = await admin
      .from("users")
      .select("id, tenant_id")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (userErr) return null;

    if (userRow) {
      // Verificar si es platform admin
      const { data: userRoles } = await admin
        .from("user_roles")
        .select("roles (role_code)")
        .eq("user_id", userRow.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const roleCodes = userRoles?.map((ur: any) => ur.roles?.role_code) || [];
      const isPlatformAdmin =
        roleCodes.includes("SUPER_ADMIN") || roleCodes.includes("ADMIN_DEV");

      let clientRow = null;

      if (isPlatformAdmin && previewClientId) {
        const { data: previewClient } = await admin
          .from("clients")
          .select("id, legal_name, tax_id, email, status, tenant_id, tenants(tenant_code)")
          .eq("id", previewClientId)
          .is("deleted_at", null)
          .maybeSingle();
        if (previewClient) clientRow = previewClient;
      }

      if (!clientRow) {
        const { data: assignedClient } = await admin
          .from("clients")
          .select("id, legal_name, tax_id, email, status, tenant_id, tenants(tenant_code)")
          .eq("assigned_user_id", userRow.id)
          .is("deleted_at", null)
          .maybeSingle();
        if (assignedClient) clientRow = assignedClient;
      }

      // Fallback para platform admins: mostrar el primer cliente disponible
      if (!clientRow && isPlatformAdmin) {
        const query = admin
          .from("clients")
          .select("id, legal_name, tax_id, email, status, tenant_id, tenants(tenant_code)")
          .is("deleted_at", null);
        if (userRow.tenant_id) query.eq("tenant_id", userRow.tenant_id);
        const { data: fallbackClient } = await query
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        if (fallbackClient) clientRow = fallbackClient;
      }

      if (!clientRow) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tenantCode = (clientRow.tenants as any)?.tenant_code || null;
      return {
        userId: userRow.id,
        clientId: clientRow.id,
        legalName: clientRow.legal_name,
        taxId: clientRow.tax_id || "",
        email: clientRow.email || authUser.email || "",
        status: clientRow.status,
        isPlatformAdmin,
        isClientContact: false,
        tenantId: clientRow.tenant_id,
        tenantCode,
      };
    }

    // ── Path B: client contact real (en client_contacts) ────────────────────
    // IMPORTANTE: se ignora previewClientId — un cliente real no puede
    // ver datos de otra empresa aunque manipule la URL.
    const { data: contactRow } = await admin
      .from("client_contacts")
      .select(`
        id, client_id, first_name, last_name,
        clients (
          id, legal_name, tax_id, email, status, tenant_id,
          tenants (tenant_code)
        )
      `)
      .eq("auth_user_id", authUser.id)
      .maybeSingle();

    if (!contactRow) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientObj = contactRow.clients as any;
    if (!clientObj) return null;

    // Marcar portal_registered_at si es la primera vez que acceden
    // (async fire-and-forget: no bloqueamos la respuesta por esto)
    admin
      .from("client_contacts")
      .update({ portal_registered_at: new Date().toISOString() })
      .eq("id", contactRow.id)
      .is("portal_registered_at", null)
      .then(() => {/* sin-op */});

    return {
      userId: contactRow.id,
      clientId: contactRow.client_id,
      legalName: clientObj.legal_name,
      taxId: clientObj.tax_id || "",
      email: authUser.email || clientObj.email || "",
      status: clientObj.status,
      isPlatformAdmin: false,
      isClientContact: true,
      tenantId: clientObj.tenant_id,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tenantCode: (clientObj.tenants as any)?.tenant_code || null,
    };
  } catch {
    return null;
  }
}
