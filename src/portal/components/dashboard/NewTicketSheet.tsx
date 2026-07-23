"use client";

import { Sheet, SheetContent, SheetClose } from "@/platform/ui/sheet";
import { Input } from "@/platform/ui/input";
import { Button } from "@/platform/ui/button";
import type { PortalOt } from "@/portal/components/dashboard/types";

interface NewTicketSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ots: PortalOt[];
  newTicketOt: string;
  setNewTicketOt: (v: string) => void;
  newTicketSeverity: string;
  setNewTicketSeverity: (v: string) => void;
  newTicketSubject: string;
  setNewTicketSubject: (v: string) => void;
  newTicketDesc: string;
  setNewTicketDesc: (v: string) => void;
  isCreatingTicket: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

const SEVERITIES = [
  { v: "BAJO", label: "Baja", sub: "Duda o consulta" },
  { v: "MEDIO", label: "Media", sub: "Ajuste menor" },
  { v: "ALTO", label: "Alta", sub: "Falla o vibración" },
];

export function NewTicketSheet({
  open,
  onOpenChange,
  ots,
  newTicketOt,
  setNewTicketOt,
  newTicketSeverity,
  setNewTicketSeverity,
  newTicketSubject,
  setNewTicketSubject,
  newTicketDesc,
  setNewTicketDesc,
  isCreatingTicket,
  onSubmit,
}: NewTicketSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[440px] flex flex-col p-0 gap-0">
        <div className="h-1 bg-primary shrink-0" />
        <div className="px-6 py-5 border-b border-border shrink-0">
          <p className="text-base font-semibold text-foreground">Nuevo ticket de soporte</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tu ejecutivo técnico recibirá el caso al instante.
          </p>
        </div>
        <form onSubmit={onSubmit} className="flex-1 flex flex-col overflow-y-auto px-6 py-6 space-y-5">
          {ots.length > 0 && (
            <div className="space-y-1.5">
              <label htmlFor="tks-ot" className="text-xs font-semibold text-foreground block">OT relacionada <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <select
                id="tks-ot"
                value={newTicketOt}
                onChange={(e) => setNewTicketOt(e.target.value)}
                className="w-full bg-background border border-border text-foreground text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="">Sin OT asociada</option>
                {ots.map((ot) => (
                  <option key={ot.code} value={ot.code}>{ot.code} — {ot.title.substring(0, 35)}{ot.title.length > 35 ? "…" : ""}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground block">Criticidad</label>
            <div className="grid grid-cols-3 gap-2">
              {SEVERITIES.map((s) => (
                <button
                  key={s.v}
                  type="button"
                  onClick={() => setNewTicketSeverity(s.v)}
                  className={`flex flex-col items-start gap-0.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    newTicketSeverity === s.v
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className={`text-xs font-semibold ${newTicketSeverity === s.v ? "text-primary" : "text-foreground"}`}>{s.label}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{s.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tks-subject" className="text-xs font-semibold text-foreground block">Asunto <span className="text-destructive">*</span></label>
            <Input
              id="tks-subject"
              placeholder="Ej: Vibración excesiva en motor del extractor"
              value={newTicketSubject}
              onChange={(e) => setNewTicketSubject(e.target.value)}
              className="text-sm border-border bg-background"
              maxLength={250}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="tks-desc" className="text-xs font-semibold text-foreground block">Descripción <span className="text-destructive">*</span></label>
            <textarea
              id="tks-desc"
              rows={5}
              placeholder="Describe el incidente, cuándo ocurrió y qué has observado…"
              value={newTicketDesc}
              onChange={(e) => setNewTicketDesc(e.target.value)}
              className="w-full bg-background border border-border text-foreground text-sm rounded-lg p-3 focus:ring-1 focus:ring-primary focus:outline-none font-sans leading-relaxed resize-none transition-colors"
              maxLength={5000}
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-border mt-auto">
            <SheetClose asChild>
              <Button type="button" variant="outline" className="flex-1 text-sm cursor-pointer">
                Cancelar
              </Button>
            </SheetClose>
            <Button
              type="submit"
              disabled={isCreatingTicket}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium cursor-pointer disabled:opacity-60"
            >
              {isCreatingTicket ? "Registrando…" : "Enviar ticket"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
