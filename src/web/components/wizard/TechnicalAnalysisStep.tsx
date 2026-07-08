/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-no-comment-textnodes */
"use client";

import React from "react";
import { motion } from "framer-motion";
import { Wind, Check } from "lucide-react";
import { ENVIRONMENT_OPTIONS } from "@/utils/engineering";

interface RealtimePrice {
  rangeMinCop: number;
  rangeMaxCop: number;
  rangeMinUsd: number;
  rangeMaxUsd: number;
}

interface TechnicalAnalysisStepProps {
  form: any;
  handleChange: (key: string, val: any) => void;
  errors: Record<string, string>;
  animatedCfm: number;
  realtimePrice: RealtimePrice;
  symptoms: any;
  handleSymptomToggle: (key: "heat" | "dust" | "humidity" | "gases") => void;
  cityInputFocus: boolean;
  setCityInputFocus: (val: boolean) => void;
  filteredCities: { name: string; search: string }[];
}

const SYMPTOMS = [
  { key: "heat", label: "Alta carga térmica", desc: "Sensación de sofoco o temperaturas > 35°C." },
  { key: "dust", label: "Material particulado", desc: "Polvillo en suspensión, humo denso o virutas." },
  { key: "humidity", label: "Humedad relativa alta", desc: "Vapor acumulado, condensación en techos." },
  { key: "gases", label: "Emisión de gases / olores", desc: "Monóxido, solventes, soldadura o químicos." },
];

function formatCop(value: number): string {
  return `$${Math.round(value).toLocaleString("es-CO")}`;
}

