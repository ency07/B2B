/**
 * ClientDetail — vista 360 de un cliente (Customer 360).
 *
 * Segun BLUEPRINT_ERP_REDISIGN.md §7.3:
 * - Pane central con tabs (Contexto, Contactos, Cotizaciones, Facturas, etc.)
 * - Inspector con info rapida (owner, etiquetas, danger zone)
 *
 * Ola 7: tabs adicionales (Contactos, Cotizaciones, etc.) son placeholders
 * hasta que cada modulo exponga su endpoint.
 */

"use client";

import * as React from "react";
import {
  X,
  Building2,
  Mail,
  Phone,
  Users,
  FileText,
  Receipt,
  Briefcase,
  FolderOpen,
  GitBranch,
  AlertTriangle,
  Send,
  ShieldOff,
  CheckCircle2,
  Clock,
  Pencil,
  Trash2,
  Plus,
  Save,
  XCircle,
} from "lucide-react";
import {
  getClientContacts,
  inviteContactToPortal,
  revokeContactPortalAccess,
  type ClientContact,
} from "@/portal/actions/invite";
import {
  updateClientContact,
  addClientContact,
  deleteClientContact,
} from "@/portal/actions/contacts";
import { StatusPill } from "@/erp/components/data-list/status-pill";
import type { StatusVariant } from "@/erp/components/data-list/status-dot";
import { cn } from "@/platform/utils/cn";
import type { ClientListItem } from "./client-list";

const statusToVariant: Record<ClientListItem["status"], StatusVariant> = {
  ACTIVO: "success",
  INACTIVO: "danger",
  PENDIENTE: "warning",
  SUSPENDIDO: "danger",
};

const statusToLabel: Record<ClientListItem["status"], string> = {
  ACTIVO: "Activo",
  INACTIVO: "Inactivo",
  PENDIENTE: "Pendiente",
  SUSPENDIDO: "Suspendido",
};

type DetailTab =
  | "contexto"
  | "contactos"
  | "cotizaciones"
  | "facturas"
  | "ordenes"
  | "archivos"
  | "relaciones";

const TABS: {
  id: DetailTab;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}[] = [
  { id: "contexto", label: "Contexto", icon: Building2 },
  { id: "contactos", label: "Contactos", icon: Users },
  { id: "cotizaciones", label: "Cotizaciones", icon: FileText },
  { id: "facturas", label: "Facturas", icon: Receipt },
  { id: "ordenes", label: "Ordenes", icon: Briefcase },
  { id: "archivos", label: "Archivos", icon: FolderOpen },
  { id: "relaciones", label: "Relaciones", icon: GitBranch },
];

export interface ClientDetailProps {
  client: ClientListItem;
  onClose: () => void;
  onArchive?: () => void;
  className?: string;
}

