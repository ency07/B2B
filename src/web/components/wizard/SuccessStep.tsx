"use client";

import React from "react";
import { FileCheck, Download, Send } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ROUTES } from "@/lib/routes";
import type { WizardResult } from "@/web/actions/wizard";
import type { WizardFormState } from "./types";

interface SuccessStepProps {
  form: WizardFormState;
  result: WizardResult;
  siteName: string;
  primaryColor: string;
  generatePdfReport: () => void;
  getWhatsAppLink: () => string;
}

export function SuccessStep({
  form,
  result,
  siteName,
  primaryColor: _primaryColor,
  generatePdfReport,
  getWhatsAppLink,
}: SuccessStepProps) {
  return (
    <motion.div
      key="step5"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="py-16"
    >
      <div className="text-center max-w-3xl mx-auto">
        <div className="w-16 h-16 rounded-sm bg-ink text-paper flex items-center justify-center mx-auto mb-8">
          <FileCheck className="w-8 h-8" strokeWidth={1.5} />
        </div>

        <p className="editorial-eyebrow mb-6">{'// Preingeniería registrada'}</p>
        <h2 className="font-display text-4xl lg:text-5xl font-light text-ink tracking-[-0.03em] leading-[1.05] mb-6">
          Su solicitud ha sido
          <br />
          <span className="italic text-ink-soft">registrada correctamente.</span>
        </h2>
        <p className="text-lg leading-[1.6] text-ink-soft font-sans max-w-2xl mx-auto">
          Se ha generado su reporte de preingeniería. Un consultor técnico
          de {siteName} iniciará la validación comercial para contactarle en{" "}
          <span className="text-ink font-medium">{form.ciudad}</span>.
        </p>
      </div>

      {/* === Reporte con padding generoso === */}
      <div className="mt-16 max-w-3xl mx-auto bg-paper-warm">
        <div className="px-8 py-6 flex items-center justify-between">
          <p className="editorial-mono text-fg-muted">Reporte de preingeniería</p>
          <span className="font-mono text-[10px] tracking-widest text-fg-muted uppercase">
            {new Date().toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "2-digit" })}
          </span>
        </div>
        <div className="border-t border-line divide-y divide-line">
          <div className="px-8 py-5 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-widest text-fg-muted uppercase">
              Código diagnóstico
            </span>
            <span className="font-mono text-base font-medium text-ink tracking-tight">
              {result?.diagnosticCode}
            </span>
          </div>
          <div className="px-8 py-5 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-widest text-fg-muted uppercase">
              Caudal calculado
            </span>
            <span className="font-mono text-base font-medium text-ink tabular-nums">
              {result?.requiredCfm?.toLocaleString()} CFM{" "}
              <span className="text-fg-muted text-[10px] tracking-widest uppercase">
                {result?.cfmCategory}
              </span>
            </span>
          </div>
          <div className="px-8 py-5 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-widest text-fg-muted uppercase">
              Estudio de inversión
            </span>
            <span className="font-mono text-[10px] tracking-widest text-ink uppercase font-medium">
              Pendiente de inspección
            </span>
          </div>
        </div>
      </div>

      {/* === CTAs === */}
      <div className="mt-12 flex flex-col sm:flex-row gap-4 max-w-3xl mx-auto">
        <button
          type="button"
          onClick={generatePdfReport}
          className="group flex-1 inline-flex items-center justify-center gap-3 h-14 px-8 border border-ink text-ink text-base font-medium tracking-tight rounded-sm hover:bg-ink hover:text-paper transition-colors"
        >
          <Download className="w-4 h-4" strokeWidth={1.5} />
          <span>Descargar reporte PDF</span>
        </button>

        <a
          href={getWhatsAppLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex-1 inline-flex items-center justify-center gap-3 h-14 px-8 bg-ink text-paper text-base font-medium tracking-tight rounded-sm hover:bg-ink-soft transition-colors"
        >
          <Send className="w-4 h-4" strokeWidth={1.5} />
          <span>Enviar por WhatsApp</span>
        </a>
      </div>

      <div className="mt-16 pt-10 text-center">
        <Link
          href={ROUTES.HOME}
          className="font-mono text-[11px] tracking-widest text-fg-muted hover:text-ink uppercase transition-colors"
        >
          ← Volver al sitio
        </Link>
      </div>
    </motion.div>
  );
}
