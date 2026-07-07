const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const admin = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const clientEmails = ["test.cliente1@wl.local", "test.cliente2@wl.local", "test.cliente3@wl.local"];
  
  for (const email of clientEmails) {
    console.log(`\n=== ${email} ===`);
    const { data: user } = await admin.from("users").select("id, auth_user_id, tenant_id").eq("email", email).maybeSingle();
    if (!user) { console.log("  NOT FOUND in public.users"); continue; }
    console.log(`  users.id:           ${user.id}`);
    console.log(`  users.tenant_id:    ${user.tenant_id}`);

    const { data: clients } = await admin.from("clients").select("id, client_code, tax_id, legal_name, assigned_user_id, tenant_id").eq("assigned_user_id", user.id);
    if (!clients || clients.length === 0) {
      console.log("  NO CLIENT LINKED (assigned_user_id match = 0)");
      // Check by tax_id pattern
      const num = email.includes("1") ? "1" : email.includes("2") ? "2" : "3";
      const { data: byTax } = await admin.from("clients").select("id, tax_id, assigned_user_id, tenant_id").eq("tax_id", `TEST-CLI-TEST-${num}`).maybeSingle();
      if (byTax) {
        console.log(`  Client tax_id=TEST-CLI-TEST-${num} EXISTS but assigned_user_id=${byTax.assigned_user_id} (user.id=${user.id}, match=${byTax.assigned_user_id === user.id})`);
        console.log(`  Client tenant_id=${byTax.tenant_id}, user.tenant_id=${user.tenant_id}, match=${byTax.tenant_id === user.tenant_id}`);
      } else {
        console.log(`  Client tax_id=TEST-CLI-TEST-${num} NOT FOUND either`);
      }
    } else {
      for (const c of clients) {
        console.log(`  LINKED: ${c.client_code} tenant=${c.tenant_id} user_tenant=${user.tenant_id} match=${c.tenant_id === user.tenant_id}`);
      }
    }
  }

  // Simulate portal-auth query
  console.log("\n=== PORTAL-AUTH SIMULATION ===");
  for (const email of clientEmails) {
    const { data: user } = await admin.from("users").select("id, tenant_id").eq("email", email).maybeSingle();
    if (!user) continue;
    const { data: client } = await admin.from("clients").select("id, legal_name").eq("assigned_user_id", user.id).eq("tenant_id", user.tenant_id).is("deleted_at", null).maybeSingle();
    console.log(`${email}: ${client ? client.legal_name : "NULL (no match)"}`);
  }
}

main().catch(console.error);
