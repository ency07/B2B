"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Sparkles,
  Search,
  Plus,
  Gauge,
  Thermometer,
  CheckCircle2,
  User,
  ClipboardList,
  Upload,
  ArrowRight,
  MapPin
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

import { getClients } from "@/erp/actions/core";
import {
  getRequirements,
  createRequirement,
  updateRequirementStatus,
  getAssignableUsers,
  RequirementRow,
  AssignableUser
} from "@/erp/actions/requirements";
import { generateEngineeringReport } from "@/utils/engineering";

const reqSchema = z.object({
  title: z.string().min(5, { message: "El título del requerimiento debe tener al menos 5 caracteres." }),
  clientId: z.string().min(1, { message: "Por favor, selecciona un cliente B2B." }),
  category: z.string().min(1, { message: "Por favor, selecciona una categoría." }),
  priority: z.string().min(1, { message: "Por favor, selecciona el nivel de prioridad." }),
});

type ReqFormValues = z.infer<typeof reqSchema>;

interface ClientOption {
  id: string;
  name: string;
}

export default function RequirementsPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [requirements, setRequirements] = React.useState<RequirementRow[]>([]);
  const [clients, setClients] = React.useState<ClientOption[]>([]);
  const [assignableUsers, setAssignableUsers] = React.useState<AssignableUser[]>([]);
  const [selectedReq, setSelectedReq] = React.useState<RequirementRow | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  // UI States
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Engineering Field Variables for live simulation
  const [altitude, setAltitude] = React.useState<number>(2600); // default Bogotá
  const [temperature, setTemperature] = React.useState<number>(30); // default 30°C
  const [hasDucts, setHasDucts] = React.useState<boolean>(false);
  const [environment, setEnvironment] = React.useState<string>("heavy_plant");
  
  // Dimensions state inherited/edited
  const [dimensions, setDimensions] = React.useState({ length: 40, width: 25, height: 8 });

  // Checklist for visiting engineer
  const [checklist, setChecklist] = React.useState<Record<string, boolean>>({
    base_level: false,
    electrical_phases: false,
    airflow_direction: false,
    vibration_dampers: false,
  });

  // Asignación real de responsables
  const [assignedEngineer, setAssignedEngineer] = React.useState<string | null>(null);
  const [selectedEngineerId, setSelectedEngineerId] = React.useState<string>("");
  const [selectedSalesId, setSelectedSalesId] = React.useState<string>("");
  const [uploadedDoc, setUploadedDoc] = React.useState<boolean>(false);

  const form = useForm<ReqFormValues>({
    resolver: zodResolver(reqSchema),
    defaultValues: {
      title: "",
      clientId: "",
      category: "VENTILACION",
      priority: "MEDIUM",
    },
  });

  const loadData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [reqs, clis, usrs] = await Promise.all([
        getRequirements(tenantParam),
        getClients(tenantParam),
        getAssignableUsers(tenantParam),
      ]);
      setRequirements(reqs);
      setClients(clis.map(c => ({ id: c.id, name: c.name })));
      setAssignableUsers(usrs);

      if (selectedReq) {
        const updated = reqs.find(r => r.id === selectedReq.id);
        if (updated) setSelectedReq(updated);
      }
    } catch (err) {
      console.error("Error loading requirements data:", err);
    } finally {
      setLoading(false);
    }
  }, [tenantParam, selectedReq]);

  React.useEffect(() => {
    queueMicrotask(() => { loadData(); });
  }, [tenantParam]);

  const onSubmit = async (values: ReqFormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createRequirement(tenantParam, {
        title: values.title,
        clientId: values.clientId,
        category: values.category,
        priority: values.priority,
      });
      setIsSheetOpen(false);
      form.reset();
      await loadData();
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "Error al crear requerimiento técnico.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectReq = (req: RequirementRow) => {
    setSelectedReq(req);
    // Simulate loading details of the inherited diagnostic
    setEnvironment(req.category === "MANTENIMIENTO" ? "mecanico" : "heavy_plant");
    setAssignedEngineer(
      req.engineering_user
        ? `${req.engineering_user.first_name} ${req.engineering_user.last_name}`
        : null
    );
    setSelectedEngineerId(req.engineering_user_id || "");
    setSelectedSalesId(req.sales_user_id || "");
    setUploadedDoc(false);
    setChecklist({
      base_level: false,
      electrical_phases: false,
      airflow_direction: false,
      vibration_dampers: false,
    });
  };

  const handleAssignEngineer = async () => {
    if (!selectedReq || !selectedEngineerId) return;
    try {
      await updateRequirementStatus(selectedReq.id, "DIAGNOSTICO", { engineering_user_id: selectedEngineerId });
      const engineer = assignableUsers.find(u => u.id === selectedEngineerId);
      setAssignedEngineer(engineer ? `${engineer.firstName} ${engineer.lastName}` : null);
      await loadData();
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const handleUploadReport = () => {
    setUploadedDoc(true);
    alert("Reporte Diagnóstico Técnico PDF cargado exitosamente. Flujo desbloqueado para Cotización.");
  };

  const handleAdvanceToQuote = async () => {
    if (!selectedReq || !selectedSalesId) return;
    try {
      await updateRequirementStatus(selectedReq.id, "COTIZACION", { sales_user_id: selectedSalesId });
      await loadData();
      alert("Flujo avanzado con éxito. El requerimiento técnico se encuentra ahora en fase de COTIZACION.");
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  // Run thermodynamic report
  const report = generateEngineeringReport(
    dimensions,
    environment,
    altitude,
    temperature,
    hasDucts
  );

  const filteredRequirements = requirements.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.requirement_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.client?.legal_name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Módulo de Ingeniería
          </div>
          <h1 className="text-base font-mono uppercase tracking-widest font-bold text-foreground mt-1">
            Requerimientos Técnicos y Visitas
          </h1>
          <p className="text-xs text-muted-foreground">
            Levantamiento de campo, simulación termodinámica y validación de ducterías en tiempo de ejecución.
          </p>
        </div>

        {/* Sheet for new technical requirements */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2 cursor-pointer bg-card hover:bg-accent border border-border text-foreground text-xs py-4 px-6 rounded-md shadow-sm transition-all active:scale-[0.98]">
              <Plus className="w-4 h-4" /> Nuevo Requerimiento
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-l border-border p-0 overflow-y-auto w-full sm:max-w-md backdrop-blur-md">
            <div className="p-8 space-y-6 bg-card">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">{"// Levantamiento / Comercial"}</span>
                <h3 className="text-base font-mono uppercase tracking-wider font-bold text-foreground mt-0.5">Crear Requerimiento</h3>
                <p className="text-xs text-muted-foreground">Inicia la ficha técnica a partir del contacto comercial B2B.</p>
              </div>

              {errorMsg && (
                <div className="p-3.5 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive font-mono">
                  {errorMsg}
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Título del Requerimiento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Ventilación Planta de Inyección 2" {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Cliente Asociado (Cuenta B2B)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary">
                              <SelectValue placeholder="Seleccione el cliente B2B" />
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
                    name="category"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Categoría Operativa</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary">
                              <SelectValue placeholder="Seleccione la categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="VENTILACION">Ventilación General</SelectItem>
                            <SelectItem value="MANTENIMIENTO">Mantenimiento y Balanceo</SelectItem>
                            <SelectItem value="PROYECTO_ESPECIAL">Proyecto Especial / Turbo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Prioridad Comercial</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary">
                              <SelectValue placeholder="Defina la prioridad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="LOW">Baja (Sin urgencia)</SelectItem>
                            <SelectItem value="MEDIUM">Media (Programada)</SelectItem>
                            <SelectItem value="HIGH">Alta (SLA / Cierre inmediato)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-end gap-3 pt-6 border-t border-border mt-2">
                    <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} disabled={submitting} className="border-border text-foreground text-xs hover:bg-accent cursor-pointer bg-card">
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs cursor-pointer px-4">
                      {submitting ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
                      Registrar Requerimiento
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Grid Layout Full Width */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar requerimiento..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border text-xs text-foreground placeholder-muted-foreground/60 h-9 rounded-md shadow-inner"
          />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 border border-border rounded-xl bg-card/30">
            <Spinner size="lg" className="text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest font-bold">Cargando requerimientos...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredRequirements.map(req => {
              let priorityVariant: "secondary" | "warning" | "destructive" = "secondary";
              if (req.priority === "HIGH") priorityVariant = "destructive";
              if (req.priority === "MEDIUM") priorityVariant = "warning";

              return (
                <div
                  key={req.id}
                  onClick={() => handleSelectReq(req)}
                  className="p-4 rounded-xl border transition-all cursor-pointer text-left space-y-2.5 bg-card/50 border-border hover:bg-accent/40 hover:border-primary/30 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-foreground bg-accent border border-border px-1.5 py-0.5 rounded shadow-sm">
                      {req.requirement_code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={priorityVariant} className="text-[8px] font-mono tracking-wider py-0 px-1 uppercase">
                        {req.priority}
                      </Badge>
                      <Badge variant={req.status === "COTIZACION" || req.status === "COMPLETADO" ? "success" : req.status === "DIAGNOSTICO" ? "info" : "warning"} className="text-[8px] py-0 px-1 font-semibold font-mono uppercase">
                        {req.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-foreground tracking-tight line-clamp-1">{req.title}</h4>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono pt-1">
                      <User className="w-3 h-3 text-primary" /> {req.client?.legal_name || "Cliente General"}
                    </p>
                  </div>
                </div>
              );
            })}

            {filteredRequirements.length === 0 && (
              <div className="col-span-full border border-border bg-card/20 rounded-xl p-8 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest">
                {"// No se encontraron requerimientos registrados."}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Drawer / Sheet modal lateral para detalle de requerimiento */}
      <Sheet open={selectedReq !== null} onOpenChange={(open) => { if (!open) setSelectedReq(null); }}>
        <SheetContent className="flex flex-col h-full w-full max-w-[80vw] sm:max-w-[700px] md:max-w-[800px] p-0 text-left">
          {selectedReq && (
            <div className="h-full flex flex-col bg-card text-foreground animate-in fade-in duration-300">
              {/* Workspace Header */}
              <div className="p-6 border-b border-border bg-muted flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">{selectedReq.requirement_code}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">• {selectedReq.category}</span>
                  </div>
                  <h3 className="font-mono text-sm uppercase tracking-wider font-bold text-foreground mt-0.5">
                    {selectedReq.title}
                  </h3>
                  <p className="text-xs text-muted-foreground font-sans mt-0.5">
                    Levantamiento técnico para: <span className="font-semibold text-foreground">{selectedReq.client?.legal_name}</span>
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">{"// Flujo Técnico"}</div>
                  <Badge variant={selectedReq.status === "COTIZACION" || selectedReq.status === "COMPLETADO" ? "success" : "warning"} className="text-[9px] font-mono uppercase py-0.5 px-2">
                    ETAPA: {selectedReq.status}
                  </Badge>
                </div>
              </div>

              {/* Workspace Panels */}
              <div className="p-6 flex-1 space-y-6 overflow-y-auto">
                {/* 1. Dimensiones y Parámetros Termodinámicos */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> {"// Parámetros del Entorno Real"}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Altitud */}
                    <div className="space-y-1.5 bg-muted/30 border border-border p-3 rounded-lg shadow-xs">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-primary" /> Altitud de Planta
                      </label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          value={altitude}
                          onChange={(e) => setAltitude(Number(e.target.value))}
                          className="bg-transparent border-0 p-0 text-foreground text-sm font-mono font-bold w-20 focus:ring-0 focus:outline-none"
                        />
                        <span className="text-[10px] font-mono text-muted-foreground font-semibold">msnm</span>
                      </div>
                    </div>

                    {/* Temperatura */}
                    <div className="space-y-1.5 bg-muted/30 border border-border p-3 rounded-lg shadow-xs">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-primary" /> Temp. Operación
                      </label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number"
                          value={temperature}
                          onChange={(e) => setTemperature(Number(e.target.value))}
                          className="bg-transparent border-0 p-0 text-foreground text-sm font-mono font-bold w-20 focus:ring-0 focus:outline-none"
                        />
                        <span className="text-[10px] font-mono text-muted-foreground font-semibold">°C</span>
                      </div>
                    </div>

                    {/* Ductería */}
                    <button 
                      onClick={() => setHasDucts(!hasDucts)}
                      className={`p-3 rounded-lg border transition-all text-left space-y-1 cursor-pointer select-none shadow-sm ${
                        hasDucts 
                          ? "bg-primary/10 border-primary/20" 
                          : "bg-muted/30 border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center justify-between">
                        <span>Pérdida por Ductería</span>
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          hasDucts ? "border-primary bg-primary/10" : "border-input"
                        }`}>
                          {hasDucts && <span className="w-1.5 h-1.5 bg-primary/80 rounded-full" />}
                        </div>
                      </div>
                      <div className="text-[11px] font-semibold text-foreground">
                        {hasDucts ? "Red de Ductos Activa (+1.5 inWG)" : "Salida Libre (+0.5 inWG)"}
                      </div>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-mono uppercase">Largo (m)</label>
                      <Input 
                        type="number"
                        value={dimensions.length}
                        onChange={(e) => setDimensions({ ...dimensions, length: Number(e.target.value) })}
                        className="bg-background border-input text-xs h-9 text-foreground shadow-xs focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-mono uppercase">Ancho (m)</label>
                      <Input 
                        type="number"
                        value={dimensions.width}
                        onChange={(e) => setDimensions({ ...dimensions, width: Number(e.target.value) })}
                        className="bg-background border-input text-xs h-9 text-foreground shadow-xs focus-visible:ring-ring"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground font-mono uppercase">Alto (m)</label>
                      <Input 
                        type="number"
                        value={dimensions.height}
                        onChange={(e) => setDimensions({ ...dimensions, height: Number(e.target.value) })}
                        className="bg-background border-input text-xs h-9 text-foreground shadow-xs focus-visible:ring-ring"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Resultados Aerodinámicos / Simulación Dinámica */}
                <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-muted/40 border border-border rounded-xl p-5 shadow-xs">
                      {/* Live Recalculations output */}
                      <div className="space-y-2 pr-4 md:border-r md:border-border text-[11px]">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-bold">{"// Resultados del Recálculo"}</div>
                      
                      <div className="flex justify-between font-mono">
                        <span className="text-muted-foreground">Densidad Aire:</span>
                        <span className={`font-mono font-bold ${report.airDensity < 1.0 ? "text-warning" : "text-success"}`}>{report.airDensity} kg/m³</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-muted-foreground">Caudal Aerodinámico:</span>
                        <span className="font-bold text-foreground">{report.cfm.toLocaleString()} CFM</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-muted-foreground">Velocidad Salida:</span>
                        <span className="font-bold text-foreground">{report.airVelocityFpm} FPM</span>
                      </div>

                      {report.airDensity < 1.0 && (
                        <div className="mt-2.5 p-2 rounded border border-warning/20 bg-warning/5 text-[10px] leading-tight text-warning font-mono">
                          ▲ Densidad baja por calor/altitud. Corregir motor para prevenir sobrecalentamiento.
                        </div>
                      )}
                    </div>

                    {/* Simulation recommendations */}
                    <div className="space-y-3">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase font-bold">{"// Ventilación Sugerida"}</div>
                      <div className="flex justify-between items-baseline font-mono">
                        <span className="text-xs text-muted-foreground">Equipos Sugeridos (7.5K CFM):</span>
                        <span className="text-lg font-bold text-foreground">{report.eqCount} u.</span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono space-y-1">
                        <div className="flex justify-between">
                          <span>Distribución:</span>
                          <span className="text-foreground">{report.distribution}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Potencia Total:</span>
                          <span className="text-foreground">{report.powerHp} HP / {report.powerKw} kW</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Field Checklist validation */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                    <ClipboardList className="w-3.5 h-3.5 text-primary" /> {"// Verificación del Ingeniero de Campo"}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      { id: "base_level", label: "Inspección de anclajes físicos y nivelación" },
                      { id: "electrical_phases", label: "Medición de fases de alimentación eléctrica" },
                      { id: "airflow_direction", label: "Verificación de dirección de tiro del aire" },
                      { id: "vibration_dampers", label: "Instalación de juntas y soportes antivibración" }
                    ].map(item => (
                      <button
                        key={item.id}
                        onClick={() => setChecklist({ ...checklist, [item.id]: !checklist[item.id] })}
                        className={`flex items-center gap-2.5 p-2.5 rounded border transition-all text-xs text-left cursor-pointer ${
                          checklist[item.id] 
                            ? "bg-accent border-primary/20 text-foreground" 
                            : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          checklist[item.id] ? "border-primary bg-primary/10" : "border-input"
                        }`}>
                          {checklist[item.id] && <span className="w-1.5 h-1.5 bg-primary/80 rounded-full" />}
                        </div>
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Workflow Stages / Actions */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Step 1: Technical Assignee */}
                    <div className="border border-border bg-muted/40 p-3.5 rounded-xl flex flex-col justify-between space-y-3.5 shadow-xs">
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono text-muted-foreground uppercase font-bold">{"// Paso 1: Asignar Técnico"}</div>
                        <p className="text-[11px] text-muted-foreground leading-tight">Es obligatorio asignar un responsable para iniciar el Diagnóstico.</p>
                      </div>
                      
                      {assignedEngineer ? (
                        <div className="text-xs font-semibold text-success flex items-center gap-1 font-mono bg-success/10 border border-success/25 p-1.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Asignado: {assignedEngineer}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Select value={selectedEngineerId} onValueChange={setSelectedEngineerId}>
                            <SelectTrigger className="bg-background border-border text-foreground text-[11px] h-8 focus:ring-primary">
                              <SelectValue placeholder="Seleccione responsable" />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border text-foreground">
                              {assignableUsers.map(u => (
                                <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            onClick={handleAssignEngineer}
                            disabled={!selectedEngineerId}
                            className="w-full bg-background border border-border text-foreground hover:bg-accent text-[11px] h-8 disabled:opacity-30 cursor-pointer shadow-sm"
                          >
                            Asignar Responsable
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Step 2: Upload Diagnostic PDF */}
                    <div className="border border-border bg-muted/40 p-3.5 rounded-xl flex flex-col justify-between space-y-3.5 shadow-xs">
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono text-muted-foreground uppercase font-bold">{"// Paso 2: Cargar Informe"}</div>
                        <p className="text-[11px] text-muted-foreground leading-tight">Requiere subir reporte en formato PDF para habilitar cotización.</p>
                      </div>

                      {uploadedDoc ? (
                        <div className="text-xs font-semibold text-success flex items-center gap-1 font-mono bg-success/10 border border-success/25 p-1.5 rounded">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Diagnóstico PDF OK
                        </div>
                      ) : (
                        <Button 
                          onClick={handleUploadReport}
                          disabled={!assignedEngineer}
                          className="w-full bg-background border border-border text-foreground hover:bg-accent text-[11px] h-8 disabled:opacity-30 cursor-pointer shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1" /> Cargar Reporte
                        </Button>
                      )}
                    </div>

                    {/* Step 3: Advance to Quotation */}
                    <div className="border border-border bg-muted/40 p-3.5 rounded-xl flex flex-col justify-between space-y-3.5 shadow-xs">
                      <div className="space-y-1">
                        <div className="text-[9px] font-mono text-muted-foreground uppercase font-bold">{"// Paso 3: Avanzar Flujo"}</div>
                        <p className="text-[11px] text-muted-foreground leading-tight">Mueve el estado a COTIZACION para habilitar tabla de SKUs.</p>
                      </div>

                      {selectedReq.status !== "COTIZACION" && (
                        <Select value={selectedSalesId} onValueChange={setSelectedSalesId}>
                          <SelectTrigger className="bg-background border-border text-foreground text-[11px] h-8 focus:ring-primary">
                            <SelectValue placeholder="Responsable comercial" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border text-foreground">
                            {assignableUsers.map(u => (
                              <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <Button
                        onClick={handleAdvanceToQuote}
                        disabled={!uploadedDoc || !selectedSalesId || selectedReq.status === "COTIZACION"}
                        className="w-full bg-primary hover:bg-primary/95 text-primary-foreground text-[11px] h-8 disabled:opacity-30 flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                      >
                        Avanzar <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
