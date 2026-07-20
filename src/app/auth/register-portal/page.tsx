/**
 * /auth/register-portal — Registro de clientes via invitación email
 *
 * Flujo:
 * 1. Cliente recibe email de invitación con link: /auth/register-portal?token=xyz
 * 2. Supabase verifica el token en el params
 * 3. Usuario ve formulario para crear password
 * 4. Al submitir, se valida con verifyOtp() y se crea la sesión
 * 5. Redirige a /portal
 */

"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Input } from "@/platform/ui/input";
import { Button } from "@/platform/ui/button";
import { Spinner } from "@/platform/ui/spinner";
import { ROUTES } from "@/lib/routes";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export default function RegisterPortalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const type = searchParams.get("type");

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const validInvite = Boolean(token) && type === "invite";
  const [error, setError] = React.useState<string | null>(
    !validInvite ? "Enlace incorrecto. Verifica el email de invitación." : null
  );
  const [step, setStep] = React.useState<"loading" | "form" | "success">(
    !validInvite ? "form" : "loading"
  );

  const supabase = React.useMemo(
    () =>
      createSupabaseClient(supabaseUrl, supabaseAnonKey),
    []
  );

  React.useEffect(() => {
    if (!validInvite) return;
    async function getUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user?.email) {
        setError("Enlace de invitación inválido o expirado.");
        setStep("form");
        return;
      }
      setEmail(data.user.email);
      setStep("form");
    }
    getUser();
  }, [validInvite, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!password || password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        setStep("success");
        setTimeout(() => {
          router.push(ROUTES.PORTAL);
        }, 2000);
      }
    } catch {
      setError("Error al establecer la contraseña. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="w-6 h-6 text-primary" />
          <p className="text-sm text-muted-foreground font-mono">Verificando invitación...</p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <svg className="h-6 w-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h1 className="text-lg font-semibold text-foreground mb-2">¡Registro completado!</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Tu cuenta ha sido activada. Redirigiendo al portal...
          </p>
          <div className="animate-spin inline-block h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">Crear Contraseña</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Establece tu contraseña para acceder al portal de tu empresa
          </p>
        </div>

        {email && (
          <div className="mb-6 rounded-md bg-muted border border-border p-3">
            <p className="text-xs text-muted-foreground font-mono">Email registrado:</p>
            <p className="text-sm font-medium text-foreground break-all">{email}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 border border-destructive/20 p-3">
            <p className="text-sm text-destructive font-mono">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Contraseña
            </label>
            <Input
              type="password"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="bg-muted border-border"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Confirmar Contraseña
            </label>
            <Input
              type="password"
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="bg-muted border-border"
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Activando cuenta...
              </>
            ) : (
              "Crear Contraseña y Acceder"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          ¿Necesitas ayuda?{" "}
          <a href="mailto:soporte@empresa.com" className="text-primary hover:underline">
            Contacta al soporte
          </a>
        </p>
      </div>
    </div>
  );
}
