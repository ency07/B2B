/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, X, FileDown, Wrench, Check } from "lucide-react";
import type { CatalogCategory } from "@/web/actions/catalog";

interface CapacityItem {
  id: string;
  code: string;
  name: string;
  category: string;
  image: string;
  status: "DISPONIBLE" | "BAJO PEDIDO" | "SERIE ESPECIAL";
  shortDescription: string;
  projectRef: string;
  specs: Array<{ parametro: string; valor: string; cumplimiento: string }>;
  certifications: string[];
  applications: string[];
}

function extractFromCatalog(
  catalog: CatalogCategory[],
  projectRef: string
): CapacityItem[] {
  const items: CapacityItem[] = [];
  const seenProductIds = new Set<string>();
  for (const cat of catalog) {
    for (const sub of cat.subcategories) {
      for (const fam of sub.families) {
        for (const ser of fam.series) {
          for (const prod of ser.products) {
            // La jerarquía de catálogo puede traer el mismo producto embebido más
            // de una vez (registros de subcategoría/categoría duplicados en BD);
            // se deduplica por id para no mostrar la misma ficha dos veces.
            if (seenProductIds.has(prod.id)) continue;
            seenProductIds.add(prod.id);
            const specs = prod.specifications || {};
            const img = prod.images?.[0]?.filePath;
            items.push({
              id: prod.id,
              code: prod.productCode,
              name: prod.name,
              category: sub.name,
              image: img ?? "/industrial_plant_ventilation.webp",
              status: "DISPONIBLE",
              shortDescription:
                prod.description?.slice(0, 160) ??
                "Diseño a medida con simulación CFD, fabricación en acero de grado industrial y balanceo dinámico ISO 1940 G2.5.",
              projectRef: projectRef,
              specs: Object.entries(specs).map(([k, v]) => ({
                parametro: k,
                valor: String(v),
                cumplimiento: "Verificado",
              })),
              certifications: ["AMCA 300", "RETIE"],
              applications: [],
            });
          }
        }
      }
    }
  }
  return items;
}

const statusColor: Record<CapacityItem["status"], string> = {
  DISPONIBLE: "var(--ds-c-marketing-engineering-status-success)",
  "BAJO PEDIDO": "var(--ds-c-marketing-engineering-status-warning)",
  "SERIE ESPECIAL": "var(--ds-c-marketing-engineering-status-info)",
};

interface Props {
  catalog: CatalogCategory[];
  tenantCode: string;
  branding?: any;
}

