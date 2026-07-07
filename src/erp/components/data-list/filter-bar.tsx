/**
 * FilterBar — filtros como pills + tabs de vistas guardadas.
 *
 * Segun BLUEPRINT_ERP_REDESIGN.md §4.1:
 * - Una sola fila de pills arriba de la lista
 * - Cada filtro = pill removible: campo + operador + valor
 * - Boton "Add filter" abre un popover con busqueda de campos
 * - Tabs arriba: "Mi vista", "Por vencer", "Este mes" (vistas guardadas)
 *
 * Esta entrega Ola 1 entrega el primitive. Los modulos individuales
 * definiran sus propios campos de filtro y vistas guardadas.
 */

"use client";

import * as React from "react";
import { Plus, X, Search, Check } from "lucide-react";
import { Popover } from "@/platform/ui/popover";
import { cn } from "@/platform/utils/cn";

export type FilterOperator = "is" | "is-not" | "contains" | "gt" | "lt" | "between";

export interface FilterField {
  id: string;
  label: string;
  /** Tipo del campo (afecta la UI de seleccion de valor). */
  type: "text" | "number" | "date" | "select";
  /** Opciones para type="select". */
  options?: { id: string; label: string }[];
}

export interface FilterValue {
  field: string;
  operator: FilterOperator;
  value: string;
}

export interface SavedView {
  id: string;
  label: string;
  filters: FilterValue[];
}

export interface FilterBarProps {
  fields: FilterField[];
  filters: FilterValue[];
  onFiltersChange: (filters: FilterValue[]) => void;
  savedViews?: SavedView[];
  activeViewId?: string;
  onSelectView?: (viewId: string) => void;
  className?: string;
}

const operatorLabels: Record<FilterOperator, string> = {
  is: "es",
  "is-not": "no es",
  contains: "contiene",
  gt: "mayor que",
  lt: "menor que",
  between: "entre",
};

function getFieldLabel(fields: FilterField[], id: string): string {
  return fields.find((f) => f.id === id)?.label || id;
}

function getOperatorLabel(op: FilterOperator): string {
  return operatorLabels[op];
}

export function FilterBar({
  fields,
  filters,
  onFiltersChange,
  savedViews = [],
  activeViewId,
  onSelectView,
  className,
}: FilterBarProps) {
  const [addOpen, setAddOpen] = React.useState(false);
  const [fieldSearch, setFieldSearch] = React.useState("");

  const removeFilter = (index: number) => {
    const next = filters.filter((_, i) => i !== index);
    onFiltersChange(next);
  };

  const addFilter = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId);
    if (!field) return;
    const next: FilterValue[] = [
      ...filters,
      { field: fieldId, operator: "is", value: "" },
    ];
    onFiltersChange(next);
    setAddOpen(false);
    setFieldSearch("");
  };

  const updateFilter = (index: number, partial: Partial<FilterValue>) => {
    const next = filters.map((f, i) => (i === index ? { ...f, ...partial } : f));
    onFiltersChange(next);
  };

  const filteredFields = fields.filter((f) =>
    f.label.toLowerCase().includes(fieldSearch.toLowerCase())
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* === Saved views (tabs) === */}
      {savedViews.length > 0 && (
        <div
          role="tablist"
          className="flex items-center gap-1 overflow-x-auto"
        >
          {savedViews.map((view) => {
            const active = view.id === activeViewId;
            return (
              <button
                key={view.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelectView?.(view.id)}
                className={cn(
                  "h-7 px-3",
                  "rounded-md",
                  "text-[12px] font-medium whitespace-nowrap",
                  "transition-colors duration-[var(--motion-fast)] ease-erp",
                  "cursor-pointer",
                  active
                    ? "bg-accent text-ink"
                    : "text-ink-soft hover:bg-accent/50 hover:text-ink"
                )}
              >
                {view.label}
              </button>
            );
          })}
        </div>
      )}

      {/* === Filter pills === */}
      <div className="flex items-center gap-2 flex-wrap">
        {filters.map((filter, idx) => {
          const field = fields.find((f) => f.id === filter.field);
          return (
            <div
              key={`${filter.field}-${idx}`}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 pl-2.5 pr-1.5",
                "rounded-full",
                "border border-line bg-bg-elevated-1",
                "text-[12px]"
              )}
            >
              <span className="font-medium text-ink">
                {getFieldLabel(fields, filter.field)}
              </span>
              <span className="text-ink-muted">{getOperatorLabel(filter.operator)}</span>
              {field?.type === "select" && field.options ? (
                <select
                  value={filter.value}
                  onChange={(e) =>
                    updateFilter(idx, { value: e.target.value })
                  }
                  className="bg-transparent border-0 outline-none font-mono text-ink-soft focus:outline-none cursor-pointer pr-1"
                >
                  <option value="">—</option>
                  {field.options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field?.type === "number" ? "number" : "text"}
                  value={filter.value}
                  onChange={(e) =>
                    updateFilter(idx, { value: e.target.value })
                  }
                  placeholder="valor"
                  className="bg-transparent border-0 outline-none font-mono text-ink-soft placeholder:text-ink-muted w-24 focus:outline-none"
                />
              )}
              <button
                type="button"
                onClick={() => removeFilter(idx)}
                aria-label={`Quitar filtro ${getFieldLabel(fields, filter.field)}`}
                className="inline-flex items-center justify-center h-5 w-5 rounded-full text-ink-muted hover:text-ink hover:bg-accent cursor-pointer"
              >
                <X className="h-3 w-3" strokeWidth={1.75} />
              </button>
            </div>
          );
        })}

        {/* Add filter popover */}
        <Popover
          open={addOpen}
          onOpenChange={setAddOpen}
          contentClassName="w-72 p-2"
          trigger={
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3",
                "rounded-full",
                "border border-dashed border-line",
                "text-[12px] font-medium text-ink-soft",
                "hover:border-line-strong hover:text-ink hover:bg-accent/30",
                "transition-colors duration-[var(--motion-fast)] ease-erp",
                "cursor-pointer"
              )}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              Agregar filtro
            </button>
          }
        >
          <div className="flex items-center gap-2 h-9 px-2 mb-1 rounded-md border border-line bg-bg-base">
            <Search className="h-3.5 w-3.5 text-ink-muted" strokeWidth={1.5} />
            <input
              autoFocus
              type="text"
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              placeholder="Buscar campo…"
              className="flex-1 bg-transparent border-0 outline-none text-[12px] placeholder:text-ink-muted focus:outline-none"
            />
          </div>
          <ul role="listbox" className="max-h-60 overflow-y-auto">
            {filteredFields.length === 0 ? (
              <li className="px-2 py-3 text-center text-[12px] text-ink-muted">
                Sin resultados
              </li>
            ) : (
              filteredFields.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => addFilter(f.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5",
                      "rounded-md",
                      "text-[12px] text-ink-soft",
                      "hover:bg-accent hover:text-ink",
                      "transition-colors duration-[var(--motion-instant)] ease-erp",
                      "cursor-pointer text-left"
                    )}
                  >
                    <span className="flex-1">{f.label}</span>
                    <span className="font-mono text-[10px] text-ink-muted">
                      {f.type}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </Popover>

        {filters.length > 0 && (
          <button
            type="button"
            onClick={() => onFiltersChange([])}
            className="text-[12px] text-ink-muted hover:text-ink transition-colors cursor-pointer ml-1"
          >
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}
