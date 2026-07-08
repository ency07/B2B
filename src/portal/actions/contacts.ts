"use server";

import { supabaseAdmin } from "@/platform/auth/clients";
import { getAuthContext } from "@/platform/auth/server-guards";

export interface UpdateContactInput {
  firstName: string;
  lastName?: string;
  email?: string;
}

export async function updateClientContact(
  contactId: string,
  input: UpdateContactInput
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getAuthContext();
  if (!ctx) return { ok: false, error: "No autenticado" };

  const { firstName, lastName, email } = input;

  if (!firstName?.trim()) {
    return { ok: false, error: "El nombre es requerido" };
  }

  // Si se cambia el email, verificar que no está ya en uso como auth user
  if (email) {
    const { data: existing } = await supabaseAdmin
      .from("client_contacts")
      .select("id")
      .eq("email", email)
      .neq("id", contactId)
      .maybeSingle();

    if (existing) {
      return { ok: false, error: "Este email ya está registrado para otro contacto" };
    }
  }

  const { error } = await supabaseAdmin
    .from("client_contacts")
    .update({
      first_name: firstName.trim(),
      last_name: lastName?.trim() || null,
      ...(email ? { email: email.trim() } : {}),
    })
    .eq("id", contactId);

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

export async function addClientContact(
  clientId: string,
  input: UpdateContactInput
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const ctx = await getAuthContext();
  if (!ctx) return { ok: false, error: "No autenticado" };

  if (!input.firstName?.trim()) {
    return { ok: false, error: "El nombre es requerido" };
  }

  const { data: clientRow } = await supabaseAdmin
    .from("clients")
    .select("tenant_id")
    .eq("id", clientId)
    .maybeSingle();

  if (!clientRow) return { ok: false, error: "Cliente no encontrado" };

  const { data, error } = await supabaseAdmin
    .from("client_contacts")
    .insert({
      client_id: clientId,
      tenant_id: clientRow.tenant_id,
      first_name: input.firstName.trim(),
      last_name: input.lastName?.trim() || null,
      email: input.email?.trim() || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  return { ok: true, id: data.id };
}

export async function deleteClientContact(
  contactId: string
): Promise<{ ok: boolean; error?: string }> {
  const ctx = await getAuthContext();
  if (!ctx) return { ok: false, error: "No autenticado" };

  // Verificar que no tiene auth_user_id (si tiene, hay que revocar acceso primero)
  const { data: contact } = await supabaseAdmin
    .from("client_contacts")
    .select("auth_user_id")
    .eq("id", contactId)
    .maybeSingle();

  if (contact?.auth_user_id) {
    return {
      ok: false,
      error: "Este contacto tiene acceso al portal activo. Revoca el acceso antes de eliminarlo.",
    };
  }

  const { error } = await supabaseAdmin
    .from("client_contacts")
    .delete()
    .eq("id", contactId);

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
