/**
 * DataList — patron de lista premium del ERP/Portal.
 *
 * Segun BLUEPRINT_ERP_REDESIGN.md §3.5, §4.x:
 * - Filas de 36-44px con padding generoso
 * - Header uppercase mono 11px, color muted, border-b
 * - Cero zebra striping
 * - Hover: bg.surface sutil
 * - Seleccion: bg.accent/5 + ring-inset
 * - Primera columna: dot de estado + nombre principal semibold
 * - Ultima columna: accion inline o menu kebab
 * - Datos tecnicos: mono, alineados a la derecha
 * - Sticky header
 * - Empty state / loading state / error state diseñados
 *
 * API:
 *   <DataList
 *     items={items}
 *     columns={[
 *       { id: "name", header: "Cliente", width: "minmax(0, 1fr)", align: "left" },
 *       { id: "amount", header: "Monto", width: "120px", align: "right", mono: true },
 *     ]}
 *     getId={(item) => item.id}
 *     renderCell={(item, column) => ...}
 *     selectedIds={selected}
 *     onSelectionChange={setSelected}
 *     onRowClick={(item) => openDetail(item.id)}
 *     isLoading={isLoading}
 *     emptyState={<EmptyState ... />}
 *   />
 */

"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/platform/utils/cn";

export interface DataListColumn {
  id: string;
  header: string;
  /** CSS grid track value: "120px", "minmax(0, 1fr)", etc. */
  width: string;
  align?: "left" | "center" | "right";
  /** Si es true, el contenido se renderiza en mono. */
  mono?: boolean;
  /** Ocultar en mobile. */
  hideOnMobile?: boolean;
}

export interface DataListProps<T> {
  items: T[];
  columns: DataListColumn[];
  getId: (item: T) => string;
  /** Renderiza la celda segun columna. */
  renderCell: (item: T, column: DataListColumn) => React.ReactNode;
  /** IDs seleccionados. */
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Click en fila (no en checkbox). */
  onRowClick?: (item: T) => void;
  /** Estado de carga. */
  isLoading?: boolean;
  /** Estado de error. */
  error?: Error | null;
  /** Contenido a mostrar cuando items.length === 0 y !isLoading. */
  emptyState?: React.ReactNode;
  /** Sticky header offset (default 0). */
  stickyOffset?: number;
  /** Altura de fila en px (default 44). */
  rowHeight?: number;
  className?: string;
}

export function DataList<T>({
  items,
  columns,
  getId,
  renderCell,
  selectedIds = [],
  onSelectionChange,
  onRowClick,
  isLoading = false,
  error = null,
  emptyState,
  stickyOffset = 0,
  rowHeight = 44,
  className,
}: DataListProps<T>) {
  const gridTemplate = [
    onSelectionChange ? "40px" : "",
    ...columns.map((c) => c.width),
  ]
    .filter(Boolean)
    .join(" ");

  const toggleItem = (id: string) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((x) => x !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (selectedIds.length === items.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(getId));
    }
  };

  const allSelected =
    items.length > 0 && selectedIds.length === items.length;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < items.length;

  if (error) {
    return (
      <div
        role="alert"
        className={cn(
          "flex flex-col items-center justify-center",
          "py-12 px-6 text-center",
          "rounded-lg border border-state-danger bg-state-danger/5",
          className
        )}
      >
        <p className="text-[14px] font-semibold text-state-danger">
          No pudimos cargar la lista
        </p>
        <p className="text-[12px] text-ink-soft mt-1">{error.message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        role="status"
        aria-label="Cargando"
        className={cn(
          "rounded-lg border border-line bg-bg-elevated-1 overflow-hidden",
          className
        )}
      >
        <div
          className="grid border-b border-line"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          {onSelectionChange && (
            <div className="px-3 py-3 border-r border-line/50 w-10 shrink-0" />
          )}
          {columns.map((c) => (
            <div
              key={c.id}
              className={cn(
                "px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-ink-muted",
                c.align === "right" && "text-right",
                c.align === "center" && "text-center",
                c.hideOnMobile && "hidden md:block"
              )}
            >
              {c.header}
            </div>
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="grid border-b border-line/50 last:border-b-0"
            style={{ gridTemplateColumns: gridTemplate, height: rowHeight }}
          >
            {onSelectionChange && (
              <div className="px-3 border-r border-line/30 w-10 shrink-0" />
            )}
            {columns.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "px-4 flex items-center",
                  c.hideOnMobile && "hidden md:flex"
                )}
              >
                <div
                  className="h-3 rounded bg-accent animate-pulse"
                  style={{ width: `${40 + ((i + c.id.length) % 5) * 10}%` }}
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    if (emptyState) {
      return <div className={className}>{emptyState}</div>;
    }
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center",
          "py-16 px-6 text-center",
          "rounded-lg border border-dashed border-line",
          className
        )}
      >
        <p className="text-[14px] font-semibold text-ink">Sin resultados</p>
        <p className="text-[12px] text-ink-soft mt-1">
          Ajusta los filtros o intenta otra busqueda.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-bg-elevated-1 overflow-hidden",
        className
      )}
    >
      {/* === Header === */}
      <div
        role="row"
        className="grid border-b border-line bg-bg-base sticky"
        style={{
          gridTemplateColumns: gridTemplate,
          top: stickyOffset,
        }}
      >
        {onSelectionChange && (
          <div
            className="px-3 py-3 flex items-center justify-center border-r border-line/50 w-10"
            aria-label="Seleccionar todos"
          >
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={toggleAll}
              className="h-3.5 w-3.5 rounded border-line accent-primary cursor-pointer"
              aria-label="Seleccionar todos los items"
            />
          </div>
        )}
        {columns.map((c) => (
          <div
            key={c.id}
            className={cn(
              "px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-ink-muted font-medium",
              c.align === "right" && "text-right",
              c.align === "center" && "text-center",
              c.hideOnMobile && "hidden md:block"
            )}
          >
            {c.header}
          </div>
        ))}
      </div>

      {/* === Rows === */}
      <div role="rowgroup">
        {items.map((item) => {
          const id = getId(item);
          const selected = selectedIds.includes(id);
          return (
            <div
              key={id}
              role="row"
              aria-selected={selected}
              className={cn(
                "grid border-b border-line/40 last:border-b-0",
                "transition-colors duration-[var(--motion-instant)] ease-erp",
                onRowClick && "cursor-pointer",
                selected
                  ? "bg-accent/30"
                  : "hover:bg-accent/20"
              )}
              style={{ gridTemplateColumns: gridTemplate, minHeight: rowHeight }}
              onClick={(e) => {
                // Si el click fue sobre el checkbox, no abrir detalle.
                const target = e.target as HTMLElement;
                if (target.closest("[data-datalist-checkbox]")) return;
                onRowClick?.(item);
              }}
            >
              {onSelectionChange && (
                <div
                  className="px-3 flex items-center justify-center border-r border-line/30 w-10"
                  data-datalist-checkbox
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => toggleItem(id)}
                    className="h-3.5 w-3.5 rounded border-line accent-primary cursor-pointer"
                    aria-label={`Seleccionar item ${id}`}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
              {columns.map((c) => (
                <div
                  key={c.id}
                  className={cn(
                    "px-4 flex items-center min-w-0",
                    c.align === "right" && "justify-end text-right",
                    c.align === "center" && "justify-center text-center",
                    c.mono && "font-mono text-[12px] text-ink-soft",
                    c.hideOnMobile && "hidden md:flex"
                  )}
                >
                  <span className="truncate">{renderCell(item, c)}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
