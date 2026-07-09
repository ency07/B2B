"use client";

import * as React from "react";
import { CheckCircle2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { createClientRequirement, type ClientRequirement } from "@/portal/actions/portal";
import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import {
  Sheet,
  SheetContent,
  SheetClose,
} from "@/platform/ui/sheet";
import { capture } from "@/lib/analytics";

const CATEGORIES = [
  {
    value: "FABRICACION",
    label: "Fabricación de equipo nuevo",
    desc: "Diseño y fabricación de ventilador, extractor u otro equipo industrial a medida.",
  },
  {
    value: "VENTA",
    label: "Compra de producto en inventario",
    desc: "Adquisición de producto disponible en catálogo o stock estándar.",
  },
  {
    value: "MANTENIMIENTO",
    label: "Mantenimiento preventivo / correctivo",
    desc: "Servicio de mantenimiento a equipo ya instalado en planta.",
  },
  {
    value: "REPARACION",
    label: "Reparación de equipo",
    desc: "Diagnóstico y reparación de equipo con falla o fuera de operación.",
  },
  {
    value: "OTRO",
    label: "Otro",
    desc: "Cualquier otro requerimiento — detállalo en la descripción.",
  },
] as const;

const PRIORITIES = [
  {
    value: "LOW",
    label: "Sin urgencia",
    sub: "Tiempo flexible, sin fecha crítica",
  },
  {
    value: "MEDIUM",
    label: "Normal",
    sub: "Respuesta dentro de los próximos días",
  },
  {
    value: "HIGH",
    label: "Urgente",
    sub: "Requiero respuesta pronto / paralización de operaciones",
  },
] as const;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewClientId?: string | null;
  jobs: Array<{ code: string; title: string }>;
  onCreated: (req: ClientRequirement) => void;
}

