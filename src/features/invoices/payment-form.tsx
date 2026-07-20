/**
 * PaymentForm — formulario de registro de pago para una factura.
 *
 * Muestra: resumen de la factura (código, cliente, total, saldo)
 * Inputs: monto a pagar, método de pago, referencia, fecha
 * Submit → registerPayment() → callback de éxito
 */

"use client";

import * as React from "react";
import { CreditCard, X } from "lucide-react";
import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Spinner } from "@/platform/ui/spinner";
import { StatusPill } from "@/erp/components/data-list/status-pill";
import type { StatusVariant } from "@/erp/components/data-list/status-dot";

const PAYMENT_METHODS = [
  "Transferencia",
  "Efectivo",
  "Cheque",
  "Tarjeta",
  "PSE",
  "Otro",
] as const;

const statusToVariant: Record<string, StatusVariant> = {
  EMITIDA: "info",
  PARCIALMENTE_PAGADA: "warning",
  VENCIDA: "danger",
};

const statusToLabel: Record<string, string> = {
  EMITIDA: "Emitida",
  PARCIALMENTE_PAGADA: "Pago parcial",
  VENCIDA: "Vencida",
};

const formatCop = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export interface PaymentFormProps {
  /** Código de la factura (ej FAC-000001). */
  invoiceCode: string;
  /** ID de la factura. */
  invoiceId: string;
  /** ID del cliente. */
  clientId: string;
  /** Nombre del cliente. */
  clientName: string;
  /** Estado de la factura. */
  invoiceStatus: string;
  /** Monto total de la factura. */
  totalAmount: number;
  /** Saldo pendiente de la factura. */
  balanceAmount: number;
  /** Callback al cerrar el formulario. */
  onClose: () => void;
  /** Callback después de un pago exitoso (para recargar datos). */
  onPaymentSuccess: () => void;
  /** Función server action para registrar el pago. */
  registerPaymentAction: (data: {
    invoiceId: string;
    clientId: string;
    amount: number;
    paymentMethod: "Transferencia" | "Efectivo" | "Cheque" | "Tarjeta" | "PSE" | "Otro";
    referenceNumber?: string;
    paymentDate: string;
  }) => Promise<unknown>;
}

export function PaymentForm({
  invoiceCode,
  invoiceId,
  clientId,
  clientName,
  invoiceStatus,
  totalAmount,
  balanceAmount,
  onClose,
  onPaymentSuccess,
  registerPaymentAction,
}: PaymentFormProps) {
  const [amount, setAmount] = React.useState(balanceAmount.toString());
  const [method, setMethod] = React.useState<string>("Transferencia");
  const [reference, setReference] = React.useState("");
  const [paymentDate, setPaymentDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const parsedAmount = Number(amount);
  const isAmountValid = !isNaN(parsedAmount) && parsedAmount > 0 && parsedAmount <= balanceAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAmountValid) {
      setError("El monto debe ser mayor a 0 y no exceder el saldo pendiente.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await registerPaymentAction({
        invoiceId,
        clientId,
        amount: parsedAmount,
        paymentMethod: method as typeof PAYMENT_METHODS[number],
        referenceNumber: reference.trim() || undefined,
        paymentDate,
      });
      onPaymentSuccess();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al registrar el pago.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col border-l border-line bg-bg-elevated-1">
      {/* Header */}
      <header className="sticky top-0 z-layer-content border-b border-line bg-bg-elevated-1 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center h-6 w-6 rounded-md text-ink-muted hover:text-ink hover:bg-accent transition-colors cursor-pointer"
              aria-label="Cerrar"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
              Registrar Pago
            </span>
          </div>
          <StatusPill
            variant={statusToVariant[invoiceStatus] ?? "neutral"}
            label={statusToLabel[invoiceStatus] ?? invoiceStatus}
          />
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-6">
          {/* Resumen de factura */}
          <section className="rounded-xl border border-line bg-bg-elevated-2 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
                Factura
              </span>
              <span className="font-mono text-[14px] font-semibold text-ink">
                {invoiceCode}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-ink-muted">Cliente</span>
              <span className="text-[12px] text-ink font-medium">{clientName}</span>
            </div>
            <hr className="border-line" />
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-ink-muted">Total factura</span>
              <span className="font-mono text-[14px] font-semibold text-ink">
                {formatCop(totalAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-ink-muted">Saldo pendiente</span>
              <span className="font-mono text-[16px] font-bold text-state-danger">
                {formatCop(balanceAmount)}
              </span>
            </div>
          </section>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-[11px] font-mono border border-state-danger/30 bg-state-danger/5 text-state-danger rounded-md">
                {error}
              </div>
            )}

            {/* Monto */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-foreground">
                Monto a pagar <span className="text-state-danger">*</span>
              </label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                max={balanceAmount}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="bg-background border-border text-xs h-9 rounded-md font-mono"
                required
              />
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setAmount(balanceAmount.toString())}
                  className="text-[10px] font-mono text-primary hover:underline cursor-pointer"
                >
                  Pagar saldo total
                </button>
              </div>
            </div>

            {/* Método de pago */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-foreground">
                Método de pago <span className="text-state-danger">*</span>
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                required
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Referencia */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-foreground">
                Referencia / N.° de comprobante
              </label>
              <Input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ej. TRANS-001234"
                maxLength={150}
                className="bg-background border-border text-xs h-9 rounded-md"
              />
            </div>

            {/* Fecha */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-foreground">
                Fecha de pago <span className="text-state-danger">*</span>
              </label>
              <Input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="bg-background border-border text-xs h-9 rounded-md font-mono"
                required
              />
            </div>

            {/* Botones */}
            <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                className="text-xs h-9 cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submitting || !isAmountValid}
                className="text-xs h-9 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
              >
                {submitting ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="w-3.5 h-3.5" />
                    <span>Procesando...</span>
                  </div>
                ) : (
                  <>
                    <CreditCard className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Registrar Pago
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
