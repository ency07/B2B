"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { getTenantConfig } from "@/platform/tenant/tenant";
import { getErpBrowserClient } from "@/platform/auth/clients";
const supabase = getErpBrowserClient();

const recoverySchema = z.object({
  email: z.string().email("Correo electrónico no válido"),
});

type RecoveryFields = z.infer<typeof recoverySchema>;

export default function RecoveryPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");
  const config = getTenantConfig(tenantParam);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isSent, setIsSent] = React.useState(false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RecoveryFields>({
    resolver: zodResolver(recoverySchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: RecoveryFields) => {
    setIsLoading(true);
    setAuthError(null);

    // La URL de redirección tras hacer clic en el enlace del email
    const redirectTo = `${window.location.origin}/reset-password${
      tenantParam ? `?tenant=${tenantParam}` : ""
    }`;

    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo,
    });

    setIsLoading(false);

    if (error) {
      setAuthError("No se pudo enviar el enlace. Verifica el correo ingresado.");
      return;
    }

    setIsSent(true);
  };

  const handleResend = async () => {
    const email = getValues("email");
    if (!email) return;
    setIsLoading(true);
    setAuthError(null);
    const redirectTo = `${window.location.origin}/reset-password${
      tenantParam ? `?tenant=${tenantParam}` : ""
    }`;
    await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      {isSent ? (
        <div className="space-y-4 text-center">
          <div className="p-3 bg-primary/10 text-primary rounded-xl inline-block">
            <Mail className="w-8 h-8 mx-auto" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Revisa tu bandeja de entrada</h2>
          <p className="text-sm text-muted-foreground">
            Hemos enviado un enlace de recuperación a tu dirección de correo electrónico.
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={isLoading}
            className="text-xs text-primary hover:underline font-medium block mx-auto mt-2 disabled:opacity-50"
          >
            {isLoading ? "Reenviando..." : "Reenviar correo electrónico"}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <p className="text-xs text-muted-foreground text-center">
            Introduce el correo de tu cuenta y te enviaremos las instrucciones de restablecimiento.
          </p>

          {authError && (
            <div className="px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive font-medium">
              {authError}
            </div>
          )}

          {/* Email Field */}
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
                Enviar Instrucciones <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Return to Login */}
      <div className="flex justify-center border-t border-border pt-4">
        <Link
          href={`/login${tenantParam ? `?tenant=${tenantParam}` : ""}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al Inicio de Sesión
        </Link>
      </div>
    </div>
  );
}
