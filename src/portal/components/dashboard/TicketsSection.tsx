"use client";

import { ShieldCheck, PlusCircle } from "lucide-react";
import { Button } from "@/platform/ui/button";
import { Badge } from "@/platform/ui/badge";
import type { PortalTicket } from "@/portal/components/dashboard/types";

interface TicketsSectionProps {
  tickets: PortalTicket[];
  onNewTicket: () => void;
}

export function TicketsSection({ tickets, onNewTicket }: TicketsSectionProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <p className="text-base font-semibold text-foreground">Soporte y Garantías</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Reporta incidentes, fallas o dudas técnicas. Tu ejecutivo responde directamente.
          </p>
        </div>
        <Button
          onClick={onNewTicket}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Nuevo ticket
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Sin tickets de soporte</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Si tienes una duda técnica, incidente o necesitas soporte de garantía, abre un ticket y tu ejecutivo lo atenderá.
            </p>
          </div>
          <Button
            onClick={onNewTicket}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium px-5 py-2 rounded-lg cursor-pointer"
          >
            Abrir primer ticket
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((tck) => (
            <div key={tck.code} className="border border-border/80 bg-background/55 p-4 rounded-xl space-y-2 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-primary">{tck.code}</span>
                <div className="flex gap-1.5">
                  <Badge className={`text-[8px] font-mono border-none ${
                    tck.severity === "ALTO" || tck.severity === "CRÍTICO" ? "bg-destructive/15 text-destructive" : tck.severity === "MEDIO" ? "bg-amber-500/15 text-amber-600" : "bg-primary/15 text-primary"
                  }`}>
                    {tck.severity}
                  </Badge>
                  <Badge className={`text-[8px] font-mono border-none ${
                    tck.status === "RESUELTO" ? "bg-emerald-500/15 text-emerald-500" : "bg-sky-500/15 text-sky-500"
                  }`}>
                    {tck.status}
                  </Badge>
                </div>
              </div>
              <p className="text-xs font-semibold text-foreground">{tck.subject}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{tck.desc}</p>
              <span className="text-[9px] font-mono text-muted-foreground block border-t border-border/40 pt-1.5 mt-1">
                {tck.otCode && `OT: ${tck.otCode} · `}Reportado: {tck.date}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
