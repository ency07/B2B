"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Sparkles,
  Search,
  Plus,
  CheckCircle2,
  Clock,
  Truck,
  ShieldCheck,
  ShoppingBag,
  Warehouse,
} from "lucide-react";

import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Badge } from "@/platform/ui/badge";
import {
  getPurchaseOrders,
  approvePurchaseOrder,
  receivePurchaseOrder,
  type PurchaseOrderData,
} from "@/erp/actions/core";

const formatCurrency = (amount: number) => {
  if (amount < 100000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency: "USD",
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("es-CO", {
    style: "currency", currency: "COP",
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
};

const STATUS_BADGE: Record<string, "secondary" | "warning" | "success" | "destructive" | "info"> = {
  BORRADOR: "secondary",
  EN_APROBACION: "info",
  APROBADA: "info",
  RECHAZADA: "destructive",
  EN_CAMINO: "warning",
  RECIBIDA: "success",
  CANCELADA: "destructive",
};

const STATUS_LABEL: Record<string, string> = {
  BORRADOR: "Borrador",
  EN_APROBACION: "En aprobación",
  APROBADA: "Aprobada",
  RECHAZADA: "Rechazada",
  EN_CAMINO: "En camino",
  RECIBIDA: "Recibida",
  CANCELADA: "Cancelada",
};

export default function PurchasesPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [orders, setOrders] = React.useState<PurchaseOrderData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPO, setSelectedPO] = React.useState<PurchaseOrderData | null>(null);
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>({
    quantity_ok: false, quality_ok: false, invoice_ok: false,
  });

  const loadData = React.useCallback(async () => {
    try {
      const data = await getPurchaseOrders(tenantParam);
      setOrders(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cargar OC");
    } finally {
      setLoading(false);
    }
  }, [tenantParam]);

  // Initial data load
  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getPurchaseOrders(tenantParam);
        if (active) setOrders(data);
      } catch (err) {
        if (active) {
          toast.error(err instanceof Error ? err.message : "Error al cargar OC");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectPO = (po: PurchaseOrderData) => {
    setSelectedPO(po);
    setChecklist({ quantity_ok: false, quality_ok: false, invoice_ok: false });
  };

  const handleApprove = async () => {
    if (!selectedPO) return;
    try {
      await approvePurchaseOrder(tenantParam, selectedPO.id);
      toast.success(`OC ${selectedPO.code} aprobada`);
      setSelectedPO(null);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al aprobar");
    }
  };

  const handleReceive = async () => {
    if (!selectedPO) return;
    if (!checklist.quantity_ok || !checklist.quality_ok || !checklist.invoice_ok) {
      toast.error("Complete todo el checklist antes de recibir.");
      return;
    }
    try {
      await receivePurchaseOrder(tenantParam, selectedPO.id);
      toast.success(`OC ${selectedPO.code} recibida en bodega`);
      setSelectedPO(null);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al recibir");
    }
  };

  const handleTransition = async (newStatus: string) => {
    if (!selectedPO) return;
    try {
      if (newStatus === "EN_APROBACION") {
        // Pasar de BORRADOR → EN_APROBACION (update directo sin action específica)
        const { supabaseAdmin } = await import("@/platform/auth/clients");
        await supabaseAdmin
          .from("purchase_orders")
          .update({ status: "EN_APROBACION" })
          .eq("id", selectedPO.id);
        toast.success("OC enviada a aprobación");
      } else if (newStatus === "EN_CAMINO") {
        const { supabaseAdmin } = await import("@/platform/auth/clients");
        await supabaseAdmin
          .from("purchase_orders")
          .update({ status: "EN_CAMINO" })
          .eq("id", selectedPO.id);
        toast.success("OC marcada como en camino");
      }
      setSelectedPO(null);
      await loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar");
    }
  };

  const filteredPOs = orders.filter(po =>
    po.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.vendor_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Módulo de Abastecimiento
          </div>
          <h1 className="text-base font-mono uppercase tracking-widest font-bold text-foreground mt-1">
            Órdenes de Compra (OC)
          </h1>
          <p className="text-xs text-muted-foreground">
            Control de adquisiciones con flujo de aprobación y recepción en bodega.
          </p>
        </div>
        <Button onClick={() => toast.info("Función de creación próxima en próxima actualización")}
          className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md shadow-sm transition-all active:scale-[0.98]">
          <Plus className="w-4 h-4" /> Nueva Orden de Compra
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: PO List */}
        <div className="xl:col-span-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Buscar por folio o proveedor..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border text-xs text-foreground placeholder-muted-foreground/60 h-9 rounded-md shadow-inner" />
          </div>
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {loading ? (
              <div className="text-center text-xs text-muted-foreground py-8 font-mono">Cargando...</div>
            ) : filteredPOs.map(po => {
              const isSelected = selectedPO?.id === po.id;
              return (
                <div key={po.id} onClick={() => handleSelectPO(po)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2.5 ${
                    isSelected ? "bg-accent border-primary/50 shadow-md" : "bg-card/50 border-border hover:bg-accent/40"
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-foreground bg-accent border border-border px-1.5 py-0.5 rounded shadow-sm">{po.code}</span>
                    <Badge variant={STATUS_BADGE[po.status] || "secondary"} className="text-[8px] py-0 px-1 font-semibold font-mono uppercase">{STATUS_LABEL[po.status] || po.status}</Badge>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-foreground tracking-tight line-clamp-1">{po.vendor_name}</h4>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                      <span>Fecha: {po.created_at?.slice(0, 10)}</span>
                      <span className="text-foreground font-bold">{formatCurrency(po.total_amount)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {!loading && filteredPOs.length === 0 && (
              <div className="border border-border bg-card/20 rounded-xl p-8 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
                No se encontraron órdenes de compra.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detail */}
        <div className="xl:col-span-8 border border-border bg-card/45 rounded-xl backdrop-blur-md overflow-hidden flex flex-col min-h-[640px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
          {selectedPO ? (
            <div className="flex-grow flex flex-col">
              {/* Detail Header */}
              <div className="p-6 border-b border-border bg-accent/25 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{selectedPO.code}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">• Creado el {selectedPO.created_at?.slice(0, 10)}</span>
                  </div>
                  <h3 className="font-mono text-sm uppercase tracking-wider font-bold text-foreground mt-0.5">{selectedPO.vendor_name}</h3>
                </div>
                <div className="text-right space-y-1">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">Estado</div>
                  <Badge variant={STATUS_BADGE[selectedPO.status] || "secondary"} className="text-[10px] font-semibold py-0.5 px-2">
                    {STATUS_LABEL[selectedPO.status] || selectedPO.status}
                  </Badge>
                </div>
              </div>

              {/* Detail Workspace */}
              <div className="p-6 flex-1 space-y-6 overflow-y-auto max-h-[580px]">
                {/* Items */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <ShoppingBag className="w-3.5 h-3.5 text-primary" /> Materiales y Componentes
                  </div>
                  <div className="rounded-lg border border-border bg-accent/20 overflow-hidden shadow-xs">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-accent/40 border-b border-border text-[9px] font-mono uppercase text-muted-foreground font-bold">
                        <tr>
                          <th className="p-2 pl-3">Descripción</th>
                          <th className="p-2 text-right">Cantidad</th>
                          <th className="p-2 text-right">Costo Unit.</th>
                          <th className="p-2 text-right pr-3">Total</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-mono text-foreground divide-y divide-border/40">
                        {selectedPO.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-accent/20">
                            <td className="p-2 pl-3 font-sans font-medium text-foreground">{it.description}</td>
                            <td className="p-2 text-right">{it.quantity} u.</td>
                            <td className="p-2 text-right">{formatCurrency(it.unit_price)}</td>
                            <td className="p-2 text-right font-bold text-foreground pr-3">{formatCurrency(it.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end text-xs font-mono">
                    <div className="bg-accent/25 border border-border rounded px-4 py-2 flex items-center gap-4 shadow-sm">
                      <span className="text-muted-foreground uppercase font-bold">Total:</span>
                      <span className="text-success font-bold text-sm">{formatCurrency(selectedPO.total_amount)}</span>
                    </div>
                  </div>
                </div>

                {/* BORRADOR → Solicitar aprobación */}
                {selectedPO.status === "BORRADOR" && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Acciones</div>
                    <div className="flex gap-3">
                      <Button onClick={() => handleTransition("EN_APROBACION")}
                        className="flex-1 bg-card border border-border text-foreground hover:bg-accent text-xs h-9 font-medium flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                        <Clock className="w-4 h-4 text-primary" /> Solicitar Aprobación
                      </Button>
                    </div>
                  </div>
                )}

                {/* EN_APROBACION → Aprobar / Rechazar */}
                {selectedPO.status === "EN_APROBACION" && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Aprobación</div>
                    <div className="flex gap-3">
                      <Button onClick={handleApprove}
                        className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground text-xs h-9 font-medium flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                        <CheckCircle2 className="w-4 h-4" /> Aprobar
                      </Button>
                    </div>
                  </div>
                )}

                {/* APROBADA → Despachar */}
                {selectedPO.status === "APROBADA" && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Logística</div>
                    <div className="flex gap-3">
                      <Button onClick={() => handleTransition("EN_CAMINO")}
                        className="flex-1 bg-card border border-border text-foreground hover:bg-accent text-xs h-9 font-medium flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                        <Truck className="w-4 h-4 text-primary" /> Marcar como En Camino
                      </Button>
                    </div>
                  </div>
                )}

                {/* EN_CAMINO → Checklist + Recibir */}
                {selectedPO.status === "EN_CAMINO" && (
                  <div className="space-y-4">
                    <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Warehouse className="w-3.5 h-3.5 text-primary" /> Control de Recepción en Bodega
                    </div>
                    <div className="bg-accent/20 border border-border rounded-xl p-4 space-y-3.5 shadow-xs">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Antes de ingresar los componentes al stock, el almacenista debe validar físicamente las condiciones de entrega.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { id: "quantity_ok", label: "Caja y cantidad coincide" },
                          { id: "quality_ok", label: "Sin abolladuras ni defectos" },
                          { id: "invoice_ok", label: "Factura de proveedor adjunta" },
                        ].map(chk => (
                          <button key={chk.id} onClick={() => setChecklist({ ...checklist, [chk.id]: !checklist[chk.id] })}
                            className={`flex items-start text-left gap-2 p-2.5 rounded border transition-all text-xs cursor-pointer ${
                              checklist[chk.id] ? "bg-accent border-success/20 text-foreground" : "bg-background border-border text-muted-foreground hover:text-foreground"
                            }`}>
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                              checklist[chk.id] ? "border-primary bg-primary/10" : "border-border"
                            }`}>
                              {checklist[chk.id] && <span className="w-1.5 h-1.5 bg-primary/80 rounded-full" />}
                            </div>
                            <span>{chk.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="pt-2">
                        <Button onClick={handleReceive}
                          className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs h-9 font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                          <CheckCircle2 className="w-4 h-4" /> Validar y Recibir en Stock
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* RECIBIDA → Éxito */}
                {selectedPO.status === "RECIBIDA" && (
                  <div className="border border-success/20 bg-success/10 rounded-xl p-4 flex items-center gap-3.5 text-xs text-foreground shadow-sm">
                    <ShieldCheck className="w-8 h-8 text-success shrink-0" />
                    <div>
                      <div className="font-semibold text-success text-sm">Entrada Registrada en Bodega</div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                        Mercancía transferida al inventario físico.
                      </p>
                    </div>
                  </div>
                )}

                {/* CANCELADA / RECHAZADA */}
                {(selectedPO.status === "CANCELADA" || selectedPO.status === "RECHAZADA") && (
                  <div className="border border-destructive/20 bg-destructive/10 rounded-xl p-4 flex items-center gap-3.5 text-xs text-foreground shadow-sm">
                    <ShieldCheck className="w-8 h-8 text-destructive shrink-0" />
                    <div>
                      <div className="font-semibold text-destructive text-sm">OC {STATUS_LABEL[selectedPO.status]}</div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                        Esta orden de compra fue {selectedPO.status === "CANCELADA" ? "cancelada" : "rechazada"}.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom bar */}
              <div className="p-4 border-t border-border bg-accent/25 text-[10px] font-mono text-muted-foreground text-center flex items-center justify-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Flujo de Compras • Aprobación + Recepción</span>
              </div>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl border border-border bg-accent flex items-center justify-center text-muted-foreground">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-foreground font-mono uppercase tracking-widest">Workspace de Abastecimiento</h4>
                <p className="text-[11px] text-muted-foreground max-w-[280px]">
                  Seleccione una orden de compra del listado para ver detalle y gestionar su ciclo de vida.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
