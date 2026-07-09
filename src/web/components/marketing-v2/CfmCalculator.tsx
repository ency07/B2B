 
 
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play, Cpu, Activity, Wind, BarChart3 } from "lucide-react";
import { generateEngineeringReport, ENVIRONMENT_OPTIONS } from "@/utils/engineering";

// Mismo catálogo de entornos que usa el Wizard (ENVIRONMENT_OPTIONS) — así el
// resultado que se ve aquí es garantizado el mismo que se recalcula al pasar
// al Wizard con "Cotizar con estos datos".
const ACTIVITIES = ENVIRONMENT_OPTIONS;

function useCountUp(target: number | null, duration = 1100) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    if (target === null || target === 0) {
      setTimeout(() => setValue(0), 0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

// Gauge circular SVG
function CircularGauge({
  value,
  max,
  label,
  unit,
  color = "var(--ds-c-marketing-cfm-gauge-color)",
}: {
  value: number;
  max: number;
  label: string;
  unit: string;
  color?: string;
}) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative w-44 h-44">
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox="0 0 160 160"
      >
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="2"
        />
        <motion.circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* Tick marks */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * 360;
          const isMain = i % 6 === 0;
          return (
            <line
              key={i}
              x1="80"
              y1="8"
              x2="80"
              y2={isMain ? "14" : "11"}
              stroke={i / 24 * 360 <= pct * 3.6 ? color : "rgba(0,0,0,0.1)"}
              strokeWidth={isMain ? 1 : 0.5}
              transform={`rotate(${angle} 80 80)`}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p
          className="font-display text-3xl font-light tracking-[-0.02em] tabular-nums leading-none"
          style={{ color }}
        >
          {value.toLocaleString("es-CO")}
        </p>
        <p className="font-mono text-[10px] tracking-widest text-fg-muted uppercase mt-2">
          {unit}
        </p>
        <p className="editorial-mono mt-1">{label}</p>
      </div>
    </div>
  );
}

export function CfmCalculator() {
  const [length, setLength] = React.useState("50");
  const [width, setWidth] = React.useState("30");
  const [height, setHeight] = React.useState("8");
  const [activity, setActivity] = React.useState(ACTIVITIES[3].value);
  const [altitude, setAltitude] = React.useState("2640");
  const [computed, setComputed] = React.useState<number | null>(null);
  const [isCalc, setIsCalc] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  const animatedCfm = useCountUp(computed);
  const ach = computed
    ? Math.round(
        (computed * 60) /
          (parseFloat(length || "1") *
            parseFloat(width || "1") *
            parseFloat(height || "1"))
      )
    : 0;
  const volumeM3 = parseFloat(length || "0") * parseFloat(width || "0") * parseFloat(height || "0");
  const volumeFt3 = volumeM3 * 35.3147;

  const handleCalc = (e: React.FormEvent) => {
    e.preventDefault();
    const L = parseFloat(length);
    const W = parseFloat(width);
    const H = parseFloat(height);
    const A = parseFloat(altitude);
    if (!L || !W || !H || !A) return;
    setIsCalc(true);
    setComputed(null);
    setProgress(0);

    // Simula proceso de cálculo con barra de progreso — el número final usa
    // el mismo motor (generateEngineeringReport) que el paso 2 del Wizard,
    // para que el resultado nunca se desincronice entre ambos.
    const start = performance.now();
    const duration = 1100;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setProgress(p * 100);
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        const report = generateEngineeringReport({ length: L, width: W, height: H }, activity, A, 20, false);
        setComputed(report.cfm);
        setIsCalc(false);
        setTimeout(() => setProgress(100), 200);
      }
    };
    requestAnimationFrame(tick);
  };

  return (
    <section
      id="calculadora"
      className="relative w-full bg-[var(--ds-c-marketing-cfm-background)] text-paper section-py overflow-hidden"
    >
      {/* Grid background técnico */}
      <div className="absolute inset-0 opacity-[0.04]">
        <svg width="100%" height="100%">
          <defs>
            <pattern
              id="calc-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#calc-grid)" />
        </svg>
      </div>

      <div className="relative max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 section-header-normal">
          <div className="lg:col-span-2">
            <p className="font-mono text-[11px] sm:text-[10px] tracking-widest text-white/50 uppercase">
              — Herramienta 02
            </p>
          </div>
          <div className="lg:col-span-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-[clamp(40px,5.5vw,80px)] font-light tracking-[-0.03em] leading-[1.0] text-paper max-w-4xl"
            >
              Motor de cálculo
              <br />
              <span className="italic text-white/70">de preingeniería.</span>
            </motion.h2>
            <p className="mt-10 text-lg sm:text-xl leading-[1.6] text-white/65 max-w-2xl font-sans">
              Software de cálculo en tiempo real. Caudal volumétrico bajo
              normas ASHRAE 62.1 con corrección por altitud para LATAM.
              Resultado en menos de 2 segundos.
            </p>
          </div>
        </div>

        <div className="mt-20 grid grid-cols-1 lg:grid-cols-12 gap-px bg-white/10 border border-white/10">
          {/* === LEFT: Inputs como terminal === */}
          <form
            onSubmit={handleCalc}
            className="lg:col-span-5 bg-[var(--ds-c-marketing-cfm-terminal-background)] p-8 lg:p-10"
          >
            {/* Terminal header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--ds-c-marketing-cfm-terminal-dot-red)]" />
                <div className="w-2 h-2 rounded-full bg-[var(--ds-c-marketing-cfm-terminal-dot-yellow)]" />
                <div className="w-2 h-2 rounded-full bg-[var(--ds-c-marketing-cfm-terminal-dot-green)]" />
              </div>
              <p className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
                input.terminal
              </p>
            </div>

            <p className="font-mono text-[10px] tracking-widest text-white/40 uppercase mb-6">
              Parámetros de entrada
            </p>

            <div className="space-y-5">
              <TerminalInput
                label="Largo"
                unit="m"
                value={length}
                onChange={setLength}
                step="0.1"
                min="5"
                max="200"
              />
              <TerminalInput
                label="Ancho"
                unit="m"
                value={width}
                onChange={setWidth}
                step="0.1"
                min="5"
                max="100"
              />
              <TerminalInput
                label="Altura"
                unit="m"
                value={height}
                onChange={setHeight}
                step="0.1"
                min="3"
                max="30"
              />

              <div>
                <label className="font-mono text-[10px] tracking-widest text-white/40 uppercase block mb-2">
                  Actividad
                </label>
                <select
                  value={activity}
                  onChange={(e) => setActivity(e.target.value)}
                  className="w-full h-12 px-4 bg-white/5 text-paper text-sm font-sans focus-expand focus:bg-white/10 focus:ring-0 focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  {ACTIVITIES.map((a) => (
                    <option key={a.value} value={a.value} className="bg-[var(--ds-c-marketing-cfm-terminal-background)] text-paper">
                      {a.label} · {a.ach} ACH
                    </option>
                  ))}
                </select>
              </div>

              <TerminalInput
                label="Altitud"
                unit="msnm"
                value={altitude}
                onChange={setAltitude}
                step="1"
                min="0"
                max="3500"
              />

              {/* Progress bar / Status */}
              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
                    Estado del motor
                  </p>
                  <p className="font-mono text-[10px] tracking-widest text-white/70 uppercase tabular-nums">
                    {isCalc ? `${Math.round(progress)}%` : "IDLE"}
                  </p>
                </div>
                <div className="relative h-1 bg-white/10 overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-[var(--ds-c-marketing-cfm-progress)]"
                    style={{ width: `${isCalc ? progress : 0}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isCalc}
                className="group w-full h-12 mt-2 bg-paper text-ink text-sm font-medium tracking-tight rounded-sm hover:bg-white transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isCalc ? (
                  <>
                    <span className="font-mono text-xs">Procesando</span>
                    <span className="flex gap-1">
                      <span className="w-1 h-1 rounded-full bg-ink animate-pulse" />
                      <span className="w-1 h-1 rounded-full bg-ink animate-pulse [animation-delay:200ms]" />
                      <span className="w-1 h-1 rounded-full bg-ink animate-pulse [animation-delay:400ms]" />
                    </span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" strokeWidth={0} />
                    <span>Ejecutar cálculo</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* === RIGHT: Output como dashboard === */}
          <div className="lg:col-span-7 bg-[var(--ds-c-marketing-cfm-terminal-background)] p-8 lg:p-10 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <p className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
                Resultado
              </p>
              <div className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isCalc
                      ? "bg-[var(--ds-c-marketing-cfm-status-calculating)] animate-pulse"
                      : computed
                        ? "bg-[var(--ds-c-marketing-cfm-status-done)]"
                        : "bg-white/30"
                  }`}
                />
                <span className="font-mono text-[10px] tracking-widest text-white/50 uppercase">
                  {isCalc ? "Calculando" : computed ? "Resultado" : "Standby"}
                </span>
              </div>
            </div>

            {/* === GAUGES === */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
              <div className="flex flex-col items-center">
                <CircularGauge
                  value={animatedCfm}
                  max={100000}
                  label="Caudal"
                  unit="CFM"
                  color="var(--ds-c-marketing-cfm-gauge-color)"
                />
              </div>
              <div className="flex flex-col items-center">
                <CircularGauge
                  value={ach}
                  max={60}
                  label="Renovación"
                  unit="ACH"
                  color="var(--ds-c-marketing-cfm-gauge-secondary)"
                />
              </div>
              <div className="flex flex-col items-center">
                <CircularGauge
                  value={Math.round(volumeM3)}
                  max={50000}
                  label="Volumen"
                  unit="m³"
                  color="var(--ds-c-marketing-cfm-gauge-accent)"
                />
              </div>
            </div>

            {/* === TELEMETRY STRIP === */}
            <div className="border border-white/10 divide-y divide-white/10 mb-8">
              <TelemetryRow
                icon={<Wind className="w-3.5 h-3.5" strokeWidth={1.5} />}
                label="Caudal volumétrico"
                value={animatedCfm.toLocaleString("es-CO")}
                unit="CFM"
              />
              <TelemetryRow
                icon={<Activity className="w-3.5 h-3.5" strokeWidth={1.5} />}
                label="Renovación horaria"
                value={ach.toString()}
                unit="ACH"
              />
              <TelemetryRow
                icon={<BarChart3 className="w-3.5 h-3.5" strokeWidth={1.5} />}
                label="Volumen físico"
                value={`${volumeM3.toFixed(0)} m³`}
                unit={`${Math.round(volumeFt3).toLocaleString("es-CO")} ft³`}
              />
              <TelemetryRow
                icon={<Cpu className="w-3.5 h-3.5" strokeWidth={1.5} />}
                label="Equipo sugerido"
                value={`${Math.max(1, Math.ceil(animatedCfm / 22500))}× AX-HD-48`}
                unit="22,500 CFM c/u"
              />
            </div>

            {/* === CTAs === */}
            <div className="mt-auto pt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof window === "undefined") return;
                  const params = new URLSearchParams({
                    length: length || "",
                    width: width || "",
                    height: height || "",
                    environment: activity,
                    altitude: altitude || "",
                    cfm: String(computed || ""),
                  });
                  window.location.href = `/wizard?${params.toString()}`;
                }}
                disabled={!computed}
                className="group flex-1 h-12 bg-[var(--ds-c-marketing-cfm-button-background)] text-ink text-sm font-medium tracking-tight rounded-sm hover:bg-[var(--ds-c-marketing-cfm-button-hover)] transition-colors flex items-center justify-center gap-2 disabled:opacity-30"
              >
                <span>Cotizar con estos datos</span>
                <ArrowRight
                  className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1"
                  strokeWidth={1.5}
                />
              </button>
              <button
                type="button"
                className="h-12 px-6 border border-white/30 text-paper text-sm font-medium tracking-tight rounded-sm hover:bg-white/10 transition-colors"
              >
                Reporte PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TerminalInput({
  label,
  unit,
  value,
  onChange,
  step,
  min,
  max,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
          {label}
        </label>
        <span className="font-mono text-[9px] text-white/30 tracking-wider">
          {min}—{max}{unit}
        </span>
      </div>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-white/40">
          ›
        </span>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 pl-9 pr-14 bg-white/5 text-paper font-mono text-sm tabular-nums focus-expand focus:bg-white/10 focus:ring-0 focus:outline-none transition-colors"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-white/40 tracking-widest uppercase">
          {unit}
        </span>
      </div>
    </div>
  );
}

function TelemetryRow({
  icon,
  label,
  value,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="text-white/40">{icon}</span>
        <span className="font-mono text-[11px] tracking-widest text-white/60 uppercase">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2 text-right">
        <span className="font-mono text-sm font-medium text-paper tabular-nums">
          {value}
        </span>
        <span className="font-mono text-[10px] text-white/40 tracking-wide">
          {unit}
        </span>
      </div>
    </div>
  );
}
