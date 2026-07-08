"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTenantConfig } from "@/platform/tenant/tenant";
import { CertBadgeRow } from "./primitives/CertBadge";
import type { HeroSlideContent } from "@/platform/branding/branding-defaults";

interface HeroProps {
  siteName: string;
  tenantCode: string;
  branding?: any;
}

const SLIDE_STYLE = [
  { accent: "#9FD9B4", imgBg: "radial-gradient(circle at 25% 15%, rgba(159,217,180,0.16), transparent 60%), #0F2A30" },
  { accent: "#6699FF", imgBg: "radial-gradient(circle at 25% 15%, rgba(102,153,255,0.18), transparent 60%), #101D2E" },
  { accent: "#E8896B", imgBg: "radial-gradient(circle at 25% 15%, rgba(232,137,107,0.18), transparent 60%), #2E1D16" },
  { accent: "#8B7FD1", imgBg: "radial-gradient(circle at 25% 15%, rgba(139,127,209,0.18), transparent 60%), #211A2E" },
];

const DEFAULT_SLIDES: HeroSlideContent[] = [
  { eyebrow: "DIAGNÓSTICO TÉCNICO", titleMain: "El control del aire", titleItalic: "empieza por medirlo.", desc: "Visita en planta con instrumentación calibrada. Mapeo de caudales, presión y temperatura antes de proponer una sola pieza de equipo.", tag: "INSTRUMENTACIÓN CALIBRADA", duration: "5–8 días de diagnóstico", mediaLabel: "video: medición en planta" },
  { eyebrow: "SIMULACIÓN Y DISEÑO", titleMain: "El aire se diseña", titleItalic: "antes de fabricarse.", desc: "Modelado CFD 3D del comportamiento del aire. Selección de equipos y memoria de cálculo firmada por ingeniero responsable.", tag: "SIMULACIÓN CFD 3D", duration: "10–14 días de diseño", mediaLabel: "video: simulación CFD del flujo de aire" },
  { eyebrow: "EJECUCIÓN DE INGENIERÍA", titleMain: "El control del aire", titleItalic: "que sostiene su planta.", desc: "Fabricación en planta propia con acero certificado. Balanceo ISO 1940 G2.5 e instalación con cero paradas no planificadas.", tag: "ZONA DE COLADA · +45°C", duration: "20–35 días de ejecución", mediaLabel: "foto: fabricación y montaje certificado" },
  { eyebrow: "RESULTADOS GARANTIZADOS", titleMain: "El aire, verificado.", titleItalic: "no prometido.", desc: "Medición post-instalación y reporte de cumplimiento frente al diseño. Línea directa con ingeniería, sin intermediarios.", tag: "RESULTADOS AUDITADOS", duration: "Continuo · mantenimiento programado", mediaLabel: "foto: medición y certificación post-instalación" },
];

