"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import ModernHomePage from "@/components/ModernHomePage";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if this is a PWA launch and if user has a preferred start page
    if (typeof window !== "undefined") {
      const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;

      if (isPWA) {
        const preferredStartPage = localStorage.getItem("pwaStartPage");

        // Only redirect if it's not the default homepage
        if (preferredStartPage && preferredStartPage !== "/") {
          router.replace(preferredStartPage);
        }
      }
    }
  }, [router]);

  return <ModernHomePage />;
}
