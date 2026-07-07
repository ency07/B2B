"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowRight, ArrowLeft, Eye, EyeOff, Lock, Mail, Building2 } from "lucide-react";
import { getTenantConfig } from "@/platform/tenant/tenant";
import { getBrandingDefaults } from "@/platform/branding/branding-defaults";
import { getErpBrowserClient } from "@/platform/auth/clients";
import { applyTenantToPath, isSafeRedirect } from "@/utils/auth-redirect";
import { cn } from "@/platform/utils/cn";
import { getUserRole } from "@/platform/users/users";
import { useTheme } from "next-themes";

const loginSchema = z.object({
  email: z.string().email("Correo electrónico no válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFields = z.infer<typeof loginSchema>;

export function ErpLoginFeature() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const rawRedirect = searchParams.get("redirect") || "/dashboard";
  const redirectTo = isSafeRedirect(rawRedirect) ? rawRedirect : "/dashboard";
  const config = getTenantConfig(tenantParam);
  const defaults = getBrandingDefaults(tenantParam);
  const companyName = defaults.nombre_comercial;
  const companyRazon = defaults.razon_social;

  const supabase = getErpBrowserClient();
  const { resolvedTheme } = useTheme();

  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const root = document.documentElement;
    if (config.theme) {
      if (config.theme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      root.style.setProperty("--primary", config.primaryColor);
      root.style.setProperty("--ring", config.primaryColor);
    } else {
      if (resolvedTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      root.style.removeProperty("--primary");
      root.style.removeProperty("--ring");
    }
  }, [config, resolvedTheme]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFields) => {
    setIsLoading(true);
    setAuthError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      setAuthError(
        error.message === "Invalid login credentials"
          ? "Credenciales incorrectas. Verifica tu correo y contraseña."
          : error.message
      );
      setIsLoading(false);
      return;
    }

    let destination = applyTenantToPath(redirectTo, tenantParam);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const userRole = await getUserRole(user.id);
        if (userRole === "CLIENTE") {
           // Cliente cannot enter ERP, they are redirected to portal
           destination = applyTenantToPath("/portal", tenantParam);
        }
      }
    } catch (err) {
      console.error("Error al obtener rol del usuario en login:", err);
    }

    router.push(destination);
    router.refresh();
  };

  const submitLabel = `Entrar a ${defaults.nombre_erp}`;
  const siteUrl = tenantParam ? `/?tenant=${tenantParam}` : "/";

  return (
    <>
      {config.theme && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --primary: ${config.primaryColor} !important;
                --ring: ${config.primaryColor} !important;
              }
            `,
          }}
        />
      )}
      <div className="min-h-screen flex items-center justify-center p-4 transition-colors duration-300 bg-gradient-to-br from-background via-background to-muted/40">
        <div className="w-full max-w-md">
          <ErpLoginHeader companyName={companyName} companyRazon={companyRazon} />

          <div className="mt-6 p-8 rounded-2xl border border-border bg-card shadow-xl backdrop-blur-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {authError && (
                <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium">
                  {authError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-3 w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="nombre@empresa.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-destructive mt-0.5">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Contraseña
                  </label>
                  <Link
                    href={`/recovery${tenantParam ? `?tenant=${tenantParam}` : ""}`}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    ¿La olvidaste?
                  </Link>
                </div>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive mt-0.5">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {submitLabel} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 border-t border-border flex justify-center mt-6">
              <Link
                href={siteUrl}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
                Volver al sitio web
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ErpLoginHeader({ companyName, companyRazon }: { companyName: string; companyRazon: string; }) {
  return (
    <div className="text-center space-y-3">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-lg">
        <Building2 className="w-7 h-7" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border bg-primary/10 text-primary border-primary/30">
          Panel de Gestión
        </span>
      </div>
      <h1 className="text-[20px] font-semibold text-foreground tracking-tight">{companyName}</h1>
      <p className="text-[12px] text-muted-foreground">{companyRazon}</p>
    </div>
  );
}
