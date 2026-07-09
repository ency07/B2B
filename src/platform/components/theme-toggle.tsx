"use client";

import * as React from "react";
import { Sun, Moon } from "lucide-react";
import { useDesignSystem } from "@/design-system";

export function ThemeToggle() {
  const { theme, setMode } = useDesignSystem();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-lg bg-[var(--ds-c-skeleton-background)] animate-pulse shrink-0" />;
  }

  const isDark = theme.mode === "dark";

  return (
    <button
      onClick={() => setMode(isDark ? "light" : "dark")}
      className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--ds-c-button-outline-border)] bg-[var(--ds-c-card-background)] text-[var(--ds-c-card-foreground)] transition-all hover:bg-[var(--ds-c-button-ghost-hover-background)] hover:text-[var(--ds-c-button-ghost-foreground)] cursor-pointer shrink-0"
      aria-label="Alternar tema de color"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
