import type { SupportedStorage } from "@supabase/supabase-js";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function getCookieNames(): { access: string; refresh: string } {
  if (!isBrowser()) {
    return {
      access: "sb-access-token",
      refresh: "sb-refresh-token",
    };
  }
  const search = window.location.search || "";
  const pathname = window.location.pathname || "";
  const isPortal =
    pathname.startsWith("/portal") ||
    search.includes("redirect=%2Fportal") ||
    search.includes("redirect=/portal");

  return {
    access: isPortal ? "sb-portal-access-token" : "sb-erp-access-token",
    refresh: isPortal ? "sb-portal-refresh-token" : "sb-erp-refresh-token",
  };
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (!isBrowser()) return;
  const secure =
    typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function clearCookie(name: string): void {
  if (!isBrowser()) return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function parseSession(raw: string): {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
} | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export const supabaseAuthStorage: SupportedStorage = {
  getItem(key: string): string | null {
    if (!isBrowser()) return null;
    return window.localStorage.getItem(key);
  },
  setItem(key: string, value: string): void {
    if (!isBrowser()) return;
    window.localStorage.setItem(key, value);

    const session = parseSession(value);
    if (!session) return;

    const cookieNames = getCookieNames();
    if (session.access_token) {
      const expiresIn = typeof session.expires_in === "number" ? session.expires_in : 3600;
      const maxAge = Math.max(60, expiresIn - 30);
      writeCookie(cookieNames.access, session.access_token, maxAge);
    }

    if (session.refresh_token) {
      writeCookie(cookieNames.refresh, session.refresh_token, 7 * 24 * 60 * 60);
    }
  },
  removeItem(key: string): void {
    if (!isBrowser()) return;
    window.localStorage.removeItem(key);
    clearCookie("sb-access-token");
    clearCookie("sb-refresh-token");
    clearCookie("sb-erp-access-token");
    clearCookie("sb-erp-refresh-token");
    clearCookie("sb-portal-access-token");
    clearCookie("sb-portal-refresh-token");
  },
};
