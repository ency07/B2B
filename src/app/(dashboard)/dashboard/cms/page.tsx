/* eslint-disable react/jsx-no-comment-textnodes */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Sparkles,
  Globe,
  Package,
  Layers,
  Award,
  HelpCircle,
  Video,
  Grid,
  FileArchive,
  BookOpen,
  Search,
  Tag,
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle,
  ChevronRight,
  ChevronDown,
  Palette,
  Upload,
  RefreshCw,
  History,
  Building,
  Layout,
  ExternalLink,
  ShieldCheck,
  FileText,
  Wind,
  Image as ImageIcon,
  MessageSquare,
  Loader2
} from "lucide-react";

import { Button } from "@/platform/ui/button";
import { Input } from "@/platform/ui/input";
import { Badge } from "@/platform/ui/badge";
import { Spinner } from "@/platform/ui/spinner";
import { Textarea } from "@/platform/ui/textarea";

import { getTenantBranding, saveTenantBranding } from "@/web/actions/branding";
import { BrandingConfig, getBrandingDefaults } from "@/platform/branding/branding-defaults";
import { getIndustrialCatalog, CatalogCategory, saveProduct, deleteProduct, saveCategory, deleteCategory } from "@/web/actions/catalog";

type TabId = "hero" | "trust" | "problems" | "process" | "disciplines" | "services" | "sectores" | "cases" | "catalog" | "media" | "blog" | "seo" | "footer" | "chatbot";

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  author: string;
  status: "BORRADOR" | "PUBLICADO";
  publishedAt: string;
}

interface MediaFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string;
}

