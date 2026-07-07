

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const admin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testGetUserRole(authUserId) {
  const { data: user, error: userErr } = await admin
    .from("users")
    .select("id")
    .eq("auth_user_id", authUserId)
    .limit(1)
    .maybeSingle();

  if (userErr || !user) {
    console.log("No user found");
    return null;
  }

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

  if (roleErr || !userRole) {
    console.error("Role err:", roleErr);
    return null;
  }

  const rolesObj = userRole.roles;
  return rolesObj?.role_code || null;
}

testGetUserRole("3a7aa3af-6c81-4259-b56b-554798e7da07").then(res => console.log("ROLE:", res));
