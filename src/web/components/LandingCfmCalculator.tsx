"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Wind, ShieldAlert, Sparkles, ArrowRight } from "lucide-react";

export default function LandingCfmCalculator() {
  // Inputs
  const [largo, setLargo] = useState<number>(30); // metros
  const [ancho, setAncho] = useState<number>(15); // metros
  const [alto, setAlto] = useState<number>(6); // metros
  const [sector, setSector] = useState<string>("fundicion");
  const [altitude, setAltitude] = useState<number>(1000); // metros msnm (Bogota es 2600, Medellin 1500)
  const [temp, setTemp] = useState<number>(25); // °C
  const [ducts, setDucts] = useState<string>("no"); // red de ductos

  // Outputs
  const [volume, setVolume] = useState<number>(0);
  const [ach, setAch] = useState<number>(0);
  const [cfm, setCfm] = useState<number>(0);
  const [airDensity, setAirDensity] = useState<number>(1.2);
  const [staticPressure, setStaticPressure] = useState<number>(0.5);
  const [powerHp, setPowerHp] = useState<number>(0);
  const [powerKw, setPowerKw] = useState<number>(0);
  const [noiseDba, setNoiseDba] = useState<number>(0);
  const [qtyEquip, setQtyEquip] = useState<number>(0);
  const [distrib, setDistrib] = useState<string>( "");
  const [investment, setInvestment] = useState<string>("");
  const [criticality, setCriticality] = useState<string>("");

  // Sector specs lookup
  const sectorSpecs: Record<string, { ach: number; factor: number; crit: string }> = {
    fundicion: { ach: 45, factor: 1.3, crit: "CRÍTICA (Alta Carga Térmica)" },
    mecanico: { ach: 20, factor: 1.15, crit: "MODERADA (Gases y Polvo)" },
    alimentos: { ach: 15, factor: 1.1, crit: "BAJA (Humedad/Limpieza)" },
    datacenter: { ach: 30, factor: 1.0, crit: "CRÍTICA (Temperatura Controlada)" },
    almacen: { ach: 8, factor: 1.0, crit: "BAJA (Ventilación Estándar)" }
  };

  useEffect(() => {
    // 1. Calcular volumen
    const vol = largo * ancho * alto;
    setVolume(vol);

    // 2. Determinar ACH y Criticidad
    const spec = sectorSpecs[sector] || { ach: 10, factor: 1.0, crit: "BAJA" };
    setAch(spec.ach);
    setCriticality(spec.crit);

    // 3. Densidad del Aire corregida
    const p0 = 1.204; // kg/m³ standard
    const density = p0 * (293.15 / (273.15 + temp)) * Math.pow(1 - 2.2557e-5 * altitude, 5.25588);
    setAirDensity(density);

    // 4. Calcular CFM total
    const rawCfm = (vol * spec.ach) / 1.699 * spec.factor;
    setCfm(Math.round(rawCfm));

    // 5. Presión estática
    const sp = ducts === "si" ? 1.5 : 0.5;
    setStaticPressure(sp);

    // 6. Cantidad de equipos sugeridos (ventiladores estándar de 7,500 CFM)
    const eqCount = Math.max(1, Math.ceil(rawCfm / 7500));
    setQtyEquip(eqCount);

    // 7. Distribución recomendada
    if (sector === "fundicion" || sector === "datacenter") {
      setDistrib(`${Math.ceil(eqCount / 2)} Inyectores + ${Math.floor(eqCount / 2)} Extractores tipo Hongo`);
    } else {
      setDistrib(`${eqCount} Extractores Axiales Murales`);
    }

    // 8. Rango de Inversión (en millones COP)
    const basePrice = eqCount * 2500;
    const formatMin = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(basePrice * 4000);
    const formatMax = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(basePrice * 4000 * 1.35);
    setInvestment(`${formatMin} - ${formatMax}`);

    // 9. Potencia aproximada (HP y kW)
    const hp = (rawCfm * sp) / 6356;
    setPowerHp(Number(hp.toFixed(1)));
    const kw = (hp * 0.746) / 0.94;
    setPowerKw(Number(kw.toFixed(1)));

    // 11. Ruido esperado
    const baseNoise = 68; // dBA
    const totalNoise = baseNoise + 10 * Math.log10(eqCount);
    setNoiseDba(Math.round(totalNoise));

  }, [largo, ancho, alto, sector, altitude, temp, ducts]);

  return (
    <div className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/50 rounded-md overflow-hidden transition-colors duration-300">
      <div className="border-b border-zinc-200 dark:border-zinc-800/50 p-6 bg-zinc-50 dark:bg-zinc-900/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Motor de Prediseño</span>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white font-display mt-1">Calculadora Técnica de Preingeniería</h3>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] rounded-md border border-[var(--brand-primary)]/20 text-xs font-mono">
          <Sparkles className="w-4 h-4" /> Dimensionamiento Determinista RETIE / ASHRAE
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200 dark:divide-zinc-800/50">
        
        {/* Lado Controles (Entradas) */}
        <div className="lg:col-span-6 p-6 md:p-8 space-y-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-mono mb-4">1. Parámetros Físicos y Ambientales</h4>
          
          {/* Dimensiones */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                <span>Largo de la Nave:</span>
                <span className="font-bold text-zinc-900 dark:text-white font-mono">{largo} m</span>
              </div>
              <input 
                type="range" min="10" max="150" step="5" value={largo} 
                onChange={(e) => setLargo(Number(e.target.value))}
                className="w-full accent-[var(--brand-primary)] bg-zinc-200 dark:bg-zinc-800 cursor-pointer rounded-lg appearance-none h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                <span>Ancho de la Nave:</span>
                <span className="font-bold text-zinc-900 dark:text-white font-mono">{ancho} m</span>
              </div>
              <input 
                type="range" min="5" max="80" step="5" value={ancho} 
                onChange={(e) => setAncho(Number(e.target.value))}
                className="w-full accent-[var(--brand-primary)] bg-zinc-200 dark:bg-zinc-800 cursor-pointer rounded-lg appearance-none h-1.5"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                <span>Alto de la Nave:</span>
                <span className="font-bold text-zinc-900 dark:text-white font-mono">{alto} m</span>
              </div>
              <input 
                type="range" min="3" max="20" step="1" value={alto} 
                onChange={(e) => setAlto(Number(e.target.value))}
                className="w-full accent-[var(--brand-primary)] bg-zinc-200 dark:bg-zinc-800 cursor-pointer rounded-lg appearance-none h-1.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-900/60">
            {/* Sector */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">Sector Operativo:</label>
              <select 
                value={sector} 
                onChange={(e) => setSector(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[var(--brand-primary)]"
              >
                <option value="fundicion">Siderurgia / Fundición</option>
                <option value="mecanico">Taller Mecánico</option>
                <option value="alimentos">Procesamiento de Alimentos</option>
                <option value="datacenter">Centro de Datos (Server Room)</option>
                <option value="almacen">Bodega de Almacenamiento</option>
              </select>
            </div>

            {/* Red de ductos */}
            <div>
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 block mb-1">¿Requiere Red de Ductos?</label>
              <select 
                value={ducts} 
                onChange={(e) => setDucts(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[var(--brand-primary)]"
              >
                <option value="no">No (Descarga Libre / Directo)</option>
                <option value="si">Sí (Ductos con Pérdida de Carga)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-900/60">
            {/* Altura sobre nivel del mar */}
            <div>
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1">Altitud (msnm):</label>
              <select
                value={altitude}
                onChange={(e) => setAltitude(Number(e.target.value))}
                className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md p-2.5 text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[var(--brand-primary)]"
              >
                <option value="0">0 msnm (Barranquilla)</option>
                <option value="1000">1,000 msnm (Bucaramanga)</option>
                <option value="1500">1,500 msnm (Medellín)</option>
                <option value="2600">2,600 msnm (Bogotá)</option>
              </select>
            </div>

            {/* Temperatura */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                <span>Temperatura Ambiente:</span>
                <span className="font-bold text-zinc-900 dark:text-white font-mono">{temp} °C</span>
              </div>
              <input 
                type="range" min="10" max="50" step="5" value={temp} 
                onChange={(e) => setTemp(Number(e.target.value))}
                className="w-full accent-[var(--brand-primary)] bg-zinc-200 dark:bg-zinc-800 cursor-pointer rounded-lg appearance-none h-1.5"
              />
            </div>
          </div>

        </div>

        {/* Lado Resultados (Métricas) */}
        <div className="lg:col-span-6 p-6 md:p-8 bg-zinc-50/50 dark:bg-zinc-950/30 space-y-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)] font-mono mb-4">2. Diagnóstico del Prediseño Neumático</h4>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Volumen */}
            <div className="bg-white dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-800/80 rounded-md p-4 flex flex-col justify-between shadow-2xs">
              <span className="text-xs text-zinc-500 dark:text-zinc-550 uppercase tracking-widest font-mono">Volumen a Tratar</span>
              <div className="text-lg font-bold text-zinc-900 dark:text-white mt-1 font-mono">
                {volume.toLocaleString()} <span className="text-xs text-zinc-500 dark:text-zinc-550 font-normal">m³</span>
              </div>
            </div>

            {/* ACH */}
            <div className="bg-white dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-800/80 rounded-md p-4 flex flex-col justify-between shadow-2xs">
              <span className="text-xs text-zinc-500 dark:text-zinc-550 uppercase tracking-widest font-mono">Renovaciones (ACH)</span>
              <div className="text-lg font-bold text-[var(--brand-primary)] mt-1 font-mono">
                {ach} <span className="text-xs text-zinc-500 dark:text-zinc-550 font-normal">renov/h</span>
              </div>
            </div>

            {/* CFM */}
            <div className="bg-white dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-800/80 rounded-md p-4 col-span-2 flex flex-col justify-between relative overflow-hidden shadow-2xs">
              <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-[var(--brand-primary)]/10 to-transparent pointer-events-none" />
              <span className="text-xs text-[var(--brand-primary)] uppercase tracking-widest font-mono flex items-center gap-1">
                <Wind className="w-3.5 h-3.5" /> Caudal Volumétrico Requerido
              </span>
              <div className="text-4xl font-extrabold text-[var(--brand-primary)] mt-1 font-mono">
                {cfm.toLocaleString()} <span className="text-sm text-zinc-500 font-normal">CFM</span>
              </div>
            </div>

            {/* Consumo y Potencia */}
            <div className="bg-white dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-800/80 rounded-md p-4 flex flex-col justify-between shadow-2xs">
              <span className="text-xs text-zinc-500 dark:text-zinc-550 uppercase tracking-widest font-mono">Potencia del Motor</span>
              <div className="text-base font-bold text-zinc-900 dark:text-white mt-1 font-mono">
                {powerHp} <span className="text-xs text-zinc-500 dark:text-zinc-550 font-normal">HP</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-550 block font-normal mt-0.5">({powerKw} kW/h consumo)</span>
              </div>
            </div>

            {/* Ruido y Presión */}
            <div className="bg-white dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-800/80 rounded-md p-4 flex flex-col justify-between shadow-2xs">
              <span className="text-xs text-zinc-500 dark:text-zinc-550 uppercase tracking-widest font-mono">Ruido y Presión</span>
              <div className="text-base font-bold text-zinc-900 dark:text-white mt-1 font-mono">
                {noiseDba} <span className="text-xs text-zinc-500 dark:text-zinc-550 font-normal">dBA</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-550 block font-normal mt-0.5">({staticPressure} inWG Presión)</span>
              </div>
            </div>

            {/* Equipos sugeridos */}
            <div className="bg-white dark:bg-zinc-900/10 border border-zinc-200 dark:border-zinc-800/80 rounded-md p-4 col-span-2 space-y-2 shadow-2xs">
              <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-550 uppercase tracking-widest font-mono">Cantidad de Equipos:</span>
                <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono">{qtyEquip} Unidades</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">Distribución Sugerida:</span>
                <span className="text-zinc-700 dark:text-zinc-200 font-semibold">{distrib}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-zinc-100 dark:border-zinc-800 pt-2">
                <span className="text-zinc-500">Inversión Estimada (COP):</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">{investment}</span>
              </div>
            </div>
          </div>

          {/* Alerta de criticidad */}
          <div className="flex items-center gap-3 p-3 bg-zinc-100/70 dark:bg-zinc-900/50 rounded-md border border-zinc-200 dark:border-zinc-800/50 text-zinc-700 dark:text-zinc-300">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-amber-600 dark:text-amber-500 block font-mono">SEVERIDAD: {criticality}</span>
              La densidad corregida a esta altitud ({airDensity.toFixed(2)} kg/m³) exige equilibrar el torque del motor para evitar sobrecorrientes.
            </div>
          </div>

          {/* CTA al Wizard */}
          <div className="pt-2">
            <Link 
              href={`/wizard?length=${largo}&width=${ancho}&height=${alto}&environment=${sector}&altitude=${altitude}&temp=${temp}`}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-md bg-[var(--brand-primary)] hover:opacity-90 text-white font-semibold text-sm transition-all text-center cursor-pointer shadow-md"
            >
              Iniciar preingeniería con estos datos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
