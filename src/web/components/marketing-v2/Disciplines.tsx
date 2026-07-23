"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { DraftingCompass, HardHat, Wrench, ClipboardCheck, ArrowUpRight, type LucideIcon } from "lucide-react";

interface Discipline {
  index: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  deliverables: string[];
  stat: { value: string; label: string };
  code: string;
  color: string;
  Icon: LucideIcon;
}

const DISCIPLINES: Discipline[] = [
  {
    index: "01",
    name: "Ingeniería",
    shortDescription:
      "Diseño, simulación CFD y memoria de cálculo firmada por ingeniero responsable.",
    longDescription:
      "Modelado computacional del comportamiento del aire en su planta. Selección de equipos. Cálculo de ductos, dampers y transiciones. Cada especificación queda documentada en una memoria de cálculo firmada y auditada.",
    deliverables: [
      "Simulación CFD 3D del flujo",
      "Selección óptima de equipos",
      "Memoria de cálculo firmada",
      "Planos de fabricación",
    ],
    stat: { value: "10-14", label: "días de diseño" },
    code: "ING-DSG-01",
    color: "var(--ds-c-marketing-discipline-color-1)",
    Icon: DraftingCompass,
  },
  {
    index: "02",
    name: "Instalación",
    shortDescription:
      "Montaje mecánico certificado en planta operativa. Cero paradas no planificadas.",
    longDescription:
      "Equipo de instaladores certificados trabaja en coordinación con su operación. Conexión eléctrica, variadores de frecuencia, pruebas de arranque y balanceo. Sin paradas no planificadas. Capacitación a su personal al finalizar.",
    deliverables: [
      "Montaje mecánico certificado",
      "Conexión eléctrica y variadores",
      "Puesta en marcha y balanceo",
      "Capacitación a operadores",
    ],
    stat: { value: "5-10", label: "días de montaje" },
    code: "INS-MNT-02",
    color: "var(--ds-c-marketing-discipline-color-2)",
    Icon: HardHat,
  },
  {
    index: "03",
    name: "Mantenimiento",
    shortDescription:
      "Programa preventivo que garantiza la continuidad operativa de la planta.",
    longDescription:
      "Análisis de vibración triaxial, termografía de motores, balanceo dinámico ISO 1940 G2.5 e inspección de pérdidas de caudal. Plan programado según criticidad del equipo y la operación.",
    deliverables: [
      "Análisis de vibración triaxial",
      "Termografía de motores",
      "Balanceo dinámico G2.5",
      "Reporte de condición auditado",
    ],
    stat: { value: "12", label: "meses entre visitas" },
    code: "MTT-PRV-03",
    color: "var(--ds-c-marketing-discipline-color-3)",
    Icon: Wrench,
  },
  {
    index: "04",
    name: "Auditoría",
    shortDescription:
      "Medición aerodinámica en sitio. Curva de rendimiento certificada bajo normas AMCA.",
    longDescription:
      "Caracterización aerodinámica completa: caudal, presión estática, presión total, velocidad de salida, eficiencia y nivel de ruido. Instrumentación digital trazable. Comparación contra diseño y emisión de recomendaciones.",
    deliverables: [
      "Curva de rendimiento certificada",
      "Informe de eficiencia energética",
      "Análisis de cumplimiento RETIE",
      "Plan de optimización medible",
    ],
    stat: { value: "100%", label: "normas AMCA" },
    code: "AUD-AMD-04",
    color: "var(--ds-c-marketing-discipline-color-4)",
    Icon: ClipboardCheck,
  },
];

interface Props {
  tenantCode: string;
  content?: { name: string; shortDescription: string; statValue: string; statLabel: string; deliverables: string[] }[];
}

