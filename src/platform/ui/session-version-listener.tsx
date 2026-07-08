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

    const handleStorageChange = () => {
      const newVersion = document.cookie
        .split("; ")
        .find((row) => row.startsWith("sb-session-version="))
        ?.split("=")[1];

      if (currentVersion && newVersion !== currentVersion) {
        // Session changed in another tab — force full page reload
        window.location.href = "/login";
      }
    };

    // Listen for cookie changes via storage event (cross-tab)
    window.addEventListener("storage", handleStorageChange);

    // Also poll for same-tab cookie changes (when signout happens in same tab)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [router]);

  return null;
}