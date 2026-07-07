const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const admin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
admin.from("notifications").select("*").limit(1).then(res => {
  if (res.error) console.log(res.error.message);
  else console.log("Notifications table exists!");
});
