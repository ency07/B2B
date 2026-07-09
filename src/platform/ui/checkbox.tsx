"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/platform/utils/cn";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded border border-[var(--ds-c-checkbox-border)] bg-[var(--ds-c-checkbox-background)] ring-offset-[var(--ds-c-checkbox-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-c-checkbox-focus-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[var(--ds-c-checkbox-checked-background)] data-[state=checked]:text-[var(--ds-c-checkbox-checked-foreground)] data-[state=checked]:border-[var(--ds-c-checkbox-checked-background)] transition-all duration-200 cursor-pointer flex items-center justify-center",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-3.5 w-3.5 stroke-[3]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
