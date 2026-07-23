 
 
 
import React, { Suspense } from "react";
import { getTenantBranding } from "@/web/actions/branding";
import WizardStepper from "@/web/components/WizardStepper";
import { Metadata } from "next";
import { getBrandingDefaults, type BrandingConfig } from "@/platform/branding/branding-defaults";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { searchParams: Promise<{ tenant?: string }> }): Promise<Metadata> {
  try {
    const searchParams = await props.searchParams;
    const tenant = searchParams.tenant || "acme";
    // getTenantBranding es de solo lectura y no requiere auth — el Wizard es
    // una página pública. getTenantSettings (usado antes) exige sesión y
    // fallaba silenciosamente para todo visitante anónimo.
    const branding = await getTenantBranding(tenant);
    const siteName = branding.nombre_comercial || "Sistemas de Ventilación";
    const title = branding.titulo_navegador || `Cotizador Inteligente HVAC | ${siteName}`;
    const favicon = branding.favicon_url || "/favicon.ico";
    return {
      title,
      description: "Wizard inteligente de preingeniería HVAC. Calcule caudales CFM, volumen y obtenga una estimación presupuestal inmediata.",
      icons: {
        icon: favicon,
      }
    };
  } catch (e) {
    return {
      title: "Cotizador Inteligente HVAC",
      description: "Wizard inteligente de preingeniería HVAC.",
    };
  }
}

export default async function WizardPage(props: { searchParams: Promise<{ tenant?: string }> }) {
  const searchParams = await props.searchParams;
  const tenant = searchParams.tenant || "acme";
  let branding: BrandingConfig = getBrandingDefaults(tenant);

  try {
    branding = await getTenantBranding(tenant);
  } catch (error) {
    console.error("Error al cargar branding en el Wizard:", error);
  }

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Suspense fallback={
        <div className="max-w-[1600px] mx-auto p-12 text-center text-ink-soft">
          Cargando asistente de preingeniería...
        </div>
      }>
        <WizardStepper branding={branding} tenantCode={tenant} />
      </Suspense>
    </main>
  );
}

