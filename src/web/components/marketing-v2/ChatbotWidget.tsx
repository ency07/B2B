"use client";

import * as React from "react";
import { MessageCircle, X, ArrowLeft } from "lucide-react";

interface ChatbotStep {
  id: string;
  sender: "bot" | "user";
  text: string;
  options?: { label: string; action: string }[];
}

interface ChatbotWidgetProps {
  primaryColor?: string;
  tenantCode?: string;
  branding?: { chatbot_steps?: ChatbotStep[] };
}

export default function ChatbotWidget({ primaryColor = "#0284c7", branding }: ChatbotWidgetProps) {
  const steps = branding?.chatbot_steps || [];
  const [open, setOpen] = React.useState(false);
  const [history, setHistory] = React.useState<string[]>(steps[0] ? [steps[0].id] : []);

  if (steps.length === 0) return null;

  const currentId = history[history.length - 1];
  const current = steps.find((s) => s.id === currentId) || steps[0];

  const handleOption = (action: string) => {
    const next = steps.find((s) => s.id === action);
    if (next) {
      setHistory((h) => [...h, next.id]);
    } else {
      // Acciones de navegación (go_wizard, go_catalog, go_contact): cerramos
      // el chat, ya que el usuario ya está en el contexto correspondiente.
      setOpen(false);
    }
  };

  const goBack = () => {
    if (history.length > 1) setHistory((h) => h.slice(0, -1));
  };

  return (
    <div className="fixed bottom-6 right-6 z-[80]">
      {open && (
        <div className="mb-3 w-[320px] max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-background shadow-xl overflow-hidden flex flex-col">
          <div
            className="h-12 px-4 flex items-center justify-between text-white text-sm font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="flex items-center gap-2">
              {history.length > 1 && (
                <button onClick={goBack} aria-label="Volver" className="opacity-80 hover:opacity-100">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <span>Asistente B2B</span>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar chat" className="opacity-80 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 space-y-3 max-h-[360px] overflow-y-auto">
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
