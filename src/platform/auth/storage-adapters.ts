import type { SupportedStorage } from "@supabase/supabase-js";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (!isBrowser()) return;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function clearCookie(name: string): void {
  if (!isBrowser()) return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function parseSession(raw: string) {
  try { return JSON.parse(raw); } catch { return null; }
}

export function createStorageAdapter(domain: 'erp' | 'portal'): SupportedStorage {
  const accessCookie = `sb-${domain}-access-token`;
  const refreshCookie = `sb-${domain}-refresh-token`;
  
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
               try { JSON.parse(val); } catch { continue; } // validar que sea JSON
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

      const session = parseSession(value);
      if (!session) return;

      if (session.access_token) {
        const expiresIn = typeof session.expires_in === "number" ? session.expires_in : 3600;
        const maxAge = Math.max(60, expiresIn - 30);
        writeCookie(accessCookie, session.access_token, maxAge);
      }
      if (session.refresh_token) {
        writeCookie(refreshCookie, session.refresh_token, 7 * 24 * 60 * 60);
      }
    },
    removeItem(key: string): void {
      if (!isBrowser()) return;
      window.localStorage.removeItem(key);
      clearCookie(accessCookie);
      clearCookie(refreshCookie);
    },
  };
}
