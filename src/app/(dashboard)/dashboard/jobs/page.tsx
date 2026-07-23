/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/jsx-no-comment-textnodes */
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSearchParams } from "next/navigation";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  FileSpreadsheet,
  PenTool,
  Clock,
  CheckSquare,
  Wrench,
  ShieldCheck
} from "lucide-react";

import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Badge } from "@/platform/ui/badge";
import { Spinner } from "@/platform/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/platform/ui/table";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/platform/ui/sheet";
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
import { getJobs, createJob, getAssignableUsers, getClients, updateJobStatus } from "@/erp/actions/core";
import { getRequirements } from "@/erp/actions/requirements";

const jobSchema = z.object({
  clientId: z.string().min(1, { message: "Selecciona un cliente." }),
  requirementId: z.string().min(1, { message: "Selecciona un requerimiento." }),
  assignedUserId: z.string().min(1, { message: "Selecciona el técnico responsable." }),
  description: z.string().min(5, { message: "La descripción debe tener al menos 5 caracteres." }),
  priority: z.string().min(1, { message: "Selecciona la prioridad del trabajo." }),
  startDate: z.string().min(1, { message: "Selecciona la fecha de inicio." }),
  endDate: z.string().min(1, { message: "Selecciona la fecha de finalización." }),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: "La fecha de finalización debe ser igual o posterior a la fecha de inicio.",
  path: ["endDate"],
});

type JobFormValues = z.infer<typeof jobSchema>;

interface Job {
  id: string;
  code: string;
  description: string;
  assignedTech: string;
  priority: "BAJA" | "MEDIA" | "ALTA";
  startDate: string;
  endDate: string;
  status: "PENDIENTE" | "PROGRAMADO" | "EN_EJECUCION" | "SUSPENDIDO" | "FINALIZADO" | "ENTREGADO" | "CERRADO" | "CANCELADO";
}

// Checklist structure per job
interface ChecklistPhase {
  name: string;
  items: { id: string; label: string; checked: boolean }[];
}

