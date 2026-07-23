/* eslint-disable react/jsx-no-comment-textnodes */
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Mountain, Server, Factory, Beaker, type LucideIcon } from "lucide-react";

interface Sector {
  name: string;
  shortDescription: string;
  image: string;
  projects: number;
  cfmAvg: number;
  // Identidad visual distinta por sector
  accent: string;          // color principal
  accentSoft: string;      // color del fondo gradient
  Icon: LucideIcon;
  pattern: "mountain" | "grid" | "waves" | "dots"; // patrón gráfico único
  dataPoint: { label: string; value: string };     // dato técnico hard
}

const SECTORS: Sector[] = [
  {
    name: "Minería y siderurgia",
    shortDescription:
      "Extracción de polvos metálicos, humos de arco eléctrico y gases de procesos térmicos en condiciones severas. Tolerancia a partículas abrasivas y temperaturas > 200°C.",
    image: "/industrial_centrifugal_fan.webp",
    projects: 84,
    cfmAvg: 120000,
    accent: "var(--ds-c-marketing-sector-color-1)",
    accentSoft: "color-mix(in srgb, var(--ds-c-marketing-sector-color-1) 8%, transparent)",
    Icon: Mountain,
    pattern: "mountain",
    dataPoint: { label: "Temp. operación", value: "200°C" },
  },
  {
    name: "Data centers",
    shortDescription:
      "Climatización de precisión con redundancia N+1. Filtración HEPA H13, variadores de frecuencia, monitoreo BMS. Cumplimiento ASHRAE 62.1 y TIA-942 Tier IV.",
    image: "/axial_duct_fan.webp",
    projects: 31,
    cfmAvg: 50000,
    accent: "var(--ds-c-marketing-sector-color-2)",
    accentSoft: "color-mix(in srgb, var(--ds-c-marketing-sector-color-2) 8%, transparent)",
    Icon: Server,
    pattern: "grid",
    dataPoint: { label: "Uptime SLA", value: "99.99%" },
  },
  {
    name: "Manufactura y alimentos",
    shortDescription:
      "Ventilación general, extracción localizada en soldadura, cabinas de pintura. Materiales sanitizables (acero galvanizado, inoxidable). Cumplimiento HACCP / INVIMA.",
    image: "/industrial_plant_ventilation.webp",
    projects: 132,
    cfmAvg: 35000,
    accent: "var(--ds-c-marketing-sector-color-3)",
    accentSoft: "color-mix(in srgb, var(--ds-c-marketing-sector-color-3) 8%, transparent)",
    Icon: Factory,
    pattern: "waves",
    dataPoint: { label: "Cumplimiento", value: "HACCP" },
  },
  {
    name: "Procesamiento químico",
    shortDescription:
      "Extracción de vapores en áreas clasificadas ATEX Zone 1. Materiales resistentes a ambientes agresivos (PVC, PP, FRP). Sistemas cerrados con monitoreo continuo.",
    image: "/extractor_hongo_inox.webp",
    projects: 28,
    cfmAvg: 60000,
    accent: "var(--ds-c-marketing-sector-color-4)",
    accentSoft: "color-mix(in srgb, var(--ds-c-marketing-sector-color-4) 8%, transparent)",
    Icon: Beaker,
    pattern: "dots",
    dataPoint: { label: "Clasificación", value: "ATEX Z1" },
  },
];

// Patrones SVG únicos por sector
function PatternBackground({ type, accent }: { type: Sector["pattern"]; accent: string }) {
  if (type === "mountain") {
    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-mtn-${accent}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0.15" />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 0 200 L 60 120 L 110 160 L 170 80 L 220 130 L 280 60 L 340 110 L 400 70 L 400 200 Z"
          fill={`url(#grad-mtn-${accent})`}
          stroke={accent}
          strokeOpacity="0.3"
          strokeWidth="1"
        />
        <path
          d="M 0 200 L 80 150 L 140 180 L 200 130 L 260 160 L 320 110 L 400 150 L 400 200 Z"
          fill="transparent"
          stroke={accent}
          strokeOpacity="0.15"
          strokeWidth="1"
        />
      </svg>
    );
  }
  if (type === "grid") {
    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
        <defs>
          <pattern id={`pat-grid-${accent}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={accent} strokeOpacity="0.2" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="400" height="200" fill={`url(#pat-grid-${accent})`} />
        <circle cx="200" cy="100" r="50" fill="none" stroke={accent} strokeOpacity="0.4" strokeWidth="1" />
        <circle cx="200" cy="100" r="80" fill="none" stroke={accent} strokeOpacity="0.25" strokeWidth="1" />
        <circle cx="200" cy="100" r="110" fill="none" stroke={accent} strokeOpacity="0.15" strokeWidth="1" />
      </svg>
    );
  }
  if (type === "waves") {
    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`grad-wave-${accent}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accent} stopOpacity="0" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.15" />
          </linearGradient>
        </defs>
        <path
          d="M 0 100 Q 50 80 100 100 T 200 100 T 300 100 T 400 100 L 400 200 L 0 200 Z"
          fill={`url(#grad-wave-${accent})`}
        />
        <path
          d="M 0 130 Q 50 110 100 130 T 200 130 T 300 130 T 400 130"
          fill="none"
          stroke={accent}
          strokeOpacity="0.3"
          strokeWidth="1"
        />
        <path
          d="M 0 160 Q 50 140 100 160 T 200 160 T 300 160 T 400 160"
          fill="none"
          stroke={accent}
          strokeOpacity="0.2"
          strokeWidth="1"
        />
        <path
          d="M 0 70 Q 50 50 100 70 T 200 70 T 300 70 T 400 70"
          fill="none"
          stroke={accent}
          strokeOpacity="0.15"
          strokeWidth="1"
        />
      </svg>
    );
  }
  // dots
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
      <defs>
        <pattern id={`pat-dots-${accent}`} width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="7" cy="7" r="1" fill={accent} fillOpacity="0.4" />
        </pattern>
      </defs>
      <rect width="400" height="200" fill={`url(#pat-dots-${accent})`} />
      {/* "beaker" / chemistry molecule style overlay */}
      <g stroke={accent} strokeOpacity="0.3" strokeWidth="1" fill="none">
        <circle cx="100" cy="100" r="20" />
        <circle cx="160" cy="60" r="12" />
        <circle cx="160" cy="140" r="12" />
        <circle cx="220" cy="100" r="20" />
        <circle cx="280" cy="60" r="12" />
        <circle cx="280" cy="140" r="12" />
        <line x1="100" y1="100" x2="160" y2="60" />
        <line x1="100" y1="100" x2="160" y2="140" />
        <line x1="220" y1="100" x2="160" y2="60" />
        <line x1="220" y1="100" x2="160" y2="140" />
        <line x1="220" y1="100" x2="280" y2="60" />
        <line x1="220" y1="100" x2="280" y2="140" />
      </g>
    </svg>
  );
}

