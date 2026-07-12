/**
 * FASE 5.4 — Inicialización de Sentry en el cliente (browser).
 *
 * Convención de Next.js 15+/@sentry-nextjs v9+: reemplaza al antiguo
 * `sentry.client.config.ts` (deprecado — ya no se carga automáticamente).
 * Vive en la raíz del proyecto (junto a middleware.ts), no en src/, porque
 * así resuelve este proyecto sus archivos especiales de Next.js.
 *
 * Sin NEXT_PUBLIC_SENTRY_DSN configurado, Sentry.init() no envía nada — la
 * app funciona igual, simplemente sin reporte de errores.
 */
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 10% de las transacciones en producción — suficiente para detectar
  // regresiones de performance sin agotar la cuota gratuita (5K events/mes).
  tracesSampleRate: 0.1,

  // Session Replay: graba el 10% de las sesiones normales y el 100% de las
  // que terminan en error, para poder reproducir visualmente el bug.
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Silenciar en dev evita ruido en consola cuando no hay DSN configurado localmente.
  debug: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
