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
  Warehouse
} from "lucide-react";

import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Badge } from "@/platform/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/platform/ui/sheet";

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

interface PurchaseOrder {
  id: string;
  code: string;
  vendorName: string;
  orderDate: string;
  status: "BORRADOR" | "EN_CAMINO" | "RECIBIDO" | "CANCELADO";
  total: number;
  items: { description: string; qty: number; price: number; unit: string }[];
}

export default function PurchasesPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedPO, setSelectedPO] = React.useState<PurchaseOrder | null>(null);

  // Local state initialized with B2B industrial mock data
  const [purchaseOrders, setPurchaseOrders] = React.useState<PurchaseOrder[]>([
    {
      id: "po-1",
      code: "OC-2026-001",
      vendorName: "Siemens S.A. Colombia",
      orderDate: "2026-06-10",
      status: "RECIBIDO",
      total: 35000000,
      items: [
        { description: "Motor Eléctrico Siemens 5HP 3F 220V IE4", qty: 5, price: 5000000, unit: "u." },
        { description: "Motor Eléctrico Siemens 7.5HP 3F 220V IE4", qty: 2, price: 5000000, unit: "u." }
      ]
    },
    {
      id: "po-2",
      code: "OC-2026-002",
      vendorName: "Aceros Industriales del Norte",
      orderDate: "2026-06-15",
      status: "EN_CAMINO",
      total: 12500000,
      items: [
        { description: "Lámina Galvanizada Calibre 14 (1.2x2.4m)", qty: 50, price: 200000, unit: "planchas" },
        { description: "Lámina de Acero Inoxidable 304 Calibre 16", qty: 10, price: 250000, unit: "planchas" }
      ]
    },
    {
      id: "po-3",
      code: "OC-2026-003",
      vendorName: "Importaciones Neumáticas S.A.",
      orderDate: "2026-06-18",
      status: "BORRADOR",
      total: 8200,
      items: [
        { description: "Sensor de Vibración Industrial Grado A", qty: 20, price: 300, unit: "u." },
        { description: "Transductor de Presión Diferencial 0-5 inWG", qty: 10, price: 220, unit: "u." }
      ]
    }
  ]);

  // Inspection Checklist
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>({
    quantity_ok: false,
    quality_ok: false,
    invoice_ok: false,
  });

  const handleSelectPO = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setChecklist({
      quantity_ok: false,
      quality_ok: false,
      invoice_ok: false,
    });
  };

  const handleUpdateStatus = (poId: string, newStatus: any) => {
    setPurchaseOrders(prev => prev.map(po => 
      po.id === poId ? { ...po, status: newStatus } : po
    ));
    if (selectedPO && selectedPO.id === poId) {
      setSelectedPO(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleReceiveOrder = () => {
    if (!selectedPO) return;
    if (!checklist.quantity_ok || !checklist.quality_ok || !checklist.invoice_ok) {
      toast.error("Complete todo el checklist de verificación física antes de registrar la entrada a bodega.");
      return;
    }
    handleUpdateStatus(selectedPO.id, "RECIBIDO");
    toast.success(`Compra ${selectedPO.code} recibida en bodega. Stock físico incrementado en inventario.`);
  };

  const filteredPOs = purchaseOrders.filter(po => 
    po.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
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
            Control de adquisiciones de motores, láminas y componentes electromecánicos con checklist de recepción.
          </p>
        </div>

        <Button 
          onClick={() => toast.info("Función para crear orden de compra simulada...")}
          className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md shadow-sm transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Nueva Orden de Compra
        </Button>
      </div>

      {/* Grid 40/60 Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: PO List */}
        <div className="xl:col-span-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por folio o proveedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border text-xs text-foreground placeholder-muted-foreground/60 h-9 rounded-md shadow-inner"
            />
          </div>

          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredPOs.map(po => {
              const isSelected = selectedPO?.id === po.id;
              let statusVariant: "secondary" | "warning" | "success" | "destructive" = "secondary";
              if (po.status === "RECIBIDO") statusVariant = "success";
              if (po.status === "EN_CAMINO") statusVariant = "warning";

              return (
                <div
                  key={po.id}
                  onClick={() => handleSelectPO(po)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2.5 ${
                    isSelected 
                      ? "bg-accent border-primary/50 shadow-md" 
                      : "bg-card/50 border-border hover:bg-accent/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-foreground bg-accent border border-border px-1.5 py-0.5 rounded shadow-sm">
                      {po.code}
                    </span>
                    <Badge variant={statusVariant} className="text-[8px] py-0 px-1 font-semibold font-mono uppercase">
                      {po.status}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-foreground tracking-tight line-clamp-1">{po.vendorName}</h4>
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground font-mono">
                      <span>Fecha: {po.orderDate}</span>
                      <span className="text-foreground font-bold">{formatCurrency(po.total)}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredPOs.length === 0 && (
              <div className="border border-border bg-card/20 rounded-xl p-8 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
                // No se encontraron órdenes de compra.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: PO Detail & Checklist Workspace */}
        <div className="xl:col-span-8 border border-border bg-card/45 rounded-xl backdrop-blur-md overflow-hidden flex flex-col min-h-[640px] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
          {selectedPO ? (
            <div className="flex-grow flex flex-col">
              
              {/* Detail Header */}
              <div className="p-6 border-b border-border bg-accent/25 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{selectedPO.code}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">• Solicitado el {selectedPO.orderDate}</span>
                  </div>
                  <h3 className="font-mono text-sm uppercase tracking-wider font-bold text-foreground mt-0.5">
                    {selectedPO.vendorName}
                  </h3>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">// Estado Despacho</div>
                  <Badge variant={selectedPO.status === "RECIBIDO" ? "success" : selectedPO.status === "EN_CAMINO" ? "warning" : "secondary"} className="text-[10px] font-semibold py-0.5 px-2">
                    {selectedPO.status}
                  </Badge>
                </div>
              </div>

              {/* Detail Workspace */}
              <div className="p-6 flex-1 space-y-6 overflow-y-auto max-h-[580px]">
                
                {/* 1. Items List */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <ShoppingBag className="w-3.5 h-3.5 text-primary" /> // Materiales y Componentes Adquiridos
                  </div>

                  <div className="rounded-lg border border-border bg-accent/20 overflow-hidden shadow-xs">
                    <table className="w-full border-collapse text-left">
                      <thead className="bg-accent/40 border-b border-border text-[9px] font-mono uppercase text-muted-foreground font-bold">
                        <tr>
                          <th className="p-2 pl-3">Descripción del Material</th>
                          <th className="p-2 text-right">Cantidad</th>
                          <th className="p-2 text-right">Costo Unit.</th>
                          <th className="p-2 text-right pr-3">Total</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-mono text-foreground divide-y divide-border/40">
                        {selectedPO.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-accent/20">
                            <td className="p-2 pl-3 font-sans font-medium text-foreground">{it.description}</td>
                            <td className="p-2 text-right">{it.qty} {it.unit}</td>
                            <td className="p-2 text-right">{formatCurrency(it.price)}</td>
                            <td className="p-2 text-right font-bold text-foreground pr-3">{formatCurrency(it.qty * it.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-end text-xs font-mono">
                    <div className="bg-accent/25 border border-border rounded px-4 py-2 flex items-center gap-4 shadow-sm">
                      <span className="text-muted-foreground uppercase font-bold">// Total Adquisición:</span>
                      <span className="text-success font-bold text-sm">{formatCurrency(selectedPO.total)}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Reception Checklist (For EN_CAMINO status) */}
                {selectedPO.status === "EN_CAMINO" && (
                  <div className="space-y-4">
                    <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <Warehouse className="w-3.5 h-3.5 text-primary" /> // Control de Recepción en Bodega (WMS)
                    </div>

                    <div className="bg-accent/20 border border-border rounded-xl p-4 space-y-3.5 shadow-xs">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Antes de ingresar los componentes al stock disponible del ERP, el almacenista debe validar físicamente las condiciones de entrega de la mercancía.
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { id: "quantity_ok", label: "Caja y cantidad coincide" },
                          { id: "quality_ok", label: "Sin abolladuras ni defectos" },
                          { id: "invoice_ok", label: "Factura de proveedor adjunta" }
                        ].map(chk => (
                          <button
                            key={chk.id}
                            onClick={() => setChecklist({ ...checklist, [chk.id]: !checklist[chk.id] })}
                            className={`flex items-start text-left gap-2 p-2.5 rounded border transition-all text-xs cursor-pointer ${
                              checklist[chk.id] 
                                ? "bg-accent border-success/20 text-foreground" 
                                : "bg-background border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
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
                        <Button 
                          onClick={handleReceiveOrder}
                          className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-xs h-9 font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Validar y Recibir en Stock
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Reception Confirmed Card */}
                {selectedPO.status === "RECIBIDO" && (
                  <div className="border border-success/20 bg-success/10 rounded-xl p-4 flex items-center gap-3.5 text-xs text-foreground shadow-sm">
                    <ShieldCheck className="w-8 h-8 text-success shrink-0" />
                    <div>
                      <div className="font-semibold text-success text-sm">Entrada Registrada en Bodega Principal</div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                        La mercancía ha sido transferida exitosamente al inventario físico. Verificado por Almacén General.
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. Action triggers for Draft PO */}
                {selectedPO.status === "BORRADOR" && (
                  <div className="space-y-3 pt-4 border-t border-border">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase font-bold">// Procesar Orden de Compra</div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => handleUpdateStatus(selectedPO.id, "EN_CAMINO")}
                        className="flex-1 bg-card border border-border text-foreground hover:bg-accent text-xs h-9 font-medium flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Truck className="w-4 h-4 text-primary" /> Despachar / En camino
                      </Button>
                      <Button 
                        onClick={() => handleUpdateStatus(selectedPO.id, "CANCELADO")}
                        className="bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 text-xs h-9 px-4 cursor-pointer shadow-sm"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom bar */}
              <div className="p-4 border-t border-border bg-accent/25 text-[10px] font-mono text-muted-foreground text-center flex items-center justify-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Auditoría de Recepciones • WMS Integrado</span>
              </div>

            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-10 h-10 rounded-xl border border-border bg-accent flex items-center justify-center text-muted-foreground">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-foreground font-mono uppercase tracking-widest">// Workspace de Abastecimiento</h4>
                <p className="text-[11px] text-muted-foreground max-w-[280px]">
                  Seleccione una orden de compra del listado de la izquierda para abrir el control de recepción y checklist de inventarios.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
