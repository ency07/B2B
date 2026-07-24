"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Sparkles,
  Plus,
  Truck,
  Building2,
  ClipboardList,
  FileCheck2,
  ShoppingBag,
  PackageCheck,
  Trash2,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";

import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Textarea } from "@/platform/ui/textarea";
import { Badge } from "@/platform/ui/badge";
import { Spinner } from "@/platform/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/platform/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/platform/ui/sheet";

import {
  listProveedores, createProveedor, updateProveedor, type ProveedorRow,
  listSolicitudesCompra, createSolicitudCompra, updateSolicitudCompraStatus, type SolicitudCompraRow,
  listCotizacionesProveedor, createCotizacionProveedor, updateCotizacionProveedorEstado, type CotizacionProveedorRow,
  listOrdenesCompra, createOrdenCompra, updateOrdenCompraStatus, type OrdenCompraRow,
  listRecepciones, createRecepcion, type RecepcionRow,
  listWarehousesForPurchases, type WarehouseOption,
} from "@/erp/actions/purchases";

type TabId = "proveedores" | "solicitudes" | "cotizaciones" | "ordenes" | "recepciones";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

export default function PurchasesPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [activeTab, setActiveTab] = React.useState<TabId>("proveedores");
  const [loading, setLoading] = React.useState(true);

  const [proveedores, setProveedores] = React.useState<ProveedorRow[]>([]);
  const [solicitudes, setSolicitudes] = React.useState<SolicitudCompraRow[]>([]);
  const [cotizaciones, setCotizaciones] = React.useState<CotizacionProveedorRow[]>([]);
  const [ordenes, setOrdenes] = React.useState<OrdenCompraRow[]>([]);
  const [recepciones, setRecepciones] = React.useState<RecepcionRow[]>([]);
  const [warehouses, setWarehouses] = React.useState<WarehouseOption[]>([]);

  const loadAll = React.useCallback(async () => {
    setLoading(true);
    try {
      const [p, s, c, o, r, w] = await Promise.all([
        listProveedores(tenantParam),
        listSolicitudesCompra(tenantParam),
        listCotizacionesProveedor(tenantParam),
        listOrdenesCompra(tenantParam),
        listRecepciones(tenantParam),
        listWarehousesForPurchases(tenantParam),
      ]);
      setProveedores(p);
      setSolicitudes(s);
      setCotizaciones(c);
      setOrdenes(o);
      setRecepciones(r);
      setWarehouses(w);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  }, [tenantParam]);

  React.useEffect(() => {
    queueMicrotask(() => { loadAll(); });
  }, [loadAll]);

  const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "proveedores", label: "Proveedores", icon: Building2 },
    { id: "solicitudes", label: "Solicitudes", icon: ClipboardList },
    { id: "cotizaciones", label: "Cotizaciones", icon: FileCheck2 },
    { id: "ordenes", label: "Órdenes de Compra", icon: ShoppingBag },
    { id: "recepciones", label: "Recepciones", icon: PackageCheck },
  ];

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Módulo de Abastecimiento
          </div>
          <h1 className="text-base font-mono uppercase tracking-widest font-bold text-foreground mt-1">
            Compras
          </h1>
          <p className="text-xs text-muted-foreground">
            Proveedores, solicitudes, cotizaciones, órdenes de compra y recepción en bodega.
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-mono uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? "border-primary text-foreground font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 border border-border rounded-xl bg-card/30">
          <Spinner size="lg" className="text-muted-foreground mb-2" />
        </div>
      ) : (
        <>
          {activeTab === "proveedores" && (
            <ProveedoresTab tenantParam={tenantParam} proveedores={proveedores} onReload={loadAll} />
          )}
          {activeTab === "solicitudes" && (
            <SolicitudesTab tenantParam={tenantParam} solicitudes={solicitudes} onReload={loadAll} />
          )}
          {activeTab === "cotizaciones" && (
            <CotizacionesTab tenantParam={tenantParam} cotizaciones={cotizaciones} solicitudes={solicitudes} proveedores={proveedores} onReload={loadAll} />
          )}
          {activeTab === "ordenes" && (
            <OrdenesTab tenantParam={tenantParam} ordenes={ordenes} proveedores={proveedores} solicitudes={solicitudes} cotizaciones={cotizaciones} onReload={loadAll} />
          )}
          {activeTab === "recepciones" && (
            <RecepcionesTab tenantParam={tenantParam} recepciones={recepciones} ordenes={ordenes} warehouses={warehouses} onReload={loadAll} />
          )}
        </>
      )}
    </div>
  );
}

