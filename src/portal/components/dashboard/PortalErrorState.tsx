"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/platform/ui/button";

interface PortalErrorStateProps {
  onDismiss: () => void;
  onRetry: () => void;
}

export function PortalErrorState({ onDismiss, onRetry }: PortalErrorStateProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)/0.03,transparent_60%)] pointer-events-none" />
      <div className="max-w-md w-full rounded-2xl border border-destructive/20 bg-card p-8 text-center space-y-6 shadow-2xl relative">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto border border-destructive/10 animate-bounce">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-mono text-destructive uppercase tracking-widest font-bold">{/* ERROR_CONEXION */}</span>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Fallo de conexión</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            No pudimos cargar tu información en este momento. Por favor intenta de nuevo o contacta a tu ejecutivo.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" className="text-xs font-mono cursor-pointer" onClick={onDismiss}>
            Ignorar
          </Button>
          <Button onClick={onRetry} className="bg-destructive hover:bg-destructive/90 text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" /> Reintentar Conexión
          </Button>
        </div>
      </div>
    </div>
  );
}
