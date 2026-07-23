"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/platform/utils/cn";

const Sheet = DialogPrimitive.Root;
const SheetTrigger = DialogPrimitive.Trigger;
const SheetClose = DialogPrimitive.Close;
const SheetPortal = DialogPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-layer-modal backdrop-blur-md transition-opacity duration-300 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
      className
    )}
    style={{
      backgroundColor: 'var(--ds-c-sheet-overlay-background)',
    } as React.CSSProperties}
    {...props}
  />
));
SheetOverlay.displayName = DialogPrimitive.Overlay.displayName;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed right-0 top-0 bottom-0 z-layer-modal h-full w-full max-w-[80vw] sm:max-w-[700px] md:max-w-[800px] border-l p-6 shadow-2xl transition-transform duration-300 data-[state=open]:translate-x-0 data-[state=closed]:translate-x-full ease-in-out",
          className
        )}
        style={{
          borderColor: 'var(--ds-c-sheet-border)',
          backgroundColor: 'var(--ds-c-sheet-content-background)',
          color: 'var(--ds-c-sheet-content-foreground)',
        } as React.CSSProperties}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-lg p-2 text-[var(--ds-c-sheet-close-foreground)] opacity-70 hover:text-[var(--ds-c-sheet-header-foreground)] transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 cursor-pointer"
          style={{
            backgroundColor: 'var(--ds-c-sheet-content-background)',
            borderColor: 'var(--ds-c-sheet-border)',
            borderWidth: '1px',
          } as React.CSSProperties}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Cerrar</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = DialogPrimitive.Content.displayName;

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetPortal,
  SheetOverlay,
};