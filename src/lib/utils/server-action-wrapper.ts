import { AppError, type ErrorCode } from "./app-error";
import { logError } from "./logger";

export type ActionState<T> =
  | { status: "success"; data: T }
  | { status: "error"; code: ErrorCode; message: string }
  | { status: "idle" };

export function withErrorHandling<TArgs extends unknown[], TData>(
  fn: (...args: TArgs) => Promise<TData>,
  options?: { logLabel?: string }
): (...args: TArgs) => Promise<ActionState<TData>> {
  const label = options?.logLabel ?? (fn.name || "anonymous");

  return async (...args: TArgs): Promise<ActionState<TData>> => {
    try {
      const data = await fn(...args);
      return { status: "success", data };
    } catch (err) {
      if (err instanceof AppError) {
        logError(`Server action failed: ${label}`, {
          error: err,
          data: { code: err.code, details: err.details },
        });
        return { status: "error", code: err.code, message: err.message };
      }
      const message = err instanceof Error ? err.message : "Error desconocido";
      logError(`Server action failed: ${label}`, {
        error: err instanceof Error ? err : undefined,
      });
      return { status: "error", code: "INTERNAL_ERROR", message };
    }
  };
}
