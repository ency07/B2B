"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Wrench, Activity, Hammer, Wind } from "lucide-react";

const SERVICES = [
  {
    index: "01",
    name: "Balanceo Estático",
    icon: Wrench,
    shortDescription:
      "Corrección por adición o remoción de pesos para que el eje principal de inercias se aproxime al eje de giro hasta que la vibración residual esté dentro de niveles admisibles.",
    longDescription:
      "Servicio de balanceo estático en planta o in-situ. Aplicable a impulsores de ventiladores centrífugos y axiales. Utilizamos instrumentación digital de la más alta precisión y sensibilidad.",
    deliverable: "Certificado de balanceo ISO 1940 G2.5",
    code: "BAL-STA-01",
  },
  {
    index: "02",
    name: "Mediciones Aerodinámicas",
    icon: Activity,
    shortDescription:
      "Determinación de caudales y presiones estáticas de ventiladores. Levantamiento de curvas de rendimiento reales para validar el diseño vs. operación.",
    longDescription:
      "Caracterización aerodinámica completa: caudal, presión estática, presión total, velocidad de salida, eficiencia y nivel de ruido. Curva de rendimiento auditada en sitio.",
    deliverable: "Curva CFM vs Presión certificada",
    code: "MED-AER-02",
  },
  {
    index: "03",
    name: "Fabricación y Reparación",
    icon: Hammer,
    shortDescription:
      "Fabricación y reparación de ventiladores centrífugos y axiales. Reconstrucción, soldadura, alineación y balanceo estático en nuestra planta.",
    longDescription:
      "Manufactura y mantenimiento mayor de turbomaquinaria. Reconstrucción de impulsores, reemplazo de ejes, soldadura certificada, alineación láser y balanceo. Acero ASTM A36 certificado.",
    deliverable: "Reconstrucción completa con garantía 12 meses",
    code: "FAB-REP-03",
  },
  {
    index: "04",
    name: "Sistemas Hongo de Extracción e Inyección",
    icon: Wind,
    shortDescription:
      "Diseño, fabricación, construcción e instalación de sistemas de extracción e inyección de aire tipo hongo. Instrumentación digital de alta precisión.",
    longDescription:
      "Diseño e instalación de sistemas completos de extracción localizada tipo hongo. Aplicaciones: soldadura, vapores, polvos, ambientes corrosivos. Fabricación con acero galvanizado, inoxidable o al carbono según especificación.",
    deliverable: "Sistema llave en mano con puesta en marcha",
    code: "HON-SYS-04",
  },
];

interface Props {
  tenantCode: string;
  content?: { name: string; shortDescription: string; longDescription: string; deliverable: string }[];
}

export function Services({ tenantCode, content }: Props) {
  const items = SERVICES.map((s, i) => {
    const o = content?.[i];
    return {
      ...s,
      name: o?.name || s.name,
      shortDescription: o?.shortDescription || s.shortDescription,
      longDescription: o?.longDescription || s.longDescription,
      deliverable: o?.deliverable || s.deliverable,
    };
  });

  return (
    <section
      id="servicios"
      className="relative w-full bg-paper section-py"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 section-header-normal">
          <div className="lg:col-span-2">
            <p className="editorial-eyebrow">— Servicios</p>
          </div>
          <div className="lg:col-span-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="editorial-h2 text-[clamp(40px,5.5vw,80px)] max-w-4xl"
            >
              Cuatro servicios
              <br />
              <span className="italic text-ink-soft">que sostienen la operación.</span>
            </motion.h2>
            <p className="mt-10 text-lg sm:text-xl leading-[1.6] text-ink-soft max-w-2xl font-sans">
              Más allá del equipo: instrumentación digital, balanceo
              certificado, reconstrucción mayor y sistemas completos tipo
              hongo. Cada servicio con instrumentación trazable.
            </p>
          </div>
        </div>

        {/* === GRID 2x2 — Servicios === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-line border border-line">
          {items.map((service, idx) => {
            const Icon = service.icon;
            return (
              <motion.article
                key={service.index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.7,
                  delay: idx * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative bg-paper p-8 lg:p-10 group hover:bg-paper-warm transition-colors duration-500"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md bg-ink text-paper flex items-center justify-center">
                      <Icon className="w-5 h-5" strokeWidth={1.25} />
                    </div>
                    <span className="font-mono text-xs tracking-widest text-fg-muted uppercase">
                      {service.code}
                    </span>
                  </div>
                  <ArrowUpRight
                    className="w-4 h-4 text-fg-muted group-hover:text-ink group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
                    strokeWidth={1.25}
                  />
                </div>

                <h3 className="font-display text-3xl lg:text-4xl font-light text-ink tracking-[-0.02em] leading-[1.1] mb-4">
                  {service.name}
                </h3>

                <p className="text-base lg:text-lg leading-[1.6] text-ink font-sans mb-4">
                  {service.shortDescription}
                </p>

                <p className="text-sm text-ink-soft leading-[1.6] font-sans mb-8">
                  {service.longDescription}
                </p>

                <div className="pt-6 border-t border-line flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs tracking-widest text-fg-muted uppercase mb-1">
                      Entregable
                    </p>
                    <p className="text-sm font-medium text-ink tracking-tight">
                      {service.deliverable}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      (window.location.href = `/wizard?tenant=${tenantCode}&servicio=${service.code}`)
                    }
                    className="group/btn inline-flex items-center gap-2 font-sans text-sm font-medium text-ink hover:text-ink-soft transition-colors shrink-0"
                  >
                    <span>Solicitar</span>
                    <ArrowUpRight
                      className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                      strokeWidth={1.5}
                    />
                  </button>
                </div>

                {/* Accent top border on hover */}
                <div
                  className="absolute top-0 left-0 right-0 h-px transition-all duration-700"
                  style={{
                    backgroundColor: "var(--color-ink)",
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
