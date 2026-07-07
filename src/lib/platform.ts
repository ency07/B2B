/**
 * Platform detection (OS-aware shortcuts, command bar, kbd chips).
 *
 * El blueprint exige que todos los chips y labels de atajos se rendericen
 * segun el OS del usuario: ⌘K en macOS, Ctrl K en Windows/Linux.
 *
 * Implementacion client-side con fallback a "Ctrl" en SSR (evita flash
 * y no requiere roundtrip al servidor).
 */

"use client";

import * as React from "react";

export type Platform = "mac" | "windows" | "linux" | "other";

export interface PlatformInfo {
  /** Plataforma detectada. */
  platform: Platform;
  /** Modificador primario ("meta" en mac = Cmd, "ctrl" en otros). */
  modifier: "meta" | "ctrl";
  /** Simbolo del modificador para mostrar al usuario. */
  modifierSymbol: "⌘" | "Ctrl";
  /** Texto del modificador para labels accesibles. */
  modifierLabel: "⌘" | "Ctrl";
  /** Helper para formatear un atajo: shortcut("K") => "⌘K" / "Ctrl K". */
  format: (key: string) => string;
}

function detectPlatform(): Platform {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return "other";
  }
  const ua = navigator.userAgent || "";
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } })
      .userAgentData?.platform || (navigator as { platform?: string }).platform || "";
  const p = (platform || ua).toLowerCase();
  if (p.includes("mac") || p.includes("iphone") || p.includes("ipad")) return "mac";
  if (p.includes("linux") || p.includes("ubuntu") || p.includes("debian")) return "linux";
  if (p.includes("win")) return "windows";
  return "other";
}

function buildPlatformInfo(platform: Platform): PlatformInfo {
  const isMac = platform === "mac";
  const modifier: "meta" | "ctrl" = isMac ? "meta" : "ctrl";
  const modifierSymbol: "⌘" | "Ctrl" = isMac ? "⌘" : "Ctrl";
  const modifierLabel: "⌘" | "Ctrl" = isMac ? "⌘" : "Ctrl";

  const format = (key: string): string => {
    const trimmed = key.trim();
    if (!trimmed) return "";
    // Atajos especiales que ya incluyen el simbolo o son una sola letra
    if (trimmed.length === 1) {
      return `${modifierSymbol}${trimmed.toUpperCase()}`;
    }
    // Atajos compuestos: "Shift+K" => "⇧K", "Mod+K" => "⌘K / Ctrl K"
    if (trimmed.includes("+")) {
      return trimmed
        .split("+")
        .map((part) => {
          const p = part.trim();
          if (/^mod$/i.test(p)) return modifierSymbol;
          if (/^cmd|command|meta$/i.test(p)) return modifierSymbol;
          if (/^ctrl|control$/i.test(p)) return "Ctrl";
          if (/^shift$/i.test(p)) return "⇧";
          if (/^alt|option$/i.test(p)) return isMac ? "⌥" : "Alt";
          if (/^enter$/i.test(p)) return "↩";
          if (/^esc$/i.test(p)) return "esc";
          if (p.length === 1) return p.toUpperCase();
          return p;
        })
        .join(isMac ? "" : " ");
    }
    return `${modifierSymbol}${trimmed}`;
  };

  return { platform, modifier, modifierSymbol, modifierLabel, format };
}

/**
 * Hook que detecta el OS del cliente. Devuelve un default SSR-safe
 * (Ctrl) en el primer render para evitar hydration mismatch; actualiza
 * al valor real en el segundo render via useEffect.
 */
export function usePlatform(): PlatformInfo {
  const [info, setInfo] = React.useState<PlatformInfo>(() =>
    buildPlatformInfo("other")
  );

  React.useEffect(() => {
    setInfo(buildPlatformInfo(detectPlatform()));
  }, []);

  return info;
}

/**
 * Helper para detectar si un evento de teclado coincide con un atajo
 * OS-aware. Ej: matchesShortcut(e, "K") => true si Cmd+K en Mac o Ctrl+K en otros.
 */
export function matchesShortcut(
  event: KeyboardEvent | React.KeyboardEvent,
  key: string,
  info: PlatformInfo
): boolean {
  const k = (event.key || "").toLowerCase();
  const targetKey = key.toLowerCase();
  if (k !== targetKey) return false;
  if (info.modifier === "meta") {
    return event.metaKey && !event.ctrlKey;
  }
  return event.ctrlKey && !event.metaKey;
}
