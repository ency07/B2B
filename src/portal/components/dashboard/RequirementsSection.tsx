"use client";

import { PlusCircle } from "lucide-react";
import { Button } from "@/platform/ui/button";
import type { ClientRequirement } from "@/portal/actions/portal";

interface RequirementsSectionProps {
  requirements: ClientRequirement[];
  onNewRequirement: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  NUEVO: { label: "Recibido", cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  EN_REVISION: { label: "En revisión técnica", cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  DIAGNOSTICO: { label: "En diagnóstico", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  COTIZACION: { label: "Cotización en proceso", cls: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  APROBACION: { label: "Lista para aprobar", cls: "bg-teal-500/10 text-teal-600 dark:text-teal-400" },
  OT_GENERADA: { label: "Orden de trabajo creada", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  EJECUCION: { label: "En ejecución", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  CERRADO: { label: "Completado", cls: "bg-muted text-muted-foreground" },
  CANCELADO: { label: "Cancelado", cls: "bg-destructive/10 text-destructive" },
};

const PRIORITY_CONFIG: Record<string, string> = {
  LOW: "text-muted-foreground bg-muted",
  MEDIUM: "text-sky-600 dark:text-sky-400 bg-sky-500/10",
  HIGH: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  CRITICAL: "text-destructive bg-destructive/10",
};

const CATEGORY_LABEL: Record<string, string> = {
  FABRICACION: "Fabricación",
  VENTA: "Compra",
  MANTENIMIENTO: "Mantenimiento",
  REPARACION: "Reparación",
  OTRO: "Otro",
};

export function RequirementsSection({ requirements, onNewRequirement }: RequirementsSectionProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <h3 className="text-lg font-bold text-foreground">Mis Requerimientos</h3>
          <p className="text-xs text-muted-foreground mt-1 font-sans">
            Solicitudes de servicio, compra o fabricación enviadas desde el portal.
          </p>
        </div>
        <Button
          onClick={onNewRequirement}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Nuevo requerimiento
        </Button>
      </div>

      {requirements.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <PlusCircle className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">Aún no tienes requerimientos</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Usa el botón de arriba para solicitar la fabricación de un equipo, una compra, mantenimiento o cualquier otro servicio.
            </p>
          </div>
          <Button
            onClick={onNewRequirement}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium px-5 py-2 rounded-lg cursor-pointer"
          >
            Solicitar servicio ahora
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {requirements.map((req) => {
            const st = STATUS_CONFIG[req.status] ?? { label: req.status, cls: "bg-muted text-muted-foreground" };
            const pc = PRIORITY_CONFIG[req.priority] ?? "bg-muted text-muted-foreground";
            return (
              <div key={req.id} className="border border-border/80 bg-background/40 rounded-xl p-5 space-y-3 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <span className="text-xs font-mono font-bold text-primary">{req.code}</span>
                    <p className="text-sm font-semibold text-foreground leading-tight">{req.title}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>
                    {st.label}
                  </span>
                </div>
                {req.description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {req.description}
                  </p>
                )}
                <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/40">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pc}`}>
                    {req.priority}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {CATEGORY_LABEL[req.category] ?? req.category}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                    {new Date(req.createdAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
