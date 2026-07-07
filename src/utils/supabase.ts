import { createClient } from '@supabase/supabase-js';
import { supabaseAuthStorage } from '@/utils/supabase-storage';
import { supabaseAdmin as platformSupabaseAdmin } from '@/platform/auth/clients';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabaseStorageKey =
  'sb-' + (supabaseUrl.split('//')[1]?.split('.')[0] || 'auth') + '-auth-token';

// Deprecated: Usar @/platform/auth/clients en lugar de @/utils/supabase.
// Esta instancia del cliente anónimo no se usa actualmente.
// Se mantiene para compatibilidad con imports legacy.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: supabaseAuthStorage,
    storageKey: supabaseStorageKey,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Reexport de la instancia única centralizada de plataforma.
// Deprecated: Usar @/platform/auth/clients directamente.
export const supabaseAdmin = platformSupabaseAdmin;