export default function JobsPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [jobs, setJobs] = React.useState<Job[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const [clientOptions, setClientOptions] = React.useState<{ id: string; name: string }[]>([]);
  const [requirementOptions, setRequirementOptions] = React.useState<{ id: string; code: string; title: string; clientId: string }[]>([]);
  const [userOptions, setUserOptions] = React.useState<{ id: string; name: string }[]>([]);

  // States
  const [isSheetOpen, setIsSheetOpen] = React.useState(false);
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  // Local interactive state for job checklist
  const [jobChecklists, setJobChecklists] = React.useState<Record<string, ChecklistPhase[]>>({});
  // Local interactive state for signatures
  const [signatures, setSignatures] = React.useState<Record<string, { signed: boolean; name: string; date: string }>>({});
  // Local interactive state for test measurements
  const [measurements, setMeasurements] = React.useState<Record<string, { targetCfm: string; measuredCfm: string; vibration: string; current: string }>>({});

  // Status transition state
  const [statusTransitioning, setStatusTransitioning] = React.useState(false);
  const [cancelReason, setCancelReason] = React.useState("");
  const [showCancelInput, setShowCancelInput] = React.useState(false);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      clientId: "",
      requirementId: "",
      assignedUserId: "",
      description: "",
      priority: "",
      startDate: "",
      endDate: "",
    },
  });

  const selectedClientId = form.watch("clientId");
  const filteredRequirements = requirementOptions.filter(
    (r) => !selectedClientId || r.clientId === selectedClientId
  );

  const loadJobs = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await getJobs(tenantParam);
      setJobs(data);
      if (selectedJob) {
        const updated = data.find((j: any) => j.id === selectedJob.id);
        if (updated) setSelectedJob(updated);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tenantParam, selectedJob]);

  React.useEffect(() => {
    loadJobs();
  }, [tenantParam]);

  React.useEffect(() => {
    async function loadFormData() {
      try {
        const [clients, requirements, users] = await Promise.all([
          getClients(tenantParam),
          getRequirements(tenantParam),
          getAssignableUsers(tenantParam),
        ]);
        setClientOptions(clients.map((c: any) => ({ id: c.id, name: c.name })));
        setRequirementOptions(
          requirements.map((r: any) => ({
            id: r.id,
            code: r.requirement_code,
            title: r.title,
            clientId: r.client_id,
          }))
        );
        setUserOptions(users);
      } catch (err: any) {
        console.error("Error cargando opciones del formulario:", err);
      }
    }
    loadFormData();
  }, [tenantParam]);

  const onSubmit = async (values: JobFormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createJob(tenantParam, {
        clientId: values.clientId,
        requirementId: values.requirementId,
        assignedUserId: values.assignedUserId,
        description: values.description,
        priority: values.priority,
        startDate: values.startDate,
        endDate: values.endDate,
      });
      setIsSheetOpen(false);
      form.reset();
      await loadJobs();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Ocurrió un error al registrar el trabajo.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to initialize checklist for a job if not exists
  const getJobChecklist = (jobId: string): ChecklistPhase[] => {
    if (jobChecklists[jobId]) return jobChecklists[jobId];
    return [
      {
        name: "1. Diseño e Ingeniería",
        items: [
          { id: "cad", label: "Planos CAD estructurales aprobados", checked: false },
          { id: "bom", label: "Lista de materiales (BOM) asignada", checked: false },
          { id: "dim", label: "Verificación de dimensiones teóricas", checked: false },
        ]
      },
      {
        name: "2. Corte y Chasis",
        items: [
          { id: "laser", label: "Corte láser de láminas de acero", checked: false },
          { id: "bend", label: "Rolado y conformado de caracol", checked: false },
          { id: "weld", label: "Soldadura estructural de soportes", checked: false },
        ]
      },
      {
        name: "3. Rotación y Balanceo",
        items: [
          { id: "align", label: "Alineación de eje y poleas", checked: false },
          { id: "stat", label: "Balanceo estático del impulsor", checked: false },
          { id: "dyn", label: "Balanceo dinámico grado G2.5 (ISO 1940)", checked: false },
        ]
      },
      {
        name: "4. Pruebas Funcionales",
        items: [
          { id: "vib", label: "Ensayo vibracional en banco de pruebas", checked: false },
          { id: "cfm", label: "Medición aerodinámica de caudal", checked: false },
          { id: "elec", label: "Consumo de corriente del motor (Amperaje)", checked: false },
        ]
      },
      {
        name: "5. Embalaje y Certificación",
        items: [
          { id: "paint", label: "Pintura y acabado anticorrosivo", checked: false },
          { id: "qa_check", label: "Checklist final de control de calidad", checked: false },
          { id: "package", label: "Embalaje industrial y guía de despacho", checked: false },
        ]
      }
    ];
  };

  const handleToggleItem = (jobId: string, phaseIndex: number, itemId: string) => {
    const current = [...getJobChecklist(jobId)];
    const phase = current[phaseIndex];
    phase.items = phase.items.map(item => 
      item.id === itemId ? { ...item, checked: !item.checked } : item
    );
    setJobChecklists({
      ...jobChecklists,
      [jobId]: current
    });
  };

  // Helper to compute overall progress of checklist
  const getJobProgress = (jobId: string): number => {
    const list = getJobChecklist(jobId);
    let total = 0;
    let checked = 0;
    list.forEach(p => {
      p.items.forEach(item => {
        total++;
        if (item.checked) checked++;
      });
    });
    return total === 0 ? 0 : Math.round((checked / total) * 100);
  };

  const handleSign = (jobId: string, name: string) => {
    if (!name.trim()) return;
    setSignatures({
      ...signatures,
      [jobId]: {
        signed: true,
        name: name,
        date: new Date().toLocaleDateString("es-CO", { hour: "2-digit", minute: "2-digit" })
      }
    });
  };

  const handleUpdateMeasurements = (jobId: string, field: string, value: string) => {
    const curr = measurements[jobId] || { targetCfm: "7500", measuredCfm: "", vibration: "", current: "" };
    setMeasurements({
      ...measurements,
      [jobId]: {
        ...curr,
        [field]: value
      }
    });
  };

  const handleStatusTransition = async (jobId: string, newStatus: Job["status"]) => {
    if (newStatus === "CANCELADO" && cancelReason.length < 10) {
      return;
    }
    setStatusTransitioning(true);
    try {
      await updateJobStatus(tenantParam, {
        jobId,
        newStatus,
        cancelReason: newStatus === "CANCELADO" ? cancelReason : undefined,
      });
      setShowCancelInput(false);
      setCancelReason("");
      await loadJobs();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al actualizar estado";
      console.error(msg);
    } finally {
      setStatusTransitioning(false);
    }
  };

  const columns: ColumnDef<Job>[] = [
    {
      accessorKey: "code",
      header: "Código OT",
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedJob(row.original)}
          className="text-left font-mono font-semibold text-xs text-primary hover:underline hover:text-primary/80 transition-colors cursor-pointer"
        >
          {row.getValue("code")}
        </button>
      ),
    },
    {
      accessorKey: "description",
      header: "Descripción",
      cell: ({ row }) => (
        <div className="max-w-[180px] truncate text-xs font-semibold text-foreground">
          {row.getValue("description")}
        </div>
      ),
    },
    {
      accessorKey: "priority",
      header: "Prioridad",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as string;
        let variant: "success" | "warning" | "destructive" | "secondary" = "secondary";
        if (priority === "MEDIA") variant = "warning";
        if (priority === "ALTA") variant = "destructive";
        return <Badge variant={variant} className="text-[9px] font-mono font-bold tracking-wider py-0 px-1.5 uppercase">{priority}</Badge>;
      },
    },
    {
      accessorKey: "status",
      header: "Estado",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let variant: "success" | "warning" | "destructive" | "secondary" | "info" = "secondary";
        if (status === "COMPLETADA" || status === "FINALIZADO" || status === "ENTREGADO" || status === "CERRADO") variant = "success";
        if (status === "EN_EJECUCION" || status === "PROGRAMADO") variant = "info";
        if (status === "PENDIENTE") variant = "warning";
        if (status === "CANCELADA" || status === "CANCELADO") variant = "destructive";
        return <Badge variant={variant} className="text-[9px] font-semibold py-0 px-1 font-mono uppercase">{status}</Badge>;
      },
    },
  ];

  const table = useReactTable({
    data: jobs,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize: 7,
      },
    },
  });

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-bold">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Centro de Control de Producción
          </div>
          <h1 className="text-base font-mono uppercase tracking-widest font-bold text-foreground mt-1">
            Órdenes de Trabajo e Ingeniería (OT)
          </h1>
          <p className="text-xs text-muted-foreground">
            Seguimiento de fases de fabricación, balanceo estator-rotor y calibración aerodinámica de ventiladores.
          </p>
        </div>

        {/* Sheet Slide-out to Create OT */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button className="flex items-center gap-2 cursor-pointer bg-bg-elevated-1 hover:bg-accent border border-line text-ink text-xs py-4 px-6 rounded-md shadow-sm transition-all active:scale-[0.98]">
              <Plus className="w-4 h-4" /> Nueva Orden de Trabajo
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col bg-bg-elevated-1 border-l border-line p-0 w-full sm:max-w-md backdrop-blur-md h-full">
            {/* Header Fijo */}
            <div className="flex-none p-6 md:p-8 border-b border-line bg-bg-elevated-1/80 backdrop-blur-sm z-layer-content">
              <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">// Producción / Taller</span>
              <h3 className="text-base font-mono uppercase tracking-wider font-bold text-ink mt-0.5">Abrir Orden de Trabajo</h3>
              <p className="text-xs text-ink-muted">Ingresa los parámetros iniciales de ingeniería y programación de la obra.</p>
            </div>

            {/* Body Scrolleable */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
              {errorMsg && (
                <div className="p-3.5 rounded-md bg-state-danger/10 border border-state-danger/20 text-xs text-state-danger font-mono">
                  {errorMsg}
                </div>
              )}

              <Form {...form}>
                <form id="create-job-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Cliente</FormLabel>
                        <Select onValueChange={(val) => { field.onChange(val); form.setValue("requirementId", ""); }} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary">
                              <SelectValue placeholder="Selecciona el cliente" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            {clientOptions.map((c) => (
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
                        <FormLabel className="text-xs font-semibold text-foreground">Requerimiento</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedClientId}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary">
                              <SelectValue placeholder={selectedClientId ? "Selecciona el requerimiento" : "Selecciona un cliente primero"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            {filteredRequirements.map((r) => (
                              <SelectItem key={r.id} value={r.id}>{r.code} — {r.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Descripción del Trabajo / Equipo</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej. Extractor Ax-7500 CFM Chasis Reforzado" {...field} className="bg-background border-border text-foreground text-xs shadow-inner focus-visible:ring-primary" />
                        </FormControl>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedUserId"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-xs font-semibold text-foreground">Técnico Principal Responsable</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary">
                              <SelectValue placeholder="Selecciona el técnico principal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            {userOptions.map((u) => (
                              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                            ))}
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
                        <FormLabel className="text-xs font-semibold text-foreground">Nivel de Prioridad Operativa</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-background border-border text-foreground text-xs focus:ring-primary">
                              <SelectValue placeholder="Establecer prioridad de entrega" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-card border-border text-foreground">
                            <SelectItem value="BAJA">Baja (Mantenimientos rutinarios)</SelectItem>
                            <SelectItem value="MEDIA">Media (Órdenes programadas)</SelectItem>
                            <SelectItem value="ALTA">Alta (SLA crítico / Emergencia)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-[10px] text-destructive font-mono" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold text-foreground">Inicio de Obra</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-background border-border text-foreground text-xs font-mono shadow-inner focus-visible:ring-primary" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive font-mono" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem className="space-y-1.5">
                          <FormLabel className="text-xs font-semibold text-foreground">Fin / Entrega</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="bg-background border-border text-foreground text-xs font-mono shadow-inner focus-visible:ring-primary" />
                          </FormControl>
                          <FormMessage className="text-[10px] text-destructive font-mono" />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </div>

            {/* Footer Fijo */}
            <div className="flex-none p-6 md:p-8 border-t border-border bg-card/80 backdrop-blur-sm z-10 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} disabled={submitting} className="border-border text-foreground text-xs hover:bg-accent cursor-pointer bg-card">
                Cancelar
              </Button>
              <Button type="submit" form="create-job-form" disabled={submitting} className="bg-primary hover:bg-primary/95 text-primary-foreground text-xs cursor-pointer px-4">
                {submitting ? <Spinner size="sm" className="mr-2 text-primary-foreground" /> : null}
                Programar Orden
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Table of OTs (Full Width) */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por descripción..."
              value={(table.getColumn("description")?.getFilterValue() as string) ?? ""}
              onChange={(event) => table.getColumn("description")?.setFilterValue(event.target.value)}
              className="pl-9 bg-card border-border text-xs text-foreground placeholder-muted-foreground/60 h-9 rounded-md shadow-inner"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 border border-border rounded-xl bg-card/30">
            <Spinner size="lg" className="text-muted-foreground mb-2" />
            <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest font-bold">Cargando órdenes...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card/45 backdrop-blur-md overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]">
              <Table>
                <TableHeader className="bg-accent/40 border-b border-border">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent border-b border-border">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="text-muted-foreground font-mono text-[9px] uppercase tracking-widest py-3">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow 
                        key={row.id}
                        onClick={() => setSelectedJob(row.original)}
                        className={`cursor-pointer transition-colors border-b border-border/40 hover:bg-accent/30 ${
                          selectedJob?.id === row.original.id ? "bg-accent/35" : ""
                        }`}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-2 px-3">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-xs text-muted-foreground font-mono uppercase tracking-widest py-8">
                        // No se encontraron órdenes de trabajo registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <div>
                Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
              </div>
              <div className="flex items-center space-x-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 px-3 border-border bg-card hover:bg-accent text-foreground cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 px-3 border-border bg-card hover:bg-accent text-foreground cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drawer / Sheet modal lateral para detalle de orden de trabajo */}
      <Sheet open={selectedJob !== null} onOpenChange={(open) => { if (!open) setSelectedJob(null); }}>
        <SheetContent className="flex flex-col h-full w-full max-w-[80vw] sm:max-w-[700px] md:max-w-[800px] border-l border-border bg-card p-0 shadow-2xl text-left">
          {selectedJob && (
            <div className="h-full flex flex-col bg-card text-foreground animate-in fade-in duration-300">
              {/* Control Header */}
              <div className="p-6 border-b border-border bg-muted/50 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-foreground bg-accent border border-border/80 px-2 py-0.5 rounded shadow-sm">
                      {selectedJob.code}
                    </span>
                    <Badge variant={selectedJob.status === "CERRADO" || selectedJob.status === "ENTREGADO" || selectedJob.status === "FINALIZADO" ? "success" : selectedJob.status === "EN_EJECUCION" || selectedJob.status === "PROGRAMADO" ? "info" : "warning"} className="text-[9px] font-semibold py-0 px-1.5 font-mono uppercase">
                      {selectedJob.status}
                    </Badge>
                  </div>
                  <h3 className="font-mono text-sm uppercase tracking-wider font-bold text-foreground mt-0.5">
                    {selectedJob.description}
                  </h3>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3 text-primary" /> Programado: {selectedJob.startDate} al {selectedJob.endDate}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest font-bold">// Avance</div>
                  <div className="text-2xl font-mono font-bold text-success tracking-tight mt-0.5">
                    {getJobProgress(selectedJob.id)}%
                  </div>
                </div>
              </div>

              {/* Detail Tabs/Sections */}
              <div className="p-6 flex-1 space-y-6 overflow-y-auto">
                
                {/* 1. Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full bg-muted border border-border h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="bg-success h-full rounded-full transition-all duration-300"
                      style={{ width: `${getJobProgress(selectedJob.id)}%` }}
                    />
                  </div>
                </div>

                {/* 2. Interactive Phase Checklists */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                    <CheckSquare className="w-3.5 h-3.5 text-primary" /> // Bitácora de Procesos y QA
                  </div>
                  
                  <div className="space-y-3.5">
                    {getJobChecklist(selectedJob.id).map((phase, pIdx) => {
                      const phaseCheckedCount = phase.items.filter(i => i.checked).length;
                      const phaseTotalCount = phase.items.length;
                      const isPhaseDone = phaseCheckedCount === phaseTotalCount;

                      return (
                        <div key={pIdx} className="rounded-lg border border-border bg-muted/30 p-3.5 space-y-3 shadow-xs">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-xs font-bold transition-colors font-mono uppercase tracking-wider ${isPhaseDone ? "text-success" : "text-foreground"}`}>
                              {phase.name}
                            </h4>
                            <span className="text-[10px] font-mono text-muted-foreground font-bold bg-background border border-border px-1.5 py-0.5 rounded shadow-sm">
                              {phaseCheckedCount}/{phaseTotalCount} OK
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {phase.items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => handleToggleItem(selectedJob.id, pIdx, item.id)}
                                className={`flex items-start text-left gap-2.5 p-2 rounded border transition-all text-xs cursor-pointer ${
                                  item.checked 
                                    ? "bg-accent border-success/20 text-muted-foreground" 
                                    : "bg-background border-border text-foreground hover:bg-accent/40"
                                }`}
                              >
                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                                  item.checked ? "border-success bg-success/10" : "border-border"
                                }`}>
                                  {item.checked && <span className="w-1.5 h-1.5 bg-success rounded-full" />}
                                </div>
                                <span className={item.checked ? "line-through opacity-60" : ""}>
                                  {item.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Engineering Parameter Tests (Banco de Ensayos) */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                    <Wrench className="w-3.5 h-3.5 text-primary" /> // Banco de Pruebas y Tolerancia ISO
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/40 border border-border rounded-xl p-4 shadow-xs">
                    {/* Design Specs (Static read-only) */}
                    <div className="space-y-2 border-r border-border pr-2">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-bold">// Parámetros Diseño</div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-mono text-muted-foreground">
                          <span>Caudal:</span>
                          <span className="text-foreground font-semibold">7,500 CFM</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono text-muted-foreground">
                          <span>Presión Estática:</span>
                          <span className="text-foreground font-semibold">1.2 inWG</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono text-muted-foreground">
                          <span>Corriente Nominal:</span>
                          <span className="text-foreground font-semibold">14.5 A</span>
                        </div>
                        <div className="flex justify-between text-xs font-mono text-muted-foreground">
                          <span>Vibración Máx:</span>
                          <span className="text-foreground font-semibold">1.8 mm/s</span>
                        </div>
                      </div>
                    </div>

                    {/* Measured Specs (Interactive) */}
                    <div className="space-y-2.5">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-bold">// Medición Real</div>
                      <div className="space-y-2">
                        {/* Flow */}
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-mono text-muted-foreground shrink-0">Caudal Medido:</label>
                          <div className="flex items-center bg-background border border-border rounded px-1.5 py-0.5 max-w-[100px] shadow-inner">
                            <input 
                              type="number" 
                              placeholder="0"
                              value={measurements[selectedJob.id]?.measuredCfm || ""}
                              onChange={(e) => handleUpdateMeasurements(selectedJob.id, "measuredCfm", e.target.value)}
                              className="w-full bg-transparent border-0 p-0 text-right text-xs font-mono text-success font-bold focus:ring-0 focus:outline-none"
                            />
                            <span className="text-[9px] font-mono text-muted-foreground ml-1">CFM</span>
                          </div>
                        </div>

                        {/* Vibration */}
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-mono text-muted-foreground shrink-0">Vibración:</label>
                          <div className="flex items-center bg-background border border-border rounded px-1.5 py-0.5 max-w-[100px] shadow-inner">
                            <input 
                              type="text" 
                              placeholder="0.0"
                              value={measurements[selectedJob.id]?.vibration || ""}
                              onChange={(e) => handleUpdateMeasurements(selectedJob.id, "vibration", e.target.value)}
                              className="w-full bg-transparent border-0 p-0 text-right text-xs font-mono text-success font-bold focus:ring-0 focus:outline-none"
                            />
                            <span className="text-[9px] font-mono text-muted-foreground ml-1">mm/s</span>
                          </div>
                        </div>

                        {/* Amperage */}
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-[11px] font-mono text-muted-foreground shrink-0">Amperaje:</label>
                          <div className="flex items-center bg-background border border-border rounded px-1.5 py-0.5 max-w-[100px] shadow-inner">
                            <input 
                              type="text" 
                              placeholder="0.0"
                              value={measurements[selectedJob.id]?.current || ""}
                              onChange={(e) => handleUpdateMeasurements(selectedJob.id, "current", e.target.value)}
                              className="w-full bg-transparent border-0 p-0 text-right text-xs font-mono text-success font-bold focus:ring-0 focus:outline-none"
                            />
                            <span className="text-[9px] font-mono text-muted-foreground ml-1">A</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Quality Approval Signature */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" /> // Firma y Liberación de Calidad
                  </div>

                  {signatures[selectedJob.id]?.signed ? (
                    <div className="border border-success/20 bg-success/10 rounded-xl p-4 flex items-center justify-between shadow-sm font-mono text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-success">
                          <CheckCircle2 className="w-4 h-4 shrink-0" /> // EQUIPO LIBERADO
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Inspector certificado: <span className="text-foreground font-bold">{signatures[selectedJob.id].name}</span>
                        </p>
                      </div>
                      <div className="text-right text-[9px] text-muted-foreground">
                        {signatures[selectedJob.id].date}
                      </div>
                    </div>
                  ) : (
                    <div className="border border-border bg-muted/30 rounded-xl p-4 space-y-3 shadow-xs">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        El equipo no ha sido liberado para el despacho comercial. Ingrese su nombre de inspector certificado para sellar la orden.
                      </p>
                      <div className="flex items-center gap-2.5">
                        <Input 
                          id="sig_name"
                          placeholder="Firma del Inspector de Calidad" 
                          className="bg-background border-border text-xs h-9 font-mono text-foreground placeholder-muted-foreground/60 flex-1 focus:ring-primary shadow-inner"
                        />
                        <Button 
                          onClick={() => {
                            const input = document.getElementById("sig_name") as HTMLInputElement;
                            if (input) {
                              handleSign(selectedJob.id, input.value);
                              input.value = "";
                            }
                          }}
                          className="bg-muted border border-border text-foreground text-xs h-9 hover:bg-accent px-3 flex items-center gap-1 shrink-0 font-medium cursor-pointer shadow-sm"
                        >
                          <PenTool className="w-3.5 h-3.5" /> Firmar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

              {/* Status Transition Actions */}
              {selectedJob.status !== "CERRADO" && selectedJob.status !== "CANCELADO" && (
                <div className="p-4 border-t border-border bg-muted/50 space-y-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest font-bold text-center mb-2">
                    // Acciones de Estado
                  </div>

                  {showCancelInput && (
                    <div className="space-y-2">
                      <Input
                        placeholder="Motivo de cancelación (mínimo 10 caracteres)"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="bg-background border-border text-xs h-9 font-mono"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={statusTransitioning || cancelReason.length < 10}
                          onClick={() => handleStatusTransition(selectedJob.id, "CANCELADO")}
                          className="text-xs h-8 cursor-pointer"
                        >
                          {statusTransitioning ? <Spinner size="sm" className="mr-1" /> : null}
                          Confirmar Cancelación
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setShowCancelInput(false); setCancelReason(""); }}
                          className="text-xs h-8 cursor-pointer"
                        >
                          Volver
                        </Button>
                      </div>
                    </div>
                  )}

                  {!showCancelInput && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {selectedJob.status === "PENDIENTE" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusTransition(selectedJob.id, "EN_EJECUCION")}
                          disabled={statusTransitioning}
                          className="text-xs h-8 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
                        >
                          {statusTransitioning ? <Spinner size="sm" className="mr-1" /> : null}
                          <Wrench className="w-3.5 h-3.5 mr-1" /> Iniciar Trabajo
                        </Button>
                      )}

                      {(selectedJob.status === "EN_EJECUCION" || selectedJob.status === "SUSPENDIDO") && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusTransition(selectedJob.id, "FINALIZADO")}
                          disabled={statusTransitioning}
                          className="text-xs h-8 cursor-pointer bg-success text-white hover:bg-success/90"
                        >
                          {statusTransitioning ? <Spinner size="sm" className="mr-1" /> : null}
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Finalizar OT
                        </Button>
                      )}

                      {selectedJob.status === "FINALIZADO" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusTransition(selectedJob.id, "ENTREGADO")}
                          disabled={statusTransitioning}
                          className="text-xs h-8 cursor-pointer bg-info text-white hover:bg-info/90"
                        >
                          {statusTransitioning ? <Spinner size="sm" className="mr-1" /> : null}
                          <FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> Marcar como Entregado
                        </Button>
                      )}

                      {selectedJob.status === "ENTREGADO" && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusTransition(selectedJob.id, "CERRADO")}
                          disabled={statusTransitioning}
                          className="text-xs h-8 cursor-pointer bg-success text-white hover:bg-success/90"
                        >
                          {statusTransitioning ? <Spinner size="sm" className="mr-1" /> : null}
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Cerrar OT
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setShowCancelInput(true)}
                        disabled={statusTransitioning}
                        className="text-xs h-8 cursor-pointer"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Bottom status helper */}
              <div className="p-4 border-t border-border bg-muted/50 text-[10px] font-mono text-muted-foreground text-center flex items-center justify-center gap-2">
                <UserCheck className="w-3.5 h-3.5 text-primary" /> Operario Responsable: {selectedJob.assignedTech}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}






