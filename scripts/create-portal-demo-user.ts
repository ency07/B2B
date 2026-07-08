/**
 * create-portal-demo-user.ts
 *
 * Crea un usuario de demostración del Portal con credenciales conocidas
 * para poder probar el flujo de cliente real sin necesitar un email.
 *
 * Uso: npx tsx scripts/create-portal-demo-user.ts
 *
 * Crea:
 *  - auth user: portal.demo@wl.local / PortalDemo2026!
 *  - client_contacts row vinculado al primer cliente disponible
 *  - auth_user_id actualizado en client_contacts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceKey) {
  console.error("❌ Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO_EMAIL    = "portal.demo@wl.local";
const DEMO_PASSWORD = "PortalDemo2026!";

async function main() {
  console.log("🚀 Creando usuario demo del Portal...\n");

  // 1. Buscar un cliente real con contactos (preferir uno con datos reales)
  const { data: clientData } = await admin
    .from("clients")
    .select("id, legal_name, tax_id, tenant_id, tenants(tenant_code)")
    .is("deleted_at", null)
    .neq("legal_name", "aasf")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!clientData) {
    console.error("❌ No hay clientes en la BD.");
    process.exit(1);
  }

  console.log(`📋 Cliente seleccionado: ${clientData.legal_name} (${clientData.id})`);

  // 2. Verificar si ya existe el usuario demo
  const { data: existingUsers } = await admin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find((u) => u.email === DEMO_EMAIL);

  let demoAuthUserId: string;

  if (existingUser) {
    console.log("ℹ️  Usuario demo ya existe en auth.users, reutilizando...");
    demoAuthUserId = existingUser.id;

    // Actualizar password por si acaso
    await admin.auth.admin.updateUserById(demoAuthUserId, {
      password: DEMO_PASSWORD,
      email_confirm: true,
    });
  } else {
    // 3. Crear el auth user con password conocido
    const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true, // No necesita confirmar email
    });

    if (createErr || !newUser.user) {
      console.error("❌ Error creando usuario auth:", createErr?.message);
      process.exit(1);
    }

    demoAuthUserId = newUser.user.id;
    console.log(`✅ Auth user creado: ${demoAuthUserId}`);
  }

  // 4. Buscar o crear client_contact vinculado al cliente
  const { data: existingContact } = await admin
    .from("client_contacts")
    .select("id, first_name, last_name, email, auth_user_id")
    .eq("client_id", clientData.id)
    .eq("email", DEMO_EMAIL)
    .maybeSingle();

  let contactId: string;

  if (existingContact) {
    contactId = existingContact.id;
    console.log("ℹ️  Contacto demo ya existe, actualizando...");
    await admin
      .from("client_contacts")
      .update({
        auth_user_id: demoAuthUserId,
        portal_invited_at: new Date().toISOString(),
        portal_registered_at: new Date().toISOString(),
      })
      .eq("id", contactId);
  } else {
    const { data: newContact, error: contactErr } = await admin
      .from("client_contacts")
      .insert({
        tenant_id: clientData.tenant_id,
        client_id: clientData.id,
        first_name: "Demo",
        last_name: "Cliente Portal",
        email: DEMO_EMAIL,
        auth_user_id: demoAuthUserId,
        portal_invited_at: new Date().toISOString(),
        portal_registered_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (contactErr || !newContact) {
      console.error("❌ Error creando client_contact:", contactErr?.message);
      process.exit(1);
    }

    contactId = newContact.id;
    console.log(`✅ Contacto creado: ${contactId}`);
  }

  // 5. Obtener tenant code para URL
  const tenants = clientData.tenants as { tenant_code?: string } | null;
  const tenantCode = tenants?.tenant_code || "default";

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║           CREDENCIALES DE DEMO — PORTAL CLIENTE               ║
╠════════════════════════════════════════════════════════════════╣
║  EMAIL:     portal.demo@wl.local                              ║
║  PASSWORD:  PortalDemo2026!                                   ║
║                                                               ║
║  EMPRESA:   ${(clientData.legal_name || "").padEnd(50)}║
║  TENANT:    ${tenantCode.padEnd(50)}║
║                                                               ║
║  URL PORTAL: /portal?tenant=${tenantCode.padEnd(36)}║
╚════════════════════════════════════════════════════════════════╝

╔════════════════════════════════════════════════════════════════╗
║           CREDENCIALES ADMIN DEV (ERP + Portal Admin)         ║
╠════════════════════════════════════════════════════════════════╣
║  EMAIL:     gedeon07@gmail.com                                ║
║  PASSWORD:  AdminDev2026!                                     ║
║                                                               ║
║  URL ERP:    /login                                           ║
║  URL PORTAL: /portal (modo revisión, switcher de empresas)    ║
╚════════════════════════════════════════════════════════════════╝
`);
}

main().catch(console.error);
