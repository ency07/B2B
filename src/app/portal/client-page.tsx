/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/jsx-no-comment-textnodes */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  Clock,
  FileText,
  Download,
  CreditCard,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  Building,
  HelpCircle,
  ChevronRight,
  MessageSquare,
  Send,
  X,
  RefreshCw,
  WifiOff,
  User,
  PlusCircle,
  FileSpreadsheet,
  Settings,
  ChevronDown,
  Trash2,
  LogOut
} from "lucide-react";
import { getPortalBrowserClient } from "@/platform/auth/clients";

const supabase = getPortalBrowserClient();

import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Badge } from "@/platform/ui/badge";
import { Skeleton } from "@/platform/ui/skeleton";
import { getTenantConfig } from "@/platform/tenant/tenant";
import { getTenantBranding } from "@/web/actions/branding";
import { ThemeToggle } from "@/platform/components/theme-toggle";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/platform/ui/sheet";
import { OrderTrackingSection } from "@/portal/components/OrderTrackingSection";
import {
  createClientTicket,
  sendClientMessage,
  type ClientJob,
  type ClientInvoice,
  type ClientPayment,
  type ClientSupportTicket,
  type ClientSupportMessage,
  type ClientRequirement,
} from "@/portal/actions/portal";
import { ClientProfileModal } from "@/portal/components/ClientProfileModal";
import { NewRequirementSheet } from "@/portal/components/NewRequirementSheet";
import { capture } from "@/lib/analytics";

interface PortalClientInfo {
  legalName: string;
  taxId: string;
  email: string;
}

