"use client";

import * as React from "react";
import { FileSignature, Download, Check, X } from "lucide-react";
import { Button } from "@/platform/ui/button";
import { Badge } from "@/platform/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/platform/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/platform/ui/dialog";
import { Textarea } from "@/platform/ui/textarea";
import { capture } from "@/lib/analytics";
import { formatCurrency } from "@/portal/components/dashboard/usePortalClientState";
import type { ClientQuote, ClientQuoteDetail } from "@/portal/actions/quotes";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  ENVIADA: { label: "Pendiente de respuesta", cls: "bg-warning/10 text-warning" },
  APROBADA: { label: "Aprobada", cls: "bg-success/10 text-success" },
  RECHAZADA: { label: "Rechazada", cls: "bg-destructive/10 text-destructive" },
  VENCIDA: { label: "Vencida", cls: "bg-muted text-muted-foreground" },
  CANCELADA: { label: "Cancelada", cls: "bg-muted text-muted-foreground" },
};

interface QuotesSectionProps {
  quotes: ClientQuote[];
  selectedQuote: ClientQuote | null;
  setSelectedQuote: (quote: ClientQuote | null) => void;
  quoteDetail: ClientQuoteDetail | null;
  isLoadingDetail: boolean;
  onOpenQuote: (quote: ClientQuote) => void;
  isResponding: boolean;
  onRespond: (quoteId: string, response: "ACEPTADA" | "RECHAZADA", reason?: string) => Promise<void>;
  onDownloadPdf: () => void;
}

