"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ROUTES } from "@/lib/routes";
import type { BrandingConfig } from "@/platform/branding/branding-defaults";

interface FooterProps {
  siteName: string;
  tenantCode?: string;
  branding: BrandingConfig;
}

const STATIC_NAV_GROUPS = [
  {
    title: "Capacidades",
    links: [
      { label: "Equipos OEM", href: "#capacidades" },
      { label: "Disciplinas", href: "#disciplinas" },
      { label: "Sectores", href: "#sectores" },
      { label: "Proceso", href: "#proceso" },
    ],
  },
  {
    title: "Servicios",
    links: [
      { label: "Balanceo estático", href: "#capacidades" },
      { label: "Mediciones aerodinámicas", href: "#capacidades" },
      { label: "Fabricación", href: "#capacidades" },
      { label: "Sistemas hongo", href: "#capacidades" },
    ],
  },
];

const OFFICES = [
  { city: "Bogotá", country: "CO", address: "Cra. 7 #71-21", detail: "Sede principal" },
  { city: "Alicante", country: "ES", address: "—", detail: "Operaciones UE" },
];

export function Footer({ siteName, tenantCode, branding }: FooterProps) {
  const year = new Date().getFullYear();
  const tc = tenantCode || "";
  const portalHref = tc ? `${ROUTES.PORTAL}?tenant=${tc}` : ROUTES.PORTAL;
  const wizardHref = tc ? `/wizard?tenant=${tc}` : "/wizard";

  const NAV_GROUPS = [
    ...STATIC_NAV_GROUPS,
    {
      title: "Empresa",
      links: [
        { label: "Casos de éxito", href: "#casos" },
        { label: "Calculadora CFM", href: "#calculadora" },
        { label: "Portal cliente", href: portalHref },
        { label: "Cotizador", href: wizardHref },
      ],
    },
  ];

  return (
    <footer className="relative w-full bg-[var(--ds-c-marketing-footer-background)] text-paper overflow-hidden">
      {/* === HERO CTA STRIP (cierre memorable) === */}
      <div className="border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 py-24 lg:py-32">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8 }}
            className="font-mono text-[11px] tracking-widest text-white/50 uppercase mb-8"
          >
            — Empezar ahora
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[clamp(56px,10vw,160px)] font-light text-paper tracking-[-0.04em] leading-[0.95] max-w-5xl"
          >
            El aire
            <br />
            <span className="italic text-white/70">no espera.</span>
          </motion.h2>

          <div className="mt-12 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <a
              href={wizardHref}
              className="group inline-flex items-center justify-center gap-3 h-16 px-10 bg-paper text-ink text-base font-medium tracking-tight rounded-sm hover:bg-white/90 transition-colors"
            >
              <span>Iniciar Cotización Industrial</span>
              <ArrowUpRight
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                strokeWidth={1.5}
              />
            </a>
            <a
              href="tel:+5712345678"
              className="inline-flex items-center justify-center gap-3 h-16 px-10 bg-transparent text-paper text-base font-medium tracking-tight rounded-sm border border-white/30 hover:bg-white/10 transition-colors"
            >
              <span>+57 (1) 234 5678</span>
            </a>
          </div>
        </div>
      </div>

      {/* === MAIN GRID === */}
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 py-20 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 mb-20">
          {/* Brand + oficinas */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-9 h-9 rounded-sm bg-paper text-ink flex items-center justify-center font-display text-base font-medium">
                A
              </span>
              <span className="font-display text-2xl font-light tracking-[-0.02em]">
                {siteName}
              </span>
            </div>
            <p className="text-lg leading-[1.6] text-white/70 font-sans max-w-md mb-12">
              Veintidós años diseñando, simulando y ejecutando sistemas de
              ventilación industrial en LATAM.
            </p>

            <p className="font-mono text-[10px] tracking-widest text-white/50 uppercase mb-4">
              Sedes
            </p>
            <div className="space-y-4">
              {OFFICES.map((o) => (
                <div
                  key={o.city}
                  className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 items-baseline"
                >
                  <span className="font-mono text-[10px] tracking-widest text-white/40 uppercase w-6">
                    {o.country}
                  </span>
                  <span className="font-display text-base text-paper font-light">
                    {o.city}
                    <span className="text-white/40 ml-2 text-sm font-sans font-light">
                      {o.detail}
                    </span>
                  </span>
                  <span className="col-start-2 font-mono text-xs text-white/50 mt-0.5">
                    {o.address}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Nav columns */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-10 reveal-stagger">
            {NAV_GROUPS.map((g) => (
              <div key={g.title}>
                <p className="font-mono text-[10px] tracking-widest text-white/50 uppercase mb-6">
                  {g.title}
                </p>
                <ul className="space-y-3.5">
                  {g.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        className="group link-reveal inline-flex items-center gap-1.5 text-sm text-white/85 hover:text-paper transition-colors font-sans"
                      >
                        <span>{l.label}</span>
                        <ArrowUpRight
                          className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200"
                          strokeWidth={1.5}
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* === Manifesto / Stat strip === */}
        <div className="border-t border-white/10 pt-10 mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/10 reveal-stagger">
            <div className="bg-[var(--ds-c-marketing-footer-stat-background)] p-6">
              <p className="font-display text-3xl lg:text-4xl font-light tracking-[-0.03em] text-paper tabular-nums">
                22
              </p>
              <p className="font-mono text-[10px] tracking-widest text-white/50 uppercase mt-2">
                Años operando
              </p>
            </div>
            <div className="bg-[var(--ds-c-marketing-footer-stat-background)] p-6">
              <p className="font-display text-3xl lg:text-4xl font-light tracking-[-0.03em] text-paper tabular-nums">
                312
              </p>
              <p className="font-mono text-[10px] tracking-widest text-white/50 uppercase mt-2">
                Plantas activas
              </p>
            </div>
            <div className="bg-[var(--ds-c-marketing-footer-stat-background)] p-6">
              <p className="font-display text-3xl lg:text-4xl font-light tracking-[-0.03em] text-paper tabular-nums">
                3.8M
              </p>
              <p className="font-mono text-[10px] tracking-widest text-white/50 uppercase mt-2">
                CFM instalados
              </p>
            </div>
            <div className="bg-[var(--ds-c-marketing-footer-stat-background)] p-6">
              <p className="font-display text-3xl lg:text-4xl font-light tracking-[-0.03em] text-[var(--ds-c-marketing-footer-stat-accent)] tabular-nums">
                0
              </p>
              <p className="font-mono text-[10px] tracking-widest text-white/50 uppercase mt-2">
                Paradas no planificadas
              </p>
            </div>
          </div>
        </div>

        {/* === BOTTOM BAR === */}
        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-mono text-[10px] tracking-widest text-white/40 uppercase">
            {branding.copyright_footer || `© ${year} · ${siteName} · Todos los derechos reservados`}
          </p>
          <div className="flex items-center gap-5">
            {[
              { label: "Términos",   href: "/terminos" },
              { label: "Privacidad", href: "/privacidad" },
              { label: "Cookies",    href: "/cookies" },
              { label: "RETIE",      href: "/retie" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="font-mono text-[10px] tracking-widest text-white/40 hover:text-white uppercase transition-colors link-reveal"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* === STATUS BAR (final strip tipo Linear) === */}
      <div className="border-t border-white/10">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 h-10 flex items-center justify-between text-[10px] text-white/40 font-mono tracking-widest uppercase">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--ds-c-marketing-footer-stat-accent)] animate-pulse" />
            <span>Sistema operativo</span>
          </div>
          <div className="hidden sm:flex items-center gap-6">
            <span>{branding.nombre_erp || "Sistema B2B"} {branding.version_sistema || "v1.0.0"}</span>
            <span>Bogotá · 4.7110° N</span>
            <a
              href={ROUTES.LOGIN}
              className="hover:text-white/70 transition-colors"
              title="Acceso personal interno"
            >
              Área interna ↗
            </a>
          </div>
          <span>© 2009 — {year}</span>
        </div>
      </div>
    </footer>
  );
}
