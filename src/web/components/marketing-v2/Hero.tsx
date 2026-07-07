"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { getTenantConfig } from "@/platform/tenant/tenant";
import { CinematicPhoto } from "./primitives/CinematicPhoto";
import { CertBadgeRow } from "./primitives/CertBadge";
import { HERO_COLOR_SCHEMES } from "@/platform/branding/branding-defaults";

interface HeroProps {
  siteName: string;
  tenantCode: string;
  branding?: any;
}

// Caso de demo (usado para anotaciones visuales fijas)
const DEMO_DIMENSIONS = { length: 50, width: 30, height: 12 };

// Validador: convierte saltos de línea manuales del CMS en <br />
function renderMultilineText(text: string) {
  if (!text) return null;
  return text.split("\n").map((line, idx) => (
    <React.Fragment key={idx}>
      {line}
      {idx < text.split("\n").length - 1 && <br />}
    </React.Fragment>
  ));
}

export function Hero({ siteName, tenantCode, branding = {} }: HeroProps) {
  // === Lectura de configuración del CMS con fallbacks seguros ===
  const heroTipoFondo = (branding.hero_tipo_fondo as string) || "imagen";
  // Solo usar video si hay una URL real configurada en el CMS (no el placeholder hardcodeado)
  const rawVideoUrl = branding.landing_video_url as string | undefined;
  const landingVideoUrl =
    rawVideoUrl && rawVideoUrl.trim() !== "" && rawVideoUrl !== "/video_hero.mp4"
      ? rawVideoUrl
      : null;
  const landingImagenUrl =
    (branding.landing_imagen_url as string) || "/industrial_plant_ventilation.webp";
  const heroEyebrow =
    (branding.hero_eyebrow as string) || "Ingeniería de ventilación industrial";
  const heroTitulo =
    (branding.landing_titulo as string) || "El control del aire";
  const heroSubtitulo =
    (branding.landing_subtitulo as string) || "que sostiene su planta.";
  // Esquema de color curado — nunca hex libre, para garantizar contraste
  // sobre el fondo oscuro del Hero (ver HERO_COLOR_SCHEMES).
  const scheme = HERO_COLOR_SCHEMES[(branding.hero_color_scheme as keyof typeof HERO_COLOR_SCHEMES) || "clasico"];
  const heroTituloColor = scheme.titulo;
  const heroSubtituloColor = scheme.subtitulo;
  const heroEyebrowColor = scheme.eyebrow === "__brand__" ? (branding.color_primario as string) || "#4C8DFF" : scheme.eyebrow;
  const heroLayout = (branding.hero_layout as string) || "stack"; // stack | inline
  const ctaPrimarioLabel =
    (branding.hero_cta_primario_label as string) || "Iniciar Cotización Industrial";
  const ctaSecundarioLabel =
    (branding.hero_cta_secundario_label as string) || "Conocer el proceso";
  const certificaciones: string[] = (branding.certificaciones as string[]) || ["AMCA", "ISO 1940 G2.5", "ASHRAE 62.1"];

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
      className="relative w-full min-h-[100svh] flex flex-col bg-ink"
    >
      {/* === BACKGROUND: Foto industrial o Video según CMS === */}
      <div className="absolute inset-0">
        {heroTipoFondo === "video" && landingVideoUrl ? (
          <video
            autoPlay
            loop
            muted
            playsInline
            poster={landingImagenUrl}
            className="w-full h-full object-cover"
          >
            <source src={landingVideoUrl} type="video/mp4" />
          </video>
        ) : (
          <CinematicPhoto
            src={landingImagenUrl}
            alt="Planta industrial"
            sizes="100vw"
            priority
            className="!relative w-full h-full"
          />
        )}
        {/* Gradiente editorial */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(7,9,12,0.85) 0%, rgba(7,9,12,0.25) 25%, rgba(7,9,12,0.15) 55%, rgba(7,9,12,0.75) 85%, rgba(7,9,12,0.95) 100%)",
          }}
        />
        {/* Viñeta lateral izquierda */}
        <div
          className="absolute inset-y-0 left-0 w-2/3"
          style={{
            background:
              "linear-gradient(90deg, rgba(7,9,12,0.55) 0%, rgba(7,9,12,0.15) 60%, transparent 100%)",
          }}
        />
      </div>

      {/* === OVERLAY TÉCNICO: cotas y anotaciones === */}
      <TechnicalOverlay />

      {/* === CONTENT === */}
      <div className="relative z-10 flex-1 flex flex-col pt-28 sm:pt-32 pb-4">
        {/* Top brand identifier */}
        <div className="px-6 sm:px-10 lg:px-14 mb-6 sm:mb-10">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-between max-w-[1440px] mx-auto"
          >
            <div
              className="flex items-center gap-3 font-mono text-[10px] sm:text-[10px] tracking-[0.2em] uppercase"
              style={{ color: heroEyebrowColor }}
            >
              <span className="w-6 h-px bg-white/40" />
              <span>{heroEyebrow}</span>
            </div>
            <div className="hidden md:block" style={{ color: "rgba(255,255,255,0.55)" }}>
              <CertBadgeRow labels={certificaciones} />
            </div>
          </motion.div>
        </div>

        {/* Spacer que empuja el headline al bottom del hero */}
        <div className="flex-1" />

        {/* Headline + CTAs */}
        <div className="px-6 sm:px-10 lg:px-14 pb-6 sm:pb-8 max-w-[1440px] mx-auto w-full">
          {/* TÍTULO COMERCIAL — color y saltos de línea controlados por el CMS */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-light tracking-[-0.04em] leading-[0.95] text-[clamp(36px,5.4vw,84px)] max-w-[1100px]"
            style={{
              color: heroTituloColor,
              wordBreak: "normal",
              hyphens: "none",
            }}
          >
            {heroLayout === "stack" ? (
              <>
                {renderMultilineText(heroTitulo)}
                <br />
                <span
                  className="italic font-light"
                  style={{ color: heroSubtituloColor }}
                >
                  {renderMultilineText(heroSubtitulo)}
                </span>
              </>
            ) : (
              <>
                {heroTitulo}{" "}
                <span
                  className="italic font-light"
                  style={{ color: heroSubtituloColor }}
                >
                  {heroSubtitulo}
                </span>
              </>
            )}
          </motion.h1>

          {/* Descripción + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55 }}
            className="mt-8 lg:mt-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6 lg:gap-10"
          >
            <p
              className="text-base sm:text-lg leading-[1.55] max-w-md font-sans font-light"
              style={{ color: heroSubtituloColor }}
            >
              Diseño, simulación y ejecución de sistemas críticos de extracción
              y climatización para industrias B2B.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
              <a
                href={`/wizard?tenant=${tenantCode}`}
                className="group inline-flex items-center justify-center gap-3 h-14 px-7 bg-white text-ink text-sm font-medium tracking-tight rounded-sm hover:bg-white/90 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] shine"
              >
                <span>{ctaPrimarioLabel}</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </a>
              <button
                onClick={() =>
                  document
                    .getElementById("proceso")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="group inline-flex items-center justify-center gap-3 h-14 px-7 bg-transparent text-white text-sm font-medium tracking-tight rounded-sm border border-white/30 hover:bg-white/10 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>{ctaSecundarioLabel}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom telemetry strip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="relative z-10 border-t border-white/10 bg-black/40 backdrop-blur-md"
      >
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 h-20 grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/10 items-center">
          <TelemetryStat
            label="Caudal"
            value={displayCfm?.toLocaleString("es-CO") || "0"}
            unit="CFM"
            isLoading={displayCfm === null}
          />
          <TelemetryStat
            label="Potencia"
            value={displayPower?.toFixed(1) || "0"}
            unit="HP"
            isLoading={displayPower === null}
          />
          <TelemetryStat
            label="Equipos"
            value={targetEqCount.toString()}
            unit="sugeridos"
          />
          <TelemetryStat
            label="Temp. zona colada"
            value={displayTemp?.toFixed(0) || "0"}
            unit="°C máx."
            isLoading={displayTemp === null}
          />
        </div>
      </motion.div>
    </section>
  );
}

/* === OVERLAY TÉCNICO SOBRE LA FOTO === */
function TechnicalOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* === Marca de agua del plano: código de proyecto === */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="absolute top-28 right-6 sm:right-10 lg:right-14 font-mono text-[10px] tracking-widest text-white/50 uppercase text-right hidden md:block"
      >
        <p>DWG-2026-AX-048</p>
        <p>ESC 1:200 · REV 03</p>
      </motion.div>

      {/* === Cota vertical izquierda === */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 1, scaleY: 1 }}
        transition={{ duration: 0.9, delay: 0.6, ease: "easeOut" }}
        style={{ transformOrigin: "top" }}
        className="absolute top-[18%] bottom-[20%] left-6 sm:left-10 lg:left-14 w-px bg-white/30 hidden md:block"
      >
        <div className="absolute -top-1 -left-1.5 w-3 h-px bg-white/50" />
        <div className="absolute -bottom-1 -left-1.5 w-3 h-px bg-white/50" />
        <div className="absolute top-1/2 left-2 -translate-y-1/2 [writing-mode:vertical-lr] rotate-180">
          <p className="font-mono text-[10px] tracking-widest text-white/60 uppercase">
            {DEMO_DIMENSIONS.height}.0 m
          </p>
        </div>
      </motion.div>

      {/* === Cota horizontal inferior === */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.9, delay: 0.7, ease: "easeOut" }}
        style={{ transformOrigin: "left" }}
        className="absolute left-1/4 right-1/4 bottom-[20%] h-px bg-white/30 hidden md:block"
      >
        <div className="absolute -left-1 -top-1.5 w-px h-3 bg-white/50" />
        <div className="absolute -right-1 -top-1.5 w-px h-3 bg-white/50" />
        <div className="absolute -top-7 left-1/2 -translate-x-1/2">
          <p className="font-mono text-[10px] tracking-widest text-white/60 uppercase whitespace-nowrap">
            {DEMO_DIMENSIONS.length}.0 m
          </p>
        </div>
      </motion.div>

      {/* === Flechas de flujo de aire animadas === */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.0 }}
        className="absolute top-1/2 right-[8%] -translate-y-1/2 hidden lg:block"
      >
        <svg
          width="180"
          height="120"
          viewBox="0 0 180 120"
          fill="none"
          stroke="rgba(255,255,255,0.55)"
          strokeWidth="1"
        >
          <defs>
            <marker
              id="flow-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="rgba(255,255,255,0.7)" />
            </marker>
          </defs>
          <motion.path
            d="M 10 60 Q 60 20 110 60 T 170 60"
            strokeDasharray="6 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, delay: 1.2, ease: "easeInOut" }}
            markerEnd="url(#flow-arrow)"
          />
          <motion.path
            d="M 10 60 Q 60 100 110 60 T 170 60"
            strokeDasharray="6 4"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, delay: 1.4, ease: "easeInOut" }}
            markerEnd="url(#flow-arrow)"
          />
          <text
            x="90"
            y="14"
            textAnchor="middle"
            fontFamily="monospace"
            fontSize="9"
            fill="rgba(255,255,255,0.7)"
            letterSpacing="2"
          >
            FLUJO DE AIRE
          </text>
        </svg>
      </motion.div>

      {/* === Marcador de zona de colada === */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.6 }}
        className="absolute bottom-[28%] right-6 sm:right-10 lg:right-14 hidden md:block"
      >
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF7B72] animate-pulse" />
          <span className="font-mono text-[10px] tracking-widest text-white/70 uppercase">
            Zona de colada · +45°C
          </span>
        </div>
      </motion.div>
    </div>
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
    <div className="px-2 sm:px-4 first:pl-0 last:pr-0">
      <p className="font-mono text-[10px] sm:text-[9px] tracking-widest text-white/45 uppercase mb-1.5">
        {label}
      </p>
      <div className="flex items-baseline gap-1.5 h-8 sm:h-10">
        {isLoading ? (
          <div className="h-full w-20 sm:w-24 bg-white/10 animate-pulse rounded-md" />
        ) : (
          <>
            <span className="font-display text-white font-light tracking-[-0.03em] leading-none text-2xl sm:text-3xl lg:text-4xl tabular-nums">
              {value}
            </span>
            <span className="font-mono text-[10px] sm:text-[9px] tracking-widest text-white/55 uppercase">
              {unit}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