export function NewRequirementSheet({
  open,
  onOpenChange,
  previewClientId,
  jobs,
  onCreated,
}: Props) {
  const [step, setStep] = React.useState<"form" | "success">("form");
  const [submitting, setSubmitting] = React.useState(false);
  const [createdReq, setCreatedReq] = React.useState<ClientRequirement | null>(null);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [priority, setPriority] = React.useState("MEDIUM");
  const [refJobCode, setRefJobCode] = React.useState("");
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const reset = () => {
    setStep("form");
    setTitle("");
    setDescription("");
    setCategory("");
    setPriority("MEDIUM");
    setRefJobCode("");
    setErrors({});
    setCreatedReq(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!category) errs.category = "Selecciona el tipo de servicio.";
    if (!title || title.trim().length < 5) errs.title = "El título debe tener al menos 5 caracteres.";
    if (!description || description.trim().length < 15)
      errs.description = "La descripción debe tener al menos 15 caracteres.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const finalDescription = refJobCode
        ? `${description.trim()}\n\n[OT de referencia: ${refJobCode}]`
        : description.trim();

      const req = await createClientRequirement(previewClientId, {
        title: title.trim(),
        description: finalDescription,
        category,
        priority,
      });

      capture("portal_requirement_created", {
        category,
        priority,
        code: req.code,
        hasRefJob: !!refJobCode,
      });

      setCreatedReq(req);
      setStep("success");
      onCreated(req);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-[520px] overflow-y-auto flex flex-col">
        <div className="pb-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground leading-tight">
                Nuevo requerimiento
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tu asesor técnico recibe la solicitud al instante.
              </p>
            </div>
          </div>
        </div>

        {/* ── FORM ─────────────────────────────────────────────────── */}
        {step === "form" && (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col py-6 space-y-7 overflow-y-auto">

            {/* Tipo de servicio */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Tipo de servicio <span className="text-destructive">*</span>
              </label>
              <div className="space-y-2">
                {CATEGORIES.map((cat) => {
                  const active = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => {
                        setCategory(cat.value);
                        setErrors((e) => ({ ...e, category: "" }));
                      }}
                      className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                          active ? "border-primary" : "border-muted-foreground/40"
                        }`}
                      >
                        {active && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${active ? "text-primary" : "text-foreground"}`}>
                          {cat.label}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {cat.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category}</p>
              )}
            </div>

            {/* Título */}
            <div className="space-y-2">
              <label htmlFor="req-title" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Título del requerimiento <span className="text-destructive">*</span>
              </label>
              <Input
                id="req-title"
                placeholder="Ej: Extractor axial 7,500 CFM para planta de producción"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((er) => ({ ...er, title: "" }));
                }}
                className="text-sm border-border bg-background"
                maxLength={250}
              />
              {errors.title ? (
                <p className="text-xs text-destructive">{errors.title}</p>
              ) : (
                <p className="text-xs text-muted-foreground text-right">{title.length}/250</p>
              )}
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <label htmlFor="req-desc" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Descripción detallada <span className="text-destructive">*</span>
              </label>
              <textarea
                id="req-desc"
                rows={4}
                placeholder="Especificaciones técnicas, condiciones de operación, caudal requerido, ubicación en planta, fecha estimada de instalación..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErrors((er) => ({ ...er, description: "" }));
                }}
                className="w-full bg-background border border-border text-foreground text-sm rounded-lg p-3 focus:ring-1 focus:ring-primary focus:outline-none font-sans leading-relaxed resize-none transition-colors"
                maxLength={5000}
              />
              {errors.description ? (
                <p className="text-xs text-destructive">{errors.description}</p>
              ) : (
                <p className="text-xs text-muted-foreground text-right">
                  {description.length}/5000{description.length < 15 && " (mín. 15)"}
                </p>
              )}
            </div>

            {/* Urgencia */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Nivel de urgencia
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRIORITIES.map((p) => {
                  const active = priority === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={`flex flex-col items-start gap-0.5 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/30 hover:bg-muted/20"
                      }`}
                    >
                      <span className={`text-xs font-semibold ${active ? "text-primary" : "text-foreground"}`}>
                        {p.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-tight">
                        {p.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OT de referencia (recompra / reorden) */}
            {jobs.length > 0 && (
              <div className="space-y-2">
                <label htmlFor="req-ref-ot" className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  ¿Basado en un equipo anterior?{" "}
                  <span className="text-muted-foreground font-normal normal-case">(opcional)</span>
                </label>
                <select
                  id="req-ref-ot"
                  value={refJobCode}
                  onChange={(e) => setRefJobCode(e.target.value)}
                  className="w-full bg-background border border-border text-foreground text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                >
                  <option value="">Ninguna — es un equipo nuevo</option>
                  {jobs.map((j) => (
                    <option key={j.code} value={j.code}>
                      {j.code} — {j.title.length > 45 ? j.title.substring(0, 45) + "…" : j.title}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground">
                  Referenciar una OT anterior agiliza el proceso de cotización.
                </p>
              </div>
            )}

            {/* Acciones */}
            <div className="flex gap-3 pt-2 border-t border-border mt-auto">
              <SheetClose asChild>
                <Button type="button" variant="outline" className="flex-1 text-sm cursor-pointer">
                  Cancelar
                </Button>
              </SheetClose>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium cursor-pointer disabled:opacity-60"
              >
                {submitting ? "Enviando…" : "Enviar requerimiento"}
              </Button>
            </div>
          </form>
        )}

        {/* ── SUCCESS ──────────────────────────────────────────────── */}
        {step === "success" && createdReq && (
          <div className="flex-1 flex flex-col items-center justify-center py-10 text-center space-y-6 px-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">¡Requerimiento registrado!</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Tu asesor técnico recibió la solicitud. Se pondrá en contacto para el siguiente paso.
              </p>
            </div>

            {/* Resumen del requerimiento */}
            <div className="w-full rounded-xl border border-border bg-muted/30 p-5 space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-mono">Código</span>
                <span className="text-sm font-bold text-primary font-mono">{createdReq.code}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-mono">Estado</span>
                <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full">
                  NUEVO
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-mono">Tipo</span>
                <span className="text-xs text-foreground">
                  {CATEGORIES.find((c) => c.value === createdReq.category)?.label ?? createdReq.category}
                </span>
              </div>
              <div className="border-t border-border pt-3 mt-1">
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {createdReq.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Haz seguimiento en la pestaña{" "}
              <strong className="text-foreground">Requerimientos</strong> de este portal.
            </p>

            <Button
              onClick={handleClose}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm cursor-pointer"
            >
              Listo
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
