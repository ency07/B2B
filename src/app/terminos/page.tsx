import { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { getTenantBranding } from "@/web/actions/branding";
import { getBrandingDefaults } from "@/platform/branding/branding-defaults";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
};

export default async function TerminosPage(props: { searchParams: Promise<{ tenant?: string }> }) {
  const searchParams = await props.searchParams;
  const tenant = searchParams.tenant || "acme";
  const defaults = getBrandingDefaults(tenant);
  let branding = defaults;
  try {
    branding = await getTenantBranding(tenant);
  } catch {
    // Si falla, se usan los defaults — página informativa, no crítica.
  }
  const siteName = branding.nombre_comercial || defaults.nombre_comercial;
  const contactEmail = branding.email_corporativo || defaults.email_corporativo;
  const contactPhone = branding.telefono_principal || defaults.telefono_principal;

  return (
    <main className="min-h-screen bg-stone-50 py-16 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href={ROUTES.HOME}
          className="text-xs font-mono text-stone-500 hover:text-stone-900 underline underline-offset-2"
        >
          &larr; Volver al inicio
        </Link>

        <div className="rounded-2xl border border-stone-200 bg-white p-8 sm:p-12 shadow-sm">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">
            Términos y Condiciones
          </h1>
          <p className="text-xs text-stone-500 mt-1 font-mono">
            En preparación
          </p>

          <div className="mt-8 space-y-4 text-sm text-stone-700 leading-relaxed">
            <p>
              Los términos y condiciones comerciales de {siteName} (alcance de
              servicio, garantías, condiciones de pago y responsabilidades)
              están siendo formalizados por nuestro equipo legal. Esta página
              se actualizará con el documento completo tan pronto esté listo.
            </p>
            <p>
              Si necesitas los términos aplicables a una cotización o contrato
              en curso, contáctanos directamente:
            </p>
            <p className="font-mono text-stone-900">
              {contactEmail} · {contactPhone}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
