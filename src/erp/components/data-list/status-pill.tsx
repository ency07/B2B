/**
 * StatusPill — pill de estatus con dot + label.
 *
 * Segun BLUEPRINT_ERP_REDESIGN.md §3.3:
 * - h-6 px-2 rounded-xs (no pill estilo Bootstrap)
 * - Fondo del estado al 8-12%, texto del estado, dot 6px a la izquierda
 * - Sentence case (no uppercase)
 * - Opcional icono 12px a la izquierda del dot
 */

import * as React from "react";
import { StatusDot, type StatusVariant } from "./status-dot";
import { cn } from "@/platform/utils/cn";

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: StatusVariant;
  /** Texto del estado (sentence case). */
  label: string;
  /** Icono opcional a la izquierda del dot. */
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Tamanio del dot (default xs = 6px). */
  dotSize?: "xs" | "sm";
}

const variantClasses: Record<StatusVariant, string> = {
  success: "bg-state-success text-state-success border-state-success",
  warning: "bg-state-warning text-state-warning border-state-warning",
  danger: "bg-state-danger text-state-danger border-state-danger",
  info: "bg-state-info text-state-info border-state-info",
  neutral: "bg-state-neutral text-state-neutral border-state-neutral",
};

export function StatusPill({
  variant,
  label,
  icon: Icon,
  dotSize = "xs",
  className,
  ...rest
}: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        "h-6 px-2",
        "rounded-[4px]",
        "border",
        "text-[11px] font-medium leading-none",
        "whitespace-nowrap",
        variantClasses[variant],
        className
      )}
      {...rest}
    >
      {Icon && <Icon className="h-3 w-3" strokeWidth={1.75} aria-hidden />}
      <StatusDot variant={variant} size={dotSize} aria-hidden />
      <span>{label}</span>
    </span>
  );
}
