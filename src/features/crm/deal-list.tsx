/**
 * DealList — vista lista densa del pipeline.
 *
 * Segun BLUEPRINT_ERP_REDISIGN.md §6.3:
 * - Filtros: "Mis deals", "Por cerrar este mes", "Estancados >7d", "Alta probabilidad"
 * - Columnas: deal + cuenta + valor + probabilidad + proximo paso + score + owner + dias + ultima actividad
 * - Densidad: alta (compacta)
 * - Bulk actions contextuales
 */

"use client";

import * as React from "react";
import { Search, Mail, Phone, Bell, Archive } from "lucide-react";
import {
  DataList,
  FilterBar,
  BulkActionBar,
  StatusPill,
  StatusDot,
  EmptyState,
  type DataListColumn,
  type FilterField,
  type FilterValue,
  type SavedView,
  type StatusVariant,
} from "@/erp/components/data-list";
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

const FILTER_FIELDS: FilterField[] = [
  {
    id: "stage",
    label: "Etapa",
    type: "select",
    options: Object.entries(STAGE_LABELS).map(([id, label]) => ({
      id,
      label,
    })),
  },
  {
    id: "accountName",
    label: "Cuenta",
    type: "text",
  },
  {
    id: "amount",
    label: "Monto",
    type: "number",
  },
  {
    id: "daysInStage",
    label: "Dias en etapa",
    type: "number",
  },
];

const SAVED_VIEWS: SavedView[] = [
  { id: "all", label: "Todos", filters: [] },
  { id: "active", label: "Activos", filters: [] },
  { id: "stalled", label: "Estancados >7d", filters: [] },
];

const formatCop = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export interface DealListProps {
  deals: Deal[];
  isLoading?: boolean;
  error?: Error | null;
  search: string;
  onSearchChange: (v: string) => void;
  filters: FilterValue[];
  onFiltersChange: (f: FilterValue[]) => void;
  activeView: string;
  onSelectView: (id: string) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onSelectDeal: (id: string) => void;
}

export function DealList({
  deals,
  isLoading,
  error,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  activeView,
  onSelectView,
  selectedIds,
  onSelectionChange,
  onSelectDeal,
}: DealListProps) {
  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return deals.filter((d) => {
      if (q && !d.accountName.toLowerCase().includes(q)) return false;
      // Saved view shortcuts
      if (activeView === "active" && (d.status === "CONVERTIDO" || d.status === "RECHAZADO")) {
        return false;
      }
      if (activeView === "stalled" && d.daysInStage < 7) {
        return false;
      }

      // Filters
      return filters.every((f) => {
        if (f.field === "stage" && f.value) {
          return d.status === f.value;
        }
        if (f.field === "accountName" && f.value) {
          return d.accountName.toLowerCase().includes(f.value.toLowerCase());
        }
        if (f.field === "amount" && f.value) {
          return d.amount > Number(f.value);
        }
        if (f.field === "daysInStage" && f.value) {
          return d.daysInStage > Number(f.value);
        }
        return true;
      });
    });
  }, [deals, search, filters, activeView]);

  const columns: DataListColumn[] = [
    {
      id: "accountName",
      header: "Deal",
      width: "minmax(220px, 1.6fr)",
    },
    {
      id: "stage",
      header: "Etapa",
      width: "120px",
    },
    {
      id: "amount",
      header: "Valor",
      width: "140px",
      align: "right",
      mono: true,
    },
    {
      id: "nextStep",
      header: "Proximo paso",
      width: "minmax(0, 1.4fr)",
      hideOnMobile: true,
    },
    {
      id: "owner",
      header: "Owner",
      width: "60px",
      align: "center",
      hideOnMobile: true,
    },
    {
      id: "daysInStage",
      header: "Edad",
      width: "70px",
      align: "right",
      mono: true,
    },
  ];

  const renderCell = (deal: Deal, column: DataListColumn) => {
    switch (column.id) {
      case "accountName":
        return (
          <span className="inline-flex items-center gap-2 min-w-0">
            <StatusDot
              variant={STAGE_VARIANT[STATUS_TO_STAGE[deal.status] || "PROSPECTO"]}
              size="sm"
            />
            <span className="font-semibold text-ink truncate">
              {deal.accountName}
            </span>
          </span>
        );
      case "stage":
        return (
          <StatusPill
            variant={STAGE_VARIANT[STATUS_TO_STAGE[deal.status] || "PROSPECTO"]}
            label={STAGE_LABELS[STATUS_TO_STAGE[deal.status] || "PROSPECTO"]}
          />
        );
      case "amount":
        return (
          <span className="text-ink font-semibold">
            {formatCop(deal.amount)}
          </span>
        );
      case "nextStep":
        return (
          <span className="text-[12px] text-ink-soft italic">
            {deal.daysInStage > 7
              ? `Estancado hace ${deal.daysInStage}d — necesita atencion`
              : "—"}
          </span>
        );
      case "owner":
        return (
          <span
            className="inline-flex shrink-0 items-center justify-center h-6 w-6 rounded-full border border-line bg-bg-base font-mono text-[10px] text-ink-soft"
            title={deal.ownerName || deal.ownerInitials}
          >
            {deal.ownerInitials}
          </span>
        );
      case "daysInStage":
        return (
          <span
            className={cn(
              "text-[12px]",
              deal.daysInStage > 7 ? "text-state-warning" : "text-ink-muted"
            )}
          >
            {deal.daysInStage}d
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted"
          strokeWidth={1.5}
          aria-hidden
        />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar cuenta…"
          className={cn(
            "w-full h-9 pl-9 pr-3",
            "rounded-lg border border-line bg-bg-elevated-1",
            "text-[13px] text-ink placeholder:text-ink-muted",
            "focus:outline-none focus:border-line-strong focus:ring-2 focus:ring-primary/20",
            "transition-colors duration-[var(--motion-fast)] ease-erp"
          )}
        />
      </div>

      <FilterBar
        fields={FILTER_FIELDS}
        filters={filters}
        onFiltersChange={onFiltersChange}
        savedViews={SAVED_VIEWS}
        activeViewId={activeView}
        onSelectView={onSelectView}
      />

      <BulkActionBar
        count={selectedIds.length}
        onClear={() => onSelectionChange([])}
        actions={[
          {
            id: "email",
            label: "Email",
            icon: Mail,
            onClick: () => console.log("email", selectedIds),
          },
          {
            id: "call",
            label: "Llamar",
            icon: Phone,
            onClick: () => console.log("call", selectedIds),
          },
          {
            id: "remind",
            label: "Recordatorio",
            icon: Bell,
            onClick: () => console.log("remind", selectedIds),
          },
          {
            id: "archive",
            label: "Archivar",
            icon: Archive,
            onClick: () => console.log("archive", selectedIds),
          },
        ]}
      />

      <DataList
        items={filtered}
        columns={columns}
        getId={(d) => d.id}
        renderCell={renderCell}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
        onRowClick={(d) => onSelectDeal(d.id)}
        isLoading={isLoading}
        error={error ?? undefined}
        emptyState={
          <EmptyState
            title={
              search || filters.length > 0
                ? "Sin resultados"
                : "Aun no tienes deals en el pipeline"
            }
            description={
              search || filters.length > 0
                ? "Ajusta los filtros o intenta otra busqueda."
                : "Cuando califiques el primer lead, aparecera aca."
            }
          />
        }
      />

      <p className="text-[12px] text-ink-muted font-mono">
        Mostrando {filtered.length} de {deals.length} deals
      </p>
    </div>
  );
}
