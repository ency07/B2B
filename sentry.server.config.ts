/**
 * FASE 5.4 — Inicialización de Sentry en el servidor (Node.js runtime).
 *
 * Cargado por instrumentation.ts vía `await import("./sentry.server.config")`
 * cuando NEXT_RUNTIME === "nodejs" — no se importa directamente en ningún
 * otro lugar de la app.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
});
