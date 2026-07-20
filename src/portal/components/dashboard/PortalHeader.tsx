"use client";

import { useRouter } from "next/navigation";
import { ShieldCheck, Building, User, LogOut, WifiOff } from "lucide-react";
import { TenantLogo } from "@/design-system/components/TenantLogo";
import type { PortalClientInfo } from "@/portal/components/dashboard/types";

interface PortalHeaderProps {
  isOffline: boolean;
  setIsOffline: (v: boolean) => void;
  setHasError: (v: boolean) => void;
  isPlatformAdmin: boolean;
  isClientContact: boolean;
  clientInfo: PortalClientInfo;
  clientName: string;
  brandName: string;
  logoUrl?: string;
  allClients: Array<{ id: string; legalName: string; tenantCode: string }>;
  onOpenProfile: () => void;
  onLogout: () => void;
}

export function PortalHeader({
  isOffline,
  setIsOffline,
  setHasError,
  isPlatformAdmin,
  isClientContact,
  clientInfo,
  clientName,
  brandName,
  logoUrl,
  allClients,
  onOpenProfile,
  onLogout,
}: PortalHeaderProps) {
  const router = useRouter();

  return (
    <>
      {/* Offline Status Warning Banner */}
      {isOffline && (
        <div className="bg-destructive/90 text-white text-xs font-mono py-2.5 px-4 text-center flex items-center justify-center gap-2 sticky top-0 z-layer-modal shadow-md backdrop-blur-md">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>⚠️ CONEXIÓN INTERRUMPIDA - Operando en modo local desconectado. Las transacciones se sincronizarán al volver.</span>
        </div>
      )}

      {/* Administrator Client Switcher Banner — solo visible para admins, nunca para clientes reales */}
      {isPlatformAdmin && !isClientContact && (
        <div className="bg-background text-foreground text-xs font-mono py-2 px-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-layer-modal border-b border-border shadow-md">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="font-bold tracking-wider text-emerald-400">MODO ADMINISTRADOR</span>
            <span className="text-muted-foreground">| Inspeccionando cliente: <strong className="text-foreground">{clientInfo.legalName}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-[10px]">Cambiar de Empresa:</span>
            <select
              value={allClients.find((c) => c.legalName === clientInfo.legalName)?.id || ""}
              onChange={(e) => {
                const selectedId = e.target.value;
                const clientObj = allClients.find((c) => c.id === selectedId);
                if (clientObj) {
                  router.push(`/portal?client_id=${clientObj.id}&tenant=${clientObj.tenantCode}`);
                  router.refresh();
                }
              }}
              className="bg-muted text-foreground border border-border rounded-md px-2 py-1 text-xs focus:ring-1 focus:ring-ring focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Seleccione una empresa...</option>
              {allClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.legalName} ({c.tenantCode.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Navigation Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-xl sticky top-0 z-layer-sticky">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand identity */}
          <div className="flex items-center gap-3 shrink-0">
            {logoUrl ? (
              <TenantLogo
                variant="claro"
                logoClaroUrl={logoUrl}
                companyName={brandName}
                width={32}
                height={32}
                className="w-8 h-8 rounded-lg object-contain shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-primary-foreground font-mono text-xs shadow-sm shrink-0">
                VT
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest leading-none">Portal de Clientes</p>
              <p className="text-sm font-semibold text-foreground tracking-tight leading-tight mt-0.5">{brandName}</p>
            </div>
            <div className="flex items-center gap-1.5 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 hidden lg:block">ACTIVO</span>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Client name chip */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-muted/40 text-xs shrink-0">
              <Building className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="font-semibold text-foreground truncate max-w-[180px]">{clientName}</span>
            </div>

            {/* Dev HUD (solo desarrollo) */}
            {process.env.NODE_ENV === "development" && (
              <div className="flex items-center border border-border/80 bg-background/50 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setIsOffline(!isOffline)}
                  className={`text-[9px] font-mono px-2 py-1 rounded cursor-pointer transition-all ${isOffline ? "bg-destructive text-white font-bold" : "text-muted-foreground hover:text-foreground"}`}
                  title="Simular pérdida de conexión de red"
                >
                  Simular Offline
                </button>
                <button
                  onClick={() => setHasError(true)}
                  className="text-[9px] font-mono px-2 py-1 rounded text-muted-foreground hover:text-destructive cursor-pointer transition-all"
                  title="Simular error crítico de base de datos"
                >
                  Simular Error
                </button>
              </div>
            )}

            {/* Perfil (solo clientes reales) */}
            {isClientContact && (
              <button
                type="button"
                onClick={onOpenProfile}
                aria-label="Mi perfil"
                title="Mi perfil"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/80 bg-background hover:bg-muted/50 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all"
              >
                <User className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Perfil</span>
              </button>
            )}

            {/* Cerrar sesión */}
            <button
              type="button"
              onClick={onLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border/80 bg-background hover:bg-muted/50 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
