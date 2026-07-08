 
 
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Quote } from "lucide-react";
import { CinematicPhoto } from "./primitives/CinematicPhoto";
import type { CaseSlideContent } from "@/platform/branding/branding-defaults";

const DEFAULT_CASES: CaseSlideContent[] = [
  {
    sector: "Siderurgia", location: "Colombia", year: "2024",
    titleMain: "Planta Paz del Río.", titleItalic: "22°C menos. Sin paradas.",
    photoUrl: "/rotor_dynamic_balancing.webp", photoAlt: "Balanceo dinámico de rotor en planta",
    results: [
      { label: "Temperatura en zona de colada", before: "47°C", after: "25°C" },
      { label: "Renovaciones por hora (ACH)", before: "18", after: "42" },
      { label: "Costo anual de paradas no planificadas", before: "USD 2.4M", after: "USD 0.8M" },
      { label: "Cumplimiento RETIE", before: "62%", after: "100%" },
    ],
    quote: "Pasamos de operar a la defensiva a operar con margen. La diferencia fue la ingeniería, no el equipo.",
    quoteAuthor: "Carlos Mendoza", quoteRole: "Director de Operaciones · Paz del Río",
  },
  {
    sector: "Minería", location: "Colombia", year: "2023",
    titleMain: "Complejo El Cerrejón.", titleItalic: "Aire limpio a 200°C.",
    photoUrl: "/industrial_centrifugal_fan.webp", photoAlt: "Extracción en planta de trituración",
    results: [
      { label: "Concentración de partículas", before: "340 µg/m³", after: "48 µg/m³" },
      { label: "Horas de exposición crítica", before: "6h/día", after: "0h/día" },
      { label: "Vida útil de motores", before: "3 años", after: "7 años" },
      { label: "Cumplimiento OSHA", before: "58%", after: "100%" },
    ],
    quote: "La diferencia se sintió en la planta el primer día. El equipo ya no respira polvo.",
    quoteAuthor: "Ana Restrepo", quoteRole: "Gerente HSE · El Cerrejón",
  },
  {
    sector: "Data centers", location: "Colombia", year: "2024",
    titleMain: "Data Center Claro.", titleItalic: "Uptime 99.99% garantizado.",
    photoUrl: "/axial_duct_fan.webp", photoAlt: "Sala de servidores con climatización de precisión",
    results: [
      { label: "Redundancia de climatización", before: "N", after: "N+1" },
      { label: "Consumo eléctrico HVAC", before: "100%", after: "71%" },
      { label: "Incidentes térmicos anuales", before: "4", after: "0" },
      { label: "Cumplimiento TIA-942", before: "Tier II", after: "Tier IV" },
    ],
    quote: "Ganamos margen operativo sin sacrificar continuidad. Eso no tiene precio en este negocio.",
    quoteAuthor: "Julián Torres", quoteRole: "Director de Infraestructura · Claro",
  },
  {
    sector: "Manufactura y alimentos", location: "Colombia", year: "2023",
    titleMain: "Planta Nutresa Medellín.", titleItalic: "HACCP sin fricción.",
    photoUrl: "/extractor_hongo_inox.webp", photoAlt: "Línea de producción con extracción localizada",
    results: [
      { label: "Cumplimiento HACCP", before: "71%", after: "100%" },
      { label: "Renovaciones por hora (ACH)", before: "12", after: "30" },
      { label: "Tiempo de auditoría anual", before: "3 semanas", after: "4 días" },
      { label: "Paradas por mantenimiento", before: "14/año", after: "2/año" },
    ],
    quote: "La auditoría dejó de ser una amenaza. Ahora es un trámite de rutina.",
    quoteAuthor: "Marcela Gómez", quoteRole: "Jefe de Planta · Nutresa",
  },
];

interface FeaturedCaseProps {
  content?: CaseSlideContent[];
}

const AUTOPLAY_MS = 8000;

export function FeaturedCase({ content }: FeaturedCaseProps = {}) {
  const cases = content?.length ? content : DEFAULT_CASES;
  const [idx, setIdx] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const count = cases.length;
  const cs = cases[idx];
  const goPrev = () => setIdx((i) => (i + count - 1) % count);
  const goNext = () => setIdx((i) => (i + 1) % count);

  // Auto-avance del carrusel — se pausa al pasar el mouse por encima.
  React.useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(() => {
      setIdx((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, paused, idx]);

  return (
    <section
      id="casos"
      className="relative w-full bg-paper section-py-wide overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
        <div className="flex justify-between items-end flex-wrap gap-6 mb-14">
          <div>
            <p className="editorial-eyebrow mb-5">— Casos destacados</p>
            <h2 className="editorial-h2 text-[clamp(32px,4vw,50px)] max-w-4xl">
              Proyectos que
              <br />
              <span className="italic text-ink-soft">sostienen la operación.</span>
            </h2>
          </div>
          <div className="flex items-center gap-3.5">
            <span className="font-mono text-xs text-fg-muted">
              {String(idx + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
            </span>
            <div className="flex gap-2">
              <button onClick={goPrev} aria-label="Caso anterior" className="w-[38px] h-[38px] border border-line bg-paper text-ink hover:bg-paper-warm transition-colors">←</button>
              <button onClick={goNext} aria-label="Caso siguiente" className="w-[38px] h-[38px] border border-line bg-paper text-ink hover:bg-paper-warm transition-colors">→</button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >
            <p className="font-mono text-xs text-fg-muted mb-6">
              {cs.sector} · {cs.location} · {cs.year}
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-start">
              <div className="lg:col-span-7">
                <div className="relative aspect-[4/5] lg:aspect-[5/6] overflow-hidden bg-paper-warm">
                  <CinematicPhoto
                    src={cs.photoUrl}
                    alt={cs.photoAlt}
                    className="!relative w-full h-full"
                    objectFit="cover"
                  />
                </div>
                <div className="mt-6 font-display text-2xl leading-[1.2] text-ink">
                  {cs.titleMain} <span className="italic font-light text-ink-soft">{cs.titleItalic}</span>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-8 lg:pt-2">
                <div>
                  <p className="editorial-mono text-[11px] mb-5">Resultados verificados</p>
                  <div className="space-y-px bg-line">
                    {cs.results.map((r) => (
                      <div key={r.label} className="bg-paper px-5 py-4 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                        <span className="text-sm text-ink-soft font-sans">{r.label}</span>
                        <span className="font-mono text-sm text-ink-muted line-through tabular-nums">{r.before}</span>
                        <span className="font-display text-xl text-ink font-light tracking-[-0.02em] text-right tabular-nums">{r.after}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-line">
                  <Quote className="w-5 h-5 text-ink-soft mb-3" strokeWidth={1.25} />
                  <blockquote className="font-display text-lg italic font-light text-ink leading-snug tracking-[-0.01em] mb-5">
                    {cs.quote}
                  </blockquote>
                  <div>
                    <p className="text-sm font-medium text-ink">{cs.quoteAuthor}</p>
                    <p className="text-xs text-ink-soft mt-0.5">{cs.quoteRole}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-2 mt-10">
          {cases.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              aria-label={`Ir al caso ${i + 1}`}
              className="h-1 transition-all duration-300"
              style={{ width: i === idx ? 28 : 8, backgroundColor: i === idx ? "var(--color-ink)" : "var(--color-line-strong)" }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
