/**
 * Receipt — representacion editorial de una factura.
 *
 * Segun BLUEPRINT_ERP_REDESIGN.md §5.3:
 * - max-w 480px, centrado, bg.surface, radius-lg, border.subtle
 * - Logo del tenant (centrado), separadores hairline
 * - Numero de factura en mono 30px
 * - Subtitulo cliente, fechas, status
 * - Tabla de items, subtotal, IVA, total destacado
 * - Botones "Descargar PDF" + "Imprimir" al pie
 * - Disenado para ser leido como un documento, no como un PDF estatico
 */

"use client";

import * as React from "react";
import { Download, Printer } from "lucide-react";
import { StatusPill } from "@/erp/components/data-list/status-pill";
import type { StatusVariant } from "@/erp/components/data-list/status-dot";
import { cn } from "@/platform/utils/cn";
import { TenantLogo } from "@/design-system/components/TenantLogo";

export interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ReceiptProps {
  /** Numero de factura (ej FAC-2026-0421). */
  code: string;
  /** Logo URL del tenant. */
  logoUrl?: string;
  /** Nombre comercial del tenant. */
  tenantName: string;
  /** NIT del tenant. */
  tenantTaxId?: string;
  /** Razon social del cliente. */
  clientName: string;
  /** NIT del cliente. */
  clientTaxId?: string;
  /** Fecha de emision (YYYY-MM-DD o DD MMM YYYY). */
  issueDate: string;
  /** Fecha de vencimiento. */
  dueDate?: string;
  /** Estado de la factura. */
  status: "BORRADOR" | "EMITIDA" | "PARCIALMENTE_PAGADA" | "PAGADA" | "ANULADA" | "VENCIDA";
  items: ReceiptItem[];
  /** Subtotal sin IVA. */
  subtotal: number;
  /** Tasa de IVA (ej 0.19 para 19%). Default 0.19. */
  taxRate?: number;
  /** IVA calculado. Si no se provee, se calcula de subtotal * taxRate. */
  tax?: number;
  /** Total final. Si no se provee, subtotal + tax. */
  total: number;
  /** Monto pagado (para parcial). */
  paidAmount?: number;
  /** Metodo de pago si esta pagada. */
  paymentMethod?: string;
  /** Fecha de pago si esta pagada. */
  paidAt?: string;
  /** Notas adicionales. */
  notes?: string;
  className?: string;
  /** Callbacks */
  onDownload?: () => void;
  onPrint?: () => void;
}

const formatCop = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

const statusToVariant: Record<ReceiptProps["status"], StatusVariant> = {
  BORRADOR: "neutral",
  EMITIDA: "info",
  PARCIALMENTE_PAGADA: "warning",
  PAGADA: "success",
  ANULADA: "danger",
  VENCIDA: "danger",
};

