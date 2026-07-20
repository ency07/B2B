"use client";

import { Clock, CreditCard, MessageSquare, PlusCircle } from "lucide-react";
import { formatCurrency } from "@/portal/components/dashboard/usePortalClientState";
import type { PortalActiveSection } from "@/portal/components/dashboard/types";

interface MetricCardsProps {
  activeOtsCount: number;
  unpaidTotal: number;
  activeTicketsCount: number;
  openRequirementsCount: number;
  setActiveSection: (section: PortalActiveSection) => void;
}

export function MetricCards({
  activeOtsCount,
  unpaidTotal,
  activeTicketsCount,
  openRequirementsCount,
  setActiveSection,
}: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* OTs en producción */}
      <div
        onClick={() => setActiveSection("ots")}
        className="rounded-xl border border-border bg-card p-5 relative overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group"
      >
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-medium text-muted-foreground">OTs en producción</p>
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
            <Clock className="w-3.5 h-3.5 text-primary" />
          </div>
        </div>
        <p className="text-3xl font-bold text-foreground font-mono tabular-nums leading-none">{activeOtsCount}</p>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0" />
          {activeOtsCount === 1 ? "orden activa" : "órdenes activas"}
        </p>
      </div>

      {/* Saldo pendiente */}
      <div
        onClick={() => setActiveSection("invoices")}
        className={`rounded-xl border bg-card p-5 relative overflow-hidden hover:shadow-sm transition-all cursor-pointer group ${unpaidTotal > 0 ? "border-destructive/30 hover:border-destructive/50" : "border-border hover:border-emerald-500/40"}`}
      >
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-medium text-muted-foreground">Saldo pendiente</p>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${unpaidTotal > 0 ? "bg-destructive/10 group-hover:bg-destructive/20" : "bg-emerald-500/10 group-hover:bg-emerald-500/20"}`}>
            <CreditCard className={`w-3.5 h-3.5 ${unpaidTotal > 0 ? "text-destructive" : "text-emerald-500"}`} />
          </div>
        </div>
        <p className={`text-3xl font-bold font-mono tabular-nums leading-none ${unpaidTotal > 0 ? "text-destructive" : "text-emerald-500"}`}>
          {formatCurrency(unpaidTotal)}
        </p>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${unpaidTotal > 0 ? "bg-destructive" : "bg-emerald-500"}`} />
          {unpaidTotal > 0 ? "facturas por pagar" : "cuenta al día"}
        </p>
      </div>

      {/* Tickets de soporte */}
      <div
        onClick={() => setActiveSection("tickets")}
        className={`rounded-xl border bg-card p-5 relative overflow-hidden hover:shadow-sm transition-all cursor-pointer group ${activeTicketsCount > 0 ? "border-amber-500/30 hover:border-amber-500/50" : "border-border hover:border-border/80"}`}
      >
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-medium text-muted-foreground">Tickets de soporte</p>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${activeTicketsCount > 0 ? "bg-amber-500/10 group-hover:bg-amber-500/20" : "bg-muted"}`}>
            <MessageSquare className={`w-3.5 h-3.5 ${activeTicketsCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
          </div>
        </div>
        <p className="text-3xl font-bold text-foreground font-mono tabular-nums leading-none">{activeTicketsCount}</p>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${activeTicketsCount > 0 ? "bg-amber-500" : "bg-muted-foreground/40"}`} />
          {activeTicketsCount > 0 ? "casos abiertos" : "sin casos activos"}
        </p>
      </div>

      {/* Requerimientos activos */}
      <div
        onClick={() => setActiveSection("requirements")}
        className={`rounded-xl border bg-card p-5 relative overflow-hidden hover:shadow-sm transition-all cursor-pointer group ${openRequirementsCount > 0 ? "border-primary/30 hover:border-primary/50" : "border-border hover:border-border/80"}`}
      >
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-medium text-muted-foreground">Requerimientos</p>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${openRequirementsCount > 0 ? "bg-primary/10 group-hover:bg-primary/20" : "bg-muted"}`}>
            <PlusCircle className={`w-3.5 h-3.5 ${openRequirementsCount > 0 ? "text-primary" : "text-muted-foreground"}`} />
          </div>
        </div>
        <p className="text-3xl font-bold text-foreground font-mono tabular-nums leading-none">{openRequirementsCount}</p>
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${openRequirementsCount > 0 ? "bg-primary" : "bg-muted-foreground/40"}`} />
          {openRequirementsCount > 0 ? "solicitudes activas" : "sin solicitudes"}
        </p>
      </div>
    </div>
  );
}
