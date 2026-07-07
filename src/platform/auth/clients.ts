import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createStorageAdapter } from './storage-adapters';

// Tipo genérico para esquema de BD (válido para Supabase v2 sin tipos generados)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseSchema = any;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let erpBrowserClient: SupabaseClient<SupabaseSchema, "public", SupabaseSchema> | null = null;
let portalBrowserClient: SupabaseClient<SupabaseSchema, "public", SupabaseSchema> | null = null;

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

// Public client for Server Actions (uses anon key + RLS)
let publicClient: SupabaseClient<SupabaseSchema, "public", SupabaseSchema> | null = null;

export function getPublicServerClient(): SupabaseClient<SupabaseSchema, "public", SupabaseSchema> {
  if (publicClient) return publicClient;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "SUPABASE_URL y SUPABASE_ANON_KEY deben estar configuradas para el cliente público."
    );
  }
  publicClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return publicClient;
}

// Server-only instance (lazy init — falla solo si se usa)
let adminClient: SupabaseClient<SupabaseSchema, "public", SupabaseSchema> | null = null;

export function getSupabaseAdmin(): SupabaseClient<SupabaseSchema, "public", SupabaseSchema> {
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
function createAdminProxy(): SupabaseClient<SupabaseSchema, "public", SupabaseSchema> {
  const proxy = new Proxy({} as SupabaseClient<SupabaseSchema, "public", SupabaseSchema>, {
    get(_, prop) {
      return getSupabaseAdmin()[prop as keyof ReturnType<typeof getSupabaseAdmin>];
    },
  });
  return proxy;
}

export const supabaseAdmin = createAdminProxy();
