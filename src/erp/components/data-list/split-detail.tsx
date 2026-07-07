/**
 * SplitView — patron de split-view para listas + detalle.
 *
 * Segun BLUEPRINT_ERP_REDESIGN.md §6.5, BLUEPRINT_PORTAL_REDESIGN.md §7.3:
 * - Panel de detalle a la derecha (no modal, no pagina nueva)
 * - La lista sigue visible a la izquierda
 * - Sticky header con back button (←) + sticky footer de acciones
 * - Cierre con back, esc, o click fuera
 * - Width default 480px, redimensionable 360-640px
 *
 * API composicional:
 *   <SplitView open={open} onOpenChange={...} defaultWidth={520}>
 *     <SplitView.List>{list}</SplitView.List>
 *     <SplitView.Detail>
 *       <SplitView.DetailHeader title="..." onBack={...} actions={...} />
 *       <SplitView.DetailBody>{content}</SplitView.DetailBody>
 *       <SplitView.DetailFooter savedAt="...">actions</SplitView.DetailFooter>
 *     </SplitView.Detail>
 *   </SplitView>
 */

"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { Kbd } from "@/platform/ui/kbd";
import { cn } from "@/platform/utils/cn";

interface SplitViewContextValue {
  open: boolean;
  width: number;
  setWidth: (w: number) => void;
  onOpenChange: (open: boolean) => void;
}

const SplitViewContext = React.createContext<SplitViewContextValue | null>(null);

function useSplitViewContext(): SplitViewContextValue {
  const ctx = React.useContext(SplitViewContext);
  if (!ctx) {
    throw new Error("SplitView.* must be used within <SplitView>");
  }
  return ctx;
}

const MIN_WIDTH = 360;
const MAX_WIDTH = 640;
const DEFAULT_WIDTH = 480;

export interface SplitViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultWidth?: number;
  children: React.ReactNode;
  className?: string;
}

function SplitViewRoot({
  open,
  onOpenChange,
  defaultWidth = DEFAULT_WIDTH,
  children,
  className,
}: SplitViewProps) {
  const [width, setWidth] = React.useState(defaultWidth);

  // Esc para cerrar.
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const ctx = React.useMemo<SplitViewContextValue>(
    () => ({ open, width, setWidth, onOpenChange }),
    [open, width, onOpenChange]
  );

  return (
    <SplitViewContext.Provider value={ctx}>
      <div
        className={cn(
          "flex h-full w-full",
          "transition-[grid-template-columns] duration-[var(--motion-base)] ease-erp",
          className
        )}
      >
        {children}
      </div>
    </SplitViewContext.Provider>
  );
}

function SplitViewList({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, width } = useSplitViewContext();
  return (
    <div
      className={cn(
        "min-w-0 flex-1 transition-[max-width] duration-[var(--motion-base)] ease-erp",
        className
      )}
      style={open ? { maxWidth: `calc(100% - ${width}px)` } : undefined}
    >
      {children}
    </div>
  );
}

function SplitViewDetail({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { open, width, setWidth, onOpenChange } = useSplitViewContext();
  const isResizingRef = React.useRef(false);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    const startX = e.clientX;
    const startWidth = width;
    const onMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const delta = startX - ev.clientX;
      const next = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, startWidth + delta));
      setWidth(next);
    };
    const onUp = () => {
      isResizingRef.current = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <aside
      aria-hidden={!open}
      className={cn(
        "relative shrink-0 h-full",
        "border-l border-line bg-bg-elevated-1",
        "transition-[width,opacity] duration-[var(--motion-base)] ease-erp",
        "flex flex-col",
        open ? "opacity-100" : "opacity-0 pointer-events-none w-0",
        className
      )}
      style={{ width: open ? `${width}px` : 0 }}
    >
      <div className="flex-1 min-w-0 h-full overflow-hidden">{children}</div>
      {/* === Resize handle === */}
      {open && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionar panel"
          onMouseDown={onMouseDown}
          className={cn(
            "absolute top-0 bottom-0 w-1.5 -translate-x-1/2 cursor-col-resize",
            "hover:bg-primary/20 transition-colors",
            "z-10"
          )}
          style={{ left: 0 }}
        />
      )}
    </aside>
  );
}

interface DetailHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

function SplitViewDetailHeader({
  title,
  subtitle,
  onBack,
  actions,
  className,
}: DetailHeaderProps) {
  const { onOpenChange } = useSplitViewContext();
  return (
    <header
      className={cn(
        "sticky top-0 z-10",
        "flex items-center justify-between gap-3",
        "h-14 px-5",
        "border-b border-line",
        "bg-bg-elevated-1",
        className
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          type="button"
          onClick={onBack ?? (() => onOpenChange(false))}
          aria-label="Volver"
          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-ink-soft hover:text-ink hover:bg-accent transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-[14px] font-semibold text-ink truncate">
            {title}
          </h2>
          {subtitle && (
            <div className="text-[11px] text-ink-muted truncate font-mono">
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-1 shrink-0">{actions}</div>}
    </header>
  );
}

function SplitViewDetailBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-5", className)}>
      {children}
    </div>
  );
}

interface DetailFooterProps {
  children?: React.ReactNode;
  className?: string;
  /** Indicador de auto-save ("Saved · 2s ago"). */
  savedAt?: string;
}

function SplitViewDetailFooter({
  children,
  className,
  savedAt,
}: DetailFooterProps) {
  return (
    <footer
      className={cn(
        "sticky bottom-0 z-10",
        "flex items-center justify-between gap-3",
        "h-12 px-5",
        "border-t border-line",
        "bg-bg-elevated-1",
        className
      )}
    >
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {children}
      </div>
      {savedAt && (
        <span className="font-mono text-[10px] text-ink-muted shrink-0 inline-flex items-center gap-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full bg-state-success"
            aria-hidden
          />
          {savedAt}
        </span>
      )}
      <Kbd combo="Escape" variant="subtle" className="ml-1" />
    </footer>
  );
}

// === Compound component via Object.assign (TypeScript-friendly) ===
export const SplitView = Object.assign(SplitViewRoot, {
  List: SplitViewList,
  Detail: SplitViewDetail,
  DetailHeader: SplitViewDetailHeader,
  DetailBody: SplitViewDetailBody,
  DetailFooter: SplitViewDetailFooter,
});
