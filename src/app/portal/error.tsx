"use client";

import * as React from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/platform/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PortalError({ error, reset }: ErrorProps) {
  React.useEffect(() => {
    Sentry.captureException(error);
    if (process.env.NODE_ENV !== "production") {
      console.error("[Portal error boundary]", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center space-y-6 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" strokeWidth={1.5} />
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-bold text-foreground">
            Algo salió mal al cargar esta sección
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ocurrió un error inesperado. Intentá de nuevo — si el problema
            continúa, contactá a tu ejecutivo comercial.
          </p>
        </div>
        {error.digest && (
          <p className="text-xs font-mono text-muted-foreground/70 bg-muted px-3 py-1.5 rounded inline-block">
            Código: {error.digest}
          </p>
        )}
        <Button onClick={reset} className="w-full cursor-pointer">
          <RefreshCw className="w-4 h-4" />
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
}