export function QuotesSection({
  quotes,
  selectedQuote,
  setSelectedQuote,
  quoteDetail,
  isLoadingDetail,
  onOpenQuote,
  isResponding,
  onRespond,
  onDownloadPdf,
}: QuotesSectionProps) {
  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false);
  const [rejectReason, setRejectReason] = React.useState("");

  const canRespond =
    selectedQuote?.status === "ENVIADA" && !selectedQuote?.clientResponse;

  const handleAccept = async () => {
    if (!selectedQuote) return;
    await onRespond(selectedQuote.id, "ACEPTADA");
  };

  const handleConfirmReject = async () => {
    if (!selectedQuote) return;
    await onRespond(selectedQuote.id, "RECHAZADA", rejectReason);
    setIsRejectDialogOpen(false);
    setRejectReason("");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-border/60 pb-4">
        <h3 className="text-lg font-bold text-foreground">Cotizaciones</h3>
        <p className="text-xs text-muted-foreground mt-1 font-sans">
          Propuestas comerciales enviadas para tu revisión.
        </p>
      </div>

      {quotes.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-3">
          <FileSignature className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Aún no tienes cotizaciones</p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Cuando tu ejecutivo comercial te envíe una propuesta, aparecerá aquí para tu revisión.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => {
            const st = STATUS_CONFIG[quote.status] ?? { label: quote.status, cls: "bg-muted text-muted-foreground" };
            return (
              <Sheet
                key={quote.id}
                open={selectedQuote?.id === quote.id}
                onOpenChange={(open) => {
                  if (!open) setSelectedQuote(null);
                }}
              >
                <SheetTrigger asChild>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenQuote(quote);
                      capture("portal_quote_viewed", { code: quote.code, status: quote.status });
                    }}
                    className="w-full text-left border border-border/80 bg-background/40 rounded-xl p-5 space-y-3 hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <span className="text-xs font-mono font-bold text-primary">{quote.code}</span>
                        <p className="text-sm font-semibold text-foreground leading-tight">{quote.title}</p>
                      </div>
                      <Badge variant="secondary" className={`shrink-0 text-[10px] font-semibold border-none ${st.cls}`}>
                        {st.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-border/40 text-xs">
                      <span className="font-mono font-semibold text-foreground">{formatCurrency(quote.totalAmount)}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">Válida hasta {quote.validUntil}</span>
                      {quote.clientResponse && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="font-medium text-foreground">
                            Tu respuesta: {quote.clientResponse === "ACEPTADA" ? "Aceptada" : "Rechazada"}
                          </span>
                        </>
                      )}
                    </div>
                  </button>
                </SheetTrigger>

                <SheetContent className="bg-card border-l border-border max-w-[90vw] sm:max-w-[560px] overflow-y-auto">
                  <div className="space-y-6 pt-6 font-sans">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-primary">{quote.code}</span>
                      <Badge variant="secondary" className={`text-[10px] font-semibold border-none ${st.cls}`}>
                        {st.label}
                      </Badge>
                    </div>
                    <p className="text-base font-semibold text-foreground">{quote.title}</p>

                    {isLoadingDetail ? (
                      <p className="text-xs text-muted-foreground">Cargando detalle...</p>
                    ) : quoteDetail && quoteDetail.quote.id === quote.id ? (
                      <>
                        <div className="rounded-xl border border-border bg-background/55 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead className="bg-muted/40 text-[9px] uppercase tracking-wider text-muted-foreground">
                              <tr>
                                <th className="text-left p-3">Concepto</th>
                                <th className="text-right p-3">Cant.</th>
                                <th className="text-right p-3">Valor</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                              {quoteDetail.items.map((item, idx) => (
                                <tr key={idx}>
                                  <td className="p-3 text-foreground">{item.description}</td>
                                  <td className="p-3 text-right text-muted-foreground font-mono">
                                    {item.quantity} {item.unit}
                                  </td>
                                  <td className="p-3 text-right font-mono text-foreground">
                                    {formatCurrency(item.lineTotal)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-border/60 bg-muted/20">
                                <td colSpan={2} className="p-3 text-right text-muted-foreground">Subtotal</td>
                                <td className="p-3 text-right font-mono text-foreground">{formatCurrency(quoteDetail.subtotal)}</td>
                              </tr>
                              <tr>
                                <td colSpan={2} className="p-3 text-right text-muted-foreground">Impuestos</td>
                                <td className="p-3 text-right font-mono text-foreground">{formatCurrency(quoteDetail.taxAmount)}</td>
                              </tr>
                              <tr className="border-t-2 border-border">
                                <td colSpan={2} className="p-3 text-right font-semibold text-foreground">Total</td>
                                <td className="p-3 text-right font-mono font-bold text-foreground">{formatCurrency(quoteDetail.quote.totalAmount)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>

                        {quoteDetail.quote.clientResponse && (
                          <div className="rounded-xl border border-border bg-background/40 p-4 text-xs space-y-1">
                            <p className="font-semibold text-foreground">
                              Tu respuesta: {quoteDetail.quote.clientResponse === "ACEPTADA" ? "Aceptada" : "Rechazada"}
                            </p>
                            {quoteDetail.quote.clientResponseReason && (
                              <p className="text-muted-foreground">Motivo: {quoteDetail.quote.clientResponseReason}</p>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col gap-2">
                          {canRespond && (
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={handleAccept}
                                disabled={isResponding}
                                className="flex-1 bg-success hover:bg-success/90 text-success-foreground text-xs font-mono h-10 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> Aceptar
                              </Button>
                              <Button
                                onClick={() => setIsRejectDialogOpen(true)}
                                disabled={isResponding}
                                variant="outline"
                                className="flex-1 text-xs font-mono h-10 flex items-center gap-1.5 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> Rechazar
                              </Button>
                            </div>
                          )}
                          <Button
                            onClick={onDownloadPdf}
                            variant="outline"
                            className="w-full text-xs font-mono h-9 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" /> Descargar PDF
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-xs text-destructive">No se pudo cargar el detalle.</p>
                    )}

                    <SheetClose asChild>
                      <Button className="w-full bg-muted hover:bg-muted/80 border border-border text-foreground text-xs font-mono cursor-pointer">
                        Cerrar
                      </Button>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
            );
          })}
        </div>
      )}

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rechazar cotización</DialogTitle>
            <DialogDescription>
              Cuéntanos el motivo del rechazo (mínimo 10 caracteres). Tu ejecutivo comercial verá
              esta respuesta.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ej: el precio no se ajusta a nuestro presupuesto actual..."
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} disabled={isResponding}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={isResponding || rejectReason.trim().length < 10}
            >
              Confirmar rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
