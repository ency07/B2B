/**
 * FASE 5.4 — Inicialización de Sentry en el Edge Runtime (middleware.ts y
 * cualquier route handler con `export const runtime = "edge"`).
 *
 * Cargado por instrumentation.ts vía `await import("./sentry.edge.config")`
 * cuando NEXT_RUNTIME === "edge". El Edge Runtime no soporta todas las
 * integraciones del SDK de Node (sin filesystem, sin la mayoría de APIs de
 * Node) — por eso Sentry expone una inicialización separada y más liviana.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  debug: false,
});
