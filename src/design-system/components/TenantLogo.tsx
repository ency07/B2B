"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/platform/utils/cn"

type LogoVariant = "claro" | "oscuro" | "login" | "pdf"

interface TenantLogoProps {
  variant?: LogoVariant
  logoClaroUrl?: string
  logoOscuroUrl?: string
  logoLoginUrl?: string
  logoPdfUrl?: string
  companyName?: string
  initials?: string
  className?: string
  width?: number
  height?: number
  /** Si es true usa `<img>` nativo en vez de Next.js `<Image>` (útil para PDF/print) */
  native?: boolean
  /** Aplicar brightness-0 invert para fondos oscuros */
  invertOnDark?: boolean
  /** Si el fondo actual es oscuro (activa invertOnDark) */
  onDark?: boolean
}

export function TenantLogo({
  variant = "claro",
  logoClaroUrl,
  logoOscuroUrl,
  logoLoginUrl,
  logoPdfUrl,
  companyName,
  initials,
  className,
  width = 120,
  height = 28,
  native = false,
  invertOnDark = false,
  onDark = false,
}: TenantLogoProps) {
  const urls: Record<LogoVariant, string | undefined> = {
    claro: logoClaroUrl,
    oscuro: logoOscuroUrl,
    login: logoLoginUrl,
    pdf: logoPdfUrl,
  }

  const logoUrl = urls[variant] || logoClaroUrl || logoOscuroUrl || ""

  if (!logoUrl) {
    const displayInitials = initials || companyName?.slice(0, 2).toUpperCase() || "EM"
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 text-white font-bold text-sm font-mono">
          {displayInitials}
        </div>
        {companyName && (
          <span className="text-sm font-medium truncate max-w-[180px]">
            {companyName}
          </span>
        )}
      </div>
    )
  }

  const sharedProps = {
    src: logoUrl,
    alt: companyName || "Logo",
    className: cn(
      "h-6 w-auto object-contain",
      invertOnDark && onDark && "brightness-0 invert",
      className,
    ),
  }

  if (native) {
    return <img {...sharedProps} style={{ width, height: "auto" }} />
  }

  return (
    <Image
      {...sharedProps}
      width={width}
      height={height}
      priority
      unoptimized
    />
  )
}