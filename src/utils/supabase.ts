import { createClient } from '@supabase/supabase-js';
import { supabaseAuthStorage } from '@/utils/supabase-storage';
import { supabaseAdmin as platformSupabaseAdmin } from '@/platform/auth/clients';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabaseStorageKey =
  'sb-' + (supabaseUrl.split('//')[1]?.split('.')[0] || 'auth') + '-auth-token';

// Client-safe instance (uses public anon key) — persiste la sesión en el navegador.
// El storage adapter espeja el access_token a una cookie (sb-access-token)
// para que el middleware y los Server Components puedan leer la sesión.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: supabaseAuthStorage,
    storageKey: supabaseStorageKey,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Server-only instance (uses service role key to bypass RLS in Server Actions)
// AVISO: supabaseAdmin omite RLS. Siempre filtrar por tenant_id en el código.
// Reexportamos la instancia única centralizada de la plataforma.
export const supabaseAdmin = platformSupabaseAdmin;

