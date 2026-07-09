/**
 * DealDetail — vista de un deal/oportunidad.
 *
 * Segun BLUEPRINT_ERP_REDISIGN.md §6.5:
 * - Header: nombre cuenta + status pill
 * - Body: meta (valor, etapa, owner) + acciones de etapa
 * - Acciones: Mover de etapa, Marcar ganado/perdido, Agendar, Email
 *
 * Ola 7: sin timeline (no hay endpoint de actividad del lead todavia).
 * Ola 7: atajos 1-5 sin accion hasta que updateLeadStatus este conectado.
 */

"use client";

import * as React from "react";
import {
  X,
  Calendar,
  Mail,
  ArrowRight,
  Check,
  XCircle,
} from "lucide-react";
import { StatusPill } from "@/erp/components/data-list/status-pill";
import type { StatusVariant } from "@/erp/components/data-list/status-dot";
import { Button } from "@/platform/ui/button";
import { cn } from "@/platform/utils/cn";
import type { Deal, DealStage } from "./deal-pipeline";

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

const STATUS_TO_STAGE: Record<string, DealStage> = {
  NUEVO: "PROSPECTO",
  EN_SEGUIMIENTO: "CALIFICADO",
  CALIFICADO: "PROPUESTA",
  CONVERTIDO: "GANADO",
  RECHAZADO: "PERDIDO",
};

const STAGE_ORDER: DealStage[] = [
  "PROSPECTO",
  "CALIFICADO",
  "PROPUESTA",
  "GANADO",
  "PERDIDO",
];

const formatCop = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export interface DealDetailProps {
  deal: Deal;
  onMoveToStage?: (stage: DealStage) => void;
  onMarkWon?: () => void;
  onMarkLost?: () => void;
  onScheduleCall?: () => void;
  onSendEmail?: () => void;
  onClose: () => void;
  className?: string;
}

export function DealDetail({
  deal,
  onMoveToStage,
  onMarkWon,
  onMarkLost,
  onScheduleCall,
  onSendEmail,
  onClose,
  className,
}: DealDetailProps) {
  const currentStage = STATUS_TO_STAGE[deal.status] || "PROSPECTO";
  const currentStageIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <div
      className={cn(
        "h-full flex flex-col",
        "border-l border-line bg-bg-elevated-1",
        className
      )}
    >
      <header className="sticky top-0 z-layer-content border-b border-line bg-bg-elevated-1 px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center h-6 w-6 rounded-md text-ink-muted hover:text-ink hover:bg-accent transition-colors cursor-pointer -ml-1.5"
                aria-label="Cerrar detalle"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                Deal
              </span>
            </div>
            <h2 className="text-[18px] font-semibold text-ink truncate">
              {deal.accountName}
            </h2>
          </div>
          <StatusPill
            variant={STAGE_VARIANT[currentStage]}
            label={STAGE_LABELS[currentStage]}
          />
        </div>

        <div className="flex items-baseline justify-between gap-3 pt-3 border-t border-line/50">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              Valor
            </p>
            <p className="font-mono text-[24px] font-semibold text-ink leading-none mt-1">
              {formatCop(deal.amount)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              En etapa
            </p>
            <p
              className={cn(
                "font-mono text-[14px] font-semibold leading-none mt-1",
                deal.daysInStage > 7 ? "text-state-warning" : "text-ink"
              )}
            >
              {deal.daysInStage}d
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-6">
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-3">
              Etapa
            </h3>
            <div className="flex items-stretch gap-1">
              {STAGE_ORDER.map((s, i) => {
                const isCurrent = i === currentStageIndex;
                const isPast = i < currentStageIndex;
                const variant = STAGE_VARIANT[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onMoveToStage?.(s)}
                    className={cn(
                      "flex-1 h-10 px-2",
                      "rounded-md",
                      "text-[11px] font-medium",
                      "transition-colors duration-[var(--motion-fast)] ease-erp",
                      "cursor-pointer",
                      "flex flex-col items-center justify-center gap-0.5",
                      isCurrent
                        ? variant === "success"
                          ? "bg-state-success text-state-success"
                          : variant === "danger"
                          ? "bg-state-danger text-state-danger"
                          : "bg-state-info text-state-info"
                        : isPast
                        ? "bg-accent/40 text-ink-soft"
                        : "bg-bg-base text-ink-muted hover:bg-accent"
                    )}
                    title={`Mover a ${STAGE_LABELS[s]}`}
                  >
                    <span className="truncate max-w-full">{STAGE_LABELS[s]}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-3">
              Informacion
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12px]">
              <div>
                <dt className="text-ink-muted">Owner</dt>
                <dd className="mt-1 inline-flex items-center gap-1.5">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full border border-line bg-bg-base font-mono text-[10px] text-ink-soft">
                    {deal.ownerInitials}
                  </span>
                  <span className="text-ink">{deal.ownerName || "Sin asignar"}</span>
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">Etapa actual</dt>
                <dd className="mt-1 text-ink">
                  {STAGE_LABELS[currentStage]}
                </dd>
              </div>
            </dl>
          </section>

          <section className="grid grid-cols-2 gap-2">
            {onScheduleCall && (
              <Button
                size="sm"
                variant="outline"
                onClick={onScheduleCall}
                className="justify-start"
              >
                <Calendar className="h-3.5 w-3.5" strokeWidth={1.5} />
                Agendar reunion
              </Button>
            )}
            {onSendEmail && (
              <Button
                size="sm"
                variant="outline"
                onClick={onSendEmail}
                className="justify-start"
              >
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                Enviar email
              </Button>
            )}
            {onMarkWon && (
              <Button
                size="sm"
                variant="default"
                onClick={onMarkWon}
                className="justify-start"
              >
                <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                Marcar ganado
              </Button>
            )}
            {onMarkLost && (
              <Button
                size="sm"
                variant="outline"
                onClick={onMarkLost}
                className="justify-start text-state-danger"
              >
                <XCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                Marcar perdido
              </Button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
