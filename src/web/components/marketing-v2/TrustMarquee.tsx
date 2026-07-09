"use client";

import * as React from "react";

const CLIENTS = [
  "Paz del Río",
  "Nutresa",
  "Ecopetrol",
  "Cementos Argos",
  "Cerro Matoso",
  "Bavaria",
  "Postobón",
  "Terpel",
  "ISA",
  "Drummond",
  "Propal",
  "Colombina",
  "Manuelita",
  "Carvajal",
].map((name) => ({ name, logoUrl: "" }));

interface TrustClient {
  name: string;
  logoUrl?: string;
}

interface TrustMarqueeProps {
  content?: { eyebrow: string; statLine: string; clients: TrustClient[] };
}

export function TrustMarquee({ content }: TrustMarqueeProps = {}) {
  const clients = content?.clients?.length ? content.clients : CLIENTS;
  const eyebrow = content?.eyebrow || "Empresas que confían en nuestra ingeniería";
  const statLine = content?.statLine || "22 años · +310 operaciones completadas";
  const items = React.useMemo(() => [...clients, ...clients], [clients]);

  return (
    <section
      id="confianza"
      className="relative w-full bg-[var(--ds-c-marketing-trust-marquee-background)] border-y border-line section-py-bleed overflow-hidden"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <p className="editorial-eyebrow">
            {eyebrow}
          </p>
          <p className="editorial-mono">
            {statLine}
          </p>
        </div>
      </div>

      <div className="relative h-16">
        <div className="absolute left-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-r from-[var(--surface-background)] to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 z-10 bg-gradient-to-l from-[var(--surface-background)] to-transparent pointer-events-none" />

        <div className="marquee-track h-full flex items-center">
          {items.map((client, idx) => (
            <div
              key={`${client.name}-${idx}`}
              className="flex items-center gap-16 shrink-0 px-8"
            >
              {client.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- logos vienen de dominios arbitrarios subidos por cada tenant white-label
                <img
                  src={client.logoUrl}
                  alt={client.name}
                  loading="lazy"
                  className="h-8 w-auto max-w-[140px] object-contain grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300 select-none"
                />
              ) : (
                <span className="font-display text-xl sm:text-2xl text-ink-soft font-light tracking-[-0.01em] whitespace-nowrap select-none">
                  {client.name}
                </span>
              )}
              <span
                className="w-1.5 h-1.5 rounded-full bg-ink-muted/40 shrink-0"
                aria-hidden
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
