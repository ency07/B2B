"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Sparkles,
  Search,
  Clock,
  Printer,
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
import { ThemeCustomizer } from "@/platform/components/theme-customizer";
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
} from "@/portal/actions/portal";
import { ClientProfileModal } from "@/portal/components/ClientProfileModal";

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
  const [activeSection, setActiveSection] = React.useState<"ots" | "invoices" | "docs" | "tickets">("ots");
  const [brandingState, setBrandingState] = React.useState<any>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);

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

  // Payment: sin gateway real conectado todavía (no hay credenciales de
  // Wompi/PSE configuradas). No se simula un pago exitoso — se muestra un
  // estado honesto en vez de marcar la factura como pagada sin que haya
  // ocurrido una transacción real.
  const [selectedInvoice, setSelectedInvoice] = React.useState<typeof invoices[0] | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = React.useState("");

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
      toast.success(`Ticket de soporte técnico ${created.code} registrado con éxito.`);
    } catch (err) {
      console.error("Error creando ticket:", err);
      toast.error("No se pudo registrar el ticket.");
    } finally {
      setIsCreatingTicket(false);
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
      <header className="border-b border-border bg-card/85 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white font-mono shadow-md">
              VT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">PORTAL CLIENTES</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <span className="font-bold text-sm text-foreground tracking-tight block leading-tight mt-0.5">{config.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ThemeCustomizer storageKeyPrefix="portal" />
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] text-muted-foreground block leading-none">Cuenta Certificada</span>
                <span className="text-foreground font-bold leading-normal">{clientName}</span>
              </div>
              <Badge variant="secondary" className="text-[9px] border border-border">{clientNit}</Badge>
            </div>

            {/* Test controls HUD (solo visible en desarrollo) */}
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

            {/* Perfil (solo clientes reales) */}
            {isClientContact && (
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                aria-label="Mi perfil"
                title="Mi perfil"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground border border-border/80 bg-background/50 hover:bg-background/80 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all"
              >
                <User className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Mi Perfil</span>
              </button>
            )}

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground border border-border/80 bg-background/50 hover:bg-background/80 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        
        {/* Banner Solapado / Hanging Header Section */}
        <div className="relative rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md p-6 sm:p-8 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-primary">
                <Sparkles className="w-4 h-4" /> Centro de Control Operacional
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Bienvenido al Portal de {clientName}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
                Supervise el avance físico de fabricación de su maquinaria industrial, acceda a los certificados de balanceo dinámico y realice el pago seguro de saldos contables.
              </p>
            </div>

            {/* Support chat toggle button */}
            <Button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="bg-primary hover:bg-primary/95 text-white text-xs font-mono flex items-center gap-2 px-5 py-5 rounded-full shadow-lg hover:shadow-primary/20 transition-all hover:translate-y-[-1px] active:translate-y-0 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              {isChatOpen ? "Cerrar Soporte" : "Bitácora de Soporte"}
            </Button>
          </div>
        </div>

        {/* Hanging Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative -mt-4">
          
          {/* Metric 1 */}
          <div className="group rounded-2xl border border-border/80 bg-card p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 group-hover:bg-primary transition-colors" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">Equipos en Fabricación</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-bold font-mono text-foreground">{activeOtsCount} OTs</span>
              <Badge variant="secondary" className="text-[9px] font-mono bg-primary/10 text-primary border-none">En Producción</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 font-sans">Monitoreo de calibración y pruebas QA</p>
          </div>

          {/* Metric 2 */}
          <div className="group rounded-2xl border border-border/80 bg-card p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-destructive/20 group-hover:bg-destructive transition-colors" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">Balance Total Pendiente</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className={`text-3xl font-bold font-mono ${unpaidTotal > 0 ? "text-destructive" : "text-emerald-500"}`}>
                {formatCurrency(unpaidTotal)}
              </span>
              <Badge variant="secondary" className={`text-[9px] font-mono border-none ${unpaidTotal > 0 ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-500"}`}>
                {unpaidTotal > 0 ? "Pendiente de pago" : "Cuenta al Día"}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 font-sans">Consulte la fecha de vencimiento en cada factura</p>
          </div>

          {/* Metric 3 */}
          <div className="group rounded-2xl border border-border/80 bg-card p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/20 group-hover:bg-amber-500 transition-colors" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">Casos de Soporte / Garantías</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-bold font-mono text-foreground">{activeTicketsCount} Activos</span>
              <Badge variant="secondary" className="text-[9px] font-mono bg-amber-500/10 text-amber-600 border-none">En seguimiento</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 font-sans">Soporte técnico y garantías</p>
          </div>

        </div>

        {/* Layout split with chat sidebar option */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT/CENTER WORKSPACE (9 cols if chat is open, 12 if closed) */}
          <div className={`space-y-6 transition-all duration-300 ${isChatOpen ? "lg:col-span-8" : "lg:col-span-12"}`}>
            
            {/* Tabbed Navigation */}
            <div role="tablist" className="flex border-b border-border pb-px text-xs font-mono overflow-x-auto gap-2">
              {[
                { id: "ots", label: "Taller en Vivo (OTs)" },
                { id: "invoices", label: "Facturas y Recibos" },
                { id: "docs", label: "Planos y Archivos CAD" },
                { id: "tickets", label: "Garantías y soporte técnico" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={activeSection === tab.id}
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`pb-3 px-4 font-bold border-b-2 tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                    activeSection === tab.id 
                      ? "border-primary text-primary" 
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active section box */}
            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 min-h-[480px] shadow-sm">
              
              {/* ---------------------------------------------------- */}
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
              {activeSection === "invoices" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">// FACTURACION</span>
                      <h3 className="text-lg font-bold text-foreground mt-0.5">Cartera de Facturación Industrial</h3>
                      <p className="text-xs text-muted-foreground mt-1 font-sans">
                        Consulte los vencimientos, descargue las facturas y realice abonos a través del gateway bancario.
                      </p>
                    </div>
                  </div>

                  {/* Invoices List */}
                  <div className="rounded-xl border border-border bg-background/20 overflow-hidden">
                    <table className="w-full border-collapse text-left text-xs font-mono">
                      <caption className="sr-only">Lista de facturas del cliente</caption>
                      <thead className="bg-muted/55 border-b border-border text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                        <tr>
                          <th scope="col" className="p-4">Nro. Factura</th>
                          <th scope="col" className="p-4">Fecha Emisión</th>
                          <th scope="col" className="p-4">Detalle del Concepto</th>
                          <th scope="col" className="p-4 text-right">Monto Total</th>
                          <th scope="col" className="p-4 text-right">Saldo pendiente</th>
                          <th scope="col" className="p-4 text-center">Estado</th>
                          <th scope="col" className="p-4 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-foreground">
                        {invoices.map((inv) => {
                          const balance = inv.total - inv.paid;
                          return (
                            <tr key={inv.code} className="hover:bg-muted/20 transition-colors">
                              <td className="p-4 font-bold text-primary">{inv.code}</td>
                              <td className="p-4 text-muted-foreground">{inv.date}</td>
                              <td className="p-4 font-sans text-foreground max-w-xs">{inv.concept}</td>
                              <td className="p-4 text-right font-mono">{formatCurrency(inv.total)}</td>
                              <td className={`p-4 text-right font-mono font-bold ${balance > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                {formatCurrency(balance)}
                              </td>
                              <td className="p-4 text-center">
                                <Badge 
                                  variant="secondary"
                                  className={`text-[9px] font-mono border-none ${
                                    inv.status === "PAGADA" ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive animate-pulse"
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
                                          onClick={() => setSelectedInvoice(inv)}
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
                                            <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider">// DETALLE_FACTURA</span>
                                            <h3 className="text-lg font-bold text-foreground">Detalle de factura</h3>
                                            <p className="text-xs text-muted-foreground font-sans">
                                              {companyName} está habilitando el pago en línea. Por ahora, coordina el pago de esta factura directamente con tu ejecutivo.
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
                                      onClick={() => toast.info(`Imprimiendo comprobante de pago para factura ${inv.code}...`)}
                                      className="text-muted-foreground hover:text-foreground transition-colors p-1"
                                      title="Imprimir Comprobante"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Payment history receipts list */}
                  <div className="space-y-4">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block font-bold">// HISTORIAL_PAGOS</span>
                    <h4 className="text-sm font-bold text-foreground">Historial de Recibos y Transferencias</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {receipts.map((rec) => (
                        <div key={rec.id} className="border border-border/80 bg-background/40 p-4 rounded-xl flex items-center justify-between font-mono text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-primary">{rec.id}</span>
                              <Badge className="bg-emerald-500/10 text-emerald-500 border-none hover:bg-emerald-500/10 text-[8px]">{rec.status}</Badge>
                            </div>
                            <span className="text-muted-foreground block text-[10px]">Factura Relacionada: {rec.code}</span>
                            <span className="text-muted-foreground block text-[10px]">Fecha: {rec.date} • {rec.method}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-foreground block">{formatCurrency(rec.amount)}</span>
                            <a 
                              onClick={() => toast.info(`Descargando comprobante PDF para el recibo ${rec.id}`)}
                              className="text-primary hover:text-primary/80 text-[10px] flex items-center gap-1 justify-end cursor-pointer mt-1 font-sans"
                            >
                              <Download className="w-3 h-3" /> Recibo PDF
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* SECTION: TECHNICAL DOCUMENTS */}
              {/* Sin datos falsos: hasta que existan documentos reales
                  subidos (tabla documents + Storage), se muestra un estado
                  honesto en vez de archivos inventados descargables. */}
              {/* ---------------------------------------------------- */}
              {activeSection === "docs" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">// DOCUMENTOS_TECNICOS</span>
                      <h3 className="text-lg font-bold text-foreground mt-0.5">Planos Técnicos y Hojas de Datos</h3>
                      <p className="text-xs text-muted-foreground mt-1 font-sans">
                        Aquí aparecerán los manuales, planos y certificados que tu ejecutivo suba para tu proyecto.
                      </p>
                    </div>
                  </div>

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
                </div>
              )}

              {/* ---------------------------------------------------- */}
              {/* SECTION: WARRANTIES & SUPPORT TICKETS */}
              {/* ---------------------------------------------------- */}
              {activeSection === "tickets" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">// GARANTIAS_SOPORTE</span>
                      <h3 className="text-lg font-bold text-foreground mt-0.5">Garantías y Casos de Soporte</h3>
                      <p className="text-xs text-muted-foreground mt-1 font-sans">
                        Reporte incidentes en taller o ensamble, adjunte evidencias y supervise la respuesta técnica.
                      </p>
                    </div>
                  </div>

                  {/* Split structure: open ticket form + list */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    
                    {/* Ticket Form */}
                    <div className="md:col-span-5 space-y-4 border border-border p-5 rounded-xl bg-background/30">
                      <h4 className="text-xs font-mono text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4" /> Abrir Nuevo Caso
                      </h4>
                      <form onSubmit={handleSubmitTicket} className="space-y-4">
                        <div className="space-y-1.5">
                          <label htmlFor="ticket-ot" className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Orden de Trabajo Relacionada:</label>
                          <select
                            id="ticket-ot"
                            value={newTicketOt}
                            onChange={(e) => setNewTicketOt(e.target.value)}
                            className="w-full bg-background border border-border text-foreground text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                          >
                            {ots.map(ot => (
                              <option key={ot.code} value={ot.code}>{ot.code} - {ot.title.substring(0, 20)}...</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="ticket-severity" className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Criticidad del Reporte:</label>
                          <select
                            id="ticket-severity"
                            value={newTicketSeverity}
                            onChange={(e) => setNewTicketSeverity(e.target.value)}
                            className="w-full bg-background border border-border text-foreground text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                          >
                            <option value="BAJO">BAJO (Dudas técnicas, planos)</option>
                            <option value="MEDIO">MEDIO (Ajustes menores de anclaje)</option>
                            <option value="ALTO">ALTO (Vibración excesiva, fallo de motor)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="ticket-subject" className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Título / Asunto:</label>
                          <Input
                            id="ticket-subject"
                            placeholder="Asunto breve..."
                            value={newTicketSubject}
                            onChange={(e) => setNewTicketSubject(e.target.value)}
                            className="text-xs border-border bg-background"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="ticket-desc" className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Descripción Detallada del Suceso:</label>
                          <textarea
                            id="ticket-desc"
                            rows={3}
                            placeholder="Describa el requerimiento de soporte o incidente físico del ventilador..."
                            value={newTicketDesc}
                            onChange={(e) => setNewTicketDesc(e.target.value)}
                            className="w-full bg-background border border-border text-foreground text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none font-sans"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={isCreatingTicket}
                          className="w-full bg-primary hover:bg-primary/95 text-white font-mono text-xs py-3.5 flex items-center justify-center gap-1.5 rounded-lg cursor-pointer disabled:opacity-50"
                        >
                          {isCreatingTicket ? "Registrando..." : "Registrar Ticket Técnico"}
                        </Button>
                      </form>
                    </div>

                    {/* Tickets List */}
                    <div className="md:col-span-7 space-y-4">
                      <h4 className="text-xs font-mono text-muted-foreground font-bold uppercase tracking-wider">Historial de Tickets Abiertos</h4>
                      <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2">
                        {tickets.map((tck) => (
                          <div key={tck.code} className="border border-border/80 bg-background/55 p-4 rounded-xl space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs font-bold text-primary">{tck.code}</span>
                              <div className="flex gap-1.5">
                                <Badge className={`text-[8px] font-mono border-none ${
                                  tck.severity === "ALTO" || tck.severity === "CRÍTICO" ? "bg-destructive/15 text-destructive" : tck.severity === "MEDIO" ? "bg-amber-500/15 text-amber-600" : "bg-primary/15 text-primary"
                                }`}>
                                  {tck.severity}
                                </Badge>
                                <Badge className={`text-[8px] font-mono border-none ${
                                  tck.status === "RESUELTO" ? "bg-emerald-500/15 text-emerald-500" : "bg-sky-500/15 text-sky-500 animate-pulse"
                                }`}>
                                  {tck.status}
                                </Badge>
                              </div>
                            </div>
                            <h5 className="text-xs font-bold text-foreground font-sans">{tck.subject}</h5>
                            <p className="text-[11px] text-muted-foreground font-sans leading-normal">{tck.desc}</p>
                            <span className="text-[9px] font-mono text-muted-foreground block border-t border-border/40 pt-1.5 mt-2">
                              OT Relacionada: {tck.otCode} • Fecha Reporte: {tck.date}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>
          </div>

          {/* ---------------------------------------------------- */}
          {/* RIGHT COLUMN: CHAT IN LIVE SUPORT (Toggleable sidebar) */}
          {/* ---------------------------------------------------- */}
          {isChatOpen && (
            <div className="lg:col-span-4 border border-border bg-card rounded-2xl p-5 shadow-lg flex flex-col h-[540px] animate-in slide-in-from-right duration-350 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
              
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-inner relative">
                    <User className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Bitácora de Soporte</h4>
                    <span className="text-[9px] font-mono text-muted-foreground block leading-none">Tu ejecutivo responde aquí — no es un chat en tiempo real</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Message Box */}
              <div role="log" aria-live="polite" className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
                {chatMessages.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">Todavía no hay mensajes en este caso.</p>
                )}
                {chatMessages.map((msg) => {
                  const isAgent = msg.sender === "agent";
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[85%] space-y-1 ${isAgent ? "self-start" : "self-end ml-auto"}`}
                    >
                      <span className="text-[8px] font-mono text-muted-foreground block px-1">
                        {msg.name} • {msg.time}
                      </span>
                      <div className={`p-3 rounded-2xl leading-normal ${
                        isAgent 
                          ? "bg-muted text-foreground rounded-tl-none border border-border" 
                          : "bg-primary text-white rounded-tr-none shadow-md shadow-primary/5"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Form */}
              <div className="border-t border-border/80 pt-3 flex items-center gap-2">
                <Input
                  placeholder="Escribe una nota sobre este caso..."
                  value={newMessageText}
                  disabled={isSendingMessage}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  className="text-xs border-border bg-background h-10"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isSendingMessage}
                  className="bg-primary hover:bg-primary/95 text-white p-2.5 h-10 w-10 shrink-0 flex items-center justify-center rounded-lg shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-6 text-center text-[10px] font-mono text-muted-foreground mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" />
            <span>Soporte Técnico Especializado B2B: {telefono} | {razonSocial}</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/privacidad"
              className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Política de Privacidad
            </a>
            <span>Conexión segura — {companyName}: <span className="text-emerald-500 font-bold">// VERIFICADO</span></span>
          </div>
        </div>
      </footer>

      {/* Modal de Perfil (solo clientes reales) */}
      {isClientContact && (
        <ClientProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          clientEmail={clientInfo.email}
          clientName={clientInfo.legalName}
        />
      )}

    </div>
  );
}
