/**
 * Kbd — chip de teclado OS-aware.
 *
 * Renderiza un atajo con el modificador correcto segun el OS del
 * usuario. En macOS muestra "⌘K"; en Windows/Linux muestra "Ctrl K".
 *
 * Variantes:
 *  - default: chip neutral (sobre bg.canvas)
 *  - onAccent: chip claro (sobre botones primarios con accent)
 *  - subtle: chip minimo (en footer de command bar)
 *
 * Uso:
 *   <Kbd combo="K" />                        => "⌘K" o "Ctrl K"
 *   <Kbd combo="Shift+K" />                  => "⇧K"
 *   <Kbd combo="Enter" />                    => "↩"
 */

"use client";

import * as React from "react";
import { usePlatform } from "@/lib/platform";
import { cn } from "@/platform/utils/cn";

type KbdVariant = "default" | "onAccent" | "subtle";
type KbdSize = "sm" | "md";

export interface KbdProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Combinacion: "K", "Shift+K", "Enter", "ArrowUp", "Mod+K". */
  combo: string;
  variant?: KbdVariant;
  size?: KbdSize;
}

const baseClasses =
  "inline-flex items-center justify-center font-mono font-medium rounded select-none whitespace-nowrap border";

const variantClasses: Record<KbdVariant, string> = {
  default:
    "bg-bg-elevated-1 text-ink-soft border-line shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.04)]",
  onAccent:
    "bg-white/15 text-white border-white/20 backdrop-blur-sm shadow-[inset_0_-1px_0_0_rgba(255,255,255,0.1)]",
  subtle:
    "bg-transparent text-ink-muted border-transparent",
};

const sizeClasses: Record<KbdSize, string> = {
  sm: "h-5 min-w-5 px-1.5 text-[10px]",
  md: "h-6 min-w-6 px-2 text-[11px]",
};

/**
 * Convierte un combo canonico a un array de segmentos para renderizar
 * cada tecla por separado (mejor legibilidad que "⌘⇧K" en chip pequeno).
 */
function splitCombo(combo: string): string[] {
  if (!combo) return [];
  if (combo.includes("+")) {
    return combo.split("+").map((p) => p.trim());
  }
  return [combo];
}

const KEY_LABELS: Record<string, string> = {
  mod: "",
  cmd: "",
  command: "",
  meta: "",
  ctrl: "Ctrl",
  control: "Ctrl",
  shift: "⇧",
  alt: "Alt",
  option: "⌥",
  enter: "↩",
  return: "↩",
  esc: "esc",
  escape: "esc",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  tab: "⇥",
  space: "Space",
  backspace: "⌫",
  delete: "Del",
};

export function Kbd({
  combo,
  variant = "default",
  size = "sm",
  className,
  ...rest
}: KbdProps) {
  const platform = usePlatform();
  const segments = splitCombo(combo);

  const renderSegment = (seg: string, idx: number): React.ReactNode => {
    const lower = seg.toLowerCase();
    const isMod = ["mod", "cmd", "command", "meta", "ctrl", "control"].includes(
      lower
    );

    if (isMod) {
      // Solo el primer modificador se renderiza con el simbolo OS-aware;
      // los demas se renderizan con su nombre canonico.
      if (idx === 0 && lower === "mod") {
        return (
          <span key={idx} className="px-0.5">
            {platform.modifierSymbol}
          </span>
        );
      }
      if (lower === "ctrl" || lower === "control") {
        return (
          <span key={idx} className="px-0.5">
            Ctrl
          </span>
        );
      }
      if (lower === "cmd" || lower === "command" || lower === "meta") {
        return (
          <span key={idx} className="px-0.5">
            {platform.modifierSymbol}
          </span>
        );
      }
    }

    const label = KEY_LABELS[lower] ?? (seg.length === 1 ? seg.toUpperCase() : seg);
    return (
      <span key={idx} className="px-0.5">
        {label}
      </span>
    );
  };

  return (
    <span
      role="img"
      aria-label={`Atajo de teclado ${combo}`}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {segments.map((seg, idx) => renderSegment(seg, idx))}
    </span>
  );
}
