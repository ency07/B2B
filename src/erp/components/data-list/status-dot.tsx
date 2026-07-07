/**
 * StatusDot — atomo de estatus del sistema.
 *
 * Segun BLUEPRINT_ERP_REDESIGN.md §3.3:
 * - 8px (default), 6px (sm), 10px (lg)
 * - 5 colores semanticos: success / warning / danger / info / neutral
 * - Animacion opcional "pulse" para atencion
 *
 * Es la unica fuente de verdad visual para el estado de una entidad.
 * Siempre acompanado de texto (nunca solo color).
 */

import * as React from "react";
import { cn } from "@/platform/utils/cn";

export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface StatusDotProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: StatusVariant;
  size?: "xs" | "sm" | "md" | "lg";
  pulse?: boolean;
  /** Label accesible para screen readers. */
  label?: string;
}

const sizeClasses: Record<NonNullable<StatusDotProps["size"]>, string> = {
  xs: "h-1.5 w-1.5", //  6px
  sm: "h-2 w-2",     //  8px (default)
  md: "h-2.5 w-2.5", // 10px
  lg: "h-3 w-3",     // 12px
};

const variantClasses: Record<StatusVariant, string> = {
  success: "bg-state-success",
  warning: "bg-state-warning",
  danger: "bg-state-danger",
  info: "bg-state-info",
  neutral: "bg-state-neutral",
};

export function StatusDot({
  variant,
  size = "sm",
  pulse = false,
  label,
  className,
  ...rest
}: StatusDotProps) {
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label}
      className={cn(
        "inline-block rounded-full shrink-0",
        sizeClasses[size],
        variantClasses[variant],
        pulse && "animate-pulse",
        className
      )}
      {...rest}
    />
  );
}
