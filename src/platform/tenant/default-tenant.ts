/**
 * Código del tenant por defecto, usado cuando una página pública carga
 * sin `?tenant=` en la URL. Configurable por deployment vía
 * NEXT_PUBLIC_DEFAULT_TENANT_CODE — sin esa variable, cae a "acme"
 * (el tenant semilla de desarrollo).
 *
 * Este archivo NO importa nada de servidor (supabaseAdmin, etc.) a
 * propósito: se importa desde componentes "use client", y una variable
 * NEXT_PUBLIC_ ya se embebe en el bundle del cliente por diseño de
 * Next.js, así que no hay riesgo de fuga de secretos al mantenerlo así.
 */
export const DEFAULT_TENANT_CODE =
  process.env.NEXT_PUBLIC_DEFAULT_TENANT_CODE || "acme";
