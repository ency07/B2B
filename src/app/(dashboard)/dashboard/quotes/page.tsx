/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import {
  Sparkles,
  Search,
  Plus,
  ArrowRight,
  CheckCircle2,
  FileText,
  DollarSign,
  Briefcase,
  FileCheck,
  Send,
  Printer,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Badge } from "@/platform/ui/badge";
import { Spinner } from "@/platform/ui/spinner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/platform/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/platform/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/platform/ui/sheet";

import { getClients } from "@/erp/actions/core";;
import { getRequirements, RequirementRow } from "@/erp/actions/requirements";
import { 
  getQuotes, 
  createQuote, 
  getQuoteItems, 
  addQuoteItem, 
  updateQuoteStatus, 
  QuoteRow 
} from "@/erp/actions/quotes";

// Formatting utility for COP/USD
const formatCurrency = (amount: number) => {
  if (amount < 100000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const quoteSchema = z.object({
  clientId: z.string().min(1, { message: "Seleccione un cliente B2B." }),
  // requirement_id es NOT NULL en la base — antes era .optional() y dejaba
  // pasar un envío sin requerimiento hasta que el servidor lo rechazaba con
  // un error crudo de constraint.
  requirementId: z.string().min(1, { message: "Seleccione un requerimiento asociado." }),
  validUntil: z.string().min(1, { message: "Seleccione la fecha de vencimiento." }),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

export default function QuotesPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [quotes, setQuotes] = React.useState<QuoteRow[]>([]);
  const [clients, setClients] = React.useState<{ id: string; name: string }[]>([]);
  const [requirements, setRequirements] = React.useState<RequirementRow[]>([]);
  const [selectedQuote, setSelectedQuote] = React.useState<QuoteRow | null>(null);
  
  // Selected Quote Items
  const [items, setItems] = React.useState<any[]>([]);

  // UI States
  const [loading, setLoading] = React.useState(true);
  const [itemsLoading, setItemsLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [addingItem, setAddingItem] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);

  // New Item Inline State
  const [newItemDesc, setNewItemDesc] = React.useState("");
  const [newItemType, setNewItemType] = React.useState("MATERIAL");
  const [newItemQty, setNewItemQty] = React.useState(1);
  const [newItemPrice, setNewItemPrice] = React.useState(0);
  const [newItemDiscount, setNewItemDiscount] = React.useState(0);
  const [newItemTax, setNewItemTax] = React.useState(19);

  // Signature approvals simulator
  const [salesSigned, setSalesSigned] = React.useState<boolean>(false);
  const [clientSigned, setClientSigned] = React.useState<boolean>(false);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      clientId: "",
      requirementId: "",
      // eslint-disable-next-line react-hooks/purity
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // 15 days default
    },
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const qList = await getQuotes(tenantParam);
      const cList = await getClients(tenantParam);
      const rList = await getRequirements(tenantParam);
      setQuotes(qList);
      setClients(cList.map(c => ({ id: c.id, name: c.name })));
      setRequirements(rList);

      if (selectedQuote) {
        const updated = qList.find(q => q.id === selectedQuote.id);
        if (updated) {
          setSelectedQuote(updated);
          // Reload items for active quote
          setItemsLoading(true);
          const iList = await getQuoteItems(updated.id);
          setItems(iList);
          setItemsLoading(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantParam, selectedQuote]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [tenantParam]);

  const handleSelectQuote = async (quote: QuoteRow) => {
    setSelectedQuote(quote);
    setItemsLoading(true);
    try {
      const iList = await getQuoteItems(quote.id);
      setItems(iList);
      setSalesSigned(false);
      setClientSigned(false);
    } catch (e) {
      console.error(e);
    } finally {
      setItemsLoading(false);
    }
  };

  const onSubmit = async (values: QuoteFormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createQuote(tenantParam, {
        clientId: values.clientId,
        requirementId: values.requirementId,
        validUntil: values.validUntil,
      });
      setIsSheetOpen(false);
      form.reset();
      await loadData();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Error al crear la cotización.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedQuote) return;
    if (!newItemDesc.trim()) {
      toast.error("Ingrese la descripción del ítem.");
      return;
    }
    if (newItemPrice <= 0 || newItemQty <= 0) {
      toast.error("La cantidad y precio unitario deben ser mayores a cero.");
      return;
    }

    setAddingItem(true);
    try {
      await addQuoteItem(tenantParam, {
        quoteId: selectedQuote.id,
        description: newItemDesc,
        itemType: newItemType,
        quantity: newItemQty,
        unitPrice: newItemPrice,
        discountAmount: newItemDiscount,
        taxPercent: newItemTax,
        itemOrder: items.length + 1
      });
      // Clear fields
      setNewItemDesc("");
      setNewItemQty(1);
      setNewItemPrice(0);
      setNewItemDiscount(0);
      
      // Reload quote data to get updated totals
      await loadData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAddingItem(false);
    }
  };

  const handleAdvanceToQuote = async (targetStatus: string) => {
    if (!selectedQuote) return;
    if (items.length === 0 && targetStatus === "EN_REVISION") {
      toast.error("Bloqueo de flujo: No se puede avanzar la cotización a revisión sin registrar al menos un ítem (Regla TC-QT-04).");
      return;
    }

    try {
      await updateQuoteStatus(selectedQuote.id, targetStatus);
      await loadData();
      toast.success(`Estado de la cotización cambiado a: ${targetStatus}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filteredQuotes = quotes.filter(q => 
    q.quote_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.client?.legal_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Módulo Comercial B2B
          </div>
          <h1 className="text-base font-mono uppercase tracking-widest font-bold text-foreground mt-1">
            Cotizaciones y Propuestas
          </h1>
          <p className="text-xs text-muted-foreground">
            Creación de presupuestos comerciales, desglose de SKUs y flujos de aprobación.
          </p>
        </div>

        {/* Sheet Slide-out to Create Quote */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md shadow-sm transition-all active:scale-[0.98]">
              <Plus className="w-4 h-4" /> Nueva Cotización
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col bg-bg-elevated-1 border-l border-line p-0 w-full sm:max-w-md backdrop-blur-md h-full">
            {/* Header Fijo */}
            <div className="flex-none p-6 md:p-8 border-b border-line bg-bg-elevated-1/80 backdrop-blur-sm z-layer-content">
              <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">{"// Comercial / Propuestas"}</span>
              <h3 className="text-base font-mono uppercase tracking-wider font-bold text-ink mt-0.5">Crear Cotización</h3>
              <p className="text-xs text-ink-muted">Genera una nueva propuesta comercial vinculada a una cuenta y requerimiento técnico.</p>
            </div>

            {/* Body Scrolleable */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {errorMsg && (
                <div className="p-3.5 rounded-md bg-state-danger/10 border border-state-danger/20 text-xs text-state-danger font-mono">
                  {errorMsg}
                </div>
              )}

              <Form {...form}>
                <form id="create-quote-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Cliente Asociado (Cuenta B2B)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary">
                              <SelectValue placeholder="Seleccione el cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            {clients.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requirementId"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Requerimiento de Ingeniería (Opcional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary">
                              <SelectValue placeholder="Vincular requerimiento técnico" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            {requirements.map(r => (
                              <SelectItem key={r.id} value={r.id}>{r.requirement_code} — {r.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="validUntil"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Fecha Límite de Validez</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="bg-background border-border text-foreground text-xs font-mono shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </div>

            {/* Footer Fijo */}
            <div className="flex-none p-6 md:p-8 border-t border-border bg-card/80 backdrop-blur-sm z-10 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} disabled={submitting} className="border-border text-foreground text-xs hover:bg-accent cursor-pointer bg-card">
                Cancelar
              </Button>
              <Button type="submit" form="create-quote-form" disabled={submitting} className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs cursor-pointer px-4">
                {submitting ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
                Crear Cotización
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Grid Layout Full Width */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por folio o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border text-xs text-foreground placeholder-muted-foreground/60 h-9 rounded-md shadow-inner"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 border border-border rounded-xl bg-card/30">
            <Spinner size="lg" className="text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest font-bold">Cargando cotizaciones...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredQuotes.map(q => {
              let statusVariant: "secondary" | "warning" | "destructive" | "success" | "info" = "secondary";
              if (q.status === "APROBADA") statusVariant = "success";
              if (q.status === "EN_REVISION" || q.status === "ENVIADA") statusVariant = "info";
              if (q.status === "VENCIDA") statusVariant = "destructive";

              return (
                <div
                  key={q.id}
                  onClick={() => handleSelectQuote(q)}
                  className="p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2.5 bg-card/50 border-border hover:bg-accent/40 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-foreground bg-accent border border-border px-1.5 py-0.5 rounded shadow-sm">
                      {q.quote_code}
                    </span>
                    <Badge variant={statusVariant} className="text-[8px] py-0 px-1 font-semibold font-mono uppercase">
                      {q.status}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-foreground tracking-tight line-clamp-1">{q.client?.legal_name || "Cliente General"}</h4>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono pt-1">
                      <span>Vence: {q.valid_until}</span>
                      <span className="text-foreground font-bold">{formatCurrency(q.total_amount || 0)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredQuotes.length === 0 && (
              <div className="col-span-full border border-border bg-card/20 rounded-xl p-8 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
                {"// No se encontraron cotizaciones registradas."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer / Sheet modal lateral para detalle de cotización */}
      <Sheet open={selectedQuote !== null} onOpenChange={(open) => { if (!open) setSelectedQuote(null); }}>
        <SheetContent className="flex flex-col h-full w-full max-w-[80vw] sm:max-w-[700px] md:max-w-[800px] border-l border-border bg-card p-0 shadow-2xl text-left">
          {selectedQuote && (
            <div className="h-full flex flex-col bg-card text-foreground">
              {/* Detail Header */}
              <div className="p-6 border-b border-border bg-muted/50 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{selectedQuote.quote_code}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">• Validez hasta {selectedQuote.valid_until}</span>
                  </div>
                  <h3 className="font-mono text-sm uppercase tracking-wider font-bold text-foreground mt-0.5">
                    {selectedQuote.client?.legal_name}
                  </h3>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">{"// Flujo de Oferta"}</div>
                  <Badge variant={selectedQuote.status === "APROBADA" ? "success" : "warning"} className="text-[10px] font-semibold py-0.5 px-2">
                    {selectedQuote.status}
                  </Badge>
                </div>
              </div>

              {/* Detail Workspace */}
              <div className="p-6 flex-1 space-y-6 overflow-y-auto">
                {/* 1. Items Table */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Briefcase className="w-3.5 h-3.5 text-primary" /> {"// Desglose de SKUs y Conceptos"}
                  </div>

                  {itemsLoading ? (
                    <div className="flex justify-center py-6">
                      <Spinner size="sm" className="text-muted-foreground" />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-border bg-muted/30 overflow-hidden shadow-xs">
                      <table className="w-full border-collapse text-left">
                        <thead className="bg-muted border-b border-border text-[9px] font-mono uppercase text-muted-foreground font-bold">
                          <tr>
                            <th className="p-2 pl-3">#</th>
                            <th className="p-2">Descripción</th>
                            <th className="p-2 text-right">Cant</th>
                            <th className="p-2 text-right">P. Unit</th>
                            <th className="p-2 text-right">Desc</th>
                            <th className="p-2 text-right pr-3">Total (Con IVA)</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs font-mono text-foreground divide-y divide-border/40">
                          {items.map((it) => (
                            <tr key={it.id} className="hover:bg-muted/40">
                              <td className="p-2 pl-3 text-muted-foreground">{it.item_order}</td>
                              <td className="p-2 font-sans font-medium text-foreground">{it.description}</td>
                              <td className="p-2 text-right">{it.quantity} u.</td>
                              <td className="p-2 text-right">{formatCurrency(it.unit_price)}</td>
                              <td className="p-2 text-right text-warning">-{formatCurrency(it.discount_amount)}</td>
                              <td className="p-2 text-right font-bold text-foreground pr-3">{formatCurrency(it.line_total)}</td>
                            </tr>
                          ))}

                          {items.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-6 text-center text-muted-foreground font-sans italic">
                                No se registran ítems en esta propuesta. Use el formulario de abajo para agregar conceptos.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 2. Add Item Inline Form */}
                {selectedQuote.status === "BORRADOR" && (
                  <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3 shadow-xs">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-bold">{"// Agregar Concepto a Propuesta"}</div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                      <div className="md:col-span-5 space-y-1">
                        <label className="text-[10px] text-muted-foreground font-mono">Concepto / SKU</label>
                        <Input
                          placeholder="Descripcion del item o SKU"
                          value={newItemDesc}
                          onChange={(e) => setNewItemDesc(e.target.value)}
                          className="bg-background border-border text-xs h-9 text-foreground shadow-inner focus-visible:ring-primary"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] text-muted-foreground font-mono">Tipo</label>
                        <select
                          value={newItemType}
                          onChange={(e) => setNewItemType(e.target.value)}
                          className="w-full bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground focus:ring-primary focus:outline-none h-9 font-sans shadow-sm"
                        >
                          <option value="MATERIAL">Material</option>
                          <option value="SERVICIO">Servicio</option>
                        </select>
                      </div>

                      <div className="md:col-span-1 space-y-1">
                        <label className="text-[10px] text-muted-foreground font-mono">Cant</label>
                        <Input 
                          type="number"
                          value={newItemQty}
                          onChange={(e) => setNewItemQty(Number(e.target.value))}
                          className="bg-background border-border text-xs h-9 text-foreground font-mono text-right shadow-inner focus-visible:ring-primary"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] text-muted-foreground font-mono">P. Unit</label>
                        <Input 
                          type="number"
                          value={newItemPrice}
                          onChange={(e) => setNewItemPrice(Number(e.target.value))}
                          className="bg-background border-border text-xs h-9 text-foreground font-mono text-right shadow-inner focus-visible:ring-primary"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Button
                          onClick={handleAddItem}
                          disabled={addingItem}
                          className="w-full bg-muted border border-border text-foreground hover:bg-accent text-xs h-9 font-medium flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                        >
                          {addingItem ? <Spinner size="sm" /> : <Plus className="w-3.5 h-3.5" />} Añadir
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Pricing Summary & Financial Analysis */}
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/40 border border-border rounded-xl p-5 shadow-xs">
                    {/* Financial health indicator */}
                    <div className="space-y-2 pr-4 md:border-r md:border-border">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-bold">{"// Análisis Operativo"}</div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed font-sans">
                        La cotización ha sido generada bajo el motor de precios unificado, aplicando un IVA estándar del <span className="font-mono text-foreground font-bold">19%</span> y una validez garantizada de precios comerciales por inquilino.
                      </p>
                      <div className="flex items-center gap-2 pt-2">
                        <Badge variant="success" className="text-[8px] font-mono">MARGEN: OK</Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">Rentabilidad proyectada: 38%</span>
                      </div>
                    </div>

                    {/* Math breakdown */}
                    <div className="space-y-2 text-xs font-mono">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">{"// Desglose de Valores"}</div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal:</span>
                        <span className="text-foreground">{formatCurrency(selectedQuote.subtotal || 0)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Descuentos:</span>
                        <span className="text-warning font-bold">-{formatCurrency(0)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>IVA (19%):</span>
                        <span className="text-foreground">{formatCurrency((selectedQuote.subtotal || 0) * 0.19)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm border-t border-border pt-2 text-foreground">
                        <span>Importe Total:</span>
                        <span className="text-success">{formatCurrency(selectedQuote.total_amount || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Workflow sign-offs */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                    <FileCheck className="w-3.5 h-3.5 text-primary" /> {"// Firmas de Aprobación de la Propuesta"}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Sales signoff */}
                    <div className="border border-border bg-muted/40 p-4 rounded-xl space-y-3 shadow-xs">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase font-bold">{"// 1. Ejecutivo Comercial"}</div>
                      {salesSigned ? (
                        <div className="text-xs font-semibold text-success flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-4 h-4 shrink-0" /> Propuesta Visada y Firmada
                        </div>
                      ) : (
                        <Button 
                          onClick={() => setSalesSigned(true)}
                          className="w-full bg-background border border-border text-foreground hover:bg-accent text-xs h-8 cursor-pointer shadow-sm"
                        >
                          Visar Propuesta
                        </Button>
                      )}
                    </div>

                    {/* Client signoff */}
                    <div className="border border-border bg-muted/40 p-4 rounded-xl space-y-3 shadow-xs">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase font-bold">{"// 2. Aceptación Cliente B2B"}</div>
                      {clientSigned ? (
                        <div className="text-xs font-semibold text-success flex items-center gap-1 font-mono">
                          <CheckCircle2 className="w-4 h-4 shrink-0" /> Firmado Digitalmente
                        </div>
                      ) : (
                        <Button 
                          onClick={() => setClientSigned(true)}
                          disabled={!salesSigned}
                          className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs h-8 disabled:opacity-30 cursor-pointer shadow-sm"
                        >
                          Registrar Firma Cliente
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Actions / PDF Proposal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <Button 
                    onClick={() => handleAdvanceToQuote("EN_REVISION")}
                    disabled={selectedQuote.status !== "BORRADOR"}
                    className="bg-background border border-border text-foreground hover:bg-accent text-xs h-9 font-medium flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    Enviar a Revisión
                  </Button>
                  
                  <Button 
                    onClick={() => handleAdvanceToQuote("ENVIADA")}
                    disabled={selectedQuote.status !== "EN_REVISION"}
                    className="bg-background border border-border text-foreground hover:bg-accent text-xs h-9 font-medium flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5 mr-1 text-primary" /> Enviar a Cliente
                  </Button>

                  <Button 
                    onClick={() => {
                      if (clientSigned) {
                        handleAdvanceToQuote("APROBADA");
                      } else {
                        toast.error("Debe registrar la firma de aceptación del cliente antes de marcar la cotización como APROBADA.");
                      }
                    }}
                    disabled={selectedQuote.status !== "ENVIADA"}
                    className="bg-success hover:bg-success/90 text-success-foreground text-xs h-9 font-semibold flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                  >
                    Aprobar Oferta
                  </Button>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="p-4 border-t border-border bg-muted/50 text-[10px] font-mono text-muted-foreground text-center flex items-center justify-center gap-2">
                <Printer className="w-3.5 h-3.5 text-primary" />
                <button 
                    onClick={() => toast.info("Imprimiendo ficha técnica de cotización...")}
                  className="hover:underline text-muted-foreground font-semibold cursor-pointer"
                >
                  Imprimir Propuesta Comercial PDF
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