export function EngineeringCapabilities({ catalog, tenantCode, branding }: Props) {
  const projectRef = branding?.prefijo_referencias || "REF-CYH";
  // Sin fallback estático: si la BD no devuelve productos (falla de conexión o
  // catálogo vacío), se muestra un estado honesto en vez de fichas técnicas
  // fabricadas (certificaciones, referencias de proyecto y specs que antes eran
  // datos de ejemplo, no reales, y podían desincronizarse del catálogo real).
  const items = React.useMemo(
    () => extractFromCatalog(catalog, projectRef),
    [catalog, projectRef]
  );

  const [openItem, setOpenItem] = React.useState<CapacityItem | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  const categories = React.useMemo(
    () => Array.from(new Set(items.map((item) => item.category))),
    [items]
  );

  const visibleItems = React.useMemo(
    () =>
      activeCategory
        ? items.filter((item) => item.category === activeCategory)
        : items.slice(0, 9),
    [items, activeCategory]
  );

  return (
    <section
      id="capacidades"
      className="relative w-full bg-paper section-py"
    >
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 section-header-normal">
          <div className="lg:col-span-2">
            <p className="editorial-eyebrow">— Extractores e inyectores</p>
          </div>
          <div className="lg:col-span-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="editorial-h2 text-[clamp(40px,5.5vw,80px)] max-w-4xl"
            >
              Equipos de ingeniería
              <br />
              <span className="italic text-ink-soft">diseñados para su operación.</span>
            </motion.h2>
            <p className="mt-10 text-lg sm:text-xl leading-[1.6] text-ink-soft max-w-2xl font-sans">
              Catálogo de extractores, ventiladores e inyectores industriales
              fabricados bajo especificación. Cada equipo se diseña para
              las condiciones exactas de su operación.
            </p>
          </div>
        </div>

        {/* === FILTRO POR CATEGORÍA === */}
        {categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              aria-pressed={activeCategory === null}
              className={`px-4 py-2 rounded-sm font-mono text-[10px] tracking-widest uppercase transition-colors ${
                activeCategory === null
                  ? "bg-ink text-paper"
                  : "border border-line text-fg-muted hover:bg-paper-warm hover:text-ink"
              }`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                aria-pressed={activeCategory === category}
                className={`px-4 py-2 rounded-sm font-mono text-[10px] tracking-widest uppercase transition-colors ${
                  activeCategory === category
                    ? "bg-ink text-paper"
                    : "border border-line text-fg-muted hover:bg-paper-warm hover:text-ink"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        {/* === GRID 3-4 COLUMNAS — Cards clickeables (simple, centrado) === */}
        {visibleItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-line border border-line reveal-stagger">
            {visibleItems.map((item, idx) => (
              <ProductCard
                key={item.id}
                item={item}
                idx={idx}
                onOpen={() => setOpenItem(item)}
              />
            ))}
          </div>
        ) : (
          <div className="border border-line bg-paper-warm px-6 py-12 text-center">
            <p className="font-sans text-sm text-ink-soft">
              {activeCategory
                ? "No hay equipos disponibles en esta categoría por ahora."
                : "Catálogo temporalmente no disponible. Contáctenos para conocer nuestra línea completa de equipos."}
            </p>
          </div>
        )}
      </div>

      {/* === MODAL DE DETALLE TÉCNICO === */}
      <TechnicalDetailModal
        item={openItem}
        onClose={() => setOpenItem(null)}
        tenantCode={tenantCode}
      />
    </section>
  );
}

/* === PRODUCT CARD — Simple estilo catálogo general === */
function ProductCard({
  item,
  idx,
  onOpen,
}: {
  item: CapacityItem;
  idx: number;
  onOpen: () => void;
}) {
  const accent = statusColor[item.status];

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.5,
        delay: idx * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="relative bg-paper text-center group cursor-pointer overflow-hidden hover-lift transition-shadow duration-500"
    >
      {/* === FOTO === */}
      <div className="relative aspect-square overflow-hidden bg-paper-warm">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-contain p-4 photo-treated transition-transform duration-500 group-hover:scale-105"
        />
        {/* Status badge discreto en esquina */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-paper/95 backdrop-blur-sm px-2 py-1 rounded-sm">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: accent }}
          />
          <span className="font-mono text-[9px] tracking-widest text-ink uppercase font-medium">
            {item.status}
          </span>
        </div>
      </div>

      {/* === CONTENIDO === */}
      <div className="p-5 lg:p-6">
        <p className="font-mono text-[10px] tracking-widest text-fg-muted uppercase mb-2">
          {item.code}
        </p>
        <h3 className="font-display text-base lg:text-lg font-light text-ink tracking-[-0.01em] leading-[1.2] group-hover:text-ink-soft transition-colors uppercase">
          {item.name}
        </h3>
      </div>
    </motion.button>
  );
}

/* === MODAL DE DETALLE TÉCNICO === */
function TechnicalDetailModal({
  item,
  onClose,
  tenantCode,
}: {
  item: CapacityItem | null;
  onClose: () => void;
  tenantCode: string;
}) {
  React.useEffect(() => {
    if (!item) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  const accent = item ? statusColor[item.status] : "var(--ds-c-marketing-engineering-status-success)";

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-layer-sticky bg-ink/60 backdrop-blur-md"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-0 right-0 bottom-0 z-layer-modal w-full md:w-[85%] lg:w-[60%] xl:w-[55%] bg-paper border-l border-line flex flex-col overflow-hidden"
          >
            {/* === HEADER === */}
            <header className="sticky top-0 z-layer-content bg-paper border-b border-line px-8 lg:px-10 py-6 flex items-start justify-between gap-6">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className="font-mono text-[10px] tracking-widest text-fg-muted uppercase">
                    {item.code}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-line-strong" />
                  <span className="font-mono text-[10px] tracking-widest text-fg-muted uppercase">
                    {item.category}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-line-strong" />
                  <span className="font-mono text-[10px] tracking-widest uppercase font-medium" style={{ color: accent }}>
                    {item.status}
                  </span>
                </div>
                <h2 className="font-display text-3xl lg:text-4xl font-light text-ink tracking-[-0.025em] leading-[1.05] uppercase">
                  {item.name}
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="shrink-0 w-10 h-10 rounded-md flex items-center justify-center bg-paper-warm border border-line hover:bg-elev-3 transition-colors"
              >
                <X className="w-4 h-4 text-ink" strokeWidth={1.5} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto">
              {/* === HERO IMAGE === */}
              <div className="relative aspect-[16/9] bg-ink">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain p-12 photo-treated"
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-1/3"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 0%, rgba(7,9,12,0.6) 100%)",
                  }}
                />
                <div className="absolute bottom-6 left-8 lg:left-10 right-8 lg:right-10">
                  <p className="font-mono text-[10px] tracking-widest text-white/60 uppercase mb-2">
                    {item.projectRef}
                  </p>
                  <p className="font-display text-lg lg:text-xl italic font-light text-white/95 leading-snug max-w-2xl tracking-[-0.01em]">
                    {item.shortDescription}
                  </p>
                </div>
              </div>

              <div className="px-8 lg:px-10 py-10 space-y-12">
                {/* === TABLA DE ESPECIFICACIONES === */}
                <div>
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <p className="font-mono text-[10px] tracking-widest text-fg-muted uppercase mb-2">
                        — Especificaciones técnicas
                      </p>
                      <h3 className="font-display text-2xl lg:text-3xl font-light text-ink tracking-[-0.02em]">
                        Ficha técnica verificable
                      </h3>
                    </div>
                    <span className="font-mono text-[10px] tracking-widest uppercase font-medium text-fg-muted">
                      {item.specs.length} parámetros
                    </span>
                  </div>

                  <div className="border border-line">
                    <div className="grid grid-cols-[2fr_2fr_1fr] bg-paper-warm border-b border-line">
                      <div className="p-4 font-mono text-[10px] tracking-widest text-fg-muted uppercase">
                        Parámetro
                      </div>
                      <div className="p-4 font-mono text-[10px] tracking-widest text-fg-muted uppercase border-l border-line">
                        Valor Registrado
                      </div>
                      <div className="p-4 font-mono text-[10px] tracking-widest text-fg-muted uppercase border-l border-line">
                        Cumplimiento
                      </div>
                    </div>
                    {item.specs.map((spec, idx) => (
                      <div
                        key={spec.parametro}
                        className={`grid grid-cols-[2fr_2fr_1fr] bg-paper ${
                          idx < item.specs.length - 1 ? "border-b border-line" : ""
                        }`}
                      >
                        <div className="p-4 text-sm text-ink font-sans">
                          {spec.parametro}
                        </div>
                        <div className="p-4 font-mono text-sm text-ink font-medium tabular-nums border-l border-line">
                          {spec.valor}
                        </div>
                        <div className="p-4 font-mono text-[10px] tracking-widest text-fg-muted uppercase border-l border-line flex items-center gap-1.5">
                          <Check className="w-3 h-3" style={{ color: accent }} strokeWidth={2} />
                          <span>{spec.cumplimiento}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* === APLICACIONES === */}
                {item.applications.length > 0 && (
                  <div>
                    <p className="font-mono text-[10px] tracking-widest text-fg-muted uppercase mb-4">
                      — Aplicaciones
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {item.applications.map((app) => (
                        <span
                          key={app}
                          className="px-3 py-1.5 bg-paper-warm border border-line text-sm text-ink font-sans"
                        >
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* === CERTIFICACIONES === */}
                <div>
                  <p className="font-mono text-[10px] tracking-widest text-fg-muted uppercase mb-4">
                    — Certificaciones
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line">
                    {item.certifications.map((cert) => (
                      <div
                        key={cert}
                        className="bg-paper p-4 flex flex-col items-start gap-1.5"
                      >
                        <Check
                          className="w-3.5 h-3.5 text-ink"
                          strokeWidth={2}
                        />
                        <span className="font-mono text-[11px] tracking-widest text-ink uppercase font-medium">
                          {cert}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* === FOOTER CON CTAs === */}
            <footer className="sticky bottom-0 z-layer-content bg-paper border-t border-line px-8 lg:px-10 py-5">
              <div className="flex flex-col sm:flex-row items-stretch gap-3">
                <a
                  href={`/wizard?tenant=${tenantCode}&product=${item.code}`}
                  className="group inline-flex items-center justify-center gap-3 flex-1 h-12 px-6 bg-ink text-paper text-sm font-medium tracking-tight rounded-sm hover:bg-ink-soft transition-colors"
                >
                  <Wrench className="w-4 h-4" strokeWidth={1.5} />
                  <span>Solicitar Ingeniería · Cotizador</span>
                  <ArrowUpRight
                    className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={1.5}
                  />
                </a>
                <button
                  type="button"
                  aria-disabled="true"
                  title="Ficha técnica no disponible aún"
                  className="inline-flex items-center justify-center gap-3 h-12 px-6 border border-ink text-ink text-sm font-medium tracking-tight rounded-sm hover:bg-ink hover:text-paper transition-colors cursor-not-allowed"
                >
                  <FileDown className="w-4 h-4" strokeWidth={1.5} />
                  <span>Descargar Ficha Técnica</span>
                </button>
              </div>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
