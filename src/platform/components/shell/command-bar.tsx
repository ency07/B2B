/**
 * CommandBar — primitive OS-aware.
 *
 * Modal centrado (max-w 640px) con busqueda fuzzy, resultados
 * agrupados por entidad, navegacion por teclado (↑↓, ↩, esc) y
 * footer con atajos OS-aware.
 *
 * La Ola 0 entrega el primitive visual + accesibilidad. La conexion
 * con datos (indice Fuse.js, fuzzy search sobre Supabase) se hara
 * en Ola 1+.
 *
 * Uso:
 *   <CommandBar
 *     open={open}
 *     onOpenChange={setOpen}
 *     placeholder="Buscar clientes, facturas, productos…"
 *     groups={[
 *       { id: "clientes", label: "Clientes", items: [...] },
 *       { id: "facturas", label: "Facturas", items: [...] },
 *     ]}
 *   />
 */

"use client";

import * as React from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/platform/ui/dialog";
import { Kbd } from "@/platform/ui/kbd";
import { cn } from "@/platform/utils/cn";

export interface CommandBarItem {
  id: string;
  /** Icono Lucide (componente). */
  icon?: React.ComponentType<any>;
  /** Titulo principal. */
  title: string;
  /** Subtitulo mono muted. */
  subtitle?: string;
  /** Atajo OS-aware opcional para mostrar en la derecha. */
  shortcut?: string;
  /** Accion al ejecutar (Enter o click). */
  onSelect: () => void;
  /** Si el item esta deshabilitado. */
  disabled?: boolean;
}

export interface CommandBarGroup {
  id: string;
  /** Header uppercase mono del grupo. */
  label: string;
  items: CommandBarItem[];
}

export interface CommandBarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  placeholder?: string;
  /** Si se proporciona, la busqueda filtra (simple substring, no fuzzy todavia). */
  groups: CommandBarGroup[];
  /** Label para el input (para accesibilidad). */
  inputLabel?: string;
}

const MAX_HEIGHT = "min(420px, 60vh)";

/**
 * Filtro simple case-insensitive sobre title + subtitle.
 * Ola 1+ lo reemplaza por Fuse.js con indice precargado.
 */
function filterGroups(
  groups: CommandBarGroup[],
  query: string
): CommandBarGroup[] {
  if (!query.trim()) return groups;
  const q = query.toLowerCase();
  return groups
    .map((g) => ({
      ...g,
      items: g.items.filter(
        (it) =>
          it.title.toLowerCase().includes(q) ||
          (it.subtitle?.toLowerCase().includes(q) ?? false)
      ),
    }))
    .filter((g) => g.items.length > 0);
}

export function CommandBar({
  open,
  onOpenChange,
  placeholder = "Buscar clientes, facturas, productos o acciones…",
  groups,
  inputLabel = "Busqueda global",
}: CommandBarProps) {
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Resetear estado al abrir/cerrar.
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Foco al input al abrir (Radix ya maneja focus-trap).
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const filtered = React.useMemo(() => filterGroups(groups, query), [groups, query]);

  // Aplanar para navegacion lineal.
  const flat = React.useMemo(
    () => filtered.flatMap((g) => g.items),
    [filtered]
  );

  // Mantener activeIndex dentro de rango.
  React.useEffect(() => {
    if (activeIndex >= flat.length) {
      setActiveIndex(Math.max(0, flat.length - 1));
    }
  }, [activeIndex, flat.length]);

  // Scroll automatico al item activo.
  React.useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(
      `[data-cb-index="${activeIndex}"]`
    );
    if (el) {
      el.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(flat.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[activeIndex];
      if (item && !item.disabled) {
        item.onSelect();
        onOpenChange(false);
      }
    }
  };

  let runningIndex = 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-[640px] gap-0 p-0 overflow-hidden",
          "rounded-2xl border border-border bg-elevated",
          "depth-3"
        )}
        aria-describedby="command-bar-description"
      >
        <DialogTitle className="sr-only">{inputLabel}</DialogTitle>
        <DialogDescription id="command-bar-description" className="sr-only">
          Busca clientes, facturas, productos, ordenes o acciones. Usa las
          flechas para navegar y Enter para abrir.
        </DialogDescription>

        {/* === Input === */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-line">
          <Search
            className="h-5 w-5 text-ink-muted shrink-0"
            strokeWidth={1.5}
            aria-hidden
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label={inputLabel}
            className={cn(
              "flex-1 bg-transparent border-0 outline-none",
              "text-[18px] leading-6 text-ink placeholder:text-ink-muted"
            )}
          />
          <Kbd combo="Escape" variant="subtle" />
        </div>

        {/* === Resultados === */}
        <div
          ref={listRef}
          className="overflow-y-auto py-2"
          style={{ maxHeight: MAX_HEIGHT }}
        >
          {flat.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <p className="text-sm text-ink-soft">
                No encontramos resultados para{" "}
                <span className="font-mono text-ink">
                  &ldquo;{query}&rdquo;
                </span>
                .
              </p>
              <p className="text-xs text-ink-muted mt-2">
                Proba con otro termino o revisa la ortografia.
              </p>
            </div>
          ) : (
            filtered.map((group) => (
              <div key={group.id} className="py-1">
                <div className="px-5 py-2 text-[10px] font-mono uppercase tracking-widest text-ink-muted">
                  {group.label}
                </div>
                <ul role="listbox">
                  {group.items.map((item) => {
                    const idx = runningIndex++;
                    const Icon = item.icon;
                    const isActive = idx === activeIndex;
                    return (
                      <li
                        key={item.id}
                        data-cb-index={idx}
                        role="option"
                        aria-selected={isActive}
                      >
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => {
                            if (!item.disabled) {
                              item.onSelect();
                              onOpenChange(false);
                            }
                          }}
                          disabled={item.disabled}
                          className={cn(
                            "w-full flex items-center gap-3 px-5 py-2.5 text-left",
                            "transition-colors duration-[var(--motion-instant)] ease-erp",
                            isActive
                              ? "bg-accent text-ink"
                              : "text-ink-soft hover:bg-accent/40",
                            item.disabled && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {Icon && (
                            <Icon
                              className="h-4 w-4 shrink-0"
                              strokeWidth={1.5}
                              aria-hidden
                            />
                          )}
                          <span className="flex-1 min-w-0">
                            <span className="block text-[14px] font-semibold truncate">
                              {item.title}
                            </span>
                            {item.subtitle && (
                              <span className="block text-[11px] font-mono text-ink-muted truncate mt-0.5">
                                {item.subtitle}
                              </span>
                            )}
                          </span>
                          {item.shortcut && (
                            <Kbd combo={item.shortcut} variant="subtle" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        {/* === Footer con atajos === */}
        <div className="flex items-center justify-between gap-2 px-5 h-10 border-t border-line bg-paper-warm text-[11px] text-ink-muted">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Kbd combo="ArrowUp" variant="subtle" />
              <Kbd combo="ArrowDown" variant="subtle" />
              navegar
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd combo="Enter" variant="subtle" />
              abrir
            </span>
          </div>
          <span className="inline-flex items-center gap-1">
            <Kbd combo="Mod+K" variant="subtle" />
            buscador
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
