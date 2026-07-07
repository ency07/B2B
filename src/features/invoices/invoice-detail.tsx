/**
 * InvoiceDetail — detalle de factura con receipt + timeline + acciones.
 *
 * Segun BLUEPRINT_ERP_REDISIGN.md §10.3:
 * - Split-view: lista de items + PDF preview en el inspector
 * - Hero: numero de factura + estado + monto
 * - Acciones: Pagar, Enviar recordatorio, Anular
 *
 * Ola 3: el "PDF preview" es el componente Receipt renderizado en
 * el inspector derecho. La integracion con jsPDF (preview real
 * como PDF) se hara en una ola posterior.
 */

"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { X, CreditCard, Bell, Send, Download, Printer } from "lucide-react";
import {
  Receipt,
  type ReceiptItem,
} from "./receipt";
import { StatusPill } from "@/erp/components/data-list/status-pill";
import type { StatusVariant } from "@/erp/components/data-list/status-dot";
import { Button } from "@/platform/ui/button";
import { cn } from "@/platform/utils/cn";
import type { InvoiceListItem } from "./invoice-list";
import { useBranding } from "@/hooks/use-branding";

const statusToVariant: Record<InvoiceListItem["status"], StatusVariant> = {
  BORRADOR: "neutral",
  EMITIDA: "info",
  PARCIALMENTE_PAGADA: "warning",
  PAGADA: "success",
  ANULADA: "danger",
  VENCIDA: "danger",
};

const statusToLabel: Record<InvoiceListItem["status"], string> = {
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
    minimumFractionDigits: 2,
  }).format(n);

export interface InvoiceDetailProps {
  invoice: InvoiceListItem;
  /** Items de la factura (mock si no hay). */
  items: ReceiptItem[];
  onClose: () => void;
  onPay?: () => void;
  onSendReminder?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  className?: string;
}

export function InvoiceDetail({
  invoice,
  items,
  onClose,
  onPay,
  onSendReminder,
  onDownload,
  onPrint,
  className,
}: InvoiceDetailProps) {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const branding = useBranding(tenantParam);
  const subtotal = items.reduce((s, it) => s + it.subtotal, 0);
  const taxRate = 0.19;
  const tax = Math.round(subtotal * taxRate);
  const total = subtotal + tax;
  const isPending =
    invoice.status === "EMITIDA" ||
    invoice.status === "PARCIALMENTE_PAGADA" ||
    invoice.status === "VENCIDA";
  const isOverdue = invoice.status === "VENCIDA";

  return (
    <div
      className={cn(
        "h-full flex flex-col",
        "border-l border-line bg-bg-elevated-1",
        className
      )}
    >
      {/* === Header === */}
      <header className="sticky top-0 z-10 border-b border-line bg-bg-elevated-1 px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center h-6 w-6 rounded-md text-ink-muted hover:text-ink hover:bg-accent transition-colors cursor-pointer -ml-1.5"
                aria-label="Cerrar detalle"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                Factura
              </span>
            </div>
            <h2 className="font-mono text-[24px] font-semibold text-ink leading-none">
              {invoice.code}
            </h2>
            <p className="text-[12px] text-ink-soft mt-1 truncate">
              {invoice.clientName}
            </p>
          </div>
          <StatusPill
            variant={statusToVariant[invoice.status]}
            label={statusToLabel[invoice.status]}
          />
        </div>

        {/* === Hero amount === */}
        <div className="flex items-baseline justify-between gap-3 pt-3 border-t border-line/50">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              Total
            </p>
            <p className="font-mono text-[28px] font-semibold text-ink leading-none mt-1">
              {formatCop(total)}
            </p>
          </div>
          {invoice.paidAmount > 0 && invoice.paidAmount < total && (
            <div className="text-right">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                Saldo
              </p>
              <p className="font-mono text-[16px] font-semibold text-ink leading-none mt-1">
                {formatCop(total - invoice.paidAmount)}
              </p>
            </div>
          )}
        </div>

        {/* === Acciones principales === */}
        <div className="flex items-center gap-2 mt-3">
          {isPending && onPay && (
            <Button
              size="sm"
              variant={isOverdue ? "destructive" : "default"}
              onClick={onPay}
              className="flex-1"
            >
              <CreditCard className="h-3.5 w-3.5" strokeWidth={1.5} />
              Pagar ahora
            </Button>
          )}
          {isPending && onSendReminder && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSendReminder}
              aria-label="Enviar recordatorio"
            >
              <Bell className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
          )}
          {onDownload && (
            <Button
              size="sm"
              variant="outline"
              onClick={onDownload}
              aria-label="Descargar PDF"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Button>
          )}
        </div>
      </header>

      {/* === Body: receipt + meta === */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-6">
          {/* === Receipt preview === */}
          <section>
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-3">
              Vista previa
            </h3>
            <Receipt
              code={invoice.code}
              tenantName={branding.nombre_comercial}
              tenantTaxId={branding.nit}
              clientName={invoice.clientName}
              issueDate={invoice.issueDate}
              dueDate={invoice.dueDate}
              status={invoice.status}
              items={items}
              subtotal={subtotal}
              taxRate={taxRate}
              total={total}
              paidAmount={invoice.paidAmount}
              onDownload={onDownload}
              onPrint={onPrint}
            />
          </section>

          {/* === Meta info === */}
          <section className="space-y-3 pt-6 border-t border-line">
            <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              Informacion
            </h3>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[12px]">
              <div>
                <dt className="text-ink-muted">Emision</dt>
                <dd className="mt-0.5 font-mono text-ink">{invoice.issueDate}</dd>
              </div>
              {invoice.dueDate && (
                <div>
                  <dt className="text-ink-muted">Vencimiento</dt>
                  <dd
                    className={cn(
                      "mt-0.5 font-mono",
                      isOverdue ? "text-state-danger" : "text-ink"
                    )}
                  >
                    {invoice.dueDate}
                    {isOverdue && invoice.daysOverdue && (
                      <span className="text-[10px] ml-1">
                        ({invoice.daysOverdue}d)
                      </span>
                    )}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="mt-0.5 font-mono text-ink-soft">
                  {formatCop(subtotal)}
                </dd>
              </div>
              <div>
                <dt className="text-ink-muted">IVA (19%)</dt>
                <dd className="mt-0.5 font-mono text-ink-soft">
                  {formatCop(tax)}
                </dd>
              </div>
            </dl>
          </section>

          {/* === Acciones secundarias === */}
          {isPending && (
            <section className="pt-6 border-t border-line space-y-2">
              <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-2">
                Mas acciones
              </h3>
              <button
                type="button"
                onClick={onSendReminder}
                className="w-full inline-flex items-center justify-start gap-2 h-9 px-3 rounded-md border border-line text-[12px] text-ink-soft hover:bg-accent hover:text-ink transition-colors cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={1.5} />
                Enviar recordatorio por email
              </button>
              <button
                type="button"
                onClick={onPrint}
                className="w-full inline-flex items-center justify-start gap-2 h-9 px-3 rounded-md border border-line text-[12px] text-ink-soft hover:bg-accent hover:text-ink transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" strokeWidth={1.5} />
                Imprimir
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