export function Disciplines({ tenantCode, content }: Props) {
  const items = DISCIPLINES.map((d, i) => {
    const o = content?.[i];
    return {
      ...d,
      name: o?.name || d.name,
      shortDescription: o?.shortDescription || d.shortDescription,
      stat: {
        value: o?.statValue || d.stat.value,
        label: o?.statLabel || d.stat.label,
      },
      deliverables: o?.deliverables?.length ? o.deliverables : d.deliverables,
    };
  });

  return (
    <section
      id="disciplinas"
      className="relative w-full bg-paper-warm section-py"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* === HEADER === */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 section-header-normal">
          <div className="lg:col-span-2">
            <p className="editorial-eyebrow">— Disciplinas</p>
          </div>
          <div className="lg:col-span-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="editorial-h2 text-[clamp(40px,5.5vw,80px)] max-w-4xl"
            >
              Cuatro disciplinas
              <br />
              <span className="italic text-ink-soft">para sostener su planta.</span>
            </motion.h2>
            <p className="mt-10 text-lg sm:text-xl leading-[1.6] text-ink-soft max-w-2xl font-sans">
              Ingeniería, instalación, mantenimiento y auditoría como
              servicios diferenciados. Cada disciplina con su propio
              equipo, instrumentación y certificaciones.
            </p>
          </div>
        </div>

        {/* === GRID 4×1 con identidad distinta por card === */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line reveal-stagger">
          {items.map((d, idx) => {
            const Icon = d.Icon;
            return (
              <motion.article
                key={d.index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.7,
                  delay: idx * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative bg-paper p-8 lg:p-10 min-h-[400px] group hover:bg-paper-warm transition-colors duration-500 flex flex-col"
              >
                {/* === HEADER: número + icon + accent === */}
                <div className="flex items-start justify-between mb-8">
                  <div className="flex flex-col gap-1.5">
                    <span className="font-mono text-xs tracking-widest text-fg-muted uppercase">
                      {d.index} / 04
                    </span>
                    <span
                      className="font-mono text-xs tracking-widest uppercase font-medium"
                      style={{ color: d.color }}
                    >
                      {d.code}
                    </span>
                  </div>
                  {/* Icon con accent color en border */}
                  <div
                    className="w-12 h-12 rounded-sm flex items-center justify-center transition-colors"
                    style={{
                      border: `1px solid ${d.color}40`,
                      backgroundColor: `${d.color}10`,
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      strokeWidth={1.5}
                      style={{ color: d.color }}
                    />
                  </div>
                </div>

                {/* === Nombre === */}
                <h3 className="font-display text-2xl lg:text-3xl font-light text-ink tracking-[-0.02em] leading-[1.1] mb-4">
                  {d.name}
                </h3>

                {/* === Descripción corta === */}
                <p className="text-base leading-[1.6] text-ink-soft font-sans mb-6">
                  {d.shortDescription}
                </p>

                {/* === Stat con accent color === */}
                <div
                  className="mb-6 py-4 border-t"
                  style={{ borderColor: `${d.color}30` }}
                >
                  <p
                    className="font-display text-3xl font-light tracking-[-0.02em] tabular-nums leading-none"
                    style={{ color: d.color }}
                  >
                    {d.stat.value}
                  </p>
                  <p className="editorial-mono mt-2">{d.stat.label}</p>
                </div>

                {/* === Entregables (lista corta) === */}
                <ul className="space-y-2 mb-8 flex-1">
                  {d.deliverables.slice(0, 3).map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2.5 text-sm text-ink font-sans"
                    >
                      <span
                        className="shrink-0 w-1 h-1 rounded-full mt-2.5"
                        style={{ backgroundColor: d.color }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                {/* === CTA al wizard con query param === */}
                <a
                  href={`/wizard?tenant=${tenantCode}&servicio=${d.code}`}
                  className="group/btn inline-flex items-center justify-between gap-2 pt-6 border-t border-line"
                >
                  <span
                    className="font-mono text-xs tracking-widest uppercase font-medium"
                    style={{ color: d.color }}
                  >
                    Solicitar
                  </span>
                  <ArrowUpRight
                    className="w-4 h-4 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                    strokeWidth={1.5}
                    style={{ color: d.color }}
                  />
                </a>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
