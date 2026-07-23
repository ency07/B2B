"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { getPortalBrowserClient } from "@/platform/auth/clients";
import { getTenantConfig } from "@/platform/tenant/tenant";
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
import { createWompiCheckout, type WompiCheckoutResult } from "@/portal/actions/payments";
import { capture } from "@/lib/analytics";
import type {
  PortalClientInfo,
  PortalBranding,
  PortalOt,
  PortalInvoice,
  PortalReceipt,
  PortalTicket,
  PortalChatMessage,
  PortalActiveSection,
  PortalInvoiceFilter,
} from "@/portal/components/dashboard/types";

export const formatCurrency = (amount: number) => {
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
};

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
}

interface UsePortalClientStateInput {
  clientInfo: PortalClientInfo;
  jobs: ClientJob[];
  invoices: ClientInvoice[];
  payments: ClientPayment[];
  tickets: ClientSupportTicket[];
  messages: ClientSupportMessage[];
  requirements: ClientRequirement[];
  previewClientId: string | null;
  tenantId?: string | null;
  branding?: PortalBranding | null;
}

export function usePortalClientState({
  clientInfo,
  jobs: initialJobs,
  invoices: initialInvoices,
  payments: initialPayments,
  tickets: initialTickets,
  messages: initialMessages,
  requirements: initialRequirements,
  previewClientId,
  branding: initialBranding = null,
}: UsePortalClientStateInput) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenantParam = searchParams.get("tenant") || "acme";
  const config = getTenantConfig(tenantParam);

  const [isLoading, setIsLoading] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState<PortalActiveSection>("ots");
  // Branding resuelto en el servidor (page.tsx) y pasado como prop — sin
  // re-fetch client-side ni flash de marca.
  const [brandingState] = React.useState<PortalBranding | null>(initialBranding);
  const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
  const [isRequirementSheetOpen, setIsRequirementSheetOpen] = React.useState(false);
  const [requirements, setRequirements] = React.useState<ClientRequirement[]>(initialRequirements);
  const [invoiceFilter, setInvoiceFilter] = React.useState<PortalInvoiceFilter>("ALL");
  const [isTicketSheetOpen, setIsTicketSheetOpen] = React.useState(false);
  const [isOffline, setIsOffline] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const [expandedOt, setExpandedOt] = React.useState<string | null>(initialJobs[0]?.code ?? null);

  const [clientName] = React.useState(clientInfo.legalName);
  const [clientNit] = React.useState(clientInfo.taxId);

  const [ots, setOts] = React.useState<PortalOt[]>(
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

  const [invoices] = React.useState<PortalInvoice[]>(
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

  const [receipts] = React.useState<PortalReceipt[]>(
    initialPayments.map((p) => ({
      id: p.id,
      code: p.invoiceCode,
      date: p.paidAt,
      amount: p.amount,
      method: p.method,
      status: "APROBADO",
    }))
  );

  const [tickets, setTickets] = React.useState<PortalTicket[]>(
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

  const [newTicketOt, setNewTicketOt] = React.useState(ots[0]?.code ?? "");
  const [newTicketSeverity, setNewTicketSeverity] = React.useState("MEDIO");
  const [newTicketSubject, setNewTicketSubject] = React.useState("");
  const [newTicketDesc, setNewTicketDesc] = React.useState("");

  // Bitácora de soporte — mensajes reales, persistidos en
  // client_support_messages. No hay respuesta automática: quien usa el
  // Portal hoy es siempre un admin en modo revisión (ver
  // src/lib/portal-auth.ts), no existe todavía login real de cliente
  // externo, así que no hay "otra parte" que conteste de verdad.
  const [chatMessages, setChatMessages] = React.useState<PortalChatMessage[]>(
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

  // Payment: el Widget de Wompi se activa solo si hay credenciales
  // configuradas (WOMPI_PUBLIC_KEY/WOMPI_INTEGRITY_SECRET en .env). Sin
  // ellas, createWompiCheckout retorna { unavailable: true } y se muestra un
  // estado honesto — nunca se simula un pago exitoso sin que haya ocurrido
  // una transacción real.
  const [selectedInvoice, setSelectedInvoice] = React.useState<PortalInvoice | null>(null);
  const [wompiCheckout, setWompiCheckout] = React.useState<WompiCheckoutResult | null>(null);
  const [isLoadingCheckout, setIsLoadingCheckout] = React.useState(false);

  const handleOpenPaymentSheet = async (invoice: PortalInvoice) => {
    setSelectedInvoice(invoice);
    setWompiCheckout(null);
    setIsLoadingCheckout(true);
    try {
      const result = await createWompiCheckout(previewClientId, invoice.id);
      setWompiCheckout(result);
    } catch (err) {
      console.error("Error iniciando checkout de Wompi:", err);
      setWompiCheckout({ unavailable: true });
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  const [searchQuery, setSearchQuery] = React.useState("");

  const companyName = brandingState?.nombre_comercial || config.name;
  const supportEmail = brandingState?.email_corporativo || config.contactEmail || "soporte@ventitech.com";
  const telefono = brandingState?.telefono_principal || config.contactPhone || "+57 601 000 0000";
  const logoUrl = brandingState?.logo_claro_url || brandingState?.logo_oscuro_url || "";

  React.useEffect(() => {
    if (brandingState?.nombre_comercial) {
      const shortName = brandingState.nombre_comercial.split(" ")[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOts((prev) =>
        prev.map((ot) => {
          if (ot.code === "JOB-2026-001") {
            return { ...ot, title: `Extractor Axial ${shortName} VT-7500 CFM` };
          }
          return ot;
        })
      );
    }
  }, [brandingState]);

  // Session start analytics
  React.useEffect(() => {
    capture("portal_session_start", { clientTaxId: clientInfo.taxId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gestion de foco: al abrir/cerrar el chat, mover el foco al elemento correspondiente
  React.useEffect(() => {
    if (isChatOpen) {
      chatCloseRef.current?.focus();
    } else {
      chatToggleRef.current?.focus();
    }
  }, [isChatOpen]);

  const handleSendMessage = async () => {
    if (!newMessageText.trim() || isSendingMessage) return;
    const body = newMessageText;
    setNewMessageText("");
    setIsSendingMessage(true);
    try {
      const saved = await sendClientMessage(previewClientId, body);
      setChatMessages((prev) => [
        ...prev,
        {
          id: saved.id,
          sender: saved.senderType === "CLIENT" ? "client" : "agent",
          name: saved.senderLabel || (saved.senderType === "CLIENT" ? clientInfo.legalName : "Equipo de soporte"),
          time: new Date(saved.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          text: saved.body,
        },
      ]);
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
      setTickets((prev) => [
        {
          code: created.code,
          otCode: created.jobId || newTicketOt,
          date: created.createdAt.substring(0, 10),
          subject: created.subject,
          severity: created.severity,
          status: created.status,
          desc: created.description,
        },
        ...prev,
      ]);
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
  };

  // Genera y descarga PDF de factura usando jspdf
  const downloadInvoicePdf = async (invoiceCode: string) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "letter" });
      const inv = invoices.find((i) => i.code === invoiceCode);
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
    const supabase = getPortalBrowserClient();
    await supabase.auth.signOut();
    const tenantQs = searchParams.get("tenant");
    const loginUrl = `/login${tenantQs ? `?tenant=${tenantQs}` : ""}`;
    router.push(loginUrl);
    router.refresh();
  };

  const unpaidTotal = invoices.reduce((sum, inv) => sum + (inv.status === "PENDIENTE" ? inv.total - inv.paid : 0), 0);
  const activeOtsCount = ots.filter((o) => o.status !== "DESPACHO").length;
  const activeTicketsCount = tickets.filter((t) => t.status !== "RESUELTO").length;
  const openRequirementsCount = requirements.filter((r) => !["CERRADO", "CANCELADO"].includes(r.status)).length;
  const pendingInvoicesCount = invoices.filter((i) => i.status === "PENDIENTE").length;

  return {
    config,
    isLoading,
    hasError,
    setHasError,
    handleResetError,
    isOffline,
    setIsOffline,
    activeSection,
    setActiveSection,
    clientName,
    clientNit,
    companyName,
    supportEmail,
    telefono,
    logoUrl,
    ots,
    invoices,
    receipts,
    tickets,
    setTickets,
    requirements,
    setRequirements,
    unpaidTotal,
    activeOtsCount,
    activeTicketsCount,
    openRequirementsCount,
    pendingInvoicesCount,
    invoiceFilter,
    setInvoiceFilter,
    selectedInvoice,
    setSelectedInvoice,
    wompiCheckout,
    isLoadingCheckout,
    handleOpenPaymentSheet,
    downloadInvoicePdf,
    searchQuery,
    setSearchQuery,
    expandedOt,
    setExpandedOt,
    isProfileModalOpen,
    setIsProfileModalOpen,
    isRequirementSheetOpen,
    setIsRequirementSheetOpen,
    isTicketSheetOpen,
    setIsTicketSheetOpen,
    newTicketOt,
    setNewTicketOt,
    newTicketSeverity,
    setNewTicketSeverity,
    newTicketSubject,
    setNewTicketSubject,
    newTicketDesc,
    setNewTicketDesc,
    isCreatingTicket,
    handleSubmitTicket,
    chatMessages,
    newMessageText,
    setNewMessageText,
    isSendingMessage,
    handleSendMessage,
    isChatOpen,
    setIsChatOpen,
    chatToggleRef,
    chatCloseRef,
    handleLogout,
  };
}
