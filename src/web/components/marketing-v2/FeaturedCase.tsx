"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { CinematicPhoto } from "./primitives/CinematicPhoto";

const RESULTS = [
  { label: "Temperatura en zona de colada", before: "47°C", after: "25°C" },
  { label: "Renovaciones por hora (ACH)", before: "18", after: "42" },
  { label: "Costo anual de paradas no planificadas", before: "USD 2.4M", after: "USD 0.8M" },
  { label: "Cumplimiento RETIE", before: "62%", after: "100%" },
];

export interface FeaturedCaseContent {
  headline: string;
  headlineHighlight: string;
  meta: string;
  photoUrl?: string;
  photoAlt?: string;
  results: { label: string; before: string; after: string }[];
  quote: string;
  quoteAuthor: string;
  quoteRole: string;
}

interface FeaturedCaseProps {
  content?: FeaturedCaseContent;
}

export function FeaturedCase({ content }: FeaturedCaseProps = {}) {
  const headline = content?.headline || "Planta Paz del Río.";
  const headlineHighlight = content?.headlineHighlight || "22°C menos. Sin paradas.";
  const meta = content?.meta || "Siderurgia · Colombia · 2024";
  const photoUrl = content?.photoUrl || "/rotor_dynamic_balancing.webp";
  const photoAlt = content?.photoAlt || "Balanceo dinámico de rotor en planta";
  const results = content?.results?.length ? content.results : RESULTS;
  const quote = content?.quote || "Pasamos de operar a la defensiva a operar con margen. La diferencia fue la ingeniería, no el equipo.";
  const quoteAuthor = content?.quoteAuthor || "Carlos Mendoza";
  const quoteRole = content?.quoteRole || "Director de Operaciones · Paz del Río";

  return (
    <section
      id="casos"
      className="relative w-full bg-paper section-py-wide"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 section-header-loose">
          <div className="lg:col-span-2">
            <p className="editorial-eyebrow">— Caso destacado</p>
          </div>
          <div className="lg:col-span-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="editorial-h2 text-[clamp(40px,5.5vw,80px)] max-w-4xl"
            >
              {headline}
              <br />
              <span className="italic text-ink-soft">{headlineHighlight}</span>
            </motion.h2>
            <p className="mt-8 editorial-mono text-[11px]">
              {meta}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <div className="relative aspect-[4/5] lg:aspect-[5/6] overflow-hidden bg-paper-warm">
              <CinematicPhoto
                src={photoUrl}
                alt={photoAlt}
                className="!relative w-full h-full"
                objectFit="cover"
              />
            </div>
            <p className="mt-4 editorial-mono text-[10px]">
              Vista parcial · Sala de hornos de arco eléctrico
            </p>
          </motion.div>

          {/* Results + quote */}
          <div className="lg:col-span-5 space-y-12 lg:pt-12">
            <div>
              <p className="editorial-mono text-[11px] sm:text-[10px] mb-6">
                Resultados verificados
              </p>
              <div className="space-y-px bg-line">
                {results.map((r) => (
                  <div
                    key={r.label}
                    className="bg-paper px-5 py-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4"
                  >
                    <span className="text-base text-ink-soft font-sans">
                      {r.label}
                    </span>
                    <span className="font-mono text-sm text-ink-muted line-through tabular-nums">
                      {r.before}
                    </span>
                    <span className="font-display text-2xl text-ink font-light tracking-[-0.02em] text-right tabular-nums">
                      {r.after}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-line">
              <Quote
                className="w-6 h-6 text-ink-soft mb-4"
                strokeWidth={1.25}
              />
              <blockquote className="font-display text-xl lg:text-2xl italic font-light text-ink leading-snug tracking-[-0.01em] mb-6">
                {quote}
              </blockquote>
              <div>
                <p className="text-sm font-medium text-ink">
                  {quoteAuthor}
                </p>
                <p className="text-xs text-ink-soft mt-0.5">
                  {quoteRole}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

