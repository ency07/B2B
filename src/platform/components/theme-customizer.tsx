"use client";

import * as React from "react";
import { Check, Moon, Sun, Monitor, Palette } from "lucide-react";
import { cn } from "@/platform/utils/cn";
import { Popover } from "@/platform/ui/popover";
import { Button } from "@/platform/ui/button";
import { useDesignSystem, themes } from "@/design-system";

const PRESET_COLORS = [
  { name: "Lemon Glow", value: "#FEEF4C", type: "dark" },
  { name: "Crayola Red", value: "#ED254E", type: "dark" },
  { name: "Pumpkin", value: "#FE7F2D", type: "dark" },
  { name: "Ocean Blue", value: "#0077B6", type: "light" },
  { name: "Forest Green", value: "#2A9D8F", type: "light" },
  { name: "Royal Purple", value: "#6D28D9", type: "light" },
];

export function ThemeCustomizer({ storageKeyPrefix = "erp" }: { storageKeyPrefix?: "erp" | "portal" }) {
  const { theme, setTheme, setMode } = useDesignSystem();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-lg bg-[var(--ds-c-skeleton-background)] animate-pulse shrink-0" />;
  }

  const trigger = (
    <Button variant="outline" size="icon" className="w-9 h-9 rounded-lg shrink-0">
      <Palette className="w-4 h-4 text-[var(--ds-c-icon-default)]" />
      <span className="sr-only">Personalizar Tema</span>
    </Button>
  );

  return (
    <Popover trigger={trigger} align="end" contentClassName="w-64 p-4">
      <div className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-[var(--ds-c-card-foreground)] uppercase tracking-wider">
            Apariencia
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {[
              { mode: "light" as const, icon: Sun, label: "Claro" },
              { mode: "dark" as const, icon: Moon, label: "Oscuro" },
            ].map(({ mode, icon: Icon, label }) => (
              <Button
                key={mode}
                variant="outline"
                size="sm"
                className={cn(
                  "flex flex-col items-center justify-center h-16 gap-1",
                  theme.mode === mode && "border-[var(--ds-c-action-primary)] bg-[color-mix(in srgb,var(--ds-c-action-primary)_10%,transparent)] text-[var(--ds-c-action-primary)]"
                )}
                onClick={() => setMode(mode)}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-medium">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-[var(--ds-c-border-default)]">
          <h4 className="text-xs font-semibold text-[var(--ds-c-card-foreground)] uppercase tracking-wider">
            Tema
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-xs text-left transition-colors cursor-pointer",
                  theme.id === t.id
                    ? "bg-[var(--ds-c-action-primary)] text-[var(--ds-c-text-inverse)]"
                    : "text-[var(--ds-c-card-foreground)] hover:bg-[var(--ds-c-surface-hover)]"
                )}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{
                  backgroundColor: t.id.includes('blue') ? '#3b82f6'
                    : t.id.includes('emerald') ? '#10b981'
                    : t.id.includes('purple') ? '#a855f7'
                    : t.id.includes('graphite') || t.id.includes('carbon') ? '#6b7280'
                    : '#f9fafb',
                  border: '1px solid rgba(128,128,128,0.3)'
                }} />
                <span className="truncate">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Popover>
  );
}
