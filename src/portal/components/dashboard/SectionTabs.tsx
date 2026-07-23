"use client";

import { Clock, PlusCircle, CreditCard, FileText, ShieldCheck, FileSignature } from "lucide-react";
import { capture } from "@/lib/analytics";
import type { PortalActiveSection } from "@/portal/components/dashboard/types";

interface SectionTabsProps {
  activeSection: PortalActiveSection;
  setActiveSection: (section: PortalActiveSection) => void;
  openRequirementsCount: number;
  pendingInvoicesCount: number;
  activeTicketsCount: number;
  pendingQuotesCount: number;
}

export function SectionTabs({
  activeSection,
  setActiveSection,
  openRequirementsCount,
  pendingInvoicesCount,
  activeTicketsCount,
  pendingQuotesCount,
}: SectionTabsProps) {
  const tabs = [
    { id: "ots" as const, label: "Taller en Vivo", Icon: Clock, badge: undefined as number | undefined },
    { id: "quotes" as const, label: "Cotizaciones", Icon: FileSignature, badge: pendingQuotesCount },
    { id: "requirements" as const, label: "Requerimientos", Icon: PlusCircle, badge: openRequirementsCount },
    { id: "invoices" as const, label: "Facturas y Pagos", Icon: CreditCard, badge: pendingInvoicesCount },
    { id: "docs" as const, label: "Documentos Técnicos", Icon: FileText, badge: undefined as number | undefined },
    { id: "tickets" as const, label: "Soporte y Garantías", Icon: ShieldCheck, badge: activeTicketsCount },
  ];

  return (
    <div role="tablist" className="flex border-b border-border pb-px overflow-x-auto gap-1">
      {tabs.map(({ id, label, Icon, badge }) => (
        <button
          key={id}
          role="tab"
          aria-selected={activeSection === id}
          onClick={() => { setActiveSection(id); capture("portal_tab_viewed", { tab: id }); }}
          className={`pb-3 px-4 text-sm font-medium border-b-2 tracking-normal transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeSection === id
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
          }`}
        >
          <Icon className="w-3.5 h-3.5 shrink-0" />
          {label}
          {badge !== undefined && badge > 0 && (
            <span className="ml-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
