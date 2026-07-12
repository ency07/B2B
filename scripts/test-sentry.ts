// SCRIPT DE PRUEBA: INTEGRACIÓN DE SENTRY (FASE 5.4)
// Archivo: scripts/test-sentry.ts
//
// Dispara un evento de prueba (mensaje + excepción) contra Sentry usando
// SENTRY_DSN de .env, para confirmar que la integración está bien
// configurada de punta a punta ANTES de depender de ella en producción.
//
// Uso: npm run test:sentry
//
// Se ejecuta con ts-node fuera del runtime de Next.js, por eso usa
// @sentry/node directamente (el mismo SDK de Node que carga
// sentry.server.config.ts en la app) en vez de @sentry/nextjs, que depende
// de resolución de build específica de Next.js (webpack/turbopack) no
// disponible aquí.

import * as dotenv from "dotenv";
dotenv.config();

import * as Sentry from "@sentry/node";

async function main() {
  const dsn = process.env.SENTRY_DSN;

  console.log("--------------------------------------------------");
  console.log("PRUEBA DE INTEGRACIÓN: SENTRY (FASE 5.4)");
  console.log("--------------------------------------------------\n");

  if (!dsn) {
    console.log(
      "⚠ SENTRY_DSN no está configurado en el entorno — se omite el envío real.\n" +
        "  Configura SENTRY_DSN en .env (ver .env.example) y volvé a correr este script\n" +
        "  para confirmar que el evento llega al dashboard de Sentry.\n"
    );
    return;
  }

  Sentry.init({ dsn, tracesSampleRate: 1.0 });
  console.log(`✓ Sentry.init() con DSN configurado (${dsn.replace(/\/\/.*@/, "//<key oculta>@")})`);

  Sentry.captureMessage("[test-sentry.ts] Mensaje de prueba — integración FASE 5.4", "info");
  console.log("✓ Mensaje de prueba enviado (captureMessage)");

  try {
    throw new Error("[test-sentry.ts] Error de prueba — integración FASE 5.4");
  } catch (err) {
    Sentry.captureException(err);
    console.log("✓ Excepción de prueba enviada (captureException)");
  }

  // Sentry envía eventos de forma asíncrona en batch — sin flush() el
  // proceso podría terminar antes de que la request HTTP salga.
  const flushed = await Sentry.flush(5000);
  if (!flushed) {
    console.warn("⚠ Sentry.flush() no confirmó el envío dentro de 5s — revisa conectividad de red.");
  }

  console.log("\n--------------------------------------------------");
  console.log("Revisa el dashboard de Sentry (Issues) — deberías ver");
  console.log("1 mensaje y 1 excepción con el prefijo [test-sentry.ts].");
  console.log("--------------------------------------------------");
}

main().catch((err) => {
  console.error("[FALLO] test-sentry.ts:", err);
  process.exit(1);
});
