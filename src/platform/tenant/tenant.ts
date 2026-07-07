export interface TenantConfig {
  name: string;
  productName?: string;
  exampleDomain?: string;
  logoUrl?: string;
  contactEmail: string;
  contactPhone?: string;
  primaryColor: string; // HSL value, e.g. "215 80% 50%"
  theme?: "light" | "dark";
  heroMetrics?: {
    flowRate?: number;
    power?: number;
    temperature?: number;
    suggestedEquipment?: number;
  };
}

export const MOCK_TENANTS: Record<string, TenantConfig> = {
  default: {
    name: "Empresa B2B",
    productName: "Soluciones B2B",
    exampleDomain: "empresa.com",
    contactEmail: "contacto@empresa.com",
    contactPhone: "+57 300 000 0000",
    primaryColor: "240 5.9% 10%",
    heroMetrics: { flowRate: 8000, power: 18.0, temperature: 35, suggestedEquipment: 4 },
  },
};

export function getTenantConfig(_tenantId?: string | null): TenantConfig {
  // El branding real viene de tenant_settings via getTenantBranding.
  // Este fallback solo se usa si no hay branding disponible.
  return MOCK_TENANTS.default;
}

/**
 * Parses any standard CSS color (Hex, HSL, RGB) or space-separated HSL values
 * and converts them into the space-separated HSL channels format: "H S% L%"
 */
export function parseToHslChannels(color: string): string {
  color = color.trim();
  
  // If it's already in the format "H S% L%"
  if (/^\d+\s+\d+%\s+\d+%$/.test(color)) {
    return color;
  }

  // If it's hsl(H, S%, L%) or hsla(H, S%, L%, A)
  const hslMatch = color.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*[0-9.]+)?\)$/i);
  if (hslMatch) {
    return `${hslMatch[1]} ${hslMatch[2]}% ${hslMatch[3]}%`;
  }

  // If it's hex format (#fff or #ffffff)
  const hexMatch = color.match(/^#([A-Fa-f0-9]{3}){1,2}$/);
  if (hexMatch) {
    let hex = color.substring(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    const hDeg = Math.round(h * 360);
    const sPct = Math.round(s * 100);
    const lPct = Math.round(l * 100);
    return `${hDeg} ${sPct}% ${lPct}%`;
  }

  // Fallback
  return "240 5.9% 10%";
}

/**
 * Formats any space-separated HSL channels representation "H S% L%" into 
 * database-valid "hsl(H, S%, L%)" format to satisfy validation constraints.
 */
export function formatColorForDb(color: string): string {
  color = color.trim();
  const channelsMatch = color.match(/^(\d+)\s+(\d+)%\s+(\d+)%$/);
  if (channelsMatch) {
    return `hsl(${channelsMatch[1]}, ${channelsMatch[2]}%, ${channelsMatch[3]}%)`;
  }
  return color;
}

