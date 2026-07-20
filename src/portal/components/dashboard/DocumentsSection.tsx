"use client";

import { FileText, Download } from "lucide-react";
import { Button } from "@/platform/ui/button";

interface DocumentsSectionProps {
  documents: Array<{ id: string; name: string; type: string; url: string }>;
  onRequestFromExecutive: () => void;
}

export function DocumentsSection({ documents, onRequestFromExecutive }: DocumentsSectionProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/60 pb-4">
        <div>
          <p className="text-base font-semibold text-foreground">Documentos Técnicos</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Planos, manuales, certificados y hojas de datos de tus equipos.
          </p>
        </div>
      </div>

      {documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.map((doc) => (
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
            onClick={onRequestFromExecutive}
            className="bg-primary hover:bg-primary/95 text-white text-xs font-mono px-4 py-2 rounded-lg cursor-pointer"
          >
            Solicitar a mi ejecutivo
          </Button>
        </div>
      )}
    </div>
  );
}