export function ClientDetail({
  client,
  onClose,
  onArchive,
  className,
}: ClientDetailProps) {
  const [tab, setTab] = React.useState<DetailTab>("contexto");

  return (
    <div
      className={cn(
        "h-full flex flex-col",
        "border-l border-line bg-bg-elevated-1",
        className
      )}
    >
      <header className="sticky top-0 z-layer-content border-b border-line bg-bg-elevated-1">
        <div className="flex items-start gap-3 p-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center h-6 w-6 rounded-md text-ink-muted hover:text-ink hover:bg-accent transition-colors cursor-pointer -ml-1.5"
                aria-label="Cerrar detalle"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
              <h2 className="text-[18px] font-semibold text-ink truncate">
                {client.name}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-ink-muted">
              <span>{client.taxId}</span>
              <span>·</span>
              <span>{client.segment}</span>
            </div>
          </div>
        </div>

        <nav
          role="tablist"
          aria-label="Secciones del cliente"
          className="flex items-center gap-1 px-3 overflow-x-auto border-t border-line/50"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 h-10 px-3",
                  "border-b-2 -mb-px",
                  "text-[12px] font-medium whitespace-nowrap",
                  "transition-colors duration-[var(--motion-fast)] ease-erp",
                  "cursor-pointer",
                  active
                    ? "border-primary text-ink"
                    : "border-transparent text-ink-soft hover:text-ink"
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-0">
          <main className="p-5 space-y-6">
            {tab === "contexto" && <ContextoTab client={client} />}
            {tab === "contactos" && <ContactosTab client={client} />}
            {tab !== "contexto" && tab !== "contactos" && <TabPlaceholder tab={tab} />}
          </main>

          <aside className="border-t lg:border-t-0 lg:border-l border-line bg-bg-elevated-1 p-5 space-y-5">
            <InspectorBlock
              title="Estado"
              content={
                <StatusPill
                  variant={statusToVariant[client.status]}
                  label={statusToLabel[client.status]}
                />
              }
            />
            <InspectorBlock
              title="Contacto"
              content={
                <ul className="space-y-1.5 text-[12px]">
                  {client.email && (
                    <li className="inline-flex items-center gap-2 text-ink-soft">
                      <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <a
                        href={`mailto:${client.email}`}
                        className="hover:text-ink transition-colors"
                      >
                        {client.email}
                      </a>
                    </li>
                  )}
                  {client.phone && (
                    <li className="inline-flex items-center gap-2 text-ink-soft">
                      <Phone className="h-3.5 w-3.5" strokeWidth={1.5} />
                      <a
                        href={`tel:${client.phone}`}
                        className="hover:text-ink transition-colors"
                      >
                        {client.phone}
                      </a>
                    </li>
                  )}
                  {!client.email && !client.phone && (
                    <li className="text-ink-muted text-[12px]">
                      Sin contacto registrado
                    </li>
                  )}
                </ul>
              }
            />
            <InspectorBlock
              title="Facturacion"
              content={
                <div>
                  <p className="font-mono text-[20px] font-semibold text-ink leading-tight">
                    {new Intl.NumberFormat("es-CO", {
                      style: "currency",
                      currency: "COP",
                      maximumFractionDigits: 0,
                    }).format(client.totalInvoiced)}
                  </p>
                  <p className="text-[11px] text-ink-muted font-mono mt-0.5">
                    Facturado acumulado
                  </p>
                </div>
              }
            />

            {onArchive && (
              <div className="pt-4 border-t border-state-danger/20">
                <h4 className="font-mono text-[10px] uppercase tracking-widest text-state-danger mb-2 inline-flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" strokeWidth={1.75} />
                  Zona de peligro
                </h4>
                <button
                  type="button"
                  onClick={onArchive}
                  className="w-full h-8 px-3 rounded-md border border-state-danger text-state-danger text-[12px] font-medium hover:bg-state-danger/10 transition-colors cursor-pointer"
                >
                  Archivar cliente
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function InspectorBlock({
  title,
  content,
}: {
  title: string;
  content: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-2">
        {title}
      </h4>
      {content}
    </div>
  );
}

function ContextoTab({ client }: { client: ClientListItem }) {
  return (
    <section>
      <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-muted mb-3">
        Resumen
      </h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
        <div>
          <dt className="text-ink-muted text-[11px]">Razon social</dt>
          <dd className="mt-1 text-ink font-medium">{client.name}</dd>
        </div>
        <div>
          <dt className="text-ink-muted text-[11px]">NIT / ID Fiscal</dt>
          <dd className="mt-1 font-mono text-ink">{client.taxId}</dd>
        </div>
        <div>
          <dt className="text-ink-muted text-[11px]">Sector</dt>
          <dd className="mt-1 text-ink">{client.segment}</dd>
        </div>
        <div>
          <dt className="text-ink-muted text-[11px]">Estado</dt>
          <dd className="mt-1">
            <StatusPill
              variant={statusToVariant[client.status]}
              label={statusToLabel[client.status]}
            />
          </dd>
        </div>
      </dl>
    </section>
  );
}

function TabPlaceholder({ tab }: { tab: DetailTab }) {
  const tabLabel = TABS.find((t) => t.id === tab)?.label || tab;
  return (
    <div className="rounded-lg border border-dashed border-line p-6 text-center">
      <p className="text-[13px] text-ink-soft">
        {tabLabel} se conecta al modulo correspondiente.
      </p>
    </div>
  );
}

interface EditingContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const BLANK_NEW: EditingContact = { id: "", firstName: "", lastName: "", email: "" };

function ContactosTab({ client }: { client: ClientListItem }) {
  const [contacts, setContacts] = React.useState<ClientContact[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionState, setActionState] = React.useState<Record<string, "inviting" | "revoking" | "saving" | "deleting" | "done" | "error">>({});
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState<EditingContact>(BLANK_NEW);
  const [isAddingNew, setIsAddingNew] = React.useState(false);
  const [newForm, setNewForm] = React.useState<EditingContact>(BLANK_NEW);
  const [formError, setFormError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    try {
      const data = await getClientContacts(client.id);
      setContacts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error cargando contactos");
    } finally {
      setLoading(false);
    }
  }, [client.id]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const handleInvite = async (contactId: string) => {
    setActionState((prev) => ({ ...prev, [contactId]: "inviting" }));
    const result = await inviteContactToPortal(contactId);
    if (result.ok) {
      await refresh();
      setActionState((prev) => ({ ...prev, [contactId]: "done" }));
    } else {
      setActionState((prev) => ({ ...prev, [contactId]: "error" }));
      alert(result.error || "Error enviando invitación");
    }
  };

  const handleRevoke = async (contactId: string) => {
    if (!confirm("¿Revocar acceso al portal? El contacto perderá el acceso inmediatamente.")) return;
    setActionState((prev) => ({ ...prev, [contactId]: "revoking" }));
    const result = await revokeContactPortalAccess(contactId);
    if (result.ok) {
      await refresh();
      setActionState((prev) => ({ ...prev, [contactId]: "done" }));
    } else {
      setActionState((prev) => ({ ...prev, [contactId]: "error" }));
      alert(result.error || "Error revocando acceso");
    }
  };

  const handleStartEdit = (c: ClientContact) => {
    setEditingId(c.id);
    setFormError(null);
    setEditForm({ id: c.id, firstName: c.firstName, lastName: c.lastName || "", email: c.email || "" });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setActionState((prev) => ({ ...prev, [editingId]: "saving" }));
    setFormError(null);
    const result = await updateClientContact(editingId, {
      firstName: editForm.firstName,
      lastName: editForm.lastName,
      email: editForm.email,
    });
    if (result.ok) {
      await refresh();
      setEditingId(null);
      setActionState((prev) => ({ ...prev, [editingId]: "done" }));
    } else {
      setFormError(result.error || "Error guardando");
      setActionState((prev) => ({ ...prev, [editingId]: "error" }));
    }
  };

  const handleDelete = async (contactId: string) => {
    if (!confirm("¿Eliminar este contacto? Esta acción no se puede deshacer.")) return;
    setActionState((prev) => ({ ...prev, [contactId]: "deleting" }));
    const result = await deleteClientContact(contactId);
    if (result.ok) {
      await refresh();
    } else {
      setActionState((prev) => ({ ...prev, [contactId]: "error" }));
      alert(result.error || "Error eliminando contacto");
    }
  };

  const handleAddNew = async () => {
    setFormError(null);
    const result = await addClientContact(client.id, {
      firstName: newForm.firstName,
      lastName: newForm.lastName,
      email: newForm.email,
    });
    if (result.ok) {
      await refresh();
      setIsAddingNew(false);
      setNewForm(BLANK_NEW);
    } else {
      setFormError(result.error || "Error creando contacto");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="text-[11px] font-mono text-ink-muted animate-pulse uppercase tracking-widest">
          Cargando contactos...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-state-danger/10 border border-state-danger/20 p-4 text-[12px] text-state-danger font-mono">
        {error}
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">
          Contactos y acceso al Portal
        </h3>
        <button
          type="button"
          onClick={() => { setIsAddingNew(true); setFormError(null); setNewForm(BLANK_NEW); }}
          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-line text-ink-soft text-[11px] hover:text-ink hover:bg-accent transition-colors cursor-pointer"
        >
          <Plus className="h-3 w-3" strokeWidth={1.75} />
          Agregar contacto
        </button>
      </div>

      {/* Formulario nuevo contacto */}
      {isAddingNew && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
          <p className="text-[11px] font-mono text-primary uppercase tracking-widest">Nuevo Contacto</p>
          {formError && <p className="text-[11px] text-state-danger font-mono">{formError}</p>}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Nombre *"
              value={newForm.firstName}
              onChange={(e) => setNewForm((p) => ({ ...p, firstName: e.target.value }))}
              className="col-span-1 h-8 px-2 rounded border border-line bg-bg-elevated-2 text-[12px] text-ink focus:ring-1 focus:ring-primary outline-none"
            />
            <input
              type="text"
              placeholder="Apellido"
              value={newForm.lastName}
              onChange={(e) => setNewForm((p) => ({ ...p, lastName: e.target.value }))}
              className="col-span-1 h-8 px-2 rounded border border-line bg-bg-elevated-2 text-[12px] text-ink focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
          <input
            type="email"
            placeholder="Email (para invitar al Portal)"
            value={newForm.email}
            onChange={(e) => setNewForm((p) => ({ ...p, email: e.target.value }))}
            className="w-full h-8 px-2 rounded border border-line bg-bg-elevated-2 text-[12px] text-ink focus:ring-1 focus:ring-primary outline-none"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setIsAddingNew(false); setFormError(null); }}
              className="h-7 px-2.5 rounded border border-line text-[11px] text-ink-soft hover:text-ink cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddNew}
              className="inline-flex items-center gap-1 h-7 px-2.5 rounded bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 cursor-pointer"
            >
              <Save className="h-3 w-3" strokeWidth={1.75} />
              Guardar
            </button>
          </div>
        </div>
      )}

      {contacts.length === 0 && !isAddingNew && (
        <div className="rounded-lg border border-dashed border-line p-6 text-center">
          <Users className="h-6 w-6 text-ink-muted mx-auto mb-2" strokeWidth={1.5} />
          <p className="text-[13px] text-ink-soft">Sin contactos registrados.</p>
          <p className="text-[11px] text-ink-muted mt-1">Agrega un contacto para invitarlo al portal.</p>
        </div>
      )}

      <ul className="space-y-2">
        {contacts.map((c) => {
          const state = actionState[c.id];
          const isBusy = state === "inviting" || state === "revoking" || state === "saving" || state === "deleting";
          const isEditing = editingId === c.id;

          return (
            <li key={c.id} className="rounded-lg border border-line bg-bg-elevated-2 overflow-hidden">
              {isEditing ? (
                /* ── Modo edición inline ── */
                <div className="p-3 space-y-2">
                  {formError && <p className="text-[11px] text-state-danger font-mono">{formError}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Nombre *"
                      value={editForm.firstName}
                      onChange={(e) => setEditForm((p) => ({ ...p, firstName: e.target.value }))}
                      className="h-8 px-2 rounded border border-line bg-bg-elevated-3 text-[12px] text-ink focus:ring-1 focus:ring-primary outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Apellido"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm((p) => ({ ...p, lastName: e.target.value }))}
                      className="h-8 px-2 rounded border border-line bg-bg-elevated-3 text-[12px] text-ink focus:ring-1 focus:ring-primary outline-none"
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="Email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                    disabled={c.hasPortalAccess}
                    title={c.hasPortalAccess ? "No se puede cambiar email con acceso al portal activo" : undefined}
                    className="w-full h-8 px-2 rounded border border-line bg-bg-elevated-3 text-[12px] text-ink focus:ring-1 focus:ring-primary outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {c.hasPortalAccess && (
                    <p className="text-[10px] text-ink-muted font-mono">
                      El email no se puede cambiar mientras el contacto tiene acceso al portal.
                    </p>
                  )}
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => { setEditingId(null); setFormError(null); }}
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded border border-line text-[11px] text-ink-soft hover:text-ink cursor-pointer"
                    >
                      <XCircle className="h-3 w-3" strokeWidth={1.75} />
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEdit}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 h-7 px-2.5 rounded bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="h-3 w-3" strokeWidth={1.75} />
                      {state === "saving" ? "Guardando..." : "Guardar"}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Vista normal ── */
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink truncate">
                      {c.firstName} {c.lastName || ""}
                    </p>
                    <p className="text-[11px] text-ink-muted truncate">
                      {c.email || "Sin email"}
                    </p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {c.hasPortalAccess ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-state-success">
                          <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} />
                          {c.portalRegisteredAt ? "Acceso activo — password establecida" : "Invitación enviada (sin password aún)"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono text-ink-muted">
                          <Clock className="h-3 w-3" strokeWidth={1.75} />
                          Sin acceso al portal
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {/* Editar */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(c)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 h-7 w-7 justify-center rounded border border-line text-ink-muted hover:text-ink hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
                      title="Editar contacto"
                    >
                      <Pencil className="h-3 w-3" strokeWidth={1.75} />
                    </button>
                    {/* Eliminar */}
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-1 h-7 w-7 justify-center rounded border border-state-danger/30 text-state-danger/60 hover:text-state-danger hover:bg-state-danger/10 transition-colors disabled:opacity-50 cursor-pointer"
                      title="Eliminar contacto"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={1.75} />
                    </button>
                    {/* Portal invite/revoke */}
                    {c.hasPortalAccess ? (
                      <button
                        type="button"
                        onClick={() => handleRevoke(c.id)}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded border border-state-danger/40 text-state-danger text-[11px] font-medium hover:bg-state-danger/10 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <ShieldOff className="h-3 w-3" strokeWidth={1.75} />
                        {state === "revoking" ? "Revocando..." : "Revocar"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleInvite(c.id)}
                        disabled={isBusy || !c.email}
                        title={!c.email ? "Agrega un email primero" : undefined}
                        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Send className="h-3 w-3" strokeWidth={1.75} />
                        {state === "inviting" ? "Enviando..." : c.portalInvitedAt ? "Reenviar" : "Invitar al Portal"}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-[10px] text-ink-muted font-mono pt-1">
        &quot;Acceso activo&quot; = contacto recibió invitación y estableció su contraseña. Puede iniciar sesión en /portal.
      </p>
    </section>
  );
}
