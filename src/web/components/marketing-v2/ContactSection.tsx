"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitContactForm } from "@/web/actions/leads";
import { Mail, Phone, MapPin, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

interface FormState {
  name: string;
  companyName: string;
  email: string;
  phone: string;
  role: string;
  urgency: string;
  description: string;
}

const INITIAL: FormState = {
  name: "",
  companyName: "",
  email: "",
  phone: "",
  role: "",
  urgency: "media",
  description: "",
};

const ROLE_OPTIONS = [
  "Director de Planta",
  "Gerente de Mantenimiento",
  "Supervisor de HVAC / Operaciones",
  "Ingeniero de Proyectos",
  "Compras / Abastecimiento",
  "Otro",
];

interface Props {
  tenantCode: string;
  branding?: any;
}

// Validación inline
function validateField(key: keyof FormState, value: string): string | null {
  if (key === "name" && value.trim().length < 2) return "Mínimo 2 caracteres";
  if (key === "companyName" && value.trim().length < 2)
    return "Razón social requerida";
  if (key === "email") {
    if (!value) return "Correo requerido";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Formato inválido";
  }
  if (key === "phone") {
    if (!value) return "Teléfono requerido";
    if (!/^\+?[0-9]{7,15}$/.test(value.replace(/[\s()-]/g, "")))
      return "Formato inválido (7 a 15 dígitos, puede incluir +código de país)";
  }
  if (key === "role" && value.trim().length < 2) return "Seleccione un cargo";
  return null;
}

const FIELD_LABELS: Record<keyof FormState, string> = {
  name: "Nombre",
  companyName: "Empresa",
  email: "Correo",
  phone: "Teléfono",
  role: "Cargo",
  urgency: "Urgencia",
  description: "Descripción",
};

export function ContactSection({ tenantCode, branding = {} }: Props) {
  const [form, setForm] = React.useState<FormState>(INITIAL);
  const [touched, setTouched] = React.useState<Record<keyof FormState, boolean>>({
    name: false,
    companyName: false,
    email: false,
    phone: false,
    role: false,
    urgency: false,
    description: false,
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<
    { type: "idle" } | { type: "success"; message: string } | { type: "error"; message: string }
  >({ type: "idle" });

  const update = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const blur = (key: keyof FormState) => () => {
    setTouched((t) => ({ ...t, [key]: true }));
  };

  // Errores calculados
  const errors = React.useMemo(() => {
    const e: Partial<Record<keyof FormState, string | null>> = {};
    (Object.keys(form) as Array<keyof FormState>).forEach((key) => {
      if (touched[key] || status.type !== "idle") {
        e[key] = validateField(key, form[key]);
      }
    });
    return e;
  }, [form, touched, status]);

  // Progreso: cuántos campos válidos hay
  const requiredFields: Array<keyof FormState> = ["name", "companyName", "email", "phone", "role"];
  const validCount = requiredFields.filter(
    (k) => validateField(k, form[k]) === null
  ).length;
  const progress = (validCount / requiredFields.length) * 100;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Marcar todos como tocados
    setTouched({
      name: true,
      companyName: true,
      email: true,
      phone: true,
      role: true,
      urgency: true,
      description: true,
    });

    const hasErrors = requiredFields.some((k) => validateField(k, form[k]) !== null);
    if (hasErrors) {
      setStatus({ type: "error", message: "Revisa los campos marcados antes de enviar." });
      return;
    }

    setSubmitting(true);
    setStatus({ type: "idle" });
    try {
      await submitContactForm(tenantCode, form);
      setStatus({
        type: "success",
        message: "Solicitud recibida. Un ingeniero se pondrá en contacto en menos de 24 horas hábiles.",
      });
      setForm(INITIAL);
      setTouched({
        name: false,
        companyName: false,
        email: false,
        phone: false,
        role: false,
        urgency: false,
        description: false,
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err instanceof Error ? err.message : "No se pudo enviar.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* CTA final */}
      <section className="relative w-full bg-ink section-py-tight overflow-hidden">
        <div className="relative max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 text-center">
          <p className="font-mono text-[11px] tracking-widest text-white/50 uppercase mb-6">
            — Empezar
          </p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[clamp(40px,6vw,96px)] font-light tracking-[-0.03em] leading-[1.05] text-paper max-w-4xl mx-auto"
          >
            La conversación técnica
            <br />
            <span className="italic text-white/70">empieza cuando usted lo decida.</span>
          </motion.h2>
          <p className="mt-10 text-lg leading-[1.6] text-white/65 max-w-xl mx-auto font-sans">
            Sin compromiso. Sin costo. Con la profundidad técnica que su
            operación merece.
          </p>
          <div className="mt-12">
            <button
              onClick={() =>
                document
                  .getElementById("contacto")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="group inline-flex items-center gap-3 h-14 px-8 bg-white text-ink text-base font-medium tracking-tight rounded-sm hover:bg-white/90 transition-colors"
            >
              <span>Consultar con un ingeniero</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Formulario */}
      <section
        id="contacto"
        className="relative w-full bg-paper section-py"
      >
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 section-header-normal">
            {/* Info */}
            <div className="lg:col-span-4 space-y-10">
              <div>
                <p className="editorial-eyebrow mb-6">— Contacto</p>
                <h2 className="font-display text-4xl lg:text-5xl font-light text-ink tracking-[-0.03em] leading-[1.05] mb-6">
                  Cuéntenos
                  <br />
                  <span className="italic text-ink-soft">su proyecto.</span>
                </h2>
                <p className="text-lg leading-[1.6] text-ink-soft font-sans">
                  Complete el formulario y un ingeniero especialista se pondrá
                  en contacto en menos de 24 horas hábiles.
                </p>
              </div>

              <div className="space-y-5">
                <ContactItem icon={Phone} label="Teléfono" value="+57 (1) 234 5678" />
                <ContactItem icon={Mail} label="Correo" value={branding.email_corporativo || "contacto@mi-empresa.com"} />
                <ContactItem icon={MapPin} label="Oficina" value="Bogotá, Colombia" />
              </div>

              <div className="bg-paper-warm p-6">
                <p className="font-mono text-[10px] tracking-widest text-fg-muted uppercase mb-4">
                  Horario
                </p>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex justify-between text-ink-soft">
                    <span>Lun — Vie</span>
                    <span className="text-ink">07:00 — 18:00</span>
                  </div>
                  <div className="flex justify-between text-ink-soft">
                    <span>Sábados</span>
                    <span className="text-ink">08:00 — 13:00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form con feedback */}
            <div className="lg:col-span-8">
              <form
                onSubmit={handleSubmit}
                noValidate
                className="bg-paper-warm p-8 lg:p-10"
              >
                {/* === Progress bar === */}
                <div className="mb-8 pb-6 border-b border-line">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-mono text-[10px] tracking-widest text-fg-muted uppercase">
                      Progreso del formulario
                    </p>
                    <motion.p
                      key={progress}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="font-mono text-[10px] tracking-widest text-ink uppercase font-medium tabular-nums"
                    >
                      {Math.round(progress)}% · {validCount}/{requiredFields.length}
                    </motion.p>
                  </div>
                  <div className="relative h-1 bg-line overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-ink"
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <SmartField
                    label="Nombre completo"
                    value={form.name}
                    onChange={update("name")}
                    onBlur={blur("name")}
                    error={errors.name ?? null}
                    placeholder="Su nombre"
                    required
                  />
                  <SmartField
                    label="Empresa"
                    value={form.companyName}
                    onChange={update("companyName")}
                    onBlur={blur("companyName")}
                    error={errors.companyName ?? null}
                    placeholder="Razón social"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <SmartField
                    label="Correo electrónico"
                    type="email"
                    value={form.email}
                    onChange={update("email")}
                    onBlur={blur("email")}
                    error={errors.email ?? null}
                    placeholder="correo@empresa.co"
                    required
                  />
                  <SmartField
                    label="Teléfono"
                    type="tel"
                    value={form.phone}
                    onChange={update("phone")}
                    onBlur={blur("phone")}
                    error={errors.phone ?? null}
                    placeholder="312 345 6789"
                    required
                  />
                </div>

                <div className="mb-5">
                  <label htmlFor="contact-role" className="font-mono text-[10px] tracking-widest text-fg-muted uppercase block mb-2">
                    Cargo <span className="text-ink">*</span>
                  </label>
                  <select
                    id="contact-role"
                    value={form.role}
                    onChange={update("role")}
                    onBlur={blur("role")}
                    required
                    className="w-full h-14 px-5 text-base font-sans bg-paper border-0 text-ink focus:bg-paper-cool focus:outline-none focus:ring-1 focus:ring-ink transition-colors"
                  >
                    <option value="" disabled>
                      Seleccione su cargo
                    </option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-5">
                  <label className="font-mono text-[10px] tracking-widest text-fg-muted uppercase block mb-3">
                    Urgencia del proyecto
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "baja", label: "Baja" },
                      { value: "media", label: "Media" },
                      { value: "alta", label: "Alta" },
                    ].map((u) => {
                      const isSelected = form.urgency === u.value;
                      return (
                        <button
                          key={u.value}
                          type="button"
                          onClick={() =>
                            setForm((f) => ({ ...f, urgency: u.value }))
                          }
                          className={`
                            h-12 text-sm font-sans transition-all duration-200
                            ${isSelected ? "bg-ink text-paper" : "bg-paper text-ink-soft hover:bg-paper-cool"}
                          `}
                        >
                          {u.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-8">
                  <label htmlFor="contact-description" className="font-mono text-[10px] tracking-widest text-fg-muted uppercase block mb-3">
                    Descripción del proyecto
                  </label>
                  <textarea
                    id="contact-description"
                    value={form.description}
                    onChange={update("description")}
                    rows={5}
                    placeholder="Tipo de planta, dimensiones, problema de ventilación actual, contaminantes, restricciones operativas…"
                    className="w-full px-5 py-4 bg-paper border-0 text-ink text-base placeholder:text-fg-muted focus:bg-paper-cool focus:ring-1 focus:ring-ink focus:outline-none transition-colors resize-y font-sans"
                  />
                </div>

                <AnimatePresence>
                  {status.type === "success" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-6 overflow-hidden"
                    >
                      <div className="border-l-2 border-[#16A34A] bg-[#16A34A]/5 p-5 flex items-start gap-3">
                        <CheckCircle2
                          className="w-4 h-4 text-[#16A34A] mt-0.5 shrink-0"
                          strokeWidth={1.5}
                        />
                        <div>
                          <p className="text-sm font-medium text-ink mb-1">
                            Solicitud enviada correctamente
                          </p>
                          <p className="text-sm text-ink-soft leading-[1.6] font-sans">
                            {status.message}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {status.type === "error" && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-6 overflow-hidden"
                    >
                      <div className="border-l-2 border-[#DC2626] bg-[#DC2626]/5 p-5 flex items-start gap-3">
                        <AlertCircle
                          className="w-4 h-4 text-[#DC2626] mt-0.5 shrink-0"
                          strokeWidth={1.5}
                        />
                        <p className="text-sm text-ink font-sans">{status.message}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={submitting || progress < 100}
                  className="group w-full h-14 bg-ink text-paper text-base font-medium tracking-tight rounded-sm hover:bg-ink-soft transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:scale-[1.005] active:scale-[0.995] shine"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                      <span>Enviando…</span>
                    </>
                  ) : (
                    <>
                      <span>Enviar solicitud</span>
                      <ArrowRight
                        className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                        strokeWidth={1.5}
                      />
                    </>
                  )}
                </button>

                <p className="mt-5 text-center text-sm text-fg-muted font-sans">
                  Respuesta garantizada en menos de 24 horas hábiles.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* === SMART FIELD con feedback inline === */
function SmartField({
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  required,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  error: string | null;
  placeholder: string;
  required?: boolean;
}) {
  const showError = error !== null;
  const showValid = !showError && value.length > 0;
  const id = React.useId();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor={id} className="font-mono text-[10px] tracking-widest text-fg-muted uppercase">
          {label} {required && <span className="text-ink">*</span>}
        </label>
        <AnimatePresence>
          {showValid && (
            <motion.span
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="font-mono text-[10px] tracking-widest text-[#16A34A] uppercase flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" strokeWidth={2} />
              OK
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          className={`
            w-full h-14 px-5 text-base font-sans placeholder:text-fg-muted
            bg-paper border-0 transition-colors
            focus:bg-paper-cool focus:outline-none focus:ring-1
            ${showError ? "focus:ring-[#DC2626]" : "focus:ring-ink"}
          `}
        />
        <AnimatePresence>
          {showError && (
            <motion.p
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -4, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-2 font-mono text-[10px] text-[#DC2626] tracking-wide flex items-center gap-1.5"
            >
              <AlertCircle className="w-3 h-3" strokeWidth={1.5} />
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ContactItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <Icon
        className="w-4 h-4 text-ink-soft mt-1 shrink-0"
        strokeWidth={1.25}
      />
      <div>
        <p className="font-mono text-[10px] tracking-widest text-fg-muted uppercase mb-1">
          {label}
        </p>
        <p className="text-base text-ink font-sans">{value}</p>
      </div>
    </div>
  );
}
