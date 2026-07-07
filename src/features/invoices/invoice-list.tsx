/**
 * InvoiceList — lista premium de facturas con tabs pill.
 *
 * Segun BLUEPRINT_ERP_REDESIGN.md §10.2:
 * - Hero CashPulse (outstanding AR) arriba
 * - Tabs pill: Todas, Pendientes, Vencidas, Por vencer, Pagadas
 * - DataList con: factura (dot + code + client), monto (mono right), vence, estado
 * - Seleccion multiple con BulkActionBar
 *
 * Ola 3: la lista muestra todas las facturas del sistema. La conexion
 * a datos reales viene del backend (getInvoices). El "Pagar ahora"
 * del hero opera sobre la primera factura vencida (mock).
 */

"use client";

import * as React from "react";
import { Search, Mail, Download, Bell } from "lucide-react";
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

export type InvoiceStatus =
  | "BORRADOR"
  | "EMITIDA"
  | "PARCIALMENTE_PAGADA"
  | "PAGADA"
  | "ANULADA"
  | "VENCIDA";

export interface InvoiceListItem {
  id: string;
  code: string;
  clientName: string;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  issueDate: string; // YYYY-MM-DD
  dueDate?: string;
  daysOverdue?: number;
}

export interface InvoiceListProps {
  items: InvoiceListItem[];
  isLoading?: boolean;
  error?: Error | null;
  search: string;
  onSearchChange: (v: string) => void;
  filters: FilterValue[];
  onFiltersChange: (f: FilterValue[]) => void;
  activeTab: string;
  onSelectTab: (id: string) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onSelectInvoice: (id: string) => void;
  onCreate?: () => void;
}

const FILTER_FIELDS: FilterField[] = [
  {
    id: "status",
    label: "Estado",
    type: "select",
    options: [
      { id: "BORRADOR", label: "Borrador" },
      { id: "EMITIDA", label: "Emitida" },
      { id: "PARCIALMENTE_PAGADA", label: "Pago parcial" },
      { id: "VENCIDA", label: "Vencida" },
      { id: "PAGADA", label: "Pagada" },
      { id: "ANULADA", label: "Anulada" },
    ],
  },
  {
    id: "clientName",
    label: "Cliente",
    type: "text",
  },
  {
    id: "totalAmount",
    label: "Monto",
    type: "number",
  },
];

const SAVED_VIEWS: SavedView[] = [
  { id: "all", label: "Todas", filters: [] },
  {
    id: "pending",
    label: "Pendientes",
    filters: [
      { field: "status", operator: "is", value: "EMITIDA" },
    ],
  },
  {
    id: "overdue",
    label: "Vencidas",
    filters: [{ field: "status", operator: "is", value: "VENCIDA" }],
  },
  {
    id: "paid",
    label: "Pagadas",
    filters: [{ field: "status", operator: "is", value: "PAGADA" }],
  },
];

const statusToVariant: Record<InvoiceStatus, StatusVariant> = {
  BORRADOR: "neutral",
  EMITIDA: "info",
  PARCIALMENTE_PAGADA: "warning",
  PAGADA: "success",
  ANULADA: "danger",
  VENCIDA: "danger",
};

const statusToLabel: Record<InvoiceStatus, string> = {
  BORRADOR: "Borrador",
  EMITIDA: "Emitida",
  PARCIALMENTE_PAGADA: "Pago parcial",
  PAGADA: "Pagada",
  ANULADA: "Anulada",
  VENCIDA: "Vencida",
};

const formatCop = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return iso;
  }
}

