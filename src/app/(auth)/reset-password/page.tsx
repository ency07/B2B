"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { getTenantConfig } from "@/platform/tenant/tenant";
import { getErpBrowserClient } from "@/platform/auth/clients";
const supabase = getErpBrowserClient();

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type ResetPasswordFields = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const config = getTenantConfig(tenantParam);

  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);
  const [hasSession, setHasSession] = React.useState<boolean | null>(null);

  // Gate: solo permitir acceso si hay una sesion de recovery valida
  // (proveniente del enlace del email). Esto evita que la pagina se
  // renderice para visitantes sin token.
  React.useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setHasSession(!!session);
      if (!session) {
        router.replace(`/recovery${tenantParam ? `?tenant=${tenantParam}` : ""}`);
      }
    });
    return () => {
      mounted = false;
    };
  }, [router, tenantParam]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFields>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFields) => {
    setIsLoading(true);
    setAuthError(null);

    // Supabase maneja el token OTP automáticamente desde la URL del email de recuperación
    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    setIsLoading(false);

    if (error) {
      setAuthError(
        "No se pudo actualizar la contraseña. El enlace puede haber expirado. Solicita uno nuevo."
      );
      return;
    }

    setIsSuccess(true);

    // Solo cerrar sesion si la sesion actual es de tipo "recovery" (aud
    // claim). Si es una sesion normal del usuario, NO cerrarla — el
    // usuario sigue autenticado con su nueva contrasena.
    const { data: { session } } = await supabase.auth.getSession();
    const sessionUser = session?.user as { aud?: string } | undefined;
    if (session && sessionUser?.aud === "recovery") {
      await supabase.auth.signOut();
    }
  };

  return (
    <div className="space-y-6">
      {hasSession === null ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Verificando enlace de recuperación...
        </div>
      ) : hasSession === false ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Redirigiendo a la página de recuperación...
        </div>
      ) : isSuccess ? (
        <div className="space-y-4 text-center">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl inline-block">
            <CheckCircle2 className="w-8 h-8 mx-auto" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Contraseña restablecida</h2>
          <p className="text-sm text-muted-foreground">
            Tu contraseña ha sido modificada con éxito. Ahora puedes acceder de nuevo.
          </p>
          <Link
            href={`/login${tenantParam ? `?tenant=${tenantParam}` : ""}`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all cursor-pointer mt-4"
          >
            Iniciar Sesión <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-xs text-muted-foreground text-center">
            Introduce y confirma tu nueva contraseña de acceso.
          </p>

          {authError && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium">
              {authError}{" "}
              <Link
                href={`/recovery${tenantParam ? `?tenant=${tenantParam}` : ""}`}
                className="underline font-semibold"
              >
                Solicitar nuevo enlace
              </Link>
            </div>
          )}

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Nueva Contraseña
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-destructive mt-0.5">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Confirmar Contraseña
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-4 h-4 text-muted-foreground shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                {...register("confirmPassword")}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full pl-10 pr-10 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-hidden focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-destructive mt-0.5">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Restablecer Contraseña <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Return to Login Link */}
      {!isSuccess && (
        <div className="flex justify-center border-t border-border pt-4">
          <Link
            href={`/login${tenantParam ? `?tenant=${tenantParam}` : ""}`}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inicio de Sesión
          </Link>
        </div>
      )}
    </div>
  );
}