// Expandable tree node for catalog
interface CatalogNodeProps {
  label: string;
  code: string;
  children?: React.ReactNode;
  level?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

function CatalogNode({ label, code, children, level = 0, onEdit, onDelete }: CatalogNodeProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <div>
      <div
        className={`flex items-center justify-between group hover:bg-accent/40 rounded-lg px-2 py-1.5 cursor-pointer transition-colors`}
        style={{ paddingLeft: `${(level + 1) * 12}px` }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1" onClick={() => setOpen(!open)}>
          {children ? (
            open ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
          ) : (
            <div className="w-3 h-3 shrink-0" />
          )}
          <span className="text-xs font-mono text-primary shrink-0">{code}</span>
          <span className="text-xs text-foreground truncate">{label}</span>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          {onEdit && (
            <button onClick={onEdit} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent">
              <Edit2 className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="p-1 rounded text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      {open && children && <div>{children}</div>}
    </div>
  );
}

export default function CmsPage() {
  const searchParams = useSearchParams();
  const tenantParam = searchParams.get("tenant");

  const [activeTab, setActiveTab] = React.useState<TabId>("hero");
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null);

  const previewContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (previewContainerRef.current) {
      const element = previewContainerRef.current.querySelector(`#preview-${activeTab}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [activeTab]);

  // ===== BRANDING/HERO STATE =====
  const [brandingState, setBrandingState] = React.useState<BrandingConfig>(getBrandingDefaults(tenantParam));
  const [isBrandingLoading, setIsBrandingLoading] = React.useState(true);
  const [isBrandingSubmitting, setIsBrandingSubmitting] = React.useState(false);

  // Additional mock settings for detailed Hero settings

  // ===== SECTORES / CASOS DE ÉXITO =====
  // Estos viven dentro de brandingState (sectores, casos) y se
  // publican junto con el Hero mediante handleSaveBranding — la landing
  // pública los lee directamente de ahí (Sectors.tsx / FeaturedCase.tsx).

  // ===== CATALOG STATE =====
  const [catalog, setCatalog] = React.useState<CatalogCategory[]>([]);
  const [isCatalogLoading, setIsCatalogLoading] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<{
    id?: string; productCode: string; name: string; description: string; status: string; seriesId: string;
    specifications: Record<string, string>;
    price?: number;
    stepUrl?: string;
    dwgUrl?: string;
  } | null>(null);
  const [editingCategory, setEditingCategory] = React.useState<{
    id?: string; categoryCode: string; name: string; description: string;
  } | null>(null);
  const [newSpecKey, setNewSpecKey] = React.useState("");
  const [newSpecVal, setNewSpecVal] = React.useState("");
  const [isSavingProduct, setIsSavingProduct] = React.useState(false);

  // ===== MEDIA LIBRARY STATE =====
  const [mediaList, setMediaList] = React.useState<MediaFile[]>([
    { id: "m-1", name: "video_hero.mp4", size: "18.4 MB", type: "video/mp4", url: "/video_hero.mp4" },
    { id: "m-2", name: "dossier_tecnico_2026.pdf", size: "4.2 MB", type: "application/pdf", url: "/dossier_tecnico_2026.pdf" },
    { id: "m-3", name: "plano_extractor_vt7500.dwg", size: "1.8 MB", type: "image/vnd.dwg", url: "/plano_extractor_vt7500.dwg" }
  ]);

  // ===== BLOG STATE =====
  const [blogArticles, setBlogArticles] = React.useState<BlogArticle[]>([
    { id: "art-1", title: "Normativa AMCA en Ventiladores Industriales", slug: "normativa-amca", category: "Ingeniería", author: "Ing. Carlos Mendoza", status: "PUBLICADO", publishedAt: "2026-06-15" },
    { id: "art-2", title: "Cálculo de Renovaciones de Aire por Minuto", slug: "calculo-renovaciones-aire", category: "Cálculo", author: "Dr. Sandra Gómez", status: "BORRADOR", publishedAt: "--" }
  ]);
  const [editingArticle, setEditingArticle] = React.useState<BlogArticle | null>(null);

  // ===== FOOTER STATE =====
  // Variables movidas a brandingState

  React.useEffect(() => {
    async function loadBranding() {
      try {
        const data = await getTenantBranding(tenantParam);
        setBrandingState(data);
      } catch (err) {
        console.error("Error loading branding in CMS:", err);
      } finally {
        setIsBrandingLoading(false);
      }
    }
    loadBranding();
  }, [tenantParam]);

  const handleBrandingChange = <K extends keyof BrandingConfig>(key: K, val: BrandingConfig[K]) => {
    setBrandingState(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveBranding = async () => {
    setIsBrandingSubmitting(true);
    try {
      const res = await saveTenantBranding(tenantParam, brandingState, "Actualización del Hero de la Landing Page vía CMS");
      if (!res.success) throw new Error(res.error || "No se pudo guardar");
      
      const cacheKey = `tenant_config_${tenantParam || "default"}`;
      localStorage.setItem(cacheKey, JSON.stringify(brandingState));

      triggerSuccess("Configuración del Hero de la Landing Page pública publicada con éxito.");
    } catch (err: any) {
      toast.error(`Error al guardar: ${err.message || err}`);
    } finally {
      setIsBrandingSubmitting(false);
    }
  };

  const loadCatalog = React.useCallback(async () => {
    setIsCatalogLoading(true);
    try {
      const data = await getIndustrialCatalog(tenantParam);
      setCatalog(data);
    } catch (err) {
      console.error("Error loading catalog:", err);
    } finally {
      setIsCatalogLoading(false);
    }
  }, [tenantParam]);

  React.useEffect(() => {
    if (activeTab === "catalog") {
      loadCatalog();
    }
  }, [activeTab, loadCatalog]);

  const handleSaveProduct = async () => {
    if (!editingProduct) return;
    setIsSavingProduct(true);
    try {
      const res = await saveProduct(tenantParam, editingProduct);
      if (!res.success) throw new Error(res.error || "Error al guardar producto");
      await loadCatalog();
      setEditingProduct(null);
      triggerSuccess("Producto guardado exitosamente en el catálogo comercial.");
    } catch (err: any) {
      toast.error(`Error: ${err.message || err}`);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    const res = await deleteProduct(tenantParam, productId);
    if (res.success) {
      await loadCatalog();
      triggerSuccess("Producto eliminado del catálogo.");
    } else {
      toast.error(`Error: ${res.error}`);
    }
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    const res = await saveCategory(tenantParam, editingCategory);
    if (res.success) {
      await loadCatalog();
      setEditingCategory(null);
      triggerSuccess("Categoría de catálogo guardada con éxito.");
    } else {
      toast.error(`Error: ${res.error}`);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("¿Eliminar esta categoría y todos sus productos?")) return;
    const res = await deleteCategory(tenantParam, categoryId);
    if (res.success) {
      await loadCatalog();
      triggerSuccess("Categoría eliminada.");
    } else {
      toast.error(`Error: ${res.error}`);
    }
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "hero", label: "Landing / Hero", icon: Globe },
    { id: "trust", label: "Confianza", icon: ShieldCheck },
    { id: "problems", label: "Desafíos", icon: Sliders },
    { id: "process", label: "Proceso", icon: Layers },
    { id: "disciplines", label: "Disciplinas", icon: HelpCircle },
    { id: "services", label: "Servicios", icon: Wind },
    { id: "sectores", label: "Sectores", icon: Grid },
    { id: "cases", label: "Casos de Éxito", icon: Award },
    { id: "catalog", label: "Productos & Catálogo", icon: Package },
    { id: "media", label: "Biblioteca Multimedia", icon: FileArchive },
    { id: "blog", label: "Blog Corporativo", icon: BookOpen },
    { id: "seo", label: "SEO Metatags", icon: Sliders },
    { id: "footer", label: "Footer & Contacto", icon: Layout },
    { id: "chatbot", label: "Asistente Chatbot B2B", icon: MessageSquare },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="w-3.5 h-3.5" /> Gestor de Contenido (CMS)
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Portal CMS Público
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra todo el contenido público comercial expuesto en la Landing Page corporativa.
          </p>
        </div>

        {(activeTab === "hero" || activeTab === "trust" || activeTab === "problems" || activeTab === "process" || activeTab === "disciplines" || activeTab === "services" || activeTab === "sectores" || activeTab === "cases" || activeTab === "seo" || activeTab === "footer") && (
          <Button
            onClick={handleSaveBranding}
            disabled={isBrandingSubmitting || isBrandingLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-9 px-5 cursor-pointer shrink-0"
          >
            {isBrandingSubmitting ? (
              <><Spinner className="w-3.5 h-3.5 mr-1.5" /> Publicando...</>
            ) : (
              <><Save className="w-3.5 h-3.5 mr-1.5" /> Guardar y Publicar</>
            )}
          </Button>
        )}
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-success/20 bg-success/5 text-success animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <h4 className="font-semibold text-sm">Contenido Publicado</h4>
            <p className="text-xs opacity-90">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-border text-xs overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2.5 px-3 font-medium transition-colors border-b-2 relative -mb-[2px] flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-primary text-primary font-bold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Grid split for Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left forms pane */}
        <div className="lg:col-span-8 p-6 rounded-2xl border border-border bg-card/40 backdrop-blur-md min-h-[520px]">

        {/* ==================== TAB: LANDING / HERO ==================== */}
        {activeTab === "hero" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {isBrandingLoading ? (
              <div className="text-center py-12 font-mono text-xs text-muted-foreground animate-pulse">Cargando Hero...</div>
            ) : (
              <>
                <div>
                  <span className="text-[10px] font-mono text-primary uppercase font-bold">// Portada Principal</span>
                  <h3 className="text-sm font-semibold text-foreground mt-0.5">Configuración de Pantalla Hero</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Imagen para compartir en redes (Open Graph)</label>
                    <Input value={brandingState.landing_imagen_url || ''} onChange={(e) => handleBrandingChange("landing_imagen_url", e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground font-medium">URL Dossier Corporativo B2B (Ficha / Brochure)</label>
                    <Input value={brandingState.dossier_url} onChange={(e) => handleBrandingChange("dossier_url", e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
                  </div>

                  {/* Buttons */}
                  <div className="md:col-span-2 border-t border-border pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium">Texto Botón Primario</label>
                      <Input value={brandingState.hero_cta_primario_label} onChange={(e) => handleBrandingChange("hero_cta_primario_label", e.target.value)} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground font-medium">Texto Botón Secundario</label>
                      <Input value={brandingState.hero_cta_secundario_label} onChange={(e) => handleBrandingChange("hero_cta_secundario_label", e.target.value)} className="bg-background border-border text-xs text-foreground" />
                    </div>
                  </div>
                </div>

                {/* Carrusel del Hero (4 slides — una por etapa del proceso) */}
                <div className="border-t border-border pt-4 space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground font-medium">Carrusel del Hero (4 etapas)</label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Los colores y el fondo de cada slide son parte del diseño y no se editan aquí — solo el copy.</p>
                  </div>
                  {brandingState.hero_slides.map((slide, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
                      <div className="text-[10px] font-mono text-muted-foreground uppercase">Etapa {idx + 1}</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Eyebrow (línea superior)</label>
                          <Input value={slide.eyebrow} onChange={(e) => { const next = [...brandingState.hero_slides]; next[idx] = { ...next[idx], eyebrow: e.target.value }; handleBrandingChange("hero_slides", next); }} className="bg-background border-border text-xs text-foreground font-mono" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Duración</label>
                          <Input value={slide.duration} onChange={(e) => { const next = [...brandingState.hero_slides]; next[idx] = { ...next[idx], duration: e.target.value }; handleBrandingChange("hero_slides", next); }} className="bg-background border-border text-xs text-foreground" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Título principal</label>
                          <Input value={slide.titleMain} onChange={(e) => { const next = [...brandingState.hero_slides]; next[idx] = { ...next[idx], titleMain: e.target.value }; handleBrandingChange("hero_slides", next); }} className="bg-background border-border text-xs text-foreground" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Título en cursiva</label>
                          <Input value={slide.titleItalic} onChange={(e) => { const next = [...brandingState.hero_slides]; next[idx] = { ...next[idx], titleItalic: e.target.value }; handleBrandingChange("hero_slides", next); }} className="bg-background border-border text-xs text-foreground" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Descripción</label>
                        <Textarea rows={2} value={slide.desc} onChange={(e) => { const next = [...brandingState.hero_slides]; next[idx] = { ...next[idx], desc: e.target.value }; handleBrandingChange("hero_slides", next); }} className="bg-background border-border text-xs text-foreground" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Tag técnico (badge)</label>
                        <Input value={slide.tag} onChange={(e) => { const next = [...brandingState.hero_slides]; next[idx] = { ...next[idx], tag: e.target.value }; handleBrandingChange("hero_slides", next); }} className="bg-background border-border text-xs text-foreground font-mono" />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">URL de la foto de fondo</label>
                          <Input value={slide.photoUrl} onChange={(e) => { const next = [...brandingState.hero_slides]; next[idx] = { ...next[idx], photoUrl: e.target.value }; handleBrandingChange("hero_slides", next); }} placeholder="/mi-foto-real.webp" className="bg-background border-border text-xs text-foreground font-mono" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-muted-foreground">Texto alternativo de la foto</label>
                          <Input value={slide.photoAlt} onChange={(e) => { const next = [...brandingState.hero_slides]; next[idx] = { ...next[idx], photoAlt: e.target.value }; handleBrandingChange("hero_slides", next); }} className="bg-background border-border text-xs text-foreground" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== TAB: CONFIANZA (TrustMarquee) ==================== */}
        {activeTab === "trust" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-[10px] font-mono text-primary uppercase font-bold">// Prueba Social</span>
              <h3 className="text-sm font-semibold text-foreground mt-0.5">Franja de Confianza</h3>
              <p className="text-xs text-muted-foreground">Texto y lista de empresas que aparecen en la cinta animada bajo el Hero.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Texto eyebrow</label>
                <Input value={brandingState.trust_marquee.eyebrow} onChange={(e) => handleBrandingChange("trust_marquee", { ...brandingState.trust_marquee, eyebrow: e.target.value })} className="bg-background border-border text-xs text-foreground" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-muted-foreground">Línea de estadística</label>
                <Input value={brandingState.trust_marquee.statLine} onChange={(e) => handleBrandingChange("trust_marquee", { ...brandingState.trust_marquee, statLine: e.target.value })} className="bg-background border-border text-xs text-foreground font-mono" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-muted-foreground uppercase font-mono font-bold">Empresas (logo blanco/negro; sin logo se muestra el nombre en texto)</label>
                <Button
                  onClick={() => handleBrandingChange("trust_marquee", { ...brandingState.trust_marquee, clients: [...brandingState.trust_marquee.clients, { name: "Nueva empresa", logoUrl: "" }] })}
                  className="bg-secondary/40 border border-border text-foreground text-xs h-7 px-3 cursor-pointer hover:bg-secondary/60"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agregar empresa
                </Button>
              </div>
              <div className="space-y-2">
                {brandingState.trust_marquee.clients.map((client, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1.4fr_auto] gap-2 items-center">
                    <Input
                      value={client.name}
                      onChange={(e) => {
                        const next = [...brandingState.trust_marquee.clients];
                        next[idx] = { ...next[idx], name: e.target.value };
                        handleBrandingChange("trust_marquee", { ...brandingState.trust_marquee, clients: next });
                      }}
                      placeholder="Nombre de la empresa"
                      className="bg-background border-border text-xs text-foreground"
                    />
                    <Input
                      value={client.logoUrl || ""}
                      onChange={(e) => {
                        const next = [...brandingState.trust_marquee.clients];
                        next[idx] = { ...next[idx], logoUrl: e.target.value };
                        handleBrandingChange("trust_marquee", { ...brandingState.trust_marquee, clients: next });
                      }}
                      placeholder="URL del logo (opcional)"
                      className="bg-background border-border text-xs text-foreground font-mono"
                    />
                    <button
                      onClick={() => {
                        const next = brandingState.trust_marquee.clients.filter((_, i) => i !== idx);
                        handleBrandingChange("trust_marquee", { ...brandingState.trust_marquee, clients: next });
                      }}
                      className="p-2 rounded text-destructive hover:bg-destructive/10 shrink-0"
                      aria-label="Eliminar empresa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Este sitio es white-label: pegue aquí la URL del logo de cada cliente cuando lo tenga. Mientras tanto, el nombre en texto se muestra automáticamente — nunca bloquea la publicación. Solo incluya empresas que hayan autorizado explícitamente aparecer aquí.
              </p>
            </div>
          </div>
        )}

        {/* ==================== TAB: DESAFÍOS (ProblemSolving) ==================== */}
        {activeTab === "problems" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-[10px] font-mono text-primary uppercase font-bold">// Problem / Solution</span>
              <h3 className="text-sm font-semibold text-foreground mt-0.5">Desafíos Críticos (3 tarjetas)</h3>
              <p className="text-xs text-muted-foreground">El gráfico de cada tarjeta es parte del diseño y no se edita aquí.</p>
            </div>
            <div className="space-y-4">
              {brandingState.problem_solving.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">Desafío {idx + 1}</div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Frase provocadora</label>
                    <Input
                      value={item.hook}
                      onChange={(e) => {
                        const next = [...brandingState.problem_solving];
                        next[idx] = { ...next[idx], hook: e.target.value };
                        handleBrandingChange("problem_solving", next);
                      }}
                      className="bg-background border-border text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Historia / explicación</label>
                    <Textarea
                      rows={3}
                      value={item.story}
                      onChange={(e) => {
                        const next = [...brandingState.problem_solving];
                        next[idx] = { ...next[idx], story: e.target.value };
                        handleBrandingChange("problem_solving", next);
                      }}
                      className="bg-background border-border text-xs text-foreground"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Antes</label>
                      <Input value={item.statBefore} onChange={(e) => { const next = [...brandingState.problem_solving]; next[idx] = { ...next[idx], statBefore: e.target.value }; handleBrandingChange("problem_solving", next); }} className="bg-background border-border text-xs text-foreground font-mono" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Después</label>
                      <Input value={item.statAfter} onChange={(e) => { const next = [...brandingState.problem_solving]; next[idx] = { ...next[idx], statAfter: e.target.value }; handleBrandingChange("problem_solving", next); }} className="bg-background border-border text-xs text-foreground font-mono" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Etiqueta</label>
                      <Input value={item.statLabel} onChange={(e) => { const next = [...brandingState.problem_solving]; next[idx] = { ...next[idx], statLabel: e.target.value }; handleBrandingChange("problem_solving", next); }} className="bg-background border-border text-xs text-foreground" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB: PROCESO (ProcessPipeline) ==================== */}
        {activeTab === "process" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-[10px] font-mono text-primary uppercase font-bold">// Pipeline</span>
              <h3 className="text-sm font-semibold text-foreground mt-0.5">Etapas del Proceso (4 pasos)</h3>
            </div>
            <div className="space-y-4">
              {brandingState.process_pipeline.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">Etapa {idx + 1}</div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Nombre de la etapa</label>
                      <Input value={item.name} onChange={(e) => { const next = [...brandingState.process_pipeline]; next[idx] = { ...next[idx], name: e.target.value }; handleBrandingChange("process_pipeline", next); }} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Duración estimada</label>
                      <Input value={item.duration} onChange={(e) => { const next = [...brandingState.process_pipeline]; next[idx] = { ...next[idx], duration: e.target.value }; handleBrandingChange("process_pipeline", next); }} className="bg-background border-border text-xs text-foreground font-mono" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Titular (frase en cursiva)</label>
                    <Input value={item.headline} onChange={(e) => { const next = [...brandingState.process_pipeline]; next[idx] = { ...next[idx], headline: e.target.value }; handleBrandingChange("process_pipeline", next); }} className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Descripción</label>
                    <Textarea rows={3} value={item.description} onChange={(e) => { const next = [...brandingState.process_pipeline]; next[idx] = { ...next[idx], description: e.target.value }; handleBrandingChange("process_pipeline", next); }} className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Entregables (uno por línea)</label>
                    <Textarea
                      rows={3}
                      value={item.deliverables.join("\n")}
                      onChange={(e) => { const next = [...brandingState.process_pipeline]; next[idx] = { ...next[idx], deliverables: e.target.value.split("\n") }; handleBrandingChange("process_pipeline", next); }}
                      className="bg-background border-border text-xs text-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB: DISCIPLINAS ==================== */}
        {activeTab === "disciplines" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-[10px] font-mono text-primary uppercase font-bold">// Service Lines</span>
              <h3 className="text-sm font-semibold text-foreground mt-0.5">Disciplinas (4 tarjetas)</h3>
              <p className="text-xs text-muted-foreground">El ícono, color y código de cada disciplina son parte del diseño y no se editan aquí.</p>
            </div>
            <div className="space-y-4">
              {brandingState.disciplines.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">Disciplina {idx + 1}</div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Nombre</label>
                    <Input value={item.name} onChange={(e) => { const next = [...brandingState.disciplines]; next[idx] = { ...next[idx], name: e.target.value }; handleBrandingChange("disciplines", next); }} className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Descripción corta</label>
                    <Textarea rows={2} value={item.shortDescription} onChange={(e) => { const next = [...brandingState.disciplines]; next[idx] = { ...next[idx], shortDescription: e.target.value }; handleBrandingChange("disciplines", next); }} className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Valor destacado</label>
                      <Input value={item.statValue} onChange={(e) => { const next = [...brandingState.disciplines]; next[idx] = { ...next[idx], statValue: e.target.value }; handleBrandingChange("disciplines", next); }} className="bg-background border-border text-xs text-foreground font-mono" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Etiqueta del valor</label>
                      <Input value={item.statLabel} onChange={(e) => { const next = [...brandingState.disciplines]; next[idx] = { ...next[idx], statLabel: e.target.value }; handleBrandingChange("disciplines", next); }} className="bg-background border-border text-xs text-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Entregables (uno por línea, se muestran los primeros 3)</label>
                    <Textarea
                      rows={4}
                      value={item.deliverables.join("\n")}
                      onChange={(e) => { const next = [...brandingState.disciplines]; next[idx] = { ...next[idx], deliverables: e.target.value.split("\n") }; handleBrandingChange("disciplines", next); }}
                      className="bg-background border-border text-xs text-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB: SERVICIOS ==================== */}
        {activeTab === "services" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-[10px] font-mono text-primary uppercase font-bold">// Service Catalog</span>
              <h3 className="text-sm font-semibold text-foreground mt-0.5">Servicios (4 tarjetas)</h3>
              <p className="text-xs text-muted-foreground">El ícono y código de cada servicio son parte del diseño y no se editan aquí.</p>
            </div>
            <div className="space-y-4">
              {brandingState.services.map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">Servicio {idx + 1}</div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Nombre del servicio</label>
                    <Input value={item.name} onChange={(e) => { const next = [...brandingState.services]; next[idx] = { ...next[idx], name: e.target.value }; handleBrandingChange("services", next); }} className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Descripción corta</label>
                    <Textarea rows={2} value={item.shortDescription} onChange={(e) => { const next = [...brandingState.services]; next[idx] = { ...next[idx], shortDescription: e.target.value }; handleBrandingChange("services", next); }} className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Descripción larga</label>
                    <Textarea rows={3} value={item.longDescription} onChange={(e) => { const next = [...brandingState.services]; next[idx] = { ...next[idx], longDescription: e.target.value }; handleBrandingChange("services", next); }} className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Entregable</label>
                    <Input value={item.deliverable} onChange={(e) => { const next = [...brandingState.services]; next[idx] = { ...next[idx], deliverable: e.target.value }; handleBrandingChange("services", next); }} className="bg-background border-border text-xs text-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB: SECTORES ==================== */}
        {activeTab === "sectores" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-[10px] font-mono text-primary uppercase font-bold">// Sectores del Negocio</span>
              <h3 className="text-sm font-semibold text-foreground mt-0.5">Sectores Industriales Cubiertos</h3>
              <p className="text-xs text-muted-foreground">
                Edite el nombre y la descripción de cada uno de los 4 sectores mostrados en la landing pública. El ícono y el color de cada tarjeta son parte del sistema de diseño y no se editan aquí.
              </p>
            </div>

            <div className="space-y-4">
              {brandingState.sectores.map((sector, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">Sector {idx + 1}</div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Nombre del sector</label>
                    <Input
                      value={sector.name}
                      onChange={(e) => {
                        const next = [...brandingState.sectores];
                        next[idx] = { ...next[idx], name: e.target.value };
                        handleBrandingChange("sectores", next);
                      }}
                      className="bg-background border-border text-xs text-foreground"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Descripción</label>
                    <Textarea
                      rows={3}
                      value={sector.shortDescription}
                      onChange={(e) => {
                        const next = [...brandingState.sectores];
                        next[idx] = { ...next[idx], shortDescription: e.target.value };
                        handleBrandingChange("sectores", next);
                      }}
                      className="bg-background border-border text-xs text-foreground"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB: CASO DESTACADO ==================== */}
        {activeTab === "cases" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-[10px] font-mono text-primary uppercase font-bold">// Case Studies</span>
              <h3 className="text-sm font-semibold text-foreground mt-0.5">Casos Destacados (carrusel de 4)</h3>
              <p className="text-xs text-muted-foreground">La landing pública muestra estos 4 casos en un carrusel. Use fotos reales de cada proyecto — evite repetir la misma imagen entre casos.</p>
            </div>

            {brandingState.casos.map((cs, idx) => {
              const update = (patch: Partial<typeof cs>) => {
                const next = [...brandingState.casos];
                next[idx] = { ...next[idx], ...patch };
                handleBrandingChange("casos", next);
              };
              return (
                <div key={idx} className="p-4 rounded-xl border border-border bg-card/40 space-y-3">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase">Caso {idx + 1}</div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Sector / industria</label>
                      <Input value={cs.sector} onChange={(e) => update({ sector: e.target.value })} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">País</label>
                      <Input value={cs.location} onChange={(e) => update({ location: e.target.value })} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Año</label>
                      <Input value={cs.year} onChange={(e) => update({ year: e.target.value })} className="bg-background border-border text-xs text-foreground font-mono" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Titular</label>
                      <Input value={cs.titleMain} onChange={(e) => update({ titleMain: e.target.value })} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Titular (resaltado en cursiva)</label>
                      <Input value={cs.titleItalic} onChange={(e) => update({ titleItalic: e.target.value })} className="bg-background border-border text-xs text-foreground" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">URL de la foto</label>
                      <Input value={cs.photoUrl || ""} onChange={(e) => update({ photoUrl: e.target.value })} placeholder="/mi-foto-real-del-proyecto.webp" className="bg-background border-border text-xs text-foreground font-mono" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Texto alternativo de la foto</label>
                      <Input value={cs.photoAlt || ""} onChange={(e) => update({ photoAlt: e.target.value })} className="bg-background border-border text-xs text-foreground" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-muted-foreground uppercase font-mono font-bold">Métricas antes / después</label>
                    {cs.results.map((row, ridx) => (
                      <div key={ridx} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                        <Input
                          value={row.label}
                          onChange={(e) => { const results = [...cs.results]; results[ridx] = { ...results[ridx], label: e.target.value }; update({ results }); }}
                          placeholder="Métrica"
                          className="bg-background border-border text-xs text-foreground"
                        />
                        <Input
                          value={row.before}
                          onChange={(e) => { const results = [...cs.results]; results[ridx] = { ...results[ridx], before: e.target.value }; update({ results }); }}
                          placeholder="Antes"
                          className="bg-background border-border text-xs text-foreground w-24 font-mono"
                        />
                        <Input
                          value={row.after}
                          onChange={(e) => { const results = [...cs.results]; results[ridx] = { ...results[ridx], after: e.target.value }; update({ results }); }}
                          placeholder="Después"
                          className="bg-background border-border text-xs text-foreground w-24 font-mono"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-muted-foreground">Cita textual del cliente</label>
                    <Textarea rows={2} value={cs.quote} onChange={(e) => update({ quote: e.target.value })} className="bg-background border-border text-xs text-foreground" />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Nombre de quien firma la cita</label>
                      <Input value={cs.quoteAuthor} onChange={(e) => update({ quoteAuthor: e.target.value })} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Cargo · Empresa</label>
                      <Input value={cs.quoteRole} onChange={(e) => update({ quoteRole: e.target.value })} className="bg-background border-border text-xs text-foreground" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ==================== TAB: CATÁLOGO & PRODUCTOS ==================== */}
        {activeTab === "catalog" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-primary uppercase font-bold">// Catálogo Comercial</span>
                <h3 className="text-sm font-semibold text-foreground mt-0.5">Gestión de Catálogo e Ingeniería</h3>
                <p className="text-xs text-muted-foreground">Configure la jerarquía comercial pública y cargue archivos STEP/DWG técnicos.</p>
              </div>
              <Button onClick={() => setEditingCategory({ categoryCode: "", name: "", description: "" })} className="bg-secondary/40 border border-border text-foreground text-xs h-8 cursor-pointer hover:bg-secondary/60">
                <Plus className="w-3.5 h-3.5 mr-1" /> Nueva Categoría
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Tree */}
              <div className="lg:col-span-2 border border-border rounded-xl p-2 bg-muted/10 min-h-[400px]">
                {isCatalogLoading ? (
                  <div className="text-center py-8 text-xs text-muted-foreground font-mono animate-pulse">Cargando catálogo...</div>
                ) : catalog.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground font-mono">
                    <Package className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
                    Sin categorías en Supabase.
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {catalog.map(cat => (
                      <CatalogNode
                        key={cat.id}
                        label={cat.name}
                        code={cat.categoryCode}
                        level={0}
                        onEdit={() => setEditingCategory({ id: cat.id, categoryCode: cat.categoryCode, name: cat.name, description: cat.description })}
                        onDelete={() => handleDeleteCategory(cat.id)}
                      >
                        {cat.subcategories.map(sub => (
                          <CatalogNode key={sub.id} label={sub.name} code={sub.subcategoryCode} level={1}>
                            {sub.families.map(fam => (
                              <CatalogNode key={fam.id} label={fam.name} code={fam.familyCode} level={2}>
                                {fam.series.map(ser => (
                                  <CatalogNode key={ser.id} label={ser.name} code={ser.seriesCode} level={3}>
                                    {ser.products.map(prod => (
                                      <CatalogNode
                                        key={prod.id}
                                        label={prod.name}
                                        code={prod.productCode}
                                        level={4}
                                        onEdit={() => setEditingProduct({
                                          id: prod.id,
                                          productCode: prod.productCode,
                                          name: prod.name,
                                          description: prod.description,
                                          status: prod.status,
                                          seriesId: ser.id,
                                          specifications: prod.specifications,
                                          price: 15400000
                                        })}
                                        onDelete={() => handleDeleteProduct(prod.id)}
                                      />
                                    ))}
                                    <div className="pl-16 py-1">
                                      <button onClick={() => setEditingProduct({ productCode: "", name: "", description: "", status: "ACTIVO", seriesId: ser.id, specifications: {}, price: 15000000 })} className="text-[10px] text-primary hover:text-primary/80 font-mono flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Nuevo Producto
                                      </button>
                                    </div>
                                  </CatalogNode>
                                ))}
                              </CatalogNode>
                            ))}
                          </CatalogNode>
                        ))}
                      </CatalogNode>
                    ))}
                  </div>
                )}
              </div>

              {/* Editor Panel */}
              <div className="lg:col-span-3 border border-border rounded-xl p-6 bg-muted/10 min-h-[400px]">
                {editingProduct ? (
                  <div className="space-y-4">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Editor de Producto</div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Código SKU</label>
                        <Input value={editingProduct.productCode} onChange={(e) => setEditingProduct({...editingProduct, productCode: e.target.value})} className="bg-background border-border text-xs text-foreground font-mono" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Precio B2B (COP)</label>
                        <Input type="number" value={editingProduct.price || 0} onChange={(e) => setEditingProduct({...editingProduct, price: Number(e.target.value)})} className="bg-background border-border text-xs text-foreground font-mono" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Estado</label>
                        <select value={editingProduct.status} onChange={(e) => setEditingProduct({...editingProduct, status: e.target.value})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary">
                          <option value="ACTIVO">ACTIVO</option>
                          <option value="INACTIVO">INACTIVO</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Nombre del Equipo</label>
                      <Input value={editingProduct.name} onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Descripción Técnica Comercial</label>
                      <Textarea rows={3} value={editingProduct.description} onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Plano STEP (3D CAD)</label>
                        <Input value={editingProduct.stepUrl || ""} onChange={(e) => setEditingProduct({...editingProduct, stepUrl: e.target.value})} className="bg-background border-border text-[10px] text-foreground font-mono" placeholder="/cad/extractor.step" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Plano DWG (2D CAD)</label>
                        <Input value={editingProduct.dwgUrl || ""} onChange={(e) => setEditingProduct({...editingProduct, dwgUrl: e.target.value})} className="bg-background border-border text-[10px] text-foreground font-mono" placeholder="/cad/extractor.dwg" />
                      </div>
                    </div>

                    {/* Specifications */}
                    <div className="space-y-2">
                      <label className="text-[10px] text-muted-foreground uppercase font-mono font-bold">Ficha Técnica Parámetros</label>
                      <div className="space-y-1.5">
                        {Object.entries(editingProduct.specifications).map(([key, val]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-primary w-32 shrink-0 truncate">{key}</span>
                            <Input value={val} onChange={(e) => setEditingProduct({...editingProduct, specifications: {...editingProduct.specifications, [key]: e.target.value}})} className="bg-background border-border text-xs text-foreground h-7" />
                            <button onClick={() => { const s = {...editingProduct.specifications}; delete s[key]; setEditingProduct({...editingProduct, specifications: s}); }} className="text-destructive hover:text-destructive/80 shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <Input value={newSpecKey} onChange={(e) => setNewSpecKey(e.target.value)} placeholder="CFM / RPM / AMCA" className="bg-background border-border text-xs text-foreground h-7 font-mono" />
                        <Input value={newSpecVal} onChange={(e) => setNewSpecVal(e.target.value)} placeholder="Valor" className="bg-background border-border text-xs text-foreground h-7" />
                        <button
                          onClick={() => { if (newSpecKey.trim()) { setEditingProduct({...editingProduct, specifications: {...editingProduct.specifications, [newSpecKey.trim()]: newSpecVal.trim()}}); setNewSpecKey(""); setNewSpecVal(""); }}}
                          className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-md px-2 h-7 text-xs shrink-0"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between pt-2 border-t border-border">
                      <Button onClick={() => setEditingProduct(null)} className="bg-secondary/40 border border-border text-muted-foreground text-xs h-8 cursor-pointer hover:bg-secondary/60">Cancelar</Button>
                      <Button onClick={handleSaveProduct} disabled={isSavingProduct} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 cursor-pointer">
                        {isSavingProduct ? <><Spinner className="w-3 h-3 mr-1" /> Guardando...</> : <><Save className="w-3 h-3 mr-1" /> Guardar Producto</>}
                      </Button>
                    </div>
                  </div>
                ) : editingCategory ? (
                  <div className="space-y-4">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Editor de Categoría</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Código de Categoría</label>
                        <Input value={editingCategory.categoryCode} onChange={(e) => setEditingCategory({...editingCategory, categoryCode: e.target.value})} className="bg-background border-border text-xs text-foreground font-mono" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Nombre de Categoría</label>
                        <Input value={editingCategory.name} onChange={(e) => setEditingCategory({...editingCategory, name: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Descripción General</label>
                      <Textarea rows={3} value={editingCategory.description} onChange={(e) => setEditingCategory({...editingCategory, description: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <Button onClick={() => setEditingCategory(null)} className="bg-secondary/40 border border-border text-muted-foreground text-xs h-8 cursor-pointer hover:bg-secondary/60">Cancelar</Button>
                      <Button onClick={handleSaveCategory} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 cursor-pointer">
                        <Save className="w-3.5 h-3.5 mr-1" /> Guardar Categoría
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-xs font-mono">
                    <Package className="w-8 h-8 text-muted-foreground/60 mb-2" />
                    Selecciona un producto o categoría para editar en el catálogo comercial.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: BIBLIOTECA MULTIMEDIA ==================== */}
        {activeTab === "media" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-primary uppercase font-bold">// Media Library</span>
                <h3 className="text-sm font-semibold text-foreground mt-0.5">Biblioteca de Archivos B2B</h3>
                <p className="text-xs text-muted-foreground">Almacene planos STEP, DWG, PDFs técnicos y videos de marketing.</p>
              </div>
              <Button onClick={() => { toast.info("Función de carga simulada. Selecciona archivos desde tu equipo local."); }} className="bg-secondary/40 border border-border text-foreground text-xs h-8 cursor-pointer hover:bg-secondary/60">
                <Upload className="w-3.5 h-3.5 mr-1" /> Cargar Archivo
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {mediaList.map((file) => (
                <div key={file.id} className="p-3.5 rounded-xl border border-border bg-muted/10 flex flex-col justify-between gap-3 text-xs">
                  <div className="space-y-1.5">
                    <div className="h-20 bg-muted/20 rounded border border-border/60 flex items-center justify-center">
                      {file.type.includes("video") ? (
                        <Video className="w-7 h-7 text-muted-foreground/60" />
                      ) : file.type.includes("pdf") ? (
                        <FileText className="w-7 h-7 text-muted-foreground/60" />
                      ) : (
                        <FileArchive className="w-7 h-7 text-muted-foreground/60" />
                      )}
                    </div>
                    <span className="font-semibold text-foreground block truncate">{file.name}</span>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>{file.size}</span>
                      <span className="uppercase">{file.type.split("/")[1]}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => toast.success(`Enlace copiado al portapapeles: ${file.url}`)} className="flex-grow bg-secondary/40 hover:bg-secondary/60 text-foreground text-[10px] h-7 cursor-pointer">Copiar Link</Button>
                    <button onClick={() => setMediaList(prev => prev.filter(f => f.id !== file.id))} className="px-2 py-1 rounded bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== TAB: BLOG ==================== */}
        {activeTab === "blog" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-primary uppercase font-bold">// Content Marketing</span>
                <h3 className="text-sm font-semibold text-foreground mt-0.5">Blog Comercial y Artículos de Ingeniería</h3>
                <p className="text-xs text-muted-foreground">Publique artículos técnicos para mejorar el posicionamiento SEO orgánico.</p>
              </div>
              <Button onClick={() => { const newItem: BlogArticle = { id: `art-${Date.now()}`, title: "Nuevo Artículo Técnico", slug: "nuevo-articulo", category: "General", author: "Ingeniero Especialista", status: "BORRADOR", publishedAt: "--" }; setBlogArticles([...blogArticles, newItem]); setEditingArticle(newItem); }} className="bg-secondary/40 border border-border text-foreground text-xs h-8 cursor-pointer hover:bg-secondary/60">
                <Plus className="w-3.5 h-3.5 mr-1" /> Redactar Artículo
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                {blogArticles.map(art => (
                  <div key={art.id} onClick={() => setEditingArticle(art)} className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${editingArticle?.id === art.id ? "bg-accent/40 border-primary/40" : "bg-card/40 border-border hover:bg-accent/20"}`}>
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-foreground line-clamp-1">{art.title}</h4>
                      <Badge variant="secondary" className={`text-[8px] font-mono ${art.status === "PUBLICADO" ? "bg-success/10 text-success border border-success/20 animate-pulse" : "bg-secondary text-muted-foreground"}`}>{art.status}</Badge>
                    </div>
                    <div className="flex justify-between text-[9px] text-muted-foreground font-mono">
                      <span>Autor: {art.author}</span>
                      <span>Publicado: {art.publishedAt}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/10 border border-border rounded-xl p-6">
                {editingArticle ? (
                  <div className="space-y-4">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase">Editor de Redacción</div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Título del Artículo</label>
                      <Input value={editingArticle.title} onChange={(e) => setEditingArticle({...editingArticle, title: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Categoría</label>
                        <Input value={editingArticle.category} onChange={(e) => setEditingArticle({...editingArticle, category: e.target.value})} className="bg-background border-border text-xs text-foreground" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">Estado publicación</label>
                        <select value={editingArticle.status} onChange={(e) => setEditingArticle({...editingArticle, status: e.target.value as any})} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:border-primary">
                          <option value="BORRADOR">BORRADOR</option>
                          <option value="PUBLICADO">PUBLICADO</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-muted-foreground">Contenido Markdown</label>
                      <Textarea rows={6} defaultValue="# Introducción a la ingeniería de fluidos..." className="bg-background border-border text-xs text-foreground font-mono" />
                    </div>
                    <div className="flex justify-between pt-3 border-t border-border">
                      <Button onClick={() => { setBlogArticles(prev => prev.filter(a => a.id !== editingArticle.id)); setEditingArticle(null); triggerSuccess("Artículo borrado."); }} className="bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 text-xs h-8 px-3 cursor-pointer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button onClick={() => { setBlogArticles(prev => prev.map(a => a.id === editingArticle.id ? {...editingArticle, publishedAt: editingArticle.status === "PUBLICADO" ? new Date().toLocaleDateString() : "--"} : a)); setEditingArticle(null); triggerSuccess("Artículo de blog guardado."); }} className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs h-8 px-4 cursor-pointer">
                        <Save className="w-3.5 h-3.5 mr-1" /> Guardar Artículo
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground text-xs font-mono">
                    <BookOpen className="w-8 h-8 text-muted-foreground/60 mb-1" /> Selecciona un artículo para editar.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: SEO ==================== */}
        {activeTab === "seo" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-[10px] font-mono text-primary uppercase font-bold">// Search Engine Optimization</span>
              <h3 className="text-sm font-semibold text-foreground mt-0.5">Configuración SEO Global de la Landing</h3>
              <p className="text-xs text-muted-foreground">Configure los metatags que leerán los motores de búsqueda para indexar la landing page.</p>
            </div>
            <div className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Meta Title Principal</label>
                <Input value={brandingState.meta_title} onChange={(e) => handleBrandingChange("meta_title", e.target.value)} className="bg-background border-border text-xs text-foreground" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Meta Description</label>
                <Textarea rows={3} value={brandingState.meta_description} onChange={(e) => handleBrandingChange("meta_description", e.target.value)} className="bg-background border-border text-xs text-foreground" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Keywords (separadas por comas)</label>
                <Input value={brandingState.meta_keywords} onChange={(e) => handleBrandingChange("meta_keywords", e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
              </div>
              <div className="p-4 bg-muted/10 border border-border rounded-xl space-y-1">
                <span className="text-[10px] font-bold font-mono text-foreground uppercase flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> Conectado a generateMetadata</span>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Estos valores se publican junto con el Hero y son leídos directamente por los metadatos del servidor (title, description, keywords, Open Graph).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: FOOTER & CONTACTO ==================== */}
        {activeTab === "footer" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-[10px] font-mono text-primary uppercase font-bold">{"// Footer Columns"}</span>
              <h3 className="text-sm font-semibold text-foreground mt-0.5">Información de Contacto y Enlaces del Footer</h3>
              <p className="text-xs text-muted-foreground">Configure los links y textos informativos del pie de página público.</p>
            </div>
            <div className="space-y-4 max-w-xl">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Texto de Copyright (Pie de página)</label>
                <Input value={brandingState.copyright_footer || ''} onChange={(e) => handleBrandingChange("copyright_footer", e.target.value)} className="bg-background border-border text-xs text-foreground" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Versión del Sistema (Aparece en Footer)</label>
                <Input value={brandingState.version_sistema || ''} onChange={(e) => handleBrandingChange("version_sistema", e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Canal de LinkedIn Corporativo</label>
                <Input value={brandingState.red_linkedin || ''} onChange={(e) => handleBrandingChange("red_linkedin", e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Canal de YouTube Corporativo</label>
                <Input value={brandingState.red_youtube || ''} onChange={(e) => handleBrandingChange("red_youtube", e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Instagram Corporativo</label>
                <Input value={brandingState.red_instagram || ''} onChange={(e) => handleBrandingChange("red_instagram", e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">WhatsApp Principal (Prefijo de país sin espacios, ej: 573123456789)</label>
                <Input value={brandingState.whatsapp || ''} onChange={(e) => handleBrandingChange("whatsapp", e.target.value)} className="bg-background border-border text-xs text-foreground font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground font-medium">Certificaciones (badges mostrados en el Hero y en la barra superior)</label>
                <Textarea
                  rows={3}
                  value={brandingState.certificaciones.join("\n")}
                  onChange={(e) => handleBrandingChange("certificaciones", e.target.value.split("\n"))}
                  placeholder={"AMCA\nISO 1940 G2.5\nASHRAE 62.1"}
                  className="bg-background border-border text-xs text-foreground font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Una certificación por línea. Solo incluya normas que la empresa realmente cumpla y pueda sustentar.</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: CHATBOT B2B ==================== */}
        {activeTab === "chatbot" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-[10px] font-mono text-primary uppercase font-bold">{"// Chatbot Steps & Dialog Flow"}</span>
              <h3 className="text-sm font-semibold text-foreground mt-0.5">Gestión de Diálogos del Asistente Virtual</h3>
              <p className="text-xs text-muted-foreground">Configure las respuestas y opciones que ofrece el chatbot a los clientes.</p>
            </div>
            
            <div className="space-y-4 max-w-2xl">
              {brandingState.chatbot_steps && (brandingState.chatbot_steps as any[]).map((step: any, sIdx: number) => (
                <div key={step.id} className="p-4 rounded-xl border border-border bg-accent/15 space-y-3">
                  <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-1">
                    <span className="text-[10px] font-mono font-bold text-primary uppercase">Mensaje ID: {step.id}</span>
                    <Badge variant="outline" className="text-[8px] font-mono">{step.sender.toUpperCase()}</Badge>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground font-mono uppercase font-bold">Aparece automáticamente al abrir el chat en el paso del Wizard</label>
                    <select
                      value={step.forWizardStep ?? ""}
                      onChange={(e) => {
                        const newSteps = [...brandingState.chatbot_steps];
                        const value = e.target.value;
                        newSteps[sIdx].forWizardStep = value === "" ? undefined : Number(value);
                         
                        handleBrandingChange("chatbot_steps" as any, newSteps as any);
                      }}
                      className="w-full bg-background border border-border text-foreground text-xs rounded-lg p-2 focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="">Sin asignar (solo se llega navegando el menú)</option>
                      <option value="1">Paso 1 — Servicio</option>
                      <option value="2">Paso 2 — Análisis</option>
                      <option value="3">Paso 3 — Contacto</option>
                      <option value="4">Paso 4 — Cálculos</option>
                      <option value="5">Paso 5 — Resultado</option>
                    </select>
                    <p className="text-[9px] text-muted-foreground">Opcional. Deja "Sin asignar" si este mensaje es parte del menú general, no ayuda contextual de un paso.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground font-mono uppercase font-bold">Texto de Respuesta del Bot</label>
                    <Textarea 
                      value={step.text} 
                      onChange={(e) => {
                        const newSteps = [...brandingState.chatbot_steps];
                        newSteps[sIdx].text = e.target.value;
                         
                        handleBrandingChange("chatbot_steps" as any, newSteps as any);
                      }} 
                      className="bg-background border-border text-xs text-foreground font-sans leading-relaxed" 
                      rows={3}
                    />
                  </div>

                  {step.options && step.options.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[10px] text-muted-foreground font-mono uppercase font-bold block">// Opciones / Botones de Respuesta</label>
                      <div className="grid gap-2">
                        {step.options.map((opt: any, oIdx: number) => (
                          <div key={oIdx} className="grid grid-cols-2 gap-2 items-center">
                            <Input 
                              value={opt.label} 
                              onChange={(e) => {
                                const newSteps = [...brandingState.chatbot_steps];
                                if (newSteps[sIdx].options) {
                                  newSteps[sIdx].options![oIdx].label = e.target.value;
                                   
                        handleBrandingChange("chatbot_steps" as any, newSteps as any);
                                }
                              }}
                              placeholder="Texto del botón..."
                              className="bg-background border-border text-xs text-foreground"
                            />
                            <Input 
                              value={opt.action} 
                              onChange={(e) => {
                                const newSteps = [...brandingState.chatbot_steps];
                                if (newSteps[sIdx].options) {
                                  newSteps[sIdx].options![oIdx].action = e.target.value;
                                   
                        handleBrandingChange("chatbot_steps" as any, newSteps as any);
                                }
                              }}
                              placeholder="Acción (ID de destino)..."
                              className="bg-background border-border text-xs text-foreground font-mono"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              <div className="pt-2">
                <Button 
                  onClick={handleSaveBranding}
                  disabled={isBrandingSubmitting}
                  className="bg-primary hover:bg-primary/95 text-primary-foreground font-mono text-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isBrandingSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Publicar Flujo del Chatbot
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Right Live Preview pane (4 columns) */}
        <div className="lg:col-span-4 space-y-6 sticky top-24">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
            
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-primary uppercase font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Vista Previa de Landing
              </div>
              <span className="text-[8px] bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded font-mono font-bold">REAL-TIME</span>
            </div>

            {/* Dynamic Active Preview Panel */}
            <div ref={previewContainerRef} className="space-y-6 max-h-[580px] overflow-y-auto pr-2 scroll-smooth border border-border/40 rounded-xl p-2 bg-slate-900/5 dark:bg-slate-950/20">
              
              {/* Section: Hero */}
              <div 
                id="preview-hero" 
                className={`transition-all duration-305 ${
                  activeTab === "hero" 
                    ? "ring-2 ring-primary ring-offset-2 opacity-100 scale-[1.01]" 
                    : "opacity-40 hover:opacity-60 cursor-pointer"
                }`}
                onClick={() => setActiveTab("hero")}
              >
                <div className="p-4 rounded-xl border border-border bg-background/50 space-y-3">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase block font-semibold">// Sección Hero (Portada Comercial)</span>
                  
                  <div className="border border-border rounded-lg p-4 bg-[#FAF9F5] space-y-2 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.02] schematic-grid pointer-events-none" />
                    
                    <div className="relative z-10 space-y-2 text-left">
                      <span className="text-[7px] font-mono border border-slate-300 px-1.5 py-0.5 rounded uppercase text-slate-500 tracking-wider font-bold">
                        {`${(brandingState.nombre_comercial || "EMPRESA").split(" ")[0].toUpperCase()} TELEMETRÍA`}
                      </span>
                      <h4 
                        className="text-xs font-black uppercase text-slate-900 leading-tight truncate"
                        style={{ color: brandingState.color_primario, fontFamily: brandingState.tipografia_principal }}
                      >
                        {brandingState.hero_slides[0]?.titleMain || "ESPECIALISTAS"}
                      </h4>
                      <p className="text-[8px] text-slate-500 leading-relaxed line-clamp-3 font-sans">
                        {brandingState.hero_slides[0]?.desc || "Diseño, venta e instalación..."}
                      </p>

                      <div className="flex gap-1.5 pt-1.5">
                        <div 
                          className="px-2 py-1 text-[7px] font-mono font-bold text-white uppercase rounded-full"
                          style={{ backgroundColor: brandingState.color_primario }}
                        >
                          {brandingState.hero_cta_primario_label}
                        </div>
                        <div className="px-2 py-1 text-[7px] font-mono font-bold text-slate-700 bg-white border border-slate-300 rounded-full">
                          {brandingState.hero_cta_secundario_label}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Sectores */}
              <div 
                id="preview-sectores" 
                className={`transition-all duration-305 ${
                  activeTab === "sectores" 
                    ? "ring-2 ring-primary ring-offset-2 opacity-100 scale-[1.01]" 
                    : "opacity-40 hover:opacity-60 cursor-pointer"
                }`}
                onClick={() => setActiveTab("sectores")}
              >
                <div className="p-4 rounded-xl border border-border bg-background/50 space-y-3">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase block font-semibold">// Sectores Industriales Cubiertos</span>
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                    <div className="p-2 border border-border rounded-lg bg-card text-[9px] space-y-1">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>01 / MINERÍA Y CANTERAS</span>
                        <span className="text-primary font-mono" style={{ color: brandingState.color_primario }}>Cálculo OK</span>
                      </div>
                      <p className="text-muted-foreground text-[8px]">Solución de ventilación secundaria y captación de polvo en túneles.</p>
                    </div>
                    <div className="p-2 border border-border rounded-lg bg-card text-[9px] space-y-1">
                      <div className="flex justify-between font-bold text-foreground">
                        <span>02 / PLANTAS DE CEMENTO</span>
                        <span className="text-primary font-mono" style={{ color: brandingState.color_primario }}>SST Activo</span>
                      </div>
                      <p className="text-muted-foreground text-[8px]">Extractores centrífugos pesados para hornos a altas temperaturas.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Cases */}
              <div 
                id="preview-cases" 
                className={`transition-all duration-305 ${
                  activeTab === "cases" 
                    ? "ring-2 ring-primary ring-offset-2 opacity-100 scale-[1.01]" 
                    : "opacity-40 hover:opacity-60 cursor-pointer"
                }`}
                onClick={() => setActiveTab("cases")}
              >
                <div className="p-4 rounded-xl border border-border bg-background/50 space-y-3">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase block font-semibold">// Bitácora de Casos de Éxito</span>
                  <div className="p-3 border border-border rounded-lg bg-card text-[9px] space-y-2 border-l-4 border-l-primary" style={{ borderLeftColor: brandingState.color_primario }}>
                    <div className="font-bold text-foreground font-mono">// CASE_STUDY_01: CEMENTERA DEL CARIBE</div>
                    <p className="text-muted-foreground text-[8px] leading-relaxed">
                      Sustitución de álabes axiales de 120" en extractor hongo. Reducción de vibración en un 40% y aumento de eficiencia en CFM.
                    </p>
                    <div className="text-[7px] text-zinc-400 font-mono">Firmado por: Ing. Carlos Mendoza</div>
                  </div>
                </div>
              </div>

              {/* Section: Catalog */}
              <div 
                id="preview-catalog" 
                className={`transition-all duration-305 ${
                  activeTab === "catalog" 
                    ? "ring-2 ring-primary ring-offset-2 opacity-100 scale-[1.01]" 
                    : "opacity-40 hover:opacity-60 cursor-pointer"
                }`}
                onClick={() => setActiveTab("catalog")}
              >
                <div className="p-4 rounded-xl border border-border bg-background/50 space-y-3">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase block font-semibold">// Ficha Técnica de Producto</span>
                  
                  <div className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-xs">
                    <div className="h-20 bg-muted/20 border-b border-border flex items-center justify-center relative">
                      <div className="absolute inset-0 opacity-10 schematic-grid" />
                      {/* Simulated fan spinning dynamically */}
                      <Wind className="w-8 h-8 text-primary animate-spin-slow" style={{ color: brandingState.color_primario }} />
                    </div>
                    <div className="p-3 text-[10px] space-y-1">
                      <div className="text-[7px] font-mono text-muted-foreground">EQUIPO INDUSTRIAL</div>
                      <span className="font-bold text-foreground block">
                        {editingProduct ? editingProduct.name : "Extractor Tipo Hongo Inox"}
                      </span>
                      <p className="text-[8px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {editingProduct ? editingProduct.description : "Unidad fabricada en inoxidable 304..."}
                      </p>
                      <div className="border-t border-border/50 pt-2 flex justify-between text-[8px] font-mono">
                        <span>Caudal: <strong className="text-foreground">{editingProduct?.specifications?.Caudal || "5,000 CFM"}</strong></span>
                        <span className="text-primary font-bold" style={{ color: brandingState.color_primario }}>Ficha Técnica ➔</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Media */}
              <div 
                id="preview-media" 
                className={`transition-all duration-305 ${
                  activeTab === "media" 
                    ? "ring-2 ring-primary ring-offset-2 opacity-100 scale-[1.01]" 
                    : "opacity-40 hover:opacity-60 cursor-pointer"
                }`}
                onClick={() => setActiveTab("media")}
              >
                <div className="p-4 rounded-xl border border-border bg-background/50 space-y-3">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase block font-semibold">// Biblioteca de Medios en el Servidor</span>
                  <div className="grid grid-cols-3 gap-2">
                    {mediaList.slice(0, 3).map((item) => (
                      <div key={item.id} className="aspect-square border border-border rounded-lg bg-card/60 relative overflow-hidden flex flex-col items-center justify-center text-[7px] font-mono">
                        <ImageIcon className="w-4 h-4 text-muted-foreground/60 mb-1" />
                        <span className="truncate max-w-[45px] text-[6px] text-muted-foreground">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section: Blog */}
              <div 
                id="preview-blog" 
                className={`transition-all duration-305 ${
                  activeTab === "blog" 
                    ? "ring-2 ring-primary ring-offset-2 opacity-100 scale-[1.01]" 
                    : "opacity-40 hover:opacity-60 cursor-pointer"
                }`}
                onClick={() => setActiveTab("blog")}
              >
                <div className="p-4 rounded-xl border border-border bg-background/50 space-y-3">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase block font-semibold">// Portada de Blog Técnico</span>
                  <div className="p-3 border border-border rounded-lg bg-card text-[9px] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[7px] font-mono text-primary uppercase font-bold" style={{ color: brandingState.color_primario }}>
                        {editingArticle ? editingArticle.category : "Ingeniería"}
                      </span>
                      <span className="text-[7px] font-mono text-muted-foreground">Lectura: 5 min</span>
                    </div>
                    <h5 className="font-bold text-foreground truncate">{editingArticle ? editingArticle.title : "Ventilación Forzada en Minería de Carbón"}</h5>
                    <p className="text-muted-foreground text-[8px] line-clamp-2">
                      Análisis detallado sobre el cálculo del caudal efectivo y las pérdidas por fricción en ductos flexibles.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section: SEO */}
              <div 
                id="preview-seo" 
                className={`transition-all duration-305 ${
                  activeTab === "seo" 
                    ? "ring-2 ring-primary ring-offset-2 opacity-100 scale-[1.01]" 
                    : "opacity-40 hover:opacity-60 cursor-pointer"
                }`}
                onClick={() => setActiveTab("seo")}
              >
                <div className="p-4 rounded-xl border border-border bg-background/50 space-y-3">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase block font-semibold">// Mockup de Búsqueda Google (SEO)</span>
                  <div className="border border-border rounded-lg p-3 bg-white space-y-1 text-left">
                    <div className="text-[8px] text-[#202124] flex items-center gap-1">
                      <span>{brandingState.web || "https://mi-empresa.com"}</span> <span className="text-[6px] opacity-60">▼</span>
                    </div>
                    <div className="text-xs font-bold text-[#1a0dab] hover:underline cursor-pointer truncate leading-tight font-sans">
                      {brandingState.meta_title}
                    </div>
                    <p className="text-[9px] text-[#4d5156] leading-normal line-clamp-2 font-sans">
                      {brandingState.meta_description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section: Footer */}
              <div 
                id="preview-footer" 
                className={`transition-all duration-305 ${
                  activeTab === "footer" 
                    ? "ring-2 ring-primary ring-offset-2 opacity-100 scale-[1.01]" 
                    : "opacity-40 hover:opacity-60 cursor-pointer"
                }`}
                onClick={() => setActiveTab("footer")}
              >
                <div className="p-4 rounded-xl border border-border bg-background/50 space-y-3">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase block font-semibold">// Pie de Página Público</span>
                  <div className="border border-border rounded-lg p-3 bg-[#111] text-zinc-400 space-y-2 text-[8px] text-left">
                    <div className="grid grid-cols-2 gap-2 border-b border-zinc-800 pb-2">
                      <div>
                        <div className="font-bold text-white text-[9px] mb-1 font-sans">Contacto</div>
                        <div className="truncate">Email: {brandingState.email_corporativo || "contacto@mi-empresa.com"}</div>
                      </div>
                      <div>
                        <div className="font-bold text-white text-[9px] mb-1 font-sans">Redes</div>
                        <div className="truncate">LinkedIn: {brandingState.red_linkedin || "linkedin.com"}</div>
                      </div>
                    </div>
                    <div className="text-[7px] text-zinc-500 font-mono truncate">
                      {brandingState.copyright_footer || "© 2026 Empresa B2B. Todos los derechos reservados."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Chatbot */}
              <div 
                id="preview-chatbot" 
                className={`transition-all duration-305 ${
                  activeTab === "chatbot" 
                    ? "ring-2 ring-primary ring-offset-2 opacity-100 scale-[1.01]" 
                    : "opacity-40 hover:opacity-60 cursor-pointer"
                }`}
                onClick={() => setActiveTab("chatbot")}
              >
                <div className="p-4 rounded-xl border border-border bg-background/50 space-y-3">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase block font-semibold">// Asistente Chatbot B2B (Vista Previa)</span>
                  <div className="border border-border rounded-lg p-3 bg-zinc-950 text-left space-y-3">
                    <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[8px] font-mono text-zinc-400 uppercase font-bold">Chat de Soporte B2B</span>
                    </div>
                    {brandingState.chatbot_steps && brandingState.chatbot_steps.length > 0 && (
                      <div className="space-y-2 text-[9px]">
                        <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-zinc-200 font-sans whitespace-pre-wrap leading-normal">
                          {brandingState.chatbot_steps[0].text}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {brandingState.chatbot_steps[0].options?.map((opt: any, oIdx: number) => (
                            <span 
                              key={oIdx} 
                              className="px-2 py-0.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full border border-zinc-700 text-[7px] font-mono font-bold select-none cursor-default"
                            >
                              {opt.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

            <div className="text-[8px] text-muted-foreground leading-relaxed font-mono pt-2 border-t border-border">
              * Edite títulos del Hero, subtítulos, campos de SEO o agregue parámetros a productos para actualizar esta maqueta visual interactiva.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
