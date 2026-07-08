"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function SessionVersionListener() {
  const router = useRouter();

  useEffect(() => {
    let currentVersion = document.cookie
      .split("; ")
      .find((row) => row.startsWith("sb-session-version="))
      ?.split("=")[1];

    const clearLocalStorage = () => {
      // Clear all tenant-related localStorage
      Object.keys(localStorage).forEach((key) => {
        if (
          key.startsWith("tenant_config_") ||
          key.startsWith("erp_") ||
          key.startsWith("portal_") ||
          key.startsWith("sb-erp-") ||
          key.startsWith("sb-portal-") ||
          key === "erp_color_preference" ||
          key === "sb-erp-local" ||
          key === "sb-portal-local"
        ) {
          localStorage.removeItem(key);
        }
      });
    };

    const handleStorageChange = () => {
      const newVersion = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sb-session-version="))
        ?.split("=")[1];

      if (currentVersion && newVersion !== currentVersion) {
        clearLocalStorage();
        window.location.href = "/login";
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [router]);

  return null;
}