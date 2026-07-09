import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/platform/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-[var(--ds-c-badge-border)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--ds-c-badge-background)] text-[var(--ds-c-badge-foreground)] shadow-sm",
        secondary: "border-transparent bg-[var(--ds-c-button-secondary-background)] text-[var(--ds-c-button-secondary-foreground)]",
        destructive: "border-transparent bg-[var(--ds-c-badge-error-background)] text-[var(--ds-c-badge-error-foreground)] shadow-sm",
        outline: "text-[var(--ds-c-badge-neutral-foreground)] border-[var(--ds-c-badge-border)] bg-[var(--ds-c-badge-neutral-background)]",
        success: "bg-[var(--ds-c-badge-success-background)] text-[var(--ds-c-badge-success-foreground)] border-[var(--ds-c-badge-border)]",
        warning: "bg-[var(--ds-c-badge-warning-background)] text-[var(--ds-c-badge-warning-foreground)] border-[var(--ds-c-badge-border)]",
        info: "bg-[var(--ds-c-badge-background)] text-[var(--ds-c-badge-foreground)] border-[var(--ds-c-badge-border)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
