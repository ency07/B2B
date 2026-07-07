/**
 * catalog-cache.ts — Módulo de caché para el catálogo industrial.
 * Adaptado para usar la invalidación nativa de Next.js.
 */

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export const CATALOG_TTL_MS = 60_000; // 60 segundos

// Mantenemos las funciones y firmas antiguas para retrocompatibilidad, pero
// getCatalogCache y setCatalogCache ya no se usarán directamente en catalog.ts
// porque catalog.ts utilizará unstable_cache de Next.js.
const catalogCache = new Map<string, CacheEntry<any>>();

export function getCatalogCache<T>(key: string): T | null {
  const entry = catalogCache.get(key);
  if (entry && Date.now() < entry.expiresAt) {
    return entry.data as T;
  }
  return null;
}

export function setCatalogCache<T>(key: string, data: T): void {
  catalogCache.set(key, { data, expiresAt: Date.now() + CATALOG_TTL_MS });
}

export function invalidateCatalogCache(tenantCode?: string | null): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { revalidateTag } = require('next/cache');
    revalidateTag('catalog-all');
  } catch {
    // Fallback si no estamos en Next.js runtime (por ejemplo, ejecutando scripts ts-node)
    if (tenantCode) {
      catalogCache.delete(tenantCode);
    } else {
      catalogCache.clear();
    }
  }
}

