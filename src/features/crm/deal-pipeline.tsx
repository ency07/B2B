/**
 * DealPipeline — vista Kanban del pipeline comercial.
 *
 * Segun BLUEPRINT_ERP_REDISIGN.md §6:
 * - 5 columnas (Prospecto, Calificado, Propuesta, Ganado, Perdido)
 * - Header de columna: dot de stage + nombre + count + suma total
 * - Tarjetas: nombre cuenta + valor mono + owner + dias en stage
 * - Quick-add en la ultima fila de cada columna (+ Nuevo deal)
 * - Stages (mapeo desde status del lead):
 *   Prospecto   <- NUEVO
 *   Calificado  <- EN_SEGUIMIENTO
 *   Propuesta   <- CALIFICADO
 *   Ganado      <- CONVERTIDO
 *   Perdido     <- RECHAZADO
 */

"use client";

import * as React from "react";
import { Plus, MoreHorizontal } from "lucide-react";
import { StatusDot, type StatusVariant } from "@/erp/components/data-list/status-dot";
import { cn } from "@/platform/utils/cn";

export type DealStage =
  | "PROSPECTO"
  | "CALIFICADO"
  | "PROPUESTA"
  | "GANADO"
  | "PERDIDO";

export interface Deal {
  id: string;
  /** Nombre de la cuenta. */
  accountName: string;
  /** Valor estimado. */
  amount: number;
  /** Status interno (mapeado a stage). */
  status: string;
  /** Owner del deal. */
  ownerInitials: string;
  /** Owner nombre (para tooltip). */
  ownerName?: string;
  /** Dias en el stage actual. */
  daysInStage: number;
  /** Iniciales del avatar (alternativa al owner). */
  accountInitials?: string;
}

export interface DealPipelineProps {
  deals: Deal[];
  onSelectDeal: (id: string) => void;
  onAddDeal: (stage: DealStage) => void;
  onMoveDeal?: (dealId: string, fromStage: DealStage, toStage: DealStage) => void;
  className?: string;
}

const STAGE_ORDER: DealStage[] = [
  "PROSPECTO",
  "CALIFICADO",
  "PROPUESTA",
  "GANADO",
  "PERDIDO",
];

const STAGE_LABELS: Record<DealStage, string> = {
  PROSPECTO: "Prospecto",
  CALIFICADO: "Calificado",
  PROPUESTA: "Propuesta",
  GANADO: "Ganado",
  PERDIDO: "Perdido",
};

const STAGE_VARIANT: Record<DealStage, StatusVariant> = {
  PROSPECTO: "info",
  CALIFICADO: "info",
  PROPUESTA: "warning",
  GANADO: "success",
  PERDIDO: "danger",
};

const STAGE_TO_STATUS: Record<DealStage, string> = {
  PROSPECTO: "NUEVO",
  CALIFICADO: "EN_SEGUIMIENTO",
  PROPUESTA: "CALIFICADO",
  GANADO: "CONVERTIDO",
  PERDIDO: "RECHAZADO",
};

const formatCop = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export function DealPipeline({
  deals,
  onSelectDeal,
  onAddDeal,
  className,
}: DealPipelineProps) {
  const dealsByStage = React.useMemo(() => {
    const map: Record<DealStage, Deal[]> = {
      PROSPECTO: [],
      CALIFICADO: [],
      PROPUESTA: [],
      GANADO: [],
      PERDIDO: [],
    };
    for (const d of deals) {
      const stage = (Object.keys(STAGE_TO_STATUS) as DealStage[]).find(
        (s) => STAGE_TO_STATUS[s] === d.status
      );
      if (stage) map[stage].push(d);
    }
    return map;
  }, [deals]);

  return (
    <div
      className={cn(
        "flex gap-4 overflow-x-auto pb-2",
        "snap-x snap-mandatory md:snap-none",
        className
      )}
    >
      {STAGE_ORDER.map((stage) => {
        const stageDeals = dealsByStage[stage];
        const totalAmount = stageDeals.reduce((s, d) => s + d.amount, 0);
        const variant = STAGE_VARIANT[stage];

        return (
          <div
            key={stage}
            className={cn(
              "shrink-0 w-[280px] md:w-auto md:flex-1 md:min-w-0",
              "snap-start"
            )}
          >
            <Column
              stage={stage}
              deals={stageDeals}
              totalAmount={totalAmount}
              variant={variant}
              onSelectDeal={onSelectDeal}
              onAddDeal={onAddDeal}
            />
          </div>
        );
      })}
    </div>
  );
}

