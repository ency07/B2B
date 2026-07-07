/**
 * MOTOR DE INGENIERÍA (Engineering Engine)
 * Lógica pura de cálculo de volumen, cambios de aire por hora (ACH), densidad,
 * pérdidas de carga, consumo eléctrico y dimensionamiento de turbomaquinaria.
 * White-label: sin marcas hardcoded, sin tenant_code quemado.
 */

export interface AreaDimensions {
  length: number; // en metros
  width: number;  // en metros
  height: number; // en metros
}

export interface DetailedEngineeringReport {
  cubicMeters: number;
  cubicFeet: number;
  ach: number;
  cfm: number;
  airDensity: number;
  staticPressure: number;
  powerHp: number;
  powerKw: number;
  noiseDba: number;
  eqCount: number;
  distribution: string;
  investmentRangeMinCop: number;
  investmentRangeMaxCop: number;
  investmentRangeMinUsd: number;
  investmentRangeMaxUsd: number;
  airVelocityFpm: number;
  criticality: "ALTA" | "MEDIA" | "BAJA";
}

// Mapeo estricto de ACH (Air Changes per Hour) según el entorno operativo (Norma ASHRAE)
export const ACH_BY_ENVIRONMENT: Record<string, number> = {
  heavy_plant: 45,  // Planta Pesada / Fundición
  fundicion: 45,    // Planta Pesada / Fundición
  mecanico: 20,     // Taller Mecánico
  alimentos: 15,    // Alimentos
  data_center: 30,  // Data Center
  datacenter: 30,   // Data Center
  warehouse: 8,     // Bodega / Almacén
  almacen: 8,       // Bodega / Almacén
  default: 10
};

// Criticidad del entorno según la carga térmica e higrométrica
export const CRITICALITY_BY_ENVIRONMENT: Record<string, "ALTA" | "MEDIA" | "BAJA"> = {
  heavy_plant: "ALTA",
  fundicion: "ALTA",
  mecanico: "MEDIA",
  alimentos: "BAJA",
  data_center: "ALTA",
  datacenter: "ALTA",
  warehouse: "BAJA",
  almacen: "BAJA",
  default: "BAJA"
};

const METERS_TO_FEET_FACTOR = 35.3147; // 1 m³ = 35.3147 pies³
const COP_TO_USD_RATE = 4000;

/**
 * Obtiene los cambios de aire por hora (ACH) según el ambiente.
 */
export function getAchForEnvironment(environment: string): number {
  return ACH_BY_ENVIRONMENT[environment] || ACH_BY_ENVIRONMENT.default;
}

/**
 * Calcula la densidad del aire corregida por altitud y temperatura (Fórmula Neumática).
 */
export function calculateAirDensity(altitudeMsnm: number, tempCelsius: number): number {
  const p0 = 1.204; // Densidad del aire estándar a nivel del mar (20°C)
  const tempKelvin = tempCelsius + 273.15;
  const tempCorrection = 293.15 / tempKelvin;
  const altitudeCorrection = Math.pow(1 - 2.2557e-5 * altitudeMsnm, 5.25588);
  return p0 * tempCorrection * altitudeCorrection;
}

/**
 * Realiza el cálculo completo de preingeniería unificado para Landing, Wizard y ERP.
 *
 * ⚠ RIESGO: Este módulo es un punto único de fallo para el wizard completo.
 * Si hay un bug matemático, afecta presupuestos reales de clientes.
 * Todos los cálculos deben:
 * - Sanitizar entradas (positivos, no NaN, no Infinity)
 * - Validar rangos físicos realistas
 * - Registrar en log cualquier valor fuera de rango
 */
