"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Sparkles,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Download,
  CreditCard,
  AlertTriangle,
  Wind,
  ShieldCheck,
  UserCheck,
  FileCode,
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
import { Spinner } from "@/platform/ui/spinner";
import { Skeleton } from "@/platform/ui/skeleton";
import { getTenantConfig, MOCK_TENANTS } from "@/platform/tenant/tenant";
import { getTenantBranding } from "@/web/actions/branding";
import { ThemeCustomizer } from "@/platform/components/theme-customizer";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/platform/ui/sheet";
import { OrderTrackingSection } from "@/portal/components/OrderTrackingSection";
import type {
  ClientJob,
  ClientInvoice,
  ClientPayment,
} from "@/portal/actions/portal";

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
  isPlatformAdmin = false,
  allClients = [],
}: {
  clientInfo: PortalClientInfo;
  jobs?: ClientJob[];
  invoices?: ClientInvoice[];
  payments?: ClientPayment[];
  isPlatformAdmin?: boolean;
  allClients?: Array<{ id: string; legalName: string; tenantCode: string }>;
}) {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant") || "acme";
  const config = getTenantConfig(tenantParam);

  // States
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeSection, setActiveSection] = React.useState<"ots" | "invoices" | "docs" | "tickets">("ots");
  const [brandingState, setBrandingState] = React.useState<any>(null);

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
  const telefono = brandingState?.telefono_principal || config.contactPhone || "+57 300 000 0000";
  const supportEmail = brandingState?.email_corporativo || config.contactEmail || "soporte@empresa.com";

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
  const [expandedOt, setExpandedOt] = React.useState<string | null>("JOB-2026-001");
  const [downloadProgress, setDownloadProgress] = React.useState<Record<string, number>>({});
  const router = useRouter();

  // Client info derived dynamically
  const [clientName, setClientName] = React.useState("Cliente B2B");
  const [clientNit, setClientNit] = React.useState("NIT-000.000.000-0");

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
  const [invoices, setInvoices] = React.useState(
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
  const [receipts, setReceipts] = React.useState(
    initialPayments.map((p) => ({
      id: p.id,
      code: p.invoiceCode,
      date: p.paidAt,
      amount: p.amount,
      method: p.method,
      status: "APROBADO",
    }))
  );

  // Support tickets
  const [tickets, setTickets] = React.useState([
    {
      code: "TCK-2026-091",
      otCode: "JOB-2026-001",
      date: "2026-06-14",
      subject: "Duda sobre diámetro de brida de acople",
      severity: "BAJO",
      status: "RESUELTO",
      desc: "Queremos confirmar si el diámetro de brida externa de 750mm es compatible con ductería helicoidal estándar de 30 pulgadas."
    },
    {
      code: "TCK-2026-095",
      otCode: "JOB-2026-001",
      date: "2026-06-20",
      subject: "Solicitud de presenciar pruebas de balanceo dinámico",
      severity: "MEDIO",
      status: "EN TRÁMITE",
      desc: "Nuestro interventor de obra desea asistir de manera remota vía Teams a la calibración dinámica del motor."
    }
  ]);

  // New ticket form
  const [newTicketOt, setNewTicketOt] = React.useState("JOB-2026-001");
  const [newTicketSeverity, setNewTicketSeverity] = React.useState("MEDIO");
  const [newTicketSubject, setNewTicketSubject] = React.useState("");
  const [newTicketDesc, setNewTicketDesc] = React.useState("");

  // Chat message thread
  const [chatMessages, setChatMessages] = React.useState([
    {
      id: 1,
      sender: "agent",
      name: "Ing. Carlos Mendoza (Soporte Técnico)",
      time: "10:30",
      text: "Estimada Sophia, hemos completado las simulaciones CFD del extractor VT-7500. El reporte de excentricidades está listo en descargas. ¿Tienes alguna duda de montaje?"
    }
  ]);
  const [newMessageText, setNewMessageText] = React.useState("");
  const [isChatOpen, setIsChatOpen] = React.useState(false);

  // Payment simulator variables
  const [paymentInProgress, setPaymentInProgress] = React.useState(false);
  const [paymentStep, setPaymentStep] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState<"pse" | "card">("pse");
  const [selectedInvoice, setSelectedInvoice] = React.useState<typeof invoices[0] | null>(null);
  const [paymentSuccess, setPaymentSuccess] = React.useState(false);

  // PSE form variables
  const [pseBank, setPseBank] = React.useState("Bancolombia");
  const [pseEmail, setPseEmail] = React.useState(supportEmail);

  // Card form variables
  const [cardNumber, setCardNumber] = React.useState("•••• •••• •••• 4242");
  const [cardName, setCardName] = React.useState("SOPHIA WILLIAMS");

  // Search filter
  const [searchQuery, setSearchQuery] = React.useState("");

  // Simulated initial load
  React.useEffect(() => {
    setClientName(config.name || "Cliente Activo");
    setClientNit("NIT-000.000.000-0");

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, [tenantParam]);

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

  const isValidTenant = tenantParam ? Object.keys(MOCK_TENANTS).includes(tenantParam) : true;
  const isPortalFunctional = isValidTenant;

  if (!isPortalFunctional) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 text-center space-y-6 shadow-2xl">
          <div className="mx-auto w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center border border-border">
             {brandingState?.logo_url || config.logoUrl ? (
               <img src={brandingState?.logo_url || config.logoUrl} alt={companyName} className="w-12 h-12 object-contain" />
             ) : (
               <Building className="w-10 h-10 text-muted-foreground" />
             )}
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{companyName}</h1>
          <p className="text-muted-foreground text-sm">
            Acceso exclusivo para clientes activos.
          </p>
          <div className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
            Contacto: {supportEmail}
          </div>
          <Button variant="outline" className="w-full bg-muted hover:bg-muted/80 border-border text-foreground transition-colors" onClick={() => window.location.href = "/"}>
            Volver al sitio
          </Button>
        </div>
      </main>
    );
  }

  // Simulate file download with progress bar
  const handleDownload = (filename: string) => {
    if (downloadProgress[filename]) return;
    setDownloadProgress(prev => ({ ...prev, [filename]: 1 }));
    let progress = 1;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 25) + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setTimeout(() => {
          setDownloadProgress(prev => {
            const next = { ...prev };
            delete next[filename];
            return next;
          });
          toast.success(`Descarga completada con éxito: ${filename}`);
        }, 800);
      }
      setDownloadProgress(prev => ({ ...prev, [filename]: Math.min(progress, 100) }));
    }, 1500);
  };

  // Simulate interactive PSE/Card payment gateway process
  const triggerPaymentFlow = () => {
    if (!selectedInvoice) return;
    setPaymentInProgress(true);
    setPaymentSuccess(false);
    setPaymentStep(0);

    const steps = [
      "Conectando de forma segura SSL a PSE/Wompi...",
      "Validando fondos y autorización 3D Secure...",
      "Consolidando balance y actualizando base de datos en ERP...",
      "Confirmando transferencia y generando folio de caja digital..."
    ];

    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current >= steps.length) {
        clearInterval(interval);
        // Process actual state update
        setInvoices(prev => prev.map(inv => 
          inv.code === selectedInvoice.code ? { ...inv, status: "PAGADA", paid: inv.total } : inv
        ));
        // Register payment receipt
        setReceipts(prev => [
          ...prev,
          {
            id: `REC-2026-${Math.floor(Math.random() * 900) + 100}`,
            code: selectedInvoice.code,
            date: new Date().toISOString().split("T")[0],
            amount: selectedInvoice.total - selectedInvoice.paid,
            method: paymentMethod === "pse" ? `PSE (${pseBank})` : "Credit Card",
            status: "APROBADO"
          }
        ]);
        setPaymentSuccess(true);
        setPaymentInProgress(false);
      } else {
        setPaymentStep(current);
      }
    }, 1200);
  };

  // Chat message send & agent response simulation
  const handleSendMessage = () => {
    if (!newMessageText.trim()) return;
    const userMsg = {
      id: Date.now(),
      sender: "client",
      name: clientName,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: newMessageText
    };
    setChatMessages(prev => [...prev, userMsg]);
    const typedText = newMessageText;
    setNewMessageText("");

    // Trigger auto response
    setTimeout(() => {
      let replyText = `Entendido. Estoy verificando los datos técnicos en el taller y le responderé lo antes posible.`;
      const lower = typedText.toLowerCase();

      if (lower.includes("entrega") || lower.includes("cuando") || lower.includes("fecha")) {
        replyText = "Ing. Carlos Mendoza (Soporte): Revisando la bitácora del extractor VT-7500 (JOB-2026-001), terminamos el balanceo dinámico ayer. Hoy pasa a pruebas en túnel de viento y el despacho está en fecha para el 25 de junio.";
      } else if (lower.includes("pago") || lower.includes("factura") || lower.includes("saldo")) {
        replyText = "Ing. Carlos Mendoza (Soporte): Registré la simulación de pago del saldo final. El sistema contable está procesando la validación del comprobante. Verás el saldo actualizado en breve.";
      } else if (lower.includes("planos") || lower.includes("dwg") || lower.includes("cad") || lower.includes("step")) {
        replyText = "Ing. Carlos Mendoza (Soporte): Todos los planos dimensionales en DWG y los archivos paramétricos en STEP se encuentran listos para descargar en la pestaña de Repositorio de Ingeniería.";
      } else if (lower.includes("vibracion") || lower.includes("pruebas") || lower.includes("ruido")) {
        replyText = "Ing. Carlos Mendoza (Soporte): Las pruebas del motor VT-7500 arrojaron un nivel de vibración de 1.8 mm/s, muy por debajo de los 2.5 mm/s que exige la norma. Excelente balanceo dinámico.";
      }

      setChatMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "agent",
        name: "Ing. Carlos Mendoza (Soporte Técnico)",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: replyText
      }]);
    }, 1500);
  };

  // Submit a warranty or service ticket
  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketSubject.trim() || !newTicketDesc.trim()) return;

    const newTicket = {
      code: `TCK-2026-${Math.floor(Math.random() * 900) + 100}`,
      otCode: newTicketOt,
      date: new Date().toISOString().split("T")[0],
      subject: newTicketSubject,
      severity: newTicketSeverity,
      status: "EN TRÁMITE",
      desc: newTicketDesc
    };

    setTickets(prev => [newTicket, ...prev]);
    setNewTicketSubject("");
    setNewTicketDesc("");
    toast.success(`Ticket de soporte técnico ${newTicket.code} registrado con éxito.`);
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
            <span className="text-xs font-mono text-destructive uppercase tracking-widest font-bold">// ERROR_CONNECTION_TIMEOUT</span>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Fallo de Enlace al Servidor</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No se pudo consolidar la conexión segura a la base de datos de producción de {companyName}. La solicitud ha expirado.
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

      {/* Administrator Client Switcher Banner */}
      {isPlatformAdmin && (
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
              {isChatOpen ? "Cerrar Soporte" : "Soporte Técnico en Vivo"}
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
                {unpaidTotal > 0 ? "Folios en Mora" : "Cuenta al Día"}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 font-sans">Plazo máximo de saldo final: 2026-07-05</p>
          </div>

          {/* Metric 3 */}
          <div className="group rounded-2xl border border-border/80 bg-card p-6 shadow-md hover:shadow-lg transition-all duration-300 hover:translate-y-[-2px] relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/20 group-hover:bg-amber-500 transition-colors" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">Casos de Soporte / Garantías</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-bold font-mono text-foreground">{activeTicketsCount} Activos</span>
              <Badge variant="secondary" className="text-[9px] font-mono bg-amber-500/10 text-amber-600 border-none">Checklist Técnico</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 font-sans">Interventoría de obra y calibración</p>
          </div>

        </div>

        {/* Layout split with chat sidebar option */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT/CENTER WORKSPACE (9 cols if chat is open, 12 if closed) */}
          <div className={`space-y-6 transition-all duration-300 ${isChatOpen ? "lg:col-span-8" : "lg:col-span-12"}`}>
            
            {/* Tabbed Navigation */}
            <div className="flex border-b border-border pb-px text-xs font-mono overflow-x-auto gap-2">
              {[
                { id: "ots", label: "Taller en Vivo (OTs)" },
                { id: "invoices", label: "Facturas y Recibos" },
                { id: "docs", label: "Planos y Archivos CAD" },
                { id: "tickets", label: "Garantías e Interventoría" }
              ].map((tab) => (
                <button
                  key={tab.id}
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
                      <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">// BILLING_ACCOUNT_SLA</span>
                      <h3 className="text-lg font-bold text-foreground mt-0.5">Cartera de Facturación Industrial</h3>
                      <p className="text-xs text-muted-foreground mt-1 font-sans">
                        Consulte los vencimientos, descargue los folios y realice abonos a través del gateway bancario.
                      </p>
                    </div>
                  </div>

                  {/* Invoices List */}
                  <div className="rounded-xl border border-border bg-background/20 overflow-hidden">
                    <table className="w-full border-collapse text-left text-xs font-mono">
                      <thead className="bg-muted/55 border-b border-border text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                        <tr>
                          <th className="p-4">Folio Factura</th>
                          <th className="p-4">Fecha Emisión</th>
                          <th className="p-4">Detalle del Concepto</th>
                          <th className="p-4 text-right">Monto Total</th>
                          <th className="p-4 text-right">Saldo en Mora</th>
                          <th className="p-4 text-center">Estado</th>
                          <th className="p-4 text-center">Acciones</th>
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
                                          onClick={() => {
                                            setSelectedInvoice(inv);
                                            setPaymentSuccess(false);
                                          }}
                                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono h-8 px-3 flex items-center gap-1 cursor-pointer"
                                        >
                                          <CreditCard className="w-3.5 h-3.5" /> Pagar en Línea
                                        </Button>
                                      </SheetTrigger>
                                      
                                      {/* PAYMENT GATEWAY SIMULATION DRAWER */}
                                      <SheetContent className="bg-card border-l border-border max-w-[85vw] sm:max-w-[480px]">
                                        <div className="space-y-6 pt-6 font-sans">
                                          <div className="space-y-1">
                                            <span className="text-[10px] font-mono text-primary font-bold uppercase tracking-wider">// SECURE_B2B_GATEWAY</span>
                                            <h3 className="text-lg font-bold text-foreground">Pasarela de Pago Wompi PSE</h3>
                                            <p className="text-xs text-muted-foreground font-sans">
                                              Liquidación segura de folios de ingeniería {companyName}.
                                            </p>
                                          </div>

                                          {selectedInvoice && (
                                            <div className="rounded-xl border border-border bg-background/55 p-4 space-y-2 font-mono text-xs">
                                              <div className="flex justify-between"><span className="text-muted-foreground">Factura:</span><span className="text-primary font-bold">{selectedInvoice.code}</span></div>
                                              <div className="flex justify-between"><span className="text-muted-foreground">Valor a Pagar:</span><span className="text-foreground font-bold">{formatCurrency(selectedInvoice.total - selectedInvoice.paid)}</span></div>
                                              <div className="flex justify-between border-t border-border pt-2 mt-2"><span className="text-muted-foreground">Cliente:</span><span className="text-foreground font-sans font-bold">{clientName}</span></div>
                                            </div>
                                          )}

                                          {/* Payment forms states */}
                                          {!paymentInProgress && !paymentSuccess && (
                                            <div className="space-y-5">
                                              {/* Method Selector */}
                                              <div className="flex rounded-lg border border-border p-1 bg-background/50">
                                                <button
                                                  onClick={() => setPaymentMethod("pse")}
                                                  className={`flex-1 text-center py-2 text-xs font-mono rounded cursor-pointer transition-all ${paymentMethod === "pse" ? "bg-primary text-white font-bold" : "text-muted-foreground hover:text-foreground"}`}
                                                >
                                                  Transferencia PSE
                                                </button>
                                                <button
                                                  onClick={() => setPaymentMethod("card")}
                                                  className={`flex-1 text-center py-2 text-xs font-mono rounded cursor-pointer transition-all ${paymentMethod === "card" ? "bg-primary text-white font-bold" : "text-muted-foreground hover:text-foreground"}`}
                                                >
                                                  Tarjeta de Crédito
                                                </button>
                                              </div>

                                              {paymentMethod === "pse" ? (
                                                <div className="space-y-4">
                                                  <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-muted-foreground">Seleccione su Entidad Bancaria:</label>
                                                    <select 
                                                      value={pseBank}
                                                      onChange={(e) => setPseBank(e.target.value)}
                                                      className="w-full bg-background border border-border text-foreground text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                                                    >
                                                      <option value="Bancolombia">Bancolombia S.A.</option>
                                                      <option value="Banco de Bogota">Banco de Bogotá</option>
                                                      <option value="Davivienda">Davivienda S.A.</option>
                                                      <option value="BBVA">BBVA Colombia</option>
                                                      <option value="Banco de Occidente">Banco de Occidente</option>
                                                    </select>
                                                  </div>
                                                  <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-muted-foreground">Correo Registrado en PSE:</label>
                                                    <Input 
                                                      value={pseEmail}
                                                      onChange={(e) => setPseEmail(e.target.value)}
                                                      className="text-xs font-mono border-border bg-background"
                                                    />
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="space-y-4">
                                                  <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-muted-foreground">Número de Tarjeta:</label>
                                                    <Input 
                                                      value={cardNumber}
                                                      onChange={(e) => setCardNumber(e.target.value)}
                                                      className="text-xs font-mono border-border bg-background"
                                                    />
                                                  </div>
                                                  <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-muted-foreground">Nombre del Tarjetahabiente:</label>
                                                    <Input 
                                                      value={cardName}
                                                      onChange={(e) => setCardName(e.target.value)}
                                                      className="text-xs font-mono border-border bg-background"
                                                    />
                                                  </div>
                                                </div>
                                              )}

                                              <Button 
                                                onClick={triggerPaymentFlow}
                                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs py-4 flex items-center justify-center gap-2 rounded-xl shadow-lg hover:shadow-emerald-600/10 cursor-pointer"
                                              >
                                                <ShieldCheck className="w-4 h-4" /> Autorizar Pago Bancario
                                              </Button>
                                            </div>
                                          )}

                                          {/* Payment in progress loader */}
                                          {paymentInProgress && (
                                            <div className="py-12 text-center space-y-6 animate-pulse">
                                              <Spinner className="w-10 h-10 mx-auto text-primary" />
                                              <div className="space-y-2">
                                                <span className="text-[10px] font-mono text-muted-foreground uppercase block tracking-widest">// CONNECTING_GATEWAY_NET</span>
                                                <p className="text-xs text-foreground font-mono font-bold">
                                                  {paymentStep === 0 && "Estableciendo canal seguro SSL a PSE/Wompi..."}
                                                  {paymentStep === 1 && "Validando fondos y autorización 3D Secure..."}
                                                  {paymentStep === 2 && "Consolidando balance y actualizando base de datos en ERP..."}
                                                  {paymentStep === 3 && "Confirmando transferencia y generando folio de caja digital..."}
                                                </p>
                                                <div className="h-1 w-48 bg-muted rounded-full mx-auto overflow-hidden">
                                                  <div className="h-full bg-primary animate-pulse" style={{ width: `${(paymentStep + 1) * 25}%` }} />
                                                </div>
                                              </div>
                                            </div>
                                          )}

                                          {/* Payment Success state */}
                                          {paymentSuccess && (
                                            <div className="py-12 text-center space-y-6 animate-in zoom-in-95 duration-350">
                                              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                                                <CheckCircle2 className="w-8 h-8" />
                                              </div>
                                              <div className="space-y-2">
                                                <span className="text-[10px] font-mono text-emerald-500 font-bold uppercase block tracking-widest">// TRANSACCIÓN_ACREDITADA</span>
                                                <h4 className="text-lg font-bold text-foreground">Pago Recibido con Éxito</h4>
                                                <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                                                  La transferencia fue conciliada en el libro de caja y el saldo restante del folio ha cambiado a $0.
                                                </p>
                                              </div>
                                              <div className="border-t border-border pt-4 mt-6">
                                                <SheetClose asChild>
                                                  <Button className="bg-primary hover:bg-primary/95 text-white text-xs font-mono w-full cursor-pointer">
                                                    Volver a Facturas
                                                  </Button>
                                                </SheetClose>
                                              </div>
                                            </div>
                                          )}

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
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest block font-bold">// TRANSACTION_ARCHIVE</span>
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
              {/* ---------------------------------------------------- */}
              {activeSection === "docs" && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">// CAD_ENGINEERING_VAULT</span>
                      <h3 className="text-lg font-bold text-foreground mt-0.5">Planos Técnicos y Hojas de Datos</h3>
                      <p className="text-xs text-muted-foreground mt-1 font-sans">
                        Descargue manuales de mantenimiento, archivos paramétricos en 3D STEP y reportes de excentricidad.
                      </p>
                    </div>
                  </div>

                  {/* Documents Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: "Manual de Operación y Mantenimiento Axiales", type: "PDF Manual", desc: "Lineamientos de engrase de balineras y alineación de bandas motoras.", size: "4.2 MB", filename: "Manual-Axial-VT.pdf", icon: FileText },
                      { title: "Plano Vectorial CAD Extractor Ax-7500", type: "DWG Blueprint", desc: "Plano dimensional completo de anclajes de obra y diámetros.", size: "12.8 MB", filename: "AX-7500-REF.dwg", icon: FileCode },
                      { title: "Reporte de Balanceo Dinámico ISO G2.5", type: "Certificado QA", desc: "Reporte de vibración y calibración de excentricidad firmado por taller.", size: "1.5 MB", filename: "Certificado-Balanceo-JOB-001.pdf", icon: ShieldCheck },
                      { title: "Curvas de Rendimiento Aerodinámico VT", type: "Catálogo PDF", desc: "Gráfico técnico de Caudal (CFM) contra presión estática (inWG).", size: "6.8 MB", filename: "Curvas-Rendimiento-VT.pdf", icon: Wind }
                    ].map((doc, idx) => {
                      const Icon = doc.icon;
                      const progress = downloadProgress[doc.filename];
                      const isDownloading = progress !== undefined;

                      return (
                        <div key={idx} className="border border-border/80 bg-background/25 hover:border-primary/30 p-4 rounded-xl flex items-center justify-between gap-4 transition-all duration-300">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center text-primary shrink-0 shadow-sm">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="space-y-0.5">
                              <h4 className="text-xs font-bold text-foreground">{doc.title}</h4>
                              <p className="text-[9px] text-muted-foreground font-mono uppercase">{doc.type} • {doc.size}</p>
                              <p className="text-[11px] text-muted-foreground font-sans leading-normal pt-1">{doc.desc}</p>
                            </div>
                          </div>
                          <Button 
                            onClick={() => handleDownload(doc.filename)}
                            className="bg-background border border-border hover:border-primary/50 text-foreground hover:text-primary p-2.5 h-9 rounded-lg cursor-pointer"
                            disabled={isDownloading}
                          >
                            {isDownloading ? (
                              <span className="text-[9px] font-mono">{progress}%</span>
                            ) : (
                              <Download className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      );
                    })}
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
                      <span className="text-[10px] font-mono tracking-widest text-primary uppercase font-bold">// SERVICE_WARRANTY_HUD</span>
                      <h3 className="text-lg font-bold text-foreground mt-0.5">Garantías y Casos de Interventoría</h3>
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
                          <label className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Orden de Trabajo Relacionada:</label>
                          <select 
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
                          <label className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Criticidad del Reporte:</label>
                          <select 
                            value={newTicketSeverity}
                            onChange={(e) => setNewTicketSeverity(e.target.value)}
                            className="w-full bg-background border border-border text-foreground text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none"
                          >
                            <option value="BAJO">BAJO (Dudas técnicas, planos)</option>
                            <option value="MEDIO">MEDIO (Ajustes menores de anclaje)</option>
                            <option value="CRÍTICO">CRÍTICO (Vibración excesiva, fallo de motor)</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Título / Asunto:</label>
                          <Input 
                            placeholder="Asunto breve..."
                            value={newTicketSubject}
                            onChange={(e) => setNewTicketSubject(e.target.value)}
                            className="text-xs border-border bg-background"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-mono text-muted-foreground uppercase font-bold">Descripción Detallada del Suceso:</label>
                          <textarea
                            rows={3}
                            placeholder="Describa el requerimiento de soporte o incidente físico del ventilador..."
                            value={newTicketDesc}
                            onChange={(e) => setNewTicketDesc(e.target.value)}
                            className="w-full bg-background border border-border text-foreground text-xs rounded-lg p-2.5 focus:ring-1 focus:ring-primary focus:outline-none font-sans"
                          />
                        </div>
                        <Button 
                          type="submit"
                          className="w-full bg-primary hover:bg-primary/95 text-white font-mono text-xs py-3.5 flex items-center justify-center gap-1.5 rounded-lg cursor-pointer"
                        >
                          Registrar Ticket Técnico
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
                                  tck.severity === "CRÍTICO" ? "bg-destructive/15 text-destructive" : tck.severity === "MEDIO" ? "bg-amber-500/15 text-amber-600" : "bg-primary/15 text-primary"
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
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border border-card" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Ing. Carlos Mendoza</h4>
                    <span className="text-[9px] font-mono text-muted-foreground block leading-none">Director de Ingeniería</span>
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
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 text-xs">
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
                  placeholder="Consulte avance técnico, entregas..."
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  className="text-xs border-border bg-background h-10"
                />
                <Button 
                  onClick={handleSendMessage}
                  className="bg-primary hover:bg-primary/95 text-white p-2.5 h-10 w-10 shrink-0 flex items-center justify-center rounded-lg shadow-md cursor-pointer"
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
          <div>
            <span>Conexión Servidor {companyName}: <span className="text-emerald-500 font-bold">// SECURE_VERIFIED</span></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