export function TechnicalAnalysisStep({
  form,
  handleChange,
  errors,
  animatedCfm,
  realtimePrice,
  symptoms,
  handleSymptomToggle,
  cityInputFocus,
  setCityInputFocus,
  filteredCities,
}: TechnicalAnalysisStepProps) {
  return (
    <motion.div
      key="step2"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-16"
    >
      {/* === HEADER con breathing === */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
        <div>
          <p className="editorial-eyebrow mb-6">// 02 — Análisis técnico</p>
          <h2 className="font-display text-4xl lg:text-5xl font-light text-ink tracking-[-0.03em] leading-[1.05] mb-6">
            Dimensiones de la planta
            <br />
            <span className="italic text-ink-soft">y entorno operativo.</span>
          </h2>
          <p className="text-lg leading-[1.6] text-ink-soft font-sans max-w-2xl">
            Especifique las dimensiones del espacio y el tipo de actividad.
            El motor calcula en tiempo real el caudal requerido bajo normas
            ASHRAE con corrección por altitud.
          </p>
        </div>

        {/* Live: Caudal + estimado de inversión */}
        <div className="bg-paper-warm px-8 py-6 shrink-0 grid grid-cols-2 gap-8">
          <div>
            <p className="editorial-mono text-fg-muted mb-2">Caudal requerido</p>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-4xl lg:text-5xl font-light text-ink tracking-[-0.03em] leading-none tabular-nums">
                {animatedCfm.toLocaleString("es-CO")}
              </span>
              <span className="font-mono text-[10px] tracking-widest text-fg-muted uppercase">
                CFM
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3F8F5F] animate-pulse" />
              <span className="font-mono text-[9px] tracking-widest text-fg-muted uppercase">
                Live
              </span>
            </div>
          </div>
          <div className="border-l border-line pl-8">
            <p className="editorial-mono text-fg-muted mb-2">Inversión estimada</p>
            <div className="leading-tight">
              <span className="font-display text-lg lg:text-xl font-light text-ink tracking-[-0.02em] tabular-nums">
                {formatCop(realtimePrice.rangeMinCop)}
              </span>
              <span className="mx-1 text-fg-muted">—</span>
              <span className="font-display text-lg lg:text-xl font-light text-ink tracking-[-0.02em] tabular-nums">
                {formatCop(realtimePrice.rangeMaxCop)}
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] text-fg-muted tabular-nums">
              USD {realtimePrice.rangeMinUsd.toLocaleString("es-CO")} — {realtimePrice.rangeMaxUsd.toLocaleString("es-CO")}
            </p>
          </div>
        </div>
        <p className="col-span-2 font-mono text-[10px] leading-relaxed text-fg-muted">
          Estimado preliminar, no es cotización final. Un ingeniero de nuestro equipo valida el presupuesto y el diagnóstico definitivo.
        </p>
      </div>

      {/* === Dimensiones con padding generoso === */}
      <div>
        <p className="editorial-mono text-fg-muted mb-8">Dimensiones físicas</p>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { key: "length", label: "Largo", min: 5, max: 200 },
            { key: "width", label: "Ancho", min: 5, max: 100 },
            { key: "height", label: "Alto", min: 3, max: 30 },
          ].map((dim) => (
            <div key={dim.key}>
              <div className="flex justify-between mb-4">
                <label className="editorial-mono text-fg-muted">{dim.label}</label>
                <span className="font-mono text-[9px] text-fg-muted tracking-wider">
                  {dim.min}—{dim.max}m
                </span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={dim.min}
                  max={dim.max}
                  value={form[dim.key]}
                  onChange={(e) =>
                    handleChange(dim.key, Number(e.target.value))
                  }
                  className="w-full h-14 pl-5 pr-14 bg-paper-warm border-0 text-ink font-mono text-base tabular-nums focus:bg-paper focus:ring-1 focus:ring-ink focus:outline-none transition-colors"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-mono text-[10px] tracking-widest text-fg-muted uppercase">
                  m
                </span>
              </div>
              {errors[dim.key] && (
                <p className="mt-3 font-mono text-[10px] text-[#DC2626] tracking-wide">
                  {errors[dim.key]}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* === Entorno + Altitud + Ciudad con padding === */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <label className="editorial-mono text-fg-muted mb-4 block">
            Entorno de trabajo
          </label>
          <select
            value={form.environment}
            onChange={(e) => handleChange("environment", e.target.value)}
            className="w-full h-14 px-5 bg-paper-warm border-0 text-ink text-base font-sans focus:bg-paper focus:ring-1 focus:ring-ink focus:outline-none transition-colors appearance-none cursor-pointer"
          >
            {ENVIRONMENT_OPTIONS.map((env) => (
              <option key={env.value} value={env.value} className="bg-paper">
                {env.label} · {env.ach} ACH
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex justify-between mb-4">
            <label className="editorial-mono text-fg-muted">Altitud</label>
            <span className="font-mono text-[9px] text-fg-muted tracking-wider">0—3500m</span>
          </div>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={3500}
              step={1}
              value={form.altitude}
              onChange={(e) => handleChange("altitude", Number(e.target.value))}
              className="w-full h-14 pl-5 pr-16 bg-paper-warm border-0 text-ink font-mono text-base tabular-nums focus:bg-paper focus:ring-1 focus:ring-ink focus:outline-none transition-colors"
            />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 font-mono text-[10px] tracking-widest text-fg-muted uppercase">
              msnm
            </span>
          </div>
        </div>

        <div className="relative">
          <label className="editorial-mono text-fg-muted mb-4 block">
            Ciudad del proyecto
          </label>
          <input
            type="text"
            placeholder="Escriba para buscar..."
            value={form.ciudad}
            onChange={(e) => handleChange("ciudad", e.target.value)}
            onFocus={() => setCityInputFocus(true)}
            onBlur={() => setTimeout(() => setCityInputFocus(false), 200)}
            className="w-full h-14 px-5 bg-paper-warm border-0 text-ink text-base placeholder:text-fg-muted focus:bg-paper focus:ring-1 focus:ring-ink focus:outline-none transition-colors font-sans"
          />
          {errors.ciudad && (
            <p className="mt-3 font-mono text-[10px] text-[#DC2626] tracking-wide">
              {errors.ciudad}
            </p>
          )}

          {cityInputFocus && filteredCities.length > 0 && (
            <div className="absolute z-20 top-full left-0 right-0 mt-2 max-h-48 overflow-y-auto bg-paper-warm shadow-2xl">
              {filteredCities.map((city, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={() => handleChange("ciudad", city.name)}
                  className="w-full text-left px-5 py-3 text-sm text-ink-soft hover:text-ink hover:bg-paper transition-colors font-sans"
                >
                  {city.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* === Síntomas con gap amplio === */}
      <div>
        <p className="editorial-mono text-fg-muted mb-3">Diagnóstico de síntomas</p>
        <p className="text-base text-ink-soft font-sans mb-8 max-w-3xl">
          Marque los síntomas observados en planta. Esto ajusta el factor
          de severidad del cálculo y la recomendación de equipos.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {SYMPTOMS.map((sym) => {
            const isChecked = symptoms[sym.key];
            return (
              <button
                key={sym.key}
                type="button"
                onClick={() => handleSymptomToggle(sym.key as any)}
                className={`
                  flex items-start gap-5 p-6 text-left transition-colors
                  ${isChecked ? "bg-ink text-paper" : "bg-paper-warm hover:bg-paper"}
                `}
              >
                <div
                  className={`
                    shrink-0 mt-0.5 w-5 h-5 rounded-sm border-2 flex items-center justify-center transition-colors
                    ${isChecked ? "bg-paper border-paper" : "border-line-strong"}
                  `}
                >
                  {isChecked && (
                    <Check
                      className="w-3 h-3 text-ink"
                      strokeWidth={3}
                    />
                  )}
                </div>
                <div>
                  <p
                    className={`text-base font-medium tracking-tight mb-1.5 ${
                      isChecked ? "text-paper" : "text-ink"
                    }`}
                  >
                    {sym.label}
                  </p>
                  <p
                    className={`text-sm leading-[1.6] ${
                      isChecked ? "text-white/70" : "text-ink-soft"
                    }`}
                  >
                    {sym.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
