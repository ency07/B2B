"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Lock, Mail, LayoutGrid } from "lucide-react";
import Image from "next/image";
import { getBrandingDefaults } from "@/platform/branding/branding-defaults";
import { loginErp } from "@/erp/actions/auth";
import { isSafeRedirect } from "@/utils/auth-redirect";
import { getErpBrowserClient } from "@/platform/auth/clients";

const loginSchema = z.object({
  email: z.string().email("Correo no válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type LoginFields = z.infer<typeof loginSchema>;

export function ErpLoginFeature() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const rawRedirect = searchParams.get("redirect") || "/dashboard";
  const redirectTo = isSafeRedirect(rawRedirect) ? rawRedirect : "/dashboard";
  const defaults = getBrandingDefaults(tenantParam);

  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  // ERP always uses light mode — consistent internal tool experience
  React.useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFields) => {
    setIsLoading(true);
    setAuthError(null);

    const result = await loginErp({
      email: data.email,
      password: data.password,
      tenant: tenantParam,
      redirect: redirectTo,
    });

    if (!result.success) {
      setAuthError(result.error ?? "Error desconocido");
      setIsLoading(false);
      return;
    }

    // Hidratar la sesión en el cliente (localStorage) para que el
    // dashboard layout pueda leerla con supabase.auth.getUser().
    // Las cookies HttpOnly ya fueron fijadas server-side en loginErp.
    if (result.session) {
      const supabase = getErpBrowserClient();
      await supabase.auth.setSession({
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
      });
    }

    // router.refresh() eliminado: se ejecutaría antes de que router.push()
    // complete la navegación (no es awaitable), reiniciando el formulario.
    router.push(result.redirectTo!);
  };

  const companyName = defaults.nombre_comercial;
  const companyRazon = defaults.razon_social;
  const logoLoginUrl = defaults.logo_login_url;
  const initials = companyName
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-paper flex">
      {/* ── Left branding panel (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between bg-slate-900 p-10 shrink-0 relative overflow-hidden">
        {/* Subtle dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
<div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              {logoLoginUrl ? (
                <Image
                  src={logoLoginUrl}
                  alt={companyName}
                  width={140}
                  height={36}
                  className="h-8 w-auto object-contain brightness-0 invert"
                />
              ) : (
                <>
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/10 text-white font-bold text-sm font-mono">
                    {initials}
                  </div>
                  <span className="text-white/80 text-sm font-medium">{companyName}</span>
                </>
              )}
            </div>

          <div className="space-y-3">
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-400">
              Sistema Interno
            </p>
            <h2 className="text-3xl font-semibold text-white leading-tight tracking-tight">
              Panel de<br />Gestión ERP
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-[280px]">
              Acceso exclusivo para personal autorizado de {companyRazon}.
            </p>
          </div>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-3">
          {[
            "Gestión de clientes y CRM",
            "Cotizaciones y facturación",
            "Tickets de soporte",
            "KPIs y reportes",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-slate-400 text-xs">
              <LayoutGrid className="w-3 h-3 text-slate-500 shrink-0" />
              {item}
            </div>
          ))}
          <p className="text-[10px] text-slate-600 mt-4 font-mono">
            ACCESO RESTRINGIDO · SOLO PERSONAL AUTORIZADO
          </p>
        </div>
      </div>

      {/* ── Right: login form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          {logoLoginUrl ? (
            <Image
              src={logoLoginUrl}
              alt={companyName}
              width={120}
              height={30}
              className="h-7 w-auto mx-auto object-contain brightness-0 mb-2"
            />
          ) : (
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white font-bold text-sm font-mono mb-2">
              {initials}
            </div>
          )}
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider">
            Sistema Interno
          </p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
              Iniciar sesión
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Ingresa con tu cuenta corporativa
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {authError && (
              <div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {authError}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  {...register("email")}
                  placeholder="nombre@empresa.com"
                  autoComplete="email"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition-all"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-700">
                  Contraseña
                </label>
                <Link
                  href={`/recovery${tenantParam ? `?tenant=${tenantParam}` : ""}`}
                  className="text-[11px] text-slate-500 hover:text-slate-700 transition-colors"
                >
                  ¿La olvidaste?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Entrar al panel"
              )}
            </button>
          </form>

          <p className="mt-6 text-[11px] text-slate-400 text-center font-mono">
            ¿No tienes acceso?{" "}
            <span className="text-slate-500">Contacta a tu administrador</span>
          </p>
        </div>
      </div>
    </div>
  );
}