// Formatting utility for COP/USD
const formatCurrency = (amount: number) => {
  if (amount < 100000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Mapea un status de OT a un porcentaje de avance estimado.
 * Solo para la UI del portal; no es dato oficial.
 */
function mapStatusToProgress(status: string): number {
  const s = status.toUpperCase();
  if (s.includes("COMPLET") || s.includes("DESPACH") || s.includes("ENTREG")) return 100;
  if (s.includes("PRUEBA") || s.includes("BALANCEO")) return 80;
  if (s.includes("CORTE") || s.includes("SOLDADURA")) return 50;
  if (s.includes("DISE")) return 20;
  if (s.includes("PROG") || s.includes("PEND")) return 0;
  return 50;
};

export default function CustomerPortal({
  clientInfo,
  jobs: initialJobs = [],
  invoices: initialInvoices = [],
  payments: initialPayments = [],
  tickets: initialTickets = [],
  messages: initialMessages = [],
  documents: initialDocs = [],
  requirements: initialRequirements = [],
  previewClientId = null,
  isPlatformAdmin = false,
  isClientContact = false,
  allClients = [],
}: {
  clientInfo: PortalClientInfo;
  jobs?: ClientJob[];
  invoices?: ClientInvoice[];
  payments?: ClientPayment[];
  tickets?: ClientSupportTicket[];
  messages?: ClientSupportMessage[];
  documents?: Array<{ id: string; name: string; type: string; url: string }>;
  requirements?: ClientRequirement[];
  previewClientId?: string | null;
  isPlatformAdmin?: boolean;
  isClientContact?: boolean;
  allClients?: Array<{ id: string; legalName: string; tenantCode: string }>;
}) {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant") || "acme";
  const config = getTenantConfig(tenantParam);

  // States
  const [isLoading, setIsLoading] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<"ots" | "invoices" | "docs" | "tickets" | "requirements">("ots");
  const [brandingState, setBrandingState] = React.useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [isRequirementSheetOpen, setIsRequirementSheetOpen] = React.useState(false);
  const [requirements, setRequirements] = React.useState<ClientRequirement[]>(initialRequirements);
  const [invoiceFilter, setInvoiceFilter] = React.useState<"ALL" | "PENDIENTE" | "PAGADA">("ALL");
  const [isTicketSheetOpen, setIsTicketSheetOpen] = React.useState(false);

  // Theme controlled by next-themes via platform/providers/theme-provider

  React.useEffect(() => {
    async function loadBranding() {
      try {
        const data = await getTenantBranding(tenantParam);
        setBrandingState(data);
      } catch (err) {
        console.error("Error loading branding in portal:", err);
      }
    }
    loadBranding();
  }, [tenantParam]);

  const companyName = brandingState?.nombre_comercial || config.name;
  const razonSocial = brandingState?.razon_social || `${config.name} S.A.S.`;
  const telefono = brandingState?.telefono_principal || config.contactPhone || "+57 601 000 0000";
  const supportEmail = brandingState?.email_corporativo || config.contactEmail || "soporte@ventitech.com";

  React.useEffect(() => {
    if (brandingState?.nombre_comercial) {
      const shortName = brandingState.nombre_comercial.split(" ")[0];
      setOts(prev => prev.map(ot => {
        if (ot.code === "JOB-2026-001") {
          return { ...ot, title: `Extractor Axial ${shortName} VT-7500 CFM` };
        }
        return ot;
      }));
    }
  }, [brandingState]);
  const [isOffline, setIsOffline] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [expandedOt, setExpandedOt] = React.useState<string | null>(initialJobs[0]?.code ?? null);
  const router = useRouter();

  // Client info derivado directamente desde props del servidor
  const [clientName, setClientName] = React.useState(clientInfo.legalName);
  const [clientNit, setClientNit] = React.useState(clientInfo.taxId);

  // OTs state — inicializado con datos reales del client (per-client filtering)
  const [ots, setOts] = React.useState(
    initialJobs.map((j) => ({
      id: j.id,
      code: j.code,
      title: j.title,
      status: j.status,
      progress: mapStatusToProgress(j.status),
      tech: "Asignado",
      startDate: "",
      endDate: j.plannedEndDate || "",
      cadFile: "",
      specFile: "",
    }))
  );

  // Invoices state — datos reales del client
  const [invoices] = React.useState(
    initialInvoices.map((i) => ({
      id: i.id,
      code: i.code,
      date: i.issueDate,
      concept: "Factura",
      total: i.totalAmount,
      paid: i.paidAmount,
      status: i.status,
    }))
  );

  // Payment receipts — datos reales del client
  const [receipts] = React.useState(
    initialPayments.map((p) => ({
      id: p.id,
      code: p.invoiceCode,
      date: p.paidAt,
      amount: p.amount,
      method: p.method,
      status: "APROBADO",
    }))
  );

  // Tickets de soporte — datos reales, persistidos en client_support_tickets.
  const [tickets, setTickets] = React.useState(
    initialTickets.map((t) => ({
      code: t.code,
      otCode: t.jobId || "",
      date: t.createdAt ? t.createdAt.substring(0, 10) : "",
      subject: t.subject,
      severity: t.severity,
      status: t.status,
      desc: t.description,
    }))
  );
  const [isCreatingTicket, setIsCreatingTicket] = React.useState(false);

  // New ticket form — preseleccionar primera OT disponible o vacío
  const [newTicketOt, setNewTicketOt] = React.useState(ots[0]?.code ?? "");
  const [newTicketSeverity, setNewTicketSeverity] = React.useState("MEDIO");
  const [newTicketSubject, setNewTicketSubject] = React.useState("");
  const [newTicketDesc, setNewTicketDesc] = React.useState("");

  // Bitácora de soporte — mensajes reales, persistidos en
  // client_support_messages. No hay respuesta automática: quien usa el
  // Portal hoy es siempre un admin en modo revisión (ver
  // src/lib/portal-auth.ts), no existe todavía login real de cliente
  // externo, así que no hay "otra parte" que conteste de verdad.
  const [chatMessages, setChatMessages] = React.useState(
    initialMessages.map((m) => ({
      id: m.id,
      sender: m.senderType === "STAFF" ? "agent" : "client",
      name: m.senderLabel || (m.senderType === "STAFF" ? "Equipo de soporte" : clientInfo.legalName),
      time: m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "",
      text: m.body,
    }))
  );
  const [newMessageText, setNewMessageText] = React.useState("");
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const [isSendingMessage, setIsSendingMessage] = React.useState(false);
  const chatToggleRef = React.useRef<HTMLButtonElement>(null);
  const chatCloseRef = React.useRef<HTMLButtonElement>(null);

  // Payment: sin gateway real conectado todavía (no hay credenciales de
  // Wompi/PSE configuradas). No se simula un pago exitoso — se muestra un
  // estado honesto en vez de marcar la factura como pagada sin que haya
  // ocurrido una transacción real.
  const [selectedInvoice, setSelectedInvoice] = React.useState<typeof invoices[0] | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = React.useState("");

  // Session start analytics
  React.useEffect(() => {
    capture("portal_session_start", { clientTaxId: clientInfo.taxId });
  }, []);

  // Gestion de foco: al abrir/cerrar el chat, mover el foco al elemento correspondiente
  React.useEffect(() => {
    if (isChatOpen) {
      chatCloseRef.current?.focus();
    } else {
      chatToggleRef.current?.focus();
    }
  }, [isChatOpen]);

  // ClientName/NIT se inicializan directamente desde clientInfo (ver init más abajo)
  // No hay delay artificial — los datos ya vienen del servidor via props

  // Theme support
  React.useEffect(() => {
    const userColor = localStorage.getItem("portal_color_preference");
    const activePrimary = userColor || config.primaryColor;
    if (activePrimary) {
      const root = document.documentElement;
      root.style.setProperty("--primary", activePrimary);
      root.style.setProperty("--ring", activePrimary);
    }
  }, [config]);

  // NOTA: la validación de tenant/cliente real ya ocurrió en el servidor
  // (src/app/portal/page.tsx llama a getCurrentClient() antes de renderizar
  // este componente; si no hay cliente válido, ni siquiera llega hasta acá).
  // Antes había un segundo chequeo aquí contra MOCK_TENANTS (que solo tenía
  // la clave "default") que bloqueaba el portal para CUALQUIER tenant real
  // — se eliminó por ser redundante y estar roto.


  // Envía un mensaje real a la bitácora de soporte del cliente. No hay
  // respuesta automática — sería inventar una conversación que no ocurrió.
  const handleSendMessage = async () => {
    if (!newMessageText.trim() || isSendingMessage) return;
    const body = newMessageText;
    setNewMessageText("");
    setIsSendingMessage(true);
    try {
      const saved = await sendClientMessage(previewClientId, body);
      setChatMessages(prev => [...prev, {
        id: saved.id,
        sender: saved.senderType === "CLIENT" ? "client" : "agent",
        name: saved.senderLabel || (saved.senderType === "CLIENT" ? clientInfo.legalName : "Equipo de soporte"),
        time: new Date(saved.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: saved.body,
      }]);
    } catch (err) {
      console.error("Error enviando mensaje:", err);
      toast.error("No se pudo guardar el mensaje.");
      setNewMessageText(body);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Crea un ticket real, persistido en client_support_tickets.
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketDesc.trim() || isCreatingTicket) return;

    setIsCreatingTicket(true);
    try {
      const created = await createClientTicket(previewClientId, {
        subject: newTicketSubject,
        description: newTicketDesc,
        severity: newTicketSeverity,
      });
      setTickets(prev => [{
        code: created.code,
        otCode: created.jobId || newTicketOt,
        date: created.createdAt.substring(0, 10),
        subject: created.subject,
        severity: created.severity,
        status: created.status,
        desc: created.description,
      }, ...prev]);
      setNewTicketSubject("");
      setNewTicketDesc("");
      capture("portal_ticket_created", { severity: newTicketSeverity, code: created.code });
      toast.success(`Ticket de soporte técnico ${created.code} registrado con éxito.`);
    } catch (err) {
      console.error("Error creando ticket:", err);
      toast.error("No se pudo registrar el ticket.");
    } finally {
      setIsCreatingTicket(false);
    }
  };

  // Genera y descarga PDF de factura usando jspdf
  const downloadInvoicePdf = async (invoiceCode: string) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "letter" });
      const inv = invoices.find(i => i.code === invoiceCode);
      if (!inv) return;

      doc.setFontSize(18);
      doc.text(`${companyName}`, 20, 30);
      doc.setFontSize(10);
      doc.text(`Factura: ${inv.code}`, 20, 42);
      doc.text(`Fecha: ${inv.date}`, 20, 50);
      doc.text(`Cliente: ${clientName}`, 20, 58);
      doc.text(`NIT: ${clientNit}`, 20, 66);
      doc.line(20, 74, 190, 74);
      doc.setFontSize(12);
      doc.text(`Total: ${formatCurrency(inv.total)}`, 20, 86);
      doc.text(`Pagado: ${formatCurrency(inv.paid)}`, 20, 96);
      doc.text(`Saldo: ${formatCurrency(inv.total - inv.paid)}`, 20, 106);
      doc.text(`Estado: ${inv.status}`, 20, 116);

      doc.save(`factura-${inv.code}.pdf`);
    } catch (err) {
      console.error("Error generando PDF:", err);
      toast.error("No se pudo generar el PDF.");
    }
  };

  // Reset demo error state
  const handleResetError = () => {
    setHasError(false);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    const tenantQs = searchParams.get("tenant");
    const loginUrl = `/login${tenantQs ? `?tenant=${tenantQs}` : ""}`;
    router.push(loginUrl);
    router.refresh();
  };

  // ----------------------------------------------------
  // RENDER SKELETON LOADER
  // ----------------------------------------------------
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden">
        {/* Radial highlight in background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary)/0.04,transparent_50%)] pointer-events-none" />

        <header className="border-b border-border bg-card/50 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header Banner Skeleton */}
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-6 w-80" />
              <Skeleton className="h-3 w-[60%]" />
            </div>
          </div>

          {/* Cards Row Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Skeleton className="h-28 rounded-2xl border border-border bg-card" />
            <Skeleton className="h-28 rounded-2xl border border-border bg-card" />
            <Skeleton className="h-28 rounded-2xl border border-border bg-card" />
          </div>

          {/* Tab Navigation Skeleton */}
          <div className="flex gap-4 border-b border-border pb-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-32" />
          </div>

          {/* Content Box Skeleton */}
          <div className="rounded-2xl border border-border bg-card/30 p-8 space-y-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-24 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ----------------------------------------------------
  // RENDER DATABASE ERROR STATE
  // ----------------------------------------------------
  if (hasError) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center font-sans p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)/0.03,transparent_60%)] pointer-events-none" />
        <div className="max-w-md w-full rounded-2xl border border-destructive/20 bg-card p-8 text-center space-y-6 shadow-2xl relative">
          <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto border border-destructive/10 animate-bounce">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="text-xs font-mono text-destructive uppercase tracking-widest font-bold">// ERROR_CONEXION</span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Fallo de conexión</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No pudimos cargar tu información en este momento. Por favor intenta de nuevo o contacta a tu ejecutivo.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" className="text-xs font-mono cursor-pointer" onClick={() => setHasError(false)}>
              Ignorar
            </Button>
            <Button onClick={handleResetError} className="bg-destructive hover:bg-destructive/90 text-white text-xs font-mono flex items-center gap-1.5 cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Reintentar Conexión
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const unpaidTotal = invoices.reduce((sum, inv) => sum + (inv.status === "PENDIENTE" ? inv.total - inv.paid : 0), 0);
  const activeOtsCount = ots.filter(o => o.status !== "DESPACHO").length;
  const activeTicketsCount = tickets.filter(t => t.status !== "RESUELTO").length;
  const openRequirementsCount = requirements.filter(r => !["CERRADO", "CANCELADO"].includes(r.status)).length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden">
      
      {/* Radial atmosphere background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary)/0.06,transparent_50%)] pointer-events-none" />

      {/* Offline Status Warning Banner */}
      {isOffline && (
        <div className="bg-destructive/90 text-white text-xs font-mono py-2.5 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md backdrop-blur-md">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>⚠️ CONEXIÓN INTERRUMPIDA - Operando en modo local desconectado. Las transacciones se sincronizarán al volver.</span>
        </div>
      )}

      {/* Administrator Client Switcher Banner — solo visible para admins, nunca para clientes reales */}
      {isPlatformAdmin && !isClientContact && (
        <div className="bg-background text-foreground text-xs font-mono py-2 px-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 border-b border-border shadow-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="font-bold tracking-wider text-emerald-400">MODO ADMINISTRADOR</span>
            <span className="text-muted-foreground">| Inspeccionando cliente: <strong className="text-foreground">{clientInfo.legalName}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[10px]">Cambiar de Empresa:</span>
            <select
              value={allClients.find(c => c.legalName === clientInfo.legalName)?.id || ""}
              onChange={(e) => {
                const selectedId = e.target.value;
                const clientObj = allClients.find(c => c.id === selectedId);
                if (clientObj) {
                  router.push(`/portal?client_id=${clientObj.id}&tenant=${clientObj.tenantCode}`);
                  router.refresh();
                }
              }}
              className="bg-muted text-foreground border border-border rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-ring focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Seleccione una empresa...</option>
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.legalName} ({c.tenantCode.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Brand identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground font-mono text-xs shadow-sm shrink-0">
              VT
            </div>
            <div className="hidden sm:block">
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest leading-none">Portal de Clientes</p>
              <p className="text-sm font-semibold text-foreground tracking-tight leading-tight mt-0.5">{config.name}</p>
            </div>
            <div className="flex items-center gap-1.5 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 hidden lg:block">ACTIVO</span>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">

            {/* Client name chip */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/40 text-xs shrink-0">
              <Building className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="font-semibold text-foreground truncate max-w-[180px]">{clientName}</span>
            </div>

            {/* Dev HUD (solo desarrollo) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="flex items-center border border-border/80 bg-background/50 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setIsOffline(!isOffline)}
                  className={`text-[9px] font-mono px-2 py-1 rounded cursor-pointer transition-all ${isOffline ? "bg-destructive text-white font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  title="Simular pérdida de conexión de red"
                >
                  Simular Offline
                </button>
                <button
                  onClick={() => setHasError(true)}
                  className="text-[9px] font-mono px-2 py-1 rounded text-muted-foreground hover:text-destructive cursor-pointer transition-all"
                  title="Simular error crítico de base de datos"
                >
                  Simular Error
                </button>
              </div>
            )}

            {/* Toggle tema */}
            <ThemeToggle />

            {/* Perfil (solo clientes reales) */}
            {isClientContact && (
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                aria-label="Mi perfil"
                title="Mi perfil"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/80 bg-background hover:bg-muted/50 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all"
              >
                <User className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Perfil</span>
              </button>
            )}

            {/* Cerrar sesión */}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/80 bg-background hover:bg-muted/50 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* Welcome bar */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-border/50">
          <div className="space-y-1">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              Portal corporativo · NIT {clientNit}
            </p>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Bienvenido, <span className="text-primary">{clientName}</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              Seguimiento de operaciones, facturación y soporte técnico B2B.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              onClick={() => { setIsRequirementSheetOpen(true); capture("portal_requirement_sheet_opened", {}); }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Solicitar servicio
            </Button>
            <Button
              ref={chatToggleRef}
              variant="outline"
              onClick={() => { setIsChatOpen(prev => { capture("portal_chat_toggled", { open: !prev }); return !prev; }); }}
              className="text-xs font-medium flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all cursor-pointer shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {isChatOpen ? "Cerrar soporte" : "Soporte"}
            </Button>
          </div>
        </div>

        {/* Metric cards — 4 cols, todas navegables */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* OTs en producción */}
          <div
            onClick={() => setActiveSection("ots")}
            className="rounded-xl border border-border bg-card p-5 relative overflow-hidden hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-xs font-medium text-muted-foreground">OTs en producción</p>
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Clock className="w-3.5 h-3.5 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground font-mono tabular-nums leading-none">{activeOtsCount}</p>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block shrink-0" />
              {activeOtsCount === 1 ? "orden activa" : "órdenes activas"}
            </p>
          </div>

          {/* Saldo pendiente */}
          <div
            onClick={() => setActiveSection("invoices")}
            className={`rounded-xl border bg-card p-5 relative overflow-hidden hover:shadow-sm transition-all cursor-pointer group ${unpaidTotal > 0 ? "border-destructive/30 hover:border-destructive/50" : "border-border hover:border-emerald-500/40"}`}
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-xs font-medium text-muted-foreground">Saldo pendiente</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${unpaidTotal > 0 ? "bg-destructive/10 group-hover:bg-destructive/20" : "bg-emerald-500/10 group-hover:bg-emerald-500/20"}`}>
                <CreditCard className={`w-3.5 h-3.5 ${unpaidTotal > 0 ? "text-destructive" : "text-emerald-500"}`} />
              </div>
            </div>
            <p className={`text-3xl font-bold font-mono tabular-nums leading-none ${unpaidTotal > 0 ? "text-destructive" : "text-emerald-500"}`}>
              {formatCurrency(unpaidTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${unpaidTotal > 0 ? "bg-destructive" : "bg-emerald-500"}`} />
              {unpaidTotal > 0 ? "facturas por pagar" : "cuenta al día"}
            </p>
          </div>

          {/* Tickets de soporte */}
          <div
            onClick={() => setActiveSection("tickets")}
            className={`rounded-xl border bg-card p-5 relative overflow-hidden hover:shadow-sm transition-all cursor-pointer group ${activeTicketsCount > 0 ? "border-amber-500/30 hover:border-amber-500/50" : "border-border hover:border-border/80"}`}
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-xs font-medium text-muted-foreground">Tickets de soporte</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${activeTicketsCount > 0 ? "bg-amber-500/10 group-hover:bg-amber-500/20" : "bg-muted"}`}>
                <MessageSquare className={`w-3.5 h-3.5 ${activeTicketsCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground font-mono tabular-nums leading-none">{activeTicketsCount}</p>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${activeTicketsCount > 0 ? "bg-amber-500" : "bg-muted-foreground/40"}`} />
              {activeTicketsCount > 0 ? "casos abiertos" : "sin casos activos"}
            </p>
          </div>

          {/* Requerimientos activos */}
          <div
            onClick={() => setActiveSection("requirements")}
            className={`rounded-xl border bg-card p-5 relative overflow-hidden hover:shadow-sm transition-all cursor-pointer group ${openRequirementsCount > 0 ? "border-primary/30 hover:border-primary/50" : "border-border hover:border-border/80"}`}
          >
            <div className="flex items-start justify-between mb-4">
              <p className="text-xs font-medium text-muted-foreground">Requerimientos</p>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${openRequirementsCount > 0 ? "bg-primary/10 group-hover:bg-primary/20" : "bg-muted"}`}>
                <PlusCircle className={`w-3.5 h-3.5 ${openRequirementsCount > 0 ? "text-primary" : "text-muted-foreground"}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground font-mono tabular-nums leading-none">{openRequirementsCount}</p>
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${openRequirementsCount > 0 ? "bg-primary" : "bg-muted-foreground/40"}`} />
              {openRequirementsCount > 0 ? "solicitudes activas" : "sin solicitudes"}
            </p>
          </div>

        </div>

        {/* Activity feed — últimos eventos relevantes */}
        {(ots.length > 0 || invoices.some(i => i.status === "PENDIENTE") || requirements.some(r => r.status === "NUEVO")) && (
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider shrink-0 hidden sm:block">Reciente:</span>
            {ots[0] && (
              <button onClick={() => setActiveSection("ots")} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-border bg-background hover:bg-muted/40 text-xs transition-colors shrink-0 cursor-pointer">
                <Clock className="w-3 h-3 text-primary shrink-0" />
                <span className="font-mono font-medium">{ots[0].code}</span>
                <span className="text-muted-foreground text-[10px]">· {ots[0].status}</span>
              </button>
            )}
            {invoices.find(i => i.status === "PENDIENTE") && (() => {
              const inv = invoices.find(i => i.status === "PENDIENTE")!;
              return (
                <button onClick={() => setActiveSection("invoices")} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-destructive/30 bg-background hover:bg-destructive/5 text-xs transition-colors shrink-0 cursor-pointer">
                  <CreditCard className="w-3 h-3 text-destructive shrink-0" />
                  <span className="font-mono font-medium">{inv.code}</span>
                  <span className="text-destructive text-[10px]">· Pendiente</span>
                </button>
              );
            })()}
            {requirements.find(r => r.status === "NUEVO") && (() => {
              const req = requirements.find(r => r.status === "NUEVO")!;
              return (
                <button onClick={() => setActiveSection("requirements")} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-primary/20 bg-background hover:bg-primary/5 text-xs transition-colors shrink-0 cursor-pointer">
                  <PlusCircle className="w-3 h-3 text-primary shrink-0" />
                  <span className="font-mono font-medium">{req.code}</span>
                  <span className="text-muted-foreground text-[10px]">· Recibido</span>
                </button>
              );
            })()}
          </div>
        )}

        {/* Main workspace */}
        <div className="space-y-6">

            {/* Tabbed Navigation */}
            <div role="tablist" className="flex border-b border-border pb-px overflow-x-auto gap-1">
              {[
                { id: "ots",          label: "Taller en Vivo",       Icon: Clock },
                { id: "requirements", label: "Requerimientos",        Icon: PlusCircle, badge: openRequirementsCount },
                { id: "invoices",     label: "Facturas y Pagos",      Icon: CreditCard, badge: invoices.filter(i => i.status === "PENDIENTE").length },
                { id: "docs",         label: "Documentos Técnicos",   Icon: FileText },
                { id: "tickets",      label: "Soporte y Garantías",   Icon: ShieldCheck, badge: activeTicketsCount },
              ].map(({ id, label, Icon, badge }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={activeSection === id}
                  onClick={() => { setActiveSection(id as any); capture("portal_tab_viewed", { tab: id }); }}
                  className={`pb-3 px-4 text-sm font-medium border-b-2 tracking-normal transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    activeSection === id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                  {badge !== undefined && badge > 0 && (
                    <span className="ml-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                      {badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Active section box */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 min-h-[480px] shadow-sm">
              
              {/* ---------------------------------------------------- */}
              {/* ---------------------------------------------------- */}
              {/* SECTION: REQUERIMIENTOS */}
              {/* ---------------------------------------------------- */}
              {activeSection === "requirements" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Mis Requerimientos</h3>
                      <p className="text-xs text-muted-foreground mt-1 font-sans">
                        Solicitudes de servicio, compra o fabricación enviadas desde el portal.
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsRequirementSheetOpen(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer shrink-0"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Nuevo requerimiento
                    </Button>
                  </div>

                  {requirements.length === 0 ? (
                    <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <PlusCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">Aún no tienes requerimientos</p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                          Usa el botón de arriba para solicitar la fabricación de un equipo, una compra, mantenimiento o cualquier otro servicio.
                        </p>
                      </div>
                      <Button
                        onClick={() => setIsRequirementSheetOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium px-5 py-2 rounded-lg cursor-pointer"
                      >
                        Solicitar servicio ahora
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {requirements.map((req) => {
                        const statusConfig: Record<string, { label: string; cls: string }> = {
                          NUEVO:        { label: "Recibido",              cls: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
                          EN_REVISION:  { label: "En revisión técnica",   cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
                          DIAGNOSTICO:  { label: "En diagnóstico",        cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
                          COTIZACION:   { label: "Cotización en proceso",  cls: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
                          APROBACION:   { label: "Lista para aprobar",     cls: "bg-teal-500/10 text-teal-600 dark:text-teal-400" },
                          OT_GENERADA:  { label: "Orden de trabajo creada",cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
                          EJECUCION:    { label: "En ejecución",           cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
                          CERRADO:      { label: "Completado",             cls: "bg-muted text-muted-foreground" },
                          CANCELADO:    { label: "Cancelado",              cls: "bg-destructive/10 text-destructive" },
                        };
                        const priorityConfig: Record<string, string> = {
                          LOW:      "text-muted-foreground bg-muted",
                          MEDIUM:   "text-sky-600 dark:text-sky-400 bg-sky-500/10",
                          HIGH:     "text-amber-600 dark:text-amber-400 bg-amber-500/10",
                          CRITICAL: "text-destructive bg-destructive/10",
                        };
                        const categoryLabel: Record<string, string> = {
                          FABRICACION:  "Fabricación",
                          VENTA:        "Compra",
                          MANTENIMIENTO:"Mantenimiento",
                          REPARACION:   "Reparación",
                          OTRO:         "Otro",
                        };
                        const st = statusConfig[req.status] ?? { label: req.status, cls: "bg-muted text-muted-foreground" };
                        const pc = priorityConfig[req.priority] ?? "bg-muted text-muted-foreground";
                        return (
                          <div key={req.id} className="border border-border/80 bg-background/40 rounded-xl p-5 space-y-3 hover:border-primary/30 transition-colors">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 min-w-0">
                                <span className="text-xs font-mono font-bold text-primary">{req.code}</span>
                                <p className="text-sm font-semibold text-foreground leading-tight">{req.title}</p>
                              </div>
                              <span className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full ${st.cls}`}>
                                {st.label}
                              </span>
                            </div>
                            {req.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                {req.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border/40">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pc}`}>
                                {req.priority}
                              </span>
                              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                {categoryLabel[req.category] ?? req.category}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                                {new Date(req.createdAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SECTION: TALLER EN VIVO OTs */}
              {/* ---------------------------------------------------- */}
              {activeSection === "ots" && (
                <OrderTrackingSection
                  ots={ots}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  expandedOt={expandedOt}
                  setExpandedOt={setExpandedOt}
                />
              )}

              {/* ---------------------------------------------------- */}
              {/* SECTION: BILLING & PAYMENTS */}
              {/* ---------------------------------------------------- */}
              {activeSection === "invoices" && (() => {
                const filteredInvoices = invoices.filter(inv =>
                  invoiceFilter === "ALL" ? true : inv.status === invoiceFilter
                );
                const pendingTotal = filteredInvoices.reduce((s, i) => s + (i.status === "PENDIENTE" ? i.total - i.paid : 0), 0);
                return (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <p className="text-base font-semibold text-foreground">Facturas y Pagos</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Descargue facturas y coordine abonos con su ejecutivo.
                      </p>
                    </div>
                    {/* Filtros */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {(["ALL", "PENDIENTE", "PAGADA"] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setInvoiceFilter(f)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                            invoiceFilter === f
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border hover:border-primary/40"
                          }`}
                        >
                          {f === "ALL" ? "Todas" : f === "PENDIENTE" ? "Pendientes" : "Pagadas"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {filteredInvoices.length === 0 ? (
                    <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-3">
                      <CreditCard className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm font-semibold text-foreground">
                        {invoiceFilter === "ALL" ? "No hay facturas registradas" : `No hay facturas ${invoiceFilter === "PENDIENTE" ? "pendientes" : "pagadas"}`}
                      </p>
                    </div>
                  ) : (
                  <div className="rounded-xl border border-border bg-background/20 overflow-hidden">
                    <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left text-xs font-mono">
                      <caption className="sr-only">Lista de facturas del cliente</caption>
                      <thead className="bg-muted/55 border-b border-border text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                        <tr>
                          <th scope="col" className="p-4">Nro. Factura</th>
                          <th scope="col" className="p-4">Fecha</th>
                          <th scope="col" className="p-4 text-right">Total</th>
                          <th scope="col" className="p-4 text-right">Saldo</th>
                          <th scope="col" className="p-4 text-center">Estado</th>
                          <th scope="col" className="p-4 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-foreground">
                        {filteredInvoices.map((inv) => {
                          const balance = inv.total - inv.paid;
                          return (
                            <tr key={inv.code} className="hover:bg-muted/20 transition-colors">
                              <td className="p-4 font-bold text-primary">{inv.code}</td>
                              <td className="p-4 text-muted-foreground">{inv.date}</td>
                              <td className="p-4 text-right font-mono">{formatCurrency(inv.total)}</td>
                              <td className={`p-4 text-right font-mono font-bold ${balance > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                {formatCurrency(balance)}
                              </td>
                              <td className="p-4 text-center">
                                <Badge 
                                  variant="secondary"
                                  className={`text-[9px] font-mono border-none ${
                                    inv.status === "PAGADA" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive"
                                  }`}
                                >
                                  {inv.status}
                                </Badge>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {balance > 0 ? (
                                    <Sheet>
                                      <SheetTrigger asChild>
                                        <Button
                                          onClick={() => { setSelectedInvoice(inv); capture("portal_invoice_viewed", { code: inv.code, balance: inv.total - inv.paid }); }}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono h-8 px-3 flex items-center gap-1 cursor-pointer"
                                        >
                                          <CreditCard className="w-3.5 h-3.5" /> Ver detalle de factura
                                        </Button>
                                      </SheetTrigger>

                                      {/* Sin gateway de pago conectado todavía (no hay credenciales de
                                          Wompi/PSE configuradas). Estado honesto, no se simula un pago. */}
                                      <SheetContent className="bg-card border-l border-border max-w-[85vw] sm:max-w-[480px]">
                                        <div className="space-y-6 pt-6 font-sans">
                                          <div className="space-y-1">
                                            <p className="text-base font-semibold text-foreground">Detalle de factura</p>
                                            <p className="text-xs text-muted-foreground font-sans">
                                              Coordina el pago directamente con tu ejecutivo. El pago en línea estará disponible pronto.
                                            </p>
                                          </div>

                                          {selectedInvoice && (
                                            <div className="rounded-xl border border-border bg-background/55 p-4 space-y-2 font-mono text-xs">
                                              <div className="flex justify-between"><span className="text-muted-foreground">Factura:</span><span className="text-primary font-bold">{selectedInvoice.code}</span></div>
                                              <div className="flex justify-between"><span className="text-muted-foreground">Saldo pendiente:</span><span className="text-foreground font-bold">{formatCurrency(selectedInvoice.total - selectedInvoice.paid)}</span></div>
                                              <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-muted-foreground">Cliente:</span><span className="text-foreground font-sans font-bold">{clientName}</span></div>
                                            </div>
                                          )}

                                          <div className="rounded-xl border border-border bg-background/40 p-4 text-xs text-muted-foreground font-mono">
                                            Contacto: {supportEmail} · {telefono}
                                          </div>

                                          <SheetClose asChild>
                                            <Button className="w-full bg-muted hover:bg-muted/80 border border-border text-foreground text-xs font-mono cursor-pointer">
                                              Cerrar
                                            </Button>
                                          </SheetClose>
                                        </div>
                                      </SheetContent>
                                    </Sheet>
                                  ) : (
                                    <button 
                                      onClick={() => downloadInvoicePdf(inv.code)}
                                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                      title="Descargar PDF de la factura"
                                    >
                                      <Download className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      {pendingTotal > 0 && (
                        <tfoot>
                          <tr className="bg-destructive/5 border-t border-destructive/20">
                            <td colSpan={3} className="p-4 text-xs font-bold text-muted-foreground font-sans">Total pendiente de pago</td>
                            <td className="p-4 text-right font-mono font-bold text-destructive">{formatCurrency(pendingTotal)}</td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      )}
                    </table>
                    </div>
                  </div>
                  )}

                  {/* Payment history receipts list */}
                  {receipts.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-foreground">Historial de pagos</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {receipts.map((rec) => (
                        <div key={rec.id} className="border border-border/80 bg-background/40 p-4 rounded-xl flex items-center justify-between font-mono text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-primary">{rec.id}</span>
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-none hover:bg-emerald-500/10 text-[8px]">{rec.status}</Badge>
                            </div>
                            <span className="text-muted-foreground block text-[10px]">Factura: {rec.code} · {rec.date} · {rec.method}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-foreground block">{formatCurrency(rec.amount)}</span>
                            <button
                              onClick={() => downloadInvoicePdf(rec.code)}
                              className="text-primary hover:text-primary/80 text-[10px] flex items-center gap-1 justify-end cursor-pointer mt-1 font-sans"
                            >
                              <Download className="w-3 h-3" /> Recibo PDF
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}

                </div>
                );
              })()}

              {/* ---------------------------------------------------- */}
              {/* SECTION: TECHNICAL DOCUMENTS */}
              {/* ---------------------------------------------------- */}
              {activeSection === "docs" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <p className="text-base font-semibold text-foreground">Documentos Técnicos</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Planos, manuales, certificados y hojas de datos de tus equipos.
                      </p>
                    </div>
                  </div>

                  {initialDocs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {initialDocs.map((doc: { id: string; name: string; type: string; url: string }) => (
                        <a
                          key={doc.id}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="border border-border/80 bg-background/40 p-4 rounded-xl flex items-center gap-3 hover:bg-muted/30 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {doc.name}
                            </p>
                            <span className="text-[9px] font-mono text-muted-foreground uppercase">{doc.type}</span>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-border rounded-xl p-10 text-center space-y-4">
                      <FileText className="w-8 h-8 mx-auto text-muted-foreground" />
                      <div className="space-y-1">
                        <p className="text-sm text-foreground font-bold">Todavía no hay documentos disponibles</p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                          Cuando tu ejecutivo suba planos, manuales o certificados de tu OT, aparecerán aquí para descarga.
                        </p>
                      </div>
                      <Button
                        onClick={() => setIsChatOpen(true)}
                        className="bg-primary hover:bg-primary/95 text-white text-xs font-mono px-4 py-2 rounded-lg cursor-pointer"
                      >
                        Solicitar a mi ejecutivo
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* SECTION: WARRANTIES & SUPPORT TICKETS */}
              {/* ---------------------------------------------------- */}
              {activeSection === "tickets" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <p className="text-base font-semibold text-foreground">Soporte y Garantías</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Reporta incidentes, fallas o dudas técnicas. Tu ejecutivo responde directamente.
                      </p>
                    </div>
                    <Button
                      onClick={() => setIsTicketSheetOpen(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer shrink-0"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      Nuevo ticket
                    </Button>
                  </div>

                  {tickets.length === 0 ? (
                    <div className="border border-dashed border-border rounded-xl p-12 text-center space-y-4">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                        <ShieldCheck className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">Sin tickets de soporte</p>
                        <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                          Si tienes una duda técnica, incidente o necesitas soporte de garantía, abre un ticket y tu ejecutivo lo atenderá.
                        </p>
                      </div>
                      <Button
                        onClick={() => setIsTicketSheetOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium px-5 py-2 rounded-lg cursor-pointer"
                      >
                        Abrir primer ticket
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {tickets.map((tck) => (
                        <div key={tck.code} className="border border-border/80 bg-background/55 p-4 rounded-xl space-y-2 hover:border-primary/30 transition-colors">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-primary">{tck.code}</span>
                            <div className="flex gap-1.5">
                              <Badge className={`text-[8px] font-mono border-none ${
                                tck.severity === "ALTO" || tck.severity === "CRÍTICO" ? "bg-destructive/15 text-destructive" : tck.severity === "MEDIO" ? "bg-amber-500/15 text-amber-600" : "bg-primary/15 text-primary"
                              }`}>
                                {tck.severity}
                              </Badge>
                              <Badge className={`text-[8px] font-mono border-none ${
                                tck.status === "RESUELTO" ? "bg-emerald-500/15 text-emerald-500" : "bg-sky-500/15 text-sky-500"
                              }`}>
                                {tck.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-foreground">{tck.subject}</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{tck.desc}</p>
                          <span className="text-[9px] font-mono text-muted-foreground block border-t border-border/40 pt-1.5 mt-1">
                            {tck.otCode && `OT: ${tck.otCode} · `}Reportado: {tck.date}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

        </div>

      </main>

      {/* Chat como Sheet overlay — no comprime el layout */}
      <Sheet open={isChatOpen} onOpenChange={setIsChatOpen}>
        <SheetContent className="sm:max-w-[400px] flex flex-col p-0 gap-0">
          {/* Accent line */}
          <div className="h-1 bg-primary shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-tight">Bitácora de Soporte</p>
                <span className="text-[9px] font-mono text-muted-foreground leading-none">Tu ejecutivo responde aquí — no es tiempo real</span>
              </div>
            </div>
            <SheetClose asChild>
              <button
                ref={chatCloseRef}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                aria-label="Cerrar chat de soporte"
              >
                <X className="w-4 h-4" />
              </button>
            </SheetClose>
          </div>

          {/* Mensajes */}
          <div role="log" aria-live="polite" className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-xs flex flex-col">
            {chatMessages.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground text-center text-sm">Todavía no hay mensajes en este caso.</p>
              </div>
            )}
            {chatMessages.map((msg) => {
              const isAgent = msg.sender === "agent";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[88%] space-y-1 ${isAgent ? "self-start" : "self-end ml-auto"}`}
                >
                  <span className="text-[9px] font-mono text-muted-foreground px-1">
                    {msg.name} · {msg.time}
                  </span>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isAgent
                      ? "bg-muted text-foreground rounded-tl-none border border-border"
                      : "bg-primary text-primary-foreground rounded-tr-none"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="border-t border-border px-5 py-4 flex items-center gap-2 shrink-0">
            <Input
              placeholder="Escribe una nota sobre este caso…"
              value={newMessageText}
              disabled={isSendingMessage}
              onChange={(e) => setNewMessageText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSendMessage(); }}
              className="text-sm border-border bg-background h-10"
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSendingMessage}
              className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 shrink-0 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50 p-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4 relative z-10 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-muted-foreground">
          <span>© {companyName} · Soporte: {supportEmail}</span>
          <a href="/privacidad" className="hover:text-foreground underline underline-offset-2 transition-colors">
            Privacidad
          </a>
        </div>
      </footer>

      {/* Sheet de Nuevo Ticket */}
      <Sheet open={isTicketSheetOpen} onOpenChange={setIsTicketSheetOpen}>
        <SheetContent className="sm:max-w-[440px] flex flex-col p-0 gap-0">
          <div className="h-1 bg-primary shrink-0" />
          <div className="px-6 py-5 border-b border-border shrink-0">
            <p className="text-base font-semibold text-foreground">Nuevo ticket de soporte</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tu ejecutivo técnico recibirá el caso al instante.
            </p>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newTicketSubject.trim() || !newTicketDesc.trim() || isCreatingTicket) return;
              setIsCreatingTicket(true);
              try {
                const created = await createClientTicket(previewClientId, {
                  subject: newTicketSubject,
                  description: newTicketDesc,
                  severity: newTicketSeverity,
                });
                setTickets(prev => [{
                  code: created.code,
                  otCode: created.jobId || newTicketOt,
                  date: created.createdAt.substring(0, 10),
                  subject: created.subject,
                  severity: created.severity,
                  status: created.status,
                  desc: created.description,
                }, ...prev]);
                setNewTicketSubject("");
                setNewTicketDesc("");
                capture("portal_ticket_created", { severity: newTicketSeverity, code: created.code });
                toast.success(`Ticket ${created.code} registrado con éxito.`);
                setIsTicketSheetOpen(false);
              } catch (err) {
                console.error("Error creando ticket:", err);
                toast.error("No se pudo registrar el ticket.");
              } finally {
                setIsCreatingTicket(false);
              }
            }}
            className="flex-1 flex flex-col overflow-y-auto px-6 py-6 space-y-5"
          >
            {ots.length > 0 && (
              <div className="space-y-1.5">
                <label htmlFor="tks-ot" className="text-xs font-semibold text-foreground block">OT relacionada <span className="text-muted-foreground font-normal">(opcional)</span></label>
                <select
                  id="tks-ot"
                  value={newTicketOt}
                  onChange={(e) => setNewTicketOt(e.target.value)}
                  className="w-full bg-background border border-border text-foreground text-sm rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="">Sin OT asociada</option>
                  {ots.map(ot => (
                    <option key={ot.code} value={ot.code}>{ot.code} — {ot.title.substring(0, 35)}{ot.title.length > 35 ? "…" : ""}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">Criticidad</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: "BAJO",  label: "Baja",  sub: "Duda o consulta" },
                  { v: "MEDIO", label: "Media", sub: "Ajuste menor" },
                  { v: "ALTO",  label: "Alta",  sub: "Falla o vibración" },
                ].map((s) => (
                  <button
                    key={s.v}
                    type="button"
                    onClick={() => setNewTicketSeverity(s.v)}
                    className={`flex flex-col items-start gap-0.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      newTicketSeverity === s.v
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className={`text-xs font-semibold ${newTicketSeverity === s.v ? "text-primary" : "text-foreground"}`}>{s.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{s.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tks-subject" className="text-xs font-semibold text-foreground block">Asunto <span className="text-destructive">*</span></label>
              <Input
                id="tks-subject"
                placeholder="Ej: Vibración excesiva en motor del extractor"
                value={newTicketSubject}
                onChange={(e) => setNewTicketSubject(e.target.value)}
                className="text-sm border-border bg-background"
                maxLength={250}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="tks-desc" className="text-xs font-semibold text-foreground block">Descripción <span className="text-destructive">*</span></label>
              <textarea
                id="tks-desc"
                rows={5}
                placeholder="Describe el incidente, cuándo ocurrió y qué has observado…"
                value={newTicketDesc}
                onChange={(e) => setNewTicketDesc(e.target.value)}
                className="w-full bg-background border border-border text-foreground text-sm rounded-lg p-3 focus:ring-1 focus:ring-primary focus:outline-none font-sans leading-relaxed resize-none transition-colors"
                maxLength={5000}
              />
            </div>

            <div className="flex gap-3 pt-2 border-t border-border mt-auto">
              <SheetClose asChild>
                <Button type="button" variant="outline" className="flex-1 text-sm cursor-pointer">
                  Cancelar
                </Button>
              </SheetClose>
              <Button
                type="submit"
                disabled={isCreatingTicket}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium cursor-pointer disabled:opacity-60"
              >
                {isCreatingTicket ? "Registrando…" : "Enviar ticket"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Sheet de Nuevo Requerimiento */}
      <NewRequirementSheet
        open={isRequirementSheetOpen}
        onOpenChange={setIsRequirementSheetOpen}
        previewClientId={previewClientId}
        jobs={ots.map(o => ({ code: o.code, title: o.title }))}
        onCreated={(req) => setRequirements(prev => [req, ...prev])}
      />

      {/* Modal de Perfil (solo clientes reales) */}
      {isClientContact && (
        <ClientProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          clientEmail={clientInfo.email}
          clientName={clientInfo.legalName}
          clientNit={clientInfo.taxId}
        />
      )}

    </div>
  );
}
