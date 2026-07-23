"use client";

import { User, X, Send } from "lucide-react";
import { Sheet, SheetContent, SheetClose } from "@/platform/ui/sheet";
import { Input } from "@/platform/ui/input";
import { Button } from "@/platform/ui/button";
import type { PortalChatMessage } from "@/portal/components/dashboard/types";

interface SupportChatSheetProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  messages: PortalChatMessage[];
  newMessageText: string;
  setNewMessageText: (text: string) => void;
  isSendingMessage: boolean;
  onSendMessage: () => void;
  chatCloseRef: React.RefObject<HTMLButtonElement | null>;
}

export function SupportChatSheet({
  isOpen,
  setIsOpen,
  messages,
  newMessageText,
  setNewMessageText,
  isSendingMessage,
  onSendMessage,
  chatCloseRef,
}: SupportChatSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
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
          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground text-center text-sm">Todavía no hay mensajes en este caso.</p>
            </div>
          )}
          {messages.map((msg) => {
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
            onKeyDown={(e) => { if (e.key === "Enter") onSendMessage(); }}
            className="text-sm border-border bg-background h-10"
          />
          <Button
            onClick={onSendMessage}
            disabled={isSendingMessage}
            className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 shrink-0 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50 p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
