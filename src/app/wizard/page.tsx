import React, { Suspense } from "react";
import { getTenantSettings } from "@/erp/actions/core";;
import WizardStepper from "@/web/components/WizardStepper";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { searchParams: Promise<{ tenant?: string }> }): Promise<Metadata> {
  try {
    const searchParams = await props.searchParams;
    const tenant = searchParams.tenant || "acme";
    const branding = await getTenantSettings(tenant);
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
  let branding = {};

  try {
    branding = await getTenantSettings(tenant);
  } catch (error) {
    console.error("Error al cargar branding en el Wizard:", error);
  }

  return (
    <main className="flex flex-col min-h-screen bg-zinc-50 text-zinc-900 py-12 px-6 justify-center items-center relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-100 via-zinc-50 to-zinc-50 pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-4xl">
        <Suspense fallback={
          <div className="w-full max-w-4xl bg-white border border-zinc-200 rounded-2xl p-12 text-center text-zinc-500 shadow-sm">
            Cargando asistente de preingeniería...
          </div>
        }>
          <WizardStepper branding={branding} tenantCode={tenant} />
        </Suspense>
      </div>
    </main>
  );
}

