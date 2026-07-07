/**
 * Logger estructurado con soporte para múltiples niveles y tags.
 *
 * En desarrollo local imprime en consola con colores.
 * En producción se puede conectar a un servicio externo (Sentry, Datadog, etc.)
 * reemplazando el callback de `transport`.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  level: LogLevel;
  message: string;
  module: string;
  timestamp: string;
  data?: Record<string, unknown>;
  error?: Error;
  requestId?: string;
  tenantId?: string;
}

type TransportFn = (entry: LogEntry) => void;

let transport: TransportFn = defaultTransport;

export function setTransport(fn: TransportFn) {
  transport = fn;
}

function defaultTransport(entry: LogEntry) {
  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.module}]`;
  const meta = entry.data ? ` ${JSON.stringify(entry.data)}` : "";
  const err = entry.error ? ` ${entry.error.stack ?? entry.error.message}` : "";

  switch (entry.level) {
    case "error":
      console.error(prefix, entry.message, meta, err);
      break;
    case "warn":
      console.warn(prefix, entry.message, meta);
      break;
    case "debug":
      console.debug(prefix, entry.message, meta);
      break;
    default:
      console.log(prefix, entry.message, meta);
  }
}

function createLogger(module: string) {
  function log(level: LogLevel, message: string, opts?: Partial<LogEntry>) {
    transport({
      level,
      message,
      module,
      timestamp: new Date().toISOString(),
      ...opts,
    });
  }

  return {
    debug: (message: string, opts?: Partial<LogEntry>) =>
      log("debug", message, opts),
    info: (message: string, opts?: Partial<LogEntry>) =>
      log("info", message, opts),
    warn: (message: string, opts?: Partial<LogEntry>) =>
      log("warn", message, opts),
    error: (message: string, opts?: Partial<LogEntry>) =>
      log("error", message, opts),
    child: (childModule: string) => createLogger(`${module}:${childModule}`),
  };
}

export type Logger = ReturnType<typeof createLogger>;

export default createLogger;
