# Estrategia de Manejo de Errores

## Arquitectura

### Capas de manejo de errores

1. **Server Actions** → `withErrorHandling()` wrapper
   - Valida entrada con Zod
   - Captura errores y retorna `ActionState<T>`
   - Nunca expone detalles internos al cliente

2. **Componentes** → `ErrorBoundary` (React error boundary)
   - Captura errores de renderizado
   - Muestra fallback amigable con opción de reintentar
   - Loggea el error vía logger estructurado

3. **API Routes** → Middleware + error handlers
   - Errores HTTP con formato JSON consistente
   - Health check endpoint

4. **Global** → `app/error.tsx` + `app/not-found.tsx`
   - Manejo de errores de ruta no encontrada
   - Manejo de errores globales del layout

### Clases de Error

| Clase | Propósito | Código HTTP |
|-------|-----------|-------------|
| `AppError` | Error base de aplicación | - |
| `AppError` + `VALIDATION_ERROR` | Error de validación | 400 |
| `AppError` + `AUTH_ERROR` | No autenticado | 401 |
| `AppError` + `FORBIDDEN` | Sin permisos | 403 |
| `AppError` + `NOT_FOUND` | Recurso no encontrado | 404 |
| `AppError` + `RATE_LIMITED` | Rate limiting | 429 |
| `AppError` + `TENANT_MISMATCH` | Violación multi-tenant | 403 |

### Formato de respuesta en Server Actions

```typescript
// Éxito
{ status: "success", data: T }

// Error
{ status: "error", code: ErrorCode, message: string }
```

### Formato de respuesta en API Routes

```typescript
// Éxito
{ data: T }

// Error
{ error: { code: string; message: string; details?: unknown } }
```

### Logging

- Usar `logError()`, `logWarn()`, `logInfo()` de `@/lib/utils/logger`
- Nunca usar `console.error()` en producción
- Los errores se loggean con tags por módulo
