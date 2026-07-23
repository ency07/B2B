"use client";

import { usePortalClientState } from "@/portal/components/dashboard/usePortalClientState";
import { PortalLoadingSkeleton } from "@/portal/components/dashboard/PortalLoadingSkeleton";
import { PortalErrorState } from "@/portal/components/dashboard/PortalErrorState";
import { PortalHeader } from "@/portal/components/dashboard/PortalHeader";
import { WelcomeBar } from "@/portal/components/dashboard/WelcomeBar";
import { MetricCards } from "@/portal/components/dashboard/MetricCards";
import { ActivityFeed } from "@/portal/components/dashboard/ActivityFeed";
import { SectionTabs } from "@/portal/components/dashboard/SectionTabs";
import { RequirementsSection } from "@/portal/components/dashboard/RequirementsSection";
import { QuotesSection } from "@/portal/components/dashboard/QuotesSection";
import { InvoicesSection } from "@/portal/components/dashboard/InvoicesSection";
import { DocumentsSection } from "@/portal/components/dashboard/DocumentsSection";
import { TicketsSection } from "@/portal/components/dashboard/TicketsSection";
import { SupportChatSheet } from "@/portal/components/dashboard/SupportChatSheet";
import { NewTicketSheet } from "@/portal/components/dashboard/NewTicketSheet";
import { PortalFooter } from "@/portal/components/dashboard/PortalFooter";
import { OrderTrackingSection } from "@/portal/components/OrderTrackingSection";
import { ClientProfileModal } from "@/portal/components/ClientProfileModal";
import { NewRequirementSheet } from "@/portal/components/NewRequirementSheet";
import { capture } from "@/lib/analytics";
import type { CustomerPortalProps } from "@/portal/components/dashboard/types";

/**
 * Orquestador de presentación del Portal de Clientes. Vive fuera de app/ a
 * propósito — su único caller es src/app/portal/page.tsx (el Server
 * Component que resuelve la sesión y hace el data-fetching real), y estar
 * fuera del árbol de app/ evita que Next.js lo registre como una ruta propia
 * (antes vivía en app/portal/client/page.tsx, lo que generaba /portal/client
 * como página huérfana que next build intentaba prerenderizar sin props).
 */
