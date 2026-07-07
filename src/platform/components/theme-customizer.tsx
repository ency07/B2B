"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Check, Moon, Sun, Monitor, Palette } from "lucide-react";
import { cn } from "@/platform/utils/cn";
import { Popover } from "@/platform/ui/popover";
import { Button } from "@/platform/ui/button";

const PRESET_COLORS = [
  // Dark Themes from user
  { name: "Lemon Glow", value: "#FEEF4C", type: "dark" },
  { name: "Crayola Red", value: "#ED254E", type: "dark" },
  { name: "Pumpkin", value: "#FE7F2D", type: "dark" },
  // Light Themes proposed
  { name: "Ocean Blue", value: "#0077B6", type: "light" },
  { name: "Forest Green", value: "#2A9D8F", type: "light" },
  { name: "Royal Purple", value: "#6D28D9", type: "light" },
];

export function ThemeCustomizer({ storageKeyPrefix = "erp" }: { storageKeyPrefix?: "erp" | "portal" }) {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [activeColor, setActiveColor] = React.useState<string | null>(null);

  React.useEffect(() => {
    setMounted(true);
    const savedColor = localStorage.getItem(`${storageKeyPrefix}_color_preference`);
    if (savedColor) {
      setActiveColor(savedColor);
    }
  }, [storageKeyPrefix]);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-lg bg-secondary/50 animate-pulse shrink-0" />;
  }

  const handleColorSelect = (color: string) => {
    if (activeColor === color) {
      // Unselect (revert to tenant default)
      setActiveColor(null);
      localStorage.removeItem(`${storageKeyPrefix}_color_preference`);
    } else {
      setActiveColor(color);
      localStorage.setItem(`${storageKeyPrefix}_color_preference`, color);
    }
    // Force reload to apply layout CSS
    window.location.reload();
  };

  const trigger = (
    <Button variant="outline" size="icon" className="w-9 h-9 rounded-lg border-border bg-card hover:bg-accent shrink-0">
      <Palette className="w-4 h-4 text-foreground" />
      <span className="sr-only">Personalizar Tema</span>
    </Button>
  );

  return (
    <Popover trigger={trigger} align="end" contentClassName="w-64 p-4">
      <div className="space-y-4">
        
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Apariencia
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex flex-col items-center justify-center h-16 gap-1 border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
                theme === "light" && "border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
              )}
              onClick={() => setTheme("light")}
            >
              <Sun className="w-4 h-4" />
              <span className="text-[10px] font-medium">Claro</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex flex-col items-center justify-center h-16 gap-1 border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
                theme === "dark" && "border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
              )}
              onClick={() => setTheme("dark")}
            >
              <Moon className="w-4 h-4" />
              <span className="text-[10px] font-medium">Oscuro</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex flex-col items-center justify-center h-16 gap-1 border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
                theme === "system" && "border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary"
              )}
              onClick={() => setTheme("system")}
            >
              <Monitor className="w-4 h-4" />
              <span className="text-[10px] font-medium">Auto</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex justify-between items-center">
            <span>Color Principal</span>
            {activeColor && (
              <button 
                onClick={() => handleColorSelect(activeColor)} 
                className="text-[9px] text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                Restablecer
              </button>
            )}
          </h4>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleColorSelect(preset.value)}
                title={preset.name}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all cursor-pointer shadow-sm hover:scale-110",
                  activeColor === preset.value
                    ? "border-foreground ring-2 ring-foreground/20 ring-offset-1 ring-offset-background"
                    : "border-transparent"
                )}
                style={{ backgroundColor: preset.value }}
              >
                {activeColor === preset.value && (
                  <Check className="w-4 h-4 text-background mix-blend-difference" />
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </Popover>
  );
}
