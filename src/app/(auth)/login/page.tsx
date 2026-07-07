"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { ErpLoginFeature } from "@/erp/features/auth/ErpLoginFeature";
import { PortalLoginFeature } from "@/portal/features/auth/PortalLoginFeature";

/**
 * Detecta si el login es para el ERP o para el Portal Cliente.
 * Se basa en el parametro `redirect`: si empieza con /portal, es portal;
 * cualquier otro caso (incluido /dashboard, /admin, /internal), es ERP.
 */
function detectLoginContext(redirectTo: string): "portal" | "erp" {
  return redirectTo.startsWith("/portal") ? "portal" : "erp";
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/dashboard";
  const loginContext = detectLoginContext(rawRedirect);

  if (loginContext === "portal") {
    return <PortalLoginFeature />;
  }

  return <ErpLoginFeature />;
}
