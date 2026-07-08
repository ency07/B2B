"use client";

import * as React from "react";
import { User, Lock, Mail, LogOut, X } from "lucide-react";
import { toast } from "sonner";
import { updateClientPassword } from "@/portal/actions/profile";
import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Spinner } from "@/platform/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/platform/ui/dialog";

interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientEmail: string;
  clientName: string;
}

export function ClientProfileModal({
  isOpen,
  onClose,
  clientEmail,
  clientName,
}: ClientProfileModalProps) {
  const [tab, setTab] = React.useState<"info" | "password">("info");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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
          <button
            onClick={() => setTab("info")}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "info"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Información
          </button>
          <button
            onClick={() => setTab("password")}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === "password"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Seguridad
          </button>
        </div>

        {tab === "info" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Nombre
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
