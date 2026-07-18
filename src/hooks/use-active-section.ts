"use client";

import * as React from "react";

/**
 * Scroll-spy: retorna el id de la sección de `sectionIds` que está
 * actualmente en el viewport (según IntersectionObserver). Antes esta
 * lógica estaba duplicada casi al carácter en TopBar y FloatingCta —
 * ambos consumidores pueden seguir pasando su propia lista de ids (no
 * necesariamente la misma), solo comparten el mecanismo del observer.
 */
export function useActiveSection(sectionIds: string[]): string {
  const [activeSection, setActiveSection] = React.useState<string>(sectionIds[0] ?? "");
  const idsKey = sectionIds.join(",");

  React.useEffect(() => {
    const ids = idsKey.split(",").filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      {
        rootMargin: "-30% 0px -60% 0px",
        threshold: 0,
      }
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [idsKey]);

  return activeSection;
}
