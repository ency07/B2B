import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/platform/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--ds-c-button-focus-ring)] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[var(--ds-c-button-background)] text-[var(--ds-c-button-foreground)] hover:opacity-90 shadow-sm",
        destructive: "bg-[var(--ds-c-button-destructive-bg)] text-[var(--ds-c-button-destructive-fg)] hover:opacity-90 shadow-sm",
        outline: "border border-[var(--ds-c-button-outline-border)] bg-[var(--ds-c-button-outline-bg)] text-[var(--ds-c-button-outline-fg)] hover:bg-[var(--ds-c-button-ghost-hover-bg)] hover:text-[var(--ds-c-button-ghost-fg)]",
        secondary: "bg-[var(--ds-c-button-secondary-bg)] text-[var(--ds-c-button-secondary-fg)] hover:bg-[var(--ds-c-button-ghost-hover-bg)] hover:text-[var(--ds-c-button-ghost-fg)]",
        ghost: "hover:bg-[var(--ds-c-button-ghost-hover-bg)] hover:text-[var(--ds-c-button-ghost-fg)]",
        link: "text-[var(--ds-c-button-link-fg)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
