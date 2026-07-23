"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, X, FileDown, Wrench, Check } from "lucide-react";
import { statusColor, type CapacityItem } from "./product-types";

/* === MODAL DE DETALLE TÉCNICO === */
export function TechnicalDetailModal({
  item,
  onClose,
  tenantCode,
}: {
  item: CapacityItem | null;
  onClose: () => void;
  tenantCode: string;
}) {
  React.useEffect(() => {
    if (!item) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  const accent = item ? statusColor[item.status] : "var(--ds-c-marketing-engineering-status-success)";

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-layer-sticky bg-ink/60 backdrop-blur-md"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 z-layer-modal w-full md:w-[85%] lg:w-[60%] xl:w-[55%] bg-paper border-l border-line flex flex-col overflow-hidden"
          >
            {/* === HEADER === */}
            <header className="sticky top-0 z-layer-content bg-paper border-b border-line px-8 lg:px-10 py-6 flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="font-mono text-[10px] tracking-widest text-fg-muted uppercase">
                    {item.code}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-line-strong" />
                  <span className="font-mono text-[10px] tracking-widest text-fg-muted uppercase">
                    {item.category}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-line-strong" />
                  <span className="font-mono text-[10px] tracking-widest uppercase font-medium" style={{ color: accent }}>
                    {item.status}
                  </span>
                </div>
                <h2 className="font-display text-3xl lg:text-4xl font-light text-ink tracking-[-0.025em] leading-[1.05] uppercase">
                  {item.name}
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="shrink-0 w-10 h-10 rounded-md flex items-center justify-center bg-paper-warm border border-line hover:bg-elev-3 transition-colors"
              >
                <X className="w-4 h-4 text-ink" strokeWidth={1.5} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto">
              {/* === HERO IMAGE === */}
              <div className="relative aspect-[16/9] bg-ink">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain p-12 photo-treated"
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-1/3"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 0%, rgba(7,9,12,0.6) 100%)",
                  }}
                />
                <div className="absolute bottom-6 left-8 lg:left-10 right-8 lg:right-10">
                  <p className="font-mono text-[10px] tracking-widest text-white/60 uppercase mb-2">
                    {item.projectRef}
                  </p>
                  <p className="font-display text-lg lg:text-xl italic font-light text-white/95 leading-snug max-w-2xl tracking-[-0.01em]">
                    {item.shortDescription}
                  </p>
                </div>
              </div>

              <div className="px-8 lg:px-10 py-10 space-y-12">
                {/* === TABLA DE ESPECIFICACIONES === */}
                <div>
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <p className="font-mono text-[10px] tracking-widest text-fg-muted uppercase mb-2">
                        — Especificaciones técnicas
                      </p>
                      <h3 className="font-display text-2xl lg:text-3xl font-light text-ink tracking-[-0.02em]">
                        Ficha técnica verificable
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] tracking-widest uppercase font-medium text-fg-muted">
                      {item.specs.length} parámetros
                    </span>
                  </div>

                  <div className="border border-line">
                    <div className="grid grid-cols-[2fr_2fr_1fr] bg-paper-warm border-b border-line">
                      <div className="p-4 font-mono text-[10px] tracking-widest text-fg-muted uppercase">
                        Parámetro
                      </div>
                      <div className="p-4 font-mono text-[10px] tracking-widest text-fg-muted uppercase border-l border-line">
                        Valor Registrado
                      </div>
                      <div className="p-4 font-mono text-[10px] tracking-widest text-fg-muted uppercase border-l border-line">
                        Cumplimiento
                      </div>
                    </div>
                    {item.specs.map((spec, idx) => (
                      <div
                        key={spec.parametro}
                        className={`grid grid-cols-[2fr_2fr_1fr] bg-paper ${
                          idx < item.specs.length - 1 ? "border-b border-line" : ""
                        }`}
                      >
                        <div className="p-4 text-sm text-ink font-sans">
                          {spec.parametro}
                        </div>
                        <div className="p-4 font-mono text-sm text-ink font-medium tabular-nums border-l border-line">
                          {spec.valor}
                        </div>
                        <div className="p-4 font-mono text-[10px] tracking-widest text-fg-muted uppercase border-l border-line flex items-center gap-1.5">
                          <Check className="w-3 h-3" style={{ color: accent }} strokeWidth={2} />
                          <span>{spec.cumplimiento}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* === APLICACIONES === */}
                {item.applications.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] tracking-widest text-fg-muted uppercase mb-4">
                      — Aplicaciones
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {item.applications.map((app) => (
                        <span
                          key={app}
                          className="px-3 py-1.5 bg-paper-warm border border-line text-sm text-ink font-sans"
                        >
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* === CERTIFICACIONES === */}
                <div>
                  <p className="font-mono text-[10px] tracking-widest text-fg-muted uppercase mb-4">
                    — Certificaciones
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line">
                    {item.certifications.map((cert) => (
                      <div
                        key={cert}
                        className="bg-paper p-4 flex flex-col items-start gap-1.5"
                      >
                        <Check
                          className="w-3.5 h-3.5 text-ink"
                          strokeWidth={2}
                        />
                        <span className="font-mono text-[11px] tracking-widest text-ink uppercase font-medium">
                          {cert}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* === FOOTER CON CTAs === */}
            <footer className="sticky bottom-0 z-layer-content bg-paper border-t border-line px-8 lg:px-10 py-5">
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <a
                  href={`/wizard?tenant=${tenantCode}&product=${item.code}`}
                  className="group inline-flex items-center justify-center gap-3 flex-1 h-12 px-6 bg-ink text-paper text-sm font-medium tracking-tight rounded-sm hover:bg-ink-soft transition-colors"
                >
                  <Wrench className="w-4 h-4" strokeWidth={1.5} />
                  <span>Solicitar Ingeniería · Cotizador</span>
                  <ArrowUpRight
                    className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={1.5}
                  />
                </a>
                <button
                  type="button"
                  aria-disabled="true"
                  title="Ficha técnica no disponible aún"
                  className="inline-flex items-center justify-center gap-3 h-12 px-6 border border-ink text-ink text-sm font-medium tracking-tight rounded-sm hover:bg-ink hover:text-paper transition-colors cursor-not-allowed"
                >
                  <FileDown className="w-4 h-4" strokeWidth={1.5} />
                  <span>Descargar Ficha Técnica</span>
                </button>
              </div>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
