"use client";

import * as React from "react";
import { DesignSystemProvider } from "@/design-system";

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <DesignSystemProvider>
      <React.Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
            Cargando...
          </div>
        }
      >
        <AuthLayoutContent>{children}</AuthLayoutContent>
      </React.Suspense>
    </DesignSystemProvider>
  );
}