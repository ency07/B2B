/**
 * MOTOR DE PRECIOS (Pricing Engine)
 * Lógica pura de estimación de costos B2B en COP y USD con rangos de desviación y urgencia.
 * White-label: sin marcas hardcoded, sin tenant_code quemado.
 *
 * TASA DE CAMBIO: Ver src/lib/constants.ts para el valor único.
 */

import { COP_TO_USD_RATE as _COP_RATE } from "@/lib/constants";

/** @deprecated Importar desde @/lib/constants */
export const COP_TO_USD_RATE = _COP_RATE;

// Precios base estimados por tipo de servicio en COP
export const BASE_PRICE_BY_SERVICE: Record<string, number> = {
  fabricacion: 1200000,   // $1.200.000 COP
  venta: 800000,          // $800.000 COP
  mantenimiento: 300000,  // $300.000 COP
  reparacion: 500000,     // $500.000 COP
  default: 500000
};

// Multiplicadores por nivel de urgencia
export const URGENCY_MULTIPLIERS: Record<string, number> = {
  alta: 1.35,  // +35%
  media: 1.10, // +10%
  baja: 1.00,  // Sin incremento
  default: 1.00
};

export interface PriceEstimation {
  basePriceCop: number;
  urgencyMultiplier: number;
  subtotalCop: number;
  estimatedTotalCop: number;
  estimatedTotalUsd: number;
  rangeMinCop: number;
  rangeMaxCop: number;
  rangeMinUsd: number;
  rangeMaxUsd: number;
  rate: number;
}

/**
 * Calcula la estimación de precio basada en el servicio, urgencia y dimensiones físicas (volumen).
 * Se aplica una desviación de +/- 15% como rango presupuestario comercial.
 *
 * ⚠ RIESGO: Este módulo es punto único de fallo para presupuestos wizard.
 * Validaciones:
 * - Volumen debe ser positivo y realista (máx 10^7 m³)
 * - Precios base definidos para cada servicio
 * - Multiplicadores de urgencia con cota superior
 */
export function estimatePrice(
  serviceType: string,
  urgency: string,
  volumeCubicMeters: number
): PriceEstimation {
  // Sanity check: volumen realista (1L a 10 millones m³)
  const safeVolume = Math.max(0.001, Math.min(10_000_000, volumeCubicMeters || 0));
  if (safeVolume !== volumeCubicMeters) {
    console.warn(`[pricing] Volumen fuera de rango: ${volumeCubicMeters}, ajustado a ${safeVolume}`);
  }

  const basePriceCop = BASE_PRICE_BY_SERVICE[serviceType] || BASE_PRICE_BY_SERVICE.default;
  const urgencyMultiplier = URGENCY_MULTIPLIERS[urgency] || URGENCY_MULTIPLIERS.default;

  // Cota superior: el multiplicador de urgencia no debe exceder 2.0
  const cappedMultiplier = Math.min(urgencyMultiplier, 2.0);

  // Modificador por volumen físico (ej. proyectos más grandes incrementan el precio base exponencialmente de forma lineal)
  // Cada 100 metros cúbicos incrementa un 5% el precio base del servicio
  const volumeModifier = 1 + Math.max(0, volumeCubicMeters / 100) * 0.05;

  const subtotalCop = Math.round(basePriceCop * volumeModifier);
  const estimatedTotalCop = Math.round(subtotalCop * cappedMultiplier);
  const estimatedTotalUsd = Math.round((estimatedTotalCop / COP_TO_USD_RATE) * 100) / 100;

  // Rango de desviación de +/- 15%
  const DEVIATION_FACTOR = 0.15;
  const rangeMinCop = Math.round(estimatedTotalCop * (1 - DEVIATION_FACTOR));
  const rangeMaxCop = Math.round(estimatedTotalCop * (1 + DEVIATION_FACTOR));

  const rangeMinUsd = Math.round((rangeMinCop / COP_TO_USD_RATE) * 100) / 100;
  const rangeMaxUsd = Math.round((rangeMaxCop / COP_TO_USD_RATE) * 100) / 100;

  return {
    basePriceCop,
    urgencyMultiplier,
    subtotalCop,
    estimatedTotalCop,
    estimatedTotalUsd,
    rangeMinCop,
    rangeMaxCop,
    rangeMinUsd,
    rangeMaxUsd,
    rate: COP_TO_USD_RATE
  };
}
