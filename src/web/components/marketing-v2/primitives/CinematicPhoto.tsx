"use client";

import * as React from "react";
import Image from "next/image";

interface CinematicPhotoProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Intensidad del tratamiento: 0 = nada, 1 = máximo */
  intensity?: number;
  /** Color del overlay. Por defecto carbón */
  overlayColor?: string;
  /** Mostrar vignette */
  vignette?: boolean;
  /** Mostrar grain (textura de película) */
  grain?: boolean;
  /** objectFit override */
  objectFit?: "cover" | "contain";
}

/**
 * CinematicPhoto: aplica un tratamiento cinematográfico unificado
 * a todas las fotografías de la web. Usa el mismo lenguaje visual
 * en todas las imágenes (filtro, overlay, vignette, grain) para que
 * parezcan de la misma serie fotográfica, no de banco de imágenes.
 *
 * El filtro reduce saturación (-15%) y baja brillo (-5%) para un look
 * industrial cinematográfico. El overlay de carbón con mix-blend-multiply
 * unifica los tonos entre imágenes que originalmente son muy distintas.
 */
export function CinematicPhoto({
  src,
  alt,
  fill = true,
  width,
  height,
  sizes = "100vw",
  priority = false,
  className = "",
  intensity = 1,
  overlayColor = "rgba(26, 29, 36, 0.28)",
  vignette = true,
  grain = true,
  objectFit = "cover",
}: CinematicPhotoProps) {
  // Filter inline (no se puede combinar con Tailwind filter)
  const filterStyle: React.CSSProperties = {
    filter: `contrast(1.05) saturate(${0.85 * intensity}) brightness(${0.95 + 0.05 * (1 - intensity)})`,
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Image base */}
      {fill ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          style={{ ...filterStyle, objectFit }}
          className="select-none"
        />
      ) : (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          style={{ ...filterStyle, objectFit }}
          className="select-none"
        />
      )}

      {/* Overlay de carbón con mix-blend-multiply — unifica los tonos */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundColor: overlayColor,
          mixBlendMode: "multiply",
        }}
      />

      {/* Grain sutil (textura de película) — SVG noise */}
      {grain && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23noise)'/></svg>")`,
            backgroundSize: "200px 200px",
          }}
        />
      )}

      {/* Vignette radial — oscurece los bordes */}
      {vignette && (
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.35) 100%)",
          }}
        />
      )}
    </div>
  );
}
