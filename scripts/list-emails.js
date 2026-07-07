const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const admin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
admin.from('users').select('email').then(res => console.dir(res.data, {depth: null}));
