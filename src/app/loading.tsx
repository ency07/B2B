/**
 * LANDING-ST01 — Skeleton loader para la Landing Page
 * Next.js usa este archivo automáticamente como fallback de Suspense
 * mientras page.tsx carga los datos del servidor.
 */
export default function Loading() {
  return (
    <main className="flex flex-col min-h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Top bar skeleton */}
      <div className="hidden md:block h-8 bg-zinc-900 border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-3 w-28 bg-zinc-800 rounded animate-pulse" />
            <div className="w-1 h-1 rounded-full bg-zinc-700" />
            <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" style={{ animationDelay: "80ms" }} />
          </div>
          <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>

      {/* Navbar skeleton */}
      <div className="h-16 bg-zinc-950/90 border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-zinc-800 animate-pulse" />
            <div className="h-5 w-36 bg-zinc-800 rounded animate-pulse" />
          </div>
          <div className="hidden lg:flex items-center gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-4 w-14 bg-zinc-800 rounded animate-pulse"
                style={{ animationDelay: `${i * 60}ms` }}
              />
            ))}
          </div>
          <div className="h-9 w-24 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>

      {/* Hero skeleton */}
      <section className="pt-28 pb-32 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="h-3 w-28 bg-zinc-800/70 rounded mx-auto mb-6 animate-pulse" />
          <div className="h-14 w-3/4 bg-zinc-800 rounded mx-auto mb-3 animate-pulse" />
          <div className="h-14 w-1/2 bg-zinc-800/60 rounded mx-auto mb-6 animate-pulse" />
          <div className="h-5 w-2/5 bg-zinc-800/40 rounded mx-auto mb-10 animate-pulse" />
          {/* CTAs */}
          <div className="flex gap-4 justify-center mb-8">
            <div className="h-12 w-48 bg-zinc-700 rounded-md animate-pulse" />
            <div className="h-12 w-44 bg-zinc-800 rounded-md animate-pulse" />
          </div>
          {/* Trust badges */}
          <div className="flex justify-center gap-6 mb-12">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-16 bg-zinc-800/50 rounded animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
          {/* Metrics */}
          <div className="pt-10 border-t border-zinc-800/50 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-9 w-20 bg-zinc-800 rounded mx-auto animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                <div className="h-3 w-28 bg-zinc-800/50 rounded mx-auto animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Logos strip skeleton */}
      <div className="py-14 bg-zinc-900/40 border-y border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-3 w-52 bg-zinc-800/60 rounded mx-auto mb-10 animate-pulse" />
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-10 bg-zinc-800/40 rounded animate-pulse"
                style={{ animationDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Pain Points skeleton */}
      <section className="py-24 bg-zinc-950 border-b border-zinc-800/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="h-8 w-64 bg-zinc-800 rounded mx-auto mb-4 animate-pulse" />
          <div className="grid gap-8 md:grid-cols-3 mt-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-6 rounded-md border border-zinc-800/50 bg-zinc-900 space-y-4">
                <div className="h-3 w-24 bg-zinc-700 rounded animate-pulse" />
                <div className="h-5 w-3/4 bg-zinc-800 rounded animate-pulse" />
                <div className="h-16 w-full bg-zinc-800/50 rounded animate-pulse" />
                <div className="h-3 w-full bg-zinc-800/30 rounded animate-pulse" />
                <div className="border-t border-zinc-800/50 pt-4 space-y-2">
                  <div className="h-4 w-1/2 bg-zinc-700/50 rounded animate-pulse" />
                  <div className="h-14 w-full bg-zinc-800/30 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalog grid skeleton */}
      <section className="py-24 bg-zinc-950">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="h-3 w-32 bg-zinc-800/60 rounded mx-auto mb-4 animate-pulse" />
            <div className="h-10 w-64 bg-zinc-800 rounded mx-auto mb-3 animate-pulse" />
            <div className="h-12 w-full max-w-md bg-zinc-900 rounded mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-4 space-y-3"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="aspect-video bg-zinc-800/60 rounded-lg animate-pulse" />
                <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-zinc-800/60 rounded animate-pulse" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-3 w-full bg-zinc-800/40 rounded animate-pulse" />
                  <div className="h-3 w-full bg-zinc-800/40 rounded animate-pulse" />
                </div>
                <div className="h-9 w-full bg-zinc-800/30 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
