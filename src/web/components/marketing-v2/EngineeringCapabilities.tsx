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

const FALLBACK_CAPACITIES: CapacityItem[] = [
  {
    id: "blower",
    code: "BLW-IND",
    name: "Blower",
    category: "Sopladores · Alta presión",
    image: "/axial_duct_fan.webp",
    status: "DISPONIBLE",
    shortDescription:
      "Soplador industrial de alta presión para sistemas de transporte neumático, ventilación de hornos y procesos que requieren caudales medios con presiones elevadas.",
    projectRef: "REF-2024-BLW-001",
    specs: [
      { parametro: "Velocidad / Frecuencia", valor: "3,450 RPM · 60 Hz", cumplimiento: "Verificado" },
      { parametro: "Caudal Nominal", valor: "2,800 — 18,500 CFM", cumplimiento: "DIN / ISO" },
      { parametro: "Presión Máxima", valor: "6,000 Pa · 24.0 in w.g.", cumplimiento: "Estática" },
      { parametro: "Potencia", valor: "20 — 200 HP · 15 — 150 kW", cumplimiento: "440 V · IE4" },
      { parametro: "Protección Envolvente", valor: "IP55 · Clase F", cumplimiento: "Clasificado" },
      { parametro: "Material Constructivo", valor: "Acero ASTM A36 + Recubrimiento Epóxico", cumplimiento: "Esp. Marina" },
      { parametro: "Normativas Aplicadas", valor: "AMCA 300 · RETIE · ISO 1940 G2.5", cumplimiento: "RETIE Ok" },
      { parametro: "Nivel de Ruido", valor: "85 dBA @ 1m", cumplimiento: "OSHAs compliant" },
      { parametro: "Peso", valor: "320 — 850 kg", cumplimiento: "Verificado" },
      { parametro: "Diámetro Impeller", valor: "14 — 32 in", cumplimiento: "Standard" },
    ],
    certifications: ["AMCA 300", "RETIE", "ISO 1940 G2.5"],
    applications: [
      "Transporte neumático de materiales",
      "Ventilación de hornos y calderas",
      "Procesos de combustión",
      "Soplado de piezas y limpieza industrial",
    ],
  },
  {
    id: "hongo-inox",
    code: "HON-IX",
    name: "Extractor Tipo Hongo Inoxidable",
    category: "Extractores · Acero Inoxidable",
    image: "/extractor_hongo_inox.webp",
    status: "DISPONIBLE",
    shortDescription:
      "Extractor de techo en acero inoxidable 304/316 para ambientes corrosivos, vapores químicos o procesamiento de alimentos. Diseño sanitario de fácil limpieza.",
    projectRef: "REF-2024-HNX-002",
    specs: [
      { parametro: "Velocidad / Frecuencia", valor: "1,750 RPM · 60 Hz", cumplimiento: "Verificado" },
      { parametro: "Caudal Nominal", valor: "1,200 — 12,000 CFM", cumplimiento: "DIN / ISO" },
      { parametro: "Presión Máxima", valor: "300 Pa · 1.2 in w.g.", cumplimiento: "Estática" },
      { parametro: "Potencia", valor: "1 — 10 HP · 0.75 — 7.5 kW", cumplimiento: "220/440 V · IE3" },
      { parametro: "Protección Envolvente", valor: "IP65 · Clase F", cumplimiento: "Sanitario" },
      { parametro: "Material Constructivo", valor: "Acero Inoxidable 304 / 316L", cumplimiento: "HACCP" },
      { parametro: "Normativas Aplicadas", valor: "AMCA 300 · INVIMA · FDA · 3-A", cumplimiento: "INVIMA Ok" },
      { parametro: "Nivel de Ruido", valor: "68 dBA @ 1m", cumplimiento: "OSHAs compliant" },
      { parametro: "Peso", valor: "45 — 180 kg", cumplimiento: "Verificado" },
      { parametro: "Diámetro", valor: "12 — 36 in", cumplimiento: "Standard" },
    ],
    certifications: ["AMCA 300", "INVIMA", "FDA", "3-A", "HACCP"],
    applications: [
      "Procesamiento de alimentos",
      "Industria farmacéutica",
      "Laboratorios y química fina",
      "Ambientes corrosivos (vapores, sales)",
    ],
  },
  {
    id: "multiusos",
    code: "MLT-IND",
    name: "Extractor Multiusos",
    category: "Extractores · Polivalentes",
    image: "/industrial_centrifugal_fan.webp",
    status: "DISPONIBLE",
    shortDescription:
      "Extractor polivalente para aplicaciones generales de ventilación, extracción de aire viciado y renovación ambiental en planta. Robusto y de fácil instalación.",
    projectRef: "REF-2024-MLT-003",
    specs: [
      { parametro: "Velocidad / Frecuencia", valor: "Variable · 900 — 1,750 RPM", cumplimiento: "Verificado" },
      { parametro: "Caudal Nominal", valor: "3,500 — 45,000 CFM", cumplimiento: "DIN / ISO" },
      { parametro: "Presión Máxima", valor: "750 Pa · 3.0 in w.g.", cumplimiento: "Estática" },
      { parametro: "Potencia", valor: "3 — 50 HP · 2.2 — 37 kW", cumplimiento: "220/440 V · IE3" },
      { parametro: "Protección Envolvente", valor: "IP54 · Clase F", cumplimiento: "Clasificado" },
      { parametro: "Material Constructivo", valor: "Acero al carbono + pintura epóxica", cumplimiento: "Standard" },
      { parametro: "Normativas Aplicadas", valor: "AMCA 300 · RETIE · ISO 1940", cumplimiento: "RETIE Ok" },
      { parametro: "Nivel de Ruido", valor: "72 dBA @ 1m", cumplimiento: "OSHAs compliant" },
      { parametro: "Peso", valor: "85 — 420 kg", cumplimiento: "Verificado" },
      { parametro: "Montaje", valor: "Pared · Techno · Conducto", cumplimiento: "Universal" },
    ],
    certifications: ["AMCA 300", "RETIE", "ISO 1940"],
    applications: [
      "Ventilación general de planta",
      "Talleres mecánicos",
      "Renovación de aire en bodegas",
      "Extracción de aire viciado",
    ],
  },
  {
    id: "axial-malla",
    code: "AX-ML",
    name: "Ventilador Axial con Malla",
    category: "Ventiladores · Axiales",
    image: "/axial_duct_fan.webp",
    status: "DISPONIBLE",
    shortDescription:
      "Ventilador axial de pared con malla de protección, ideal para ventilación general de naves industriales, establos y galpones. Bajo perfil de instalación.",
    projectRef: "REF-2024-AXM-004",
    specs: [
      { parametro: "Velocidad / Frecuencia", valor: "1,450 RPM · 60 Hz", cumplimiento: "Verificado" },
      { parametro: "Caudal Nominal", valor: "4,200 — 32,000 CFM", cumplimiento: "DIN / ISO" },
      { parametro: "Presión Máxima", valor: "180 Pa · 0.7 in w.g.", cumplimiento: "Estática" },
      { parametro: "Potencia", valor: "1.5 — 15 HP · 1.1 — 11 kW", cumplimiento: "220/440 V · IE3" },
      { parametro: "Protección Envolvente", valor: "IP55 · Clase F", cumplimiento: "Clasificado" },
      { parametro: "Material Constructivo", valor: "Acero galvanizado + álabes aluminio", cumplimiento: "Standard" },
      { parametro: "Normativas Aplicadas", valor: "AMCA 300 · RETIE · ISO 1940", cumplimiento: "RETIE Ok" },
      { parametro: "Nivel de Ruido", valor: "65 dBA @ 1m", cumplimiento: "OSHAs compliant" },
      { parametro: "Peso", valor: "35 — 180 kg", cumplimiento: "Verificado" },
      { parametro: "Diámetro", valor: "18 — 48 in", cumplimiento: "Standard" },
    ],
    certifications: ["AMCA 300", "RETIE", "ISO 1940"],
    applications: [
      "Naves industriales y galpones",
      "Establos y granjas avícolas",
      "Almacenes y depósitos",
      "Ventilación de galpones industriales",
    ],
  },
  {
    id: "centrifugo-cp",
    code: "CP-IND",
    name: "Ventilador Centrífugo",
    category: "Ventiladores · Centrífugos",
    image: "/industrial_centrifugal_fan.webp",
    status: "DISPONIBLE",
    shortDescription:
      "Ventilador centrífugo de simple aspiración para sistemas con ductos, filtros o pérdidas de carga significativas. Construcción robusta en acero al carbono.",
    projectRef: "REF-2024-CPI-005",
    specs: [
      { parametro: "Velocidad / Frecuencia", valor: "Variable · 1,750 — 3,500 RPM", cumplimiento: "Verificado" },
      { parametro: "Caudal Nominal", valor: "2,500 — 65,000 CFM", cumplimiento: "DIN / ISO" },
      { parametro: "Presión Máxima", valor: "4,500 Pa · 18.0 in w.g.", cumplimiento: "Estática" },
      { parametro: "Potencia", valor: "10 — 250 HP · 7.5 — 185 kW", cumplimiento: "440 V · IE4" },
      { parametro: "Protección Envolvente", valor: "IP55 · Clase F", cumplimiento: "Clasificado" },
      { parametro: "Material Constructivo", valor: "Acero al carbono ASTM A36", cumplimiento: "Esp. Marina" },
      { parametro: "Normativas Aplicadas", valor: "AMCA 300 · RETIE · API 673", cumplimiento: "RETIE Ok" },
      { parametro: "Nivel de Ruido", valor: "82 dBA @ 1m", cumplimiento: "OSHAs compliant" },
      { parametro: "Peso", valor: "180 — 950 kg", cumplimiento: "Verificado" },
      { parametro: "Impeller", valor: "Álabes curvos · Antiadherente", cumplimiento: "Standard" },
    ],
    certifications: ["AMCA 300", "RETIE", "API 673"],
    applications: [
      "Sistemas con filtros de mangas",
      "Procesos térmicos y siderúrgicos",
      "Transporte neumático",
      "Ventilación de túneles y socavones",
    ],
  },
  {
    id: "encajonado",
    code: "ENC-IND",
    name: "Ventilador Encajonado",
    category: "Ventiladores · Insonorizados",
    image: "/ventilador_encajonado.webp",
    status: "DISPONIBLE",
    shortDescription:
      "Ventilador centrífugo dentro de gabinete acústico. Atenuación de 12 dBA sobre el estándar. Para entornos con restricción de ruido o zonas urbanas.",
    projectRef: "REF-2024-ENC-006",
    specs: [
      { parametro: "Velocidad / Frecuencia", valor: "1,800 RPM · 60 Hz", cumplimiento: "Verificado" },
      { parametro: "Caudal Nominal", valor: "5,000 — 35,000 CFM", cumplimiento: "DIN / ISO" },
      { parametro: "Presión Máxima", valor: "1,800 Pa · 7.2 in w.g.", cumplimiento: "Estática" },
      { parametro: "Potencia", valor: "5 — 75 HP · 3.7 — 55 kW", cumplimiento: "440 V · IE4" },
      { parametro: "Atenuación Acústica", valor: "−12 dBA sobre estándar", cumplimiento: "OSHAs" },
      { parametro: "Material del Gabinete", valor: "Acero galvanizado + lana mineral", cumplimiento: "Esp. Acústica" },
      { parametro: "Normativas Aplicadas", valor: "AMCA 300 · RETIE · ISO 1940", cumplimiento: "RETIE Ok" },
      { parametro: "Nivel de Ruido", valor: "58 — 66 dBA @ 1m", cumplimiento: "OSHAs compliant" },
      { parametro: "Peso", valor: "220 — 680 kg", cumplimiento: "Verificado" },
      { parametro: "Dimensiones", valor: "1,200 — 2,000 mm largo", cumplimiento: "Standard" },
    ],
    certifications: ["AMCA 300", "RETIE", "ISO 1940", "OSHAs"],
    applications: [
      "Plantas en zonas urbanas",
      "Hospitales y centros comerciales",
      "Restaurantes y cocinas industriales",
      "Cualquier entorno con restricción acústica",
    ],
  },
  {
    id: "axial-aspas",
    code: "AX-AS",
    name: "Ventilador Axial de Aspas",
    category: "Ventiladores · Axiales",
    image: "/axial_duct_fan.webp",
    status: "DISPONIBLE",
    shortDescription:
      "Ventilador axial de alto rendimiento con aspas de perfil aerodinámico optimizado. Para extracción industrial continua en ambientes agresivos.",
    projectRef: "REF-2024-AXA-007",
    specs: [
      { parametro: "Velocidad / Frecuencia", valor: "1,450 RPM · 60 Hz", cumplimiento: "Verificado" },
      { parametro: "Caudal Nominal", valor: "8,000 — 75,000 CFM", cumplimiento: "DIN / ISO" },
      { parametro: "Presión Máxima", valor: "350 Pa · 1.4 in w.g.", cumplimiento: "Estática" },
      { parametro: "Potencia", valor: "5 — 60 HP · 3.7 — 45 kW", cumplimiento: "440 V · IE4" },
      { parametro: "Protección Envolvente", valor: "IP55 · Clase F", cumplimiento: "Clasificado" },
      { parametro: "Material Constructivo", valor: "Acero al carbono + álabes aluminio", cumplimiento: "Esp. Marina" },
      { parametro: "Normativas Aplicadas", valor: "AMCA 300 · RETIE · ISO 1940 G2.5", cumplimiento: "RETIE Ok" },
      { parametro: "Nivel de Ruido", valor: "75 dBA @ 1m", cumplimiento: "OSHAs compliant" },
      { parametro: "Peso", valor: "120 — 380 kg", cumplimiento: "Verificado" },
      { parametro: "Diámetro", valor: "24 — 60 in", cumplimiento: "Standard" },
    ],
    certifications: ["AMCA 300", "RETIE", "ISO 1940 G2.5"],
    applications: [
      "Extracción industrial continua",
      "Ventilación de túneles",
      "Minería subterránea",
      "Plantas con alta carga térmica",
    ],
  },
  {
    id: "tubo-axial",
    code: "TX-IND",
    name: "Ventilador Tubo Axial",
    category: "Ventiladores · Tubo Axial",
    image: "/axial_duct_fan.webp",
    status: "BAJO PEDIDO",
    shortDescription:
      "Ventilador axial en formato tubular para instalación en línea de conducto. Ideal para ventilación de espacios confinados y túneles largos.",
    projectRef: "REF-2024-TXA-008",
    specs: [
      { parametro: "Velocidad / Frecuencia", valor: "1,500 — 2,900 RPM · 60 Hz", cumplimiento: "Verificado" },
      { parametro: "Caudal Nominal", valor: "5,000 — 80,000 CFM", cumplimiento: "DIN / ISO" },
      { parametro: "Presión Máxima", valor: "800 Pa · 3.2 in w.g.", cumplimiento: "Estática" },
      { parametro: "Potencia", valor: "3 — 100 HP · 2.2 — 75 kW", cumplimiento: "440 V · IE4" },
      { parametro: "Protección Envolvente", valor: "IP55 · Clase F", cumplimiento: "Clasificado" },
      { parametro: "Material Constructivo", valor: "Acero al carbono con tubo envolvente", cumplimiento: "Esp. Marina" },
      { parametro: "Normativas Aplicadas", valor: "AMCA 300 · RETIE · ISO 1940", cumplimiento: "RETIE Ok" },
      { parametro: "Nivel de Ruido", valor: "78 dBA @ 1m", cumplimiento: "OSHAs compliant" },
      { parametro: "Peso", valor: "95 — 450 kg", cumplimiento: "Verificado" },
      { parametro: "Diámetro", valor: "18 — 54 in", cumplimiento: "Standard" },
    ],
    certifications: ["AMCA 300", "RETIE", "ISO 1940"],
    applications: [
      "Ventilación en línea de conducto",
      "Túneles mineros",
      "Estaciones subterráneas",
      "Sistemas de presurización",
    ],
  },
  {
    id: "blower-centrifugo",
    code: "BLW-CP",
    name: "Extractor Centrífugo Blower",
    category: "Sopladores · Centrífugos",
    image: "/industrial_centrifugal_fan.webp",
    status: "SERIE ESPECIAL",
    shortDescription:
      "Combinación de blower y centrífugo. Caudal medio con presión muy alta. Para procesos industriales de exigencia elevada.",
    projectRef: "REF-2024-BLW-009",
    specs: [
      { parametro: "Velocidad / Frecuencia", valor: "3,200 RPM · 60 Hz", cumplimiento: "Verificado" },
      { parametro: "Caudal Nominal", valor: "4,000 — 28,000 CFM", cumplimiento: "DIN / ISO" },
      { parametro: "Presión Máxima", valor: "8,000 Pa · 32.0 in w.g.", cumplimiento: "Estática" },
      { parametro: "Potencia", valor: "30 — 300 HP · 22 — 220 kW", cumplimiento: "440 V · IE4" },
      { parametro: "Protección Envolvente", valor: "IP55 · Clase F", cumplimiento: "Clasificado" },
      { parametro: "Material Constructivo", valor: "Acero ASTM A36 + Antiadherente", cumplimiento: "Esp. Marina" },
      { parametro: "Normativas Aplicadas", valor: "AMCA 300 · RETIE · API 673", cumplimiento: "RETIE Ok" },
      { parametro: "Nivel de Ruido", valor: "88 dBA @ 1m", cumplimiento: "OSHAs compliant" },
      { parametro: "Peso", valor: "380 — 1,200 kg", cumplimiento: "Verificado" },
      { parametro: "Impeller", valor: "Abierto · Alta presión", cumplimiento: "Custom" },
    ],
    certifications: ["AMCA 300", "RETIE", "API 673"],
    applications: [
      "Procesos de combustión industrial",
      "Transporte neumático de alta densidad",
      "Soplado de hornos",
      "Sistemas de limpieza con aire comprimido",
    ],
  },
];

