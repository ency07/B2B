/**
 * useCommandBarHotkey — hook que escucha ⌘K (o Ctrl K) globalmente.
 *
 * Uso:
 *   const [open, setOpen] = useCommandBarHotkey();
 *   ...
 *   <CommandBar open={open} onOpenChange={setOpen} ... />
 *
 * El hook retorna [open, setOpen] para que el consumidor controle
 * el CommandBar (compatibilidad con control externo desde botones
 * que tambien quieran abrirlo).
 */

"use client";

import * as React from "react";
import { usePlatform, matchesShortcut } from "@/lib/platform";

export function useCommandBarHotkey(
  initialOpen = false
): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const [open, setOpen] = React.useState(initialOpen);
  const platform = usePlatform();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (matchesShortcut(e, "K", platform) || matchesShortcut(e, "k", platform)) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [platform, open]);

  return [open, setOpen];
}
