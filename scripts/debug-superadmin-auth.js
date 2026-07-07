const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const admin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const email = "test.superadmin@wl.local";
  
  // Find auth user
  const { data: authUsers } = await admin.auth.admin.listUsers();
  const authUser = authUsers.users.find(u => u.email === email);
  console.log(`Auth user id: ${authUser ? authUser.id : 'NOT FOUND'}`);

  // Find public user
  const { data: user } = await admin
    .from("users")
    .select("id, auth_user_id, email")
    .eq("email", email)
    .maybeSingle();
  
  console.log(`Public user auth_user_id: ${user ? user.auth_user_id : 'NOT FOUND'}`);
  
  if (authUser && user) {
    console.log(`Match? ${authUser.id === user.auth_user_id}`);
  }
}

main();
