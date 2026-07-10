"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  middleware_failure: "El servidor encontró un problema al procesar tu solicitud.",
  server: "El servidor encontró un problema inesperado.",
};

function ErrorPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const code = searchParams.get("code") ?? "unknown";
  const message = ERROR_MESSAGES[code] ?? "Algo salió mal. Por favor intenta de nuevo.";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mb-2">
          Algo salió mal
        </h1>

        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          {message}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center gap-2 h-10 px-6 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            Volver al inicio
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center gap-2 h-10 px-6 border border-gray-200 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2"
          >
            Ir atrás
          </button>
        </div>

        {process.env.NODE_ENV === "development" && (
          <p className="mt-8 font-mono text-xs text-gray-400">
            código: {code}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense>
      <ErrorPageContent />
    </Suspense>
  );
}