const statusToLabel: Record<ReceiptProps["status"], string> = {
  BORRADOR: "Borrador",
  EMITIDA: "Emitida",
  PARCIALMENTE_PAGADA: "Pago parcial",
  PAGADA: "Pagada",
  ANULADA: "Anulada",
  VENCIDA: "Vencida",
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function Receipt({
  code,
  logoUrl,
  tenantName,
  tenantTaxId,
  clientName,
  clientTaxId,
  issueDate,
  dueDate,
  status,
  items,
  subtotal,
  taxRate = 0.19,
  tax,
  total,
  paidAmount = 0,
  paymentMethod,
  paidAt,
  notes,
  className,
  onDownload,
  onPrint,
}: ReceiptProps) {
  const computedTax = tax ?? Math.round(subtotal * taxRate);
  const computedTotal = total ?? subtotal + computedTax;
  const balance = computedTotal - paidAmount;

  return (
    <div
      className={cn(
        "max-w-[480px] mx-auto",
        "rounded-2xl border border-line bg-bg-elevated-1",
        "p-10 md:p-12",
        "font-sans",
        className
      )}
    >
      {/* === Header: logo + tenant === */}
      <div className="text-center mb-8">
        <TenantLogo
            variant="pdf"
            logoPdfUrl={logoUrl}
            companyName={tenantName}
            width={120}
            height={28}
            native
            className="h-7 w-auto mx-auto object-contain"
          />
        {tenantTaxId && (
          <p className="font-mono text-[10px] text-ink-muted mt-1">
            NIT {tenantTaxId}
          </p>
        )}
      </div>

      {/* === Eyebrow: tipo de documento === */}
      <div className="text-center mb-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
          Factura
        </span>
      </div>

      {/* === Numero de factura === */}
      <div className="text-center mb-6">
        <h2 className="font-mono text-[28px] font-medium text-ink leading-none">
          {code}
        </h2>
      </div>

      {/* === Divider === */}
      <hr className="border-line mb-6" />

      {/* === Meta: emision, vencimiento, estado === */}
      <dl className="grid grid-cols-1 gap-2 mb-6 text-[13px]">
        <div className="flex items-center justify-between">
          <dt className="text-ink-muted">Emitida</dt>
          <dd className="text-ink font-mono">{formatDate(issueDate)}</dd>
        </div>
        {dueDate && (
          <div className="flex items-center justify-between">
            <dt className="text-ink-muted">Vence</dt>
            <dd className="text-ink font-mono">{formatDate(dueDate)}</dd>
          </div>
        )}
        <div className="flex items-center justify-between">
          <dt className="text-ink-muted">Estado</dt>
          <dd>
            <StatusPill
              variant={statusToVariant[status]}
              label={statusToLabel[status]}
            />
          </dd>
        </div>
        {paidAt && (
          <div className="flex items-center justify-between">
            <dt className="text-ink-muted">Pagada</dt>
            <dd className="text-ink font-mono">{formatDate(paidAt)}</dd>
          </div>
        )}
      </dl>

      {/* === Cliente === */}
      <div className="mb-6 py-4 border-y border-line">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-1">
          Facturar a
        </p>
        <p className="text-[14px] font-semibold text-ink">{clientName}</p>
        {clientTaxId && (
          <p className="font-mono text-[11px] text-ink-muted mt-0.5">
            NIT {clientTaxId}
          </p>
        )}
      </div>

      {/* === Items === */}
      <table className="w-full mb-6 text-[13px]">
        <thead>
          <tr className="border-b border-line">
            <th className="text-left font-mono text-[10px] uppercase tracking-widest text-ink-muted py-2 font-medium">
              Concepto
            </th>
            <th className="text-right font-mono text-[10px] uppercase tracking-widest text-ink-muted py-2 font-medium w-12">
              Cant.
            </th>
            <th className="text-right font-mono text-[10px] uppercase tracking-widest text-ink-muted py-2 font-medium w-24">
              Precio
            </th>
            <th className="text-right font-mono text-[10px] uppercase tracking-widest text-ink-muted py-2 font-medium w-28">
              Subtotal
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="border-b border-line/40 last:border-b-0">
              <td className="py-2.5 text-ink">{it.description}</td>
              <td className="py-2.5 text-right font-mono text-ink-soft">
                {it.quantity}
              </td>
              <td className="py-2.5 text-right font-mono text-ink-soft">
                {formatCop(it.unitPrice)}
              </td>
              <td className="py-2.5 text-right font-mono text-ink">
                {formatCop(it.subtotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* === Totales === */}
      <div className="space-y-1.5 text-[13px] mb-6">
        <div className="flex items-center justify-between">
          <span className="text-ink-muted">Subtotal</span>
          <span className="font-mono text-ink-soft">{formatCop(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-ink-muted">
            IVA ({(taxRate * 100).toFixed(0)}%)
          </span>
          <span className="font-mono text-ink-soft">{formatCop(computedTax)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-line">
          <span className="text-ink font-semibold">Total</span>
          <span className="font-mono text-[18px] font-semibold text-ink">
            {formatCop(computedTotal)}
          </span>
        </div>
        {paidAmount > 0 && (
          <>
            <div className="flex items-center justify-between pt-1">
              <span className="text-ink-muted">Pagado</span>
              <span className="font-mono text-state-success">
                −{formatCop(paidAmount)}
              </span>
            </div>
            {balance > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Saldo</span>
                <span className="font-mono font-semibold text-ink">
                  {formatCop(balance)}
                </span>
              </div>
            )}
            {paymentMethod && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-ink-muted">Metodo</span>
                <span className="font-mono text-ink-soft text-[12px]">
                  {paymentMethod}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* === Notas === */}
      {notes && (
        <div className="mb-6 py-3 border-t border-line">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-1">
            Notas
          </p>
          <p className="text-[12px] text-ink-soft leading-relaxed">{notes}</p>
        </div>
      )}

      {/* === Acciones === */}
      {(onDownload || onPrint) && (
        <div className="flex items-center gap-2 pt-4 border-t border-line">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-line bg-bg-elevated-1 text-[12px] font-medium text-ink-soft hover:bg-accent hover:text-ink transition-colors cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
              Descargar PDF
            </button>
          )}
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-line bg-bg-elevated-1 text-[12px] font-medium text-ink-soft hover:bg-accent hover:text-ink transition-colors cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" strokeWidth={1.5} />
              Imprimir
            </button>
          )}
        </div>
      )}
    </div>
  );
}
