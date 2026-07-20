/**
 * /dashboard/invoices — Facturacion rediseñada (Ola 3).
 *
 * Redisenado segun BLUEPRINT_ERP_REDESIGN.md §10:
 * - Hero CashPulse con outstanding AR
 * - InvoiceList con tabs pill + DataList + FilterBar
 * - InvoiceDetail con Receipt preview embebido
 * - El pago real se hara cuando se integre la pasarela embebida
 *   (Wompi / Stripe Elements). Ola 7: solo el flujo de UI.
 */

"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Plus } from "lucide-react";
import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Spinner } from "@/platform/ui/spinner";
import { getInvoices, getClients, createInvoice, registerPayment } from "@/erp/actions/core";;
import {
  Sheet,
  SheetContent,
} from "@/platform/ui/sheet";
import {
  CashPulse,
  InvoiceList,
  InvoiceDetail,
  PaymentForm,
  type InvoiceListItem,
  type InvoiceStatus,
  type ReceiptItem,
} from "@/features/invoices";
import type { FilterValue } from "@/erp/components/data-list";

/**
 * Enriquece los datos del backend con campos derivados
 * (dueDate calculado, daysOverdue, status logico para UI).
 */
function enrichInvoice(inv: {
  id: string;
  code: string;
  clientName: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  date: string;
}): InvoiceListItem {
  const issueDate = inv.date;
  // Por ahora calculamos dueDate como 30 dias despues.
  const issue = new Date(issueDate);
  const due = new Date(issue);
  due.setDate(due.getDate() + 30);
  const dueDate = due.toISOString().slice(0, 10);
  const today = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysOverdue = Math.max(
    0,
    Math.floor((today.getTime() - due.getTime()) / msPerDay)
  );

  let status = inv.status as InvoiceStatus;
  if (status === "EMITIDA" && daysOverdue > 0) {
    status = "VENCIDA";
  }

  return {
    id: inv.id,
    code: inv.code,
    clientName: inv.clientName,
    totalAmount: inv.totalAmount,
    paidAmount: inv.paidAmount,
    status,
    issueDate,
    dueDate,
    daysOverdue: status === "VENCIDA" ? daysOverdue : undefined,
  };
}

/**
 * Genera items de muestra para una factura (los items reales
 * requieren un JOIN con invoice_items que la action actual no
 * expone). Ola 3+ los traera del backend.
 */
function mockItemsFor(invoice: InvoiceListItem): ReceiptItem[] {
  if (invoice.totalAmount <= 0) return [];
  // Split en 2-3 items de muestra.
  const items: ReceiptItem[] = [
    {
      id: `${invoice.id}-1`,
      description: "Servicio de ingenieria industrial",
      quantity: 1,
      unitPrice: Math.round(invoice.totalAmount * 0.7),
      subtotal: Math.round(invoice.totalAmount * 0.7),
    },
  ];
  if (invoice.totalAmount > 5000) {
    items.push({
      id: `${invoice.id}-2`,
      description: "Materiales y componentes",
      quantity: 1,
      unitPrice: Math.round(invoice.totalAmount * 0.2),
      subtotal: Math.round(invoice.totalAmount * 0.2),
    });
  }
  if (invoice.totalAmount > 20000) {
    items.push({
      id: `${invoice.id}-3`,
      description: "Mano de obra especializada",
      quantity: 1,
      unitPrice: Math.round(invoice.totalAmount * 0.1),
      subtotal: Math.round(invoice.totalAmount * 0.1),
    });
  }
  return items;
}

