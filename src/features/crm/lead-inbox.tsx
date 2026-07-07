/**
 * LeadInbox — entrada de leads entrantes (del wizard, formulario web, etc).
 *
 * Segun BLUEPRINT_ERP_REDISIGN.md §6.6:
 * - Lista de leads con score CALIENTE / TIBIO / FRIO
 * - Acciones por lead: Calificar, Asignar a owner, Archivar
 * - Acciones en lote: calificar, asignar, archivar, crear deal
 *
 * Ola 4: lista + acciones. Integracion con el wizard real (origen
 * de los leads) es Ola 5+.
 */

"use client";

import * as React from "react";
import {
  Flame,
  Thermometer,
  Snowflake,
  AlertTriangle,
  ArrowRight,
  Check,
  X,
  UserPlus,
  Archive,
} from "lucide-react";
import {
  DataList,
  BulkActionBar,
  StatusPill,
  StatusDot,
  EmptyState,
  type DataListColumn,
  type StatusVariant,
} from "@/erp/components/data-list";
import { cn } from "@/platform/utils/cn";

export type LeadRisk = "CALIENTE" | "TIBIO" | "FRIO" | "SPAM";

export interface LeadInboxItem {
  id: string;
  leadCode: string;
  companyName: string;
  contactName: string;
  contactEmail?: string;
  risk: LeadRisk;
  score: number;
  source: string;
  serviceType?: string;
  daysAgo: number;
  ownerInitials?: string;
}

export interface LeadInboxProps {
  leads: LeadInboxItem[];
  isLoading?: boolean;
  error?: Error | null;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onSelectLead: (id: string) => void;
  onQualify?: (ids: string[]) => void;
  onAssign?: (ids: string[]) => void;
  onArchive?: (ids: string[]) => void;
  onCreateDeal?: (ids: string[]) => void;
  /**
   * Si true, el usuario puede ejecutar acciones sobre leads (matriz
   * RBAC: accion "leads"). Si es false o undefined, las bulk actions
   * no se muestran. Esto es una derivacion directa de la columna
   * "Visibilidad (UX)" de la matriz: solo Comercial (y Administrador)
   * tienen la accion "leads".
   */
  canDoLeads?: boolean;
}

const RISK_VARIANT: Record<LeadRisk, StatusVariant> = {
  CALIENTE: "danger",
  TIBIO: "warning",
  FRIO: "info",
  SPAM: "neutral",
};

const RISK_LABEL: Record<LeadRisk, string> = {
  CALIENTE: "Caliente",
  TIBIO: "Tibio",
  FRIO: "Frio",
  SPAM: "SPAM",
};

const RISK_ICON: Record<LeadRisk, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  CALIENTE: Flame,
  TIBIO: Thermometer,
  FRIO: Snowflake,
  SPAM: AlertTriangle,
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

