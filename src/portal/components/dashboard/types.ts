import type {
  ClientJob,
  ClientInvoice,
  ClientPayment,
  ClientSupportTicket,
  ClientSupportMessage,
  ClientRequirement,
} from "@/portal/actions/portal";

export interface PortalClientInfo {
  legalName: string;
  taxId: string;
  email: string;
}

export interface CustomerPortalProps {
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
  tenantId?: string | null;
}

/** OT normalizada para uso en el UI del portal (deriva de ClientJob). */
export interface PortalOt {
  id: string;
  code: string;
  title: string;
  status: string;
  progress: number;
  tech: string;
  startDate: string;
  endDate: string;
  cadFile: string;
  specFile: string;
}

/** Factura normalizada para uso en el UI del portal (deriva de ClientInvoice). */
export interface PortalInvoice {
  id: string;
  code: string;
  date: string;
  concept: string;
  total: number;
  paid: number;
  status: string;
}

/** Recibo de pago normalizado (deriva de ClientPayment). */
export interface PortalReceipt {
  id: string;
  code: string;
  date: string;
  amount: number;
  method: string;
  status: string;
}

/** Ticket de soporte normalizado (deriva de ClientSupportTicket). */
export interface PortalTicket {
  code: string;
  otCode: string;
  date: string;
  subject: string;
  severity: string;
  status: string;
  desc: string;
}

/** Mensaje de la bitácora de soporte, normalizado (deriva de ClientSupportMessage). */
export interface PortalChatMessage {
  id: string;
  sender: "agent" | "client";
  name: string;
  time: string;
  text: string;
}

export type PortalActiveSection = "ots" | "invoices" | "docs" | "tickets" | "requirements";
export type PortalInvoiceFilter = "ALL" | "PENDIENTE" | "PAGADA";
