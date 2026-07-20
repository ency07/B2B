"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Textarea } from "@/platform/ui/textarea";
import { createCreditNote } from "@/erp/actions/core";
import { toast } from "sonner";

interface InvoiceInfo {
  id: string;
  code: string;
  clientName: string;
  clientId: string;
  total: number;
  paidAmount: number;
  balanceAmount: number;
}

const REASONS = [
  { value: "DEVOLUCION", label: "Devolución" },
  { value: "ERROR", label: "Error en facturación" },
  { value: "DESCUENTO", label: "Descuento / Bonificación" },
  { value: "ANULACION", label: "Anulación total" },
  { value: "GARANTIA", label: "Garantía / Reclamo" },
] as const;

const formatCop = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
  }).format(n);

export interface CreditNoteFormProps {
  invoice: InvoiceInfo;
  onClose: () => void;
  onCreated: () => void;
}

export function CreditNoteForm({
  invoice,
  onClose,
  onCreated,
}: CreditNoteFormProps) {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [loading, setLoading] = React.useState(false);
  const [reason, setReason] = React.useState("");
  const [amount, setAmount] = React.useState(
    String(invoice.balanceAmount > 0 ? invoice.balanceAmount.toFixed(2) : "")
  );
  const [description, setDescription] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const parsedAmount = parseFloat(amount) || 0;
  const canSubmit =
    reason !== "" &&
    parsedAmount > 0 &&
    parsedAmount <= invoice.balanceAmount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const taxRate = 0.19;
      const subtotal = Math.round(parsedAmount / (1 + taxRate));
      const taxAmount = parsedAmount - subtotal;

      await createCreditNote(tenantParam, {
        invoiceId: invoice.id,
        clientId: invoice.clientId,
        reason: reason as "DEVOLUCION" | "ERROR" | "DESCUENTO" | "ANULACION" | "GARANTIA",
        description: description.trim() || undefined,
        subtotal,
        taxAmount,
        totalAmount: parsedAmount,
      });

      toast.success("Nota de crédito creada", {
        description: `NC aplicada por ${formatCop(parsedAmount)} a la factura ${invoice.code}`,
      });
      onCreated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear nota de crédito";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex flex-col border-l border-line bg-bg-elevated-1">
      {/* Header */}
      <header className="sticky top-0 z-layer-content border-b border-line bg-bg-elevated-1 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">Nota de Crédito</h2>
            <p className="text-[12px] text-ink-soft mt-0.5">
              Ajuste sobre la factura {invoice.code}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center h-6 w-6 rounded-md text-ink-muted hover:text-ink hover:bg-accent transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Body */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 overflow-y-auto p-5">
        {/* Resumen factura */}
        <div className="rounded-lg border border-line bg-bg-muted/30 p-3 space-y-1.5">
          <div className="flex justify-between text-[12px]">
            <span className="text-ink-soft">Factura</span>
            <span className="font-mono text-ink">{invoice.code}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-ink-soft">Cliente</span>
            <span className="text-ink">{invoice.clientName}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-ink-soft">Total factura</span>
            <span className="font-mono text-ink">{formatCop(invoice.total)}</span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-ink-soft">Ya pagado</span>
            <span className="font-mono text-ink">{formatCop(invoice.paidAmount)}</span>
          </div>
          <div className="flex justify-between text-[12px] border-t border-line/50 pt-1.5">
            <span className="text-ink-soft font-medium">Saldo pendiente</span>
            <span className="font-mono font-semibold text-ink">{formatCop(invoice.balanceAmount)}</span>
          </div>
        </div>

        {/* Motivo */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-ink">Motivo *</label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full h-9 rounded-md border border-line bg-bg-elevated-2 px-3 text-[13px] text-ink"
          >
            <option value="">Seleccionar motivo...</option>
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Monto */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-ink">Monto (COP) *</label>
          <Input
            type="number"
            min="0.01"
            max={invoice.balanceAmount}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="font-mono text-[13px]"
          />
          <p className="text-[11px] text-ink-muted">
            Máximo: {formatCop(invoice.balanceAmount)}
          </p>
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <label className="text-[12px] font-medium text-ink">Descripción (opcional)</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Motivo detallado del ajuste..."
            className="text-[13px]"
          />
        </div>

        {error && (
          <p className="text-[12px] text-destructive">{error}</p>
        )}

        <div className="mt-auto pt-2">
          <Button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full"
          >
            {loading ? "Procesando..." : `Aplicar NC — ${parsedAmount > 0 ? formatCop(parsedAmount) : "—"}`}
          </Button>
        </div>
      </form>
    </div>
  );
}