export function Hero({ tenantCode, branding = {} }: HeroProps) {
  const slides: HeroSlideContent[] = branding.hero_slides?.length ? branding.hero_slides : DEFAULT_SLIDES;
  const heroEyebrow = (branding.hero_eyebrow as string) || "Ingeniería de ventilación industrial";
  const ctaPrimarioLabel = (branding.hero_cta_primario_label as string) || "Iniciar Cotización Industrial";
  const ctaSecundarioLabel = (branding.hero_cta_secundario_label as string) || "Conocer el proceso";
  const certificaciones: string[] = (branding.certificaciones as string[]) || ["AMCA", "ISO 1940 G2.5", "ASHRAE 62.1"];

  const [idx, setIdx] = React.useState(0);
  const count = slides.length;
  const goPrev = () => setIdx((i) => (i + count - 1) % count);
  const goNext = () => setIdx((i) => (i + 1) % count);
  const slide = slides[idx];
  const style = SLIDE_STYLE[idx % SLIDE_STYLE.length];

  const config = getTenantConfig(tenantCode);
  const heroMetrics = config.heroMetrics || {};

  // Contadores animados
  const [displayCfm, setDisplayCfm] = React.useState<number | null>(null);
  const [displayPower, setDisplayPower] = React.useState<number | null>(null);
  const [displayTemp, setDisplayTemp] = React.useState<number | null>(null);

  const targetCfm = heroMetrics.flowRate ?? 8000;
  const targetPower = heroMetrics.power ?? 20;
  const targetTemp = heroMetrics.temperature ?? 40;
  const targetEqCount = heroMetrics.suggestedEquipment ?? 4;

  React.useEffect(() => {
    const start = performance.now();
    const duration = 2000;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayCfm(Math.round(targetCfm * eased));
      setDisplayPower(+(targetPower * eased).toFixed(1));
      setDisplayTemp(+(targetTemp * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [targetCfm, targetPower, targetTemp]);

  return (
    <section id="inicio" className="relative w-full flex flex-col" style={{ background: "#0A181D" }}>
      {/* Textura diagonal de fondo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 26px)",
        }}
      />

      {/* Franja meta superior */}
      <div className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-14 py-2.5 border-b border-white/10 font-mono text-[11px] tracking-[0.06em] text-white/55">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "#5FBE84" }} />
          <span>OPERATIVO · 22 AÑOS · 312 PLANTAS</span>
        </div>
        <div className="hidden md:block">
          <CertBadgeRow labels={certificaciones} />
        </div>
      </div>

      {/* Carrusel de etapas */}
      <div className="relative z-10 px-6 sm:px-10 lg:px-14 pt-12 max-w-[1280px] mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-center"
          >
            <div>
              <div className="flex items-center gap-2.5 font-mono text-xs tracking-[0.1em] mb-5" style={{ color: style.accent }}>
                <span className="w-6 h-px inline-block" style={{ backgroundColor: style.accent }} />
                ETAPA {String(idx + 1).padStart(2, "0")}/{String(count).padStart(2, "0")} · {slide.eyebrow}
              </div>
              <h1 className="font-display font-light tracking-[-0.03em] leading-[1.05] text-[clamp(36px,4.6vw,60px)] text-white mb-1.5">
                {slide.titleMain}
              </h1>
              <h1 className="font-display italic font-light tracking-[-0.03em] leading-[1.05] text-[clamp(36px,4.6vw,60px)] mb-6" style={{ color: "#9BB0B6" }}>
                {slide.titleItalic}
              </h1>
              <p className="text-[17px] leading-[1.6] text-white/75 max-w-md mb-9">{slide.desc}</p>

              <div className="flex items-center gap-4 flex-wrap">
                <a
                  href={`/wizard?tenant=${tenantCode}`}
                  className="group inline-flex items-center gap-2.5 h-14 px-7 bg-white text-ink text-sm font-medium tracking-tight hover:bg-white/90 transition-colors"
                >
                  <span>{ctaPrimarioLabel}</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </a>
                <div className="border border-white/25 px-5 py-3.5 text-white">
                  <div className="flex items-center gap-1.5 font-mono text-[10px] mb-1" style={{ color: style.accent }}>
                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: style.accent }} />
                    {slide.tag}
                  </div>
                  <div className="font-semibold text-sm">{slide.duration}</div>
                </div>
              </div>

              <button
                onClick={() => document.getElementById("proceso")?.scrollIntoView({ behavior: "smooth" })}
                className="mt-5 text-sm text-white/60 hover:text-white transition-colors underline underline-offset-4"
              >
                {ctaSecundarioLabel}
              </button>
            </div>

            <div
              className="relative aspect-[4/3] border border-white/12 flex items-center justify-center overflow-hidden"
              style={{ background: style.imgBg }}
            >
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(115deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 26px)",
                }}
              />
              <span className="relative font-mono text-[11px] tracking-[0.06em] text-white/70 bg-black/40 px-3.5 py-1.5">
                {slide.mediaLabel}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots + prev/next */}
        <div className="flex items-center justify-between mt-11 pb-10 flex-wrap gap-4">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Ir a la etapa ${i + 1}`}
                className="h-1 transition-all duration-300"
                style={{ width: i === idx ? 28 : 8, backgroundColor: i === idx ? "#fff" : "rgba(255,255,255,0.25)" }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3.5">
            <span className="font-mono text-[11px] text-white/45">
              {String(idx + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
            <div className="flex gap-2">
              <button onClick={goPrev} aria-label="Etapa anterior" className="w-[34px] h-[34px] border border-white/20 text-white hover:bg-white/10 transition-colors">←</button>
              <button onClick={goNext} aria-label="Etapa siguiente" className="w-[34px] h-[34px] border border-white/20 text-white hover:bg-white/10 transition-colors">→</button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de telemetría */}
      <div className="relative z-10 border-t border-white/12" style={{ backgroundColor: "rgba(5,12,15,0.55)" }}>
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
          <TelemetryStat label="Caudal" value={displayCfm?.toLocaleString("es-CO") || "0"} unit="CFM" isLoading={displayCfm === null} />
          <TelemetryStat label="Potencia" value={displayPower?.toFixed(1) || "0"} unit="HP" isLoading={displayPower === null} />
          <TelemetryStat label="Equipos" value={targetEqCount.toString()} unit="sugeridos" />
          <TelemetryStat label="Temp. zona colada" value={displayTemp?.toFixed(0) || "0"} unit="°C máx." isLoading={displayTemp === null} />
        </div>
      </div>
    </section>
  );
}

/* === TELEMETRY STAT === */
function TelemetryStat({
  label,
  value,
  unit,
  isLoading,
}: {
  label: string;
  value: string;
  unit: string;
  isLoading?: boolean;
}) {
  return (
    <div className="px-6 sm:px-10 lg:px-14 py-6">
      <p className="font-mono text-[10px] tracking-widest text-white/45 uppercase mb-2">{label}</p>
      <div className="flex items-baseline gap-1.5 h-8 sm:h-10">
        {isLoading ? (
          <div className="h-full w-20 sm:w-24 bg-white/10 animate-pulse rounded-md" />
        ) : (
          <>
            <span className="font-display text-white font-light tracking-[-0.03em] leading-none text-2xl sm:text-3xl tabular-nums">
              {value}
            </span>
            <span className="font-mono text-[11px] text-white/50 uppercase">{unit}</span>
          </>
        )}
      </div>
    </div>
  );
}
