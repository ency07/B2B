"use client";

import * as React from "react";
import { MessageCircle, X, ArrowLeft } from "lucide-react";
import { submitChatbotLead } from "@/web/actions/leads";
import { ROUTES } from "@/lib/routes";

interface ChatbotStep {
  id: string;
  sender: "bot" | "user";
  text: string;
  options?: { label: string; action: string }[];
  // Si se asigna, este step se muestra automáticamente al abrir el chat
  // mientras el usuario esté en ese paso del Wizard (ver WizardStepper).
  forWizardStep?: number;
}

interface ChatbotWidgetProps {
  primaryColor?: string;
  tenantCode?: string;
  branding?: { chatbot_steps?: ChatbotStep[] };
  // Paso actual del Wizard (1-5), si el chatbot se está mostrando dentro de
  // él. Permite que el mensaje de entrada sea contextual al paso — ver
  // pickEntryStepId().
  currentWizardStep?: number;
}

function pickEntryStepId(steps: ChatbotStep[], currentWizardStep?: number): string | undefined {
  if (currentWizardStep != null) {
    const contextual = steps.find((s) => s.forWizardStep === currentWizardStep);
    if (contextual) return contextual.id;
  }
  return steps[0]?.id;
}

// Acciones de navegación reales fuera del árbol de opciones. "go_wizard" no
// necesita navegación propia: el chatbot solo vive dentro de /wizard hoy, así
// que llegar a esa acción ya significa "estás donde debías estar" — cerrar
// el chat alcanza. "go_contact" no navega: abre el formulario de captura
// inline (ver showContactForm) en vez de simplemente cerrar sin dejar rastro.
const NAVIGATION_ACTIONS: Record<string, string> = {
  go_catalog: `${ROUTES.HOME}#capacidades`,
};

export default function ChatbotWidget({ primaryColor = "#ED254E", tenantCode, branding, currentWizardStep }: ChatbotWidgetProps) {
  const steps = branding?.chatbot_steps || [];
  const [open, setOpen] = React.useState(false);
  const [history, setHistory] = React.useState<string[]>(() => {
    const entryId = pickEntryStepId(steps, currentWizardStep);
    return entryId ? [entryId] : [];
  });

  // Captura de lead (W-002): antes "Contactar a un ingeniero" solo cerraba
  // el chat sin persistir nada. Ahora pide email/teléfono y crea un lead
  // real (lead_source: "Chatbot Web") — ver src/web/actions/leads.ts.
  const [showContactForm, setShowContactForm] = React.useState(false);
  const [contactEmail, setContactEmail] = React.useState("");
  const [contactPhone, setContactPhone] = React.useState("");
  const [contactSubmitting, setContactSubmitting] = React.useState(false);
  const [contactError, setContactError] = React.useState<string | null>(null);
  const [contactDone, setContactDone] = React.useState(false);

  // Si el usuario avanza de paso en el Wizard y todavía no interactuó con
  // el chat (sigue en el mensaje de entrada), refresca la ayuda contextual
  // al nuevo paso. Si ya está navegando el árbol de opciones, no lo
  // interrumpe a mitad de conversación.
  React.useEffect(() => {
    if (history.length <= 1) {
      const entryId = pickEntryStepId(steps, currentWizardStep);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (entryId) setHistory([entryId]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWizardStep]);

  if (steps.length === 0) return null;

  const currentId = history[history.length - 1];
  const current = steps.find((s) => s.id === currentId) || steps[0];

  const handleOption = (action: string) => {
    const next = steps.find((s) => s.id === action);
    if (next) {
      setHistory((h) => [...h, next.id]);
      return;
    }

    if (action === "go_contact") {
      setShowContactForm(true);
      setContactError(null);
      return;
    }

    const target = NAVIGATION_ACTIONS[action];
    if (target) {
      // eslint-disable-next-line react-hooks/immutability
      window.location.href = target;
      return;
    }

    // Acción de navegación no mapeada (ej. go_wizard, o una acción nueva que
    // el tenant configuró desde el CMS sin un target definido aquí): cerramos
    // el chat, ya que el usuario ya está en el contexto correspondiente.
    setOpen(false);
  };

  const goBack = () => {
    if (showContactForm) {
      setShowContactForm(false);
      setContactError(null);
      return;
    }
    if (history.length > 1) setHistory((h) => h.slice(0, -1));
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactSubmitting) return;
    setContactSubmitting(true);
    setContactError(null);
    try {
      await submitChatbotLead(tenantCode ?? null, {
        email: contactEmail,
        phone: contactPhone || undefined,
        context: `Ruta del chat: ${history.join(" → ")}`,
      });
      setContactDone(true);
    } catch (err) {
      setContactError(err instanceof Error ? err.message : "No se pudo enviar tu solicitud.");
    } finally {
      setContactSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setOpen(false);
    setShowContactForm(false);
    setContactDone(false);
    setContactEmail("");
    setContactPhone("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-layer-modal">
      {open && (
        <div className="mb-3 w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-background shadow-xl overflow-hidden flex flex-col">
          <div
            className="h-12 px-4 flex items-center justify-between text-white text-sm font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-2">
              {(showContactForm || history.length > 1) && !contactDone && (
                <button onClick={goBack} aria-label="Volver" className="opacity-80 hover:opacity-100">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <span>Asistente B2B</span>
            </div>
            <button onClick={resetAndClose} aria-label="Cerrar chat" className="opacity-80 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3 max-h-[360px] overflow-y-auto">
            {contactDone ? (
              <>
                <p className="text-sm text-foreground leading-relaxed">
                  ¡Gracias! Un ingeniero revisará tu solicitud y te contactará pronto.
                </p>
                <button
                  onClick={resetAndClose}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-accent/40 transition-colors text-foreground"
                >
                  Cerrar
                </button>
              </>
            ) : showContactForm ? (
              <form onSubmit={handleContactSubmit} className="space-y-3">
                <p className="text-sm text-foreground leading-relaxed">
                  Déjanos tu correo (y teléfono si prefieres) y un ingeniero te contacta.
                </p>
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="tu@empresa.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                />
                <input
                  type="tel"
                  placeholder="Teléfono (opcional)"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                />
                {contactError && (
                  <p className="text-xs text-destructive">{contactError}</p>
                )}
                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full text-center text-xs px-3 py-2 rounded-lg text-white transition-opacity disabled:opacity-60"
                  style={{ backgroundColor: primaryColor }}
                >
                  {contactSubmitting ? "Enviando..." : "Enviar"}
                </button>
              </form>
            ) : (
              <>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{current.text}</p>
                {current.options && current.options.length > 0 && (
                  <div className="flex flex-col gap-2 pt-1">
                    {current.options.map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleOption(opt.action)}
                        className="text-left text-xs px-3 py-2 rounded-lg border border-border hover:bg-accent/40 transition-colors text-foreground"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar asistente" : "Abrir asistente"}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white transition-transform hover:scale-105"
        style={{ backgroundColor: primaryColor }}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </div>
  );
}
