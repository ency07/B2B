/**
 * Popover — primitive minimalista.
 *
 * Construido sobre @radix-ui/react-dismissable-layer (click-outside +
 * escape). Usa posicionamiento manual con getBoundingClientRect para
 * evitar la dependencia de @radix-ui/react-popper (cuyo API no
 * expone usePopper en esta version instalada).
 *
 * Para dropdowns pequenos (FilterBar, menus) es suficiente. Para
 * popovers grandes o que requieren evitar colisiones, se debe
 * reemplazar por Floating UI o Radix Popover.
 *
 * Uso:
 *   <Popover
 *     trigger={<button>Filtrar</button>}
 *     align="start"
 *     contentClassName="w-64 p-3"
 *   >
 *     contenido
 *   </Popover>
 */

"use client";

import * as React from "react";
import { DismissableLayer } from "@radix-ui/react-dismissable-layer";
import { cn } from "@/platform/utils/cn";

type Placement = "top" | "right" | "bottom" | "left";
type Alignment = "start" | "center" | "end";

export interface PopoverProps {
  trigger: React.ReactElement;
  children: React.ReactNode;
  align?: Alignment;
  side?: Placement;
  /** Distancia entre trigger y popover en px. */
  sideOffset?: number;
  /** Estado controlado. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  contentClassName?: string;
}

interface Position {
  top: number;
  left: number;
  transformOrigin: string;
}

function computePosition(
  triggerRect: DOMRect,
  popoverWidth: number,
  popoverHeight: number,
  side: Placement,
  align: Alignment,
  sideOffset: number
): Position {
  const margin = 8;
  let top = 0;
  let left = 0;
  let transformOrigin = "";

  // Posicionar segun side
  switch (side) {
    case "bottom":
      top = triggerRect.bottom + sideOffset;
      transformOrigin = "top";
      break;
    case "top":
      top = triggerRect.top - popoverHeight - sideOffset;
      transformOrigin = "bottom";
      break;
    case "right":
      left = triggerRect.right + sideOffset;
      transformOrigin = "left";
      break;
    case "left":
      left = triggerRect.left - popoverWidth - sideOffset;
      transformOrigin = "right";
      break;
  }

  // Alinear segun align
  switch (align) {
    case "start":
      if (side === "top" || side === "bottom") {
        left = triggerRect.left;
      } else {
        top = triggerRect.top;
      }
      break;
    case "center":
      if (side === "top" || side === "bottom") {
        left = triggerRect.left + triggerRect.width / 2 - popoverWidth / 2;
      } else {
        top = triggerRect.top + triggerRect.height / 2 - popoverHeight / 2;
      }
      break;
    case "end":
      if (side === "top" || side === "bottom") {
        left = triggerRect.right - popoverWidth;
      } else {
        top = triggerRect.bottom - popoverHeight;
      }
      break;
  }

  // Clamp para mantener en pantalla
  const maxLeft = window.innerWidth - popoverWidth - margin;
  const maxTop = window.innerHeight - popoverHeight - margin;
  left = Math.max(margin, Math.min(left, maxLeft));
  top = Math.max(margin, Math.min(top, maxTop));

  return { top, left, transformOrigin };
}

export function Popover({
  trigger,
  children,
  align = "start",
  side = "bottom",
  sideOffset = 6,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  contentClassName,
}: PopoverProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange]
  );

  const triggerRef = React.useRef<HTMLElement | null>(null);
  const popoverRef = React.useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = React.useState<Position | null>(null);

  // Recalcular posicion al abrir o al redimensionar / scrollear.
  React.useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    const recalc = () => {
      if (!triggerRef.current || !popoverRef.current) return;
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const popRect = popoverRef.current.getBoundingClientRect();
      setPosition(
        computePosition(
          triggerRect,
          popRect.width,
          popRect.height,
          side,
          align,
          sideOffset
        )
      );
    };
    recalc();
    window.addEventListener("resize", recalc);
    window.addEventListener("scroll", recalc, true);
    return () => {
      window.removeEventListener("resize", recalc);
      window.removeEventListener("scroll", recalc, true);
    };
  }, [open, side, align, sideOffset]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    setOpen(!open);
    const original = (trigger.props as { onClick?: React.MouseEventHandler })
      .onClick;
    original?.(e);
  };

  const triggerEl = React.cloneElement(trigger, {
    ref: (node: HTMLElement | null) => {
      triggerRef.current = node;
    },
    onClick: handleTriggerClick,
    "aria-expanded": open,
    "aria-haspopup": "dialog",
  } as Record<string, unknown>);

  return (
    <>
      {triggerEl}
      {open && (
        <DismissableLayer
          onDismiss={() => setOpen(false)}
          onPointerDownOutside={(e) => {
            if (
              triggerRef.current &&
              e.target &&
              triggerRef.current.contains(e.target as Node)
            ) {
              e.preventDefault();
            }
          }}
        >
          <div
            ref={popoverRef}
            role="dialog"
            style={{
              position: "fixed",
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              transformOrigin: position?.transformOrigin,
              visibility: position ? "visible" : "hidden",
            }}
            className={cn(
              "z-layer-modal",
              "rounded-lg border border-[var(--ds-c-popover-border)] bg-[var(--ds-c-popover-background)] text-[var(--ds-c-popover-foreground)]",
              "shadow-lg",
              contentClassName
            )}
          >
            {children}
          </div>
        </DismissableLayer>
      )}
    </>
  );
}
