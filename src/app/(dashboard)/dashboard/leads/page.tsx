/**
 * /dashboard/leads — CRM rediseñado (Ola 4).
 *
 * Redisenado segun BLUEPRINT_ERP_REDESIGN.md §6:
 * - 3 vistas: Pipeline (Kanban), Lista (densa), Inbox (leads entrantes)
 * - Pipeline: 5 columnas con quick-add, deal score, total por stage
 * - Lista: master-detail con DataList + DealDetail
 * - Inbox: leads con score CALIENTE/TIBIO/FRIO/SPAM
 * - DealDetail: split-view con stage progression (1-5 shortcuts)
 */

"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Plus, LayoutGrid, Rows3, Inbox } from "lucide-react";
import { Button } from "@/platform/ui/button";
import { Spinner } from "@/platform/ui/spinner";
import { getLeads as getLeadsEpr, type LeadRow } from "@/erp/actions/leads-erp";
import { getUserRole } from "@/platform/users/users";;
import { canPerform } from "@/lib/role-permissions";
import { getErpBrowserClient } from "@/platform/auth/clients";

const supabase = getErpBrowserClient();
import {
  Sheet,
  SheetContent,
} from "@/platform/ui/sheet";
import {
  DealPipeline,
  DealList,
  DealDetail,
  LeadInbox,
  type Deal,
  type DealStage,
  type LeadInboxItem,
  type LeadRisk,
} from "@/features/crm";
import { cn } from "@/platform/utils/cn";
import type { FilterValue } from "@/erp/components/data-list";

type CrmView = "pipeline" | "list" | "inbox";

const STATUS_TO_STAGE: Record<string, DealStage> = {
  NUEVO: "PROSPECTO",
  EN_SEGUIMIENTO: "CALIFICADO",
  CALIFICADO: "PROPUESTA",
  CONVERTIDO: "GANADO",
  RECHAZADO: "PERDIDO",
};

/**
 * Mock de monto por lead basado en el score (mientras el backend
 * no exponga el valor estimado en el endpoint).
 */
function mockAmountFor(lead: LeadRow): number {
  // Si tiene diagnostic con estimated_price_max_cop, usarlo.
  if (lead.diagnostic?.estimated_price_max_cop) {
    return Number(lead.diagnostic.estimated_price_max_cop);
  }
  // Si no, derivar del score (1K-100K COP).
  const base = lead.score * 1000 + 5000;
  return Math.round(base / 1000) * 1000;
}

