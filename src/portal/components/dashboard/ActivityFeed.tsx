"use client";

import { Clock, CreditCard, PlusCircle } from "lucide-react";
import type { PortalActiveSection, PortalOt, PortalInvoice } from "@/portal/components/dashboard/types";
import type { ClientRequirement } from "@/portal/actions/portal";

interface ActivityFeedProps {
  ots: PortalOt[];
  invoices: PortalInvoice[];
  requirements: ClientRequirement[];
  setActiveSection: (section: PortalActiveSection) => void;
}

export function ActivityFeed({ ots, invoices, requirements, setActiveSection }: ActivityFeedProps) {
  const hasActivity =
    ots.length > 0 || invoices.some((i) => i.status === "PENDIENTE") || requirements.some((r) => r.status === "NUEVO");

  if (!hasActivity) return null;

  const pendingInvoice = invoices.find((i) => i.status === "PENDIENTE");
  const newRequirement = requirements.find((r) => r.status === "NUEVO");

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider shrink-0 hidden sm:block">Reciente:</span>
      {ots[0] && (
        <button onClick={() => setActiveSection("ots")} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-background hover:bg-muted/40 text-xs transition-colors shrink-0 cursor-pointer">
          <Clock className="w-3 h-3 text-primary shrink-0" />
          <span className="font-mono font-medium">{ots[0].code}</span>
          <span className="text-muted-foreground text-[10px]">· {ots[0].status}</span>
        </button>
      )}
      {pendingInvoice && (
        <button onClick={() => setActiveSection("invoices")} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-destructive/30 bg-background hover:bg-destructive/5 text-xs transition-colors shrink-0 cursor-pointer">
          <CreditCard className="w-3 h-3 text-destructive shrink-0" />
          <span className="font-mono font-medium">{pendingInvoice.code}</span>
          <span className="text-destructive text-[10px]">· Pendiente</span>
        </button>
      )}
      {newRequirement && (
        <button onClick={() => setActiveSection("requirements")} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-primary/20 bg-background hover:bg-primary/5 text-xs transition-colors shrink-0 cursor-pointer">
          <PlusCircle className="w-3 h-3 text-primary shrink-0" />
          <span className="font-mono font-medium">{newRequirement.code}</span>
          <span className="text-muted-foreground text-[10px]">· Recibido</span>
        </button>
      )}
    </div>
  );
}
