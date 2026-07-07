/**
 * Auth de cliente para el Portal (P8 - portal).
 *
 * Helpers server-side para:
 *  - Obtener el client actual del usuario autenticado.
 *  - Validar que el usuario tiene un client asociado.
 *
 * Estrategia:
 *  1. Leer la cookie `sb-access-token` (espejada por supabaseAuthStorage
 *     en el cliente). Contiene el JWT crudo.
 *  2. Validar el JWT con supabase.auth.getUser(token).
 *  3. Buscar la fila en public.users por auth_user_id.
 *  4. Buscar el client en public.clients donde assigned_user_id = users.id.
 *  5. Devolver el client o null si algo falla.
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
  tenantId?: string | null;
  tenantCode?: string | null;
}

/**
 * Cliente Supabase autenticado con la sesión real del usuario de portal
 * (anon key + JWT de la cookie), NO con service_role. Úsalo para cualquier
 * lectura de datos de negocio (jobs, invoices, payments) en vez de
 * supabaseAdmin, para que RLS/las funciones RPC SECURITY DEFINER se evalúen
 * con la identidad real del invocador en vez de bypasearse por completo.
 */
export async function getPortalAuthenticatedClient() {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get("sb-portal-access-token")?.value ||
    cookieStore.get("sb-access-token")?.value;
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
      cookieStore.get("sb-portal-access-token")?.value ||
      cookieStore.get("sb-access-token")?.value;
    if (!accessToken) return null;

    // Validar sesion con el cliente anon (es server-side, no se persiste la
    // sesion; solo validamos el JWT y leemos el user del payload).
    const anon = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await anon.auth.getUser(accessToken);
    if (error || !data.user) return null;
    const authUser = data.user;

    // Buscar la fila en public.users por auth_user_id.
    // Usamos el service role key para bypasear RLS y leer users.
    const admin = createSupabaseClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userRow, error: userErr } = await admin
      .from("users")
      .select("id, tenant_id")
      .eq("auth_user_id", authUser.id)
      .maybeSingle();
    if (userErr || !userRow) return null;

    // Resolver roles para verificar si es platform admin
    const { data: userRoles } = await admin
      .from("user_roles")
      .select(`
        roles (
          role_code
        )
      `)
      .eq("user_id", userRow.id);

    const roleCodes = userRoles?.map((ur: any) => ur.roles?.role_code) || [];
    const isPlatformAdmin =
      roleCodes.includes("SUPER_ADMIN") || roleCodes.includes("ADMIN_DEV");

    let clientRow = null;

    // Si es platform admin y hay un previewClientId solicitado, cargamos ese directamente
    if (isPlatformAdmin && previewClientId) {
      const { data: previewClient } = await admin
        .from("clients")
        .select("id, legal_name, tax_id, email, status, tenant_id, tenants(code)")
        .eq("id", previewClientId)
        .is("deleted_at", null)
        .maybeSingle();
      if (previewClient) {
        clientRow = previewClient;
      }
    }

    // Si no se cargó por preview, buscar el client asociado directamente
    if (!clientRow) {
      const clientQuery = await admin
        .from("clients")
        .select("id, legal_name, tax_id, email, status, tenant_id, tenants(code)")
        .eq("assigned_user_id", userRow.id)
        .is("deleted_at", null)
        .maybeSingle();
      
      if (clientQuery.data) {
        clientRow = clientQuery.data;
      }
    }

    // Fallback de preview para admins de plataforma si no tienen client asignado
    if (!clientRow && isPlatformAdmin) {
      const query = admin
        .from("clients")
        .select("id, legal_name, tax_id, email, status, tenant_id, tenants(code)")
        .is("deleted_at", null);
      
      if (userRow.tenant_id) {
        query.eq("tenant_id", userRow.tenant_id);
      }
      
      const { data: fallbackClient } = await query
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (fallbackClient) {
        clientRow = fallbackClient;
      }
    }

    if (!clientRow) return null;

    const tenantsObj = clientRow.tenants as any;
    const tenantCode = tenantsObj?.code || null;

    return {
      userId: userRow.id,
      clientId: clientRow.id,
      legalName: clientRow.legal_name,
      taxId: clientRow.tax_id || "",
      email: clientRow.email || authUser.email || "",
      status: clientRow.status,
      isPlatformAdmin,
      tenantId: clientRow.tenant_id,
      tenantCode,
    };
  } catch {
    return null;
  }
}
