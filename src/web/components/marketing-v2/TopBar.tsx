 
"use client";

import * as React from "react";
import Image from "next/image";
import { Menu, X, Command } from "lucide-react";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";

interface TopBarProps {
  siteName: string;
  logoUrl?: string;
  tenantCode: string;
}

const NAV_ITEMS = [
  { id: "capacidades", label: "Capacidades", path: "#capacidades", number: "01" },
  { id: "disciplinas", label: "Disciplinas", path: "#disciplinas", number: "02" },
  { id: "sectores", label: "Sectores", path: "#sectores", number: "03" },
  { id: "proceso", label: "Proceso", path: "#proceso", number: "04" },
  { id: "casos", label: "Casos", path: "#casos", number: "05" },
  { id: "calculadora", label: "Calculadora", path: "#calculadora", number: "06" },
];

export function TopBar({ siteName, logoUrl, tenantCode }: TopBarProps) {
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<string>("inicio");
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null);

  // Scroll spy con IntersectionObserver
  React.useEffect(() => {
    const sections = [
      { id: "inicio", path: "#inicio" },
      ...NAV_ITEMS,
    ];

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

    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Progress bar (scroll progress)
  const { scrollYProgress } = useScroll();
  const progressWidth = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const go = (path: string) => {
    if (path.startsWith("#")) {
      const el = document.querySelector(path);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.href = path;
    }
    setOpen(false);
  };

  // Determinar variante visual: transparente sobre hero oscuro vs. sólida sobre el resto
  const onHero = activeSection === "inicio" && !scrolled;

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-50
          transition-all duration-500 ease-cockpit
          ${
            onHero
              ? "bg-transparent"
              : scrolled
                ? "bg-paper/85 backdrop-blur-xl border-b border-line"
                : "bg-transparent border-b border-transparent"
          }
        `}
      >
        {/* === MAIN BAR === */}
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 h-20 flex items-center justify-between">
          {/* Logo con badge técnico al lado */}
          <button
            onClick={() => go("#inicio")}
            className="flex items-center gap-3 group"
            aria-label={siteName}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={siteName}
                width={120}
                height={28}
                className={`h-6 w-auto transition-all duration-500 ${
                  onHero ? "brightness-0 invert" : "brightness-0"
                }`}
              />
            ) : (
              <>
                {/* Logo mark: cuadrado con iniciales + wordmark */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`
                    relative w-9 h-9 flex items-center justify-center
                    font-display font-medium text-[15px] tracking-[-0.02em]
                    transition-colors duration-500
                    ${onHero
                      ? "bg-white text-ink"
                      : "bg-ink text-paper"
                    }
                  `}
                >
                  A
                  {/* Dot pulsante en la esquina */}
                  <span
                    className={`
                      absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full
                      bg-[var(--ds-c-marketing-top-bar-dot)]
                      animate-pulse
                    `}
                  />
                </motion.div>
                <div className="flex flex-col items-start leading-none">
                  <span
                    className={`
                      font-display text-[18px] font-normal tracking-[-0.02em] transition-colors duration-500
                      ${onHero ? "text-white" : "text-ink"}
                    `}
                  >
                    {siteName}
                  </span>
                  <span
                    className={`
                      font-mono text-[8px] tracking-[0.2em] uppercase mt-0.5 transition-colors duration-500
                      ${onHero ? "text-white/50" : "text-ink-muted"}
                    `}
                  >
                    Industrial OS
                  </span>
                </div>
              </>
            )}
          </button>

          {/* === CENTER NAV: con scroll-spy indicator === */}
          <nav className="hidden lg:flex items-center">
            {NAV_ITEMS.map((item, idx) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => go(item.path)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`
                    relative px-4 py-2 group
                    font-sans text-[13px] font-normal
                    transition-colors duration-300 hover-lift
                    ${isActive
                      ? onHero ? "text-white" : "text-ink"
                      : onHero ? "text-white/65 hover:text-white" : "text-ink-soft hover:text-ink"
                    }
                  `}
                >
                  <span className="flex items-baseline gap-1.5">
                    {/* Number que aparece en hover */}
                    <span
                      className={`
                        font-mono text-[9px] tracking-widest transition-all duration-300
                        ${hoveredIndex === idx || isActive
                          ? "opacity-100 translate-x-0"
                          : "opacity-0 -translate-x-1"
                        }
                        ${isActive ? "text-primary" : onHero ? "text-white/50" : "text-ink-muted"}
                      `}
                    >
                      {item.number}
                    </span>
                    <span>{item.label}</span>
                  </span>

                  {/* Underline indicator (active / hover) */}
                  <motion.span
                    layoutId={isActive ? `nav-indicator` : undefined}
                    className={`
                      absolute left-3 right-3 -bottom-0.5 h-px origin-left
                      ${isActive ? "bg-primary" : onHero ? "bg-white" : "bg-ink"}
                    `}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isActive ? 1 : hoveredIndex === idx ? 0.5 : 0 }}
                    transition={{
                      duration: 0.4,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                  />
                </button>
              );
            })}
          </nav>

          {/* === RIGHT: actions === */}
          <div className="flex items-center gap-2">

            <a
              href={`/portal?tenant=${tenantCode}`}
              className={`
                hidden md:inline-block text-[13px] font-normal px-3 py-2 transition-colors duration-300
                ${onHero ? "text-white/65 hover:text-white" : "text-ink-soft hover:text-ink"}
              `}
            >
              Portal cliente
            </a>

            <a
              href="/login"
              title="Acceso personal interno"
              className={`
                hidden lg:inline-block text-[11px] font-mono uppercase tracking-wider px-3 py-2 transition-colors duration-300 opacity-40 hover:opacity-80
                ${onHero ? "text-white" : "text-ink"}
              `}
            >
              Staff
            </a>

            {/* CTA: con microinteracción de "shimmer" al hover */}
            <a
              href={`/wizard?tenant=${tenantCode}`}
              className="group relative overflow-hidden inline-flex items-center gap-2.5 h-10 px-5 bg-ink text-paper text-[13px] font-medium tracking-tight rounded-sm hover:bg-ink-soft transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shine"
            >
              <span className="relative z-10">Cotizar</span>
              <span className="relative z-10 font-mono text-[10px] tracking-widest uppercase opacity-70 hidden sm:inline">
                ↗
              </span>
              {/* Shimmer overlay */}
              <span
                className="
                  absolute inset-0 -translate-x-full
                  bg-gradient-to-r from-transparent via-white/20 to-transparent
                  group-hover:translate-x-full
                  transition-transform duration-700 ease-cockpit
                "
              />
            </a>

            <button
              onClick={() => setOpen(true)}
              className={`
                lg:hidden w-10 h-10 flex items-center justify-center
                transition-colors duration-300
                ${onHero ? "text-white" : "text-ink"}
              `}
              aria-label="Menú"
            >
              <Menu className="w-5 h-5" strokeWidth={1.25} />
            </button>
          </div>
        </div>

        {/* === PROGRESS BAR (scroll) === */}
        <motion.div
          style={{ width: progressWidth }}
          className="absolute bottom-0 left-0 h-px bg-primary origin-left"
        />
      </header>

      {/* === MOBILE MENU: drawer editorial === */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[88%] sm:max-w-md bg-paper border-l border-line flex flex-col"
            >
              <div className="h-20 px-7 flex items-center justify-between border-b border-line">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-ink text-paper flex items-center justify-center font-display text-sm font-medium">
                    A
                  </div>
                  <span className="font-display text-lg text-ink tracking-[-0.02em]">
                    {siteName}
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-paper-warm transition-colors"
                  aria-label="Cerrar"
                >
                  <X className="w-5 h-5 text-ink" strokeWidth={1.25} />
                </button>
              </div>

              <nav className="flex-1 px-7 py-8 overflow-y-auto">
                <p className="font-mono text-[10px] tracking-widest text-ink-muted uppercase mb-4">
                  Navegación
                </p>
                <ul className="space-y-1">
                  {NAV_ITEMS.map((item, idx) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.1 + idx * 0.05,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <button
                        onClick={() => go(item.path)}
                        className="
                          group w-full text-left py-3 flex items-baseline gap-3
                          font-display text-2xl text-ink hover:text-ink-soft
                          transition-colors tracking-[-0.02em]
                        "
                      >
                        <span className="font-mono text-[10px] tracking-widest text-ink-muted uppercase">
                          {item.number}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    </motion.li>
                  ))}
                </ul>

                <div className="mt-10 pt-8 border-t border-line">
                  <p className="font-mono text-[10px] tracking-widest text-ink-muted uppercase mb-4">
                    Accesos
                  </p>
                  <a
                    href={`/portal?tenant=${tenantCode}`}
                    className="block py-2 text-base text-ink-soft hover:text-ink transition-colors font-sans"
                  >
                    Portal cliente
                  </a>
                  <a
                    href="/login"
                    className="block py-2 text-sm text-ink-muted hover:text-ink-soft transition-colors font-mono uppercase tracking-wider"
                  >
                    Acceso Staff (ERP)
                  </a>
                </div>
              </nav>

              <div className="p-7 border-t border-line">
                <button
                  onClick={() => go(`/wizard?tenant=${tenantCode}`)}
                  className="btn-primary w-full justify-center"
                >
                  <span>Iniciar cotización</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
