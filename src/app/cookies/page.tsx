import { Metadata } from "next";
import Link from "next/link";
import { ROUTES } from "@/lib/routes";
import { getTenantBranding } from "@/web/actions/branding";
import { getBrandingDefaults } from "@/platform/branding/branding-defaults";

export const metadata: Metadata = {
  title: "Política de Cookies",
};

export default async function CookiesPage(props: { searchParams: Promise<{ tenant?: string }> }) {
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
            Política de Cookies
          </h1>
          <p className="text-xs text-stone-500 mt-1 font-mono">
            Última actualización: Julio 2026
          </p>

          <div className="mt-8 space-y-6 text-sm text-stone-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="font-bold text-stone-900 text-base">
                1. Qué usamos
              </h2>
              <p>
                Este sitio y el portal de {siteName} no utilizan cookies de
                rastreo ni comparten datos de navegación con terceros
                publicitarios. Usamos únicamente almacenamiento local del
                navegador (localStorage), no cookies en sentido estricto,
                para recordar preferencias funcionales como el tema de
                visualización del portal.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-stone-900 text-base">
                2. Cookies de sesión (autenticación)
              </h2>
              <p>
                El inicio de sesión al portal de clientes y al panel interno
                utiliza cookies estrictamente necesarias para mantener la
                sesión autenticada. Estas no se usan con fines publicitarios
                ni de rastreo entre sitios, y se eliminan al cerrar sesión.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-stone-900 text-base">
                3. Control desde tu navegador
              </h2>
              <p>
                Puedes eliminar el almacenamiento local o las cookies de
                sesión en cualquier momento desde la configuración de tu
                navegador. Esto puede requerir que vuelvas a iniciar sesión.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-bold text-stone-900 text-base">
                4. Contacto
              </h2>
              <p>
                Preguntas sobre esta política:{" "}
                <span className="font-mono text-stone-900">{contactEmail}</span>
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
