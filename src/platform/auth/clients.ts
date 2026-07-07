import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createStorageAdapter } from './storage-adapters';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let erpBrowserClient: SupabaseClient<any, "public", any> | null = null;
let portalBrowserClient: SupabaseClient<any, "public", any> | null = null;

export function getErpBrowserClient() {
  if (erpBrowserClient) return erpBrowserClient;
  erpBrowserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: createStorageAdapter('erp'),
      storageKey: 'sb-erp-local',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return erpBrowserClient;
}

export function getPortalBrowserClient() {
  if (portalBrowserClient) return portalBrowserClient;
  portalBrowserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: createStorageAdapter('portal'),
      storageKey: 'sb-portal-local',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return portalBrowserClient;
}

// Server-only instance (lazy init — falla solo si se usa)
let adminClient: SupabaseClient<any, "public", any> | null = null;

export function getSupabaseAdmin(): SupabaseClient<any, "public", any> {
  if (adminClient) return adminClient;
  if (!supabaseServiceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY no está configurada. " +
      "Las Server Actions que requieren bypass de RLS no funcionarán."
    );
  }
  if (!supabaseUrl) {
    throw new Error(
      "SUPABASE_URL no está configurada. Verifica .env.local"
    );
  }
  adminClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return adminClient;
}

// Legacy export (mantiene compatibilidad con el código existente)
// @deprecated Usa getSupabaseAdmin() en su lugar para inicialización lazy
function createAdminProxy(): SupabaseClient<any, "public", any> {
  const proxy = new Proxy({} as SupabaseClient<any, "public", any>, {
    get(_, prop) {
      return getSupabaseAdmin()[prop as keyof ReturnType<typeof getSupabaseAdmin>];
    },
  });
  return proxy;
}

export const supabaseAdmin = createAdminProxy();
