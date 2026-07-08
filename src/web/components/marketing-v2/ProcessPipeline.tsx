"use client";

import * as React from "react";
import { motion } from "framer-motion";

const STEPS = [
  {
    index: "01",
    name: "Diagnóstico técnico",
    headline: "Medir antes de proponer.",
    description:
      "Visita en planta con instrumentación calibrada. Mapeo de caudales, presión, temperatura y partículas. Identificación de zonas muertas, turbulencias y sobrecargas.",
    deliverables: [
      "Mapa térmico y de caudales",
      "Curva actual de operación",
      "Reporte de hallazgos críticos",
    ],
    duration: "5–8 días",
  },
  {
    index: "02",
    name: "Simulación y diseño",
    headline: "Modelar la solución antes de fabricarla.",
    description:
      "Modelado CFD 3D del comportamiento del aire. Selección de equipos. Cálculo de ductos, dampers y transiciones. Memoria de cálculo firmada.",
    deliverables: [
      "Simulación CFD 3D",
      "Selección de equipos",
      "Planos de fabricación",
    ],
    duration: "10–14 días",
  },
  {
    index: "03",
    name: "Ejecución de ingeniería",
    headline: "Fabricación y montaje con estándares auditables.",
    description:
      "Manufactura en planta propia con acero certificado. Balanceo ISO 1940 G2.5. Instalación por equipo certificado con cero paradas no planificadas.",
    deliverables: [
      "Fabricación in-house",
      "Balanceo y pruebas de banco",
      "Instalación certificada",
    ],
    duration: "20–35 días",
  },
  {
    index: "04",
    name: "Resultados garantizados",
    headline: "Verificación con instrumentación, no con palabras.",
    description:
      "Medición post-instalación. Reporte de cumplimiento vs. diseño. Plan de mantenimiento programado. Línea directa con ingeniería.",
    deliverables: [
      "Medición de cumplimiento",
      "Reporte certificado",
      "Mantenimiento programado",
    ],
    duration: "Continuo",
  },
];

interface ProcessPipelineProps {
  content?: { name: string; headline: string; description: string; duration: string; deliverables: string[] }[];
}

export function ProcessPipeline({ content }: ProcessPipelineProps = {}) {
  const items = STEPS.map((s, i) => {
    const o = content?.[i];
    return {
      ...s,
      name: o?.name || s.name,
      headline: o?.headline || s.headline,
      description: o?.description || s.description,
      duration: o?.duration || s.duration,
      deliverables: o?.deliverables?.length ? o.deliverables : s.deliverables,
    };
  });

  return (
    <section
      id="proceso"
      className="relative w-full bg-paper-warm section-py-wide"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 section-header-loose">
          <div className="lg:col-span-2">
            <p className="editorial-eyebrow">— Proceso</p>
          </div>
          <div className="lg:col-span-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="editorial-h2 text-[clamp(40px,5.5vw,80px)] max-w-4xl"
            >
              Cuatro etapas.
              <br />
              <span className="italic text-ink-soft">
                Cero suposiciones.
              </span>
            </motion.h2>
            <p className="mt-10 text-lg sm:text-xl leading-[1.6] text-ink-soft max-w-2xl font-sans">
              Cada proyecto sigue el mismo pipeline auditable. Lo que cambia
              es la ingeniería detrás de cada decisión, no el rigor del
              proceso.
            </p>
          </div>
        </div>

        <div className="space-y-px bg-line reveal-stagger">
          {items.map((step, idx) => (
            <motion.article
              key={step.index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.7,
                delay: idx * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`group hover:bg-paper transition-colors duration-500 ${idx % 2 === 0 ? "bg-paper-warm" : "bg-paper"}`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 px-6 sm:px-10 lg:px-14 py-10 lg:py-16">
                {/* Number + name */}
                <div className="lg:col-span-3">
                  <p className="editorial-mono mb-3">
                    Etapa {step.index} / 04
                  </p>
                  <h3 className="font-display text-2xl lg:text-3xl font-light text-ink tracking-[-0.02em] leading-[1.1]">
                    {step.name}
                  </h3>
                  <p className="editorial-mono mt-3 text-xs">
                    {step.duration}
                  </p>
                </div>

                {/* Headline + description */}
                <div className="lg:col-span-5">
                  <p className="font-display text-xl lg:text-2xl italic font-light text-ink-soft leading-snug mb-4 tracking-[-0.01em]">
                    {step.headline}
                  </p>
                  <p className="text-base leading-[1.6] text-ink-soft font-sans">
                    {step.description}
                  </p>
                </div>

                {/* Deliverables */}
                <div className="lg:col-span-4">
                  <p className="editorial-mono text-xs mb-4">
                    Entregables
                  </p>
                  <ul className="space-y-2">
                    {step.deliverables.map((d) => (
                      <li
                        key={d}
                        className="flex items-start gap-3 text-base text-ink font-sans"
                      >
                        <span className="shrink-0 w-3 h-px bg-ink mt-3" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
