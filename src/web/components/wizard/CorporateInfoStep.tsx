 
/* eslint-disable react/jsx-no-comment-textnodes */
"use client";

import React from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import type { WizardFormState, WizardFormChangeHandler } from "./types";

interface CorporateInfoStepProps {
  form: WizardFormState;
  handleChange: WizardFormChangeHandler;
  errors: Record<string, string>;
  exampleDomain: string;
}

const CARGOS = [
  { value: "Director de Planta", label: "Director de Planta", scoring: "Alto" },
  { value: "Gerente de Mantenimiento", label: "Gerente de Mantenimiento", scoring: "Alto" },
  { value: "Supervisor de HVAC", label: "Supervisor HVAC", scoring: "Alto" },
  { value: "Ingeniero de Campo", label: "Ingeniero de Campo", scoring: "Medio" },
  { value: "Compras / Abastecimiento", label: "Compras / Abastecimiento", scoring: "Medio" },
  { value: "Otro", label: "Otro cargo", scoring: "Estándar" },
];

export function CorporateInfoStep({ form, handleChange, errors, exampleDomain }: CorporateInfoStepProps) {
  const isPublicEmail =
    form.email.includes("@gmail.com") ||
    form.email.includes("@hotmail.com") ||
    form.email.includes("@outlook.com") ||
    form.email.includes("@yahoo.com");

  return (
    <motion.div
      key="step3"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-16"
    >
      {/* === HEADER === */}
      <div>
        <p className="editorial-eyebrow mb-6">// 03 — Información corporativa</p>
        <h2 className="font-display text-4xl lg:text-5xl font-light text-ink tracking-[-0.03em] leading-[1.05] mb-6">
          Datos para la memoria
          <br />
          <span className="italic text-ink-soft">de preingeniería.</span>
        </h2>
        <p className="text-lg leading-[1.6] text-ink-soft font-sans max-w-3xl">
          Ingrese sus datos corporativos. Esta información se usa para la
          emisión del reporte técnico y la asignación del ingeniero
          responsable.
        </p>
      </div>

      {/* === Inputs grid 2×2 con padding generoso === */}
      <div>
        <p className="editorial-mono text-fg-muted mb-8">Datos de contacto</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="editorial-mono text-fg-muted mb-4 block">
              Nombre completo <span className="text-ink">*</span>
            </label>
            <input
              type="text"
              placeholder="Ing. Julio Gómez"
              value={form.nombre}
              onChange={(e) => handleChange("nombre", e.target.value)}
              className="w-full h-14 px-5 bg-paper-warm border-0 text-ink text-base placeholder:text-fg-muted focus:bg-paper focus:ring-1 focus:ring-ink focus:outline-none transition-colors font-sans"
            />
            {errors.nombre && (
              <p className="mt-3 font-mono text-[10px] text-[var(--ds-c-wizard-corporate-info-error-foreground)] tracking-wide">
                {errors.nombre}
              </p>
            )}
          </div>

          <div>
            <label className="editorial-mono text-fg-muted mb-4 block">
              Razón social <span className="text-ink">*</span>
            </label>
            <input
              type="text"
              placeholder="Acerías del Caribe S.A."
              value={form.empresa}
              onChange={(e) => handleChange("empresa", e.target.value)}
              className="w-full h-14 px-5 bg-paper-warm border-0 text-ink text-base placeholder:text-fg-muted focus:bg-paper focus:ring-1 focus:ring-ink focus:outline-none transition-colors font-sans"
            />
            {errors.empresa && (
              <p className="mt-3 font-mono text-[10px] text-[var(--ds-c-wizard-corporate-info-error-foreground)] tracking-wide">
                {errors.empresa}
              </p>
            )}
          </div>

          <div>
            <label className="editorial-mono text-fg-muted mb-4 block">
              NIT / RUC <span className="text-fg-muted normal-case">(opcional)</span>
            </label>
            <input
              type="text"
              placeholder="900.123.456-7"
              value={form.taxId}
              onChange={(e) => handleChange("taxId", e.target.value)}
              className="w-full h-14 px-5 bg-paper-warm border-0 text-ink text-base placeholder:text-fg-muted focus:bg-paper focus:ring-1 focus:ring-ink focus:outline-none transition-colors font-sans font-mono"
            />
          </div>

          <div>
            <label className="editorial-mono text-fg-muted mb-4 block">
              Email corporativo <span className="text-ink">*</span>
            </label>
            <input
              type="email"
              placeholder={`j.gomez@${exampleDomain}`}
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full h-14 px-5 bg-paper-warm border-0 text-ink text-base placeholder:text-fg-muted focus:bg-paper focus:ring-1 focus:ring-ink focus:outline-none transition-colors font-sans"
            />
            {errors.email && (
              <p className="mt-3 font-mono text-[10px] text-[var(--ds-c-wizard-corporate-info-error-foreground)] tracking-wide">
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label className="editorial-mono text-fg-muted mb-4 block">
              Teléfono corporativo <span className="text-ink">*</span>
            </label>
            <input
              type="tel"
              placeholder="312 345 6789"
              value={form.telefono}
              onChange={(e) => handleChange("telefono", e.target.value)}
              className="w-full h-14 px-5 bg-paper-warm border-0 text-ink text-base placeholder:text-fg-muted focus:bg-paper focus:ring-1 focus:ring-ink focus:outline-none transition-colors font-sans font-mono"
            />
            {errors.telefono && (
              <p className="mt-3 font-mono text-[10px] text-[var(--ds-c-wizard-corporate-info-error-foreground)] tracking-wide">
                {errors.telefono}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* === Cargos profesionales con padding === */}
      <div>
        <p className="editorial-mono text-fg-muted mb-8">Cargo profesional</p>
        <div className="grid gap-4 sm:grid-cols-3">
          {CARGOS.map((c) => {
            const isSelected = form.cargo === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => handleChange("cargo", c.value)}
                className={`
                  text-left p-6 transition-colors min-h-[110px] flex flex-col justify-center
                  ${isSelected ? "bg-ink text-paper" : "bg-paper-warm hover:bg-paper"}
                `}
              >
                <p
                  className={`font-mono text-[10px] tracking-widest uppercase mb-2 ${
                    isSelected ? "text-white/60" : "text-fg-muted"
                  }`}
                >
                  Scoring {c.scoring}
                </p>
                <p
                  className={`text-base font-medium tracking-tight ${
                    isSelected ? "text-paper" : "text-ink"
                  }`}
                >
                  {c.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {isPublicEmail && (
        <div className="border-l-2 border-[var(--ds-c-wizard-corporate-info-warning-border)] bg-[color-mix(in srgb,var(--ds-c-wizard-corporate-info-warning-background) 5%,transparent)] p-6 flex items-start gap-4">
          <AlertTriangle
            className="w-4 h-4 text-[var(--ds-c-wizard-corporate-info-warning-icon)] mt-0.5 shrink-0"
            strokeWidth={1.5}
          />
          <div>
            <p className="text-base font-medium text-ink mb-2">
              Dominio de email público detectado
            </p>
            <p className="text-sm text-ink-soft leading-[1.6] font-sans">
              Se aplicará un score penalizado para la asignación en el
              pipeline comercial. Recomendamos usar un email corporativo
              para acelerar la respuesta.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
