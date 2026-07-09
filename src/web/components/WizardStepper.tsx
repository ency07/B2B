/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable prefer-const */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Cpu, 
  Wind, 
  DollarSign, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  AlertCircle,
  FileCheck,
  Briefcase,
  AlertTriangle,
  Flame,
  Gauge,
  Sparkles,
  Download,
  Send
} from "lucide-react";
import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Label } from "@/platform/ui/label";
import { Textarea } from "@/platform/ui/textarea";
import { submitWizardData, WizardResult } from "@/web/actions/wizard";
import { generateEngineeringReport, ENVIRONMENT_OPTIONS } from "@/utils/engineering";
import { estimatePrice } from "@/utils/pricing";
import { getTenantConfig } from "@/platform/tenant/tenant";
import ChatbotWidget from "./marketing-v2/ChatbotWidget";
import { ServiceSelectionStep } from "./wizard/ServiceSelectionStep";
import { TechnicalAnalysisStep } from "./wizard/TechnicalAnalysisStep";
import { CorporateInfoStep } from "./wizard/CorporateInfoStep";
import { SummaryStep } from "./wizard/SummaryStep";
import { SuccessStep } from "./wizard/SuccessStep";

interface WizardStepperProps {
  branding: Record<string, any>;
}

// Lista oficial de ciudades industriales de Colombia
const COLOMBIAN_CITIES = [
  { name: "Bogotá, D.C.", search: "bogota dc cundinamarca" },
  { name: "Medellín, Antioquia", search: "medellin antioquia valle de aburra" },
  { name: "Cali, Valle del Cauca", search: "cali valle del cauca" },
  { name: "Barranquilla, Atlántico", search: "barranquilla atlantico" },
  { name: "Cartagena, Bolívar", search: "cartagena bolivar" },
  { name: "Bucaramanga, Santander", search: "bucaramanga santander" },
  { name: "Manizales, Caldas", search: "manizales caldas" },
  { name: "Pereira, Risaralda", search: "pereira risaralda" },
  { name: "Yumbo, Valle del Cauca", search: "yumbo valle del cauca" },
  { name: "Itagüí, Antioquia", search: "itagui antioquia" },
  { name: "Soledad, Atlántico", search: "soledad atlantico" },
];

