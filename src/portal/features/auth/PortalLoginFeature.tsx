 
"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Lock, Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import { getBrandingDefaults } from "@/platform/branding/branding-defaults";
import { loginPortal } from "@/portal/actions/auth";
import { isSafeRedirect } from "@/utils/auth-redirect";
import { getPortalBrowserClient } from "@/platform/auth/clients";

const loginSchema = z.object({
  email: z.string().email("Correo no válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginFields = z.infer<typeof loginSchema>;

export function PortalLoginFeature() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const rawRedirect = searchParams.get("redirect") || "/portal";
  const redirectTo = isSafeRedirect(rawRedirect) ? rawRedirect : "/portal";
  const defaults = getBrandingDefaults(tenantParam);

  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  React.useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFields) => {
    setIsLoading(true);
    setAuthError(null);

    const result = await loginPortal(
      data.email,
      data.password,
      tenantParam,
      redirectTo
    );

    if (!result.success) {
      setAuthError(result.error ?? "Error desconocido");
      setIsLoading(false);
      return;
    }

    // Hidratar la sesión en el cliente (localStorage) para que autoRefreshToken
    // mantenga la sesión viva y llame a /api/auth/sync-token antes de que
    // el cookie HttpOnly de 1h expire. Las cookies ya fueron fijadas server-side.
    if (result.session) {
      const supabase = getPortalBrowserClient();
      await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });
    }

    router.push(result.redirectTo!);
  };

  const siteUrl = tenantParam ? `/?tenant=${tenantParam}` : "/";
  const companyName = defaults.nombre_comercial;

  return (
    <div className="min-h-screen bg-[var(--ds-c-marketing-cfm-background)] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(var(--ds-c-marketing-hero-slide-accent-2) 1px, transparent 1px), linear-gradient(90deg, var(--ds-c-marketing-hero-slide-accent-2) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Glow top-center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary/10 blur-[80px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo / company */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 border border-primary/30 mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary mb-1">
            Portal de Clientes
          </p>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            {companyName}
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Proyectos · Facturas · Soporte
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-2xl shadow-black/40">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {authError && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                <span className="mt-px shrink-0">⚠</span>
                <span>{authError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="tu@empresa.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/60 focus:bg-white/[0.07] transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Contraseña
                </label>
                <Link
                  href={`/recovery${tenantParam ? `?tenant=${tenantParam}` : ""}`}
                  className="text-[11px] text-primary hover:text-primary/80 transition-colors"
                >
                  ¿La olvidaste?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/60 focus:bg-white/[0.07] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Ingresar al Portal"
              )}
            </button>
          </form>
        </div>

        <div className="mt-5 text-center">
          <Link
            href={siteUrl}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" strokeWidth={1.5} />
            Volver al sitio
          </Link>
        </div>
      </div>
    </div>
  );
}
