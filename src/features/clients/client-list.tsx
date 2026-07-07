/**
 * ClientList — lista premium de clientes (Customer 360 module).
 *
 * Implementa el patron DataList + FilterBar + BulkActionBar.
 * Vista lista y vista tarjetas conmutables. Seleccion multiple.
 *
 * Click en fila → selecciona el cliente (la pagina abre el detail).
 */

"use client";

import * as React from "react";
import { Search, LayoutGrid, Rows3, Mail, Phone, Archive, Tag, Trash2 } from "lucide-react";
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

export type ClientListItem = {
  id: string;
  taxId: string;
  name: string;
  segment: string;
  totalInvoiced: number;
  status: "ACTIVO" | "SUSPENDIDO" | "PENDIENTE";
  ageDays?: number;
  email?: string;
  phone?: string;
  ownerInitials?: string;
};

export interface ClientListProps {
  items: ClientListItem[];
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
  onSelectClient: (id: string) => void;
  onCreate?: () => void;
}

const FILTER_FIELDS: FilterField[] = [
  {
    id: "segment",
    label: "Sector",
    type: "select",
    options: [
      { id: "manufactura", label: "Manufactura" },
      { id: "siderurgica", label: "Siderúrgica" },
      { id: "energia", label: "Energía" },
      { id: "refrigeracion", label: "Refrigeración" },
      { id: "mineria", label: "Minería" },
      { id: "alimentos", label: "Alimentos" },
    ],
  },
  {
    id: "status",
    label: "Estado",
    type: "select",
    options: [
      { id: "ACTIVO", label: "Activo" },
      { id: "PENDIENTE", label: "Pendiente" },
      { id: "SUSPENDIDO", label: "Suspendido" },
    ],
  },
  { id: "name", label: "Razón social", type: "text" },
];

const SAVED_VIEWS: SavedView[] = [
  { id: "all", label: "Todos", filters: [] },
  {
    id: "active",
    label: "Activos",
    filters: [{ field: "status", operator: "is", value: "ACTIVO" }],
  },
  {
    id: "pending",
    label: "Pendientes",
    filters: [{ field: "status", operator: "is", value: "PENDIENTE" }],
  },
  {
    id: "suspended",
    label: "Suspendidos",
    filters: [{ field: "status", operator: "is", value: "SUSPENDIDO" }],
  },
];

const statusToVariant: Record<ClientListItem["status"], StatusVariant> = {
  ACTIVO: "success",
  PENDIENTE: "warning",
  SUSPENDIDO: "danger",
};

const statusToLabel: Record<ClientListItem["status"], string> = {
  ACTIVO: "Activo",
  PENDIENTE: "Pendiente",
  SUSPENDIDO: "Suspendido",
};

