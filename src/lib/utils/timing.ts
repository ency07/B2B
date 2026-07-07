/**
 * Utilidad para medir y registrar tiempos de ejecución de operaciones.
 * Útil para identificar cuellos de botella en producción.
 *
 * Uso:
 *   const timer = startTimer("getIndustrialCatalog");
 *   const result = await fetchCatalogFromDB();
 *   timer.stop(); // logs: [perf] getIndustrialCatalog: 342ms
 */

import createLogger from "./logger";

const perfLog = createLogger("perf");

export function startTimer(label: string) {
  const start = performance.now();
  return {
    stop: (extra?: Record<string, unknown>) => {
      const elapsed = Math.round(performance.now() - start);
      if (elapsed > 300) {
        perfLog.warn(`Slow operation: ${label}`, { data: { ...extra, elapsedMs: elapsed } });
      } else {
        perfLog.info(`Operation: ${label}`, { data: { ...extra, elapsedMs: elapsed } });
      }
      return elapsed;
    },
  };
}
