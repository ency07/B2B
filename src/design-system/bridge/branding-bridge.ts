'use client'

import { parseToHslChannels } from '@/platform/tenant/tenant'
import type { BrandingConfig } from '@/platform/branding/branding-defaults'

function borderRadiusToPx(val: string): string {
  if (val === 'ninguno') return '0px'
  if (val === 'sutil') return '4px'
  if (val === 'redondeado') return '12px'
  return val
}

export function brandingToCssVars(config: BrandingConfig): Record<string, string> {
  return {
    '--primary': parseToHslChannels(config.color_primario),
    '--ring': parseToHslChannels(config.color_primario),
    '--secondary': parseToHslChannels(config.color_secundario),
    '--success': parseToHslChannels(config.color_exito),
    '--warning': parseToHslChannels(config.color_warning),
    '--destructive': parseToHslChannels(config.color_danger),
    '--info': parseToHslChannels(config.color_info),
    '--radius': borderRadiusToPx(config.border_radius),
  }
}

export type { BrandingConfig }