const formatCop = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export function ClientList({
  items,
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
  onSelectClient,
  onCreate,
}: ClientListProps) {
  const [viewMode, setViewMode] = React.useState<"list" | "cards">("list");

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return items.filter((it) => {
      if (q && !it.name.toLowerCase().includes(q) && !it.taxId.toLowerCase().includes(q)) {
        return false;
      }
      return filters.every((f) => {
        if (f.field === "segment" && f.value) {
          return it.segment.toLowerCase().includes(f.value.toLowerCase());
        }
        if (f.field === "status" && f.value) {
          return it.status === f.value;
        }
        if (f.field === "name" && f.value) {
          return it.name.toLowerCase().includes(f.value.toLowerCase());
        }
        return true;
      });
    });
  }, [items, search, filters]);

  const columns: DataListColumn[] = [
    {
      id: "name",
      header: "Cliente",
      width: "minmax(220px, 1.6fr)",
    },
    {
      id: "segment",
      header: "Sector",
      width: "minmax(0, 1fr)",
      hideOnMobile: true,
    },
    {
      id: "totalInvoiced",
      header: "Facturado",
      width: "140px",
      align: "right",
      mono: true,
    },
    {
      id: "status",
      header: "Estado",
      width: "120px",
    },
    {
      id: "owner",
      header: "Owner",
      width: "72px",
      align: "center",
      hideOnMobile: true,
    },
  ];

  const renderCell = (item: ClientListItem, column: DataListColumn) => {
    switch (column.id) {
      case "name":
        return (
          <span className="inline-flex items-center gap-2 min-w-0">
            <StatusDot
              variant={statusToVariant[item.status]}
              size="sm"
            />
            <span className="font-semibold text-ink line-clamp-2 break-words whitespace-normal" title={item.name}>
              {item.name}
            </span>
            <span className="hidden lg:inline font-mono text-[10px] text-ink-muted">
              {item.taxId}
            </span>
          </span>
        );
      case "segment":
        return (
          <span className="text-ink-soft text-[13px]">{item.segment}</span>
        );
      case "totalInvoiced":
        return (
          <span className="text-ink">{formatCop(item.totalInvoiced)}</span>
        );
      case "status":
        return (
          <StatusPill
            variant={statusToVariant[item.status]}
            label={statusToLabel[item.status]}
          />
        );
      case "owner":
        return item.ownerInitials ? (
          <span
            className="inline-flex shrink-0 items-center justify-center h-6 w-6 rounded-full border border-line bg-bg-base font-mono text-[10px] text-ink-soft"
            title={item.ownerInitials}
          >
            {item.ownerInitials}
          </span>
        ) : (
          <span className="text-ink-muted text-[12px]">—</span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* === Search + view toggle === */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-ink-muted"
            strokeWidth={1.5}
            aria-hidden
          />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar cliente o NIT…"
            className={cn(
              "w-full h-9 pl-9 pr-3",
              "rounded-lg border border-line bg-bg-elevated-1",
              "text-[13px] text-ink placeholder:text-ink-muted",
              "focus:outline-none focus:border-line-strong focus:ring-2 focus:ring-primary/20",
              "transition-colors duration-[var(--motion-fast)] ease-erp"
            )}
          />
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <div
            role="group"
            aria-label="Modo de vista"
            className="inline-flex items-center rounded-md border border-line bg-bg-elevated-1 p-0.5"
          >
            <button
              type="button"
              onClick={() => setViewMode("list")}
              aria-label="Vista lista"
              aria-pressed={viewMode === "list"}
              className={cn(
                "inline-flex items-center justify-center h-7 w-7 rounded",
                "transition-colors duration-[var(--motion-instant)] ease-erp cursor-pointer",
                viewMode === "list"
                  ? "bg-accent text-ink"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              <Rows3 className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              aria-label="Vista tarjetas"
              aria-pressed={viewMode === "cards"}
              className={cn(
                "inline-flex items-center justify-center h-7 w-7 rounded",
                "transition-colors duration-[var(--motion-instant)] ease-erp cursor-pointer",
                viewMode === "cards"
                  ? "bg-accent text-ink"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
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
            id: "tag",
            label: "Etiquetar",
            icon: Tag,
            onClick: () => console.log("tag", selectedIds),
          },
          {
            id: "archive",
            label: "Archivar",
            icon: Archive,
            onClick: () => console.log("archive", selectedIds),
          },
          {
            id: "delete",
            label: "Eliminar",
            icon: Trash2,
            destructive: true,
            onClick: () => console.log("delete", selectedIds),
          },
        ]}
      />

      {viewMode === "list" ? (
        <DataList
          items={filtered}
          columns={columns}
          getId={(it) => it.id}
          renderCell={renderCell}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          onRowClick={(it) => onSelectClient(it.id)}
          isLoading={isLoading}
          error={error ?? undefined}
          emptyState={
            <EmptyState
              title={search || filters.length > 0 ? "Sin resultados" : "Aun no tienes clientes"}
              description={
                search || filters.length > 0
                  ? "Ajusta los filtros o intenta otra busqueda."
                  : "Cuando registres el primero, aparecera aca con toda su informacion."
              }
              action={
                onCreate
                  ? {
                      label: "Crear primer cliente",
                      onClick: onCreate,
                    }
                  : undefined
              }
            />
          }
        />
      ) : (
        <ClientCardGrid
          items={filtered}
          isLoading={isLoading}
          error={error}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          onSelectClient={onSelectClient}
          onCreate={onCreate}
          search={search}
          filters={filters}
        />
      )}

      <p className="text-[12px] text-ink-muted font-mono">
        Mostrando {filtered.length} de {items.length} clientes
      </p>
    </div>
  );
}

// === Card grid view (alternativa) ===

interface CardGridProps {
  items: ClientListItem[];
  isLoading?: boolean;
  error?: Error | null;
  search: string;
  filters: FilterValue[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onSelectClient: (id: string) => void;
  onCreate?: () => void;
}

function ClientCardGrid({
  items,
  isLoading,
  error,
  search,
  filters,
  selectedIds,
  onSelectionChange,
  onSelectClient,
  onCreate,
}: CardGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 rounded-lg border border-line bg-bg-elevated-1 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-state-danger bg-state-danger/5 p-6 text-center">
        <p className="text-[14px] font-semibold text-state-danger">
          No pudimos cargar los clientes
        </p>
        <p className="text-[12px] text-ink-soft mt-1">{error.message}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title={search || filters.length > 0 ? "Sin resultados" : "Aun no tienes clientes"}
        description={
          search || filters.length > 0
            ? "Ajusta los filtros o intenta otra busqueda."
            : "Cuando registres el primero, aparecera aca."
        }
        action={
          onCreate
            ? {
                label: "Crear primer cliente",
                onClick: onCreate,
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((it) => {
        const selected = selectedIds.includes(it.id);
          return (
            <div
              key={it.id}
              onClick={() => onSelectClient(it.id)}
              className={cn(
                "group relative",
                "rounded-lg border bg-bg-elevated-1 p-4",
                "transition-all duration-[var(--motion-fast)] ease-erp",
                "cursor-pointer",
                "hover:border-line-strong",
                selected
                  ? "border-line-strong bg-accent/30"
                  : "border-line"
              )}
            >
              <div className="flex items-start gap-3 mb-3">
                <StatusDot
                  variant={statusToVariant[it.status]}
                  size="sm"
                />
                <h3 className="font-semibold text-ink text-[14px] line-clamp-2 break-words whitespace-normal" title={it.name}>
                  {it.name}
                </h3>
              </div>
            <div className="space-y-1.5 min-w-0">
              <p className="text-[12px] text-ink-soft line-clamp-2 break-words whitespace-normal" title={it.segment}>{it.segment}</p>
              <p className="font-mono text-[11px] text-ink-muted truncate">
                {it.taxId}
              </p>
            </div>
            <div className="mt-3 pt-3 border-t border-line/50 flex items-center justify-between gap-2 min-w-0">
              <StatusPill
                variant={statusToVariant[it.status]}
                label={statusToLabel[it.status]}
              />
              <span className="font-mono text-[12px] text-ink font-semibold truncate min-w-0 text-right">
                {formatCop(it.totalInvoiced)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