function timeAgo(days: number): string {
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days}d`;
  if (days < 30) return `Hace ${Math.floor(days / 7)}sem`;
  return `Hace ${Math.floor(days / 30)}mes`;
}

export function LeadInbox({
  leads,
  isLoading,
  error,
  selectedIds,
  onSelectionChange,
  onSelectLead,
  onQualify,
  onAssign,
  onArchive,
  onCreateDeal,
  canDoLeads,
}: LeadInboxProps) {
  const [search, setSearch] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.companyName.toLowerCase().includes(q) ||
        l.contactName.toLowerCase().includes(q) ||
        l.leadCode.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const columns: DataListColumn[] = [
    {
      id: "leadCode",
      header: "Codigo",
      width: "130px",
      mono: true,
    },
    {
      id: "companyName",
      header: "Empresa",
      width: "minmax(200px, 1.6fr)",
    },
    {
      id: "contactName",
      header: "Contacto",
      width: "minmax(0, 1.4fr)",
      hideOnMobile: true,
    },
    {
      id: "risk",
      header: "Score",
      width: "110px",
    },
    {
      id: "source",
      header: "Origen",
      width: "100px",
      hideOnMobile: true,
    },
    {
      id: "daysAgo",
      header: "Edad",
      width: "70px",
      align: "right",
      mono: true,
    },
  ];

  const renderCell = (lead: LeadInboxItem, column: DataListColumn) => {
    switch (column.id) {
      case "leadCode":
        return (
          <span className="font-mono text-ink-soft">{lead.leadCode}</span>
        );
      case "companyName":
        return (
          <span className="inline-flex items-center gap-2 min-w-0">
            <StatusDot
              variant={RISK_VARIANT[lead.risk]}
              size="sm"
            />
            <span className="font-semibold text-ink truncate">
              {lead.companyName}
            </span>
          </span>
        );
      case "contactName":
        return (
          <div className="min-w-0">
            <p className="text-[13px] text-ink-soft truncate">
              {lead.contactName}
            </p>
            {lead.contactEmail && (
              <p className="text-[11px] text-ink-muted font-mono truncate">
                {lead.contactEmail}
              </p>
            )}
          </div>
        );
      case "risk":
        return (
          <div className="inline-flex items-center gap-1.5">
            <span
              className={cn(
                "font-mono text-[12px] font-semibold",
                lead.risk === "CALIENTE"
                  ? "text-state-danger"
                  : lead.risk === "TIBIO"
                  ? "text-state-warning"
                  : lead.risk === "FRIO"
                  ? "text-state-info"
                  : "text-ink-muted"
              )}
            >
              {lead.score}
            </span>
            <StatusPill
              variant={RISK_VARIANT[lead.risk]}
              label={RISK_LABEL[lead.risk]}
            />
          </div>
        );
      case "source":
        return (
          <span className="font-mono text-[11px] text-ink-soft">
            {lead.source}
          </span>
        );
      case "daysAgo":
        return (
          <span
            className={cn(
              "text-[12px]",
              lead.daysAgo > 3
                ? "text-state-warning"
                : lead.daysAgo > 7
                ? "text-state-danger"
                : "text-ink-muted"
            )}
          >
            {timeAgo(lead.daysAgo)}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar lead por empresa, contacto o codigo…"
          className={cn(
            "w-full h-9 pl-3 pr-3",
            "rounded-lg border border-line bg-bg-elevated-1",
            "text-[13px] text-ink placeholder:text-ink-muted",
            "focus:outline-none focus:border-line-strong focus:ring-2 focus:ring-primary/20",
            "transition-colors duration-[var(--motion-fast)] ease-erp"
          )}
        />
      </div>

      {canDoLeads && (
        <BulkActionBar
          count={selectedIds.length}
          onClear={() => onSelectionChange([])}
          actions={[
            {
              id: "qualify",
              label: "Calificar",
              icon: Check,
              onClick: () => onQualify?.(selectedIds),
            },
            {
              id: "assign",
              label: "Asignar",
              icon: UserPlus,
              onClick: () => onAssign?.(selectedIds),
            },
            {
              id: "create-deal",
              label: "Crear deal",
              icon: ArrowRight,
              onClick: () => onCreateDeal?.(selectedIds),
            },
            {
              id: "archive",
              label: "Archivar",
              icon: Archive,
              onClick: () => onArchive?.(selectedIds),
            },
          ]}
        />
      )}

      <DataList
        items={filtered}
        columns={columns}
        getId={(l) => l.id}
        renderCell={renderCell}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
        onRowClick={(l) => onSelectLead(l.id)}
        isLoading={isLoading}
        error={error ?? undefined}
        emptyState={
          <EmptyState
            title={search ? "Sin resultados" : "Inbox vacio"}
            description={
              search
                ? "Ajusta la busqueda."
                : "Cuando llegue un lead del wizard o formulario, aparecera aca."
            }
          />
        }
      />

      <p className="text-[12px] text-ink-muted font-mono">
        Mostrando {filtered.length} de {leads.length} leads
      </p>
    </div>
  );
}
