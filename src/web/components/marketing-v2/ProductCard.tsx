"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { statusColor, type CapacityItem } from "./product-types";

/* === PRODUCT CARD — Simple estilo catálogo general === */
export function ProductCard({
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
