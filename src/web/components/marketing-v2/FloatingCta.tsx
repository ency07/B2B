"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface FloatingCtaProps {
  tenantCode: string;
}

export function FloatingCta({ tenantCode }: FloatingCtaProps) {
  const [visible, setVisible] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<string>("inicio");

  // Scroll-spy: aparece después de 600px de scroll
  React.useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Detectar sección activa para ocultar el CTA mientras estamos en el Hero
  React.useEffect(() => {
    const sections = [
      "inicio",
      "confianza",
      "desafios",
      "proceso",
      "servicios",
      "capacidades",
      "sectores",
      "casos",
      "calculadora",
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
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );

    for (const id of sections) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  // Ocultar cuando estamos en el Hero (ya tiene su propio CTA visible)
  const isHidden = activeSection === "inicio";

  return (
    <AnimatePresence>
      {visible && !isHidden && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-50 hidden md:block"
        >
          <a
            href={`/wizard?tenant=${tenantCode}`}
            className="group inline-flex items-center gap-3 h-12 pl-5 pr-2 bg-foreground text-background text-sm font-medium tracking-tight rounded-lg shadow-2xl hover:opacity-90 transition-all duration-200"
          >
            <span>Iniciar Cotización</span>
            <span className="w-8 h-8 rounded-lg bg-background text-foreground flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-200">
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </span>
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