// ==========================================
// PROVEEDORES
// ==========================================

function ProveedoresTab({ tenantParam, proveedores, onReload }: {
  tenantParam: string | null; proveedores: ProveedorRow[]; onReload: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({
    razonSocial: "", nit: "", ciudad: "", telefono: "", correo: "",
    categoria: "MATERIALES", diasCredito: 30, condicionesPago: "",
  });

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const result = await createProveedor(tenantParam, form);
      if (!result.success) { toast.error(result.error || "Error"); return; }
      toast.success("Proveedor creado.");
      setIsOpen(false);
      setForm({ razonSocial: "", nit: "", ciudad: "", telefono: "", correo: "", categoria: "MATERIALES", diasCredito: 30, condicionesPago: "" });
      await onReload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleEstado = async (p: ProveedorRow) => {
    try {
      const result = await updateProveedor(tenantParam, p.id, { estado: p.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO" });
      if (!result.success) { toast.error(result.error || "Error"); return; }
      await onReload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md">
              <Plus className="w-4 h-4" /> Nuevo Proveedor
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-md">
            <div className="p-8 space-y-5">
              <h3 className="text-base font-mono uppercase tracking-wider font-bold text-foreground">Nuevo Proveedor</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Razón Social</label>
                <Input value={form.razonSocial} onChange={(e) => setForm({ ...form, razonSocial: e.target.value })} className="bg-background border-border text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">NIT</label>
                  <Input value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} className="bg-background border-border text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Ciudad</label>
                  <Input value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} className="bg-background border-border text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Teléfono</label>
                  <Input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="bg-background border-border text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Correo</label>
                  <Input value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} className="bg-background border-border text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Categoría</label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger className="bg-background border-border text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATERIALES">Materiales</SelectItem>
                    <SelectItem value="SERVICIOS">Servicios</SelectItem>
                    <SelectItem value="EQUIPOS">Equipos</SelectItem>
                    <SelectItem value="CONSUMIBLES">Consumibles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Días de crédito</label>
                <Input type="number" value={form.diasCredito} onChange={(e) => setForm({ ...form, diasCredito: Number(e.target.value) })} className="bg-background border-border text-xs" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={submitting} className="text-xs">Cancelar</Button>
                <Button onClick={handleCreate} disabled={submitting || !form.razonSocial} className="bg-primary text-primary-foreground text-xs">
                  {submitting ? <Spinner size="sm" className="mr-2" /> : null} Crear Proveedor
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {proveedores.map((p) => (
          <div key={p.id} className="p-4 rounded-xl border border-border bg-card/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-foreground bg-accent border border-border px-1.5 py-0.5 rounded">{p.codigo}</span>
              <div className="flex items-center gap-1.5">
                {p.bloqueado && <Badge variant="destructive" className="text-[8px] py-0 px-1">BLOQUEADO</Badge>}
                <Badge variant={p.estado === "ACTIVO" ? "success" : "secondary"} className="text-[8px] py-0 px-1">{p.estado}</Badge>
              </div>
            </div>
            <h4 className="text-xs font-semibold text-foreground line-clamp-1">{p.razonSocial}</h4>
            <div className="text-[10px] text-muted-foreground font-mono space-y-0.5">
              <div>{p.nit || "Sin NIT"} · {p.ciudad || "—"}</div>
              <div>Score: {p.score}/100 · {p.categoria}</div>
              {p.bloqueadoMotivo && <div className="text-destructive">{p.bloqueadoMotivo}</div>}
            </div>
            <Button onClick={() => handleToggleEstado(p)} className="w-full bg-background border border-border text-foreground hover:bg-accent text-[10px] h-7 cursor-pointer">
              {p.estado === "ACTIVO" ? "Desactivar" : "Activar"}
            </Button>
          </div>
        ))}
        {proveedores.length === 0 && (
          <div className="col-span-full border border-border bg-card/20 rounded-xl p-8 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
            Sin proveedores registrados.
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// SOLICITUDES
// ==========================================

function SolicitudesTab({ tenantParam, solicitudes, onReload }: {
  tenantParam: string | null; solicitudes: SolicitudCompraRow[]; onReload: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [selected, setSelected] = React.useState<SolicitudCompraRow | null>(null);
  const [motivo, setMotivo] = React.useState("");
  const [form, setForm] = React.useState({
    area: "", proyecto: "", prioridad: "MEDIA", justificacion: "", valorEstimado: "",
    items: [{ descripcion: "", cantidad: 1, unidad: "un" }] as { descripcion: string; cantidad: number; unidad: string }[],
  });

  const resetForm = () => setForm({ area: "", proyecto: "", prioridad: "MEDIA", justificacion: "", valorEstimado: "", items: [{ descripcion: "", cantidad: 1, unidad: "un" }] });

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const result = await createSolicitudCompra(tenantParam, {
        ...form,
        valorEstimado: form.valorEstimado ? Number(form.valorEstimado) : undefined,
        items: form.items.filter((it) => it.descripcion.trim()),
      });
      if (!result.success) { toast.error(result.error || "Error"); return; }
      toast.success("Solicitud de compra creada.");
      setIsOpen(false);
      resetForm();
      await onReload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (newStatus: string) => {
    if (!selected) return;
    try {
      const result = await updateSolicitudCompraStatus(tenantParam, {
        solicitudId: selected.id,
        newStatus,
        motivoRechazo: newStatus === "RECHAZADA" ? motivo : undefined,
        motivoCancelacion: newStatus === "CANCELADA" ? motivo : undefined,
      });
      if (!result.success) { toast.error(result.error || "Error"); return; }
      toast.success(`Solicitud ${selected.codigo} actualizada.`);
      setSelected(null);
      setMotivo("");
      await onReload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md">
              <Plus className="w-4 h-4" /> Nueva Solicitud
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-md">
            <div className="p-8 space-y-5">
              <h3 className="text-base font-mono uppercase tracking-wider font-bold text-foreground">Nueva Solicitud de Compra</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Área</label>
                  <Input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} className="bg-background border-border text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Proyecto</label>
                  <Input value={form.proyecto} onChange={(e) => setForm({ ...form, proyecto: e.target.value })} className="bg-background border-border text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Prioridad</label>
                <Select value={form.prioridad} onValueChange={(v) => setForm({ ...form, prioridad: v })}>
                  <SelectTrigger className="bg-background border-border text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="URGENTE">Urgente</SelectItem>
                    <SelectItem value="ALTA">Alta</SelectItem>
                    <SelectItem value="MEDIA">Media</SelectItem>
                    <SelectItem value="BAJA">Baja</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Justificación (mín. 10 caracteres)</label>
                <Textarea rows={3} value={form.justificacion} onChange={(e) => setForm({ ...form, justificacion: e.target.value })} className="bg-background border-border text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Valor estimado (COP)</label>
                <Input type="number" value={form.valorEstimado} onChange={(e) => setForm({ ...form, valorEstimado: e.target.value })} className="bg-background border-border text-xs" placeholder="Determina el nivel de aprobación requerido" />
              </div>

              <div className="space-y-2 pt-3 border-t border-border">
                <label className="text-xs font-semibold text-foreground">Ítems solicitados</label>
                {form.items.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_60px_60px_auto] gap-2 items-center">
                    <Input placeholder="Descripción" value={it.descripcion} onChange={(e) => {
                      const items = [...form.items]; items[idx] = { ...it, descripcion: e.target.value }; setForm({ ...form, items });
                    }} className="bg-background border-border text-xs h-8" />
                    <Input type="number" placeholder="Cant." value={it.cantidad} onChange={(e) => {
                      const items = [...form.items]; items[idx] = { ...it, cantidad: Number(e.target.value) }; setForm({ ...form, items });
                    }} className="bg-background border-border text-xs h-8" />
                    <Input placeholder="Un." value={it.unidad} onChange={(e) => {
                      const items = [...form.items]; items[idx] = { ...it, unidad: e.target.value }; setForm({ ...form, items });
                    }} className="bg-background border-border text-xs h-8" />
                    <button onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })} className="text-destructive hover:text-destructive/80" type="button">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { descripcion: "", cantidad: 1, unidad: "un" }] })} className="text-[10px] text-primary hover:text-primary/80 font-mono flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Agregar ítem
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={submitting} className="text-xs">Cancelar</Button>
                <Button onClick={handleCreate} disabled={submitting || form.justificacion.trim().length < 10} className="bg-primary text-primary-foreground text-xs">
                  {submitting ? <Spinner size="sm" className="mr-2" /> : null} Crear Solicitud
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {solicitudes.map((s) => (
          <div key={s.id} onClick={() => { setSelected(s); setMotivo(""); }} className="p-4 rounded-xl border border-border bg-card/50 hover:bg-accent/30 cursor-pointer space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-foreground bg-accent border border-border px-1.5 py-0.5 rounded">{s.codigo}</span>
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="text-[8px] py-0 px-1">{s.prioridad}</Badge>
                <Badge variant={s.estado === "APROBADA" ? "success" : s.estado === "RECHAZADA" || s.estado === "CANCELADA" ? "destructive" : "warning"} className="text-[8px] py-0 px-1">{s.estado}</Badge>
              </div>
            </div>
            <p className="text-xs text-foreground line-clamp-2">{s.justificacion}</p>
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>{s.solicitanteNombre}</span>
              <span>{s.valorEstimado ? formatCurrency(s.valorEstimado) : "—"}</span>
            </div>
          </div>
        ))}
        {solicitudes.length === 0 && (
          <div className="col-span-full border border-border bg-card/20 rounded-xl p-8 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
            Sin solicitudes de compra registradas.
          </div>
        )}
      </div>

      <Sheet open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-md">
          {selected && (
            <div className="p-8 space-y-5">
              <div>
                <span className="font-mono text-xs text-muted-foreground">{selected.codigo}</span>
                <h3 className="text-sm font-mono uppercase font-bold text-foreground mt-0.5">{selected.estado}</h3>
              </div>
              <p className="text-xs text-foreground">{selected.justificacion}</p>
              <div className="space-y-1.5">
                {selected.items.map((it) => (
                  <div key={it.id} className="text-[11px] font-mono text-muted-foreground flex justify-between border-b border-border/40 pb-1">
                    <span>{it.descripcion}</span>
                    <span>{it.cantidad} {it.unidad}</span>
                  </div>
                ))}
              </div>

              {selected.estado === "PENDIENTE" && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <Textarea placeholder="Motivo de rechazo/cancelación (si aplica)" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} className="bg-background border-border text-xs" />
                  <div className="flex gap-2">
                    <Button onClick={() => handleStatus("APROBADA")} className="flex-1 bg-primary text-primary-foreground text-xs h-8">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Aprobar
                    </Button>
                    <Button onClick={() => handleStatus("RECHAZADA")} disabled={motivo.trim().length < 10} className="flex-1 bg-destructive/10 border border-destructive/20 text-destructive text-xs h-8">
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Rechazar
                    </Button>
                  </div>
                  <Button onClick={() => handleStatus("CANCELADA")} disabled={motivo.trim().length < 10} className="w-full bg-background border border-border text-muted-foreground text-xs h-8">
                    <Ban className="w-3.5 h-3.5 mr-1" /> Cancelar
                  </Button>
                </div>
              )}
              {selected.estado === "APROBADA" && (
                <Button onClick={() => handleStatus("COTIZANDO")} className="w-full bg-primary text-primary-foreground text-xs h-8">
                  Pasar a Cotización
                </Button>
              )}
              {(selected.motivoRechazo || selected.motivoCancelacion) && (
                <p className="text-[11px] text-destructive font-mono">{selected.motivoRechazo || selected.motivoCancelacion}</p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ==========================================
// COTIZACIONES
// ==========================================

function CotizacionesTab({ tenantParam, cotizaciones, solicitudes, proveedores, onReload }: {
  tenantParam: string | null; cotizaciones: CotizacionProveedorRow[]; solicitudes: SolicitudCompraRow[];
  proveedores: ProveedorRow[]; onReload: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [form, setForm] = React.useState({ solicitudId: "", proveedorId: "", valor: "", fechaEntrega: "", garantia: "" });

  const cotizables = solicitudes.filter((s) => s.estado === "COTIZANDO" || s.estado === "APROBADA");

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const result = await createCotizacionProveedor(tenantParam, {
        solicitudId: form.solicitudId,
        proveedorId: form.proveedorId,
        valor: Number(form.valor),
        fechaEntrega: form.fechaEntrega || undefined,
        garantia: form.garantia || undefined,
        items: [],
      });
      if (!result.success) { toast.error(result.error || "Error"); return; }
      toast.success("Cotización registrada.");
      setIsOpen(false);
      setForm({ solicitudId: "", proveedorId: "", valor: "", fechaEntrega: "", garantia: "" });
      await onReload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEstado = async (id: string, estado: "ACEPTADA" | "RECHAZADA") => {
    try {
      const result = await updateCotizacionProveedorEstado(tenantParam, { cotizacionId: id, estado });
      if (!result.success) { toast.error(result.error || "Error"); return; }
      await onReload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md">
              <Plus className="w-4 h-4" /> Nueva Cotización
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-md">
            <div className="p-8 space-y-5">
              <h3 className="text-base font-mono uppercase tracking-wider font-bold text-foreground">Nueva Cotización de Proveedor</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Solicitud de Compra</label>
                <Select value={form.solicitudId} onValueChange={(v) => setForm({ ...form, solicitudId: v })}>
                  <SelectTrigger className="bg-background border-border text-xs"><SelectValue placeholder="Seleccione la solicitud" /></SelectTrigger>
                  <SelectContent>
                    {cotizables.map((s) => <SelectItem key={s.id} value={s.id}>{s.codigo} — {s.justificacion.slice(0, 40)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Proveedor</label>
                <Select value={form.proveedorId} onValueChange={(v) => setForm({ ...form, proveedorId: v })}>
                  <SelectTrigger className="bg-background border-border text-xs"><SelectValue placeholder="Seleccione el proveedor" /></SelectTrigger>
                  <SelectContent>
                    {proveedores.filter((p) => !p.bloqueado).map((p) => <SelectItem key={p.id} value={p.id}>{p.razonSocial}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Valor cotizado (COP)</label>
                <Input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} className="bg-background border-border text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Fecha de entrega</label>
                  <Input type="date" value={form.fechaEntrega} onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })} className="bg-background border-border text-xs" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Garantía</label>
                  <Input value={form.garantia} onChange={(e) => setForm({ ...form, garantia: e.target.value })} className="bg-background border-border text-xs" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={submitting} className="text-xs">Cancelar</Button>
                <Button onClick={handleCreate} disabled={submitting || !form.solicitudId || !form.proveedorId || !form.valor} className="bg-primary text-primary-foreground text-xs">
                  {submitting ? <Spinner size="sm" className="mr-2" /> : null} Registrar Cotización
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cotizaciones.map((c) => (
          <div key={c.id} className="p-4 rounded-xl border border-border bg-card/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-foreground bg-accent border border-border px-1.5 py-0.5 rounded">{c.codigo}</span>
              <Badge variant={c.estado === "ACEPTADA" ? "success" : c.estado === "RECHAZADA" ? "destructive" : "warning"} className="text-[8px] py-0 px-1">{c.estado}</Badge>
            </div>
            <h4 className="text-xs font-semibold text-foreground">{c.proveedorNombre}</h4>
            <div className="text-[11px] font-mono text-foreground font-bold">{formatCurrency(c.valor)}</div>
            {c.estado === "RECIBIDA" && (
              <div className="flex gap-2">
                <Button onClick={() => handleEstado(c.id, "ACEPTADA")} className="flex-1 bg-primary text-primary-foreground text-[10px] h-7">Aceptar</Button>
                <Button onClick={() => handleEstado(c.id, "RECHAZADA")} className="flex-1 bg-destructive/10 border border-destructive/20 text-destructive text-[10px] h-7">Rechazar</Button>
              </div>
            )}
          </div>
        ))}
        {cotizaciones.length === 0 && (
          <div className="col-span-full border border-border bg-card/20 rounded-xl p-8 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
            Sin cotizaciones registradas.
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// ÓRDENES DE COMPRA
// ==========================================

function OrdenesTab({ tenantParam, ordenes, proveedores, solicitudes, cotizaciones, onReload }: {
  tenantParam: string | null; ordenes: OrdenCompraRow[]; proveedores: ProveedorRow[];
  solicitudes: SolicitudCompraRow[]; cotizaciones: CotizacionProveedorRow[]; onReload: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [selected, setSelected] = React.useState<OrdenCompraRow | null>(null);
  const [motivo, setMotivo] = React.useState("");
  const [form, setForm] = React.useState({
    solicitudId: "", proveedorId: "", cotizacionId: "", proyecto: "", fechaEntrega: "",
    items: [{ descripcion: "", cantidad: 1, unidad: "un", precioUnitario: 0, descuento: 0 }] as
      { descripcion: string; cantidad: number; unidad: string; precioUnitario: number; descuento: number }[],
  });

  const resetForm = () => setForm({ solicitudId: "", proveedorId: "", cotizacionId: "", proyecto: "", fechaEntrega: "", items: [{ descripcion: "", cantidad: 1, unidad: "un", precioUnitario: 0, descuento: 0 }] });

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const result = await createOrdenCompra(tenantParam, {
        solicitudId: form.solicitudId || undefined,
        proveedorId: form.proveedorId,
        cotizacionId: form.cotizacionId || undefined,
        proyecto: form.proyecto || undefined,
        fechaEntrega: form.fechaEntrega || undefined,
        items: form.items.filter((it) => it.descripcion.trim()),
      });
      if (!result.success) { toast.error(result.error || "Error"); return; }
      toast.success("Orden de compra creada.");
      setIsOpen(false);
      resetForm();
      await onReload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatus = async (newStatus: string) => {
    if (!selected) return;
    try {
      const result = await updateOrdenCompraStatus(tenantParam, {
        ordenId: selected.id,
        newStatus,
        motivoCancelacion: newStatus === "CANCELADA" ? motivo : undefined,
      });
      if (!result.success) { toast.error(result.error || "Error"); return; }
      toast.success(`OC ${selected.codigo} actualizada.`);
      setSelected(null);
      setMotivo("");
      await onReload();
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md">
              <Plus className="w-4 h-4" /> Nueva Orden de Compra
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-md">
            <div className="p-8 space-y-5">
              <h3 className="text-base font-mono uppercase tracking-wider font-bold text-foreground">Nueva Orden de Compra</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Proveedor</label>
                <Select value={form.proveedorId} onValueChange={(v) => setForm({ ...form, proveedorId: v })}>
                  <SelectTrigger className="bg-background border-border text-xs"><SelectValue placeholder="Seleccione el proveedor" /></SelectTrigger>
                  <SelectContent>
                    {proveedores.filter((p) => !p.bloqueado).map((p) => <SelectItem key={p.id} value={p.id}>{p.razonSocial}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Solicitud de origen (opcional)</label>
                <Select value={form.solicitudId} onValueChange={(v) => setForm({ ...form, solicitudId: v, cotizacionId: "" })}>
                  <SelectTrigger className="bg-background border-border text-xs"><SelectValue placeholder="Sin solicitud" /></SelectTrigger>
                  <SelectContent>
                    {solicitudes.filter((s) => s.estado === "COTIZANDO").map((s) => <SelectItem key={s.id} value={s.id}>{s.codigo}</SelectItem>)}
                  </SelectContent>
                </Select>
                {form.solicitudId && (
                  <p className="text-[10px] text-muted-foreground font-mono">
                    Si el valor estimado de la solicitud supera $5M COP, se requieren mínimo 3 cotizaciones registradas antes de poder emitir la OC.
                  </p>
                )}
              </div>
              {form.solicitudId && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Cotización aceptada (opcional)</label>
                  <Select value={form.cotizacionId} onValueChange={(v) => setForm({ ...form, cotizacionId: v })}>
                    <SelectTrigger className="bg-background border-border text-xs"><SelectValue placeholder="Sin cotización" /></SelectTrigger>
                    <SelectContent>
                      {cotizaciones.filter((c) => c.solicitudId === form.solicitudId).map((c) => <SelectItem key={c.id} value={c.id}>{c.codigo} — {c.proveedorNombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Fecha de entrega</label>
                <Input type="date" value={form.fechaEntrega} onChange={(e) => setForm({ ...form, fechaEntrega: e.target.value })} className="bg-background border-border text-xs" />
              </div>

              <div className="space-y-2 pt-3 border-t border-border">
                <label className="text-xs font-semibold text-foreground">Ítems de la orden</label>
                {form.items.map((it, idx) => (
                  <div key={idx} className="space-y-1 border border-border/60 rounded-lg p-2.5">
                    <Input placeholder="Descripción" value={it.descripcion} onChange={(e) => {
                      const items = [...form.items]; items[idx] = { ...it, descripcion: e.target.value }; setForm({ ...form, items });
                    }} className="bg-background border-border text-xs h-8" />
                    <div className="grid grid-cols-4 gap-2">
                      <Input type="number" placeholder="Cant." value={it.cantidad} onChange={(e) => {
                        const items = [...form.items]; items[idx] = { ...it, cantidad: Number(e.target.value) }; setForm({ ...form, items });
                      }} className="bg-background border-border text-xs h-8" />
                      <Input placeholder="Un." value={it.unidad} onChange={(e) => {
                        const items = [...form.items]; items[idx] = { ...it, unidad: e.target.value }; setForm({ ...form, items });
                      }} className="bg-background border-border text-xs h-8" />
                      <Input type="number" placeholder="Precio" value={it.precioUnitario} onChange={(e) => {
                        const items = [...form.items]; items[idx] = { ...it, precioUnitario: Number(e.target.value) }; setForm({ ...form, items });
                      }} className="bg-background border-border text-xs h-8" />
                      <button onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) })} className="text-destructive hover:text-destructive/80" type="button">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, items: [...form.items, { descripcion: "", cantidad: 1, unidad: "un", precioUnitario: 0, descuento: 0 }] })} className="text-[10px] text-primary hover:text-primary/80 font-mono flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Agregar ítem
                </button>
                <div className="text-right text-xs font-mono font-bold text-foreground pt-1">
                  Subtotal: {formatCurrency(form.items.reduce((s, it) => s + it.cantidad * it.precioUnitario - it.descuento, 0))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={submitting} className="text-xs">Cancelar</Button>
                <Button onClick={handleCreate} disabled={submitting || !form.proveedorId} className="bg-primary text-primary-foreground text-xs">
                  {submitting ? <Spinner size="sm" className="mr-2" /> : null} Crear OC
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ordenes.map((o) => (
          <div key={o.id} onClick={() => { setSelected(o); setMotivo(""); }} className="p-4 rounded-xl border border-border bg-card/50 hover:bg-accent/30 cursor-pointer space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-foreground bg-accent border border-border px-1.5 py-0.5 rounded">{o.codigo}</span>
              <Badge variant={o.estado === "RECIBIDA" || o.estado === "FACTURADA" || o.estado === "PAGADA" ? "success" : o.estado === "CANCELADA" ? "destructive" : "warning"} className="text-[8px] py-0 px-1">{o.estado}</Badge>
            </div>
            <h4 className="text-xs font-semibold text-foreground">{o.proveedorNombre}</h4>
            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
              <span>{o.items.length} ítem(s)</span>
              <span className="text-foreground font-bold">{formatCurrency(o.total)}</span>
            </div>
          </div>
        ))}
        {ordenes.length === 0 && (
          <div className="col-span-full border border-border bg-card/20 rounded-xl p-8 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
            Sin órdenes de compra registradas.
          </div>
        )}
      </div>

      <Sheet open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-md">
          {selected && (
            <div className="p-8 space-y-5">
              <div>
                <span className="font-mono text-xs text-muted-foreground">{selected.codigo}</span>
                <h3 className="text-sm font-mono uppercase font-bold text-foreground mt-0.5">{selected.proveedorNombre} · {selected.estado}</h3>
              </div>
              <div className="space-y-1.5">
                {selected.items.map((it) => (
                  <div key={it.id} className="text-[11px] font-mono text-muted-foreground flex justify-between border-b border-border/40 pb-1">
                    <span>{it.descripcion}</span>
                    <span>{it.recibido}/{it.cantidad} {it.unidad}</span>
                  </div>
                ))}
              </div>
              <div className="text-right text-sm font-bold text-foreground">{formatCurrency(selected.total)}</div>

              {selected.estado === "BORRADOR" && (
                <Button onClick={() => handleStatus("ENVIADA")} className="w-full bg-primary text-primary-foreground text-xs h-8">
                  <Truck className="w-3.5 h-3.5 mr-1" /> Enviar al Proveedor
                </Button>
              )}
              {selected.estado === "ENVIADA" && (
                <Button onClick={() => handleStatus("ACEPTADA")} className="w-full bg-primary text-primary-foreground text-xs h-8">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Marcar Aceptada por Proveedor
                </Button>
              )}
              {!["CANCELADA", "FACTURADA", "PAGADA"].includes(selected.estado) && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <Textarea placeholder="Motivo de cancelación (mín. 10 caracteres)" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} className="bg-background border-border text-xs" />
                  <Button onClick={() => handleStatus("CANCELADA")} disabled={motivo.trim().length < 10} className="w-full bg-destructive/10 border border-destructive/20 text-destructive text-xs h-8">
                    <Ban className="w-3.5 h-3.5 mr-1" /> Cancelar OC
                  </Button>
                </div>
              )}
              {selected.motivoCancelacion && <p className="text-[11px] text-destructive font-mono">{selected.motivoCancelacion}</p>}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ==========================================
// RECEPCIONES
// ==========================================

function RecepcionesTab({ tenantParam, recepciones, ordenes, warehouses, onReload }: {
  tenantParam: string | null; recepciones: RecepcionRow[]; ordenes: OrdenCompraRow[];
  warehouses: WarehouseOption[]; onReload: () => Promise<void>;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [ocId, setOcId] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");
  const [tipo, setTipo] = React.useState("TOTAL");
  const [cantidades, setCantidades] = React.useState<Record<string, number>>({});

  const receivableOrdenes = ordenes.filter((o) => ["ACEPTADA", "PARCIAL"].includes(o.estado) && o.items.some((it) => it.pendiente > 0));
  const selectedOc = ordenes.find((o) => o.id === ocId);
  const pendingItems = (selectedOc?.items || []).filter((it) => it.pendiente > 0);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const items = pendingItems
        .map((it) => ({ ocItemId: it.id, cantidadRecibida: cantidades[it.id] ?? 0, estado: "ACEPTADO" as const }))
        .filter((it) => it.cantidadRecibida > 0);
      if (items.length === 0) { toast.error("Ingrese la cantidad recibida de al menos un ítem."); return; }

      const result = await createRecepcion(tenantParam, { ocId, warehouseId, tipo, items });
      if (!result.success) { toast.error(result.error || "Error"); return; }
      toast.success("Recepción registrada. Inventario actualizado.");
      setIsOpen(false);
      setOcId(""); setWarehouseId(""); setCantidades({});
      await onReload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md">
              <Plus className="w-4 h-4" /> Nueva Recepción
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-md">
            <div className="p-8 space-y-5">
              <h3 className="text-base font-mono uppercase tracking-wider font-bold text-foreground">Nueva Recepción en Bodega</h3>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Orden de Compra</label>
                <Select value={ocId} onValueChange={(v) => { setOcId(v); setCantidades({}); }}>
                  <SelectTrigger className="bg-background border-border text-xs"><SelectValue placeholder="Seleccione la OC" /></SelectTrigger>
                  <SelectContent>
                    {receivableOrdenes.map((o) => <SelectItem key={o.id} value={o.id}>{o.codigo} — {o.proveedorNombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Bodega</label>
                <Select value={warehouseId} onValueChange={setWarehouseId}>
                  <SelectTrigger className="bg-background border-border text-xs"><SelectValue placeholder="Seleccione la bodega" /></SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tipo de recepción</label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="bg-background border-border text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOTAL">Total</SelectItem>
                    <SelectItem value="PARCIAL">Parcial</SelectItem>
                    <SelectItem value="RECHAZO">Rechazo</SelectItem>
                    <SelectItem value="DEVOLUCION">Devolución</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {pendingItems.length > 0 && (
                <div className="space-y-2 pt-3 border-t border-border">
                  <label className="text-xs font-semibold text-foreground">Cantidades recibidas</label>
                  {pendingItems.map((it) => (
                    <div key={it.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground flex-1 truncate">{it.descripcion} <span className="font-mono">({it.pendiente} pendiente)</span></span>
                      <Input type="number" max={it.pendiente} value={cantidades[it.id] ?? ""} onChange={(e) => setCantidades({ ...cantidades, [it.id]: Number(e.target.value) })} className="bg-background border-border text-xs h-8 w-24" />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={submitting} className="text-xs">Cancelar</Button>
                <Button onClick={handleCreate} disabled={submitting || !ocId || !warehouseId} className="bg-primary text-primary-foreground text-xs">
                  {submitting ? <Spinner size="sm" className="mr-2" /> : null} Registrar Recepción
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {recepciones.map((r) => (
          <div key={r.id} className="p-4 rounded-xl border border-border bg-card/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-foreground bg-accent border border-border px-1.5 py-0.5 rounded">{r.codigo}</span>
              <Badge variant={r.estado === "COMPLETADA" ? "success" : "warning"} className="text-[8px] py-0 px-1">{r.estado}</Badge>
            </div>
            <h4 className="text-xs font-semibold text-foreground">OC {r.ocCodigo}</h4>
            <div className="text-[10px] text-muted-foreground font-mono">{r.tipo} · {r.fechaRecepcion}</div>
          </div>
        ))}
        {recepciones.length === 0 && (
          <div className="col-span-full border border-border bg-card/20 rounded-xl p-8 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
            Sin recepciones registradas.
          </div>
        )}
      </div>
    </div>
  );
}
