"use client";

import React from "react";
import { Search, UserCheck, Wind, ChevronDown } from "lucide-react";
import { Input } from "@/platform/ui/input";
import { Button } from "@/platform/ui/button";

interface OT {
  code: string;
  title: string;
  status: string; // "DISEÑO" | "CORTE" | "BALANCEO" | "PRUEBAS" | "DESPACHO"
  progress: number;
  startDate: string;
  endDate: string;
  tech: string;
}

interface OrderTrackingSectionProps {
  ots: OT[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  expandedOt: string | null;
  setExpandedOt: (id: string | null) => void;
}

export function OrderTrackingSection({
  ots,
  searchQuery,
  setSearchQuery,
  expandedOt,
  setExpandedOt,
}: OrderTrackingSectionProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">// FABRICATION_STREAM</span>
          <h3 className="text-lg font-bold text-foreground mt-0.5">Monitoreo Físico de Turbomáquinas</h3>
          <p className="text-xs text-muted-foreground mt-1 font-sans">
            Consulte los hitos de balanceo, curvas de presión e inspecciones de calidad de sus equipos.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código de obra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs font-mono border-border bg-background/50 h-9"
          />
        </div>
      </div>

      {/* OTs Grid */}
      <div className="space-y-6">
        {ots
          .filter(ot => ot.code.toLowerCase().includes(searchQuery.toLowerCase()) || ot.title.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((ot) => {
            const phases = ["DISEÑO", "CORTE", "BALANCEO", "PRUEBAS", "DESPACHO"];
            const currentPhaseIdx = phases.indexOf(ot.status);
            const isSelected = expandedOt === ot.code;

            return (
              <div 
                key={ot.code} 
                className={`rounded-xl border transition-all duration-300 ${
                  isSelected ? "border-primary/50 bg-primary/[0.01]" : "border-border hover:border-border-hover bg-background/20"
                } overflow-hidden`}
              >
                <div className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
                          {ot.code}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground tracking-tight">// IN-FACTORY</span>
                      </div>
                      <h4 className="text-base font-bold text-foreground mt-1">{ot.title}</h4>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-mono text-muted-foreground block tracking-wider uppercase font-bold">Avance Est.</span>
                      <span className="text-2xl font-mono font-bold text-emerald-500">{ot.progress}%</span>
                    </div>
                  </div>

                  {/* Stepper with details */}
                  <div className="grid grid-cols-5 gap-2 pt-2 relative">
                    {phases.map((ph, idx) => {
                      const isCompleted = idx < currentPhaseIdx;
                      const isCurrent = idx === currentPhaseIdx;

                      return (
                        <div key={ph} className="space-y-2 text-center relative z-10">
                          <div className={`h-2 rounded-full transition-all duration-500 ${
                            isCompleted ? "bg-emerald-500" : isCurrent ? "bg-primary animate-pulse shadow-[0_0_10px_var(--primary)]" : "bg-muted"
                          }`} />
                          <span className={`text-[9px] font-mono tracking-wider font-bold block ${
                            isCompleted ? "text-emerald-500" : isCurrent ? "text-primary" : "text-muted-foreground"
                          }`}>
                            {ph}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tech and Dates metadata row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-4 border-t border-border/60 font-mono text-muted-foreground">
                    <div>
                      <span className="block text-[10px] text-muted-foreground">Supervisor Responsable:</span>
                      <span className="text-foreground font-sans font-bold flex items-center gap-1.5 mt-0.5">
                        <UserCheck className="w-3.5 h-3.5 text-primary" /> {ot.tech}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground">Inicio de Obra:</span>
                      <span className="text-foreground font-bold mt-0.5 block">{ot.startDate}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-muted-foreground">Fecha Despacho Est:</span>
                      <span className="text-foreground font-bold mt-0.5 block">{ot.endDate}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button 
                        onClick={() => setExpandedOt(isSelected ? null : ot.code)}
                        variant="outline" 
                        className="text-xs font-mono flex items-center gap-1.5 h-9 cursor-pointer"
                      >
                        <span>Hitos QA</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isSelected ? "rotate-180 text-primary" : ""}`} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Hitos Expandable Timeline */}
                {isSelected && (
                  <div className="border-t border-border bg-card/65 p-5 space-y-4 font-mono text-xs animate-in slide-in-from-top duration-300">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground border-b border-border pb-2.5">
                      <span>// MONITOREO DE CERTIFICADOS E INSPECCIÓN EN FABRICACIÓN</span>
                      <span className="text-primary font-bold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> LIVE SYSTEM
                      </span>
                    </div>
                    
                    <div className="space-y-5 relative pl-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-border">
                      
                      {/* DISEÑO */}
                      <div className="relative space-y-1">
                        <div className="absolute left-[-13px] top-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                        <div className="flex justify-between font-bold text-foreground">
                          <span>Fase 1: DISEÑO MECÁNICO Y SIMULACIÓN CFD</span>
                          <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border-none">COMPLETADO</span>
                        </div>
                        <p className="text-muted-foreground font-sans">
                          Planos tridimensionales de anclajes firmados. Modelado CFD completado, simulando un flujo térmico continuo de aire a 7,500 CFM sin turbulencias residuales.
                        </p>
                        <span className="text-[10px] text-muted-foreground block leading-none">// Aprobado por Ing. Carlos Mendoza (2026-06-12)</span>
                      </div>

                      {/* CORTE */}
                      <div className="relative space-y-1">
                        <div className="absolute left-[-13px] top-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                        <div className="flex justify-between font-bold text-foreground">
                          <span>Fase 2: CORTE Y EMBUTIDO DE ÁLABES CNC</span>
                          <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border-none">COMPLETADO</span>
                        </div>
                        <p className="text-muted-foreground font-sans">
                          Láminas de acero al carbón cortadas por láser CNC. Calibración dimensional del cono de entrada de 1.2 mm completada sin excentricidad.
                        </p>
                        <span className="text-[10px] text-muted-foreground block leading-none">// Liberación física en Taller 1 (2026-06-15)</span>
                      </div>

                      {/* BALANCEO */}
                      <div className="relative space-y-1">
                        <div className="absolute left-[-13.5px] top-1.5 w-2.5 h-2.5 rounded-full border border-primary bg-background flex items-center justify-center">
                          <div className={`w-1 h-1 rounded-full ${ot.status === "BALANCEO" ? "bg-primary animate-pulse" : "bg-emerald-500"}`} />
                        </div>
                        <div className="flex justify-between font-bold text-foreground">
                          <span>Fase 3: BALANCEO ESTÁTICO Y DINÁMICO ISO G2.5</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border-none ${ot.progress >= 60 ? "bg-emerald-500/10 text-emerald-500" : "bg-sky-500/10 text-sky-500 animate-pulse"}`}>
                            {ot.progress >= 60 ? "COMPLETADO" : "EN CALIBRACIÓN"}
                          </span>
                        </div>
                        <p className="text-muted-foreground font-sans">
                          {ot.progress >= 60 
                            ? "Sometido a banco de pruebas de balanceo dinámico dinámico. Registro de vibraciones dentro de límites seguros de la norma ISO G2.5."
                            : "Montaje del rotor VT-7500 en banco de balanceo. Pendiente inyección de contrapesos correctores en masa de álabes."}
                        </p>
                        <span className="text-[10px] text-muted-foreground block leading-none">
                          {ot.progress >= 60 
                            ? "// Certificado de Balanceo QA-ISO-042 adjunto en descargas" 
                            : "// Responsable: Téc. Andrés Silva"}
                        </span>
                      </div>

                      {/* PRUEBAS */}
                      <div className="relative space-y-1">
                        <div className="absolute left-[-13.5px] top-1.5 w-2.5 h-2.5 rounded-full border border-border bg-background flex items-center justify-center">
                          <div className={`w-1.5 h-1.5 rounded-full ${ot.status === "PRUEBAS" ? "bg-primary animate-pulse" : "bg-border"}`} />
                        </div>
                        <div className="flex justify-between font-bold text-foreground">
                          <span>Fase 4: PRUEBAS ELÉCTRICAS Y CURVA DE CAUDAL</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border-none ${ot.status === "PRUEBAS" ? "bg-sky-500/10 text-sky-500 animate-pulse" : ot.status === "DESPACHO" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                            {ot.status === "PRUEBAS" ? "EN CURSO EN TÚNEL" : ot.status === "DESPACHO" ? "COMPLETADO" : "PENDIENTE"}
                          </span>
                        </div>
                        <p className="text-muted-foreground font-sans">
                          Ensayos de motor en cámara de aislamiento y túnel de viento. Medición de curvas CFM contra caída de presión en inWG. Termografía en devanados del estator.
                        </p>
                        {ot.status === "PRUEBAS" && (
                          <div className="bg-background border border-border/80 p-2.5 rounded-lg flex items-center justify-between text-[10px] font-mono mt-1 text-primary">
                            <span className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 animate-spin" /> FLUJO DETECTADO: 7,490 CFM</span>
                            <span>RPM: 1,740 RPM</span>
                            <span>TEMP: 43.2°C</span>
                          </div>
                        )}
                      </div>

                      {/* DESPACHO */}
                      <div className="relative space-y-1">
                        <div className="absolute left-[-13px] top-1.5 w-2 h-2 rounded-full bg-border" />
                        <div className="flex justify-between font-bold text-foreground">
                          <span>Fase 5: LOGÍSTICA DE DESPACHO INTERNACIONAL</span>
                          <span className="text-[10px] text-muted-foreground bg-muted/10 px-2 py-0.5 rounded border-none">PENDIENTE</span>
                        </div>
                        <p className="text-muted-foreground font-sans">
                          Manifiesto de embarque terrestre en camión de plataforma baja. Envoltura plástica protectora reforzada contra ambiente salino y huacal de madera.
                        </p>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}

        {ots.filter(ot => ot.code.toLowerCase().includes(searchQuery.toLowerCase()) || ot.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
          <div className="text-center py-12 border border-dashed border-border rounded-xl">
            <svg className="w-12 h-12 mx-auto text-muted-foreground/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="12" cy="12" r="10" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span className="text-xs font-mono text-muted-foreground block mt-3">// NO_RESULTS_FOUND_FOR_SEARCH</span>
          </div>
        )}
      </div>
    </div>
  );
}
