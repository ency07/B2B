import * as React from "react";
import { cn } from "@/platform/utils/cn";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[var(--ds-c-input-border)] bg-[var(--ds-c-input-background)] px-3 py-2 text-sm text-[var(--ds-c-input-foreground)] ring-offset-[var(--ds-c-input-background)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--ds-c-input-placeholder)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-c-input-focus-ring)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
