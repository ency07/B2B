/**
 * Barrel export para el patron DataList (Ola 1).
 *
 * Componentes disponibles:
 *  - DataList: lista premium con seleccion, loading, empty
 *  - FilterBar: filtros como pills + tabs de vistas guardadas
 *  - BulkActionBar: barra flotante de acciones en lote
 *  - StatusDot / StatusPill: atomos de estatus semantico
 *  - EmptyState: estado vacio diseñado
 *  - SplitView: composicion de lista + detalle en panel derecho
 */

export { DataList } from "./data-list";
export type {
  DataListProps,
  DataListColumn,
} from "./data-list";

export { FilterBar } from "./filter-bar";
export type {
  FilterBarProps,
  FilterField,
  FilterValue,
  FilterOperator,
  SavedView,
} from "./filter-bar";

export { BulkActionBar } from "./bulk-action-bar";
export type { BulkActionBarProps, BulkAction } from "./bulk-action-bar";

export { StatusDot } from "./status-dot";
export type { StatusDotProps, StatusVariant } from "./status-dot";

export { StatusPill } from "./status-pill";
export type { StatusPillProps } from "./status-pill";

export { EmptyState } from "./empty-state";
export type {
  EmptyStateProps,
  EmptyStateAction,
} from "./empty-state";

export { SplitView } from "./split-detail";
export type { SplitViewProps } from "./split-detail";
