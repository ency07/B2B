/**
 * FASE 5.4 — Hook de registro de Next.js (App Router).
 *
 * register() corre una vez al arrancar cada runtime del servidor y decide
 * qué config de Sentry cargar según NEXT_RUNTIME — necesario porque
 * sentry.server.config.ts usa APIs de Node no disponibles en Edge.
 *
 * onRequestError conecta el error-reporting nativo de Next.js (errores en
 * Server Components, Server Actions y Route Handlers que Next captura antes
 * de que lleguen a un error.tsx) con Sentry.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