interface ColumnProps {
  stage: DealStage;
  deals: Deal[];
  totalAmount: number;
  variant: StatusVariant;
  onSelectDeal: (id: string) => void;
  onAddDeal: (stage: DealStage) => void;
}

function Column({
  stage,
  deals,
  totalAmount,
  variant,
  onSelectDeal,
  onAddDeal,
}: ColumnProps) {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between gap-2 px-3 py-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <StatusDot variant={variant} size="sm" />
          <span className="text-[12px] font-semibold text-ink truncate">
            {STAGE_LABELS[stage]}
          </span>
          <span className="font-mono text-[10px] text-ink-muted px-1.5 py-0.5 rounded bg-accent">
            {deals.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAddDeal(stage)}
            className="inline-flex items-center justify-center h-6 w-6 rounded-md text-ink-muted hover:text-ink hover:bg-accent transition-colors cursor-pointer"
            aria-label={`Agregar deal a ${STAGE_LABELS[stage]}`}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {deals.length > 0 && (
        <p className="font-mono text-[11px] text-ink-soft px-3 mb-2">
          {formatCop(totalAmount)}
        </p>
      )}

      <div className="flex-1 space-y-2 px-1">
        {deals.length === 0 ? (
          <button
            type="button"
            onClick={() => onAddDeal(stage)}
            className={cn(
              "w-full h-20 rounded-md",
              "border border-dashed border-line",
              "text-[11px] text-ink-muted",
              "hover:border-line-strong hover:text-ink-soft hover:bg-accent/30",
              "transition-colors duration-[var(--motion-fast)] ease-erp",
              "inline-flex items-center justify-center gap-1.5",
              "cursor-pointer"
            )}
          >
            <Plus className="h-3 w-3" strokeWidth={1.5} />
            Nuevo deal
          </button>
        ) : (
          deals.map((d) => (
            <DealCard key={d.id} deal={d} onClick={() => onSelectDeal(d.id)} />
          ))
        )}
      </div>
    </div>
  );
}

function DealCard({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group w-full text-left",
        "rounded-md border border-line bg-bg-elevated-1 p-3",
        "transition-all duration-[var(--motion-fast)] ease-erp",
        "hover:border-line-strong hover:depth-1-hover",
        "cursor-pointer"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-[13px] font-semibold text-ink leading-tight line-clamp-2">
          {deal.accountName}
        </h4>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 inline-flex items-center justify-center h-5 w-5 rounded text-ink-muted opacity-0 group-hover:opacity-100 hover:text-ink hover:bg-accent transition-all cursor-pointer"
          aria-label="Mas acciones"
        >
          <MoreHorizontal className="h-3 w-3" strokeWidth={1.5} />
        </button>
      </div>

      <p className="font-mono text-[14px] font-semibold text-ink mb-3">
        {formatCop(deal.amount)}
      </p>

      <div className="flex items-center gap-1.5 text-[10px] font-mono">
        <span
          className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-line bg-bg-base text-ink-soft"
          title={deal.ownerName || deal.ownerInitials}
        >
          {deal.ownerInitials}
        </span>
        {deal.daysInStage > 0 && (
          <span
            className={cn(
              deal.daysInStage > 7
                ? "text-state-warning"
                : "text-ink-muted"
            )}
          >
            {deal.daysInStage}d
          </span>
        )}
      </div>
    </button>
  );
}
