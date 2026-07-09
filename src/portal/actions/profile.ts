"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getCurrentClient, getPortalAuthenticatedClient } from "@/lib/portal-auth";
import { supabaseAdmin } from "@/platform/auth/clients";

export interface ClientProfile {
  email: string;
  firstName: string;
  lastName: string | null;
  portalInvitedAt: string | null;
  portalRegisteredAt: string | null;
}

export async function getClientProfile(): Promise<ClientProfile | null> {
  const client = await getCurrentClient();
  if (!client || !client.isClientContact) {
    throw new Error("No autorizado: solo clientes pueden ver su perfil");
  }

  const authClient = await getPortalAuthenticatedClient();
  if (!authClient) throw new Error("Sesión inválida");

  const { data } = await authClient
    .from("client_contacts")
    .select("first_name, last_name, email, portal_invited_at, portal_registered_at")
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    email: data.email,
    firstName: data.first_name,
    lastName: data.last_name,
    portalInvitedAt: data.portal_invited_at,
    portalRegisteredAt: data.portal_registered_at,
  };
}

export async function updateClientPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  const client = await getCurrentClient();
  if (!client || !client.isClientContact) {
    return { ok: false, error: "No autorizado" };
  }

  if (!newPassword || newPassword.length < 8) {
    return { ok: false, error: "La contraseña debe tener al menos 8 caracteres" };
  }

  // Para cambiar password, primero verificamos con credentials actuales
  // usando un nuevo cliente (no el que ya tiene sesión)
  const tempClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  const { error: signInError } = await tempClient.auth.signInWithPassword({
    email: client.email,
    password: currentPassword,
  });

  if (signInError) {
    return { ok: false, error: "Contraseña actual incorrecta" };
  }

  // Ahora con sesión verificada, actualiza password
  const authClient = await getPortalAuthenticatedClient();
  if (!authClient) return { ok: false, error: "Sesión inválida" };

  const { error: updateError } = await authClient.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { ok: false, error: updateError.message };
  }

  return { ok: true };
}

export async function getClientContactInfo(): Promise<{
  firstName: string;
  lastName: string | null;
  email: string;
} | null> {
  const client = await getCurrentClient();
  if (!client || !client.isClientContact) return null;

  const portalClient = await getPortalAuthenticatedClient();
  if (!portalClient) return null;
  const { data: { user } } = await portalClient.auth.getUser();
  if (!user?.id) return null;

  const { data } = await supabaseAdmin
    .from("client_contacts")
    .select("first_name, last_name, email")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!data) return null;

  return {
    firstName: data.first_name,
    lastName: data.last_name,
    email: data.email,
  };
}
