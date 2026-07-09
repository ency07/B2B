"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "bg-[var(--ds-c-toast-background)] text-[var(--ds-c-toast-foreground)] border border-[var(--ds-c-toast-border)] shadow-md text-sm",
          description: "text-[var(--ds-c-toast-foreground)]",
        },
      }}
    />
  );
}
