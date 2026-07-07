export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_ERROR"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "TENANT_MISMATCH"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      code?: ErrorCode;
      details?: Record<string, unknown>;
    }
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = options?.statusCode ?? 500;
    this.code = options?.code ?? "INTERNAL_ERROR";
    this.details = options?.details;
  }
}

export async function toActionResponse<T>(
  promise: Promise<T>
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (err) {
    if (err instanceof AppError) {
      return { data: null, error: err };
    }
    const message = err instanceof Error ? err.message : "Error desconocido";
    return { data: null, error: new AppError(message) };
  }
}

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Los datos ingresados no son válidos. Verifique la información e intente nuevamente.",
  AUTH_ERROR: "Su sesión ha expirado o no está autenticado. Por favor, inicie sesión nuevamente.",
  FORBIDDEN: "No tiene permisos para realizar esta acción.",
  NOT_FOUND: "El recurso solicitado no fue encontrado.",
  RATE_LIMITED: "Ha realizado demasiadas solicitudes. Por favor, espere e intente nuevamente.",
  TENANT_MISMATCH: "La información solicitada no pertenece a su organización.",
  INTERNAL_ERROR: "Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.",
};

export function getUserFriendlyMessage(error: unknown): string {
  if (error instanceof AppError) {
    return ERROR_MESSAGES[error.code] ?? ERROR_MESSAGES.INTERNAL_ERROR;
  }
  if (error instanceof Error) {
    return error.message || ERROR_MESSAGES.INTERNAL_ERROR;
  }
  return ERROR_MESSAGES.INTERNAL_ERROR;
}
