"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { getPublicBranding } from "@/web/actions/branding";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const [supportEmail, setSupportEmail] = useState("contacto@mi-empresa.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tenant = params.get("tenant");
      getPublicBranding(tenant)
        .then((b) => {
          setSupportEmail(b.email_corporativo);
        })
        .catch(() => {});
    }
  }, [error]);

  return (
    <main className="flex flex-col min-h-screen bg-zinc-950 text-white items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center space-y-8 p-8 rounded-2xl border border-zinc-800/50 bg-zinc-900/40 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto"
        >
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </motion.div>

        <div className="space-y-3">
          <h1 className="text-xl font-bold text-white">
            Error inesperado
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.
          </p>
          {error.digest && (
            <p className="text-xs text-zinc-600 font-mono bg-zinc-900 rounded px-3 py-1.5 inline-block">
              Código: {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white rounded-lg font-semibold transition-all duration-150"
          >
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-transparent border border-zinc-700 hover:bg-zinc-800 active:scale-95 text-zinc-300 rounded-lg font-semibold transition-all duration-150"
          >
            <Home className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>

        {supportEmail && (
          <p className="text-xs text-zinc-600">
            Si el problema persiste,{" "}
            <a
              href={`mailto:${supportEmail}`}
              className="text-zinc-400 hover:text-zinc-200 underline transition-colors"
            >
              contacte soporte técnico
            </a>
          </p>
        )}
      </motion.div>
    </main>
  );
}
