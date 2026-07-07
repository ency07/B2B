/**
 * EmptyState — estado vacio disenhado.
 *
 * Segun BLUEPRINT_ERP_REDESIGN.md §13.4 y BLUEPRINT_PORTAL_REDESIGN.md §5.7:
 * - Jerarquia equivalente al estado normal (no degradado)
 * - Ilustracion mono-line + headline 18px + sub 14px + accion unica
 * - Opcionalmente un segundo link ghost
 *
 * Uso:
 *   <EmptyState
 *     title="Aun no tienes facturas aqui"
 *     description="Cuando emitamos la primera, aparecera aca."
 *     action={{ label: "Crear primera factura", onClick: () => {} }}
 *   />
 */

import * as React from "react";
import { Button } from "@/platform/ui/button";
import { cn } from "@/platform/utils/cn";

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "ghost";
}

export interface EmptyStateProps {
  /** Headline 18px semibold. */
  title: string;
  /** Sub-descripcion 14px secondary. */
  description?: string;
  /** Ilustracion opcional (SVG path React node o un componente). */
  illustration?: React.ReactNode;
  /** Accion primaria unica. */
  action?: EmptyStateAction;
  /** Accion secundaria ghost. */
  secondaryAction?: EmptyStateAction;
  className?: string;
}

export function EmptyState({
  title,
  description,
  illustration,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        "py-16 px-6",
        "text-center",
        className
      )}
    >
      {illustration && (
        <div
          className="mb-5 text-ink-muted"
          aria-hidden
        >
          {illustration}
        </div>
      )}
      <h3 className="text-[18px] font-semibold text-ink leading-tight tracking-tight">
        {title}
      </h3>
      {description && (
        <p className="text-[14px] text-ink-soft leading-relaxed mt-2 max-w-md">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center gap-2">
          {action && (
            <Button
              variant={action.variant || "default"}
              size="default"
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || "ghost"}
              size="default"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
