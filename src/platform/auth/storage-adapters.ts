import type { SupportedStorage } from "@supabase/supabase-js";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function parseSession(raw: string) {
  try { return JSON.parse(raw); } catch { return null; }
}

// Llama a /api/auth/sync-token para que el servidor emita cookies HttpOnly.
// Es fire-and-forget: no bloqueamos el flujo del cliente esperando respuesta.
function syncTokensServerSide(
  domain: 'erp' | 'portal',
  accessToken: string,
  refreshToken: string | undefined,
  expiresIn: number,
): void {
  if (!isBrowser()) return;
  fetch('/api/auth/sync-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn, domain }),
    credentials: 'same-origin',
  }).catch(() => {
    // Silenciar — el token sigue válido en localStorage; el servidor lo
    // rechazará si el cookie expiró, lo que forzará un re-login limpio.
  });
}

export function createStorageAdapter(domain: 'erp' | 'portal'): SupportedStorage {
  return {
    getItem(key: string): string | null {
      if (!isBrowser()) return null;
      let val = window.localStorage.getItem(key);
      if (!val) {
        // Zero-Downtime Migration: solo migrar claves conocidas
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.endsWith('-auth-token') && !k.startsWith('sb-')) {
            val = window.localStorage.getItem(k);
            if (val) {
               try { JSON.parse(val); } catch { continue; }
               window.localStorage.setItem(key, val);
               window.localStorage.removeItem(k);
               console.log(`[Auth Migration] Migrated legacy session ${k} → ${key}`);
               break;
            }
          }
        }
      }
      return val;
    },

    setItem(key: string, value: string): void {
      if (!isBrowser()) return;
      window.localStorage.setItem(key, value);

      // [C-01] En lugar de escribir directamente a document.cookie (que
      // no puede ser HttpOnly), delegamos al servidor vía sync-token.
      const session = parseSession(value);
      if (!session?.access_token) return;

      const expiresIn = typeof session.expires_in === "number" ? session.expires_in : 3600;
      syncTokensServerSide(domain, session.access_token, session.refresh_token, expiresIn);
    },

    removeItem(key: string): void {
      if (!isBrowser()) return;
      window.localStorage.removeItem(key);
      // Las cookies HttpOnly las limpia /api/auth/signout (ya existente).
      // No intentamos limpiarlas aquí vía document.cookie porque no tenemos
      // acceso a cookies HttpOnly desde JS.
    },
  };
}
