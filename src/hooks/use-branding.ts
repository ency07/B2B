"use client";

/**
 * useBranding — hook que devuelve el branding actual del tenant.
 *
 * Estrategia:
 *  1. Estado inicial: defaults de getBrandingDefaults (no hardcoded).
 *  2. Tras mount: lee la cache de tenant_config_<code> en localStorage
 *     y mergea con los defaults.
 *  3. Poll cada 2s (mismo patron que el header y sidebar existentes)
 *     para reflejar cambios cuando se actualiza el branding.
 *
 * Si en el futuro se quiere una fuente mas reactiva (contexto, server
 * components, RSC), este hook es el unico punto a cambiar.
 */

import * as React from "react";
import {
  getBrandingDefaults,
  type BrandingConfig,
} from "@/platform/branding/branding-defaults";

export function useBranding(tenantCode?: string | null): BrandingConfig {
  const [config, setConfig] = React.useState<BrandingConfig>(() =>
    getBrandingDefaults(tenantCode)
  );

  React.useEffect(() => {
    function load() {
      const cacheKey = `tenant_config_${tenantCode || "default"}`;
      const cached =
        typeof window !== "undefined"
          ? window.localStorage.getItem(cacheKey)
          : null;
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setConfig({ ...getBrandingDefaults(tenantCode), ...parsed });
        } catch {
          setConfig(getBrandingDefaults(tenantCode));
        }
      } else {
        setConfig(getBrandingDefaults(tenantCode));
      }
    }
    load();
    const interval = setInterval(load, 2000);
    return () => clearInterval(interval);
  }, [tenantCode]);

  return config;
}
