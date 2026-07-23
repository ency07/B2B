"use client";

import * as React from "react";
import { User, Lock, Mail, LogOut, Pencil } from "lucide-react";
import { toast } from "sonner";
import { updateClientPassword, getClientContactInfo, updateClientContactName } from "@/portal/actions/profile";
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
  clientNit: string;
}

export function ClientProfileModal({
  isOpen,
  onClose,
  clientEmail,
  clientName,
  clientNit,
}: ClientProfileModalProps) {
  const [tab, setTab] = React.useState<"info" | "password">("info");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Nombre del CONTACTO (persona), distinto de clientName (razón social de
  // la empresa, viene por prop y nunca es editable acá). Se carga aparte
  // porque el padre solo pasa datos de la empresa — ver getClientContactInfo().
  const [contactFirstName, setContactFirstName] = React.useState("");
  const [contactLastName, setContactLastName] = React.useState("");
  const [editingName, setEditingName] = React.useState(false);
  const [nameInput, setNameInput] = React.useState({ first: "", last: "" });
  const [savingName, setSavingName] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    getClientContactInfo().then((info) => {
      if (cancelled || !info) return;
      setContactFirstName(info.firstName);
      setContactLastName(info.lastName || "");
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const startEditingName = () => {
    setNameInput({ first: contactFirstName, last: contactLastName });
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (savingName) return;
    setSavingName(true);
    const result = await updateClientContactName(nameInput.first, nameInput.last);
    setSavingName(false);
    if (result.ok) {
      setContactFirstName(nameInput.first.trim());
      setContactLastName(nameInput.last.trim());
      setEditingName(false);
      toast.success("Nombre actualizado");
    } else {
      toast.error(result.error || "No se pudo actualizar el nombre");
    }
  };

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
          {(["info", "password"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "info" ? "Información" : "Seguridad"}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Mi nombre
              </label>
              {editingName ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Nombre"
                      value={nameInput.first}
                      onChange={(e) => setNameInput((p) => ({ ...p, first: e.target.value }))}
                      disabled={savingName}
                    />
                    <Input
                      placeholder="Apellido"
                      value={nameInput.last}
                      onChange={(e) => setNameInput((p) => ({ ...p, last: e.target.value }))}
                      disabled={savingName}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleSaveName} disabled={savingName}>
                      {savingName ? <Spinner size="sm" className="mr-2" /> : null}
                      Guardar
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingName(false)} disabled={savingName}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={startEditingName}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-md bg-background text-sm text-foreground hover:border-primary/40 transition-colors text-left"
                >
                  <span>{[contactFirstName, contactLastName].filter(Boolean).join(" ") || "—"}</span>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </button>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Razón Social
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
              Razón Social, NIT y Email son datos de la empresa — para cambiarlos, contacta al administrador de tu empresa.
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
