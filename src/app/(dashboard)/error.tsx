"use client";

import * as React from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/platform/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    Sentry.captureException(error);
    if (process.env.NODE_ENV !== "production") {
      console.error("[Dashboard error boundary]", error);
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="flex flex-col items-center p-8 bg-card border border-border rounded-xl shadow-lg max-w-md">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-6">
          <AlertTriangle className="w-8 h-8" strokeWidth={1.5} />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground mb-2">
          Algo salió mal al cargar esta sección
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm mb-6 leading-relaxed">
          Ocurrió un error inesperado. Podés intentar de nuevo — si el problema
          persiste, contactá al administrador del sistema.
        </p>
        {error.digest && (
          <p className="text-xs font-mono text-muted-foreground/70 bg-muted px-3 py-1.5 rounded mb-6">
            Código: {error.digest}
          </p>
        )}
        <Button onClick={reset} className="cursor-pointer">
          <RefreshCw className="w-4 h-4" />
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
}
