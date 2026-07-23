"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTenantConfig } from "@/platform/tenant/tenant";
import { CertBadgeRow } from "./primitives/CertBadge";
import { CinematicPhoto } from "./primitives/CinematicPhoto";
import type { HeroSlideContent, BrandingConfig } from "@/platform/branding/branding-defaults";

interface HeroProps {
  siteName: string;
  tenantCode: string;
  branding: BrandingConfig;
}

const SLIDE_STYLE = [
  { accent: "var(--ds-c-marketing-hero-slide-accent-1)" },
  { accent: "var(--ds-c-marketing-hero-slide-accent-2)" },
  { accent: "var(--ds-c-marketing-hero-slide-accent-3)" },
  { accent: "var(--ds-c-marketing-hero-slide-accent-4)" },
];

const DEFAULT_SLIDES: HeroSlideContent[] = [
  { eyebrow: "DIAGNÓSTICO TÉCNICO", titleMain: "El control del aire", titleItalic: "empieza por medirlo.", desc: "Visita en planta con instrumentación calibrada. Mapeo de caudales, presión y temperatura antes de proponer una sola pieza de equipo.", tag: "INSTRUMENTACIÓN CALIBRADA", duration: "5–8 días de diagnóstico", mediaLabel: "video: medición en planta", photoUrl: "/industrial_plant_ventilation.webp", photoAlt: "Instrumentación calibrada midiendo caudal en planta" },
  { eyebrow: "SIMULACIÓN Y DISEÑO", titleMain: "El aire se diseña", titleItalic: "antes de fabricarse.", desc: "Modelado CFD 3D del comportamiento del aire. Selección de equipos y memoria de cálculo firmada por ingeniero responsable.", tag: "SIMULACIÓN CFD 3D", duration: "10–14 días de diseño", mediaLabel: "video: simulación CFD del flujo de aire", photoUrl: "/axial_duct_fan.webp", photoAlt: "Simulación y diseño de ductos de ventilación axial" },
  { eyebrow: "EJECUCIÓN DE INGENIERÍA", titleMain: "El control del aire", titleItalic: "que sostiene su planta.", desc: "Fabricación en planta propia con acero certificado. Balanceo ISO 1940 G2.5 e instalación con cero paradas no planificadas.", tag: "ZONA DE COLADA · +45°C", duration: "20–35 días de ejecución", mediaLabel: "foto: fabricación y montaje certificado", photoUrl: "/industrial_centrifugal_fan.webp", photoAlt: "Fabricación y montaje certificado de ventilador centrífugo" },
  { eyebrow: "RESULTADOS GARANTIZADOS", titleMain: "El aire, verificado.", titleItalic: "no prometido.", desc: "Medición post-instalación y reporte de cumplimiento frente al diseño. Línea directa con ingeniería, sin intermediarios.", tag: "RESULTADOS AUDITADOS", duration: "Continuo · mantenimiento programado", mediaLabel: "foto: medición y certificación post-instalación", photoUrl: "/rotor_dynamic_balancing.webp", photoAlt: "Medición y certificación de balanceo dinámico post-instalación" },
];

const AUTOPLAY_MS = 7000;

