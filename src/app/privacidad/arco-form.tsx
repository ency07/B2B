"use client";

import React from "react";
import { toast } from "sonner";

const RIGHTS = [
  { value: "acceso", label: "Acceso — Conocer qué datos personales tenemos sobre usted" },
  { value: "rectificacion", label: "Rectificación — Corregir información incorrecta o desactualizada" },
  { value: "cancelacion", label: "Cancelación (Supresión) — Solicitar la eliminación de sus datos" },
  { value: "oposicion", label: "Oposición — Oponerse al tratamiento de sus datos" },
] as const;

export function ArcoForm({ contactEmail }: { contactEmail: string }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [right, setRight] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !right || !description.trim()) return;

    setIsSubmitting(true);
    // Por ahora se registra como solicitud y se notifica al equipo interno
    try {
      const res = await fetch("/api/arco-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, right, description }),
      });
      if (!res.ok) throw new Error("Error al enviar");
      toast.success("Solicitud ARCO registrada. Recibirás respuesta en un máximo de 15 días hábiles.");
      setName("");
      setEmail("");
      setRight("");
      setDescription("");
    } catch {
      toast.error(`No se pudo enviar tu solicitud. Escríbenos a ${contactEmail}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8 border-t border-stone-200 pt-8">
      <h2 className="font-bold text-stone-900 text-base">Formulario de Solicitud ARCO</h2>
      <p className="text-sm text-stone-600 mt-1">
        Diligencia este formulario para ejercer tus derechos de Acceso, Rectificación, Cancelación u Oposición.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="arco-name" className="text-xs font-mono text-stone-500 uppercase font-bold">
            Nombre completo / Razón social
          </label>
          <input
            id="arco-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
            placeholder="Tu nombre o el de tu empresa"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="arco-email" className="text-xs font-mono text-stone-500 uppercase font-bold">
            Correo electrónico
          </label>
          <input
            id="arco-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
            placeholder="correo@ejemplo.com"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="arco-right" className="text-xs font-mono text-stone-500 uppercase font-bold">
            Derecho que deseas ejercer
          </label>
          <select
            id="arco-right"
            value={right}
            onChange={(e) => setRight(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
            required
          >
            <option value="">Selecciona un derecho...</option>
            {RIGHTS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="arco-desc" className="text-xs font-mono text-stone-500 uppercase font-bold">
            Descripción de tu solicitud
          </label>
          <textarea
            id="arco-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-stone-900 focus:outline-none"
            placeholder="Describe qué información necesitas, qué deseas corregir o cualquier detalle relevante..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-stone-900 px-6 text-xs font-semibold uppercase tracking-widest text-white hover:bg-stone-800 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? "Enviando..." : "Enviar Solicitud ARCO"}
        </button>
      </form>
    </div>
  );
}
