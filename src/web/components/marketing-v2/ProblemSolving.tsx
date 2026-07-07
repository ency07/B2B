"use client";

import * as React from "react";
import { motion } from "framer-motion";

/* === Cada card cuenta una micro-historia con su propia visual === */

function ThermalChart() {
  // Mini chart: línea de temperatura ambiente vs zona de colada, con zona crítica sombreada
  const W = 280;
  const H = 100;
  // Dos líneas: ambiente (azul) y colada (roja con zona crítica >45°C)
  const ambientY = H - 30;
  const coladaPoints = Array.from({ length: 12 }, (_, i) => {
    const x = (i / 11) * W;
    // Sube de 28°C (ambiente) a 47°C (colada) en el día, baja en la noche
    const hour = i * 2; // 0 a 22h
    const temp = 28 + Math.sin((hour - 6) * (Math.PI / 18)) * 22;
    const y = H - 15 - ((temp - 20) / 30) * (H - 30);
    return [x, y, temp] as const;
  });
  const coladaPath = coladaPoints
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const ambientPath = `M 0 ${ambientY} L ${W} ${ambientY}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-24"
      preserveAspectRatio="none"
    >
      {/* Zona crítica (>45°C) */}
      <rect
        x="0"
        y={H - 15 - ((47 - 20) / 30) * (H - 30)}
        width={W}
        height={H}
        fill="rgba(255,123,114,0.08)"
      />
      <line
        x1="0"
        x2={W}
        y1={H - 15 - ((45 - 20) / 30) * (H - 30)}
        y2={H - 15 - ((45 - 20) / 30) * (H - 30)}
        stroke="rgba(255,123,114,0.4)"
        strokeWidth="0.5"
        strokeDasharray="3 3"
      />
      <text
        x={W - 4}
        y={H - 15 - ((45 - 20) / 30) * (H - 30) - 4}
        textAnchor="end"
        fontFamily="monospace"
        fontSize="7"
        fill="rgba(255,123,114,0.8)"
      >
        45°C LÍMITE
      </text>
      {/* Línea ambiente */}
      <path
        d={ambientPath}
        stroke="rgba(76,141,255,0.5)"
        strokeWidth="0.8"
        strokeDasharray="2 3"
      />
      {/* Línea colada */}
      <motion.path
        d={coladaPath}
        fill="none"
        stroke="rgba(255,123,114,0.9)"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, delay: 0.2, ease: "easeInOut" }}
      />
      {/* Punto más alto */}
      <circle
        cx={W}
        cy={H - 15 - ((47 - 20) / 30) * (H - 30)}
        r="2.5"
        fill="rgba(255,123,114,1)"
      />
      <text
        x="4"
        y={H - 5}
        fontFamily="monospace"
        fontSize="7"
        fill="rgba(255,255,255,0.5)"
      >
        00:00
      </text>
      <text
        x={W - 4}
        y={H - 5}
        textAnchor="end"
        fontFamily="monospace"
        fontSize="7"
        fill="rgba(255,255,255,0.5)"
      >
        22:00
      </text>
    </svg>
  );
}

function ComplianceBars() {
  // Mini chart de barras: hallazgos de auditoría antes/después
  const W = 280;
  const H = 100;
  // 12 meses, cada uno tiene 2 barras: antes (rojo) y después (verde)
  const months = 12;
  const barW = 8;
  const gap = (W - months * (barW * 2 + 2)) / (months - 1);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-24"
      preserveAspectRatio="none"
    >
      {[...Array(months)].map((_, i) => {
        const before = 0.6 + Math.random() * 0.3;
        const after = 0.05 + Math.random() * 0.1;
        const x = i * (barW * 2 + 2 + gap);
        return (
          <g key={i}>
            <motion.rect
              x={x}
              y={H - 8}
              width={barW}
              height={0}
              fill="rgba(255,123,114,0.8)"
              initial={{ y: H - 8, height: 0 }}
              whileInView={{ y: H - 8 - before * (H - 20), height: before * (H - 20) }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.04 }}
            />
            <motion.rect
              x={x + barW + 2}
              y={H - 8}
              width={barW}
              height={0}
              fill="rgba(63,185,80,0.9)"
              initial={{ y: H - 8, height: 0 }}
              whileInView={{ y: H - 8 - after * (H - 20), height: after * (H - 20) }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.04 }}
            />
          </g>
        );
      })}
      <text x="4" y="10" fontFamily="monospace" fontSize="7" fill="rgba(255,255,255,0.6)">
        ANTES
      </text>
      <rect x="32" y="5" width="6" height="6" fill="rgba(255,123,114,0.8)" />
      <text x="44" y="10" fontFamily="monospace" fontSize="7" fill="rgba(255,255,255,0.6)">
        DESPUÉS
      </text>
      <rect x="84" y="5" width="6" height="6" fill="rgba(63,185,80,0.9)" />
    </svg>
  );
}

function EnergyCurve() {
  // Mini chart: curva de consumo eléctrico, con área sombreada
  const W = 280;
  const H = 100;
  const points = Array.from({ length: 16 }, (_, i) => {
    const x = (i / 15) * W;
    const y = H - 20 - Math.abs(Math.sin(i * 0.7)) * 50;
    return [x, y] as const;
  });
  const path = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const area = `${path} L ${W} ${H} L 0 ${H} Z`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-24"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="energy-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(76,141,255,0.4)" />
          <stop offset="100%" stopColor="rgba(76,141,255,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#energy-grad)" />
      <motion.path
        d={path}
        fill="none"
        stroke="rgba(76,141,255,0.9)"
        strokeWidth="1.5"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, delay: 0.2, ease: "easeInOut" }}
      />
      {/* Línea de meta */}
      <line
        x1="0"
        x2={W}
        y1={H - 50}
        y2={H - 50}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="0.5"
        strokeDasharray="3 3"
      />
      <text x={W - 4} y={H - 53} textAnchor="end" fontFamily="monospace" fontSize="7" fill="rgba(255,255,255,0.5)">
        META −32%
      </text>
    </svg>
  );
}

const CHALLENGES = [
  {
    index: "01",
    title: "Cumplimiento normativo",
    hook: "Una auditoría no se gana con equipos nuevos.",
    story:
      "RETIE, RAS, OSHA, AMCA — los marcos regulatorios cambian cada año. El riesgo no es técnico, es de negocio. Una no conformidad cuesta USD 80K en promedio y detiene operaciones.",
    stat: { before: "62%", after: "100%", label: "Cumplimiento RETIE verificado" },
    visual: <ComplianceBars />,
    accent: "green" as const,
  },
  {
    index: "02",
    title: "Eficiencia energética",
    hook: "El 47% de la factura eléctrica se va en aire.",
    story:
      "Los sistemas heredados operan fuera de su curva de diseño. Sobredimensionados, desbalanceados, sin control. Cada kilovatio desperdiciado es margen operativo perdido.",
    stat: { before: "100%", after: "68%", label: "Consumo eléctrico basal" },
    visual: <EnergyCurve />,
    accent: "blue" as const,
  },
  {
    index: "03",
    title: "Calidad térmica del aire",
    hook: "A las 14:00 la planta deja de operar.",
    story:
      "En zonas de colada o soldadura, la temperatura ambiente cruza los 45°C durante 6 horas al día. La productividad cae 30%. El riesgo operativo se vuelve estructural.",
    stat: { before: "47°C", after: "25°C", label: "Pico zona de colada" },
    visual: <ThermalChart />,
    accent: "warm" as const,
  },
];

const accentColor = {
  green: "#3FB950",
  blue: "#4C8DFF",
  warm: "#FF7B72",
} as const;

interface ProblemSolvingProps {
  content?: { hook: string; story: string; statBefore: string; statAfter: string; statLabel: string }[];
}

export function ProblemSolving({ content }: ProblemSolvingProps = {}) {
  const items = CHALLENGES.map((c, i) => {
    const o = content?.[i];
    return {
      ...c,
      hook: o?.hook || c.hook,
      story: o?.story || c.story,
      stat: {
        ...c.stat,
        before: o?.statBefore || c.stat.before,
        after: o?.statAfter || c.stat.after,
        label: o?.statLabel || c.stat.label,
      },
    };
  });

  return (
    <section
      id="desafios"
      className="relative w-full bg-paper section-py"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 section-header-normal">
          <div className="lg:col-span-2">
            <p className="editorial-eyebrow">— Desafíos críticos</p>
          </div>
          <div className="lg:col-span-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="editorial-h2 text-[clamp(40px,5.5vw,80px)] max-w-4xl"
            >
              Las plantas modernas no
              <br />
              <span className="italic text-ink-soft">respiran solas.</span>
            </motion.h2>
            <p className="mt-10 text-lg sm:text-xl leading-[1.6] text-ink-soft max-w-2xl font-sans">
              Trabajamos con la premisa de que cada planta es un sistema
              único. Antes de proponer equipos, entendemos el problema. La
              ingeniería empieza por la medición.
            </p>
          </div>
        </div>

        {/* === CARDS CON HISTORIA === */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-line">
          {items.map((c, idx) => (
            <motion.article
              key={c.index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.7,
                delay: idx * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative bg-ink text-paper p-8 lg:p-10 group overflow-hidden"
            >
              {/* Dot indicator en el accent color */}
              <div className="flex items-center justify-between mb-10">
                <span className="font-mono text-[10px] sm:text-[10px] tracking-widest text-white/45 uppercase">
                  {c.index} / 03
                </span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: accentColor[c.accent] }}
                />
              </div>

              {/* Hook — frase provocadora */}
              <p className="font-display text-xl lg:text-2xl italic font-light text-white leading-snug tracking-[-0.01em] mb-6">
                "{c.hook}"
              </p>

              {/* Story */}
              <p className="text-sm lg:text-base leading-[1.6] text-white/65 font-sans mb-8">
                {c.story}
              </p>

              {/* Visual: mini chart contextual */}
              <div className="bg-black/30 border border-white/10 rounded-sm p-4 mb-8">
                {c.visual}
              </div>

              {/* Stat: antes → después */}
              <div className="pt-6 border-t border-white/10">
                <div className="flex items-baseline justify-between gap-3">
                  <span
                    className="font-mono text-sm line-through text-white/40 tabular-nums"
                  >
                    {c.stat.before}
                  </span>
                  <span className="text-white/30 font-mono text-xs">→</span>
                  <span
                    className="font-display text-2xl lg:text-3xl font-light tabular-nums"
                    style={{ color: accentColor[c.accent] }}
                  >
                    {c.stat.after}
                  </span>
                </div>
                <p className="font-mono text-[10px] sm:text-[10px] tracking-widest text-white/45 uppercase mt-3">
                  {c.stat.label}
                </p>
              </div>

              {/* Subtle gradient overlay on hover */}
              <div
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${accentColor[c.accent]}08 0%, transparent 60%)`,
                }}
              />
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
