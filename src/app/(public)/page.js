"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ModernHomePage from "@/components/ModernHomePage";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
      // Only redirect if this is a fresh app launch (not client-side navigation)
      const navType =
        window.performance?.getEntriesByType?.("navigation")[0]?.type;
      if (isPWA && navType === "reload") {
        const preferredStartPage = localStorage.getItem("pwaStartPage");
        if (preferredStartPage && preferredStartPage !== "/") {
          router.replace(preferredStartPage);
        }
      }
    }
  }, [router]);

  return <ModernHomePage />;
}