export function generateEngineeringReport(
  dimensions: AreaDimensions,
  environment: string,
  altitudeMsnm: number,
  tempCelsius: number,
  hasDucts: boolean
): DetailedEngineeringReport {
  // Sanity check: dimensiones realistas
  const sanitizedDimensions = {
    length: Math.max(0.1, Math.min(500, Math.abs(dimensions.length || 0))),
    width: Math.max(0.1, Math.min(500, Math.abs(dimensions.width || 0))),
    height: Math.max(0.1, Math.min(50, Math.abs(dimensions.height || 0))),
  };
  const { length, width, height } = sanitizedDimensions;
  const cubicMeters = Math.max(0, length * width * height);
  const cubicFeet = cubicMeters * METERS_TO_FEET_FACTOR;
  
  const ach = getAchForEnvironment(environment);
  const criticality = CRITICALITY_BY_ENVIRONMENT[environment] || "BAJA";
  
  // Factor de corrección por contaminantes
  const pollutantFactor = environment === "fundicion" || environment === "heavy_plant" ? 1.3 : 1.0;
  
  // Caudal en CFM
  const cfm = cubicFeet > 0 ? Math.round(((cubicFeet * ach) / 60) * pollutantFactor) : 0;
  
  // Densidad
  const airDensity = calculateAirDensity(altitudeMsnm, tempCelsius);
  
  // Presión estática
  const staticPressure = hasDucts ? 1.5 : 0.5; // inWG
  
  // Cantidad de equipos sugeridos (ventiladores estándar de 7,500 CFM)
  const eqCount = cfm > 0 ? Math.max(1, Math.ceil(cfm / 7500)) : 0;
  
  // Distribución
  let distribution = "";
  if (environment === "fundicion" || environment === "heavy_plant" || environment === "datacenter" || environment === "data_center") {
    distribution = `${Math.ceil(eqCount / 2)} Inyectores + ${Math.floor(eqCount / 2)} Extractores tipo Hongo`;
  } else {
    distribution = `${eqCount} Extractores Axiales Murales`;
  }
  
  // Potencia del motor
  // HP = (CFM * SP) / 6356
  const powerHp = cfm > 0 ? Number(((cfm * staticPressure) / 6356).toFixed(1)) : 0;
  // kW = HP * 0.746 / 0.94 (eficiencia IE4)
  const powerKw = powerHp > 0 ? Number(((powerHp * 0.746) / 0.94).toFixed(1)) : 0;
  
  // Ruido
  const baseNoise = 68; // dBA
  const noiseDba = eqCount > 0 ? Math.round(baseNoise + 10 * Math.log10(eqCount)) : 0;
  
  // Inversión estimada
  const basePriceCop = eqCount * 2500 * 4000;
  const investmentRangeMinCop = Math.round(basePriceCop * 0.85);
  const investmentRangeMaxCop = Math.round(basePriceCop * 1.35);
  const investmentRangeMinUsd = Math.round(investmentRangeMinCop / COP_TO_USD_RATE);
  const investmentRangeMaxUsd = Math.round(investmentRangeMaxCop / COP_TO_USD_RATE);
  
  // Velocidad del aire
  const outletArea = eqCount * 1.2;
  const outletAreaSqFt = outletArea * 10.764;
  const airVelocityFpm = cfm > 0 && outletAreaSqFt > 0 ? Math.round(cfm / outletAreaSqFt) : 0;

  return {
    cubicMeters: Math.round(cubicMeters * 100) / 100,
    cubicFeet: Math.round(cubicFeet * 100) / 100,
    ach,
    cfm,
    airDensity: Number(airDensity.toFixed(3)),
    staticPressure,
    powerHp,
    powerKw,
    noiseDba,
    eqCount,
    distribution,
    investmentRangeMinCop,
    investmentRangeMaxCop,
    investmentRangeMinUsd,
    investmentRangeMaxUsd,
    airVelocityFpm,
    criticality
  };
}

/**
 * Función heredada para compatibilidad del Wizard/CRM que calcula caudal requerido.
 *
 * Nota: Usa default altitude=0 (nivel del mar), temp=20°C, sin ductos.
 * Para cálculos precisos, usar generateEngineeringReport directamente.
 */
export function calculateRequiredCfm(
  dimensions: AreaDimensions,
  environment: string
): {
  cubicMeters: number;
  cubicFeet: number;
  ach: number;
  cfm: number;
} {
  const report = generateEngineeringReport(dimensions, environment, 0, 20, false);
  return {
    cubicMeters: report.cubicMeters,
    cubicFeet: report.cubicFeet,
    ach: report.ach,
    cfm: report.cfm
  };
}

