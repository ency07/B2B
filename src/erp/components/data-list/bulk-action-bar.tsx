/**
 * BulkActionBar — barra flotante de acciones en lote.
 *
 * Segun BLUEPRINT_ERP_REDESIGN.md §4.2:
 * - Aparece al seleccionar 1+ items, anclada arriba de la lista
 * - bg.elevated, shadow-2, radius-lg
 * - Contador grande a la izquierda + acciones + "Esc" para limpiar
 * - Las acciones disponibles cambian segun el estado de los items
 * - Animacion de entrada: slide up + fade
 */

"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Kbd } from "@/platform/ui/kbd";
import { cn } from "@/platform/utils/cn";

export interface BulkAction {
  id: string;
  label: string;
  onClick: () => void;
  /** Si la accion es destructiva, se renderiza en danger. */
  destructive?: boolean;
  /** Icono opcional. */
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

export interface BulkActionBarProps {
  /** Cantidad de items seleccionados. */
  count: number;
  /** Acciones disponibles. */
  actions: BulkAction[];
  /** Callback al limpiar la seleccion. */
  onClear: () => void;
  className?: string;
}

export function BulkActionBar({
  count,
  actions,
  onClear,
  className,
}: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label={`${count} ${count === 1 ? "item seleccionado" : "items seleccionados"}`}
      className={cn(
        "sticky top-0 z-20",
        "flex items-center justify-between gap-3",
        "h-12 px-4",
        "rounded-lg border border-line",
        "bg-bg-elevated-1",
        "depth-2",
        "animate-in fade-in slide-in-from-top-2 duration-[var(--motion-base)] ease-erp",
        className
      )}
    >
      {/* === Left: contador + limpiar === */}
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-semibold text-ink">
          {count} {count === 1 ? "seleccionado" : "seleccionados"}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1 text-[12px] text-ink-soft hover:text-ink transition-colors cursor-pointer"
          aria-label="Limpiar seleccion"
        >
          <X className="h-3 w-3" strokeWidth={1.5} />
          Limpiar
        </button>
      </div>

      {/* === Right: acciones + hint de Esc === */}
      <div className="flex items-center gap-1">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={action.onClick}
              className={cn(
                "inline-flex items-center gap-1.5 h-8 px-3",
                "rounded-md",
                "text-[12px] font-medium",
                "transition-colors duration-[var(--motion-fast)] ease-erp",
                "cursor-pointer",
                action.destructive
                  ? "text-state-danger hover:bg-state-danger"
                  : "text-ink-soft hover:bg-accent hover:text-ink"
              )}
            >
              {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />}
              {action.label}
            </button>
          );
        })}
        <Kbd combo="Escape" variant="subtle" className="ml-2" />
      </div>
    </div>
  );
}