export default function InvoicesPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  // === Data state ===
  const [invoices, setInvoices] = React.useState<InvoiceListItem[]>([]);
  const [clients, setClients] = React.useState<{ id: string; name: string; taxId: string }[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // === View state ===
  const [search, setSearch] = React.useState("");
  const [filters, setFilters] = React.useState<FilterValue[]>([]);
  const [activeTab, setActiveTab] = React.useState("all");
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<
    string | null
  >(null);

  // === Create Invoice state ===
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [createSubmitting, setCreateSubmitting] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // Form states
  const [formClient, setFormClient] = React.useState("");
  const [formConcept, setFormConcept] = React.useState("");
  const [formAmount, setFormAmount] = React.useState("");

  // === Payment state ===
  const [paymentInvoiceId, setPaymentInvoiceId] = React.useState<string | null>(null);

  // === Load invoices & clients ===
  const loadData = React.useCallback(async () => {
    try {
      const [invoiceData, clientData] = await Promise.all([
        getInvoices(tenantParam),
        getClients(tenantParam),
      ]);
      setError(null);
      setInvoices(invoiceData.map(enrichInvoice));
      setClients(clientData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error desconocido"));
    } finally {
      setLoading(false);
    }
  }, [tenantParam]);

  // Initial data load — inline async IIFE para evitar eslint set-state-in-effect
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [invoiceData, clientData] = await Promise.all([
          getInvoices(tenantParam),
          getClients(tenantParam),
        ]);
        if (active) {
          setError(null);
          setInvoices(invoiceData.map(enrichInvoice));
          setClients(clientData);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err : new Error("Error desconocido"));
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [tenantParam]);

  // === Aggregates for CashPulse ===
  const outstanding = React.useMemo(
    () =>
      invoices
        .filter(
          (i) =>
            i.status === "EMITIDA" ||
            i.status === "VENCIDA" ||
            i.status === "PARCIALMENTE_PAGADA"
        )
        .reduce((s, i) => s + (i.totalAmount - i.paidAmount), 0),
    [invoices]
  );

  const outstandingCount = React.useMemo(
    () =>
      invoices.filter(
        (i) =>
          i.status === "EMITIDA" ||
          i.status === "VENCIDA" ||
          i.status === "PARCIALMENTE_PAGADA"
      ).length,
    [invoices]
  );

  const hasOverdue = React.useMemo(
    () => invoices.some((i) => i.status === "VENCIDA"),
    [invoices]
  );

  const hasDueSoon = React.useMemo(() => {
    // Date.now() es intencional: necesitamos "ahora" para calcular vencimiento relativo.
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    return invoices.some((i) => {
      if (i.status !== "EMITIDA" || !i.dueDate) return false;
      const days = (new Date(i.dueDate).getTime() - now) / 86400000;
      return days >= 0 && days <= 7;
    });
  }, [invoices]);

  // Mock sparkline (random walk deterministico por seed).
  const sparkline = React.useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) =>
        Math.max(0, Math.round(80000 + Math.sin(i / 3) * 30000 + i * 500))
      ),
    []
  );

  // === Selected invoice ===
  const selectedInvoice = React.useMemo(
    () => invoices.find((i) => i.id === selectedInvoiceId) || null,
    [invoices, selectedInvoiceId]
  );

  // === Invoice being paid ===
  const paymentInvoice = React.useMemo(
    () => invoices.find((i) => i.id === paymentInvoiceId) || null,
    [invoices, paymentInvoiceId]
  );

  // === Handlers ===
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClient || !formConcept || !formAmount) {
      setCreateError("Por favor, completa todos los campos obligatorios.");
      return;
    }
    const amountVal = Number(formAmount);
    if (isNaN(amountVal) || amountVal <= 0) {
      setCreateError("El monto debe ser un número positivo válido.");
      return;
    }

    setCreateSubmitting(true);
    setCreateError(null);

    try {
      await createInvoice(tenantParam, {
        clientName: formClient,
        concept: formConcept,
        amount: amountVal,
      });
      setIsCreateOpen(false);
      // Reset form
      setFormClient("");
      setFormConcept("");
      setFormAmount("");
      // Reload list
      await loadData();
    } catch (err: unknown) {
      console.error(err);
      setCreateError(err instanceof Error ? err.message : "Error al crear la factura.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-4 md:-m-6 lg:-m-8">
      {/* === Header === */}
      <div className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 lg:pt-8 pb-4 border-b border-line">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Modulo de Facturacion
            </div>
            <h1 className="text-base font-mono uppercase tracking-widest font-bold text-ink">
              Cuentas por Cobrar
            </h1>
            <p className="text-xs text-ink-soft">
              Emision, seguimiento y pago de facturas a clientes.
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="cursor-pointer">
            <Plus className="w-4 h-4" />
            Emitir Factura
          </Button>
        </div>
      </div>

      {/* === Body === */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 lg:p-8 space-y-4">
        {/* Hero CashPulse */}
        {outstanding > 0 && (
          <CashPulse
            outstanding={outstanding}
            delta={0.18}
            sparkline={sparkline}
            invoiceCount={outstandingCount}
            hasOverdue={hasOverdue}
            hasDueSoon={hasDueSoon}
            onPay={() => {
              // Open payment form for the first pending/overdue invoice
              const pendingInvoice = invoices.find(
                (i) => i.status === "VENCIDA" || i.status === "EMITIDA" || i.status === "PARCIALMENTE_PAGADA"
              );
              if (pendingInvoice) {
                setPaymentInvoiceId(pendingInvoice.id);
              }
            }}
            onDownload={() => console.log("download report")}
          />
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Spinner className="text-ink-muted mb-2 w-6 h-6" />
            <span className="text-[10px] uppercase font-mono tracking-widest text-ink-muted">
              Cargando facturas...
            </span>
          </div>
        ) : (
          <InvoiceList
            items={invoices}
            search={search}
            onSearchChange={setSearch}
            filters={filters}
            onFiltersChange={(f) => {
              setFilters(f);
              setActiveTab("custom");
            }}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onSelectInvoice={setSelectedInvoiceId}
            error={error}
          />
        )}
      </div>

      {/* Drawer / Sheet modal lateral para crear factura */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="flex flex-col h-full w-full max-w-[500px] border-l border-border bg-card text-foreground p-6 shadow-2xl overflow-y-auto">
          <div className="space-y-4">
            <div className="space-y-1 border-b border-border pb-4">
              <h2 className="text-base font-mono uppercase tracking-widest font-bold text-foreground">
                Emitir Nueva Factura
              </h2>
              <p className="text-xs text-muted-foreground">
                Ingresa los datos para registrar la factura en el sistema y generar el cobro.
              </p>
            </div>

            {createError && (
              <div className="p-3 text-[11px] font-mono border border-state-danger/30 bg-state-danger/5 text-state-danger rounded-md">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateInvoice} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-foreground">
                  Cliente <span className="text-state-danger">*</span>
                </label>
                <select
                  value={formClient}
                  onChange={(e) => setFormClient(e.target.value)}
                  className="w-full h-9 rounded-md border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                >
                  <option value="">Selecciona un cliente...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.legal_name}>
                      {c.legal_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-foreground">
                  Concepto / Descripción <span className="text-state-danger">*</span>
                </label>
                <Input
                  placeholder="Ej. Servicio de ingeniería y montaje HVAC"
                  value={formConcept}
                  onChange={(e) => setFormConcept(e.target.value)}
                  className="bg-background border-border text-xs placeholder-muted-foreground/60 h-9 rounded-md"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider font-semibold text-foreground">
                  Valor Total ({tenantParam === "AEROMAX" ? "USD" : "COP"}) <span className="text-state-danger">*</span>
                </label>
                <Input
                  type="number"
                  placeholder="Ej. 15000000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="bg-background border-border text-xs placeholder-muted-foreground/60 h-9 rounded-md"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-border mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  disabled={createSubmitting}
                  className="text-xs h-9 cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createSubmitting}
                  className="text-xs h-9 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
                >
                  {createSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Spinner className="w-3.5 h-3.5" />
                      <span>Procesando...</span>
                    </div>
                  ) : (
                    "Crear Factura"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      {/* Drawer / Sheet modal lateral para detalle de factura */}
      <Sheet open={selectedInvoiceId !== null} onOpenChange={(open) => { if (!open) setSelectedInvoiceId(null); }}>
        <SheetContent className="flex flex-col h-full w-full max-w-[80vw] sm:max-w-[700px] md:max-w-[800px] border-l border-border bg-card text-foreground p-0 shadow-2xl">
          {selectedInvoice && (
            <InvoiceDetail
              invoice={selectedInvoice}
              items={mockItemsFor(selectedInvoice)}
              onClose={() => setSelectedInvoiceId(null)}
              onPay={() => {
                setSelectedInvoiceId(null);
                setPaymentInvoiceId(selectedInvoice.id);
              }}
              onSendReminder={() => console.log("reminder", selectedInvoice.code)}
              onDownload={() => console.log("download", selectedInvoice.code)}
              onPrint={() => window.print()}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Drawer / Sheet modal lateral para registrar pago */}
      <Sheet open={paymentInvoiceId !== null} onOpenChange={(open) => { if (!open) setPaymentInvoiceId(null); }}>
        <SheetContent className="flex flex-col h-full w-full max-w-[500px] border-l border-border bg-card text-foreground p-0 shadow-2xl">
          {paymentInvoice && (
            <PaymentForm
              invoiceCode={paymentInvoice.code}
              invoiceId={paymentInvoice.id}
              clientId={clients.find((c) => c.name === paymentInvoice.clientName)?.id ?? ""}
              clientName={paymentInvoice.clientName}
              invoiceStatus={paymentInvoice.status}
              totalAmount={paymentInvoice.totalAmount}
              balanceAmount={paymentInvoice.totalAmount - paymentInvoice.paidAmount}
              onClose={() => setPaymentInvoiceId(null)}
              onPaymentSuccess={async () => {
                setPaymentInvoiceId(null);
                await loadData();
              }}
              registerPaymentAction={(data) =>
                registerPayment(tenantParam, data)
              }
            />
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
