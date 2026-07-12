"use client";

import * as React from "react";
import * as Sentry from "@sentry/nextjs";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * global-error.tsx solo se activa cuando el ROOT layout (src/app/layout.tsx)
 * falla — algo tan grave que ni el layout raíz pudo montar (providers,
 * fuentes, etc.). Por eso:
 *   - Vive en la raíz de app/, no dentro de un route group: Next.js no lo
 *     reconoce como boundary especial en ninguna otra ubicación.
 *   - Reemplaza <html>/<body> por completo — el layout raíz que los definía
 *     es justamente el que falló.
 *   - No puede depender de globals.css, next/font ni de ningún Provider
 *     (DesignSystemProvider, PostHogProvider, etc.), porque todos ellos
 *     viven en el layout que acaba de fallar. Se usan estilos inline a
 *     propósito, no clases de Tailwind.
 */
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  React.useEffect(() => {
    Sentry.captureException(error);
    if (process.env.NODE_ENV !== "production") {
      console.error("[Global error boundary]", error);
    }
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          backgroundColor: "#0a0a0a",
          color: "#fafafa",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
            padding: 32,
            margin: 16,
            borderRadius: 16,
            border: "1px solid #27272a",
            backgroundColor: "#18181b",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 9999,
              backgroundColor: "rgba(239,68,68,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: 28,
            }}
            aria-hidden
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>
            La aplicación no pudo cargar
          </h1>
          <p style={{ fontSize: 14, color: "#a1a1aa", lineHeight: 1.6, margin: "0 0 24px" }}>
            Ocurrió un error crítico. Intentá recargar la página; si el
            problema persiste, contactá a soporte técnico.
          </p>
          {error.digest && (
            <p
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                color: "#71717a",
                backgroundColor: "#0a0a0a",
                padding: "6px 12px",
                borderRadius: 6,
                display: "inline-block",
                marginBottom: 24,
              }}
            >
              Código: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{
              width: "100%",
              padding: "12px 24px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#fafafa",
              color: "#0a0a0a",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
