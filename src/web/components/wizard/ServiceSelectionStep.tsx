"use client";

import React from "react";
import { motion } from "framer-motion";
import { Wrench, Activity, Hammer, Wind, type LucideIcon } from "lucide-react";
import type { WizardFormState, WizardFormChangeHandler } from "./types";

interface ServiceSelectionStepProps {
  form: WizardFormState;
  handleChange: WizardFormChangeHandler;
  preselectedProduct: string;
  primaryColor: string;
}

const SERVICES: {
  id: WizardFormState["servicio"];
  header: string;
  title: string;
  subtitle: string;
  desc: string;
  Icon: LucideIcon;
}[] = [
  {
    id: "fabricacion",
    header: "AMCA 210 / ISO 1940",
    title: "Diseño a Medida",
    subtitle: "Fabricación de Equipos",
    desc: "Cálculo estructural, diseño aerodinámico y balanceo dinámico de extractores centrífugos e industriales bajo normas AMCA.",
    Icon: Wrench,
  },
  {
    id: "venta",
    header: "OEM Certified",
    title: "Equipos OEM Certificados",
    subtitle: "Suministro de Ventiladores",
    desc: "Suministro directo de extractores axiales, tubulares y de tejado premium para integración en sistemas de climatización.",
    Icon: Wind,
  },
  {
    id: "mantenimiento",
    header: "Mantenimiento Predictivo",
    title: "Confiabilidad Operativa",
    subtitle: "Mantenimiento Preventivo",
    desc: "Análisis de vibración triaxial, termografía de motores e inspección de pérdidas de caudal para garantizar la continuidad operativa.",
    Icon: Activity,
  },
  {
    id: "reparacion",
    header: "Ingeniería de Campo 24/7",
    title: "Soporte Crítico",
    subtitle: "Asistencia y Reparación",
    desc: "Intervenciones correctivas urgentes en sitio, alineación láser de transmisiones, balanceo de turbinas e intercambio de rodamientos.",
    Icon: Hammer,
  },
];

export function ServiceSelectionStep({
  form,
  handleChange,
  preselectedProduct,
  primaryColor: _primaryColor,
}: ServiceSelectionStepProps) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-16"
    >
      {/* === HEADER con breathing === */}
      <div>
        <p className="editorial-eyebrow mb-6">{"// 01 — Servicio o equipo"}</p>
        <h2 className="font-display text-4xl lg:text-5xl font-light text-ink tracking-[-0.03em] leading-[1.05] mb-6">
          ¿Qué tipo de requerimiento
          <br />
          <span className="italic text-ink-soft">tiene su planta?</span>
        </h2>
        <p className="text-lg leading-[1.6] text-ink-soft font-sans max-w-3xl">
          Especifique el tipo de servicio o equipo que necesita, junto con la
          prioridad comercial. Esta información define el SLA y el equipo
          de ingeniería que se le asignará.
        </p>
      </div>

      {/* === Banner de pre-seleccionado === */}
      {preselectedProduct && (
        <div className="border-l-2 border-ink bg-paper-warm px-8 py-6 flex items-center gap-5">
          <div className="w-10 h-10 rounded-sm bg-ink text-paper flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div>
            <p className="editorial-mono text-fg-muted mb-1.5">
              Modelo pre-seleccionado del catálogo
            </p>
            <p className="font-mono text-base font-medium text-ink tracking-tight">
              {preselectedProduct}
            </p>
          </div>
        </div>
      )}

      {/* === Servicios: grid 2×2 con padding generoso === */}
      <div>
        <p className="editorial-mono text-fg-muted mb-8">Clase de requerimiento</p>
        <div className="grid gap-6 sm:grid-cols-2">
          {SERVICES.map((item) => {
            const isSelected = form.servicio === item.id;
            const Icon = item.Icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleChange("servicio", item.id)}
                className={`
                  group relative text-left
                  flex flex-col items-start gap-5
                  p-8 lg:p-10
                  min-h-[280px]
                  transition-all duration-300 ease-cockpit
                  ${isSelected
                    ? "bg-ink text-paper"
                    : "bg-paper-warm hover:bg-paper"
                  }
                `}
              >
                {/* Header: icon + radio */}
                <div className="flex items-start justify-between w-full">
                  <div
                    className={`
                      w-12 h-12 rounded-sm flex items-center justify-center transition-colors shrink-0
                      ${isSelected ? "bg-paper text-ink" : "bg-paper text-ink-soft"}
                    `}
                  >
                    <Icon className="w-5 h-5" strokeWidth={1.25} />
                  </div>
                  <div
                    className={`
                      shrink-0 w-4 h-4 rounded-full transition-colors mt-1
                      ${isSelected
                        ? "bg-paper"
                        : "bg-transparent ring-1 ring-line-strong"
                      }
                    `}
                  >
                    {isSelected && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-ink" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content: header + title + subtitle + desc */}
                <div className="flex-1 flex flex-col">
                  <p
                    className={`editorial-mono mb-3 ${
                      isSelected ? "text-white/60" : "text-fg-muted"
                    }`}
                  >
                    {item.header}
                  </p>
                  <p
                    className={`font-display text-2xl lg:text-[26px] font-light tracking-[-0.02em] leading-[1.15] mb-3 ${
                      isSelected ? "text-paper" : "text-ink"
                    }`}
                  >
                    {item.title}
                  </p>
                  <p
                    className={`editorial-mono mb-4 ${
                      isSelected ? "text-white/60" : "text-fg-muted"
                    }`}
                  >
                    {item.subtitle}
                  </p>
                  <p
                    className={`text-sm leading-[1.65] font-sans mt-auto ${
                      isSelected ? "text-white/80" : "text-ink-soft"
                    }`}
                  >
                    {item.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* === Prioridad: 3 columnas con padding generoso === */}
      <div>
        <p className="editorial-mono text-fg-muted mb-8">Prioridad comercial · SLA</p>
        <div className="grid gap-5 sm:grid-cols-3">
          {(
            [
              { value: "baja", label: "Estándar", desc: "En planeación" },
              { value: "media", label: "Media", desc: "Prioritario · +10%" },
              { value: "alta", label: "Alta", desc: "Emergencia · +35%" },
            ] as { value: WizardFormState["urgencia"]; label: string; desc: string }[]
          ).map((u) => {
            const isSelected = form.urgencia === u.value;
            return (
              <button
                key={u.value}
                type="button"
                onClick={() => handleChange("urgencia", u.value)}
                className={`
                  group w-full text-left
                  flex flex-col items-start gap-3
                  p-7 lg:p-8 min-h-[140px]
                  transition-colors duration-200
                  ${isSelected
                    ? "bg-ink text-paper"
                    : "bg-paper-warm hover:bg-paper text-ink"
                  }
                `}
              >
                <div
                  className={`
                    shrink-0 w-4 h-4 rounded-full transition-colors
                    ${isSelected
                      ? "bg-paper"
                      : "bg-transparent ring-1 ring-line-strong"
                    }
                  `}
                >
                  {isSelected && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-ink" />
                    </div>
                  )}
                </div>
                <p
                  className={`font-mono text-[10px] tracking-widest uppercase ${
                    isSelected ? "text-white/60" : "text-fg-muted"
                  }`}
                >
                  {u.label}
                </p>
                <p
                  className={`text-base font-medium tracking-tight ${
                    isSelected ? "text-paper" : "text-ink"
                  }`}
                >
                  {u.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
