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
} from "lucide-react";
import { StatusPill } from "@/erp/components/data-list/status-pill";
import type { StatusVariant } from "@/erp/components/data-list/status-dot";
import { cn } from "@/platform/utils/cn";
import type { ClientListItem } from "./client-list";

const statusToVariant: Record<ClientListItem["status"], StatusVariant> = {
  ACTIVO: "success",
  PENDIENTE: "warning",
  SUSPENDIDO: "danger",
};

const statusToLabel: Record<ClientListItem["status"], string> = {
  ACTIVO: "Activo",
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
      <header className="sticky top-0 z-10 border-b border-line bg-bg-elevated-1">
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
            {tab !== "contexto" && <TabPlaceholder tab={tab} />}
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