function mockDaysInStage(lead: LeadRow): number {
  try {
    const created = new Date(lead.created_at);
    const today = new Date();
    const days = Math.floor(
      (today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, days);
  } catch {
    return 0;
  }
}

/**
 * Calcula los dias desde creacion del lead (para el inbox).
 */
function leadDaysAgo(lead: LeadRow): number {
  return mockDaysInStage(lead);
}

/**
 * Convierte un LeadRow a LeadInboxItem (vista inbox).
 */
function leadToInboxItem(lead: LeadRow): LeadInboxItem {
  return {
    id: lead.id,
    leadCode: lead.lead_code,
    companyName: lead.client?.legal_name || "Sin empresa",
    contactName: lead.contact
      ? `${lead.contact.first_name} ${lead.contact.last_name || ""}`.trim()
      : "Sin contacto",
    contactEmail: lead.contact?.email || undefined,
    risk: (lead.risk_level as LeadRisk) || "TIBIO",
    score: lead.score || 0,
    source: lead.lead_source || "Web",
    serviceType: lead.diagnostic?.service_type,
    daysAgo: leadDaysAgo(lead),
  };
}

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  // === Data state ===
  const [leads, setLeads] = React.useState<LeadRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // === View state ===
  const [view, setView] = React.useState<CrmView>("pipeline");
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<FilterValue[]>([]);
  const [activeSavedView, setActiveSavedView] = React.useState("all");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [selectedDealId, setSelectedDealId] = React.useState<string | null>(null);

  // === Role (para P3 - permisos por accion) ===
  const [role, setRole] = React.useState<string | null>(null);
  React.useEffect(() => {
    async function loadRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userRole = await getUserRole(user.id);
        setRole(userRole);
      }
    }
    loadRole();
  }, []);

  // === Load ===
  const loadLeads = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLeadsEpr(tenantParam);
      setLeads(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
    } finally {
      setLoading(false);
    }
  }, [tenantParam]);

  React.useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // === Transform ===
  const deals: Deal[] = React.useMemo(
    () =>
      leads.map((lead) => ({
        id: lead.id,
        accountName: lead.client?.legal_name || "Sin nombre",
        amount: mockAmountFor(lead),
        status: lead.status,
        ownerInitials: "AP",
        ownerName: "Ana Perez",
        daysInStage: mockDaysInStage(lead),
      })),
    [leads]
  );

  const inboxLeads: LeadInboxItem[] = React.useMemo(
    () => leads.map(leadToInboxItem),
    [leads]
  );

  // === Selected deal ===
  const selectedDeal = React.useMemo(
    () => deals.find((d) => d.id === selectedDealId) || null,
    [deals, selectedDealId]
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-4 md:-m-6 lg:-m-8">
      {/* === Header === */}
      <div className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8 pb-4 border-b border-line">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Modulo de CRM
            </div>
            <h1 className="text-base font-mono uppercase tracking-widest font-bold text-ink">
              Pipeline Comercial
            </h1>
            <p className="text-xs text-ink-soft">
              Deals activos, leads entrantes y forecast trimestral.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button className="cursor-pointer">
              <Plus className="w-4 h-4" />
              Nuevo deal
            </Button>
          </div>
        </div>

        {/* === View tabs (pill bar) === */}
        <div
          role="tablist"
          aria-label="Vista de CRM"
          className="inline-flex items-center gap-1 mt-4 p-0.5 rounded-lg border border-line bg-bg-elevated-1"
        >
          <ViewTab
            active={view === "pipeline"}
            onClick={() => setView("pipeline")}
            icon={LayoutGrid}
            label="Pipeline"
            count={deals.filter((d) => d.status !== "CONVERTIDO" && d.status !== "RECHAZADO").length}
          />
          <ViewTab
            active={view === "list"}
            onClick={() => setView("list")}
            icon={Rows3}
            label="Lista"
            count={deals.length}
          />
          <ViewTab
            active={view === "inbox"}
            onClick={() => setView("inbox")}
            icon={Inbox}
            label="Inbox"
            count={inboxLeads.filter((l) => l.risk === "CALIENTE" || l.risk === "TIBIO").length}
          />
        </div>
      </div>

      {/* === Body === */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Spinner className="text-ink-muted mb-2 w-6 h-6" />
          <span className="text-[10px] uppercase font-mono tracking-widest text-ink-muted">
            Cargando pipeline...
          </span>
        </div>
      ) : (
        <>
          {view === "pipeline" && (
            <div className="flex-1 min-h-0 overflow-x-auto p-4 md:p-6 lg:p-8">
              <DealPipeline
                deals={deals}
                onSelectDeal={setSelectedDealId}
                onAddDeal={(stage) => console.log("add deal to", stage)}
              />
            </div>
          )}

          {view === "list" && (
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8">
              <DealList
                deals={deals}
                search={search}
                onSearchChange={setSearch}
                filters={filters}
                onFiltersChange={(f) => {
                  setFilters(f);
                  setActiveSavedView("custom");
                }}
                activeView={activeSavedView}
                onSelectView={setActiveSavedView}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onSelectDeal={setSelectedDealId}
                error={error}
              />
            </div>
          )}

          {view === "inbox" && (
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8">
              <LeadInbox
                leads={inboxLeads}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                onSelectLead={(id) => {
                  setSelectedDealId(id);
                  setView("list");
                }}
                onQualify={(ids) => console.log("qualify", ids)}
                onAssign={(ids) => console.log("assign", ids)}
                onArchive={(ids) => console.log("archive", ids)}
                onCreateDeal={(ids) => console.log("create deal", ids)}
                canDoLeads={canPerform(role, "leads")}
                error={error}
              />
            </div>
          )}

          {/* Drawer / Sheet modal lateral para detalle de deal */}
          <Sheet open={selectedDealId !== null} onOpenChange={(open) => { if (!open) setSelectedDealId(null); }}>
            <SheetContent className="overflow-y-auto w-full max-w-[80vw] sm:max-w-[700px] md:max-w-[800px] border-l border-border bg-card text-foreground p-0 shadow-2xl">
              {selectedDeal && (
                <DealDetail
                  deal={selectedDeal}
                  onClose={() => setSelectedDealId(null)}
                  onMoveToStage={(stage) => console.log("move to", stage)}
                  onMarkWon={() => console.log("won")}
                  onMarkLost={() => console.log("lost")}
                  onScheduleCall={() => console.log("schedule")}
                  onSendEmail={() => console.log("email")}
                />
              )}
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}

function ViewTab({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-8 px-3",
        "rounded-md",
        "text-[12px] font-medium whitespace-nowrap",
        "transition-colors duration-[var(--motion-fast)] ease-erp",
        "cursor-pointer",
        active
          ? "bg-accent text-ink"
          : "text-ink-soft hover:bg-accent/50 hover:text-ink"
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
      {label}
      <span
        className={cn(
          "font-mono text-[10px] px-1.5 py-0.5 rounded",
          active ? "bg-paper text-ink" : "bg-accent text-ink-muted"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function PipelineEmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <p className="text-[14px] text-ink-soft">
        Selecciona un deal para ver su detalle.
      </p>
      <p className="text-[12px] text-ink-muted mt-1.5 max-w-xs">
        El detalle muestra la etapa, valor, score, proximos pasos y actividad.
      </p>
    </div>
  );
}
