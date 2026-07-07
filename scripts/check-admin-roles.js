const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const admin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRoles() {
  const emails = ["admin@acme.com", "superadmin@erp.local", "test.superadmin@wl.local"];
  
  for (const email of emails) {
    const { data: user } = await admin.from("users").select("id").eq("email", email).maybeSingle();
    if (!user) {
      console.log(`${email}: No public user`);
      continue;
    }
    
    const { data: role } = await admin.from("user_roles").select("roles(role_code)").eq("user_id", user.id);
    console.log(`${email}: `, JSON.stringify(role));
  }
}

checkRoles();
