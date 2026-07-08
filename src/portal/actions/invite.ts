"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import { getAuthContext } from "@/platform/auth/server-guards";

export interface ClientContact {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  portalInvitedAt: string | null;
  portalRegisteredAt: string | null;
  hasPortalAccess: boolean;
}

export async function getClientContacts(clientId: string): Promise<ClientContact[]> {
  const ctx = await getAuthContext();
  if (!ctx) throw new Error("No autenticado");

  const { data, error } = await supabaseAdmin
    .from("client_contacts")
    .select("id, first_name, last_name, email, portal_invited_at, portal_registered_at, auth_user_id")
    .eq("client_id", clientId)
    .order("first_name");

  if (error) throw new Error(error.message);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any — client_contacts select: TS necesita any para acceso dinámico a propiedades
  return (data || []).map((c: any) => ({
    id: c.id,
    firstName: c.first_name,
    lastName: c.last_name ?? null,
    email: c.email ?? null,
    portalInvitedAt: c.portal_invited_at ?? null,
    portalRegisteredAt: c.portal_registered_at ?? null,
    hasPortalAccess: Boolean(c.auth_user_id),
  }));
}

export async function inviteContactToPortal(
  contactId: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getAuthContext();
  if (!ctx) return { ok: false, error: "No autenticado" };

  const { data: contact, error: contactErr } = await supabaseAdmin
    .from("client_contacts")
    .select(`
      id, email, first_name, auth_user_id,
      clients (
        id, tenant_id,
        tenants (code)
      )
    `)
    .eq("id", contactId)
    .maybeSingle();

  if (contactErr || !contact) return { ok: false, error: "Contacto no encontrado" };
  if (!contact.email) return { ok: false, error: "El contacto no tiene email registrado" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any — clients.tenants join: cast necesario para acceso seguro
  const tenantCode = (contact.clients as any)?.tenants?.code as string | undefined;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const redirectTo = tenantCode ? `${appUrl}/portal?tenant=${tenantCode}` : `${appUrl}/portal`;

  const { data: authData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    contact.email,
    { redirectTo }
  );

  if (inviteErr) {
    if (inviteErr.message?.toLowerCase().includes("already")) {
      return {
        ok: false,
        error: "Este email ya tiene una cuenta. Contacta al soporte para vincularla manualmente.",
      };
    }
    return { ok: false, error: inviteErr.message };
  }

  await supabaseAdmin
    .from("client_contacts")
    .update({
      auth_user_id: authData.user.id,
      portal_invited_at: new Date().toISOString(),
    })
    .eq("id", contactId);

  return { ok: true };
}

export async function revokeContactPortalAccess(
  contactId: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getAuthContext();
  if (!ctx) return { ok: false, error: "No autenticado" };

  const { data: contact } = await supabaseAdmin
    .from("client_contacts")
    .select("auth_user_id")
    .eq("id", contactId)
    .maybeSingle();

  if (!contact?.auth_user_id) return { ok: false, error: "Este contacto no tiene acceso al portal" };

  const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(contact.auth_user_id);
  if (deleteErr) return { ok: false, error: deleteErr.message };

  await supabaseAdmin
    .from("client_contacts")
    .update({ auth_user_id: null, portal_invited_at: null, portal_registered_at: null })
    .eq("id", contactId);

  return { ok: true };
}
