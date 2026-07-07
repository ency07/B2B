const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const admin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data: user } = await admin
    .from("users")
    .select("id")
    .eq("email", "test.superadmin@wl.local")
    .maybeSingle();

  const { data: userRole, error: roleErr } = await admin
    .from("user_roles")
    .select(`
      roles (
        role_code
      )
    `)
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  console.dir(userRole, { depth: null });
  console.dir(roleErr, { depth: null });
  
  // also get all user roles
  const { data: allRoles } = await admin
    .from("user_roles")
    .select("roles(role_code)")
    .eq("user_id", user.id);
  console.log("All roles:", JSON.stringify(allRoles));
}

main();
