"use client";

interface PortalFooterProps {
  companyName: string;
  supportEmail: string;
}

export function PortalFooter({ companyName, supportEmail }: PortalFooterProps) {
  return (
    <footer className="border-t border-border bg-card py-4 relative z-layer-content mt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-muted-foreground">
        <span>© {companyName} · Soporte: {supportEmail}</span>
        <a href="/privacidad" className="hover:text-foreground underline underline-offset-2 transition-colors">
          Privacidad
        </a>
      </div>
    </footer>
  );
}