export default function WizardStepper({
  branding,
  tenantCode,
}: {
  branding: any;
  tenantCode: string;
}) {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant") || "acme";
  const preselectedProduct = searchParams.get("product") || "";

  // Colores dinámicos del Tenant
  const primaryColor = branding.color_primario || "#0284c7";
  const config = getTenantConfig(tenantCode);
  const siteName = branding.nombre_comercial || config.name;
  const siteLogo = branding.logo_claro_url || "";

  // Estado del Wizard
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<WizardResult | null>(null);

  // Formulario
  const [form, setForm] = useState({
    servicio: "venta" as "fabricacion" | "venta" | "mantenimiento" | "reparacion" | "otro",
    urgencia: "media" as "baja" | "media" | "alta",
    length: 10,
    width: 8,
    height: 4,
    altitude: 2640,
    environment: "default" as string,
    nombre: "",
    empresa: "",
    cargo: "Ingeniero de Proyectos",
    telefono: "",
    email: "",
    ciudad: "",
    otroDetalle: ""
  });

  // Checklist de Síntomas / Desgaste
  const [symptoms, setSymptoms] = useState({
    heat: false,       // Alta carga térmica
    dust: false,       // Polución
    humidity: false,   // Vapor corrosivo
    gases: false,      // Gases u olores
  });

  // Autocomplete de ciudades
  const [cityInputFocus, setCityInputFocus] = useState(false);
  const [filteredCities, setFilteredCities] = useState(COLOMBIAN_CITIES);

  // Cálculos en tiempo real
  const [realtimeCfm, setRealtimeCfm] = useState({ cfm: 0, cubicMeters: 0 });
  const [realtimePrice, setRealtimePrice] = useState({ rangeMinCop: 0, rangeMaxCop: 0, rangeMinUsd: 0, rangeMaxUsd: 0 });

  // Ticker de Caudal animado a 60fps
  const [animatedCfm, setAnimatedCfm] = useState(0);

  // Calcular severidad
  const calculateSeverityScore = () => {
    let score = 0;
    if (symptoms.heat) score += 25;
    if (symptoms.dust) score += 25;
    if (symptoms.humidity) score += 20;
    if (symptoms.gases) score += 30;
    return score;
  };

  const severityScore = calculateSeverityScore();
  const severityLevel = severityScore >= 70 ? "CRÍTICA" : severityScore >= 30 ? "MODERADA" : "BAJA";

  // Pre-poblar formulario con parámetros de la landing/calculadora si existen.
  // Cubre tanto la llegada desde la Calculadora CFM (con dimensiones ya
  // definidas) como la llegada directa al Wizard (sin query params — el
  // formulario simplemente conserva sus valores por defecto).
  useEffect(() => {
    const qLength = searchParams.get("length");
    const qWidth = searchParams.get("width");
    const qHeight = searchParams.get("height");
    const qEnv = searchParams.get("environment");
    const qAltitude = searchParams.get("altitude");

    if (qLength || qWidth || qHeight || qEnv || qAltitude) {
      setForm(prev => ({
        ...prev,
        length: qLength ? Number(qLength) : prev.length,
        width: qWidth ? Number(qWidth) : prev.width,
        height: qHeight ? Number(qHeight) : prev.height,
        altitude: qAltitude ? Number(qAltitude) : prev.altitude,
        environment: qEnv || prev.environment,
      }));
    }
  }, [searchParams]);

  useEffect(() => {
    // Calcular en tiempo real cuando cambien las dimensiones, el ambiente o
    // la altitud — mismo motor (generateEngineeringReport) que usa la
    // Calculadora CFM pública, para que el resultado nunca se desincronice.
    const report = generateEngineeringReport(
      { length: Number(form.length), width: Number(form.width), height: Number(form.height) },
      form.environment,
      Number(form.altitude) || 0,
      20,
      false
    );
    setRealtimeCfm({ cfm: report.cfm, cubicMeters: report.cubicMeters });

    // Estimar precio
    const prc = estimatePrice(form.servicio, form.urgencia, report.cubicMeters);
    setRealtimePrice({
      rangeMinCop: prc.rangeMinCop,
      rangeMaxCop: prc.rangeMaxCop,
      rangeMinUsd: prc.rangeMinUsd,
      rangeMaxUsd: prc.rangeMaxUsd
    });
  }, [form.length, form.width, form.height, form.altitude, form.environment, form.servicio, form.urgencia]);

  // Interpolación de contador digital (60fps)
  useEffect(() => {
    const target = realtimeCfm.cfm;
    let start = animatedCfm;
    if (start === target) return;

    const duration = 250; // ms
    const startTime = performance.now();
    let animationFrameId: number;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress); // Ease out quadratic
      const current = Math.round(start + (target - start) * ease);

      setAnimatedCfm(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [realtimeCfm.cfm]);

  // Filtrar ciudades
  useEffect(() => {
    const normalized = form.ciudad.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (!normalized) {
      setFilteredCities(COLOMBIAN_CITIES);
    } else {
      const filtered = COLOMBIAN_CITIES.filter(c => 
        c.search.includes(normalized) || c.name.toLowerCase().includes(normalized)
      );
      setFilteredCities(filtered);
    }
  }, [form.ciudad]);

  // Manejar cambios de inputs
  const handleChange = (key: string, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const handleSymptomToggle = (key: "heat" | "dust" | "humidity" | "gases") => {
    setSymptoms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Validaciones por paso
  const validateStep = (currentStep: number): boolean => {
    const stepErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!form.servicio) stepErrors.servicio = "Seleccione un servicio.";
      if (!form.urgencia) stepErrors.urgencia = "Seleccione el nivel de urgencia.";
    }

    if (currentStep === 2) {
      if (Number(form.length) <= 0 || isNaN(form.length)) stepErrors.length = "Largo debe ser mayor a 0.";
      if (Number(form.width) <= 0 || isNaN(form.width)) stepErrors.width = "Ancho debe ser mayor a 0.";
      if (Number(form.height) <= 0 || isNaN(form.height)) stepErrors.height = "Alto debe ser mayor a 0.";
      if (!form.environment) stepErrors.environment = "Seleccione un ambiente operativo.";
      
      const cityValid = COLOMBIAN_CITIES.some(c => c.name.toLowerCase() === form.ciudad.trim().toLowerCase()) || form.ciudad.trim().length > 2;
      if (!form.ciudad.trim()) {
        stepErrors.ciudad = "Ingrese la ciudad de la planta.";
      } else if (!cityValid) {
        stepErrors.ciudad = "Seleccione una ciudad de la lista para normalización.";
      }
    }

    if (currentStep === 3) {
      if (!form.nombre.trim()) stepErrors.nombre = "El nombre es obligatorio.";
      if (!form.empresa.trim()) stepErrors.empresa = "La razón social de la empresa es obligatoria.";
      if (!form.cargo) stepErrors.cargo = "Seleccione su cargo.";
      
      // Email corporativo
      const email = form.email.trim();
      if (!email) {
        stepErrors.email = "El correo electrónico es obligatorio.";
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        stepErrors.email = "Ingrese un correo electrónico válido.";
      }
      
      // Teléfono colombiano
      const tel = form.telefono.trim();
      if (!tel) {
        stepErrors.telefono = "El teléfono corporativo es obligatorio.";
      } else if (!/^(\+?57)?(3\d{9}|60[1-8]\d{7})$/.test(tel)) {
        stepErrors.telefono = "Ingrese un teléfono colombiano válido (celular o fijo de 10 dígitos).";
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  // Enviar sumisión final
  const handleSubmit = async () => {
    if (!validateStep(3)) {
      setStep(3);
      return;
    }

    setIsSubmitting(true);
    try {
      const finalResult = await submitWizardData(tenantCode || "acme", {
        servicio: form.servicio,
        length: Number(form.length),
        width: Number(form.width),
        height: Number(form.height),
        environment: form.environment as "heavy_plant" | "data_center" | "warehouse" | "mining" | "default",
        nombre: form.nombre,
        empresa: form.empresa,
        cargo: form.cargo,
        telefono: form.telefono,
        email: form.email,
        ciudad: form.ciudad,
        urgencia: form.urgencia
      });
      setResult(finalResult);
      setStep(5); // Pantalla de éxito
    } catch (err: any) {
      console.error(err);
      setErrors({ global: err.message || "Error registrando la cotización." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // CLIENT-SIDE PDF GENERATION CON jspdf
  const generatePdfReport = async () => {
    if (!result) return;
    
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const primary = primaryColor;
      
      // PAGE 1: Portada
      doc.setFillColor(30, 30, 30);
      doc.rect(0, 0, 210, 297, "F");
      
      // Decoraciones Vectoriales
      doc.setDrawColor(2, 132, 199);
      doc.setLineWidth(1.5);
      doc.line(15, 15, 195, 15);
      doc.line(15, 282, 195, 282);
 
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(22);
      doc.text("INFORME DE PREINGENIERÍA INDUSTRIAL", 105, 70, { align: "center" });
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(156, 163, 175);
      doc.text("Estudio de Renovación de Aire y Caudal Requerido (CFM)", 105, 80, { align: "center" });
 
      doc.setDrawColor(82, 82, 91);
      doc.setLineWidth(0.5);
      doc.line(40, 95, 170, 95);
 
      // Metadatos
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text(`Código de Reporte: ${result.diagnosticCode}`, 45, 120);
      doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString("es-CO")}`, 45, 130);
      doc.text(`Proveedor Técnico: ${siteName}`, 45, 140);
      
      // Datos Cliente
      doc.setFillColor(39, 39, 42);
      doc.rect(40, 160, 130, 60, "F");
      
      doc.setFont("Helvetica", "bold");
      doc.text("INFORMACIÓN DEL LEADO / PLANTA", 45, 172);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(212, 212, 216);
      doc.text(`Contacto: ${form.nombre}`, 45, 182);
      doc.text(`Empresa: ${form.empresa}`, 45, 192);
      doc.text(`Cargo: ${form.cargo}`, 45, 202);
      doc.text(`Ubicación: ${form.ciudad}, Colombia`, 45, 212);
 
      doc.setFontSize(9);
      doc.setTextColor(113, 113, 122);
      doc.text(`${siteName} ${config.productName || "Soluciones B2B"}`, 105, 270, { align: "center" });
 
      // PAGE 2: Parámetros Técnicos
      doc.addPage();
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, "F");
 
      // Encabezado
      doc.setFillColor(30, 30, 30);
      doc.rect(0, 0, 210, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`${siteName.toUpperCase()} - REPORTE DE CÁLCULO DE CAUDAL`, 15, 18);

      doc.setTextColor(30, 30, 30);
      doc.setFontSize(12);
      doc.text("1. PARÁMETROS GEOMÉTRICOS Y DIMENSIONALES", 15, 48);

      // Tabla de Datos Físicos
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.3);
      doc.line(15, 55, 195, 55);

      doc.setFontSize(10);
      doc.setFont("Helvetica", "bold");
      doc.text("Parámetro", 20, 62);
      doc.text("Valor Planta", 90, 62);
      doc.text("Detalle de Ingeniería", 140, 62);
      doc.line(15, 66, 195, 66);

      doc.setFont("Helvetica", "normal");
      doc.text("Dimensiones del Galpón", 20, 74);
      doc.text(`${form.length}m x ${form.width}m x ${form.height}m`, 90, 74);
      doc.text("Largo x Ancho x Alto", 140, 74);
      doc.line(15, 78, 195, 78);

      doc.text("Volumen Físico Total", 20, 86);
      doc.text(`${Math.round(result.calculatedVolumeM3)} m3`, 90, 86);
      doc.text(`(${Math.round(result.calculatedVolumeM3 * 35.3147)} pies cúbicos)`, 140, 86);
      doc.line(15, 90, 195, 90);

      doc.text("Entorno de Trabajo", 20, 98);
      doc.text(`${form.environment === "heavy_plant" ? "Planta Pesada" : form.environment === "data_center" ? "Data Center" : form.environment === "mining" ? "Minería" : form.environment === "warehouse" ? "Bodega" : "Área Común"}`, 90, 98);
      doc.text(`${form.environment === "heavy_plant" ? "35 ACH" : form.environment === "data_center" ? "25 ACH" : form.environment === "mining" ? "55 ACH" : form.environment === "warehouse" ? "12 ACH" : "10 ACH"} Renovaciones/Hora`, 140, 98);
      doc.line(15, 102, 195, 102);

      doc.setFont("Helvetica", "bold");
      doc.text("CAUDAL REQUERIDO", 20, 110);
      doc.setTextColor(2, 132, 199);
      doc.text(`${result.requiredCfm.toLocaleString()} CFM`, 90, 110);
      doc.setTextColor(30, 30, 30);
      doc.text(`Clasificación: ${result.cfmCategory}`, 140, 110);
      doc.line(15, 114, 195, 114);

      // Severidad
      doc.text("2. DIAGNÓSTICO DE AMBIENTE OPERATIVO", 15, 135);
      doc.line(15, 140, 195, 140);
      doc.setFont("Helvetica", "normal");
      doc.text(`Índice de Severidad de Desgaste en Planta: ${severityScore}% - NIVEL ${severityLevel}`, 20, 148);
      
      doc.setFont("Helvetica", "bold");
      doc.text("Sugerencias de Diseño Aerodinámico:", 20, 160);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      
      let recoText = "Se recomienda el uso de álabes tipo axial estándar y persianas de gravedad de aluminio.";
      if (severityScore >= 70) {
        recoText = "CRÍTICO: Obligatorio el uso de extractores tipo Blower o Hongo con recubrimiento epóxico anticorrosivo, álabes de aluminio extruido y motores cerrados contra polvo/humedad.";
      } else if (severityScore >= 30) {
        recoText = "MODERADO: Se sugiere protección contra humedad y filtros de partículas de carbón activado si hay gases/olores en suspensión.";
      }
      
      doc.text(doc.splitTextToSize(recoText, 170), 20, 168);

      // PAGE 3: Estimación y Garantía
      doc.addPage();
      // Encabezado Page 3
      doc.setFillColor(30, 30, 30);
      doc.rect(0, 0, 210, 30, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text(`${siteName.toUpperCase()} - PROPUESTA COMERCIAL PRELIMINAR`, 15, 18);
 
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(12);
      doc.text("3. ESTIMACIÓN PRESUPUESTARIA PRELIMINAR (B2B)", 15, 48);
      doc.line(15, 52, 195, 52);
 
      // Tabla Precios
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Moneda de Referencia", 20, 62);
      doc.text("Rango de Inversión Mínimo", 80, 62);
      doc.text("Rango de Inversión Máximo", 140, 62);
      doc.line(15, 66, 195, 66);
 
      doc.setFont("Helvetica", "normal");
      doc.text("Pesos Colombianos (COP)", 20, 74);
      doc.text(formatCurrency(result.estimatedPriceMinCop), 80, 74);
      doc.text(formatCurrency(result.estimatedPriceMaxCop), 140, 74);
      doc.line(15, 78, 195, 78);
 
      doc.text("Dólares Americanos (USD)", 20, 86);
      doc.text(formatUsd(result.estimatedPriceMinUsd), 80, 86);
      doc.text(formatUsd(result.estimatedPriceMaxUsd), 140, 86);
      doc.line(15, 90, 195, 90);
 
      // Nota de Desviación
      doc.setFontSize(8.5);
      doc.setTextColor(113, 113, 122);
      doc.text("Nota: La estimación presupuestal incluye una desviación de ±15% y está calculada en base a las dimensiones ingresadas y la urgencia comercial especificada. Tasa fija de conversión: 1 USD = 4,000 COP.", 15, 100, { maxWidth: 180 });
 
      // Garantía
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(12);
      doc.setFont("Helvetica", "bold");
      doc.text("4. COBERTURA Y POLÍTICA DE GARANTÍA", 15, 120);
      doc.line(15, 124, 195, 124);
      
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.text(`Todos los proyectos de ventilación mecánica de ${siteName} son cubiertos bajo una Garantía de Fábrica Estándar de 12 meses computados a partir del cierre operacional de la Orden de Trabajo en el ERP. La garantía cubre fallas mecánicas de motor, deformación de álabes y problemas de balanceo estático-dinámico bajo uso normal en planta.`, 20, 132, { maxWidth: 170 });
 
      // Firma y Disclaimer
      doc.setFillColor(244, 244, 245);
      doc.rect(15, 165, 180, 45, "F");
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.text("DISCLAIMER / AVISO LEGAL DE INGENIERÍA", 20, 175);
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(113, 113, 122);
      doc.text(`Este estudio de preingeniería es de carácter informativo y preliminar. No reemplaza un diseño ejecutivo detallado firmado por un ingeniero mecánico certificado. ${siteName} no se hace responsable por variaciones térmicas o de presión si las dimensiones o renovación de aire real del establecimiento difieren de las ingresadas en este wizard.`, 20, 183, { maxWidth: 170 });
 
      // Guardar PDF
      doc.save(`${siteName.replace(/\s+/g, "_")}_Reporte_Preingenieria_${result.diagnosticCode}.pdf`);
    } catch (err) {
      console.error("Error generating pdf client-side:", err);
    }
  };
 
  // WhatsApp click
  const getWhatsAppLink = () => {
    if (!result) return "";
    const text = `Hola ${siteName}. He terminado mi diagnóstico técnico en el wizard con código de reporte *${result.diagnosticCode}*.
    
- *Caudal Requerido:* ${result.requiredCfm.toLocaleString()} CFM (${result.cfmCategory})
- *Empresa:* ${form.empresa} (Ciudad: ${form.ciudad})
- *Contacto:* ${form.nombre} (${form.cargo})
- *Servicio:* ${form.servicio === "venta" ? "Venta" : "Fabricación"}

Solicito una cotización formal y confirmación de disponibilidad técnica. Gracias.`;
    const waNumber = branding.whatsapp || "573123456789";
    const cleanedNumber = waNumber.replace(/\D/g, "");
    return `https://wa.me/${cleanedNumber}?text=${encodeURIComponent(text)}`;
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(val);
  };

  const formatUsd = (val: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="w-full min-h-screen bg-paper text-ink">
      {/* === TOP META BAR === */}
      <div className="border-b border-line bg-paper-warm">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-14 h-10 flex items-center justify-between font-mono text-[10px] tracking-widest text-fg-muted uppercase">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ds-c-wizard-stepper-dot-background)] animate-pulse" />
              <span>Cotizador en línea</span>
            </span>
            <span className="hidden md:inline">Preingeniería · Cálculo técnico</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline">COP / USD · ES / CO</span>
            <span>Datos cifrados</span>
          </div>
        </div>
      </div>

      {/* === HEADER === */}
      <header className="border-b border-line bg-paper">
        <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-14 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            {siteLogo ? (
              <Image
                src={siteLogo}
                alt={siteName}
                width={120}
                height={32}
                className="h-7 w-auto object-contain"
              />
            ) : (
              <span className="font-display text-lg font-light text-ink tracking-[-0.02em]">
                {siteName}
              </span>
            )}
          </Link>

          <Link
            href="/"
            className="font-mono text-[11px] tracking-widest text-fg-muted hover:text-ink uppercase transition-colors"
          >
            ← Volver al sitio
          </Link>
        </div>
      </header>

      {/* === BANNER DE PRE-LLENADO (cuando hay query params) === */}
      {(() => {
        const qProduct = searchParams.get("product");
        const qLength = searchParams.get("length");
        const qWidth = searchParams.get("width");
        const qHeight = searchParams.get("height");
        const qCfm = searchParams.get("cfm");
        const qEnv = searchParams.get("environment");
        const qServicio = searchParams.get("servicio");

        const hasContext = qProduct || qServicio || (qLength && qWidth && qHeight);
        if (!hasContext) return null;

        const cleanUrl = () => {
          const url = new URL(window.location.href);
          ["product", "length", "width", "height", "cfm", "environment", "servicio", "altitude"].forEach(
            (k) => url.searchParams.delete(k)
          );
          window.history.replaceState({}, "", url.toString());
          window.location.reload();
        };

        return (
          <div className="border-b border-line bg-ink text-paper">
            <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-14 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-mono text-[10px] tracking-widest text-white/50 uppercase">
                  Configurando
                </span>
                {qProduct && (
                  <span className="font-mono text-[11px] tracking-widest text-[var(--ds-c-wizard-stepper-completed-foreground)] uppercase font-medium">
                    {qProduct}
                  </span>
                )}
                {qServicio && !qProduct && (
                  <span className="font-mono text-[11px] tracking-widest text-[var(--ds-c-wizard-stepper-completed-foreground)] uppercase font-medium">
                    Servicio {qServicio}
                  </span>
                )}
                {qLength && qWidth && qHeight && (
                  <>
                    <span className="text-white/30">·</span>
                    <span className="font-mono text-[11px] text-white/80 tracking-wider">
                      Planta {qLength}m × {qWidth}m × {qHeight}m
                    </span>
                  </>
                )}
                {qEnv && (
                  <>
                    <span className="text-white/30">·</span>
                    <span className="font-mono text-[11px] text-white/80 tracking-wider">
                      {ENVIRONMENT_OPTIONS.find((e) => e.value === qEnv)?.label || qEnv}
                    </span>
                  </>
                )}
                {qCfm && (
                  <>
                    <span className="text-white/30">·</span>
                    <span className="font-mono text-[11px] text-white/80 tracking-wider">
                      {parseInt(qCfm).toLocaleString("es-CO")} CFM
                    </span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={cleanUrl}
                className="font-mono text-[10px] tracking-widest text-white/50 hover:text-white uppercase transition-colors flex items-center gap-2"
              >
                <span>Limpiar contexto</span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })()}

      {/* === STEPPER EDITORIAL === */}
      {step <= 4 && (
        <div className="bg-paper-warm">
          <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-14 py-12 lg:py-16">
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { label: "Servicio", desc: "Tipo & prioridad", stepNo: 1 },
                { label: "Análisis", desc: "Dimensiones & ACH", stepNo: 2 },
                { label: "Contacto", desc: "Datos B2B", stepNo: 3 },
                { label: "Cálculos", desc: "CFM & inversión", stepNo: 4 },
              ].map((s) => {
                const isActive = step === s.stepNo;
                const isCompleted = step > s.stepNo;
                return (
                  <div
                    key={s.stepNo}
                    className={`relative bg-paper-warm px-3 lg:px-4 py-4 ${
                      isActive ? "" : ""
                    }`}
                  >
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span
                        className={`font-mono text-[11px] tracking-widest uppercase ${
                          isActive
                            ? "text-ink font-medium"
                            : isCompleted
                              ? "text-[var(--ds-c-wizard-stepper-completed-foreground)] font-medium"
                              : "text-fg-muted"
                        }`}
                      >
                        0{s.stepNo}
                      </span>
                      {isCompleted && (
                        <Check
                          className="w-3.5 h-3.5 text-[var(--ds-c-wizard-stepper-completed-foreground)]"
                          strokeWidth={2.5}
                        />
                      )}
                      {isActive && (
                        <span className="ml-auto font-mono text-[9px] tracking-widest text-ink uppercase">
                          ● Activo
                        </span>
                      )}
                    </div>
                    <p
                      className={`font-display text-base lg:text-lg tracking-[-0.01em] leading-[1.1] ${
                        isActive
                          ? "text-ink font-normal"
                          : isCompleted
                            ? "text-ink-soft"
                            : "text-fg-muted"
                      }`}
                    >
                      {s.label}
                    </p>
                    <p className="mt-1.5 font-mono text-[10px] tracking-wide text-fg-muted">
                      {s.desc}
                    </p>
                    {/* Bottom indicator bar */}
                    <div
                      className={`absolute left-0 right-0 bottom-0 h-px transition-all duration-500 ${
                        isActive
                          ? "bg-ink"
                          : isCompleted
                            ? "bg-[var(--ds-c-wizard-stepper-dot-background)]"
                            : "bg-transparent"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* === BODY: Full width 90% === */}
      <div className="grid grid-cols-1">
        <div
          className="px-6 sm:px-10 lg:px-20 xl:px-32 py-16 lg:py-24 min-h-[480px]"
        >
          {errors.global && (
            <div className="mb-6 p-4 border-l-2 border-[var(--ds-c-wizard-stepper-error-background)] bg-[color-mix(in srgb,var(--ds-c-wizard-stepper-error-background) 5%,transparent)] flex items-start gap-3">
              <AlertCircle
                className="w-4 h-4 text-[var(--ds-c-wizard-stepper-error-foreground)] mt-0.5 shrink-0"
                strokeWidth={1.5}
              />
              <p className="text-sm text-ink font-sans">{errors.global}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* PASO 1 */}
            {step === 1 && (
              <ServiceSelectionStep
                form={form}
                handleChange={handleChange}
                preselectedProduct={preselectedProduct}
                primaryColor={primaryColor}
              />
            )}

            {/* PASO 2: ANÁLISIS TÉCNICO + TICKER LIVE + DIAGNÓSTICO SÍNTOMAS */}
            {step === 2 && (
              <TechnicalAnalysisStep
                form={form}
                handleChange={handleChange}
                errors={errors}
                animatedCfm={animatedCfm}
                realtimePrice={realtimePrice}
                symptoms={symptoms}
                handleSymptomToggle={handleSymptomToggle}
                cityInputFocus={cityInputFocus}
                setCityInputFocus={setCityInputFocus}
                filteredCities={filteredCities}
              />
            )}

            {/* PASO 3 */}
            {step === 3 && (
              <CorporateInfoStep
                form={form}
                handleChange={handleChange}
                errors={errors}
                exampleDomain={config.exampleDomain || "empresa.com"}
              />
            )}

            {/* PASO 4 */}
            {step === 4 && (
              <SummaryStep
                form={form}
                realtimeCfm={realtimeCfm}
                severityScore={severityScore}
                siteName={siteName}
              />
            )}

            {/* PASO 5: EXITO CON GENERACIÓN CLIENT-SIDE PDF + WHATSAPP B2B */}
            {step === 5 && result && (
              <SuccessStep
                form={form}
                result={result}
                siteName={siteName}
                primaryColor={primaryColor}
                generatePdfReport={generatePdfReport}
                getWhatsAppLink={getWhatsAppLink}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* === BOTONERA DE CONTROL === */}
      {step <= 4 && (
        <div className="bg-paper">
          <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-14 py-10 lg:py-12 flex justify-between items-center">
            {step === 1 ? (
              <Link
                href="/"
                className="inline-flex items-center gap-2 font-sans text-sm text-ink-soft hover:text-ink transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={1.5} />
                <span>Volver al sitio</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 font-sans text-sm text-ink-soft hover:text-ink transition-colors group disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" strokeWidth={1.5} />
                <span>Paso anterior</span>
              </button>
            )}

            <p className="hidden md:block font-mono text-[10px] tracking-widest text-fg-muted uppercase">
              Paso {step} de 4 · {siteName.split(" ")[0]} Preingeniería
            </p>

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="group inline-flex items-center gap-3 h-12 px-6 bg-ink text-paper text-sm font-medium tracking-tight rounded-sm hover:bg-ink-soft transition-all duration-200"
              >
                <span>Continuar</span>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="group inline-flex items-center gap-3 h-12 px-6 bg-ink text-paper text-sm font-medium tracking-tight rounded-sm hover:bg-ink-soft transition-all duration-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Procesando…</span>
                ) : (
                  <>
                    <span>Confirmar y enviar cotización</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      <path d="M5 12h14M13 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      )}
      <ChatbotWidget primaryColor={primaryColor} tenantCode={tenantParam} branding={branding} currentWizardStep={step} />
    </div>
  );
}