export function Hero({ tenantCode, branding }: HeroProps) {
  const slides: HeroSlideContent[] = branding.hero_slides?.length ? branding.hero_slides : DEFAULT_SLIDES;
  const ctaPrimarioLabel = branding.hero_cta_primario_label || "Iniciar Cotización Industrial";
  const ctaSecundarioLabel = branding.hero_cta_secundario_label || "Conocer el proceso";
  const certificaciones: string[] = branding.certificaciones || ["AMCA", "ISO 1940 G2.5", "ASHRAE 62.1"];

  const [idx, setIdx] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const count = slides.length;
  const goPrev = () => setIdx((i) => (i + count - 1) % count);
  const goNext = () => setIdx((i) => (i + 1) % count);
  const slide = slides[idx];
  const style = SLIDE_STYLE[idx % SLIDE_STYLE.length];

  // Auto-avance del carrusel — se pausa al pasar el mouse por encima.
  React.useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, paused, idx]);

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
    <section
      id="inicio"
      className="relative w-full min-h-[100svh] flex flex-col bg-ink overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* === FONDO: foto de cada slide a pantalla completa, con crossfade === */}
      <div className="absolute inset-0">
        <AnimatePresence mode="sync">
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            <CinematicPhoto
              src={slide.photoUrl}
              alt={slide.photoAlt}
              sizes="100vw"
              priority={idx === 0}
              className="!relative w-full h-full"
            />
          </motion.div>
        </AnimatePresence>

        {/* Gradiente editorial para legibilidad del texto */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,10,13,0.75) 0%, rgba(6,10,13,0.25) 30%, rgba(6,10,13,0.35) 60%, rgba(6,10,13,0.88) 100%)",
          }}
        />
        <div
          className="absolute inset-y-0 left-0 w-2/3"
          style={{
            background: "linear-gradient(90deg, rgba(6,10,13,0.6) 0%, rgba(6,10,13,0.15) 65%, transparent 100%)",
          }}
        />
        {/* Acento de color sutil por etapa, para que el carrusel se sienta cohesivo */}
        <motion.div
          key={`accent-${idx}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 mix-blend-screen pointer-events-none"
          style={{ background: `radial-gradient(circle at 15% 85%, ${style.accent}, transparent 55%)` }}
        />
        {/* Textura diagonal técnica */}
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 2px, transparent 2px, transparent 26px)",
          }}
        />
      </div>

      {/* Franja meta superior */}
      <div className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-14 py-2.5 border-b border-white/10 font-mono text-[11px] tracking-[0.06em] text-white/55">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: "var(--ds-c-marketing-hero-slide-accent-1)" }} />
          <span>OPERATIVO · 22 AÑOS · 312 PLANTAS</span>
        </div>
        <div className="hidden md:block">
          <CertBadgeRow labels={certificaciones} />
        </div>
      </div>

      {/* Spacer: empuja el contenido al tercio inferior, sobre la foto */}
      <div className="flex-1" />

      {/* Contenido de la etapa activa */}
      <div className="relative z-10 px-6 sm:px-10 lg:px-14 pb-10 max-w-[1440px] mx-auto w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="max-w-2xl"
          >
            <div className="flex items-center gap-2.5 font-mono text-xs tracking-[0.1em] mb-5" style={{ color: style.accent }}>
              <span className="w-6 h-px inline-block" style={{ backgroundColor: style.accent }} />
              ETAPA {String(idx + 1).padStart(2, "0")}/{String(count).padStart(2, "0")} · {slide.eyebrow}
            </div>
            <h1 className="font-display font-light tracking-[-0.03em] leading-[1.05] text-[clamp(40px,6vw,84px)] text-white">
              <span className="block mb-1.5">{slide.titleMain}</span>
              <span className="block italic mb-6" style={{ color: "var(--ds-c-marketing-hero-slide-accent-1)" }}>
                {slide.titleItalic}
              </span>
            </h1>
            <p className="text-[17px] leading-[1.6] text-white/80 max-w-md mb-9">{slide.desc}</p>

            <div className="flex items-center gap-4 flex-wrap">
              <a
                href={`/wizard?tenant=${tenantCode}`}
                className="group inline-flex items-center gap-2.5 h-14 px-7 bg-white text-ink text-sm font-medium tracking-tight hover:bg-white/90 transition-colors"
              >
                <span>{ctaPrimarioLabel}</span>
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </a>
              <div className="border border-white/25 px-5 py-3.5 text-white bg-black/20 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 font-mono text-[10px] mb-1" style={{ color: style.accent }}>
                  <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: style.accent }} />
                  {slide.tag}
                </div>
                <div className="font-semibold text-sm">{slide.duration}</div>
              </div>
            </div>

            <button
              onClick={() => document.getElementById("proceso")?.scrollIntoView({ behavior: "smooth" })}
              className="mt-5 text-sm text-white/65 hover:text-white transition-colors underline underline-offset-4"
            >
              {ctaSecundarioLabel}
            </button>
          </motion.div>
        </AnimatePresence>

        {/* Dots + prev/next */}
        <div className="flex items-center justify-between mt-10 flex-wrap gap-4">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Ir a la etapa ${i + 1}`}
                className="h-1 transition-all duration-300"
                style={{ width: i === idx ? 28 : 8, backgroundColor: i === idx ? "var(--ds-c-marketing-hero-dot-active)" : "var(--ds-c-marketing-hero-dot-inactive)" }}
              />
            ))}
          </div>
          <div className="flex items-center gap-3.5">
            <span className="font-mono text-[11px] text-white/50">
              {String(idx + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
            <div className="flex gap-2">
              <button onClick={goPrev} aria-label="Etapa anterior" className="w-[34px] h-[34px] border border-white/25 text-white hover:bg-white/10 transition-colors">←</button>
              <button onClick={goNext} aria-label="Etapa siguiente" className="w-[34px] h-[34px] border border-white/25 text-white hover:bg-white/10 transition-colors">→</button>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de telemetría */}
      <div className="relative z-10 border-t border-white/12 bg-black/45 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10">
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
