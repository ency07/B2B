import * as React from "react";
import { cn } from "@/platform/utils/cn";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[var(--ds-c-skeleton-background)]", className)}
      {...props}
    />
  );
}

export { Skeleton };
