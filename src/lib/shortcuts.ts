/**
 * Definiciones de atajos de teclado.
 *
 * Los IDs son estables (usar como key en componentes); los labels
 * son los textos canonicos (en espanol neutro) que se muestran en
 * el command bar, panel "?" y tooltips. El render OS-aware se
 * delega a usePlatform().format().
 *
 * Los atajos se documentan en BLUEPRINT_ERP_REDESIGN.md §13.1 y
 * BLUEPRINT_PORTAL_REDESIGN.md §3.3.
 */

export type ShortcutScope = "global" | "list" | "crm-deal";

export interface ShortcutDef {
  id: string;
  /** Combinacion canonica: "K", "1", "Shift+K", "Mod+K", "Enter", etc. */
  combo: string;
  /** Accion en espanol neutro para mostrar al usuario. */
  label: string;
  /** Modulo donde aplica el atajo. */
  scope: ShortcutScope;
  /** Si es "mod" se reemplaza por ⌘ o Ctrl segun OS. */
  mod?: boolean;
}

export const SHORTCUTS: ShortcutDef[] = [
  // === Globales ===
  { id: "command-bar", combo: "Mod+K", label: "Abrir buscador", scope: "global", mod: true },
  { id: "module-1", combo: "Mod+1", label: "Ir al Dashboard", scope: "global", mod: true },
  { id: "module-2", combo: "Mod+2", label: "Ir a Inventario", scope: "global", mod: true },
  { id: "module-3", combo: "Mod+3", label: "Ir a Compras", scope: "global", mod: true },
  { id: "module-4", combo: "Mod+4", label: "Ir a Facturacion", scope: "global", mod: true },
  { id: "module-5", combo: "Mod+5", label: "Ir a CRM", scope: "global", mod: true },
  { id: "module-6", combo: "Mod+6", label: "Ir a Clientes", scope: "global", mod: true },
  { id: "module-7", combo: "Mod+7", label: "Ir a CMS", scope: "global", mod: true },
  { id: "module-8", combo: "Mod+8", label: "Ir a Configuracion", scope: "global", mod: true },
  { id: "new-entity", combo: "Mod+N", label: "Crear entidad (contexto)", scope: "global", mod: true },
  { id: "new-invoice", combo: "Mod+Shift+F", label: "Crear factura", scope: "global", mod: true },
  { id: "new-po", combo: "Mod+Shift+P", label: "Crear orden de compra", scope: "global", mod: true },
  { id: "help", combo: "Mod+/", label: "Mostrar atajos del modulo", scope: "global", mod: true },
  { id: "escape", combo: "Escape", label: "Cerrar panel/modal", scope: "global" },

  // === En listas ===
  { id: "filter", combo: "Mod+F", label: "Filtrar lista", scope: "list", mod: true },
  { id: "open-selected", combo: "Enter", label: "Abrir item seleccionado", scope: "list" },
  { id: "nav-down", combo: "ArrowDown", label: "Siguiente item", scope: "list" },
  { id: "nav-up", combo: "ArrowUp", label: "Item anterior", scope: "list" },
  { id: "toggle-select", combo: "Space", label: "Seleccionar item", scope: "list" },

  // === En deal de CRM ===
  { id: "stage-prospect", combo: "1", label: "Mover a Prospecto", scope: "crm-deal" },
  { id: "stage-qualified", combo: "2", label: "Mover a Calificado", scope: "crm-deal" },
  { id: "stage-proposal", combo: "3", label: "Mover a Propuesta", scope: "crm-deal" },
  { id: "stage-negotiation", combo: "4", label: "Mover a Negociacion", scope: "crm-deal" },
  { id: "stage-won", combo: "5", label: "Marcar como ganado", scope: "crm-deal" },
  { id: "stage-lost", combo: "0", label: "Marcar como perdido", scope: "crm-deal" },
];

export const SHORTCUTS_BY_SCOPE: Record<ShortcutScope, ShortcutDef[]> =
  SHORTCUTS.reduce(
    (acc, s) => {
      acc[s.scope].push(s);
      return acc;
    },
    { global: [], list: [], "crm-deal": [] } as Record<ShortcutScope, ShortcutDef[]>
  );

/** Devuelve un atajo por id. */
export function getShortcut(id: string): ShortcutDef | undefined {
  return SHORTCUTS.find((s) => s.id === id);
}