function extractFromCatalog(
  catalog: CatalogCategory[],
  projectRef: string
): CapacityItem[] {
  const items: CapacityItem[] = [];
  for (const cat of catalog) {
    for (const sub of cat.subcategories) {
      for (const fam of sub.families) {
        for (const ser of fam.series) {
          for (const prod of ser.products) {
            if (items.length >= 9) return items;
            const specs = prod.specifications || {};
            const img = prod.images?.[0]?.filePath;
            items.push({
              id: prod.id,
              code: prod.productCode,
              name: prod.name,
              category: cat.name,
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
  const items = React.useMemo(() => {
    const fromDb = extractFromCatalog(catalog, projectRef);
    return fromDb.length > 0 ? fromDb : FALLBACK_CAPACITIES;
  }, [catalog, projectRef]);

  const [openItem, setOpenItem] = React.useState<CapacityItem | null>(null);

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

        {/* === GRID 3-4 COLUMNAS — Cards clickeables (simple, centrado) === */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-line border border-line reveal-stagger">
          {items.slice(0, 9).map((item, idx) => (
            <ProductCard
              key={item.id}
              item={item}
              idx={idx}
              onOpen={() => setOpenItem(item)}
            />
          ))}
        </div>
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
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center justify-center gap-3 h-12 px-6 border border-ink text-ink text-sm font-medium tracking-tight rounded-sm hover:bg-ink hover:text-paper transition-colors"
                >
                  <FileDown className="w-4 h-4" strokeWidth={1.5} />
                  <span>Descargar Ficha Técnica</span>
                </a>
              </div>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

