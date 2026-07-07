/**
 * Motion tokens para ERP y Portal.
 *
 * Duraciones y easings segun BLUEPRINT_ERP_REDESIGN.md §1.6 y
 * BLUEPRINT_PORTAL_REDESIGN.md §2.6. Los tokens del ERP son mas
 * rapidos (velocidad operativa); los del Portal son mas calmados
 * (lectura editorial).
 *
 * La politica de animacion del Frontend Policy fija un maximo de
 * 200ms para interacciones criticas. Los page transitions pueden
 * extenderse a 240ms; los del Portal a 320ms respetando la regla
 * del 80% de la politica.
 */

export const duration = {
  // === Base (compartido) ===
  instant: 80,
  fast: 120,
  base: 180,
  slow: 240,

  // === ERP (operativo, velocidad) ===
  erp: {
    instant: 60,
    fast: 120,
    base: 180,
    slow: 200,
  },

  // === Portal (editorial, calmado) ===
  portal: {
    instant: 80,
    fast: 160,
    base: 240,
    slow: 320,
  },
} as const;

export const easing = {
  /** Easing principal: cubic-bezier(0.2, 0, 0, 1) — ease-out suave sin rebote. */
  standard: [0.2, 0, 0, 1] as const,
  /** Easing editorial: cubic-bezier(0.16, 1, 0.3, 1) — salida larga, llegada firme. */
  editorial: [0.16, 1, 0.3, 1] as const,
  /** Easing lineal (loops, shimmers). */
  linear: [0, 0, 1, 1] as const,
} as const;

export const motionCss = {
  /** CSS transition shorthand para usar en className inline. */
  transition: (ms: number, curve: keyof typeof easing = "standard") =>
    `transition-all duration-[${ms}ms] ease-[cubic-bezier(${easing[curve].join(",")})]`,
} as const;
