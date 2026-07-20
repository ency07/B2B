"use client";

import * as React from "react";
import { User, Lock, Mail, LogOut, Sun, Moon } from "lucide-react";
import { toast } from "sonner";
import { updateClientPassword } from "@/portal/actions/profile";
import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Spinner } from "@/platform/ui/spinner";
import { cn } from "@/platform/utils/cn";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/platform/ui/dialog";
import { useDesignSystem } from "@/design-system/provider/useTheme";

interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientEmail: string;
  clientName: string;
  clientNit: string;
}

export function ClientProfileModal({
  isOpen,
  onClose,
  clientEmail,
  clientName,
  clientNit,
}: ClientProfileModalProps) {
  const [tab, setTab] = React.useState<"info" | "password" | "appearance">("info");
  const { theme, setMode: setDsMode } = useDesignSystem();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const setMode = React.useCallback((value: "light" | "dark") => {
    setDsMode(value);
  }, [setDsMode]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Todos los campos son requeridos");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden");
      return;
    }

    if (newPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    const result = await updateClientPassword(currentPassword, newPassword);
    setLoading(false);

    if (result.ok) {
      toast.success("Contraseña actualizada exitosamente");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTab("info");
    } else {
      setError(result.error || "Error actualizando contraseña");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Mi Perfil
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 border-b border-border mb-6">
          {(["info", "password", "appearance"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "info" ? "Información" : t === "password" ? "Seguridad" : "Apariencia"}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Nombre / Razón Social
              </label>
              <input
                type="text"
                value={clientName}
                disabled
                className="w-full px-3 py-2 border border-border rounded-md bg-muted text-sm text-muted-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                NIT
              </label>
              <input
                type="text"
                value={clientNit}
                disabled
                className="w-full px-3 py-2 border border-border rounded-md bg-muted text-sm text-muted-foreground font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Email
              </label>
              <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-md bg-muted text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                {clientEmail}
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Para cambiar tu email, contacta al administrador de tu empresa.
            </p>
          </div>
        )}

        {tab === "password" && (
          <form onSubmit={handleChangePassword} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
                <p className="text-sm text-destructive font-mono">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Contraseña Actual
              </label>
              <Input
                type="password"
                placeholder="Tu contraseña actual"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Nueva Contraseña
              </label>
              <Input
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Confirmar Nueva Contraseña
              </label>
              <Input
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
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
                  Actualizando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Cambiar Contraseña
                </>
              )}
            </Button>
          </form>
        )}

        {tab === "appearance" && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modo de pantalla</p>
              <div className="grid grid-cols-2 gap-2">
{([
                    { value: "light", label: "Claro", Icon: Sun },
                    { value: "dark",  label: "Oscuro", Icon: Moon },
                  ] as const).map(({ value, label, Icon }) => (
                    <button
                      key={value}
                      onClick={() => setMode(value)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 h-20 rounded-xl border-2 text-xs font-medium transition-all cursor-pointer",
                        theme.mode === value
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border/80"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {label}
                    </button>
                  ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              La preferencia se guarda en este dispositivo y se aplica automáticamente al ingresar.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <form action="/api/auth/signout" method="post">
            <Button type="submit" variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
