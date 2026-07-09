"use client";

import React from "react";
import { Search, ChevronRight, UserCheck, Wind } from "lucide-react";

interface OT {
  code: string;
  title: string;
  status: string;
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

const PHASES = ["DISEÑO", "CORTE", "BALANCEO", "PRUEBAS", "DESPACHO"];
const PHASE_LABELS: Record<string, string> = {
  DISEÑO: "Diseño",
  CORTE: "Corte CNC",
  BALANCEO: "Balanceo ISO",
  PRUEBAS: "Pruebas",
  DESPACHO: "Despachado",
};
const PHASE_COLORS: Record<string, string> = {
  DISEÑO: "text-state-info bg-state-info/30 border-state-info/50",
  CORTE: "text-state-neutral bg-state-neutral/30 border-state-neutral/50",
  BALANCEO: "text-state-warning bg-state-warning/30 border-state-warning/50",
  PRUEBAS: "text-state-info bg-state-info/30 border-state-info/50",
  DESPACHO: "text-state-success bg-state-success/30 border-state-success/50",
};

function getPhaseInfo(status: string) {
  const key = status.toUpperCase();
  return {
    label: PHASE_LABELS[key] ?? status,
    color: PHASE_COLORS[key] ?? "text-muted-foreground bg-muted/30 border-border",
  };
}

export function OrderTrackingSection({
  ots,
  searchQuery,
  setSearchQuery,
  expandedOt,
  setExpandedOt,
}: OrderTrackingSectionProps) {
  const filtered = ots.filter(
    (ot) =>
      ot.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ot.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Órdenes de trabajo</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {ots.length} {ots.length === 1 ? "equipo en producción" : "equipos en producción"}
          </p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            placeholder="Buscar código o proyecto…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-52 pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[120px_1fr_130px_100px_100px_36px] gap-x-4 items-center px-4 py-2.5 bg-muted/30 border-b border-border text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          <span>Código</span>
          <span>Proyecto</span>
          <span className="hidden md:block">Fase</span>
          <span className="hidden sm:block">Avance</span>
          <span className="hidden lg:block">Entrega est.</span>
          <span />
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/50">
          {filtered.map((ot) => {
            const isExpanded = expandedOt === ot.code;
            const { label, color } = getPhaseInfo(ot.status);
            const currentPhaseIdx = PHASES.indexOf(ot.status.toUpperCase());

            return (
              <React.Fragment key={ot.code}>
                {/* Main row */}
                <div
                  className={`grid grid-cols-[120px_1fr_130px_100px_100px_36px] gap-x-4 items-center px-4 py-3.5 cursor-pointer transition-colors select-none ${
                    isExpanded
                      ? "bg-primary/[0.04] border-l-2 border-l-primary"
                      : "hover:bg-muted/20 border-l-2 border-l-transparent"
                  }`}
                  onClick={() => setExpandedOt(isExpanded ? null : ot.code)}
                >
                  <span className="text-xs font-mono text-primary font-medium truncate">
                    {ot.code}
                  </span>
                  <span className="text-sm text-foreground truncate pr-4">{ot.title}</span>
                  <span className="hidden md:block">
                    <span className={`inline-flex text-[10px] px-2 py-0.5 rounded border font-mono ${color}`}>
                      {label}
                    </span>
                  </span>
                  <span className="hidden sm:flex items-center gap-2">
                    <div className="h-1 w-14 bg-muted rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className="h-full bg-state-success rounded-full transition-all duration-500"
                        style={{ width: `${ot.progress}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono tabular-nums">
                      {ot.progress}%
                    </span>
                  </span>
                  <span className="hidden lg:block text-xs text-muted-foreground font-mono">
                    {ot.endDate || "Fecha por confirmar"}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                      isExpanded ? "rotate-90 text-primary" : ""
                    }`}
                  />
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-border/50 bg-card/50 px-6 py-5 space-y-5">
                    {/* Phase stepper */}
                    <div className="flex items-center">
                      {PHASES.map((ph, idx) => {
                        const done = idx < currentPhaseIdx;
                        const active = idx === currentPhaseIdx;
                        return (
                          <React.Fragment key={ph}>
                            <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border transition-all ${
                                  done
                                    ? "bg-state-success border-state-success text-white"
                                    : active
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border/60 bg-background text-muted-foreground/60"
                                }`}
                              >
                                {done ? "✓" : idx + 1}
                              </div>
                              <span
                                className={`text-[9px] font-mono uppercase tracking-wider leading-none ${
                                  done
                                    ? "text-state-success"
                                    : active
                                    ? "text-primary"
                                    : "text-muted-foreground/50"
                                }`}
                              >
                                {PHASE_LABELS[ph]}
                              </span>
                            </div>
                            {idx < PHASES.length - 1 && (
                              <div
                                className={`h-px flex-1 mx-2 mb-4 transition-colors ${
                                  done ? "bg-state-success/60" : "bg-border/40"
                                }`}
                              />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>

                    {/* Metadata grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/40">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          Supervisor
                        </p>
                        <p className="text-xs text-foreground font-medium flex items-center gap-1.5">
                          <UserCheck className="w-3 h-3 text-primary shrink-0" />
                          {ot.tech}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          Inicio de obra
                        </p>
                        <p className="text-xs text-foreground font-mono">{ot.startDate || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          Entrega estimada
                        </p>
                        <p className="text-xs text-foreground font-mono">{ot.endDate || "Fecha por confirmar"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                          Avance
                        </p>
                        <p className="text-xs text-foreground font-mono font-semibold">
                          {ot.progress}%
                        </p>
                      </div>
                    </div>

                    {/* Live telemetry — only for PRUEBAS */}
                    {ot.status.toUpperCase() === "PRUEBAS" && (
                      <div className="flex items-center gap-6 px-4 py-3 rounded-lg border border-state-info/50 bg-state-info/30 text-[11px] font-mono text-state-info">
                        <span className="flex items-center gap-1.5">
                          <Wind className="w-3.5 h-3.5 animate-spin-slow" />
                          FLUJO: 7,490 CFM
                        </span>
                        <span>RPM: 1,740</span>
                        <span>TEMP: 43.2 °C</span>
                        <span className="ml-auto flex items-center gap-1.5 text-state-success">
                          <span className="w-1.5 h-1.5 rounded-full bg-state-success" />
                          EN TÚNEL
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center space-y-3">
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? `Sin resultados para "${searchQuery}"`
                  : "No hay órdenes de trabajo activas."}
              </p>
              {!searchQuery && (
                <p className="text-xs text-muted-foreground">
                  Si esperas ver una OT activa, contacta a tu ejecutivo para confirmar el estado.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
