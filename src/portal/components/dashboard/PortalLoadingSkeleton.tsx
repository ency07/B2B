"use client";

import { Skeleton } from "@/platform/ui/skeleton";

export function PortalLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden">
      {/* Radial highlight in background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary)/0.04,transparent_50%)] pointer-events-none" />

      <header className="border-b border-border bg-card/50 sticky top-0 z-layer-sticky">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header Banner Skeleton */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-6 w-80" />
            <Skeleton className="h-3 w-[60%]" />
          </div>
        </div>

        {/* Cards Row Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Skeleton className="h-28 rounded-2xl border border-border bg-card" />
          <Skeleton className="h-28 rounded-2xl border border-border bg-card" />
          <Skeleton className="h-28 rounded-2xl border border-border bg-card" />
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="flex gap-4 border-b border-border pb-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-32" />
        </div>

        {/* Content Box Skeleton */}
        <div className="rounded-2xl border border-border bg-card/30 p-8 space-y-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
