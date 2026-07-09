import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getAuthContext } from "@/platform/auth/server-guards";
import { DashboardShell } from "@/erp/components/dashboard-shell";
import { CLIENT_ROLE, PORTAL_PATH } from "@/lib/role-permissions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAuthContext();

  if (!ctx) {
    redirect("/login?redirect=/dashboard");
  }

  if (ctx.role === CLIENT_ROLE) {
    redirect(PORTAL_PATH);
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] font-mono text-muted-foreground uppercase tracking-widest">
              Cargando...
            </p>
          </div>
        </div>
      }
    >
      <DashboardShell role={ctx.role} userId={ctx.userId}>
        {children}
      </DashboardShell>
    </Suspense>
  );
}
