---
name: ui-ux-pro-max
description: Guidelines and recipes for designing premium B2B UI/UX interfaces with physical depth, multi-layered shadows, structured micro-typography, spacious layouts, and full accessibility.
---

# UI/UX Pro Max Guidelines

This skill encapsulates elite design patterns for B2B industrial and premium software applications (similar to Apple, Rivian, Stripe, Figma, Porsche, and Siemens).

## Core Principles

### 1. Visual Depth & Physical Layers
Avoid flat single-colored containers. Every component must feel like a manufactured physical object using multiple layers:
- **Base Plane:** Clean background (e.g. static light gradients `bg-gradient-to-br from-white to-zinc-50`).
- **Inner Texture:** Engineering schematic grids or fine dot patterns (e.g. radial grid backgrounds).
- **Illumination:** Subtle top highlights using inset white borders (`shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]`).
- **Outer Shadows:** Multi-layered drop shadows with wide dispersion for high elevation feel.
- **Borders:** Extremely fine borders (`border-zinc-200/50` or `border-white/10` for dark panels).

### 2. Premium Buttons
Buttons must feel manufactured:
- Generous padding and structured proportions (`px-6 py-4` or `px-8 py-4.5`).
- Slight gradients and subtle inner borders.
- Tactile feedback: scale down on active click (`active:scale-[0.98]`).
- Micro-shadow glow for primary actions.

### 3. Typography & Hierarchy
Never use the same weight or size across adjacent labels. Build strong, scannable reading rhythm:
- **Títulos:** Bold uppercase typography with compact tracking.
- **Subtítulos:** Technical, monospaced labels indicating context.
- **Cuerpo:** Normal-case, light weights with generous line-height (`leading-relaxed`).
- **Meta-labels/Códigos:** Monospaced micro-labels with solid contrast.

### 4. Spacing & Breathing Room
- Double the standard spacing between elements and sections (`py-20`, `gap-8`, `space-y-6`).
- Provide abundant white space to allow users to focus on single objects.

### 5. Color & Highlights
- Use neutral bases (zinc, slate) but create depth with different materials and subtle opacity levels.
- Apply high-contrast brand color highlights (`primaryColor`) strictly for interactive accents and primary action elements.
- Avoid flat colors; use radial gradients for background atmospheres.

### 6. Micro-Interactions
- Smooth transition durations (`transition-all duration-300`).
- Hover scales, subtle rotate animations for status symbols, and inline animations.
