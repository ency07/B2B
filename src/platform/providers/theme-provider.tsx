"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { usePathname } from "next/navigation";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  
  // Determinamos el storageKey basado en el contexto de la aplicación
  let storageKey = "web-theme"; // Por defecto para la web pública
  
  if (pathname?.startsWith("/dashboard")) {
    storageKey = "erp-theme-preference";
  } else if (pathname?.startsWith("/portal")) {
    storageKey = "portal-theme-preference";
  }

  // Prevenir hydration mismatch inicial, aunque next-themes maneja esto
  // con su script inyectado. Forzamos el key para que remonte si cambia el contexto.
  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <NextThemesProvider 
      {...props} 
      storageKey={storageKey}
      key={storageKey} // Forzar re-mount si cambiamos entre portal/erp
    >
      {children}
    </NextThemesProvider>
  );
}