export function InvoiceList({
  items,
  isLoading,
  error,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  activeTab,
  onSelectTab,
  selectedIds,
  onSelectionChange,
  onSelectInvoice,
  onCreate,
}: InvoiceListProps) {
  // Filtrar por tab + busqueda + filtros.
  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return items
      .filter((it) => {
        // Tab filter
        if (activeTab !== "all" && activeTab !== "custom") {
          if (activeTab === "pending" && it.status !== "EMITIDA" && it.status !== "PARCIALMENTE_PAGADA") {
            return false;
          }
          if (activeTab === "overdue" && it.status !== "VENCIDA") {
            return false;
          }
          if (activeTab === "paid" && it.status !== "PAGADA") {
            return false;
          }
          if (activeTab === "drafts" && it.status !== "BORRADOR") {
            return false;
          }
        }
        // Search
        if (q && !it.code.toLowerCase().includes(q) && !it.clientName.toLowerCase().includes(q)) {
          return false;
        }
        // Filters
        return filters.every((f) => {
          if (f.field === "status" && f.value) {
            return it.status === f.value;
          }
          if (f.field === "clientName" && f.value) {
            return it.clientName.toLowerCase().includes(f.value.toLowerCase());
          }
          if (f.field === "totalAmount" && f.value) {
            return it.totalAmount > Number(f.value);
          }
          return true;
        });
      });
  }, [items, search, filters, activeTab]);

  // Conteo por tab.
  const tabCounts = React.useMemo(() => {
    return {
      all: items.length,
      pending: items.filter(
        (i) => i.status === "EMITIDA" || i.status === "PARCIALMENTE_PAGADA"
      ).length,
      overdue: items.filter((i) => i.status === "VENCIDA").length,
      paid: items.filter((i) => i.status === "PAGADA").length,
      drafts: items.filter((i) => i.status === "BORRADOR").length,
    };
  }, [items]);

  const columns: DataListColumn[] = [
    {
      id: "code",
      header: "Factura",
      width: "minmax(0, 1fr)",
    },
    {
      id: "clientName",
      header: "Cliente",
      width: "minmax(0, 1fr)",
      hideOnMobile: true,
    },
    {
      id: "totalAmount",
      header: "Monto",
      width: "140px",
      align: "right",
      mono: true,
    },
    {
      id: "dueDate",
      header: "Vence",
      width: "100px",
      align: "right",
      mono: true,
    },
    {
      id: "status",
      header: "Estado",
      width: "130px",
    },
  ];

  const renderCell = (item: InvoiceListItem, column: DataListColumn) => {
    switch (column.id) {
      case "code":
        return (
          <span className="inline-flex items-center gap-2 min-w-0">
            <StatusDot
              variant={statusToVariant[item.status]}
              size="sm"
            />
            <span className="font-mono font-semibold text-ink truncate">
              {item.code}
            </span>
          </span>
        );
      case "clientName":
        return (
          <span className="text-[13px] text-ink-soft truncate">
            {item.clientName}
          </span>
        );
      case "totalAmount":
        return (
          <span className="text-ink font-semibold">
            {formatCop(item.totalAmount)}
          </span>
        );
      case "dueDate":
        if (!item.dueDate) {
          return <span className="text-ink-muted text-[12px]">—</span>;
        }
        if (item.status === "VENCIDA" && item.daysOverdue) {
          return (
            <span className="text-state-danger text-[12px]">
              {formatDate(item.dueDate)}{" "}
              <span className="text-[10px] font-mono">
                ({item.daysOverdue}d)
              </span>
            </span>
          );
        }
        return (
          <span className="text-ink-soft text-[12px]">
            {formatDate(item.dueDate)}
          </span>
        );
      case "status":
        return (
          <StatusPill
            variant={statusToVariant[item.status]}
            label={statusToLabel[item.status]}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* === Search === */}
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
          placeholder="Buscar factura o cliente…"
          className={cn(
            "w-full h-9 pl-9 pr-3",
            "rounded-lg border border-line bg-bg-elevated-1",
            "text-[13px] text-ink placeholder:text-ink-muted",
            "focus:outline-none focus:border-line-strong focus:ring-2 focus:ring-primary/20",
            "transition-colors duration-[var(--motion-fast)] ease-erp"
          )}
        />
      </div>

      {/* === Tabs pill === */}
      <div
        role="tablist"
        aria-label="Filtro por estado"
        className="inline-flex items-center gap-1 p-0.5 rounded-lg border border-line bg-bg-elevated-1"
      >
        {[
          { id: "all", label: "Todas", count: tabCounts.all },
          { id: "pending", label: "Pendientes", count: tabCounts.pending },
          { id: "overdue", label: "Vencidas", count: tabCounts.overdue },
          { id: "paid", label: "Pagadas", count: tabCounts.paid },
        ].map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelectTab(t.id)}
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
              {t.label}
              <span
                className={cn(
                  "font-mono text-[10px] px-1.5 py-0.5 rounded",
                  active
                    ? "bg-paper text-ink"
                    : "bg-accent text-ink-muted"
                )}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      <FilterBar
        fields={FILTER_FIELDS}
        filters={filters}
        onFiltersChange={onFiltersChange}
        savedViews={SAVED_VIEWS}
        activeViewId={activeTab}
        onSelectView={onSelectTab}
      />

      <BulkActionBar
        count={selectedIds.length}
        onClear={() => onSelectionChange([])}
        actions={[
          {
            id: "send",
            label: "Enviar",
            icon: Mail,
            onClick: () => console.log("send", selectedIds),
          },
          {
            id: "remind",
            label: "Recordatorio",
            icon: Bell,
            onClick: () => console.log("remind", selectedIds),
          },
          {
            id: "download",
            label: "Descargar",
            icon: Download,
            onClick: () => console.log("download", selectedIds),
          },
        ]}
      />

      <DataList
        items={filtered}
        columns={columns}
        getId={(it) => it.id}
        renderCell={renderCell}
        selectedIds={selectedIds}
        onSelectionChange={onSelectionChange}
        onRowClick={(it) => onSelectInvoice(it.id)}
        isLoading={isLoading}
        error={error ?? undefined}
        emptyState={
          <EmptyState
            title={
              search || filters.length > 0
                ? "Sin resultados"
                : "Aun no tienes facturas"
            }
            description={
              search || filters.length > 0
                ? "Ajusta los filtros o intenta otra busqueda."
                : "Cuando emitamos la primera, aparecera aca."
            }
            action={
              onCreate
                ? {
                    label: "Crear primera factura",
                    onClick: onCreate,
                  }
                : undefined
            }
          />
        }
      />

      <p className="text-[12px] text-ink-muted font-mono">
        Mostrando {filtered.length} de {items.length} facturas
      </p>
    </div>
  );
}