export default function CustomerPortal({
  clientInfo,
  jobs: initialJobs = [],
  invoices: initialInvoices = [],
  payments: initialPayments = [],
  tickets: initialTickets = [],
  messages: initialMessages = [],
  documents: initialDocs = [],
  requirements: initialRequirements = [],
  quotes: initialQuotes = [],
  previewClientId = null,
  isPlatformAdmin = false,
  isClientContact = false,
  allClients = [],
  tenantId = null,
  branding = null,
}: CustomerPortalProps) {
  const s = usePortalClientState({
    clientInfo,
    jobs: initialJobs,
    invoices: initialInvoices,
    payments: initialPayments,
    tickets: initialTickets,
    messages: initialMessages,
    requirements: initialRequirements,
    quotes: initialQuotes,
    previewClientId,
    tenantId,
    branding,
  });

  if (s.isLoading) return <PortalLoadingSkeleton />;
  if (s.hasError) {
    return <PortalErrorState onDismiss={() => s.setHasError(false)} onRetry={s.handleResetError} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary)/0.06,transparent_50%)] pointer-events-none" />

      <PortalHeader
        isOffline={s.isOffline}
        setIsOffline={s.setIsOffline}
        setHasError={s.setHasError}
        isPlatformAdmin={isPlatformAdmin}
        isClientContact={isClientContact}
        clientInfo={clientInfo}
        clientName={s.clientName}
        brandName={s.companyName}
        allClients={allClients}
        onOpenProfile={() => s.setIsProfileModalOpen(true)}
        onLogout={s.handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-layer-content">
        <WelcomeBar
          clientNit={s.clientNit}
          clientName={s.clientName}
          onOpenRequirement={() => { s.setIsRequirementSheetOpen(true); capture("portal_requirement_sheet_opened", {}); }}
          isChatOpen={s.isChatOpen}
          onToggleChat={() => s.setIsChatOpen(prev => { capture("portal_chat_toggled", { open: !prev }); return !prev; })}
          chatToggleRef={s.chatToggleRef}
        />

        <MetricCards
          activeOtsCount={s.activeOtsCount}
          unpaidTotal={s.unpaidTotal}
          activeTicketsCount={s.activeTicketsCount}
          openRequirementsCount={s.openRequirementsCount}
          pendingQuotesCount={s.pendingQuotesCount}
          setActiveSection={s.setActiveSection}
        />

        <ActivityFeed
          ots={s.ots}
          invoices={s.invoices}
          requirements={s.requirements}
          setActiveSection={s.setActiveSection}
        />

        <div className="space-y-6">
          <SectionTabs
            activeSection={s.activeSection}
            setActiveSection={s.setActiveSection}
            openRequirementsCount={s.openRequirementsCount}
            pendingInvoicesCount={s.pendingInvoicesCount}
            activeTicketsCount={s.activeTicketsCount}
            pendingQuotesCount={s.pendingQuotesCount}
          />

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 min-h-[480px] shadow-sm">
            {s.activeSection === "requirements" && (
              <RequirementsSection requirements={s.requirements} onNewRequirement={() => s.setIsRequirementSheetOpen(true)} />
            )}

            {s.activeSection === "quotes" && (
              <QuotesSection
                quotes={s.quotes}
                selectedQuote={s.selectedQuote}
                setSelectedQuote={s.setSelectedQuote}
                quoteDetail={s.quoteDetail}
                isLoadingDetail={s.isLoadingQuoteDetail}
                onOpenQuote={s.handleOpenQuote}
                isResponding={s.isRespondingToQuote}
                onRespond={s.handleRespondToQuote}
                onDownloadPdf={s.downloadQuotePdf}
              />
            )}

            {s.activeSection === "ots" && (
              <OrderTrackingSection
                ots={s.ots}
                searchQuery={s.searchQuery}
                setSearchQuery={s.setSearchQuery}
                expandedOt={s.expandedOt}
                setExpandedOt={s.setExpandedOt}
              />
            )}

            {s.activeSection === "invoices" && (
              <InvoicesSection
                invoices={s.invoices}
                receipts={s.receipts}
                invoiceFilter={s.invoiceFilter}
                setInvoiceFilter={s.setInvoiceFilter}
                selectedInvoice={s.selectedInvoice}
                wompiCheckout={s.wompiCheckout}
                isLoadingCheckout={s.isLoadingCheckout}
                onOpenPaymentSheet={s.handleOpenPaymentSheet}
                clientName={s.clientName}
                supportEmail={s.supportEmail}
                telefono={s.telefono}
                downloadInvoicePdf={s.downloadInvoicePdf}
              />
            )}

            {s.activeSection === "docs" && (
              <DocumentsSection documents={initialDocs} onRequestFromExecutive={() => s.setIsChatOpen(true)} />
            )}

            {s.activeSection === "tickets" && (
              <TicketsSection tickets={s.tickets} onNewTicket={() => s.setIsTicketSheetOpen(true)} />
            )}
          </div>
        </div>
      </main>

      <SupportChatSheet
        isOpen={s.isChatOpen}
        setIsOpen={s.setIsChatOpen}
        messages={s.chatMessages}
        newMessageText={s.newMessageText}
        setNewMessageText={s.setNewMessageText}
        isSendingMessage={s.isSendingMessage}
        onSendMessage={s.handleSendMessage}
        chatCloseRef={s.chatCloseRef}
      />

      <PortalFooter companyName={s.companyName} supportEmail={s.supportEmail} />

      <NewTicketSheet
        open={s.isTicketSheetOpen}
        onOpenChange={s.setIsTicketSheetOpen}
        ots={s.ots}
        newTicketOt={s.newTicketOt}
        setNewTicketOt={s.setNewTicketOt}
        newTicketSeverity={s.newTicketSeverity}
        setNewTicketSeverity={s.setNewTicketSeverity}
        newTicketSubject={s.newTicketSubject}
        setNewTicketSubject={s.setNewTicketSubject}
        newTicketDesc={s.newTicketDesc}
        setNewTicketDesc={s.setNewTicketDesc}
        isCreatingTicket={s.isCreatingTicket}
        onSubmit={s.handleSubmitTicket}
      />

      <NewRequirementSheet
        open={s.isRequirementSheetOpen}
        onOpenChange={s.setIsRequirementSheetOpen}
        previewClientId={previewClientId}
        jobs={s.ots.map(o => ({ code: o.code, title: o.title }))}
        onCreated={(req) => s.setRequirements(prev => [req, ...prev])}
      />

      {isClientContact && (
        <ClientProfileModal
          isOpen={s.isProfileModalOpen}
          onClose={() => s.setIsProfileModalOpen(false)}
          clientEmail={clientInfo.email}
          clientName={clientInfo.legalName}
          clientNit={clientInfo.taxId}
        />
      )}
    </div>
  );
}
