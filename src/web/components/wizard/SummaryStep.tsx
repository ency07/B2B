/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-no-comment-textnodes */
"use client";

import React from "react";
import { Wind, Cpu, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface SummaryStepProps {
  form: any;
  realtimeCfm: {
    cubicMeters: number;
    cfm: number;
  };
  severityScore: number;
  siteName: string;
}

export function SummaryStep({
  form,
  realtimeCfm,
  severityScore,
  siteName,
}: SummaryStepProps) {
  const achValue =
    form.environment === "heavy_plant"
      ? 35
      : form.environment === "data_center"
        ? 25
        : form.environment === "mining"
          ? 55
          : form.environment === "warehouse"
            ? 12
            : 10;

  const recommendation =
    form.environment === "heavy_plant" || form.environment === "mining"
      ? `Extractor industrial tipo Blower con acople directo, turbina soldada de álabes atrasados de aluminio extruido y pintura epóxica antiácida para soportar el índice del ${severityScore}% de severidad.`
      : form.environment === "data_center"
        ? "Sistema inyector silencioso de velocidad variable, filtros mecánicos plisados MERV 13 o HEPA, balanceado micrométrico láser y amortiguadores de vibración de resorte."
        : "Extractor axial de transmisión por poleas y correas, álabes regulables de aluminio y persiana de gravedad de apertura automática.";

  return (
    <motion.div
      key="step4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-16"
    >
      {/* === HEADER === */}
      <div>
        <p className="editorial-eyebrow mb-6">// 04 — Resumen de preingeniería</p>
        <h2 className="font-display text-4xl lg:text-5xl font-light text-ink tracking-[-0.03em] leading-[1.05] mb-6">
          Verifique el cálculo
          <br />
          <span className="italic text-ink-soft">antes de confirmar.</span>
        </h2>
        <p className="text-lg leading-[1.6] text-ink-soft font-sans max-w-3xl">
          Revisión final de los parámetros volumétricos, severidad
          ambiental y recomendación técnica del sistema.
        </p>
      </div>

      {/* === Métricas con gap generoso === */}
      <div>
        <p className="editorial-mono text-fg-muted mb-8">Resultado del cálculo</p>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="bg-paper-warm p-8">
            <p className="editorial-mono text-fg-muted mb-3">Volumen planta</p>
            <p className="font-display text-4xl font-light text-ink tracking-[-0.02em] tabular-nums">
              {Math.round(realtimeCfm.cubicMeters)}{" "}
              <span className="text-base text-fg-muted">m³</span>
            </p>
            <p className="mt-2 font-mono text-[10px] tracking-wide text-fg-muted">
              {Math.round(realtimeCfm.cubicMeters * 35.3147).toLocaleString()} ft³
            </p>
          </div>

          <div className="bg-paper-warm p-8">
            <p className="editorial-mono text-fg-muted mb-3">Renovación</p>
            <p className="font-display text-4xl font-light text-ink tracking-[-0.02em] tabular-nums">
              {achValue}{" "}
              <span className="text-base text-fg-muted">ACH</span>
            </p>
            <p className="mt-2 font-mono text-[10px] tracking-wide text-fg-muted">
              Cambios de aire/hora
            </p>
          </div>

          <div className="bg-paper-warm p-8">
            <p className="editorial-mono text-fg-muted mb-3">Caudal requerido</p>
            <p className="font-display text-4xl font-light tabular-nums" style={{ color: "#3F8F5F" }}>
              {realtimeCfm.cfm.toLocaleString()}{" "}
              <span className="text-base text-fg-muted">CFM</span>
            </p>
            <p className="mt-2 font-mono text-[10px] tracking-wide text-fg-muted">
              ft³ / min
            </p>
          </div>
        </div>
      </div>

      {/* === Recomendación técnica con padding generoso === */}
      <div className="border-l-2 border-ink bg-paper-warm p-8">
        <div className="flex items-center gap-3 mb-4">
          <Cpu className="w-4 h-4 text-ink" strokeWidth={1.5} />
          <p className="editorial-mono text-ink">// Recomendación técnica</p>
        </div>
        <p className="text-lg leading-[1.6] text-ink font-sans max-w-3xl">
          {recommendation}
        </p>
      </div>

      {/* === Aviso preingeniería === */}
      <div className="bg-paper-warm p-8 flex items-start gap-5">
        <AlertCircle
          className="w-4 h-4 text-ink-soft mt-0.5 shrink-0"
          strokeWidth={1.5}
        />
        <div className="max-w-3xl">
          <p className="font-mono text-[10px] tracking-widest text-fg-muted uppercase mb-3">
            Estudio de inversión y factibilidad
          </p>
          <p className="text-base text-ink leading-[1.6] font-sans">
            <strong className="font-medium">Importante:</strong> {siteName}{" "}
            prioriza el dimensionamiento correcto de la solución sobre
            cualquier propuesta económica. La cotización formal será
            emitida posterior a la validación física en planta por parte de
            nuestro equipo de ingeniería.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
