"use client";

import { PlusCircle, MessageSquare } from "lucide-react";
import { Button } from "@/platform/ui/button";

interface WelcomeBarProps {
  clientNit: string;
  clientName: string;
  onOpenRequirement: () => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  chatToggleRef: React.RefObject<HTMLButtonElement | null>;
}

export function WelcomeBar({
  clientNit,
  clientName,
  onOpenRequirement,
  isChatOpen,
  onToggleChat,
  chatToggleRef,
}: WelcomeBarProps) {
  return (
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
          onClick={onOpenRequirement}
          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer shrink-0"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          Solicitar servicio
        </Button>
        <Button
          ref={chatToggleRef}
          variant="outline"
          onClick={onToggleChat}
          className="text-xs font-medium flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all cursor-pointer shrink-0"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {isChatOpen ? "Cerrar soporte" : "Soporte"}
        </Button>
      </div>
    </div>
  );
}
