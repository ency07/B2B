"use client";

import * as React from "react";

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  // El shell visual (background + branding + theming) lo renderiza 
  // la página (/login) mediante ErpLoginFeature o PortalLoginFeature.
  // Este layout base ahora es totalmente agnóstico (Dumb Component).
  return <>{children}</>;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
          Cargando...
        </div>
      }
    >
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </React.Suspense>
  );
}