interface SectorsProps {
  content?: { name: string; shortDescription: string }[];
}

export function Sectors({ content }: SectorsProps = {}) {
  const items = SECTORS.map((s, i) => ({
    ...s,
    name: content?.[i]?.name || s.name,
    shortDescription: content?.[i]?.shortDescription || s.shortDescription,
  }));

  return (
    <section
      id="sectores"
      className="relative w-full bg-paper-warm section-py"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 section-header-normal">
          <div className="lg:col-span-2">
            <p className="editorial-eyebrow">— Sectores</p>
          </div>
          <div className="lg:col-span-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="editorial-h2 text-[clamp(40px,5.5vw,80px)] max-w-4xl"
            >
              Donde la ingeniería
              <br />
              <span className="italic text-ink-soft">es operación crítica.</span>
            </motion.h2>
            <p className="mt-10 text-lg sm:text-xl leading-[1.6] text-ink-soft max-w-2xl font-sans">
              Cada sector tiene su propio lenguaje técnico. Cada
              disciplina operativa con su instrumentación, normas y
              certificaciones específicas.
            </p>
          </div>
        </div>

        {/* === GRID 2×2 con identidad distinta por sector === */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line border border-line reveal-stagger">
          {items.map((s, idx) => {
            const Icon = s.Icon;
            return (
              <motion.article
                key={s.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.7,
                  delay: idx * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="group relative bg-paper overflow-hidden hover-lift"
              >
                {/* === HEADER con accent y pattern === */}
                <div
                  className="relative h-44 overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${s.accentSoft} 0%, transparent 100%)` }}
                >
                  {/* Pattern único por sector */}
                  <PatternBackground type={s.pattern} accent={s.accent} />

                  {/* Top accent bar */}
                  <div
                    className="absolute top-0 left-0 right-0 h-px"
                    style={{ backgroundColor: s.accent }}
                  />

                  {/* Icon grande */}
                  <div className="absolute top-6 right-6">
                    <div
                      className="w-14 h-14 rounded-sm flex items-center justify-center"
                      style={{
                        backgroundColor: `${s.accent}15`,
                        border: `1px solid ${s.accent}40`,
                      }}
                    >
                      <Icon
                        className="w-7 h-7"
                        strokeWidth={1.25}
                        style={{ color: s.accent }}
                      />
                    </div>
                  </div>

                  {/* Code tag abajo-izquierda */}
                  <div className="absolute bottom-5 left-6">
                    <p
                      className="font-mono text-[10px] tracking-widest uppercase font-medium"
                      style={{ color: s.accent }}
                    >
                      // Sector {String(idx + 1).padStart(2, "0")}
                    </p>
                  </div>
                </div>

                {/* === CONTENT === */}
                <div className="p-8 lg:p-10">
                  {/* Data point (dato técnico duro) */}
                  <div className="flex items-baseline gap-3 mb-5">
                    <p
                      className="font-display text-3xl lg:text-4xl font-light tracking-[-0.02em] tabular-nums leading-none"
                      style={{ color: s.accent }}
                    >
                      {s.dataPoint.value}
                    </p>
                    <p className="editorial-mono">{s.dataPoint.label}</p>
                  </div>

                  <h3 className="font-display text-2xl lg:text-3xl font-light text-ink tracking-[-0.02em] leading-[1.1] mb-4">
                    {s.name}
                  </h3>

                  <p className="text-base leading-[1.6] text-ink-soft font-sans mb-8">
                    {s.shortDescription}
                  </p>

                  {/* Stats con hairline */}
                  <div
                    className="pt-6 border-t flex items-center justify-between"
                    style={{ borderColor: `${s.accent}30` }}
                  >
                    <div>
                      <p className="editorial-mono mb-1">Proyectos</p>
                      <p className="font-display text-2xl font-light text-ink tracking-[-0.02em] tabular-nums">
                        {s.projects}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="editorial-mono mb-1">CFM promedio</p>
                      <p className="font-mono text-sm font-medium text-ink tabular-nums">
                        {(s.cfmAvg / 1000).toFixed(0)}K
                      </p>
                    </div>
                    <button
                      type="button"
                      className="font-mono text-[10px] tracking-widest uppercase font-medium self-end transition-transform group-hover:translate-x-1"
                      style={{ color: s.accent }}
                    >
                      Cotizar →
                    </button>
                  </div>
                </div>

                {/* Accent left bar on hover */}
                <div
                  className="absolute top-0 left-0 w-px h-full transition-all duration-700"
                  style={{
                    backgroundColor: s.accent,
                    opacity: 0,
                  }}
                />
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

