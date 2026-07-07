import React from "react";
import { getTenantBranding } from "@/web/actions/branding";
import { getIndustrialCatalog, CatalogCategory } from "@/web/actions/catalog";
import { MarketingShell } from "@/web/components/marketing-v2/MarketingShell";
import { Metadata } from "next";
import { getBrandingDefaults, type BrandingConfig } from "@/platform/branding/branding-defaults";

// Forzar revalidación dinámica
export const dynamic = "force-dynamic";

export async function generateMetadata(props: { searchParams: Promise<{ tenant?: string }> }): Promise<Metadata> {
  const searchParams = await props.searchParams;
  const tenant = searchParams.tenant || "acme";

  // getTenantBranding es de solo lectura (sin auth) y trae el branding real
  // configurado en el CMS — usar siempre esta función, no getPublicTenantSettings,
  // que consulta claves obsoletas que ya no existen en BrandingConfig.
  const branding = await getTenantBranding(tenant);
  const defaults = getBrandingDefaults(tenant);
  const siteTitle =
    branding.titulo_navegador || branding.meta_title || branding.nombre_comercial || defaults.nombre_comercial;
  const favicon = branding.favicon_url || "/favicon.ico";
  const description = branding.meta_description || defaults.meta_description;
  const keywords = branding.meta_keywords || defaults.meta_keywords;
  const ogImage = branding.landing_imagen_url || "/industrial_plant_ventilation.webp";
  return {
    title: siteTitle,
    description,
    keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
    icons: {
      icon: favicon,
    },
    openGraph: {
      title: siteTitle,
      description,
      images: [{ url: ogImage }],
      locale: "es_CO",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description,
      images: [ogImage],
    },
  };
}


export default async function Home(props: { searchParams: Promise<{ tenant?: string }> }) {
  const searchParams = await props.searchParams;
  const tenant = searchParams.tenant || "acme";

  // Branding real del tenant (sin auth) — usa defaults si falla
  let branding: BrandingConfig = getBrandingDefaults(tenant);
  try {
    branding = await getTenantBranding(tenant);
  } catch (error) {
    console.error("[Landing] Branding público no disponible, usando defaults:", error);
  }

  // Catálogo: crítico — si falla, Next.js muestra error.tsx con botón Reintentar
  const catalog: CatalogCategory[] = await getIndustrialCatalog(tenant);

  return <MarketingShell catalog={catalog} branding={branding as unknown as Record<string, unknown>} tenantCode={tenant} />;
}


