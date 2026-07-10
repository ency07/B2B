import { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTenantBranding } from "@/web/actions/branding";
import { getCurrentClient } from "@/lib/portal-auth";
import {
  getClientJobs,
  getClientInvoices,
  getClientPayments,
  getClientTickets,
  getClientMessages,
  getClientRequirements,
} from "@/portal/actions/portal";
import { buildLoginUrl } from "@/utils/auth-redirect";
import { ROUTES } from "@/lib/routes";
import CustomerPortalClient from "./client/page";

import { supabaseAdmin } from "@/platform/auth/clients";

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params = await searchParams;
  const tenantParam =
    typeof params.tenant === "string" ? params.tenant : null;

  try {
    const branding = await getTenantBranding(tenantParam);
    const companyName = branding?.nombre_comercial || "Portal de Clientes";
    return {
      title: `${companyName} — Portal`,
    };
  } catch {
    return { title: "Portal de Clientes" };
  }
}

async function hasAccessTokenCookie(): Promise<boolean> {
  try {
    const store = await cookies();
    return Boolean(
      store.get("sb-portal-access-token")?.value
    );
  } catch {
    return false;
  }
}

export default async function PortalPage({ searchParams }: Props) {
  const params = await searchParams;
  const tenantParam =
    typeof params.tenant === "string" ? params.tenant : null;
  const previewClientId =
    typeof params.client_id === "string" ? params.client_id : null;

  // P8 - portal: validar sesion y obtener client del usuario.
  const currentClient = await getCurrentClient(previewClientId);

  // Si el tenant en la URL no coincide con el tenant del cliente, redirigir
  // automáticamente al portal correcto en lugar de mostrar un error.
  if (
    currentClient &&
    tenantParam &&
    !currentClient.isPlatformAdmin &&
    currentClient.tenantCode !== tenantParam
  ) {
    redirect(`/portal?tenant=${currentClient.tenantCode || ""}`);
  }

  if (!currentClient) {
    // Distinguir dos casos para no caer en bucle:
    // 1) No hay sesión → redirigir a /login (legítimo).
    // 2) Hay sesión pero el usuario no tiene client asignado → mostrar
    //    estado de error visible, NO redirigir (sino loop infinito).
    if (!(await hasAccessTokenCookie())) {
      const loginUrl = buildLoginUrl(ROUTES.LOGIN, {
        tenant: tenantParam,
        redirectTo: ROUTES.PORTAL,
      });
      redirect(loginUrl);
    }

    return <PortalNoClientAssigned />;
  }

  // Cargar datos del client (per-client filtering por client_id).
  const [jobs, invoices, payments, tickets, messages, requirements] = await Promise.all([
    getClientJobs(previewClientId),
    getClientInvoices(previewClientId),
    getClientPayments(previewClientId),
    getClientTickets(previewClientId),
    getClientMessages(previewClientId),
    getClientRequirements(previewClientId),
  ]);

  // Documentos tecnicos asociados a las OTs del cliente
  let documents: Array<{ id: string; name: string; type: string; url: string }> = [];
  if (supabaseAdmin && jobs.length > 0) {
    const jobIds = jobs.map(j => j.id);
    const { data: docsData } = await supabaseAdmin
      .from("documents")
      .select("id, file_name, document_type, storage_path, storage_provider")
      .in("entity_id", jobIds)
      .eq("entity_type", "JOB")
      .eq("tenant_id", currentClient.tenantId)
      .eq("status", "PUBLICADO")
      .is("deleted_at", null)
      .order("uploaded_at", { ascending: false });

    if (docsData) {
      const bucketUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/`
        : "";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents = docsData.map((d: any) => ({
        id: d.id,
        name: d.file_name,
        type: d.document_type,
        url: `${bucketUrl}${d.storage_path}`,
      }));
    }
  }

  // Si es platform admin, traer la lista de todas las empresas clientes para el switcher
  let allClients: Array<{ id: string; legalName: string; tenantCode: string }> = [];
  if (currentClient.isPlatformAdmin && supabaseAdmin) {
    const { data: clientsData } = await supabaseAdmin
      .from("clients")
      .select("id, legal_name, tenants(tenant_code)")
      .is("deleted_at", null)
      .order("legal_name", { ascending: true });

    if (clientsData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      allClients = clientsData.map((c: any) => ({
        id: c.id,
        legalName: c.legal_name,
        tenantCode: c.tenants?.tenant_code || "default",
      }));
    }
  }

  return (
    <CustomerPortalClient
      clientInfo={{
        legalName: currentClient.legalName,
        taxId: currentClient.taxId,
        email: currentClient.email,
      }}
      jobs={jobs}
      invoices={invoices}
      payments={payments}
      tickets={tickets}
      messages={messages}
      previewClientId={previewClientId}
      isPlatformAdmin={!!currentClient.isPlatformAdmin}
      isClientContact={!!currentClient.isClientContact}
      allClients={allClients}
      documents={documents}
      requirements={requirements}
    />
  );
}


/**
 * Estado visible cuando el usuario está autenticado pero no tiene un client
 * asociado. Antes este caso caía en un loop /portal -> /login -> /portal.
 */
function PortalNoClientAssigned() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M4.93 4.93l14.14 14.14M12 21a9 9 0 100-18 9 9 0 000 18z"
            />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-stone-900 tracking-tight">
          Tu cuenta no tiene un cliente asociado
        </h1>
        <p className="mt-2 text-sm text-stone-600 leading-relaxed">
          Estás autenticado, pero aún no hemos vinculado tu usuario a una
          empresa cliente. Si acabas de registrarte, tu ejecutivo comercial
          completará la asignación en breve.
        </p>
        <p className="mt-4 text-xs text-stone-500">
          ¿Necesitas ayuda? Escríbenos a{" "}
          <a
            className="text-stone-900 underline"
            href="mailto:soporte@ventitech.com"
          >
            soporte@ventitech.com
          </a>
          .
        </p>
        <form action="/api/auth/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="inline-flex h-9 items-center justify-center rounded-md border border-stone-300 bg-white px-4 text-xs font-semibold uppercase tracking-widest text-stone-700 hover:bg-stone-50"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  );
}
