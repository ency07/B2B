"use client";

import { CreditCard, Download } from "lucide-react";
import { Button } from "@/platform/ui/button";
import { Badge } from "@/platform/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/platform/ui/sheet";
import { capture } from "@/lib/analytics";
import { formatCurrency } from "@/portal/components/dashboard/usePortalClientState";
import type { PortalInvoice, PortalReceipt, PortalInvoiceFilter } from "@/portal/components/dashboard/types";

interface InvoicesSectionProps {
  invoices: PortalInvoice[];
  receipts: PortalReceipt[];
  invoiceFilter: PortalInvoiceFilter;
  setInvoiceFilter: (filter: PortalInvoiceFilter) => void;
  selectedInvoice: PortalInvoice | null;
  setSelectedInvoice: (invoice: PortalInvoice | null) => void;
  clientName: string;
  supportEmail: string;
  telefono: string;
  downloadInvoicePdf: (invoiceCode: string) => void;
}

export function InvoicesSection({
  invoices,
  receipts,
  invoiceFilter,
  setInvoiceFilter,
  selectedInvoice,
  setSelectedInvoice,
  clientName,
  supportEmail,
  telefono,
  downloadInvoicePdf,
}: InvoicesSectionProps) {
  const filteredInvoices = invoices.filter((inv) => (invoiceFilter === "ALL" ? true : inv.status === invoiceFilter));
  const pendingTotal = filteredInvoices.reduce((s, i) => s + (i.status === "PENDIENTE" ? i.total - i.paid : 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <p className="text-base font-semibold text-foreground">Facturas y Pagos</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Descargue facturas y coordine abonos con su ejecutivo.
          </p>
        </div>
        {/* Filtros */}
        <div className="flex items-center gap-1.5 shrink-0">
          {(["ALL", "PENDIENTE", "PAGADA"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setInvoiceFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                invoiceFilter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40"
              }`}
            >
              {f === "ALL" ? "Todas" : f === "PENDIENTE" ? "Pendientes" : "Pagadas"}
            </button>
          ))}
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-3">
          <CreditCard className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">
            {invoiceFilter === "ALL" ? "No hay facturas registradas" : `No hay facturas ${invoiceFilter === "PENDIENTE" ? "pendientes" : "pagadas"}`}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-background/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <caption className="sr-only">Lista de facturas del cliente</caption>
              <thead className="bg-muted/55 border-b border-border text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                <tr>
                  <th scope="col" className="p-4">Nro. Factura</th>
                  <th scope="col" className="p-4">Fecha</th>
                  <th scope="col" className="p-4 text-right">Total</th>
                  <th scope="col" className="p-4 text-right">Saldo</th>
                  <th scope="col" className="p-4 text-center">Estado</th>
                  <th scope="col" className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-foreground">
                {filteredInvoices.map((inv) => {
                  const balance = inv.total - inv.paid;
                  return (
                    <tr key={inv.code} className="hover:bg-muted/20 transition-colors">
                      <td className="p-4 font-bold text-primary">{inv.code}</td>
                      <td className="p-4 text-muted-foreground">{inv.date}</td>
                      <td className="p-4 text-right font-mono">{formatCurrency(inv.total)}</td>
                      <td className={`p-4 text-right font-mono font-bold ${balance > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                        {formatCurrency(balance)}
                      </td>
                      <td className="p-4 text-center">
                        <Badge
                          variant="secondary"
                          className={`text-[9px] font-mono border-none ${
                            inv.status === "PAGADA" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {inv.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {balance > 0 ? (
                            <Sheet>
                              <SheetTrigger asChild>
                                <Button
                                  onClick={() => { setSelectedInvoice(inv); capture("portal_invoice_viewed", { code: inv.code, balance: inv.total - inv.paid }); }}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono h-8 px-3 flex items-center gap-1 cursor-pointer"
                                >
                                  <CreditCard className="w-3.5 h-3.5" /> Ver detalle de factura
                                </Button>
                              </SheetTrigger>

                              {/* Sin gateway de pago conectado todavía (no hay credenciales de
                                  Wompi/PSE configuradas). Estado honesto, no se simula un pago. */}
                              <SheetContent className="bg-card border-l border-border max-w-[85vw] sm:max-w-[480px]">
                                <div className="space-y-6 pt-6 font-sans">
                                  <div className="space-y-1">
                                    <p className="text-base font-semibold text-foreground">Detalle de factura</p>
                                    <p className="text-xs text-muted-foreground font-sans">
                                      Coordina el pago directamente con tu ejecutivo. El pago en línea estará disponible pronto.
                                    </p>
                                  </div>

                                  {selectedInvoice && (
                                    <div className="rounded-xl border border-border bg-background/55 p-4 space-y-2 font-mono text-xs">
                                      <div className="flex justify-between"><span className="text-muted-foreground">Factura:</span><span className="text-primary font-bold">{selectedInvoice.code}</span></div>
                                      <div className="flex justify-between"><span className="text-muted-foreground">Saldo pendiente:</span><span className="text-foreground font-bold">{formatCurrency(selectedInvoice.total - selectedInvoice.paid)}</span></div>
                                      <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-muted-foreground">Cliente:</span><span className="text-foreground font-sans font-bold">{clientName}</span></div>
                                    </div>
                                  )}

                                  <div className="rounded-xl border border-border bg-background/40 p-4 text-xs text-muted-foreground font-mono">
                                    Contacto: {supportEmail} · {telefono}
                                  </div>

                                  <SheetClose asChild>
                                    <Button className="w-full bg-muted hover:bg-muted/80 border border-border text-foreground text-xs font-mono cursor-pointer">
                                      Cerrar
                                    </Button>
                                  </SheetClose>
                                </div>
                              </SheetContent>
                            </Sheet>
                          ) : (
                            <button
                              onClick={() => downloadInvoicePdf(inv.code)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-1"
                              title="Descargar PDF de la factura"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {pendingTotal > 0 && (
                <tfoot>
                  <tr className="bg-destructive/5 border-t border-destructive/20">
                    <td colSpan={3} className="p-4 text-xs font-bold text-muted-foreground font-sans">Total pendiente de pago</td>
                    <td className="p-4 text-right font-mono font-bold text-destructive">{formatCurrency(pendingTotal)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Payment history receipts list */}
      {receipts.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-foreground">Historial de pagos</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {receipts.map((rec) => (
              <div key={rec.id} className="border border-border/80 bg-background/40 p-4 rounded-xl flex items-center justify-between font-mono text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-primary">{rec.id}</span>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none hover:bg-emerald-500/10 text-[8px]">{rec.status}</Badge>
                  </div>
                  <span className="text-muted-foreground block text-[10px]">Factura: {rec.code} · {rec.date} · {rec.method}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-foreground block">{formatCurrency(rec.amount)}</span>
                  <button
                    onClick={() => downloadInvoicePdf(rec.code)}
                    className="text-primary hover:text-primary/80 text-[10px] flex items-center gap-1 justify-end cursor-pointer mt-1 font-sans"
                  >
                    <Download className="w-3 h-3" /> Recibo PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
