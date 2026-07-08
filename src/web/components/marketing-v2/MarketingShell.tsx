"use client";

import * as React from "react";
import type { CatalogCategory } from "@/web/actions/catalog";
import dynamic from "next/dynamic";
import { TopBar } from "./TopBar";
import { Hero } from "./Hero";
import { TrustMarquee } from "./TrustMarquee";
import type { CaseSlideContent } from "@/platform/branding/branding-defaults";

// Skeleton liviano para evitar layout shift mientras cargan las secciones
const SectionSkeleton = () => (
  <div className="w-full py-24 md:py-32 lg:py-40 bg-paper">
    <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14">
      <div className="h-6 w-32 bg-paper-warm mb-6 rounded-sm" />
      <div className="h-16 w-3/4 bg-paper-warm mb-8 rounded-sm" />
      <div className="h-4 w-2/3 bg-paper-warm mb-12 rounded-sm" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line">
        <div className="aspect-[4/3] bg-paper-warm" />
        <div className="aspect-[4/3] bg-paper-warm" />
        <div className="aspect-[4/3] bg-paper-warm" />
      </div>
    </div>
  </div>
);

// Carga diferida (lazy load) de todas las secciones debajo del fold
const ProblemSolving = dynamic(
  () => import("./ProblemSolving").then((mod) => mod.ProblemSolving),
  { ssr: true, loading: () => <SectionSkeleton /> }
);
const ProcessPipeline = dynamic(
  () => import("./ProcessPipeline").then((mod) => mod.ProcessPipeline),
  { ssr: true, loading: () => <SectionSkeleton /> }
);
const Disciplines = dynamic(
  () => import("./Disciplines").then((mod) => mod.Disciplines),
  { ssr: true, loading: () => <SectionSkeleton /> }
);
const Services = dynamic(
  () => import("./Services").then((mod) => mod.Services),
  { ssr: true, loading: () => <SectionSkeleton /> }
);
const EngineeringCapabilities = dynamic(
  () =>
    import("./EngineeringCapabilities").then(
      (mod) => mod.EngineeringCapabilities
    ),
  { ssr: true, loading: () => <SectionSkeleton /> }
);
const Sectors = dynamic(
  () => import("./Sectors").then((mod) => mod.Sectors),
  { ssr: true, loading: () => <SectionSkeleton /> }
);
const FeaturedCase = dynamic(
  () => import("./FeaturedCase").then((mod) => mod.FeaturedCase),
  { ssr: true, loading: () => <SectionSkeleton /> }
);
const CfmCalculator = dynamic(
  () => import("./CfmCalculator").then((mod) => mod.CfmCalculator),
  { ssr: false, loading: () => <SectionSkeleton /> }
);
const Footer = dynamic(
  () => import("./Footer").then((mod) => mod.Footer),
  { ssr: true, loading: () => <SectionSkeleton /> }
);
const FloatingCta = dynamic(
  () => import("./FloatingCta").then((mod) => mod.FloatingCta),
  { ssr: false, loading: () => null }
);

interface Props {
  catalog: CatalogCategory[];
  branding: Record<string, unknown>;
  tenantCode: string;
}

export function MarketingShell({ catalog, branding, tenantCode }: Props) {
  const siteName = branding.nombre_comercial as string;
  const logoUrl = (branding.logo_claro_url as string) || "";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <TopBar siteName={siteName} logoUrl={logoUrl} tenantCode={tenantCode} />
      <main>
        <Hero siteName={siteName} tenantCode={tenantCode} branding={branding} />
        <TrustMarquee content={branding.trust_marquee as { eyebrow: string; statLine: string; clients: { name: string; logoUrl?: string }[] } | undefined} />
        <ProblemSolving content={branding.problem_solving as { hook: string; story: string; statBefore: string; statAfter: string; statLabel: string }[] | undefined} />
        <ProcessPipeline content={branding.process_pipeline as { name: string; headline: string; description: string; duration: string; deliverables: string[] }[] | undefined} />
        <Disciplines tenantCode={tenantCode} content={branding.disciplines as { name: string; shortDescription: string; statValue: string; statLabel: string; deliverables: string[] }[] | undefined} />
        <Services tenantCode={tenantCode} content={branding.services as { name: string; shortDescription: string; longDescription: string; deliverable: string }[] | undefined} />
        <EngineeringCapabilities catalog={catalog} tenantCode={tenantCode} branding={branding} />
        <Sectors content={branding.sectores as { name: string; shortDescription: string }[] | undefined} />
        <FeaturedCase content={branding.casos as CaseSlideContent[] | undefined} />
        <CfmCalculator />
      </main>
      <Footer siteName={siteName} tenantCode={tenantCode} branding={branding} />
      <FloatingCta tenantCode={tenantCode} />
    </div>
  );
}
