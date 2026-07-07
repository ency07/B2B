/**
 * CashPulse — hero de cuenta por cobrar pendiente.
 *
 * Segun BLUEPRINT_ERP_REDESIGN.md §5.6 y §10.2:
 * - Numero grande mono (hero outstanding AR)
 * - Delta vs mes anterior con flecha semantica
 * - Sparkline de los ultimos 30 dias
 * - Estado: pending (amber), paid (neutral/no mostrar), overdue (danger)
 * - CTA unico: "Pagar ahora" o "Descargar recibo"
 */

"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, CreditCard, Download } from "lucide-react";
import { cn } from "@/platform/utils/cn";

export interface CashPulseProps {
  /** Monto pendiente total. Si es 0, no se renderiza. */
  outstanding: number;
  /** Delta vs mes anterior (ej +0.18 = +18%). */
  delta?: number;
  /** Puntos para el sparkline (0-N). Si no se provee, no se muestra. */
  sparkline?: number[];
  /** Cantidad de facturas pendientes. */
  invoiceCount: number;
  /** Si hay alguna vencida. */
  hasOverdue?: boolean;
  /** Si hay alguna que vence en los proximos 7 dias. */
  hasDueSoon?: boolean;
  onPay?: () => void;
  onDownload?: () => void;
  className?: string;
}

const formatCop = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Genera un path SVG para un sparkline normalizado a 0-1 vertical.
 * La x va de 0 a 100 (viewBox), la y se invierte (0 = abajo, 30 = arriba).
 */
function sparklinePath(values: number[]): string {
  if (values.length === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = 100 / (values.length - 1 || 1);
  return values
    .map((v, i) => {
      const x = i * stepX;
      const y = 30 - ((v - min) / range) * 30;
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function CashPulse({
  outstanding,
  delta,
  sparkline,
  invoiceCount,
  hasOverdue = false,
  hasDueSoon = false,
  onPay,
  onDownload,
  className,
}: CashPulseProps) {
  // Si outstanding === 0, no mostrar (silencio editorial).
  if (outstanding <= 0) return null;

  const variant: "danger" | "warning" | "neutral" = hasOverdue
    ? "danger"
    : hasDueSoon
    ? "warning"
    : "neutral";

  const variantClasses: Record<typeof variant, string> = {
    danger: "border-state-danger/30 bg-state-danger/5",
    warning: "border-state-warning/30 bg-state-warning/5",
    neutral: "border-line bg-bg-elevated-1",
  };

  const label = hasOverdue
    ? "Vencida"
    : hasDueSoon
    ? "Por vencer"
    : "Pendiente de pago";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6",
        "transition-colors duration-[var(--motion-base)] ease-erp",
        variantClasses[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* === Left: meta + hero number + sparkline === */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              {label}
            </span>
          </div>
          <p className="font-mono text-[40px] md:text-[48px] font-semibold text-ink leading-none tracking-tight">
            {formatCop(outstanding)}
          </p>
          {delta !== undefined && (
            <div className="flex items-center gap-1.5 mt-2 text-[12px]">
              {delta >= 0 ? (
                <ArrowUp className="h-3 w-3 text-state-danger" strokeWidth={1.75} />
              ) : (
                <ArrowDown
                  className="h-3 w-3 text-state-success"
                  strokeWidth={1.75}
                />
              )}
              <span
                className={cn(
                  "font-mono font-medium",
                  delta >= 0 ? "text-state-danger" : "text-state-success"
                )}
              >
                {Math.abs(delta * 100).toFixed(1)}%
              </span>
              <span className="text-ink-muted font-mono">vs mes anterior</span>
            </div>
          )}

          {sparkline && sparkline.length > 1 && (
            <div className="mt-4 max-w-md">
              <svg
                viewBox="0 0 100 30"
                preserveAspectRatio="none"
                className="w-full h-12"
                aria-label="Tendencia de los ultimos 30 dias"
              >
                <defs>
                  <linearGradient
                    id="cash-pulse-gradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="currentColor" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d={`${sparklinePath(sparkline)} L 100 30 L 0 30 Z`}
                  fill="url(#cash-pulse-gradient)"
                  className="text-state-info"
                />
                <path
                  d={sparklinePath(sparkline)}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-state-info"
                />
              </svg>
            </div>
          )}

          <p className="text-[12px] text-ink-soft font-mono mt-3">
            {invoiceCount === 1
              ? "1 factura pendiente"
              : `${invoiceCount} facturas pendientes`}
            {hasOverdue && " · al menos una vencida"}
          </p>
        </div>

        {/* === Right: CTA === */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          {onPay && (
            <button
              type="button"
              onClick={onPay}
              className={cn(
                "inline-flex items-center gap-2 h-10 px-5",
                "rounded-md",
                "bg-primary text-primary-foreground",
                "text-[13px] font-medium",
                "hover:opacity-90 active:scale-[0.985]",
                "transition-all duration-[var(--motion-fast)] ease-erp",
                "cursor-pointer"
              )}
            >
              <CreditCard className="h-4 w-4" strokeWidth={1.5} />
              Pagar ahora
            </button>
          )}
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-[12px] text-ink-soft hover:text-ink transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
              Reporte
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
