"use client";

import { useInstallPrompt } from "@/lib/useInstallPrompt";
import { Download, X } from "lucide-react";
import { useState } from "react";

export default function InstallPrompt() {
  const { isInstallable, promptInstall, isInstalled } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed || !isInstallable) {
    return null;
  }

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      console.log("User accepted the install prompt");
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-slate-800 text-white rounded-lg shadow-2xl p-4 z-50 animate-slide-up">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-slate-400 hover:text-white"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <div className="bg-emerald-500 rounded-lg p-2 shrink-0">
          <Download className="w-6 h-6" />
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-base mb-1">Install CourtBooker</h3>
          <p className="text-sm text-slate-300 mb-3">
            Get quick access from your home screen
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Install
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
