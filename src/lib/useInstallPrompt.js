"use client";

import { useEffect, useState } from "react";

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    // Check if already installed on initial render
    if (typeof window !== "undefined") {
      return window.matchMedia("(display-mode: standalone)").matches;
    }
    return false;
  });

  useEffect(() => {
    // Early return if already installed
    if (isInstalled) return;

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setInstallPrompt(e);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) {
      return false;
    }

    // Show the install prompt
    installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    // Clear the saved prompt since it can't be used again
    setInstallPrompt(null);

    return outcome === "accepted";
  };

  return {
    installPrompt,
    promptInstall,
    isInstalled,
    isInstallable: !!installPrompt && !isInstalled,
  };
}
