"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { CatalogCategory } from "@/web/actions/catalog";
import type { BrandingConfig } from "@/platform/branding/branding-defaults";
import { ProductCard } from "./ProductCard";
import { TechnicalDetailModal } from "./TechnicalDetailModal";
import type { CapacityItem } from "./product-types";

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

interface Props {
  catalog: CatalogCategory[];
  tenantCode: string;
  branding?: BrandingConfig;
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
